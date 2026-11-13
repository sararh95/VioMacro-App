import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as drafts from '../../src/features/meal-planning/plan-drafts.ts';
import { assertPlanWithinLimits } from '../../src/features/meal-planning/lib/plan-limits.ts';
import { assertMealStatusWithinLimits, extractMealStatus } from '../../src/features/meal-planning/lib/meal-status.ts';

const draft = () => ({
    weekStart: '2026-11-09', weekEnd: '2026-11-15', goal: 'Maintenance',
    days: [{ date: '2026-11-09', dayName: 'Monday', totalCalories: 0, meals: [] }],
});
const plan = (seconds: number) => ({
    ...draft(), id: 'saved-week',
    updatedAt: { seconds, nanoseconds: 0 },
});

function harness(found: ReturnType<typeof plan> | null) {
    const source = ts.createSourceFile('planService.ts', readFileSync('src/features/meal-planning/planService.ts', 'utf8'), ts.ScriptTarget.Latest, true);
    const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'saveMealPlan')!;
    const js = ts.transpileModule(fn.getText(source), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const writes: unknown[] = [];
    const exports: Record<string, unknown> = {};
    const current = { ...draft(), updatedAt: { seconds: 2, nanoseconds: 0 } };
    runInNewContext(js, {
        ...drafts, exports, db: {}, consumeDevFailure: () => false,
        assertPlanWithinLimits, assertMealStatusWithinLimits, extractMealStatus,
        getMealPlanByDate: async () => found,
        mealPlanDoc: (_db: unknown, _uid: string, id: string) => id,
        Timestamp: { now: () => ({ seconds: 3, nanoseconds: 0 }) },
        runTransaction: async (_db: unknown, callback: (transaction: unknown) => Promise<void>) => callback({
            get: async () => ({ exists: () => true, data: () => structuredClone(current) }),
            update: (_ref: unknown, value: unknown) => { writes.push(value); },
            set: (_ref: unknown, value: unknown) => { writes.push(value); },
        }),
    });
    return { writes, save: exports.saveMealPlan as (uid: string, value: unknown, options: unknown) => Promise<string> };
}

test('G9 R2 C2 Confirm checks the saved version inside the transaction', async () => {
    const h = harness(plan(1));
    await assert.rejects(h.save('synthetic-user', draft(), {
        expectedVersion: { id: 'saved-week', seconds: 1, nanoseconds: 0 },
    }), /changed.*since this draft/i, 'C2 a newer transaction snapshot must refuse the stale draft');
    assert.equal(h.writes.length, 0);
});

test('G9 R2 C2 a new saved week conflicts with a draft based on no saved plan', async () => {
    const h = harness(null);
    await assert.rejects(h.save('synthetic-user', draft(), {
        expectedVersion: null,
    }), /changed.*since this draft/i, 'C2 a no-saved-plan draft must not replace a newly saved week');
    assert.equal(h.writes.length, 0);
});
