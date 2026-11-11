import {
    AiSpendFeature,
    CURRENT_AI_SPEND_PRICING,
    assertConfiguredModelsMatchPricing,
    dollarsToMicros,
} from "./aiSpendPricing";

export type AiSpendFeaturePolicy = {
    feature: AiSpendFeature;
    reservationMicros: number;
    maxInputTokens: number;
    maxOutputTokens?: number;
    maxInputBytes?: number;
};

export type PacificMonthPeriod = {
    periodKey: string;
    startsAtIso: string;
    endsAtIso: string;
};

export const INITIAL_AI_ALLOWANCE_MICROS = dollarsToMicros(20);
export const AI_SAFETY_RESERVE_MICROS = dollarsToMicros(1);
export const OWNER_RESUME_INCREMENT_MICROS = dollarsToMicros(20);
export const AI_SPEND_PRE_PROVIDER_LEASE_MS = 5 * 60 * 1000;
export const AI_SPEND_PROVIDER_STARTED_LEASE_MS = 65 * 60 * 1000;
export const AI_SPEND_RECOVERY_BATCH_LIMIT = 10;

export const AI_SPEND_FEATURE_POLICIES: Record<
    AiSpendFeature,
    AiSpendFeaturePolicy
> = {
    generateMealPlan: {
        feature: "generateMealPlan",
        reservationMicros: dollarsToMicros(0.10),
        maxInputTokens: 30_000,
        maxOutputTokens: 4096,
    },
    parseRecipeFromImage: {
        feature: "parseRecipeFromImage",
        reservationMicros: dollarsToMicros(0.25),
        maxInputTokens: 100_000,
        maxOutputTokens: 4096,
        maxInputBytes: 10 * 1024 * 1024,
    },
    generateRecipeEmbedding: {
        feature: "generateRecipeEmbedding",
        reservationMicros: dollarsToMicros(0.01),
        maxInputTokens: 30_000,
    },
    semanticSearchRecipes: {
        feature: "semanticSearchRecipes",
        reservationMicros: dollarsToMicros(0.01),
        maxInputTokens: 2_000,
    },
};

export function isAiSpendCircuitBreakerEnabled(): boolean {
    return process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED === "true";
}

export function getAiSpendFeaturePolicy(
    feature: AiSpendFeature
): AiSpendFeaturePolicy {
    return AI_SPEND_FEATURE_POLICIES[feature];
}

export function assertAiSpendConfiguredModels(
    textModel: string,
    multimodalModel: string,
    embeddingModel: string
): void {
    assertConfiguredModelsMatchPricing(
        textModel,
        multimodalModel,
        embeddingModel,
        CURRENT_AI_SPEND_PRICING
    );
}

function formatPacificParts(date: Date): Record<string, string> {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "shortOffset",
    }).formatToParts(date);

    return Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value])
    );
}

function getPacificOffsetMinutes(date: Date): number {
    const timeZoneName = formatPacificParts(date).timeZoneName || "GMT-8";
    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(timeZoneName);
    if (!match) {
        throw new Error(`Unable to parse Pacific offset: ${timeZoneName}`);
    }
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] || 0);
    return sign * (hours * 60 + minutes);
}

function localPacificMidnightUtcMillis(year: number, month: number): number {
    let guess = Date.UTC(year, month - 1, 1, 8, 0, 0, 0);
    for (let i = 0; i < 3; i += 1) {
        const offsetMinutes = getPacificOffsetMinutes(new Date(guess));
        guess = Date.UTC(year, month - 1, 1, 0, 0, 0, 0) -
            offsetMinutes * 60_000;
    }
    return guess;
}

export function getPacificCalendarMonthPeriod(
    now: Date = new Date()
): PacificMonthPeriod {
    const parts = formatPacificParts(now);
    const year = Number(parts.year);
    const month = Number(parts.month);
    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const startsAt = new Date(localPacificMidnightUtcMillis(year, month));
    const endsAt = new Date(
        localPacificMidnightUtcMillis(nextMonthYear, nextMonth)
    );

    return {
        periodKey: `${year}-${String(month).padStart(2, "0")}`,
        startsAtIso: startsAt.toISOString(),
        endsAtIso: endsAt.toISOString(),
    };
}

export function assertInputTokensWithinPolicy(
    policy: AiSpendFeaturePolicy,
    estimatedInputTokens: number
): void {
    if (!Number.isFinite(estimatedInputTokens) ||
        estimatedInputTokens < 0 ||
        estimatedInputTokens > policy.maxInputTokens) {
        throw new Error(
            `${policy.feature} input exceeds ${policy.maxInputTokens} tokens.`
        );
    }
}

export function getAiSpendPolicySnapshot() {
    return {
        pricingVersion: CURRENT_AI_SPEND_PRICING.version,
        pricingModels: {
            textModel: CURRENT_AI_SPEND_PRICING.textModel,
            multimodalModel: CURRENT_AI_SPEND_PRICING.multimodalModel,
            embeddingModel: CURRENT_AI_SPEND_PRICING.embeddingModel,
        },
        initialAllowanceMicros: INITIAL_AI_ALLOWANCE_MICROS,
        safetyReserveMicros: AI_SAFETY_RESERVE_MICROS,
        ownerResumeIncrementMicros: OWNER_RESUME_INCREMENT_MICROS,
        preProviderLeaseMs: AI_SPEND_PRE_PROVIDER_LEASE_MS,
        providerStartedLeaseMs: AI_SPEND_PROVIDER_STARTED_LEASE_MS,
        recoveryBatchLimit: AI_SPEND_RECOVERY_BATCH_LIMIT,
        featurePolicies: AI_SPEND_FEATURE_POLICIES,
    };
}
