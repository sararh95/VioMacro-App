/**
 * Parsing for the pantry quick-add box, kept out of the page so it can be
 * unit-tested directly.
 *
 * AUD-098: the parsing and the writing used to be one loop with an `await`
 * inside it. Ten pasted lines meant ten sequential round trips, and a failure
 * partway through left half the list saved with no way back. Separating "work
 * out what the user meant" from "write it" makes the write batchable and makes
 * the parsing testable, which it never was.
 *
 * Same reasoning as src/features/meal-planning/lib/plan-limits.ts and src/features/progress/lib/metric-summary.ts.
 */

import type { PantryItem } from './pantryService';

/** Units the quick-add box recognises when they follow a bare number. */
const KNOWN_UNITS = ['g', 'kg', 'oz', 'lbs', 'ml', 'l', 'cup', 'tbsp', 'tsp'];

const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
    ['Proteins', ['chicken', 'beef', 'pork', 'fish', 'tofu', 'egg']],
    ['Grains', ['rice', 'pasta', 'quinoa', 'oat', 'bread']],
    ['Produce', ['apple', 'banana', 'spinach', 'broccoli', 'carrot']],
    ['Freezer', ['frozen', 'ice']],
    ['Fridge', ['milk', 'cheese', 'yogurt', 'butter']],
];

export type ParsedPantryItem = Omit<PantryItem, 'id'>;

/** Guess a shelf from the name. 'Other' when nothing matches. */
export function guessCategory(name: string): string {
    const lower = name.toLowerCase();
    for (const [category, keywords] of CATEGORY_KEYWORDS) {
        if (keywords.some((word) => lower.includes(word))) return category;
    }
    return 'Other';
}

/**
 * Turn one typed line into an item.
 *
 * Handles "200g Greek Yogurt", "2 kg Rice", "12 Eggs" and a bare "Salt".
 * Returns null for a blank line rather than an item with no name.
 *
 * No expiry is ever set. AUD-095: an expiry date gets acted on, so it must come
 * from the user or not exist at all -- and there is still no UI to enter one.
 */
export function parsePantryLine(line: string): ParsedPantryItem | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    let quantity = 1;
    let unit = 'pc';
    let name = trimmed;

    // "200g Greek Yogurt" -- number and unit stuck together.
    const joined = parts[0].match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
    if (joined) {
        quantity = parseFloat(joined[1]);
        unit = joined[2];
        name = parts.slice(1).join(' ');
    } else if (parts[0] !== '' && !Number.isNaN(Number(parts[0]))) {
        const maybeUnit = parts[1];
        if (maybeUnit && KNOWN_UNITS.includes(maybeUnit.toLowerCase())) {
            // "2 kg Rice"
            quantity = Number(parts[0]);
            unit = maybeUnit;
            name = parts.slice(2).join(' ');
        } else {
            // "12 Eggs"
            quantity = Number(parts[0]);
            name = parts.slice(1).join(' ');
        }
    }

    name = name.trim();
    // "200g" on its own parses to an empty name. That is not an item.
    if (!name) return null;

    return { name, quantity, unit, category: guessCategory(name), isLowStock: false };
}

/** Parse a whole quick-add box. Blank and name-less lines are dropped. */
export function parsePantryLines(text: string): ParsedPantryItem[] {
    return text
        .split('\n')
        .map(parsePantryLine)
        .filter((item): item is ParsedPantryItem => item !== null);
}
