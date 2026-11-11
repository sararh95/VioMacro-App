import { getDoc, setDoc, Timestamp, query, orderBy, getDocs, runTransaction, increment, limit, writeBatch } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { toLocalDateKey } from '../shared/date-utils';
import { dailyMetricDoc, userDoc, weightHistoryCollection } from './firebase/paths';

export interface UserSettings {
    currentWeight?: number;
    goalWeight?: number;
    rateOfChange?: number;
    macroSplit?: { protein: number; carbs: number; fat: number };
    dietaryTags?: string[];
    dailyCalorieTarget?: number;
    allergies?: string[];
    measurementUnit?: 'imperial' | 'metric';
    onboardingCompleted?: boolean;
    phase?: 'fat-loss' | 'maintenance' | 'muscle-gain';
    phaseStartDate?: string;
    bottleSize?: number; // Custom bottle size in ml
    macroMode?: 'percentage' | 'grams';
    macroTargets?: { protein: number; carbs: number; fat: number }; // Exact gram targets
    profileName?: string;
    profileAvatar?: string;
    updatedAt?: Timestamp;
}

export interface WeightLog {
    id?: string;
    weight?: number; // Make optional as we might log only water/sleep
    date: string;
    energy?: number;
    hunger?: number;
}

export interface DailyLog extends WeightLog {
    waterMl?: number;
    sleepHours?: number;
    sleepQuality?: number;
    sleepNotes?: string;
}

export interface WeightCheckIn extends Omit<WeightLog, 'id' | 'weight'> {
    weight: number;
}

function consumeDevFailure(key: string): boolean {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;

    const storageKey = `viomacro:e2e:fail:${key}`;
    const value = window.sessionStorage.getItem(storageKey);
    if (!value) return false;

    if (value === 'once') {
        window.sessionStorage.removeItem(storageKey);
    }

    return value === 'once' || value === 'always';
}

