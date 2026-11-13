import type { MealPlan } from './planService';

export type PlanDrafts = Record<string, MealPlan>;
export type PlanDraftOptions = {
    weekStart?: string;
    transient?: boolean;
    expectedPlan?: MealPlan;
};

const storageKey = (userId: string) => `viomacro:plan-drafts:${userId}`;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readPlanDrafts(userId: string, storage: DraftStorage = window.localStorage): PlanDrafts {
    const raw = storage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid local plan drafts');
    for (const [week, value] of Object.entries(parsed)) {
        const plan = value as Partial<MealPlan> | null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !plan || plan.weekStart !== week
            || typeof plan.weekEnd !== 'string' || typeof plan.goal !== 'string' || !Array.isArray(plan.days)
            || !plan.days.every(day => day && typeof day.date === 'string' && typeof day.dayName === 'string'
                && Number.isFinite(day.totalCalories) && Array.isArray(day.meals)
                && day.meals.every(meal => meal && typeof meal.id === 'string' && typeof meal.name === 'string'
                    && ['breakfast', 'lunch', 'dinner', 'snack', 'smoothie', 'tea'].includes(meal.type)
                    && [meal.calories, meal.protein, meal.carbs, meal.fat].every(Number.isFinite)))) {
            throw new Error('Invalid local plan draft');
        }
    }
    return parsed as PlanDrafts;
}

export function writePlanDrafts(userId: string, drafts: PlanDrafts, storage: DraftStorage = window.localStorage) {
    storage.setItem(storageKey(userId), JSON.stringify(drafts));
}
