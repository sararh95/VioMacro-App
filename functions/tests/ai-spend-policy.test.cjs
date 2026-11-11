const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const policy = require("../lib/aiSpendPolicy.js");
const pricing = require("../lib/aiSpendPricing.js");
const reservations = require("../lib/aiSpendReservations.js");
const JULY_2026 = new Date("2026-07-10T12:00:00.000Z");

function state(overrides = {}) {
    return {
        periodKey: "2026-07",
        status: "active",
        allowanceMicros: 20_000_000,
        spentMicros: 0,
        reservedMicros: 0,
        safetyReserveMicros: 1_000_000,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        ...overrides,
    };
}

class MemorySnapshot {
    constructor(data, pathName = null) {
        this._data = data;
        this.ref = pathName ? { path: pathName } : undefined;
        this.exists = data !== undefined;
    }
    data() {
        return this._data;
    }
}

class MemoryTransaction {
    constructor(db) {
        this.db = db;
        this.writes = [];
    }
    async get(ref) {
        return new MemorySnapshot(this.db.docs.get(ref.path), ref.path);
    }
    set(ref, data, options = {}) {
        this.writes.push({ ref, data, merge: options.merge === true });
    }
    commit() {
        for (const write of this.writes) {
            const current = this.db.docs.get(write.ref.path) || {};
            this.db.docs.set(
                write.ref.path,
                write.merge ? { ...current, ...write.data } : write.data
            );
        }
    }
}

class MemoryDb {
    constructor() {
        this.docs = new Map();
        this.queue = Promise.resolve();
        this.failQueries = false;
    }
    doc(pathName) {
        return {
            path: pathName,
            get: async () => new MemorySnapshot(this.docs.get(pathName), pathName),
        };
    }
    collection(pathName) {
        return new MemoryQuery(this, pathName);
    }
    runTransaction(callback) {
        const run = this.queue.then(async () => {
            const transaction = new MemoryTransaction(this);
            const result = await callback(transaction);
            transaction.commit();
            return result;
        });
        this.queue = run.catch(() => {});
        return run;
    }
}

class MemoryQuery {
    constructor(db, collectionPath, filters = [], limitCount = null) {
        this.db = db;
        this.collectionPath = collectionPath;
        this.filters = filters;
        this.limitCount = limitCount;
    }
    where(field, op, value) {
        return new MemoryQuery(
            this.db,
            this.collectionPath,
            [...this.filters, { field, op, value }],
            this.limitCount
        );
    }
    limit(count) {
        return new MemoryQuery(this.db, this.collectionPath, this.filters, count);
    }
    async get() {
        if (this.db.failQueries) {
            throw new Error("recovery query unavailable");
        }
        const prefix = `${this.collectionPath}/`;
        let docs = [...this.db.docs.entries()]
            .filter(([pathName]) => pathName.startsWith(prefix) &&
                !pathName.slice(prefix.length).includes("/"))
            .filter(([, data]) => this.filters.every((filter) => {
                const actual = data?.[filter.field];
                if (filter.op === "<=") {
                    return toMillis(actual) <= toMillis(filter.value);
                }
                if (filter.op === "==") {
                    return actual === filter.value;
                }
                if (filter.op === "in") {
                    return Array.isArray(filter.value) &&
                        filter.value.includes(actual);
                }
                throw new Error(`Unsupported MemoryQuery operator ${filter.op}`);
            }))
            .sort(([left], [right]) => left.localeCompare(right));
        if (this.limitCount !== null) {
            docs = docs.slice(0, this.limitCount);
        }
        return {
            docs: docs.map(([pathName, data]) => new MemorySnapshot(data, pathName)),
        };
    }
}

function toMillis(value) {
    if (value instanceof Date) {
        return value.getTime();
    }
    if (value && typeof value.toDate === "function") {
        return value.toDate().getTime();
    }
    return Number.NaN;
}

test.beforeEach(() => {
    delete process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED;
});

test("AI spend circuit breaker defaults disabled", () => {
    assert.equal(policy.isAiSpendCircuitBreakerEnabled(), false);
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    assert.equal(policy.isAiSpendCircuitBreakerEnabled(), true);
});

test("Pacific calendar month period rolls over at Pacific midnight", () => {
    const beforeRollover = policy.getPacificCalendarMonthPeriod(
        new Date("2026-07-01T06:59:59.000Z")
    );
    const afterRollover = policy.getPacificCalendarMonthPeriod(
        new Date("2026-07-01T07:00:00.000Z")
    );
    const january = policy.getPacificCalendarMonthPeriod(
        new Date("2026-01-01T08:00:00.000Z")
    );

    assert.equal(beforeRollover.periodKey, "2026-06");
    assert.equal(afterRollover.periodKey, "2026-07");
    assert.equal(afterRollover.startsAtIso, "2026-07-01T07:00:00.000Z");
    assert.equal(afterRollover.endsAtIso, "2026-08-01T07:00:00.000Z");
    assert.equal(january.periodKey, "2026-01");
    assert.equal(january.startsAtIso, "2026-01-01T08:00:00.000Z");
});

