import { createHash } from "node:crypto";
import { HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import type { Transaction } from "firebase-admin/firestore";
import {
    AiSpendFeature,
    AiSpendUsageMetadata,
    CURRENT_AI_SPEND_PRICING,
    calculateUsageCostMicros,
} from "./aiSpendPricing";
import {
    AI_SPEND_PRE_PROVIDER_LEASE_MS,
    AI_SPEND_PROVIDER_STARTED_LEASE_MS,
    AI_SPEND_RECOVERY_BATCH_LIMIT,
    AI_SAFETY_RESERVE_MICROS,
    INITIAL_AI_ALLOWANCE_MICROS,
    OWNER_RESUME_INCREMENT_MICROS,
    getAiSpendFeaturePolicy,
    getPacificCalendarMonthPeriod,
    isAiSpendCircuitBreakerEnabled,
} from "./aiSpendPolicy";
import {
    PauseEmailDisplayStatus,
    queueAiSpendPauseEmail,
    readPauseEmailDisplayStatus,
} from "./emailOutbox";

type AiSpendStateStatus = "active" | "paused" | "manually_paused";
type ReservationStatus =
    | "reserved"
    | "provider_started"
    | "reconciled"
    | "failed_conservative"
    | "duplicate_closed"
    | "closed_without_charge";

export type AiSpendReservation = {
    enabled: boolean;
    feature: AiSpendFeature;
    idempotencyKey: string;
    reservationPath?: string;
    reservationMicros: number;
    shouldCallProvider: boolean;
    blockedReason?: "duplicate_closed" | "paused";
};

type ReserveRequest = {
    db: FirebaseFirestore.Firestore;
    feature: AiSpendFeature;
    uid: string;
    idempotencyKey: string;
    estimatedInputTokens: number;
    now?: Date;
};

type AiSpendState = {
    periodKey: string;
    status: AiSpendStateStatus;
    allowanceMicros: number;
    spentMicros: number;
    reservedMicros: number;
    safetyReserveMicros: number;
    pricingVersion: string;
};

type ParsedReservationData = FirebaseFirestore.DocumentData & {
    status: ReservationStatus;
    feature: AiSpendFeature;
    idempotencyKey: string;
    reservationMicros: number;
};

type PauseReason =
    | "reservation_would_exceed_allowance"
    | "reservation_would_reach_or_exceed_allowance"
    | "reconciled_usage_reached_or_exceeded_allowance"
    | "owner_manual_pause";

type SanitizedPauseDetails = {
    lastPauseAtIso: string | null;
    lastPauseReason: PauseReason | null;
    lastPauseEmailStatus: PauseEmailDisplayStatus;
};

export function stableIdempotencyKey(parts: unknown[]): string {
    const json = stableJson(parts);
    return createHash("sha256").update(json).digest("hex").slice(0, 48);
}

function stableJson(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableJson(item)).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
}

function statePath(periodKey: string): string {
    return `ops/aiSpendCircuitBreaker/periods/${periodKey}`;
}

function reservationPath(periodKey: string, idempotencyKey: string): string {
    return `${statePath(periodKey)}/reservations/${idempotencyKey}`;
}

function assertSafeDocumentId(value: string, label: string): void {
    if (!/^[a-f0-9]{32,64}$/.test(value)) {
        throw new HttpsError(
            "invalid-argument",
            `${label} must be a server-namespaced hash.`
        );
    }
}

function assertSafeMoney(value: unknown, field: string): number {
    if (typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 0) {
        throw new HttpsError(
            "failed-precondition",
            `Malformed AI spend state: ${field}.`
        );
    }
    return value;
}

function assertPositiveMoney(value: unknown, field: string): number {
    const amount = assertSafeMoney(value, field);
    if (amount <= 0) {
        throw new HttpsError(
            "failed-precondition",
            `Malformed AI spend state: ${field}.`
        );
    }
    return amount;
}

function checkedSubtractMicros(
    current: number,
    amount: number,
    field: string
): number {
    if (current < amount) {
        throw new HttpsError(
            "failed-precondition",
            `Malformed AI spend state: ${field} aggregate mismatch.`
        );
    }
    return current - amount;
}

function addMillis(date: Date, millis: number): Date {
    return new Date(date.getTime() + millis);
}

