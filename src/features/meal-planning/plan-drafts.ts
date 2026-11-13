import type { MealPlan } from './planService';
import { addDays, parseLocalDateKey, toLocalDateKey } from '../../shared/date-utils.ts';
import { withMealEaten } from './lib/meal-status.ts';

export type PlanDrafts = Record<string, MealPlan>;
export type SavedPlanVersion = { id: string; seconds: number | null; nanoseconds: number | null };
export type CommittedPlanVersion = { id: string; seconds: number; nanoseconds: number };
export type PlanDraftMetadata = {
    baseVersion: SavedPlanVersion | null;
    revision: string;
    tickIntents: Record<string, string>;
};
export type LocalPlanDraft = { plan: MealPlan; metadata: PlanDraftMetadata };
export type PlanDraftState = {
    drafts: PlanDrafts;
    metadata: Record<string, PlanDraftMetadata>;
    warning: string | null;
};
export type PlanDraftOptions = {
    weekStart?: string;
    transient?: boolean;
    expectedPlan?: MealPlan;
    localTick?: string;
    basePlan?: MealPlan | null;
    sourceMetadata?: PlanDraftMetadata;
};
export type SavePlanOptions = {
    expectedVersion?: SavedPlanVersion | null;
    onCommitted?: (version: CommittedPlanVersion) => void;
};

export class PlanDraftConflictError extends Error {
    readonly savedVersion: SavedPlanVersion | null;
    constructor(savedVersion: SavedPlanVersion | null) {
        super('This week was changed on another device since this draft.');
        this.name = 'PlanDraftConflictError';
        this.savedVersion = savedVersion;
    }
}

export const planDraftStorageKey = (userId: string) => `viomacro:plan-drafts:${userId}`;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function getSavedPlanVersion(plan: MealPlan | null): SavedPlanVersion | null {
    if (!plan?.id) return null;
    const stamp = plan.updatedAt;
    return {
        id: plan.id,
        seconds: Number.isInteger(stamp?.seconds) ? stamp!.seconds : null,
        nanoseconds: Number.isInteger(stamp?.nanoseconds) ? stamp!.nanoseconds : null,
    };
}

export function sameSavedPlanVersion(a: SavedPlanVersion | null, b: SavedPlanVersion | null): boolean {
    return a === null || b === null ? a === b
        : a.id === b.id && a.seconds === b.seconds && a.nanoseconds === b.nanoseconds;
}

function record(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function calendarDate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    try { parseLocalDateKey(value); return true; } catch { return false; }
}

function validatePlan(week: string, value: unknown): asserts value is MealPlan {
    const plan = value as Partial<MealPlan> | null;
    if (!calendarDate(week) || !plan || plan.weekStart !== week || !calendarDate(plan.weekEnd)
        || typeof plan.goal !== 'string' || !Array.isArray(plan.days)
        || !plan.days.every(day => day && calendarDate(day.date) && typeof day.dayName === 'string'
            && Number.isFinite(day.totalCalories) && Array.isArray(day.meals)
            && day.meals.every(meal => meal && typeof meal.id === 'string' && typeof meal.name === 'string'
                && ['breakfast', 'lunch', 'dinner', 'snack', 'smoothie', 'tea'].includes(meal.type)
                && [meal.calories, meal.protein, meal.carbs, meal.fat].every(Number.isFinite)))
        || (plan.dailyTargets !== undefined && (!record(plan.dailyTargets)
            || !['calories', 'protein', 'carbs', 'fat'].every(key => Number.isFinite(plan.dailyTargets![key as keyof typeof plan.dailyTargets]))))) {
        throw new Error('Invalid local plan draft');
    }
}

function validMetadata(value: unknown): value is PlanDraftMetadata {
    if (!record(value) || typeof value.revision !== 'string' || !value.revision || !record(value.tickIntents)
        || !Object.values(value.tickIntents).every(token => typeof token === 'string')) return false;
    const version = value.baseVersion;
    return version === null || (record(version) && typeof version.id === 'string' && !!version.id
        && ((version.seconds === null && version.nanoseconds === null)
            || (Number.isInteger(version.seconds) && Number.isInteger(version.nanoseconds)
                && Number(version.nanoseconds) >= 0 && Number(version.nanoseconds) < 1_000_000_000)));
}

function readRaw(userId: string, storage: DraftStorage): Record<string, unknown> {
    const text = storage.getItem(planDraftStorageKey(userId));
    if (!text) return {};
    const raw: unknown = JSON.parse(text);
    if (!record(raw)) throw new Error('Invalid local plan drafts');
    return raw;
}

function decode(raw: Record<string, unknown>): PlanDraftState {
    const drafts: PlanDrafts = {};
    const metadata: Record<string, PlanDraftMetadata> = {};
    let invalid = false;
    for (const [week, value] of Object.entries(raw)) {
        try {
            const wrapped = record(value) && value.schema === 2;
            const plan = wrapped ? value.plan : value;
            validatePlan(week, plan);
            const meta = wrapped ? value.metadata : {
                baseVersion: getSavedPlanVersion(plan), revision: `legacy:${JSON.stringify(plan)}`, tickIntents: {},
            };
            if (!validMetadata(meta)) throw new Error('Invalid local plan draft metadata');
            drafts[week] = plan;
            metadata[week] = meta;
        } catch {
            invalid = true;
        }
    }
    return { drafts, metadata, warning: invalid ? 'Some local drafts could not be restored. They were left untouched.' : null };
}

