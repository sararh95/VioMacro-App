/** Ingredient amounts shared by recipe views, cooking and grocery generation. */
export interface IngredientInput {
    item: string;
    quantity?: unknown;
    unit?: unknown;
    amount?: unknown;
}

export interface IngredientAmount {
    min: number;
    max: number;
    unit: string;
    quantityText: string;
    separator: string;
    qualitative: boolean;
}

const vulgar: Record<string, string> = { '¼': '1/4', '½': '1/2', '¾': '3/4', '⅐': '1/7', '⅑': '1/9', '⅒': '1/10', '⅓': '1/3', '⅔': '2/3', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
const numericToken = '(?:(?:\\d+\\s+)?\\d+\\s*/\\s*\\d+|\\+?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?)';
const numericPrefix = new RegExp(`^(${numericToken})(\\s*(?:[-–]|\\bto\\b)\\s*(${numericToken}))?\\s*(.*)$`, 'i');
const qualitativeUnit = /^(?:(?:a\s+)?(?:pinch|dash)\b.*|to taste|as needed)$/i;

function asciiFractions(value: string): string {
    return value.replace(/(\d)\s*([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1 $2')
        .replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, char => vulgar[char]);
}

function scalar(value: string): number | null {
    const raw = asciiFractions(value.trim());
    const fraction = raw.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
    let result: number;
    if (fraction) {
        if (Number(fraction[3]) === 0) return null;
        result = Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]);
    } else {
        if (!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) return null;
        result = Number(raw);
    }
    return Number.isFinite(result) && result > 0 ? result : null;
}

/** Parse the entire quantity token before conversion; malformed/zero is absent. */
export function parseIngredientAmount(ingredient: IngredientInput): IngredientAmount | null {
    const structured = ingredient.quantity !== undefined;
    const value = structured ? ingredient.quantity : ingredient.amount;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (qualitativeUnit.test(raw)) {
        return { min: 1, max: 1, unit: raw, quantityText: '', separator: '', qualitative: true };
    }
    const match = asciiFractions(raw).match(numericPrefix);
    if (!match || (structured && match[4])) return null;
    const min = scalar(match[1]);
    const max = match[3] === undefined ? min : scalar(match[3]);
    if (min === null || max === null || max < min) return null;
    const unit = structured ? (typeof ingredient.unit === 'string' ? ingredient.unit.trim() : '') : match[4].trim();
    // Legacy suffixes may start with descriptive punctuation, e.g. ", juice
    // and zest" or "(14 oz) cans", but never a broken numeric continuation.
    if (!structured && (/^[\d./+\-–]|^,\s*\d|^to\b/i.test(unit))) return null;
    const separator = match[2]?.replace(match[3], '') || '';
    // Preserve the original spelling (including Unicode and range separators)
    // at the recipe's base yield. Only the numeric prefix is scaled in views.
    const quantityText = structured ? raw : raw.slice(0, raw.length - match[4].length).trim();
    return { min, max, unit: unit || 'pcs', quantityText, separator, qualitative: false };
}

export function recipeServings(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1;
}

export function scaleIngredientAmount(amount: IngredientAmount, factor: number): IngredientAmount {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('Invalid ingredient serving scale');
    if (amount.qualitative) return amount;
    const min = amount.min * factor;
    const max = amount.max * factor;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) throw new Error('Ingredient quantity is outside the supported range');
    return { ...amount, min, max, quantityText: factor === 1 ? amount.quantityText : '' };
}

/** Round the whole value; common exact fractions retain cooking notation. */
export function formatQuantity(value: number | string): string {
    const number = typeof value === 'number' ? value : scalar(value);
    if (number === null || !Number.isFinite(number)) return '';
    if (number === 0) return '0';
    const whole = Math.floor(number);
    const part = number - whole;
    const fractions: [number, string][] = [[0.125, '1/8'], [0.25, '1/4'], [1 / 3, '1/3'], [0.375, '3/8'], [0.5, '1/2'], [0.625, '5/8'], [2 / 3, '2/3'], [0.75, '3/4'], [0.875, '7/8']];
    const fraction = fractions.find(([n]) => Math.abs(part - n) < 1e-8)?.[1];
    if (fraction) return whole > 0 ? `${whole} ${fraction}` : fraction;
    const rounded = Math.round((number + Number.EPSILON) * 100) / 100;
    return String(rounded === 0 && number > 0 ? Number(number.toPrecision(3)) : rounded);
}