function assertSafeDateMillis(value: unknown, field: string): number {
    let date: Date | null = null;
    if (value instanceof Date) {
        date = value;
    } else if (value &&
        typeof value === "object" &&
        typeof (value as { toDate?: unknown }).toDate === "function") {
        const converted = (value as { toDate: () => unknown }).toDate();
        date = converted instanceof Date ? converted : null;
    }
    if (!date || Number.isNaN(date.getTime())) {
        throw new HttpsError(
            "failed-precondition",
            `Malformed AI spend reservation: ${field}.`
        );
    }
    return date.getTime();
}

function parseReservationStatus(value: unknown): ReservationStatus {
    if (value === "reserved" ||
        value === "provider_started" ||
        value === "reconciled" ||
        value === "failed_conservative" ||
        value === "duplicate_closed" ||
        value === "closed_without_charge") {
        return value;
    }
    throw new HttpsError(
        "failed-precondition",
        "Malformed AI spend reservation: status."
    );
}

function parseReservationData(
    periodKey: string,
    data: FirebaseFirestore.DocumentData
): ParsedReservationData {
    const status = parseReservationStatus(data.status);
    const feature = data.feature as AiSpendFeature;
    if (!getAiSpendFeaturePolicy(feature)) {
        throw new HttpsError(
            "failed-precondition",
            "Malformed AI spend reservation: feature."
        );
    }
    if (data.periodKey !== periodKey) {
        throw new HttpsError(
            "failed-precondition",
            "Malformed AI spend reservation: periodKey."
        );
    }
    if (data.pricingVersion !== CURRENT_AI_SPEND_PRICING.version) {
        throw new HttpsError(
            "failed-precondition",
            "AI spend reservation pricing version is incompatible with the runtime pricing table."
        );
    }
    const idempotencyKey = String(data.idempotencyKey || "");
    assertSafeDocumentId(idempotencyKey, "AI reservation idempotency key");
    return {
        ...data,
        status,
        feature,
        idempotencyKey,
        reservationMicros: assertPositiveMoney(
            data.reservationMicros,
            "reservationMicros"
        ),
    };
}

function terminalReservationData(
    reservationData: FirebaseFirestore.DocumentData,
    updates: Record<string, unknown>
) {
    const {
        leaseExpiresAt: _leaseExpiresAt,
        ...rest
    } = reservationData;
    return {
        ...rest,
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
    };
}

function auditPath(periodKey: string, auditId: string): string {
    return `${statePath(periodKey)}/audit/${auditId}`;
}

function defaultState(periodKey: string): AiSpendState {
    return {
        periodKey,
        status: "active",
        allowanceMicros: INITIAL_AI_ALLOWANCE_MICROS,
        spentMicros: 0,
        reservedMicros: 0,
        safetyReserveMicros: AI_SAFETY_RESERVE_MICROS,
        pricingVersion: CURRENT_AI_SPEND_PRICING.version,
    };
}

function parseState(periodKey: string, data: FirebaseFirestore.DocumentData):
AiSpendState {
    if (data.status !== "active" &&
        data.status !== "paused" &&
        data.status !== "manually_paused") {
        throw new HttpsError(
            "failed-precondition",
            "Malformed AI spend state: status."
        );
    }
    if (data.pricingVersion !== CURRENT_AI_SPEND_PRICING.version) {
        throw new HttpsError(
            "failed-precondition",
            "AI spend state pricing version is incompatible with the runtime pricing table."
        );
    }
    return {
        periodKey,
        status: data.status,
        allowanceMicros: assertSafeMoney(data.allowanceMicros, "allowanceMicros"),
        spentMicros: assertSafeMoney(data.spentMicros, "spentMicros"),
        reservedMicros: assertSafeMoney(data.reservedMicros, "reservedMicros"),
        safetyReserveMicros: assertSafeMoney(
            data.safetyReserveMicros,
            "safetyReserveMicros"
        ),
        pricingVersion: data.pricingVersion,
    };
}

