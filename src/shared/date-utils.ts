const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a `YYYY-MM-DD` key as LOCAL midnight.
 *
 * AUD-099: `new Date('2026-08-24')` is parsed as UTC midnight by the ECMAScript
 * spec. Rendering that with toLocaleDateString then shows the previous day for
 * anyone west of Greenwich -- so History displayed plan ranges a day early
 * while the Meal Planner, which parsed differently, showed them correctly. Two
 * screens disagreeing about the same week.
 *
 * Every place that turns a stored date key back into a Date must use this.
 * Throws on anything that is not a bare date key, so a full ISO timestamp is
 * never silently mangled.
 */
export function parseLocalDateKey(key: string): Date {
    if (!DATE_KEY.test(key)) {
        throw new Error(`Not a YYYY-MM-DD date key: ${JSON.stringify(key)}`);
    }
    const [year, month, day] = key.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);

    // JS rolls impossible dates over silently: new Date(2026, 1, 29) becomes
    // 1 March. A stored key that does not describe a real day is corrupt data,
    // and rolling it produces a plausible-looking wrong answer -- exactly the
    // failure mode this helper exists to prevent.
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        throw new Error(`Not a real calendar date: ${JSON.stringify(key)}`);
    }

    return parsed;
}

/** Same, but returns null instead of throwing. For values of uncertain shape. */
export function tryParseLocalDateKey(value: string | null | undefined): Date | null {
    if (!value || !DATE_KEY.test(value)) return null;
    return parseLocalDateKey(value);
}

/** Format a stored date key for display, without the UTC shift. */
export function formatDateKey(
    key: string,
    options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
    locale?: string,
): string {
    const parsed = tryParseLocalDateKey(key);
    return parsed ? parsed.toLocaleDateString(locale, options) : '—';
}

export function toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

export function getStartOfWeek(date: Date = new Date()): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    return start;
}

export function getWeekStartKey(date: Date = new Date()): string {
    return toLocalDateKey(getStartOfWeek(date));
}