export function formatIngredientAmount(ingredient: IngredientInput, factor = 1): string {
    const parsed = parseIngredientAmount(ingredient);
    if (!parsed) {
        // Views retain unrecognized legacy wording; groceries never fabricate a
        // number from it. An explicitly invalid structured value stays visible.
        return ingredient.quantity !== undefined
            ? [ingredient.quantity, ingredient.unit].filter(v => typeof v === 'string' || typeof v === 'number').join(' ').trim()
            : (typeof ingredient.amount === 'string' ? ingredient.amount.trim() : '');
    }
    const amount = scaleIngredientAmount(parsed, factor);
    if (amount.qualitative) return amount.unit;
    const quantity = amount.quantityText || (amount.separator
        ? `${formatQuantity(amount.min)}${amount.separator}${formatQuantity(amount.max)}`
        : formatQuantity(amount.max));
    return `${quantity} ${amount.unit}`;
}

const aliases: Record<string, string> = {
    cup: 'cups', cups: 'cups', tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
    gram: 'g', grams: 'g', g: 'g', kilogram: 'kg', kilograms: 'kg', kg: 'kg', pound: 'lbs', pounds: 'lbs', lb: 'lbs', lbs: 'lbs',
    ounce: 'oz', ounces: 'oz', oz: 'oz', milliliter: 'ml', milliliters: 'ml', ml: 'ml', liter: 'l', liters: 'l', l: 'l',
    clove: 'cloves', cloves: 'cloves', egg: 'eggs', eggs: 'eggs', piece: 'pcs', pieces: 'pcs', pc: 'pcs', pcs: 'pcs',
    unit: 'pcs', units: 'pcs', stick: 'sticks', sticks: 'sticks',
    // The recipe form uses size labels as countable units. Keep sizes distinct;
    // registering them also lets quick-add recognize the same vocabulary.
    large: 'large', medium: 'medium', small: 'small',
    can: 'cans', cans: 'cans', slice: 'slices', slices: 'slices', stalk: 'stalks', stalks: 'stalks',
};

export function normalizeIngredientUnit(unit: string): string {
    const clean = unit.trim().toLowerCase().replace(/\s+/g, ' ');
    // A leading package size describes one unit; normalize the count noun only.
    return clean.replace(/^(\([^)]*\)\s*)?([a-z]+)\b/, (_match, size, word) => `${size || ''}${aliases[word] || word}`);
}

export function groceryIngredientKey(name: string, unit: string): string {
    const normalized = normalizeIngredientUnit(unit);
    // Share identity for complete packaged counts without changing display units.
    const leading = normalized.match(/^(\([^()]+\))\s*([a-z]+)$/);
    const trailing = normalized.match(/^([a-z]+)\s*(\([^()]+\))$/);
    const countUnit = leading?.[2] ?? trailing?.[1];
    const packageSize = leading?.[1] ?? trailing?.[2];
    const identityUnit = countUnit && packageSize && countable(countUnit)
        ? `${countUnit} ${packageSize}` : normalized;
    return JSON.stringify([name.trim().toLowerCase().replace(/\s+/g, ' '), identityUnit]);
}

function countable(unit: string): boolean {
    const countUnit = unit.replace(/^\([^)]*\)\s*/, '');
    return /^(?:pcs|cloves|eggs|cans|slices|stalks|sticks|large|medium|small)\b/.test(countUnit) || unit.startsWith(',');
}

export interface IngredientTotal { name: string; quantity: number; unit: string; aisle: string }

/** Full-precision portion totals; countable rounding happens once at the end. */
export function aggregateIngredients(entries: { ingredient: IngredientInput; factor: number }[]): { items: IngredientTotal[]; skippedCount: number } {
    const totals = new Map<string, IngredientTotal>();
    let skippedCount = 0;
    for (const { ingredient, factor } of entries) {
        const parsed = parseIngredientAmount(ingredient);
        if (!parsed || typeof ingredient.item !== 'string' || !ingredient.item.trim()) {
            skippedCount++;
            continue;
        }
        const unit = normalizeIngredientUnit(parsed.unit);
        if (parsed.unit.length > 50 || unit.length > 50) {
            skippedCount++;
            continue;
        }
        const amount = scaleIngredientAmount(parsed, factor);
        const name = ingredient.item.trim().replace(/\s+/g, ' ');
        const key = groceryIngredientKey(name, unit);
        const prior = totals.get(key);
        const quantity = amount.qualitative ? 1 : (prior?.quantity || 0) + amount.max;
        if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Ingredient total is outside the supported range');
        totals.set(key, { name: prior?.name || name, quantity, unit, aisle: guessAisle(name) });
    }
    const items = [...totals.values()].map(item => ({ ...item,
        quantity: countable(item.unit) ? Math.ceil(item.quantity - Math.min(1e-9, item.quantity * Number.EPSILON * 8)) : item.quantity,
    }));
    return { items, skippedCount };
}

