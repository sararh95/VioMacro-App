

interface PlanPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: () => void;
    onClone: () => void;
    weekDate: Date;
}

export function PlanPromptModal({ isOpen, onClose, onCreate, onClone, weekDate }: PlanPromptModalProps) {
    if (!isOpen) return null;

    const formattedDate = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-dark border border-surface-border rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <span className="material-symbols-outlined text-4xl text-primary">calendar_add_on</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Plan for Week of {formattedDate}?</h2>
                    <p className="text-text-secondary">
                        It looks like this week is empty. Start fresh or copy your previous success!
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onCreate}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                        Open Plan Wizard
                    </button>

                    <button
                        onClick={onClone}
                        className="w-full py-3 bg-surface-dark border border-surface-border text-white font-bold rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-xl">history</span>
                        Clone Last Week
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2 text-text-secondary font-medium hover:text-white transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
