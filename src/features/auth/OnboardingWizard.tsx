import { useId, useState } from 'react';
import { useAppStore } from '../../app/providers/store';
import { trackSave } from '../../shared/pending-saves';
import {
    calculateTdee,
    cmToFeetInches,
    fromKg,
    heightToCm,
    safeNumber,
    toKg,
    weightSuffix,
    type HeightInput,
    type MeasurementUnit,
} from '../../shared/units';

export default function OnboardingWizard() {
    const formId = useId();
    const { userSettings, updateSettings } = useAppStore();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        currentWeight: userSettings?.currentWeight || 0,
        goalWeight: userSettings?.goalWeight || 0,
        dailyCalorieTarget: userSettings?.dailyCalorieTarget || 0,
        measurementUnit: userSettings?.measurementUnit || 'metric',
        allergies: userSettings?.allergies || [],
        dietaryTags: userSettings?.dietaryTags || [],
    });

    const steps = [
        { title: "Welcome to VioMacro", desc: "Let's personalize your experience." },
        { title: "The Basics", desc: "We need this to calculate your targets." },
        { title: "Nutrition Goals", desc: "Set your daily engine." },
        { title: "Preferences", desc: "Any restrictions we should know?" },
    ];

    const completeOnboarding = async (settings: typeof formData | null = null) => {
        setSaving(true);
        setError('');

        try {
            await trackSave(updateSettings({
                ...(settings || {}),
                onboardingCompleted: true
            }), () => setWaiting(true));
        } catch (error) {
            console.error('Failed to save onboarding', error);
            setError('We could not save onboarding yet. Please retry before leaving this screen.');
        } finally {
            setSaving(false);
            setWaiting(false);
        }
    };

    const handleNext = async () => {
        setError('');
        if ((step === 1 || step === steps.length - 1) &&
            [formData.currentWeight, formData.goalWeight].some(weight => !Number.isFinite(weight) || weight <= 0 || weight >= 1000)) {
            setError('Enter a current weight and goal weight greater than 0 and less than 1000.');
            setStep(1);
            return;
        }
        if ((step === 2 || step === steps.length - 1) &&
            (!Number.isFinite(formData.dailyCalorieTarget) || formData.dailyCalorieTarget <= 0 || formData.dailyCalorieTarget > 20000)) {
            setError('Enter a daily calorie target greater than 0 and no more than 20000.');
            setStep(2);
            return;
        }
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            await completeOnboarding(formData);
        }
    };

    const handleSkip = async () => {
        await completeOnboarding();
    };

    const toggleAllergy = (allergy: string) => {
        setFormData(prev => ({
            ...prev,
            allergies: prev.allergies.includes(allergy)
                ? prev.allergies.filter((a: string) => a !== allergy)
                : [...prev.allergies, allergy]
        }));
    };

    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcData, setCalcData] = useState({
        gender: 'male' as 'male' | 'female',
        age: 30,
        heightCm: 178,
        heightFeet: 5,
        heightInches: 10,
        activityLevel: 1.55 // Moderate
    });

    const unit: MeasurementUnit = formData.measurementUnit === 'imperial' ? 'imperial' : 'metric';

    // AUD-065: the height input takes whichever shape matches the chosen unit.
    const heightInput: HeightInput = unit === 'metric'
        ? { unit: 'metric', cm: calcData.heightCm }
        : { unit: 'imperial', feet: calcData.heightFeet, inches: calcData.heightInches };

    // AUD-063: honour the unit instead of always converting from pounds.
    const calculateTDEE = () => calculateTdee({
        weight: formData.currentWeight,
        weightUnit: unit,
        height: heightInput,
        age: calcData.age,
        sex: calcData.gender,
        activityLevel: calcData.activityLevel,
    });

    const calculateBMR = () => {
        const tdee = calculateTDEE();
        setFormData(prev => ({ ...prev, dailyCalorieTarget: tdee }));
    };

    // AUD-064: switching units converts the value the user already typed,
    // rather than silently reinterpreting it under a new label.
    const changeUnit = (next: MeasurementUnit) => {
        if (next === unit) return;
        const convert = (value: number) =>
            Number.isFinite(value) && value > 0
                ? Math.round(fromKg(toKg(value, unit), next))
                : value;

        setFormData(prev => ({
            ...prev,
            measurementUnit: next,
            currentWeight: convert(prev.currentWeight),
            goalWeight: convert(prev.goalWeight),
        }));

        setCalcData(prev => {
            if (next === 'metric') {
                return { ...prev, heightCm: Math.round(heightToCm({ unit: 'imperial', feet: prev.heightFeet, inches: prev.heightInches })) };
            }
            return { ...prev, ...cmToFeetInches(prev.heightCm) };
        });
    };

    // Common Allergens List
    const allergenList = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish', 'Fish'];

    if (waiting) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-md">
            <div className="bg-surface-dark w-full max-w-lg rounded-2xl border border-surface-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Progress Bar */}
                <div className="h-1 bg-surface-border w-full">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    <div className="mb-6 text-center">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-2xl">
                                {step === 0 ? 'waving_hand' : step === 1 ? 'scale' : step === 2 ? 'bolt' : 'no_meals'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">{steps[step].title}</h2>
                        <p className="text-text-secondary">{steps[step].desc}</p>
                    </div>

                    {error && (
                        <div role="alert" className="mb-5 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-100 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Step 0: Welcome */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <p className="text-white text-center">
                                VioMacro helps you plan meals that fit your exact macro targets. To get the best results, we need to know a little about you.
                            </p>
                            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    What you'll get
                                </h4>
                                <ul className="text-sm text-text-secondary space-y-2">
                                    <li>• Accurate calorie & macro estimates</li>
                                    <li>• Personalized meal suggestions</li>
                                    <li>• Grocery lists that match your plan</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Basics */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor={`${formId}-current-weight`} className="block text-xs font-bold text-text-secondary uppercase mb-2">Current Weight</label>
                                    <div className="relative">
                                        <input
                                            id={`${formId}-current-weight`}
                                            type="number"
                                            step="any"
                                            value={formData.currentWeight || ''}
                                            onChange={(e) => setFormData({ ...formData, currentWeight: safeNumber(e.target.value) ?? 0 })}
                                            className="w-full bg-background-dark border border-surface-border rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                        />
                                        <span className="absolute right-3 top-3 text-text-secondary text-sm">{weightSuffix(unit)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`${formId}-goal-weight`} className="block text-xs font-bold text-text-secondary uppercase mb-2">Goal Weight</label>
                                    <div className="relative">
                                        <input
                                            id={`${formId}-goal-weight`}
                                            type="number"
                                            step="any"
                                            value={formData.goalWeight || ''}
                                            onChange={(e) => setFormData({ ...formData, goalWeight: safeNumber(e.target.value) ?? 0 })}
                                            className="w-full bg-background-dark border border-surface-border rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                        />
                                        <span className="absolute right-3 top-3 text-text-secondary text-sm">{weightSuffix(unit)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex bg-background-dark p-1 rounded-lg border border-surface-border">
                                <button className={`flex-1 py-1 rounded text-sm font-bold ${formData.measurementUnit === 'imperial' ? 'bg-surface-dark text-white shadow-sm' : 'text-text-secondary'}`} onClick={() => changeUnit('imperial')}>Imperial (lbs)</button>
                                <button className={`flex-1 py-1 rounded text-sm font-bold ${formData.measurementUnit === 'metric' ? 'bg-surface-dark text-white shadow-sm' : 'text-text-secondary'}`} onClick={() => changeUnit('metric')}>Metric (kg)</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Nutrition */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor={`${formId}-calories`} className="block text-xs font-bold text-text-secondary uppercase mb-2">Daily Calorie Target</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        id={`${formId}-calories`}
                                        type="number"
                                        value={formData.dailyCalorieTarget || ''}
                                        onChange={(e) => setFormData({ ...formData, dailyCalorieTarget: safeNumber(e.target.value) ?? 0 })}
                                        className="flex-1 bg-background-dark border border-surface-border rounded-lg p-3 text-white text-lg font-bold focus:border-primary focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setShowCalculator(!showCalculator)}
                                        className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">calculate</span>
                                        {showCalculator ? 'Hide Calc' : 'Calculate Needs'}
                                    </button>
                                </div>

                                {showCalculator && (
                                    <div className="mt-4 p-4 bg-background-dark/50 border border-surface-border rounded-xl animate-in fade-in slide-in-from-top-2">
                                        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-sm">monitor_heart</span>
                                            Blueprint Calculator (Mifflin-St Jeor)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label htmlFor={`${formId}-gender`} className="block text-[10px] text-text-secondary uppercase mb-1">Gender</label>
                                                <select
                                                    id={`${formId}-gender`}
                                                    value={calcData.gender}
                                                    onChange={(e) => setCalcData({ ...calcData, gender: e.target.value as 'male' | 'female' })}
                                                    className="w-full bg-surface-dark border border-surface-border rounded p-2 text-sm text-white"
                                                >
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor={`${formId}-age`} className="block text-[10px] text-text-secondary uppercase mb-1">Age</label>
                                                <input
                                                    id={`${formId}-age`}
                                                    type="number"
                                                    value={calcData.age}
                                                    onChange={(e) => setCalcData({ ...calcData, age: parseInt(e.target.value) })}
                                                    className="w-full bg-surface-dark border border-surface-border rounded p-2 text-sm text-white"
                                                />
                                            </div>
                                            {/* AUD-065: the height field takes the shape of the chosen unit. */}
                                            {unit === 'metric' ? (
                                                <div className="col-span-2">
                                                    <label htmlFor="onboarding-height-cm" className="block text-[10px] text-text-secondary uppercase mb-1">Height (cm)</label>
                                                    <input
                                                        id="onboarding-height-cm"
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={calcData.heightCm}
                                                        onChange={(e) => setCalcData({ ...calcData, heightCm: safeNumber(e.target.value) ?? 0 })}
                                                        className="w-full bg-surface-dark border border-surface-border rounded p-2 text-sm text-white"
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label htmlFor="onboarding-height-ft" className="block text-[10px] text-text-secondary uppercase mb-1">Height (ft)</label>
                                                        <input
                                                            id="onboarding-height-ft"
                                                            type="number"
                                                            inputMode="numeric"
                                                            value={calcData.heightFeet}
                                                            onChange={(e) => setCalcData({ ...calcData, heightFeet: safeNumber(e.target.value) ?? 0 })}
                                                            className="w-full bg-surface-dark border border-surface-border rounded p-2 text-sm text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="onboarding-height-in" className="block text-[10px] text-text-secondary uppercase mb-1">Height (in)</label>
                                                        <input
                                                            id="onboarding-height-in"
                                                            type="number"
                                                            inputMode="numeric"
                                                            value={calcData.heightInches}
                                                            onChange={(e) => setCalcData({ ...calcData, heightInches: safeNumber(e.target.value) ?? 0 })}
                                                            className="w-full bg-surface-dark border border-surface-border rounded p-2 text-sm text-white"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            <div className="col-span-2">
                                                <label htmlFor={`${formId}-activity`} className="block text-[10px] text-text-secondary uppercase mb-1">Activity Level</label>
                                                <select
                                                    id={`${formId}-activity`}
                                                    value={calcData.activityLevel}
                                                    onChange={(e) => setCalcData({ ...calcData, activityLevel: parseFloat(e.target.value) })}
                                                    className="w-full bg-surface-dark border border-surface-border rounded p-2 text-sm text-white"
                                                >
                                                    <option value={1.2}>Sedentary (Desk Job)</option>
                                                    <option value={1.375}>Light Exercise (1-3 days/wk)</option>
                                                    <option value={1.55}>Moderate Exercise (3-5 days/wk)</option>
                                                    <option value={1.725}>Very Active (6-7 days/wk)</option>
                                                    <option value={1.9}>Extra Active (Physical Job/Training)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            onClick={calculateBMR}
                                            className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-lg py-2 text-sm font-bold transition-colors"
                                        >
                                            Calculated TDEE: {calculateTDEE()} kcal
                                            <span className="block text-[10px] font-normal opacity-80 mt-0.5">Click to Apply Target</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* AUD-066: this was an uncontrolled checkbox with no
                                onChange and no reader anywhere in the codebase.
                                Unticking it did nothing, ever. It is now honest
                                static text stating the split actually in use. */}
                            <div className="p-4 bg-background-dark rounded-xl border border-surface-border">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">balance</span>
                                    <div>
                                        <p className="text-white font-bold text-sm">Balanced macros</p>
                                        <p className="text-xs text-text-secondary">
                                            30% protein / 35% carbs / 35% fat &middot; change this any time in Settings
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preferences */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-4">Allergies & Intolerances</label>
                                <div className="flex flex-wrap gap-2">
                                    {allergenList.map(allergy => (
                                        <button
                                            key={allergy}
                                            onClick={() => toggleAllergy(allergy)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.allergies.includes(allergy)
                                                ? 'bg-primary/20 border-primary text-white'
                                                : 'bg-background-dark border-surface-border text-text-secondary hover:border-white/20'
                                                }`}
                                        >
                                            {allergy}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-4">Diet Type</label>
                                <div className="flex bg-background-dark border border-surface-border rounded-lg overflow-hidden">
                                    <button className={`flex-1 py-2 text-sm font-medium ${!formData.dietaryTags.length ? 'bg-primary text-white' : 'text-text-secondary'}`} onClick={() => setFormData(p => ({ ...p, dietaryTags: [] }))}>Standard</button>
                                    <button className={`flex-1 py-2 text-sm font-medium ${formData.dietaryTags.includes('keto') ? 'bg-primary text-white' : 'text-text-secondary'}`} onClick={() => setFormData(p => ({ ...p, dietaryTags: ['keto'] }))}>Keto</button>
                                    <button className={`flex-1 py-2 text-sm font-medium ${formData.dietaryTags.includes('vegan') ? 'bg-primary text-white' : 'text-text-secondary'}`} onClick={() => setFormData(p => ({ ...p, dietaryTags: ['vegan'] }))}>Vegan</button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-surface-border bg-background-dark/50 flex justify-between items-center">
                    <button
                        onClick={step === 0 ? handleSkip : () => setStep(step - 1)}
                        disabled={saving}
                        className="text-text-secondary font-bold text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {step === 0 ? 'Skip Setup' : 'Back'}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : step === steps.length - 1 ? 'Finish Setup' : 'Next'}
                        {!saving && step < steps.length - 1 && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                    </button>
                </div>

            </div>
        </div>
    );
}
