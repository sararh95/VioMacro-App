import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CircleDollarSign,
    Loader2,
    LockKeyhole,
    PauseCircle,
    RotateCw,
    ShieldCheck,
} from 'lucide-react';
import {
    type AiSpendPauseReason,
    type AiSpendStatus,
    getAiSpendStatus,
    manualPauseAiSpend,
    resumeAiSpendAllowance,
} from '../../services/aiSpendService';

type LoadState = 'loading' | 'ready' | 'owner-denied' | 'unavailable';
type PendingAction = 'pause' | 'resume' | null;
type ConfirmAction = Exclude<PendingAction, null>;
type FirebaseLikeError = {
    code?: string;
    message?: string;
};

const RESUME_INCREMENT_MICROS = 20_000_000;

function formatUsdMicros(value: number) {
    if (!Number.isFinite(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.max(value, 0) / 1_000_000);
}

function formatPeriod(status: AiSpendStatus) {
    const start = new Date(status.period.startsAtIso);
    const end = new Date(status.period.endsAtIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return status.period.periodKey;
    }
    return `${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
    })} - ${end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
    })} PT`;
}

function formatPauseReason(reason: AiSpendPauseReason | null) {
    switch (reason) {
        case 'owner_manual_pause':
            return 'Manual owner pause';
        case 'reservation_would_exceed_allowance':
        case 'reservation_would_reach_or_exceed_allowance':
            return 'Next reservation would exceed allowance';
        case 'reconciled_usage_reached_or_exceeded_allowance':
            return 'Usage reached allowance after reconciliation';
        default:
            return 'Not available';
    }
}

function isOwnerDeniedError(error: FirebaseLikeError): boolean {
    return error.code === 'permission-denied' ||
        error.code === 'functions/permission-denied';
}

function statusCopy(status: AiSpendStatus | null) {
    if (!status) {
        return {
            label: 'Unavailable',
            tone: 'text-text-secondary',
            message: 'Spend status has not loaded yet.',
        };
    }
    if (!status.enabled) {
        return {
            label: 'Disabled',
            tone: 'text-text-secondary',
            message: 'AI spend controls are currently disabled.',
        };
    }
    if (status.status === 'paused') {
        return {
            label: 'Paused automatically',
            tone: 'text-amber-300',
            message: 'AI calls are stopped. Non-AI VioMacro workflows remain available.',
        };
    }
    if (status.status === 'manually_paused') {
        return {
            label: 'Paused manually',
            tone: 'text-amber-300',
            message: 'AI calls are stopped until the owner grants another allowance.',
        };
    }
    const remainingRatio = status.allowanceMicros > 0 ?
        status.remainingMicros / status.allowanceMicros :
        0;
    if (status.remainingMicros <= 2_000_000 || remainingRatio <= 0.1) {
        return {
            label: 'Approaching limit',
            tone: 'text-yellow-300',
            message: 'The remaining allowance is low; the next unsafe AI call will pause first.',
        };
    }
    return {
        label: 'Active',
        tone: 'text-emerald-300',
        message: 'AI calls can proceed while server-side allowance remains available.',
    };
}

function StatCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-h-[74px] rounded-lg border border-surface-border bg-background-dark p-3">
            <dt className="text-[11px] font-bold uppercase text-text-secondary">{label}</dt>
            <dd className="mt-1 break-words text-base font-black text-white">{value}</dd>
        </div>
    );
}

