import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

let testEnv;

const rules = readFileSync('firestore.rules', 'utf8');
const validDailyLog = {
  date: '2026-06-24',
  timestamp: Timestamp.fromDate(new Date('2026-06-24T12:00:00Z')),
  weight: 180.4,
  waterMl: 500,
  sleepHours: 8,
  sleepQuality: 4,
  sleepNotes: 'Good sleep',
  energy: 4,
  hunger: 2,
};
const validGroceryItem = {
  name: 'Avocado',
  quantity: 2,
  unit: 'pcs',
  aisle: 'Produce',
  isChecked: false,
};
const validPantryItem = {
  name: 'Brown rice',
  quantity: 2,
  unit: 'lbs',
  category: 'Grains',
  expiresAt: '2026-07-02',
  isLowStock: false,
};
const validMealPlan = {
  weekStart: '2026-06-22',
  weekEnd: '2026-06-28',
  goal: 'balanced',
  days: [
    {
      date: '2026-06-22',
      dayName: 'Monday',
      totalCalories: 1850,
      meals: [
        {
          id: 'meal-1',
          name: 'Greek yogurt bowl',
          type: 'breakfast',
          calories: 420,
          protein: 35,
          carbs: 45,
          fat: 10,
          isEaten: false,
        },
      ],
    },
  ],
  dailyTargets: {
    calories: 1850,
    protein: 140,
    carbs: 185,
    fat: 60,
  },
  isAiGenerated: false,
  createdAt: Timestamp.fromDate(new Date('2026-06-22T12:00:00Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-06-22T12:00:00Z')),
};
const validRecipe = {
  title: 'Chicken and rice bowl',
  mealType: 'dinner',
  tags: ['High Protein'],
  folders: ['dinner'],
  ingredients: [
    {
      item: 'Chicken breast',
      quantity: '6',
      unit: 'oz',
      amount: '',
      swaps: [],
    },
  ],
  instructions: [
    {
      step: 'Cook chicken until browned and 165 F inside.',
      timer: 15,
    },
  ],
  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  description: 'Simple balanced bowl.',
  cookTime: 30,
  servings: 4,
  calories: 520,
  protein: 42,
  carbs: 55,
  fat: 14,
  isFavorite: false,
  source: 'created',
  createdAt: Timestamp.fromDate(new Date('2026-06-22T12:00:00Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-06-22T12:00:00Z')),
  micronutrients: {
    vitaminA: 0,
    vitaminC: 0,
    calcium: 40,
    iron: 2,
  },
};
const validUserDocument = {
  email: 'owner@example.com',
  createdAt: Timestamp.fromDate(new Date('2026-06-22T12:00:00Z')),
  settings: {
    macroSplit: { protein: 30, carbs: 35, fat: 35 },
    dailyCalorieTarget: 1850,
    dietaryTags: [],
    allergies: [],
    measurementUnit: 'metric',
    onboardingCompleted: false,
    phase: 'maintenance',
    phaseStartDate: '2026-06-22T12:00:00.000Z',
  },
};
const validFolder = {
  name: 'Weeknight dinners',
  icon: 'restaurant',
  color: 'purple',
  createdAt: Timestamp.fromDate(new Date('2026-06-22T12:00:00Z')),
};

function authedDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: `viomacro-rules-${Date.now()}`,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

