import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildMetricSummary } from '../../src/features/progress/lib/metric-summary.ts';

/**
 * AUD-101: buildMetricSummary was rewritten from six passes over the log array
 * -- three of which copied and reversed it first -- into one backwards pass.
 *
 * A rewrite for speed is only worth anything if the answer is identical, so
 * these lock the behaviour rather than the implementation. "latest" means the
 * last entry in the array that has the field, which is not necessarily the last
 * entry overall.
 */

const log = (over: Record<string, unknown> = {}) => ({ date: '2026-09-01', ...over }) as never;

test('AUD-101: counts each metric independently', () => {
    const s = buildMetricSummary([
        log({ weight: 80 }),
        log({ sleepHours: 7 }),
        log({ waterMl: 500, weight: 79 }),
        log({}),
    ]);

    assert.equal(s.totalDays, 4);
    assert.equal(s.weightDays, 2);
    assert.equal(s.sleepDays, 1);
    assert.equal(s.waterDays, 1);
});

test('AUD-101: "latest" is the last entry carrying that field, not the last entry', () => {
    const s = buildMetricSummary([
        log({ weight: 80, sleepHours: 8, waterMl: 100 }),
        log({ weight: 79 }),
        log({}),
    ]);

    assert.equal(s.latestWeight, 79, 'a later log without a weight must not hide the earlier one');
    assert.equal(s.latestSleep, 8);
    assert.equal(s.latestWater, 100);
});

test('AUD-101: a missing metric stays undefined rather than becoming 0', () => {
    // 0 is a real value for water. Confusing "none logged" with "logged zero"
    // is the kind of thing this audit exists to stop.
    const s = buildMetricSummary([log({ waterMl: 0 })]);

    assert.equal(s.latestWater, 0);
    assert.equal(s.waterDays, 1);
    assert.equal(s.latestWeight, undefined);
    assert.equal(s.weightDays, 0);
});

test('AUD-101: an empty history does not throw', () => {
    const s = buildMetricSummary([]);
    assert.deepEqual(s, {
        totalDays: 0,
        weightDays: 0,
        sleepDays: 0,
        waterDays: 0,
        latestWeight: undefined,
        latestSleep: undefined,
        latestWater: undefined,
    });
});

test('AUD-101: ignores non-numeric values the same way the old filter did', () => {
    const s = buildMetricSummary([
        log({ weight: null }),
        log({ weight: undefined }),
        log({ weight: '80' }),
        log({ weight: 80 }),
    ]);

    assert.equal(s.weightDays, 1);
    assert.equal(s.latestWeight, 80);
});
