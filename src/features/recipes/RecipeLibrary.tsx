import RecipeThumb from './components/RecipeThumb';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { getDocsFromServer, query, orderBy, limit } from 'firebase/firestore';
import { AI_ENABLED, AI_PAUSED_HINT } from '../../shared/constants';
import { db, functions } from '../../services/firebase/firebase';
import { recipesCollection } from '../../services/firebase/paths';
import { recipeFolders } from '../../dev/mock/mock-data';
import { useAuth } from '../../app/providers/auth-context';
import { createAiCallableRequestId } from '../../services/aiSpendService';
import { deleteRecipeAsset, getRecipes, updateRecipe, deleteRecipe, uploadRecipeAsset, RECIPE_PAGE_SIZE, type Recipe } from './recipeService';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';
import GuidedCooking from './components/GuidedCooking';
import { trackSave } from '../../shared/pending-saves';

interface RecipeLibraryProps {
    initialAction?: 'import';
}

interface ParsedRecipeIngredient {
    item?: string;
    qty?: number | string;
    unit?: string;
}

interface ParsedRecipeData {
    title?: string;
    description?: string;
    mealType?: string;
    tags?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    ingredients?: ParsedRecipeIngredient[];
    instructions?: string[];
}

const recipeMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'smoothie'] as const;

function normalizeMealType(value: string | undefined): Recipe['mealType'] {
    const normalized = value?.toLowerCase();
    return recipeMealTypes.find(type => type === normalized) || 'dinner';
}

const filterChips = [
    { id: 'high-protein', label: 'High Protein' },
    { id: 'low-carb', label: 'Low Carb' },
    { id: 'under-30m', label: 'Under 30m' },
    { id: 'meal-prep', label: 'Meal Prep' },
];

const categoryTabs = [
    { id: 'all', label: 'All Recipes' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'my-creations', label: 'My Creations' },
    { id: 'imported', label: 'Imported' },
    { id: 'collections', label: 'Collections', icon: 'folder' },
];

