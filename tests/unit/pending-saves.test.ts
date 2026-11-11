import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { getPendingSaveCount, subscribePendingSaves, trackSave } from '../../src/shared/pending-saves.ts';

function deferred<T = void>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

afterEach(() => assert.equal(getPendingSaveCount(), 0, 'no settled save may stay pending'));

test('returns the original promise and counts it until fulfillment', async () => {
    const save = deferred<string>();
    assert.equal(getPendingSaveCount(), 0);
    assert.equal(trackSave(save.promise), save.promise);
    assert.equal(getPendingSaveCount(), 1);
    save.resolve('saved');
    assert.equal(await save.promise, 'saved');
    assert.equal(getPendingSaveCount(), 0);
});

test('rejection keeps the original error and clears the count without an unhandled rejection', async () => {
    const save = deferred();
    const error = new Error('refused');
    assert.equal(trackSave(save.promise), save.promise);
    assert.equal(getPendingSaveCount(), 1);
    save.reject(error);
    await assert.rejects(save.promise, failure => failure === error);
    assert.equal(getPendingSaveCount(), 0);
});

test('several saves settle independently in any order, including failures', async () => {
    const saves = [deferred(), deferred(), deferred()];
    saves.forEach(save => trackSave(save.promise));
    assert.equal(getPendingSaveCount(), 3);
    saves[1].resolve();
    await saves[1].promise;
    assert.equal(getPendingSaveCount(), 2);
    saves[0].reject(new Error('denied'));
    await assert.rejects(saves[0].promise, /denied/);
    assert.equal(getPendingSaveCount(), 1);
    saves[2].resolve();
    await saves[2].promise;
    assert.equal(getPendingSaveCount(), 0);
});

test('subscribers can read every count change', async () => {
    const counts: number[] = [];
    const unsubscribe = subscribePendingSaves(() => counts.push(getPendingSaveCount()));
    try {
        const first = deferred();
        const second = deferred();
        trackSave(first.promise);
        trackSave(second.promise);
        first.resolve();
        await first.promise;
        second.reject(new Error('refused'));
        await assert.rejects(second.promise);
        assert.deepEqual(counts, [1, 2, 1, 0]);
    } finally {
        unsubscribe();
    }
});

test('unsubscribe stops notifications without interrupting pending saves', async () => {
    let calls = 0;
    const unsubscribe = subscribePendingSaves(() => { calls++; });
    const save = deferred();
    trackSave(save.promise);
    unsubscribe();
    unsubscribe();
    save.resolve();
    await save.promise;
    await trackSave(Promise.resolve());
    assert.equal(calls, 1);
    assert.equal(getPendingSaveCount(), 0);
});

test('already settled promises and a new save after rejection never leave a stuck count', async () => {
    const fulfilled = Promise.resolve('saved');
    const rejected = Promise.reject(new Error('refused'));
    await Promise.allSettled([fulfilled, rejected]);
    trackSave(fulfilled);
    trackSave(rejected);
    assert.equal(getPendingSaveCount(), 2);
    await Promise.allSettled([fulfilled, rejected]);
    assert.equal(getPendingSaveCount(), 0);
    await trackSave(Promise.resolve());
    assert.equal(getPendingSaveCount(), 0);
});

test('a faulty subscriber cannot break tracking or other subscribers', async (t) => {
    t.mock.method(console, 'error', () => {});
    const faulty = subscribePendingSaves(() => { throw new Error('listener failed'); });
    const counts: number[] = [];
    const working = subscribePendingSaves(() => counts.push(getPendingSaveCount()));
    try {
        await trackSave(Promise.resolve());
        assert.deepEqual(counts, [1, 0]);
    } finally {
        faulty();
        working();
    }
});
