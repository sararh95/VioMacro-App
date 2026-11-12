import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useAuth } from '../../app/providers/auth-context';
import { useAppStore } from '../../app/providers/store';
import AiSpendSafetyPanel from './AiSpendSafetyPanel';
import { type UserSettings } from '../../services/userService';
import { formatRatePerWeek, fromKg, toKg, weightSuffix, type MeasurementUnit } from '../../shared/units';
import { AVATAR_CHOICES, avatarGradientByName, initialsFrom } from '../../shared/visuals';
import { trackSave } from '../../shared/pending-saves';

const settingsTabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'coaching', label: 'Goals & Nutrition' },
    { id: 'ai-safety', label: 'AI Safety' },
    { id: 'integrations', label: 'Integrations' },
];

/**
 * AUD-104: these were six SVGs fetched from api.dicebear.com. The chosen URL
 * was saved into photoURL and then loaded on EVERY page of the app, so every
 * page view leaked the user's IP and referrer to a third party — and the whole
 * app's avatars would break if that service changed its API.
 *
 * They are now local colour names rendered as a gradient plus the user's
 * initials. Nothing is fetched.
 */
const AVATARS = [...AVATAR_CHOICES];

const dietaryTagsList = [
    { id: 'gluten-free', label: 'Gluten Free' },
    { id: 'dairy-free', label: 'Dairy Free' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'keto', label: 'Keto' },
    { id: 'paleo', label: 'Paleo' },
];

