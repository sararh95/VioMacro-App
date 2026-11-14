import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    PLANNER_WEEK_MEMORY_MS, encodePlannerWeekChoice, isPlannerWeekOutdated, readPlannerWeekChoice,
    renewPlannerWeekChoice, resolvePlannerWeek, stepPlannerWeek,
} from '../../src/features/meal-planning/lib/planner-week.ts';
import { createEmptyPlan, generateWeekPlan } from '../../src/features/meal-planning/lib/plan-generator.ts';
import { toLocalDateKey } from '../../src/shared/date-utils.ts';

/**
 * 1.0 G17 (R9, N1): the Planner shows the right week.
 *
 * R9: a remembered week is used only while it is fresh. It used to be kept for
 * the whole life of the browser tab.
 * N1: the week on screen, and every new plan, starts on a Monday.
 *
 * Every date here is built from local calendar parts, so the tests give the
 * same answer in any timezone.
 */

const HOUR = 60 * 60 * 1000;
// Friday 13 November 2026, 10:00. Its week starts on Monday 9 November.
const NOW = new Date(2026, 10, 13, 10, 0, 0);
const THIS_WEEK = '2026-11-09';
const NEXT_WEEK = '2026-11-16';
const record = (week: unknown, at: unknown) => JSON.stringify({ week, at });
const ago = (ms: number) => NOW.getTime() - ms;
const shown = (saved: string | null) => toLocalDateKey(resolvePlannerWeek(saved, NOW));

test('R9: with nothing saved the Planner opens this week', () => {
    assert.equal(shown(null), THIS_WEEK);
    assert.equal(shown(''), THIS_WEEK);
});

test('R9: a bare week from an older version has no age and is not used', () => {
    assert.equal(readPlannerWeekChoice('2026-10-26', NOW), null);
    assert.equal(shown('2026-10-26'), THIS_WEEK);
    assert.equal(shown(NEXT_WEEK), THIS_WEEK);
});

test('R9: a week picked less than 4 hours ago is kept', () => {
    assert.equal(PLANNER_WEEK_MEMORY_MS, 4 * HOUR);
    for (const age of [0, 60_000, 3 * HOUR, 4 * HOUR - 1]) {
        assert.equal(shown(record(NEXT_WEEK, ago(age))), NEXT_WEEK, `age ${age} ms`);
        assert.equal(shown(record('2026-10-26', ago(age))), '2026-10-26', `past week, age ${age} ms`);
    }
});

test('R9: a week picked 4 hours ago or more opens this week', () => {
    for (const age of [4 * HOUR, 5 * HOUR, 24 * HOUR, 18 * 24 * HOUR]) {
        assert.equal(shown(record(NEXT_WEEK, ago(age))), THIS_WEEK, `age ${age} ms`);
        assert.equal(shown(record('2026-10-26', ago(age))), THIS_WEEK, `past week, age ${age} ms`);
    }
});

test('R9: a clock that steps back a little keeps the choice; a far future stamp is not trusted', () => {
    for (const ahead of [1, 60_000, 4 * HOUR - 1]) {
        const saved = record(NEXT_WEEK, NOW.getTime() + ahead);
        assert.equal(shown(saved), NEXT_WEEK, `stamp ${ahead} ms ahead`);
        assert.equal(isPlannerWeekOutdated(saved, NOW), false, `stamp ${ahead} ms ahead`);
        assert.deepEqual(JSON.parse(renewPlannerWeekChoice(saved, NOW)!), { week: NEXT_WEEK, at: NOW.getTime() });
    }
    for (const ahead of [4 * HOUR, 30 * 24 * HOUR]) {
        assert.equal(shown(record(NEXT_WEEK, NOW.getTime() + ahead)), THIS_WEEK, `stamp ${ahead} ms ahead`);
    }
});

test('R9: being on this week is not a pick, so it is never renewed or kept', () => {
    for (const age of [0, 60_000, 3 * HOUR, 5 * HOUR]) {
        const saved = record(THIS_WEEK, ago(age));
        assert.deepEqual(readPlannerWeekChoice(saved, NOW), { week: THIS_WEEK, fresh: false }, `age ${age} ms`);
        assert.equal(renewPlannerWeekChoice(saved, NOW), null, `age ${age} ms`);
        assert.equal(isPlannerWeekOutdated(saved, NOW), false, `age ${age} ms`);
        assert.equal(shown(saved), THIS_WEEK, `age ${age} ms`);
    }
});

