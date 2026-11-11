import { useState } from 'react';
import { AI_ENABLED, AI_PAUSED_HINT } from '../../../shared/constants';

interface PlanGenerationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (settings: { batchLunch: boolean; batchMealType?: string; includeSmoothie: boolean; includeTea: boolean; includeSnacks: boolean }) => void;
    onEmpty: () => void;
}

export function PlanGenerationWizard({ isOpen, onClose, onGenerate, onEmpty }: PlanGenerationWizardProps) {
    const [batchType, setBatchType] = useState<'none' | 'breakfast' | 'lunch' | 'dinner'>('lunch');
    const [includeSmoothie, setIncludeSmoothie] = useState(false);
    const [includeTea, setIncludeTea] = useState(false);
    const [includeSnacks, setIncludeSnacks] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-dark border border-surface-border rounded-xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <span className="material-symbols-outlined text-4xl text-primary">auto_fix_high</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Create Your Week Plan</h2>
                    <p className="text-text-secondary">
                        Configure your strategy for the week. We'll use your biometrics and recipes to build the perfect plan.
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <label htmlFor="plan-wizard-daily-smoothie" className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${includeSmoothie ? 'bg-primary/10 border-primary' : 'bg-background-dark border-surface-border hover:border-text-secondary'}`}>
                        <input
                            id="plan-wizard-daily-smoothie"
                            type="checkbox"
                            className="h-6 w-6 shrink-0 cursor-pointer accent-primary"
                            checked={includeSmoothie}
                            onChange={(event) => setIncludeSmoothie(event.target.checked)}
                        />
                        <div className="flex-1">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <span aria-hidden="true" className="material-symbols-outlined text-primary">blender</span>
                                Daily Smoothie
                            </h3>
                            <p className="text-xs text-text-secondary">Add a dedicated smoothie slot every day.</p>
                        </div>
                    </label>

                    <label htmlFor="plan-wizard-daily-tea" className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${includeTea ? 'bg-primary/10 border-primary' : 'bg-background-dark border-surface-border hover:border-text-secondary'}`}>
                        <input
                            id="plan-wizard-daily-tea"
                            type="checkbox"
                            className="h-6 w-6 shrink-0 cursor-pointer accent-primary"
                            checked={includeTea}
                            onChange={(event) => setIncludeTea(event.target.checked)}
                        />
                        <div className="flex-1">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <span aria-hidden="true" className="material-symbols-outlined text-primary">emoji_food_beverage</span>
                                Daily Tea
                            </h3>
                            <p className="text-xs text-text-secondary">Add a calming tea slot every day.</p>
                        </div>
                    </label>

                    <div className="p-4 rounded-xl border bg-background-dark border-surface-border">
                        <div className="flex items-center gap-3 mb-3">
                            <span aria-hidden="true" className="material-symbols-outlined text-primary">soup_kitchen</span>
                            <div>
                                <h3 className="font-bold text-white">Batch Cooking Strategy</h3>
                                <p className="text-xs text-text-secondary">Select a meal to batch cook (same meal Mon-Fri) or disable.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(['none', 'breakfast', 'lunch', 'dinner'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setBatchType(type)}
                                    className={`py-2 px-1 rounded-lg text-xs font-bold uppercase transition-all ${batchType === type ? 'bg-primary text-white shadow-md' : 'bg-surface-dark text-text-secondary hover:text-white'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label htmlFor="plan-wizard-include-snacks" className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${includeSnacks ? 'bg-primary/10 border-primary' : 'bg-background-dark border-surface-border hover:border-text-secondary'}`}>
                        <input
                            id="plan-wizard-include-snacks"
                            type="checkbox"
                            className="h-6 w-6 shrink-0 cursor-pointer accent-primary"
                            checked={includeSnacks}
                            onChange={(event) => setIncludeSnacks(event.target.checked)}
                        />
                        <div className="flex-1">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <span aria-hidden="true" className="material-symbols-outlined text-primary">cookie</span>
                                Include Snacks
                            </h3>
                            <p className="text-xs text-text-secondary">Fill calorie gaps with smart snack choices.</p>
                        </div>
                    </label>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => onGenerate({
                            batchLunch: batchType !== 'none',
                            batchMealType: batchType !== 'none' ? batchType : undefined,
                            includeSmoothie,
                            includeTea,
                            includeSnacks
                        })}
                        disabled={!AI_ENABLED}
                        title={AI_ENABLED ? undefined : AI_PAUSED_HINT}
                        className={`w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 ${AI_ENABLED ? 'hover:bg-primary-hover transform hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'}`}
                    >
                        <span className="material-symbols-outlined">auto_awesome</span>
                        {AI_ENABLED ? 'Auto-Generate Week' : 'Auto-Generate paused'}
                    </button>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-surface-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-2 bg-surface-dark text-text-secondary text-xs uppercase font-bold tracking-widest">Or</span>
                        </div>
                    </div>
                    <button
                        onClick={onEmpty}
                        className="w-full py-3 bg-surface-dark border border-surface-border hover:bg-white/5 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">grid_on</span>
                        Start from Scratch (Empty Grid)
                    </button>
                </div>
            </div>
        </div>
    );
}
