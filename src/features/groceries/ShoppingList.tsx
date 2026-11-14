import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/auth-context';
import { useAppStore } from '../../app/providers/store';
import { type GroceryItem } from './shoppingService';
import { parseGroceryInput, formatGroceryAmount } from '../../shared/ingredients';
import { formatDateKey, tryParseLocalDateKey } from '../../shared/date-utils';

export default function ShoppingList() {
    const { user } = useAuth();
    const {
        activePlan,
        groceryItems: items,
        loading: storeLoading,
        addGroceryItem,
        toggleGroceryCheck,
        deleteGroceryItem,
        clearCheckedGroceryItems
    } = useAppStore();
    const [quickAddText, setQuickAddText] = useState('');
    const addingRef = useRef(false);
    const [listError, setListError] = useState<string | null>(null);
    const clearingRef = useRef(false);
    const [clearing, setClearing] = useState(false);
    const tickedCount = items.filter(item => item.isChecked).length;
    const plannedMealsCount = activePlan?.days.reduce((sum, day) => sum + day.meals.length, 0) || 0;
    const dailyTarget = activePlan?.dailyTargets?.calories;
    // GA3: this is one list for all weeks. Its labels come from the plan its
    // generated items were made from, not always from this week's plan.
    const listPlanIds = new Set(items.filter(item => item.source === 'generated').map(item => item.mealPlanId));
    const listPlanId = listPlanIds.size === 1 ? [...listPlanIds][0] : undefined;
    // No generated items, or all of them from the active plan: as before.
    const listIsActivePlans = listPlanIds.size === 0 || (!!listPlanId && listPlanId === activePlan?.id);
    // A new week's plan is saved under its week start, so a date key names the week.
    const listWeek = listIsActivePlans ? activePlan?.weekStart : tryParseLocalDateKey(listPlanId) ? listPlanId : undefined;
    const listWeekDate = listWeek && formatDateKey(listWeek, { month: 'short', day: 'numeric' }, 'en-US');
    const weekLabel = listWeekDate ? `Week of ${listWeekDate}` : listIsActivePlans ? 'Manual list' : 'Shopping list';

    const handleQuickAdd = async () => {
        if (!user || addingRef.current) return;

        const parsed = parseGroceryInput(quickAddText);
        if (!parsed) {
            setListError('Enter a valid positive amount and grocery item.');
            return;
        }
        const { name, quantity, unit, aisle } = parsed;

        addingRef.current = true;
        try {
            const newItem: Omit<GroceryItem, 'id'> = {
                name,
                quantity,
                unit,
                aisle,
                isChecked: false,
                // AUD-092: GroceryItem.source is typed 'manual' | 'generated' and
                // the rules permit it, but this path never set it. It worked only
                // by accident: clearGeneratedGroceryItems filters on
                // source === 'generated', so undefined happened to survive. Any
                // future code filtering on 'manual' would have dropped every
                // hand-added item.
                source: 'manual'
            };
            const saved = await addGroceryItem(newItem);
            if (saved) {
                setListError(null);
                setQuickAddText(current => current === quickAddText ? '' : current);
            } else {
                setListError('Could not add that grocery item. Please try again.');
            }
        } catch (error) {
            console.error("Error adding item:", error);
            setListError('Could not add that grocery item. Please try again.');
        } finally {
            addingRef.current = false;
        }
    };

    const toggleItem = async (id: string, currentStatus: boolean) => {
        const saved = await toggleGroceryCheck(id, !currentStatus);
        setListError(saved ? null : 'Could not update that grocery item. Please try again.');
    };

    const handleDelete = async (id: string) => {
        const deleted = await deleteGroceryItem(id);
        setListError(deleted ? null : 'Could not delete that grocery item. Please try again.');
    };

    // N5: one question, then every ticked item is removed. The ref stops a second click that comes
    // before the page has drawn the disabled button.
    const handleClearTicked = async () => {
        if (clearingRef.current) return;
        if (!window.confirm(`Remove the ${tickedCount} ticked ${tickedCount === 1 ? 'item' : 'items'} from your list?`)) return;
        clearingRef.current = true;
        setClearing(true);
        const cleared = await clearCheckedGroceryItems();
        setListError(cleared ? null : 'Could not clear the ticked items. Please try again.');
        clearingRef.current = false;
        setClearing(false);
    };

    const categories = ['Produce', 'Proteins', 'Pantry', 'Dairy', 'Other'] as const;
    const getCategoryItems = (category: string) =>
        items.filter(item => item.aisle === category);

    if (storeLoading.initial) {
        return <div className="p-8 text-white">Loading list...</div>;
    }

    return (
        <div className="flex h-full">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Smart Grocery List</h1>
                        <p className="text-text-secondary">
                            {weekLabel} - <span className="text-primary">{listIsActivePlans ? activePlan?.goal || 'Manual grocery list' : 'From your meal plan'}</span>
                            {listIsActivePlans && activePlan && ` · ${plannedMealsCount} ${plannedMealsCount === 1 ? 'meal' : 'meals'} planned${dailyTarget ? ` · ${dailyTarget} kcal / day` : ''}`}
                            {' · '}
                            <Link to="/plan" className="text-primary underline hover:no-underline">View plan</Link>
                        </p>
                    </div>
                    {tickedCount > 0 && (
                        <button
                            onClick={handleClearTicked}
                            disabled={clearing}
                            className="min-h-11 bg-surface-dark text-white px-4 py-2 rounded-lg text-sm font-medium border border-surface-border hover:bg-surface-border/60 transition-colors disabled:opacity-60"
                        >
                            Clear ticked items ({tickedCount})
                        </button>
                    )}
                </div>

                {/* Quick Add */}
                <div className="flex gap-2 mb-6">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">+</span>
                        <input
                            type="text"
                            placeholder="Quick add item (e.g. 2 avocados)..."
                            className="w-full bg-surface-dark border border-surface-border text-white pl-8 pr-4 py-3 rounded-lg focus:outline-none focus:border-primary transition"
                            value={quickAddText}
                            onChange={(e) => setQuickAddText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                        />
                    </div>
                    <button
                        onClick={handleQuickAdd}
                        aria-label="Add grocery item"
                        className="px-4 bg-surface-dark border border-surface-border rounded-lg text-white hover:bg-surface-border/60 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>

                {listError && (
                    <div role="alert" className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {listError}
                    </div>
                )}

                {/* Categories */}
                <div className="space-y-6">
                    {items.length === 0 && (
                        <div className="text-center py-12 text-text-secondary">
                            <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
                            <p>Your grocery list is empty. Add items to get started!</p>
                        </div>
                    )}

                    {categories.map(category => {
                        const categoryItems = getCategoryItems(category);
                        if (categoryItems.length === 0) return null;

                        return (
                            <div key={category}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: '20px' }}>
                                            {category === 'Produce' ? 'eco' : category === 'Proteins' ? 'egg' : 'inventory_2'}
                                        </span>
                                        <h3 className="text-white font-semibold">{category}</h3>
                                    </div>
                                    <span className="text-xs text-text-secondary">{categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}</span>
                                </div>

                                <div className="space-y-2">
                                    {categoryItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-4 p-4 bg-surface-dark border border-surface-border rounded-xl transition-all group ${item.isChecked ? 'opacity-50' : 'hover:border-primary/30'
                                                }`}
                                        >
                                            <button
                                                onClick={() => item.id && toggleItem(item.id, item.isChecked)}
                                                aria-label={`${item.isChecked ? 'Mark as not purchased' : 'Mark as purchased'}: ${item.name}`}
                                                aria-pressed={item.isChecked}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${item.isChecked
                                                    ? 'bg-primary border-primary text-background-dark'
                                                    : 'border-surface-border hover:border-primary'
                                                    }`}
                                            >
                                                {item.isChecked && (
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                                                )}
                                            </button>
                                            <div className="flex-1">
                                                <h4 className={`font-medium ${item.isChecked ? 'line-through text-text-secondary' : 'text-white'}`}>
                                                    {item.name}
                                                </h4>
                                                <p className="text-xs text-text-secondary">{formatGroceryAmount(item.quantity, item.unit)}</p>
                                            </div>
                                            <button
                                                onClick={() => item.id && handleDelete(item.id)}
                                                aria-label={`Delete grocery item: ${item.name}`}
                                                className="[@media(hover:hover)]:opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
