/**
 * Local updates to the day-log list, kept out of the page so they can be
 * unit-tested directly.
 *
 * AUD-049: every water tap, water correction and sleep save bumped a refresh
 * counter, and the effect keyed on it refetched the ENTIRE weight history --
 * one document per day, so a year of use meant 365 reads to add 250 ml.
 *
 * The app already knows what changed in each of those cases. Merging it into the
 * list in memory is both correct and free. A full refetch is still right where
 * the app genuinely does not know what changed -- the check-in modal writes its
 * own record -- and where the user explicitly asks for one.
 */

import type { DailyLog } from '../../../services/userService';

/**
 * Return a new list with `patch` merged into the entry for `date`, inserting a
 * new entry if that day has none.
 *
 * Kept in ascending date order, which is what every consumer expects: the chart
 * plots left to right and the streak walks backwards from today.
 */
export function mergeDailyLog(
    logs: DailyLog[],
    date: string,
    patch: Partial<DailyLog>,
): DailyLog[] {
    const index = logs.findIndex((log) => log.date === date);

    if (index === -1) {
        const inserted = [...logs, { ...patch, date } as DailyLog];
        // Date keys sort correctly as strings, so no parsing is needed -- and
        // parsing is where AUD-099 went wrong.
        return inserted.sort((a, b) => a.date.localeCompare(b.date));
    }

    const next = [...logs];
    next[index] = { ...next[index], ...patch, date };
    return next;
}
