import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI, Type } from "@google/genai";
import { buildRecipeContext, normalizeRecipeSummaries } from "./promptSafety";
import { validateMealPlanReferences } from "./mealPlanContract";
import { aiUnavailableReason, isAiEnabled } from "./aiAvailability";
import * as logger from "firebase-functions/logger";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { estimateTextTokens } from "./aiSpendPricing";
import type { AiSpendUsageMetadata } from "./aiSpendPricing";
import {
    getAiSpendFeaturePolicy,
    assertAiSpendConfiguredModels,
    isAiSpendCircuitBreakerEnabled,
} from "./aiSpendPolicy";
import {
    claimAiSpendProviderStart,
    closeAiSpendReservationWithoutCharge,
    getAiSpendStatusForOwner,
    manuallyPauseAiSpendForOwner,
    reconcileAiSpendReservation,
    reserveAiSpend,
    resumeAiSpendForOwner,
    stableIdempotencyKey,
} from "./aiSpendReservations";
import type { AiSpendReservation } from "./aiSpendReservations";

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true }); // Good practice for AI data

// Define the secret to access the API key securely
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const enforceAppCheck = process.env.FUNCTIONS_EMULATOR !== "true";
const MAX_MEAL_PLAN_PAYLOAD_CHARS = 120000;
const MAX_RECIPE_ASSET_BYTES = 10 * 1024 * 1024;
const MAX_INLINE_IMAGE_BASE64_CHARS = Math.ceil(MAX_RECIPE_ASSET_BYTES * 4 / 3) + 1024;
const MAX_SEARCH_QUERY_CHARS = 500;
const MAX_SEARCH_LIMIT = 25;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash";
const GEMINI_MULTIMODAL_MODEL = process.env.GEMINI_MULTIMODAL_MODEL || GEMINI_TEXT_MODEL;
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
const FIRESTORE_MAX_VECTOR_DIMENSIONS = 2048;
const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
const GEMINI_EMBEDDING_DIMENSIONS = readEmbeddingDimensions();
const BILLING_BUDGET_TOPIC = "viomacro-budget-alerts";
const AI_CALLABLE_RUNTIME_OPTIONS = {
    secrets: [geminiApiKey],
    enforceAppCheck,
    cors: true,
    maxInstances: 1,
    concurrency: 5,
};

const AI_USAGE_LIMITS: Record<string, { daily: number; perMinute: number }> = {
    generateMealPlan: { daily: 10, perMinute: 2 },
    parseRecipeFromImage: { daily: 20, perMinute: 3 },
    generateRecipeEmbedding: { daily: 100, perMinute: 20 },
    semanticSearchRecipes: { daily: 100, perMinute: 20 },
};
const OWNER_AI_USAGE_LIMITS: Record<string, { daily: number; perMinute: number }> = {
    generateMealPlan: { daily: 50, perMinute: 6 },
    parseRecipeFromImage: { daily: 75, perMinute: 8 },
    generateRecipeEmbedding: { daily: 500, perMinute: 60 },
    semanticSearchRecipes: { daily: 500, perMinute: 60 },
};

type BudgetNotificationAttributes = {
    billingAccountId?: string;
    budgetId?: string;
    schemaVersion?: string;
};

type BudgetNotificationData = {
    budgetDisplayName?: unknown;
    costAmount?: unknown;
    costIntervalStart?: unknown;
    budgetAmount?: unknown;
    budgetAmountType?: unknown;
    alertThresholdExceeded?: unknown;
    forecastThresholdExceeded?: unknown;
    currencyCode?: unknown;
};

export type ParsedBudgetNotification = {
    billingAccountId: string | null;
    budgetId: string | null;
    schemaVersion: string | null;
    budgetDisplayName: string;
    costAmount: number;
    costIntervalStart: string | null;
    budgetAmount: number;
    budgetAmountType: string | null;
    alertThresholdExceeded: number | null;
    forecastThresholdExceeded: number | null;
    currencyCode: string;
    percentUsed: number | null;
};

function parseOptionalString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseRequiredString(
    value: unknown,
    fieldName: string
): string {
    const parsed = parseOptionalString(value);
    if (!parsed) {
        throw new Error(`Missing required budget field: ${fieldName}`);
    }
    return parsed;
}

