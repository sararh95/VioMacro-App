let pending = 0;
const listeners = new Set<() => void>();

export const getPendingSaveCount = () => pending;

export function subscribePendingSaves(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

function notify() {
    for (const listener of listeners) {
        try { listener(); }
        catch (error) { console.error('Pending save listener failed', error); }
    }
}

export function trackSave<T>(promise: Promise<T>, onPending?: () => void): Promise<T> {
    pending++;
    // Let a waiting modal uncover the shell notice without losing its draft.
    const timer = onPending ? setTimeout(onPending, 1500) : undefined;
    const settled = () => {
        clearTimeout(timer);
        pending--;
        notify();
    };
    // Two handlers avoid the unhandled rejected promise that finally() creates.
    void promise.then(settled, settled);
    notify();
    return promise;
}

export function createOptimisticSaves<T>(saved: T) {
    type Update = { apply: (value: T) => T; accepted: boolean | null };
    const updates: Update[] = [];
    const value = () => updates.reduce((current, update) =>
        update.accepted === false ? current : update.apply(current), saved);

    return {
        value,
        pending: () => updates.length > 0,
        add(apply: (value: T) => T) {
            const update: Update = { apply, accepted: null };
            updates.push(update);
            return update;
        },
        settle(update: Update, accepted: boolean) {
            update.accepted = accepted;
            // Fold settled writes in submission order, including late answers.
            while (updates.length > 0 && updates[0].accepted !== null) {
                const first = updates.shift()!;
                if (first.accepted) saved = first.apply(saved);
            }
            return value();
        },
    };
}
