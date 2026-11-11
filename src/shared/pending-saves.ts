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

export function trackSave<T>(promise: Promise<T>): Promise<T> {
    pending++;
    const settled = () => { pending--; notify(); };
    // Two handlers avoid the unhandled rejected promise that finally() creates.
    void promise.then(settled, settled);
    notify();
    return promise;
}
