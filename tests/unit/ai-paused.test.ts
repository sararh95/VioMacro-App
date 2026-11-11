import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard for the AI pause switch.
 *
 * Two flags have to agree: AI_ENABLED in functions/src/aiAvailability.ts, which
 * actually stops the spending, and VITE_AI_ENABLED here, which decides whether
 * the buttons are offered. The backend is the one that matters; this file only
 * makes sure a paused app looks paused instead of throwing when pressed.
 *
 * Every control below reaches a paid callable. If one is added later without a
 * guard, the app will look available while the backend refuses -- so this test
 * scans instead of trusting that anyone remembers.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

const AI_CONTROLS: Array<{ file: string; needle: string; what: string }> = [
    {
        file: 'src/features/recipes/RecipeLibrary.tsx',
        needle: 'semanticSearchRecipes',
        what: 'AI Search',
    },
    {
        file: 'src/features/recipes/RecipeLibrary.tsx',
        needle: 'parseRecipeFromImage',
        what: 'Magic Import',
    },
    {
        file: 'src/features/meal-planning/components/PlanGenerationWizard.tsx',
        needle: 'auto_awesome',
        what: 'Auto-Generate Week',
    },
];

test('every screen that reaches a paid AI callable checks AI_ENABLED', () => {
    const missing = AI_CONTROLS.filter(({ file, needle }) => {
        const text = read(file);
        return text.includes(needle) && !text.includes('AI_ENABLED');
    }).map((c) => `${c.what} (${c.file})`);

    assert.deepEqual(
        missing,
        [],
        'These controls call a paid AI feature but never ask whether AI is paused:\n  ' +
        missing.join('\n  '),
    );
});

test('the client default is off, so a missing variable pauses rather than bills', () => {
    const text = read('src/shared/constants.ts');

    // Must be an exact comparison against 'true'. A truthiness check would
    // treat "false" and "0" as enabled.
    assert.match(
        text,
        /AI_ENABLED\s*=\s*import\.meta\.env\.VITE_AI_ENABLED\s*===\s*'true'/,
        'AI_ENABLED must be an exact === comparison to the string "true"',
    );
});

test('the backend switch is also exact, and also defaults to off', () => {
    const text = read('functions/src/aiAvailability.ts');
    assert.match(text, /env\.AI_ENABLED === "true"/);
    // No fallback that could turn it on by accident.
    assert.ok(
        !/AI_ENABLED\s*(\|\||\?\?)/.test(text),
        'the backend switch must not have a default that could enable AI',
    );
});
