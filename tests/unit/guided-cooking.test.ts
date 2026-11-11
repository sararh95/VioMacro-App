import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import type { Recipe } from '../../src/features/recipes/recipeService.ts';

// This loader only supplies TypeScript transpilation and import resolution.
// React, SmartText, ingredients and RecipeThumb run unchanged, as in ingredient-views.test.ts.
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

function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === 'object') {
        for (const child of Object.values(value)) deepFreeze(child);
        Object.freeze(value);
    }
    return value;
}

function frozenRecipe(instructions?: Recipe['instructions']): Recipe {
    const recipe: Recipe = {
        id: 'g7-rendered-recipe',
        title: 'G7 saved recipe',
        mealType: 'dinner',
        tags: ['saved'],
        folders: ['G7'],
        ingredients: [
            { item: 'Chicken', quantity: '24', unit: 'oz' },
            { item: 'Blueberries', quantity: '', unit: '', amount: '1 cup' },
        ],
        imageUrl: '',
        cookTime: 12,
        servings: 4,
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 12,
        source: 'created',
        micronutrients: { calcium: 27.5 },
    };
    // A missing field is a legitimate saved shape, not an own property set to undefined.
    if (instructions !== undefined) recipe.instructions = instructions;
    return deepFreeze(recipe);
}

function textContent(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderedButton(html: string, label: RegExp) {
    const matches = Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g), ([, attributes, content]) => ({
        text: textContent(content),
        // Consume complete quoted attribute values, so a class containing "disabled"
        // cannot masquerade as the native disabled attribute.
        attributeNames: Array.from(attributes.matchAll(/([^\s=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s]+))?/g), match => match[1]),
    })).filter(button => label.test(button.text));
    assert.equal(matches.length, 1, `expected one rendered button matching ${label}`);
    return matches[0];
}

// SSR establishes initial rendered state only. Full Recipe/Exit callbacks and
// Start/Pause/Reset/navigation/countdown cleanup require real browser interactions.
for (const shape of ['empty', 'omitted'] as const) {
    test(`VM-029: cooking safely renders honest no-instructions state for ${shape} instructions`, async () => {
        const recipe = frozenRecipe(shape === 'empty' ? [] : undefined);
        const before = structuredClone(recipe);
        if (shape === 'omitted') assert.equal(Object.hasOwn(recipe, 'instructions'), false);
        try {
            const { default: Cooking } = await import(sourceModule('src/features/recipes/components/GuidedCooking.tsx'));
            let html = '';
            assert.doesNotThrow(() => {
                html = renderToStaticMarkup(createElement(Cooking, { recipe, onExit() {} }));
            }, 'a valid recipe without preparation steps must render safely');
            const text = textContent(html);
            assert.match(text, /No instructions/i, 'cooking explains that no saved instructions are available');
            assert.equal(renderedButton(html, /\bExit\b/).attributeNames.includes('disabled'), false);
            assert.equal(renderedButton(html, /\bFull Recipe\b/).attributeNames.includes('disabled'), false);
            assert.doesNotMatch(text, /Cooking Progress|Step Timer|\bStep\s+1\b|\bPrevious\b|\bNext Step\b|\bFinish\b/,
                'no steps means no invented step, progress, timer widget or step navigation');
            assert.doesNotMatch(html, /aria-label="(?:Start|Pause|Reset) step timer"|(?:NaN|Infinity)%/,
                'no timer actions or invalid progress are rendered');
        } finally {
            assert.deepEqual(recipe, before, 'read-only cooking leaves the complete frozen saved recipe unchanged');
        }
    });

    test(`VM-029: detail preserves its no-preparation fallback for ${shape} instructions`, async () => {
        const recipe = frozenRecipe(shape === 'empty' ? [] : undefined);
        const before = structuredClone(recipe);
        try {
            const { default: Detail } = await import(sourceModule('src/features/recipes/components/RecipeDetail.tsx'));
            const html = renderToStaticMarkup(createElement(Detail, { recipe, onClose() {}, onStartCooking() {} }));
            const text = textContent(html);
            assert.match(text, /No Instructions/);
            assert.match(text, /No preparation steps available for this recipe\./);
        } finally {
            assert.deepEqual(recipe, before, 'read-only detail leaves the complete frozen saved recipe unchanged');
        }
    });
}

for (const { label, instruction, expected } of [
    { label: 'positive first duration before Reset', instruction: { step: 'Mix Chicken and Blueberries.', timer: 120 }, expected: '02:00' },
    { label: 'saved decimal duration without rounding', instruction: { step: 'Mix Chicken and Blueberries.', timer: 45.5 }, expected: '00:45.5' },
    { label: 'zero duration', instruction: { step: 'Mix Chicken and Blueberries.', timer: 0 }, expected: '00:00' },
    { label: 'absent duration', instruction: { step: 'Mix Chicken and Blueberries.' }, expected: '00:00' },
]) {
    test(`VM-030: first render shows paused ${label}`, async () => {
        const instructions = [
            { ...instruction, note: 'Retain saved metadata', temperature: '175 C' },
            { step: 'Rest the Chicken.', timer: 30 },
        ];
        const recipe = frozenRecipe(instructions);
        const before = structuredClone(recipe);
        try {
            const { default: Cooking } = await import(sourceModule('src/features/recipes/components/GuidedCooking.tsx'));
            const html = renderToStaticMarkup(createElement(Cooking, { recipe, onExit() {} }));
            assert.match(html, /aria-label="Start step timer"/, 'the first countdown is paused without invoking Reset');
            assert.doesNotMatch(html, /aria-label="Pause step timer"/);
            assert.deepEqual(textContent(html).match(/\b\d{2}:\d{2}(?:\.\d+)?\b/g), [expected],
                'the first saved duration is displayed on the initial render');
        } finally {
            assert.deepEqual(recipe, before, 'timer rendering preserves saved durations, omission and instruction metadata');
        }
    });
}

test('VM-032: rendered Replay Video is natively disabled with visible Coming Soon copy', async () => {
    const recipe = frozenRecipe([{ step: 'Mix Chicken and Blueberries.', timer: 120 }]);
    const before = structuredClone(recipe);
    try {
        const { default: Cooking } = await import(sourceModule('src/features/recipes/components/GuidedCooking.tsx'));
        const html = renderToStaticMarkup(createElement(Cooking, { recipe, onExit() {} }));
        const replay = renderedButton(html, /\bReplay\s+Video\b/i);
        assert.ok(replay.attributeNames.includes('disabled'), 'the Replay Video button itself has the native disabled attribute');
        assert.match(replay.text, /Coming Soon/i, 'the unavailable video status is visible inside its control');
    } finally {
        assert.deepEqual(recipe, before, 'unavailable media rendering leaves the frozen saved recipe unchanged');
    }
});
