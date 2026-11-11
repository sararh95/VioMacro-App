import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const moduleUrl = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
async function clientHarness() {
    const key = `aiPlan${Math.random()}`;
    const state = { calls: [] as { name: string; data: unknown }[], error: null as Error | null };
    Object.assign(globalThis, { [key]: state });
    const rpc = moduleUrl(`export const httpsCallable = (_functions, name) => async data => {
        const state = globalThis[${JSON.stringify(key)}]; state.calls.push({name,data});
        if(state.error) throw state.error; return {data:{goal:'mock plan',days:[]}};
    };`);
    const source = ts.transpileModule(readFileSync('src/services/aiService.ts', 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText
        .replaceAll("'firebase/functions'", JSON.stringify(rpc))
        .replaceAll("'./firebase/firebase'", JSON.stringify(moduleUrl('export const functions = {};')))
        .replaceAll("'./aiSpendService'", JSON.stringify(moduleUrl("export const createAiCallableRequestId = () => 'meal-plan:0123456789abcdef0123456789abcdef';")))
        .replaceAll('import.meta.env.DEV', 'false');
    const { generateAiMealPlan } = await import(moduleUrl(source));
    return { state, generateAiMealPlan };
}

test('VM-003: actual callable sends only recipe summaries and planning inputs, never complete documents', async () => {
    const h = await clientHarness();
    const recipes = Array.from({ length: 4 }, (_, i) => ({
        id: `recipe-${i}`, title: 'Same title', mealType: 'dinner',
        embedding: Array.from({ length: 1536 }, (_, n) => n / 1536),
        instructions: ['x'.repeat(12000)], imageURL: 'https://example.invalid/private.jpg',
        ingredients: [{ item: 'rice', quantity: '2', unit: 'cups' }], privateExtra: 'not needed',
    }));
    const input = {
        userSettings: { calories: 1800, protein: 130, carbs: 160, fat: 60, email: 'synthetic@example.invalid' },
        userRecipes: recipes,
        preferences: { batchLunch: false, batchMealType: 'lunch', includeSmoothie: false, includeTea: true, includeSnacks: false, extra: 'omit' },
        unexpected: 'omit',
    };
    const before = structuredClone(input);
    assert.deepEqual(await h.generateAiMealPlan(input), { goal: 'mock plan', days: [] });
    assert.deepEqual(h.state.calls, [{ name: 'generateMealPlan', data: {
        userSettings: { calories: 1800, protein: 130, carbs: 160, fat: 60 },
        userRecipes: [0, 1, 2, 3].map(i => ({ id: `recipe-${i}`, title: 'Same title', mealType: 'dinner' })),
        preferences: { batchLunch: false, batchMealType: 'lunch', includeSmoothie: false, includeTea: true, includeSnacks: false },
        requestId: 'meal-plan:0123456789abcdef0123456789abcdef',
    } }]);
    assert.ok(JSON.stringify(h.state.calls[0].data).length < 2000);
    assert.deepEqual(input, before);
});

test('VM-003: actual callable bounds library context without truncating recipe identity', async () => {
    const h = await clientHarness();
    await h.generateAiMealPlan({
        userSettings: { calories: 1800, protein: 130, carbs: 160, fat: 60 },
        userRecipes: Array.from({ length: 150 }, (_, i) => ({ id: `opaque-${i}`, title: 'x'.repeat(5000), mealType: 'dinner' })),
        preferences: { batchLunch: false, includeSmoothie: false, includeTea: false, includeSnacks: true },
    });
    const sent = h.state.calls[0].data as { userRecipes: { id: string; title: string }[] };
    assert.equal(sent.userRecipes.length, 100);
    assert.equal(sent.userRecipes[0].title.length, 200);
    assert.equal(sent.userRecipes[99].id, 'opaque-99');
    assert.ok(JSON.stringify(sent).length < 120000);
});
