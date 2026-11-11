import { useId, useState } from 'react';

type MacroTargets = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

interface PlanSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTargets: MacroTargets;
    onSave: (targets: MacroTargets) => void;
}

export function PlanSettingsModal({ isOpen, onClose, currentTargets, onSave }: PlanSettingsModalProps) {
    if (!isOpen) return null;

    const resetKey = `${currentTargets.calories}-${currentTargets.protein}-${currentTargets.carbs}-${currentTargets.fat}`;

    return (
        <PlanSettingsModalContent
            key={resetKey}
            onClose={onClose}
            currentTargets={currentTargets}
            onSave={onSave}
        />
    );
}

function PlanSettingsModalContent({ onClose, currentTargets, onSave }: Omit<PlanSettingsModalProps, 'isOpen'>) {
    const formId = useId();
    const [targets, setTargets] = useState(currentTargets);

    const handleChange = (field: keyof typeof targets, value: string) => {
        setTargets(prev => ({
            ...prev,
            [field]: parseInt(value) || 0
        }));
    };

    const handleSave = () => {
        onSave(targets);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-dark border border-surface-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">tune</span>
                        Plan Settings
                    </h2>
                    <button onClick={onClose} aria-label="Close plan settings" className="text-text-secondary hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-text-secondary mb-4">
                        Adjust the daily targets for this specific week. These changes won't affect your global profile settings.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor={`${formId}-calories`} className="block text-sm font-bold text-text-secondary mb-1">Daily Calories</label>
                            <div className="relative">
                                <input
                                    id={`${formId}-calories`}
                                    type="number"
                                    value={targets.calories}
                                    onChange={(e) => handleChange('calories', e.target.value)}
                                    className="w-full bg-background-dark border border-surface-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <span className="absolute right-4 top-2 text-text-secondary text-sm">kcal</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label htmlFor={`${formId}-protein`} className="block text-xs font-bold text-primary mb-1">Protein</label>
                                <div className="relative">
                                    <input
                                        id={`${formId}-protein`}
                                        type="number"
                                        value={targets.protein}
                                        onChange={(e) => handleChange('protein', e.target.value)}
                                        className="w-full bg-background-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <span className="absolute right-2 top-2 text-text-secondary text-xs">g</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor={`${formId}-carbs`} className="block text-xs font-bold text-yellow-400 mb-1">Carbs</label>
                                <div className="relative">
                                    <input
                                        id={`${formId}-carbs`}
                                        type="number"
                                        value={targets.carbs}
                                        onChange={(e) => handleChange('carbs', e.target.value)}
                                        className="w-full bg-background-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <span className="absolute right-2 top-2 text-text-secondary text-xs">g</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor={`${formId}-fat`} className="block text-xs font-bold text-blue-400 mb-1">Fat</label>
                                <div className="relative">
                                    <input
                                        id={`${formId}-fat`}
                                        type="number"
                                        value={targets.fat}
                                        onChange={(e) => handleChange('fat', e.target.value)}
                                        className="w-full bg-background-dark border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <span className="absolute right-2 top-2 text-text-secondary text-xs">g</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-white hover:bg-surface-border/50 transition-colors font-bold text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-bold text-sm shadow-lg shadow-primary/20"
                        >
                            Save Targets
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
