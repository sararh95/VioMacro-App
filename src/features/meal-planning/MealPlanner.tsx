import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../app/providers/auth-context';
import { useAppStore } from '../../app/providers/store';
import { getRecipes, getRecipe, type Recipe } from '../recipes/recipeService';
import { createEmptyPlan } from './lib/plan-generator';
import {
    MEAL_PLANNER_VIEW_DATE_KEY, encodePlannerWeekChoice, isPlannerWeekOutdated, renewPlannerWeekChoice,
    resolvePlannerWeek, stepPlannerWeek,
} from './lib/planner-week';
import { generateAiMealPlan } from '../../services/aiService';
import { generateGroceryList } from '../groceries/shopping-generator';
import RecipeDetail from '../recipes/components/RecipeDetail';
import RecipePicker from '../recipes/components/RecipePicker';
import GuidedCooking from '../recipes/components/GuidedCooking';
import { PlanGenerationWizard } from './components/PlanGenerationWizard';
import { PlanSettingsModal } from './components/PlanSettingsModal';
import { PlanPromptModal } from './components/PlanPromptModal';
import { GapSolverModal } from './components/GapSolverModal';
import { getMealPlanByDate, type MealPlan, type MealPlanMeal } from './planService';
import { PlanDraftConflictError, type PlanDraftOptions, type SavedPlanVersion } from './plan-drafts';
import { addDays, formatDateKey, getStartOfWeek, getWeekStartKey, toLocalDateKey } from '../../shared/date-utils';
import { recipeInitial, recipeTint } from '../../shared/visuals';
import RecipeImage from '../../shared/recipe-image';

type MacroTotals = { calories: number; protein: number; carbs: number; fat: number };
type BatchMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type WizardSettings = {
    batchLunch: boolean;
    batchMealType?: string;
    includeSmoothie: boolean;
    includeTea: boolean;
    includeSnacks: boolean;
};
type PlannerNotice = {
    tone: 'success' | 'error' | 'info';
    message: string;
} | null;
type AiMeal = Omit<MealPlanMeal, 'id' | 'isEaten' | 'recipeId'> & { recipeId: string | null };
type AiDay = Omit<MealPlan['days'][number], 'date' | 'totalCalories'> & {
    meals: AiMeal[];
    totalCalories?: number;
};
type AiPlan = Omit<MealPlan, 'id' | 'weekStart' | 'weekEnd' | 'days'> & {
    days: AiDay[];
};

function getInitialPlannerViewDate() {
    return resolvePlannerWeek(window.sessionStorage.getItem(MEAL_PLANNER_VIEW_DATE_KEY));
}

function toRecipeMealType(type: MealPlanMeal['type']): Recipe['mealType'] {
    return type === 'smoothie' ? 'smoothie' : type === 'tea' ? 'snack' : type;
}

function isBatchMealType(value: string): value is BatchMealType {
    return ['breakfast', 'lunch', 'dinner', 'snack'].includes(value);
}

