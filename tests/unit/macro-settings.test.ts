import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readMacroSettings } from '../../src/shared/macro-settings.ts';

const defaultSplit = { protein: 30, carbs: 35, fat: 35 };

test('G34 macro settings keep complete percentage splits including zero', () => {
    const macroSplit = { protein: 0, carbs: 50, fat: 50 };
    assert.deepEqual(readMacroSettings({ macroSplit }).macroSplit, macroSplit);
});

test('G34 macro settings use the full default for missing or invalid percentage splits', () => {
    const cases = {
        missing: undefined,
        partial: { protein: 0 },
        NaN: { protein: 40, carbs: NaN, fat: 30 },
        infinite: { protein: 40, carbs: 30, fat: Infinity },
        string: { protein: '40', carbs: 30, fat: 30 },
        null: null,
    };
    for (const [name, macroSplit] of Object.entries(cases)) {
        assert.deepEqual(readMacroSettings({ macroSplit }).macroSplit, defaultSplit, name);
    }
});

test('G34 macro settings leave an absent gram map unset', () => {
    assert.equal(readMacroSettings({}).macroTargets, undefined);
});

test('G34 macro settings fill invalid gram parts with zero and keep finite parts', () => {
    assert.deepEqual(readMacroSettings({ macroTargets: { protein: 160 } }).macroTargets,
        { protein: 160, carbs: 0, fat: 0 });
    assert.deepEqual(readMacroSettings({ macroTargets: { protein: NaN, carbs: '200', fat: 70 } }).macroTargets,
        { protein: 0, carbs: 0, fat: 70 });
    assert.deepEqual(readMacroSettings({ macroTargets: { protein: 160, carbs: 200, fat: 0 } }).macroTargets,
        { protein: 160, carbs: 200, fat: 0 });
});