function parseRequiredNumber(
    value: unknown,
    fieldName: string
): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid required budget field: ${fieldName}`);
    }
    return parsed;
}

function parseOptionalNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseBillingBudgetNotification(
    data: BudgetNotificationData,
    attributes: BudgetNotificationAttributes = {}
): ParsedBudgetNotification {
    const budgetAmount = parseRequiredNumber(data.budgetAmount, "budgetAmount");
    const costAmount = parseRequiredNumber(data.costAmount, "costAmount");
    const percentUsed = budgetAmount > 0 ? costAmount / budgetAmount : null;

    return {
        billingAccountId: parseOptionalString(attributes.billingAccountId),
        budgetId: parseOptionalString(attributes.budgetId),
        schemaVersion: parseOptionalString(attributes.schemaVersion),
        budgetDisplayName: parseRequiredString(
            data.budgetDisplayName,
            "budgetDisplayName"
        ),
        costAmount,
        costIntervalStart: parseOptionalString(data.costIntervalStart),
        budgetAmount,
        budgetAmountType: parseOptionalString(data.budgetAmountType),
        alertThresholdExceeded: parseOptionalNumber(data.alertThresholdExceeded),
        forecastThresholdExceeded: parseOptionalNumber(data.forecastThresholdExceeded),
        currencyCode: parseRequiredString(data.currencyCode, "currencyCode"),
        percentUsed,
    };
}

export const billingBudgetMonitor = onMessagePublished(
    BILLING_BUDGET_TOPIC,
    async (event) => {
        try {
            const notification = parseBillingBudgetNotification(
                event.data.message.json as BudgetNotificationData,
                event.data.message.attributes as BudgetNotificationAttributes
            );

            logger.warn("Billing budget notification received.", {
                mode: "alert-only",
                destructiveAction: false,
                billingAccountId: notification.billingAccountId,
                budgetId: notification.budgetId,
                schemaVersion: notification.schemaVersion,
                budgetDisplayName: notification.budgetDisplayName,
                costAmount: notification.costAmount,
                budgetAmount: notification.budgetAmount,
                percentUsed: notification.percentUsed,
                alertThresholdExceeded: notification.alertThresholdExceeded,
                forecastThresholdExceeded: notification.forecastThresholdExceeded,
                currencyCode: notification.currencyCode,
                costIntervalStart: notification.costIntervalStart,
            });
        } catch (error) {
            logger.error("Invalid billing budget notification received.", {
                mode: "alert-only",
                destructiveAction: false,
                error,
                attributes: event.data.message.attributes,
            });
        }
    }
);

function requireAppCheck(request: any): void {
    if (enforceAppCheck && !request.app) {
        throw new HttpsError(
            "failed-precondition",
            "The function must be called from an App Check verified app."
        );
    }
}

function requireAuth(request: any): string {
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }
    return request.auth.uid;
}

function requireOwner(uid: string): void {
    const ownerUids = new Set(
        (process.env.OWNER_UIDS || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
    );
    if (!ownerUids.has(uid)) {
        throw new HttpsError(
            "permission-denied",
            "Only the configured owner can manage AI spend controls."
        );
    }
}

/**
 * The production off-switch. Checked before ANY spend path -- before the usage
 * counter, before the spend reservation, and long before a provider client is
 * created. Default is off; see aiAvailability.ts.
 */
function assertAiEnabled(feature: string): void {
    const reason = aiUnavailableReason();
    if (reason) {
        throw new HttpsError("failed-precondition", `${feature}: ${reason}`);
    }
}

function assertLiveAiAllowed(feature: string): void {
    if (process.env.FUNCTIONS_EMULATOR === "true" &&
        process.env.ALLOW_EMULATOR_AI_CALLS !== "true") {
        throw new HttpsError(
            "failed-precondition",
            `${feature} is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.`
        );
    }
}

function isLiveAiDisabledInEmulator(): boolean {
    return process.env.FUNCTIONS_EMULATOR === "true" &&
        process.env.ALLOW_EMULATOR_AI_CALLS !== "true";
}

function readEmbeddingDimensions(): number {
    const configured = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || DEFAULT_EMBEDDING_DIMENSIONS);
    if (!Number.isInteger(configured) ||
        configured < 1 ||
        configured > FIRESTORE_MAX_VECTOR_DIMENSIONS) {
        logger.warn("Invalid GEMINI_EMBEDDING_DIMENSIONS; using safe default.", {
            configured: process.env.GEMINI_EMBEDDING_DIMENSIONS,
            defaultDimensions: DEFAULT_EMBEDDING_DIMENSIONS,
        });
        return DEFAULT_EMBEDDING_DIMENSIONS;
    }
    return configured;
}

function getGeminiApiKey(): string {
    const apiKey = geminiApiKey.value();
    if (!apiKey || apiKey === "PASTE_YOUR_API_KEY_HERE") {
        logger.error("Missing valid Gemini API Key.");
        throw new HttpsError(
            "failed-precondition",
            "Gemini API Key is not configured. Please check your functions/.secret.local file."
        );
    }
    return apiKey;
}

function createGeminiClient(): GoogleGenAI {
    return new GoogleGenAI({apiKey: getGeminiApiKey()});
}

function assertPayloadSize(data: any, maxChars: number, label: string): void {
    const payloadSize = JSON.stringify(data ?? {}).length;
    if (payloadSize > maxChars) {
        throw new HttpsError(
            "invalid-argument",
            `${label} is too large. Please reduce the request size.`
        );
    }
}

function toFirestoreEmbeddingVector(values: unknown): number[] {
    if (!Array.isArray(values)) {
        throw new HttpsError("internal", "Embedding provider returned an invalid vector.");
    }
    if (values.length !== GEMINI_EMBEDDING_DIMENSIONS) {
        throw new HttpsError(
            "internal",
            "Embedding provider returned a vector that does not match the configured Firestore index dimension."
        );
    }

    const vector = values
        .map((value) => Number(value));

    if (vector.some((value) => !Number.isFinite(value))) {
        throw new HttpsError("internal", "Embedding provider returned a non-numeric vector.");
    }

    return vector;
}

function formatRecipeEmbeddingInput(data: any): string {
    const title = data.title || "Untitled recipe";
    const description = data.description || "";
    const ingredients = data.ingredients?.map((i: any) => i.item).filter(Boolean).join(", ") || "";
    const tags = data.tags?.filter(Boolean).join(", ") || "";

    return `title: ${title} | text: ${description} Ingredients: ${ingredients}. Tags: ${tags}.`;
}

function formatSearchEmbeddingInput(query: string): string {
    return `task: search result | query: ${query}`;
}

function readRequestIdempotencyKey(
    request: any,
    feature: string,
    uid: string
): string {
    if (!isAiSpendCircuitBreakerEnabled()) {
        return stableIdempotencyKey(["disabled", feature, uid]);
    }
    const provided = request.data?.requestId;
    return stableIdempotencyKey([
        feature,
        uid,
        validateClientRequestId(provided, "AI request ID"),
    ]);
}

function validateClientRequestId(value: unknown, label: string): string {
    if (typeof value !== "string" ||
        !/^[A-Za-z0-9._:-]{8,120}$/.test(value)) {
        throw new HttpsError(
            "invalid-argument",
            `${label} is required when AI spend controls are enabled.`
        );
    }
    return value;
}

function readOwnerMutationIdempotencyKey(
    request: any,
    action: string,
    uid: string
): string {
    const rawKey = validateClientRequestId(
        request.data?.idempotencyKey,
        `${action} idempotency key`
    );
    return stableIdempotencyKey([action, uid, rawKey]);
}

function getUsageMetadata(response: unknown): AiSpendUsageMetadata | null {
    if (!response || typeof response !== "object") {
        return null;
    }
    const maybeResponse = response as { usageMetadata?: AiSpendUsageMetadata };
    return maybeResponse.usageMetadata || null;
}

function assertSpendReservationAllowsProvider(
    reservation: AiSpendReservation
): void {
    if (reservation.shouldCallProvider) {
        return;
    }
    if (reservation.blockedReason === "paused") {
        throw new HttpsError(
            "resource-exhausted",
            "AI spend allowance is exhausted. AI has been paused before provider execution."
        );
    }
    throw new HttpsError(
        "aborted",
        "Duplicate AI request was already reconciled."
    );
}

function assertAiSpendPricingSafeWhenEnabled(): void {
    if (!isAiSpendCircuitBreakerEnabled()) {
        return;
    }
    try {
        assertAiSpendConfiguredModels(
            GEMINI_TEXT_MODEL,
            GEMINI_MULTIMODAL_MODEL,
            GEMINI_EMBEDDING_MODEL
        );
    } catch (error: any) {
        throw new HttpsError(
            "failed-precondition",
            error.message || "AI spend pricing configuration is invalid."
        );
    }
}

function readProviderTotalTokens(value: unknown): number | null {
    return typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 0 ?
        value :
        null;
}

async function enforceAiUsageLimit(uid: string, feature: string): Promise<void> {
    if (process.env.FUNCTIONS_EMULATOR === "true") return;

    const ownerUids = new Set(
        (process.env.OWNER_UIDS || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
    );
    const limit = ownerUids.has(uid)
        ? OWNER_AI_USAGE_LIMITS[feature]
        : AI_USAGE_LIMITS[feature];
    if (!limit) {
        throw new HttpsError("internal", `Missing usage limit for ${feature}.`);
    }

    const dateKey = new Date().toISOString().slice(0, 10);
    const minuteBucket = Math.floor(Date.now() / 60000);
    const usageRef = db.doc(`users/${uid}/usage/ai-${dateKey}`);

    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(usageRef);
        const usage = snapshot.exists ? snapshot.data() || {} : {};
        const featureUsage = usage[feature] || {};
        const dailyCount = Number(featureUsage.dailyCount || 0);
        const minuteCount = featureUsage.minuteBucket === minuteBucket
            ? Number(featureUsage.minuteCount || 0)
            : 0;

        if (dailyCount >= limit.daily) {
            throw new HttpsError(
                "resource-exhausted",
                `Daily ${feature} limit reached. Please try again tomorrow.`
            );
        }

        if (minuteCount >= limit.perMinute) {
            throw new HttpsError(
                "resource-exhausted",
                "Too many AI requests at once. Please wait a minute and try again."
            );
        }

        transaction.set(usageRef, {
            dateKey,
            [feature]: {
                dailyCount: dailyCount + 1,
                minuteBucket,
                minuteCount: minuteCount + 1,
                updatedAt: FieldValue.serverTimestamp(),
            },
        }, { merge: true });
    });
}

/**
 * AUD-115: this used to be a three-stage salvage attempt -- parse, then strip
 * ```json fences and re-parse, then take the substring between the first "{"
 * and the last "}" and parse that.
 *
 * Those stages existed because the prompt only *asked in English* for JSON.
 * Each one is a place where a slightly-wrong response is quietly reshaped into
 * something that parses, rather than failing. The brace-substring stage is the
 * worst: it will happily lift a JSON-looking fragment out of prose the model was
 * talked into writing.
 *
 * Both callables now pass responseMimeType and a responseSchema, so the provider
 * itself constrains the shape. Nothing needs salvaging, and a response that does
 * not parse is a genuine fault worth surfacing.
 */
