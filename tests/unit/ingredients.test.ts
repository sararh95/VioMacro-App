import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync('src/shared/ingredients.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { parseIngredientAmount: parse, scaleIngredientAmount: scale, formatIngredientAmount: format,
    aggregateIngredients: aggregate, formatQuantity, recipeServings, parseGroceryInput, groceryIngredientKey, formatGroceryAmount, guessAisle } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('shared parser validates full numeric tokens before coercion, including legacy forms', () => {
    for (const quantity of ['0', 0, '-1', '1/0', '2oops', '2..5', 'Infinity', 'NaN', '', null, false, '2-0', '3-2']) {
        assert.equal(parse({ item: 'Rice', quantity, unit: 'cups', amount: '2 cups' }), null, String(quantity));
    }
    for (const amount of ['2..5 cups', '1/0 cup', '0 cup', '2-0 cloves', '2,000 g', '2 to nope cloves']) {
        assert.equal(parse({ item: 'Rice', amount }), null, amount);
    }
    assert.equal(parse({ item: 'Rice' }), null);
    assert.equal(parse({ item: 'Rice', quantity: '0.0001', unit: 'tsp' }).max, 0.0001);
});

test('shared parser supports fractions, decimals, Unicode and descriptive legacy suffixes', () => {
    for (const [amount, expected] of [['1/2 cup', 0.5], ['1 1/2 cups', 1.5], ['½ cup', 0.5], ['1½ cups', 1.5], ['1 ¾ cups', 1.75], ['.25 cups', 0.25], ['1e-2 tsp', 0.01], ['2, juice and zest', 2], ['2 (14 oz) cans', 2]] as const) {
        assert.equal(parse({ item: 'Food', amount }).max, expected, amount);
    }
    assert.equal(format({ item: 'Oil', amount: '½ cup' }), '½ cup');
});

for (const range of ['2-3', '2–3', '2 to 3']) {
    test(`shared range parser and recipe scaling retain ${range} wording`, () => {
        for (const ingredient of [{ item: 'Garlic', amount: `${range} cloves` }, { item: 'Garlic', quantity: range, unit: 'cloves' }]) {
            const amount = parse(ingredient);
            assert.equal(amount.min, 2); assert.equal(amount.max, 3);
            assert.equal(format(ingredient), `${range} cloves`);
            const separator = range.replace('2', '').replace('3', '');
            assert.equal(format(ingredient, 2), `4${separator}6 cloves`);
            assert.equal(scale(amount, 0.25).max, 0.75);
        }
    });
}

test('qualitative and unknown view amounts keep their wording; unknown groceries are skipped', () => {
    for (const amount of ['pinch', 'a dash', 'to taste', 'as needed']) assert.equal(format({ item: 'Salt', amount }, 5), amount);
    assert.equal(format({ item: 'Salt', amount: 'a little' }, 5), 'a little');
    assert.equal(format({ item: 'Salt' }), '');
    const result = aggregate([{ ingredient: { item: 'Salt', amount: 'to taste' }, factor: 5 }, { ingredient: { item: 'Other', amount: 'a little' }, factor: 1 }]);
    assert.equal(result.items[0].quantity, 1); assert.equal(result.skippedCount, 1);
    assert.equal(formatGroceryAmount(1, 'to taste'), 'to taste');
});

test('G1 preserves usable legacy pinch/dash descriptions supported before normalization', () => {
    for (const amount of ['pinch of', 'a pinch, to taste', 'dash (optional)']) {
        const result = aggregate([{ ingredient: { item: 'Salt', amount }, factor: 5 }]);
        assert.equal(result.skippedCount, 0, amount);
        assert.deepEqual(result.items.map(item => [item.quantity, item.unit]), [[1, amount]]);
        assert.equal(format({ item: 'Salt', amount }, 5), amount);
    }
});

