/**
 * Limits on the shape of a meal plan, kept away from any Firebase import so the
 * rules can be unit-tested directly.
 *
 * AUD-005: the security rules cap `days` at 14 entries but cannot look inside
 * it -- Firestore rules have no way to iterate a list, so nothing server-side
 * limits how many meals a single day may hold.
 *
 * That matters more than it looks. The whole plan document is re-read and
 * re-written on every meal toggle, so a bloated day makes an ordinary click
 * expensive, and the only real ceiling is the 1 MB document limit.
 */

export const MAX_MEALS_PER_DAY = 12;

type DayLike = { date?: string; meals?: unknown[] } | null | undefined;
type PlanLike = { days?: DayLike[] } | null | undefined;

/** Throws with a message naming the offending day. Silent on an empty plan. */
export function assertPlanWithinLimits(plan: PlanLike): void {
    for (const day of plan?.days ?? []) {
        const meals = day?.meals ?? [];
        if (meals.length > MAX_MEALS_PER_DAY) {
            throw new Error(
                `${day?.date ?? 'A day'} has ${meals.length} meals; the limit is ${MAX_MEALS_PER_DAY}.`,
            );
        }
    }
}
