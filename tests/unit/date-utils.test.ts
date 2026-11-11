import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseLocalDateKey, toLocalDateKey, getWeekStartKey } from '../../src/shared/date-utils.ts';

/**
 * Regression tests for AUD-099.
 *
 * `new Date('2026-08-24')` parses as UTC midnight. Rendering it with
 * toLocaleDateString then shows the *previous* day for anyone west of
 * Greenwich, so History displayed plan ranges one day early while the Meal
 * Planner — which happened to use a different parse — showed them correctly.
 * Two screens disagreeing about the same week.
 *
 * The invariant below holds in every timezone, which is what makes it a useful
 * test: a date key parsed and re-formatted must come back unchanged.
 */

const KEYS = [
    '2026-01-01',
    '2026-08-24',
    '2028-02-29', // leap day (2028 IS a leap year; 2026 is not)
    '2026-12-31',
    '2026-03-08', // US DST spring-forward
    '2026-11-01', // US DST fall-back
];

test('AUD-099: a date key survives a parse and re-format unchanged', () => {
    for (const key of KEYS) {
        assert.equal(
            toLocalDateKey(parseLocalDateKey(key)),
            key,
            `${key} did not round-trip; it will render as the wrong day`,
        );
    }
});

test('AUD-099: the parsed date carries the exact calendar components', () => {
    const d = parseLocalDateKey('2026-08-24');
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 7, 'August is month index 7');
    assert.equal(d.getDate(), 24);
    assert.equal(d.getHours(), 0, 'should be local midnight, not UTC midnight');
});

test('AUD-099: this is the bug — the naive parse does not round-trip west of UTC', () => {
    const key = '2026-08-24';
    const naive = toLocalDateKey(new Date(key));
    const fixed = toLocalDateKey(parseLocalDateKey(key));

    assert.equal(fixed, key);

    // In a negative-offset zone the naive parse loses a day. In UTC or east of
    // it, both agree — so this asserts the fix is never worse, and reports when
    // the runner's timezone actually exposes the bug.
    const offsetMinutes = new Date(`${key}T00:00:00`).getTimezoneOffset();
    if (offsetMinutes > 0) {
        assert.notEqual(naive, key, 'expected the naive parse to lose a day here');
    } else {
        assert.equal(naive, key);
    }
});

test('parseLocalDateKey rejects anything that is not a date key', () => {
    for (const bad of ['', 'not-a-date', '2026-8-4', '24/08/2026', '2026-08-24T10:00:00Z']) {
        assert.throws(() => parseLocalDateKey(bad), /date key/i, `should reject ${JSON.stringify(bad)}`);
    }
});

test('parseLocalDateKey rejects a date that does not exist', () => {
    // JS would silently roll these over to the next month, producing a
    // plausible-looking wrong answer. 2026 is not a leap year.
    assert.throws(() => parseLocalDateKey('2026-02-29'), /real calendar date/i);
    assert.throws(() => parseLocalDateKey('2026-04-31'), /real calendar date/i);
    assert.throws(() => parseLocalDateKey('2026-13-01'), /real calendar date/i);
});

test('parseLocalDateKey and getWeekStartKey agree on the same week', () => {
    // 2026-08-26 is a Wednesday; its week starts Monday 2026-08-24.
    assert.equal(getWeekStartKey(parseLocalDateKey('2026-08-26')), '2026-08-24');
    assert.equal(getWeekStartKey(parseLocalDateKey('2026-08-24')), '2026-08-24');
    // Sunday belongs to the week that started the previous Monday.
    assert.equal(getWeekStartKey(parseLocalDateKey('2026-08-30')), '2026-08-24');
});

// ------------------------------------------------------------------ guard

test('AUD-099: no source file parses a stored date key with new Date()', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join, relative, sep } = await import('node:path');

    const SRC = join(process.cwd(), 'src');
    const walk = (dir: string): string[] =>
        readdirSync(dir).flatMap((entry) => {
            const full = join(dir, entry);
            return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(full) ? [full] : [];
        });

    // Fields known to hold a bare YYYY-MM-DD key rather than a timestamp.
    const KEY_FIELDS = ['weekStart', 'weekEnd', 'day.date', 'a.date', 'b.date', 'expiresAt'];

    const offenders: string[] = [];
    for (const file of walk(SRC)) {
        const path = relative(SRC, file).split(sep).join('/');
        if (path.startsWith('dev/mock/')) continue;
        const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\r\n]*/g, '$1');
        for (const field of KEY_FIELDS) {
            if (text.includes(`new Date(${field})`)) offenders.push(`${path} -> new Date(${field})`);
        }
    }

    assert.deepEqual(
        offenders,
        [],
        'A stored date key parsed with new Date() is read as UTC midnight and renders ' +
        'a day early west of Greenwich. Use parseLocalDateKey or formatDateKey:\n  ' +
        offenders.join('\n  '),
    );
});
