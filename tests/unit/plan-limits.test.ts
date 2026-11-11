import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertPlanWithinLimits, MAX_MEALS_PER_DAY } from '../../src/features/meal-planning/lib/plan-limits.ts';

/**
 * AUD-005: the meal plan `days` array was capped at 14 entries by the security
 * rules, but nothing limited what a single day could hold.
 *
 * Firestore rules cannot iterate a list, so this cannot be enforced server-side
 * at all -- which is exactly why it needs a guard on the way in. The plan
 * document is re-read and re-written whole on every meal toggle, so a bloated
 * day makes an ordinary click expensive, and the only real ceiling is the 1 MB
 * document limit.
 */

const day = (mealCount: number, date = '2026-06-22') => ({
    date,
    dayName: 'Monday',
    totalCalories: 1850,
    meals: Array.from({ length: mealCount }, (_, i) => ({
        id: `meal-${i}`,
        name: 'Padding',
        type: 'snack' as const,
        calories: 100,
    })),
});

test('AUD-005: a day at the limit is accepted', () => {
    assert.doesNotThrow(() =>
        assertPlanWithinLimits({ days: [day(MAX_MEALS_PER_DAY)] } as never),
    );
});

test('AUD-005: a day over the limit is refused, and says which day', () => {
    assert.throws(
        () => assertPlanWithinLimits({ days: [day(MAX_MEALS_PER_DAY + 1)] } as never),
        /2026-06-22 has 13 meals/,
    );
});

test('AUD-005: an over-full day is caught even when earlier days are fine', () => {
    assert.throws(
        () =>
            assertPlanWithinLimits({
                days: [day(3, '2026-06-22'), day(4, '2026-06-23'), day(40, '2026-06-24')],
            } as never),
        /2026-06-24 has 40 meals/,
    );
});

test('AUD-005: an empty or partial plan does not throw', () => {
    assert.doesNotThrow(() => assertPlanWithinLimits({ days: [] } as never));
    assert.doesNotThrow(() => assertPlanWithinLimits({} as never));
    assert.doesNotThrow(() => assertPlanWithinLimits({ days: [{ date: '2026-06-22' }] } as never));
});
