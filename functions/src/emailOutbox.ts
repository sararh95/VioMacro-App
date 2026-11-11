import { FieldValue } from "firebase-admin/firestore";
import type { Transaction } from "firebase-admin/firestore";

export const EMAIL_OUTBOX_COLLECTION = "ops/emailOutbox/events";

export type PauseEmailDisplayStatus =
    | "not_requested"
    | "pending_provider_setup"
    | "pending"
    | "sent"
    | "failed"
    | "unknown";

export type PauseEmailOutboxPayload = {
    periodKey: string;
    allowanceMicros: number;
    spentMicros: number;
    attemptedReservationMicros: number;
    pricingVersion: string;
    reason: string;
};

export function buildPauseEmailOutboxId(
    periodKey: string,
    allowanceMicros: number
): string {
    return `ai-spend-paused-${periodKey}-${allowanceMicros}`;
}

export function queueAiSpendPauseEmail(
    transaction: Transaction,
    db: FirebaseFirestore.Firestore,
    payload: PauseEmailOutboxPayload
): string {
    const eventId = buildPauseEmailOutboxId(
        payload.periodKey,
        payload.allowanceMicros
    );
    transaction.set(
        db.doc(`${EMAIL_OUTBOX_COLLECTION}/${eventId}`),
        {
            type: "ai_spend_paused",
            eventId,
            status: "pending_provider_setup",
            provider: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            payload,
        },
        { merge: true }
    );
    return eventId;
}

function sanitizePauseEmailStatus(value: unknown): PauseEmailDisplayStatus {
    if (value === "pending_provider_setup" ||
        value === "pending" ||
        value === "sent" ||
        value === "failed") {
        return value;
    }
    return "unknown";
}

export async function readPauseEmailDisplayStatus(
    db: FirebaseFirestore.Firestore,
    eventId: unknown
): Promise<PauseEmailDisplayStatus> {
    if (eventId === undefined || eventId === null || eventId === "") {
        return "not_requested";
    }
    if (typeof eventId !== "string" ||
        !/^ai-spend-paused-\d{4}-\d{2}-\d+$/.test(eventId)) {
        return "unknown";
    }
    const snapshot = await db.doc(`${EMAIL_OUTBOX_COLLECTION}/${eventId}`).get();
    if (!snapshot.exists) {
        return "unknown";
    }
    return sanitizePauseEmailStatus(snapshot.data()?.status);
}
