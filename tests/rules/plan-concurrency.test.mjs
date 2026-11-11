import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    updateDoc,
    where,
    FieldPath,
    Timestamp,
} from 'firebase/firestore';

/**
 * Concurrency tests for PR-4 (AUD-020, AUD-021, AUD-023).
 *
 * NOTE ON WHAT THESE TEST: they drive Firestore directly with the two patterns
 * -- the one planService used to use, and the transactional one it uses now --
 * because planService imports the browser Firebase app, which this harness
 * cannot load. So they prove the race was real and that transactions fix it.
 * The real service is exercised by the Playwright emulator suite.
 *
 * The races these reproduce, as they existed before PR-4:
 *   - saveMealPlan read "does a plan exist for this week?" then wrote. Two
 *     overlapping saves both saw "no" and both created one (AUD-020).
 *   - toggleMealStatus fetched the whole plan, edited one meal in memory, and
 *     wrote the entire days array back. Two overlapping toggles both built from
 *     the pre-first-write snapshot, so the second erased the first (AUD-021).
 */

let testEnv;
const UID = 'concurrency-user';

const plansPath = (db) => collection(db, 'users', UID, 'mealPlans');

function buildPlan(weekStart) {
    return {
        weekStart,
        weekEnd: '2026-09-06',
        goal: 'Concurrency fixture',
        days: [
            {
                date: weekStart,
                dayName: 'Monday',
                totalCalories: 1000,
                meals: [
                    { id: 'meal-a', name: 'A', type: 'breakfast', calories: 400, protein: 10, carbs: 40, fat: 10, isEaten: false },
                    { id: 'meal-b', name: 'B', type: 'lunch', calories: 600, protein: 20, carbs: 60, fat: 15, isEaten: false },
                ],
            },
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };
}

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'viomacro-concurrency',
        firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    });
});