function consumeDevDelay(key: string): number {
    if (!import.meta.env.DEV || typeof window === 'undefined') return 0;

    const storageKey = `viomacro:e2e:delay:${key}`;
    const value = window.sessionStorage.getItem(storageKey);
    if (!value) return 0;

    window.sessionStorage.removeItem(storageKey);
    const delay = Number.parseInt(value, 10);
    return Number.isFinite(delay) && delay > 0 ? delay : 0;
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createDefaultUserSettings(): UserSettings {
    return {
        macroSplit: { protein: 30, carbs: 35, fat: 35 },
        dailyCalorieTarget: 0,
        dietaryTags: [],
        allergies: [],
        measurementUnit: 'metric',
        onboardingCompleted: false,
        phase: 'maintenance',
        phaseStartDate: new Date().toISOString()
    };
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    // AUD-015: a test hook, one-shot and DEV-only like the others above. The
    // store's initial load has no cancellation, so a slow settings read is the
    // window in which one account's data can land in another account's state.
    // Without a way to widen that window the leak cannot be reproduced.
    const delay = consumeDevDelay('getUserSettings');

    const settingsRef = userDoc(db, userId);
    const snapshot = await getDoc(settingsRef);

    if (delay > 0) {
        await wait(delay);
    }

    if (!snapshot.exists()) return null;
    return snapshot.data()?.settings as UserSettings;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const delay = consumeDevDelay('updateUserSettings');
    if (delay > 0) await wait(delay);
    if (consumeDevFailure('updateUserSettings')) {
        throw new Error('Injected updateUserSettings failure');
    }

    const userRef = userDoc(db, userId);
    await setDoc(userRef, {
        settings: {
            ...settings,
            updatedAt: Timestamp.now()
        }
    }, { merge: true });
    const afterCommitDelay = consumeDevDelay('updateUserSettingsAfterCommit');
    if (afterCommitDelay > 0) await wait(afterCommitDelay);
}

export async function addWeightLog(userId: string, data: Omit<WeightLog, 'id'>): Promise<void> {
    // AUD-039: Object.keys().includes('weight') is true even when the value is
    // undefined, so { weight: undefined, energy: 4 } was classified as a weight
    // log. Classify on the value instead.
    const isWeightLog = typeof data.weight === 'number' && Number.isFinite(data.weight);
    return logDailyMetric(userId, isWeightLog ? 'weight' : 'biofeedback', data);
}

export async function saveWeightCheckIn(userId: string, data: WeightCheckIn): Promise<void> {
    if (!Number.isFinite(data.weight) || data.weight <= 0 || data.weight >= 1000) {
        throw new Error('Enter a weight greater than 0 and less than 1000.');
    }
    const delay = consumeDevDelay('updateUserSettings');
    if (delay > 0) await wait(delay);
    if (consumeDevFailure('updateUserSettings') || consumeDevFailure('logDailyMetric:weight') || consumeDevFailure('logDailyMetric')) {
        throw new Error('Injected check-in failure');
    }
    const date = data.date.split('T')[0];
    const timestamp = Timestamp.now();
    // The profile and history describe the same check-in. A rejected history
    // write must leave both unchanged. Merge preserves today's water and sleep.
    const batch = writeBatch(db);
    batch.set(userDoc(db, userId), { settings: { currentWeight: data.weight, updatedAt: timestamp } }, { merge: true });
    batch.set(dailyMetricDoc(db, userId, date), { ...data, date, timestamp }, { merge: true });
    await batch.commit();
}

export async function logDailyMetric(
    userId: string,
    type: 'weight' | 'water' | 'sleep' | 'biofeedback',
    data: Partial<DailyLog>
): Promise<void> {
    if (consumeDevFailure(`logDailyMetric:${type}`) || consumeDevFailure('logDailyMetric')) {
        throw new Error(`Injected logDailyMetric ${type} failure`);
    }

    // Use YYYY-MM-DD as ID to allow updates
    const dateId = data.date ? data.date.split('T')[0] : toLocalDateKey(new Date());
    const logRef = dailyMetricDoc(db, userId, dateId);

    // We use setDoc with merge: true
    await setDoc(logRef, {
        ...data,
        date: dateId,
        timestamp: Timestamp.now()
    }, { merge: true });
}

/**
 * AUD-047: water quick-add computed `current + amount` from state loaded on the
 * last refresh, so two fast taps both read the same base and one increment was
 * lost. increment() is applied server-side against whatever is actually stored,
 * so concurrent taps add up correctly.
 *
 * AUD-048: the quick-add path also skipped the 0-10000 range check the
 * correction form does, so exceeding the cap produced a Firestore rules
 * rejection reported to the user as a connection problem. The caller clamps
 * before calling; this returns the applied delta so the UI can say when it
 * clamped rather than silently doing less than asked.
 */
export async function addWaterMl(userId: string, deltaMl: number, dateId?: string): Promise<void> {
    if (consumeDevFailure('logDailyMetric:water') || consumeDevFailure('logDailyMetric')) {
        throw new Error('Injected logDailyMetric water failure');
    }
    if (!Number.isFinite(deltaMl) || deltaMl === 0) return;

    const key = dateId ?? toLocalDateKey(new Date());
    const logRef = dailyMetricDoc(db, userId, key);

    await setDoc(logRef, {
        date: key,
        timestamp: Timestamp.now(),
        waterMl: increment(deltaMl),
    }, { merge: true });
}

/**
 * AUD-029: one document per day, so this grows by 365 a year and was read in
 * full on every Progress visit and every water tap. The chart shows 90 days;
 * this is the ceiling that keeps the read proportional to what is displayed.
 */
export const MAX_WEIGHT_HISTORY_DAYS = 400;

export async function getWeightHistory(
    userId: string,
    maxDays: number = MAX_WEIGHT_HISTORY_DAYS,
): Promise<DailyLog[]> {
    if (consumeDevFailure('getWeightHistory')) {
        throw new Error('Injected getWeightHistory failure');
    }

    const historyRef = weightHistoryCollection(db, userId);
    // Descending + limit, then reversed. Ascending + limit would return the
    // OLDEST days and silently drop everything recent -- the opposite of what
    // every caller wants.
    const q = query(historyRef, orderBy('date', 'desc'), limit(maxDays));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as DailyLog))
        .reverse();
}

export async function initializeUser(userId: string, email: string | null): Promise<void> {
    const userRef = userDoc(db, userId);
    const delayAfterRead = consumeDevDelay('initializeUserAfterRead');

    await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(userRef);

        if (!snapshot.exists()) {
            if (delayAfterRead > 0) {
                await wait(delayAfterRead);
            }

            transaction.set(userRef, {
                email,
                createdAt: Timestamp.now(),
                settings: createDefaultUserSettings()
            });
            return;
        }

        if (!snapshot.data()?.settings) {
            transaction.set(userRef, {
                settings: createDefaultUserSettings()
            }, { merge: true });
        }
    });
}