test("feature policies use commanded integer-micros reservations", () => {
    const snapshot = policy.getAiSpendPolicySnapshot();

    assert.equal(snapshot.initialAllowanceMicros, 20_000_000);
    assert.equal(snapshot.safetyReserveMicros, 1_000_000);
    assert.equal(snapshot.ownerResumeIncrementMicros, 20_000_000);
    assert.equal(snapshot.preProviderLeaseMs, 5 * 60 * 1000);
    assert.equal(snapshot.providerStartedLeaseMs, 65 * 60 * 1000);
    assert.equal(snapshot.recoveryBatchLimit, 10);
    assert.equal(snapshot.featurePolicies.generateMealPlan.reservationMicros, 100_000);
    assert.equal(snapshot.featurePolicies.generateMealPlan.maxInputTokens, 30_000);
    assert.equal(snapshot.featurePolicies.generateMealPlan.maxOutputTokens, 4096);
    assert.equal(snapshot.featurePolicies.parseRecipeFromImage.reservationMicros, 250_000);
    assert.equal(snapshot.featurePolicies.parseRecipeFromImage.maxInputTokens, 100_000);
    assert.equal(snapshot.featurePolicies.parseRecipeFromImage.maxInputBytes, 10 * 1024 * 1024);
    assert.equal(snapshot.featurePolicies.generateRecipeEmbedding.reservationMicros, 10_000);
    assert.equal(snapshot.featurePolicies.semanticSearchRecipes.reservationMicros, 10_000);
    assert.deepEqual(snapshot.pricingModels, {
        textModel: "gemini-3.5-flash",
        multimodalModel: "gemini-3.5-flash",
        embeddingModel: "gemini-embedding-2",
    });
});

test("usage metadata cost includes input, output, thinking, cached, and tool tokens", () => {
    const cost = pricing.calculateUsageCostMicros("generateMealPlan", {
        promptTokenCount: 1000,
        cachedContentTokenCount: 200,
        candidatesTokenCount: 500,
        thoughtsTokenCount: 50,
        toolUsePromptTokenCount: 20,
        totalTokenCount: 1570,
    });

    assert.equal(cost, 6210);
    assert.equal(pricing.calculateUsageCostMicros("generateMealPlan", null), null);
    assert.equal(
        pricing.calculateUsageCostMicros("generateMealPlan", { promptTokenCount: 1 }),
        null
    );
    assert.equal(
        pricing.calculateUsageCostMicros("generateMealPlan", {
            promptTokenCount: 10,
            cachedContentTokenCount: 20,
            candidatesTokenCount: 1,
        }),
        null
    );
    assert.equal(
        pricing.calculateUsageCostMicros("generateMealPlan", {
            promptTokenCount: "1000",
            candidatesTokenCount: 1,
        }),
        null
    );
    assert.equal(
        pricing.calculateUsageCostMicros("semanticSearchRecipes", {
            promptTokenCount: 1000,
        }),
        200
    );
});

test("malformed optional usage metadata fields fail closed", () => {
    const baseMetadata = {
        promptTokenCount: 1000,
        candidatesTokenCount: 500,
        totalTokenCount: 1500,
    };

    for (const malformedMetadata of [
        { ...baseMetadata, cachedContentTokenCount: "200" },
        { ...baseMetadata, thoughtsTokenCount: "50" },
        { ...baseMetadata, thinkingTokenCount: "50" },
        { ...baseMetadata, toolUsePromptTokenCount: "20" },
        { ...baseMetadata, totalTokenCount: "1500" },
        { ...baseMetadata, cachedContentTokenCount: Number.MAX_SAFE_INTEGER + 1 },
        { ...baseMetadata, toolUsePromptTokenCount: -1 },
        { ...baseMetadata, thoughtsTokenCount: 1.5 },
    ]) {
        assert.equal(
            pricing.calculateUsageCostMicros("generateMealPlan", malformedMetadata),
            null
        );
    }
});

test("contradictory total tokens and ambiguous thinking metadata fail closed", () => {
    assert.equal(
        pricing.calculateUsageCostMicros("generateMealPlan", {
            promptTokenCount: 1000,
            candidatesTokenCount: 500,
            thoughtsTokenCount: 50,
            toolUsePromptTokenCount: 20,
            totalTokenCount: 1569,
        }),
        null
    );
    assert.equal(
        pricing.calculateUsageCostMicros("generateMealPlan", {
            promptTokenCount: 1000,
            candidatesTokenCount: 500,
            thoughtsTokenCount: 50,
            thinkingTokenCount: 50,
            totalTokenCount: 1550,
        }),
        null
    );
    assert.equal(
        pricing.calculateUsageCostMicros("generateMealPlan", {
            promptTokenCount: 1000,
            candidatesTokenCount: 500,
            thinkingTokenCount: 50,
            toolUsePromptTokenCount: 20,
            totalTokenCount: 1570,
        }),
        6480
    );
});