function getPlanMacroTotals(plan: MealPlan | null) {
    const days = plan?.days.filter(day => day.meals.length > 0) ?? [];
    const totals = days.flatMap(day => day.meals).reduce((sum, meal) => ({
        calories: sum.calories + meal.calories,
        protein: sum.protein + meal.protein,
        carbs: sum.carbs + meal.carbs,
        fat: sum.fat + meal.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const count = days.length || 1;
    return {
        calories: totals.calories / count,
        protein: totals.protein / count,
        carbs: totals.carbs / count,
        fat: totals.fat / count,
        dayCount: days.length,
    };
}

/**
 * R9: the touch or click that wakes a stale Planner was aimed at the old week.
 * A touch screen aims the click when the finger lifts. By then the screen has
 * started again, and a week that is drawn at once (an unsaved draft) already
 * has its buttons under the finger, so the click would tick a meal the user
 * never chose. A click into a window that was in the background does the
 * same: the window gets focus first, which restarts the screen, and the
 * pointer arrives a few milliseconds after. The click of that one gesture is
 * dropped. A quarter of a second covers that gap, and nobody can see the new
 * week and aim a touch at it that fast.
 *
 * Only a click that lands inside the Planner is dropped. The menu and the top
 * bar did not change under the pointer, so a click there is what the user
 * meant. A key press arms no guard: a key is not aimed at a place on screen.
 *
 * The guard ends with the gesture, so it cannot cost the user a later click:
 * it ends when its click is dropped, shortly after the pointer lifts with no
 * click (a scroll, a long press), on a new touch, on any key, and at once
 * when the Planner woke without a pointer and none follows.
 */
const WAKING_POINTER_FOLLOWS_MS = 250;
const CLICK_FOLLOWS_LIFT_MS = 300;

function dropClickOfWakingGesture(wokenBy: Event, planner: () => HTMLElement | null) {
    let pointerIsDown = wokenBy.type === 'pointerdown';
    let timer = 0;
    const end = () => {
        window.clearTimeout(timer);
        document.removeEventListener('click', drop, true);
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('pointerup', onLift, true);
        document.removeEventListener('pointercancel', onLift, true);
        document.removeEventListener('keydown', end, true);
    };
    const drop = (event: Event) => {
        if (event.target instanceof Node && planner()?.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
        }
        end();
    };
    const onPointerDown = (event: Event) => {
        if (!pointerIsDown && event.timeStamp - wokenBy.timeStamp < WAKING_POINTER_FOLLOWS_MS) {
            pointerIsDown = true;
            window.clearTimeout(timer);
        } else {
            end();
        }
    };
    const onLift = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(end, CLICK_FOLLOWS_LIFT_MS);
    };
    document.addEventListener('click', drop, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onLift, true);
    document.addEventListener('pointercancel', onLift, true);
    document.addEventListener('keydown', end, true);
    if (!pointerIsDown) timer = window.setTimeout(end, WAKING_POINTER_FOLLOWS_MS);
}

/**
 * R9: a Planner that stays open must not keep showing an old week.
 *
 * The week on screen lives in React state, so a page left open (a laptop that
 * slept, a phone tab that stayed in memory) showed the same week for days.
 * Each time the user is back at the Planner (the page shows again, gets focus,
 * or is touched or typed in), the stored choice is checked with the same rule
 * a fresh visit uses. While it is fresh, its age is reset: the memory runs
 * from when the Planner was last used. Once it is stale and is not this week,
 * the screen starts again on this week. A new key remounts it, so a dialog
 * left open on the old week closes too. The old screen is gone before the
 * click of the gesture that woke it arrives, and that click is dropped, so
 * the gesture cannot tick a meal in either week. Unsaved drafts live in the
 * store and are kept.
 */
export default function MealPlanner() {
    const [visit, setVisit] = useState(0);
    const plannerRef = useRef<HTMLDivElement>(null);
    // Not read: a new value re-renders the header, so "This week" appears when
    // the week changes under a choice that is still fresh.
    const [, setCurrentWeek] = useState(() => getWeekStartKey());

    useEffect(() => {
        const check = (event: Event) => {
            if (document.visibilityState !== 'visible') return;
            const saved = window.sessionStorage.getItem(MEAL_PLANNER_VIEW_DATE_KEY);
            const now = new Date();
            const renewed = renewPlannerWeekChoice(saved, now);
            if (renewed) {
                window.sessionStorage.setItem(MEAL_PLANNER_VIEW_DATE_KEY, renewed);
            } else if (isPlannerWeekOutdated(saved, now)) {
                // Stored first, so a second event in the same burst finds this
                // week already stored and the screen restarts once.
                window.sessionStorage.setItem(MEAL_PLANNER_VIEW_DATE_KEY, encodePlannerWeekChoice(now, now));
                if (event.type !== 'keydown') dropClickOfWakingGesture(event, () => plannerRef.current);
                setVisit(count => count + 1);
            }
            setCurrentWeek(getWeekStartKey(now));
        };
        document.addEventListener('visibilitychange', check);
        window.addEventListener('pageshow', check);
        window.addEventListener('focus', check);
        document.addEventListener('pointerdown', check, true);
        document.addEventListener('keydown', check, true);
        return () => {
            document.removeEventListener('visibilitychange', check);
            window.removeEventListener('pageshow', check);
            window.removeEventListener('focus', check);
            document.removeEventListener('pointerdown', check, true);
            document.removeEventListener('keydown', check, true);
        };
    }, []);

    // `contents`: the wrapper marks what belongs to the Planner and adds no box of its own.
    return <div ref={plannerRef} className="contents"><MealPlannerScreen key={visit} /></div>;
}

function MealPlannerScreen() {
    const { user } = useAuth();
    const {
        userSettings,
        draftPlan,
        planDrafts,
        draftMetadata,
        draftStorageError,
        confirmingPlanWeeks,
        planSaveRevision,
        setDraftPlan: setStoredDraftPlan,
        confirmPlan,
        activePlan: contextActivePlan,
        toggleMealCompletion,
        refreshPlan,
        refreshGrocery
    } = useAppStore();

    // Navigation & View State
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [viewDate, setViewDate] = useState(getInitialPlannerViewDate);
    const [fetchedPlan, setFetchedPlan] = useState<MealPlan | null>(null);
    // AUD-050: identifies the most recent plan request; older replies are dropped.
    const planRequestRef = useRef(0);

    // Weekend/Late Week Prompts
    const [showWeekendPrompt, setShowWeekendPrompt] = useState(false);

    // Use draft if available (persistence), otherwise fallback to fetchedPlan, then contextActivePlan
    // If neither, we show the "Generate" placeholder
    const displayPlan = useMemo(() => {
        const targetWeekStart = getWeekStartKey(viewDate);

        // 1. Check Draft
        if (planDrafts[targetWeekStart]) return planDrafts[targetWeekStart];
        if (draftPlan && draftPlan.weekStart === targetWeekStart) return draftPlan;

        // 2. Check Fetched
        if (fetchedPlan && fetchedPlan.weekStart === targetWeekStart) return fetchedPlan;

        // 3. Check Context Active
        if (contextActivePlan && contextActivePlan.weekStart === targetWeekStart) return contextActivePlan;

        return null;
    }, [planDrafts, draftPlan, fetchedPlan, contextActivePlan, viewDate]);

    const setDraftPlan = useCallback((plan: MealPlan | null, options: PlanDraftOptions = {}) => {
        const week = options.weekStart ?? plan?.weekStart;
        const basePlan = fetchedPlan?.weekStart === week ? fetchedPlan
            : contextActivePlan?.weekStart === week ? contextActivePlan : null;
        setStoredDraftPlan(plan, { ...options, basePlan, sourceMetadata: week ? draftMetadata[week] : undefined });
    }, [setStoredDraftPlan, fetchedPlan, contextActivePlan, draftMetadata]);
    const displayPlanRef = useRef(displayPlan);
    const viewWeekRef = useRef(getWeekStartKey(viewDate));
    const cloneRequestRef = useRef(0);
    displayPlanRef.current = displayPlan;
    viewWeekRef.current = getWeekStartKey(viewDate);
    useEffect(() => () => { cloneRequestRef.current += 1; }, []);

    // Prompt State
    const [promptModalOpen, setPromptModalOpen] = useState(false);
    const [dismissedPromptWeek, setDismissedPromptWeek] = useState<string | null>(null);
    /**
     * AUD-130: which week the plan fetch has actually finished checking.
     *
     * The auto-prompt used to fire on a 500 ms wall-clock timer "to avoid prompt
     * flashing while fetching" -- a guess at how long a network read takes. On a
     * slow connection it fires before the answer arrives; on a fast one it waits
     * for nothing. Firing on the answer instead is both correct and instant.
     */
    const [checkedWeek, setCheckedWeek] = useState<string | null>(null);
    const [failedWeek, setFailedWeek] = useState<string | null>(null);
    const [weekLoadAttempt, setWeekLoadAttempt] = useState(0);


    const saving = !!confirmingPlanWeeks[getWeekStartKey(viewDate)];
    const [conflict, setConflict] = useState<{ week: string; version: SavedPlanVersion | null } | null>(null);
    const [addingToList, setAddingToList] = useState(false);
    const [saved, setSaved] = useState(false);
    const isDirty = !!planDrafts[getWeekStartKey(viewDate)];
    const [plannerNotice, setPlannerNotice] = useState<PlannerNotice>(null);

    // Batch State
    const [batchMealType, setBatchMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
    const [batchTypeModalOpen, setBatchTypeModalOpen] = useState(false);

    // Detail view state
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [showGuidedCooking, setShowGuidedCooking] = useState(false);
    const [cookingServings, setCookingServings] = useState<number | undefined>();
    const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);

    // Manual Planning State
    const [pickerOpen, setPickerOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [batchPickerOpen, setBatchPickerOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<{ dayIndex: number, type: MealPlanMeal['type'], mealId?: string } | null>(null);
    const [gapSolverOpen, setGapSolverOpen] = useState(false);
    const [gapSolverData, setGapSolverData] = useState<{ dayIndex: number, dayName: string, current: MacroTotals } | null>(null);
    const [batchCookLunch, setBatchCookLunch] = useState(false);
    const [includeSmoothie, setIncludeSmoothie] = useState(false);
    const [includeTea, setIncludeTea] = useState(false);

    const handleClosePromptModal = () => {
        setDismissedPromptWeek(getWeekStartKey(viewDate));
        setPromptModalOpen(false);
    };

    useEffect(() => {
        window.sessionStorage.setItem(MEAL_PLANNER_VIEW_DATE_KEY, encodePlannerWeekChoice(viewDate));
    }, [viewDate]);

    // Clone Last Week Function
    const handleCloneLastWeek = async () => {
        if (!user) return;
        const request = ++cloneRequestRef.current;
        const startingPlan = displayPlan;
        const startingWeek = getWeekStartKey(viewDate);
        setPlannerNotice(null);
        try {
            const targetStartDate = getStartOfWeek(viewDate);
            const previousWeekStart = addDays(targetStartDate, -7);
            const previousPlan = await getMealPlanByDate(user.uid, getWeekStartKey(previousWeekStart));

            if (request !== cloneRequestRef.current || viewWeekRef.current !== startingWeek
                || displayPlanRef.current !== startingPlan) {
                if (request === cloneRequestRef.current) setPlannerNotice({
                    tone: 'info', message: 'Clone cancelled. Your newer edits are still here.',
                });
                return;
            }

            if (!previousPlan) {
                setPlannerNotice({
                    tone: 'info',
                    message: 'No previous saved plan was found to clone. Start from scratch or generate a new week instead.'
                });
                return;
            }

            if ((isDirty || startingPlan?.days.some(day => day.meals.length > 0))
                && !window.confirm('Replace this week with last week’s plan? Your current changes will be replaced.')) return;

            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const clonedDays = Array.from({ length: 7 }, (_, i) => {
                const sourceDay = previousPlan.days[i];
                const newDate = new Date(targetStartDate);
                newDate.setDate(targetStartDate.getDate() + i);
                return {
                    ...(sourceDay || {
                        dayName: dayNames[i],
                        totalCalories: 0,
                        meals: []
                    }),
                    date: toLocalDateKey(newDate),
                    dayName: sourceDay?.dayName || dayNames[i],
                    totalCalories: sourceDay?.totalCalories || 0,
                    meals: (sourceDay?.meals || []).map(m => ({ ...m, isEaten: false, id: crypto.randomUUID() })) // Reset status
                };
            });

            const clonedPlan: MealPlan = {
                ...previousPlan,
                id: undefined, // New ID will be generated on save
                weekStart: toLocalDateKey(targetStartDate),
                weekEnd: clonedDays[6].date,
                days: clonedDays,
                isAiGenerated: false
            };

            setDraftPlan(clonedPlan);
            setPlannerNotice({
                tone: 'success',
                message: 'Previous saved plan cloned into this week. Review it, then confirm the plan when it looks right.'
            });

        } catch (error) {
            console.error("Clone failed:", error);
            setPlannerNotice({
                tone: 'error',
                message: 'Could not clone the previous week. Please try again or start from scratch.'
            });
        }
    };

    const handleSettingsSave = (newTargets: { calories: number; protein: number; carbs: number; fat: number }) => {
        if (!displayPlan) return;
        setDraftPlan(displayPlan ? {
            ...displayPlan,
            dailyTargets: newTargets
        } : null);
    };

    const handleBatchSelect = (recipe: Recipe) => {
        if (!displayPlan) return;

        const newPlan = { ...displayPlan, days: displayPlan.days.map(day => ({ ...day, meals: [...day.meals] })) };
        const targetType = batchMealType || 'lunch';

        // Update ALL slots for the valid type
        newPlan.days.forEach((day) => {
            // Remove existing meals of this type to replace them
            const meals = day.meals.filter(m => m.type !== targetType);

            const newMeal: MealPlanMeal = {
                id: crypto.randomUUID(),
                recipeId: recipe.id,
                name: recipe.title,
                type: targetType,
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fat,
                imageUrl: recipe.imageUrl,
                tag: recipe.tags[0]
            };

            meals.push(newMeal);

            // Re-sort: tea:1, smoothie:2, b:3, l:4, t:?, d:5... wait, user said tea/smoothie first
            const order = { 'tea': 1, 'smoothie': 2, 'breakfast': 3, 'lunch': 4, 'dinner': 5, 'snack': 6 };
            meals.sort((a, b) => (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99));

            day.meals = meals;
            day.totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
        });

        setDraftPlan(newPlan);
        setBatchPickerOpen(false);
    };

    // Sync store plan logic removed - we use draftPlan || weekPlan directly
    // If we generate a NEW plan, we want to replace the view immediately.

    // If we have no active plan and no local plan, but have settings, we might want to show shell?
    // The store initializes activePlan as null if none.
    // Let's wait for userRecipes then trigger shell creation if needed, OR just show "Generate" button.
    // The previous code showed a shell.

    // AUD-050 / AUD-015: see Dashboard.
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        async function loadRecipes() {
            try {
                // AUD-031: an empty library used to be filled with demo recipes,
                // so a generated week could contain meals the user does not own
                // and whose recipeId points at nothing. It is now honestly empty
                // and generation is blocked until a real recipe exists.
                const recipes = await getRecipes(user!.uid);
                if (cancelled) return;
                setUserRecipes(recipes);
            } catch (error) {
                if (cancelled) return;
                console.error("Error loading recipes:", error);
                setUserRecipes([]);
            }
        }
        loadRecipes();

        return () => { cancelled = true; };
    }, [user]);

    // Effect to fetch plan when viewDate changes
    /**
     * AUD-050 / AUD-015: see Dashboard. This one needs a different guard.
     *
     * A plain `cancelled` boolean was tried first and made things worse -- it
     * turned a passing spec into a 1-in-6 failure, because the effect re-ran
     * mid-flight and the cleanup cancelled the request that was about to answer.
     * A sequence number ignores a superseded reply while still letting the
     * newest one land.
     *
     * AUD-086: the dependency list used to carry `refreshPlan`, which is never
     * called in this body. It was there to force a refetch, and it worked only
     * as a side effect of its identity churning whenever the store's activePlan
     * changed -- so saving a plan issued a second, redundant Firestore query.
     *
     * AUD-014 made that identity stable, which removed the accidental trigger
     * along with the waste. `contextActivePlan` is the thing that actually
     * changed, so the effect now depends on it directly: one refetch when the
     * plan really changes, and none otherwise. Without this, `fetchedPlan` could
     * shadow a fresher context plan for the same week after a save.
     */
    useEffect(() => {
        if (!user || viewMode !== 'week') return;

        const requestId = planRequestRef.current + 1;
        planRequestRef.current = requestId;
        setCheckedWeek(null);
        setFailedWeek(null);

        const fetchPlan = async () => {
            const weekStart = getWeekStartKey(viewDate);
            try {
                const plan = await getMealPlanByDate(user.uid, weekStart, { confirmEmpty: true });
                if (planRequestRef.current !== requestId) return;
                setFetchedPlan(plan);
                // AUD-130: only a successful read can open the empty-week prompt.
                setCheckedWeek(weekStart);
            } catch (error) {
                if (planRequestRef.current !== requestId) return;
                console.error('Failed to load planner week:', error);
                setFailedWeek(weekStart);
            }
        };

        fetchPlan();
    }, [user, viewDate, viewMode, contextActivePlan, weekLoadAttempt, planSaveRevision]);

    // Auto-Prompt for Plan Creation
    useEffect(() => {
        if (viewMode !== 'week') return;
        if (promptModalOpen || wizardOpen) return;
        if (dismissedPromptWeek === getWeekStartKey(viewDate)) return;

        // AUD-130: two conditions replace the 500 ms timer.
        //
        // 1. Only once this week's plan read has finished. The timer was a guess
        //    at how long that takes; the answer itself is exact.
        // An interaction guard was tried here too -- "do not prompt once the user
        // has clicked anything" -- and was wrong: navigating to a new empty week
        // is an interaction, and it is exactly when suggesting a plan is the
        // point. Determinism is the fix; suppression is not.
        if (checkedWeek !== getWeekStartKey(viewDate)) return;
        if (displayPlan) return;

        setPromptModalOpen(true);
    }, [displayPlan, viewMode, viewDate, promptModalOpen, wizardOpen, dismissedPromptWeek, checkedWeek]);

    // Saturday Check on load
    useEffect(() => {
        const today = new Date();
        if (today.getDay() === 6) { // Saturday
            // Proactively suggest planning for next week if we are on current week view?
            // Or just let the user navigate?
            // User said: "always when is Saturday, the app should ask us to meal plan"
            // Let's trigger it if we are on "Today" view and it's Saturday.
            // But we likely defaulted to 'week'.
        }
    }, []);


    const handleWizardGenerate = async (settings: WizardSettings) => {
        setPlannerNotice(null);
        setBatchCookLunch(settings.batchLunch);
        setIncludeSmoothie(settings.includeSmoothie);
        setIncludeTea(settings.includeTea);

        if (settings.batchMealType && isBatchMealType(settings.batchMealType)) {
            setBatchMealType(settings.batchMealType);
        }

        console.log("Generating plan...", { settings: !!userSettings, recipes: userRecipes.length });
        if (!userSettings) {
            setPlannerNotice({
                tone: 'error',
                message: 'Please set up your profile in Settings before generating a meal plan.'
            });
            return;
        }
        if (userRecipes.length === 0) {
            setPlannerNotice({
                tone: 'error',
                message: 'Add at least one recipe before generating a week. Open Recipes from the sidebar to add or import one.'
            });
            return;
        }

        try {
            // Resolve Targets for AI
            let aiSettings = {
                calories: userSettings.dailyCalorieTarget || 2000,
                protein: 0,
                carbs: 0,
                fat: 0
            };

            if (userSettings.macroMode === 'grams' && userSettings.macroTargets) {
                aiSettings = {
                    calories: userSettings.dailyCalorieTarget || 2000,
                    protein: userSettings.macroTargets.protein,
                    carbs: userSettings.macroTargets.carbs,
                    fat: userSettings.macroTargets.fat
                };
            } else {
                // Percentages
                const daily = aiSettings.calories;
                aiSettings.protein = Math.round((daily * (userSettings.macroSplit?.protein || 30) / 100) / 4);
                aiSettings.carbs = Math.round((daily * (userSettings.macroSplit?.carbs || 35) / 100) / 4);
                aiSettings.fat = Math.round((daily * (userSettings.macroSplit?.fat || 35) / 100) / 9);
            }

            // Use the viewDate which is already aligned to start of week
            const aiPlan = await generateAiMealPlan({
                userSettings: aiSettings,
                userRecipes,
                preferences: {
                    batchLunch: settings.batchLunch,
                    batchMealType: settings.batchMealType,
                    includeSmoothie: settings.includeSmoothie,
                    includeTea: settings.includeTea,
                    includeSnacks: settings.includeSnacks
                }
            }) as AiPlan;

            // The Cloud Function returns a plan structure, but we need to hydrate dates and day names locally to match the viewDate
            const startDate = getStartOfWeek(viewDate);
            const hydratedPlan: MealPlan = {
                ...aiPlan,
                dailyTargets: aiSettings, // STRICT ENFORCEMENT: Use user settings, not AI suggestions
                id: undefined, // New plan
                weekStart: getWeekStartKey(startDate),
                weekEnd: toLocalDateKey(addDays(startDate, 6)),
                isAiGenerated: true,
                days: aiPlan.days.map((day, index) => {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + index);
                    // Ensure meals have IDs
                    const meals: MealPlanMeal[] = day.meals.map((m) => ({
                        ...m,
                        recipeId: m.recipeId ?? undefined,
                        id: crypto.randomUUID(),
                        isEaten: false
                    }));

                    return {
                        ...day,
                        date: toLocalDateKey(date),
                        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                        totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
                        meals
                    };
                })
            };

            console.log("AI Plan generated:", hydratedPlan);
            setDraftPlan(hydratedPlan);
            setWizardOpen(false);
            setPlannerNotice({
                tone: 'success',
                message: 'Generated a draft meal plan. Review it, then confirm the plan when it looks right.'
            });
        } catch (error) {
            console.error("Generation failed:", error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            setPlannerNotice({
                tone: 'error',
                message: `Could not generate a meal plan: ${message}`
            });
        }
    };

    const handleWizardEmpty = () => {
        if (displayPlan?.days.some(day => day.meals.length > 0)
            && !window.confirm('Start from scratch? Your current meals will be replaced in the draft.')) {
            setWizardOpen(false);
            return;
        }
        setWizardOpen(false);
        setPlannerNotice(null);
        const newPlan = createEmptyPlan(viewDate, userSettings);
        setDraftPlan(newPlan);
    };



    const handlePlanWeekClick = () => {
        const today = new Date();
        const currentStart = getStartOfWeek(today);

        // Check if we are viewing the current week
        const isCurrentView = viewDate.getTime() === currentStart.getTime();

        if (isCurrentView) {
            // Check if it's Saturday (6) or Sunday (0)
            const day = today.getDay();
            if (day === 6 || day === 0) {
                setShowWeekendPrompt(true);
                return;
            }
        }

        // Otherwise just open wizard for the currently selected viewDate
        setWizardOpen(true);
    };

    // N1: every view moves by whole weeks, so the week on screen is always a
    // Monday week. The Day and Month views are placeholders with a week header.
    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        const newDate = direction === 'today' ? getStartOfWeek(new Date()) : stepPlannerWeek(viewDate, direction);
        setPromptModalOpen(false);
        setDismissedPromptWeek(getWeekStartKey(newDate));
        setPlannerNotice(null);
        setViewDate(newDate);
    };

    const macroTotals = useMemo(() => getPlanMacroTotals(displayPlan), [displayPlan]);

    // Dynamic Plan Analysis
    const planAnalysis = useMemo(() => {
        if (!displayPlan || !displayPlan.dailyTargets) return null;

        const targetCals = displayPlan.dailyTargets.calories;
        const currentCals = macroTotals.calories;
        const diff = currentCals - targetCals;
        const diffLabel = Math.abs(diff) < 50 ? 'Maintenance' : diff < 0 ? `${Math.abs(Math.round(diff))}kcal Deficit` : `${Math.round(diff)}kcal Surplus`;

        // Diversity: Count unique recipe IDs
        const allMeals = displayPlan.days.flatMap(d => d.meals);
        const uniqueRecipes = new Set(allMeals.map(m => m.recipeId).filter(Boolean)).size;
        const totalSlots = allMeals.length;
        const diversityScore = totalSlots > 0 ? Math.round((uniqueRecipes / totalSlots) * 100) : 0;

        return {
            diffLabel,
            diversityScore,
            adherenceEst: diversityScore < 80 ? 'High' : 'Mod', // Less variety = easier prep = higher adherence
            message: diff < -200
                ? "This plan is below your calorie target. Consider adding an extra snack on training days."
                : diff > 200
                    ? "This plan exceeds your target. You might want to swap a dinner for a lighter option."
                    : "Plan is perfectly balanced to your targets. Great job!"
        };
    }, [displayPlan, macroTotals]);

    const handleConfirmPlan = async (replacementVersion?: SavedPlanVersion | null) => {
        if (!user || !displayPlan || saving) return;
        setPlannerNotice(null);
        try {
            const savedPlan = await confirmPlan(displayPlan, replacementVersion);
            if (!savedPlan) return;
            setConflict(null);
            setSaved(true);
            setFetchedPlan(savedPlan);
            setTimeout(() => {
                setSaved(false);
                refreshPlan?.();
            }, 1000);
        } catch (error) {
            if (error instanceof PlanDraftConflictError) {
                setConflict({ week: displayPlan.weekStart, version: error.savedVersion });
                return;
            }
            console.error('Failed to save meal plan:', error);
            setPlannerNotice({
                tone: 'error',
                message: 'Could not save this plan. Your changes are still here. Please try again.'
            });
        }
    };

    const handleMealClick = async (meal: MealPlanMeal) => {
        const recipeLookupId = meal.recipeId || meal.id;
        if (!user || !recipeLookupId) return;
        try {
            // Attempt to fetch full recipe details if it's a real recipe
            const recipe = await getRecipe(user.uid, recipeLookupId);
            if (recipe) {
                setSelectedRecipe(recipe);
            } else {
                // If not found (or mock/custom meal), create object for display
                setSelectedRecipe({
                    id: meal.id,
                    title: meal.name,
                    calories: meal.calories,
                    protein: meal.protein || 0,
                    carbs: meal.carbs || 0,
                    fat: meal.fat || 0,
                    // AUD-083: these were 15 and 4, shown as though read from a
                    // real recipe. 0 renders as an em dash in the detail view.
                    cookTime: 0,
                    servings: 0,
                    imageUrl: meal.imageUrl || '',
                    mealType: toRecipeMealType(meal.type),
                    tags: meal.tag ? [meal.tag] : [],
                    folders: [],
                    ingredients: [],
                    instructions: []
                });
            }
        } catch (err) {
            // AUD-084: this was console.log (not even .error) with no user-facing
            // message, so a failed read looked exactly like a dead button.
            console.error('Could not load recipe details', err);
            setPlannerNotice({
                tone: 'error',
                message: 'Could not open that recipe. Please try again.',
            });
        }
    };

    const handleOpenPicker = (dayIndex: number, mealType: MealPlanMeal['type'], mealId?: string) => {
        setActiveSlot({ dayIndex, type: mealType, mealId });
        setPickerOpen(true);
    };

    const handleRecipeSelect = (recipe: Recipe) => {
        if (!activeSlot || !displayPlan) return;

        const { dayIndex, type, mealId } = activeSlot;
        const newPlan = { ...displayPlan, days: displayPlan.days.map(day => ({ ...day, meals: [...day.meals] })) };
        const day = newPlan.days[dayIndex];

        // Prepare meals array
        let meals = [...day.meals];

        if (mealId) {
            // Replacing a specific meal (Swap)
            meals = meals.filter(m => m.id !== mealId);
        } else {
            // Adding new meal. Enforce single slot for non-snack types.
            if (type !== 'snack') {
                meals = meals.filter(m => m.type !== type);
            }
        }

        // Add new meal
        const newMeal: MealPlanMeal = {
            id: crypto.randomUUID(),
            recipeId: recipe.id,
            name: recipe.title,
            type: type as 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'smoothie',
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            imageUrl: recipe.imageUrl,
            tag: recipe.tags[0]
        };

        meals.push(newMeal);

        // Sort meals by type order: tea:1, smoothie:2, b:3, l:4, d:5, s:6
        const order = { 'tea': 1, 'smoothie': 2, 'breakfast': 3, 'lunch': 4, 'dinner': 5, 'snack': 6 };
        meals.sort((a, b) => (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99));

        // Update day totals
        day.meals = meals;
        day.totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

        setDraftPlan(newPlan);
        setPickerOpen(false);
        setActiveSlot(null);
    };

    const handleOpenGapSolver = (dayIndex: number) => {
        if (!displayPlan) return;
        const day = displayPlan.days[dayIndex];

        // Calculate current for this day
        const current = {
            calories: day.meals.reduce((sum, m) => sum + (m.calories || 0), 0),
            protein: day.meals.reduce((sum, m) => sum + (m.protein || 0), 0),
            carbs: day.meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
            fat: day.meals.reduce((sum, m) => sum + (m.fat || 0), 0),
        };

        setGapSolverData({
            dayIndex,
            dayName: day.dayName,
            current
        });
        setGapSolverOpen(true);
    };

    const handleGapRecipeSelect = (recipe: Recipe) => {
        if (!gapSolverData || !displayPlan) return;

        // Add as a new meal
        // Infer type based on recipe type, or default to dinner if taken?
        // Let's just use the recipe's natural type
        const { dayIndex } = gapSolverData;

        // Prepare to add meal
        // Prepare to add meal
        // const day = displayPlan.days[dayIndex]; // Unused
        // ... (Similar logic to handleRecipeSelect but simpler)
        // ... (Similar logic to handleRecipeSelect but simpler)

        const newMeal: MealPlanMeal = {
            id: crypto.randomUUID(),
            recipeId: recipe.id,
            name: recipe.title,
            type: recipe.mealType,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            imageUrl: recipe.imageUrl,
            tag: recipe.tags[0]
        };

        const newDays = [...displayPlan.days];
        const newMeals = [...newDays[dayIndex].meals, newMeal];

        // Sort
        const order = { 'tea': 1, 'smoothie': 2, 'breakfast': 3, 'lunch': 4, 'dinner': 5, 'snack': 6 };
        newMeals.sort((a, b) => (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99));

        newDays[dayIndex] = {
            ...newDays[dayIndex],
            meals: newMeals,
            totalCalories: newMeals.reduce((sum, m) => sum + m.calories, 0)
        };

        setDraftPlan({ ...displayPlan, days: newDays });
        setGapSolverOpen(false);
        setGapSolverData(null);
    };

    const handleToggleMealStatus = async (dayIndex: number, mealId: string) => {
        if (!displayPlan) return;

        // Use local update fallback for now to support visual toggle on unsaved plans too
        const newWeekPlan = { ...displayPlan };
        const day = newWeekPlan.days[dayIndex];
        const mealIndex = day.meals.findIndex(m => m.id === mealId);

        if (mealIndex >= 0) {
            const meal = day.meals[mealIndex];
            const newStatus = !meal.isEaten;
            // AUD-081: `[...displayPlan.days]` copies the array but not the day
            // objects inside it, so assigning into newDays[i].meals mutated the
            // very object React was rendering -- and displayPlan can be the
            // store's activePlan, so this wrote to store state from outside the
            // reducer. Copy the day and its meals array too.
            const newDays = displayPlan.days.map((existingDay, index) =>
                index !== dayIndex
                    ? existingDay
                    : {
                        ...existingDay,
                        meals: existingDay.meals.map((m, i) =>
                            i === mealIndex ? { ...m, isEaten: newStatus } : m,
                        ),
                    },
            );
            setDraftPlan({ ...displayPlan, days: newDays }, {
                transient: !!displayPlan.id && !isDirty,
                localTick: meal.id,
            });

            // AUD-132: save for whichever SAVED plan is on screen, not only the
            // current week. A draft that has never been saved has no id and
            // nothing to write to, so it stays local until Confirm Plan.
            if (displayPlan.id && !isDirty) {
                // G-B: a refused tick is undone by the store, draft included.
                // Say so, as the grocery list does for its ticks.
                const failed = `Could not save your change to ${meal.name}. Please try again.`;
                const saved = await toggleMealCompletion(displayPlan.id, meal.id, newStatus, displayPlan);
                setPlannerNotice(current => saved
                    ? (current?.message === failed ? null : current)
                    : { tone: 'error', message: failed });
            }
        }
    };

    const handleAddToShoppingList = async () => {
        if (!user || addingToList || !displayPlan) return;
        // AUD-085: this used to share the `saving` flag with Save Plan, so each
        // reported the other's progress.
        setAddingToList(true);
        setPlannerNotice(null);
        try {
            const result = await generateGroceryList(user.uid, displayPlan);

            // AUD-079: there was no else branch. A failed generation produced no
            // message at all, and the reason the generator carefully returned was
            // thrown away. The most likely failure -- a plan whose meals have no
            // recipeId -- was completely silent.
            if (!result.success) {
                setPlannerNotice({
                    tone: 'error',
                    message: result.message || 'Could not build a shopping list from this plan.',
                });
                return;
            }

            // AUD-080: generateGroceryList writes straight through the service
            // layer, and the Grocery page reads from the store, which nothing
            // told to reload. Items were added and then invisible until a full
            // browser reload remounted AppProvider.
            await refreshGrocery();

            setPlannerNotice({
                tone: 'success',
                message: result.count
                    ? `Added ${result.count} ${result.count === 1 ? 'item' : 'items'} to your shopping list.` +
                        (result.skippedCount ? ` Skipped ${result.skippedCount} ${result.skippedCount === 1 ? 'ingredient' : 'ingredients'} with invalid or zero quantities.` : '')
                    : (result.message || 'Your shopping list is already up to date.'),
            });
        } catch (err) {
            console.error('Failed to update shopping list', err);
            setPlannerNotice({
                tone: 'error',
                message: 'Could not update your shopping list. Please try again.',
            });
        } finally {
            setAddingToList(false);
        }
    };


    const plannerActions = displayPlan ? (
        <div className="flex flex-wrap gap-3 w-full md:w-auto flex-shrink-0">
            <button
                onClick={handleAddToShoppingList}
                aria-label="Add to List"
                disabled={addingToList}
                className="flex-1 md:flex-none h-10 px-4 rounded-lg border border-surface-border text-white font-bold text-sm hover:bg-surface-border/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined text-lg">shopping_cart</span>
                <span className="hidden sm:inline">{addingToList ? 'Adding…' : 'Add to List'}</span>
            </button>
            <button
                onClick={() => setSettingsOpen(true)}
                aria-label={isDirty ? "tune Preferences" : undefined}
                className="flex-1 md:flex-none h-10 px-4 rounded-lg border border-surface-border text-white font-bold text-sm hover:bg-surface-border/50 transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-lg">tune</span>
                <span className={isDirty ? "hidden sm:inline" : undefined}>Preferences</span>
            </button>
            <button
                onClick={() => handleConfirmPlan()}
                disabled={saving || (!!displayPlan.id && !isDirty)}
                className={`flex-1 md:flex-none h-10 px-6 rounded-lg font-bold text-sm transition-colors shadow-[0_0_15px_rgba(167,139,250,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${saved && !isDirty ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-hover active:scale-95'}`}
            >
                {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : saved && !isDirty ? (
                    <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                )}
                {saving ? 'Saving...' : saved && !isDirty ? 'Saved!' : 'Confirm Plan'}
            </button>
        </div>
    ) : null;

    const isDayView = viewMode === 'day';
    const isMonthView = viewMode === 'month';

    if (isDayView || isMonthView) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <PlannerHeader
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    viewDate={viewDate}
                    onNavigate={handleNavigate}
                />
                {draftStorageError && !isDirty && <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-surface-dark p-3 text-sm text-red-100">{draftStorageError}</p>}
                {plannerNotice && (
                    <PlannerNoticeBanner
                        notice={plannerNotice}
                        onDismiss={() => setPlannerNotice(null)}
                    />
                )}
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-secondary">
                    <span className="material-symbols-outlined text-6xl mb-4">construction</span>
                    <h2 className="text-2xl font-bold">Coming Soon</h2>
                    <p className="max-w-md mx-auto mt-2">{isDayView ? 'Daily breakdown' : 'Monthly overview'} is currently under development.</p>
                </div>
            </div>
        );
    }

    if (!displayPlan && checkedWeek !== getWeekStartKey(viewDate)) {
        const failed = failedWeek === getWeekStartKey(viewDate);
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-[50vh]">
                <PlannerHeader
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    viewDate={viewDate}
                    onNavigate={handleNavigate}
                />
                <div className="flex-1 flex flex-col items-center justify-center text-center mt-12">
                    <div role={failed ? 'alert' : 'status'} className="bg-surface-dark p-8 rounded-xl border border-surface-border max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {failed ? 'Could not load this week' : 'Loading'}
                        </h2>
                        {failed && (
                            <button
                                type="button"
                                onClick={() => setWeekLoadAttempt(attempt => attempt + 1)}
                                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!displayPlan) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-[50vh]">
                <PlannerHeader
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    viewDate={viewDate}
                    onNavigate={handleNavigate}
                />
                {draftStorageError && !isDirty && <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-surface-dark p-3 text-sm text-red-100">{draftStorageError}</p>}
                {plannerNotice && (
                    <PlannerNoticeBanner
                        notice={plannerNotice}
                        onDismiss={() => setPlannerNotice(null)}
                    />
                )}

                <div className="flex-1 flex flex-col items-center justify-center text-center mt-12">
                    <div className="bg-surface-dark p-8 rounded-xl border border-surface-border shadow-2xl max-w-md w-full">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                            <span className="material-symbols-outlined text-5xl text-primary">calendar_add_on</span>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-3">
                            Plan Week of {viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h2>
                        <p className="text-text-secondary mb-8 leading-relaxed">
                            No plan found for this week. Create a new one or check other weeks!
                        </p>

                        <button
                            onClick={() => setPromptModalOpen(true)}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            Create New Plan
                        </button>
                    </div>

                    <PlanGenerationWizard
                        isOpen={wizardOpen}
                        onClose={() => setWizardOpen(false)}
                        onGenerate={handleWizardGenerate}
                        onEmpty={handleWizardEmpty}
                    />

                    {/* Plan Prompt Modal - Global for Empty States */}
                    <PlanPromptModal
                        isOpen={promptModalOpen}
                        onClose={handleClosePromptModal}
                        onCreate={() => {
                            setPromptModalOpen(false);
                            setWizardOpen(true);
                        }}
                        onClone={() => {
                            setPromptModalOpen(false);
                            handleCloneLastWeek();
                        }}
                        weekDate={viewDate}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {isDirty && (
                <div role="status" className="sticky top-0 z-20 mb-4 rounded-xl border border-primary/50 bg-surface-dark p-3 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white">Not saved yet</p>
                            <p className="text-xs text-text-secondary">{draftStorageError || 'Draft kept on this device. Confirm to save your plan.'}</p>
                        </div>
                        <button
                            onClick={() => {
                                if (saving) return;
                                const weekStart = getWeekStartKey(viewDate);
                                setDraftPlan(null, { weekStart });
                                setConflict(null);
                                setSaved(false);
                                setPlannerNotice(null);
                                setDismissedPromptWeek(weekStart);
                                setWeekLoadAttempt(attempt => attempt + 1);
                            }}
                            disabled={saving}
                            className="h-10 shrink-0 rounded-lg border border-surface-border px-3 text-xs font-bold text-white hover:bg-surface-border disabled:cursor-wait disabled:opacity-50"
                        >
                            Discard changes
                        </button>
                    </div>
                    {conflict?.week === getWeekStartKey(viewDate) && (
                        <div className="mt-3 rounded-lg border border-amber-300/50 p-3 text-sm text-white">
                            <p>This week was changed on another device since this draft.</p>
                            <p className="mt-1 text-xs text-text-secondary">Replace the saved week, or discard these changes to keep it.</p>
                            <button onClick={() => handleConfirmPlan(conflict.version)} disabled={saving}
                                className="mt-2 min-h-10 rounded-lg bg-primary px-3 font-bold text-background-dark disabled:opacity-50">
                                Replace saved week
                            </button>
                        </div>
                    )}
                    <div className="mt-3">{plannerActions}</div>
                </div>
            )}
            <PlannerHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                viewDate={viewDate}
                onNavigate={handleNavigate}
            />
            {draftStorageError && !isDirty && <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-surface-dark p-3 text-sm text-red-100">{draftStorageError}</p>}
            {plannerNotice && (
                <PlannerNoticeBanner
                    notice={plannerNotice}
                    onDismiss={() => setPlannerNotice(null)}
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-4 rounded-xl bg-surface-dark border border-surface-border mb-6 overflow-hidden">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-white">
                            {formatDateKey(displayPlan.weekStart, { month: 'short', day: 'numeric' }, 'en-US')}
                        </h1>
                        {displayPlan.isAiGenerated && (
                            <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                Generated by AI
                            </span>
                        )}
                    </div>
                    <p className="text-text-secondary text-base font-normal truncate">
                        Goal: {displayPlan.goal}
                    </p>
                </div>
                {!isDirty && plannerActions}
            </div>

            {/* Macro Cards - Real-Time Orchestration */}
            <p className="mb-2 text-xs text-text-secondary">Average per day with meals ({macroTotals.dayCount} {macroTotals.dayCount === 1 ? 'day' : 'days'})</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MacroCard
                    label="Daily Calories"
                    value={displayPlan?.dailyTargets?.calories || 2000}
                    unit="kcal"
                    current={macroTotals.calories}
                    icon="local_fire_department"
                    color="primary"
                    status={`${Math.round(macroTotals.calories)} / ${displayPlan?.dailyTargets?.calories || 2000}`}
                />
                <MacroCard
                    label="Protein"
                    value={displayPlan?.dailyTargets?.protein || 150}
                    unit="g"
                    current={macroTotals.protein}
                    icon="fitness_center"
                    color="primary"
                    status={`${Math.round(macroTotals.protein)}g / ${displayPlan?.dailyTargets?.protein || 150}g`}
                />
                <MacroCard
                    label="Carbs"
                    value={displayPlan?.dailyTargets?.carbs || 200}
                    unit="g"
                    current={macroTotals.carbs}
                    icon="bakery_dining"
                    color="yellow-400"
                    status={`${Math.round(macroTotals.carbs)}g / ${displayPlan?.dailyTargets?.carbs || 200}g`}
                />
                <MacroCard
                    label="Fats"
                    value={displayPlan?.dailyTargets?.fat || 70}
                    unit="g"
                    current={macroTotals.fat}
                    icon="water_drop"
                    color="blue-400"
                    status={`${Math.round(macroTotals.fat)}g / ${displayPlan?.dailyTargets?.fat || 70}g`}
                />
            </div>

            {/* AI Toolbar (Strategy Header) */}
            <div className="flex flex-col flex-wrap md:flex-row justify-between gap-4 py-2 border-b border-surface-border pb-6 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={handleCloneLastWeek}
                        className="bg-surface-dark border border-surface-border text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-surface-border/50 transition-colors flex items-center gap-2"
                        title="Clone Previous Week"
                    >
                        <span className="material-symbols-outlined">history</span>
                        Clone Last Week
                    </button>
                    {/* Placeholder for future features */}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 bg-surface-dark border border-surface-border text-text-secondary hover:text-white rounded-lg transition-all"
                        title="Preferences"
                        aria-label="Plan preferences"
                    >
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIncludeSmoothie(!includeSmoothie)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${includeSmoothie ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' : 'bg-surface-dark border-surface-border text-text-secondary hover:text-white hover:border-text-secondary'}`}
                        title="Toggle Daily Smoothie"
                    >
                        <span className="material-symbols-outlined text-lg">{includeSmoothie ? 'check_circle' : 'blender'}</span>
                        Smoothie
                    </button>

                    <button
                        onClick={() => setIncludeTea(!includeTea)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${includeTea ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' : 'bg-surface-dark border-surface-border text-text-secondary hover:text-white hover:border-text-secondary'}`}
                        title="Toggle Daily Tea"
                    >
                        <span className="material-symbols-outlined text-lg">{includeTea ? 'check_circle' : 'emoji_food_beverage'}</span>
                        Tea
                    </button>

                    <div className="flex items-center gap-0 bg-surface-dark rounded-lg border border-surface-border p-1">
                        <button
                            onClick={() => setBatchCookLunch(!batchCookLunch)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${batchCookLunch ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-lg">{batchCookLunch ? 'lock' : 'lock_open'}</span>
                            Batch Cook
                        </button>
                        {batchCookLunch && (
                            <>
                                <div className="w-px h-4 bg-surface-border mx-2"></div>
                                <button
                                    onClick={() => setBatchTypeModalOpen(true)}
                                    className="text-primary hover:text-white transition-colors text-xs font-bold uppercase px-2"
                                    title="Pick specific batch recipe"
                                >
                                    Select Meal
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handlePlanWeekClick}
                        className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary text-white px-4 text-sm font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 group">
                        <span className="material-symbols-outlined text-lg">edit_calendar</span>
                        Plan Week
                    </button>

                    {/* Weekend Prompt Modal (Duplicate needed for non-empty state? No, handled by wrapper usually, but here we are inside render. Ideally move modal outside) */}
                    {/* Move Dialog to common area */}
                </div>
            </div>

            <PlanGenerationWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onGenerate={handleWizardGenerate}
                onEmpty={handleWizardEmpty}
            />

            {showWeekendPrompt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowWeekendPrompt(false)}>
                    <div className="bg-surface-dark border border-surface-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Weekend Detected!</h3>
                        <p className="text-text-secondary mb-6">It looks like the week is almost over. Which week do you want to plan for?</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowWeekendPrompt(false);
                                    setWizardOpen(true);
                                }}
                                className="p-3 rounded-lg border border-surface-border hover:bg-white/5 text-left flex items-center gap-3 transition-colors"
                            >
                                <span className="material-symbols-outlined text-primary">today</span>
                                <div>
                                    <span className="block font-bold text-white">Continue with This Week</span>
                                    <span className="text-xs text-text-secondary">Plan for the remaining days</span>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    setShowWeekendPrompt(false);
                                    const nextWeek = new Date(viewDate);
                                    nextWeek.setDate(viewDate.getDate() + 7);
                                    setViewDate(nextWeek);
                                    setTimeout(() => setWizardOpen(true), 100);
                                }}
                                className="p-3 rounded-lg bg-primary hover:bg-primary-hover text-left flex items-center gap-3 transition-colors shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-white">next_week</span>
                                <div>
                                    <span className="block font-bold text-white">Plan Next Week</span>
                                    <span className="text-xs text-white/80">Start fresh from Monday</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Meal Horizontal Scroll */}
            <div className="overflow-x-auto pb-6">
                <div className="min-w-[1200px] grid grid-cols-7 gap-4">
                    {displayPlan.days.map((day, index) => (
                        <DayColumn
                            key={day.date}
                            day={day}
                            dayIndex={index}
                            dailyTargets={displayPlan.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 70 }}
                            includeSmoothie={includeSmoothie}
                            includeTea={includeTea}
                            onMealClick={handleMealClick}
                            onAddMeal={handleOpenPicker}
                            onToggleStatus={(type) => handleToggleMealStatus(index, type)}
                            onOpenGapSolver={() => handleOpenGapSolver(index)}
                        />
                    ))}
                </div>
            </div>

            {/* Plan Analysis Footer */}
            {planAnalysis && (
                <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-surface-dark to-background-dark border border-surface-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <span className="material-symbols-outlined text-2xl">psychology</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Plan Analysis</h4>
                            <p className="text-xs text-text-secondary">Average per day with meals ({macroTotals.dayCount} {macroTotals.dayCount === 1 ? 'day' : 'days'})</p>
                            <p className="text-sm text-text-secondary max-w-2xl mt-1">
                                This plan creates a <span className="text-primary font-bold">{planAnalysis.diffLabel}</span>. {planAnalysis.message}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="text-xs text-text-secondary uppercase font-bold">Diversity Score</p>
                            <p className="text-xl font-black text-white">{planAnalysis.diversityScore}<span className="text-xs text-primary">%</span></p>
                        </div>
                        <div className="w-px bg-surface-border" />
                        <div className="text-center">
                            <p className="text-xs text-text-secondary uppercase font-bold">Adherence Est.</p>
                            <p className="text-xl font-black text-white">{planAnalysis.adherenceEst}</p>
                        </div>
                    </div>
                </div>
            )}


            {/* Recipe Detail Modal */}
            {selectedRecipe && !showGuidedCooking && (
                <RecipeDetail
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onStartCooking={servings => { setCookingServings(servings); setShowGuidedCooking(true); }}
                />
            )}

            {/* Guided Cooking Mode */}
            {showGuidedCooking && selectedRecipe && (
                <GuidedCooking
                    recipe={selectedRecipe}
                    servings={cookingServings}
                    onExit={() => setShowGuidedCooking(false)}
                />
            )}

            {/* Plan Settings Modal */}
            <PlanSettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                currentTargets={displayPlan?.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 70 }}
                onSave={handleSettingsSave}
            />

            {/* Gap Solver Modal */}
            {gapSolverData && displayPlan && (
                <GapSolverModal
                    isOpen={gapSolverOpen}
                    onClose={() => setGapSolverOpen(false)}
                    dayName={gapSolverData.dayName}
                    target={displayPlan.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 70 }}
                    current={gapSolverData.current}
                    recipes={userRecipes}
                    onSelectRecipe={handleGapRecipeSelect}
                />
            )}

            {/* Batch Cooking Type Selection Modal */}
            {batchTypeModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setBatchTypeModalOpen(false)}>
                    <div className="bg-surface-dark border border-surface-border rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Batch Cook Which Meal?</h3>
                        <div className="flex flex-col gap-2">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setBatchMealType(type);
                                        setBatchTypeModalOpen(false);
                                        setBatchPickerOpen(true);
                                    }}
                                    className="p-3 rounded-lg border border-surface-border hover:bg-primary/20 hover:border-primary text-left flex items-center gap-3 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-text-secondary group-hover:text-primary">
                                        {type === 'breakfast' ? 'bakery_dining' : type === 'lunch' ? 'soup_kitchen' : type === 'dinner' ? 'dinner_dining' : 'cookie'}
                                    </span>
                                    <span className="font-bold text-white capitalize">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Recipe Picker */}
            <RecipePicker
                isOpen={batchPickerOpen}
                onClose={() => setBatchPickerOpen(false)}
                onSelect={handleBatchSelect}
                title={`Select Batch ${batchMealType.charAt(0).toUpperCase() + batchMealType.slice(1)} for the Week`}
                filterMealType={batchMealType}
            />

            {/* Plan Wizard (for Regenerate from toolbar) - REMOVED DUPLICATE */}

            {/* Recipe Picker Modal */}
            <RecipePicker
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleRecipeSelect}
                title={activeSlot ? `Select ${activeSlot.type.charAt(0).toUpperCase() + activeSlot.type.slice(1)}` : 'Select Meal'}
                filterMealType={activeSlot ? toRecipeMealType(activeSlot.type) : undefined}
            />
        </div>
    );
}

