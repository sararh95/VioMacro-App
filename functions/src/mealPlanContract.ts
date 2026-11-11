/** Validate semantic promises the provider's JSON schema cannot enforce. */
export function validateMealPlanReferences(
    plan: unknown,
    recipeIds: ReadonlySet<string>,
    includeSnacks: boolean
): void {
    if (!plan || typeof plan !== "object" || !Array.isArray((plan as { days?: unknown }).days)) {
        throw new Error("Invalid meal plan days.");
    }
    for (const day of (plan as { days: unknown[] }).days) {
        if (!day || typeof day !== "object" || !Array.isArray((day as { meals?: unknown }).meals)) {
            throw new Error("Invalid meal plan meals.");
        }
        for (const meal of (day as { meals: unknown[] }).meals) {
            if (!meal || typeof meal !== "object") {
                throw new Error("Invalid meal plan meal.");
            }
            const { recipeId, type } = meal as { recipeId?: unknown; type?: unknown };
            if (recipeId !== null && (typeof recipeId !== "string" || !recipeIds.has(recipeId))) {
                throw new Error("Meal recipeId must reference the supplied library or be null for a generic meal.");
            }
            if (!includeSnacks && type === "snack") {
                throw new Error("Meal plan contains a snack despite includeSnacks=false.");
            }
        }
    }
}
