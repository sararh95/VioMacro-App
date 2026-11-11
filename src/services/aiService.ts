import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase/firebase';
import { createAiCallableRequestId } from './aiSpendService';
import type { Recipe } from '../features/recipes/recipeService';

export interface GeneratePlanParams {
    userSettings: { calories: number; protein: number; carbs: number; fat: number };
    userRecipes: Recipe[];
    preferences: {
        batchLunch: boolean;
        batchMealType?: string;
        includeSmoothie: boolean;
        includeTea: boolean;
        includeSnacks: boolean;
    };
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

export const generateAiMealPlan = async (params: GeneratePlanParams) => {
    try {
        if (consumeDevFailure('generateAiMealPlan')) {
            throw new Error('Injected generateAiMealPlan failure');
        }

        const generateMealPlan = httpsCallable(functions, 'generateMealPlan');
        const result = await generateMealPlan({
            userSettings: {
                calories: params.userSettings.calories,
                protein: params.userSettings.protein,
                carbs: params.userSettings.carbs,
                fat: params.userSettings.fat,
            },
            // Firestore documents can also contain embeddings, assets and
            // undeclared legacy fields. A type annotation cannot remove them.
            userRecipes: params.userRecipes.slice(0, 100).map(recipe => ({
                id: recipe.id,
                title: typeof recipe.title === 'string' ? recipe.title.slice(0, 200) : '',
                mealType: recipe.mealType,
            })),
            preferences: {
                batchLunch: params.preferences.batchLunch,
                batchMealType: params.preferences.batchMealType,
                includeSmoothie: params.preferences.includeSmoothie,
                includeTea: params.preferences.includeTea,
                includeSnacks: params.preferences.includeSnacks,
            },
            requestId: createAiCallableRequestId('meal-plan'),
        });
        return result.data;
    } catch (error) {
        console.error("Error calling AI service:", error);
        throw error;
    }
};
