import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateBmr,
    calculateTdee,
    formatRatePerWeek,
    fromKg,
    heightToCm,
    toKg,
    weightSuffix,
} from '../../src/shared/units.ts';

/**
 * Regression tests for AUD-063, AUD-064, AUD-065 and AUD-106.
 *
 * The bug: OnboardingWizard.calculateTDEE unconditionally multiplied the
 * entered weight by 0.453592, so a metric user entering 75 (kg) was costed
 * as 34 kg. Metric is the DEFAULT unit, so this affected new accounts.
 */

// ---------------------------------------------------------------- conversion

test('toKg leaves a metric value untouched', () => {
    assert.equal(toKg(75, 'metric'), 75);
});

test('toKg converts pounds to kilograms', () => {
    assert.ok(Math.abs(toKg(165.347, 'imperial') - 75) < 0.01);
});

test('fromKg round-trips through both units', () => {
    assert.ok(Math.abs(fromKg(toKg(180, 'imperial'), 'imperial') - 180) < 0.001);
    assert.equal(fromKg(toKg(82, 'metric'), 'metric'), 82);
});

test('weightSuffix follows the unit instead of being hardcoded', () => {
    assert.equal(weightSuffix('metric'), 'kg');
    assert.equal(weightSuffix('imperial'), 'lbs');
});

test('heightToCm accepts centimetres directly and feet/inches together', () => {
    assert.equal(heightToCm({ unit: 'metric', cm: 178 }), 178);
    // 5'10" == 70in == 177.8cm
    assert.ok(Math.abs(heightToCm({ unit: 'imperial', feet: 5, inches: 10 }) - 177.8) < 0.001);
});

// ----------------------------------------------------------- Mifflin-St Jeor

test('calculateBmr matches the published Mifflin-St Jeor result for a man', () => {
    // 10(75) + 6.25(177.8) - 5(30) + 5 = 1716.25
    const bmr = calculateBmr({ weightKg: 75, heightCm: 177.8, age: 30, sex: 'male' });
    assert.ok(Math.abs(bmr - 1716.25) < 0.01, `expected ~1716.25, got ${bmr}`);
});

test('calculateBmr matches the published Mifflin-St Jeor result for a woman', () => {
    // 10(62) + 6.25(165) - 5(30) - 161 = 1340.25
    const bmr = calculateBmr({ weightKg: 62, heightCm: 165, age: 30, sex: 'female' });
    assert.ok(Math.abs(bmr - 1340.25) < 0.01, `expected ~1340.25, got ${bmr}`);
});

// ------------------------------------------------------- the actual AUD-063

test('AUD-063: the same person gives the same TDEE in either unit', () => {
    const metric = calculateTdee({
        weight: 75,
        weightUnit: 'metric',
        height: { unit: 'metric', cm: 177.8 },
        age: 30,
        sex: 'male',
        activityLevel: 1.55,
    });

    const imperial = calculateTdee({
        weight: 165.347, // the same 75 kg, expressed in pounds
        weightUnit: 'imperial',
        height: { unit: 'imperial', feet: 5, inches: 10 },
        age: 30,
        sex: 'male',
        activityLevel: 1.55,
    });

    assert.equal(
        metric,
        imperial,
        `metric gave ${metric} but imperial gave ${imperial} for the same body`,
    );
});

test('AUD-063: a metric user is not silently under-fed', () => {
    const tdee = calculateTdee({
        weight: 75,
        weightUnit: 'metric',
        height: { unit: 'metric', cm: 177.8 },
        age: 30,
        sex: 'male',
        activityLevel: 1.55,
    });

    // Correct answer is ~2660. The old code returned ~2025 because it treated
    // 75 kg as 75 lb. Anything near 2025 means the bug is back.
    assert.ok(tdee > 2600 && tdee < 2720, `expected ~2660 kcal, got ${tdee}`);
});

test('calculateTdee returns a whole number', () => {
    const tdee = calculateTdee({
        weight: 82,
        weightUnit: 'metric',
        height: { unit: 'metric', cm: 180 },
        age: 41,
        sex: 'male',
        activityLevel: 1.375,
    });
    assert.equal(Number.isInteger(tdee), true);
});

// ------------------------------------------------------------------ AUD-106

test('AUD-106: rate-of-change labels speak the user unit', () => {
    assert.equal(formatRatePerWeek(-0.5, 'imperial'), '-0.5 lbs / week');
    assert.match(formatRatePerWeek(-0.5, 'metric'), /kg \/ week$/);
});

test('AUD-106: a metric rate is converted, not just relabelled', () => {
    // -1.0 lb/week is about -0.45 kg/week, so the number must change too.
    const label = formatRatePerWeek(-1, 'metric');
    assert.match(label, /^-0\.45 kg \/ week$/, `got "${label}"`);
});

// -------------------------------------------------------- defensive parsing

test('bad numeric input never produces NaN targets', () => {
    const tdee = calculateTdee({
        weight: Number.NaN,
        weightUnit: 'metric',
        height: { unit: 'metric', cm: 177.8 },
        age: 30,
        sex: 'male',
        activityLevel: 1.55,
    });
    assert.equal(Number.isNaN(tdee), false, 'NaN weight leaked into the target');
    assert.equal(tdee, 0, 'an unusable input should yield 0, not a guess');
});