test('yield fallback and scale validation never introduce NaN or silently zero tiny amounts', () => {
    for (const value of [undefined, 0, -1, NaN, Infinity, '4']) assert.equal(recipeServings(value), 1);
    assert.equal(recipeServings(4), 4);
    const amount = parse({ item: 'Oil', quantity: '0.0001', unit: 'tsp' });
    assert.equal(scale(amount, 0.25).max, 0.000025);
    assert.notEqual(formatQuantity(0.000025), '0');
    for (const factor of [0, -1, NaN, Infinity]) assert.throws(() => scale(amount, factor));
    assert.throws(() => aggregate([{ ingredient: { item: 'Rice', quantity: '1e308', unit: 'cups' }, factor: 2 }]));
});

test('unit aliases preserve equivalent checked keys and countable floating point boundaries', () => {
    assert.equal(groceryIngredientKey(' Rice ', 'CUP'), groceryIngredientKey('rice', 'cups'));
    const result = aggregate(Array.from({ length: 10 }, () => ({ ingredient: { item: 'Garlic', quantity: '.1', unit: 'clove' }, factor: 3 })));
    assert.equal(result.items[0].quantity, 3);
    assert.deepEqual(aggregate([{ ingredient: { item: '', quantity: '1', unit: 'cup' }, factor: 1 }]), { items: [], skippedCount: 1 });
});

test('quick-add uses the same fraction/range/unit parser and aisle classifier', () => {
    assert.deepEqual(parseGroceryInput('1 1/2 cups rice'), { name: 'rice', quantity: 1.5, unit: 'cups', aisle: 'Pantry' });
    assert.deepEqual(parseGroceryInput('½ cup milk'), { name: 'milk', quantity: 0.5, unit: 'cups', aisle: 'Dairy' });
    assert.deepEqual(parseGroceryInput('2–3 cloves garlic'), { name: 'garlic', quantity: 3, unit: 'cloves', aisle: 'Produce' });
    assert.deepEqual(parseGroceryInput('2 eggs'), { name: 'eggs', quantity: 2, unit: 'pcs', aisle: 'Proteins' });
    assert.deepEqual(parseGroceryInput('Black pepper'), { name: 'Black pepper', quantity: 1, unit: 'pcs', aisle: 'Pantry' });
    assert.deepEqual(parseGroceryInput('Eggplant'), { name: 'Eggplant', quantity: 1, unit: 'pcs', aisle: 'Produce' });
    for (const input of ['', '0 apples', '2..5 cups rice', '1/0 cup milk']) assert.equal(parseGroceryInput(input), null);
});

test('whole-food classification retains supported berry, fish and pantry food families', () => {
    for (const name of ['Berry', 'Blueberry', 'Blackberries', 'Cranberries']) assert.equal(guessAisle(name), 'Produce', name);
    for (const name of ['Whitefish', 'Catfish', 'Swordfish']) assert.equal(guessAisle(name), 'Proteins', name);
    for (const name of ['Oatmeal', 'Walnuts', 'Hazelnuts', 'Soybeans', 'Flaxseed']) assert.equal(guessAisle(name), 'Pantry', name);
});

for (const [unit, normalized] of [['Unit', 'pcs'], ['Large', 'large'], ['Medium', 'medium'], ['Small', 'small'], ['Stick', 'sticks']]) {
    test(`recipe form countable ${unit} rounds only the final grocery total`, () => {
        const ingredient = { item: 'Food', quantity: '3', unit };
        const result = aggregate(Array.from({ length: 5 }, () => ({ ingredient, factor: 0.25 })));
        assert.deepEqual(result.items.map(item => [item.quantity, item.unit]), [[4, normalized]]);
        assert.equal(format(ingredient), `3 ${unit}`);
        assert.equal(format(ingredient, 1.25), `3 3/4 ${unit}`, 'recipe views retain fractional servings');
        assert.equal(aggregate([{ ingredient: { ...ingredient, unit: 'Cup' }, factor: 1.25 }]).items[0].quantity, 3.75);
    });
}

