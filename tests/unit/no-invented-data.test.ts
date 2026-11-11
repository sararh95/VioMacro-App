import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Guard tests for PR-2 — "delete every invented value".
 *
 * These do not test behaviour. They test that specific *sources* of fabricated
 * data cannot creep back into production code, because every one of them was
 * introduced by a well-meaning fallback that looked harmless in review.
 */

const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else if (/\.(ts|tsx)$/.test(full)) out.push(full);
    }
    return out;
}

/**
 * Strip comments before scanning. These guards are about what the app *ships*
 * to a user, not about what the source documents — a comment explaining a
 * removed string must not count as the string still being there.
 */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')        // /* block */ and JSX {/* ... */}
        .replace(/(^|[^:])\/\/[^\r\n]*/g, '$1');  // // line, without eating https://
}

const files = walk(SRC).map((f) => ({
    path: relative(SRC, f).split(sep).join('/'),
    text: stripComments(readFileSync(f, 'utf8')),
}));

// ----------------------------------------------------- AUD-030/031/032/075

test('AUD-030/031/032/075: demo recipes never reach production code', () => {
    const offenders = files
        .filter((f) => !f.path.startsWith('dev/mock/'))
        .filter((f) => f.text.includes('mockRecipeLibrary'))
        .map((f) => f.path);

    assert.deepEqual(
        offenders,
        [],
        `mockRecipeLibrary is demo data. It must never be a fallback, a lookup ` +
        `source, or a branch condition in real code. Found in: ${offenders.join(', ')}`,
    );
});

// --------------------------------------------------------- AUD-037/038

test('AUD-037: seedInitialRecipes is gone', () => {
    const offenders = files.filter((f) => f.text.includes('seedInitialRecipes')).map((f) => f.path);
    assert.deepEqual(offenders, [], `seedInitialRecipes writes demo recipes into a real user's library.`);
});

test('AUD-038: the deprecated uploadRecipeImage is gone', () => {
    const offenders = files.filter((f) => f.text.includes('uploadRecipeImage')).map((f) => f.path);
    assert.deepEqual(offenders, [], 'uploadRecipeImage was dead code.');
});

// ------------------------------------------------------------- AUD-044

test('AUD-044: the Dashboard makes no fabricated claim about adherence', () => {
    const dash = files.find((f) => f.path === 'features/dashboard/Dashboard.tsx');
    assert.ok(dash, 'Dashboard.tsx not found');
    assert.ok(
        !/Adherence was high/i.test(dash.text),
        'The Dashboard asserted "Adherence was high last week!" as a hardcoded string. Nothing measures adherence.',
    );
    assert.ok(
        !/animate-pulse[^>]*>\s*Live\s*</i.test(dash.text),
        'A pulsing "Live" badge promises something is happening right now. The engine does not exist yet.',
    );
});

// ------------------------------------------------------------- AUD-045

test('AUD-045: the Dashboard never falls back to invented macro targets', () => {
    const dash = files.find((f) => f.path === 'features/dashboard/Dashboard.tsx');
    assert.ok(dash, 'Dashboard.tsx not found');
    assert.ok(
        !/calories:\s*2000\s*,\s*protein:\s*150/.test(dash.text.replace(/\s+/g, ' ')),
        'Dashboard fell back to a hardcoded 2000/150/200/65 when a plan had no targets.',
    );
});

// ------------------------------------------------------------- AUD-095

test('AUD-095: pantry items are not stamped with a guessed expiry', () => {
    const pantry = files.find((f) => f.path === 'features/pantry/Pantry.tsx');
    assert.ok(pantry, 'Pantry.tsx not found');
    assert.ok(
        !/7\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(pantry.text),
        'Every pantry item was given a 7-day expiry. An expiry date is acted on — it must come from the user.',
    );
});

// --------------------------------------------------------- AUD-103/105

test('AUD-103/105: Settings does not pre-fill a stranger’s body', () => {
    const settings = files.find((f) => f.path === 'features/settings/Settings.tsx');
    assert.ok(settings, 'Settings.tsx not found');
    const flat = settings.text.replace(/\s+/g, ' ');
    for (const bad of ['|| 185', '|| 170', '|| 2200', '|| 65']) {
        assert.ok(
            !flat.includes(bad),
            `Settings pre-filled "${bad}" as if it were the user's own data, and Save persisted it.`,
        );
    }
});

// ------------------------------------------------------------- AUD-090

test('AUD-090: the grocery header shows no fake collaborators', () => {
    const list = files.find((f) => f.path === 'features/groceries/ShoppingList.tsx');
    assert.ok(list, 'ShoppingList.tsx not found');
    assert.ok(
        !/\+2</.test(list.text),
        'The "+2" avatar badge implies other people share this list. Sharing does not exist.',
    );
});

// --------------------------------------------------------- AUD-071/083

test('AUD-071/083: cook time and servings are never invented', () => {
    const lib = files.find((f) => f.path === 'features/recipes/RecipeLibrary.tsx');
    const planner = files.find((f) => f.path === 'features/meal-planning/MealPlanner.tsx');
    assert.ok(lib && planner);

    assert.ok(
        !/cookTime:\s*30\s*,\s*\n?\s*servings:\s*4/.test(lib.text),
        'Every imported recipe was stamped cookTime 30 / servings 4, discarding what the parser found.',
    );
    assert.ok(
        !/cookTime:\s*15\s*,\s*servings:\s*4/.test(planner.text.replace(/\s+/g, ' ')),
        'Meal detail invented cookTime 15 / servings 4 when no recipe matched.',
    );
});
