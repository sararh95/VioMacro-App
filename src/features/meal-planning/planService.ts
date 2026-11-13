import { query, where, getDocs, getDocsFromServer, getDoc, updateDoc, runTransaction, Timestamp, orderBy, limit, FieldPath } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { mealPlanDoc, mealPlansCollection } from '../../services/firebase/paths';
import { assertPlanWithinLimits } from './lib/plan-limits';
import { getSavedPlanVersion, sameSavedPlanVersion, PlanDraftConflictError, type SavePlanOptions } from './plan-drafts';
import {
    assertMealStatusWithinLimits,
    extractMealStatus,
    hydratePlanStatus,
} from './lib/meal-status';

export interface MealPlanMeal {
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'smoothie' | 'tea';
    tag?: string;
    imageUrl?: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    recipeId?: string;
    isEaten?: boolean;
}

export interface MealPlanDay {
    date: string; // ISO date string
    dayName: string;
    totalCalories: number;
    meals: MealPlanMeal[];
}

export interface MealPlan {
    id?: string;
    weekStart: string; // ISO Date YYYY-MM-DD
    weekEnd: string;   // ISO Date YYYY-MM-DD
    goal: string;
    days: MealPlanDay[];
    dailyTargets?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    isAiGenerated?: boolean;
    /**
     * AUD-022: which meals have been eaten, keyed by meal id.
     *
     * This is the stored home of `isEaten`. It is folded back into
     * `days[].meals[].isEaten` by every read in this file, so nothing outside
     * this module has to know it exists. See `src/features/meal-planning/lib/meal-status.ts`.
     */
    mealStatus?: Record<string, boolean>;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

function consumeDevFailure(key: string): boolean {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;

    const storageKey = `viomacro:e2e:fail:${key}`;
    const value = window.sessionStorage.getItem(storageKey);
    if (!value) return false;

    if (value === 'once') {
        window.sessionStorage.removeItem(storageKey);
    }

    return value === 'once' || value === 'always';
}

// Get the active plan for a specific week start date
export async function getMealPlanByDate(
    userId: string,
    weekStart: string,
    options: { confirmEmpty?: boolean } = {},
): Promise<MealPlan | null> {
    const plansRef = mealPlansCollection(db, userId);
    const q = query(plansRef, where('weekStart', '==', weekStart));
    let snapshot = await getDocs(q);
    if (snapshot.empty && options.confirmEmpty) {
        snapshot = await getDocsFromServer(q);
    }

    if (snapshot.empty) return null;

    // Return the first match (should only be one per week)
    const doc = snapshot.docs[0];
    // AUD-022: merge the mealStatus map back into the meals, so callers see one
    // shape whether the plan was saved before or after the restructure.
    return hydratePlanStatus({ id: doc.id, ...doc.data() } as MealPlan);
}

/**
 * AUD-029 / AUD-100: History fetched every plan the user had ever saved and then
 * showed the newest eight. The read charge grew forever while the visible output
 * stayed fixed at eight.
 */
export const MAX_MEAL_PLANS = 50;

export async function getMealPlans(
    userId: string,
    maxPlans: number = MAX_MEAL_PLANS,
): Promise<MealPlan[]> {
    if (consumeDevFailure('getMealPlans')) {
        throw new Error('Injected getMealPlans failure');
    }

    const plansRef = mealPlansCollection(db, userId);
    const q = query(plansRef, orderBy('weekStart', 'desc'), limit(maxPlans));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => hydratePlanStatus({ id: doc.id, ...doc.data() } as MealPlan));
}

/**
 * AUD-020: this used to read "does a plan exist for this week?" and then write,
 * with nothing in between. Two overlapping saves both saw "no" and both created
 * one, leaving two documents for the same week -- and getMealPlanByDate returned
 * whichever came back first, so a user's edits appeared to vanish and return.
 *
 * A Firestore transaction cannot run a query, only get() by document id. So the
 * week lookup stays outside, and the transaction targets a concrete id:
 *   - an existing plan (including older ones with a random id) keeps its id
 *   - a brand-new week uses the weekStart as its id, so two racing saves both
 *     target the same document and the transaction resolves them into one
 */
