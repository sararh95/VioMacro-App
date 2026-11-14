import { addDays, getStartOfWeek, getWeekStartKey, tryParseLocalDateKey } from '../../../shared/date-utils.ts';

/**
 * R9 / N1: which week the Planner shows.
 *
 * Two rules live here so that every caller shares them:
 *
 * 1. The Planner opens on this week. When the user picks another week, that
 *    pick is remembered, but only while it is fresh. It used to be kept for the
 *    whole life of the browser tab, so a phone tab or a laptop window left open
 *    opened on an old week days later, and a meal could be ticked in the wrong
 *    week.
 * 2. The week on screen always starts on a Monday. The Day and Month arrows
 *    used to move one day or one month, which gave a Tuesday-to-Monday "week"
 *    whose draft was stored under a key nothing ever read.
 */
export const MEAL_PLANNER_VIEW_DATE_KEY = 'viomacro:meal-planner:viewDate';

/** How long a picked week is remembered after the Planner was last used. */
export const PLANNER_WEEK_MEMORY_MS = 4 * 60 * 60 * 1000;

/**
 * `week` is the stored week. `fresh` says whether to keep showing it: it must
 * be a real pick (a week other than the current one when the user went to it)
 * and the Planner must have been used within the memory time.
 */
export type PlannerWeekChoice = { week: string; fresh: boolean };

/**
 * What the Planner stores: the week on screen, when it was last used, and
 * whether the user picked it. Being on the current week is not a pick. `pick`
 * is decided here, once, and kept by a renewal: working it out again later
 * from `at` would give a different answer after a timezone change.
 */
export function encodePlannerWeekChoice(viewDate: Date, now: Date = new Date()): string {
    const week = getWeekStartKey(viewDate);
    return JSON.stringify({ week, at: now.getTime(), pick: week !== getWeekStartKey(now) });
}

/**
 * Reads a stored choice. Returns null for anything that is not one, which
 * includes the bare `YYYY-MM-DD` value that older versions stored: it carries
 * no age, so it cannot be trusted to be recent.
 *
 * A record that is not a pick is never fresh. The user was simply on "this
 * week", so it follows the calendar: after Monday 00:00 it must not hold the
 * Planner on last week.
 *
 * The age check allows the clock to step back (a network time correction),
 * so a small step cannot throw the user off the week they are working on.
 */
export function readPlannerWeekChoice(saved: string | null | undefined, now: Date = new Date()): PlannerWeekChoice | null {
    if (!saved) return null;
    try {
        const value: unknown = JSON.parse(saved);
        if (!value || typeof value !== 'object') return null;
        const { week, at, pick } = value as { week?: unknown; at?: unknown; pick?: unknown };
        if (typeof week !== 'string' || typeof at !== 'number' || !Number.isFinite(at) || typeof pick !== 'boolean') return null;
        const start = tryParseLocalDateKey(week);
        if (!start) return null;
        return { week: getWeekStartKey(start), fresh: pick && Math.abs(now.getTime() - at) < PLANNER_WEEK_MEMORY_MS };
    } catch {
        return null;
    }
}

/**
 * A fresh choice with its age reset to now, or null when there is none to
 * keep. The memory runs from when the Planner was last used, so a long
 * planning session does not lose its week half way through.
 */
export function renewPlannerWeekChoice(saved: string | null | undefined, now: Date = new Date()): string | null {
    const choice = readPlannerWeekChoice(saved, now);
    return choice?.fresh ? JSON.stringify({ week: choice.week, at: now.getTime(), pick: true }) : null;
}

/** The week to show when the Planner opens: a fresh choice, else this week. */
export function resolvePlannerWeek(saved: string | null | undefined, now: Date = new Date()): Date {
    const choice = readPlannerWeekChoice(saved, now);
    const start = choice?.fresh ? tryParseLocalDateKey(choice.week) : null;
    return start ?? getStartOfWeek(now);
}

/**
 * True when a Planner that stayed open shows a week it should no longer show:
 * its stored week is not fresh and is not the current week. This covers a
 * stale pick, and the week changing on Monday under a Planner that was on
 * "this week".
 */
export function isPlannerWeekOutdated(saved: string | null | undefined, now: Date = new Date()): boolean {
    const choice = readPlannerWeekChoice(saved, now);
    return !!choice && !choice.fresh && choice.week !== getWeekStartKey(now);
}

/** The arrows move whole weeks, Monday to Monday, whatever date they start from. */
export function stepPlannerWeek(viewDate: Date, direction: 'prev' | 'next'): Date {
    return addDays(getStartOfWeek(viewDate), direction === 'next' ? 7 : -7);
}