test("configured model IDs must match versioned pricing", () => {
    assert.doesNotThrow(() => pricing.assertConfiguredModelsMatchPricing(
        "gemini-3.5-flash",
        "gemini-3.5-flash",
        "gemini-embedding-2"
    ));
    assert.throws(
        () => pricing.assertConfiguredModelsMatchPricing(
            "gemini-other",
            "gemini-3.5-flash",
            "gemini-embedding-2"
        ),
        /pricing table/
    );
});

test("disabled reservation path never creates spend documents", async () => {
    const db = new MemoryDb();
    const result = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "generateMealPlan",
        idempotencyKey: "disabled-test",
        estimatedInputTokens: 100,
        now: JULY_2026,
    });

    assert.equal(result.enabled, false);
    assert.equal(result.shouldCallProvider, true);
    assert.equal(db.docs.size, 0);
});

test("below-boundary reservation remains eligible", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_989_999,
    }));

    const result = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["below"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    assert.equal(result.shouldCallProvider, true);
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").status, "active");
});

test("exact-boundary reservation pauses before provider execution", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_990_000,
    }));

    const result = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["exact"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    assert.equal(result.shouldCallProvider, false);
    assert.equal(result.blockedReason, "paused");
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").status, "paused");
    assert.equal(db.docs.has("ops/emailOutbox/events/ai-spend-paused-2026-07-20000000"), true);
});

test("transactional reservations do not overspend the final allowance slot", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_980_000,
    }));

    const results = await Promise.all([
        reservations.reserveAiSpend({
            db,
            uid: "owner",
            feature: "semanticSearchRecipes",
            idempotencyKey: reservations.stableIdempotencyKey(["concurrent-a"]),
            estimatedInputTokens: 50,
            now: JULY_2026,
        }),
        reservations.reserveAiSpend({
            db,
            uid: "owner",
            feature: "semanticSearchRecipes",
            idempotencyKey: reservations.stableIdempotencyKey(["concurrent-b"]),
            estimatedInputTokens: 50,
            now: JULY_2026,
        }),
    ]);

    assert.equal(results.filter((result) => result.shouldCallProvider).length, 1);
    assert.equal(results.filter((result) => result.blockedReason === "paused").length, 1);
    const currentState = db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    assert.equal(currentState.status, "paused");
    assert.equal(db.docs.has("ops/emailOutbox/events/ai-spend-paused-2026-07-20000000"), true);
});

test("distinct request IDs reserve separately while completed duplicate request IDs do not reserve twice", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const firstKey = reservations.stableIdempotencyKey(["request", "a"]);
    const secondKey = reservations.stableIdempotencyKey(["request", "b"]);

    const first = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: firstKey,
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const second = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: secondKey,
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    await reservations.closeAiSpendReservationWithoutCharge(db, first, "test-close");
    const duplicate = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: firstKey,
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    assert.equal(first.shouldCallProvider, true);
    assert.equal(second.shouldCallProvider, true);
    assert.equal(duplicate.shouldCallProvider, false);
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").reservedMicros, 10_000);
});

test("expired pre-provider reservations recover before new reservation and remain terminal duplicates", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const staleKey = reservations.stableIdempotencyKey(["stale", "reserved"]);
    const stalePath = `ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${staleKey}`;
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        reservedMicros: 10_000,
    }));
    db.docs.set(stalePath, {
        feature: "semanticSearchRecipes",
        uid: "owner",
        idempotencyKey: staleKey,
        periodKey: "2026-07",
        status: "reserved",
        reservationMicros: 10_000,
        estimatedInputTokens: 50,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        leaseExpiresAt: new Date("2026-07-10T11:54:00.000Z"),
    });

    const next = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["after-stale-reserved"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const recovered = db.docs.get(stalePath);
    const duplicate = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: staleKey,
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    assert.equal(next.shouldCallProvider, true);
    assert.equal(recovered.status, "closed_without_charge");
    assert.equal(recovered.billedMicros, 0);
    assert.equal("leaseExpiresAt" in recovered, false);
    assert.equal(duplicate.shouldCallProvider, false);
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").reservedMicros, 10_000);
});

test("expired provider-started reservations recover conservatively once and pause once at the boundary", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const staleKey = reservations.stableIdempotencyKey(["stale", "provider-started"]);
    const stalePath = `ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${staleKey}`;
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_990_000,
        reservedMicros: 10_000,
    }));
    db.docs.set(stalePath, {
        feature: "semanticSearchRecipes",
        uid: "owner",
        idempotencyKey: staleKey,
        periodKey: "2026-07",
        status: "provider_started",
        reservationMicros: 10_000,
        estimatedInputTokens: 50,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        leaseExpiresAt: new Date("2026-07-10T10:54:00.000Z"),
        providerStartedAt: new Date("2026-07-10T10:00:00.000Z"),
    });

    const status = await reservations.getAiSpendStatusForOwner(db, JULY_2026);
    const repeatStatus = await reservations.getAiSpendStatusForOwner(db, JULY_2026);
    const recovered = db.docs.get(stalePath);
    const currentState = db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    const outboxPath = "ops/emailOutbox/events/ai-spend-paused-2026-07-20000000";

    assert.equal(status.status, "paused");
    assert.equal(repeatStatus.status, "paused");
    assert.equal(recovered.status, "failed_conservative");
    assert.equal(recovered.billedMicros, 10_000);
    assert.equal("leaseExpiresAt" in recovered, false);
    assert.equal(currentState.spentMicros, 19_000_000);
    assert.equal(currentState.reservedMicros, 0);
    assert.equal(currentState.lastPauseEmailEventId, "ai-spend-paused-2026-07-20000000");
    assert.equal(db.docs.has(outboxPath), true);
    assert.equal([...db.docs.keys()].filter((key) => key === outboxPath).length, 1);
});

