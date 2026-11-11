import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { isRenderableImage } from '../../src/shared/visuals.ts';

// Load actual TSX and its dependencies; no component or policy mocks.
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

const blocked = [
    '//external.example/image.png',
    '///external.example/image.png',
    '/\\external.example/image.png',
    '/\t/external.example/image.png',
    '/\n/external.example/image.png',
    '/\r/external.example/image.png',
    '//localhost/image.png',
    '//127.0.0.1:9199/image.png',
    'http://firebasestorage.googleapis.com/image.png',
    'ftp://storage.googleapis.com/image.png',
    'ws://storage.googleapis.com/image.png',
    'file://storage.googleapis.com/image.png',
    'custom://storage.googleapis.com/image.png',
];
for (const url of blocked) {
    test(`VM-033: rejects network paths and non-HTTPS Storage: ${JSON.stringify(url)}`, () => {
        assert.equal(isRenderableImage(url), false, url);
    });
}

test('VM-033: allowed local paths stay local after browser URL normalization', () => {
    for (const path of ['/', '/vite.svg', '/image.png?next=//external.example#photo', '/%2f%2fexternal.example/photo.png', '/a/../photo.png', '/a\\b.png']) {
        assert.equal(isRenderableImage(path), true, path);
        for (const origin of ['http://127.0.0.1:5173', 'https://viomacro.example']) {
            assert.equal(new URL(path, origin).origin, origin, path);
        }
    }
});

test('VM-033: preserves real uploads, emulator, image data and blob URLs', () => {
    for (const url of [
        'https://firebasestorage.googleapis.com/v0/b/x/o/photo.png?alt=media',
        'https://storage.googleapis.com/bucket/photo.png',
        'HTTPS://STORAGE.GOOGLEAPIS.COM/bucket/photo.png',
        ' https://storage.googleapis.com/bucket/photo.png ',
        'http://127.0.0.1:9199/v0/b/x/o/photo.png?alt=media',
        'http://localhost:9199/v0/b/x/o/photo.png?alt=media',
        'data:image/png;base64,AAAA',
        'blob:http://127.0.0.1:5173/00000000-0000-0000-0000-000000000000',
    ]) assert.equal(isRenderableImage(url), true, url);
    for (const url of [undefined, null, '', 'not a URL', 'https://storage.googleapis.com.external.example/x', 'https://storage.googleapis.com@external.example/x', 'https://images.unsplash.com/photo-123']) {
        assert.equal(isRenderableImage(url), false, String(url));
    }
});

const base = { title: 'Image QA', servings: 4, ingredients: [], instructions: [{ step: 'Mix.' }], calories: 400, protein: 30, carbs: 40, fat: 12 };
for (const component of ['RecipeThumb', 'RecipeDetail', 'GuidedCooking']) {
    for (const imageUrl of ['', 'https://images.unsplash.com/photo-123', '//external.example/photo.png', 'http://storage.googleapis.com/photo.png']) {
        test(`VM-022/033: ${component} renders accessible fallback for ${JSON.stringify(imageUrl)}`, async () => {
            const { default: Component } = await import(sourceModule(`src/features/recipes/components/${component}.tsx`));
            const recipe = { ...base, imageUrl };
            const html = renderToStaticMarkup(createElement(Component, { ...recipe, recipe, onClose() {}, onStartCooking() {}, onExit() {} }));
            assert.match(html, /role="img"[^>]*aria-label="Image QA — no photo"/);
            assert.doesNotMatch(html, /<img\b/);
            assert.doesNotMatch(html, /background-image:/);
        });
    }
    test(`VM-022: ${component} keeps a permitted image source and accessible title`, async () => {
        const { default: Component } = await import(sourceModule(`src/features/recipes/components/${component}.tsx`));
        for (const imageUrl of ['/photo.png', 'http://127.0.0.1:9199/photo.png', 'data:image/png;base64,AAAA']) {
            const recipe = { ...base, imageUrl };
            const html = renderToStaticMarkup(createElement(Component, { ...recipe, recipe, onClose() {}, onStartCooking() {}, onExit() {} }));
            assert.ok(html.includes(`src="${imageUrl}"`), imageUrl);
            assert.match(html, /alt="Image QA"/);
            assert.doesNotMatch(html, /no photo/);
        }
    });
}