after(async () => {
    await testEnv?.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

describe('meal plan concurrency', () => {
    // ---------------------------------------------------------- AUD-020

    test('AUD-020: the naive read-then-write pattern (now replaced) creates duplicate weeks', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const weekStart = '2026-08-31';

            // The pattern saveMealPlan used before PR-4: check, then write.
            const saveLikeToday = async () => {
                const existing = await getDocs(query(plansPath(db), where('weekStart', '==', weekStart)));
                if (!existing.empty) {
                    await updateDoc(existing.docs[0].ref, { updatedAt: Timestamp.now() });
                    return existing.docs[0].id;
                }
                const ref = await addDoc(plansPath(db), buildPlan(weekStart));
                return ref.id;
            };

            await Promise.all([saveLikeToday(), saveLikeToday()]);

            const all = await getDocs(query(plansPath(db), where('weekStart', '==', weekStart)));
            assert.equal(
                all.size,
                2,
                'This documents WHY planService.saveMealPlan is transactional. It drives ' +
                'Firestore with the pattern we removed; 2 documents proves the race was real.',
            );
        });
    });

    test('AUD-020 FIXED: a transactional save produces exactly one week', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const weekStart = '2026-08-31';

            // A transaction cannot query, so the document id must be derived
            // from the week. That is the shape the fix has to take.
            const saveTransactional = async () => {
                const ref = doc(db, 'users', UID, 'mealPlans', weekStart);
                await runTransaction(db, async (tx) => {
                    const snap = await tx.get(ref);
                    if (snap.exists()) {
                        tx.update(ref, { updatedAt: Timestamp.now() });
                    } else {
                        tx.set(ref, buildPlan(weekStart));
                    }
                });
            };

            await Promise.all([saveTransactional(), saveTransactional()]);

            const all = await getDocs(query(plansPath(db), where('weekStart', '==', weekStart)));
            assert.equal(all.size, 1, 'A transactional save must never create a second week');
        });
    });

    // ---------------------------------------------------------- AUD-021

    test('AUD-021: the naive fetch-edit-write pattern (now replaced) loses one of two ticks', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const ref = await addDoc(plansPath(db), buildPlan('2026-08-31'));

            // The pattern toggleMealStatus used before PR-4: fetch, edit, write back.
            const toggleLikeToday = async (mealId) => {
                const snap = await getDoc(ref);
                const days = snap.data().days.map((day) => ({
                    ...day,
                    meals: day.meals.map((m) => (m.id === mealId ? { ...m, isEaten: true } : m)),
                }));
                await updateDoc(ref, { days, updatedAt: Timestamp.now() });
            };

            await Promise.all([toggleLikeToday('meal-a'), toggleLikeToday('meal-b')]);

            const after = await getDoc(ref);
            const eaten = after.data().days[0].meals.filter((m) => m.isEaten).length;
            assert.equal(
                eaten,
                1,
                'This documents WHY planService.toggleMealStatus is transactional. It drives ' +
                'Firestore with the pattern we removed; losing a tick proves the race was real.',
            );
        });
    });

    // The transaction below is what PR-4 shipped. It is correct, and PR-11d
    // replaced it anyway: it still reads and rewrites the whole document, which
    // is AUD-022. Both are kept because they prove different things -- this one
    // that locking works, the AUD-022 pair that locking is no longer needed.
    test('AUD-021 FIXED (PR-4): a transactional toggle keeps both ticks', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const ref = await addDoc(plansPath(db), buildPlan('2026-08-31'));

            const toggleTransactional = async (mealId) => {
                await runTransaction(db, async (tx) => {
                    const snap = await tx.get(ref);
                    if (!snap.exists()) throw new Error('plan not found');
                    const days = snap.data().days.map((day) => ({
                        ...day,
                        meals: day.meals.map((m) => (m.id === mealId ? { ...m, isEaten: true } : m)),
                    }));
                    tx.update(ref, { days, updatedAt: Timestamp.now() });
                });
            };

            await Promise.all([toggleTransactional('meal-a'), toggleTransactional('meal-b')]);

            const after = await getDoc(ref);
            const eaten = after.data().days[0].meals.filter((m) => m.isEaten).length;
            assert.equal(eaten, 2, 'Both concurrent ticks must survive');
        });
    });

    // ---------------------------------------------------------- AUD-023

    test('AUD-023 FIXED: toggling a meal that does not exist must throw, not return quietly', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const ref = await addDoc(plansPath(db), buildPlan('2026-08-31'));

            const toggleMissing = () => runTransaction(db, async (tx) => {
                const snap = await tx.get(ref);
                const day = snap.data().days[0];
                const index = day.meals.findIndex((m) => m.id === 'no-such-meal');
                if (index === -1) throw new Error('Meal not found in plan');
                tx.update(ref, { days: snap.data().days });
            });

            // Before PR-4 the service returned undefined here, so the caller's
            // optimistic tick was never rolled back and the user saw a save that
            // had never happened.
            await assert.rejects(toggleMissing, /Meal not found/);
        });
    });

    // ---------------------------------------------------------- AUD-022

    test('AUD-022 FIXED: a tick is one field write, with no read of the plan', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const ref = await addDoc(plansPath(db), buildPlan('2026-08-31'));

            // What planService.toggleMealStatus does now. Note what is absent:
            // no getDoc, no transaction, and no days array on the wire.
            const tick = (mealId) =>
                updateDoc(ref, new FieldPath('mealStatus', mealId), true, 'updatedAt', Timestamp.now());

            await Promise.all([tick('meal-a'), tick('meal-b')]);

            const after = await getDoc(ref);
            assert.deepEqual(
                after.data().mealStatus,
                { 'meal-a': true, 'meal-b': true },
                'Two ticks on different meals write different fields, so they cannot collide',
            );
            assert.equal(
                after.data().days[0].meals.filter((m) => m.isEaten).length,
                0,
                'The days array is untouched -- that is the whole saving',
            );
        });
    });

    test('AUD-022: a meal id with a dot in it stays one key, it does not become a nested map', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const ref = await addDoc(plansPath(db), buildPlan('2026-08-31'));

            // Meal ids are UUIDs today. This is why the service uses FieldPath
            // rather than the string `mealStatus.<id>`: one dot in one id would
            // silently write a nested map that nothing ever reads back.
            await updateDoc(ref, new FieldPath('mealStatus', 'legacy.meal.7'), true);

            const stored = (await getDoc(ref)).data().mealStatus;
            assert.deepEqual(stored, { 'legacy.meal.7': true });
        });
    });

    test('AUD-023 still holds: ticking a meal on a deleted plan rejects', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            const ref = doc(plansPath(db), 'never-created');

            // updateDoc on a missing document fails with not-found, so the store's
            // catch still refreshes the screen. Dropping the explicit existence
            // check with the transaction did not drop this guarantee.
            await assert.rejects(
                () => updateDoc(ref, new FieldPath('mealStatus', 'meal-a'), true),
                /not-found|No document to update/,
            );
        });
    });
});