describe('Firestore rules: weightHistory', () => {
  test('allows an owner to create and read a valid daily metric log', async () => {
    const ownerDb = authedDb('owner');
    const logRef = doc(ownerDb, 'users/owner/weightHistory/2026-06-24');

    await assertSucceeds(setDoc(logRef, validDailyLog));
    await assertSucceeds(getDoc(logRef));
  });

  test('denies another user reading or editing a daily metric log', async () => {
    const ownerDb = authedDb('owner');
    const otherDb = authedDb('other');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/weightHistory/2026-06-24'), validDailyLog)
    );

    await assertFails(getDoc(doc(otherDb, 'users/owner/weightHistory/2026-06-24')));
    await assertFails(
      updateDoc(doc(otherDb, 'users/owner/weightHistory/2026-06-24'), { waterMl: 750 })
    );
    await assertFails(deleteDoc(doc(otherDb, 'users/owner/weightHistory/2026-06-24')));
  });

  test('denies malformed or out-of-range daily metric logs', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/weightHistory/2026-06-24'), {
        ...validDailyLog,
        waterMl: -1,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/weightHistory/2026-06-25'), {
        ...validDailyLog,
        date: '2026-06-25',
        sleepHours: 30,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/weightHistory/2026-06-26'), {
        ...validDailyLog,
        date: '2026-06-26',
        privateDebugBlob: 'not allowed',
      })
    );
  });
});

