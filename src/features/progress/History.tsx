import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/auth-context';
import { getMealPlans, type MealPlan } from '../meal-planning/planService';
import { buildMetricSummary } from './lib/metric-summary';
import { getWeightHistory, type DailyLog } from '../../services/userService';
import { formatDateKey } from '../../shared/date-utils';
import { useAppStore } from '../../app/providers/store';
import { weightSuffix } from '../../shared/units';

interface HistoryWeek {
    id: string;
    weekStart: string;
    weekEnd: string;
    goal: string;
    totalMeals: number;
    completedMeals: number;
    avgCalories: number;
    avgProtein: number;
    completionRate: number;
}

function planToHistoryWeek(plan: MealPlan, index: number): HistoryWeek {
    const totalMeals = plan.days.reduce((sum, day) => sum + day.meals.length, 0);
    const completedMeals = plan.days.reduce(
        (sum, day) => sum + day.meals.filter((meal) => meal.isEaten).length,
        0
    );

    return {
        id: plan.id || `plan-${index}`,
        weekStart: plan.weekStart,
        weekEnd: plan.weekEnd,
        goal: plan.goal || 'Saved meal plan',
        totalMeals,
        completedMeals,
        avgCalories: Math.round(plan.dailyTargets?.calories || 0),
        avgProtein: Math.round(plan.dailyTargets?.protein || 0),
        completionRate: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
    };
}