export default function AiSpendSafetyPanel() {
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const [status, setStatus] = useState<AiSpendStatus | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
        setLoadState('loading');
        setNotice(null);
        try {
            const nextStatus = await getAiSpendStatus();
            setStatus(nextStatus);
            setLoadState('ready');
        } catch (error: unknown) {
            const firebaseError = error as FirebaseLikeError;
            setStatus(null);
            setLoadState(isOwnerDeniedError(firebaseError) ? 'owner-denied' : 'unavailable');
        }
    }, []);

    useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    const copy = useMemo(() => statusCopy(status), [status]);
    const canPause = loadState === 'ready' && status?.enabled && status.status === 'active' && !pendingAction;
    const canResume = loadState === 'ready' &&
        status?.enabled &&
        (status.status === 'paused' || status.status === 'manually_paused') &&
        !pendingAction;

    const runMutation = async (action: ConfirmAction) => {
        setConfirmAction(null);
        setPendingAction(action);
        setNotice(null);
        try {
            if (action === 'pause') {
                await manualPauseAiSpend();
            } else {
                await resumeAiSpendAllowance();
            }
            const nextStatus = await getAiSpendStatus();
            setStatus(nextStatus);
            setLoadState('ready');
            setNotice(action === 'pause' ? 'Manual pause confirmed.' : 'Allowance refreshed.');
        } catch (error: unknown) {
            const firebaseError = error as FirebaseLikeError;
            setStatus(null);
            setLoadState(isOwnerDeniedError(firebaseError) ? 'owner-denied' : 'unavailable');
            setNotice(null);
        } finally {
            setPendingAction(null);
        }
    };

    if (loadState === 'owner-denied') {
        return (
            <section className="rounded-lg border border-surface-border bg-surface-dark p-6" aria-labelledby="ai-safety-heading">
                <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-1 size-5 shrink-0 text-text-secondary" aria-hidden="true" />
                    <div>
                        <h2 id="ai-safety-heading" className="text-xl font-black text-white">AI Spend Safety</h2>
                        <p className="mt-2 text-sm text-text-secondary">Owner authorization is required to view AI spend controls.</p>
                    </div>
                </div>
            </section>
        );
    }

    if (loadState === 'unavailable') {
        return (
            <section className="rounded-lg border border-surface-border bg-surface-dark p-6" aria-labelledby="ai-safety-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-1 size-5 shrink-0 text-yellow-300" aria-hidden="true" />
                        <div>
                            <h2 id="ai-safety-heading" className="text-xl font-black text-white">AI Spend Safety</h2>
                            <p className="mt-2 text-sm text-text-secondary">Spend status could not be verified, so owner actions are unavailable.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadStatus()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-surface-border px-4 text-sm font-bold text-white hover:bg-white/5"
                    >
                        <RotateCw className="size-4" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-surface-border bg-surface-dark p-4 sm:p-6" aria-labelledby="ai-safety-heading">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                        <h2 id="ai-safety-heading" className="text-xl font-black text-white">AI Spend Safety</h2>
                        <p className="mt-2 text-sm text-text-secondary">{copy.message}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex h-9 items-center rounded-lg border border-surface-border bg-background-dark px-3 text-sm font-black ${copy.tone}`}>
                        {loadState === 'loading' ? 'Loading' : copy.label}
                    </span>
                    <button
                        type="button"
                        onClick={() => void loadStatus()}
                        disabled={loadState === 'loading' || Boolean(pendingAction)}
                        aria-label="Refresh AI spend status"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadState === 'loading' ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <RotateCw className="size-4" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {notice && (
                <p className="mt-4 text-sm font-bold text-primary" role="status" aria-live="polite">{notice}</p>
            )}

            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCell label="Allowance" value={status ? formatUsdMicros(status.allowanceMicros) : '-'} />
                <StatCell label="Estimated spent" value={status ? formatUsdMicros(status.spentMicros) : '-'} />
                <StatCell label="Reserved" value={status ? formatUsdMicros(status.reservedMicros) : '-'} />
                <StatCell label="Remaining" value={status ? formatUsdMicros(status.remainingMicros) : '-'} />
            </dl>

            <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <StatCell label="Pacific period" value={status ? formatPeriod(status) : '-'} />
                <StatCell label="Pricing version" value={status?.pricingVersion || '-'} />
                <StatCell
                    label="Last pause"
                    value={status?.lastPauseAtIso ? new Date(status.lastPauseAtIso).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'America/Los_Angeles',
                    }) : 'Not available'}
                />
                <StatCell label="Pause reason" value={formatPauseReason(status?.lastPauseReason || null)} />
                <StatCell label="Safety reserve" value={status ? formatUsdMicros(status.safetyReserveMicros) : '-'} />
            </dl>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    disabled={!canPause}
                    onClick={() => setConfirmAction('pause')}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-yellow-400/50 px-4 text-sm font-black text-yellow-100 hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {pendingAction === 'pause' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <PauseCircle className="size-4" aria-hidden="true" />}
                    Manual pause
                </button>
                <button
                    type="button"
                    disabled={!canResume}
                    onClick={() => setConfirmAction('resume')}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {pendingAction === 'resume' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CircleDollarSign className="size-4" aria-hidden="true" />}
                    Resume with another {formatUsdMicros(RESUME_INCREMENT_MICROS)}
                </button>
            </div>

            {confirmAction && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="ai-spend-confirm-heading">
                    <div className="w-full max-w-md rounded-lg border border-surface-border bg-background-dark p-6 shadow-2xl">
                        <h3 id="ai-spend-confirm-heading" className="text-xl font-black text-white">
                            {confirmAction === 'pause' ? 'Pause AI now?' : 'Grant another allowance?'}
                        </h3>
                        <p className="mt-3 text-sm text-text-secondary">
                            {confirmAction === 'pause'
                                ? 'AI calls will stop after the server confirms the manual pause.'
                                : `The server will add ${formatUsdMicros(RESUME_INCREMENT_MICROS)} to the current approved AI allowance.`}
                        </p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="h-10 rounded-lg border border-surface-border px-4 text-sm font-bold text-white hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void runMutation(confirmAction)}
                                className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white hover:bg-primary-hover"
                            >
                                {confirmAction === 'pause' ? 'Confirm manual pause' : `Resume with another ${formatUsdMicros(RESUME_INCREMENT_MICROS)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