function PlannerNoticeBanner({ notice, onDismiss }: {
    notice: Exclude<PlannerNotice, null>;
    onDismiss: () => void;
}) {
    const toneClasses = {
        success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
        error: 'border-red-400/40 bg-red-500/15 text-red-100',
        info: 'border-primary/40 bg-primary/15 text-purple-100'
    }[notice.tone];
    const iconName = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    }[notice.tone];

    return (
        <div
            role="alert"
            className={`fixed left-4 right-4 top-4 z-[80] mx-auto flex max-w-2xl items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur md:left-1/2 md:right-auto md:w-full md:-translate-x-1/2 ${toneClasses}`}
        >
            <span className="material-symbols-outlined mt-0.5 text-xl" aria-hidden="true">{iconName}</span>
            <p className="flex-1 text-sm font-semibold leading-6">{notice.message}</p>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss meal planner message"
                className="rounded-lg p-1 text-current opacity-80 transition hover:bg-white/10 hover:opacity-100"
            >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
            </button>
        </div>
    );
}

// Header Component
function PlannerHeader({ viewMode, setViewMode, viewDate, onNavigate }: {
    viewMode: 'day' | 'week' | 'month';
    setViewMode: (m: 'day' | 'week' | 'month') => void;
    viewDate: Date;
    onNavigate: (dir: 'prev' | 'next' | 'today') => void;
}) {
    const onThisWeek = getWeekStartKey(viewDate) === getWeekStartKey();
    return (
        <div className="flex flex-col flex-wrap md:flex-row justify-between items-center gap-4 mb-8">
            {/* View Tabs */}
            <div className="flex p-1 bg-surface-dark border border-surface-border rounded-lg">
                {(['day', 'week', 'month'] as const).map((mode) => (
                    <button
                        key={mode}
                        type="button"
                        aria-pressed={viewMode === mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${viewMode === mode
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-secondary hover:text-white'
                            }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Navigation. R9: "This week" sits under the week box at every width, one tap back from any other week. */}
            <div className="flex flex-col items-center gap-2 md:items-end">
                <div className="flex items-center gap-4 bg-surface-dark p-2 rounded-xl border border-surface-border">
                    <button
                        type="button"
                        aria-label="Previous week"
                        onClick={() => onNavigate('prev')}
                        className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    <div className="text-center min-w-[150px]">
                        <span className="block text-sm font-bold text-white">
                            Week of {viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-text-secondary">
                            {new Date(viewDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>

                    <button
                        type="button"
                        aria-label="Next week"
                        onClick={() => onNavigate('next')}
                        className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
                {!onThisWeek && (
                    <button
                        type="button"
                        onClick={() => onNavigate('today')}
                        className="h-10 rounded-lg border border-surface-border bg-surface-dark px-4 text-sm font-bold text-white hover:bg-surface-border transition-colors"
                    >
                        This week
                    </button>
                )}
            </div>
        </div>
    );
}

// Macro Card Component
function MacroCard({ label, value, unit, current, icon, color, status }: {
    label: string;
    value: number;
    unit: string;
    current: number;
    icon: string;
    color: string;
    status?: string;
}) {
    const isOver = current > value;
    const progress = Math.min(100, Math.round((current / value) * 100));

    const getColorClass = () => {
        if (isOver) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';

        switch (color) {
            case 'primary': return 'bg-primary';
            case 'yellow-400': return 'bg-yellow-400';
            case 'blue-400': return 'bg-blue-400';
            default: return 'bg-primary';
        }
    };

    return (
        <div className={`relative overflow-hidden flex flex-col gap-1 rounded-xl p-5 bg-surface-dark border transition-colors group ${isOver ? 'border-red-500/30 hover:border-red-500' : 'border-surface-border hover:border-primary/50'}`}>
            <div className={`absolute top-0 right-0 p-3 transition-opacity ${isOver ? 'opacity-20' : 'opacity-10 group-hover:opacity-20'}`}>
                <span className={`material-symbols-outlined text-4xl ${isOver ? 'text-red-500' : 'text-primary'}`}>{isOver ? 'warning' : icon}</span>
            </div>
            <p className="text-text-secondary text-sm font-medium uppercase tracking-wide">{label}</p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-1">
                    <span className={`text-2xl font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>{Math.round(current)}</span>
                    <span className="text-lg text-text-secondary font-semibold">/</span>
                    <div className="flex items-center gap-1">
                        <span className="text-text-secondary text-lg font-bold">{value}</span>
                        <span className="material-symbols-outlined text-[10px] text-text-secondary/50" title="Strictly Enforced">lock</span>
                    </div>
                </div>
                <span className="text-xs text-text-secondary">{unit}</span>
            </div>
            <div className="w-full bg-surface-border h-1.5 rounded-full mt-2">
                <div className={`${getColorClass()} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
            </div>
            <p className={`text-xs mt-1 font-medium ${isOver ? 'text-red-400' : 'text-text-secondary'}`}>
                {status || (isOver ? `${Math.round(current - value)}${unit} Over Limit` : `${progress}% of target`)}
            </p>
        </div>
    );
}

// Day Column Component
function DayColumn({ day, dayIndex, dailyTargets, onMealClick, onAddMeal, onToggleStatus, includeSmoothie, includeTea, onOpenGapSolver }: {
    day: { date: string; dayName: string; totalCalories: number; meals: MealPlanMeal[] };
    dayIndex: number;
    dailyTargets: { calories: number; protein: number; carbs: number; fat: number };
    onMealClick: (meal: MealPlanMeal) => void;
    onAddMeal: (dayIndex: number, type: MealPlanMeal['type'], mealId?: string) => void;
    onToggleStatus: (mealId: string) => void;
    includeSmoothie?: boolean;
    includeTea?: boolean;
    onOpenGapSolver?: () => void;
}) {
    const { calories: targetCalories, protein: targetProtein, carbs: targetCarbs, fat: targetFat } = dailyTargets;

    // Calculate daily totals
    const totalProtein = day.meals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalCarbs = day.meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const totalFat = day.meals.reduce((sum, m) => sum + (m.fat || 0), 0);

    const breakfast = day.meals.find(m => m.type === 'breakfast');
    const smoothie = day.meals.find(m => m.type === 'smoothie');
    const lunch = day.meals.find(m => m.type === 'lunch');
    const tea = day.meals.find(m => m.type === 'tea');
    const dinner = day.meals.find(m => m.type === 'dinner');
    const snacks = day.meals.filter(m => m.type === 'snack');

    // Real adherence calculation
    const caloriePercent = Math.round((day.totalCalories / targetCalories) * 100);

    // Check Macro deviations (>20% variance is noteworthy)
    const pVar = targetProtein > 0 ? (totalProtein - targetProtein) / targetProtein : 0;
    const cVar = targetCarbs > 0 ? (totalCarbs - targetCarbs) / targetCarbs : 0;
    const fVar = targetFat > 0 ? (totalFat - targetFat) / targetFat : 0;

    let barColor = 'bg-primary';
    let label = 'On Track';

    // Status Logic
    if (caloriePercent >= 90 && caloriePercent <= 110) {
        barColor = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
        label = 'Perfect';
    } else if (caloriePercent >= 80 && caloriePercent <= 120) {
        barColor = 'bg-yellow-500';
        label = 'Good';
    } else {
        barColor = 'bg-red-500';
        label = caloriePercent < 80 ? 'Low' : 'Over';
    }

    // Override label if meaningful macro deviation exists while calories are roughly OK
    if (label === 'Good' || label === 'Perfect') {
        if (pVar < -0.2) { label = 'Low Protein'; barColor = 'bg-orange-400'; }
        else if (fVar > 0.25) { label = 'High Fat'; barColor = 'bg-orange-400'; }
        else if (cVar > 0.25) { label = 'High Carbs'; barColor = 'bg-yellow-400'; }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Day Header */}
            <div className="px-1">
                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1">{day.dayName}</p>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-white">{formatDateKey(day.date, { month: 'short', day: 'numeric' }, 'en-US')}</h3>
                    {onOpenGapSolver && (
                        <button
                            onClick={onOpenGapSolver}
                            aria-label={`Show suggestions for ${day.dayName}`}
                            title="Magic Suggest: Fill daily gap"
                            className="p-1 rounded-lg hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                        </button>
                    )}
                </div>

                {/* Adherence Bar */}
                <div className="space-y-1 group relative">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-text-secondary">
                        <span className={label === 'Perfect' ? 'text-green-400' : label.includes('High') || label.includes('Low') || label === 'Over' ? 'text-orange-400' : ''}>{label}</span>
                        <span className="text-white">{Math.round(day.totalCalories)} / {targetCalories}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-dark border border-surface-border rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, caloriePercent)}%` }}></div>
                    </div>

                    {/* Tooltip on Hover */}
                    <div className="absolute top-8 left-0 w-full bg-background-dark/95 backdrop-blur border border-surface-border p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                            <div>
                                <span className="block text-text-secondary">Prot</span>
                                <span className={pVar < -0.15 ? 'text-red-400' : 'text-white'}>{Math.round(totalProtein)}/{targetProtein}</span>
                            </div>
                            <div>
                                <span className="block text-text-secondary">Carb</span>
                                <span className={cVar > 0.2 ? 'text-yellow-400' : 'text-white'}>{Math.round(totalCarbs)}/{targetCarbs}</span>
                            </div>
                            <div>
                                <span className="block text-text-secondary">Fat</span>
                                <span className={fVar > 0.2 ? 'text-red-400' : 'text-white'}>{Math.round(totalFat)}/{targetFat}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meal Cards */}
            <div className="space-y-4">
                {/* Beverage Row (Tea & Smoothie) */}
                {(includeTea || includeSmoothie || tea || smoothie) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                            {(tea || includeTea) && (
                                tea ? (
                                    <MealCard
                                        meal={tea}
                                        onClick={() => onMealClick(tea)}
                                        onSwap={() => onAddMeal(dayIndex, 'tea', tea.id)}
                                        onToggle={() => onToggleStatus(tea.id)}
                                    />
                                ) : (
                                    <EmptySlotButton type="Tea" onClick={() => onAddMeal(dayIndex, 'tea')} />
                                )
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            {(smoothie || includeSmoothie) && (
                                smoothie ? (
                                    <MealCard
                                        meal={smoothie}
                                        onClick={() => onMealClick(smoothie)}
                                        onSwap={() => onAddMeal(dayIndex, 'smoothie', smoothie.id)}
                                        onToggle={() => onToggleStatus(smoothie.id)}
                                    />
                                ) : (
                                    <EmptySlotButton type="Smoothie" onClick={() => onAddMeal(dayIndex, 'smoothie')} />
                                )
                            )}
                        </div>
                    </div>
                )}

                {breakfast ? (
                    <MealCard
                        meal={breakfast}
                        onClick={() => onMealClick(breakfast)}
                        onSwap={() => onAddMeal(dayIndex, 'breakfast', breakfast.id)}
                        onToggle={() => onToggleStatus(breakfast.id)}
                    />
                ) : (
                    <EmptySlotButton type="Breakfast" onClick={() => onAddMeal(dayIndex, 'breakfast')} />
                )}

                {lunch ? (
                    <MealCard
                        meal={lunch}
                        onClick={() => onMealClick(lunch)}
                        onSwap={() => onAddMeal(dayIndex, 'lunch', lunch.id)}
                        onToggle={() => onToggleStatus(lunch.id)}
                    />
                ) : (
                    <EmptySlotButton type="Lunch" onClick={() => onAddMeal(dayIndex, 'lunch')} />
                )}

                {dinner ? (
                    <MealCard
                        meal={dinner}
                        onClick={() => onMealClick(dinner)}
                        onSwap={() => onAddMeal(dayIndex, 'dinner', dinner.id)}
                        onToggle={() => onToggleStatus(dinner.id)}
                    />
                ) : (
                    <EmptySlotButton type="Dinner" onClick={() => onAddMeal(dayIndex, 'dinner')} />
                )}

                {/* Snacks - Dynamic List */}
                {snacks.map((snack, i) => (
                    <SnackCard
                        key={snack.id || i}
                        meal={snack}
                        onToggle={() => onToggleStatus(snack.id)}
                        // For SnackCard we might need onSwap too if we want to replace
                        onSwap={() => onAddMeal(dayIndex, 'snack', snack.id)}
                    />
                ))}

                {/* Always show Add Snack button to allow multiple */}
                <EmptySlotButton type="Snack" onClick={() => onAddMeal(dayIndex, 'snack')} />
            </div>
        </div>
    );
}

function EmptySlotButton({ type, onClick }: { type: string, onClick: () => void }) {
    return (
        <div onClick={onClick} className="h-24 border border-dashed border-surface-border rounded-xl bg-surface-dark/30 flex flex-col items-center justify-center gap-2 p-4 text-center hover:border-primary/50 transition-colors cursor-pointer group">
            <span className="material-symbols-outlined text-text-secondary group-hover:text-primary">add_circle</span>
            <p className="text-[10px] font-bold uppercase text-text-secondary">Add {type}</p>
        </div>
    );
}

// Meal Card Component (Compact Version)
function MealCard({ meal, onClick, onSwap, onToggle }: {
    meal: MealPlanMeal;
    onClick?: () => void;
    onSwap?: () => void;
    onToggle?: () => void;
}) {
    const mealLabel = meal.type.charAt(0).toUpperCase() + meal.type.slice(1);
    const isEaten = meal.isEaten || false;

    // AUD-118: six Unsplash stock photos used to stand in for meals with no
    // image of their own. Replaced with a tint generated from the meal's macros.
    const fallbackTint = recipeTint(meal, meal.name || meal.type);

    return (
        <div onClick={onClick} className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${isEaten ? 'opacity-60 grayscale-[0.5]' : ''}`}>

            {/* Check overlay - Top Left */}
            <div className={`absolute top-1 left-1 z-20 transition-opacity ${isEaten ? 'opacity-100' : '[@media(hover:hover)]:opacity-0 group-hover:opacity-100'}`}>
                <button
                    type="button"
                    aria-pressed={isEaten}
                    aria-label={`${isEaten ? 'Mark as not eaten' : 'Mark as eaten'}: ${meal.name}`}
                    onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                    className={`rounded-full p-0.5 shadow-sm transition-all ${isEaten ? 'bg-green-500 text-white' : 'bg-black/40 text-white hover:bg-white hover:text-green-500'}`}
                >
                    <span className="material-symbols-outlined text-xs font-bold">{isEaten ? 'check' : 'check_circle'}</span>
                </button>
            </div>

            {/* Compact Image */}
            <RecipeImage imageUrl={meal.imageUrl} probe>
                {(displayImage) => (
                    <div
                        className="h-14 w-full bg-cover bg-center relative flex items-center justify-center"
                        style={displayImage
                            ? { backgroundImage: `url(${displayImage})` }
                            : { backgroundImage: fallbackTint.background, filter: fallbackTint.filter }}
                    >
                        {!displayImage && (
                            <span className="absolute text-2xl font-black text-white/20 select-none">
                                {recipeInitial(meal.name || meal.type)}
                            </span>
                        )}
                        {isEaten && <div className="absolute inset-0 bg-black/20" />}
                    </div>
                )}
            </RecipeImage>

            <div className="p-2">
                <p className="text-[9px] font-bold uppercase text-primary">{mealLabel}</p>
                <h4 className={`text-xs font-bold truncate text-white ${isEaten ? 'line-through decoration-white/50' : ''}`}>{meal.name}</h4>
                <div className="flex items-center gap-2 text-[9px] font-medium text-text-secondary mt-0.5">
                    <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-primary"></span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                </div>
            </div>

            {/* Quick Actions overlay on hover */}
            <div className="absolute top-1 right-1 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onSwap?.(); }}
                    aria-label={`Swap ${meal.name}`}
                    className="bg-black/50 backdrop-blur text-white p-0.5 rounded hover:bg-primary hover:text-black transition-colors"
                >
                    <span className="material-symbols-outlined text-xs">autorenew</span>
                </button>
            </div>
        </div>
    );
}

// Snack Card Component
function SnackCard({ meal, onToggle, onSwap }: { meal: MealPlanMeal; onToggle?: () => void; onSwap?: () => void }) {
    const isEaten = meal.isEaten || false;
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onSwap?.(); }}
            className={`bg-surface-dark rounded-xl p-3 border hover:border-primary/50 transition-all shadow-sm group cursor-pointer relative ${isEaten ? 'border-primary/30 opacity-60' : 'border-surface-border'}`}>
            <div className="absolute top-2 right-2 z-20">
                <button
                    type="button"
                    aria-pressed={isEaten}
                    aria-label={`${isEaten ? 'Mark as not eaten' : 'Mark as eaten'}: ${meal.name}`}
                    onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                    className={`rounded-full p-0.5 transition-all ${isEaten ? 'text-green-500' : 'text-text-secondary/20 [@media(hover:none)]:text-text-secondary hover:text-primary [@media(hover:hover)]:opacity-0 group-hover:opacity-100'}`}
                >
                    <span className="material-symbols-outlined text-lg">{isEaten ? 'check_circle' : 'circle'}</span>
                </button>
            </div>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Snack</span>
                    <p className={`text-white font-semibold text-sm ${isEaten ? 'line-through text-white/50' : ''}`}>{meal.name}</p>
                </div>
                <span className={`material-symbols-outlined text-lg ${isEaten ? 'opacity-0' : 'text-text-secondary [@media(hover:none)]:opacity-0'}`}>local_drink</span>
            </div>
            <p className="text-xs text-text-secondary">{meal.protein}g Protein • {meal.calories} kcal</p>
        </div>
    );
}
