import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parsePantryLine, parsePantryLines, guessCategory } from '../../src/features/pantry/pantry-parse.ts';

/**
 * AUD-098. The parsing used to live inside the write loop, so it had never been
 * tested at all. These lock the behaviour that was there, and pin the two edge
 * cases that used to produce nonsense items.
 */

test('AUD-098: a number and unit stuck together', () => {
    assert.deepEqual(parsePantryLine('200g Greek Yogurt'), {
        name: 'Greek Yogurt', quantity: 200, unit: 'g', category: 'Fridge', isLowStock: false,
    });
});

test('AUD-098: a number, a separate unit, then the name', () => {
    assert.deepEqual(parsePantryLine('2 kg Rice'), {
        name: 'Rice', quantity: 2, unit: 'kg', category: 'Grains', isLowStock: false,
    });
});

test('AUD-098: a bare count keeps the default unit', () => {
    const item = parsePantryLine('12 Eggs');
    assert.equal(item?.quantity, 12);
    assert.equal(item?.unit, 'pc');
    assert.equal(item?.name, 'Eggs');
});

test('AUD-098: a name on its own is quantity 1', () => {
    const item = parsePantryLine('Salt');
    assert.equal(item?.quantity, 1);
    assert.equal(item?.name, 'Salt');
    assert.equal(item?.category, 'Other');
});

test('AUD-098: a word that looks like a unit is not one', () => {
    // "Large Eggs" must not read "Large" as a unit.
    const item = parsePantryLine('6 Large Eggs');
    assert.equal(item?.quantity, 6);
    assert.equal(item?.unit, 'pc');
    assert.equal(item?.name, 'Large Eggs');
});

test('AUD-098: a quantity with no name is not an item', () => {
    // This used to create a pantry entry with an empty name.
    assert.equal(parsePantryLine('200g'), null);
    assert.equal(parsePantryLine('   '), null);
    assert.equal(parsePantryLine(''), null);
});

test('AUD-098: blank lines are dropped, not saved', () => {
    const items = parsePantryLines('200g Oats\n\n  \n2 kg Rice\n');
    assert.equal(items.length, 2);
    assert.deepEqual(items.map(i => i.name), ['Oats', 'Rice']);
});

test('AUD-098: no item is ever given an expiry', () => {
    // AUD-095: an expiry gets acted on, so it must come from the user. There is
    // still no UI to enter one.
    for (const item of parsePantryLines('200g Oats\n1 Milk\nChicken breast')) {
        assert.equal('expiresAt' in item, false, `${item.name} must not carry an expiry`);
    }
});

test('AUD-098: category is guessed from the name, not the line', () => {
    assert.equal(guessCategory('Chicken breast'), 'Proteins');
    assert.equal(guessCategory('Frozen peas'), 'Freezer');
    assert.equal(guessCategory('Sourdough bread'), 'Grains');
    assert.equal(guessCategory('Widget'), 'Other');
});