test('R9: a damaged record opens this week and never throws', () => {
    const damaged = [
        'null', '{}', '[]', '"2026-11-16"', '7', 'not json', '{"week":',
        record(5, ago(0)), record(NEXT_WEEK, String(ago(0))), record(NEXT_WEEK, null),
        record('2026-02-30', ago(0)), record('2026-13-01', ago(0)), record('16/11/2026', ago(0)),
        record('2026-11-16T00:00:00', ago(0)), JSON.stringify({ week: NEXT_WEEK }),
        JSON.stringify({ at: ago(0) }), '{"week":"2026-11-16","at":1e999}',
    ];
    for (const saved of damaged) {
        assert.equal(readPlannerWeekChoice(saved, NOW), null, saved);
        assert.equal(shown(saved), THIS_WEEK, saved);
        assert.equal(renewPlannerWeekChoice(saved, NOW), null, saved);
        assert.equal(isPlannerWeekOutdated(saved, NOW), false, saved);
    }
});

test('N1: a stored day inside a week is read as that week\'s Monday', () => {
    for (const day of ['2026-11-16', '2026-11-17', '2026-11-21', '2026-11-22']) {
        assert.equal(shown(record(day, ago(0))), NEXT_WEEK, day);
        assert.deepEqual(readPlannerWeekChoice(record(day, ago(0)), NOW), { week: NEXT_WEEK, fresh: true }, day);
    }
});

test('R9 / N1: the stored record holds the Monday and the time, and reads back', () => {
    const wednesday = new Date(2026, 10, 18, 15, 30);
    const saved = encodePlannerWeekChoice(wednesday, NOW);
    assert.deepEqual(JSON.parse(saved), { week: NEXT_WEEK, at: NOW.getTime() });
    assert.deepEqual(readPlannerWeekChoice(saved, NOW), { week: NEXT_WEEK, fresh: true });
    assert.equal(shown(saved), NEXT_WEEK);
});

test('R9: looking at the Planner again renews a fresh choice, never a stale one', () => {
    const picked = record(NEXT_WEEK, ago(3 * HOUR));
    const renewed = renewPlannerWeekChoice(picked, NOW);
    assert.deepEqual(JSON.parse(renewed!), { week: NEXT_WEEK, at: NOW.getTime() });

    // 3 hours after the renewal the pick is 6 hours old, and still kept.
    const later = new Date(NOW.getTime() + 3 * HOUR);
    assert.equal(toLocalDateKey(resolvePlannerWeek(renewed, later)), NEXT_WEEK);
    assert.equal(toLocalDateKey(resolvePlannerWeek(picked, later)), THIS_WEEK);

    assert.equal(renewPlannerWeekChoice(record(NEXT_WEEK, ago(4 * HOUR)), NOW), null);
    assert.equal(renewPlannerWeekChoice('2026-11-16', NOW), null);
    assert.equal(renewPlannerWeekChoice(null, NOW), null);
});

test('R9: an open Planner is outdated only when its choice is stale and is another week', () => {
    assert.equal(isPlannerWeekOutdated(record(NEXT_WEEK, ago(5 * HOUR)), NOW), true);
    assert.equal(isPlannerWeekOutdated(record('2026-10-26', ago(5 * HOUR)), NOW), true);
    assert.equal(isPlannerWeekOutdated(record(THIS_WEEK, ago(5 * HOUR)), NOW), false);
    assert.equal(isPlannerWeekOutdated(record(NEXT_WEEK, ago(HOUR)), NOW), false);
    assert.equal(isPlannerWeekOutdated(null, NOW), false);
    assert.equal(isPlannerWeekOutdated('2026-10-26', NOW), false);
});

test('R9: a Planner that was on this week follows the calendar from Monday 00:00', () => {
    const sundayEvening = new Date(2026, 10, 15, 23, 0);
    const saved = encodePlannerWeekChoice(sundayEvening, sundayEvening);
    assert.equal(JSON.parse(saved).week, THIS_WEEK);
    assert.equal(isPlannerWeekOutdated(saved, new Date(2026, 10, 15, 23, 59, 59)), false);
    assert.equal(renewPlannerWeekChoice(saved, new Date(2026, 10, 15, 23, 30)), null);

    // Used again minutes or hours later: it must not stay on last week.
    for (const later of [new Date(2026, 10, 16, 0, 0), new Date(2026, 10, 16, 0, 10), new Date(2026, 10, 16, 1, 0), new Date(2026, 10, 16, 7, 0)]) {
        assert.equal(isPlannerWeekOutdated(saved, later), true, later.toString());
        assert.equal(renewPlannerWeekChoice(saved, later), null, later.toString());
        assert.equal(toLocalDateKey(resolvePlannerWeek(saved, later)), NEXT_WEEK, later.toString());
    }
});

