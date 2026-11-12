import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../../app/providers/auth-context';
import { useAppStore } from '../../../app/providers/store';
import { toLocalDateKey } from '../../../shared/date-utils';
import { weightSuffix } from '../../../shared/units';
import { trackSave } from '../../../shared/pending-saves';
import type { WeightCheckIn } from '../../../services/userService';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'full' | 'quick';
    onSaveFailed?: (data: WeightCheckIn) => void;
}

export default function CheckInModal({ isOpen, onClose, mode = 'full', onSaveFailed }: CheckInModalProps) {
    const { user } = useAuth();
    const { userSettings, saveCheckIn, activePlan } = useAppStore();
    // AUD-122: the stored weight is in the user's own unit, so only the label changes.
    const weightUnitLabel = weightSuffix(userSettings?.measurementUnit ?? 'metric');

    // Steps: 0=Adherence, 1=Biofeedback, 2=Weight
    // If quick mode, start at step 2 (Weight)
    const [step, setStep] = useState(mode === 'quick' ? 2 : 0);
    const [weight, setWeight] = useState(userSettings?.currentWeight?.toString() || '');
    const [saving, setSaving] = useState(false);
    const activeRef = useRef(true);
    useEffect(() => {
        activeRef.current = true;
        return () => { activeRef.current = false; };
    }, []);
    const [error, setError] = useState('');

    // Biofeedback state
    const [energy, setEnergy] = useState(3); // 1-5
    const [hunger, setHunger] = useState(3); // 1-5

    // Calculate Adherence from Plan
    const adherenceStats = useMemo(() => {
        if (!activePlan) return { eaten: 0, total: 0, percentage: 0 };
        let eaten = 0;
        let total = 0;
        activePlan.days.forEach(day => {
            day.meals.forEach(meal => {
                total++;
                if (meal.isEaten) eaten++;
            });
        });
        return { eaten, total, percentage: total > 0 ? Math.round((eaten / total) * 100) : 0 };
    }, [activePlan]);

    useMemo(() => {
        if (isOpen) {
            setStep(mode === 'quick' ? 2 : 0);
        }
    }, [isOpen, mode]);

    if (!isOpen) return null;

    const handleNext = () => setStep(p => p + 1);
    const handleBack = () => setStep(p => p - 1);
    const handleScoreKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<number>>
    ) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault();
            setter((current) => Math.min(5, current + 1));
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault();
            setter((current) => Math.max(1, current - 1));
        } else if (event.key === 'Home') {
            event.preventDefault();
            setter(1);
        } else if (event.key === 'End') {
            event.preventDefault();
            setter(5);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        const weightNum = Number(weight);
        if (!Number.isFinite(weightNum) || weightNum <= 0 || weightNum >= 1000) {
            setError('Enter a weight greater than 0 and less than 1000.');
            return;
        }

        setSaving(true);
        setError('');
        const data = { weight: weightNum, date: toLocalDateKey(new Date()), energy, hunger };
        try {
            await trackSave(saveCheckIn(data), () => { if (activeRef.current) onClose(); });

            if (activeRef.current) onClose();
        } catch (error) {
            console.error("Failed to save check-in:", error);
            if (activeRef.current) {
                setError('We could not save your check-in. Your entries are still here; please retry.');
            } else {
                onSaveFailed?.(data);
            }
        } finally {
            if (activeRef.current) setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-surface-dark border border-surface-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-surface-border flex justify-between items-center bg-surface-dark sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">{mode === 'quick' ? 'Log Weight' : 'Weekly Check-In'}</h2>
                        {mode === 'full' && (
                            <div className="flex gap-1 mt-1">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-surface-border'}`} />
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} aria-label="Close check-in" className="text-text-secondary hover:text-white bg-background-dark p-2 rounded-full">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && <p role="alert" className="mb-4 text-red-300">{error}</p>}

                    {/* Step 0: Adherence Review */}
                    {step === 0 && (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-surface-border mx-auto flex items-center justify-center relative">
                                <span className="text-3xl font-black text-white">{adherenceStats.percentage}%</span>
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" fill="none" className="text-surface-border" />
                                    <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary" strokeDasharray={`${adherenceStats.percentage * 2.38} 251`} strokeLinecap="round" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-white font-bold text-lg mb-2">Meal Adherence</h3>
                                <p className="text-text-secondary">
                                    You tracked <strong className="text-white">{adherenceStats.eaten}</strong> out of <strong className="text-white">{adherenceStats.total}</strong> planned meals this week.
                                </p>
                            </div>

                            <div className="bg-background-dark p-4 rounded-xl border border-surface-border text-left">
                                <p className="text-sm text-white font-bold mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                    Consistent tracking leads to +80% better results.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Biofeedback */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">How did you feel?</h3>
                                <p className="text-text-secondary text-sm">Subjective scores help fine-tune your targets.</p>
                            </div>

                            {/* Energy Slider */}
                            <div>
                                <div className="flex justify-between text-sm font-bold text-white mb-4">
                                    <label htmlFor="weekly-checkin-energy">Energy Levels</label>
                                    <span id="weekly-checkin-energy-value" className="text-primary">{energy}/5</span>
                                </div>
                                <input
                                    id="weekly-checkin-energy"
                                    aria-describedby="weekly-checkin-energy-value"
                                    aria-label="Energy level"
                                    type="range" min="1" max="5" step="1"
                                    value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))}
                                    onKeyDown={(event) => handleScoreKeyDown(event, setEnergy)}
                                    className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary mb-2"
                                />
                                <div className="flex justify-between text-xs text-text-secondary font-medium">
                                    <span>Lethargic</span>
                                    <span>Energetic</span>
                                </div>
                            </div>

                            {/* Hunger Slider */}
                            <div>
                                <div className="flex justify-between text-sm font-bold text-white mb-4">
                                    <label htmlFor="weekly-checkin-hunger">Hunger Levels</label>
                                    <span id="weekly-checkin-hunger-value" className="text-amber-500">{hunger}/5</span>
                                </div>
                                <input
                                    id="weekly-checkin-hunger"
                                    aria-describedby="weekly-checkin-hunger-value"
                                    aria-label="Hunger level"
                                    type="range" min="1" max="5" step="1"
                                    value={hunger} onChange={(e) => setHunger(parseInt(e.target.value))}
                                    onKeyDown={(event) => handleScoreKeyDown(event, setHunger)}
                                    className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-amber-500 mb-2"
                                />
                                <div className="flex justify-between text-xs text-text-secondary font-medium">
                                    <span>Stuffed</span>
                                    <span>Starving</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Weight Log */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Weigh-In</h3>
                                <p className="text-text-secondary text-sm">Last recorded: {userSettings?.currentWeight} {weightUnitLabel}</p>
                            </div>

                            <div className="bg-background-dark p-4 rounded-xl border border-surface-border">
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Current Weight ({weightUnitLabel})</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g. 185"
                                    className="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-3 text-white text-2xl font-bold focus:border-primary focus:outline-none appearance-none"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <span className="material-symbols-outlined text-primary">info</span>
                                <p className="text-xs text-white">
                                    Adaptive Logic: If your weight remains stable but hunger was high (4-5), we may suggest increasing protein.
                                </p>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-surface-border bg-surface-dark flex gap-3">
                    {step > 0 && mode === 'full' && (
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 px-4 rounded-xl text-text-secondary font-bold hover:bg-background-dark transition-colors"
                        >
                            Back
                        </button>
                    )}
                    {step < 2 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving || !weight}
                            className="flex-1 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Completing...' : 'Complete Check-In'}
                        </button>
                    )}
                </div>

            </div>
            <style>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type=number] {
                  -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
}