export async function saveMealPlan(userId: string, plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>, options: SavePlanOptions = {}): Promise<string> {
    if (consumeDevFailure('saveMealPlan')) {
        throw new Error('Injected saveMealPlan failure');
    }

    // AUD-005: the rules cannot iterate `days`, so the per-day meal cap is
    // enforced here, on the way in, where the shape is actually visible.
    assertPlanWithinLimits(plan);

    // AUD-022: move the ticks out of the meals and into a flat map. Callers hand
    // us plans in the hydrated shape, so this is where the two shapes part ways
    // again. Storing both would let them disagree.
    const { plan: storedPlan, mealStatus } = extractMealStatus(plan);
    assertMealStatusWithinLimits(mealStatus);
    const payload = { ...storedPlan, mealStatus };

    const existing = await getMealPlanByDate(userId, plan.weekStart);
    const planId = existing?.id ?? plan.weekStart;
    const planRef = mealPlanDoc(db, userId, planId);

    const committedVersion = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(planRef);
        const savedVersion = getSavedPlanVersion(snapshot.exists() ? { ...snapshot.data(), id: planId } as MealPlan : null);
        if (Object.hasOwn(options, 'expectedVersion') && !sameSavedPlanVersion(options.expectedVersion ?? null, savedVersion)) {
            throw new PlanDraftConflictError(savedVersion);
        }
        const createdAt = snapshot.exists() ? null : Timestamp.now();
        const updatedAt = Timestamp.now();
        if (snapshot.exists()) {
            transaction.update(planRef, { ...payload, updatedAt });
        } else {
            transaction.set(planRef, {
                ...payload,
                createdAt: createdAt!,
                updatedAt,
            });
        }
        return { id: planId, seconds: updatedAt.seconds, nanoseconds: updatedAt.nanoseconds };
    });
    options.onCommitted?.(committedVersion);

    return planId;
}

export async function updateMealPlan(userId: string, planId: string, updates: Partial<MealPlan>): Promise<void> {
    const planRef = mealPlanDoc(db, userId, planId);
    await updateDoc(planRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
}

/**
 * Tick or untick one meal. One field write, no read.
 *
 * AUD-022: this used to be a read-modify-write of the entire plan document --
 * fetch all seven days, edit a copy, write all seven days back -- to change one
 * boolean. The cost grew with the size of the plan, not with the size of the
 * change, and a full week of ticking cost about 21 reads and 21 full writes.
 *
 * `isEaten` now lives in a flat `mealStatus` map, and Firestore can address one
 * key of a map directly. So the transaction is gone, the read is gone, and what
 * goes over the wire is one boolean.
 *
 * AUD-021 is closed by construction rather than by locking. Two quick ticks used
 * to race because both wrote the whole `days` array from their own snapshot, so
 * the second erased the first. Two ticks on different meals now write different
 * fields and cannot collide at all; two ticks on the SAME meal settle
 * last-write-wins, which is the correct answer for a toggle.
 *
 * AUD-023 still holds: a write to a plan that no longer exists fails with
 * `not-found`, which throws here and lets the store's catch refresh the screen.
 * Losing the old explicit `dayIndex` / `mealId` checks costs nothing -- a status
 * written for a meal that is not in the plan is simply never read back.
 *
 * `FieldPath` is used rather than the string `mealStatus.<id>` because a dotted
 * string would be parsed as a path. Meal ids are UUIDs today, but a single dot
 * in one id would silently write a nested map instead of the key.
 */
export async function toggleMealStatus(userId: string, planId: string, mealId: string, isEaten: boolean): Promise<void> {
    const planRef = mealPlanDoc(db, userId, planId);

    await updateDoc(
        planRef,
        new FieldPath('mealStatus', mealId),
        isEaten,
        'updatedAt',
        Timestamp.now(),
    );
}

export async function getMealPlan(userId: string, planId: string): Promise<MealPlan | null> {
    const planRef = mealPlanDoc(db, userId, planId);
    const snapshot = await getDoc(planRef);
    if (!snapshot.exists()) return null;
    return hydratePlanStatus({ id: snapshot.id, ...snapshot.data() } as MealPlan);
}
