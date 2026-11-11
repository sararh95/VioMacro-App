import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

// Render actual components and helpers; only transpilation/import resolution is
// supplied here. React, SmartText and quantity logic run unchanged.
const require = createRequire(import.meta.url);
function sourceModule(path: string): string {
    const absolute = resolve(path);
    const code = ts.transpileModule(readFileSync(absolute, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    }).outputText.replace(/from\s+(['"])([^'"]+)\1/g, (_all, _quote, specifier: string) => {
        if (!specifier.startsWith('.')) return `from ${JSON.stringify(pathToFileURL(require.resolve(specifier)).href)}`;
        const target = resolve(dirname(absolute), specifier);
        const file = ['', '.ts', '.tsx'].map(ext => target + ext).find(existsSync);
        assert.ok(file, `missing source import ${target}`);
        return `from ${JSON.stringify(sourceModule(file))}`;
    });
    return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const base = { title: 'Amounts', servings: 4, ingredients: [], instructions: [{ step: 'Mix Blueberries and Chicken.' }], imageUrl: '', calories: 400, protein: 30, carbs: 40, fat: 12 };

test('VM-006: legacy detail renders a quantity and unit, including its SmartText tooltip', async () => {
    const { default: Detail } = await import(sourceModule('src/features/recipes/components/RecipeDetail.tsx'));
    const html = renderToStaticMarkup(createElement(Detail, { recipe: { ...base, ingredients: [{ item: 'Blueberries', amount: '1 cup' }] }, onClose() {}, onStartCooking() {} }));
    assert.doesNotMatch(html, /undefined/);
    assert.match(html, /1 cup Blueberries/);
    assert.equal((html.match(/1 cup Blueberries/g) || []).length, 2, 'list and tooltip have the same amount');
});

test('VM-031: cooking renders both structured and legacy amounts and tooltip labels', async () => {
    const { default: Cooking } = await import(sourceModule('src/features/recipes/components/GuidedCooking.tsx'));
    const html = renderToStaticMarkup(createElement(Cooking, { recipe: { ...base, ingredients: [{ item: 'Chicken', quantity: '24', unit: 'oz' }, { item: 'Garlic', amount: '2–3 cloves' }] }, onExit() {} }));
    assert.match(html, /24 oz/);
    assert.match(html, /2–3 cloves/);
    assert.match(html, /24 oz Chicken/);
});

test('VM-007: decimal formatting rounds the whole value without concatenating an extra whole number', async () => {
    const { formatQuantity } = await import(sourceModule('src/shared/format-quantity.ts'));
    assert.equal(formatQuantity(1.96), '1.96');
    assert.equal(formatQuantity(1.31 * 1.5), '1.97');
    assert.equal(formatQuantity(1.5), '1 1/2');
});

test('VM-008: recipe detail retains each original range separator', async () => {
    const { default: Detail } = await import(sourceModule('src/features/recipes/components/RecipeDetail.tsx'));
    for (const range of ['2-3', '2–3', '2 to 3']) {
        const html = renderToStaticMarkup(createElement(Detail, { recipe: { ...base, ingredients: [{ item: 'Garlic', quantity: range, unit: 'cloves' }] }, onClose() {}, onStartCooking() {} }));
        assert.ok(html.includes(`${range} cloves Garlic`), range);
    }
});

test('VM-031: cooking uses the servings selected in detail for list and tooltip', async () => {
    const { default: Cooking } = await import(sourceModule('src/features/recipes/components/GuidedCooking.tsx'));
    const html = renderToStaticMarkup(createElement(Cooking, { recipe: { ...base, ingredients: [{ item: 'Chicken', quantity: '24', unit: 'oz' }, { item: 'Blueberries', amount: '1 cup' }] }, servings: 2, onExit() {} }));
    assert.match(html, /12 oz/);
    assert.match(html, /1\/2 cup/);
    assert.match(html, /12 oz Chicken/);
});