test('quick-add recognizes the recipe form countable vocabulary and equivalent checked keys', () => {
    for (const [unit, normalized] of [['Unit', 'pcs'], ['Large', 'large'], ['Medium', 'medium'], ['Small', 'small'], ['Stick', 'sticks']]) {
        assert.deepEqual(parseGroceryInput(`3.75 ${unit} onion`), { name: 'onion', quantity: 4, unit: normalized, aisle: 'Produce' });
    }
    assert.equal(groceryIngredientKey('Onion', ' UNITS '), groceryIngredientKey('onion', 'pcs'));
    assert.equal(groceryIngredientKey('Butter', 'Stick'), groceryIngredientKey('butter', 'sticks'));
    assert.notEqual(groceryIngredientKey('Eggs', 'Large'), groceryIngredientKey('Eggs', 'Small'));
});

for (const [unit, normalized] of [['(14 oz) can', '(14 oz) cans'], ['(14 oz) cans', '(14 oz) cans'],
    ['can (14 oz)', 'cans (14 oz)'], ['(6 oz) stick', '(6 oz) sticks']]) {
    test(`packaged count ${unit} scales only the count and rounds after complete aggregation`, () => {
        for (const ingredient of [{ item: 'Tomatoes', amount: `1 ${unit}` }, { item: 'Tomatoes', quantity: '1', unit }]) {
            const result = aggregate(Array.from({ length: 5 }, () => ({ ingredient, factor: 0.25 })));
            assert.deepEqual(result.items.map(item => [item.quantity, item.unit]), [[2, normalized]]);
            assert.equal(format(ingredient), `1 ${unit}`);
            assert.equal(format(ingredient, 1.25), `1 1/4 ${unit}`, 'package size is not multiplied and recipe views stay fractional');
        }
    });
}

test('packaged aliases share checked identity while different package sizes stay separate', () => {
    assert.equal(groceryIngredientKey('Tomatoes', '(14 oz) can'), groceryIngredientKey(' tomatoes ', '(14 oz) CANS'));
    assert.notEqual(groceryIngredientKey('Tomatoes', '(14 oz) can'), groceryIngredientKey('Tomatoes', '(28 oz) can'));
    const result = aggregate([{ ingredient: { item: 'Rice', quantity: '1', unit: '(14 oz) cup' }, factor: 1.25 }]);
    assert.deepEqual(result.items.map(item => [item.quantity, item.unit]), [[1.25, '(14 oz) cups']], 'measured units remain fractional');
});

test('quick-add retains packaged count units and sizes through the shared aggregation path', () => {
    for (const [input, unit] of [['1.25 (14 oz) can tomatoes', '(14 oz) cans'], ['1.25 can (14 oz) tomatoes', 'cans (14 oz)']]) {
        assert.deepEqual(parseGroceryInput(input), { name: 'tomatoes', quantity: 2, unit, aisle: 'Produce' });
    }
});


test('VM037: complete packaged count placements share identity across aliases and whitespace', () => {
    for (const [prefix, suffix] of [
        ['(14 oz) can', 'can (14 oz)'],
        [' (14 OZ) CANS ', ' Cans (14 oz) '],
        ['(14   oz) can', 'can (14 oz)'],
        ['(6 oz) stick', 'sticks (6 oz)'],
        ['(6 oz) slice', 'slices (6 oz)'],
        ['(6 oz) stalk', 'stalks (6 oz)'],
        ['(6 oz) clove', 'cloves (6 oz)'],
        ['(6 oz) egg', 'eggs (6 oz)'],
        ['(6 oz) unit', 'pcs (6 oz)'],
        ['(6 oz) large', 'large (6 oz)'],
        ['(6 oz) medium', 'medium (6 oz)'],
        ['(6 oz) small', 'small (6 oz)'],
    ]) {
        assert.equal(groceryIngredientKey(' Tomatoes ', prefix), groceryIngredientKey('tomatoes', suffix), `${prefix} / ${suffix}`);
        const result = aggregate([
            { ingredient: { item: ' Tomatoes ', quantity: '1', unit: prefix }, factor: 0.25 },
            { ingredient: { item: 'tomatoes', quantity: '1', unit: suffix }, factor: 0.25 },
        ]);
        assert.equal(result.skippedCount, 0);
        assert.deepEqual(result.items.map(row => [row.name, row.quantity]), [['Tomatoes', 1]], `${prefix} / ${suffix} must combine before ceiling`);
    }
});