describe('Firestore rules: users and folders', () => {
  test('allows an owner to create, read, and update their user document but denies delete', async () => {
    const ownerDb = authedDb('owner');
    const userRef = doc(ownerDb, 'users/owner');

    await assertSucceeds(setDoc(userRef, validUserDocument));
    await assertSucceeds(getDoc(userRef));
    await assertSucceeds(
      setDoc(userRef, { settings: { onboardingCompleted: true } }, { merge: true })
    );
    await assertFails(deleteDoc(userRef));
  });

  test('denies another user reading or editing a user document', async () => {
    const ownerDb = authedDb('owner');
    const otherDb = authedDb('other');

    await assertSucceeds(setDoc(doc(ownerDb, 'users/owner'), validUserDocument));

    await assertFails(getDoc(doc(otherDb, 'users/owner')));
    await assertFails(
      setDoc(doc(otherDb, 'users/owner'), { settings: { onboardingCompleted: true } }, { merge: true })
    );
    await assertFails(deleteDoc(doc(otherDb, 'users/owner')));
  });

  // AUD-006: the folders CRUD test used to live here. It asserted that an
  // unvalidated, entirely unused write surface worked. The collection is now
  // closed, and the replacement test below asserts that instead. Kept as a note
  // rather than deleted silently, so the change is visible in review.

  // ---------------------------------------------------------------- PR-8a

  test('AUD-001: the user document rejects a key that is not part of its shape', async () => {
    const ownerDb = authedDb('owner');

    // Top level is exactly email / createdAt / settings. Nothing else.
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), { ...validUserDocument, isAdmin: true })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), { ...validUserDocument, notes: 'x'.repeat(50) })
    );
  });

  test('AUD-001: the user document rejects an unknown key inside settings', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), {
        ...validUserDocument,
        settings: { ...validUserDocument.settings, injected: 'anything' },
      })
    );
  });

  test('AUD-001: the user document rejects values outside a sane range', async () => {
    const ownerDb = authedDb('owner');

    // A megabyte of profile name is a document-bloat vector, not a name.
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), {
        ...validUserDocument,
        settings: { ...validUserDocument.settings, profileName: 'n'.repeat(5000) },
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), {
        ...validUserDocument,
        settings: { ...validUserDocument.settings, currentWeight: -5 },
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), {
        ...validUserDocument,
        settings: { ...validUserDocument.settings, phase: 'bulking-forever' },
      })
    );
  });

  test('AUD-002: a brand-new account still saves, dailyCalorieTarget 0 and all', async () => {
    const ownerDb = authedDb('owner');

    // This is exactly what createDefaultUserSettings() writes. The dead
    // isValidSettings() would have rejected it -- that is why it stayed dead.
    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner'), {
        email: 'owner@example.com',
        createdAt: Timestamp.now(),
        settings: {
          macroSplit: { protein: 30, carbs: 35, fat: 35 },
          dailyCalorieTarget: 0,
          dietaryTags: [],
          allergies: [],
          measurementUnit: 'metric',
          onboardingCompleted: false,
          phase: 'maintenance',
          phaseStartDate: '2026-06-22T12:00:00.000Z',
        },
      })
    );

    // And a partial merge, which is how every settings save actually happens.
    await assertSucceeds(
      setDoc(
        doc(ownerDb, 'users/owner'),
        { settings: { onboardingCompleted: true, updatedAt: Timestamp.now() } },
        { merge: true }
      )
    );
  });

  test('AUD-001: every field the app really stores is still accepted', async () => {
    const ownerDb = authedDb('owner');

    // Guards against locking down the shape so hard that the app cannot write.
    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner'), {
        email: 'owner@example.com',
        createdAt: Timestamp.now(),
        settings: {
          currentWeight: 75,
          goalWeight: 70,
          rateOfChange: 0.5,
          macroSplit: { protein: 30, carbs: 35, fat: 35 },
          macroTargets: { protein: 164, carbs: 191, fat: 85 },
          macroMode: 'percentage',
          dietaryTags: ['Keto'],
          allergies: ['Peanuts'],
          dailyCalorieTarget: 2180,
          measurementUnit: 'imperial',
          onboardingCompleted: true,
          phase: 'fat-loss',
          phaseStartDate: '2026-06-22T12:00:00.000Z',
          bottleSize: 750,
          profileName: 'Owner',
          profileAvatar: 'violet',
          updatedAt: Timestamp.now(),
        },
      })
    );
  });

  test('AUD-004: a recipe image or asset URL must be https, or empty', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/js-image'), {
        ...validRecipe,
        imageUrl: 'javascript:alert(1)',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/js-asset'), {
        ...validRecipe,
        originalAssetUrl: 'javascript:alert(1)',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/data-image'), {
        ...validRecipe,
        imageUrl: 'data:text/html;base64,PHNjcmlwdD4=',
      })
    );

    // Empty is how a recipe with no photo is stored, so it must stay legal.
    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/recipes/no-image'), { ...validRecipe, imageUrl: '' })
    );
  });

  test('AUD-003: the client cannot create a recipe carrying an embedding', async () => {
    const ownerDb = authedDb('owner');

    // `embedding` is written only by the generateRecipeEmbedding trigger, which
    // uses the Admin SDK and therefore bypasses these rules entirely. Nothing in
    // the app reads or writes it, so refusing it here costs nothing.
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/forged'), {
        ...validRecipe,
        embedding: [0.1, 0.2, 0.3],
      })
    );
  });

  test('AUD-003: the client cannot add, change or remove an embedding', async () => {
    const ownerDb = authedDb('owner');
    const path = 'users/owner/recipes/has-embedding';

    // Seed the way the trigger does -- with rules bypassed, because the rule
    // above now (correctly) refuses this shape from a client.
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path), {
        ...validRecipe,
        embedding: [0.1, 0.2, 0.3],
      });
    });

    await assertFails(updateDoc(doc(ownerDb, path), { embedding: [9, 9, 9] }));
    await assertFails(updateDoc(doc(ownerDb, path), { embedding: deleteField() }));

    // And a recipe that never had one cannot gain one.
    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/recipes/plain'), validRecipe)
    );
    await assertFails(
      updateDoc(doc(ownerDb, 'users/owner/recipes/plain'), { embedding: [0.5] })
    );
  });

  test('AUD-003: a recipe that already has an embedding is still editable', async () => {
    const ownerDb = authedDb('owner');
    const path = 'users/owner/recipes/editable';

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path), {
        ...validRecipe,
        embedding: [0.1, 0.2, 0.3],
      });
    });

    // This is the trap the lock-down could have walked into. Editing a recipe
    // sends the whole merged document, embedding included, so a rule written as
    // "embedding must never be present" would have made every recipe the server
    // had already processed permanently uneditable.
    await assertSucceeds(updateDoc(doc(ownerDb, path), { title: 'Renamed bowl' }));
    await assertSucceeds(
      setDoc(doc(ownerDb, path), { ...validRecipe, embedding: [0.1, 0.2, 0.3], title: 'Renamed again' })
    );

    // Deleting the whole recipe stays allowed.
    await assertSucceeds(deleteDoc(doc(ownerDb, path)));
  });

  test('AUD-004: the Storage emulator host stays writable', async () => {
    const ownerDb = authedDb('owner');

    // getDownloadURL against the Storage emulator returns http://127.0.0.1:9199.
    // An https-only rule is correct in production and silently breaks every
    // local recipe import. This is the deliberate, documented exception -- if
    // someone tightens the rule again, this test is what tells them.
    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/recipes/emulator-asset'), {
        ...validRecipe,
        originalAssetUrl: 'http://127.0.0.1:9199/v0/b/viomacro.appspot.com/o/users%2Fowner%2Fa.pdf?alt=media',
        originalAssetPath: 'users/owner/a.pdf',
        originalAssetType: 'pdf',
      })
    );

    // A different http host is still refused -- the exception is loopback only.
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/plain-http'), {
        ...validRecipe,
        imageUrl: 'http://example.com/a.png',
      })
    );
  });

  test('AUD-001: rateOfChange accepts the full 0-100 slider range', async () => {
    const ownerDb = authedDb('owner');

    // rateOfChange is the Settings slider position (min 0, max 100), not a
    // weight per week. A real stored account holds 65. Guessing a narrow range
    // from the field name locked that account out of saving anything at all.
    for (const rateOfChange of [0, 65, 100]) {
      await assertSucceeds(
        setDoc(doc(ownerDb, 'users/owner'), {
          ...validUserDocument,
          settings: { ...validUserDocument.settings, rateOfChange },
        })
      );
    }

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner'), {
        ...validUserDocument,
        settings: { ...validUserDocument.settings, rateOfChange: 101 },
      })
    );
  });

  test('AUD-028: a recipe without createdAt is refused instead of vanishing', async () => {
    const ownerDb = authedDb('owner');
    const { createdAt: _omitted, ...withoutCreatedAt } = validRecipe;

    // getRecipes orders by createdAt, and Firestore silently drops documents
    // missing the ordered field. Better a loud rejection than a lost recipe.
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/no-created-at'), withoutCreatedAt)
    );
  });

  // AUD-005 is deliberately NOT tested here. Firestore rules cannot iterate a
  // list, so there is no way to check every day's meal count in the rules --
  // `days.size() <= 14` is the most they can express. The real guard lives in
  // planService.assertPlanWithinLimits and is covered by
  // tests/unit/plan-limits.test.ts. Recording that here so the gap looks
  // deliberate rather than forgotten.

  test('AUD-006: the unused folders subcollection is closed', async () => {
    const ownerDb = authedDb('owner');
    const folderRef = doc(ownerDb, 'users/owner/folders/folder-1');

    // Nothing in the app reads or writes this collection. An unvalidated write
    // surface nobody uses is still a write surface; it can come back when the
    // feature is real.
    await assertFails(setDoc(folderRef, validFolder));
    await assertFails(getDoc(folderRef));
  });

  test('denies unexpected root collections', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(setDoc(doc(ownerDb, 'recipes/root-recipe'), validRecipe));
    await assertFails(setDoc(doc(ownerDb, 'mealPlans/root-plan'), validMealPlan));
  });

  test('denies all client access to server-only ops documents', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(getDoc(doc(ownerDb, 'ops/aiSpendCircuitBreaker/periods/2026-07')));
    await assertFails(
      setDoc(doc(ownerDb, 'ops/aiSpendCircuitBreaker/periods/2026-07'), {
        status: 'active',
        allowanceMicros: 20000000,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'ops/emailOutbox/events/test-event'), {
        type: 'ai_spend_paused',
      })
    );
  });
});

