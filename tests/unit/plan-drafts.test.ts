import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readPlanDrafts, writePlanDrafts } from '../../src/features/meal-planning/plan-drafts.ts';

function storage() {
    const values = new Map<string, string>();
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
    };
}

const draft = (weekStart: string) => ({
    weekStart, weekEnd: weekStart, goal: 'Maintenance',
    days: [{ date: weekStart, dayName: 'Monday', totalCalories: 400, meals: [{
        id: 'draft-dinner', name: 'Draft Dinner', type: 'dinner' as const,
        calories: 400, protein: 30, carbs: 40, fat: 10, isEaten: true,
    }] }],
});

test('B12 local drafts restore ticks and independent weeks after serialization', () => {
    const device = storage();
    const plans = { '2026-11-09': draft('2026-11-09'), '2026-11-16': draft('2026-11-16') };
    writePlanDrafts('user-a', plans, device);
    const restored = readPlanDrafts('user-a', device);
    assert.deepEqual(restored, plans);
    delete restored['2026-11-09'];
    writePlanDrafts('user-a', restored, device);
    assert.deepEqual(readPlanDrafts('user-a', device), { '2026-11-16': plans['2026-11-16'] });
});

test('B12 local drafts are isolated by user on the same device', () => {
    const device = storage();
    writePlanDrafts('user-a', { '2026-11-09': draft('2026-11-09') }, device);
    assert.deepEqual(readPlanDrafts('user-b', device), {});
    writePlanDrafts('user-b', {}, device);
    assert.equal(readPlanDrafts('user-a', device)['2026-11-09'].days[0].meals[0].isEaten, true);
});

test('B12 invalid storage and failed writes surface errors instead of reporting success', () => {
    const device = storage();
    device.setItem('viomacro:plan-drafts:user-a', '{');
    assert.throws(() => readPlanDrafts('user-a', device));
    device.setItem('viomacro:plan-drafts:user-a', JSON.stringify({ '2026-11-09': { weekStart: '2026-11-09' } }));
    assert.throws(() => readPlanDrafts('user-a', device), /Invalid local plan draft/);
    assert.throws(() => writePlanDrafts('user-a', {}, {
        getItem: () => null,
        setItem: () => { throw new Error('Storage full'); },
    }), /Storage full/);
});
