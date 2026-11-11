import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase/firebase';

export type AiSpendStatusCode = 'disabled' | 'active' | 'paused' | 'manually_paused';
export type AiSpendPauseReason =
    | 'reservation_would_exceed_allowance'
    | 'reservation_would_reach_or_exceed_allowance'
    | 'reconciled_usage_reached_or_exceeded_allowance'
    | 'owner_manual_pause';
export type AiSpendEmailStatus =
    | 'not_requested'
    | 'pending_provider_setup'
    | 'pending'
    | 'sent'
    | 'failed'
    | 'unknown';

export interface AiSpendPeriod {
    periodKey: string;
    startsAtIso: string;
    endsAtIso: string;
}

export interface AiSpendStatus {
    enabled: boolean;
    period: AiSpendPeriod;
    status: AiSpendStatusCode;
    allowanceMicros: number;
    spentMicros: number;
    reservedMicros: number;
    remainingMicros: number;
    safetyReserveMicros: number;
    pricingVersion: string;
    lastPauseAtIso: string | null;
    lastPauseReason: AiSpendPauseReason | null;
    lastPauseEmailStatus: AiSpendEmailStatus;
}

function cryptoBytes(byteCount: number): Uint8Array {
    if (typeof globalThis.crypto?.getRandomValues !== 'function') {
        throw new Error('Browser cryptographic randomness is unavailable.');
    }
    return globalThis.crypto.getRandomValues(new Uint8Array(byteCount));
}

export function createAiCallableRequestId(prefix = 'ai'): string {
    const bytes = cryptoBytes(16);
    const hex = Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    return `${prefix}:${hex}`;
}

async function callAiSpendStatus(
    callableName: 'getAiSpendStatus' | 'manualPauseAiSpend' | 'resumeAiSpendAllowance',
    payload: Record<string, unknown> = {}
): Promise<AiSpendStatus> {
    const callable = httpsCallable<Record<string, unknown>, AiSpendStatus>(
        functions,
        callableName
    );
    const result = await callable(payload);
    return result.data;
}

export function getAiSpendStatus(): Promise<AiSpendStatus> {
    return callAiSpendStatus('getAiSpendStatus');
}

export function manualPauseAiSpend(): Promise<AiSpendStatus> {
    return callAiSpendStatus('manualPauseAiSpend', {
        idempotencyKey: createAiCallableRequestId('manual-pause'),
    });
}

export function resumeAiSpendAllowance(): Promise<AiSpendStatus> {
    return callAiSpendStatus('resumeAiSpendAllowance', {
        idempotencyKey: createAiCallableRequestId('resume'),
    });
}