test("fresh provider-started duplicate requests remain blocked", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const duplicateKey = reservations.stableIdempotencyKey(["fresh", "provider-started"]);
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        reservedMicros: 10_000,
    }));
    db.docs.set(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${duplicateKey}`, {
        feature: "semanticSearchRecipes",
        uid: "owner",
        idempotencyKey: duplicateKey,
        periodKey: "2026-07",
        status: "provider_started",
        reservationMicros: 10_000,
        estimatedInputTokens: 50,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        leaseExpiresAt: new Date("2026-07-10T13:05:00.000Z"),
        providerStartedAt: new Date("2026-07-10T12:00:00.000Z"),
    });

    await assert.rejects(
        () => reservations.reserveAiSpend({
            db,
            uid: "owner",
            feature: "semanticSearchRecipes",
            idempotencyKey: duplicateKey,
            estimatedInputTokens: 50,
            now: JULY_2026,
        }),
        /already reserved|provider/
    );
});

test("provider start claim is required before reconciliation and expires pre-provider leases", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const reservation = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["claim", "required"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    await assert.rejects(
        () => reservations.reconcileAiSpendReservation(db, reservation, null, "success"),
        /provider-start|provider start/
    );

    const claimed = await reservations.claimAiSpendProviderStart(db, reservation, JULY_2026);
    await reservations.reconcileAiSpendReservation(db, claimed, null, "success");
    assert.equal(db.docs.get(claimed.reservationPath).status, "reconciled");

    const expired = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["claim", "expired"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    await assert.rejects(
        () => reservations.claimAiSpendProviderStart(
            db,
            expired,
            new Date("2026-07-10T12:06:00.000Z")
        ),
        /lease|expired/
    );
});

test("provider start claim rejects caller handles that do not match stored reservation", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const mismatchCases = [
        {
            name: "feature",
            mutate: (reservation) => ({
                ...reservation,
                feature: "generateMealPlan",
            }),
        },
        {
            name: "idempotency key",
            mutate: (reservation) => ({
                ...reservation,
                idempotencyKey: reservations.stableIdempotencyKey(["forged", "key"]),
            }),
        },
        {
            name: "reservation amount",
            mutate: (reservation) => ({
                ...reservation,
                reservationMicros: 1,
            }),
        },
        {
            name: "document path",
            mutate: (reservation, db) => {
                const wrongKey = reservations.stableIdempotencyKey(["wrong-path", "doc"]);
                const wrongPath = `ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${wrongKey}`;
                db.docs.set(wrongPath, {
                    ...db.docs.get(reservation.reservationPath),
                });
                return {
                    ...reservation,
                    reservationPath: wrongPath,
                };
            },
        },
    ];

    for (const mismatchCase of mismatchCases) {
        const db = new MemoryDb();
        const reservation = await reservations.reserveAiSpend({
            db,
            uid: "owner",
            feature: "semanticSearchRecipes",
            idempotencyKey: reservations.stableIdempotencyKey([
                "claim-mismatch",
                mismatchCase.name,
            ]),
            estimatedInputTokens: 50,
            now: JULY_2026,
        });
        await assert.rejects(
            () => reservations.claimAiSpendProviderStart(
                db,
                mismatchCase.mutate(reservation, db),
                JULY_2026
            ),
            /reservation handle|canonical path/
        );
        assert.equal(
            db.docs.get(reservation.reservationPath).status,
            "reserved"
        );
    }
});

test("reconciliation uses stored reservation for pricing fallback pause and audit", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const pricingDb = new MemoryDb();
    pricingDb.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_980_000,
    }));
    const pricingReservation = await reservations.reserveAiSpend({
        db: pricingDb,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["stored-pricing"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const pricingClaim = await reservations.claimAiSpendProviderStart(
        pricingDb,
        pricingReservation,
        JULY_2026
    );
    await reservations.reconcileAiSpendReservation(pricingDb, {
        ...pricingClaim,
        feature: "generateMealPlan",
        idempotencyKey: reservations.stableIdempotencyKey(["forged-pricing-key"]),
        reservationMicros: 1,
    }, {
        promptTokenCount: 100_000,
    }, "success");

    const pricingState = pricingDb.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    const pricingDoc = pricingDb.docs.get(pricingClaim.reservationPath);
    const pricingOutbox = pricingDb.docs.get(
        "ops/emailOutbox/events/ai-spend-paused-2026-07-20000000"
    );
    const pricingAudit = pricingDb.docs.get(
        "ops/aiSpendCircuitBreaker/periods/2026-07/audit/ai-spend-paused-2026-07-20000000"
    );
    assert.equal(pricingState.status, "paused");
    assert.equal(pricingState.spentMicros, 19_000_000);
    assert.equal(pricingState.reservedMicros, 0);
    assert.equal(pricingDoc.billedMicros, 20_000);
    assert.equal(pricingOutbox.payload.spentMicros, 19_000_000);
    assert.equal(pricingOutbox.payload.attemptedReservationMicros, 10_000);
    assert.equal(pricingAudit.feature, "semanticSearchRecipes");
    assert.equal(pricingAudit.idempotencyKey, pricingReservation.idempotencyKey);

    const fallbackDb = new MemoryDb();
    const fallbackReservation = await reservations.reserveAiSpend({
        db: fallbackDb,
        uid: "owner",
        feature: "parseRecipeFromImage",
        idempotencyKey: reservations.stableIdempotencyKey(["stored-fallback"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const fallbackClaim = await reservations.claimAiSpendProviderStart(
        fallbackDb,
        fallbackReservation,
        JULY_2026
    );
    await reservations.reconcileAiSpendReservation(fallbackDb, {
        ...fallbackClaim,
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["forged-fallback-key"]),
        reservationMicros: 1,
    }, null, "provider_error");

    const fallbackState = fallbackDb.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    const fallbackDoc = fallbackDb.docs.get(fallbackClaim.reservationPath);
    assert.equal(fallbackState.status, "active");
    assert.equal(fallbackState.spentMicros, 250_000);
    assert.equal(fallbackState.reservedMicros, 0);
    assert.equal(fallbackDoc.billedMicros, 250_000);
});

test("fresh pre-provider and provider-started leases are not recovered early", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const reservedKey = reservations.stableIdempotencyKey(["fresh", "reserved"]);
    const startedKey = reservations.stableIdempotencyKey(["fresh", "started"]);
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        reservedMicros: 20_000,
    }));
    db.docs.set(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${reservedKey}`, {
        feature: "semanticSearchRecipes",
        uid: "owner",
        idempotencyKey: reservedKey,
        periodKey: "2026-07",
        status: "reserved",
        reservationMicros: 10_000,
        estimatedInputTokens: 50,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        leaseExpiresAt: new Date("2026-07-10T12:05:00.000Z"),
    });
    db.docs.set(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${startedKey}`, {
        feature: "semanticSearchRecipes",
        uid: "owner",
        idempotencyKey: startedKey,
        periodKey: "2026-07",
        status: "provider_started",
        reservationMicros: 10_000,
        estimatedInputTokens: 50,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        leaseExpiresAt: new Date("2026-07-10T13:05:00.000Z"),
        providerStartedAt: new Date("2026-07-10T12:00:00.000Z"),
    });

    await reservations.getAiSpendStatusForOwner(db, JULY_2026);

    assert.equal(db.docs.get(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${reservedKey}`).status, "reserved");
    assert.equal(db.docs.get(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${startedKey}`).status, "provider_started");
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").reservedMicros, 20_000);
});

test("provider-claim win recovers conservatively after provider lease expiry", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const reservation = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["provider-claim-win"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const claimed = await reservations.claimAiSpendProviderStart(
        db,
        reservation,
        JULY_2026
    );

    await reservations.getAiSpendStatusForOwner(
        db,
        new Date("2026-07-10T13:06:00.000Z")
    );

    assert.equal(db.docs.get(claimed.reservationPath).status, "failed_conservative");
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").spentMicros, 10_000);
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").reservedMicros, 0);
});

test("malformed recovery leases and recovery-query failures block new provider work", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const badKey = reservations.stableIdempotencyKey(["bad", "lease"]);
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        reservedMicros: 10_000,
    }));
    db.docs.set(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${badKey}`, {
        feature: "semanticSearchRecipes",
        uid: "owner",
        idempotencyKey: badKey,
        periodKey: "2026-07",
        status: "reserved",
        reservationMicros: 10_000,
        estimatedInputTokens: 50,
        pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
        leaseExpiresAt: "not-a-date",
    });

    await assert.rejects(
        () => reservations.claimAiSpendProviderStart(db, {
            enabled: true,
            feature: "semanticSearchRecipes",
            idempotencyKey: badKey,
            reservationPath: `ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${badKey}`,
            reservationMicros: 10_000,
            shouldCallProvider: true,
        }, JULY_2026),
        /leaseExpiresAt/
    );

    const failingDb = new MemoryDb();
    failingDb.failQueries = true;
    await assert.rejects(
        () => reservations.reserveAiSpend({
            db: failingDb,
            uid: "owner",
            feature: "semanticSearchRecipes",
            idempotencyKey: reservations.stableIdempotencyKey(["query-failure"]),
            estimatedInputTokens: 50,
            now: JULY_2026,
        }),
        /recovery failed/
    );
});

