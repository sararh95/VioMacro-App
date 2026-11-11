import { parsePantryLines } from './pantry-parse';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../app/providers/auth-context';
import { trackSave } from '../../shared/pending-saves';
import {
    getPantryItems,
    addPantryItems,
    deletePantryItem,
    type PantryItem
} from './pantryService';

const categories = ['All Items', 'Proteins', 'Produce', 'Grains', 'Freezer', 'Fridge'];
const PANTRY_LOAD_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
            reject(new Error(`${label} timed out. Please check the local services and try again.`));
        }, ms);

        promise
            .then((value) => {
                window.clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                window.clearTimeout(timer);
                reject(error);
            });
    });
}

export default function Pantry() {
    const { user } = useAuth();
    const [items, setItems] = useState<PantryItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('All Items');
    const [searchTerm, setSearchTerm] = useState('');
    const [quickAddText, setQuickAddText] = useState('');
    const [quickAddError, setQuickAddError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const loadItems = useCallback(async () => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        try {
            const data = await withTimeout(
                getPantryItems(user.uid),
                PANTRY_LOAD_TIMEOUT_MS,
                'Loading pantry'
            );
            setItems(data);
        } catch (error) {
            console.error("Error loading pantry:", error);
            setLoadError("Could not load your pantry. Check the local emulator connection, then try again.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        void loadItems();
    }, [user, loadItems]);

    const handleQuickAdd = async () => {
        if (!user) return;

        // AUD-098: parse everything first, then write once.
        //
        // This used to be one loop with an await inside it, so ten pasted lines
        // were ten sequential round trips -- and a failure on line seven left six
        // items saved, three missing, and an error message that could not say
        // which. Parsing is now a pure function (src/features/pantry/pantry-parse.ts) with
        // tests of its own, and the write is a single atomic batch.
        const items = parsePantryLines(quickAddText);

        if (items.length === 0) {
            setQuickAddError('Nothing to add. Type one item per line, for example "200g Greek Yogurt".');
            return;
        }

        setQuickAddError(null);
        setLoadError(null);

        try {
            await addPantryItems(user.uid, items);
            setQuickAddText('');
        } catch (err) {
            console.error('Failed to add pantry items:', err);
            // Atomic, so this really does mean none of them saved. Keeping the
            // text lets the user retry without retyping.
            setLoadError('Could not save those pantry items. Nothing was added, so you can try again.');
        }

        void loadItems();
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        setItems(prev => prev.filter(i => i.id !== id));
        try {
            await trackSave(deletePantryItem(user.uid, id));
        } catch (error) {
            console.error("Error deleting:", error);
            setLoadError("Could not delete that pantry item. The list was refreshed.");
            void loadItems();
        }
    };

    const filteredItems = items.filter(item => {
        const matchesCategory = activeCategory === 'All Items' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) return <div className="p-8 text-white">Loading pantry...</div>;
    if (loadError) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-xl bg-surface-dark border border-surface-border rounded-xl p-6">
                    <p className="text-xs text-primary font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>inventory_2</span>
                        Inventory Management
                    </p>
                    <h1 className="text-3xl font-bold text-white mb-3">My Pantry</h1>
                    <p className="text-text-secondary mb-5">{loadError}</p>
                    <button
                        onClick={loadItems}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>inventory_2</span>
                        Inventory Management
                    </p>
                    <h1 className="text-3xl font-bold text-white mb-2">My Pantry</h1>
                    <p className="text-text-secondary">
                        Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        disabled
                        className="bg-surface-dark text-text-secondary px-4 py-2 rounded-lg text-sm font-medium border border-surface-border flex items-center gap-2 opacity-60 cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_scanner</span>
                        Scan Coming Soon
                    </button>
                    <button
                        disabled
                        className="bg-primary/50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/10 opacity-70 cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Full Pantry Coming Soon
                    </button>
                </div>
            </div>

            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-text-secondary">
                <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>construction</span>
                    Coming Soon
                </div>
                <p>
                    This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon="inventory_2" label="Total Items" value={items.length.toString()} />
                <StatCard icon="warning" label="Low Stock" value={items.filter(i => i.isLowStock).length.toString()} alert={items.some(i => i.isLowStock) ? "Action needed" : undefined} />
                <StatCard icon="schedule" label="Expiring Soon" value="Soon" subtitle="Expiry tracking is not live yet" />
                <StatCard icon="restaurant" label="Meals Possible" value="Soon" subtitle="Recipe matching is not live yet" />
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" style={{ fontSize: '20px' }}>search</span>
                    <input
                        type="text"
                        placeholder="Search prototype pantry entries (e.g. 'Oats', 'Chicken')"
                        className="w-full bg-surface-dark border border-surface-border text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-primary transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    disabled
                    className="bg-surface-dark border border-surface-border text-text-secondary px-4 py-2 rounded-lg flex items-center gap-2 opacity-60 cursor-not-allowed"
                    title="Keyboard shortcuts are coming soon"
                >
                    Shortcut Coming Soon
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        aria-pressed={activeCategory === cat}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeCategory === cat
                            ? 'bg-primary text-background-dark'
                            : 'bg-surface-dark text-gray-400 border border-surface-border hover:border-primary/50'
                            }`}
                    >
                        {cat !== 'All Items' && (
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                {cat === 'Proteins' ? 'egg' : cat === 'Produce' ? 'nutrition' : cat === 'Grains' ? 'grain' : cat === 'Freezer' ? 'ac_unit' : 'kitchen'}
                            </span>
                        )}
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items Table */}
                <div className="lg:col-span-2">
                    <div className="bg-surface-dark border border-surface-border rounded-xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-sidebar-dark text-xs text-text-secondary uppercase tracking-wider font-bold">
                            <div className="col-span-4">Item Details</div>
                            <div className="col-span-2">Qty</div>
                            <div className="col-span-3">Expiry</div>
                            <div className="col-span-3">Actions</div>
                        </div>

                        {/* Items */}
                        {filteredItems.length === 0 && (
                            <div className="p-8 text-center text-text-secondary">
                                Pantry inventory is coming soon. You can test quick-add entries here while the full pantry workflow is under development.
                            </div>
                        )}

                        {filteredItems.map(item => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-4 border-t border-surface-border items-center hover:bg-background-dark/30 transition-colors">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-surface-border rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: '20px' }}>
                                            {item.category === 'Proteins' ? 'egg' : item.category === 'Produce' ? 'nutrition' : 'grain'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{item.name}</p>
                                        <div className="flex gap-1 mt-1">
                                            {item.isLowStock && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Low Stock</span>
                                            )}
                                            {item.category && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-border text-text-secondary">{item.category}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <button
                                        disabled
                                        aria-label={`Decrease quantity for ${item.name} (coming soon)`}
                                        className="text-text-secondary opacity-50 cursor-not-allowed"
                                        title="Quantity editing is coming soon"
                                    >
                                        -
                                    </button>
                                    <span className="text-white font-medium">{item.quantity} <span className="text-xs text-text-secondary">{item.unit}</span></span>
                                    <button
                                        disabled
                                        aria-label={`Increase quantity for ${item.name} (coming soon)`}
                                        className="text-text-secondary opacity-50 cursor-not-allowed"
                                        title="Quantity editing is coming soon"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="col-span-3">
                                    <p className="text-xs text-primary">
                                        {item.expiresAt || 'No expiry'}
                                    </p>
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <button
                                        disabled
                                        aria-label={`Edit pantry item: ${item.name} (coming soon)`}
                                        className="p-2 rounded-lg text-text-secondary opacity-50 cursor-not-allowed"
                                        title="Item editing is coming soon"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                    </button>
                                    <button
                                        onClick={() => item.id && handleDelete(item.id)}
                                        aria-label={`Delete pantry item: ${item.name}`}
                                        className="p-2 hover:bg-surface-border rounded-lg text-text-secondary hover:text-red-400 transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-surface-border flex justify-between items-center">
                            <span className="text-xs text-text-secondary">Showing {filteredItems.length} items</span>
                            <div className="flex gap-2">
                                <button
                                    disabled
                                    aria-label="Previous pantry page (coming soon)"
                                    className="px-3 py-1 bg-surface-border rounded text-text-secondary text-sm opacity-60 cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled
                                    aria-label="Next pantry page (coming soon)"
                                    className="px-3 py-1 bg-surface-border rounded text-text-secondary text-sm opacity-60 cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Coming soon - AI Suggestion */}
                    <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>auto_awesome</span>
                            <span className="text-xs text-primary font-medium uppercase tracking-wider">VioMacro AI</span>
                        </div>
                        <h4 className="text-white font-semibold mb-2">Pantry Suggestions Coming Soon</h4>
                        <p className="text-sm text-text-secondary mb-4">
                            Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data.
                        </p>
                        <button
                            disabled
                            aria-label="Pantry AI suggestions coming soon"
                            className="w-full bg-primary/50 text-white font-bold py-2 rounded-lg opacity-70 cursor-not-allowed"
                        >
                            Coming Soon
                        </button>
                    </div>

                    {/* Quick Add */}
                    <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-3">Quick Add</h4>
                        <p className="text-xs text-text-secondary mb-3">
                            Prototype only: paste a few items to test the future pantry entry flow.
                        </p>
                        {quickAddError && <p role="alert" className="mb-3 text-sm text-red-300">{quickAddError}</p>}
                        <textarea
                            className="w-full bg-background-dark border border-surface-border rounded-lg p-3 text-sm text-white placeholder-text-secondary resize-none h-24 focus:outline-none focus:border-primary"
                            placeholder={"e.g.\n200g Greek Yogurt\n1kg Oats\n12 Eggs"}
                            value={quickAddText}
                            onChange={(e) => setQuickAddText(e.target.value)}
                        />
                        <button
                            onClick={handleQuickAdd}
                            className="w-full mt-3 bg-surface-border hover:bg-surface-border/80 text-white font-medium py-2 rounded-lg transition-colors"
                        >
                            Process Items
                        </button>
                    </div>
                    <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-white font-semibold">Shopping List</h4>
                            <button
                                disabled
                                aria-label="Pantry-to-shopping-list suggestions coming soon"
                                className="text-xs text-text-secondary font-medium cursor-not-allowed"
                            >
                                Coming Soon
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary">
                            Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, alert, subtitle, link }: {
    icon: string;
    label: string;
    value: string;
    alert?: string;
    subtitle?: string;
    link?: string;
}) {
    const isComingSoonMetric = label === 'Expiring Soon' || label === 'Meals Possible';
    const displayValue = isComingSoonMetric ? 'Soon' : value;
    const displaySubtitle = isComingSoonMetric
        ? label === 'Expiring Soon'
            ? 'Expiry tracking is not live yet'
            : 'Recipe matching is not live yet'
        : subtitle;
    const displayLink = isComingSoonMetric ? undefined : link;

    return (
        <div
            className="bg-surface-dark border border-surface-border rounded-xl p-4"
            aria-label={`${label}: ${displayValue}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${alert ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
                </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{displayValue}</p>
            <p className="text-sm text-text-secondary">{label}</p>
            {alert && <p className="text-xs text-amber-400 mt-1">{alert}</p>}
            {displaySubtitle && <p className="text-xs text-text-secondary mt-1">{displaySubtitle}</p>}
            {displayLink && <button className="text-xs text-primary mt-1 hover:underline">{displayLink}</button>}
        </div>
    );
}
