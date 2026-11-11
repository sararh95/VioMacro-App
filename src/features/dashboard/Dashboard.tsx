import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../app/providers/auth-context';
import { useAppStore } from '../../app/providers/store';
import { type MealPlanDay, type MealPlanMeal } from '../meal-planning/planService';
import { addWaterMl, getWeightHistory, type DailyLog, logDailyMetric } from '../../services/userService';
import { SleepLogModal } from './components/SleepLogModal';
import { ActivityCalendarWidget } from './components/ActivityCalendarWidget';
import CheckInModal from './components/CheckInModal';
import OnboardingWizard from '../auth/OnboardingWizard';
import WeightHistoryWidget from './components/WeightHistoryWidget';
import { parseLocalDateKey, toLocalDateKey } from '../../shared/date-utils';
import { mergeDailyLog } from '../progress/lib/daily-logs';
import { trackSave } from '../../shared/pending-saves';

const MAX_DAILY_WATER_ML = 10000;

export default function Dashboard() {
  const { user } = useAuth();
  const { activePlan, userSettings, updateSettings, loading } = useAppStore(); // Destructure updateSettings
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInMode, setCheckInMode] = useState<'full' | 'quick'>('full');
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [bottleSize, setBottleSize] = useState(500); // Default 500ml
  const [isLoggingWater, setIsLoggingWater] = useState(false);
  const [isCorrectingWater, setIsCorrectingWater] = useState(false);
  const [waterCorrectionValue, setWaterCorrectionValue] = useState('');
  const [waterCorrectionError, setWaterCorrectionError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * AUD-049: apply a known change to today's log in memory.
   *
   * Every water tap, water correction and sleep save used to bump refreshTrigger,
   * and the effect keyed on it refetched the ENTIRE weight history -- one
   * document per day, so a year of use meant 365 reads to add 250 ml.
   *
   * In all three cases the app already knows exactly what changed. The full
   * refetch is kept only where it does not: the check-in modal writes its own
   * record, and the Retry button is the user asking for fresh data.
   */
  const applyDayLog = useCallback((date: string, patch: Partial<DailyLog>) => {
    setWeightHistory(prev => mergeDailyLog(prev, date, patch));
  }, []);
  const [weightHistory, setWeightHistory] = useState<DailyLog[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // AUD-050 / AUD-015: a fetch in an effect with no cleanup can land after the
  // user has changed, writing one account's data into another's screen. Same
  // guard as RecipePicker, which already had it.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    setDashboardError(null);
    getWeightHistory(user.uid)
      .then((history) => {
        if (cancelled) return;
        setWeightHistory(history);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load dashboard history", error);
        setDashboardError("We couldn't load your latest dashboard history. Please retry before trusting today's metrics.");
      });

    return () => { cancelled = true; };
  }, [user, refreshTrigger]);

  useEffect(() => {
    if (userSettings?.bottleSize) {
      setBottleSize(userSettings.bottleSize);
    }
  }, [userSettings]);

  const userName = (userSettings?.profileName || user?.displayName)?.split(' ')[0] || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate today's stats if active plan exists
  const todayStats = useMemo(() => {
    if (!activePlan) return null;
    const todayStr = toLocalDateKey(new Date());
    const todayPlan = activePlan.days.find(d => d.date.split('T')[0] === todayStr); // Allow T split just in case

    if (!todayPlan) return null;

    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    todayPlan.meals.forEach(meal => {
      if (meal.isEaten) {
        consumed.calories += meal.calories;
        consumed.protein += meal.protein || 0;
        consumed.carbs += meal.carbs || 0;
        consumed.fat += meal.fat || 0;
      }
    });

    // AUD-045: a plan without saved targets used to fall back to a hardcoded
    // 2000/150/200/65, shown as though it were the user's own goal. It now
    // returns null and the settings-derived targets below are used instead.
    return { consumed, targets: activePlan.dailyTargets ?? null };
  }, [activePlan]);

  const dashboardTargets = useMemo(() => {
    if (todayStats?.targets) return todayStats.targets;

    const calories = userSettings?.dailyCalorieTarget || 0;
    if (userSettings?.macroMode === 'grams' && userSettings.macroTargets) {
      return {
        calories,
        protein: userSettings.macroTargets.protein,
        carbs: userSettings.macroTargets.carbs,
        fat: userSettings.macroTargets.fat,
      };
    }

    const split = userSettings?.macroSplit || { protein: 0, carbs: 0, fat: 0 };
    return {
      calories,
      protein: calories ? Math.round((calories * split.protein) / 100 / 4) : 0,
      carbs: calories ? Math.round((calories * split.carbs) / 100 / 4) : 0,
      fat: calories ? Math.round((calories * split.fat) / 100 / 9) : 0,
    };
  }, [todayStats, userSettings]);

  const dashboardConsumed = todayStats?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // A target of 0 means "not set yet". Dividing by it would render Infinity.
  const pct = (consumed: number, target: number) =>
    target > 0 ? Math.min((consumed / target) * 100, 100) : 0;

  /**
   * AUD-046: this was O(365 x n).
   *
   * The outer loop ran 365 times and each iteration called
   * weightHistory.some(...), scanning the whole array again. With a year of logs
   * that is roughly 133,000 string comparisons -- recomputed whenever
   * weightHistory changes, which is every water tap, sleep log and check-in.
   *
   * The dates are already stored as plain YYYY-MM-DD keys, so a Set turns the
   * inner scan into a hash lookup: O(n + 365).
   */
  const streak = useMemo(() => {
    const loggedDays = new Set(weightHistory.map(w => w.date.slice(0, 10)));

    const today = new Date();
    let currentStreak = 0;

    // Check up to a year back.
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      if (loggedDays.has(toLocalDateKey(d))) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    return currentStreak;
  }, [weightHistory]);

  // Derived Daily Stats
  // FIX: Use local date for "today" logic to match user's wall clock, not UTC
  const todayLog = useMemo(() => {
    const todayLocal = toLocalDateKey(new Date());
    return (weightHistory.find(l => l.date.substring(0, 10) === todayLocal) || { date: todayLocal }) as DailyLog;
  }, [weightHistory]);

  // AUD-044: the check-in banner used to render unconditionally and assert
  // "Adherence was high last week!" — a hardcoded string. Nothing measured
  // adherence. It is now driven by a real signal: days since the last weigh-in.
  const weighInDates = useMemo(
    () => new Set(weightHistory.filter(l => typeof l.weight === 'number').map(l => l.date.substring(0, 10))),
    [weightHistory],
  );

  const daysSinceWeighIn = useMemo(() => {
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (weighInDates.has(toLocalDateKey(d))) return i;
    }
    return null; // no weigh-in in the last 30 days, or none at all
  }, [weighInDates]);

  const ADAPTIVE_ENGINE_MIN_WEIGH_INS = 14;
  const weighInCount = weighInDates.size;
  const weighInsRemaining = Math.max(0, ADAPTIVE_ENGINE_MIN_WEIGH_INS - weighInCount);
  const needsCheckIn = daysSinceWeighIn === null || daysSinceWeighIn >= 7;

  const waterIntake = todayLog.waterMl || 0;
  const sleepDuration = todayLog.sleepHours || 0;
  const sleepQuality = todayLog.sleepQuality || 0;

  const handleLogWater = async (amount: number) => {
    if (!user) return;
    setIsLoggingWater(true);
    try {
      // AUD-048: clamp to the same 0-10000 range the correction form enforces,
      // so hitting the cap says so instead of surfacing a rules rejection as a
      // connection error.
      const current = todayLog.waterMl || 0;
      const allowed = Math.max(0, Math.min(MAX_DAILY_WATER_ML - current, amount));
      if (allowed <= 0) {
        setDashboardError(`You have already logged the daily maximum of ${MAX_DAILY_WATER_ML.toLocaleString()} ml.`);
        return;
      }

      // AUD-047: increment() is applied server-side, so two fast taps both count.
      const today = toLocalDateKey(new Date());
      await addWaterMl(user.uid, allowed, today);
      // AUD-049: the new total is known, so no refetch is needed.
      applyDayLog(today, { waterMl: current + allowed });
    } catch (error) {
      console.error("Failed to log water", error);
      alert("Failed to log water. Please check your connection.");
    } finally {
      setIsLoggingWater(false);
    }
  };

  const openWaterCorrection = () => {
    setWaterCorrectionValue(String(todayLog.waterMl || 0));
    setWaterCorrectionError(null);
    setIsCorrectingWater(true);
  };

  const handleSaveWaterCorrection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const correctedAmount = Number(waterCorrectionValue);
    if (!Number.isFinite(correctedAmount) || correctedAmount < 0 || correctedAmount > 10000) {
      setWaterCorrectionError('Enter a water total between 0 and 10,000 ml.');
      return;
    }

    setIsLoggingWater(true);
    setWaterCorrectionError(null);
    try {
      const localDate = toLocalDateKey(new Date());
      const waterMl = Math.round(correctedAmount);
      await logDailyMetric(user.uid, 'water', {
        date: localDate,
        waterMl
      });
      setIsCorrectingWater(false);
      // AUD-049: this is an exact value, not a delta.
      applyDayLog(localDate, { waterMl });
    } catch (error) {
      console.error("Failed to correct water", error);
      setWaterCorrectionError("Couldn't save the corrected water total. Please try again.");
    } finally {
      setIsLoggingWater(false);
    }
  };

  const handleEditBottleSize = async () => {
    if (!user) return;
    const sizeStr = prompt("Enter your custom bottle size in ml:", bottleSize.toString());
    if (sizeStr) {
      const size = parseInt(sizeStr);
      if (!isNaN(size) && size > 0) {
        setBottleSize(size); // Optimistic update
        try {
          await trackSave(updateSettings({ bottleSize: size })); // Correctly use updateSettings from useAppStore
        } catch (e) {
          console.error("Failed to update bottle size", e);
          alert("Failed to save bottle size setting.");
          // Revert optimistic update if persistence fails
          setBottleSize(userSettings?.bottleSize || 500);
        }
      } else {
        alert("Please enter a valid positive number for bottle size.");
      }
    }
  };

  const handleSaveSleep = async (data: { date: string; sleepHours: number; sleepQuality: number; sleepNotes: string }) => {
    if (!user) return;
    try {
      // Normalize the date to ISO string if it's just YYYY-MM-DD, or keep as is if already ISO logic handled in service
      // Service expects YYYY-MM-DD or ISO. Let's ensure consistency.
      // The modal returns YYYY-MM-DD from the input[type=date].
      // logDailyMetric splits by 'T' so YYYY-MM-DD works fine.

      await logDailyMetric(user.uid, 'sleep', {
        date: data.date,
        sleepHours: data.sleepHours,
        sleepQuality: data.sleepQuality,
        sleepNotes: data.sleepNotes
      });

      setIsSleepModalOpen(false); // Close modal on success
      // AUD-049: the sleep modal can log a previous night, so patch that date
      // rather than assuming today.
      applyDayLog(data.date, {
        sleepHours: data.sleepHours,
        sleepQuality: data.sleepQuality,
        sleepNotes: data.sleepNotes,
      });

      // Optimistic update for immediate feedback if logging for today
      const todayStr = toLocalDateKey(new Date());
      if (data.date === todayStr) {
        // We could optimistically update local state here if we wanted to be fancy, 
        // but refreshTrigger should handle it fast enough with the emulator.
      }
    } catch (error) {
      console.error("Failed to save sleep", error);
      alert("Failed to save sleep log. Check console for details.");
    }
  };

  if (loading.initial) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-text-secondary">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {userSettings && !userSettings.onboardingCompleted && <OnboardingWizard />}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          // AUD-049: this one keeps the refetch on purpose. The modal writes its
          // own weight record and does not report back what it saved, so the
          // Dashboard genuinely does not know what changed. It is also a weekly
          // action, not a per-tap one.
          setRefreshTrigger(prev => prev + 1);
        }}
        mode={checkInMode}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
            {getGreeting()}, {userName}
          </h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            <p className="text-text-secondary text-base font-medium">
              Phase: <span className="text-white capitalize">{(userSettings?.phase || 'fat-loss').replace('-', ' ')}</span> • Week {
                userSettings?.phaseStartDate
                  ? Math.floor((Date.now() - new Date(userSettings.phaseStartDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1
                  : 1
              }
            </p>
          </div>
        </div>
      </div>

      {dashboardError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{dashboardError}</span>
          <button
            type="button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="self-start sm:self-auto rounded-lg bg-red-500/20 px-3 py-2 text-xs font-bold text-red-50 hover:bg-red-500/30 transition-colors"
          >
            Retry Dashboard Data
          </button>
        </div>
      )}

      {/* Weekly Check-In Alert — only when a real weigh-in gap exists (AUD-044) */}
      {needsCheckIn && (
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-background-dark p-1 relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent"></div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 md:p-8 bg-background-dark/60 backdrop-blur-sm rounded-xl">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-3 rounded-full text-primary shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>scale</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {daysSinceWeighIn === null ? 'Start tracking your weight' : 'Time to step on the scale'}
              </h3>
              <p className="text-text-secondary max-w-xl">
                {daysSinceWeighIn === null
                  ? 'VioMacro needs weigh-ins before it can track your trend or adjust your targets.'
                  : `Your last weigh-in was ${daysSinceWeighIn} days ago. Regular weigh-ins are what make your trend meaningful.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCheckInMode('full');
              setIsCheckInOpen(true);
            }}
            className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-[0_0_15px_rgba(167,139,250,0.3)] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>Start Check-In</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
      )}

      {/* Macro Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MacroCard
          label="Daily Calories"
          value={dashboardTargets.calories.toString()}
          unit="kcal"
          consumed={`${dashboardConsumed.calories}`}
          progress={pct(dashboardConsumed.calories, dashboardTargets.calories)}
          icon="local_fire_department"
          color="white"
        />
        <MacroCard
          label="Protein"
          value={dashboardTargets.protein.toString()}
          unit="g"
          consumed={`${dashboardConsumed.protein}g`}
          progress={pct(dashboardConsumed.protein, dashboardTargets.protein)}
          icon="egg_alt"
          color="primary"
        />
        <MacroCard
          label="Carbs"
          value={dashboardTargets.carbs.toString()}
          unit="g"
          consumed={`${dashboardConsumed.carbs}g`}
          progress={pct(dashboardConsumed.carbs, dashboardTargets.carbs)}
          icon="bakery_dining"
          color="blue-400"
        />
        <MacroCard
          label="Fat"
          value={dashboardTargets.fat.toString()}
          unit="g"
          consumed={`${dashboardConsumed.fat}g`}
          progress={pct(dashboardConsumed.fat, dashboardTargets.fat)}
          icon="water_drop"
          color="amber-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <WeightHistoryWidget
            onLogWeight={() => {
              setCheckInMode('quick');
              setIsCheckInOpen(true);
            }}
            refreshTrigger={refreshTrigger}
            data={weightHistory}
          />
        </div>

        {/* Engine Insights Sidebar */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-xl font-bold">Your Targets</h2>
          </div>

          <div className="space-y-4">
            {/* AUD-044: honest progress toward adaptive targets. The adaptive
                engine is not built yet, so this reports real weigh-in counts
                rather than claiming to be running. */}
            <div className="bg-surface-dark border border-surface-border p-5 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <span className="material-symbols-outlined">
                    {weighInsRemaining === 0 ? 'trending_up' : 'flag'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold mb-1">
                    {weighInsRemaining === 0 ? 'Enough data to see your trend' : 'Building your baseline'}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {weighInsRemaining === 0
                      ? 'Your targets are set from your profile. Adaptive adjustment is still being built.'
                      : `Your targets are set from your profile. ${weighInsRemaining} more ${weighInsRemaining === 1 ? 'weigh-in' : 'weigh-ins'} and VioMacro can show a reliable trend.`}
                  </p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-surface-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((weighInCount / ADAPTIVE_ENGINE_MIN_WEIGH_INS) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-text-secondary">
                    {weighInCount} of {ADAPTIVE_ENGINE_MIN_WEIGH_INS} weigh-ins
                    {streak > 0 && ` · ${streak} day streak`}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Calendar Widget */}
            <ActivityCalendarWidget logs={weightHistory} activePlan={activePlan} />

          </div>
        </div>
      </div>

      {/* Quick Actions and Other Widgets ... (Hydration/Sleep omitted for brevity in diff if unchanged? No, I must replace entire block if I am replacing render) */}
      {/* Reusing existing Hydration/Sleep Cards */}
      {/* Quick Actions and Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Hydration Card */}
        <div className="relative group overflow-hidden bg-surface-dark border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all shadow-[0_0_20px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-9xl text-blue-500 transform translate-x-4 -translate-y-4">water_drop</span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 ring-1 ring-blue-500/20">
                  <span className="material-symbols-outlined">water_full</span>
                </div>
                <h3 className="font-bold text-white">Hydration</h3>
              </div>
              {/* Quick Add Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleLogWater(250)}
                  disabled={isLoggingWater}
                  className="px-2 py-1 bg-surface-border hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary text-xs font-bold rounded-lg transition-all border border-transparent hover:border-blue-500/30"
                >
                  +250ml
                </button>
                <button
                  onClick={() => handleLogWater(bottleSize)}
                  disabled={isLoggingWater}
                  className="px-2 py-1 bg-surface-border hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary text-xs font-bold rounded-lg transition-all border border-transparent hover:border-blue-500/30 flex items-center gap-1"
                >
                  +{bottleSize}ml
                  <span
                    onClick={(e) => { e.stopPropagation(); handleEditBottleSize(); }}
                    className="material-symbols-outlined text-[10px] opacity-50 hover:opacity-100 p-0.5"
                  >
                    edit
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-black text-white tracking-tight">{waterIntake}</span>
              <span className="text-sm text-blue-400 font-medium mb-1.5">ml</span>
              <span className="text-sm text-text-secondary mb-1.5 ml-auto">Goal: 2,500</span>
            </div>

            <div className="w-full bg-surface-border/50 rounded-full h-2.5 mt-3 relative overflow-hidden backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${Math.min((waterIntake / 2500) * 100, 100)}%` }}
              ></div>
            </div>

            {/* Weekly Water Visualizer */}
            <div className="flex items-end justify-between h-8 mt-4 gap-1 px-1">
              {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                const d = new Date();
                d.setDate(d.getDate() - daysAgo);
                const localDate = toLocalDateKey(d);
                const log = weightHistory.find(l => l.date.substring(0, 10) === localDate);
                const ml = log?.waterMl || 0;
                const pct = Math.min((ml / 2500) * 100, 100);
                const isToday = daysAgo === 0;

                return (
                  <div key={daysAgo} className="flex flex-col items-center gap-1 w-full group/bar relative">
                    <div className="w-full bg-surface-border/30 rounded-full h-full relative overflow-hidden">
                      <div
                        className={`absolute bottom-0 w-full rounded-full transition-all ${isToday ? 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'bg-blue-500/40'}`}
                        style={{ height: `${pct}%` }}
                      ></div>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {ml}ml
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-3">
              <button
                type="button"
                onClick={openWaterCorrection}
                className="text-[10px] text-text-secondary hover:text-blue-300 flex items-center gap-1 transition-colors opacity-70 hover:opacity-100"
              >
                <span className="material-symbols-outlined text-xs">edit</span> Correct Entry
              </button>
              {waterIntake >= 2500 && (
                <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-xs">verified</span> Goal Reached!
                </span>
              )}
            </div>

            {isCorrectingWater && (
              <form onSubmit={handleSaveWaterCorrection} className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <label htmlFor="water-correction-ml" className="block text-[11px] font-bold uppercase tracking-wide text-blue-200">
                  Correct water intake (ml)
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="water-correction-ml"
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    inputMode="numeric"
                    value={waterCorrectionValue}
                    onChange={(event) => setWaterCorrectionValue(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface-darker px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoggingWater}
                      className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCorrectingWater(false)}
                      disabled={isLoggingWater}
                      className="rounded-lg border border-surface-border px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {waterCorrectionError && (
                  <p role="alert" className="mt-2 text-xs text-red-300">{waterCorrectionError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Sleep Card */}
        <div className="relative group overflow-hidden bg-surface-dark border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.05)]">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-9xl text-purple-500 transform translate-x-4 -translate-y-4">bedtime</span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 ring-1 ring-purple-500/20">
                  <span className="material-symbols-outlined">bedtime</span>
                </div>
                <h3 className="font-bold text-white">Sleep</h3>
              </div>
              <button
                onClick={() => setIsSleepModalOpen(true)}
                className="px-3 py-1.5 bg-surface-border hover:bg-purple-500/20 hover:text-purple-300 text-text-secondary text-xs font-bold rounded-lg transition-all border border-transparent hover:border-purple-500/30 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Log Sleep
              </button>
            </div>

            {sleepDuration > 0 ? (
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-black text-white tracking-tight">{sleepDuration}</span>
                  <span className="text-sm text-purple-400 font-medium mb-1.5">hours</span>
                  <div className="ml-auto flex items-center gap-1 bg-surface-border/50 px-2 py-1 rounded-lg">
                    <span className="text-xs text-text-secondary uppercase font-bold tracking-wider mr-1">Quality</span>
                    <span className={`text-sm font-bold ${sleepQuality >= 4 ? 'text-green-400' : sleepQuality >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>{sleepQuality}/5</span>
                  </div>
                </div>

                {/* Weekly Sleep Visualizer */}
                <div className="flex items-end justify-between h-8 mt-4 gap-1 px-1">
                  {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                    const d = new Date();
                    d.setDate(d.getDate() - daysAgo);
                    const localDate = toLocalDateKey(d);
                    const log = weightHistory.find(l => l.date.substring(0, 10) === localDate);
                    const hrs = log?.sleepHours || 0;
                    const pct = Math.min((hrs / 9) * 100, 100); // 9h max for bar display
                    const isToday = daysAgo === 0;

                    return (
                      <div key={daysAgo} className="flex flex-col items-center gap-1 w-full group/bar relative">
                        <div className="w-full bg-surface-border/30 rounded-full h-full relative overflow-hidden">
                          <div
                            className={`absolute bottom-0 w-full rounded-full transition-all 
                                            ${isToday ? 'bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.5)]' : 'bg-purple-500/40'}
                                        `}
                            style={{ height: `${pct}%` }}
                          ></div>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          {hrs}h
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  {todayLog.sleepNotes ? (
                    <div className="bg-surface-border/30 rounded-lg p-2.5 border border-white/5">
                      <p className="text-xs text-text-secondary/80 italic line-clamp-2">
                        "{todayLog.sleepNotes}"
                      </p>
                    </div>
                  ) : (
                    <div className="h-10 flex items-center">
                      <p className="text-xs text-text-secondary/50">No notes recorded</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 border border-dashed border-surface-border rounded-lg bg-surface-border/10">
                <span className="text-2xl font-bold text-white/20 mb-1">--</span>
                <p className="text-xs text-text-secondary mb-2">No sleep logged yet</p>
                <button onClick={() => setIsSleepModalOpen(true)} className="text-xs text-purple-400 hover:text-purple-300 underline">Log Previous Night</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SleepLogModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onSave={handleSaveSleep}
      />

      {/* Weekly Planner Preview */}
      {!activePlan ? (
        <div className="bg-surface-dark border border-surface-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-surface-border/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: '32px' }}>calendar_month</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ready to plan your week?</h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Generate a meal plan based on your calorie goals and recipe library.
          </p>
          <Link to="/plan" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-lg transition-all">
            <span className="material-symbols-outlined">auto_awesome</span>
            Create New Plan
          </Link>
        </div>
      ) : (
        <div className="bg-surface-dark border border-surface-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-border flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Weekly Planner
            </h3>
            <Link to="/plan" className="text-sm text-primary font-medium hover:underline">
              Edit Plan
            </Link>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {activePlan.days.map((day, idx) => (
              <DayCard key={idx} day={day} isToday={day.date === toLocalDateKey(new Date())} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MacroCard({ label, value, unit, consumed, progress, icon, color }: {
  label: string;
  value: string;
  unit: string;
  consumed: string;
  progress: number;
  icon: string;
  color: string;
}) {
  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'bg-primary';
      case 'blue-400': return 'bg-blue-400';
      case 'amber-400': return 'bg-amber-400';
      default: return 'bg-white';
    }
  };

  const getShadowClass = () => {
    switch (color) {
      case 'primary': return 'shadow-[0_0_10px_rgba(167,139,250,0.5)]';
      case 'blue-400': return 'shadow-[0_0_10px_rgba(96,165,250,0.5)]';
      case 'amber-400': return 'shadow-[0_0_10px_rgba(251,191,36,0.5)]';
      default: return 'shadow-[0_0_10px_rgba(255,255,255,0.5)]';
    }
  };

  return (
    <div className="bg-surface-dark rounded-xl p-5 border border-surface-border flex flex-col gap-3 relative overflow-hidden group">
      <div className="flex justify-between items-center z-10">
        <span className="text-text-secondary text-sm font-medium">{label}</span>
        <span className="material-symbols-outlined text-text-secondary text-lg">{icon}</span>
      </div>
      <div className="z-10">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-xs text-text-secondary ml-1">{unit}</span>
      </div>
      <div className="w-full bg-surface-border rounded-full h-1.5 mt-2 z-10">
        <div className={`${getColorClass()} h-1.5 rounded-full ${getShadowClass()}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
      <p className="text-xs text-text-secondary mt-1 z-10">{consumed} consumed</p>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${color === 'primary' ? 'bg-primary/5' : color === 'blue-400' ? 'bg-blue-400/5' : color === 'amber-400' ? 'bg-amber-400/5' : 'bg-white/5'} rounded-full blur-2xl group-hover:opacity-150 transition-all`}></div>
    </div>
  );
}

// End of Dashboard


function DayCard({ day, isToday }: { day: MealPlanDay; isToday: boolean }) {
  // AUD-099: day.date is a stored YYYY-MM-DD key, not a timestamp.
  const date = parseLocalDateKey(day.date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = date.getDate();

  // Compute total calories from meals
  const totalCalories = day.meals.reduce((sum, m) => sum + m.calories, 0);

  // Group meals by type for display
  const breakfast = day.meals.find(m => m.type === 'breakfast');
  const lunch = day.meals.find(m => m.type === 'lunch');
  const dinner = day.meals.find(m => m.type === 'dinner');

  return (
    <div className={`p-3 rounded-xl ${isToday ? 'bg-background-dark border-2 border-primary' : 'bg-surface-dark/50 border border-surface-border'} transition-all hover:border-surface-border`}>
      <div className="flex flex-col items-center mb-3">
        <span className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-primary' : 'text-gray-500'}`}>{dayName}</span>
        <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>{dayNum}</span>
      </div>
      {isToday && (
        <div className="absolute top-0 right-0 bg-primary text-background-dark text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">TODAY</div>
      )}
      <div className="space-y-1.5">
        <MealPill meal={breakfast} />
        <MealPill meal={lunch} />
        <MealPill meal={dinner} />
      </div>
      <div className="mt-2 text-center">
        <span className={`text-[10px] font-mono font-bold ${totalCalories > 0 ? 'text-primary' : 'text-gray-600'}`}>
          {totalCalories} kcal
        </span>
      </div>
    </div>
  );
}

function MealPill({ meal }: { meal?: MealPlanMeal }) {
  if (!meal) return (
    <div className="h-5 bg-surface-border/30 rounded opacity-50"></div>
  );

  return (
    <div className="flex items-center gap-2 p-1 bg-background-dark/40 rounded">
      <div className={`size-1.5 rounded-full ${meal.isEaten ? 'bg-primary' : 'bg-gray-500'}`}></div>
      <span className={`text-[10px] truncate ${meal.isEaten ? 'text-gray-300 line-through opacity-70' : 'text-white'}`}>{meal.name}</span>
    </div>
  );
}
