import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/auth-context';
import { useAppStore } from '../../app/providers/store';
import { type GroceryItem } from './shoppingService';
import { parseGroceryInput, formatGroceryAmount } from '../../shared/ingredients';
import { formatDateKey } from '../../shared/date-utils';

export default function ShoppingList() {
    const { user } = useAuth();
    const {
        activePlan,
        groceryItems: items,
        loading: storeLoading,
        addGroceryItem,
        toggleGroceryCheck,
        deleteGroceryItem
    } = useAppStore();
    const [quickAddText, setQuickAddText] = useState('');
    const [listError, setListError] = useState<string | null>(null);
    const plannedMealsCount = activePlan?.days.reduce((sum, day) => sum + day.meals.length, 0) || 0;
    const dailyTarget = activePlan?.dailyTargets?.calories;
    const weekLabel = activePlan
        ? `Week of ${formatDateKey(activePlan.weekStart, { month: 'short', day: 'numeric' }, 'en-US')}`
        : 'Manual list';

    const handleQuickAdd = async () => {
        if (!user) return;

        const parsed = parseGroceryInput(quickAddText);
        if (!parsed) {
            setListError('Enter a valid positive amount and grocery item.');
            return;
        }
        const { name, quantity, unit, aisle } = parsed;

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
                setQuickAddText('');
            } else {
                setListError('Could not add that grocery item. Please try again.');
            }
        } catch (error) {
            console.error("Error adding item:", error);
            setListError('Could not add that grocery item. Please try again.');
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

    const categories = ['Produce', 'Proteins', 'Pantry', 'Dairy', 'Other'] as const;
    const getCategoryItems = (category: string) =>
        items.filter(item => item.aisle === category);

    if (storeLoading.initial) {
        return <div className="p-8 text-white">Loading list...</div>;
    }

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar-dark border-r border-surface-border p-4 hidden lg:flex flex-col shrink-0">
                {/* Meal Plan Source Card */}
                <div className="bg-surface-dark rounded-xl border border-surface-border p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        {/* AUD-091: was a decorative Unsplash photo, fetched on
                            every visit to this page. Now a local gradient. */}
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-surface-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary/70">restaurant_menu</span>
                        </div>
                        <span className="text-[10px] font-bold text-background-dark bg-primary px-2 py-0.5 rounded uppercase">Source</span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">Meal Plan Source</h4>
                    <p className="text-xs text-text-secondary mb-3">
                        {activePlan
                            ? `Generated from your active plan: ${activePlan.goal}.`
                            : 'No active meal plan is connected yet. You can still build a manual grocery list.'}
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restaurant</span>
                            <span className="text-white font-medium">{plannedMealsCount} Meals Planned</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <span className="text-xs">{activePlan ? 'From saved meal plan' : 'Manual items only'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_fire_department</span>
                            <span className="text-white font-medium">{dailyTarget ? `${dailyTarget} kcal / day` : 'No target connected'}</span>
                        </div>
                        <div className="text-xs text-text-secondary">{dailyTarget ? 'Average target' : 'Create or save a plan to connect targets'}</div>
                    </div>
                    <Link to="/plan" className="block w-full mt-4 text-primary text-xs font-medium hover:underline text-center">
                        View Full Meal Plan
                    </Link>
                </div>

                <div className="text-xs text-text-secondary flex items-center gap-2 mt-auto">
                    <span>Status</span>
                    <span className="text-primary font-medium">Local list ready</span>
                </div>

                {/* Bottom status */}
                <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center gap-2 text-primary text-xs font-medium mb-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                        {activePlan ? 'Meal Plan Connected' : 'Manual List Mode'}
                    </div>
                    <p className="text-[10px] text-text-secondary">
                        {activePlan ? 'Changes here update your shopping workflow.' : 'Add items manually or create a plan to generate a list later.'}
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Smart Grocery List</h1>
                        <p className="text-text-secondary">
                            {weekLabel} - <span className="text-primary">{activePlan?.goal || 'Manual grocery list'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            disabled
                            className="bg-surface-dark text-text-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-surface-border flex items-center gap-2 opacity-70 cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
                            Share Coming Soon
                        </button>
                    </div>
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

            {/* Right Sidebar - Checkout */}
            <aside className="w-64 bg-sidebar-dark border-l border-surface-border p-4 hidden xl:flex flex-col shrink-0">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-white font-semibold">Checkout</h3>
                        <span className="text-xs bg-primary text-background-dark px-2 py-0.5 rounded font-bold">Delivery</span>
                    </div>
                    <div className="text-center py-6">
                        <p className="text-xs text-text-secondary mb-1">Estimated Total</p>
                        <p className="text-3xl font-bold text-white">Unavailable</p>
                        <p className="text-xs text-text-secondary">Store pricing and checkout integrations are coming soon</p>
                    </div>

                    <button
                        disabled
                        className="w-full bg-primary/50 text-white font-bold py-3 rounded-lg mb-3 flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                    >
                        Checkout Coming Soon
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                    </button>

                    <button
                        disabled
                        className="w-full bg-surface-dark border border-surface-border text-text-secondary font-medium py-2 rounded-lg flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                        Print / PDF Coming Soon
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border">
                    <h4 className="text-sm font-semibold text-white mb-3">Store Availability</h4>
                    <p className="text-xs text-text-secondary">
                        Store matching and delivery availability are coming soon.
                    </p>
                </div>
            </aside>
        </div>
    );
}