export function guessAisle(name: string): string {
    const words = name.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
    if (/\b(?:black pepper|white pepper|peppercorns?|peanut butter|almond butter|canned|spices?)\b/.test(words)) return 'Pantry';
    // These are food families (blueberry/berries, whitefish, walnuts), rather
    // than arbitrary substring matches such as "egg" inside "eggplant".
    if (/\b[a-z]*(?:berry|berries)\b/.test(words)) return 'Produce';
    if (/\b(?:apples?|bananas?|spinach|avocados?|fruits?|vegetables?|lemons?|limes?|onions?|garlic|tomatoes|tomato|potatoes|potato|carrots?|peppers?|cilantro|herbs?|lettuce|salad|berries|blueberries|strawberries|raspberries|eggplants?)\b/.test(words)) return 'Produce';
    if (/\b[a-z]*fish\b/.test(words)) return 'Proteins';
    if (/\b(?:chicken|beef|pork|tofu|eggs?|fish|salmon|tuna|steak|turkey|meat|sausages?|bacon)\b/.test(words)) return 'Proteins';
    if (/\b(?:oatmeal|[a-z]*nuts?|[a-z]*beans?|[a-z]*seeds?)\b/.test(words)) return 'Pantry';
    if (/\b(?:rice|pasta|bread|cereal|oats?|quinoa|flour|sugar|oils?|sauces?|cans?|beans?|lentils?|nuts?|seeds?)\b/.test(words)) return 'Pantry';
    if (/\b(?:milk|cheese|yogurt|butter|cream)\b/.test(words)) return 'Dairy';
    return 'Other';
}

export function parseGroceryInput(text: string): IngredientTotal | null {
    const raw = text.trim();
    if (!raw) return null;
    if (!/^[\d.+\-¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(raw)) return { name: raw, quantity: 1, unit: 'pcs', aisle: guessAisle(raw) };
    const parsed = parseIngredientAmount({ item: '', amount: raw });
    if (!parsed) return null;
    const tail = parsed.unit;
    const first = tail.match(/^((?:\([^)]*\)\s*)?([a-z]+)(?:\s+\([^)]*\))?)\s+(.+)$/i);
    const unit = first && aliases[first[2].toLowerCase()] ? first[1] : 'pcs';
    const name = unit === 'pcs' && !first?.[2].match(/^(?:pcs?|pieces?)$/i) ? tail : first![3];
    if (tail === 'pcs' || !name.trim()) return null;
    return aggregateIngredients([{ ingredient: { item: name, quantity: parsed.max, unit }, factor: 1 }]).items[0] || null;
}

// Display copy only: canonical plural units still own saved totals and identity.
const grocerySingularUnits: Record<string, string> = {
    cups: 'cup', tablespoons: 'tablespoon', teaspoons: 'teaspoon', grams: 'gram', kilograms: 'kilogram',
    pounds: 'pound', lbs: 'lb', ounces: 'ounce', milliliters: 'milliliter', liters: 'liter',
    cloves: 'clove', eggs: 'egg', pieces: 'piece', pcs: 'pc', units: 'unit', sticks: 'stick',
    cans: 'can', slices: 'slice', stalks: 'stalk',
};

export function formatGroceryAmount(quantity: number, unit: string): string {
    if (quantity === 1 && qualitativeUnit.test(unit)) return unit;
    const displayUnit = quantity === 1 && typeof unit === 'string' ? unit.replace(/^(\s*(?:\([^)]*\)\s*)?)([a-z]+)\b/i, (match, prefix, word) => {
        const key = word.toLowerCase();
        if (!Object.hasOwn(grocerySingularUnits, key)) return match;
        let singular = grocerySingularUnits[key];
        if (word === word.toUpperCase()) singular = singular.toUpperCase();
        else if (word[0] === word[0].toUpperCase()) singular = singular[0].toUpperCase() + singular.slice(1);
        return `${prefix}${singular}`;
    }) : unit;
    return `${formatQuantity(quantity)} ${displayUnit}`;
}
