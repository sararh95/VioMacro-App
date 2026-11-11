import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Guard for AUD-122.
 *
 * AUD-064 was recorded as fixed by PR-1, but PR-1 only changed the onboarding
 * wizard. Five other components still printed a hardcoded "lbs" next to a value
 * stored in the user's own unit, and metric is the app default. A metric user
 * therefore read "Current Weight (lbs): 75" for 75 kilograms -- and if they had
 * believed the label and typed their weight in pounds, the wrong number would
 * have been stored as their real weight.
 *
 * The lesson is the one the audit keeps re-teaching: a finding names one site,
 * the codebase has six. This test scans instead of trusting the count.
 */

const SRC = join(process.cwd(), 'src');

const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : [];
    });

const stripComments = (text: string): string =>
    text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\r\n]*/g, '$1');

// A unit printed as user-facing text: "185 lbs", "(lbs)", "lbs</span>".
// Not matched: the unit *lists* in Pantry/ShoppingList parsers ('lbs' in an
// array of quantity units), or the wizard's genuine "Imperial (lbs)" toggle.
const RENDERED_LBS = /(\{[^}]*\}\s*lbs\b)|(\(lbs\))|(>\s*lbs\s*<)/;

const ALLOWED = new Set([
    // The unit toggle itself must name the imperial system.
    'features/auth/OnboardingWizard.tsx',
    // units.ts IS the source of truth -- it is the one place allowed to spell
    // the unit out. Everything else must ask it.
    'shared/units.ts',
]);

test('AUD-122: no component prints a hardcoded weight unit', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
        const path = relative(SRC, file).split(sep).join('/');
        if (ALLOWED.has(path) || path.startsWith('dev/mock/')) continue;

        const text = stripComments(readFileSync(file, 'utf8'));
        for (const [i, line] of text.split(/\r?\n/).entries()) {
            if (RENDERED_LBS.test(line)) offenders.push(`${path}:${i + 1}  ${line.trim().slice(0, 90)}`);
        }
    }

    assert.deepEqual(
        offenders,
        [],
        'A hardcoded "lbs" is wrong for every metric user, and metric is the default. ' +
        'Use weightSuffix(unit) from src/shared/units.ts:\n  ' + offenders.join('\n  '),
    );
});

test('AUD-122: every screen that shows a weight resolves the unit at runtime', () => {
    // The five components the browser pass found, plus the wizard PR-1 fixed.
    const MUST_RESOLVE = [
        'features/settings/Settings.tsx',
        'features/progress/History.tsx',
        'features/dashboard/components/CheckInModal.tsx',
        'features/dashboard/components/WeightHistoryWidget.tsx',
        'features/dashboard/components/ActivityCalendarWidget.tsx',
    ];

    const missing = MUST_RESOLVE.filter((path) => {
        const text = readFileSync(join(SRC, path), 'utf8');
        return !text.includes('weightSuffix(');
    });

    assert.deepEqual(
        missing,
        [],
        'These screens display a weight but never ask which unit the user reads in:\n  ' +
        missing.join('\n  '),
    );
});