export function readPlanDraftState(userId: string, storage: DraftStorage = window.localStorage): PlanDraftState {
    return decode(readRaw(userId, storage));
}

export function patchPlanDraftWeek(
    userId: string,
    week: string,
    update: (current: LocalPlanDraft | null) => LocalPlanDraft | null,
    storage: DraftStorage = window.localStorage,
): PlanDraftState {
    const raw = readRaw(userId, storage);
    const state = decode(raw);
    if (Object.hasOwn(raw, week) && !state.drafts[week]) throw new Error('Invalid stored week was left untouched');
    const current = state.drafts[week] ? { plan: state.drafts[week], metadata: state.metadata[week] } : null;
    const next = update(current);
    if (next === current) return state;
    if (next) {
        validatePlan(week, next.plan);
        if (!validMetadata(next.metadata)) throw new Error('Invalid local plan draft metadata');
        raw[week] = { schema: 2, plan: next.plan, metadata: next.metadata };
    } else delete raw[week];
    storage.setItem(planDraftStorageKey(userId), JSON.stringify(raw));
    return decode(raw);
}

export function readPlanDrafts(userId: string, storage: DraftStorage = window.localStorage): PlanDrafts {
    const state = readPlanDraftState(userId, storage);
    if (state.warning) throw new Error('Invalid local plan draft');
    return state.drafts;
}

export function writePlanDrafts(userId: string, drafts: PlanDrafts, storage: DraftStorage = window.localStorage) {
    storage.setItem(planDraftStorageKey(userId), JSON.stringify(drafts));
}

function stable(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stable);
    if (!record(value)) return value;
    if (Number.isFinite(value.seconds) && Number.isFinite(value.nanoseconds)) {
        return { seconds: value.seconds, nanoseconds: value.nanoseconds };
    }
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]));
}

export function samePlanStructure(a: MealPlan, b: MealPlan): boolean {
    const shape = (plan: MealPlan) => {
        const result = { ...plan };
        delete result.updatedAt;
        delete result.createdAt;
        delete result.mealStatus;
        result.days = plan.days.map(day => ({ ...day, meals: day.meals.map(meal => {
            const item = { ...meal }; delete item.isEaten; return item;
        }) }));
        return JSON.stringify(stable(result));
    };
    return shape(a) === shape(b);
}

export function applyDraftTicks(plan: MealPlan, ticks: ReadonlyMap<string, boolean>, intents: Record<string, string> = {}): MealPlan {
    let result = plan;
    const ids = new Set(plan.days.flatMap(day => day.meals.map(meal => meal.id)));
    for (const [id, eaten] of ticks) {
        if (ids.has(id) && !Object.hasOwn(intents, id)) result = withMealEaten(result, id, eaten);
    }
    return result;
}

export function matchesOwnSavedTicks(before: MealPlan, saved: MealPlan, ticks: ReadonlyMap<string, boolean>): boolean {
    const expected = { ...applyDraftTicks(before, ticks), mealStatus: { ...before.mealStatus } };
    const ids = new Set([...before.days.flatMap(day => day.meals.map(meal => meal.id)), ...Object.keys(before.mealStatus ?? {})]);
    for (const [id, eaten] of ticks) {
        if (!ids.has(id)) continue;
        const unchangedFalse = !eaten && !Object.hasOwn(saved.mealStatus ?? {}, id)
            && !Object.hasOwn(before.mealStatus ?? {}, id)
            && !before.days.some(day => day.meals.some(meal => meal.id === id && meal.isEaten));
        if (!unchangedFalse) expected.mealStatus[id] = eaten;
    }
    const withoutStamp = (plan: MealPlan) => {
        const value = { ...plan }; delete value.updatedAt; delete value.createdAt;
        return JSON.stringify(stable(value));
    };
    return withoutStamp(expected) === withoutStamp(saved);
}

export function planSaveInput(plan: MealPlan): Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        weekStart: plan.weekStart,
        weekEnd: toLocalDateKey(addDays(parseLocalDateKey(plan.weekStart), 6)),
        goal: plan.goal,
        days: plan.days.map(day => ({
            date: day.date, dayName: day.dayName, totalCalories: day.totalCalories,
            meals: day.meals.map(meal => ({
                id: meal.id, type: meal.type, name: meal.name,
                calories: meal.calories || 0, protein: meal.protein || 0, carbs: meal.carbs || 0, fat: meal.fat || 0,
                isEaten: meal.isEaten || false,
                ...(meal.recipeId && { recipeId: meal.recipeId }), ...(meal.imageUrl && { imageUrl: meal.imageUrl }),
                ...(meal.tag && { tag: meal.tag }),
            })),
        })),
        isAiGenerated: plan.isAiGenerated ?? false,
        ...(plan.dailyTargets && { dailyTargets: {
            calories: plan.dailyTargets.calories || 0, protein: plan.dailyTargets.protein || 0,
            carbs: plan.dailyTargets.carbs || 0, fat: plan.dailyTargets.fat || 0,
        } }),
    };
}
