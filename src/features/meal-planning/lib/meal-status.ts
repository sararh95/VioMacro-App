/**
 * Where "I ate this" lives, and how the old and new shapes are reconciled.
 *
 * AUD-022: `isEaten` used to live inside `days[].meals[]`. Firestore cannot
 * update one element of an array, so ticking one meal meant reading the whole
 * plan document, editing a copy in memory, and writing all seven days back --
 * one read plus one full write, per click. A week of ticking cost about
 * 21 reads and 21 full-document writes to store 21 booleans.
 *
 * The statuses now live in a flat `mealStatus` map keyed by meal id, so a tick
 * is a single-field write with no read at all. Two people ticking two different
 * meals at the same moment can no longer erase each other, because they no
 * longer write the same field.
 *
 * ## The old shape is still readable, on purpose
 *
 * Every plan saved before this change stores its ticks in the array, and there
 * is no migration script. There does not need to be one: `hydratePlanStatus`
 * merges both shapes on the way out, so an old plan keeps its ticks forever,
 * and re-saving it moves it to the new shape.
 *
 * The map wins wherever it has an entry -- including when that entry is
 * `false`. Untick a meal on an old plan and the map records `false` while the
 * array still says `true`; if the array won, the tick would come back on
 * reload. That is the whole reason this is a lookup and not an `||`.
 */

/** The plan shape this module needs. Deliberately structural: no Firebase import. */
type MealLike = { id?: string; isEaten?: boolean };
type DayLike = { meals?: MealLike[] } | null | undefined;
type PlanLike = {
    days?: DayLike[];
    mealStatus?: Record<string, boolean> | null;
} | null | undefined;

/**
 * A ceiling the security rules cannot enforce.
 *
 * Rules can check that `mealStatus` is a map and count its keys, but they
 * cannot iterate the values to prove each one is a boolean -- the same
 * limitation that put the per-day meal cap in `plan-limits.ts` (AUD-005).
 * 14 days times 12 meals is 168, so 200 leaves room without leaving the field
 * open as a place to park arbitrary data.
 */
export const MAX_MEAL_STATUS_KEYS = 200;

/**
 * Read the eaten state of one meal, map first, array second.
 *
 * `mealId` may be missing on very old records, in which case there is nothing
 * to look up and the array value is all there is.
 */
export function isMealEaten(
    mealStatus: Record<string, boolean> | null | undefined,
    meal: MealLike | null | undefined,
): boolean {
    const id = meal?.id;
    if (id && mealStatus && Object.prototype.hasOwnProperty.call(mealStatus, id)) {
        return mealStatus[id] === true;
    }
    return meal?.isEaten === true;
}

/**
 * Fold `mealStatus` back into the meals, so every existing read site keeps
 * working untouched.
 *
 * There are thirteen places that read `meal.isEaten` -- the dashboard, the
 * calendar widget, the check-in modal, history, and the planner's own cards.
 * Rewriting all of them to consult a map would have been thirteen chances to
 * miss one. Merging once, here, at the edge where a plan is read, means none of
 * them had to change.
 *
 * Returns the same object when there is nothing to merge, so an unchanged plan
 * does not churn React identities.
 */
export function hydratePlanStatus<T extends PlanLike>(plan: T): T {
    if (!plan || !plan.days?.length) return plan;

    const status = plan.mealStatus;
    if (!status || Object.keys(status).length === 0) return plan;

    return {
        ...plan,
        days: plan.days.map(day => {
            if (!day?.meals?.length) return day;
            return {
                ...day,
                meals: day.meals.map(meal => {
                    const eaten = isMealEaten(status, meal);
                    return eaten === (meal.isEaten === true) ? meal : { ...meal, isEaten: eaten };
                }),
            };
        }),
    };
}

