import RecipeThumb from '../../recipes/components/RecipeThumb';
import { useState, useMemo } from 'react';
import type { Recipe } from '../../recipes/recipeService';

type RecipeFilter = 'all' | Recipe['mealType'];

interface GapSolverModalProps {
    isOpen: boolean;
    onClose: () => void;
    dayName: string;
    target: { calories: number; protein: number; carbs: number; fat: number };
    current: { calories: number; protein: number; carbs: number; fat: number };
    recipes: Recipe[];
    onSelectRecipe: (recipe: Recipe) => void;
}

export function GapSolverModal({ isOpen, onClose, dayName, target, current, recipes, onSelectRecipe }: GapSolverModalProps) {
    const [filter, setFilter] = useState<RecipeFilter>('all');

    const gap = useMemo(() => ({
        calories: Math.max(0, target.calories - current.calories),
        protein: Math.max(0, target.protein - current.protein),
        carbs: Math.max(0, target.carbs - current.carbs),
        fat: Math.max(0, target.fat - current.fat),
    }), [target, current]);

    const suggestions = useMemo(() => {
        if (!recipes.length) return [];

        let candidates = recipes;
        if (filter !== 'all') {
            candidates = candidates.filter(r => r.mealType === filter);
        }

        // Score recipes based on how well they fill the gap
        // Lower score is better (less difference)
        const scored = candidates.map(recipe => {
            const calDiff = Math.abs(recipe.calories - gap.calories);
            const proteinDiff = Math.abs(recipe.protein - gap.protein);

            // We prioritize hitting protein and calories
            // Weighted score: Calories matter most, then protein
            const score = (calDiff * 1) + (proteinDiff * 5);

            return { recipe, score };
        });

        // specific filtering for "completing" the day
        // If the gap is small (< 300 cals), prioritize snacks/small meals even if 'dinner' is selected
        // But for now, simple sorting
        return scored.sort((a, b) => a.score - b.score).slice(0, 5).map(s => s.recipe);

    }, [recipes, gap, filter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-surface-dark border border-surface-border rounded-xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-400">auto_fix_high</span>
                            Complete {dayName}
                        </h3>
                        <p className="text-text-secondary text-sm mt-1">
                            You need roughly <span className="text-white font-bold">{Math.round(gap.calories)} kcal</span> and <span className="text-white font-bold">{Math.round(gap.protein)}g protein</span> to hit your goal.
                        </p>
                    </div>
                    <button onClick={onClose} aria-label={`Close suggestions for ${dayName}`} className="text-text-secondary hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
                    {(['all', 'breakfast', 'lunch', 'dinner', 'snack', 'smoothie'] satisfies RecipeFilter[]).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === type
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-border/30 text-text-secondary hover:bg-surface-border'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Suggestions List */}
                <div className="space-y-3 overflow-y-auto pr-1">
                    {suggestions.length > 0 ? (
                        suggestions.map(recipe => (
                            <button
                                key={recipe.id}
                                onClick={() => onSelectRecipe(recipe)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl border border-surface-border bg-black/20 hover:bg-surface-border/30 hover:border-primary/50 transition-all group text-left"
                            >
                                <div className="w-16 h-16 rounded-lg bg-surface-border overflow-hidden shrink-0">
                                    <RecipeThumb title={recipe.title} imageUrl={recipe.imageUrl} macros={recipe} className="w-full h-full object-cover" initialClassName="text-xl" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate group-hover:text-primary transition-colors">{recipe.title}</h4>
                                    <div className="flex gap-3 text-xs text-text-secondary mt-1">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">local_fire_department</span> {recipe.calories}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">fitness_center</span> {recipe.protein}g</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">timer</span> {recipe.cookTime}m</span>
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8 text-text-secondary">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">soup_kitchen</span>
                            <p>No matching recipes found.</p>
                        </div>
                    )}
                </div>

                {/* AI Tip / Fallback */}
                {/* Future: Add "Ask AI to generate one" button here */}
                <div className="mt-4 pt-4 border-t border-surface-border shrink-0 text-center">
                    <p className="text-xs text-text-secondary">
                        Tip: These are the best matches from your library.
                    </p>
                </div>

            </div>
        </div>
    );
}
