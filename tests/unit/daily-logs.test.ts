import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mergeDailyLog } from '../../src/features/progress/lib/daily-logs.ts';

/**
 * AUD-049. A water tap used to refetch the whole history. It now merges the
 * known change in memory, so this has to be exactly right -- a wrong merge is
 * worse than a wasteful refetch.
 */

const log = (date: string, extra = {}) => ({ date, ...extra }) as never;

test('AUD-049: patches the matching day and leaves the rest alone', () => {
    const out = mergeDailyLog(
        [log('2026-09-01', { waterMl: 100 }), log('2026-09-02', { waterMl: 200 })],
        '2026-09-02',
        { waterMl: 450 },
    );

    assert.equal(out.length, 2);
    assert.equal(out[0].waterMl, 100);
    assert.equal(out[1].waterMl, 450);
});

test('AUD-049: keeps fields the patch does not mention', () => {
    // A sleep save must not wipe the day's water.
    const out = mergeDailyLog(
        [log('2026-09-01', { waterMl: 500, weight: 80 })],
        '2026-09-01',
        { sleepHours: 7 },
    );

    assert.equal(out[0].waterMl, 500);
    assert.equal(out[0].weight, 80);
    assert.equal(out[0].sleepHours, 7);
});

test('AUD-049: inserts a day that has no entry yet', () => {
    const out = mergeDailyLog([log('2026-09-01')], '2026-09-03', { waterMl: 250 });

    assert.equal(out.length, 2);
    assert.equal(out[1].date, '2026-09-03');
    assert.equal(out[1].waterMl, 250);
});

test('AUD-049: an inserted day lands in date order, not at the end', () => {
    // The chart plots left to right and the streak walks backwards from today.
    const out = mergeDailyLog(
        [log('2026-09-01'), log('2026-09-05')],
        '2026-09-03',
        { waterMl: 250 },
    );

    assert.deepEqual(out.map(l => l.date), ['2026-09-01', '2026-09-03', '2026-09-05']);
});

test('AUD-049: does not mutate the list it was given', () => {
    const original = [log('2026-09-01', { waterMl: 100 })];
    const out = mergeDailyLog(original, '2026-09-01', { waterMl: 999 });

    assert.equal(original[0].waterMl, 100, 'React state must not be edited in place');
    assert.notEqual(out, original);
});

test('AUD-049: merging into an empty history works', () => {
    const out = mergeDailyLog([], '2026-09-01', { waterMl: 250 });
    assert.deepEqual(out, [{ date: '2026-09-01', waterMl: 250 }]);
});