/**
 * Build the map that gets stored, and strip `isEaten` from the meals.
 *
 * Both halves matter. Writing the map without stripping the array would leave
 * two copies of the same fact free to disagree; stripping without writing the
 * map would throw away every tick on the next save.
 *
 * Only `true` is recorded. An unticked meal is the absence of a key, not a
 * `false`, which keeps the map roughly the size of what the user has actually
 * done rather than the size of the plan.
 *
 * **Reads the array, not the incoming map, and that is deliberate.** Every plan
 * in memory has been through `hydratePlanStatus`, so the array is already the
 * merged truth. A plan the user has been editing is further ahead than that: the
 * planner ticks a meal in its local draft while the draft still carries the map
 * as it was fetched. If this function trusted that stale map, saving would undo
 * the tick the user just made.
 */
export function extractMealStatus<T extends PlanLike>(
    plan: T,
): { plan: T; mealStatus: Record<string, boolean> } {
    const mealStatus: Record<string, boolean> = {};
    if (!plan || !plan.days?.length) return { plan, mealStatus };

    const days = plan.days.map(day => {
        if (!day?.meals?.length) return day;
        return {
            ...day,
            meals: day.meals.map(meal => {
                if (meal.isEaten === true && meal.id) {
                    mealStatus[meal.id] = true;
                }
                if (!('isEaten' in meal)) return meal;
                const stripped: MealLike = { ...meal };
                delete stripped.isEaten;
                return stripped;
            }),
        };
    });

    return { plan: { ...plan, days } as T, mealStatus };
}

/** Throws if the map is too large to be a set of meal ticks. */
export function assertMealStatusWithinLimits(
    mealStatus: Record<string, boolean> | null | undefined,
): void {
    const count = mealStatus ? Object.keys(mealStatus).length : 0;
    if (count > MAX_MEAL_STATUS_KEYS) {
        throw new Error(
            `A plan cannot carry ${count} meal statuses; the limit is ${MAX_MEAL_STATUS_KEYS}.`,
        );
    }
}

/**
 * G-B: set one meal's eaten flag and leave every other meal alone.
 *
 * Used for both the tick and its undo. Changing only this meal is what lets a
 * refused tick be undone without also undoing a newer tick on another meal.
 * Returns the same object when nothing changes.
 */
export function withMealEaten<T extends PlanLike>(plan: T, mealId: string, isEaten: boolean): T {
    if (!plan?.days?.length) return plan;
    let changed = false;
    const days = plan.days.map(day => {
        const meals = day?.meals;
        if (!meals?.some(meal => meal.id === mealId && (meal.isEaten === true) !== isEaten)) return day;
        changed = true;
        return { ...day, meals: meals.map(meal => (meal.id === mealId ? { ...meal, isEaten } : meal)) };
    });
    return changed ? { ...plan, days } : plan;
}

/**
 * G-B: the ticks on each meal that the server has not answered yet.
 *
 * `saved` is the value the server holds for that meal. It is not simply the
 * value before the refused tap: tick then untick quickly, have both refused,
 * and "before the last tap" is ticked while the server still says not eaten.
 */
export type PendingMealTicks = Map<string, { tap: number; saved: boolean }>;

export function startMealTick(pending: PendingMealTicks, key: string, tap: number, wasEaten: boolean): void {
    pending.set(key, { tap, saved: pending.get(key)?.saved ?? wasEaten });
}

/**
 * Record the server's answer to one tap.
 *
 * Returns the value to put back on screen when the tap was refused and no newer
 * tap on the same meal is waiting, and `null` otherwise. A newer tap gets its
 * own answer, so it decides. Firestore answers one client's writes in order,
 * so an accepted tap means the server holds its value.
 */
export function settleMealTick(
    pending: PendingMealTicks,
    key: string,
    tap: number,
    accepted: boolean,
    isEaten: boolean,
): boolean | null {
    const open = pending.get(key);
    if (!open) return null;
    if (open.tap !== tap) {
        if (accepted) open.saved = isEaten;
        return null;
    }
    pending.delete(key);
    return accepted ? null : open.saved;
}