test("malformed or missing open lease blocks a different new request before provider start", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    for (const leaseShape of ["missing", "wrong-type"]) {
        const db = new MemoryDb();
        const badKey = reservations.stableIdempotencyKey(["bad-cross-request-lease", leaseShape]);
        db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
            reservedMicros: 10_000,
        }));
        db.docs.set(`ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${badKey}`, {
            feature: "semanticSearchRecipes",
            uid: "owner",
            idempotencyKey: badKey,
            periodKey: "2026-07",
            status: "reserved",
            reservationMicros: 10_000,
            estimatedInputTokens: 50,
            pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
            ...(leaseShape === "wrong-type" ? { leaseExpiresAt: "not-a-date" } : {}),
        });

        await assert.rejects(
            () => reservations.reserveAiSpend({
                db,
                uid: "owner",
                feature: "semanticSearchRecipes",
                idempotencyKey: reservations.stableIdempotencyKey(["new-request", leaseShape]),
                estimatedInputTokens: 50,
                now: JULY_2026,
            }),
            /leaseExpiresAt/
        );
        assert.equal(
            [...db.docs.values()].some((doc) => doc.idempotencyKey ===
                reservations.stableIdempotencyKey(["new-request", leaseShape])),
            false
        );
    }
});

test("open reservation integrity scan accepts 10 fresh leases and fails closed at 11", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const reservationPath = (key) =>
        `ops/aiSpendCircuitBreaker/periods/2026-07/reservations/${key}`;
    const seedOpenReservations = (db, count) => {
        db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
            reservedMicros: count * 10_000,
        }));
        for (let index = 0; index < count; index += 1) {
            const key = reservations.stableIdempotencyKey(["open-boundary", count, index]);
            db.docs.set(reservationPath(key), {
                feature: "semanticSearchRecipes",
                uid: "owner",
                idempotencyKey: key,
                periodKey: "2026-07",
                status: index % 2 === 0 ? "reserved" : "provider_started",
                reservationMicros: 10_000,
                estimatedInputTokens: 50,
                pricingVersion: pricing.CURRENT_AI_SPEND_PRICING.version,
                leaseExpiresAt: new Date("2026-07-10T13:05:00.000Z"),
                providerStartedAt: index % 2 === 0 ? undefined : new Date("2026-07-10T12:00:00.000Z"),
            });
        }
    };

    const tenDb = new MemoryDb();
    seedOpenReservations(tenDb, 10);
    const accepted = await reservations.reserveAiSpend({
        db: tenDb,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["open-boundary-accepted"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    assert.equal(accepted.shouldCallProvider, true);

    const elevenDb = new MemoryDb();
    seedOpenReservations(elevenDb, 11);
    await assert.rejects(
        () => reservations.reserveAiSpend({
            db: elevenDb,
            uid: "owner",
            feature: "semanticSearchRecipes",
            idempotencyKey: reservations.stableIdempotencyKey(["open-boundary-rejected"]),
            estimatedInputTokens: 50,
            now: JULY_2026,
        }),
        /open AI spend reservations/
    );
});

test("disabled status and reservations do not query stale recovery state", async () => {
    const db = new MemoryDb();
    db.failQueries = true;

    const status = await reservations.getAiSpendStatusForOwner(db, JULY_2026);
    const reservation = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: "disabled-no-recovery-query",
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    assert.equal(status.enabled, false);
    assert.equal(reservation.enabled, false);
    assert.equal(db.docs.size, 0);
});

test("reconciliation keeps reservation as spent when usage metadata is missing", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const reservation = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["missing-metadata"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const providerReservation = await reservations.claimAiSpendProviderStart(
        db,
        reservation,
        JULY_2026
    );

    await reservations.reconcileAiSpendReservation(db, providerReservation, null, "success");

    const state = db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    assert.equal(state.spentMicros, 10_000);
    assert.equal(state.reservedMicros, 0);
});

test("reconciliation keeps reservation as spent when optional usage metadata is malformed", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    const reservation = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "generateMealPlan",
        idempotencyKey: reservations.stableIdempotencyKey(["bad-optional-metadata"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const providerReservation = await reservations.claimAiSpendProviderStart(
        db,
        reservation,
        JULY_2026
    );

    await reservations.reconcileAiSpendReservation(db, providerReservation, {
        promptTokenCount: 100,
        candidatesTokenCount: 1,
        toolUsePromptTokenCount: "1",
        totalTokenCount: 101,
    }, "success");

    const state = db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    assert.equal(state.spentMicros, 100_000);
    assert.equal(state.reservedMicros, 0);
});

test("reconciliation reaching ceiling preserves manual pause and queues automatic outbox only from active", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_980_000,
    }));
    const reservation = await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["reconcile-pause"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const providerReservation = await reservations.claimAiSpendProviderStart(
        db,
        reservation,
        JULY_2026
    );
    await reservations.reconcileAiSpendReservation(db, providerReservation, {
        promptTokenCount: 100_000,
    }, "success");

    const activeState = db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07");
    assert.equal(activeState.status, "paused");
    const activeOutbox = db.docs.get(
        "ops/emailOutbox/events/ai-spend-paused-2026-07-20000000"
    );
    assert.equal(activeOutbox.payload.spentMicros, 19_000_000);

    const manualDb = new MemoryDb();
    const manualReservation = await reservations.reserveAiSpend({
        db: manualDb,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["manual-state"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });
    const manualProviderReservation = await reservations.claimAiSpendProviderStart(
        manualDb,
        manualReservation,
        JULY_2026
    );
    manualDb.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", {
        ...manualDb.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07"),
        status: "manually_paused",
        spentMicros: 18_980_000,
    });
    await reservations.reconcileAiSpendReservation(manualDb, manualProviderReservation, {
        promptTokenCount: 100_000,
    }, "success");
    assert.equal(manualDb.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").status, "manually_paused");
    assert.equal(
        manualDb.docs.has("ops/emailOutbox/events/ai-spend-paused-2026-07-20000000"),
        false
    );
});