function formatDateRange(start: string, end: string) {
    // AUD-099: new Date('YYYY-MM-DD') parses as UTC midnight, so this rendered
    // one day early for anyone west of Greenwich -- and disagreed with the Meal
    // Planner, which parsed the same key differently.
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${formatDateKey(start, opts, 'en-US')} - ${formatDateKey(end, opts, 'en-US')}`;
}

/** AUD-100: how many weeks the page renders. The query cap is separate and larger. */
const VISIBLE_WEEKS = 8;

export default function History() {
    const { user } = useAuth();
    // AUD-122: weights are stored in the unit the user chose, so the label is
    // all that changes here. Never hardcode "lbs" -- metric is the default.
    const { userSettings } = useAppStore();
    const weightUnitLabel = weightSuffix(userSettings?.measurementUnit ?? 'metric');
    const [weeks, setWeeks] = useState<HistoryWeek[]>([]);
    // AUD-100: how many plans exist, so the page can say when it is showing a
    // subset instead of implying it showed everything.
    const [totalSavedPlans, setTotalSavedPlans] = useState(0);
    const [metricLogs, setMetricLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [savedPlans, dailyLogs] = await Promise.all([
                getMealPlans(user.uid),
                getWeightHistory(user.uid),
            ]);
            setTotalSavedPlans(savedPlans.length);
            setWeeks(savedPlans.slice(0, VISIBLE_WEEKS).map(planToHistoryWeek));
            setMetricLogs(dailyLogs);
        } catch (error) {
            console.error('Failed to load history:', error);
            setWeeks([]);
            setTotalSavedPlans(0);
            setMetricLogs([]);
            setError('We could not load your history right now. Please retry when Firebase is available.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // AUD-101: keyed on the logs, so it recomputes when they change and not on
    // every unrelated re-render.
    const metricSummary = useMemo(() => buildMetricSummary(metricLogs), [metricLogs]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
                        Plan History
                    </h1>
                    <p className="text-text-secondary">
                        Browse saved meal plans and recent daily logs from your private history.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">History could not load</h2>
                            <p className="text-sm text-red-100 mt-1">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadHistory}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            Retry History
                        </button>
                    </div>
                </div>
            )}

            {!error && (
                <section className="bg-surface-dark rounded-xl border border-surface-border p-5 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-white">Recent Metrics</h2>
                            <p className="text-sm text-text-secondary mt-1">
                                Real entries from daily logs. Trend charts are coming later.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-background-dark/60 rounded-lg p-3 border border-surface-border/70">
                                <p className="text-lg font-black text-white">{metricSummary.totalDays}</p>
                                <p className="text-[11px] text-text-secondary uppercase tracking-wide">Logged days</p>
                            </div>
                            <div className="bg-background-dark/60 rounded-lg p-3 border border-surface-border/70">
                                <p className="text-lg font-black text-white">
                                    {metricSummary.latestWeight ? `${metricSummary.latestWeight} ${weightUnitLabel}` : '--'}
                                </p>
                                <p className="text-[11px] text-text-secondary uppercase tracking-wide">
                                    Weight ({metricSummary.weightDays})
                                </p>
                            </div>
                            <div className="bg-background-dark/60 rounded-lg p-3 border border-surface-border/70">
                                <p className="text-lg font-black text-white">
                                    {metricSummary.latestSleep ? `${metricSummary.latestSleep}h` : '--'}
                                </p>
                                <p className="text-[11px] text-text-secondary uppercase tracking-wide">
                                    Sleep ({metricSummary.sleepDays})
                                </p>
                            </div>
                            <div className="bg-background-dark/60 rounded-lg p-3 border border-surface-border/70">
                                <p className="text-lg font-black text-white">
                                    {metricSummary.latestWater ? `${metricSummary.latestWater}ml` : '--'}
                                </p>
                                <p className="text-[11px] text-text-secondary uppercase tracking-wide">
                                    Water ({metricSummary.waterDays})
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="space-y-4">
                {!error && weeks.length === 0 && (
                    <div className="bg-surface-dark rounded-xl border border-surface-border p-8 text-center">
                        <div className="w-14 h-14 bg-surface-border/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>history</span>
                        </div>
                        <h2 className="text-xl font-black text-white">No saved plans yet</h2>
                        <p className="text-text-secondary mt-2 max-w-md mx-auto">
                            Create and save a meal plan, then return here to review it.
                        </p>
                        <Link
                            to="/plan"
                            className="inline-flex items-center gap-2 mt-5 bg-primary hover:bg-primary/90 text-background-dark px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restaurant_menu</span>
                            Open Meal Planner
                        </Link>
                    </div>
                )}

                {/*
                  * AUD-100: the page used to show the newest eight and say
                  * nothing, so after eight weeks of use older plans simply
                  * stopped existing as far as the UI was concerned. The read is
                  * now capped in the query, and the cap is stated out loud.
                  */}
                {!error && totalSavedPlans > weeks.length && (
                    <p className="text-sm text-text-secondary px-1">
                        Showing your {weeks.length} most recent weeks of {totalSavedPlans} saved.
                    </p>
                )}

                {!error && weeks.map((week, index) => (
                    <div
                        key={week.id}
                        className={`relative bg-surface-dark rounded-xl border ${index === 0 ? 'border-primary/50 ring-1 ring-primary/20' : 'border-surface-border'} p-5 hover:border-primary/30 transition-colors group`}
                    >
                        {index === 0 && (
                            <div className="absolute -top-2 left-4 bg-primary text-background-dark text-[10px] font-bold px-2 py-0.5 rounded">
                                MOST RECENT
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-surface-border/50 rounded-lg flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>calendar_month</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                        {formatDateRange(week.weekStart, week.weekEnd)}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <span className="text-xs text-text-secondary">
                                            <span className="text-white font-medium">{week.completedMeals}</span>/{week.totalMeals} meals
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-border text-text-secondary">
                                            {week.goal}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                        <p className="text-white font-bold">{week.avgCalories || '--'}</p>
                                        <p className="text-[10px] text-text-secondary">Target kcal</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-primary font-bold">{week.avgProtein ? `${week.avgProtein}g` : '--'}</p>
                                        <p className="text-[10px] text-text-secondary">Protein</p>
                                    </div>
                                </div>

                                <div className="relative w-14 h-14">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                                        <circle
                                            cx="18" cy="18" r="16"
                                            fill="none"
                                            stroke="#1f2937"
                                            strokeWidth="3"
                                        />
                                        <circle
                                            cx="18" cy="18" r="16"
                                            fill="none"
                                            stroke={week.completionRate >= 80 ? '#A78BFA' : week.completionRate >= 60 ? '#FBBF24' : '#EF4444'}
                                            strokeWidth="3"
                                            strokeDasharray={`${week.completionRate} 100`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                        {week.completionRate}%
                                    </span>
                                </div>

                                <Link
                                    to="/plan"
                                    className="bg-surface-border/50 hover:bg-primary/20 text-text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                                    <span className="hidden sm:inline">Open Planner</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!error && weeks.length > 0 && (
                <div className="mt-8 text-center text-text-secondary text-sm">
                    <p>Showing up to 8 saved meal plans, ordered by week start.</p>
                </div>
            )}
        </div>
    );
}
