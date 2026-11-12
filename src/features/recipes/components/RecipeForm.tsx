import { useState, useEffect, useId, useRef } from 'react';
import RecipeThumb from './RecipeThumb';
import { addRecipe, updateRecipe, type Recipe, type Ingredient } from '../recipeService';
import { useAuth } from '../../../app/providers/auth-context';
import { recipeFolders } from '../../../dev/mock/mock-data';
import { ALL_UNITS } from '../../../shared/constants';
import { trackSave } from '../../../shared/pending-saves';

interface RecipeFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (recipe: Recipe) => void;
    onPending?: (recipe: Recipe) => void;
    onSaveStarted?: (recipe: Recipe) => void;
    onSaveFailed?: (recipe: Recipe, active: boolean) => void;
    editRecipe?: Recipe | null;
}

const mealTypes = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'dinner', label: 'Dinner' },
    { id: 'snack', label: 'Snack' },
    { id: 'smoothie', label: 'Smoothie' },
] as const;

const presetTags = [
    'High Protein', 'Low Carb', 'Keto', 'Vegan', 'Vegetarian',
    'Gluten Free', 'Dairy Free', 'Quick & Easy', 'Meal Prep'
];

function readRecipeNumber(value: string, fallback: number, name: string, max: number, positive = false): number {
    const raw = value.trim();
    if (raw && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
        throw new Error(`${name} must be a number.`);
    }
    const number = raw === '' ? fallback : Number(raw);
    if (!Number.isFinite(number) || number < 0 || number > max || (positive && number === 0)) {
        throw new Error(`${name} must be ${positive ? 'greater than zero' : 'zero or greater'} and at most ${max}.`);
    }
    return number;
}

