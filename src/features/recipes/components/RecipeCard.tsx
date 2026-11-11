import RecipeThumb from './RecipeThumb';
import type { Recipe } from '../recipeService';

interface RecipeCardProps {
    recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    const getMealTypeLabel = () => {
        switch (recipe.mealType) {
            case 'breakfast': return 'Breakfast • Quick';
            case 'lunch': return 'Lunch • Vegan';
            case 'dinner': return 'Dinner • High Protein';
            case 'snack': return 'Snack • Low Cal';
            default: return recipe.mealType || 'Recipe';
        }
    };


    return (
        <div className="bg-surface-dark rounded-xl border border-surface-border overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
                <RecipeThumb
                    title={recipe.title}
                    imageUrl={recipe.imageUrl}
                    macros={recipe}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    initialClassName="text-4xl"
                />
                {/* Cook Time Badge */}
                <div className="absolute top-3 left-3 bg-primary text-background-dark text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                    {recipe.cookTime}m
                </div>
                {/* Favorite Icon */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:text-primary transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>favorite_border</span>
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-white font-semibold mb-1 truncate group-hover:text-primary transition-colors">
                    {recipe.title}
                </h3>
                <p className="text-xs text-text-secondary mb-4">{getMealTypeLabel()}</p>

                {/* Macros */}
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-white font-bold">{recipe.calories}</span>
                        <span className="text-text-secondary">KCAL</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-primary font-bold">{recipe.protein}g</span>
                        <span className="text-text-secondary">P</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-blue-400 font-bold">{recipe.carbs}g</span>
                        <span className="text-text-secondary">C</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-bold">{recipe.fat}g</span>
                        <span className="text-text-secondary">F</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
