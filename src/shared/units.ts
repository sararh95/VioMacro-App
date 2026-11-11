/**
 * Single source of truth for weight, height and energy maths.
 *
 * Before this file existed, four separate places decided units on their own and
 * three of them were wrong:
 *   - AUD-063  OnboardingWizard always converted weight from pounds, even in
 *              metric mode, so a 75 kg user was costed as 34 kg.
 *   - AUD-064  The weight field printed a hardcoded "lbs" suffix.
 *   - AUD-065  Height could only be entered in feet and inches.
 *   - AUD-106  The rate-of-change slider always said "lbs / week".
 *
 * Metric is the app default (see createDefaultUserSettings), so all of the above
 * were wrong for new accounts by default. Nothing outside this module should do
 * its own unit arithmetic.
 */

export type MeasurementUnit = 'metric' | 'imperial';
export type Sex = 'male' | 'female';

export const LB_PER_KG = 2.2046226218;
export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;

export type HeightInput =
    | { unit: 'metric'; cm: number }
    | { unit: 'imperial'; feet: number; inches: number };

/** Coerce anything the DOM hands us into a usable number, or null. */
export function safeNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

// ---------------------------------------------------------------- weight

/** Convert a value the user typed, in their chosen unit, into kilograms. */
export function toKg(value: number, unit: MeasurementUnit): number {
    if (!Number.isFinite(value)) return Number.NaN;
    return unit === 'metric' ? value : value / LB_PER_KG;
}

/** Convert kilograms back into the unit the user is currently reading. */
export function fromKg(kg: number, unit: MeasurementUnit): number {
    if (!Number.isFinite(kg)) return Number.NaN;
    return unit === 'metric' ? kg : kg * LB_PER_KG;
}

/** The suffix to render next to a weight. Never hardcode this at a call site. */
export function weightSuffix(unit: MeasurementUnit): 'kg' | 'lbs' {
    return unit === 'metric' ? 'kg' : 'lbs';
}

/** A weight plus its unit, ready to display. */
export function formatWeight(
    kg: number,
    unit: MeasurementUnit,
    fractionDigits = 1,
): string {
    if (!Number.isFinite(kg)) return `— ${weightSuffix(unit)}`;
    return `${fromKg(kg, unit).toFixed(fractionDigits)} ${weightSuffix(unit)}`;
}

// ---------------------------------------------------------------- height

/** Normalise either height shape into centimetres. */
export function heightToCm(height: HeightInput): number {
    if (height.unit === 'metric') {
        return Number.isFinite(height.cm) ? height.cm : Number.NaN;
    }
    const feet = Number.isFinite(height.feet) ? height.feet : Number.NaN;
    const inches = Number.isFinite(height.inches) ? height.inches : Number.NaN;
    return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

/** Split centimetres into whole feet and inches, for the imperial inputs. */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
    if (!Number.isFinite(cm)) return { feet: 0, inches: 0 };
    const totalInches = cm / CM_PER_INCH;
    const feet = Math.floor(totalInches / INCHES_PER_FOOT);
    const inches = Math.round(totalInches - feet * INCHES_PER_FOOT);
    // Rounding 11.6" up to 12" would render as 5'12"; carry it into the feet.
    return inches === INCHES_PER_FOOT ? { feet: feet + 1, inches: 0 } : { feet, inches };
}

export function heightSuffix(unit: MeasurementUnit): 'cm' | 'ft / in' {
    return unit === 'metric' ? 'cm' : 'ft / in';
}

// ---------------------------------------------------------------- energy

export interface BmrInput {
    weightKg: number;
    heightCm: number;
    age: number;
    sex: Sex;
}

/**
 * Mifflin-St Jeor basal metabolic rate.
 *   men:   10w + 6.25h - 5a + 5
 *   women: 10w + 6.25h - 5a - 161
 * Returns NaN for unusable input; callers should guard.
 */
export function calculateBmr({ weightKg, heightCm, age, sex }: BmrInput): number {
    if (![weightKg, heightCm, age].every(Number.isFinite)) return Number.NaN;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? base + 5 : base - 161;
}

export interface TdeeInput {
    /** As the user typed it, in `weightUnit`. */
    weight: number;
    weightUnit: MeasurementUnit;
    height: HeightInput;
    age: number;
    sex: Sex;
    /** Mifflin activity multiplier, e.g. 1.2 sedentary … 1.9 very active. */
    activityLevel: number;
}

/**
 * Total daily energy expenditure, rounded to a whole kcal.
 *
 * Returns 0 — never NaN and never a guess — when any input is unusable, so a
 * half-filled form can render "not set" instead of silently inventing a target.
 */
export function calculateTdee(input: TdeeInput): number {
    const weightKg = toKg(input.weight, input.weightUnit);
    const heightCm = heightToCm(input.height);
    const bmr = calculateBmr({
        weightKg,
        heightCm,
        age: input.age,
        sex: input.sex,
    });

    if (!Number.isFinite(bmr) || !Number.isFinite(input.activityLevel)) return 0;

    const tdee = Math.round(bmr * input.activityLevel);
    return Number.isFinite(tdee) && tdee > 0 ? tdee : 0;
}

// ------------------------------------------------------------ rate of change

/**
 * Format a weekly rate of weight change for display.
 *
 * `lbPerWeek` is the canonical internal value (the Settings slider has always
 * been calibrated in pounds). Metric users see it converted, not merely
 * relabelled — that distinction is the whole of AUD-106.
 */
export function formatRatePerWeek(lbPerWeek: number, unit: MeasurementUnit): string {
    if (!Number.isFinite(lbPerWeek)) return `— ${weightSuffix(unit)} / week`;

    if (unit === 'imperial') {
        return `${trimZero(lbPerWeek.toFixed(1))} lbs / week`;
    }

    const kgPerWeek = lbPerWeek / LB_PER_KG;
    return `${trimZero(kgPerWeek.toFixed(2))} kg / week`;
}

/** "-0.50" -> "-0.5", but "-0.45" stays put. Keeps labels tidy. */
function trimZero(value: string): string {
    return value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;
}