function parseModelJson(text: string): any {
    try {
        return JSON.parse(text);
    } catch {
        throw new Error("Could not extract valid JSON from response.");
    }
}

const MACRO_FIELDS = {
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
} as const;

/** Shape generateMealPlan must return. Enforced by the provider, not by the prompt. */
const MEAL_PLAN_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        goal: { type: Type.STRING },
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dayName: { type: Type.STRING },
                    meals: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: {
                                    type: Type.STRING,
                                    enum: ["breakfast", "lunch", "dinner", "snack", "smoothie", "tea"],
                                },
                                name: { type: Type.STRING },
                                recipeId: { type: Type.STRING, nullable: true },
                                ...MACRO_FIELDS,
                            },
                            required: ["type", "name", "recipeId", "calories", "protein", "carbs", "fat"],
                        },
                    },
                },
                required: ["dayName", "meals"],
            },
        },
    },
    required: ["goal", "days"],
} as const;

/** Shape parseRecipeFromImage must return. */
const RECIPE_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        mealType: {
            type: Type.STRING,
            enum: ["breakfast", "lunch", "dinner", "snack", "smoothie"],
        },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        ...MACRO_FIELDS,
        ingredients: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                },
                required: ["item", "qty", "unit"],
            },
        },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["title", "mealType", "calories", "protein", "carbs", "fat", "ingredients", "instructions"],
} as const;

