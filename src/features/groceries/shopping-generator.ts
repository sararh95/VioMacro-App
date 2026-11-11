import { type MealPlan } from '../meal-planning/planService';
import { type Recipe, getRecipe } from '../recipes/recipeService';
import { replaceGeneratedGroceryItems } from './shoppingService';

import { aggregateIngredients, recipeServings, type IngredientInput } from '../../shared/ingredients';

/**
 * G-D: a planned recipeId that can never be a recipe document id names no
 * recipe. A by-id read of one throws ("/" fails SDK path validation or leaves
 * the recipes collection; ".", ".." and "__x__" are refused by Firestore),
 * which would abort the whole list. Such meals are skipped, as they were when
 * this looked ids up in a map. Real read failures still throw before writing.
 */
function isRecipeDocumentId(id: string): boolean {
    return !id.includes('/') && id !== '.' && id !== '..' && !/^__.*__$/.test(id);
}

export async function generateGroceryList(userId: string, weekPlan: MealPlan) {
    console.log("Generating grocery list for user:", userId);

    // 1. Collect all Recipe IDs
    const recipeIds = new Set<string>();
    weekPlan.days.forEach(day => {
        day.meals.forEach(meal => {
            if (meal.recipeId) recipeIds.add(meal.recipeId);
        });
    });

    console.log("Found recipe IDs in plan:", Array.from(recipeIds));

    if (recipeIds.size === 0) {
        console.warn("No recipe IDs found in meal plan.");
        return { success: false, count: 0, skippedCount: 0, message: "No recipes in plan" };
    }

    try {
        // 2. G-D: fetch only the planned recipes, by id. Reading the whole
        // library missed every recipe past its first page, and cost one read
        // per recipe owned instead of one per recipe planned.
        const plannedRecipes = await Promise.all(Array.from(recipeIds).filter(isRecipeDocumentId).map(id => getRecipe(userId, id)));

        // AUD-032: demo recipes used to be preloaded into this map on EVERY run,
        // not as a fallback. Any meal whose recipeId matched a demo id resolved to
        // fabricated ingredients, which were then written into the user's real
        // grocery list. Only recipes the user actually owns are looked up now.
        const recipeMap = new Map<string, Recipe>();
        plannedRecipes.forEach(r => {
            if (r?.id) recipeMap.set(r.id, r);
        });

        console.log("Total recipes available for lookup:", recipeMap.size);

        // One planned meal is one portion. Parse/scale every owned recipe
        // before the existing atomic replacement is allowed to stage writes.
        const entries: { ingredient: IngredientInput; factor: number }[] = [];
        for (const day of weekPlan.days) {
            for (const meal of day.meals) {
                const recipe = meal.recipeId ? recipeMap.get(meal.recipeId) : undefined;
                if (!recipe) continue;
                const factor = 1 / recipeServings(recipe.servings);
                for (const ingredient of recipe.ingredients || []) entries.push({ ingredient, factor });
            }
        }
        const { items: totals, skippedCount } = aggregateIngredients(entries);

        // 4. Save to Firestore
        if (totals.length === 0) {
            return { success: false, count: 0, skippedCount, message: 'No addable ingredients found. Your shopping list has not changed.' };
        }

        const items = totals.map(item => {
            // Keep validated positive amounts positive (e.g. 0.01 tsp).
            const payload = {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                aisle: item.aisle,
                isChecked: false,
                mealPlanId: weekPlan.id,
                source: 'generated' as const
            };
            return payload;
        });

        await replaceGeneratedGroceryItems(userId, items);
        console.log(`Successfully saved ${items.length} items to Firestore.`);
        return { success: true, count: items.length, skippedCount };

    } catch (error) {
        console.error("Failed to generate grocery list", error);
        throw error;
    }
}