test("malformed operational state fails closed", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    for (const malformedState of [
        state({ status: "mystery" }),
        state({ spentMicros: -1 }),
        state({ spentMicros: "1000" }),
        state({ spentMicros: "" }),
        state({ reservedMicros: 1.5 }),
        state({ safetyReserveMicros: Number.MAX_SAFE_INTEGER + 1 }),
        state({ allowanceMicros: 20.5 }),
        state({ pricingVersion: "old-pricing" }),
    ]) {
        const db = new MemoryDb();
        db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", malformedState);
        await assert.rejects(
            () => reservations.reserveAiSpend({
                db,
                uid: "owner",
                feature: "semanticSearchRecipes",
                idempotencyKey: reservations.stableIdempotencyKey(["bad", malformedState]),
                estimatedInputTokens: 50,
                now: JULY_2026,
            }),
            /Malformed|pricing version/
        );
    }
});

test("owner status and mutation actions use deterministic periods", async () => {
    const db = new MemoryDb();
    const disabledStatus = await reservations.getAiSpendStatusForOwner(db, JULY_2026);
    assert.equal(disabledStatus.period.periodKey, "2026-07");
    assert.equal(disabledStatus.remainingMicros, 19_000_000);
    assert.equal(disabledStatus.lastPauseAtIso, null);
    assert.equal(disabledStatus.lastPauseReason, null);
    assert.equal(disabledStatus.lastPauseEmailStatus, "not_requested");

    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({ status: "active" }));
    const pauseKey = reservations.stableIdempotencyKey(["pause", "deterministic"]);
    const paused = await reservations.manuallyPauseAiSpendForOwner(
        db,
        "owner",
        pauseKey,
        JULY_2026
    );

    assert.equal(paused.period.periodKey, "2026-07");
    assert.equal(paused.status, "manually_paused");
    assert.equal(
        db.docs.has(`ops/aiSpendCircuitBreaker/periods/2026-07/audit/manual-pause-${pauseKey}`),
        true
    );
});

