/**
 * Summary of a run of daily logs, kept out of the page so it can be unit-tested
 * directly -- Node's type stripping does not handle .tsx.
 *
 * Same reasoning as src/features/meal-planning/lib/plan-limits.ts.
 */

import type { DailyLog } from '../../../services/userService';

/**
 * AUD-101: this made six full passes over the log array, three of which copied
 * and reversed it first, and it ran on every render of a page that re-renders on
 * every store change.
 *
 * One backwards pass now collects all seven values. Nothing is copied.
 */
export function buildMetricSummary(logs: DailyLog[]) {
    let weightDays = 0;
    let sleepDays = 0;
    let waterDays = 0;
    let latestWeight: number | undefined;
    let latestSleep: number | undefined;
    let latestWater: number | undefined;

    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];

        if (typeof log.weight === 'number') {
            weightDays++;
            // Walking backwards, the first one seen is the latest one.
            if (latestWeight === undefined) latestWeight = log.weight;
        }
        if (typeof log.sleepHours === 'number') {
            sleepDays++;
            if (latestSleep === undefined) latestSleep = log.sleepHours;
        }
        if (typeof log.waterMl === 'number') {
            waterDays++;
            if (latestWater === undefined) latestWater = log.waterMl;
        }
    }

    return {
        totalDays: logs.length,
        weightDays,
        sleepDays,
        waterDays,
        latestWeight,
        latestSleep,
        latestWater,
    };
}
