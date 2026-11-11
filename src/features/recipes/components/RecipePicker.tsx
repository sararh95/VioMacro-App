import RecipeThumb from './RecipeThumb';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type Recipe, getRecipes } from '../recipeService';
import { useAuth } from '../../../app/providers/auth-context';

interface RecipePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (recipe: Recipe) => void;
    title?: string;
    filterMealType?: string; // e.g. 'breakfast'
}

export default function RecipePicker({ isOpen, onClose, onSelect, title, filterMealType }: RecipePickerProps) {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // AUD-030: a failed read used to be answered with 11 demo recipes, so the
    // user could add food they do not own to a real plan. An empty library is
    // now empty and a failed read now says so.
    useEffect(() => {
        if (!isOpen || !user) return;
        let cancelled = false;

        async function load() {
            setLoading(true);
            setLoadError(null);
            try {
                const all = await getRecipes(user!.uid);
                if (cancelled) return;
                setRecipes(all);
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to load recipes for picker', err);
                setRecipes([]);
                setLoadError('We could not load your recipes. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [isOpen, user, reloadToken]);

    const filteredRecipes = recipes.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterMealType ? r.mealType === filterMealType : true;
        return matchesSearch && matchesType;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-surface-dark border border-surface-border rounded-xl shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-border bg-surface-dark rounded-t-xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{title || 'Select Recipe'}</h2>
                        <p className="text-sm text-text-secondary">
                            {filterMealType ? `Showing ${filterMealType} options` : 'All recipes'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close recipe picker"
                        className="p-2 hover:bg-surface-border rounded-lg text-text-secondary hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-surface-border shrink-0 bg-surface-dark">
                    <label className="flex flex-col h-10 w-full group relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            autoFocus
                            className="block w-full rounded-lg bg-surface-dark border border-surface-border text-white placeholder-text-secondary pl-10 pr-4 h-full text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : loadError ? (
                        <div role="alert" className="col-span-full text-center py-10">
                            <p className="text-red-200 mb-4">{loadError}</p>
                            <button
                                type="button"
                                onClick={() => setReloadToken((n) => n + 1)}
                                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-50 hover:bg-red-500/30 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-text-secondary">
                            <span className="material-symbols-outlined text-4xl mb-2 block">menu_book</span>
                            <p className="text-white font-medium mb-1">Your recipe library is empty</p>
                            <p className="text-xs mb-4">Add a recipe first, then you can add it to a plan.</p>
                            <Link
                                to="/recipes"
                                onClick={onClose}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                                Go to Recipes
                            </Link>
                        </div>
                    ) : filteredRecipes.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-text-secondary">
                            No recipes match that search.
                        </div>
                    ) : (
                        filteredRecipes.map(recipe => (
                            <div
                                key={recipe.id}
                                onClick={() => onSelect(recipe)}
                                className="group flex flex-col rounded-lg bg-surface-dark border border-surface-border overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer ring-1 ring-transparent hover:ring-primary/50"
                            >
                                <div className="relative aspect-video w-full overflow-hidden bg-gray-800">
                                    <RecipeThumb
                                        title={recipe.title}
                                        imageUrl={recipe.imageUrl}
                                        macros={recipe}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute bottom-2 right-2 text-xs font-bold text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md">
                                        {recipe.calories} kcal
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-bold text-white group-hover:text-primary line-clamp-1">{recipe.title}</h3>
                                    <div className="flex gap-2 mt-2 text-xs text-text-secondary">
                                        <span>{recipe.protein}g P</span>
                                        <span>{recipe.carbs}g C</span>
                                        <span>{recipe.fat}g F</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