for (const [portions, expectedCans, expectedRice] of [[1, 1, 0.75], [5, 3, 3.75]]) {
    for (const reverse of [false, true]) {
        test(`VM037: ${portions} portions combine mixed package placements before ceiling, reverse=${reverse}`, () => {
            const tomatoes = [{ item: 'Tomatoes', amount: '1 (14 oz) can' }, { item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' }];
            if (reverse) tomatoes.reverse();
            const result = aggregate(Array.from({ length: portions }, () => [
                ...tomatoes.map(ingredient => ({ ingredient, factor: 0.25 })),
                { ingredient: { item: 'Rice', quantity: '3', unit: 'cups' }, factor: 0.25 },
            ]).flat());
            assert.equal(result.skippedCount, 0);
            assert.deepEqual(result.items.map(row => [row.name, row.quantity]), [['Tomatoes', expectedCans], ['Rice', expectedRice]]);
            assert.ok(['(14 oz) cans', 'cans (14 oz)'].includes(result.items[0].unit), 'identity must not require a new display placement');
            assert.equal(result.items[1].unit, 'cups');
        });
    }
}

for (const [label, leftName, leftUnit, rightName, rightUnit, expected] of [
    ['size', 'Tomatoes', '(14 oz) can', 'Tomatoes', 'can (28 oz)', [['Tomatoes', 1, '(14 oz) cans'], ['Tomatoes', 1, 'cans (28 oz)']]],
    ['count noun', 'Tomatoes', '(14 oz) can', 'Tomatoes', 'stick (14 oz)', [['Tomatoes', 1, '(14 oz) cans'], ['Tomatoes', 1, 'sticks (14 oz)']]],
    ['food name', 'Tomatoes', '(14 oz) can', 'Beans', 'can (14 oz)', [['Tomatoes', 1, '(14 oz) cans'], ['Beans', 1, 'cans (14 oz)']]],
    ['bare can', 'Tomatoes', '(14 oz) can', 'Tomatoes', 'can', [['Tomatoes', 1, '(14 oz) cans'], ['Tomatoes', 1, 'cans']]],
    ['prefix preparation', 'Tomatoes', '(14 oz) can, drained', 'Tomatoes', 'can (14 oz)', [['Tomatoes', 1, '(14 oz) cans, drained'], ['Tomatoes', 1, 'cans (14 oz)']]],
    ['suffix preparation', 'Tomatoes', '(14 oz) can', 'Tomatoes', 'can (14 oz), drained', [['Tomatoes', 1, '(14 oz) cans'], ['Tomatoes', 1, 'cans (14 oz), drained']]],
    ['different preparation text', 'Tomatoes', '(14 oz) can, drained', 'Tomatoes', 'can (14 oz), undrained', [['Tomatoes', 1, '(14 oz) cans, drained'], ['Tomatoes', 1, 'cans (14 oz), undrained']]],
    ['measured placements', 'Tomatoes', '(14 oz) cup', 'Tomatoes', 'cup (14 oz)', [['Tomatoes', 0.25, '(14 oz) cups'], ['Tomatoes', 0.25, 'cups (14 oz)']]],
] as const) {
    test(`VM037: package identity keeps ${label} distinct in actual aggregation`, () => {
        assert.notEqual(groceryIngredientKey(leftName, leftUnit), groceryIngredientKey(rightName, rightUnit));
        const result = aggregate([
            { ingredient: { item: leftName, quantity: '1', unit: leftUnit }, factor: 0.25 },
            { ingredient: { item: rightName, quantity: '1', unit: rightUnit }, factor: 0.25 },
        ]);
        assert.equal(result.skippedCount, 0);
        assert.deepEqual(result.items.map(row => [row.name, row.quantity, row.unit]), expected);
    });
}

test('VM037: identity sharing preserves original package recipe wording and quick-add display', () => {
    const legacy = { item: 'Tomatoes', amount: '1 (14 oz) can' };
    const structured = { item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' };
    assert.equal(format(legacy), '1 (14 oz) can');
    assert.equal(format(structured), '1 can (14 oz)');
    assert.equal(format(legacy, 1.25), '1 1/4 (14 oz) can');
    assert.equal(format(structured, 1.25), '1 1/4 can (14 oz)');
    assert.deepEqual(parseGroceryInput('1.25 (14 oz) can tomatoes'), { name: 'tomatoes', quantity: 2, unit: '(14 oz) cans', aisle: 'Produce' });
    assert.deepEqual(parseGroceryInput('1.25 can (14 oz) tomatoes'), { name: 'tomatoes', quantity: 2, unit: 'cans (14 oz)', aisle: 'Produce' });
});

test('VM047: one canonical grocery unit uses its singular label', () => {
    for (const [plural, singular] of [['cups', 'cup'], ['lbs', 'lb'], ['cloves', 'clove'], ['eggs', 'egg'], ['pcs', 'pc'], ['sticks', 'stick'], ['cans', 'can'], ['slices', 'slice'], ['stalks', 'stalk']]) {
        assert.equal(formatGroceryAmount(1, plural), `1 ${singular}`, plural);
        assert.equal(formatGroceryAmount(2, plural), `2 ${plural}`, plural);
    }
});

test('VM047: known legacy plural measures and count aliases are singular at one', () => {
    for (const [plural, singular] of [['tablespoons', 'tablespoon'], ['teaspoons', 'teaspoon'], ['grams', 'gram'], ['kilograms', 'kilogram'], ['pounds', 'pound'], ['ounces', 'ounce'], ['milliliters', 'milliliter'], ['liters', 'liter'], ['pieces', 'piece'], ['units', 'unit']]) {
        assert.equal(formatGroceryAmount(1, plural), `1 ${singular}`, plural);
        assert.equal(formatGroceryAmount(2.5, plural), `2 1/2 ${plural}`, plural);
    }
});

test('VM047: singular labels retain the unit casing and package descriptions', () => {
    for (const [plural, singular] of [['CUPS', 'CUP'], ['Cans', 'Can'], ['(14 oz) cans', '(14 oz) can'], ['cans (14 oz)', 'can (14 oz)'], ['(6 oz) sticks, softened', '(6 oz) stick, softened'], ['cups, cooked', 'cup, cooked']]) {
        assert.equal(formatGroceryAmount(1, plural), `1 ${singular}`, plural);
        assert.equal(formatGroceryAmount(3, plural), `3 ${plural}`, plural);
    }
});

test('VM047: unchanged measures, qualitative words and unknown units are retained', () => {
    for (const unit of ['cup', 'lb', 'g', 'kg', 'oz', 'ml', 'l', 'tbsp', 'tsp', 'large', 'medium', 'small', 'glass', 'special pieces', '', ', juice and zest']) {
        assert.equal(formatGroceryAmount(1, unit), `1 ${unit}`, unit);
    }
    for (const unit of ['pinch', 'a dash', 'to taste', 'as needed']) assert.equal(formatGroceryAmount(1, unit), unit);
    for (const quantity of [0, 0.5, 1.25, 2, 2.75]) assert.equal(formatGroceryAmount(quantity, 'cups'), `${formatQuantity(quantity)} cups`);
});

test('VM047: singular display does not mutate totals, identity or original recipe wording', () => {
    const ingredient = { item: 'Tomatoes', amount: '2 (14 oz) cans' };
    const entries = [{ ingredient, factor: 0.5 }];
    const before = JSON.stringify(entries);
    const result = aggregate(entries);
    const total = result.items[0];
    const key = groceryIngredientKey(total.name, total.unit);
    const saved = JSON.stringify(result);
    assert.equal(formatGroceryAmount(total.quantity, total.unit), '1 (14 oz) can');
    assert.equal(JSON.stringify(result), saved);
    assert.equal(JSON.stringify(entries), before);
    assert.deepEqual([total.quantity, total.unit], [1, '(14 oz) cans']);
    assert.equal(groceryIngredientKey(total.name, total.unit), key);
    assert.equal(format(ingredient), '2 (14 oz) cans');
    assert.equal(format(ingredient, 0.5), '1 (14 oz) cans', 'recipe views preserve the original unit wording');
    assert.equal(format({ item: 'Garlic', amount: '2–3 cloves' }), '2–3 cloves');
});

test('VM047: legacy missing or nontext units retain their existing display without throwing', () => {
    // Grocery reads cast legacy documents to GroceryItem without validating unit.
    for (const unit of [undefined, null, 2, { label: 'cups' }]) {
        assert.equal(formatGroceryAmount(1, unit), `1 ${String(unit)}`);
        assert.equal(formatGroceryAmount(2, unit), `2 ${String(unit)}`);
    }
    assert.equal(formatGroceryAmount(1, 'constructor'), '1 constructor', 'unknown words must not read inherited dictionary entries');
});


// R13 contributions are isolated: good items before and after must survive.
type G10bEntry = { ingredient: unknown; factor: number };
const g10bRice = { name: 'Rice', quantity: 2, unit: 'cups', aisle: 'Pantry' };
const g10bBeans = { name: 'Beans', quantity: 3, unit: 'g', aisle: 'Pantry' };
function g10bSandwich(entries: G10bEntry[]) {
    return aggregate([
        { ingredient: { item: 'Rice', quantity: '2', unit: 'cups' }, factor: 1 },
        ...entries,
        { ingredient: { item: 'Beans', quantity: '3', unit: 'g' }, factor: 1 },
    ]);
}
function g10bEntry(quantity: string, unit = 'ml', factor = 1, item = 'Milk'): G10bEntry {
    return { ingredient: { item, quantity, unit }, factor };
}

test('G10b R13 keeps Butter whose raw unit shrinks from 52 to 45 characters', () => {
    const unit = 'tablespoons (level, plus extra for greasing the pan)';
    assert.equal(unit.length, 52);
    assert.deepEqual(g10bSandwich([g10bEntry('1', unit, 1, 'Butter')]), {
        items: [g10bRice, { name: 'Butter', quantity: 1, unit: 'tbsp (level, plus extra for greasing the pan)', aisle: 'Dairy' }, g10bBeans], skippedCount: 0,
    });
});

test('G10b R13 quick add keeps a package unit shortened by whitespace normalization', () => {
    assert.deepEqual(parseGroceryInput('2 cups rice'), { ...g10bRice, name: 'rice' });
    assert.deepEqual(parseGroceryInput('1 (14' + ' '.repeat(46) + 'oz) can tomatoes'), {
        name: 'tomatoes', quantity: 1, unit: '(14 oz) cans', aisle: 'Produce',
    });
    assert.deepEqual(parseGroceryInput('3 g beans'), { ...g10bBeans, name: 'beans' });
});

test('G10b R13 enforces unit 50 and 51 boundaries after normalization', () => {
    const kept = 'tablespoons ' + 'x'.repeat(45);
    const skipped = 'tablespoons ' + 'x'.repeat(46);
    assert.deepEqual(g10bSandwich([g10bEntry('1', kept), g10bEntry('1', skipped)]), {
        items: [g10bRice, { name: 'Milk', quantity: 1, unit: 'tbsp ' + 'x'.repeat(45), aisle: 'Dairy' }, g10bBeans], skippedCount: 1,
    });
});

test('G10b R13 enforces cleaned name 200 and 201 boundaries', () => {
    const kept = 'x'.repeat(200);
    const skipped = 'x'.repeat(201);
    assert.deepEqual(g10bSandwich([g10bEntry('1', 'g', 1, '  ' + kept + '  '), g10bEntry('1', 'g', 1, skipped)]), {
        items: [g10bRice, { name: kept, quantity: 1, unit: 'g', aisle: 'Other' }, g10bBeans], skippedCount: 1,
    });
});

test('G10b R13 skips a single amount over 100000 without losing neighbors', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('100001')]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
});

test('G10b R13 skips a contribution that pushes 60000 plus 60000 over the limit', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('60000'), g10bEntry('60000'), g10bEntry('1')]), {
        items: [g10bRice, { name: 'Milk', quantity: 60001, unit: 'ml', aisle: 'Dairy' }, g10bBeans], skippedCount: 1,
    });
});

