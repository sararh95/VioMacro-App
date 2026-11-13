import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readPlanDrafts } from '../../src/features/meal-planning/plan-drafts.ts';

const valid = () => ({
    weekStart: '2026-11-09', weekEnd: '2026-11-15', goal: 'Maintenance',
    days: [{ date: '2026-11-09', dayName: 'Monday', totalCalories: 0, meals: [] }],
    dailyTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
});

for (const field of ['weekStart', 'weekEnd', 'day'] as const) {
    test(`G9 R2 C6 stored ${field} refuses impossible calendar dates`, () => {
        const plan = valid();
        if (field === 'day') plan.days[0].date = '2026-02-30';
        else plan[field] = '2026-02-30';
        const raw = JSON.stringify({ [plan.weekStart]: plan });
        assert.throws(() => readPlanDrafts('synthetic-user', {
            getItem: () => raw, setItem: () => {},
        }), /Invalid local plan draft/, `C6 ${field} must be a real calendar date`);
    });
}

test('G9 R2 C6 stored daily targets must be finite numbers', () => {
    for (const dailyTargets of [null, '2000', { calories: '2000', protein: 150, carbs: 200, fat: 70 },
        { calories: 2000, protein: null, carbs: 200, fat: 70 }]) {
        const plan = { ...valid(), dailyTargets };
        const raw = JSON.stringify({ [plan.weekStart]: plan });
        assert.throws(() => readPlanDrafts('synthetic-user', {
            getItem: () => raw, setItem: () => {},
        }), /Invalid local plan draft/, 'C6 daily targets must contain finite numbers');
    }
});