describe('Firestore rules: groceryItems', () => {
  test('allows an owner to create, read, update, and delete a valid grocery item', async () => {
    const ownerDb = authedDb('owner');
    const itemRef = doc(ownerDb, 'users/owner/groceryItems/item-1');

    await assertSucceeds(setDoc(itemRef, validGroceryItem));
    await assertSucceeds(getDoc(itemRef));
    await assertSucceeds(updateDoc(itemRef, { isChecked: true }));
    await assertSucceeds(deleteDoc(itemRef));
  });

  test('denies another user reading or editing a grocery item', async () => {
    const ownerDb = authedDb('owner');
    const otherDb = authedDb('other');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/groceryItems/item-1'), validGroceryItem)
    );

    await assertFails(getDoc(doc(otherDb, 'users/owner/groceryItems/item-1')));
    await assertFails(
      updateDoc(doc(otherDb, 'users/owner/groceryItems/item-1'), { isChecked: true })
    );
    await assertFails(deleteDoc(doc(otherDb, 'users/owner/groceryItems/item-1')));
  });

  test('denies malformed or out-of-range grocery items', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/groceryItems/bad-negative-quantity'), {
        ...validGroceryItem,
        quantity: -1,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/groceryItems/bad-missing-name'), {
        quantity: 2,
        unit: 'pcs',
        aisle: 'Produce',
        isChecked: false,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/groceryItems/bad-extra-field'), {
        ...validGroceryItem,
        privateDebugBlob: 'not allowed',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/groceryItems/bad-source'), {
        ...validGroceryItem,
        source: 'mystery',
      })
    );
  });
});

