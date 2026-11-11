import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A guard for a trap that cost real time during PR-11a.
 *
 * `npx tsc --noEmit` at the repo root exits 0 no matter what is broken, because
 * the root tsconfig.json is a SOLUTION file: `"files": []` plus `references`.
 * A solution file compiles nothing unless you pass `--build`.
 *
 * Three service files used `limit(...)` without importing it. `tsc --noEmit`
 * said nothing. `npm run build` caught all three immediately.
 *
 * The lesson is not "remember which command to type" -- it is that a check
 * which cannot fail is worse than no check, because it is trusted. These tests
 * make the shape of the setup explicit so nobody re-learns it the slow way.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

test('the root tsconfig is a solution file, so bare `tsc --noEmit` proves nothing', () => {
    const root = JSON.parse(read('tsconfig.json'));

    // If this ever stops being true, the warning below is stale and should go.
    assert.deepEqual(
        root.files,
        [],
        'root tsconfig no longer has empty "files" -- re-check whether bare tsc is meaningful now',
    );
    assert.ok(Array.isArray(root.references) && root.references.length > 0);
});

test('`npm run check` runs the build, which is the typecheck that actually runs', () => {
    const pkg = JSON.parse(read('package.json'));
    const check = pkg.scripts.check as string;

    assert.match(
        check,
        /\bnpm run build\b/,
        'check must run the app build -- it is the only thing that typechecks src/',
    );
    assert.match(
        check,
        /--prefix functions run build/,
        'check must build the functions too, for the same reason',
    );
});

test('the referenced projects actually cover the source', () => {
    const app = JSON.parse(read('tsconfig.app.json').replace(/\/\*[\s\S]*?\*\//g, ''));
    assert.ok(
        (app.include ?? []).some((pattern: string) => pattern.startsWith('src')),
        'tsconfig.app.json must include src, or nothing typechecks the app',
    );
});
