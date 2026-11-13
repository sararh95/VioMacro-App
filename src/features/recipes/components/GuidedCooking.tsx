import { useState, useEffect } from 'react';

import { type Recipe } from '../recipeService';
import { SmartText } from '../../../shared/smart-text';
import { formatIngredientAmount, recipeServings } from '../../../shared/ingredients';
import RecipeThumb from './RecipeThumb';

interface GuidedCookingProps {
    recipe: Recipe;
    onExit: () => void;
    servings?: number;
}

export default function GuidedCooking({ recipe, onExit, servings }: GuidedCookingProps) {
    const steps = recipe.instructions?.map((inst, i) => ({
        title: `Step ${i + 1}`,
        desc: inst.step,
        duration: inst.timer || 0
    })) ?? [];
    const [currentStep, setCurrentStep] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(() => steps[0]?.duration ?? 0);
    const [emulatorWarningHeight, setEmulatorWarningHeight] = useState(0);

    useEffect(() => {
        // The Auth SDK warning is fixed over the viewport. Keep it visible and
        // reserve its actual wrapped height instead of covering cooking actions.
        const warning = document.querySelector('.firebase-emulator-warning');
        if (!warning) return;
        const observer = new ResizeObserver(() => {
            setEmulatorWarningHeight(Math.ceil(warning.getBoundingClientRect().height));
        });
        observer.observe(warning);
        return () => observer.disconnect();
    }, []);

    // Prepare ingredients map (showing all ingredients on side since we don't have per-step mapping)
    // In complex app we would map them, for now we list all needed for the recipe
    const ratio = recipeServings(servings ?? recipe.servings) / recipeServings(recipe.servings);
    const allIngredients = (recipe.ingredients || []).map(ingredient => ({
        ...ingredient,
        displayAmount: formatIngredientAmount(ingredient, ratio),
        display: `${formatIngredientAmount(ingredient, ratio)} ${ingredient.item}`.trim(),
    }));

    const timerRunning = timerActive && timeLeft > 0;
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (timerRunning) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setTimerActive(!timerActive);
    const resetTimer = () => {
        setTimerActive(false);
        setTimeLeft(steps[currentStep].duration);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setTimerActive(false);
            setTimeLeft(steps[currentStep + 1].duration);
        } else {
            onExit();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setTimerActive(false);
            setTimeLeft(steps[currentStep - 1].duration);
        }
    };

    const step = steps[currentStep];
    const progress = steps.length ? Math.round(((currentStep + 1) / steps.length) * 100) : 0;
    // Leave one pixel for fractional positions after a scroll into view.
    const bottomInset = emulatorWarningHeight ? emulatorWarningHeight + 1 : 0;

    return (
        <div style={{ bottom: bottomInset }} className="fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-slate-900 dark:text-white flex flex-col overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-solid border-slate-200 dark:border-[#23482f] bg-background-light dark:bg-background-dark px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="size-8 text-primary">
                        <span className="material-symbols-outlined text-3xl">nutrition</span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight">VioMacro <span className="opacity-50 font-normal text-lg ml-2 hidden sm:inline-block">Guided Mode</span></h2>
                </div>
                <div className="flex gap-3">
                    <button onClick={onExit} aria-label="Full Recipe" className="hidden sm:flex group h-10 items-center justify-center gap-2 rounded-lg px-4 bg-slate-200 dark:bg-surface-highlight hover:bg-slate-300 dark:hover:bg-[#2f5e3e] transition-colors text-sm font-bold">
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                        <span className="truncate">Full Recipe</span>
                    </button>
                    <button onClick={onExit} className="flex h-10 items-center justify-center gap-2 rounded-lg px-4 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-bold">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                        <span className="truncate">Exit</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            {steps.length === 0 ? (
                <main className="flex-1 min-h-0 overflow-y-auto px-6 py-12">
                    <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-5">
                        <h1 className="text-3xl font-extrabold">No instructions available</h1>
                        <p className="text-slate-600 dark:text-slate-300">There are no preparation steps saved for this recipe. Return to the full recipe to review its ingredients.</p>
                        <button type="button" onClick={onExit} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 font-bold text-background-dark">
                            Back to recipe
                        </button>
                    </section>
                </main>
            ) : (
            <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel: Visuals */}
                <section className="flex-1 lg:flex-[1.4] p-4 lg:p-8 flex flex-col gap-6 overflow-y-auto bg-black/5 dark:bg-black/20">
                    {/* Progress Bar */}
                    <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto">
                        <div className="flex justify-between items-end">
                            <p className="text-slate-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Cooking Progress</p>
                            <p className="text-slate-900 dark:text-primary text-base font-bold">Step {currentStep + 1} <span className="text-slate-400 dark:text-gray-400 font-normal">of {steps.length}</span></p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-surface-highlight rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(19,236,91,0.4)]" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    {/* Media Container */}
                    <div className="relative w-full aspect-video bg-slate-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group max-w-4xl mx-auto">
                        <RecipeThumb title={recipe.title} imageUrl={recipe.imageUrl} macros={recipe} className="absolute inset-0 w-full h-full object-cover" initialClassName="text-6xl" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                            <button disabled aria-label="Replay Video coming soon" title="Recipe video coming soon" className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 cursor-not-allowed opacity-70">
                                <span className="material-symbols-outlined">play_circle</span>
                                <span className="text-sm font-medium">Replay Video · Coming Soon</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Right Panel: Instructions & Tools */}
                <section className="flex-1 lg:flex-1 bg-white dark:bg-[#0d1c12] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-[#23482f] flex flex-col p-6 lg:p-10 overflow-y-auto relative shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-10">
                    <div className="max-w-xl mx-auto flex flex-col h-full w-full">
                        {/* Step Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-4">
                                {step.title}
                            </h1>
                            <div className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                <SmartText text={step.desc} ingredients={allIngredients} />
                            </div>
                        </div>

                        {/* Active Ingredients Card */}
                        <div className="bg-slate-50 dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-[#23482f] mb-8">
                            <div className="flex items-center gap-2 mb-3 text-primary">
                                <span className="material-symbols-outlined text-[20px]">grocery</span>
                                <span className="text-xs font-bold uppercase tracking-widest">Recipe Ingredients</span>
                            </div>
                            <ul className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                {allIngredients.map((ing, i) => (
                                    <li key={i} className="flex justify-between items-center text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                                        <span className="font-medium text-sm">{ing.item}</span>
                                        <span className="font-bold opacity-80 text-sm whitespace-nowrap ml-2">{ing.displayAmount}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Integrated Timer Widget */}
                        <div className="mt-auto mb-8">
                            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-surface-highlight dark:to-[#1a3824] rounded-2xl p-6 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-gray-300">
                                        <span className="material-symbols-outlined">timer</span>
                                        <span className="text-sm font-semibold uppercase tracking-wider">Step Timer</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-white dark:bg-[#112217] rounded-xl h-24 flex items-center justify-center border border-slate-200 dark:border-[#23482f] shadow-sm">
                                        <span className="text-5xl lg:text-6xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">{formatTime(timeLeft)}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button aria-label={timerActive ? 'Pause step timer' : 'Start step timer'} onClick={toggleTimer} className={`size-14 rounded-xl ${timerActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-[#0ec94d]'} active:scale-95 transition-all flex items-center justify-center text-background-dark shadow-lg shadow-primary/20 group`}>
                                            <span className="material-symbols-outlined text-3xl">{timerActive ? 'pause' : 'play_arrow'}</span>
                                        </button>
                                        <button aria-label="Reset step timer" onClick={resetTimer} className="h-8 w-14 rounded-lg bg-slate-200 dark:bg-[#112217] hover:bg-slate-300 dark:hover:bg-[#2f5e3e] text-slate-600 dark:text-white/60 transition-colors flex items-center justify-center border border-transparent dark:border-white/5">
                                            <span className="material-symbols-outlined text-xl">refresh</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex gap-4 mt-auto">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="flex-1 group flex items-center justify-center gap-3 h-16 rounded-xl border-2 border-slate-200 dark:border-surface-highlight hover:border-slate-300 dark:hover:border-[#2f5e3e] hover:bg-slate-100 dark:hover:bg-surface-highlight/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-slate-400 dark:text-gray-500 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                <span className="text-lg font-bold text-slate-600 dark:text-gray-300">Previous</span>
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-[2] group flex items-center justify-center gap-3 h-16 rounded-xl bg-primary hover:bg-[#0ec94d] active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(19,236,91,0.25)]"
                            >
                                <span className="text-lg font-bold text-background-dark">{currentStep === steps.length - 1 ? 'Finish' : 'Next Step'}</span>
                                <span className="material-symbols-outlined text-background-dark group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>
            )}
        </div>
    );
}
