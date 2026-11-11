import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/auth-context'; // Fixed import path
import { getWeightHistory, type WeightLog } from '../../../services/userService';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateKey } from '../../../shared/date-utils';
import { useAppStore } from '../../../app/providers/store';
import { weightSuffix } from '../../../shared/units';

interface WeightHistoryWidgetProps {
    onLogWeight?: () => void;
    refreshTrigger?: number;
    data?: WeightLog[];
}

export default function WeightHistoryWidget({ onLogWeight, refreshTrigger = 0, data }: WeightHistoryWidgetProps) {
    const { user } = useAuth();
    // AUD-122: weights are stored in the unit the user chose, so the label is
    // all that changes here. Never hardcode "lbs" -- metric is the default.
    const { userSettings } = useAppStore();
    const weightUnitLabel = weightSuffix(userSettings?.measurementUnit ?? 'metric');
    const [internalHistory, setInternalHistory] = useState<WeightLog[]>([]);
    const [internalLoading, setInternalLoading] = useState(!data);
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const [chartWidth, setChartWidth] = useState(0);

    const history = data || internalHistory;
    const loading = data ? false : user ? internalLoading : false;

    useEffect(() => {
        if (data) {
            return;
        }

        if (!user) {
            console.log('WeightHistoryWidget: No user found');
            return;
        }

        // AUD-050 / AUD-015: see Dashboard. A weight history that lands after a
        // user switch is one account's body data on another account's screen.
        let cancelled = false;

        getWeightHistory(user.uid)
            .then(history => {
                if (cancelled) return;
                // Date keys sort correctly as strings, and this avoids parsing entirely.
                const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
                setInternalHistory(sorted);
            })
            .catch(err => {
                if (cancelled) return;
                console.error('WeightHistoryWidget: Error fetching history', err);
            })
            .finally(() => {
                if (!cancelled) setInternalLoading(false);
            });

        return () => { cancelled = true; };
    }, [user, refreshTrigger, data]);

    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        const updateChartWidth = () => {
            setChartWidth(Math.max(0, Math.floor(container.getBoundingClientRect().width)));
        };

        updateChartWidth();
        const observer = new ResizeObserver(updateChartWidth);
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    if (loading) return <div className="h-64 animate-pulse bg-surface-dark/50 rounded-xl" />;

    // Calculate trend
    const latest = history[history.length - 1]?.weight;
    const previous = history[history.length - 2]?.weight;
    const trend = latest && previous ? latest - previous : 0;

    return (
        <div className="bg-surface-dark border border-surface-border p-6 rounded-xl min-w-0">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-white text-lg font-bold">Weight History</h3>
                        {onLogWeight && (
                            <button
                                onClick={onLogWeight}
                                className="text-primary hover:text-white bg-primary/10 hover:bg-primary/20 p-1 rounded-lg transition-colors"
                                title="Log Weight"
                                aria-label="Log weight"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                        )}
                    </div>
                    <p className="text-text-secondary text-sm">Last 90 Days</p>
                </div>
                {latest && (
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">{latest} <span className="text-sm font-medium text-text-secondary">{weightUnitLabel}</span></p>
                        {trend !== 0 && (
                            <p className={`text-xs font-bold ${trend < 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)} {weightUnitLabel}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div ref={chartContainerRef} className="h-48 min-h-[192px] w-full min-w-0">
                {history.length > 0 && chartWidth > 0 ? (
                    <AreaChart data={history} width={chartWidth} height={192}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => formatDateKey(str, { month: 'short', day: 'numeric' })}
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => Math.round(val).toString()}
                            width={30}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F1F1F', borderColor: '#333', borderRadius: '8px', color: '#FFF' }}
                            itemStyle={{ color: '#FFF' }}
                            labelStyle={{ color: '#999', marginBottom: '4px' }}
                            labelFormatter={(label) => formatDateKey(String(label), { year: 'numeric', month: 'short', day: 'numeric' })}
                        />
                        <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#A78BFA"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorWeight)"
                        />
                    </AreaChart>
                ) : history.length > 0 ? (
                    <div className="h-full animate-pulse rounded-lg bg-background-dark/50" aria-label="Loading weight chart" />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">monitor_weight</span>
                        <p className="text-sm">No weight logs yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
