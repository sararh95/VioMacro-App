import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { recipeTint, type Macroish } from '../../src/shared/visuals.ts';

// Exercise the real component's property values. Reparsed SSR markup can hide
// this bug by splitting a declaration list that client React rejects as a value.
const require = createRequire(import.meta.url);
const runtimeUrl = pathToFileURL(require.resolve("react/jsx-runtime")).href;
const observerSource = `
import { jsx as realJsx, jsxs as realJsxs, Fragment } from ${JSON.stringify(runtimeUrl)};
export { Fragment };
export const observed = [];
function record(element) { if (typeof element.type === "string") observed.push(element); return element; }
export function jsx(type, props, key) { return record(realJsx(type, props, key)); }
export function jsxs(type, props, key) { return record(realJsxs(type, props, key)); }
`;
const observerUrl = `data:text/javascript;base64,${Buffer.from(observerSource).toString("base64")}`;
const { observed } = await import(observerUrl);
function sourceModule(path: string): string {
    const absolute = resolve(path);
    const code = ts.transpileModule(readFileSync(absolute, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    }).outputText.replace(/from\s+(['"])([^'"]+)\1/g, (_all, _quote, specifier: string) => {
        if (specifier === 'react/jsx-runtime') return `from ${JSON.stringify(observerUrl)}`;
        if (!specifier.startsWith('.')) return `from ${JSON.stringify(pathToFileURL(require.resolve(specifier)).href)}`;
        const target = resolve(dirname(absolute), specifier);
        const file = ['', '.ts', '.tsx'].map(ext => target + ext).find(existsSync);
        assert.ok(file, `missing source import ${target}`);
        return `from ${JSON.stringify(sourceModule(file))}`;
    });
    return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const { default: ActualRecipeThumb } = await import(sourceModule('src/features/recipes/components/RecipeThumb.tsx'));

// Let the real renderer invoke the component (including any hooks), while
// retaining the unchanged raw host-element props for the G9 assertions.
function RecipeThumb(props: Record<string, unknown>) {
    observed.length = 0;
    const markup = renderToStaticMarkup(createElement(ActualRecipeThumb, props));
    const candidates = observed.filter((element: { type: unknown; props: Record<string, unknown> }) =>
        element.type === 'img' || (element.type === 'div' && element.props.role === 'img'));
    assert.equal(candidates.length, 1, 'one actual rendered image/fallback host element must be observed');
    const element = candidates[0];
    assert.equal(renderToStaticMarkup(element), markup, 'raw observation must be the actual emitted branch');
    return element;
}

// Accept the existing string API or a style object: the regression is an
// invalid individual property, rather than a prescribed return representation.
function tintStyle(macros: Macroish, seed?: string): Record<string, string | undefined> {
    const value = recipeTint(macros, seed);
    return typeof value === 'string' ? { background: value } : value;
}

const families = [
    { name: 'protein', macros: { protein: 70, carbs: 10, fat: 3 } },
    { name: 'carbs', macros: { protein: 5, carbs: 75, fat: 3 } },
    { name: 'fat', macros: { protein: 5, carbs: 5, fat: 35 } },
    { name: 'balanced', macros: { protein: 20, carbs: 20, fat: 9 } },
];

for (const { name, macros } of families) {
    test(`VM-040: seeded ${name} fallback supplies one gradient property value`, () => {
        const element = RecipeThumb({ title: `G9 ${name}`, macros });
        const style = element.props.style;
        assert.match(style.background, /^linear-gradient\([^;{}]+\)$/, 'background must not contain another declaration');
        assert.equal(element.props.role, 'img');
        assert.equal(element.props['aria-label'], `G9 ${name} — no photo`);
        assert.equal(element.props.children.props.children, 'G');
    });
}

test('VM-040: empty seed and missing macros retain distinct macro-family gradients', () => {
    const backgrounds = families.map(({ macros }) => tintStyle(macros).background);
    for (const background of backgrounds) assert.match(background!, /^linear-gradient\([^;{}]+\)$/);
    assert.equal(new Set(backgrounds).size, 4);
    assert.equal(tintStyle({}).background, tintStyle({ protein: 0, carbs: 0, fat: 0 }).background);
    assert.equal(tintStyle({}).background, backgrounds[3]);
    assert.equal(tintStyle({}).filter ?? 'none', 'none');
    const empty = RecipeThumb({ title: '' });
    assert.equal(empty.props.children.props.children, '?');
    assert.match(empty.props.style.background, /^linear-gradient\([^;{}]+\)$/);
});

test('VM-040: seeded variation stays deterministic without mutating macros', () => {
    const macros = Object.freeze({ protein: 70, carbs: 10, fat: 3 });
    const alpha = tintStyle(macros, 'G9 Protein Azure');
    const beta = tintStyle(macros, 'G9 Protein Indigo');
    assert.deepEqual(tintStyle(macros, 'G9 Protein Azure'), alpha);
    assert.notDeepEqual(alpha, beta, 'restoring the gradient must not discard per-recipe variation');
    assert.deepEqual(macros, { protein: 70, carbs: 10, fat: 3 });
    for (const style of [alpha, beta]) {
        assert.match(style.background!, /^linear-gradient\([^;{}]+\)$/);
        if (style.filter && style.filter !== 'none') {
            const match = /^hue-rotate\((-?\d+)deg\)$/.exec(style.filter);
            assert.ok(match, 'filter must itself be one valid hue rotation');
            assert.ok(Number(match[1]) >= -12 && Number(match[1]) <= 11, 'variation stays within its macro colour family');
        }
    }
});

test('VM-040: unsupported images use the same styled fallback without changing the URL', () => {
    const imageUrl = 'https://images.unsplash.com/g9-unsupported.png';
    const props = Object.freeze({ title: 'G9 Unsupported', imageUrl, macros: families[0].macros });
    const element = RecipeThumb(props);
    assert.equal(element.type, 'div');
    assert.match(element.props.style.background, /^linear-gradient\([^;{}]+\)$/);
    assert.equal(element.props.src, undefined);
    assert.equal(props.imageUrl, imageUrl);
});

test('VM-040: permitted images keep their source and receive no fallback filter', () => {
    for (const imageUrl of ['/vite.svg', 'http://127.0.0.1:9199/g9-image.png', 'data:image/png;base64,AAAA']) {
        const element = RecipeThumb({ title: 'G9 Healthy', imageUrl, macros: families[0].macros, className: 'h-20' });
        assert.equal(element.type, 'img');
        assert.equal(element.props.src, imageUrl);
        assert.equal(element.props.alt, 'G9 Healthy');
        assert.equal(element.props.className, 'h-20');
        assert.equal(element.props.style, undefined);
    }
});