export const generateMealPlan = onCall(
    AI_CALLABLE_RUNTIME_OPTIONS,
    async (request) => {
        try {
            requireAppCheck(request);
            const uid = requireAuth(request);
            assertAiEnabled("generateMealPlan");
            assertPayloadSize(request.data, MAX_MEAL_PLAN_PAYLOAD_CHARS, "Meal plan request");

            const { userSettings, userRecipes, preferences } = request.data;

            // 2. Data Validation
            if (!userSettings) {
                throw new HttpsError("invalid-argument", "Missing user settings.");
            }
            await enforceAiUsageLimit(uid, "generateMealPlan");
            assertLiveAiAllowed("generateMealPlan");
            assertAiSpendPricingSafeWhenEnabled();

            // AUD-113: recipe titles are untrusted -- they can be proposed by an
            // image or PDF the user did not write, via parseRecipeFromImage.
            // buildRecipeContext strips, caps and fences them, and tells the
            // model they are data. (This also removes the only `any` in the
            // source tree, which lived on the old inline map.)
            const recipeSummaries = normalizeRecipeSummaries(userRecipes);
            const recipeContext = buildRecipeContext(recipeSummaries);
            const includeSnacks = preferences?.includeSnacks !== false;
            const batchMealType = preferences?.batchMealType || (preferences?.batchLunch ? "lunch" : null);

            const prompt = `
        You are an expert nutritionist and meal planner.
        Generate a 7-day meal plan (Monday to Sunday) for a user with these goals:
        - Calories: ${userSettings.calories}
        - Protein: ${userSettings.protein}g
        - Carbs: ${userSettings.carbs}g
        - Fat: ${userSettings.fat}g
        
        Preferences:
        ${batchMealType && (includeSnacks || batchMealType !== "snack") ? `- Suggest batch cooking for ${batchMealType} (reuse same meal Mon-Wed, then Thu-Sun).` : ""}
        ${preferences?.includeSmoothie ? "- Include a dedicated 'smoothie' meal slot every day." : ""}
        ${preferences?.includeTea ? "- Include a dedicated 'tea' slot every day." : ""}
        ${includeSnacks ? "- Snacks may be included to meet the goals." : "- Do not include any snack meal slots (includeSnacks=false)."}
        
        ${recipeContext}

        Every meal must include recipeId. For a library dish use its exact
        supplied recipeId; never invent an ID or infer one from a dish name.
        Generic meals remain allowed: use recipeId: null for those meals.

        The response shape is enforced by a schema on the request, so this is
        a guide to the CONTENT, not a plea about formatting:
        {
          "goal": "string (brief summary)",
          "days": [
            {
              "dayName": "Monday",
              "meals": [
                { "type": "breakfast", "name": "string", "recipeId": null, "calories": number, "protein": number, "carbs": number, "fat": number },
                { "type": "lunch", "name": "string", "recipeId": null, "calories": number, "protein": number, "carbs": number, "fat": number },
                { "type": "dinner", "name": "string", "recipeId": null, "calories": number, "protein": number, "carbs": number, "fat": number }
              ]
            }
          ]
        }
      `;
            const policy = getAiSpendFeaturePolicy("generateMealPlan");
            const reservation = await reserveAiSpend({
                db,
                uid,
                feature: "generateMealPlan",
                idempotencyKey: readRequestIdempotencyKey(
                    request,
                    "generateMealPlan",
                    uid
                ),
                estimatedInputTokens: estimateTextTokens(prompt),
            });
            assertSpendReservationAllowsProvider(reservation);

            let providerReservation: AiSpendReservation | null = null;
            try {
                const ai = createGeminiClient();
                providerReservation = await claimAiSpendProviderStart(
                    db,
                    reservation
                );

                // 5. Call Gemini
                const response = await ai.models.generateContent({
                    model: GEMINI_TEXT_MODEL,
                    contents: prompt,
                    config: {
                        maxOutputTokens: policy.maxOutputTokens,
                        // AUD-115: the shape is enforced by the provider, so it
                        // holds even if the prompt is talked into something else.
                        responseMimeType: "application/json",
                        responseSchema: MEAL_PLAN_RESPONSE_SCHEMA,
                    },
                });
                const text = response.text;
                if (!text) {
                    throw new Error("Provider returned an empty meal plan response.");
                }

                // 6. Parse. Schema-enforced, so no salvage step.
                const plan = parseModelJson(text);
                validateMealPlanReferences(plan, new Set(recipeSummaries.map(recipe => recipe.id)), includeSnacks);
                await reconcileAiSpendReservation(
                    db,
                    providerReservation,
                    getUsageMetadata(response),
                    "success"
                );

                return plan;

            } catch (error: any) {
                if (!providerReservation && error instanceof HttpsError) {
                    throw error;
                }
                if (providerReservation) {
                    await reconcileAiSpendReservation(
                        db,
                        providerReservation,
                        null,
                        "provider_error"
                    );
                }
                logger.error("Gemini Error:", error);
                throw new HttpsError("internal", "Failed to generate plan.", error.message);
            }
        } catch (error: any) {
            if (error instanceof HttpsError) {
                throw error;
            }
            console.error("FATAL ERROR in generateMealPlan:", error);
            console.error("Stack Trace:", error.stack);
            throw new HttpsError("internal", `Generation Failed: ${error.message}`, error);
        }
    }
);

