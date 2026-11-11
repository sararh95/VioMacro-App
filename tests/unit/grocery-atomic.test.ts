import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the actual generator and persistence service. Only Firebase I/O and
// recipe reads are replaced, so a failed/partial write is observable as data loss.
const dataModule = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = (path: string) => ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
type Item = { name: string; quantity: number; unit: string; aisle: string; isChecked: boolean; source?: string; mealPlanId?: string };
const item = (name = 'Rice', extra = {}): Item => ({ name, quantity: 2, unit: 'cups', aisle: 'Pantry', isChecked: true, source: 'generated', ...extra });
const plan = (recipeId: string | null = 'recipe') => ({ id: 'week-new', days: [{ meals: recipeId ? [{ recipeId }] : [] }] });
const recipe = (ingredients: unknown[] = [{ item: 'Rice', quantity: '3', unit: 'cups' }]) => ({ id: 'recipe', title: 'Rice', servings: 4, ingredients });

async function harness(initial: Record<string, Item> = { old: item(), manual: item('Manual', { source: 'manual' }) }) {
    const records = new Map(Object.entries(structuredClone(initial)));
    const state = { records, recipes: [recipe()], failRead: false, failCommit: false, commits: [] as number[], directWrites: 0, nextId: 0 };
    // A unique module per harness prevents state sharing across tests.
    const key = `groceryAtomic${Math.random()}`;
    Object.assign(globalThis, { [key]: state });
    const firebase = dataModule(`
        const s = globalThis[${JSON.stringify(key)}];
        export const Timestamp = { now: () => ({ seconds: 1, nanoseconds: 0 }) };
        export const where = (field, op, value) => ({ field, value });
        export const limit = (count) => ({ count });
        export const query = (ref, ...constraints) => ({ ref, constraints });
        export const doc = () => 'new-' + (++s.nextId);
        export async function getDocs(q) {
            return { docs: [...s.records].filter(([,v]) => (q.constraints || []).every(c => !c.field || v[c.field] === c.value))
                .map(([id,v]) => ({ id, ref: id, data: () => structuredClone(v) })) };
        }
        export async function addDoc(ref, value) { s.directWrites++; const id=doc(); s.records.set(id,value); return {id}; }
        export async function updateDoc(ref, value) { s.directWrites++; s.records.set(ref,{...s.records.get(ref),...value}); }
        export async function deleteDoc(ref) { s.directWrites++; s.records.delete(ref); }
        export function writeBatch() {
            const ops=[];
            return {
                delete: ref => ops.push(['delete',ref]),
                set: (ref,value) => ops.push(['set',ref,value]),
                update: (ref,value) => ops.push(['update',ref,value]),
                commit: async () => {
                    s.commits.push(ops.length);
                    if (s.failCommit) throw Error('commit rejected');
                    for (const [op,ref,value] of ops) {
                        if (op === 'delete') s.records.delete(ref);
                        else s.records.set(ref, op === 'update' ? {...s.records.get(ref),...value} : value);
                    }
                }
            };
        }
    `);
    const database = dataModule('export const db = {};');
    const paths = dataModule('export const groceryItemsCollection = () => "groceries"; export const groceryItemDoc = (db,user,id) => id;');
    // G-D: only the by-id read is provided. A generator that went back to
    // reading the whole (paged) library would fail to import here.
    const recipes = dataModule(`export async function getRecipe(user, id) { const s=globalThis[${JSON.stringify(key)}]; if(s.failRead) throw Error('recipe read rejected'); return s.recipes.find(r => r.id === id) ?? null; }`);
    const service = dataModule(compile('src/features/groceries/shoppingService.ts')
        .replaceAll("'firebase/firestore'", JSON.stringify(firebase))
        .replaceAll("'../../services/firebase/firebase'", JSON.stringify(database))
        .replaceAll("'../../services/firebase/paths'", JSON.stringify(paths))
        .replace(/(['"])\.\.\/\.\.\/shared\/ingredients\1/g, () => JSON.stringify(dataModule(compile('src/shared/ingredients.ts'))))
        .replaceAll('import.meta.env.DEV', 'false'));
    const generator = dataModule(compile('src/features/groceries/shopping-generator.ts')
        .replaceAll("'../recipes/recipeService'", JSON.stringify(recipes))
        .replaceAll("'./shoppingService'", JSON.stringify(service))
        .replace(/(['"])\.\.\/\.\.\/shared\/ingredients\1/g, () => JSON.stringify(dataModule(compile('src/shared/ingredients.ts')))));
    const { generateGroceryList } = await import(generator);
    return { state, generate: (input = plan()) => generateGroceryList('synthetic-user', input), snapshot: () => [...records] };
}

test('VM-028: empty plan leaves checked generated and manual items untouched', async () => {
    const h = await harness(); const before = h.snapshot();
    assert.equal((await h.generate(plan(null))).success, false);
    assert.deepEqual(h.snapshot(), before);
    assert.deepEqual(h.state.commits, []);
});

test('VM-028: missing recipes and recipes without ingredients cannot clear the list', async () => {
    for (const recipes of [[], [recipe([])]]) {
        const h = await harness(); h.state.recipes = recipes; const before = h.snapshot();
        await h.generate();
        assert.deepEqual(h.snapshot(), before);
        assert.deepEqual(h.state.commits, []);
    }
});

test('VM-028: a rejected recipe read leaves the list untouched', async () => {
    const h = await harness(); h.state.failRead = true; const before = h.snapshot();
    await assert.rejects(h.generate(), /recipe read rejected/);
    assert.deepEqual(h.snapshot(), before);
    assert.deepEqual(h.state.commits, []);
});

test('VM-028: a build error after a valid ingredient leaves the list untouched', async () => {
    const h = await harness(); h.state.recipes = [recipe([{ item: 'Rice', quantity: '3', unit: 'cups' }, { item: null, quantity: '1', unit: 'cups' }])];
    const before = h.snapshot();
    await assert.rejects(h.generate());
    assert.deepEqual(h.snapshot(), before);
    assert.deepEqual(h.state.commits, []);
});

test('VM-028: failed atomic commit preserves every previous document', async () => {
    const h = await harness(); h.state.failCommit = true; const before = h.snapshot();
    await assert.rejects(h.generate(), /commit rejected/);
    assert.deepEqual(h.snapshot(), before);
    assert.equal(h.state.directWrites, 0);
});

test('VM-028: refresh uses one batch, replaces prior weeks, and preserves checked name+unit matches', async () => {
    const h = await harness({ old: item(' rice ', { unit: 'CUPS', mealPlanId: 'week-new' }), stale: item('Stale', { isChecked: false, mealPlanId: 'old-week' }),
        manual: item('Manual', { source: 'manual' }), legacy: item('Legacy', { source: undefined }) });
    assert.equal((await h.generate()).count, 1);
    assert.equal(h.state.directWrites, 0);
    assert.equal(h.state.commits.length, 1);
    const values = h.snapshot().map(([,v]) => v);
    assert.equal(values.length, 3);
    assert.ok(h.state.records.has('manual')); assert.ok(h.state.records.has('legacy'));
    const rice = values.find(v => v.name === 'Rice')!;
    assert.equal(rice.quantity, 0.75); assert.equal(rice.isChecked, true);
    assert.equal(rice.mealPlanId, 'week-new'); assert.equal(rice.source, 'generated');
});

test('VM-028: a different unit does not inherit checked state', async () => {
    const h = await harness({ old: item('Rice', { unit: 'oz', mealPlanId: 'week-new' }) });
    await h.generate();
    assert.equal(h.snapshot()[0][1].isChecked, false);
});

test('VM-028: empty/invalid ingredient names cannot replace saved data', async () => {
    for (const ingredient of [{ item: '', quantity: '1', unit: 'cup' }, { item: null, quantity: '1', unit: 'cups' }]) {
        const h = await harness(); h.state.recipes = [recipe([ingredient])]; const before = h.snapshot();
        await assert.rejects(h.generate());
        assert.deepEqual(h.snapshot(), before);
        assert.deepEqual(h.state.commits, []);
    }
});

test('VM-028: 499 writes are atomic; 500 are rejected before any mutation', async () => {
    for (const count of [498, 499]) {
        const initial = Object.fromEntries(Array.from({ length: count }, (_,i) => [`old-${i}`,item(`Old ${i}`)]));
        const h = await harness(initial); const before = h.snapshot();
        if (count === 498) {
            await h.generate(); assert.deepEqual(h.state.commits, [499]); assert.equal(h.snapshot().length, 1);
        } else {
            await assert.rejects(h.generate(), /too large|499|500/i);
            assert.deepEqual(h.snapshot(), before); assert.deepEqual(h.state.commits, []);
        }
    }
});

test('VM-028 attempt 2: malformed-only quantities return an error without replacing saved groceries', async () => {
    for (const quantity of ['not-a-number', 'NaN', 'Infinity', '2oops', '', '   ', '1/0', '1..2', '-1']) {
        const h = await harness(); const before = h.snapshot();
        h.state.recipes = [recipe([{ item: 'Invalid rice', quantity, unit: 'cups' }])];
        const result = await h.generate();
        assert.equal(result.success, false, `quantity ${JSON.stringify(quantity)} must not replace the list`);
        assert.equal(result.skippedCount, 1);
        assert.match(result.message, /no addable ingredients/i);
        assert.deepEqual(h.snapshot(), before);
        assert.deepEqual(h.state.commits, []);
    }
});

test('VM-028 attempt 2: zero-only quantities are not addable and preserve checked items', async () => {
    for (const quantity of ['0', '0.0', '0/2', 0]) {
        const h = await harness(); const before = h.snapshot();
        h.state.recipes = [recipe([{ item: 'Zero rice', quantity, unit: 'cups' }])];
        const result = await h.generate();
        assert.equal(result.success, false);
        assert.equal(result.skippedCount, 1);
        assert.deepEqual(h.snapshot(), before);
        assert.deepEqual(h.state.commits, []);
    }
});

test('VM-028 attempt 2: mixed valid and invalid quantities write only valid ingredients and count skips', async () => {
    const h = await harness();
    h.state.records.get('old')!.mealPlanId = 'week-new';
    h.state.recipes = [recipe([
        { item: 'Rice', quantity: '2.5', unit: 'cups' },
        { item: 'Rice', quantity: 'not-a-number', unit: 'cups' },
        { item: 'Zero beans', quantity: '0', unit: 'cups' },
        { item: 'Beans', quantity: '1', unit: 'cups' },
    ])];
    const result = await h.generate();
    assert.equal(result.success, true); assert.equal(result.count, 2);
    assert.equal(result.skippedCount, 2);
    const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
    assert.deepEqual(generated.map(value => [value.name, value.quantity, value.isChecked]), [['Rice', 0.625, true], ['Beans', 0.25, false]]);
    assert.ok(h.state.records.has('manual'));
    assert.equal(h.state.commits.length, 1);
    assert.equal(h.state.directWrites, 0);
});

test('VM-028 attempt 2: positive fractions and tiny decimals stay addable rather than becoming zero', async () => {
    const h = await harness();
    h.state.recipes = [recipe([{ item: 'Rice', quantity: '1/2', unit: 'cups' }, { item: 'Oil', quantity: '0.01', unit: 'tsp' }])];
    const result = await h.generate();
    assert.equal(result.skippedCount, 0);
    assert.deepEqual(h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated').map(value => value.quantity), [0.125, 0.0025]);
});

test('VM-028 attempt 2: skip invalid quantities before inspecting malformed unit fields', async () => {
    const h = await harness();
    h.state.recipes = [recipe([{ item: 'Rice', quantity: '3', unit: 'cups' }, { item: 'Invalid', quantity: 'NaN', unit: 1 }])];
    const result = await h.generate();
    assert.equal(result.success, true); assert.equal(result.count, 1); assert.equal(result.skippedCount, 1);
    assert.equal(h.snapshot().filter(([,value]) => value.source === 'generated').length, 1);
});

test('VM-028 attempt 3: positive legacy amounts retain descriptive punctuation in mixed refreshes', async () => {
    const h = await harness({ old: item('Rice', { mealPlanId: 'week-new' }), lemon: item('Lemon', { quantity: 2, unit: ', juice and zest', mealPlanId: 'week-new' }), manual: item('Manual', { source: 'manual' }) });
    h.state.recipes = [recipe([
        { item: 'Rice', quantity: '3', unit: 'cups' },
        { item: 'Lemon', amount: '2, juice and zest' },
        { item: 'Tomatoes', amount: '2 (14 oz) cans' },
    ])];
    const result = await h.generate();
    assert.equal(result.success, true); assert.equal(result.count, 3); assert.equal(result.skippedCount, 0);
    const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
    assert.deepEqual(generated.map(value => [value.name, value.quantity, value.unit, value.isChecked]), [
        ['Rice', 0.75, 'cups', true], ['Lemon', 1, ', juice and zest', true], ['Tomatoes', 1, '(14 oz) cans', false],
    ]);
    assert.ok(h.state.records.has('manual'));
    assert.equal(h.state.commits.length, 1);
});

test('VM-028 attempt 3: malformed legacy numeric continuations and zero ranges remain unaddable', async () => {
    const h = await harness();
    h.state.recipes = [recipe([
        { item: 'Rice', quantity: '3', unit: 'cups' },
        ...['2..5 cups', '1/0 cup', '0 cup', '2-0 cloves', '2,000 g'].map(amount => ({ item: 'Invalid', amount })),
    ])];
    const result = await h.generate();
    assert.equal(result.success, true); assert.equal(result.count, 1); assert.equal(result.skippedCount, 5);
    assert.equal(h.snapshot().filter(([,value]) => value.source === 'generated').length, 1);
});

test('VM-001: five planned portions use recipe yield rather than five full recipes', async () => {
    const h = await harness();
    h.state.recipes = [recipe([{ item: 'Chicken', quantity: '24', unit: 'oz' }, { item: 'Rice', quantity: '2', unit: 'cups' }])];
    await h.generate({ id: 'five-portions', days: [{ meals: Array.from({ length: 5 }, () => ({ recipeId: 'recipe' })) }] });
    const generated = h.snapshot().map(([,v]) => v).filter(v => v.source === 'generated');
    assert.deepEqual(generated.map(v => [v.name, v.quantity, v.unit]), [['Chicken', 30, 'oz'], ['Rice', 2.5, 'cups']]);
});

for (const range of ['2-3', '2–3', '2 to 3']) {
    test(`VM-008: ${range} uses the upper endpoint, scales, then rounds countable totals once`, async () => {
        for (const structured of [false, true]) {
            const h = await harness();
            h.state.recipes = [recipe([
                structured ? { item: 'Garlic', quantity: range, unit: 'cloves' } : { item: 'Garlic', amount: `${range} cloves` },
                { item: 'Rice', amount: `${range} cups` },
                { item: 'Eggs', quantity: '3', unit: 'eggs' },
                { item: 'Limes', quantity: '3', unit: 'pcs' },
            ])];
            const result = await h.generate({ id: 'five-portions', days: [{ meals: Array.from({ length: 5 }, () => ({ recipeId: 'recipe' })) }] });
            assert.equal(result.skippedCount, 0);
            const generated = h.snapshot().map(([,v]) => v).filter(v => v.source === 'generated');
            assert.deepEqual(generated.map(v => [v.name, v.quantity]), [['Garlic', 4], ['Rice', 3.75], ['Eggs', 4], ['Limes', 4]]);
        }
    });
}

test('VM-008: mixed, Unicode and structured fractions share one numeric interpretation', async () => {
    const h = await harness();
    h.state.recipes = [recipe([{ item: 'Oil', amount: '½ cup' }, { item: 'Milk', amount: '1 1/2 cups' }, { item: 'Flour', quantity: '1/2', unit: 'cup' }])];
    await h.generate();
    const generated = h.snapshot().map(([,v]) => v).filter(v => v.source === 'generated');
    assert.deepEqual(generated.map(v => [v.name, v.quantity]), [['Oil', 0.125], ['Milk', 0.375], ['Flour', 0.125]]);
});

test('VM-008: aggregate aliases and whitespace without scaling qualitative amounts into numbers', async () => {
    const h = await harness();
    h.state.recipes = [recipe([{ item: ' Rice ', quantity: '1', unit: ' CUP ' }, { item: 'rice', amount: '2 cups' }, { item: 'Salt', amount: 'to taste' }])];
    await h.generate({ id: 'two-portions', days: [{ meals: [{ recipeId: 'recipe' }, { recipeId: 'recipe' }] }] });
    const generated = h.snapshot().map(([,v]) => v).filter(v => v.source === 'generated');
    assert.deepEqual(generated.map(v => [v.name, v.quantity, v.unit]), [['Rice', 1.5, 'cups'], ['Salt', 1, 'to taste']]);
});

test('VM-011: generator classifies whole food names rather than substrings', async () => {
    const h = await harness();
    h.state.recipes = [recipe(['Eggplant', 'Black pepper', 'Red bell pepper', 'Eggs', 'Peanut butter'].map(item => ({ item, quantity: '1', unit: 'pcs' })))];
    await h.generate();
    assert.deepEqual(h.snapshot().map(([,v]) => v).filter(v => v.source === 'generated').map(v => [v.name, v.aisle]), [
        ['Eggplant', 'Produce'], ['Black pepper', 'Pantry'], ['Red bell pepper', 'Produce'], ['Eggs', 'Proteins'], ['Peanut butter', 'Pantry'],
    ]);
});

test('G1 normalization retains checked state across equivalent cup/cups units', async () => {
    const h = await harness({ old: item(' rice ', { unit: ' CUP ', mealPlanId: 'week-new' }) });
    await h.generate();
    assert.equal(h.snapshot()[0][1].isChecked, true);
    assert.equal(h.snapshot()[0][1].quantity, 0.75);
});

test('G1 actual form countable units round after yield aggregation and preserve checked aliases', async () => {
    const h = await harness({ old: item('Onion', { unit: ' UNITS ', mealPlanId: 'five-portions' }), manual: item('Manual', { source: 'manual' }) });
    h.state.recipes = [recipe([
        ...['Unit', 'Large', 'Medium', 'Small', 'Stick'].map((unit, index) => ({ item: ['Onion', 'Eggs', 'Apples', 'Lemons', 'Butter'][index], quantity: '3', unit })),
        { item: 'Rice', quantity: '3', unit: 'Cup' },
    ])];
    const result = await h.generate({ id: 'five-portions', days: [{ meals: Array.from({ length: 5 }, () => ({ recipeId: 'recipe' })) }] });
    assert.equal(result.success, true); assert.equal(result.count, 6); assert.equal(result.skippedCount, 0);
    const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
    assert.deepEqual(generated.map(value => [value.name, value.quantity, value.unit]), [
        ['Onion', 4, 'pcs'], ['Eggs', 4, 'large'], ['Apples', 4, 'medium'], ['Lemons', 4, 'small'], ['Butter', 4, 'sticks'], ['Rice', 3.75, 'cups'],
    ]);
    assert.equal(generated[0].isChecked, true);
    assert.ok(h.state.records.has('manual'));
    assert.equal(h.state.commits.length, 1);
});

test('G1 packaged counts persist whole totals without scaling package size or losing checked/manual rows', async () => {
    for (const ingredient of [{ item: 'Tomatoes', amount: '1 (14 oz) can' }, { item: 'Tomatoes', quantity: '1', unit: '(14 oz) can' }]) {
        const h = await harness({ old: item('Tomatoes', { unit: '(14 oz) CANS', mealPlanId: 'five-portions' }), manual: item('Manual', { source: 'manual' }) });
        const manualBefore = h.state.records.get('manual');
        h.state.recipes = [recipe([ingredient, { item: 'Rice', quantity: '3', unit: 'cups' }])];
        const result = await h.generate({ id: 'five-portions', days: [{ meals: Array.from({ length: 5 }, () => ({ recipeId: 'recipe' })) }] });
        assert.equal(result.success, true); assert.equal(result.skippedCount, 0);
        const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
        assert.deepEqual(generated.map(value => [value.name, value.quantity, value.unit, value.isChecked]), [
            ['Tomatoes', 2, '(14 oz) cans', true], ['Rice', 3.75, 'cups', false],
        ]);
        assert.deepEqual(h.state.records.get('manual'), manualBefore);
        assert.equal(h.state.commits.length, 1);
    }
});


for (const [direction, oldUnit, ingredient, expectedUnit] of [
    ['prefix checked to suffix source', ' (14 OZ) CANS ', { item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' }, 'cans (14 oz)'],
    ['suffix checked to prefix source', ' CANS (14 OZ) ', { item: 'Tomatoes', amount: '1 (14 oz) can' }, '(14 oz) cans'],
] as const) {
    test(`VM037: actual refresh carries checked state ${direction}`, async () => {
        const h = await harness({
            old: item(' tomatoes ', { unit: oldUnit, mealPlanId: 'week-new' }),
            manual: item('Manual sentinel', { quantity: 7, unit: 'sticks', source: 'manual' }),
            legacy: item('Legacy sentinel', { quantity: 9, unit: 'cups', source: undefined }),
        });
        const manualBefore = structuredClone(h.state.records.get('manual'));
        const legacyBefore = structuredClone(h.state.records.get('legacy'));
        h.state.recipes = [recipe([ingredient, { item: 'Tomatoes', quantity: '1', unit: 'can (28 oz)' }, { item: 'Beans', quantity: '1', unit: 'can (14 oz)' }])];
        const result = await h.generate();
        assert.deepEqual(result, { success: true, count: 3, skippedCount: 0 });
        const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
        assert.deepEqual(generated.map(value => [value.name, value.quantity, value.unit, value.isChecked]), [
            ['Tomatoes', 1, expectedUnit, true], ['Tomatoes', 1, 'cans (28 oz)', false], ['Beans', 1, 'cans (14 oz)', false],
        ]);
        assert.ok(generated.every(value => value.mealPlanId === 'week-new'));
        assert.equal(h.state.records.has('old'), false);
        assert.deepEqual(h.state.records.get('manual'), manualBefore);
        assert.deepEqual(h.state.records.get('legacy'), legacyBefore);
        assert.equal(h.snapshot().length, 5);
        assert.deepEqual(h.state.commits, [4]);
        assert.equal(h.state.directWrites, 0);
    });
}

for (const [portions, expectedCans, expectedLargeCans, expectedRice] of [[1, 1, 1, 0.75], [5, 3, 2, 3.75]]) {
    for (const reverse of [false, true]) {
        test(`VM037: actual refresh writes one mixed-package total for ${portions} portions, reverse=${reverse}`, async () => {
            const h = await harness({
                old: item('Tomatoes', { unit: '(14 oz) CANS', mealPlanId: 'mixed-package-week' }),
                stale: item('Stale generated'),
                manual: item('Manual sentinel', { quantity: 7, unit: 'sticks', source: 'manual' }),
                legacy: item('Legacy sentinel', { quantity: 9, unit: 'cups', source: undefined }),
            });
            const manualBefore = structuredClone(h.state.records.get('manual'));
            const legacyBefore = structuredClone(h.state.records.get('legacy'));
            const tomatoes = [{ item: 'Tomatoes', amount: '1 (14 oz) can' }, { item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' }];
            if (reverse) tomatoes.reverse();
            h.state.recipes = [recipe([...tomatoes, { item: 'Tomatoes', quantity: '1', unit: 'can (28 oz)' }, { item: 'Rice', quantity: '3', unit: 'cups' }])];
            const result = await h.generate({ id: 'mixed-package-week', days: [{ meals: Array.from({ length: portions }, () => ({ recipeId: 'recipe' })) }] });
            assert.equal(result.success, true); assert.equal(result.skippedCount, 0);
            const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
            assert.deepEqual(generated.map(value => [value.name, value.quantity, value.isChecked]), [
                ['Tomatoes', expectedCans, true], ['Tomatoes', expectedLargeCans, false], ['Rice', expectedRice, false],
            ]);
            assert.equal(result.count, 3);
            assert.ok(['(14 oz) cans', 'cans (14 oz)'].includes(generated[0].unit));
            assert.equal(generated[1].unit, 'cans (28 oz)'); assert.equal(generated[2].unit, 'cups');
            assert.ok(generated.every(value => value.mealPlanId === 'mixed-package-week'));
            assert.equal(h.state.records.has('old'), false); assert.equal(h.state.records.has('stale'), false);
            assert.deepEqual(h.state.records.get('manual'), manualBefore);
            assert.deepEqual(h.state.records.get('legacy'), legacyBefore);
            assert.equal(h.snapshot().length, 5);
            assert.deepEqual(h.state.commits, [5]);
            assert.equal(h.state.directWrites, 0);
        });
    }
}

for (const [label, previous] of [
    ['checked different package size', item('Tomatoes', { unit: 'can (28 oz)' })],
    ['checked different food name', item('Beans', { unit: 'can (14 oz)' })],
    ['unchecked equivalent package', item('Tomatoes', { unit: 'can (14 oz)', isChecked: false })],
] as const) {
    test(`VM037: actual refresh does not transfer ${label} to 14 oz Tomatoes`, async () => {
        const h = await harness({
            old: { ...previous, mealPlanId: 'week-new' },
            manual: item('Manual sentinel', { source: 'manual' }),
            legacy: item('Legacy sentinel', { source: undefined }),
        });
        const manualBefore = structuredClone(h.state.records.get('manual'));
        const legacyBefore = structuredClone(h.state.records.get('legacy'));
        h.state.recipes = [recipe([{ item: 'Tomatoes', amount: '1 (14 oz) can' }])];
        assert.deepEqual(await h.generate(), { success: true, count: 1, skippedCount: 0 });
        const generated = h.snapshot().map(([,value]) => value).filter(value => value.source === 'generated');
        assert.deepEqual(generated.map(value => [value.name, value.quantity, value.unit, value.isChecked]), [['Tomatoes', 1, '(14 oz) cans', false]]);
        assert.deepEqual(h.state.records.get('manual'), manualBefore);
        assert.deepEqual(h.state.records.get('legacy'), legacyBefore);
        assert.equal(h.state.records.has('old'), false);
        assert.deepEqual(h.state.commits, [2]);
        assert.equal(h.state.directWrites, 0);
    });
}

test('1.0 G2 R2: another week does not inherit checked groceries', async () => {
    const h = await harness({ old: item('Rice', { mealPlanId: 'week-1' }) });
    assert.equal((await h.generate({ ...plan(), id: 'week-2' })).success, true);
    const generated = h.snapshot().map(([, value]) => value);
    assert.equal(generated.length, 1);
    assert.equal(generated[0].mealPlanId, 'week-2');
    assert.equal(generated[0].isChecked, false);
});

test('1.0 G2 R2: a same-week refresh keeps checked groceries', async () => {
    const h = await harness({ old: item('Rice', { mealPlanId: 'week-2' }) });
    assert.equal((await h.generate({ ...plan(), id: 'week-2' })).success, true);
    const generated = h.snapshot().map(([, value]) => value);
    assert.equal(generated.length, 1);
    assert.equal(generated[0].mealPlanId, 'week-2');
    assert.equal(generated[0].isChecked, true);
});

test('1.0 G2 R2: a generated item without a plan does not carry its tick', async () => {
    const h = await harness({ old: item('Rice') });
    assert.equal((await h.generate({ ...plan(), id: 'week-2' })).success, true);
    const generated = h.snapshot().map(([, value]) => value);
    assert.equal(generated.length, 1);
    assert.equal(generated[0].mealPlanId, 'week-2');
    assert.equal(generated[0].isChecked, false);
});