describe('Firestore rules: pantryItems', () => {
  test('allows an owner to create, read, update, and delete a valid pantry item', async () => {
    const ownerDb = authedDb('owner');
    const itemRef = doc(ownerDb, 'users/owner/pantryItems/item-1');

    await assertSucceeds(setDoc(itemRef, validPantryItem));
    await assertSucceeds(getDoc(itemRef));
    await assertSucceeds(updateDoc(itemRef, { isLowStock: true }));
    await assertSucceeds(deleteDoc(itemRef));
  });

  test('denies another user reading or editing a pantry item', async () => {
    const ownerDb = authedDb('owner');
    const otherDb = authedDb('other');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/pantryItems/item-1'), validPantryItem)
    );

    await assertFails(getDoc(doc(otherDb, 'users/owner/pantryItems/item-1')));
    await assertFails(
      updateDoc(doc(otherDb, 'users/owner/pantryItems/item-1'), { isLowStock: true })
    );
    await assertFails(deleteDoc(doc(otherDb, 'users/owner/pantryItems/item-1')));
  });

  test('denies malformed or out-of-range pantry items', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/pantryItems/bad-negative-quantity'), {
        ...validPantryItem,
        quantity: -1,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/pantryItems/bad-missing-unit'), {
        name: 'Brown rice',
        quantity: 2,
        isLowStock: false,
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/pantryItems/bad-expiry'), {
        ...validPantryItem,
        expiresAt: 'next week',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/pantryItems/bad-extra-field'), {
        ...validPantryItem,
        privateDebugBlob: 'not allowed',
      })
    );
  });
});

