import React, { useState } from 'react';
import { X, Moon, Star } from 'lucide-react';
import { toLocalDateKey } from '../../../shared/date-utils';

interface SleepLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { date: string; sleepHours: number; sleepQuality: number; sleepNotes: string }) => Promise<void>;
}

export const SleepLogModal: React.FC<SleepLogModalProps> = ({ isOpen, onClose, onSave }) => {
    const [date, setDate] = useState(toLocalDateKey(new Date()));
    const [useTimeRange, setUseTimeRange] = useState(true);
    const [bedTime, setBedTime] = useState('23:00');
    const [wakeTime, setWakeTime] = useState('07:00');
    const [hours, setHours] = useState<number>(8); // Calculated or manual
    const [quality, setQuality] = useState<number>(4);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update duration when times change
    React.useEffect(() => {
        if (useTimeRange) {
            const start = new Date(`2000-01-01T${bedTime}`);
            const end = new Date(`2000-01-01T${wakeTime}`);
            let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (diff < 0) diff += 24; // Crossed midnight
            setHours(Math.round(diff * 10) / 10);
        }
    }, [bedTime, wakeTime, useTimeRange]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave({ date, sleepHours: hours, sleepQuality: quality, sleepNotes: notes });
        } catch (error) {
            console.error("Failed to log sleep", error);
            alert("Failed to save sleep log. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-400" />
                        Log Sleep
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800 text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Duration */}
                    {/* Date Selection */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Duration Input Method Toggle */}
                    <div className="flex bg-gray-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setUseTimeRange(true)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${useTimeRange ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Time Range
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseTimeRange(false)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!useTimeRange ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Total Hours
                        </button>
                    </div>

                    {/* Duration Inputs */}
                    {useTimeRange ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Bed Time</label>
                                <input
                                    type="time"
                                    value={bedTime}
                                    onChange={(e) => setBedTime(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Wake Time</label>
                                <input
                                    type="time"
                                    value={wakeTime}
                                    onChange={(e) => setWakeTime(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="text-sm text-indigo-400 font-medium">Total Sleep: {hours} hours</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Duration (Hours)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="14"
                                    step="0.5"
                                    value={hours}
                                    onChange={(e) => setHours(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="text-xl font-bold text-white min-w-[3ch]">{hours}h</span>
                            </div>
                        </div>
                    )}

                    {/* Quality */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Quality</label>
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setQuality(star)}
                                    aria-label={`Set sleep quality to ${star} out of 5`}
                                    aria-pressed={quality === star}
                                    className={`p-2 rounded-lg transition-all flex-1 flex justify-center ${quality >= star ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-gray-800 text-gray-600 border border-transparent'
                                        }`}
                                >
                                    <Star aria-hidden="true" className={`w-6 h-6 ${quality >= star ? 'fill-indigo-400' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How did you sleep?"
                            className="w-full bg-gray-800 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Log'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