export const parseRecipeFromImage = onCall(
    AI_CALLABLE_RUNTIME_OPTIONS,
    async (request) => {
        try {
            requireAppCheck(request);
            const uid = requireAuth(request);
            assertAiEnabled("parseRecipeFromImage");

            const { imageBase64, storagePath, mimeType = "image/jpeg" } = request.data;
            if (typeof mimeType !== "string" ||
                (!mimeType.startsWith("image/") && mimeType !== "application/pdf")) {
                throw new HttpsError("invalid-argument", "Unsupported recipe asset type.");
            }

            let visualData = imageBase64;

            // If storagePath is provided, download from Storage (bypass sizing limits)
            if (storagePath) {
                if (typeof storagePath !== "string" ||
                    !storagePath.startsWith(`users/${uid}/recipes/`) ||
                    storagePath.includes("..")) {
                    throw new HttpsError("permission-denied", "Invalid recipe asset path.");
                }
                try {
                    const bucket = getStorage().bucket();
                    const file = bucket.file(storagePath);
                    const [metadata] = await file.getMetadata();
                    const sizeBytes = Number(metadata.size || 0);
                    if (sizeBytes > MAX_RECIPE_ASSET_BYTES) {
                        throw new HttpsError(
                            "invalid-argument",
                            "Recipe asset is too large. Please upload a file under 10 MB."
                        );
                    }
                    const [buffer] = await file.download();
                    visualData = buffer.toString('base64');
                } catch (err) {
                    if (err instanceof HttpsError) {
                        throw err;
                    }
                    logger.error("Failed to download from Storage:", err);
                    throw new HttpsError("internal", "Failed to access uploaded file.");
                }
            }

            if (!visualData) {
                throw new HttpsError("invalid-argument", "Missing visual data.");
            }
            if (typeof visualData !== "string" ||
                visualData.length > MAX_INLINE_IMAGE_BASE64_CHARS) {
                throw new HttpsError(
                    "invalid-argument",
                    "Recipe asset is too large. Please upload a file under 10 MB."
                );
            }
            await enforceAiUsageLimit(uid, "parseRecipeFromImage");
            assertLiveAiAllowed("parseRecipeFromImage");
            assertAiSpendPricingSafeWhenEnabled();

            const policy = getAiSpendFeaturePolicy("parseRecipeFromImage");
            const prompt = `
                You are a master nutritionist and high-performance chef. 
                Analyze this recipe (provided as an image or PDF). Extract the data into the following structured JSON format.
                
                CRITICAL INSTRUCTIONS:
                1. Meticulously extract all ingredients.
                2. For "qty", use ONLY numbers. If "1/2", convert to 0.5.
                3. For "unit", use strictly one of: "Cup", "Tbsp", "Tsp", "Oz", "Lb", "g", "ml", "Large", "Medium", "Small", "Can", "Slice", "Stick", "Pinch". If "to taste", use "to taste" as unit and 0 as qty.
                4. For "item", include the name ONLY. Do not include the weight/volume here.
                5. Example: "1 Cup Rice" -> {"item": "Rice", "qty": 1, "unit": "Cup"}
                
                Expected JSON Format:
                {
                  "title": "String",
                  "description": "String (brief, appetizing summary)",
                  "mealType": "String (One of: 'breakfast', 'lunch', 'dinner', 'snack', 'smoothie')",
                  "tags": ["String"],
                  "calories": Number,
                  "protein": Number,
                  "carbs": Number,
                  "fat": Number,
                  "ingredients": [
                    { "item": "String (Name)", "qty": Number, "unit": "String" }
                  ],
                  "instructions": ["String (Step 1)", "String (Step 2)"]
                }
                
                The response shape is enforced by a schema on the request. Fill it
                accurately; formatting is not your concern.
            `;
            const reservation = await reserveAiSpend({
                db,
                uid,
                feature: "parseRecipeFromImage",
                idempotencyKey: readRequestIdempotencyKey(
                    request,
                    "parseRecipeFromImage",
                    uid
                ),
                estimatedInputTokens: estimateTextTokens(prompt),
            });
            assertSpendReservationAllowsProvider(reservation);

            let providerReservation: AiSpendReservation | null = null;
            try {
                const ai = createGeminiClient();

                const visualPart = {
                    inlineData: {
                        data: visualData,
                        mimeType: mimeType
                    }
                };
                const contents = [prompt, visualPart];

                if (reservation.enabled) {
                    try {
                        const tokenCount = await ai.models.countTokens({
                            model: GEMINI_MULTIMODAL_MODEL,
                            contents,
                        });
                        const totalTokens = readProviderTotalTokens(
                            (tokenCount as any).totalTokens
                        );
                        if (totalTokens === null ||
                            totalTokens === 0 ||
                            totalTokens > policy.maxInputTokens) {
                            await closeAiSpendReservationWithoutCharge(
                                db,
                                reservation,
                                "provider_count_tokens_invalid_or_over_limit"
                            );
                            throw new HttpsError(
                                "invalid-argument",
                                "Recipe asset exceeds the AI spend token limit."
                            );
                        }
                    } catch (error: any) {
                        if (error instanceof HttpsError) {
                            throw error;
                        }
                        await closeAiSpendReservationWithoutCharge(
                            db,
                            reservation,
                            "provider_count_tokens_failed"
                        );
                        throw new HttpsError(
                            "failed-precondition",
                            "Could not verify recipe token count before generation."
                        );
                    }
                }

                providerReservation = await claimAiSpendProviderStart(
                    db,
                    reservation
                );
                const response = await ai.models.generateContent({
                    model: GEMINI_MULTIMODAL_MODEL,
                    contents,
                    config: {
                        maxOutputTokens: policy.maxOutputTokens,
                        // AUD-115: see MEAL_PLAN_RESPONSE_SCHEMA. This one matters
                        // more -- the input is a file the user did not author.
                        responseMimeType: "application/json",
                        responseSchema: RECIPE_RESPONSE_SCHEMA,
                    },
                });
                const text = response.text;
                if (!text) {
                    throw new Error("Provider returned an empty recipe parse response.");
                }

                // Schema-enforced, so no salvage step.
                const recipeData = parseModelJson(text);
                await reconcileAiSpendReservation(
                    db,
                    providerReservation,
                    getUsageMetadata(response),
                    "success"
                );

                return recipeData;

            } catch (error: any) {
                if (providerReservation) {
                    await reconcileAiSpendReservation(
                        db,
                        providerReservation,
                        null,
                        "provider_error"
                    );
                }
                if (error instanceof HttpsError) {
                    throw error;
                }
                logger.error("Vision Parse Error:", error);
                throw new HttpsError("internal", "Failed to parse recipe from image.", error.message);
            }
        } catch (error: any) {
            if (error instanceof HttpsError) {
                throw error;
            }
            console.error("FATAL ERROR in parseRecipeFromImage:", error);
            console.error("Stack Trace:", error.stack);
            throw new HttpsError("internal", `Vision Parse Failed: ${error.message}`, error);
        }
    }
);

