import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    assertMealStatusWithinLimits,
    extractMealStatus,
    hydratePlanStatus,
    isMealEaten,
    MAX_MEAL_STATUS_KEYS,
    settleMealTick,
    startMealTick,
    withMealEaten,
    type PendingMealTicks,
} from '../../src/features/meal-planning/lib/meal-status.ts';

/**
 * AUD-022: `isEaten` moved out of `days[].meals[]` and into a flat `mealStatus`
 * map, so ticking one meal is a single-field write instead of a read plus a
 * full-document rewrite.
 *
 * There is no migration script, so the read path has to serve both shapes
 * forever. That is what most of these tests are about: the interesting cases
 * are not the new shape, they are the seams between the two.
 */

const meal = (id: string, isEaten?: boolean) => ({
    id,
    name: `Meal ${id}`,
    type: 'breakfast' as const,
    protein: 10,
    carbs: 20,
    fat: 5,
    calories: 300,
    ...(isEaten === undefined ? {} : { isEaten }),
});

const plan = (
    meals: ReturnType<typeof meal>[],
    mealStatus?: Record<string, boolean>,
) => ({
    weekStart: '2026-06-22',
    weekEnd: '2026-06-28',
    goal: 'Maintenance',
    days: [{ date: '2026-06-22', dayName: 'Monday', totalCalories: 300, meals }],
    ...(mealStatus === undefined ? {} : { mealStatus }),
});

// --------------------------------------------------------------- reading

test('a plan saved before the change keeps its ticks', () => {
    const hydrated = hydratePlanStatus(plan([meal('a', true), meal('b', false)]));
    assert.equal(hydrated.days[0].meals[0].isEaten, true);
    assert.equal(hydrated.days[0].meals[1].isEaten, false);
});

test('the map fills in ticks the array does not have', () => {
    const hydrated = hydratePlanStatus(plan([meal('a'), meal('b')], { a: true }));
    assert.equal(hydrated.days[0].meals[0].isEaten, true);
    assert.equal(hydrated.days[0].meals[1].isEaten, undefined);
});

/**
 * The case that makes this a lookup rather than an `||`.
 *
 * Untick a meal on an old plan and the map records `false` while the array still
 * says `true`. If the array won, the tick would reappear on the next reload and
 * the user would have no way to clear it.
 */
test('unticking a meal on an old plan sticks', () => {
    const hydrated = hydratePlanStatus(plan([meal('a', true)], { a: false }));
    assert.equal(hydrated.days[0].meals[0].isEaten, false);
});

test('a plan with nothing to merge is returned unchanged', () => {
    // Same object back, not a copy: a new identity every read would churn React.
    const noMap = plan([meal('a', true)]);
    assert.equal(hydratePlanStatus(noMap), noMap);

    const emptyMap = plan([meal('a')], {});
    assert.equal(hydratePlanStatus(emptyMap), emptyMap);
});

test('hydrating survives an empty or malformed plan', () => {
    assert.equal(hydratePlanStatus(null), null);
    assert.equal(hydratePlanStatus(undefined), undefined);
    const empty = { days: [], mealStatus: { a: true } };
    assert.equal(hydratePlanStatus(empty), empty);
});

test('a status for a meal that is no longer in the plan is ignored', () => {
    const hydrated = hydratePlanStatus(plan([meal('a')], { deleted: true }));
    assert.equal(hydrated.days[0].meals.length, 1);
    assert.equal(hydrated.days[0].meals[0].isEaten, undefined);
});

test('isMealEaten falls back to the array when the id is missing', () => {
    assert.equal(isMealEaten({ a: true }, { isEaten: true }), true);
    assert.equal(isMealEaten({ a: true }, undefined), false);
});

// --------------------------------------------------------------- writing

test('saving moves the ticks into the map and out of the meals', () => {
    const { plan: stored, mealStatus } = extractMealStatus(
        plan([meal('a', true), meal('b', false)]),
    );
    assert.deepEqual(mealStatus, { a: true });
    assert.equal('isEaten' in stored.days[0].meals[0], false);
    assert.equal('isEaten' in stored.days[0].meals[1], false);
});