function safeTimestampIso(value: unknown): string | null {
    let date: Date | null = null;
    if (value instanceof Date) {
        date = value;
    } else if (value &&
        typeof value === "object" &&
        typeof (value as { toDate?: unknown }).toDate === "function") {
        const converted = (value as { toDate: () => unknown }).toDate();
        date = converted instanceof Date ? converted : null;
    }
    if (!date || Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
}

function safePauseReason(value: unknown): PauseReason | null {
    if (value === "reservation_would_exceed_allowance" ||
        value === "reservation_would_reach_or_exceed_allowance" ||
        value === "reconciled_usage_reached_or_exceeded_allowance" ||
        value === "owner_manual_pause") {
        return value;
    }
    return null;
}

async function sanitizePauseDetails(
    db: FirebaseFirestore.Firestore,
    data: FirebaseFirestore.DocumentData | undefined,
    enabled: boolean
): Promise<SanitizedPauseDetails> {
    if (!enabled || !data) {
        return {
            lastPauseAtIso: null,
            lastPauseReason: null,
            lastPauseEmailStatus: "not_requested",
        };
    }
    return {
        lastPauseAtIso: safeTimestampIso(data.pausedAt),
        lastPauseReason: safePauseReason(data.pauseReason),
        lastPauseEmailStatus: await readPauseEmailDisplayStatus(
            db,
            data.lastPauseEmailEventId
        ),
    };
}

function writeState(
    transaction: Transaction,
    db: FirebaseFirestore.Firestore,
    state: AiSpendState,
    extra: Record<string, unknown> = {}
): void {
    transaction.set(
        db.doc(statePath(state.periodKey)),
        {
            ...state,
            updatedAt: FieldValue.serverTimestamp(),
            ...extra,
        },
        { merge: true }
    );
}

function assertReservationInput(request: ReserveRequest): void {
    const policy = getAiSpendFeaturePolicy(request.feature);
    if (!Number.isFinite(request.estimatedInputTokens) ||
        request.estimatedInputTokens < 0 ||
        request.estimatedInputTokens > policy.maxInputTokens) {
        throw new HttpsError(
            "invalid-argument",
            `${request.feature} input exceeds the configured AI spend policy.`
        );
    }
}

export async function reserveAiSpend(
    request: ReserveRequest
): Promise<AiSpendReservation> {
    const policy = getAiSpendFeaturePolicy(request.feature);
    if (!isAiSpendCircuitBreakerEnabled()) {
        return {
            enabled: false,
            feature: request.feature,
            idempotencyKey: request.idempotencyKey,
            reservationMicros: policy.reservationMicros,
            shouldCallProvider: true,
        };
    }

    assertReservationInput(request);
    assertSafeDocumentId(request.idempotencyKey, "AI request idempotency key");
    const now = request.now || new Date();
    const period = getPacificCalendarMonthPeriod(now);
    await recoverExpiredAiSpendReservations(
        request.db,
        period.periodKey,
        now
    );
    const stateRef = request.db.doc(statePath(period.periodKey));
    const reservationRef = request.db.doc(
        reservationPath(period.periodKey, request.idempotencyKey)
    );

    return request.db.runTransaction(async (transaction) => {
        const [stateSnapshot, reservationSnapshot] = await Promise.all([
            transaction.get(stateRef),
            transaction.get(reservationRef),
        ]);
        const state = stateSnapshot.exists ?
            parseState(period.periodKey, stateSnapshot.data() || {}) :
            defaultState(period.periodKey);

        if (reservationSnapshot.exists) {
            const reservation = reservationSnapshot.data() || {};
            const parsedReservation = parseReservationData(
                period.periodKey,
                reservation
            );
            if (parsedReservation.status === "reserved" ||
                parsedReservation.status === "provider_started") {
                throw new HttpsError(
                    "aborted",
                    "This AI request is already reserved or provider-started and in progress."
                );
            }
            return {
                enabled: true,
                feature: request.feature,
                idempotencyKey: request.idempotencyKey,
                reservationPath: reservationRef.path,
                reservationMicros: parsedReservation.reservationMicros,
                shouldCallProvider: false,
                blockedReason: "duplicate_closed",
            };
        }

        if (state.status !== "active") {
            throw new HttpsError(
                "resource-exhausted",
                "AI is paused by the spend circuit breaker."
            );
        }

        const spendCeilingMicros = state.allowanceMicros -
            state.safetyReserveMicros;
        const projectedMicros = state.spentMicros +
            state.reservedMicros +
            policy.reservationMicros;

        if (projectedMicros >= spendCeilingMicros) {
            const pausedState: AiSpendState = {
                ...state,
                status: "paused",
            };
            const emailEventId = queueAiSpendPauseEmail(transaction, request.db, {
                periodKey: state.periodKey,
                allowanceMicros: state.allowanceMicros,
                spentMicros: state.spentMicros,
                attemptedReservationMicros: policy.reservationMicros,
                pricingVersion: state.pricingVersion,
                reason: "reservation_would_reach_or_exceed_allowance",
            });
            writeState(transaction, request.db, pausedState, {
                pausedAt: FieldValue.serverTimestamp(),
                pauseReason: "reservation_would_reach_or_exceed_allowance",
                attemptedReservationMicros: policy.reservationMicros,
                lastPauseEmailEventId: emailEventId,
            });
            transaction.set(dbAuditRef(request.db, state.periodKey, emailEventId), {
                type: "auto_pause",
                feature: request.feature,
                idempotencyKey: request.idempotencyKey,
                createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            return {
                enabled: true,
                feature: request.feature,
                idempotencyKey: request.idempotencyKey,
                reservationMicros: policy.reservationMicros,
                shouldCallProvider: false,
                blockedReason: "paused" as const,
            };
        }

        writeState(transaction, request.db, {
            ...state,
            reservedMicros: state.reservedMicros + policy.reservationMicros,
        });
        transaction.set(reservationRef, {
            feature: request.feature,
            uid: request.uid,
            idempotencyKey: request.idempotencyKey,
            periodKey: state.periodKey,
            status: "reserved",
            reservationMicros: policy.reservationMicros,
            estimatedInputTokens: request.estimatedInputTokens,
            pricingVersion: state.pricingVersion,
            leaseExpiresAt: addMillis(now, AI_SPEND_PRE_PROVIDER_LEASE_MS),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return {
            enabled: true,
            feature: request.feature,
            idempotencyKey: request.idempotencyKey,
            reservationPath: reservationRef.path,
            reservationMicros: policy.reservationMicros,
            shouldCallProvider: true,
        };
    });
}

async function recoverExpiredAiSpendReservations(
    db: FirebaseFirestore.Firestore,
    periodKey: string,
    now: Date
): Promise<void> {
    try {
        const snapshot = await db
            .collection(`${statePath(periodKey)}/reservations`)
            .where("status", "in", ["reserved", "provider_started"])
            .limit(AI_SPEND_RECOVERY_BATCH_LIMIT + 1)
            .get();
        if (snapshot.docs.length > AI_SPEND_RECOVERY_BATCH_LIMIT) {
            throw new HttpsError(
                "failed-precondition",
                "Too many open AI spend reservations to recover safely."
            );
        }
        for (const reservationSnapshot of snapshot.docs) {
            const reservationData = parseReservationData(
                periodKey,
                reservationSnapshot.data() || {}
            );
            assertSafeDateMillis(reservationData.leaseExpiresAt, "leaseExpiresAt");
            await recoverOneExpiredAiSpendReservation(
                db,
                periodKey,
                reservationSnapshot.ref.path,
                now
            );
        }
    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            "failed-precondition",
            "AI spend reservation recovery failed before provider execution."
        );
    }
}

async function recoverOneExpiredAiSpendReservation(
    db: FirebaseFirestore.Firestore,
    periodKey: string,
    reservationDocPath: string,
    now: Date
): Promise<void> {
    await db.runTransaction(async (transaction) => {
        const reservationRef = db.doc(reservationDocPath);
        const reservationSnapshot = await transaction.get(reservationRef);
        if (!reservationSnapshot.exists) {
            return;
        }
        const reservationData = parseReservationData(
            periodKey,
            reservationSnapshot.data() || {}
        );

        if (reservationData.status !== "reserved" &&
            reservationData.status !== "provider_started") {
            if ("leaseExpiresAt" in reservationData) {
                transaction.set(
                    reservationRef,
                    terminalReservationData(reservationData, {}),
                );
            }
            return;
        }

        if (assertSafeDateMillis(reservationData.leaseExpiresAt, "leaseExpiresAt") >
            now.getTime()) {
            return;
        }

        const stateRef = db.doc(statePath(periodKey));
        const stateSnapshot = await transaction.get(stateRef);
        const state = stateSnapshot.exists ?
            parseState(periodKey, stateSnapshot.data() || {}) :
            defaultState(periodKey);
        const nextReservedMicros = checkedSubtractMicros(
            state.reservedMicros,
            reservationData.reservationMicros,
            "reservedMicros"
        );

        const auditId = stableIdempotencyKey([
            "ai-spend-recovery",
            periodKey,
            reservationData.idempotencyKey,
            reservationData.status,
        ]);
        transaction.set(dbAuditRef(db, periodKey, `recovery-${auditId}`), {
            type: "stale_reservation_recovery",
            feature: reservationData.feature,
            idempotencyKey: reservationData.idempotencyKey,
            previousStatus: reservationData.status,
            reservationMicros: reservationData.reservationMicros,
            createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        if (reservationData.status === "reserved") {
            writeState(transaction, db, {
                ...state,
                reservedMicros: nextReservedMicros,
            });
            transaction.set(reservationRef, terminalReservationData(
                reservationData,
                {
                    status: "closed_without_charge",
                    closeReason: "pre_provider_lease_expired",
                    billedMicros: 0,
                    recoveredAt: FieldValue.serverTimestamp(),
                }
            ));
            return;
        }

        const nextSpentMicros = state.spentMicros +
            reservationData.reservationMicros;
        const shouldPause = nextSpentMicros + nextReservedMicros >=
            state.allowanceMicros - state.safetyReserveMicros;
        const shouldTransitionToPaused = shouldPause && state.status === "active";
        const emailEventId = shouldTransitionToPaused ?
            queueAutomaticPause(
                transaction,
                db,
                state,
                nextSpentMicros,
                reservationData.reservationMicros,
                "reconciled_usage_reached_or_exceeded_allowance",
                reservationData.feature,
                reservationData.idempotencyKey
            ) :
            null;
        writeState(transaction, db, {
            ...state,
            status: shouldTransitionToPaused ? "paused" : state.status,
            spentMicros: nextSpentMicros,
            reservedMicros: nextReservedMicros,
        }, shouldTransitionToPaused ? {
                pausedAt: FieldValue.serverTimestamp(),
                pauseReason: "reconciled_usage_reached_or_exceeded_allowance",
                lastPauseEmailEventId: emailEventId,
            } : {});
        transaction.set(reservationRef, terminalReservationData(
            reservationData,
            {
                status: "failed_conservative",
                billedMicros: reservationData.reservationMicros,
                closeReason: "provider_started_lease_expired",
                recoveredAt: FieldValue.serverTimestamp(),
            }
        ));
    });
}

function queueAutomaticPause(
    transaction: Transaction,
    db: FirebaseFirestore.Firestore,
    state: AiSpendState,
    spentMicros: number,
    attemptedReservationMicros: number,
    reason: string,
    feature: AiSpendFeature,
    idempotencyKey: string
): string {
    const emailEventId = queueAiSpendPauseEmail(transaction, db, {
        periodKey: state.periodKey,
        allowanceMicros: state.allowanceMicros,
        spentMicros,
        attemptedReservationMicros,
        pricingVersion: state.pricingVersion,
        reason,
    });
    transaction.set(dbAuditRef(db, state.periodKey, emailEventId), {
        type: "auto_pause",
        feature,
        idempotencyKey,
        reason,
        createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return emailEventId;
}

function statusFromState(
    period: ReturnType<typeof getPacificCalendarMonthPeriod>,
    state: AiSpendState,
    enabled: boolean,
    pauseDetails: SanitizedPauseDetails
) {
    return {
        enabled,
        period,
        status: state.status,
        allowanceMicros: state.allowanceMicros,
        spentMicros: state.spentMicros,
        reservedMicros: state.reservedMicros,
        remainingMicros: Math.max(
            state.allowanceMicros -
            state.safetyReserveMicros -
            state.spentMicros -
            state.reservedMicros,
            0
        ),
        safetyReserveMicros: state.safetyReserveMicros,
        pricingVersion: state.pricingVersion,
        ...pauseDetails,
    };
}

function dbAuditRef(
    db: FirebaseFirestore.Firestore,
    periodKey: string,
    auditId: string
) {
    return db.doc(auditPath(periodKey, auditId));
}

function assertReservationDocumentPath(
    periodKey: string,
    reservationDocPath: string,
    reservationData: ParsedReservationData
): void {
    if (reservationDocPath !==
        reservationPath(periodKey, reservationData.idempotencyKey)) {
        throw new HttpsError(
            "failed-precondition",
            "AI spend reservation canonical path mismatch."
        );
    }
}

function assertReservationHandleMatchesStored(
    reservation: AiSpendReservation,
    periodKey: string,
    reservationDocPath: string,
    reservationData: ParsedReservationData
): void {
    assertReservationDocumentPath(periodKey, reservationDocPath, reservationData);
    if (reservation.feature !== reservationData.feature ||
        reservation.idempotencyKey !== reservationData.idempotencyKey ||
        reservation.reservationMicros !== reservationData.reservationMicros) {
        throw new HttpsError(
            "failed-precondition",
            "AI spend reservation handle does not match stored reservation."
        );
    }
}

function canonicalProviderStartedReservation(
    reservationDocPath: string,
    reservationData: ParsedReservationData
): AiSpendReservation {
    return {
        enabled: true,
        feature: reservationData.feature,
        idempotencyKey: reservationData.idempotencyKey,
        reservationPath: reservationDocPath,
        reservationMicros: reservationData.reservationMicros,
        shouldCallProvider: true,
    };
}

export async function claimAiSpendProviderStart(
    db: FirebaseFirestore.Firestore,
    reservation: AiSpendReservation,
    now: Date = new Date()
): Promise<AiSpendReservation> {
    if (!reservation.enabled || !reservation.reservationPath) {
        return reservation;
    }
    if (!reservation.shouldCallProvider) {
        throw new HttpsError(
            "aborted",
            "Duplicate AI request cannot start provider execution."
        );
    }

    return db.runTransaction(async (transaction) => {
        const reservationRef = db.doc(reservation.reservationPath as string);
        const reservationSnapshot = await transaction.get(reservationRef);
        if (!reservationSnapshot.exists) {
            throw new HttpsError("internal", "Missing AI spend reservation.");
        }
        const reservationData = parseReservationData(
            getPacificCalendarMonthPeriod(now).periodKey,
            reservationSnapshot.data() || {}
        );
        assertReservationHandleMatchesStored(
            reservation,
            reservationData.periodKey,
            reservationRef.path,
            reservationData
        );
        if (reservationData.status !== "reserved") {
            throw new HttpsError(
                "aborted",
                "AI spend reservation is not eligible for provider execution."
            );
        }
        if (assertSafeDateMillis(reservationData.leaseExpiresAt, "leaseExpiresAt") <=
            now.getTime()) {
            throw new HttpsError(
                "aborted",
                "AI spend reservation lease expired before provider execution."
            );
        }
        transaction.set(reservationRef, {
            ...reservationData,
            status: "provider_started",
            providerStartedAt: now,
            leaseExpiresAt: addMillis(
                now,
                AI_SPEND_PROVIDER_STARTED_LEASE_MS
            ),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return canonicalProviderStartedReservation(
            reservationRef.path,
            reservationData
        );
    });
}

export async function reconcileAiSpendReservation(
    db: FirebaseFirestore.Firestore,
    reservation: AiSpendReservation,
    metadata: AiSpendUsageMetadata | null | undefined,
    status: "success" | "provider_error" = "success"
): Promise<void> {
    if (!reservation.enabled || !reservation.reservationPath) {
        return;
    }

    await db.runTransaction(async (transaction) => {
        const reservationRef = db.doc(reservation.reservationPath as string);
        const reservationSnapshot = await transaction.get(reservationRef);
        if (!reservationSnapshot.exists) {
            throw new HttpsError("internal", "Missing AI spend reservation.");
        }
        const reservationData = reservationSnapshot.data() || {};
        if (reservationData.status === "reconciled" ||
            reservationData.status === "failed_conservative" ||
            reservationData.status === "closed_without_charge" ||
            reservationData.status === "duplicate_closed") {
            return;
        }
        if (reservationData.status !== "provider_started") {
            throw new HttpsError(
                "failed-precondition",
                "AI spend provider-start claim is required before reconciliation."
            );
        }

        const periodKey = String(reservationData.periodKey);
        const parsedReservation = parseReservationData(periodKey, reservationData);
        assertReservationDocumentPath(periodKey, reservationRef.path, parsedReservation);
        const stateRef = db.doc(statePath(periodKey));
        const stateSnapshot = await transaction.get(stateRef);
        const state = stateSnapshot.exists ?
            parseState(periodKey, stateSnapshot.data() || {}) :
            defaultState(periodKey);

        const calculatedCost = status === "success" ?
            calculateUsageCostMicros(parsedReservation.feature, metadata) :
            null;
        const billedMicros = calculatedCost === null ?
            parsedReservation.reservationMicros :
            Math.max(calculatedCost, 0);
        const nextSpentMicros = state.spentMicros + billedMicros;
        const nextReservedMicros = checkedSubtractMicros(
            state.reservedMicros,
            parsedReservation.reservationMicros,
            "reservedMicros"
        );
        const shouldPause = nextSpentMicros + nextReservedMicros >=
            state.allowanceMicros - state.safetyReserveMicros;
        const shouldTransitionToPaused = shouldPause && state.status === "active";
        const nextStatus = shouldTransitionToPaused ? "paused" : state.status;
        const emailEventId = shouldTransitionToPaused ?
            queueAutomaticPause(
                transaction,
                db,
                state,
                nextSpentMicros,
                parsedReservation.reservationMicros,
                "reconciled_usage_reached_or_exceeded_allowance",
                parsedReservation.feature,
                parsedReservation.idempotencyKey
            ) :
            null;

        writeState(transaction, db, {
            ...state,
            status: nextStatus,
            spentMicros: nextSpentMicros,
            reservedMicros: nextReservedMicros,
        }, shouldTransitionToPaused ? {
                pausedAt: FieldValue.serverTimestamp(),
                pauseReason: "reconciled_usage_reached_or_exceeded_allowance",
                lastPauseEmailEventId: emailEventId,
            } : {});
        transaction.set(reservationRef, terminalReservationData(reservationData, {
            status: status === "success" ?
                "reconciled" :
                "failed_conservative",
            billedMicros,
            usageMetadata: metadata || null,
        }));
    });
}

export async function closeAiSpendReservationWithoutCharge(
    db: FirebaseFirestore.Firestore,
    reservation: AiSpendReservation,
    reason: string
): Promise<void> {
    if (!reservation.enabled || !reservation.reservationPath) {
        return;
    }

    await db.runTransaction(async (transaction) => {
        const reservationRef = db.doc(reservation.reservationPath as string);
        const reservationSnapshot = await transaction.get(reservationRef);
        if (!reservationSnapshot.exists) {
            throw new HttpsError("internal", "Missing AI spend reservation.");
        }
        const reservationData = reservationSnapshot.data() || {};
        if (reservationData.status !== "reserved") {
            return;
        }
        const periodKey = String(reservationData.periodKey);
        const parsedReservation = parseReservationData(periodKey, reservationData);
        const stateRef = db.doc(statePath(periodKey));
        const stateSnapshot = await transaction.get(stateRef);
        const state = stateSnapshot.exists ?
            parseState(periodKey, stateSnapshot.data() || {}) :
            defaultState(periodKey);
        writeState(transaction, db, {
            ...state,
            reservedMicros: checkedSubtractMicros(
                state.reservedMicros,
                parsedReservation.reservationMicros,
                "reservedMicros"
            ),
        });
        transaction.set(reservationRef, terminalReservationData(reservationData, {
            status: "closed_without_charge",
            closeReason: reason,
            billedMicros: 0,
        }));
    });
}

export async function getAiSpendStatusForOwner(
    db: FirebaseFirestore.Firestore,
    now?: Date
) {
    const effectiveNow = now || new Date();
    const period = getPacificCalendarMonthPeriod(effectiveNow);
    if (!isAiSpendCircuitBreakerEnabled()) {
        return {
            enabled: false,
            period,
            status: "disabled",
            allowanceMicros: INITIAL_AI_ALLOWANCE_MICROS,
            spentMicros: 0,
            reservedMicros: 0,
            remainingMicros: INITIAL_AI_ALLOWANCE_MICROS -
                AI_SAFETY_RESERVE_MICROS,
            safetyReserveMicros: AI_SAFETY_RESERVE_MICROS,
            pricingVersion: CURRENT_AI_SPEND_PRICING.version,
            lastPauseAtIso: null,
            lastPauseReason: null,
            lastPauseEmailStatus: "not_requested" as const,
        };
    }

    await recoverExpiredAiSpendReservations(db, period.periodKey, effectiveNow);
    const snapshot = await db.doc(statePath(period.periodKey)).get();
    const rawData = snapshot.data();
    const state = snapshot.exists ?
        parseState(period.periodKey, rawData || {}) :
        defaultState(period.periodKey);
    return statusFromState(
        period,
        state,
        true,
        await sanitizePauseDetails(db, rawData, true)
    );
}

export async function resumeAiSpendForOwner(
    db: FirebaseFirestore.Firestore,
    uid: string,
    idempotencyKey: string,
    now?: Date
) {
    if (!isAiSpendCircuitBreakerEnabled()) {
        throw new HttpsError(
            "failed-precondition",
            "AI spend circuit breaker is disabled."
        );
    }
    assertSafeDocumentId(idempotencyKey, "Resume idempotency key");
    const period = getPacificCalendarMonthPeriod(now);
    const stateRef = db.doc(statePath(period.periodKey));
    const auditRef = db.doc(auditPath(period.periodKey, `resume-${idempotencyKey}`));

    return db.runTransaction(async (transaction) => {
        const [stateSnapshot, auditSnapshot] = await Promise.all([
            transaction.get(stateRef),
            transaction.get(auditRef),
        ]);
        const state = stateSnapshot.exists ?
            parseState(period.periodKey, stateSnapshot.data() || {}) :
            defaultState(period.periodKey);
        if (auditSnapshot.exists) {
            return statusFromState(period, state, true, {
                lastPauseAtIso: null,
                lastPauseReason: null,
                lastPauseEmailStatus: "unknown",
            });
        }
        if (state.status !== "paused" && state.status !== "manually_paused") {
            throw new HttpsError(
                "failed-precondition",
                "AI spend allowance can only be resumed from a paused state."
            );
        }
        const nextState: AiSpendState = {
            ...state,
            status: "active",
            allowanceMicros: state.allowanceMicros +
                OWNER_RESUME_INCREMENT_MICROS,
        };
        writeState(transaction, db, nextState, {
            resumedAt: FieldValue.serverTimestamp(),
            resumedBy: uid,
        });
        transaction.set(auditRef, {
            type: "owner_resume",
            uid,
            incrementMicros: OWNER_RESUME_INCREMENT_MICROS,
            idempotencyKey,
            createdAt: FieldValue.serverTimestamp(),
        });
        return statusFromState(period, nextState, true, {
            lastPauseAtIso: null,
            lastPauseReason: null,
            lastPauseEmailStatus: "not_requested",
        });
    });
}

export async function manuallyPauseAiSpendForOwner(
    db: FirebaseFirestore.Firestore,
    uid: string,
    idempotencyKey: string,
    now?: Date
) {
    if (!isAiSpendCircuitBreakerEnabled()) {
        throw new HttpsError(
            "failed-precondition",
            "AI spend circuit breaker is disabled."
        );
    }
    assertSafeDocumentId(idempotencyKey, "Manual pause idempotency key");
    const period = getPacificCalendarMonthPeriod(now);
    const stateRef = db.doc(statePath(period.periodKey));
    const auditRef = db.doc(auditPath(period.periodKey, `manual-pause-${idempotencyKey}`));

    return db.runTransaction(async (transaction) => {
        const [stateSnapshot, auditSnapshot] = await Promise.all([
            transaction.get(stateRef),
            transaction.get(auditRef),
        ]);
        const state = stateSnapshot.exists ?
            parseState(period.periodKey, stateSnapshot.data() || {}) :
            defaultState(period.periodKey);
        if (state.status !== "active" && !auditSnapshot.exists) {
            throw new HttpsError(
                "failed-precondition",
                "AI spend can only be manually paused from an active state."
            );
        }
        if (!auditSnapshot.exists) {
            writeState(transaction, db, {
                ...state,
                status: "manually_paused",
            }, {
                pausedAt: FieldValue.serverTimestamp(),
                pausedBy: uid,
                pauseReason: "owner_manual_pause",
            });
            transaction.set(auditRef, {
                type: "owner_manual_pause",
                uid,
                idempotencyKey,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
        const nextState: AiSpendState = auditSnapshot.exists ?
            state :
            {
                ...state,
                status: "manually_paused",
            };
        return statusFromState(period, nextState, true, {
            lastPauseAtIso: null,
            lastPauseReason: auditSnapshot.exists ? null : "owner_manual_pause",
            lastPauseEmailStatus: "not_requested",
        });
    });
}