export default function Settings() {
    const { user, updateUserProfile } = useAuth();
    const { userSettings, updateSettings, loading } = useAppStore();
    const [activeTab, setActiveTab] = useState('coaching');
    const [saveError, setSaveError] = useState<string | null>(null);

    // Profile State
    const [profileName, setProfileName] = useState(user?.displayName || '');
    const [profileAvatar, setProfileAvatar] = useState(user?.photoURL || '');

    // Local form state
    const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const hasChangesRef = useRef(false);
    const latestPendingDraftRef = useRef<string | null>(null);
    const latestSaveRef = useRef(0);
    const draftRef = useRef({ settings: localSettings, profileName, profileAvatar });

    useLayoutEffect(() => {
        draftRef.current = { settings: localSettings, profileName, profileAvatar };
    }, [localSettings, profileName, profileAvatar]);

    /**
     * AUD-103 / AUD-105: this used to pre-fill 185 lb current, 170 lb goal and
     * 2200 kcal for anyone who had not set them. A brand-new account saw a
     * complete profile that was not theirs — and pressing Save persisted a
     * stranger's body weight as real. The two fabricated sets also disagreed
     * with each other: 2200 kcal against macro targets totalling 1940.
     *
     * Body measurements and goals are now left undefined until the user
     * supplies them. Only genuine app defaults survive here — the ones
     * createDefaultUserSettings already writes for every account.
     */
    const getSettingsSnapshot = (settings: UserSettings | null): Partial<UserSettings> => ({
        currentWeight: settings?.currentWeight,
        goalWeight: settings?.goalWeight,
        rateOfChange: settings?.rateOfChange,
        dailyCalorieTarget: settings?.dailyCalorieTarget,
        macroSplit: settings?.macroSplit || { protein: 30, carbs: 35, fat: 35 },
        macroMode: settings?.macroMode || 'percentage',
        macroTargets: settings?.macroTargets,
        dietaryTags: settings?.dietaryTags || [],
        allergies: settings?.allergies || [],
        // AUD-106: the draft must carry the unit, or every label reads as metric.
        measurementUnit: settings?.measurementUnit || 'metric',
        phase: settings?.phase || 'fat-loss',
        phaseStartDate: settings?.phaseStartDate || new Date().toISOString(),
        bottleSize: settings?.bottleSize || 500
    });

    const resetDraft = () => {
        setLocalSettings(getSettingsSnapshot(userSettings));
        if (user) {
            setProfileName(userSettings?.profileName || user.displayName || '');
            setProfileAvatar(userSettings?.profileAvatar || user.photoURL || AVATARS[0]);
        }
        setSaveError(null);
        hasChangesRef.current = false;
        setHasChanges(false);
    };

    // Sync from store to local state
    useEffect(() => {
        if (hasChangesRef.current) return;
        setLocalSettings(getSettingsSnapshot(userSettings));
        if (user) {
            setProfileName(userSettings?.profileName || user.displayName || '');
            setProfileAvatar(userSettings?.profileAvatar || user.photoURL || AVATARS[0]);
        }
    }, [userSettings, user, hasChanges]);

    const markChanged = () => {
        hasChangesRef.current = true;
        setHasChanges(true);
    };

    const handleLocalChange = (field: keyof UserSettings, value: unknown) => {
        setLocalSettings((prev) => ({ ...prev, [field]: value }));
        markChanged();
    };

    const handleMacroChange = (macro: 'protein' | 'carbs' | 'fat', value: number) => {
        setLocalSettings((prev) => ({
            ...prev,
            macroSplit: { ...prev.macroSplit!, [macro]: value }
        }));
        markChanged();
    };

    const handleTargetChange = (macro: 'protein' | 'carbs' | 'fat', value: number) => {
        setLocalSettings((prev) => {
            // macroTargets is undefined until the user sets one (AUD-103). Spreading
            // undefined gave {}, so the other two macros were undefined and the
            // calorie maths below produced NaN, which React then wrote into a
            // value attribute.
            const base = prev.macroTargets ?? { protein: 0, carbs: 0, fat: 0 };
            const newTargets = { ...base, [macro]: value };
            // Update calories based on targets
            const calculatedCals = (newTargets.protein * 4) + (newTargets.carbs * 4) + (newTargets.fat * 9);
            return {
                ...prev,
                macroTargets: newTargets,
                dailyCalorieTarget: calculatedCals // Sync main calorie target
            };
        });
        markChanged();
    };

    const saveChanges = async () => {
        const snapshot = JSON.stringify({ settings: localSettings, profileName, profileAvatar });
        if (latestPendingDraftRef.current === snapshot) return;
        latestPendingDraftRef.current = snapshot;
        const save = ++latestSaveRef.current;
        setSaveError(null);
        try {
            const profileChanged = Boolean(user && (profileName !== (userSettings?.profileName || user.displayName || '') || profileAvatar !== (userSettings?.profileAvatar || user.photoURL || AVATARS[0])));
            const settingsToSave = profileChanged
                ? { ...localSettings, profileName, profileAvatar }
                : localSettings;

            if (hasChanges || profileChanged) {
                await trackSave(updateSettings(settingsToSave));
            }
            if (profileChanged && save === latestSaveRef.current) {
                try {
                    await updateUserProfile({ displayName: profileName, photoURL: profileAvatar });
                } catch (error) {
                    // App settings are the source of truth; Auth profile sync is a best-effort mirror.
                    console.warn('Profile saved, but Firebase Auth profile sync failed:', error);
                }
            }
            if (save === latestSaveRef.current && JSON.stringify(draftRef.current) === snapshot) {
                hasChangesRef.current = false;
                setHasChanges(false);
            }
        } catch (error) {
            console.error(error);
            hasChangesRef.current = true;
            setHasChanges(true);
            setSaveError("We couldn't save your settings. Your draft is still here, so you can try again.");
            alert("Failed to save settings. Please try again.");
        } finally {
            if (save === latestSaveRef.current) latestPendingDraftRef.current = null;
        }
    };

    const toggleDietaryTag = (tagId: string) => {
        const current = localSettings.dietaryTags || [];
        const updated = current.includes(tagId)
            ? current.filter((t: string) => t !== tagId)
            : [...current, tagId];
        handleLocalChange('dietaryTags', updated);
    };

    // AUD-106: the slider is calibrated in lb/week internally; the label is
    // converted for metric users, not merely relabelled.
    const settingsUnit: MeasurementUnit =
        localSettings.measurementUnit === 'imperial' ? 'imperial' : 'metric';
    // AUD-122: weights are stored in the unit the user chose, so the label is
    // all that changes here. Never hardcode "lbs" -- metric is the default.
    const weightUnitLabel = weightSuffix(settingsUnit);

    const rateToLbPerWeek = (val: number) => {
        if (val <= 30) return -0.5;
        if (val <= 60) return -1.0;
        if (val <= 80) return -1.5;
        return -2.0;
    };

    const getRateLabel = (val: number) =>
        formatRatePerWeek(rateToLbPerWeek(val), settingsUnit);

    const getCalorieDeficit = (val: number) => {
        if (val <= 30) return 250;
        if (val <= 60) return 500;
        if (val <= 80) return 750;
        return 1000;
    };

    const macroTotal = (localSettings.macroSplit?.protein || 0) + (localSettings.macroSplit?.carbs || 0) + (localSettings.macroSplit?.fat || 0);

    /**
     * AUD-129: do not render the form until the account's real settings exist.
     *
     * The draft is built by getSettingsSnapshot(userSettings). Before the data
     * arrives that argument is null, so the draft is DEFAULTS -- metric,
     * fat-loss, bottleSize 500, a fresh phaseStartDate. The moment the user
     * touches any control, hasChangesRef freezes that draft and the sync effect
     * stops replacing it. Saving then writes those defaults over the real
     * account.
     *
     * An imperial user could open Settings, toggle one dietary tag, press save,
     * and be silently switched to metric with their phase and phase start date
     * reset. Nothing warns them; the save reports success.
     *
     * Reproduced at roughly 1 run in 4 by
     * "saving one setting does not clobber the others" -- which is why it first
     * showed up as an intermittently failing test rather than a bug report, and
     * why an earlier attempt to dismiss it as a test artefact was wrong.
     *
     * A spinner is the honest answer: there is nothing meaningful to edit until
     * the data is here.
     */
    if (loading.initial) {
        return (
            <div className="flex items-center justify-center py-20" aria-busy="true">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="sr-only">Loading your settings</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-dark">
            <div className="flex-1 overflow-y-auto pb-32">
                <div className="max-w-[960px] mx-auto px-4 md:px-8 pt-8 pb-8">
                    <div className="mb-8">
                        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-2">Settings & Preferences</h1>
                        <p className="text-text-secondary text-base font-normal leading-normal max-w-2xl">
                            Manage your profile, goals, and nutrition plan all in one place.
                        </p>
                    </div>

                    <div className="border-b border-surface-border mb-8 overflow-visible sm:overflow-x-auto sm:scrollbar-hide">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:gap-6 sm:min-w-max">
                            {settingsTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex min-w-0 flex-col items-center justify-center border-b-[3px] px-1 pb-3 pt-4 text-center transition-colors ${activeTab === tab.id
                                        ? 'border-b-primary text-white'
                                        : 'border-b-transparent text-text-secondary hover:text-white'
                                        }`}
                                >
                                    <span className="whitespace-nowrap text-sm font-bold leading-normal tracking-[0.015em]">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* PROFILE TAB */}
                        <section className={activeTab === 'profile' ? 'block' : 'hidden'}>
                            <div className="bg-surface-dark border border-surface-border p-6 rounded-xl space-y-6">
                                <div>
                                    <label className="text-white font-bold block mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => {
                                            setProfileName(e.target.value);
                                            markChanged();
                                        }}
                                        className="w-full bg-background-dark border border-surface-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div>
                                    <label className="text-white font-bold block mb-4">Choose an Avatar</label>
                                    <div className="flex flex-wrap gap-4">
                                        {AVATARS.map((avatar, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setProfileAvatar(avatar);
                                                    markChanged();
                                                }}
                                                className={`relative size-16 rounded-full overflow-hidden border-2 transition-all ${profileAvatar === avatar ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-surface-border opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                <span
                                                    className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                                                    style={{ background: avatarGradientByName(avatar) }}
                                                >
                                                    {initialsFrom(profileName)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GOALS & NUTRITION TAB */}
                        <section className={activeTab === 'coaching' ? 'block' : 'hidden'}>
                            <div className="bg-surface-dark border border-surface-border p-6 rounded-xl mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white text-lg font-bold">Current Phase</h3>
                                    <p className="text-primary font-bold">Week {localSettings.phaseStartDate ? Math.floor((Date.now() - new Date(localSettings.phaseStartDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1 : 1}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'fat-loss', label: 'Fat Loss', icon: 'local_fire_department' },
                                        { id: 'maintenance', label: 'Maintenance', icon: 'balance' },
                                        { id: 'muscle-gain', label: 'Muscle Gain', icon: 'fitness_center' }
                                    ].map(phase => (
                                        <button
                                            key={phase.id}
                                            onClick={() => handleLocalChange('phase', phase.id)}
                                            aria-pressed={localSettings.phase === phase.id}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${localSettings.phase === phase.id
                                                ? 'border-primary bg-primary/10 text-white'
                                                : 'border-surface-border bg-background-dark text-text-secondary hover:border-primary/50 hover:text-white'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined mb-2">{phase.icon}</span>
                                            <span className="font-bold text-sm">{phase.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-surface-dark border border-surface-border p-6 rounded-xl space-y-4">
                                    <label className="block">
                                        <span className="text-white font-medium block mb-2">Current Weight ({weightUnitLabel})</span>
                                        <input
                                            id="settings-current-weight"
                                            aria-label={`Current Weight (${weightUnitLabel})`}
                                            className="w-full rounded-lg text-white bg-background-dark h-12 border border-surface-border px-4"
                                            type="number"
                                            value={localSettings.currentWeight ?? ''}
                                            placeholder="Not set"
                                            onChange={(e) => handleLocalChange('currentWeight', parseFloat(e.target.value))}
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-white font-medium block mb-2">Goal Weight ({weightUnitLabel})</span>
                                        <input
                                            id="settings-goal-weight"
                                            aria-label={`Goal Weight (${weightUnitLabel})`}
                                            className="w-full rounded-lg text-white bg-background-dark h-12 border border-surface-border px-4"
                                            type="number"
                                            value={localSettings.goalWeight ?? ''}
                                            placeholder="Not set"
                                            onChange={(e) => handleLocalChange('goalWeight', parseFloat(e.target.value))}
                                        />
                                    </label>
                                </div>

                                <div className="bg-surface-dark border border-surface-border p-6 rounded-xl flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-white font-bold">Rate of Change</span>
                                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-sm font-bold">{getRateLabel(localSettings.rateOfChange || 0)}</span>
                                        </div>
                                        <div className="text-xs text-text-secondary mb-4">
                                            Est. Deficit: <span className="text-white">-{getCalorieDeficit(localSettings.rateOfChange || 0)} kcal/day</span>
                                        </div>
                                        <input
                                            id="settings-rate-of-change"
                                            aria-label="Rate of Change"
                                            className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary"
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={localSettings.rateOfChange || 0}
                                            onChange={(e) => handleLocalChange('rateOfChange', parseInt(e.target.value))}
                                        />
                                        <div className="flex justify-between text-[10px] text-text-secondary mt-2">
                                            <span>Slow</span>
                                            <span>Moderate</span>
                                            <span>Fast</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-surface-border">
                                        <div className="flex justify-between items-center bg-background-dark p-3 rounded-lg border border-surface-border/50">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-text-secondary font-bold uppercase">Daily Target</span>
                                                <span className="text-xl font-bold text-white">{localSettings.dailyCalorieTarget ? `${localSettings.dailyCalorieTarget} kcal` : 'Not set'}</span>
                                            </div>
                                            <button
                                                disabled={!localSettings.currentWeight}
                                                title={localSettings.currentWeight ? 'Recalculate from your weight and rate' : 'Enter your current weight first'}
                                                onClick={() => {
                                                    // AUD-103: this silently assumed a 185 lb body when the
                                                    // user had not entered one. It is disabled until they have.
                                                    if (!localSettings.currentWeight) return;
                                                    const weightLb = settingsUnit === 'imperial'
                                                        ? localSettings.currentWeight
                                                        : fromKg(toKg(localSettings.currentWeight, settingsUnit), 'imperial');
                                                    const maint = weightLb * 14;
                                                    const deficit = getCalorieDeficit(localSettings.rateOfChange || 0);
                                                    handleLocalChange('dailyCalorieTarget', Math.round(maint - deficit));
                                                }}
                                                className="text-primary text-xs font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                                            >
                                                Auto-Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-dark border border-surface-border p-6 rounded-xl mb-6">
                                <label className="flex flex-col w-full">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-white text-base font-medium leading-normal">Daily Calorie Target</p>
                                    </div>
                                    <input
                                        id="settings-daily-calorie-target"
                                        aria-label="Daily Calorie Target"
                                        className="w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-surface-border bg-background-dark h-12 placeholder-text-secondary px-4 text-base font-bold text-lg"
                                        type="number"
                                        value={localSettings.dailyCalorieTarget ?? ''}
                                        placeholder="Not set"
                                        onChange={(e) => {
                                            const newTarget = parseInt(e.target.value) || 0;
                                            handleLocalChange('dailyCalorieTarget', newTarget);
                                        }}
                                    />
                                    <p className="text-text-secondary text-xs pt-2">Set your own custom calorie target if you prefer.</p>
                                </label>
                            </div>

                            <div className="bg-surface-dark border border-surface-border p-6 rounded-xl mb-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-white text-lg font-bold">Nutrition Goals</h3>
                                    <div className="flex bg-background-dark rounded-lg p-1 border border-surface-border">
                                        <button
                                            onClick={() => { handleLocalChange('macroMode', 'percentage'); }}
                                            aria-pressed={localSettings.macroMode === 'percentage'}
                                            className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${localSettings.macroMode === 'percentage' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                                        >
                                            Percentage %
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleLocalChange('macroMode', 'grams');
                                                // Initialize targets if needed based on current calories
                                                if (!localSettings.macroTargets && localSettings.dailyCalorieTarget) {
                                                    const cals = localSettings.dailyCalorieTarget;
                                                    const p = Math.round((cals * 0.3) / 4);
                                                    const c = Math.round((cals * 0.35) / 4);
                                                    const f = Math.round((cals * 0.35) / 9);
                                                    handleLocalChange('macroTargets', { protein: p, carbs: c, fat: f });
                                                }
                                            }}
                                            aria-pressed={localSettings.macroMode === 'grams'}
                                            className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${localSettings.macroMode === 'grams' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                                        >
                                            Exact Grams
                                        </button>
                                    </div>
                                </div>

                                {localSettings.macroMode === 'percentage' ? (
                                    /* PERCENTAGE MODE */
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-text-secondary">Distribution</span>
                                            <span className={`text-sm font-bold ${macroTotal === 100 ? 'text-primary' : 'text-orange-500'}`}>
                                                Total Split: {macroTotal}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-white font-bold">Protein</span>
                                                <span className="text-primary">{localSettings.macroSplit?.protein}%</span>
                                            </div>
                                            <input aria-label="Protein percentage" type="range" min="0" max="100" step="5" value={localSettings.macroSplit?.protein || 0} onChange={(e) => handleMacroChange('protein', parseInt(e.target.value))} className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-white font-bold">Carbs</span>
                                                <span className="text-amber-500">{localSettings.macroSplit?.carbs}%</span>
                                            </div>
                                            <input aria-label="Carbs percentage" type="range" min="0" max="100" step="5" value={localSettings.macroSplit?.carbs || 0} onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value))} className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-white font-bold">Fat</span>
                                                <span className="text-blue-500">{localSettings.macroSplit?.fat}%</span>
                                            </div>
                                            <input aria-label="Fat percentage" type="range" min="0" max="100" step="5" value={localSettings.macroSplit?.fat || 0} onChange={(e) => handleMacroChange('fat', parseInt(e.target.value))} className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        </div>
                                    </div>
                                ) : (
                                    /* GRAMS MODE */
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="settings-protein-target" className="block text-xs font-bold text-primary mb-1">Protein (g)</label>
                                            <input
                                                id="settings-protein-target"
                                                aria-label="Protein target grams"
                                                type="number"
                                                value={localSettings.macroTargets?.protein || 0}
                                                onChange={(e) => handleTargetChange('protein', parseInt(e.target.value))}
                                                className="w-full bg-background-dark border border-surface-border rounded-lg px-3 py-3 text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="settings-carbs-target" className="block text-xs font-bold text-amber-500 mb-1">Carbs (g)</label>
                                            <input
                                                id="settings-carbs-target"
                                                aria-label="Carbs target grams"
                                                type="number"
                                                value={localSettings.macroTargets?.carbs || 0}
                                                onChange={(e) => handleTargetChange('carbs', parseInt(e.target.value))}
                                                className="w-full bg-background-dark border border-surface-border rounded-lg px-3 py-3 text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="settings-fat-target" className="block text-xs font-bold text-blue-500 mb-1">Fat (g)</label>
                                            <input
                                                id="settings-fat-target"
                                                aria-label="Fat target grams"
                                                type="number"
                                                value={localSettings.macroTargets?.fat || 0}
                                                onChange={(e) => handleTargetChange('fat', parseInt(e.target.value))}
                                                className="w-full bg-background-dark border border-surface-border rounded-lg px-3 py-3 text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                        </div>
                                        <div className="col-span-3 text-center text-xs text-text-secondary mt-2">
                                            Auto-Calculated Calories: <span className="text-white font-bold">{localSettings.dailyCalorieTarget ? `${localSettings.dailyCalorieTarget} kcal` : '—'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-surface-dark border border-surface-border p-6 rounded-xl mb-6">
                                <h3 className="text-white text-lg font-bold mb-4">Hydration Preferences</h3>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <label className="flex-1">
                                        <span className="text-white font-medium block mb-2">Custom Bottle Size (ml)</span>
                                        <input
                                            id="settings-bottle-size"
                                            aria-label="Custom Bottle Size (ml)"
                                            className="w-full rounded-lg text-white bg-background-dark h-12 border border-surface-border px-4"
                                            type="number"
                                            value={localSettings.bottleSize || ''}
                                            onChange={(e) => handleLocalChange('bottleSize', parseInt(e.target.value))}
                                        />
                                        <p className="text-text-secondary text-xs pt-2">Used for quick logging on the dashboard.</p>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-surface-dark border border-surface-border p-6 rounded-xl">
                                    <h3 className="text-white text-lg font-bold mb-4">Dietary Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {dietaryTagsList.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleDietaryTag(tag.id)}
                                                aria-pressed={localSettings.dietaryTags?.includes(tag.id) || false}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${localSettings.dietaryTags?.includes(tag.id) ? 'bg-primary text-background-dark font-bold' : 'bg-background-dark border border-surface-border text-text-secondary hover:text-white'}`}
                                            >
                                                {tag.label}
                                                {localSettings.dietaryTags?.includes(tag.id) && <span className="material-symbols-outlined text-[16px]">close</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-surface-dark border border-surface-border p-6 rounded-xl">
                                    <h3 className="text-white text-lg font-bold mb-4">Allergies</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish', 'Fish'].map(allergen => (
                                            <button
                                                key={allergen}
                                                onClick={() => {
                                                    const current = localSettings.allergies || [];
                                                    const updated = current.includes(allergen) ? current.filter((a: string) => a !== allergen) : [...current, allergen];
                                                    handleLocalChange('allergies', updated);
                                                }}
                                                aria-pressed={localSettings.allergies?.includes(allergen) || false}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${localSettings.allergies?.includes(allergen) ? 'bg-rose-500 text-white font-bold' : 'bg-background-dark border border-surface-border text-text-secondary hover:text-white'}`}
                                            >
                                                {allergen}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* INTEGRATIONS TAB */}
                        <section className={activeTab === 'integrations' ? 'block' : 'hidden'}>
                            <div className="bg-surface-dark border border-surface-border p-8 rounded-xl text-center">
                                <div className="w-20 h-20 bg-surface-border/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-4xl text-text-secondary">watch</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Wearable Integrations</h2>
                                <p className="text-text-secondary max-w-md mx-auto mb-8">
                                    Sync your step count and calorie burn directly from your favorite devices. Coming soon in v2.0.
                                </p>
                                <div className="flex justify-center gap-4 opacity-50">
                                    <div className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold text-white">Apple Health</div>
                                    <div className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold text-white">Fitbit</div>
                                    <div className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold text-white">Oura</div>
                                </div>
                            </div>
                        </section>

                        {/* AI SAFETY TAB */}
                        {activeTab === 'ai-safety' && (
                            <section>
                                <AiSpendSafetyPanel />
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Footer Bar */}
            {hasChanges && (
                <div className="absolute bottom-0 w-full bg-background-dark/95 backdrop-blur-md border-t border-surface-border p-4 md:p-6 z-10" role="status" aria-live="polite">
                    <div className="max-w-[960px] mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <p className="text-text-secondary text-sm">
                                {saveError || 'Changes will apply to your next meal plan generation.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={resetDraft}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-lg text-white font-bold text-sm hover:bg-surface-dark transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={saveChanges}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-[0_0_15px_rgba(167,139,250,0.2)] transition-all flex items-center justify-center gap-2"
                            >
                                Confirm Targets
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