test('R9: a week picked on purpose stays across Monday 00:00 while it is fresh', () => {
    const sundayEvening = new Date(2026, 10, 15, 23, 0);
    const justAfterMidnight = new Date(2026, 10, 16, 0, 10);

    // On Sunday evening the user went back to the week of 2 November.
    const earlier = encodePlannerWeekChoice(new Date(2026, 10, 2), sundayEvening);
    assert.equal(isPlannerWeekOutdated(earlier, justAfterMidnight), false);
    assert.equal(toLocalDateKey(resolvePlannerWeek(earlier, justAfterMidnight)), '2026-11-02');

    // Just after midnight the user goes back one week to tick Sunday's dinner.
    const backToSunday = encodePlannerWeekChoice(new Date(2026, 10, 9), justAfterMidnight);
    assert.deepEqual(readPlannerWeekChoice(backToSunday, new Date(2026, 10, 16, 1, 0)), { week: THIS_WEEK, fresh: true });
    assert.deepEqual(readPlannerWeekChoice(backToSunday, new Date(2026, 10, 16, 4, 10)), { week: THIS_WEEK, fresh: false });

    // A pick of next week, still in use when that week starts, is then simply this week.
    const ahead = encodePlannerWeekChoice(new Date(2026, 10, 16), sundayEvening);
    const renewed = renewPlannerWeekChoice(ahead, justAfterMidnight);
    assert.deepEqual(JSON.parse(renewed!), { week: NEXT_WEEK, at: justAfterMidnight.getTime() });
    const mondayMorning = new Date(2026, 10, 16, 9, 0);
    assert.equal(isPlannerWeekOutdated(renewed, mondayMorning), false);
    assert.equal(toLocalDateKey(resolvePlannerWeek(renewed, mondayMorning)), NEXT_WEEK);
});

test('N1: the arrows move whole weeks from any day and always land on a Monday', () => {
    const cases: [Date, string, string][] = [
        [new Date(2026, 10, 9), '2026-11-16', '2026-11-02'],          // Monday
        [new Date(2026, 10, 10, 14, 45), '2026-11-16', '2026-11-02'], // Tuesday afternoon
        [new Date(2026, 10, 15, 23, 59), '2026-11-16', '2026-11-02'], // Sunday night
        [new Date(2026, 11, 9), '2026-12-14', '2026-11-30'],          // a Wednesday after a month step
        [new Date(2026, 11, 28), '2027-01-04', '2026-12-21'],         // across the new year
        [new Date(2026, 2, 2), '2026-03-09', '2026-02-23'],           // US clocks go forward on 8 March
        [new Date(2026, 9, 26), '2026-11-02', '2026-10-19'],          // US clocks go back on 1 November
        [new Date(2026, 2, 23), '2026-03-30', '2026-03-16'],          // EU clocks go forward on 29 March
    ];
    for (const [from, next, prev] of cases) {
        for (const [direction, expected] of [['next', next], ['prev', prev]] as const) {
            const result = stepPlannerWeek(from, direction);
            assert.equal(toLocalDateKey(result), expected, `${from.toDateString()} ${direction}`);
            assert.equal(result.getDay(), 1, 'a week starts on Monday');
            assert.equal(result.getHours(), 0, 'a week starts at local midnight');
        }
    }
});

test('N1: seven arrow steps there and back return to the same Monday', () => {
    let date = new Date(2026, 9, 12);
    for (let i = 0; i < 7; i++) date = stepPlannerWeek(date, 'next');
    assert.equal(toLocalDateKey(date), '2026-11-30');
    for (let i = 0; i < 7; i++) date = stepPlannerWeek(date, 'prev');
    assert.equal(toLocalDateKey(date), '2026-10-12');
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NEXT_WEEK_DATES = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'];

test('N1: an empty plan starts on its week\'s Monday whatever day it is given', () => {
    for (const given of [new Date(2026, 10, 16), new Date(2026, 10, 17, 9, 30), new Date(2026, 10, 22, 23, 59)]) {
        const plan = createEmptyPlan(given, null);
        assert.equal(plan.weekStart, NEXT_WEEK, given.toDateString());
        assert.equal(plan.weekEnd, '2026-11-22', given.toDateString());
        assert.deepEqual(plan.days.map(day => day.date), NEXT_WEEK_DATES, given.toDateString());
        assert.deepEqual(plan.days.map(day => day.dayName), DAY_NAMES, given.toDateString());
        assert.ok(plan.days.every(day => day.meals.length === 0 && day.totalCalories === 0));
    }
});

test('N1: a generated plan starts on its week\'s Monday whatever day it is given', () => {
    for (const given of [new Date(2026, 10, 16), new Date(2026, 10, 18, 12), new Date(2026, 10, 22)]) {
        const plan = generateWeekPlan([], null, given);
        assert.equal(plan.weekStart, NEXT_WEEK, given.toDateString());
        assert.equal(plan.weekEnd, '2026-11-22', given.toDateString());
        assert.deepEqual(plan.days.map(day => day.date), NEXT_WEEK_DATES, given.toDateString());
        assert.deepEqual(plan.days.map(day => day.dayName), DAY_NAMES, given.toDateString());
    }
});
