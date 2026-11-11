export const MICROS_PER_DOLLAR = 1_000_000;
export const AI_SPEND_PRICING_VERSION = "gemini-standard-2026-07-09-v2";
export const PRICED_TEXT_MODEL = "gemini-3.5-flash";
export const PRICED_MULTIMODAL_MODEL = "gemini-3.5-flash";
export const PRICED_EMBEDDING_MODEL = "gemini-embedding-2";

export type AiSpendFeature =
    | "generateMealPlan"
    | "parseRecipeFromImage"
    | "generateRecipeEmbedding"
    | "semanticSearchRecipes";

export type AiSpendUsageMetadata = {
    promptTokenCount?: unknown;
    candidatesTokenCount?: unknown;
    totalTokenCount?: unknown;
    cachedContentTokenCount?: unknown;
    thoughtsTokenCount?: unknown;
    thinkingTokenCount?: unknown;
    toolUsePromptTokenCount?: unknown;
};

export type AiSpendPricing = {
    version: string;
    textModel: string;
    multimodalModel: string;
    embeddingModel: string;
    textInputMicrosPerMillionTokens: number;
    textOutputMicrosPerMillionTokens: number;
    cachedInputMicrosPerMillionTokens: number;
    embeddingInputMicrosPerMillionTokens: number;
};

export const CURRENT_AI_SPEND_PRICING: AiSpendPricing = {
    version: AI_SPEND_PRICING_VERSION,
    textModel: PRICED_TEXT_MODEL,
    multimodalModel: PRICED_MULTIMODAL_MODEL,
    embeddingModel: PRICED_EMBEDDING_MODEL,
    textInputMicrosPerMillionTokens: 1_500_000,
    textOutputMicrosPerMillionTokens: 9_000_000,
    cachedInputMicrosPerMillionTokens: 150_000,
    embeddingInputMicrosPerMillionTokens: 200_000,
};

export function dollarsToMicros(dollars: number): number {
    return Math.round(dollars * MICROS_PER_DOLLAR);
}

function readTokenCount(value: unknown): number | null {
    if (typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 0) {
        return null;
    }
    return value;
}

function hasTokenField(
    metadata: AiSpendUsageMetadata,
    field: keyof AiSpendUsageMetadata
): boolean {
    return Object.prototype.hasOwnProperty.call(metadata, field);
}

function readOptionalTokenCount(
    metadata: AiSpendUsageMetadata,
    field: keyof AiSpendUsageMetadata
): number | null {
    if (!hasTokenField(metadata, field)) {
        return 0;
    }
    return readTokenCount(metadata[field]);
}

function costMicrosForTokens(
    tokens: number,
    microsPerMillionTokens: number
): number {
    return Math.ceil((tokens * microsPerMillionTokens) / 1_000_000);
}

export function estimateTextTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export function assertConfiguredModelsMatchPricing(
    textModel: string,
    multimodalModel: string,
    embeddingModel: string,
    pricing: AiSpendPricing = CURRENT_AI_SPEND_PRICING
): void {
    if (textModel !== pricing.textModel ||
        multimodalModel !== pricing.multimodalModel ||
        embeddingModel !== pricing.embeddingModel) {
        throw new Error(
            "Configured Gemini model IDs do not match the AI spend pricing table."
        );
    }
}

export function calculateUsageCostMicros(
    feature: AiSpendFeature,
    metadata: AiSpendUsageMetadata | null | undefined,
    pricing: AiSpendPricing = CURRENT_AI_SPEND_PRICING
): number | null {
    if (!metadata || typeof metadata !== "object") {
        return null;
    }

    const promptTokens = readTokenCount(metadata.promptTokenCount);
    const outputTokens = readTokenCount(metadata.candidatesTokenCount);
    const cachedTokens = readOptionalTokenCount(
        metadata,
        "cachedContentTokenCount"
    );
    const toolTokens = readOptionalTokenCount(
        metadata,
        "toolUsePromptTokenCount"
    );
    const totalTokens = readOptionalTokenCount(metadata, "totalTokenCount");
    const hasThoughtsTokens = hasTokenField(metadata, "thoughtsTokenCount");
    const hasThinkingTokens = hasTokenField(metadata, "thinkingTokenCount");

    if (promptTokens === null ||
        (hasTokenField(metadata, "candidatesTokenCount") &&
            outputTokens === null) ||
        cachedTokens === null ||
        toolTokens === null ||
        totalTokens === null) {
        return null;
    }
    if (cachedTokens > promptTokens) {
        return null;
    }

    if (hasThoughtsTokens && hasThinkingTokens) {
        return null;
    }

    const thinkingTokens = hasThoughtsTokens ?
        readTokenCount(metadata.thoughtsTokenCount) :
        readOptionalTokenCount(metadata, "thinkingTokenCount");
    if (thinkingTokens === null) {
        return null;
    }

    if (hasTokenField(metadata, "totalTokenCount")) {
        const expectedTotalTokens = promptTokens +
            (outputTokens === null ? 0 : outputTokens) +
            toolTokens +
            thinkingTokens;
        if (totalTokens !== expectedTotalTokens) {
            return null;
        }
    }

    if (feature === "generateRecipeEmbedding" ||
        feature === "semanticSearchRecipes") {
        return costMicrosForTokens(
            promptTokens + toolTokens,
            pricing.embeddingInputMicrosPerMillionTokens
        );
    }

    if (outputTokens === null) {
        return null;
    }

    const billablePromptTokens = Math.max(promptTokens - cachedTokens, 0);
    return costMicrosForTokens(
        billablePromptTokens + toolTokens,
        pricing.textInputMicrosPerMillionTokens
    ) +
        costMicrosForTokens(
            cachedTokens,
            pricing.cachedInputMicrosPerMillionTokens
        ) +
        costMicrosForTokens(
            outputTokens + thinkingTokens,
            pricing.textOutputMicrosPerMillionTokens
        );
}
