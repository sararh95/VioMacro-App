import { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { auth } from '../../services/firebase/firebase';
import { useAuth } from './auth-context';
import * as userService from '../../services/userService';
import * as planService from '../../features/meal-planning/planService';
import * as shoppingService from '../../features/groceries/shoppingService';
import type { UserSettings } from '../../services/userService';
import type { MealPlan } from '../../features/meal-planning/planService';
import type { GroceryItem } from '../../features/groceries/shoppingService';
import { getWeekStartKey, toLocalDateKey } from '../../shared/date-utils';
import { trackSave } from '../../shared/pending-saves';
import { settleMealTick, startMealTick, withMealEaten, type PendingMealTicks } from '../../features/meal-planning/lib/meal-status';

// --- State Definition ---
interface AppState {
    userSettings: UserSettings | null;
    activePlan: MealPlan | null;
    groceryItems: GroceryItem[];
    loading: {
        initial: boolean;
        plan: boolean;
        grocery: boolean;
    };
    error: string | null;
    selectedDay: string | null; // ISO Date YYYY-MM-DD
    draftPlan: MealPlan | null; // For persisting unsaved work
}

const initialState: AppState = {
    userSettings: null,
    activePlan: null,
    groceryItems: [],
    loading: {
        initial: true,
        plan: false,
        grocery: false,
    },
    error: null,
    selectedDay: toLocalDateKey(new Date()),
    draftPlan: null,
};

const INITIAL_DATA_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
            reject(new Error(`${label} timed out. Please check the local services and try again.`));
        }, INITIAL_DATA_TIMEOUT_MS);

        promise
            .then((value) => {
                window.clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                window.clearTimeout(timer);
                reject(error);
            });
    });
}

// --- Actions ---
type Action =
    | { type: 'SET_INITIAL_LOADING'; payload: boolean }
    | { type: 'SET_USER_SETTINGS'; payload: UserSettings }
    | { type: 'MERGE_USER_SETTINGS'; payload: Partial<UserSettings> }
    | { type: 'SET_ACTIVE_PLAN'; payload: MealPlan | null }
    | { type: 'SET_GROCERY_ITEMS'; payload: GroceryItem[] }
    | { type: 'SET_SELECTED_DAY'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'UPDATE_PLAN_OPTIMISTIC'; payload: MealPlan }
    // G-B: one meal, in both the saved plan and the planner's draft. The tick
    // and its undo both go through here, so an undo cannot erase a newer tick.
    | { type: 'SET_MEAL_EATEN'; payload: { planId: string; mealId: string; isEaten: boolean } }
    | { type: 'UPDATE_GROCERY_OPTIMISTIC'; payload: GroceryItem[] }
    // AUD-018: the caller used to compute the next list from a closed-over
    // snapshot. Two quick taps both read the same stale array and the second
    // overwrote the first. The reducer always sees current state.
    | { type: 'TOGGLE_GROCERY_OPTIMISTIC'; payload: { itemId: string; isChecked: boolean } }
    | { type: 'REMOVE_GROCERY_OPTIMISTIC'; payload: { itemId: string } }
    | { type: 'SET_LOADING_PLAN'; payload: boolean }
    | { type: 'SET_LOADING_GROCERY'; payload: boolean }
    | { type: 'SET_DRAFT_PLAN'; payload: MealPlan | null }
    // AUD-015: signing out must empty the store, not merely stop loading.
    | { type: 'RESET_FOR_NEW_USER' };

// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'RESET_FOR_NEW_USER':
            // Everything except selectedDay, which is a calendar position rather
            // than account data.
            return { ...initialState, selectedDay: state.selectedDay };
        case 'SET_INITIAL_LOADING':
            return { ...state, loading: { ...state.loading, initial: action.payload } };
        case 'SET_USER_SETTINGS':
            return { ...state, userSettings: action.payload };
        case 'MERGE_USER_SETTINGS':
            return { ...state, userSettings: { ...state.userSettings, ...action.payload } };
        case 'SET_ACTIVE_PLAN':
            return { ...state, activePlan: action.payload };
        case 'SET_GROCERY_ITEMS':
            return { ...state, groceryItems: action.payload };
        case 'SET_SELECTED_DAY':
            return { ...state, selectedDay: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'UPDATE_PLAN_OPTIMISTIC':
            return { ...state, activePlan: action.payload };
        case 'SET_MEAL_EATEN': {
            const { planId, mealId, isEaten } = action.payload;
            const update = (plan: MealPlan | null) =>
                plan?.id === planId ? withMealEaten(plan, mealId, isEaten) : plan;
            return { ...state, activePlan: update(state.activePlan), draftPlan: update(state.draftPlan) };
        }
        case 'TOGGLE_GROCERY_OPTIMISTIC':
            return {
                ...state,
                groceryItems: state.groceryItems.map((item) =>
                    item.id === action.payload.itemId
                        ? { ...item, isChecked: action.payload.isChecked }
                        : item
                ),
            };
        case 'REMOVE_GROCERY_OPTIMISTIC':
            return {
                ...state,
                groceryItems: state.groceryItems.filter((item) => item.id !== action.payload.itemId),
            };
        case 'UPDATE_GROCERY_OPTIMISTIC':
            return { ...state, groceryItems: action.payload };
        case 'SET_LOADING_PLAN':
            return { ...state, loading: { ...state.loading, plan: action.payload } };
        case 'SET_LOADING_GROCERY':
            return { ...state, loading: { ...state.loading, grocery: action.payload } };
        case 'SET_DRAFT_PLAN':
            return { ...state, draftPlan: action.payload };
        default:
            return state;
    }
}