test('G10b R13 skips an amount made too large by small recipe servings', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('60000', 'ml', 1 / 0.5)]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
});

test('G10b R13 checks the countable rounded amount against 100000', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('100000.1', 'Large', 1, 'Eggs')]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
});

test('G10b R13 keeps total 100000 and skips the contribution reaching 100001', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('60000'), g10bEntry('40000'), g10bEntry('1')]), {
        items: [g10bRice, { name: 'Milk', quantity: 100000, unit: 'ml', aisle: 'Dairy' }, g10bBeans], skippedCount: 1,
    });
});

test('G10b R13 skips null and non-object entries without interrupting good items', () => {
    for (const ingredient of [null, undefined, false, 12, 'not an ingredient', []]) {
        assert.deepEqual(g10bSandwich([{ ingredient, factor: 1 }]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
    }
});

test('G10b R13 skips scaling overflow instead of throwing', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('1e308', 'ml', 1 / 0.25)]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
});

test('G10b R13 skips two huge amounts instead of overflowing their sum', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('1e308'), g10bEntry('1e308')]), { items: [g10bRice, g10bBeans], skippedCount: 2 });
});

test('G10b R13 skips scaling underflow instead of throwing or silently writing zero', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('5e-324', 'ml', 1 / 4)]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
});

test('G10b R13 rejects an infinite scale without interrupting other ingredients', () => {
    assert.deepEqual(g10bSandwich([g10bEntry('1', 'ml', 1 / Number.MIN_VALUE)]), { items: [g10bRice, g10bBeans], skippedCount: 1 });
});

test('G10b R13 unit aliases ignore inherited Object properties and preserve identity', () => {
    for (const unit of ['constructor', 'toString']) {
        const result = g10bSandwich([g10bEntry('1', unit)]);
        assert.deepEqual(result, {
            items: [g10bRice, { name: 'Milk', quantity: 1, unit: unit.toLowerCase(), aisle: 'Dairy' }, g10bBeans], skippedCount: 0,
        });
        assert.equal(groceryIngredientKey('Milk', unit), JSON.stringify(['milk', unit.toLowerCase()]));
    }
});

test('G10b R13 quick add does not treat constructor as a known unit alias', () => {
    assert.deepEqual(parseGroceryInput('2 cups rice'), { ...g10bRice, name: 'rice' });
    assert.deepEqual(parseGroceryInput('1 constructor milk'), { name: 'constructor milk', quantity: 1, unit: 'pcs', aisle: 'Dairy' });
    assert.deepEqual(parseGroceryInput('3 g beans'), { ...g10bBeans, name: 'beans' });
});