export default function RecipeForm({ isOpen, onClose, onSaved, onPending, onSaveStarted, onSaveFailed, editRecipe }: RecipeFormProps) {
    const { user } = useAuth();
    const formId = useId();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [initialSnapshot, setInitialSnapshot] = useState('');
    const versionRef = useRef(0);

    // Form state
    const [title, setTitle] = useState('');
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'smoothie'>('dinner');

    const [cookTime, setCookTime] = useState('30');
    const [servings, setServings] = useState('4');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [micronutrients, setMicronutrients] = useState({ vitaminA: '', vitaminC: '', calcium: '', iron: '' });
    const [imageUrl, setImageUrl] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

    // New State for Arrays
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<NonNullable<Recipe['instructions']>>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'instructions'>('details');

    // Reset form when opening or editing
    useEffect(() => {
        versionRef.current++;
        setSaving(false);
        setUploading(false);
        if (isOpen) {
            const initialValues = {
                title: editRecipe?.title ?? '',
                mealType: editRecipe?.mealType ?? 'dinner',
                cookTime: String(editRecipe?.cookTime ?? 30),
                // Imported drafts use zero for an unknown yield; keep the existing four-serving default.
                servings: String(editRecipe?.servings || 4),
                calories: editRecipe ? String(editRecipe.calories ?? 0) : '',
                protein: editRecipe ? String(editRecipe.protein ?? 0) : '',
                carbs: editRecipe ? String(editRecipe.carbs ?? 0) : '',
                fat: editRecipe ? String(editRecipe.fat ?? 0) : '',
                micronutrients: {
                    vitaminA: String(editRecipe?.micronutrients?.vitaminA ?? ''),
                    vitaminC: String(editRecipe?.micronutrients?.vitaminC ?? ''),
                    calcium: String(editRecipe?.micronutrients?.calcium ?? ''),
                    iron: String(editRecipe?.micronutrients?.iron ?? '')
                },
                imageUrl: editRecipe?.imageUrl || '',
                selectedTags: editRecipe?.tags || [],
                selectedFolders: editRecipe?.folders || [],
                ingredients: editRecipe?.ingredients || [],
                instructions: editRecipe?.instructions || [],
            };
            setInitialSnapshot(JSON.stringify(initialValues));
            setTitle(initialValues.title);
            setMealType(initialValues.mealType);
            setCookTime(initialValues.cookTime);
            setServings(initialValues.servings);
            setCalories(initialValues.calories);
            setProtein(initialValues.protein);
            setCarbs(initialValues.carbs);
            setFat(initialValues.fat);
            setMicronutrients(initialValues.micronutrients);
            setImageUrl(initialValues.imageUrl);
            setSelectedTags(initialValues.selectedTags);
            setSelectedFolders(initialValues.selectedFolders);
            setIngredients(initialValues.ingredients);
            setInstructions(initialValues.instructions);
        }
        setActiveTab('details');
    }, [isOpen, editRecipe]);

    const hasChanges = uploading || Boolean(editRecipe && !editRecipe.id) || JSON.stringify({
        title, mealType, cookTime, servings, calories, protein, carbs, fat,
        micronutrients, imageUrl, selectedTags, selectedFolders, ingredients, instructions,
    }) !== initialSnapshot;

    const handleClose = () => {
        if (!hasChanges || window.confirm('Discard this recipe?')) onClose();
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleFolder = (folderId: string) => {
        setSelectedFolders(prev =>
            prev.includes(folderId) ? prev.filter(f => f !== folderId) : [...prev, folderId]
        );
    };

    // Ingredient Handlers
    const addIngredient = () => setIngredients([...ingredients, { item: '', quantity: '', unit: '', amount: '' }]);

    const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    const addSwap = (index: number) => {
        const newIngredients = [...ingredients];
        const swaps = newIngredients[index].swaps || [];
        newIngredients[index] = { ...newIngredients[index], swaps: [...swaps, ''] };
        setIngredients(newIngredients);
    };

    const updateSwap = (ingIndex: number, swapIndex: number, value: string) => {
        const newIngredients = [...ingredients];
        const swaps = [...(newIngredients[ingIndex].swaps || [])];
        swaps[swapIndex] = value;
        newIngredients[ingIndex].swaps = swaps;
        setIngredients(newIngredients);
    };

    const removeSwap = (ingIndex: number, swapIndex: number) => {
        const newIngredients = [...ingredients];
        const swaps = [...(newIngredients[ingIndex].swaps || [])];
        newIngredients[ingIndex].swaps = swaps.filter((_, i) => i !== swapIndex);
        setIngredients(newIngredients);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    // Instruction Handlers
    const addInstruction = () => setInstructions([...instructions, { step: '', timer: 0 }]);
    const updateInstruction = (index: number, value: string) => {
        const newInstructions = [...instructions];
        newInstructions[index] = { ...newInstructions[index], step: value };
        setInstructions(newInstructions);
    };
    const removeInstruction = (index: number) => {
        setInstructions(instructions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title.trim() || saving || uploading) return;

        setSaving(true);
        const version = versionRef.current;
        let draft: Recipe | undefined;
        try {
            const recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
                title: title.trim(),
                mealType,

                cookTime: readRecipeNumber(cookTime, 30, 'Cook time', 1440),
                servings: readRecipeNumber(servings, 4, 'Servings', 100, true),
                calories: readRecipeNumber(calories, 0, 'Calories', 10000),
                protein: readRecipeNumber(protein, 0, 'Protein', 1000),
                carbs: readRecipeNumber(carbs, 0, 'Carbs', 1000),
                fat: readRecipeNumber(fat, 0, 'Fat', 1000),
                micronutrients: {
                    vitaminA: readRecipeNumber(micronutrients.vitaminA, 0, 'Vitamin A', 100000),
                    vitaminC: readRecipeNumber(micronutrients.vitaminC, 0, 'Vitamin C', 100000),
                    calcium: readRecipeNumber(micronutrients.calcium, 0, 'Calcium', 100000),
                    iron: readRecipeNumber(micronutrients.iron, 0, 'Iron', 100000)
                },
                // AUD-116: a blank field used to be saved as a third-party stock
                // photo, permanently, as though it were the user's own image.
                // Empty means empty; the UI renders a generated tint instead.
                imageUrl: imageUrl.trim(),
                tags: selectedTags,
                folders: selectedFolders,
                isFavorite: editRecipe?.isFavorite || false,
                source: editRecipe?.source || 'created',
                originalAssetUrl: editRecipe?.originalAssetUrl,
                originalAssetPath: editRecipe?.originalAssetPath,
                originalAssetType: editRecipe?.originalAssetType,
                ingredients: ingredients
                    .filter(i => i.item.trim() || i.amount) // Keep if item exists OR it's a legacy amount-only entry
                    .map(i => ({
                        ...i,
                        ...(i.swaps ? { swaps: i.swaps.filter(s => s.trim()) } : {}) // Keep absent legacy fields absent
                    })),
                instructions: instructions.filter(i => i.step.trim()).map(i => ({ ...i })),
            };

            const submitted: Recipe = { ...recipeData, id: editRecipe?.id };
            draft = submitted;
            onSaveStarted?.(submitted);
            const save = editRecipe?.id
                ? updateRecipe(user.uid, editRecipe.id, recipeData)
                : addRecipe(user.uid, recipeData);
            await trackSave<void | string>(save, () => {
                if (versionRef.current === version) {
                    if (onPending) onPending(submitted);
                    else onClose();
                }
            });

            onSaved(draft);
            if (versionRef.current === version) onClose();
        } catch (error) {
            console.error('Failed to save recipe:', error);
            const active = versionRef.current === version;
            if (draft) onSaveFailed?.(draft, active);
            if (active || !onSaveFailed) {
                alert("Failed to save recipe. Please try again.");
            }
        } finally {
            if (versionRef.current === version) setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => { if (!hasChanges) onClose(); }}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-background-dark rounded-2xl border border-surface-border shadow-2xl flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-background-dark border-b border-surface-border px-6 py-4 flex justify-between items-center z-10 shrink-0">
                    <h2 className="text-xl font-bold text-white">
                        {editRecipe ? 'Edit Recipe' : 'New Recipe'}
                    </h2>
                    <button
                        onClick={handleClose}
                        aria-label="Close recipe form"
                        className="text-text-secondary hover:text-white p-1"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 border-b border-surface-border px-3 sm:px-6 sticky top-[69px] bg-background-dark z-10 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`py-3 px-1 sm:px-4 text-xs sm:text-sm min-w-0 font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-white' : 'border-transparent text-text-secondary hover:text-white'}`}
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ingredients')}
                        className={`py-3 px-1 sm:px-4 text-xs sm:text-sm min-w-0 font-bold border-b-2 transition-colors flex flex-wrap items-center justify-center gap-1 ${activeTab === 'ingredients' ? 'border-primary text-white' : 'border-transparent text-text-secondary hover:text-white'}`}
                    >
                        Ingredients
                        {ingredients.length > 0 && <span className="bg-surface-border text-white text-[10px] px-1.5 py-0.5 rounded-full">{ingredients.length}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('instructions')}
                        className={`py-3 px-1 sm:px-4 text-xs sm:text-sm min-w-0 font-bold border-b-2 transition-colors flex flex-wrap items-center justify-center gap-1 ${activeTab === 'instructions' ? 'border-primary text-white' : 'border-transparent text-text-secondary hover:text-white'}`}
                    >
                        Instructions
                        {instructions.length > 0 && <span className="bg-surface-border text-white text-[10px] px-1.5 py-0.5 rounded-full">{instructions.length}</span>}
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label htmlFor={`${formId}-title`} className="block text-white font-medium mb-2">Recipe Name *</label>
                                <input
                                    id={`${formId}-title`}
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g., Mediterranean Chicken Bowl"
                                    className="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Meal Type */}
                            <div>
                                <p className="block text-white font-medium mb-2">Meal Type</p>
                                <div className="flex flex-wrap gap-2">
                                    {mealTypes.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setMealType(type.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mealType === type.id
                                                ? 'bg-primary text-background-dark'
                                                : 'bg-surface-dark border border-surface-border text-text-secondary hover:text-white'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cook Time & Servings */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label htmlFor={`${formId}-cook-time`} className="block text-white font-medium mb-2">Cook Time (minutes)</label>
                                    <input
                                        id={`${formId}-cook-time`}
                                        min={0} max={1440} step="any"
                                        type="number"
                                        value={cookTime}
                                        onChange={e => setCookTime(e.target.value)}
                                        placeholder="30"
                                        className="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor={`${formId}-servings`} className="block text-white font-medium mb-2">Servings</label>
                                    <div className="relative">
                                        <input
                                            id={`${formId}-servings`}
                                            min={0} max={100} step="any"
                                            type="number"
                                            value={servings}
                                            onChange={e => setServings(e.target.value)}
                                            placeholder="4"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-primary pr-10"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-text-secondary text-sm">ppl</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Macros Grid */}
                            <div>
                                <p className="block text-white font-medium mb-2">Nutrition (per serving)</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label htmlFor={`${formId}-calories`} className="block text-xs text-text-secondary mb-1">Calories</label>
                                        <input
                                            id={`${formId}-calories`}
                                            min={0} max={10000} step="any"
                                            type="number"
                                            value={calories}
                                            onChange={e => setCalories(e.target.value)}
                                            placeholder="450"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`${formId}-protein`} className="block text-xs text-text-secondary mb-1">Protein (g)</label>
                                        <input
                                            id={`${formId}-protein`}
                                            min={0} max={1000} step="any"
                                            type="number"
                                            value={protein}
                                            onChange={e => setProtein(e.target.value)}
                                            placeholder="35"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`${formId}-carbs`} className="block text-xs text-text-secondary mb-1">Carbs (g)</label>
                                        <input
                                            id={`${formId}-carbs`}
                                            min={0} max={1000} step="any"
                                            type="number"
                                            value={carbs}
                                            onChange={e => setCarbs(e.target.value)}
                                            placeholder="40"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`${formId}-fat`} className="block text-xs text-text-secondary mb-1">Fat (g)</label>
                                        <input
                                            id={`${formId}-fat`}
                                            min={0} max={1000} step="any"
                                            type="number"
                                            value={fat}
                                            onChange={e => setFat(e.target.value)}
                                            placeholder="15"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Micronutrients */}
                            <div>
                                <p className="block text-white font-medium mb-2">Micronutrients (% DV)</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label htmlFor={`${formId}-vitamin-a`} className="block text-xs text-text-secondary mb-1">Vit A</label>
                                        <input
                                            id={`${formId}-vitamin-a`}
                                            min={0} max={100000} step="any"
                                            type="number"
                                            value={micronutrients.vitaminA}
                                            onChange={e => setMicronutrients({ ...micronutrients, vitaminA: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`${formId}-vitamin-c`} className="block text-xs text-text-secondary mb-1">Vit C</label>
                                        <input
                                            id={`${formId}-vitamin-c`}
                                            min={0} max={100000} step="any"
                                            type="number"
                                            value={micronutrients.vitaminC}
                                            onChange={e => setMicronutrients({ ...micronutrients, vitaminC: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`${formId}-calcium`} className="block text-xs text-text-secondary mb-1">Calcium</label>
                                        <input
                                            id={`${formId}-calcium`}
                                            min={0} max={100000} step="any"
                                            type="number"
                                            value={micronutrients.calcium}
                                            onChange={e => setMicronutrients({ ...micronutrients, calcium: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`${formId}-iron`} className="block text-xs text-text-secondary mb-1">Iron</label>
                                        <input
                                            id={`${formId}-iron`}
                                            min={0} max={100000} step="any"
                                            type="number"
                                            value={micronutrients.iron}
                                            onChange={e => setMicronutrients({ ...micronutrients, iron: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image URL & Upload */}
                            <div>
                                <label htmlFor={`${formId}-image-url`} className="block text-white font-medium mb-2">Recipe Image</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        id={`${formId}-image-url`}
                                        type="url"
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="flex-1 bg-surface-dark border border-surface-border rounded-lg px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                    />
                                    <label className="flex items-center justify-center px-4 py-3 bg-surface-dark border border-surface-border rounded-lg cursor-pointer hover:border-primary hover:text-primary transition-all group">
                                        <input
                                            type="file"
                                            disabled={uploading}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file && user) {
                                                    const version = versionRef.current;
                                                    setUploading(true);
                                                    try {
                                                        // Reuse the service we refactored
                                                        const { uploadRecipeAsset } = await import('../recipeService');
                                                        const { url } = await uploadRecipeAsset(user.uid, file);
                                                        if (versionRef.current === version) setImageUrl(url);
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                        if (versionRef.current === version) alert("Failed to upload image");
                                                    } finally {
                                                        if (versionRef.current === version) setUploading(false);
                                                    }
                                                }
                                            }}
                                        />
                                        <span className="material-symbols-outlined text-text-secondary group-hover:text-primary">cloud_upload</span>
                                    </label>
                                </div>
                                {uploading && <p role="status" className="text-sm text-text-secondary">Uploading...</p>}
                                {imageUrl && (
                                    <div className="mt-2 w-full h-48 rounded-lg overflow-hidden bg-surface-dark relative group">
                                        <RecipeThumb
                                            title={title || 'Recipe'}
                                            imageUrl={imageUrl}
                                            macros={editRecipe ?? undefined}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            aria-label="Remove recipe image"
                                            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full [@media(hover:hover)]:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                )}
                                {editRecipe?.originalAssetUrl && (
                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={editRecipe.originalAssetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {editRecipe.originalAssetType === 'pdf' ? 'picture_as_pdf' : 'image'}
                                            </span>
                                            View Original Source File
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div>
                                <p className="block text-white font-medium mb-2">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {presetTags.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTags.includes(tag)
                                                ? 'bg-primary text-background-dark'
                                                : 'bg-surface-dark border border-surface-border text-text-secondary hover:text-white'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Collections / Categories */}
                            <div>
                                <p className="block text-white font-medium mb-2">Collections & Categories</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {recipeFolders.map(folder => (
                                        <button
                                            key={folder.id}
                                            type="button"
                                            onClick={() => toggleFolder(folder.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedFolders.includes(folder.id)
                                                ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(167,139,250,0.1)]'
                                                : 'bg-surface-dark border-surface-border text-text-secondary hover:border-primary/50 hover:text-white'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedFolders.includes(folder.id) ? 'bg-primary text-background-dark' : 'bg-surface-border/50'}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{folder.icon}</span>
                                            </div>
                                            <span className="text-sm font-medium">{folder.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INGREDIENTS TAB */}
                    {activeTab === 'ingredients' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="block text-white font-medium">Ingredients List</p>
                                <button
                                    type="button"
                                    onClick={addIngredient}
                                    className="text-primary text-sm font-bold hover:underline"
                                >
                                    + Add Item
                                </button>
                            </div>

                            {ingredients.length === 0 && (
                                <div className="text-center py-10 text-text-secondary border-2 border-dashed border-surface-border rounded-lg">
                                    No ingredients added yet.
                                </div>
                            )}

                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="bg-surface-dark border border-surface-border rounded-xl p-3 space-y-3">
                                    <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] sm:flex gap-2 items-start">
                                        {/* Quantity */}
                                        <div className="w-20 shrink-0">
                                            <label className="sr-only" htmlFor={`${formId}-ingredient-${idx}-quantity`}>Ingredient {idx + 1} quantity</label>
                                            <input
                                                id={`${formId}-ingredient-${idx}-quantity`}
                                                type="text"
                                                value={ing.quantity || ''}
                                                onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                                                placeholder="Qty"
                                                className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-text-secondary focus:border-primary text-center"
                                            />
                                        </div>

                                        {/* Unit */}
                                        <div className="col-span-2 min-w-0 sm:w-28 sm:shrink-0">
                                            <label className="sr-only" htmlFor={`${formId}-ingredient-${idx}-unit`}>Ingredient {idx + 1} unit</label>
                                            <select
                                                id={`${formId}-ingredient-${idx}-unit`}
                                                value={ing.unit || ''}
                                                onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                                                className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary appearance-none"
                                            >
                                                <option value="">Unit</option>
                                                {ALL_UNITS.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Item */}
                                        <div className="col-span-2 min-w-0 sm:flex-1">
                                            <label className="sr-only" htmlFor={`${formId}-ingredient-${idx}-name`}>Ingredient {idx + 1} name</label>
                                            <input
                                                id={`${formId}-ingredient-${idx}-name`}
                                                type="text"
                                                value={ing.item || ''} // Fallback for safety
                                                onChange={e => updateIngredient(idx, 'item', e.target.value)}
                                                placeholder={ing.amount ? `Legacy: ${ing.amount}` : "Ingredient Name"}
                                                className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-text-secondary focus:border-primary"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 shrink-0 mt-[1px]">
                                            <button
                                                type="button"
                                                onClick={() => addSwap(idx)}
                                                aria-label={`Add alternative for ingredient ${idx + 1}`}
                                                title="Add Swap/Alternative"
                                                className="p-2 text-text-secondary hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_horiz</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(idx)}
                                                aria-label={`Delete ingredient ${idx + 1}`}
                                                className="p-2 text-text-secondary hover:text-red-400"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Swaps Section */}
                                    {ing.swaps && ing.swaps.length > 0 && (
                                        <div className="pl-4 border-l-2 border-surface-border ml-2">
                                            <p className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Swaps / Alternatives</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ing.swaps.map((swap, sIdx) => (
                                                    <div key={sIdx} className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2 border border-surface-border">
                                                        <span className="material-symbols-outlined text-xs text-text-secondary">swap_horiz</span>
                                                        <label className="sr-only" htmlFor={`${formId}-ingredient-${idx}-alternative-${sIdx}`}>Ingredient {idx + 1} alternative {sIdx + 1}</label>
                                                        <input
                                                            id={`${formId}-ingredient-${idx}-alternative-${sIdx}`}
                                                            type="text"
                                                            value={swap}
                                                            onChange={e => updateSwap(idx, sIdx, e.target.value)}
                                                            className="bg-transparent border-none text-xs text-white placeholder-text-secondary/50 focus:outline-none w-32"
                                                            placeholder="Alternative item..."
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSwap(idx, sIdx)}
                                                            aria-label={`Remove alternative ${sIdx + 1} for ingredient ${idx + 1}`}
                                                            className="text-text-secondary hover:text-red-400"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* INSTRUCTIONS TAB */}
                    {activeTab === 'instructions' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="block text-white font-medium">Step-by-Step</p>
                                <button
                                    type="button"
                                    onClick={addInstruction}
                                    className="text-primary text-sm font-bold hover:underline"
                                >
                                    + Add Step
                                </button>
                            </div>

                            {instructions.length === 0 && (
                                <div className="text-center py-10 text-text-secondary border-2 border-dashed border-surface-border rounded-lg">
                                    No instructions added yet.
                                </div>
                            )}

                            {instructions.map((inst, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-surface-border text-xs flex items-center justify-center shrink-0 mt-2 text-white font-bold">
                                        {idx + 1}
                                    </div>
                                    <label className="sr-only" htmlFor={`${formId}-step-${idx}`}>Step {idx + 1}</label>
                                    <textarea
                                        id={`${formId}-step-${idx}`}
                                        value={inst.step}
                                        onChange={e => updateInstruction(idx, e.target.value)}
                                        placeholder={`Step ${idx + 1} details...`}
                                        className="flex-1 bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-text-secondary focus:border-primary min-h-[80px]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeInstruction(idx)}
                                        aria-label={`Delete instruction ${idx + 1}`}
                                        className="p-2 text-text-secondary hover:text-red-400 mt-2"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Submit Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-3 rounded-lg text-white font-medium hover:bg-surface-dark transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || uploading || !title.trim()}
                            className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors shadow-[0_0_15px_rgba(167,139,250,0.2)] disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                                    {editRecipe ? 'Save Changes' : 'Create Recipe'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
