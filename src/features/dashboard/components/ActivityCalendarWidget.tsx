import { useMemo, useState } from 'react';
import type { DailyLog } from '../../../services/userService';
import type { MealPlan } from '../../meal-planning/planService';
import { toLocalDateKey } from '../../../shared/date-utils';
import { useAppStore } from '../../../app/providers/store';
import { weightSuffix } from '../../../shared/units';

interface ActivityCalendarWidgetProps {
    logs: DailyLog[]; // Full history
    activePlan: MealPlan | null;
}

export function ActivityCalendarWidget({ logs, activePlan }: ActivityCalendarWidgetProps) {
    const [viewDate, setViewDate] = useState(new Date());
    // AUD-122: weights are stored in the unit the user chose, so the label is
    // all that changes here. Never hardcode "lbs" -- metric is the default.
    const { userSettings } = useAppStore();
    const weightUnitLabel = weightSuffix(userSettings?.measurementUnit ?? 'metric');

    // Generate calendar grid for the specific month
    const calendarData = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        // First day of the month
        const firstDayOfMonth = new Date(year, month, 1);

        // Find the Monday before the first day (to align grid)
        // Day 0 is Sunday, 1 is Monday. 
        // If first day is Tuesday (2), we need Monday (1). 
        // If first day is Sunday (0), we need previous Monday (-6 days).
        // If first day is Monday (1), we start there.
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0-6 Sun-Sat
        // Calculate days to subtract to get to Monday. 
        // Monday(1) -> 0. Tuesday(2) -> 1. Sunday(0) -> 6.
        const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - daysToSubtract);

        // We need 6 rows (42 days) to cover the month
        const days = [];

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = toLocalDateKey(date);

            // Find weight/water/sleep log
            const log = logs.find(l => l.date.substring(0, 10) === dateStr);

            // Find meal plan day
            const planDay = activePlan?.days.find(d => d.date.substring(0, 10) === dateStr);
            const mealsEaten = planDay?.meals.filter(m => m.isEaten).length || 0;
            const totalCalories = planDay?.meals.filter(m => m.isEaten).reduce((acc, m) => acc + m.calories, 0) || 0;

            const hasActivity = !!log && (!!log.weight || !!log.waterMl || !!log.sleepHours) || mealsEaten > 0;
            const isToday = dateStr === toLocalDateKey(new Date());
            const isCurrentMonth = date.getMonth() === month;

            days.push({
                date: date,
                dayNum: date.getDate(),
                dateStr: dateStr,
                log: log,
                mealsEaten: mealsEaten,
                totalCalories: totalCalories,
                isToday: isToday,
                hasActivity: hasActivity,
                isCurrentMonth: isCurrentMonth
            });
        }
        return days;
    }, [logs, activePlan, viewDate]);

    // Calculate consistency based on the displayed month's current window
    const currentMonthDays = calendarData.filter(d => d.isCurrentMonth);
    const consistency = currentMonthDays.length > 0
        ? Math.round((currentMonthDays.filter(d => d.hasActivity).length / currentMonthDays.length) * 100)
        : 0;

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        // Normalize the day before moving across shorter months.
        newDate.setDate(1);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-surface-dark border border-surface-border rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-white font-bold text-lg">Activity</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <button aria-label="Previous month" onClick={() => changeMonth(-1)} className="p-1 hover:bg-surface-border rounded text-text-secondary hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider min-w-[80px] text-center">{monthLabel}</p>
                        <button aria-label="Next month" onClick={() => changeMonth(1)} className="p-1 hover:bg-surface-border rounded text-text-secondary hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-primary font-bold text-lg">{consistency}%</span>
                    <p className="text-[10px] text-text-secondary uppercase">Consistency</p>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-xs font-bold text-text-secondary">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {calendarData.map((day, i) => (
                    <div
                        key={i}
                        className={`relative group group/tooltip w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all
                            ${!day.isCurrentMonth ? 'opacity-20' : ''}
                        `}
                    >
                        <div
                            className={`w-full h-full rounded-lg flex items-center justify-center transition-all cursor-default
                                ${day.isToday
                                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(167,139,250,0.5)] z-10'
                                    : day.hasActivity
                                        ? 'bg-surface-border/50 text-white border border-surface-border/50'
                                        : 'text-text-secondary/30 hover:bg-surface-border/30'
                                }`}
                        >
                            {day.dayNum}
                        </div>

                        {/* Custom Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 backdrop-blur-md border border-surface-border rounded-xl p-3 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl flex flex-col gap-2 scale-95 group-hover/tooltip:scale-100 origin-bottom">
                            <p className="text-xs font-bold text-gray-400 border-b border-gray-800 pb-1 mb-1">
                                {day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>

                            {(day.log || day.mealsEaten > 0) ? (
                                <>
                                    {/* Weight */}
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <span className="material-symbols-outlined text-[14px]">monitor_weight</span>
                                            <span>Weight</span>
                                        </div>
                                        <span className="text-white font-mono">{day.log?.weight || '--'} {weightUnitLabel}</span>
                                    </div>

                                    {/* Sleep */}
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-purple-400">
                                            <span className="material-symbols-outlined text-[14px]">bedtime</span>
                                            <span>Sleep</span>
                                        </div>
                                        <span className="text-white font-mono">{day.log?.sleepHours ? `${day.log.sleepHours}h` : '--'}</span>
                                    </div>

                                    {/* Water */}
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-blue-400">
                                            <span className="material-symbols-outlined text-[14px]">water_drop</span>
                                            <span>Water</span>
                                        </div>
                                        <span className="text-white font-mono">{day.log?.waterMl ? `${day.log.waterMl}ml` : '--'}</span>
                                    </div>

                                    {/* Meals */}
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-orange-400">
                                            <span className="material-symbols-outlined text-[14px]">restaurant</span>
                                            <span>Meals</span>
                                        </div>
                                        <span className="text-white font-mono">{day.mealsEaten > 0 ? `${day.mealsEaten} (${day.totalCalories}kcal)` : '--'}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-text-secondary text-center py-2">No activity recorded</p>
                            )}

                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-text-secondary opacity-60">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(167,139,250,0.5)]"></div>
                    <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-surface-border text-white border border-surface-border/50"></div>
                    <span>Recorded</span>
                </div>
            </div>
        </div>
    );
}