export const generateRecipeEmbedding = onDocumentWritten(
    {
        document: "users/{userId}/recipes/{recipeId}",
        secrets: [geminiApiKey],
        maxInstances: 1,
        concurrency: 1,
    },
    async (event) => {
        const data = event.data?.after.data();
        const previousData = event.data?.before.data();

        if (!data) return null; // Deleted

        // Only regenerate if relevant fields changed
        const relevantChanged = !previousData ||
            data.title !== previousData.title ||
            data.description !== previousData.description ||
            JSON.stringify(data.ingredients) !== JSON.stringify(previousData.ingredients);

        if (!relevantChanged && data.embedding) return null;

        try {
            const userId = event.params.userId;
            if (typeof userId !== "string" || !userId) return null;
            // The production off-switch. This one has no button behind it -- it
            // fires whenever a recipe is written -- so an unguarded trigger is
            // the easiest way to keep spending after the UI has been paused.
            if (!isAiEnabled()) {
                logger.info("Skipping recipe embedding: AI is paused.", {
                    userId,
                    recipeId: event.params.recipeId,
                });
                return null;
            }
            if (isLiveAiDisabledInEmulator()) {
                logger.info("Skipping recipe embedding in local emulator.", {
                    userId,
                    recipeId: event.params.recipeId,
                });
                return null;
            }
            await enforceAiUsageLimit(userId, "generateRecipeEmbedding");
            assertAiSpendPricingSafeWhenEnabled();

            const embeddingInput = formatRecipeEmbeddingInput(data);
            const reservation = await reserveAiSpend({
                db,
                uid: userId,
                feature: "generateRecipeEmbedding",
                idempotencyKey: stableIdempotencyKey([
                    "generateRecipeEmbedding",
                    (event as any).id || "",
                    userId,
                    event.params.recipeId,
                    embeddingInput,
                ]),
                estimatedInputTokens: estimateTextTokens(embeddingInput),
            });
            assertSpendReservationAllowsProvider(reservation);

            let providerReservation: AiSpendReservation | null = null;
            try {
                const ai = createGeminiClient();
                providerReservation = await claimAiSpendProviderStart(
                    db,
                    reservation
                );
                const result = await ai.models.embedContent({
                    model: GEMINI_EMBEDDING_MODEL,
                    contents: embeddingInput,
                    config: {
                        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
                    },
                });
                const embedding = toFirestoreEmbeddingVector(result.embeddings?.[0]?.values);

                // Update document with embedding
                await event.data?.after.ref.update({
                    embedding: FieldValue.vector(embedding)
                });
                await reconcileAiSpendReservation(
                    db,
                    providerReservation,
                    getUsageMetadata(result),
                    "success"
                );
            } catch (error) {
                if (providerReservation) {
                    await reconcileAiSpendReservation(
                        db,
                        providerReservation,
                        null,
                        "provider_error"
                    );
                }
                throw error;
            }

            logger.info(`Generated embedding for recipe: ${data.title}`);
        } catch (error) {
            logger.error("Embedding generation failed:", error);
        }
        return null;
    }
);