test("owner status returns sanitized automatic pause details and email status", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        spentMicros: 18_990_000,
    }));

    await reservations.reserveAiSpend({
        db,
        uid: "owner",
        feature: "semanticSearchRecipes",
        idempotencyKey: reservations.stableIdempotencyKey(["status-auto-pause"]),
        estimatedInputTokens: 50,
        now: JULY_2026,
    });

    const statePath = "ops/aiSpendCircuitBreaker/periods/2026-07";
    const outboxPath = "ops/emailOutbox/events/ai-spend-paused-2026-07-20000000";
    db.docs.set(statePath, {
        ...db.docs.get(statePath),
        pausedAt: new Date("2026-07-10T12:34:56.000Z"),
    });
    db.docs.set(outboxPath, {
        ...db.docs.get(outboxPath),
        status: "sent",
        provider: "not exposed",
        recipient: "owner@example.com",
    });

    const status = await reservations.getAiSpendStatusForOwner(db, JULY_2026);

    assert.equal(status.status, "paused");
    assert.equal(status.lastPauseAtIso, "2026-07-10T12:34:56.000Z");
    assert.equal(
        status.lastPauseReason,
        "reservation_would_reach_or_exceed_allowance"
    );
    assert.equal(status.lastPauseEmailStatus, "sent");
    assert.equal("lastPauseEmailEventId" in status, false);
    assert.equal("provider" in status, false);
    assert.equal("recipient" in status, false);
});