// --- Context ---
interface AppContextType extends AppState {
    refreshPlan: () => Promise<void>;
    refreshGrocery: () => Promise<void>;
    updatePlan: (updates: Partial<MealPlan>) => Promise<void>;
    /** Resolves false when the server refused the tick and it has been undone. */
    toggleMealCompletion: (planId: string, mealId: string, isEaten: boolean) => Promise<boolean>;
    toggleGroceryCheck: (itemId: string, isChecked: boolean) => Promise<boolean>;
    addGroceryItem: (item: Omit<GroceryItem, 'id'>) => Promise<boolean>;
    deleteGroceryItem: (itemId: string) => Promise<boolean>;
    setSelectedDay: (date: string) => void;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
    saveCheckIn: (data: userService.WeightCheckIn) => Promise<void>;
    retrySavedData: () => void;
    setDraftPlan: (plan: MealPlan | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export function AppProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const sessionRef = useRef(user);
    sessionRef.current = user;
    const retrySavedData = useCallback(() => setLoadAttempt(attempt => attempt + 1), []);

    useEffect(() => {
        dispatch({ type: 'RESET_FOR_NEW_USER' });
    }, [user]);

    /**
     * AUD-014: the single biggest performance defect in the audit.
     *
     * Every action below used to list a slice of `state` in its dependency
     * array, so their identities changed whenever that slice changed. The
     * context value was an inline object literal rebuilt on every render, and
     * `updateSettings` was declared inside it and never memoised at all.
     *
     * The result: ticking one meal checkbox re-rendered EVERY component
     * subscribed to useAppStore(), including MealPlanner at ~1,690 lines, and --
     * because of AUD-111 -- tore down and rebuilt the whole sidebar with it.
     *
     * The callbacks below only ever READ state; they never need a fresh closure
     * over it. Reading through a ref lets every one of them depend on `user`
     * alone, so their identities are stable for the life of the session and the
     * memoised value below actually holds.
     *
     * The ref is assigned during render on purpose. An effect would update it a
     * tick late, and a callback fired in that window would read stale state --
     * which is the bug this is meant to remove, not add.
     */
    const stateRef = useRef(state);
    stateRef.current = state;
    // G-B: meal taps the server has not answered yet. See toggleMealCompletion.
    const mealTapRef = useRef(0);
    const pendingMealTicksRef = useRef<PendingMealTicks>(new Map());

    // Initial Data Load
    /**
     * AUD-015: this effect had no cleanup and no cancellation.
     *
     * The three reads are fired with Promise.allSettled and then dispatched. If
     * `user` changed while they were in flight -- sign out, sign in as someone
     * else -- the stale replies still landed, writing the previous account's
     * settings, plan and grocery list into the new account's state.
     *
     * Reproduced 3/3 with a 5s delay on the settings read: user B's dashboard
     * showed user A's calorie target. It is not merely theoretical, and it is a
     * cross-account leak rather than a cosmetic glitch.
     *
     * Two things are needed, and neither is sufficient alone:
     *   1. a cancellation flag checked before EVERY dispatch, so a late reply
     *      from the previous user is dropped;
     *   2. a state reset when the user changes, so the new user does not see the
     *      previous one's data during the gap before their own arrives.
     */
    useEffect(() => {
        let cancelled = false;

        if (!user) {
            dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
            return;
        }

        const loadData = async () => {
            try {
                dispatch({ type: 'SET_INITIAL_LOADING', payload: true });

                const weekStart = getWeekStartKey();

                // Parallelize requests
                const [settingsResult, planResult, groceryResult] = await Promise.allSettled([
                    withTimeout(userService.getUserSettings(user.uid), 'Settings load'),
                    withTimeout(planService.getMealPlanByDate(user.uid, weekStart), 'Meal plan load'),
                    withTimeout(shoppingService.getGroceryList(user.uid), 'Grocery list load')
                ]);

                // Everything below writes into state, so nothing below may run
                // for a user who is no longer signed in.
                if (cancelled) return;

                // 1. User Settings
                if (settingsResult.status === 'fulfilled' && settingsResult.value) {
                    dispatch({ type: 'SET_USER_SETTINGS', payload: settingsResult.value });
                } else if (settingsResult.status === 'fulfilled') {
                    dispatch({ type: 'SET_USER_SETTINGS', payload: userService.createDefaultUserSettings() });
                } else if (settingsResult.status === 'rejected') {
                    console.error("Failed to load settings", settingsResult.reason);
                }

                // 2. Active Plan
                if (planResult.status === 'fulfilled') {
                    dispatch({ type: 'SET_ACTIVE_PLAN', payload: planResult.value });
                } else {
                    console.error("Failed to load plan", planResult.reason);
                }

                // 3. Grocery List
                if (groceryResult.status === 'fulfilled') {
                    dispatch({ type: 'SET_GROCERY_ITEMS', payload: groceryResult.value });
                } else {
                    console.error("Failed to load grocery list", groceryResult.reason);
                }

                if (settingsResult.status === 'rejected' ||
                    planResult.status === 'rejected' ||
                    groceryResult.status === 'rejected') {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: "Some saved data did not load. You can keep using the app and retry from the affected page."
                    });
                } else {
                    dispatch({ type: 'SET_ERROR', payload: null });
                }

            } catch (err) {
                if (cancelled) return;
                console.error("Failed to load initial data", err);
                dispatch({ type: 'SET_ERROR', payload: "Failed to load application data." });
            } finally {
                if (!cancelled) {
                    dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [user, loadAttempt]);

    // Actions
    // AUD-017: this refused to run without an existing plan and refetched by
    // activePlan.id, so it could only ever refresh a plan it already had. Every
    // rollback path in this store calls refreshPlan() on failure -- so when
    // there was no activePlan, every one of those rollbacks was a no-op.
    const refreshPlan = useCallback(async () => {
        if (!user) return;
        dispatch({ type: 'SET_LOADING_PLAN', payload: true });
        try {
            const activePlan = stateRef.current.activePlan;
            const plan = activePlan?.id
                ? await planService.getMealPlan(user.uid, activePlan.id)
                : await planService.getMealPlanByDate(user.uid, getWeekStartKey());
            dispatch({ type: 'SET_ACTIVE_PLAN', payload: plan });
        } catch (err) {
            console.error(err);
        } finally {
            dispatch({ type: 'SET_LOADING_PLAN', payload: false });
        }
    }, [user]);

    const refreshGrocery = useCallback(async () => {
        if (!user) return;
        dispatch({ type: 'SET_LOADING_GROCERY', payload: true });
        try {
            const list = await shoppingService.getGroceryList(user.uid);
            dispatch({ type: 'SET_GROCERY_ITEMS', payload: list });
        } catch (err) {
            console.error(err);
        } finally {
            dispatch({ type: 'SET_LOADING_GROCERY', payload: false });
        }
    }, [user]);

    const updatePlan = useCallback(async (updates: Partial<MealPlan>) => {
        const activePlan = stateRef.current.activePlan;
        if (!user || !activePlan?.id) return;

        // Optimistic update (shallow merge for responsiveness)
        const updatedPlan = { ...activePlan, ...updates } as MealPlan;
        dispatch({ type: 'UPDATE_PLAN_OPTIMISTIC', payload: updatedPlan });

        try {
            await trackSave(planService.updateMealPlan(user.uid, activePlan.id, updates));
        } catch (err) {
            console.error("Failed to update plan", err);
            // Revert or fetch fresh on error
            refreshPlan();
        }
    }, [user, refreshPlan]);

    const toggleMealCompletion = useCallback(async (planId: string, mealId: string, isEaten: boolean) => {
        if (!user || !planId) return false;

        /**
         * AUD-132: the write follows the plan on screen, not the store's
         * activePlan.
         *
         * activePlan is always the CURRENT week -- the initial load asks for
         * getWeekStartKey() -- and the planner only called this when the two
         * matched. A tick on last week or next week therefore changed the
         * screen and was never sent. Ticking also does not mark the planner
         * dirty, so Confirm Plan stayed disabled and there was no way to save
         * it by hand either: the tick simply vanished on reload.
         *
         * AUD-016: the meal is found by id, so there is no day index left to go
         * out of range.
         */
        dispatch({ type: 'SET_MEAL_EATEN', payload: { planId, mealId, isEaten } });

        /**
         * G-B: a refused tick used to stay on screen. The catch only refreshed
         * activePlan, and the planner shows its draft first, so the tick stayed
         * with no message -- and the next Confirm Plan saved it. Undo only this
         * meal, in the draft too, unless a newer tap on it is still waiting.
         *
         * Offline is not a refusal: the write waits in the queue and this await
         * simply has not finished, so nothing is undone.
         */
        const key = `${planId}/${mealId}`;
        const tap = ++mealTapRef.current;
        startMealTick(pendingMealTicksRef.current, key, tap, !isEaten);
        try {
            // AUD-022: one key of the mealStatus map, no day index needed.
            await trackSave(planService.toggleMealStatus(user.uid, planId, mealId, isEaten));
            settleMealTick(pendingMealTicksRef.current, key, tap, true, isEaten);
            return true;
        } catch (err) {
            console.error(err);
            const saved = settleMealTick(pendingMealTicksRef.current, key, tap, false, isEaten);
            if (saved === null) return true;
            // AUD-015: never write a late answer into the next account's state.
            if (sessionRef.current === user) {
                dispatch({ type: 'SET_MEAL_EATEN', payload: { planId, mealId, isEaten: saved } });
            }
            return false;
        }
    }, [user]);

    const toggleGroceryCheck = useCallback(async (itemId: string, isChecked: boolean) => {
        if (!user) return false;

        // AUD-018: the reducer computes this, so two quick taps cannot both read
        // the same stale list and have the second overwrite the first.
        dispatch({ type: 'TOGGLE_GROCERY_OPTIMISTIC', payload: { itemId, isChecked } });

        try {
            await trackSave(shoppingService.toggleGroceryItem(user.uid, itemId, isChecked));
            return true;
        } catch (err) {
            console.error(err);
            await refreshGrocery();
            return false;
        }
    }, [user, refreshGrocery]);

    const addGroceryItem = useCallback(async (item: Omit<GroceryItem, 'id'>) => {
        if (!user) return false;

        try {
            await trackSave(shoppingService.addGroceryItem(user.uid, item));
            await refreshGrocery();
            return true;
        } catch (err) {
            console.error(err);
            await refreshGrocery(); // Revert
            return false;
        }
    }, [user, refreshGrocery]);

    const deleteGroceryItem = useCallback(async (itemId: string) => {
        if (!user) return false;
        // AUD-018: as above.
        dispatch({ type: 'REMOVE_GROCERY_OPTIMISTIC', payload: { itemId } });

        try {
            await trackSave(shoppingService.deleteGroceryItem(user.uid, itemId));
            return true;
        } catch (err) {
            console.error(err);
            await refreshGrocery();
            return false;
        }
    }, [user, refreshGrocery]);

    const setSelectedDay = useCallback((date: string) => {
        dispatch({ type: 'SET_SELECTED_DAY', payload: date });
    }, []);

    const setDraftPlan = useCallback((plan: MealPlan | null) => {
        dispatch({ type: 'SET_DRAFT_PLAN', payload: plan });
    }, []);

    const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
        const assertSession = () => {
            if (!user || sessionRef.current !== user || auth.currentUser !== user) {
                throw new Error('Your sign-in changed. Please retry from your current account.');
            }
        };
        assertSession();
        await userService.updateUserSettings(user!.uid, settings);
        assertSession();
        // Publishing completion early unmounts onboarding and destroys its
        // draft on rejection. Merge only the committed fields into current state.
        dispatch({ type: 'MERGE_USER_SETTINGS', payload: settings });
    }, [user]);

    const saveCheckIn = useCallback(async (data: userService.WeightCheckIn) => {
        if (!user || sessionRef.current !== user || auth.currentUser !== user) {
            throw new Error('Your sign-in changed. Please retry from your current account.');
        }
        await userService.saveWeightCheckIn(user.uid, data);
        if (sessionRef.current !== user || auth.currentUser !== user) {
            throw new Error('Your sign-in changed. Please retry from your current account.');
        }
        dispatch({ type: 'MERGE_USER_SETTINGS', payload: { currentWeight: data.weight } });
    }, [user]);

    // AUD-014: every action above now has a stable identity, so this value only
    // changes when the state it exposes actually changes.
    const value = useMemo(() => ({
        ...state,
        refreshPlan,
        refreshGrocery,
        updatePlan,
        toggleMealCompletion,
        toggleGroceryCheck,
        addGroceryItem,
        deleteGroceryItem,
        setSelectedDay,
        setDraftPlan,
        updateSettings,
        saveCheckIn,
        retrySavedData,
    }), [
        state,
        refreshPlan,
        refreshGrocery,
        updatePlan,
        toggleMealCompletion,
        toggleGroceryCheck,
        addGroceryItem,
        deleteGroceryItem,
        setSelectedDay,
        setDraftPlan,
        updateSettings,
        saveCheckIn,
        retrySavedData,
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppStore() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
}