export const semanticSearchRecipes = onCall(
    AI_CALLABLE_RUNTIME_OPTIONS,
    async (request) => {
        requireAppCheck(request);
        const uid = requireAuth(request);
        assertAiEnabled("semanticSearchRecipes");

        const { query, limit = 10 } = request.data;
        if (!query || typeof query !== "string") {
            throw new HttpsError("invalid-argument", "Missing search query.");
        }
        if (query.length > MAX_SEARCH_QUERY_CHARS) {
            throw new HttpsError("invalid-argument", "Search query is too long.");
        }
        const safeLimit = Math.min(Number(limit) || 10, MAX_SEARCH_LIMIT);
        await enforceAiUsageLimit(uid, "semanticSearchRecipes");
            assertLiveAiAllowed("semanticSearchRecipes");
        assertAiSpendPricingSafeWhenEnabled();

        const embeddingInput = formatSearchEmbeddingInput(query);
        const reservation = await reserveAiSpend({
            db,
            uid,
            feature: "semanticSearchRecipes",
            idempotencyKey: readRequestIdempotencyKey(
                request,
                "semanticSearchRecipes",
                uid
            ),
            estimatedInputTokens: estimateTextTokens(embeddingInput),
        });
        assertSpendReservationAllowsProvider(reservation);

        let providerReservation: AiSpendReservation | null = null;
        try {
            const ai = createGeminiClient();
            providerReservation = await claimAiSpendProviderStart(
                db,
                reservation
            );
            const result = await ai.models.embedContent({
                model: GEMINI_EMBEDDING_MODEL,
                contents: embeddingInput,
                config: {
                    outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
                },
            });
            const queryVector = toFirestoreEmbeddingVector(result.embeddings?.[0]?.values);
            await reconcileAiSpendReservation(
                db,
                providerReservation,
                getUsageMetadata(result),
                "success"
            );

            const recipesRef = db.collection(`users/${uid}/recipes`);

            // Perform vector search
            // NOTE: findNearest is available in Node.js SDK >= 13.x
            const snapshot = await recipesRef
                .findNearest("embedding", FieldValue.vector(queryVector), {
                    limit: safeLimit,
                    distanceMeasure: "COSINE"
                })
                .get();

            const recipes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                embedding: undefined // Don't send the heavy vector back
            }));

            return { recipes };

        } catch (error: any) {
            if (providerReservation) {
                await reconcileAiSpendReservation(
                    db,
                    providerReservation,
                    null,
                    "provider_error"
                );
            }
            if (error instanceof HttpsError) {
                throw error;
            }
            logger.error("Semantic search failed:", error);
            throw new HttpsError("internal", "Failed to perform semantic search.", error.message);
        }
    }
);

export const getAiSpendStatus = onCall(
    { enforceAppCheck, cors: true, maxInstances: 1, concurrency: 5 },
    async (request) => {
        requireAppCheck(request);
        const uid = requireAuth(request);
        requireOwner(uid);
        return getAiSpendStatusForOwner(db);
    }
);

export const resumeAiSpendAllowance = onCall(
    { enforceAppCheck, cors: true, maxInstances: 1, concurrency: 1 },
    async (request) => {
        requireAppCheck(request);
        const uid = requireAuth(request);
        requireOwner(uid);
        const idempotencyKey = readOwnerMutationIdempotencyKey(
            request,
            "resumeAiSpendAllowance",
            uid
        );
        return resumeAiSpendForOwner(db, uid, idempotencyKey);
    }
);

export const manualPauseAiSpend = onCall(
    { enforceAppCheck, cors: true, maxInstances: 1, concurrency: 1 },
    async (request) => {
        requireAppCheck(request);
        const uid = requireAuth(request);
        requireOwner(uid);
        const idempotencyKey = readOwnerMutationIdempotencyKey(
            request,
            "manualPauseAiSpend",
            uid
        );
        return manuallyPauseAiSpendForOwner(db, uid, idempotencyKey);
    }
);