describe('Firestore rules: mealPlans', () => {
  test('allows an owner to create, read, update, and delete a valid meal plan', async () => {
    const ownerDb = authedDb('owner');
    const planRef = doc(ownerDb, 'users/owner/mealPlans/plan-1');

    await assertSucceeds(setDoc(planRef, validMealPlan));
    await assertSucceeds(getDoc(planRef));
    await assertSucceeds(updateDoc(planRef, { isAiGenerated: true }));
    await assertSucceeds(deleteDoc(planRef));
  });

  test('denies another user reading or editing a meal plan', async () => {
    const ownerDb = authedDb('owner');
    const otherDb = authedDb('other');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/plan-1'), validMealPlan)
    );

    await assertFails(getDoc(doc(otherDb, 'users/owner/mealPlans/plan-1')));
    await assertFails(
      updateDoc(doc(otherDb, 'users/owner/mealPlans/plan-1'), { isAiGenerated: true })
    );
    await assertFails(deleteDoc(doc(otherDb, 'users/owner/mealPlans/plan-1')));
  });

  test('denies malformed meal plans', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/bad-date'), {
        ...validMealPlan,
        weekStart: 'June 22',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/bad-days'), {
        ...validMealPlan,
        days: 'not a list',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/bad-targets'), {
        ...validMealPlan,
        dailyTargets: {
          calories: '1850',
          protein: 140,
          carbs: 185,
          fat: 60,
        },
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/bad-extra-field'), {
        ...validMealPlan,
        privateDebugBlob: 'not allowed',
      })
    );
  });

  // -------------------------------------------------------------- AUD-022

  test('AUD-022: the rules accept a mealStatus map, which is where isEaten now lives', async () => {
    const ownerDb = authedDb('owner');
    const planRef = doc(ownerDb, 'users/owner/mealPlans/plan-status');

    await assertSucceeds(setDoc(planRef, { ...validMealPlan, mealStatus: { 'meal-1': true } }));

    // This single-field write is the whole point of the change: one tick, no
    // read, and the days array never goes over the wire.
    await assertSucceeds(
      updateDoc(planRef, new FieldPath('mealStatus', 'meal-2'), true)
    );

    const stored = await getDoc(planRef);
    assert.deepEqual(stored.data().mealStatus, { 'meal-1': true, 'meal-2': true });
  });

  test('AUD-022: mealStatus must be a map, and cannot grow without limit', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/status-not-a-map'), {
        ...validMealPlan,
        mealStatus: ['meal-1'],
      })
    );

    // Rules cannot iterate the values to prove each is a boolean -- the same
    // wall that put the per-day meal cap in the client. Counting keys is what
    // they CAN do, so that is the ceiling they enforce.
    const tooMany = {};
    for (let i = 0; i < 201; i += 1) tooMany[`meal-${i}`] = true;
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/mealPlans/status-too-many'), {
        ...validMealPlan,
        mealStatus: tooMany,
      })
    );
  });
});

describe('Firestore rules: recipes', () => {
  test('allows an owner to create, read, update, and delete a valid recipe', async () => {
    const ownerDb = authedDb('owner');
    const recipeRef = doc(ownerDb, 'users/owner/recipes/recipe-1');

    await assertSucceeds(setDoc(recipeRef, validRecipe));
    await assertSucceeds(getDoc(recipeRef));
    await assertSucceeds(updateDoc(recipeRef, { isFavorite: true }));
    await assertSucceeds(deleteDoc(recipeRef));
  });

  test('denies another user reading or editing a recipe', async () => {
    const ownerDb = authedDb('owner');
    const otherDb = authedDb('other');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'users/owner/recipes/recipe-1'), validRecipe)
    );

    await assertFails(getDoc(doc(otherDb, 'users/owner/recipes/recipe-1')));
    await assertFails(
      updateDoc(doc(otherDb, 'users/owner/recipes/recipe-1'), { isFavorite: true })
    );
    await assertFails(deleteDoc(doc(otherDb, 'users/owner/recipes/recipe-1')));
  });

  test('denies malformed recipes', async () => {
    const ownerDb = authedDb('owner');

    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/bad-missing-title'), {
        ...validRecipe,
        title: '',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/bad-meal-type'), {
        ...validRecipe,
        mealType: 'brunch',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/bad-tags'), {
        ...validRecipe,
        tags: 'High Protein',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/bad-source'), {
        ...validRecipe,
        source: 'scraped',
      })
    );
    await assertFails(
      setDoc(doc(ownerDb, 'users/owner/recipes/bad-extra-field'), {
        ...validRecipe,
        privateDebugBlob: 'not allowed',
      })
    );
  });
});
