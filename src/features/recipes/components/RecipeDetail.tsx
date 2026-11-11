import { useState } from 'react';
import { type Recipe } from '../recipeService';
import { SmartText } from '../../../shared/smart-text';
import { formatIngredientAmount, recipeServings } from '../../../shared/ingredients';
import RecipeThumb from './RecipeThumb';

interface RecipeDetailProps {
    recipe: Recipe;
    onClose: () => void;
    onStartCooking: (servings: number) => void;
}

export default function RecipeDetail({ recipe, onClose, onStartCooking }: RecipeDetailProps) {
    const baseServings = recipeServings(recipe.servings);
    const [servings, setServings] = useState(baseServings);
    const ratio = servings / baseServings;
    const scaledIngredients = (recipe.ingredients || []).map(ing => ({
        ...ing,
        display: `${formatIngredientAmount(ing, ratio)} ${ing.item}`.trim(),
    }));

    if (scaledIngredients.length === 0) {
        scaledIngredients.push({ item: "Ingredients not listed", display: "Ingredients not listed", quantity: '', unit: '' });
    }

    const steps = recipe.instructions?.length ? recipe.instructions.map((inst, i) => ({
        title: `Step ${i + 1}`,
        desc: inst.step
    })) : [
            { title: "No Instructions", desc: "No preparation steps available for this recipe." }
        ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background-light dark:bg-background-dark animate-in slide-in-from-bottom duration-300">
            <div className="flex min-h-screen">
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Back Button */}
                    <button
                        onClick={onClose}
                        aria-label="Close recipe details"
                        className="fixed top-6 left-6 z-50 bg-white/90 dark:bg-black/50 backdrop-blur p-2 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    <div className="max-w-[800px] mx-auto w-full px-6 lg:px-12 py-10 flex flex-col gap-10">
                        {/* Hero Section */}
                        <div className="relative group">
                            <RecipeThumb
                                title={recipe.title}
                                imageUrl={recipe.imageUrl}
                                macros={recipe}
                                className="w-full aspect-[16/9] object-cover rounded-xl shadow-2xl overflow-hidden"
                                initialClassName="text-6xl"
                            />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    disabled
                                    title="Favorite from recipe detail coming soon"
                                    aria-label="Favorite from recipe detail coming soon"
                                    className="size-10 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center cursor-not-allowed opacity-70"
                                >
                                    <span className="material-symbols-outlined text-rose-500">favorite</span>
                                </button>
                                <button
                                    disabled
                                    title="Recipe sharing coming soon"
                                    aria-label="Recipe sharing coming soon"
                                    className="size-10 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center cursor-not-allowed opacity-70"
                                >
                                    <span className="material-symbols-outlined text-gray-700">share</span>
                                </button>
                            </div>
                        </div>

                        {/* Title & Stats */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                <span className="px-4 py-1.5 rounded-full bg-primary/20 text-[#0d1b17] text-xs font-bold uppercase tracking-wider">High Protein</span>
                                <span className="px-4 py-1.5 rounded-full bg-background-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium dark:text-white">Quick Prep</span>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#0d1b17] dark:text-white tracking-tight leading-tight">
                                {recipe.title}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
                                {recipe.description || "A metabolism-boosting, nutrient-dense recipe designed for sustained energy."}
                            </p>
                        </div>

                        {/* Macro Snapshot */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.1em] mb-6">Macro Snapshot</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <MacroItem value={recipe.calories} label="Calories" color="bg-gray-400" percentage={100} />
                                <MacroItem value={`${recipe.protein}g`} label="Protein" color="bg-primary" percentage={85} />
                                <MacroItem value={`${recipe.carbs}g`} label="Carbs" color="bg-amber-500" percentage={30} />
                                <MacroItem value={`${recipe.fat}g`} label="Fats" color="bg-blue-500" percentage={45} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none flex items-center justify-center gap-6 sm:gap-12 text-black dark:text-white">
                                <div className="flex flex-col text-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Prep Time</span>
                                    <span className="text-lg font-bold">{recipe.cookTime || 15} Mins</span>
                                </div>
                                <div className="h-8 w-px bg-gray-100 dark:bg-gray-800"></div>
                                <div className="flex flex-col text-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Difficulty</span>
                                    <span className="text-lg font-bold">Medium</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col items-center gap-4">
                                <button
                                    onClick={() => onStartCooking(servings)}
                                    className="w-full max-w-sm py-4 bg-primary text-background-dark font-black rounded-full hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">play_circle</span>
                                    Start Guided Cooking
                                </button>
                                <button
                                    disabled
                                    title="Meal plan linking coming soon"
                                    className="w-full max-w-sm py-4 bg-background-light dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-full cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Add to Meal Plan Coming Soon
                                </button>
                            </div>
                        </div>

                        {/* Ingredients */}
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-4 text-black dark:text-white">
                                <h3 className="text-2xl font-bold">Ingredients</h3>
                                <div className="flex items-center gap-3">
                                    <button aria-label="Decrease servings" onClick={() => setServings(Math.max(1, servings - 1))} className="size-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">-</button>
                                    <span className="text-sm font-bold">{servings} Servings</span>
                                    <button aria-label="Increase servings" onClick={() => setServings(servings + 1)} className="size-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">+</button>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                {scaledIngredients.map((ing, i) => (
                                    <label key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition-all cursor-pointer group">
                                        <input className="size-6 rounded-full border-2 border-gray-200 text-primary focus:ring-primary" type="checkbox" />
                                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                                            {ing.display}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Preparation */}
                        <div className="flex flex-col gap-8 mb-20 text-black dark:text-white">
                            <h3 className="text-2xl font-bold border-b border-gray-100 dark:border-gray-800 pb-4">Preparation</h3>
                            <div className="flex flex-col gap-10">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="size-10 shrink-0 rounded-full bg-primary flex items-center justify-center font-black text-background-dark">{i + 1}</div>
                                        <div className="flex flex-col gap-2 pt-1">
                                            <h4 className="font-bold text-lg">{step.title}</h4>
                                            <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                                <SmartText text={step.desc} ingredients={scaledIngredients} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function MacroItem({ value, label, color, percentage }: { value: string | number; label: string; color: string; percentage: number }) {
    return (
        <div className="flex flex-col gap-1 text-black dark:text-white">
            <span className={`text-3xl font-black ${label === 'Calories' ? 'text-black dark:text-white' : label === 'Carbs' ? 'text-amber-500' : label === 'Fats' ? 'text-blue-500' : 'text-primary'}`}>{value}</span>
            <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
            <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`${color} h-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}