export default function RecipeLibrary({ initialAction }: RecipeLibraryProps) {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

    // Recipe form modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [failedRecipeDrafts, setFailedRecipeDrafts] = useState<Recipe[]>([]);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New UI States
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [showGuidedCooking, setShowGuidedCooking] = useState(false);
    const [cookingServings, setCookingServings] = useState<number | undefined>();

    // Vision Import State
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [parsingStatus, setParsingStatus] = useState('');
    const [isAiSearch, setIsAiSearch] = useState(false);
    const [aiResults, setAiResults] = useState<Recipe[] | null>(null);
    // AUD-074: an inline, dismissible error for actions that used to fail silently.
    const [actionError, setActionError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingImportAssetPathRef = useRef<string | null>(null);

    const openNewRecipe = () => {
        setEditingRecipe(null);
        setIsFormOpen(true);
    };

    const isImportRoute = initialAction === 'import';

    const openEditRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsFormOpen(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        const isSupported = file && (file.type.startsWith('image/') || file.type === 'application/pdf');
        if (isSupported && user) {
            await processFile(file);
        } else if (file) {
            alert("Unsupported file type. Please upload an image or PDF.");
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const clearAiSearchResults = (clearTerm = false) => {
        if (clearTerm) {
            setSearchTerm('');
        }
        setAiResults(null);
        setIsAiSearch(false);
    };

    const handleSearchTermChange = (value: string) => {
        setSearchTerm(value);
        if (!value.trim()) {
            setAiResults(null);
        }
    };

    const handleCategoryTabClick = (tabId: string) => {
        setActiveTab(tabId);
        if (tabId !== 'collections') setSelectedFolder(null);
        if (aiResults || tabId === 'all') {
            clearAiSearchResults(tabId === 'all');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            await processFile(file);
        }
        e.target.value = '';
    };

    const processFile = async (file: File) => {
        if (!user) return;
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            alert("Unsupported file type. Please upload an image or PDF.");
            return;
        }

        setIsParsing(true);
        setParsingStatus('Uploading file...');
        let uploadedAsset: { url: string; storagePath: string } | null = null;
        try {
            // 1. Upload to Storage (Gemini logic needs the base64, but we want the URL for the recipe)
            uploadedAsset = await uploadRecipeAsset(user.uid, file);
            pendingImportAssetPathRef.current = uploadedAsset.storagePath;

            let imageUrl = '';
            if (file.type.startsWith('image/')) {
                imageUrl = uploadedAsset.url;
            }
            // AUD-072: every PDF import used to be given the SAME third-party
            // stock photo as its own picture. imageUrl stays empty for PDFs;
            // the card renders a generated tint instead.

            setParsingStatus('Analyzing recipe...');

            // 2. Wrap FileReader in a Promise to properly await it
            const recipeData = await new Promise<ParsedRecipeData>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const base64 = (reader.result as string).split(',')[1];
                        const mimeType = file.type;
                        const parseFn = httpsCallable<{ imageBase64: string; mimeType: string; requestId: string }, ParsedRecipeData>(functions, 'parseRecipeFromImage');

                        const result = await parseFn({
                            imageBase64: base64,
                            mimeType: mimeType,
                            requestId: createAiCallableRequestId('recipe-import')
                        });
                        resolve(result.data);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = () => reject(new Error("File reading failed"));
                reader.readAsDataURL(file);
            });

            setParsingStatus('Hydrating recipe details...');

            // 3. Transform to Recipe Schema
            const suggestedTags = recipeData.tags || ['Imported'];
            const suggestedMealType = normalizeMealType(recipeData.mealType);

            // Map tags to folders (e.g. if AI says "Meal Prep", check the folder)
            const availableFolders = ['breakfast', 'lunch', 'dinner', 'snack', 'smoothie', 'meal-prep', 'quick-easy', 'slow-cook'];
            const matchedFolders = suggestedTags
                .map((t: string) => t.toLowerCase().replace(/\s+/g, '-')) // "Meal Prep" -> "meal-prep"
                .filter((t: string) => availableFolders.includes(t));

            // Also auto-add the meal type to folders
            if (['breakfast', 'lunch', 'dinner'].includes(suggestedMealType)) {
                if (!matchedFolders.includes(suggestedMealType)) matchedFolders.push(suggestedMealType);
            }

            const draftRecipe: Recipe = {
                title: recipeData.title || 'Imported Recipe',
                description: recipeData.description,
                mealType: suggestedMealType,
                // AUD-071: these were hardcoded to 30 and 4 on every import, and
                // the parser's own values were discarded. A side effect was that
                // every imported recipe permanently matched the "Under 30m" chip.
                // 0 means "not read from the source" — the review form asks for it.
                cookTime: 0,
                servings: 0,
                calories: recipeData.calories || 0,
                protein: recipeData.protein || 0,
                carbs: recipeData.carbs || 0,
                fat: recipeData.fat || 0,
                imageUrl: imageUrl,
                originalAssetUrl: uploadedAsset.url,
                originalAssetPath: uploadedAsset.storagePath,
                originalAssetType: file.type === 'application/pdf' ? 'pdf' : 'image',
                tags: suggestedTags,
                folders: matchedFolders,
                isFavorite: false,
                source: 'imported',
                ingredients: recipeData.ingredients ? recipeData.ingredients.map((i) => ({
                    item: i.item || 'Imported ingredient',
                    quantity: String(i.qty || ''),
                    unit: i.unit || '',
                    amount: '' // Legacy fallback unused for new imports
                })) : [],
                instructions: recipeData.instructions ? recipeData.instructions.map((step: string) => ({ step, timer: 0 })) : []
            };

            // 4. Open Form
            setEditingRecipe(draftRecipe);
            setIsFormOpen(true);

        } catch (error) {
            console.error("Vision Import Failed:", error);
            if (uploadedAsset) {
                try {
                    await deleteRecipeAsset(uploadedAsset.storagePath);
                    if (pendingImportAssetPathRef.current === uploadedAsset.storagePath) {
                        pendingImportAssetPathRef.current = null;
                    }
                } catch (cleanupError) {
                    console.warn("Failed to clean up imported asset after parse failure:", cleanupError);
                }
            }
            alert("Failed to parse recipe. Please try again.");
        } finally {
            setIsParsing(false);
            setParsingStatus('');
        }
    };

    const handleRecipeSaved = async (recipe: Recipe) => {
        if (pendingImportAssetPathRef.current === recipe.originalAssetPath) {
            pendingImportAssetPathRef.current = null;
        }
        // Reload recipes from Firestore
        if (!user) return;
        try {
            const firestoreRecipes = await getRecipes(user.uid);
            setRecipes(firestoreRecipes);
            setLoadError(false);
        } catch (error) {
            console.error('Failed to reload recipes:', error);
        }
    };

    const handleRecipeSaveStarted = (recipe: Recipe) => {
        if (pendingImportAssetPathRef.current === recipe.originalAssetPath) {
            pendingImportAssetPathRef.current = null;
        }
    };

    const handleRecipePending = () => {
        setIsFormOpen(false);
        setEditingRecipe(null);
    };

    const handleRecipeSaveFailed = (recipe: Recipe, active: boolean) => {
        if (active) {
            if (!recipe.id) pendingImportAssetPathRef.current = recipe.originalAssetPath || null;
        } else {
            setFailedRecipeDrafts(previous => [...previous, recipe]);
        }
    };

    const handleRecipeFormClose = () => {
        const pendingPath = pendingImportAssetPathRef.current;
        pendingImportAssetPathRef.current = null;
        setIsFormOpen(false);
        setEditingRecipe(null);

        if (pendingPath) {
            void deleteRecipeAsset(pendingPath).catch((error) => {
                console.warn("Failed to clean up canceled import asset:", error);
            });
        }
    };

    const confirmDelete = (recipe: Recipe) => {
        setRecipeToDelete(recipe);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteRecipe = async () => {
        if (!user || !recipeToDelete || !recipeToDelete.id || isDeleting) return;
        setIsDeleting(true);
        try {
            await deleteRecipe(user.uid, recipeToDelete.id);
            setRecipes(prev => prev.filter(r => r.id !== recipeToDelete.id));
            setAiResults(prev => prev ? prev.filter(r => r.id !== recipeToDelete.id) : prev);
            if (selectedRecipe?.id === recipeToDelete.id) {
                setSelectedRecipe(null);
            }
            setIsDeleteModalOpen(false);
            setRecipeToDelete(null);
        } catch (error) {
            console.error('Failed to delete recipe:', error);
            // G-A: a delete the server never confirmed may still land later, so
            // this says what is known rather than claiming it failed.
            alert(`Could not confirm that "${recipeToDelete.title}" was deleted. Check your connection and try again.`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAiSearch = async () => {
        if (!user || !searchTerm.trim()) return;
        setLoading(true);
        try {
            const searchFn = httpsCallable(functions, 'semanticSearchRecipes');
            const result = await searchFn({
                query: searchTerm,
                requestId: createAiCallableRequestId('semantic-search'),
            });
            const data = result.data as { recipes: Recipe[] };
            setAiResults(data.recipes);
        } catch (error) {
            console.error('AI Search failed:', error);
            alert("AI search failed. Falling back to keyword search.");
            setIsAiSearch(false);
        } finally {
            setLoading(false);
        }
    };

    // Effect to clear AI results when search is empty or toggled off
    useEffect(() => {
        if (!searchTerm.trim() || !isAiSearch) {
            setAiResults(null);
        }
    }, [searchTerm, isAiSearch]);

    // Effect to trigger keyword search when AI search is off
    // Existing loading logic...

    // Load recipes from Firestore
    // AUD-050 / AUD-015: see Dashboard.
    useEffect(() => {
        let cancelled = false;

        async function loadRecipes() {
            if (!user) return;
            setLoading(true);
            setLoadError(false);
            try {
                let firestoreRecipes = await getRecipes(user.uid);
                if (firestoreRecipes.length === 0) {
                    const confirmation = await getDocsFromServer(query(
                        recipesCollection(db, user.uid),
                        orderBy('createdAt', 'desc'),
                        limit(RECIPE_PAGE_SIZE),
                    ));
                    firestoreRecipes = confirmation.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
                    if (!confirmation.empty) {
                        try {
                            firestoreRecipes = await getRecipes(user.uid);
                        } catch (error) {
                            console.warn('Could not load the full library. Showing confirmed recipes:', error);
                        }
                    }
                }
                if (cancelled) return;
                setRecipes(firestoreRecipes);
                setLoadError(false);
            } catch (error) {
                if (cancelled) return;
                console.error('Failed to load recipes:', error);
                setLoadError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadRecipes();

        return () => { cancelled = true; };
    }, [user, loadAttempt]);

    const toggleFavorite = async (recipeId: string) => {
        if (!user) return;
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const newFavoriteStatus = !recipe.isFavorite;
        const revert = () => setRecipes(prev => prev.map(r =>
            r.id === recipeId ? { ...r, isFavorite: recipe.isFavorite } : r
        ));

        setRecipes(prev => prev.map(r =>
            r.id === recipeId ? { ...r, isFavorite: newFavoriteStatus } : r
        ));

        // AUD-075: this used to consult the demo recipe list to decide whether
        // to persist. Every recipe in the library is now a real one.
        // AUD-074: and it had no try/catch, so a failed write left the heart
        // filled while nothing was saved -- it only vanished on reload, and the
        // unhandled rejection surfaced as a raw console error.
        if (!recipe.id) return;
        try {
            await trackSave(updateRecipe(user.uid, recipeId, { isFavorite: newFavoriteStatus }));
        } catch (error) {
            console.error('Failed to update favourite', error);
            revert();
            setActionError('Could not save that favourite. Please try again.');
        }
    };

    const toggleFilter = (filterId: string) => {
        setActiveFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    };

    const getRecipeCountForFolder = (folderId: string) => {
        return recipes.filter(r => r.folders.includes(folderId)).length;
    };

    const recipesToDisplay = aiResults || recipes;

    const filteredRecipes = recipesToDisplay.filter(r => {
        // If it's AI search, we already have the filtered results from the backend
        if (aiResults) return true;

        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
        const normalizedTags = (r.tags || []).map(tag => tag.toLowerCase());
        const normalizedFolders = (r.folders || []).map(folder => folder.toLowerCase());
        const matchesActiveFilters = activeFilters.every(filterId => {
            switch (filterId) {
                case 'high-protein':
                    return normalizedTags.includes('high protein') || r.protein >= 20;
                case 'low-carb':
                    return normalizedTags.includes('low carb') || (r.carbs > 0 && r.carbs < 50);
                case 'under-30m':
                    return r.cookTime <= 30;
                case 'meal-prep':
                    return normalizedTags.includes('meal prep') || normalizedFolders.includes('meal-prep');
                default:
                    return true;
            }
        });
        const matchesTab =
            activeTab === 'all' ? true :
                activeTab === 'favorites' ? r.isFavorite :
                    activeTab === 'my-creations' ? r.source === 'created' :
                        activeTab === 'imported' ? r.source === 'imported' :
                            activeTab === 'collections' && selectedFolder ? r.folders.includes(selectedFolder) : true;
        return matchesSearch && matchesTab && matchesActiveFilters;
    });

    const getFolderColor = (color: string) => {
        const colors: Record<string, string> = {
            'amber-400': 'bg-amber-400/20 text-amber-400',
            'blue-400': 'bg-blue-400/20 text-blue-400',
            'purple-400': 'bg-purple-400/20 text-purple-400',
            'orange-400': 'bg-orange-400/20 text-orange-400',
            'green-400': 'bg-green-400/20 text-green-400',
            'yellow-400': 'bg-yellow-400/20 text-yellow-400',
        };
        return colors[color] || 'bg-primary/20 text-primary';
    };

    return (
        <div
            data-testid="recipe-library-page"
            className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 lg:py-8 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {actionError && (
                <div
                    role="alert"
                    className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                >
                    <span>{actionError}</span>
                    <button
                        type="button"
                        onClick={() => setActionError(null)}
                        aria-label="Dismiss error"
                        className="text-red-200 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {failedRecipeDrafts.map((recipe, index) => (
                <div key={index} role="alert" className="mx-4 mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
                    <p>Could not save recipe &quot;{recipe.title}&quot;. Your draft is available to recover.</p>
                    <button className="mt-2 underline" onClick={() => {
                        setFailedRecipeDrafts(previous => previous.filter(item => item !== recipe));
                        if (!recipe.id) pendingImportAssetPathRef.current = recipe.originalAssetPath || null;
                        openEditRecipe(recipe);
                    }}>Recover recipe {recipe.title}</button>
                </div>
            ))}

            {/* Drag Overlay */}
            {(isDragging || isParsing) && (
                <div className="absolute inset-0 z-50 bg-background-dark/90 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-primary m-4 rounded-3xl animate-pulse">
                    <div className="bg-primary/20 p-8 rounded-full mb-6">
                        <span className="material-symbols-outlined text-primary text-6xl">
                            {isParsing ? 'auto_awesome' : 'cloud_upload'}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">
                        {isParsing ? 'Analyzing Recipe...' : 'Drop your Recipe Here'}
                    </h2>
                    <p className="text-xl text-text-secondary">
                        {isParsing ? parsingStatus : 'We will extract the data automatically'}
                    </p>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf"
            />

            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">My Kitchen</h1>
                        <p className="text-text-secondary text-base font-normal mt-1">
                            {isImportRoute
                                ? 'Import a recipe from an image or PDF, then review it before saving.'
                                : 'Manage your database. Create, import, and organize recipes.'}
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        {isImportRoute ? (
                            <button
                                onClick={handleFileClick}
                                disabled={!AI_ENABLED}
                                title={AI_ENABLED ? undefined : AI_PAUSED_HINT}
                                aria-label={AI_ENABLED ? 'Choose recipe file for Magic Import' : 'Magic Import is paused'}
                                className={`flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary/10 border border-primary/30 text-primary text-sm font-bold transition-all ${AI_ENABLED ? 'hover:bg-primary/20' : 'cursor-not-allowed opacity-70'}`}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_awesome</span>
                                <span className="hidden sm:inline">Magic Import</span>
                            </button>
                        ) : (
                            <Link
                                to="/recipes/import"
                                aria-label="Open Magic Import recipe upload page"
                                className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-sm font-bold transition-all"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_awesome</span>
                                <span className="hidden sm:inline">Magic Import</span>
                            </Link>
                        )}
                        <button
                            onClick={openNewRecipe}
                            aria-label="New Recipe"
                            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">add</span>
                            <span>New Recipe</span>
                        </button>
                    </div>
                </div>

                {isImportRoute && (
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Recipe Import</p>
                        <h2 className="text-xl font-bold text-white mb-2">Start with Magic Import</h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Upload a clear recipe photo or PDF. VioMacro will extract a draft so you can verify ingredients, instructions, and nutrition before it enters your kitchen.
                        </p>
                        <button
                            onClick={handleFileClick}
                            disabled={!AI_ENABLED}
                            title={AI_ENABLED ? undefined : AI_PAUSED_HINT}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold transition-all ${AI_ENABLED ? 'hover:bg-primary-hover' : 'cursor-not-allowed opacity-70'}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
                            {AI_ENABLED ? 'Choose recipe file' : 'Magic Import paused'}
                        </button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex flex-col gap-4">
                    <div className="border-b border-surface-border flex gap-6 overflow-x-auto scrollbar-hide">
                        {categoryTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleCategoryTabClick(tab.id)}
                                className={`pb-3 border-b-2 whitespace-nowrap px-1 transition-colors flex items-center gap-2 ${activeTab === tab.id
                                    ? 'border-primary text-white font-bold text-sm'
                                    : 'border-transparent text-text-secondary hover:text-white font-medium text-sm'
                                    }`}
                            >
                                {tab.icon && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Collections View */}
                    {activeTab === 'collections' && !selectedFolder && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2">
                            {recipeFolders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder.id)}
                                    className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface-dark border border-surface-border hover:border-primary/50 transition-all group cursor-pointer"
                                >
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getFolderColor(folder.color)} group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{folder.icon}</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-semibold text-sm">{folder.name}</p>
                                        <p className="text-text-secondary text-xs mt-1">{getRecipeCountForFolder(folder.id)} recipes</p>
                                    </div>
                                </button>
                            ))}
                            {/* Add New Folder */}
                            <button
                                disabled
                                title="Custom recipe folders coming soon"
                                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-surface-border cursor-not-allowed min-h-[140px] opacity-70"
                            >
                                <div className="w-12 h-12 rounded-full bg-surface-border flex items-center justify-center">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
                                </div>
                                <p className="text-text-secondary text-sm font-medium">New Folder Coming Soon</p>
                            </button>
                        </div>
                    )}

                    {/* Folder Breadcrumb */}
                    {activeTab === 'collections' && selectedFolder && (
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => setSelectedFolder(null)}
                                className="text-text-secondary hover:text-primary text-sm flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                                Collections
                            </button>
                            <span className="text-surface-border">/</span>
                            <span className="text-white font-medium text-sm">
                                {recipeFolders.find(f => f.id === selectedFolder)?.name}
                            </span>
                        </div>
                    )}

                    {/* Search & Filters (not shown for collections grid) */}
                    {(activeTab !== 'collections' || selectedFolder) && (
                        <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between mt-2">
                            <div className="w-full xl:max-w-md">
                                <label className="flex flex-col h-11 w-full group relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary">
                                        <span className="material-symbols-outlined">{isAiSearch ? 'auto_awesome' : 'search'}</span>
                                    </div>
                                    <input
                                        className={`block w-full rounded-lg bg-surface-dark border text-white placeholder-text-secondary pl-10 pr-44 h-full text-sm transition-all ${isAiSearch ? 'border-primary ring-1 ring-primary' : 'border-surface-border focus:border-primary focus:ring-1 focus:ring-primary'}`}
                                        placeholder={isAiSearch ? "Describe what you want (e.g. high-protein chicken for summer)..." : "Search recipes, ingredients..."}
                                        value={searchTerm}
                                        onChange={(e) => handleSearchTermChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && isAiSearch && handleAiSearch()}
                                    />
                                    <div className="absolute inset-y-0 right-1 flex items-center gap-1 p-1">
                                        {(searchTerm || aiResults) && (
                                            <button
                                                onClick={() => {
                                                    clearAiSearchResults(true);
                                                }}
                                                aria-label="Clear recipe search"
                                                className="h-full w-8 rounded-md flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsAiSearch(!isAiSearch)}
                                            aria-pressed={AI_ENABLED ? isAiSearch : false}
                                            disabled={!AI_ENABLED}
                                            className={`h-full px-3 rounded-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all ${!AI_ENABLED ? 'bg-white/5 text-text-secondary cursor-not-allowed opacity-70' : isAiSearch ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'}`}
                                            title={AI_ENABLED ? 'Toggle AI Smart Search' : AI_PAUSED_HINT}
                                        >
                                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                            AI Search
                                        </button>
                                        {AI_ENABLED && isAiSearch && (
                                            <button
                                                onClick={handleAiSearch}
                                                aria-label="Run AI recipe search"
                                                className="h-full px-3 bg-white text-background-dark rounded-md flex items-center justify-center hover:bg-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                            </button>
                                        )}
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide items-center">
                                {/* Macro Filters */}
                                <div className="flex shrink-0 items-center gap-2 pr-2 mr-2 border-r border-surface-border">
                                    <button
                                        disabled
                                        title="Macro filters coming soon"
                                        className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-surface-dark border border-surface-border px-3 cursor-not-allowed opacity-70"
                                    >
                                        <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">Protein: 20g+</span>
                                    </button>
                                    <button
                                        disabled
                                        title="Macro filters coming soon"
                                        className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-surface-dark border border-surface-border px-3 cursor-not-allowed opacity-70"
                                    >
                                        <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">Carbs: &lt;50g</span>
                                    </button>
                                </div>

                                {/* Tag Chips */}
                                {filterChips.map(chip => (
                                    <button
                                        key={chip.id}
                                        onClick={() => toggleFilter(chip.id)}
                                        className={`flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg px-3 transition-colors ${activeFilters.includes(chip.id)
                                            ? 'bg-primary/20 border border-primary/30 hover:bg-primary/30'
                                            : 'bg-surface-dark border border-surface-border hover:border-text-secondary'
                                            }`}
                                    >
                                        <span className={`text-sm font-medium ${activeFilters.includes(chip.id) ? 'text-primary font-bold' : 'text-white'}`}>
                                            {chip.label}
                                        </span>
                                        {activeFilters.includes(chip.id) && (
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>close</span>
                                        )}
                                    </button>
                                ))}

                                <button
                                    disabled
                                    title="Advanced filters coming soon"
                                    aria-label="Advanced filters coming soon"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-dark border border-surface-border ml-2 text-text-secondary cursor-not-allowed opacity-70"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recipe Grid (only show when not on collections grid view) */}
                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && loadError && recipes.length === 0 && (
                    <div role="alert" className="text-center py-20 border-2 border-dashed border-surface-border rounded-xl">
                        <h3 className="text-xl font-semibold text-white mb-6">Could not load your recipes</h3>
                        <button
                            type="button"
                            onClick={() => setLoadAttempt(attempt => attempt + 1)}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Recipe Grid (only show when not on collections grid view and not loading) */}
                {!loading && (!loadError || recipes.length > 0) && (activeTab !== 'collections' || selectedFolder) && (
                    <>
                        {filteredRecipes.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-surface-border rounded-xl">
                                <div className="w-16 h-16 bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: '32px' }}>menu_book</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No recipes found</h3>
                                <p className="text-text-secondary mb-6">Try adjusting your filters or add a new recipe.</p>
                                <Link to="/recipes/import" className="text-primary hover:text-primary-hover font-medium inline-flex items-center gap-1">
                                    Import your first recipe
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredRecipes.map((recipe) => (
                                    <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="group flex flex-col rounded-xl bg-surface-dark border border-surface-border overflow-hidden hover:border-primary/50 hover:shadow-[0_0_20px_rgba(167,139,250,0.1)] transition-all duration-300 cursor-pointer">
                                        {/* Image */}
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-800">
                                            <div className="absolute right-3 top-3 z-10 flex gap-2">
                                                <div className="rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>timer</span>
                                                    {recipe.cookTime}m
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (recipe.id) void toggleFavorite(recipe.id); }}
                                                aria-label={`${recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}: ${recipe.title}`}
                                                className="absolute left-3 top-3 z-10 opacity-100"
                                            >
                                                <div className={`rounded-full p-2 shadow-lg transition-colors ${recipe.isFavorite ? 'bg-primary/20 text-primary' : 'bg-surface-dark text-white hover:text-primary'}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>favorite</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditRecipe(recipe); }}
                                                aria-label={`Edit recipe: ${recipe.title}`}
                                                className="absolute left-14 top-3 z-10 opacity-100"
                                            >
                                                <div className="rounded-full p-2 shadow-lg bg-surface-dark text-white hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(recipe); }}
                                                aria-label={`Delete recipe: ${recipe.title}`}
                                                className="absolute left-[100px] top-3 z-10 opacity-100"
                                            >
                                                <div className="rounded-full p-2 shadow-lg bg-surface-dark text-white hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                                </div>
                                            </button>
                                            <RecipeThumb
                                                title={recipe.title}
                                                imageUrl={recipe.imageUrl}
                                                macros={recipe}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-60"></div>
                                        </div>
                                        {/* Content */}
                                        <div className="flex flex-col gap-3 p-4 flex-1">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{recipe.title}</h3>
                                                <p className="text-xs text-text-secondary mt-1 capitalize">{recipe.mealType} • {recipe.tags[0]}</p>
                                            </div>
                                            {/* Macros */}
                                            <div className="mt-auto pt-3 border-t border-surface-border">
                                                <div className="grid grid-cols-4 divide-x divide-surface-border text-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white">{recipe.calories}</span>
                                                        <span className="text-[10px] text-text-secondary uppercase">kcal</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary">{recipe.protein}g</span>
                                                        <span className="text-[10px] text-text-secondary uppercase">P</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white">{recipe.carbs}g</span>
                                                        <span className="text-[10px] text-text-secondary uppercase">C</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white">{recipe.fat}g</span>
                                                        <span className="text-[10px] text-text-secondary uppercase">F</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Add New Recipe Card */}
                                <button
                                    onClick={openNewRecipe}
                                    aria-label="Add New Recipe"
                                    className="group flex flex-col items-center justify-center rounded-xl bg-surface-dark/30 border-2 border-dashed border-surface-border min-h-[300px] hover:border-primary hover:bg-surface-dark/50 transition-all cursor-pointer w-full text-left"
                                >
                                    <div className="flex flex-col items-center gap-4 text-center p-6">
                                        <div className="h-14 w-14 rounded-full bg-surface-border flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: '32px' }} aria-hidden="true">add</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Add New Recipe</h3>
                                            <p className="text-sm text-text-secondary mt-1">{AI_ENABLED ? 'Create manually or import' : 'Create manually'}</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Recipe Form Modal */}
            <RecipeForm
                isOpen={isFormOpen}
                onClose={handleRecipeFormClose}
                onSaved={handleRecipeSaved}
                onPending={handleRecipePending}
                onSaveStarted={handleRecipeSaveStarted}
                onSaveFailed={handleRecipeSaveFailed}
                editRecipe={editingRecipe}
            />

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

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-background-dark border border-surface-border rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Recipe?</h3>
                        <p className="text-text-secondary mb-6">
                            Are you sure you want to delete "{recipeToDelete?.title}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-white font-medium hover:bg-surface-dark border border-transparent hover:border-surface-border transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRecipe}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 font-bold transition-colors disabled:opacity-60 disabled:cursor-wait"
                            >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
