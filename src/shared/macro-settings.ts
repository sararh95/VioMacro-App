type StoredMacroTriple = {
    protein?: unknown;
    carbs?: unknown;
    fat?: unknown;
};

type StoredMacroSettings = {
    macroSplit?: StoredMacroTriple | null;
    macroTargets?: StoredMacroTriple | null;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

// Read legacy maps before any consumer uses their values in calculations.
export function readMacroSettings(settings: StoredMacroSettings | null | undefined) {
    const { protein, carbs, fat } = settings?.macroSplit ?? {};
    const macroSplit = isFiniteNumber(protein) && isFiniteNumber(carbs) && isFiniteNumber(fat)
        ? { protein, carbs, fat }
        : { protein: 30, carbs: 35, fat: 35 };

    const targets = settings?.macroTargets;
    const macroTargets = targets == null ? undefined : {
        protein: isFiniteNumber(targets.protein) ? targets.protein : 0,
        carbs: isFiniteNumber(targets.carbs) ? targets.carbs : 0,
        fat: isFiniteNumber(targets.fat) ? targets.fat : 0,
    };

    return { macroSplit, macroTargets };
}