/**
 * The planner ticks a meal in its local draft while that draft still carries the
 * map exactly as it was fetched. If saving trusted the stale map instead of the
 * array, it would undo the tick the user just made.
 */
test('saving trusts the meals, not the map it arrived with', () => {
    const { mealStatus } = extractMealStatus(plan([meal('a', true)], { a: false }));
    assert.deepEqual(mealStatus, { a: true });
});

test('unticking everything writes an empty map, not a map of falses', () => {
    const { mealStatus } = extractMealStatus(plan([meal('a', false), meal('b', false)]));
    assert.deepEqual(mealStatus, {});
});

test('a round trip through save and read preserves what the user ticked', () => {
    const { plan: stored, mealStatus } = extractMealStatus(plan([meal('a', true), meal('b')]));
    const back = hydratePlanStatus({ ...stored, mealStatus });
    assert.equal(back.days[0].meals[0].isEaten, true);
    assert.equal(back.days[0].meals[1].isEaten, undefined);
});

// --------------------------------------------------------------- the cap

test('the map is capped, because the rules cannot count the values', () => {
    const under: Record<string, boolean> = {};
    for (let i = 0; i < MAX_MEAL_STATUS_KEYS; i++) under[`m${i}`] = true;
    assert.doesNotThrow(() => assertMealStatusWithinLimits(under));

    under.oneTooMany = true;
    assert.throws(() => assertMealStatusWithinLimits(under), /limit is 200/);
});

test('an absent map is within limits', () => {
    assert.doesNotThrow(() => assertMealStatusWithinLimits(undefined));
    assert.doesNotThrow(() => assertMealStatusWithinLimits(null));
});

// --------------------------------------------------------------- G-B: refused ticks

test('setting one meal leaves the other meals and an unchanged plan alone', () => {
    const before = plan([meal('a', false), meal('b', true)]);
    const after = withMealEaten(before, 'a', true);
    assert.equal(after.days[0].meals[0].isEaten, true);
    assert.equal(after.days[0].meals[1], before.days[0].meals[1]);
    assert.equal(withMealEaten(before, 'b', true), before);
    assert.equal(withMealEaten(before, 'missing', true), before);
});

test('a refused tick with nothing newer falls back to the saved value', () => {
    const pending: PendingMealTicks = new Map();
    startMealTick(pending, 'p/a', 1, false);
    assert.equal(settleMealTick(pending, 'p/a', 1, false, true), false);
    assert.equal(pending.size, 0);
});

test('an accepted tick changes nothing on screen', () => {
    const pending: PendingMealTicks = new Map();
    startMealTick(pending, 'p/a', 1, false);
    assert.equal(settleMealTick(pending, 'p/a', 1, true, true), null);
    assert.equal(pending.size, 0);
});

test('a refused tap waits for a newer tap on the same meal, and two refusals land on the saved value', () => {
    const pending: PendingMealTicks = new Map();
    startMealTick(pending, 'p/a', 1, false); // tick
    startMealTick(pending, 'p/a', 2, true); // untick before the server answers
    assert.equal(settleMealTick(pending, 'p/a', 1, false, true), null);
    // "Before the last tap" was ticked; the server never had that.
    assert.equal(settleMealTick(pending, 'p/a', 2, false, false), false);
});

test('a refused tap after an accepted one falls back to the accepted value', () => {
    const pending: PendingMealTicks = new Map();
    startMealTick(pending, 'p/a', 1, false); // tick, accepted
    startMealTick(pending, 'p/a', 2, true); // untick, refused
    assert.equal(settleMealTick(pending, 'p/a', 1, true, true), null);
    assert.equal(settleMealTick(pending, 'p/a', 2, false, false), true);
});

test('a refused tap on one meal does not wait for a tap on another meal', () => {
    const pending: PendingMealTicks = new Map();
    startMealTick(pending, 'p/a', 1, false);
    startMealTick(pending, 'p/b', 2, false);
    assert.equal(settleMealTick(pending, 'p/a', 1, false, true), false);
    assert.equal(settleMealTick(pending, 'p/b', 2, true, true), null);
});