test("owner status returns sanitized manual pause details without email status", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({ status: "active" }));

    await reservations.manuallyPauseAiSpendForOwner(
        db,
        "owner",
        reservations.stableIdempotencyKey(["manual-status"]),
        JULY_2026
    );
    const statePath = "ops/aiSpendCircuitBreaker/periods/2026-07";
    db.docs.set(statePath, {
        ...db.docs.get(statePath),
        pausedAt: new Date("2026-07-10T13:00:00.000Z"),
    });

    const status = await reservations.getAiSpendStatusForOwner(db, JULY_2026);

    assert.equal(status.status, "manually_paused");
    assert.equal(status.lastPauseAtIso, "2026-07-10T13:00:00.000Z");
    assert.equal(status.lastPauseReason, "owner_manual_pause");
    assert.equal(status.lastPauseEmailStatus, "not_requested");
});

test("owner status whitelists outbox display states", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    for (const outboxStatus of [
        "pending_provider_setup",
        "pending",
        "sent",
        "failed",
        "unknown",
        "provider_secret_status",
    ]) {
        const db = new MemoryDb();
        db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
            status: "paused",
            pausedAt: new Date("2026-07-10T12:00:00.000Z"),
            pauseReason: "reconciled_usage_reached_or_exceeded_allowance",
            lastPauseEmailEventId: "ai-spend-paused-2026-07-20000000",
        }));
        db.docs.set("ops/emailOutbox/events/ai-spend-paused-2026-07-20000000", {
            status: outboxStatus,
        });

        const status = await reservations.getAiSpendStatusForOwner(db, JULY_2026);
        assert.equal(
            status.lastPauseEmailStatus,
            outboxStatus === "provider_secret_status" ? "unknown" : outboxStatus
        );
    }
});

test("malformed optional status metadata is sanitized without exposing raw values", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({
        status: "paused",
        pausedAt: "not-a-timestamp",
        pauseReason: "owner@example.com",
        lastPauseEmailEventId: "../provider/path",
    }));

    const status = await reservations.getAiSpendStatusForOwner(db, JULY_2026);

    assert.equal(status.status, "paused");
    assert.equal(status.lastPauseAtIso, null);
    assert.equal(status.lastPauseReason, null);
    assert.equal(status.lastPauseEmailStatus, "unknown");
});

test("owner resume only increments while paused and remains idempotent", async () => {
    process.env.AI_SPEND_CIRCUIT_BREAKER_ENABLED = "true";
    const db = new MemoryDb();
    db.docs.set("ops/aiSpendCircuitBreaker/periods/2026-07", state({ status: "paused" }));
    const resumeKey = reservations.stableIdempotencyKey(["resume", "one"]);
    const secondKey = reservations.stableIdempotencyKey(["resume", "two"]);

    const resumed = await reservations.resumeAiSpendForOwner(db, "owner", resumeKey, JULY_2026);
    const duplicate = await reservations.resumeAiSpendForOwner(db, "owner", resumeKey, JULY_2026);
    const activeRetry = await reservations.resumeAiSpendForOwner(db, "owner", secondKey, JULY_2026)
        .catch((error) => error);

    assert.equal(resumed.period.periodKey, "2026-07");
    assert.equal(resumed.allowanceMicros, 40_000_000);
    assert.equal(duplicate.allowanceMicros, 40_000_000);
    assert.equal(activeRetry.code, "failed-precondition");
    assert.equal(db.docs.get("ops/aiSpendCircuitBreaker/periods/2026-07").allowanceMicros, 40_000_000);
});

test("source gates all Gemini paths before provider execution", () => {
    const source = readFileSync(
        path.resolve(__dirname, "../src/index.ts"),
        "utf8"
    );
    assert.match(source, /stableIdempotencyKey\(\["disabled", feature, uid\]\)/);
    assert.doesNotMatch(source, /stableIdempotencyKey\(\[\s*feature,\s*uid,\s*request\.data/s);
    for (const marker of [
        "export const generateMealPlan",
        "export const parseRecipeFromImage",
        "export const generateRecipeEmbedding",
        "export const semanticSearchRecipes",
    ]) {
        const section = source.slice(source.indexOf(marker), source.indexOf("createGeminiClient", source.indexOf(marker)));
        assert.match(section, /reserveAiSpend/);
        assert.match(section, /assertSpendReservationAllowsProvider/);
    }
    const mealPlanSection = source.slice(
        source.indexOf("export const generateMealPlan"),
        source.indexOf("export const parseRecipeFromImage")
    );
    assert.match(mealPlanSection, /claimAiSpendProviderStart[\s\S]*generateContent/);

    const recipeImportSection = source.slice(
        source.indexOf("export const parseRecipeFromImage"),
        source.indexOf("export const generateRecipeEmbedding")
    );
    assert.match(recipeImportSection, /countTokens[\s\S]*claimAiSpendProviderStart[\s\S]*generateContent/);

    const embeddingSection = source.slice(
        source.indexOf("export const generateRecipeEmbedding"),
        source.indexOf("export const semanticSearchRecipes")
    );
    assert.match(embeddingSection, /claimAiSpendProviderStart[\s\S]*embedContent/);

    const searchSection = source.slice(
        source.indexOf("export const semanticSearchRecipes"),
        source.indexOf("export const getAiSpendStatus")
    );
    assert.match(searchSection, /claimAiSpendProviderStart[\s\S]*embedContent/);
});
