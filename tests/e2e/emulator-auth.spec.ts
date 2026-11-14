/**
 * AUD-122: these specs previously asserted "lbs" next to every weight.
 *
 * The account they create is explicitly `measurementUnit: 'metric'` (and metric
 * is the app default), so those assertions were pinning the bug in place: a
 * metric user was being shown a pounds label beside a kilogram value. The
 * assertions are updated, not removed -- they still test that the weight renders
 * and survives a reload, which is real. Only the unit they expect has changed.
 */
import { readEmulatorConfig } from '../../scripts/emulator-config.mjs';
import { installAiCallableGuard, assertNoUnexpectedAiCalls, enableMockAi } from './helpers/mock-ai';
import { seedQaAccount } from '../../scripts/seed-qa-account.mjs';
import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  setDoc,
  Timestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage';

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';
const e2eApps: FirebaseApp[] = [];

function createFirebaseClient(label: string, projectId = readEmulatorConfig().projectId): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  const config = readEmulatorConfig();
  if (projectId !== config.projectId) throw new Error('Fixture project must match the selected emulator project.');
  const app = initializeApp(
    {
      ...config.firebase,
      projectId,
    },
    `${label}-${Date.now()}-${Math.random()}`
  );
  e2eApps.push(app);

  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${config.host}:${config.ports.auth}`, { disableWarnings: true });

  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  connectFirestoreEmulator(db, config.host, config.ports.firestore);

  const storage = getStorage(app);
  connectStorageEmulator(storage, config.host, config.ports.storage);

  return { app, auth, db, storage };
}

test.beforeEach(async ({ page }) => { await installAiCallableGuard(page); });
test.afterEach(async ({ page }) => { assertNoUnexpectedAiCalls(page); });

test.afterAll(async () => {
  await Promise.allSettled(e2eApps.map((app) => deleteApp(app)));
});

test('G6 bootstrap preserves saved profile and feature collections and refuses incompatible settings', async () => {
  const client = createFirebaseClient('g6-bootstrap');
  const { user } = await signInWithEmailAndPassword(client.auth, TEST_EMAIL, TEST_PASSWORD);
  const profile = doc(client.db, 'users', user.uid);
  const saved = (await getDoc(profile)).data();
  expect(saved?.settings.onboardingCompleted).toBe(true);
  expect(saved?.settings.measurementUnit).toBe('imperial');
  const features = async () => Promise.all(['recipes', 'mealPlans', 'groceryItems', 'pantryItems', 'weightHistory'].map(async name => {
    const snapshot = await getDocs(collection(client.db, 'users', user.uid, name));
    return snapshot.docs.map(item => ({ id: item.id, data: item.data() })).sort((a, b) => a.id.localeCompare(b.id));
  }));
  const before = await features();
  for (let attempt = 0; attempt < 2; attempt++) {
    expect((await seedQaAccount()).createdProfile).toBe(false);
    expect((await getDoc(profile)).data()).toEqual(saved);
    expect(await features()).toEqual(before);
  }
  try {
    await setDoc(profile, { settings: { ...saved?.settings, measurementUnit: 'metric' } }, { merge: true });
    const incompatible = (await getDoc(profile)).data();
    await expect(seedQaAccount()).rejects.toThrow(/existing.*incompatible/i);
    expect((await getDoc(profile)).data()).toEqual(incompatible);
    expect(await features()).toEqual(before);
  } finally {
    await setDoc(profile, saved!);
  }
});

function collectConsoleFailures(page: Page, allowedErrors: (string | RegExp)[] = []) {
  const failures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      const isAllowed = allowedErrors.some((allowed) =>
        typeof allowed === 'string' ? text.includes(allowed) : allowed.test(text)
      );
      if (
        !isAllowed &&
        !text.includes("Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive") &&
        !(text.includes('@firebase/firestore') && text.includes('Could not reach Cloud Firestore backend')) &&
        !text.startsWith('Failed to load resource:')
      ) {
        failures.push(text);
      }
    }
  });

  page.on('pageerror', (error) => {
    failures.push(error.message);
  });

  return failures;
}

function collectAppCheckWarnings(page: Page) {
  const warnings: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'warn') {
      const text = message.text();
      if (text.includes('App Check') || text.includes('appCheck/fetch-status-error')) {
        warnings.push(text);
      }
    }
  });

  return warnings;
}

function collectChartWarnings(page: Page) {
  const warnings: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'warn') {
      const text = message.text();
      if (
        text.includes('width') &&
        text.includes('height') &&
        (text.includes('ResponsiveContainer') || text.includes('chart should be greater than 0'))
      ) {
        warnings.push(text);
      }
    }
  });

  return warnings;
}

function collectNetworkFailures(page: Page) {
  const failures: string[] = [];

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith('chrome-extension://')) return;

    const failureText = request.failure()?.errorText || 'unknown network failure';
    if (failureText === 'net::ERR_ABORTED' && request.resourceType() === 'document') return;
    if (failureText === 'net::ERR_ABORTED' && url.includes('google.firestore.v1.Firestore')) return;

    failures.push(`REQUEST FAILED ${request.method()} ${url} ${failureText}`);
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status < 400) return;

    const url = response.url();
    if (url.startsWith('chrome-extension://')) return;

    failures.push(`HTTP ${status} ${response.request().method()} ${url}`);
  });

  return failures;
}

async function signIn(page: Page, expectDashboardHeading = true) {
  await page.goto('/auth');
  await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /^Log In$/ }).last().click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
  if (expectDashboardHeading) {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  }
}

function onboardingWizard(page: Page) {
  return page.getByRole('heading', {
    name: /^(Welcome to VioMacro|The Basics|Nutrition Goals|Preferences)$/,
  }).locator('..').locator('..').locator('..');
}

async function createBrowserUser(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/auth');
  await page.getByRole('button', { name: 'Create Account' }).first().click();
  await page.getByPlaceholder('name@example.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /^Create Account$/ }).last().click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip Setup' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();
}

async function setDevFailure(page: Page, key: string, value: 'once' | 'always' = 'once') {
  await page.evaluate(
    ([failureKey, failureValue]) => {
      window.sessionStorage.setItem(`viomacro:e2e:fail:${failureKey}`, failureValue);
    },
    [key, value]
  );
}

async function clearDevFailure(page: Page, key: string) {
  await page.evaluate(
    (failureKey) => {
      window.sessionStorage.removeItem(`viomacro:e2e:fail:${failureKey}`);
    },
    key
  );
}

/**
 * Land on the planner and clear its "Plan for Week of X?" prompt.
 *
 * That prompt is a full-screen overlay. Almost none of these specs dismissed it
 * -- they simply finished their first clicks before it appeared, which is a race
 * they happened to keep winning. AUD-109 made the page lazy, the page started
 * arriving one round trip later, and they started losing it.
 *
 * AUD-130 made the prompt deterministic: it now opens when the plan read
 * finishes rather than on a 500 ms wall-clock timer, so waiting for it is
 * reliable instead of hopeful.
 *
 * The selectors below were read off the live page, not guessed. Two earlier
 * attempts guessed and cost a full suite run each: `Plan Week of ...` only
 * renders when the week is EMPTY, and `week` is lowercase and not a button.
 * `Next week` is an aria-label present in both states.
 */
async function settlePlanner(page: Page) {
  await expect(page.getByRole('button', { name: 'Next week' })).toBeVisible();

  const maybeLater = page.getByRole('button', { name: 'Maybe Later' });
  await maybeLater.waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => { /* this week already has a plan, so no prompt is coming */ });

  if (await maybeLater.isVisible().catch(() => false)) {
    await maybeLater.click();
    await expect(maybeLater).toBeHidden();
  }
}

async function setDevDelay(page: Page, key: string, delayMs: number) {
  await page.evaluate(
    ([delayKey, delayValue]) => {
      window.sessionStorage.setItem(`viomacro:e2e:delay:${delayKey}`, String(delayValue));
    },
    [key, delayMs]
  );
}

async function setDevFailureBeforeNavigation(page: Page, key: string, value: 'once' | 'always' = 'once') {
  await page.addInitScript(
    ([failureKey, failureValue]) => {
      window.sessionStorage.setItem(`viomacro:e2e:fail:${failureKey}`, failureValue);
    },
    [key, value]
  );
}

function acceptNextDialog(page: Page) {
  return new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      resolve(message);
    });
  });
}

async function seedRecipe(db: Firestore, uid: string, title: string, overrides: Record<string, unknown> = {}) {
  const recipesRef = collection(db, 'users', uid, 'recipes');
  const docRef = await addDoc(recipesRef, {
    title,
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
    instructions: [{ step: 'Cook until done.', timer: 0 }],
    imageUrl: '',
    description: 'QA recipe',
    cookTime: 30,
    servings: 4,
    calories: 520,
    protein: 42,
    carbs: 55,
    fat: 14,
    isFavorite: false,
    source: 'created',
    ...overrides,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

async function seedMealPlanForWeek(db: Firestore, uid: string, weekStart: Date, recipeId: string, recipeName: string) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const docRef = await addDoc(collection(db, 'users', uid, 'mealPlans'), {
    weekStart: toDateKey(weekStart),
    weekEnd: toDateKey(weekEnd),
    goal: 'QA Grocery Data Loss',
    days: [
      {
        date: toDateKey(weekStart),
        dayName: 'Monday',
        totalCalories: 520,
        meals: [
          {
            id: `qa-meal-${recipeName}`,
            recipeId,
            name: recipeName,
            type: 'dinner',
            calories: 520,
            protein: 42,
            carbs: 55,
            fat: 14,
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
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Seed a plan in the shape used BEFORE AUD-022: the eaten flags live inside
 * `days[].meals[]` and there is no `mealStatus` map.
 *
 * There is no migration script, so plans like this exist in every real account
 * and have to keep working forever. This helper is how that claim gets tested
 * rather than asserted.
 */
async function seedLegacyShapePlan(
  db: Firestore,
  uid: string,
  weekStart: Date,
  meals: { id: string; name: string; type: string; isEaten: boolean }[],
) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const docRef = await addDoc(collection(db, 'users', uid, 'mealPlans'), {
    weekStart: toDateKey(weekStart),
    weekEnd: toDateKey(weekEnd),
    goal: 'QA Legacy Shape',
    days: [
      {
        date: toDateKey(weekStart),
        dayName: 'Monday',
        totalCalories: 1040,
        meals: meals.map((meal) => ({
          id: meal.id,
          name: meal.name,
          type: meal.type,
          calories: 520,
          protein: 42,
          carbs: 55,
          fat: 14,
          isEaten: meal.isEaten,
        })),
      },
    ],
    dailyTargets: { calories: 1850, protein: 140, carbs: 185, fat: 60 },
    isAiGenerated: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMondayWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

async function seedCurrentMealPlan(db: Firestore, uid: string, recipeId: string, recipeName: string) {
  const weekStart = getMondayWeekStart();
  return seedMealPlanForWeek(db, uid, weekStart, recipeId, recipeName);
}

async function seedGroceryItem(
  db: Firestore,
  uid: string,
  item: { name: string; source?: 'manual' | 'generated'; mealPlanId?: string }
) {
  await addDoc(collection(db, 'users', uid, 'groceryItems'), {
    name: item.name,
    quantity: 1,
    unit: 'pcs',
    aisle: 'Other',
    isChecked: false,
    ...(item.source && { source: item.source }),
    ...(item.mealPlanId && { mealPlanId: item.mealPlanId }),
  });
}

const aiSpendPeriod = {
  periodKey: '2026-07',
  startsAtIso: '2026-07-01T07:00:00.000Z',
  endsAtIso: '2026-08-01T07:00:00.000Z',
};

function aiSpendStatus(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    period: aiSpendPeriod,
    status: 'active',
    allowanceMicros: 20_000_000,
    spentMicros: 4_000_000,
    reservedMicros: 100_000,
    remainingMicros: 14_900_000,
    safetyReserveMicros: 1_000_000,
    pricingVersion: 'gemini-standard-2026-07-09',
    lastPauseAtIso: null,
    lastPauseReason: null,
    lastPauseEmailStatus: 'not_requested',
    ...overrides,
  };
}

function isValidAiRequestId(value: unknown) {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{8,120}$/.test(value);
}

async function fulfillCallable(route: Route, result: unknown, delayMs = 0) {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ result }),
  });
}

async function expectSettingsTabsFitViewport(page: Page) {
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const tabLabels = ['Profile', 'Goals & Nutrition', 'AI Safety', 'Integrations'];

  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);

  for (const label of tabLabels) {
    const tab = page.getByRole('button', { name: label });
    await expect(tab).toBeVisible();
    const box = await tab.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.floor(box!.x)).toBeGreaterThanOrEqual(0);
    expect(Math.ceil(box!.x + box!.width)).toBeLessThanOrEqual(viewportWidth);
    expect(await tab.evaluate((button) => {
      const text = button.querySelector('span');
      return text ? text.scrollWidth <= text.clientWidth + 1 : true;
    })).toBe(true);
  }
}

async function openAiSafetySettings(page: Page) {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
  await page.getByRole('button', { name: 'AI Safety' }).click();
  await expect(page.getByRole('heading', { name: 'AI Spend Safety' })).toBeVisible();
}

async function clickNav(page: Page, href: string) {
  await page.locator(`aside a[href="${href}"]`).first().click();
}

test.describe('emulator authenticated smoke', () => {
  test('new email user sees onboarding and can skip setup', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-onboarding-${Date.now()}@example.com`;

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();

    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip Setup' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('onboarding skip survives delayed user initialization and reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-onboarding-race-${Date.now()}@example.com`;
    const client = createFirebaseClient('onboarding-race');

    await page.goto('/auth');
    await setDevDelay(page, 'initializeUserAfterRead', 1500);
    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();

    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip Setup' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    await page.waitForTimeout(2000);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const settingsSnap = await getDoc(doc(client.db, 'users', credential.user.uid));
    expect(settingsSnap.data()?.settings?.onboardingCompleted).toBe(true);

    expect(failures).toEqual([]);
  });

  test('onboarding finish persists saved setup values after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-onboarding-finish-${Date.now()}@example.com`;
    const client = createFirebaseClient('onboarding-finish');

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();

    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeVisible();
    await onboardingWizard(page).getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'The Basics' })).toBeVisible();
    await page.getByRole('spinbutton').nth(0).fill('180');
    await page.getByRole('spinbutton').nth(1).fill('165');
    await onboardingWizard(page).getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Nutrition Goals' })).toBeVisible();
    await page.getByRole('spinbutton').first().fill('2100');
    await onboardingWizard(page).getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();
    await page.getByRole('button', { name: 'Dairy' }).click();
    await page.getByRole('button', { name: 'Finish Setup' }).click();
    // Welcome disappeared two steps ago. The current step disappears only
    // when the save actually commits, so wait for that before reloading.
    await expect(page.getByRole('heading', { name: 'Preferences', exact: true })).toBeHidden();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const settingsSnap = await getDoc(doc(client.db, 'users', credential.user.uid));
    const settings = settingsSnap.data()?.settings;
    expect(settings?.onboardingCompleted).toBe(true);
    expect(settings?.currentWeight).toBe(180);
    expect(settings?.goalWeight).toBe(165);
    expect(settings?.dailyCalorieTarget).toBe(2100);
    expect(settings?.allergies).toContain('Dairy');

    expect(failures).toEqual([]);
  });

  test('auth page shows useful local auth states and disables unverified Google sign-in', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/FirebaseError:/]);

    await page.goto('/auth');
    await expect(page.getByRole('button', { name: 'Google Sign-In Coming Soon' })).toBeDisabled();

    await page.getByRole('button', { name: /^Log In$/ }).last().click();
    await expect(page.getByText('Please enter both email and password')).toBeVisible();

    await page.getByPlaceholder('name@example.com').fill(`missing-${Date.now()}@example.com`);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Log In$/ }).last().click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.locator('input[type="password"]').fill('123');
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();
    await expect(page.getByText('Password should be at least 6 characters')).toBeVisible();

    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();
    await expect(page.getByText('Email already in use')).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('protected routes redirect signed-out users and sign out returns to auth', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    await signIn(page);
    await page.locator('aside').first().getByRole('button').last().click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('test user can sign in and navigate launch-critical screens', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await createBrowserUser(page, `qa-core-navigation-${Date.now()}@example.test`);

    await expect(page.getByText(/Phase:/)).toBeVisible();
    await expect(page.getByText('Start Check-In')).toBeVisible();

    await clickNav(page, '/plan');
    await expect(page).toHaveURL(/\/plan$/);
    // The planner's prompt is a full-screen overlay; it must be cleared before
    // clicking anything else, including the sidebar.
    await settlePlanner(page);
    await expect(page.getByRole('heading', { name: /Plan/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create New Plan|Add to List/ }).first()).toBeVisible();

    await clickNav(page, '/recipes');
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByRole('heading', { name: 'My Kitchen' })).toBeVisible();
    await expect(page.getByPlaceholder(/Search recipes/)).toBeVisible();

    await clickNav(page, '/grocery');
    await expect(page).toHaveURL(/\/grocery$/);
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();

    await clickNav(page, '/pantry');
    await expect(page).toHaveURL(/\/pantry$/);
    await expect(page.getByRole('heading', { name: 'My Pantry' })).toBeVisible();

    await clickNav(page, '/progress');
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.getByRole('heading', { name: 'Plan History' })).toBeVisible();

    await clickNav(page, '/settings');
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('direct launch routes render after sign-in without App Check token warnings', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const appCheckWarnings = collectAppCheckWarnings(page);

    await signIn(page);

    const routes = [
      { path: '/', heading: 'Dashboard' },
      { path: '/plan', heading: /Plan/ },
      { path: '/recipes', heading: 'My Kitchen' },
      { path: '/recipes/import', heading: 'Start with Magic Import' },
      { path: '/grocery', heading: 'Smart Grocery List' },
      { path: '/pantry', heading: 'My Pantry' },
      { path: '/progress', heading: 'Plan History' },
      { path: '/settings', heading: /Settings & Preferences/ },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
    }

    expect(appCheckWarnings).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('desktop navigation shell exposes active routes, profile settings, and sign out', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await signIn(page);
    const desktopShell = page.locator('aside').first();

    const desktopRoutes = [
      { path: '/', label: 'Dashboard', heading: 'Dashboard' },
      { path: '/plan', label: 'Plan', heading: /Plan/ },
      { path: '/recipes', label: 'Recipes', heading: 'My Kitchen' },
      { path: '/progress', label: 'Progress', heading: 'Plan History' },
      { path: '/grocery', label: 'Grocery List', heading: 'Smart Grocery List' },
      { path: '/pantry', label: 'Pantry', heading: 'My Pantry' },
      { path: '/settings', label: 'Settings', heading: /Settings & Preferences/ },
    ];

    for (const route of desktopRoutes) {
      await desktopShell.locator(`a[href="${route.path}"]`).last().click();
      await expect(page).toHaveURL(new RegExp(`${route.path === '/' ? '/$' : `${route.path}$`}`));
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
      await expect(desktopShell.locator(`a[href="${route.path}"][aria-current="page"]`)).toBeVisible();
      // The planner overlay would cover the next sidebar link.
      if (route.path === '/plan') await settlePlanner(page);
    }

    await page.goto('/recipes/import');
    await expect(page.locator('header').getByRole('heading', { name: 'Recipes' })).toBeVisible();

    await desktopShell.getByRole('link', { name: 'Open profile settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);

    await desktopShell.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('mobile navigation shell reaches account routes and closes after selection', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const chartWarnings = collectChartWarnings(page);
    const email = `qa-mobile-shell-${Date.now()}@example.com`;
    const client = createFirebaseClient('mobile-shell');
    const credential = await createUserWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await setDoc(doc(client.db, 'users', credential.user.uid), {
      email,
      createdAt: Timestamp.now(),
      settings: {
        onboardingCompleted: true,
        dailyCalorieTarget: 2000,
        macroSplit: { protein: 30, carbs: 35, fat: 35 },
        dietaryTags: [],
        allergies: [],
        measurementUnit: 'metric',
        phase: 'maintenance',
      },
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth');
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Log In$/ }).last().click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false');

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const mobileShell = page.locator('aside').last();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveCount(1);
    await expect(mobileShell.locator('nav a[href="/settings"]')).toBeVisible();
    await mobileShell.locator('nav a[href="/settings"]').click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await mobileShell.getByRole('link', { name: 'Open profile settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await mobileShell.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    expect(failures).toEqual([]);
    expect(chartWarnings).toEqual([]);
  });

  test('progress history empty state routes users back to meal planner', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-progress-empty-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/progress');

    await expect(page.getByRole('heading', { name: 'Plan History' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Metrics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No saved plans yet' })).toBeVisible();
    await expect(page.getByText('Trend charts are coming later.')).toBeVisible();

    await page.getByRole('link', { name: /Open Meal Planner/ }).click();
    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('heading', { name: /Plan/ }).first()).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('progress history shows deterministic saved plan and daily metric data', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-progress-data-${Date.now()}@example.com`;
    const client = createFirebaseClient('progress-data');

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    await seedCurrentMealPlan(client.db, uid, 'qa-history-recipe', 'QA History Bowl');
    await setDoc(doc(client.db, 'users', uid, 'weightHistory', toDateKey(new Date())), {
      date: toDateKey(new Date()),
      weight: 182.4,
      sleepHours: 7.5,
      waterMl: 750,
      timestamp: Timestamp.now(),
    });

    await page.goto('/progress');

    await expect(page.getByRole('heading', { name: 'Plan History' })).toBeVisible();
    await expect(page.getByText('QA Grocery Data Loss')).toBeVisible();
    await expect(page.getByText('0/1 meals')).toBeVisible();
    await expect(page.getByText('1850')).toBeVisible();
    await expect(page.getByText('140g')).toBeVisible();
    await expect(page.getByText('0%')).toBeVisible();
    await expect(page.getByText('182.4 kg')).toBeVisible();
    await expect(page.getByText('7.5h')).toBeVisible();
    await expect(page.getByText('750ml')).toBeVisible();
    await expect(page.getByText('Showing up to 8 saved meal plans, ordered by week start.')).toBeVisible();

    await page.getByRole('link', { name: /Open Planner/ }).click();
    await expect(page).toHaveURL(/\/plan$/);

    expect(failures).toEqual([]);
  });

  test('progress history load failure shows retry instead of empty success state', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to load history/i]);
    const email = `qa-progress-failure-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await setDevFailure(page, 'getMealPlans');
    await page.goto('/progress');

    await expect(page.getByRole('heading', { name: 'History could not load' })).toBeVisible();
    await expect(page.getByText('No saved plans yet')).toBeHidden();

    await page.getByRole('button', { name: 'Retry History' }).click();
    await expect(page.getByRole('heading', { name: 'No saved plans yet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'History could not load' })).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('meal planner empty-grid creation stays page-local and usable', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-empty-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');
    await settlePlanner(page);

    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();

    const openWizardButton = page.getByRole('button', { name: 'Open Plan Wizard' });
    if (!(await openWizardButton.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }

    await expect(openWizardButton).toBeVisible();
    await openWizardButton.click();

    await expect(page.getByRole('heading', { name: 'Create Your Week Plan' })).toBeVisible();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();

    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to List/ })).toBeVisible();
    await expect(page.getByText('Monday').first()).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner clone without saved history shows recoverable feedback', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-clone-empty-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');

    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();
    // This spec is about the prompt itself: "Clone Last Week" is one of its own
    // buttons, so it must stay open.
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeVisible();

    await page.getByRole('button', { name: 'Clone Last Week' }).click();

    await expect(page.getByRole('alert')).toContainText('No previous saved plan was found to clone');
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create New Plan' })).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss meal planner message' }).click();
    await expect(page.getByRole('alert')).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('meal planner clone from previous saved plan creates a draft for the selected week', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-clone-success-${Date.now()}@example.com`;
    const recipeName = `QA Clone Bowl ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('meal-planner-clone-success');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const recipeId = await seedRecipe(client.db, credential.user.uid, recipeName);
    await seedCurrentMealPlan(client.db, credential.user.uid, recipeId, recipeName);

    await page.goto('/plan');
    await settlePlanner(page);
    await expect(page.getByText(recipeName)).toBeVisible();
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();
    await page.getByRole('button', { name: 'Create New Plan' }).click();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeVisible();

    await page.getByRole('button', { name: 'Clone Last Week' }).click();

    await expect(page.getByRole('alert')).toContainText('Previous saved plan cloned into this week');
    await expect(page.getByText(recipeName)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner opens saved recipe details through recipeId when meal id is separate', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-detail-recipeid-${Date.now()}@example.com`;
    const recipeName = `QA Detail Bowl ${Date.now()}`;
    const ingredientName = `QA Distinct Ingredient ${Date.now()}`;
    const instruction = `Use the saved recipe instruction ${Date.now()}.`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('meal-planner-detail-recipeid');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const recipeId = await seedRecipe(client.db, credential.user.uid, recipeName, {
      ingredients: [
        {
          item: ingredientName,
          quantity: '2',
          unit: 'cups',
          amount: '',
          swaps: [],
        },
      ],
      instructions: [{ step: instruction, timer: 0 }],
    });
    await seedCurrentMealPlan(client.db, credential.user.uid, recipeId, recipeName);

    await page.goto('/plan');
    await settlePlanner(page);
    await expect(page.getByText(recipeName)).toBeVisible();
    await page.getByText(recipeName).first().click();

    await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
    await expect(page.getByText(`2 cups ${ingredientName}`)).toBeVisible();
    await expect(page.getByText(instruction)).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner clone targets the immediately previous selected week, not the latest saved plan', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-clone-exact-week-${Date.now()}@example.com`;
    const previousRecipeName = `QA Previous Clone Bowl ${Date.now()}`;
    const latestRecipeName = `QA Latest Clone Bowl ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('meal-planner-clone-exact-week');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;
    const previousRecipeId = await seedRecipe(client.db, uid, previousRecipeName);
    const latestRecipeId = await seedRecipe(client.db, uid, latestRecipeName);
    const previousWeekStart = getMondayWeekStart();
    const latestWeekStart = new Date(previousWeekStart);
    latestWeekStart.setDate(previousWeekStart.getDate() + 14);
    await seedMealPlanForWeek(client.db, uid, previousWeekStart, previousRecipeId, previousRecipeName);
    await seedMealPlanForWeek(client.db, uid, latestWeekStart, latestRecipeId, latestRecipeName);

    await page.goto('/plan');
    await settlePlanner(page);
    await expect(page.getByText(previousRecipeName)).toBeVisible();
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();
    await page.getByRole('button', { name: 'Create New Plan' }).click();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeVisible();

    await page.getByRole('button', { name: 'Clone Last Week' }).click();

    await expect(page.getByRole('alert')).toContainText('Previous saved plan cloned into this week');
    await expect(page.getByText(previousRecipeName)).toBeVisible();
    await expect(page.getByText(latestRecipeName)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner prompt can be dismissed without blocking sidebar navigation', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-dismiss-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');

    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeVisible();

    await page.getByRole('button', { name: 'Maybe Later' }).click();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeHidden();

    await page.getByRole('link', { name: /Grocery List/ }).first().click();
    await expect(page).toHaveURL(/\/grocery$/);
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner empty-grid plan saves and persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-save-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');
    await settlePlanner(page);

    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();

    const openWizardButton = page.getByRole('button', { name: 'Open Plan Wizard' });
    if (!(await openWizardButton.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }

    await expect(openWizardButton).toBeVisible();
    await openWizardButton.click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();

    const confirmButton = page.getByRole('button', { name: 'Confirm Plan' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('button', { name: /Add to List/ })).toBeVisible();
    await expect(page.getByText('Monday').first()).toBeVisible();
    await expect(page.getByText('No plan found for this week')).toBeHidden();

    const reloadedConfirmButton = page.getByRole('button', { name: 'Confirm Plan' });
    await expect(reloadedConfirmButton).toBeVisible();
    await expect(reloadedConfirmButton).toBeDisabled();

    expect(failures).toEqual([]);
  });

  test('meal planner week navigation moves next and previous without prompt trap', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-week-nav-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');

    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeVisible();
    await page.getByRole('button', { name: 'Maybe Later' }).click();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeHidden();

    const currentWeekLabel = await page.getByRole('heading', { name: /Plan Week of/ }).innerText();

    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeHidden();
    const nextWeekLabel = await page.getByRole('heading', { name: /Plan Week of/ }).innerText();
    expect(nextWeekLabel).not.toBe(currentWeekLabel);

    await page.getByRole('button', { name: 'Previous week' }).click();
    await expect(page.getByRole('heading', { name: /Plan for Week of/ })).toBeHidden();
    await expect(page.getByRole('heading', { name: currentWeekLabel })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner future-week empty grid saves and stays selected after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-future-save-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');

    await settlePlanner(page);

    await page.getByRole('button', { name: 'Next week' }).click();
    // Read the week off the toolbar, not the empty-state heading. That heading
    // exists ONLY while the week is empty, so checking for it after the plan is
    // saved is a race: it passes only if the assertion runs before the plan
    // finishes loading. Lazy loading changed that timing and exposed it.
    const futureWeekLabel = await page.getByText(/^Week of [A-Z][a-z]{2} \d+$/).innerText();

    await page.getByRole('button', { name: 'Create New Plan' }).click();
    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();

    await page.getByRole('button', { name: 'Confirm Plan' }).click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/plan$/);
    // Wait for the saved plan to render, THEN check which week is on screen.
    await expect(page.getByRole('button', { name: /Add to List/ })).toBeVisible();
    await expect(page.getByText(futureWeekLabel)).toBeVisible();
    await expect(page.getByText('No plan found for this week')).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('meal planner preferences edit enables resave and persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-edit-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');
    await settlePlanner(page);

    if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }

    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();

    const confirmButton = page.getByRole('button', { name: 'Confirm Plan' });
    await confirmButton.click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeDisabled();

    await page.getByRole('button', { name: /Preferences/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Plan Settings' })).toBeVisible();
    await page.getByRole('spinbutton').first().fill('2100');
    await page.getByRole('button', { name: 'Save Targets' }).click();

    await expect(page.getByText('0 / 2100').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeEnabled();
    await page.getByRole('button', { name: 'Confirm Plan' }).click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    await page.reload();
    await expect(page.getByText('0 / 2100').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeDisabled();

    expect(failures).toEqual([]);
  });

  test('meal planner non-week modes show honest coming soon states', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-non-week-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');
    await settlePlanner(page);

    const dayTab = page.getByRole('button', { name: 'day', exact: true });
    const weekTab = page.getByRole('button', { name: 'week', exact: true });
    const monthTab = page.getByRole('button', { name: 'month', exact: true });

    await expect(weekTab).toHaveAttribute('aria-pressed', 'true');

    await dayTab.click();
    await expect(dayTab).toHaveAttribute('aria-pressed', 'true');
    await expect(weekTab).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('heading', { name: 'Coming Soon' })).toBeVisible();
    await expect(page.getByText('Daily breakdown is currently under development.')).toBeVisible();

    await weekTab.click();
    await expect(weekTab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();

    await monthTab.click();
    await expect(monthTab).toHaveAttribute('aria-pressed', 'true');
    await expect(weekTab).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('heading', { name: 'Coming Soon' })).toBeVisible();
    await expect(page.getByText('Monthly overview is currently under development.')).toBeVisible();

    await weekTab.click();
    await expect(weekTab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: /Plan Week of/ })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('meal planner wizard exposes named smoothie and tea toggles', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-planner-wizard-toggles-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.goto('/plan');
    await settlePlanner(page);

    if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }

    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();

    const smoothieToggle = page.getByLabel('Daily Smoothie');
    const teaToggle = page.getByLabel('Daily Tea');

    await expect(smoothieToggle).toBeVisible();
    await expect(teaToggle).toBeVisible();
    await expect(smoothieToggle).not.toBeChecked();
    await expect(teaToggle).not.toBeChecked();

    await smoothieToggle.check();
    await teaToggle.check();
    await expect(smoothieToggle).toBeChecked();
    await expect(teaToggle).toBeChecked();

    await smoothieToggle.uncheck();
    await expect(smoothieToggle).not.toBeChecked();
    await expect(teaToggle).toBeChecked();

    expect(failures).toEqual([]);
  });

  for (const width of [1440, 390]) {
    test(`G4 meal-planner-failure inline recovery keeps draft and retries at ${width}px`, async ({ page }) => {
      test.setTimeout(90_000);
      const failures = collectConsoleFailures(page, [/Failed to save meal plan/i, /Injected saveMealPlan failure/i]);
      const { client, uid } = await g4Account(page, width, 'save-recovery');
      const recipeTitle = `G4 Recovery Breakfast ${width}`;
      const recipeId = await seedRecipe(client.db, uid, recipeTitle, { mealType: 'breakfast' });
      const previousWeek = getMondayWeekStart(); previousWeek.setDate(previousWeek.getDate() - 7);
      await seedMealPlanForWeek(client.db, uid, previousWeek, recipeId, 'Previous week sentinel');
      await page.goto('/plan');
      await settlePlanner(page);
      if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
        await page.getByRole('button', { name: 'Create New Plan' }).click();
      }
      await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
      await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();
      const monday = g4Day(page, 'Monday');
      await monday.getByText('Add Breakfast', { exact: true }).click();
      const addPicker = page.getByRole('heading', { name: 'Select Breakfast', exact: true });
      await g4Purpose(g4Icon(addPicker.locator('..').locator('..'), 'close'), 'Close recipe picker');
      await page.getByRole('heading', { name: recipeTitle, exact: true }).click();
      await g4SetTargets(page, 2500);
      const before = await g4Snapshot(client.db, uid);
      const dialogs: string[] = [];
      page.on('dialog', async dialog => { dialogs.push(`${dialog.type()}: ${dialog.message()}`); await dialog.dismiss(); });
      await setDevFailure(page, 'saveMealPlan');
      const confirmButton = page.getByRole('button', { name: /Confirm Plan/ });
      await confirmButton.click();
      await expect.soft(page.getByRole('alert')).toContainText(/could not|failed|try again/i, { timeout: 750 });
      expect.soft(dialogs, 'save failure must use the planner inline notice').toEqual([]);
      await expect(confirmButton).toBeVisible();
      await expect(confirmButton).toBeEnabled();
      const addToList = page.locator('button').filter({ hasText: /shopping_cart/ });
      await expect(addToList).toBeVisible();
      await g4Purpose(addToList, 'Add to List');
      await expect(page.getByText('Monday').first()).toBeVisible();
      await expect(page.getByText('No plan found for this week')).toBeHidden();
      await expect(monday.getByRole('heading', { name: recipeTitle, exact: true })).toBeVisible();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await confirmButton.click();
      await expect(page.getByRole('button', { name: /Saved!/ })).toBeVisible();
      const saved = await g4Snapshot(client.db, uid);
      expect(saved.collections.mealPlans).toHaveLength(before.collections.mealPlans.length + 1);
      const current = saved.collections.mealPlans.find(plan => plan.weekStart === toDateKey(getMondayWeekStart()))!;
      expect(current).toMatchObject({ dailyTargets: { calories: 2500 }, isAiGenerated: false });
      const savedDays = current.days as { dayName: string; meals: Record<string, unknown>[] }[];
      expect(savedDays[0].meals).toContainEqual(expect.objectContaining({ name: recipeTitle, recipeId }));
      expect(saved.collections.mealPlans.find(plan => plan.id === before.collections.mealPlans[0].id)).toEqual(before.collections.mealPlans[0]);
      for (const name of ['recipes', 'groceryItems', 'pantryItems', 'weightHistory'] as const) expect(saved.collections[name]).toEqual(before.collections[name]);
      await page.reload(); await settlePlanner(page);
      await expect(g4Day(page, 'Monday').getByRole('heading', { name: recipeTitle, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /Confirm Plan/ })).toBeDisabled();
      await page.getByTitle('Preferences', { exact: true }).click();
      await expect(g4Settings(page).getByRole('spinbutton').nth(0)).toHaveValue('2500');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      expect(await g4Snapshot(client.db, uid)).toEqual(saved);
      expect.soft(dialogs).toEqual([]);
      expect(failures).toEqual([]);
    });
  }

  test('meal-planner-failure generation feedback keeps current draft visible', async ({ page }) => {
    await enableMockAi(page);
    const failures = collectConsoleFailures(page, [
      /Error calling AI service/i,
      /Generation failed/i,
      /Injected generateAiMealPlan failure/i,
    ]);
    const email = `qa-meal-planner-ai-fail-${Date.now()}@example.com`;

    await createBrowserUser(page, email);

    // AUD-031/AUD-110: this test used to reach the AI call with an EMPTY recipe
    // library, because the planner silently substituted demo recipes. That
    // fallback is gone, so generation is now correctly blocked before the AI
    // call unless a real recipe exists. Seed one so this test still exercises
    // what it is actually about: AI failure feedback.
    const aiFailClient = createFirebaseClient('meal-planner-ai-fail');
    const aiFailCredential = await signInWithEmailAndPassword(aiFailClient.auth, email, TEST_PASSWORD);
    await seedRecipe(aiFailClient.db, aiFailCredential.user.uid, 'AI Fail Fixture Recipe');

    await page.goto('/plan');
    await settlePlanner(page);

    if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }

    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();

    await setDevFailure(page, 'generateAiMealPlan');
    await page.getByRole('button', { name: 'Plan Week' }).click();
    if (await page.getByRole('button', { name: /Continue with This Week/ }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /Continue with This Week/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Create Your Week Plan' })).toBeVisible();

    await page.getByRole('button', { name: 'Auto-Generate Week' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not generate a meal plan');
    await expect(page.getByRole('heading', { name: 'Create Your Week Plan' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to List/ })).toBeVisible();
    await expect(page.getByText('Monday').first()).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('recipe empty-state import link does not leave the user on a missing route', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await signIn(page);
    await page.goto('/recipes');

    const importLink = page.getByRole('link', { name: /Import your first recipe/ });
    if (await importLink.isVisible()) {
      await importLink.click();
      await expect(page).toHaveURL(/\/recipes\/import$/);
      await expect(page.getByRole('heading', { name: 'Start with Magic Import' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Choose recipe file/ })).toBeVisible();
    }

    expect(failures).toEqual([]);
  });

  test('user can save settings changes', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-settings-save-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    const networkFailures = collectNetworkFailures(page);
    await page.goto('/settings');
    await expect(page.getByLabel('Current Weight (kg)', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Goal Weight (kg)', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Rate of Change', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Daily Calorie Target', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Protein percentage', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Carbs percentage', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Fat percentage', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Custom Bottle Size (ml)', { exact: true })).toBeVisible();

    const dairyFree = page.getByRole('button', { name: 'Dairy Free' });
    const glutenFree = page.getByRole('button', { name: 'Gluten Free' });
    await expect(dairyFree).toHaveAttribute('aria-pressed', 'false');
    await expect(glutenFree).toHaveAttribute('aria-pressed', 'false');

    await page.getByLabel('Custom Bottle Size (ml)', { exact: true }).fill('575');
    await dairyFree.click();
    await glutenFree.click();
    await expect(dairyFree).toHaveAttribute('aria-pressed', 'true');
    await expect(glutenFree).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Confirm Targets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm Targets' }).click();
    // AUD-131: wait for the bar to GO, not for the button's name to change. While a save is in flight the same button is relabelled "Saving...", so waiting on 'Confirm Targets' returned the moment the save STARTED -- and the reload below then aborted the write. 'Discard' exists only while there are unsaved changes, so it disappearing means saved.
    await expect(page.getByRole('button', { name: 'Discard' })).toBeHidden();

    await page.reload();
    await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
    await expect(page.getByLabel('Custom Bottle Size (ml)', { exact: true })).toHaveValue('575');
    await expect(dairyFree).toHaveAttribute('aria-pressed', 'true');
    await expect(glutenFree).toHaveAttribute('aria-pressed', 'true');

    expect(networkFailures).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('Settings waits to load AI Safety status until the tab is active and mobile tabs fit', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    let statusCalls = 0;

    await page.route('**/getAiSpendStatus', async (route) => {
      statusCalls += 1;
      await fulfillCallable(route, aiSpendStatus());
    });
    await page.route('**/manualPauseAiSpend', async (route) => {
      await fulfillCallable(route, aiSpendStatus({ status: 'manually_paused' }));
    });
    await page.route('**/resumeAiSpendAllowance', async (route) => {
      await fulfillCallable(route, aiSpendStatus({ status: 'active' }));
    });

    await createBrowserUser(page, `qa-settings-ai-tab-${Date.now()}@example.com`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
    await expect(page.getByLabel('Daily Calorie Target', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Spend Safety' })).toHaveCount(0);
    await expect.poll(() => statusCalls, {
      message: 'AI Safety status should not load before the AI Safety tab is opened',
      timeout: 750,
    }).toBe(0);

    await expectSettingsTabsFitViewport(page);
    await page.screenshot({ path: 'test-results/cmd-020-settings-tabs-mobile.png', fullPage: true });

    await page.getByRole('button', { name: 'AI Safety' }).click();
    await expect(page.getByRole('heading', { name: 'AI Spend Safety' })).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    expect(statusCalls).toBeGreaterThan(0);
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);

    expect(failures).toEqual([]);
  });

  test('settings exact macro targets persist and feed dashboard targets', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-settings-targets-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('settings-targets');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await page.goto('/settings');

    await page.getByRole('button', { name: 'Exact Grams' }).click();
    await page.getByLabel('Protein target grams').fill('160');
    await page.getByLabel('Carbs target grams').fill('210');
    await page.getByLabel('Fat target grams').fill('70');
    await page.getByLabel('Custom Bottle Size (ml)', { exact: true }).fill('650');
    await page.getByRole('button', { name: 'Dairy Free' }).click();
    await page.getByRole('button', { name: 'Peanuts' }).click();
    await page.getByRole('button', { name: 'Confirm Targets' }).click();
    // AUD-131: wait for the bar to GO, not for the button's name to change. While a save is in flight the same button is relabelled "Saving...", so waiting on 'Confirm Targets' returned the moment the save STARTED -- and the reload below then aborted the write. 'Discard' exists only while there are unsaved changes, so it disappearing means saved.
    await expect(page.getByRole('button', { name: 'Discard' })).toBeHidden();

    const settingsSnap = await getDoc(doc(client.db, 'users', credential.user.uid));
    expect(settingsSnap.data()?.settings).toMatchObject({
      macroMode: 'grams',
      macroTargets: { protein: 160, carbs: 210, fat: 70 },
      dailyCalorieTarget: 2110,
      bottleSize: 650,
    });

    await page.reload();
    await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
    await expect(page.getByLabel('Protein target grams')).toHaveValue('160');
    await expect(page.getByLabel('Carbs target grams')).toHaveValue('210');
    await expect(page.getByLabel('Fat target grams')).toHaveValue('70');
    await expect(page.getByLabel('Custom Bottle Size (ml)', { exact: true })).toHaveValue('650');

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('div', { has: page.getByText('Daily Calories') }).first()).toContainText('2110');
    await expect(page.locator('div', { has: page.getByText('Protein') }).first()).toContainText('160');
    await expect(page.locator('div', { has: page.getByText('Carbs') }).first()).toContainText('210');
    await expect(page.locator('div', { has: page.getByText('Fat') }).first()).toContainText('70');
    await expect(page.getByRole('button', { name: '+650ml' })).toBeVisible();

    await page.goto('/plan');
    await settlePlanner(page);
    if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }
    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();
    await expect(page.getByText('0 / 2110').first()).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('AUD-015: signing out mid-load never shows the next user the last one\'s data', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const emailA = `qa-leak-a-${Date.now()}@example.com`;
    const emailB = `qa-leak-b-${Date.now()}@example.com`;

    // Two accounts with unmistakably different calorie targets. 1111 must never
    // appear on B's dashboard.
    await createBrowserUser(page, emailA);
    const clientA = createFirebaseClient('leak-a');
    const credA = await signInWithEmailAndPassword(clientA.auth, emailA, TEST_PASSWORD);
    await setDoc(
      doc(clientA.db, 'users', credA.user.uid),
      { settings: { dailyCalorieTarget: 1111, onboardingCompleted: true, measurementUnit: 'metric' } },
      { merge: true }
    );

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth$/);

    await createBrowserUser(page, emailB);
    const clientB = createFirebaseClient('leak-b');
    const credB = await signInWithEmailAndPassword(clientB.auth, emailB, TEST_PASSWORD);
    await setDoc(
      doc(clientB.db, 'users', credB.user.uid),
      { settings: { dailyCalorieTarget: 2222, onboardingCompleted: true, measurementUnit: 'metric' } },
      { merge: true }
    );

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth$/);

    // Now the race. Sign in as A with a slow settings read, then sign out and
    // sign in as B before A's response lands. The store's initial load has no
    // cancellation, so A's reply can dispatch into B's state.
    await setDevDelay(page, 'getUserSettings', 5000);

    await page.getByPlaceholder('name@example.com').fill(emailA);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Log In$/ }).last().click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth$/);

    await page.getByPlaceholder('name@example.com').fill(emailB);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Log In$/ }).last().click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Give A's delayed response every chance to arrive and overwrite B.
    await page.waitForTimeout(7000);

    await expect(page.getByText('1111')).toHaveCount(0);
    await expect(page.getByText('2222').first()).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('saving one setting does not clobber the others', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-settings-merge-${Date.now()}@example.com`;

    // An account that differs from createDefaultUserSettings() in every field the
    // Settings draft fills in from a default. If any of these come back changed
    // after toggling one unrelated thing, the save clobbered them.
    const stored = {
      measurementUnit: 'imperial',
      phase: 'muscle-gain',
      bottleSize: 750,
      macroMode: 'grams',
      currentWeight: 206.7,
      goalWeight: 170,
      dailyCalorieTarget: 1900,
      macroSplit: { protein: 40, carbs: 30, fat: 30 },
      dietaryTags: [],
      allergies: [],
      onboardingCompleted: true,
      phaseStartDate: '2026-01-22T06:18:13.139Z',
    };

    await createBrowserUser(page, email);
    const client = createFirebaseClient('settings-merge');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const userRef = doc(client.db, 'users', credential.user.uid);
    await setDoc(userRef, { settings: stored }, { merge: true });

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Dairy Free' }).click();
    await page.getByRole('button', { name: 'Confirm Targets' }).click();
    // AUD-131: wait for the bar to GO, not for the button's name to change. While a save is in flight the same button is relabelled "Saving...", so waiting on 'Confirm Targets' returned the moment the save STARTED -- and the reload below then aborted the write. 'Discard' exists only while there are unsaved changes, so it disappearing means saved.
    await expect(page.getByRole('button', { name: 'Discard' })).toBeHidden();

    // Poll rather than read once. The button hides on the optimistic update, so
    // a single read here is a race -- one that cost an hour of chasing a bug
    // that did not exist.
    await expect
      .poll(async () => (await getDoc(userRef)).data()?.settings?.dietaryTags ?? [])
      .toContain('dairy-free');

    const saved = (await getDoc(userRef)).data()?.settings ?? {};
    expect(saved.measurementUnit).toBe('imperial');
    expect(saved.phase).toBe('muscle-gain');
    expect(saved.bottleSize).toBe(750);
    expect(saved.macroMode).toBe('grams');
    expect(saved.currentWeight).toBe(206.7);
    expect(saved.goalWeight).toBe(170);
    expect(saved.dailyCalorieTarget).toBe(1900);
    expect(saved.macroSplit).toEqual({ protein: 40, carbs: 30, fat: 30 });
    expect(saved.phaseStartDate).toBe('2026-01-22T06:18:13.139Z');

    expect(failures).toEqual([]);
  });

  test('settings save failure shows recovery and keeps the draft', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to update settings/i, /Failed to save settings/i, /Injected updateUserSettings failure/i]);

    await signIn(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Dairy Free' }).click();

    await setDevFailure(page, 'updateUserSettings');
    const dialogMessagePromise = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Confirm Targets' }).click();
    await expect(dialogMessagePromise).resolves.toContain('Failed to save settings');

    await expect(page.getByRole('button', { name: 'Confirm Targets' })).toBeVisible();
    await expect(page.getByText("We couldn't save your settings")).toBeVisible();
    await expect(page.getByRole('button', { name: /Dairy Free/ })).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Targets' }).click();
    // AUD-131: wait for the bar to GO, not for the button's name to change. While a save is in flight the same button is relabelled "Saving...", so waiting on 'Confirm Targets' returned the moment the save STARTED -- and the reload below then aborted the write. 'Discard' exists only while there are unsaved changes, so it disappearing means saved.
    await expect(page.getByRole('button', { name: 'Discard' })).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('settings discard restores unsaved local edits', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    // AUD-122: signIn() uses the seeded test@test.com account, which is
    // measurementUnit: 'imperial'. So this spec correctly expects "lbs" while the
    // metric specs above expect "kg" -- together they prove the label follows the
    // user's unit instead of being hardcoded either way.
    await signIn(page);
    await page.goto('/settings');
    await page.getByLabel('Current Weight (lbs)').fill('199');
    await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();

    await expect(page.getByRole('button', { name: 'Confirm Targets' })).toBeHidden();
    await expect(page.getByLabel('Current Weight (lbs)')).not.toHaveValue('199');

    expect(failures).toEqual([]);
  });

  test('settings profile display name persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-settings-profile-${Date.now()}@example.com`;
    const displayName = `QA Chef ${Date.now()}`;

    await createBrowserUser(page, email);
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByPlaceholder('Enter your name').fill(displayName);
    await page.getByRole('button', { name: 'Confirm Targets' }).click();
    // AUD-131: wait for the bar to GO, not for the button's name to change. While a save is in flight the same button is relabelled "Saving...", so waiting on 'Confirm Targets' returned the moment the save STARTED -- and the reload below then aborted the write. 'Discard' exists only while there are unsaved changes, so it disappearing means saved.
    await expect(page.getByRole('button', { name: 'Discard' })).toBeHidden();

    await page.reload();
    await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page.getByPlaceholder('Enter your name')).toHaveValue(displayName);

    expect(failures).toEqual([]);
  });

  test('AI Safety shows active and approaching-limit states and manually pauses with refetch', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const mutationPayloads: unknown[] = [];
    let serverStatus = aiSpendStatus({
      spentMicros: 17_500_000,
      reservedMicros: 250_000,
      remainingMicros: 1_250_000,
    });

    await page.route('**/getAiSpendStatus', async (route) => {
      await fulfillCallable(route, serverStatus);
    });
    await page.route('**/manualPauseAiSpend', async (route) => {
      mutationPayloads.push(route.request().postDataJSON()?.data);
      serverStatus = aiSpendStatus({
        status: 'manually_paused',
        spentMicros: 17_500_000,
        reservedMicros: 250_000,
        remainingMicros: 1_250_000,
        lastPauseAtIso: '2026-07-10T18:00:00.000Z',
        lastPauseReason: 'owner_manual_pause',
        lastPauseEmailStatus: 'not_requested',
      });
      await fulfillCallable(route, aiSpendStatus({ status: 'manually_paused' }), 150);
    });
    await page.route('**/resumeAiSpendAllowance', async (route) => {
      await fulfillCallable(route, aiSpendStatus());
    });

    await createBrowserUser(page, `qa-ai-safety-active-${Date.now()}@example.com`);
    await openAiSafetySettings(page);

    await expect(page.getByText('Approaching limit')).toBeVisible();
    await expect(page.getByText('$20.00').first()).toBeVisible();
    await expect(page.getByText('$17.50')).toBeVisible();
    await expect(page.getByText('$0.25')).toBeVisible();
    await expect(page.getByText('$1.25')).toBeVisible();
    await expect(page.getByText(/Jul 1 - Aug 1 PT/)).toBeVisible();
    await expect(page.getByText('gemini-standard-2026-07-09')).toBeVisible();

    await page.screenshot({ path: 'test-results/cmd-018-ai-safety-active-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/cmd-018-ai-safety-active-mobile.png', fullPage: true });
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByRole('button', { name: 'Manual pause' }).click();
    await expect(page.getByRole('dialog', { name: 'Pause AI now?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm manual pause' }).click();
    await expect(page.getByRole('button', { name: 'Manual pause' })).toBeDisabled();
    await expect(page.getByText('Paused manually')).toBeVisible();
    await expect(page.getByText('Manual owner pause')).toBeVisible();
    await expect(page.getByText('Manual pause confirmed.')).toBeVisible();

    expect(mutationPayloads).toHaveLength(1);
    expect(isValidAiRequestId((mutationPayloads[0] as { idempotencyKey?: unknown }).idempotencyKey)).toBe(true);
    expect(failures).toEqual([]);
  });

  test('AI Safety shows automatic pause without provider email language and resumes with refetch', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const mutationPayloads: unknown[] = [];
    let serverStatus = aiSpendStatus({
      status: 'paused',
      spentMicros: 18_900_000,
      reservedMicros: 100_000,
      remainingMicros: 0,
      lastPauseAtIso: '2026-07-10T18:30:00.000Z',
      lastPauseReason: 'reconciled_usage_reached_or_exceeded_allowance',
      lastPauseEmailStatus: 'failed',
    });

    await page.route('**/getAiSpendStatus', async (route) => {
      await fulfillCallable(route, serverStatus);
    });
    await page.route('**/resumeAiSpendAllowance', async (route) => {
      mutationPayloads.push(route.request().postDataJSON()?.data);
      serverStatus = aiSpendStatus({
        status: 'active',
        allowanceMicros: 40_000_000,
        spentMicros: 18_900_000,
        reservedMicros: 0,
        remainingMicros: 20_100_000,
        lastPauseEmailStatus: 'not_requested',
      });
      await fulfillCallable(route, aiSpendStatus({ status: 'active', allowanceMicros: 40_000_000 }), 150);
    });
    await page.route('**/manualPauseAiSpend', async (route) => {
      await fulfillCallable(route, aiSpendStatus({ status: 'manually_paused' }));
    });

    await createBrowserUser(page, `qa-ai-safety-paused-${Date.now()}@example.com`);
    await openAiSafetySettings(page);

    const aiSafetyPanel = page.getByRole('region', { name: 'AI Spend Safety' });
    await expect(aiSafetyPanel.getByText('Paused automatically')).toBeVisible();
    await expect(aiSafetyPanel.getByText('AI calls are stopped. Non-AI VioMacro workflows remain available.')).toBeVisible();
    await expect(aiSafetyPanel.getByText('Usage reached allowance after reconciliation')).toBeVisible();
    await expect(aiSafetyPanel.getByText(/email|provider/i)).toHaveCount(0);
    await page.screenshot({ path: 'test-results/cmd-018-ai-safety-paused-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/cmd-018-ai-safety-paused-mobile.png', fullPage: true });
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: /^Manual pause$/ })).toBeDisabled();

    await page.getByRole('button', { name: /^Resume with another \$20\.00$/ }).click();
    await expect(page.getByRole('dialog', { name: 'Grant another allowance?' })).toBeVisible();
    await page.getByRole('button', { name: /^Resume with another \$20\.00$/ }).last().click();
    await expect(page.getByRole('button', { name: /^Resume with another \$20\.00$/ })).toBeDisabled();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('$40.00')).toBeVisible();
    await expect(page.getByText('Allowance refreshed.')).toBeVisible();

    expect(mutationPayloads).toHaveLength(1);
    expect(isValidAiRequestId((mutationPayloads[0] as { idempotencyKey?: unknown }).idempotencyKey)).toBe(true);
    expect(failures).toEqual([]);
  });

  test('AI Safety clears stale authority when mutation refetch fails', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    let refetchShouldFail = false;

    await page.route('**/getAiSpendStatus', async (route) => {
      if (refetchShouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { status: 'INTERNAL', message: 'Mock refetch failure' } }),
        });
        return;
      }
      await fulfillCallable(route, aiSpendStatus());
    });
    await page.route('**/manualPauseAiSpend', async (route) => {
      refetchShouldFail = true;
      await fulfillCallable(route, aiSpendStatus({ status: 'manually_paused' }), 150);
    });
    await page.route('**/resumeAiSpendAllowance', async (route) => {
      await fulfillCallable(route, aiSpendStatus({ status: 'active' }));
    });

    await createBrowserUser(page, `qa-ai-safety-refetch-fail-${Date.now()}@example.com`);
    await openAiSafetySettings(page);
    await expect(page.getByText('Active')).toBeVisible();

    await page.getByRole('button', { name: 'Manual pause' }).click();
    await page.getByRole('button', { name: 'Confirm manual pause' }).click();

    await expect(page.getByText('Spend status could not be verified')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Manual pause$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Resume with another \$20\.00$/ })).toHaveCount(0);
    await expect(page.getByText('Manual pause confirmed.')).toHaveCount(0);
    await expect(page.getByText('Allowance refreshed.')).toHaveCount(0);

    expect(failures).toEqual([]);
  });

  test('AI Safety handles disabled, owner-denied, and unavailable retry states without controls', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    let mode: 'disabled' | 'denied' | 'unavailable' | 'ready' = 'disabled';
    let unavailableFailuresRemaining = 0;

    await page.route('**/getAiSpendStatus', async (route) => {
      if (mode === 'denied') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: { status: 'PERMISSION_DENIED', message: 'Only owner' } }),
        });
        return;
      }
      if (mode === 'unavailable' && unavailableFailuresRemaining > 0) {
        unavailableFailuresRemaining -= 1;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { status: 'INTERNAL', message: 'Mock status failure' } }),
        });
        return;
      }
      await fulfillCallable(route, aiSpendStatus({
        enabled: mode !== 'disabled',
        status: mode === 'disabled' ? 'disabled' : 'active',
        spentMicros: 0,
        reservedMicros: 0,
        remainingMicros: 19_000_000,
      }));
    });
    await page.route('**/manualPauseAiSpend', async (route) => {
      throw new Error(`manual pause should not be called: ${route.request().url()}`);
    });
    await page.route('**/resumeAiSpendAllowance', async (route) => {
      throw new Error(`resume should not be called: ${route.request().url()}`);
    });

    await createBrowserUser(page, `qa-ai-safety-disabled-${Date.now()}@example.com`);
    await openAiSafetySettings(page);
    await expect(page.getByText('Disabled', { exact: true })).toBeVisible();
    await expect(page.getByText('AI spend controls are currently disabled.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Manual pause$/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^Resume with another \$20\.00$/ })).toBeDisabled();

    mode = 'denied';
    await page.reload();
    await page.getByRole('button', { name: 'AI Safety' }).click();
    await expect(page.getByText('Owner authorization is required')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Manual pause$/ })).toHaveCount(0);

    mode = 'unavailable';
    unavailableFailuresRemaining = 2;
    await page.reload();
    await page.getByRole('button', { name: 'AI Safety' }).click();
    await expect(page.getByText('Spend status could not be verified')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Manual pause$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Resume with another \$20\.00$/ })).toHaveCount(0);
    mode = 'ready';
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Active')).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('AI callable payloads include valid request IDs for meal plan, recipe import, and semantic search', async ({ page }) => {
    await enableMockAi(page);
    const failures = collectConsoleFailures(page);
    const email = `qa-ai-request-ids-${Date.now()}@example.com`;
    const filename = `qa-request-id-${Date.now()}.png`;
    const recipeTitle = `QA Request ID Recipe ${Date.now()}`;
    const client = createFirebaseClient('ai-request-ids');
    const seenRequestIds: string[] = [];

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await seedRecipe(client.db, credential.user.uid, recipeTitle);

    await page.route('**/generateMealPlan', async (route) => {
      const requestId = route.request().postDataJSON()?.data?.requestId;
      expect(isValidAiRequestId(requestId)).toBe(true);
      seenRequestIds.push(requestId);
      await fulfillCallable(route, {
        goal: 'Mock AI plan',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName) => ({
          dayName,
          meals: [
            { type: 'dinner', name: `${recipeTitle} Bowl`, recipeId: null, calories: 500, protein: 40, carbs: 45, fat: 15 },
          ],
        })),
      });
    });
    await page.route('**/parseRecipeFromImage', async (route) => {
      const requestId = route.request().postDataJSON()?.data?.requestId;
      expect(isValidAiRequestId(requestId)).toBe(true);
      seenRequestIds.push(requestId);
      await fulfillCallable(route, {
        title: `Parsed ${recipeTitle}`,
        description: 'Mock imported draft',
        mealType: 'dinner',
        tags: ['Imported'],
        calories: 430,
        protein: 35,
        carbs: 40,
        fat: 12,
        ingredients: [{ item: 'Chicken breast', qty: 6, unit: 'oz' }],
        instructions: ['Cook until done.'],
      });
    });
    await page.route('**/semanticSearchRecipes', async (route) => {
      const requestId = route.request().postDataJSON()?.data?.requestId;
      expect(isValidAiRequestId(requestId)).toBe(true);
      seenRequestIds.push(requestId);
      await fulfillCallable(route, { recipes: [] });
    });

    await page.goto('/plan');
    await settlePlanner(page);
    if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }
    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Auto-Generate Week' }).click();
    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();

    await page.goto('/recipes/import');
    await page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: 'image/png',
      buffer: Buffer.from('mock-png-bytes'),
    });
    await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeVisible();
    const discardRecipe = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await discardRecipe;

    await page.goto('/recipes');
    await page.getByRole('button', { name: /AI Search/ }).click();
    await page.getByPlaceholder(/Describe what you want/).fill('high protein dinner');
    await page.getByRole('button', { name: 'Run AI recipe search' }).click();
    await expect(page.getByText('No recipes found')).toBeVisible();

    expect(seenRequestIds).toHaveLength(3);
    expect(new Set(seenRequestIds).size).toBe(3);
    expect(failures).toEqual([]);
  });

  test('user can create, find, and delete a manual recipe', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const recipeName = `QA Chicken Bowl ${Date.now()}`;

    await signIn(page);
    await page.goto('/recipes');
    // AUD-127: wait for the library to finish loading before touching anything.
    // Acting during the load meant the grid -- and its "Add New Recipe" card --
    // sometimes existed and sometimes did not, which is what made the locator
    // below ambiguous on some runs and not others.
    await expect(page.getByRole('button', { name: 'New Recipe', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByPlaceholder('e.g., Mediterranean Chicken Bowl').fill(recipeName);
    await page.getByPlaceholder('450').fill('520');
    await page.getByPlaceholder('35').fill('42');
    await page.getByRole('button', { name: 'Create Recipe' }).click();

    await expect(page.getByText(recipeName)).toBeVisible();
    await page.getByPlaceholder(/Search recipes/).fill(recipeName);
    await expect(page.getByText(recipeName)).toBeVisible();

    const recipeCard = page.locator('div.group.flex.flex-col.rounded-xl', { has: page.getByText(recipeName) }).first();
    await recipeCard.getByRole('button', { name: `Delete recipe: ${recipeName}` }).click();
    await expect(page.getByRole('heading', { name: 'Delete Recipe?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
    await expect(page.getByRole('heading', { name: recipeName })).toHaveCount(0);

    expect(failures).toEqual([]);
  });

  // ------------------------------------------------------------ G-A (AUD-033)
  // A recipe delete used to remove the files first and the record second. When
  // the record delete never reached the server, the recipe survived a reload but
  // its PDF was gone, and no message showed. These use real emulator files: the
  // old photo branch only matched production links, so no test deleted a photo.
  const gaPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR4nGOoSNlCU8QwasGoBaMWjFowasGoBaMWjFowasGoBaMWDBULAFSLQFujbhvWAAAAAElFTkSuQmCC', 'base64');

  async function gaAccount(page: Page, label: string) {
    const email = `qa-ga-${label}-${Date.now()}@example.com`;
    const client = createFirebaseClient(`ga-${label}`);
    await createBrowserUser(page, email);
    const { user } = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const recipeExists = (id: string) => getDoc(doc(client.db, 'users', user.uid, 'recipes', id)).then(snapshot => snapshot.exists());
    const storedFiles = async () => (await listAll(ref(client.storage, `users/${user.uid}/recipes`))).items.map(item => item.name).sort();
    return { client, uid: user.uid, recipeExists, storedFiles };
  }

  async function gaSeedRecipeWithFiles({ client, uid }: Awaited<ReturnType<typeof gaAccount>>, title: string) {
    const photo = ref(client.storage, `users/${uid}/recipes/${Date.now()}_ga-photo.png`);
    const pdf = ref(client.storage, `users/${uid}/recipes/${Date.now()}_ga-source.pdf`);
    await uploadBytes(photo, gaPng, { contentType: 'image/png' });
    await uploadBytes(pdf, Buffer.from('%PDF-1.4\n%%EOF\n'), { contentType: 'application/pdf' });
    const photoUrl = await getDownloadURL(photo);
    expect(new URL(photoUrl).hostname).toBe(readEmulatorConfig().host); // an emulator link, not a production one
    const id = await seedRecipe(client.db, uid, title, {
      imageUrl: photoUrl,
      originalAssetUrl: await getDownloadURL(pdf),
      originalAssetPath: pdf.fullPath,
      originalAssetType: 'pdf',
      source: 'imported',
    });
    return { id, photoUrl, photo: photo.name, pdf: pdf.name };
  }

  async function gaDeleteThroughUi(page: Page, title: string) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    const card = page.locator('div.group.flex.flex-col.rounded-xl', { has: page.getByText(title, { exact: true }) }).first();
    await card.getByRole('button', { name: `Delete recipe: ${title}` }).click();
    await expect(page.getByRole('heading', { name: 'Delete Recipe?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  }

  test('G-A data-loss: a recipe delete the server never confirms keeps the recipe and its files and says so', async ({ page }) => {
    test.setTimeout(90_000);
    const failures = collectConsoleFailures(page, ['Failed to delete recipe']);
    const account = await gaAccount(page, 'blocked');
    const title = `QA G-A Blocked ${Date.now()}`;
    const seeded = await gaSeedRecipeWithFiles(account, title);
    await page.goto('/recipes');

    // Block only database writes. Reads (the Listen channel) and Storage still work.
    const writes = '**/google.firestore.v1.Firestore/Write/**';
    await page.route(writes, route => route.abort());
    const message = page.waitForEvent('dialog', { timeout: 30_000 }).then(
      async dialog => { const text = dialog.message(); await dialog.accept(); return text; },
      () => 'no message within 30 seconds',
    );
    await gaDeleteThroughUi(page, title);
    const shown = await message;

    // Reload with writes still blocked: the unconfirmed delete only existed in that tab.
    await page.reload();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await page.unroute(writes);

    expect({ shown, recordKept: await account.recipeExists(seeded.id), files: await account.storedFiles() }).toEqual({
      shown: `Could not confirm that "${title}" was deleted. Check your connection and try again.`,
      recordKept: true,
      files: [seeded.pdf, seeded.photo].sort(),
    });
    expect(failures).toEqual([]);
  });

  test('G-A deleting a recipe removes its photo and PDF but keeps a photo another recipe still uses', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const account = await gaAccount(page, 'files');
    const title = `QA G-A Owner ${Date.now()}`;
    const sharer = `QA G-A Sharer ${Date.now()}`;
    const seeded = await gaSeedRecipeWithFiles(account, title);
    const sharerId = await seedRecipe(account.client.db, account.uid, sharer, { imageUrl: seeded.photoUrl });
    await page.goto('/recipes');

    await gaDeleteThroughUi(page, title);
    await expect.poll(() => account.recipeExists(seeded.id)).toBe(false);
    await expect.poll(() => account.storedFiles()).toEqual([seeded.photo]);
    // Read again after a reload, so a wrong delete of the shared photo has had time to land.
    await page.reload();
    await expect(page.getByText(sharer, { exact: true })).toBeVisible();
    expect(await account.storedFiles()).toEqual([seeded.photo]);

    // The last recipe using the photo is gone, so the photo goes too.
    await gaDeleteThroughUi(page, sharer);
    await expect.poll(() => account.recipeExists(sharerId)).toBe(false);
    await expect.poll(() => account.storedFiles()).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('G-A data-loss: if the shared-file check fails, the recipe is deleted and its files are kept', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const account = await gaAccount(page, 'check');
    const title = `QA G-A Check ${Date.now()}`;
    const seeded = await gaSeedRecipeWithFiles(account, title);
    await page.goto('/recipes');
    await setDevFailure(page, 'recipeFileShareCheck', 'always');

    await gaDeleteThroughUi(page, title);
    await expect.poll(() => account.recipeExists(seeded.id)).toBe(false);
    await page.reload();
    await expect(page.getByRole('button', { name: 'New Recipe', exact: true })).toBeVisible();
    expect(await account.storedFiles()).toEqual([seeded.pdf, seeded.photo].sort());
    expect(failures).toEqual([]);
  });

  test('G-A data-loss: if the shared-file check is too slow, nothing is deleted and the user is told', async ({ page }) => {
    test.setTimeout(90_000);
    const failures = collectConsoleFailures(page, ['Failed to delete recipe']);
    const account = await gaAccount(page, 'slow');
    const title = `QA G-A Slow ${Date.now()}`;
    const seeded = await gaSeedRecipeWithFiles(account, title);
    await page.goto('/recipes');
    // The first shared-file check answers after 15 s, past the 10 s deadline.
    // Writes are NOT blocked: once the check returns, a delete would land at once.
    await setDevDelay(page, 'recipeFileShareCheck', 15_000);

    const message = page.waitForEvent('dialog', { timeout: 30_000 }).then(
      async dialog => { const text = dialog.message(); await dialog.accept(); return text; },
      () => 'no message within 30 seconds',
    );
    const clickedAt = Date.now();
    await gaDeleteThroughUi(page, title);
    const shown = await message;
    // Keep the tab open until the slow check has returned, so it gets the
    // chance to go on and delete; then reload and read everything back.
    await page.waitForTimeout(Math.max(0, clickedAt + 20_000 - Date.now()));
    await page.reload();
    await expect(page.getByRole('button', { name: 'New Recipe', exact: true })).toBeVisible();

    expect({ shown, recordKept: await account.recipeExists(seeded.id), files: await account.storedFiles() }).toEqual({
      shown: `Could not confirm that "${title}" was deleted. Check your connection and try again.`,
      recordKept: true,
      files: [seeded.pdf, seeded.photo].sort(),
    });
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('recipe detail opens guided cooking and returns to detail', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-recipe-guided-${Date.now()}@example.com`;
    const recipeName = `QA Guided Bowl ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('recipe-guided');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await seedRecipe(client.db, credential.user.uid, recipeName);

    await page.goto('/recipes');
    await expect(page.getByText(recipeName)).toBeVisible();

    await page.locator('div.group.flex.flex-col.rounded-xl', { has: page.getByText(recipeName) }).first().click();
    await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
    await page.getByRole('button', { name: /Start Guided Cooking/ }).click();

    await expect(page.getByText('Guided Mode')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Step 1' })).toBeVisible();
    await expect(page.getByText('Cook until done.')).toBeVisible();
    await page.getByRole('button', { name: /Exit/ }).click();

    await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('recipe library controls either work or show honest coming soon states', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-recipe-controls-${Date.now()}@example.com`;
    const recipeName = `QA Controls Bowl ${Date.now()}`;
    const editedName = `${recipeName} Edited`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('recipe-controls');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await seedRecipe(client.db, credential.user.uid, recipeName);

    await page.goto('/recipes');
    await expect(page.getByText(recipeName)).toBeVisible();

    await expect(page.getByRole('button', { name: 'Protein: 20g+' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Carbs: <50g' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Advanced filters coming soon' })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Open Magic Import recipe upload page' })).toBeVisible();

    const recipeCard = page.locator('div.group.flex.flex-col.rounded-xl', { has: page.getByText(recipeName) }).first();
    await recipeCard.getByRole('button', { name: `Add to favorites: ${recipeName}` }).click();
    await page.getByRole('button', { name: 'Favorites', exact: true }).click();
    await expect(page.getByText(recipeName)).toBeVisible();

    await page.getByRole('button', { name: 'All Recipes' }).click();
    const favoritedCard = page.locator('div.group.flex.flex-col.rounded-xl', { has: page.getByText(recipeName) }).first();
    await favoritedCard.getByRole('button', { name: `Edit recipe: ${recipeName}` }).click();
    await page.getByPlaceholder('e.g., Mediterranean Chicken Bowl').fill(editedName);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText(editedName)).toBeVisible();

    await page.getByRole('button', { name: 'Collections' }).click();
    await expect(page.getByRole('button', { name: /New Folder Coming Soon/ })).toBeDisabled();

    await page.getByRole('button', { name: 'All Recipes' }).click();
    await page.locator('div.group.flex.flex-col.rounded-xl', { has: page.getByText(editedName) }).first().click();
    await expect(page.getByRole('button', { name: 'Favorite from recipe detail coming soon' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Recipe sharing coming soon' })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Add to Meal Plan Coming Soon/ })).toBeDisabled();

    expect(failures).toEqual([]);
  });

  test('recipe filter chips narrow visible recipes', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-recipe-filters-${Date.now()}@example.com`;
    const highProteinRecipe = `QA Protein Bowl ${Date.now()}`;
    const lowCarbRecipe = `QA Low Carb Plate ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('recipe-filters');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await seedRecipe(client.db, credential.user.uid, highProteinRecipe, {
      tags: ['High Protein'],
      protein: 42,
      carbs: 55,
      cookTime: 45,
    });
    await seedRecipe(client.db, credential.user.uid, lowCarbRecipe, {
      tags: ['Low Carb'],
      protein: 12,
      carbs: 20,
      cookTime: 35,
    });

    await page.goto('/recipes');
    await expect(page.getByText(highProteinRecipe)).toBeVisible();
    await expect(page.getByText(lowCarbRecipe)).toBeVisible();

    const filterChip = (name: string) =>
      page.locator('button').filter({ has: page.getByText(name, { exact: true }) }).first();
    const highProteinChip = filterChip('High Protein');
    const lowCarbChip = filterChip('Low Carb');

    await highProteinChip.click();
    await expect(page.getByText(highProteinRecipe)).toBeVisible();
    await expect(page.getByText(lowCarbRecipe)).toBeHidden();

    await highProteinChip.click();
    await lowCarbChip.click();
    await expect(page.getByText(lowCarbRecipe)).toBeVisible();
    await expect(page.getByText(highProteinRecipe)).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('AI recipe search can reset back to the full library', async ({ page }) => {
    await enableMockAi(page);
    const failures = collectConsoleFailures(page);
    const email = `qa-recipe-ai-reset-${Date.now()}@example.com`;
    const aiRecipe = `QA AI Chicken ${Date.now()}`;
    const otherRecipe = `QA Regular Salmon ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('recipe-ai-reset');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const aiRecipeId = await seedRecipe(client.db, credential.user.uid, aiRecipe);
    await seedRecipe(client.db, credential.user.uid, otherRecipe, {
      tags: ['Balanced'],
      protein: 30,
      carbs: 35,
    });

    await page.route('**/semanticSearchRecipes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            recipes: [
              {
                id: aiRecipeId,
                title: aiRecipe,
                mealType: 'dinner',
                tags: ['High Protein'],
                folders: ['dinner'],
                ingredients: [],
                instructions: [],
                imageUrl: '',
                description: 'Mock AI result',
                cookTime: 30,
                servings: 4,
                calories: 520,
                protein: 42,
                carbs: 55,
                fat: 14,
                isFavorite: false,
                source: 'created',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/recipes');
    await expect(page.getByText(aiRecipe)).toBeVisible();
    await expect(page.getByText(otherRecipe)).toBeVisible();

    await page.getByRole('button', { name: /AI Search/ }).click();
    await page.getByPlaceholder(/Describe what you want/).fill('chicken');
    await page.getByRole('button', { name: 'Run AI recipe search' }).click();
    await expect(page.getByText(aiRecipe)).toBeVisible();
    await expect(page.getByText(otherRecipe)).toBeHidden();

    await page.getByRole('button', { name: 'All Recipes' }).click();
    await expect(page.getByPlaceholder(/Search recipes/)).toBeVisible();
    await expect(page.getByText(aiRecipe)).toBeVisible();
    await expect(page.getByText(otherRecipe)).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('recipe form save failures show visible recovery and keep the draft open', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to save recipe/i, /Injected addRecipe failure/i]);
    const recipeName = `QA Save Recovery ${Date.now()}`;

    await signIn(page);
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByPlaceholder('e.g., Mediterranean Chicken Bowl').fill(recipeName);

    await setDevFailure(page, 'addRecipe');
    const dialogMessagePromise = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Create Recipe' }).click();
    await expect(dialogMessagePromise).resolves.toContain('Failed to save recipe');

    await expect(page.getByRole('heading', { name: 'New Recipe', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('e.g., Mediterranean Chicken Bowl')).toHaveValue(recipeName);

    await page.getByRole('button', { name: 'Create Recipe' }).click();
    await expect(page.getByText(recipeName)).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('AI recipe search fails gracefully when the callable returns an error', async ({ page }) => {
    await enableMockAi(page);
    const failures = collectConsoleFailures(page, [/AI Search failed/i]);

    await page.route('**/semanticSearchRecipes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'mock semantic search failure' } }),
      });
    });

    await signIn(page);
    await page.goto('/recipes');

    await page.getByRole('button', { name: /AI Search/ }).click();
    await page.getByPlaceholder(/Describe what you want/).fill('high protein chicken bowl');

    const dialogMessagePromise = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Run AI recipe search' }).click();
    await expect(dialogMessagePromise).resolves.toContain('AI search failed');

    await expect(page.getByPlaceholder(/Search recipes/)).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('authenticated mobile shell opens menu and navigates key routes', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const chartWarnings = collectChartWarnings(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, false);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.getByRole('heading', { name: 'Weight History' })).toBeVisible();

    await page.locator('header button').first().click();
    await page.locator('aside').last().getByRole('link', { name: /Create Recipe/ }).click();
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByRole('heading', { name: 'My Kitchen' })).toBeVisible();

    await page.locator('header button').first().click();
    await page.locator('aside').last().locator('a[href="/grocery"]').click();
    await expect(page).toHaveURL(/\/grocery$/);
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();

    expect(failures).toEqual([]);
    expect(chartWarnings).toEqual([]);
  });

  test('user can quick-add and delete pantry items', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-pantry-a11y-${Date.now()}@example.com`;
    const itemName = `QA Oats ${Date.now()}`;

    await createBrowserUser(page, email);
    await page.goto('/pantry');
    await expect(page.getByText('Coming Soon').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Scan Coming Soon/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Full Pantry Coming Soon/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Shortcut Coming Soon/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous pantry page (coming soon)' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next pantry page (coming soon)' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Pantry AI suggestions coming soon' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Pantry-to-shopping-list suggestions coming soon' })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^Coming Soon$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'All Items' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Lemon Herb Chicken Bowl')).toBeHidden();
    await expect(page.getByText('24+')).toBeHidden();
    await expect(page.getByPlaceholder(/scan barcode/)).toHaveCount(0);

    await page.getByPlaceholder(/200g Greek Yogurt/).fill(`2 kg ${itemName}`);
    await page.getByRole('button', { name: 'Process Items' }).click();

    await expect(page.getByText(itemName)).toBeVisible();
    await expect(page.getByLabel('Total Items: 1')).toBeVisible();

    const row = page.locator('div.grid.grid-cols-12', { has: page.getByText(itemName) }).first();
    await expect(row.getByRole('button', { name: `Decrease quantity for ${itemName} (coming soon)` })).toBeDisabled();
    await expect(row.getByRole('button', { name: `Increase quantity for ${itemName} (coming soon)` })).toBeDisabled();
    await expect(row.getByRole('button', { name: `Edit pantry item: ${itemName} (coming soon)` })).toBeDisabled();
    await row.getByRole('button', { name: `Delete pantry item: ${itemName}` }).click();
    await expect(page.getByText(itemName)).toBeHidden();
    await expect(page.getByLabel('Total Items: 0')).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('user can quick-add, check off, and reload a grocery item', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const itemName = `QA Avocado ${Date.now()}`;

    await signIn(page);
    await page.goto('/grocery');
    await page.getByPlaceholder(/Quick add item/).fill(`2 ${itemName}`);
    await page.keyboard.press('Enter');

    await expect(page.getByText(itemName)).toBeVisible();

    const row = page.locator('div.flex.items-center.gap-4.p-4', { has: page.getByText(itemName) }).first();
    const checkButton = row.getByRole('button', { name: `Mark as purchased: ${itemName}` });
    await expect(checkButton).toHaveAttribute('aria-pressed', 'false');
    await checkButton.click();
    await expect(row.locator('h4')).toHaveClass(/line-through/);
    await expect(row.getByRole('button', { name: `Mark as not purchased: ${itemName}` })).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();
    const reloadedRow = page.locator('div.flex.items-center.gap-4.p-4', { has: page.getByText(itemName) }).first();
    await expect(reloadedRow.locator('h4')).toHaveClass(/line-through/);
    await expect(reloadedRow.getByRole('button', { name: `Mark as not purchased: ${itemName}` })).toHaveAttribute('aria-pressed', 'true');

    expect(failures).toEqual([]);
  });

  test('user can delete a grocery item and reload without it returning', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const itemName = `QA Delete Apples ${Date.now()}`;

    await signIn(page);
    await page.goto('/grocery');
    await page.getByPlaceholder(/Quick add item/).fill(`3 ${itemName}`);
    await page.keyboard.press('Enter');

    await expect(page.getByText(itemName)).toBeVisible();

    const row = page.locator('div.flex.items-center.gap-4.p-4', { has: page.getByText(itemName) }).first();
    await row.hover();
    await row.getByRole('button', { name: `Delete grocery item: ${itemName}` }).click();
    await expect(page.getByText(itemName)).toBeHidden();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();
    await expect(page.getByText(itemName)).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('grocery page uses honest manual and coming soon states', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await signIn(page);
    await page.goto('/grocery');

    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share Coming Soon' })).toBeDisabled();
    await expect(page.getByText('Checkout Coming Soon')).toBeVisible();
    await expect(page.getByText('Store pricing and checkout integrations are coming soon')).toBeVisible();
    await expect(page.getByText('Store matching and delivery availability are coming soon.')).toBeVisible();
    await expect(page.getByText('Week of Oct 24')).toBeHidden();
    await expect(page.getByText('High-Performance Macro Cycle')).toBeHidden();
    await expect(page.getByText('$Total')).toBeHidden();
    await expect(page.getByText('Checkout with Instacart')).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('grocery view full meal plan link routes to planner', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await signIn(page);
    await page.goto('/grocery');
    await page.getByRole('link', { name: 'View Full Meal Plan' }).click();

    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByRole('heading', { name: /Plan/ }).first()).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('grocery write failures show visible recovery', async ({ page }) => {
    const failures = collectConsoleFailures(page, [
      /Injected addGroceryItem failure/i,
      /Injected toggleGroceryItem failure/i,
      /Injected deleteGroceryItem failure/i,
    ]);
    const itemName = `QA Recovery Pears ${Date.now()}`;

    await signIn(page);
    await page.goto('/grocery');

    await setDevFailure(page, 'addGroceryItem');
    await page.getByPlaceholder(/Quick add item/).fill(`4 ${itemName}`);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toContainText('Could not add that grocery item');
    await expect(page.getByText(itemName)).toBeHidden();

    await page.keyboard.press('Enter');
    await expect(page.getByText(itemName)).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();

    const row = page.locator('div.flex.items-center.gap-4.p-4', { has: page.getByText(itemName) }).first();
    await setDevFailure(page, 'toggleGroceryItem');
    await row.getByRole('button', { name: `Mark as purchased: ${itemName}` }).click();
    await expect(page.getByRole('alert')).toContainText('Could not update that grocery item');
    await expect(row.locator('h4')).not.toHaveClass(/line-through/);

    await setDevFailure(page, 'deleteGroceryItem');
    await row.hover();
    await row.getByRole('button', { name: `Delete grocery item: ${itemName}` }).click();
    await expect(page.getByRole('alert')).toContainText('Could not delete that grocery item');
    await expect(page.getByText(itemName)).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('dashboard check-in and sleep actions open their modals', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await createBrowserUser(page, `qa-dashboard-modals-${Date.now()}@example.test`);
    await page.getByRole('button', { name: 'Start Check-In' }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Check-In', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'How did you feel?' })).toBeVisible();
    await expect(page.getByLabel('Energy level')).toHaveValue('3');
    await page.getByLabel('Energy level').press('ArrowRight');
    await expect(page.getByLabel('Energy level')).toHaveValue('4');
    await expect(page.locator('#weekly-checkin-energy-value')).toHaveText('4/5');
    await expect(page.getByLabel('Hunger level')).toHaveValue('3');
    await page.getByLabel('Hunger level').press('ArrowRight');
    await expect(page.getByLabel('Hunger level')).toHaveValue('4');
    await expect(page.locator('#weekly-checkin-hunger-value')).toHaveText('4/5');
    await page.getByRole('button', { name: 'Close check-in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Check-In', exact: true })).toBeHidden();

    await page.getByRole('button', { name: /Log Sleep|Log Previous Night/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Log Sleep' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Set sleep quality to 5 out of 5' })).toBeVisible();
    await page.getByRole('button', { name: 'Set sleep quality to 5 out of 5' }).click();
    await expect(page.getByRole('button', { name: 'Set sleep quality to 5 out of 5' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Log Sleep' })).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('dashboard weekly check-in saves weight and persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const chartWarnings = collectChartWarnings(page);
    const weight = (180 + (Date.now() % 70) + 0.7).toFixed(1);

    // A previous run's weigh-in hides this week's prompt. Use a fresh metric
    // account so the test does not depend on shared history or execution order.
    await createBrowserUser(page, `qa-weekly-checkin-${Date.now()}@example.test`);
    await page.getByRole('button', { name: 'Start Check-In' }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Check-In', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'How did you feel?' })).toBeVisible();

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Weigh-In' })).toBeVisible();

    await page.getByRole('spinbutton').fill(weight);
    await page.getByRole('button', { name: 'Complete Check-In' }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Check-In', exact: true })).toBeHidden();

    await expect(page.getByText(`${weight} kg`).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(`${weight} kg`).first()).toBeVisible();

    expect(chartWarnings).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('dashboard sleep log saves and persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const chartWarnings = collectChartWarnings(page);
    const note = `QA sleep note ${Date.now()}`;

    await signIn(page);
    await page.getByRole('button', { name: /Log Sleep|Log Previous Night/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Log Sleep' })).toBeVisible();

    await page.getByPlaceholder('How did you sleep?').fill(note);
    await page.getByRole('button', { name: 'Save Log' }).click();
    await expect(page.getByRole('heading', { name: 'Log Sleep' })).toBeHidden();

    const sleepCard = page.getByRole('heading', { name: 'Sleep' }).locator('xpath=ancestor::div[contains(@class,"group")][1]');
    await expect(sleepCard.getByText(note)).toBeVisible();
    await expect(sleepCard.getByText(/^8$/)).toBeVisible();
    await expect(sleepCard.getByText('hours')).toBeVisible();
    await expect(sleepCard.getByText('4/5')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(sleepCard.getByText(note)).toBeVisible();
    await expect(sleepCard.getByText(/^8$/)).toBeVisible();
    await expect(sleepCard.getByText('hours')).toBeVisible();
    await expect(sleepCard.getByText('4/5')).toBeVisible();

    expect(chartWarnings).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('dashboard hydration quick-add saves and persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const chartWarnings = collectChartWarnings(page);
    const hydrationCard = () => page.getByRole('heading', { name: 'Hydration' }).locator('xpath=ancestor::div[contains(@class,"group")][1]');
    const visibleWaterMl = async () => {
      const text = await hydrationCard().textContent();
      const match = text?.match(/(\d+)\s*ml\s*Goal/);
      return Number(match?.[1] ?? Number.NaN);
    };
    const email = `qa-hydration-${Date.now()}@example.com`;

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip Setup' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    const initialWater = await visibleWaterMl();
    expect(Number.isFinite(initialWater)).toBe(true);
    expect(initialWater).toBe(0);

    await hydrationCard().getByRole('button', { name: '+250ml' }).click();
    await expect.poll(visibleWaterMl).toBe(250);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect.poll(visibleWaterMl).toBe(250);

    await hydrationCard().getByRole('button', { name: 'Correct Entry' }).click();
    await hydrationCard().getByLabel('Correct water intake (ml)').fill('125');
    await hydrationCard().getByRole('button', { name: 'Save' }).click();
    await expect.poll(visibleWaterMl).toBe(125);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect.poll(visibleWaterMl).toBe(125);

    expect(chartWarnings).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('dashboard quick weight log saves and persists after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const chartWarnings = collectChartWarnings(page);
    const weightCard = () => page.getByRole('heading', { name: 'Weight History' }).locator('xpath=ancestor::div[contains(@class,"bg-surface-dark")][1]');
    const email = `qa-weight-${Date.now()}@example.com`;
    const weight = (170 + (Date.now() % 60) + 0.4).toFixed(1);

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip Setup' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    await weightCard().getByTitle('Log Weight').click();
    await expect(page.getByRole('heading', { name: 'Log Weight' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weigh-In' })).toBeVisible();

    await page.getByRole('spinbutton').fill(weight);
    await page.getByRole('button', { name: 'Complete Check-In' }).click();
    await expect(page.getByRole('heading', { name: 'Log Weight' })).toBeHidden();

    await expect(weightCard().getByText(`${weight} kg`)).toBeVisible();
    const activityCard = page.getByRole('heading', { name: 'Activity' }).locator('xpath=ancestor::div[contains(@class,"max-w-sm")][1]');
    const todayDay = new Date().getDate().toString();
    const todayActivityCell = activityCard.locator(`xpath=.//div[contains(@class,"group/tooltip")][.//div[normalize-space()="${todayDay}"]]`).first();
    await todayActivityCell.hover();
    await expect(activityCard.getByText(`${weight} kg`)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(weightCard().getByText(`${weight} kg`)).toBeVisible();
    await todayActivityCell.hover();
    await expect(activityCard.getByText(`${weight} kg`)).toBeVisible();

    expect(chartWarnings).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('dashboard weight history load failure shows retry recovery', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to load dashboard history/i]);
    const email = `qa-dashboard-load-fail-${Date.now()}@example.com`;

    // AUD-050: 'always', not the default 'once'.
    //
    // React StrictMode mounts effects twice in development: mount, clean up,
    // mount again. Now that the Dashboard effect HAS a cleanup, the first run is
    // cancelled and its error is correctly suppressed -- React discarded that
    // render, so reporting its failure would be wrong. A one-shot failure is
    // therefore eaten by the run nobody sees, and the surviving run succeeds.
    //
    // This spec previously passed only because the effect had no cleanup and the
    // discarded run's error leaked through. Failing every attempt tests what the
    // spec actually means: when loading history fails, the user is told.
    await setDevFailureBeforeNavigation(page, 'getWeightHistory', 'always');
    await createBrowserUser(page, email);

    await expect(page.getByRole('alert')).toContainText("We couldn't load your latest dashboard history");

    // Let the retry succeed, so the recovery half of the spec is real.
    await clearDevFailure(page, 'getWeightHistory');
    await page.getByRole('button', { name: 'Retry Dashboard Data' }).click();
    await expect(page.getByRole('alert')).toBeHidden();

    expect(failures).toEqual([]);
  });

  test('dashboard hydration save failure alerts the user', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to log water/i]);
    const hydrationCard = () => page.getByRole('heading', { name: 'Hydration' }).locator('xpath=ancestor::div[contains(@class,"group")][1]');
    const visibleWaterMl = async () => {
      const text = await hydrationCard().textContent();
      const match = text?.match(/(\d+)\s*ml\s*Goal/);
      return Number(match?.[1] ?? Number.NaN);
    };
    const email = `qa-dashboard-water-fail-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await expect.poll(visibleWaterMl).toBe(0);
    await setDevFailure(page, 'logDailyMetric:water');

    const dialogMessagePromise = acceptNextDialog(page);
    await hydrationCard().getByRole('button', { name: '+250ml' }).click();
    await expect(dialogMessagePromise).resolves.toContain('Failed to log water');

    await expect.poll(visibleWaterMl).toBe(0);
    expect(failures).toEqual([]);
  });

  test('dashboard sleep save failure alerts and keeps the modal open', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to save sleep/i]);
    const email = `qa-dashboard-sleep-fail-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await page.getByRole('button', { name: /Log Sleep|Log Previous Night/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Log Sleep' })).toBeVisible();
    await setDevFailure(page, 'logDailyMetric:sleep');

    const dialogMessagePromise = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Save Log' }).click();
    await expect(dialogMessagePromise).resolves.toContain('Failed to save sleep log');

    await expect(page.getByRole('heading', { name: 'Log Sleep' })).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('dashboard check-in save failure explains the error and keeps the draft open', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Failed to save check-in/i, /Failed to update settings/i]);
    const weightCard = () => page.getByRole('heading', { name: 'Weight History' }).locator('xpath=ancestor::div[contains(@class,"bg-surface-dark")][1]');
    const email = `qa-dashboard-checkin-fail-${Date.now()}@example.com`;

    await createBrowserUser(page, email);
    await weightCard().getByTitle('Log Weight').click();
    await expect(page.getByRole('heading', { name: 'Log Weight' })).toBeVisible();
    await page.getByRole('spinbutton').fill('188.4');
    await setDevFailure(page, 'updateUserSettings');

    await page.getByRole('button', { name: 'Complete Check-In' }).click();
    await expect(page.getByRole('alert')).toContainText('could not save your check-in');

    await expect(page.getByRole('heading', { name: 'Log Weight' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weigh-In' })).toBeVisible();
    await expect(page.getByRole('spinbutton')).toHaveValue('188.4');
    expect(failures).toEqual([]);
  });

  test('saved weekly plan is recognized by dashboard and grocery after reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-plan-${Date.now()}@example.com`;

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Create Account$/ }).last().click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip Setup' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to VioMacro' })).toBeHidden();

    await page.getByRole('link', { name: /Create New Plan/ }).click();
    await expect(page).toHaveURL(/\/plan$/);
    await settlePlanner(page);
    await page.getByRole('button', { name: 'Create New Plan' }).click();
    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();

    await expect(page.getByRole('button', { name: 'Confirm Plan' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm Plan' }).click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Ready to plan your week?')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Weekly Planner' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Ready to plan your week?')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Weekly Planner' })).toBeVisible();

    await page.goto('/grocery');
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();
    await expect(page.getByText('Manual List Mode')).toBeHidden();
    await expect(page.getByText('Meal Plan Connected')).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('AUD-036/082/092: what is written matches what the types promise', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-schema-${Date.now()}@example.com`;
    const recipeName = `QA Schema Recipe ${Date.now()}`;
    const manualItem = `QA Schema Manual ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('schema-truth');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    // --- AUD-092: a hand-added grocery item must record that it is manual.
    await page.goto('/grocery');
    await page.getByPlaceholder(/Quick add item/).fill(manualItem);
    await page.getByRole('button', { name: 'Add grocery item' }).click();
    await expect(page.getByText(manualItem)).toBeVisible();

    const grocery = await getDocs(collection(client.db, 'users', uid, 'groceryItems'));
    const manualDoc = grocery.docs.map((d) => d.data()).find((d) => d.name === manualItem);
    expect(manualDoc, 'the manual item should exist').toBeTruthy();
    expect(manualDoc?.source).toBe('manual');

    // --- AUD-036: a saved recipe must not carry an `id` FIELD. The rules use
    // hasOnly() and do not list `id`, so a write carrying one is rejected --
    // and the user sees a generic permission error for a valid save.
    await seedRecipe(client.db, uid, recipeName);
    const recipes = await getDocs(collection(client.db, 'users', uid, 'recipes'));
    for (const doc of recipes.docs) {
      expect(Object.keys(doc.data()), 'no recipe document should store an id field').not.toContain('id');
    }

    // --- AUD-082: isAiGenerated must survive the save.
    await page.goto('/plan');
    await settlePlanner(page);
    if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Create New Plan' }).click();
    }
    await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
    await page.getByRole('button', { name: 'Start from Scratch (Empty Grid)' }).click();
    await page.getByRole('button', { name: 'Confirm Plan' }).click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    const plans = await getDocs(collection(client.db, 'users', uid, 'mealPlans'));
    expect(plans.size, 'exactly one plan for the week').toBe(1);
    expect(
      Object.keys(plans.docs[0].data()),
      'isAiGenerated is declared on MealPlan and permitted by the rules, so it must be stored',
    ).toContain('isAiGenerated');
    expect(plans.docs[0].data().isAiGenerated).toBe(false);

    expect(failures).toEqual([]);
  });

  test('AUD-080: generated grocery items appear on the grocery page without a reload', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-grocery-handoff-${Date.now()}@example.com`;
    const recipeName = `QA Handoff Recipe ${Date.now()}`;

    await createBrowserUser(page, email);

    const client = createFirebaseClient('grocery-handoff');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const recipeId = await seedRecipe(client.db, credential.user.uid, recipeName, {
      ingredients: [
        { item: 'Handoff Lentils', quantity: '200', unit: 'g' },
      ],
    });
    await seedCurrentMealPlan(client.db, credential.user.uid, recipeId, recipeName);

    // Generate the list from the planner.
    await page.goto('/plan');
    await settlePlanner(page);
    // No dialog to accept: the alert() was replaced with an inline notice.
    await page.getByRole('button', { name: /Add to List/ }).first().click();
    await expect(page.getByRole('alert')).toContainText(/Added .* to your shopping list/);

    // Navigate WITHOUT reloading. This is the whole point: generateGroceryList
    // writes straight through the service layer, and ShoppingList reads from the
    // store, which nothing told to refresh. A page.reload() here would remount
    // AppProvider and mask the bug entirely -- which is why every existing test
    // that touches this path reloads first and none of them caught it.
    await page.getByRole('link', { name: 'Grocery List' }).click();
    await expect(page).toHaveURL(/\/grocery$/);

    await expect(page.getByText('Handoff Lentils')).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('data-loss: generated grocery refresh preserves manual items and replaces generated items', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-grocery-refresh-${Date.now()}@example.com`;
    const recipeName = `QA Grocery Recipe ${Date.now()}`;
    const manualItem = `QA Manual Apples ${Date.now()}`;
    const staleGeneratedItem = `QA Old Generated ${Date.now()}`;
    const client = createFirebaseClient('grocery-refresh');

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    const recipeId = await seedRecipe(client.db, uid, recipeName);
    await seedCurrentMealPlan(client.db, uid, recipeId, recipeName);
    await seedGroceryItem(client.db, uid, { name: manualItem, source: 'manual' });
    await seedGroceryItem(client.db, uid, { name: staleGeneratedItem, source: 'generated' });

    await page.goto('/plan');
    await settlePlanner(page);
    await expect(page.getByText(recipeName)).toBeVisible();

    // PR-5 replaced the blocking alert() with an inline notice (AUD-079), so
    // there is no dialog to wait for. The assertion is the same in substance:
    // the user is told, in a way they can see, that items were added.
    await page.getByRole('button', { name: /Add to List/ }).click();
    await expect(page.getByRole('alert')).toContainText('Added');

    await page.goto('/grocery');
    await expect(page.getByRole('heading', { name: 'Smart Grocery List' })).toBeVisible();
    await expect(page.getByText(manualItem)).toBeVisible();
    await expect(page.getByText(staleGeneratedItem)).toBeHidden();
    await expect(page.getByText('Chicken breast')).toBeVisible();

    const snapshot = await getDocs(collection(client.db, 'users', uid, 'groceryItems'));
    const groceryNames = snapshot.docs.map((doc) => doc.data().name);
    expect(groceryNames).toContain(manualItem);
    expect(groceryNames).toContain('Chicken breast');
    expect(groceryNames).not.toContain(staleGeneratedItem);

    expect(failures).toEqual([]);
  });

  test('VM-028 ingredient validation preserves saved groceries and reports skipped quantities', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-grocery-validation-${Date.now()}@example.com`;
    const client = createFirebaseClient('grocery-validation');
    await createBrowserUser(page, email);
    const { user } = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const recipeName = `QA Quantity Validation ${Date.now()}`;
    const recipeId = await seedRecipe(client.db, user.uid, recipeName);
    const planId = await seedCurrentMealPlan(client.db, user.uid, recipeId, recipeName);
    await setDoc(doc(client.db, 'users', user.uid, 'groceryItems', 'validation-checked'), {
      name: 'Validation Rice', quantity: 2, unit: 'cups', aisle: 'Pantry', isChecked: true, source: 'generated', mealPlanId: planId, createdAt: Timestamp.now(),
    });
    await seedGroceryItem(client.db, user.uid, { name: 'Validation manual control', source: 'manual' });
    const readSaved = async () => (await getDocs(collection(client.db, 'users', user.uid, 'groceryItems'))).docs
      .map(value => ({ id: value.id, ...value.data() })).sort((a, b) => a.id.localeCompare(b.id));
    const before = await readSaved();

    for (const quantity of ['not-a-number', '0']) {
      await setDoc(doc(client.db, 'users', user.uid, 'recipes', recipeId), {
        ingredients: [{ item: 'Invalid Rice', quantity, unit: 'cups' }],
      }, { merge: true });
      await page.goto('/plan');
      await settlePlanner(page);
      await page.getByRole('button', { name: /Add to List/ }).click();
      await expect(page.getByRole('alert')).toContainText('No addable ingredients found');
      expect(await readSaved()).toEqual(before);
    }

    await setDoc(doc(client.db, 'users', user.uid, 'recipes', recipeId), {
      ingredients: [
        { item: 'Validation Rice', quantity: '3', unit: 'cups' },
        { item: 'Invalid Rice', quantity: 'not-a-number', unit: 'cups' },
        { item: 'Zero Rice', quantity: '0', unit: 'cups' },
      ],
    }, { merge: true });
    await page.getByRole('button', { name: /Add to List/ }).click();
    await expect(page.getByRole('alert')).toContainText('Added 1 item to your shopping list. Skipped 2 ingredients with invalid or zero quantities.');
    const saved = await readSaved();
    expect(saved).toHaveLength(2);
    expect(saved).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Validation Rice', quantity: 0.75, isChecked: true })]));

    await setDoc(doc(client.db, 'users', user.uid, 'recipes', recipeId), {
      ingredients: [
        { item: 'Validation Rice', quantity: '3', unit: 'cups' },
        { item: 'Validation Lemon', amount: '2, juice and zest' },
        { item: 'Validation Tomatoes', amount: '2 (14 oz) cans' },
      ],
    }, { merge: true });
    await page.getByRole('button', { name: /Add to List/ }).click();
    await expect(page.getByRole('alert')).toHaveText(/Added 3 items to your shopping list\./);
    const legacySaved = await readSaved();
    expect(legacySaved).toHaveLength(4);
    expect(legacySaved).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Validation Lemon', quantity: 1, unit: ', juice and zest' }),
      expect.objectContaining({ name: 'Validation Tomatoes', quantity: 1, unit: '(14 oz) cans' }),
    ]));
    await page.goto('/grocery');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Mark as not purchased: Validation Rice', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Validation manual control', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Validation Lemon', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Validation Tomatoes', exact: true })).toBeVisible();
    expect(failures).toEqual([]);
  });

  for (const width of [1440, 390]) {
    test(`G1 shared ingredient amounts survive detail, cooking and grocery reload at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const email = `qa-g1-${width}-${Date.now()}@example.com`;
      const client = createFirebaseClient('g1-ingredients');
      await createBrowserUser(page, email);
      await page.setViewportSize({ width, height: 1000 });
      const { user } = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
      const recipeName = `G1 Ingredients ${width}`;
      const recipeId = await seedRecipe(client.db, user.uid, recipeName, {
        ingredients: [
          { item: 'Chicken', quantity: '24', unit: 'oz' }, { item: 'Rice', quantity: '2', unit: 'cups' },
          { item: 'Blueberries', amount: '1 cup' }, { item: 'Garlic', amount: '2 to 3 cloves' },
          { item: 'Carry Flour', quantity: '1.31', unit: 'cups' }, { item: 'Oil', amount: '½ cup' },
          { item: 'Eggplant', quantity: '1', unit: 'pcs' }, { item: 'Black pepper', amount: '1/2 tsp' },
          { item: 'Onion', quantity: '3', unit: 'Unit' },
          { item: 'Tomatoes', amount: '1 (14 oz) can' },
        ],
        instructions: [{ step: 'Mix Chicken, Blueberries and Carry Flour.', timer: 0 }],
      });
      const planId = await seedCurrentMealPlan(client.db, user.uid, recipeId, recipeName);
      const planRef = doc(client.db, 'users', user.uid, 'mealPlans', planId);
      const seeded = (await getDoc(planRef)).data()!;
      await setDoc(planRef, { days: Array.from({ length: 5 }, (_, i) => ({ ...seeded.days[0], date: toDateKey(new Date(getMondayWeekStart().getTime() + i * 86400000)), meals: [{ ...seeded.days[0].meals[0], id: `g1-${i}` }] })) }, { merge: true });
      await setDoc(doc(client.db, 'users', user.uid, 'groceryItems', 'g1-checked'), {
        name: 'Rice', quantity: 9, unit: 'cup', aisle: 'Pantry', isChecked: true, source: 'generated', mealPlanId: planId, createdAt: Timestamp.now(),
      });
      await setDoc(doc(client.db, 'users', user.uid, 'groceryItems', 'g1-package-checked'), {
        name: 'Tomatoes', quantity: 9, unit: '(14 oz) CANS', aisle: 'Produce', isChecked: true, source: 'generated', mealPlanId: planId, createdAt: Timestamp.now(),
      });
      await seedGroceryItem(client.db, user.uid, { name: 'G1 manual control', source: 'manual' });

      await page.goto('/recipes');
      await page.getByRole('heading', { name: recipeName, exact: true }).click();
      await expect(page.getByRole('checkbox', { name: '1 cup Blueberries', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '2 to 3 cloves Garlic', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '3 Unit Onion', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 (14 oz) can Tomatoes', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
      await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
      await expect(page.getByRole('checkbox', { name: '1.97 cups Carry Flour', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '3 to 4 1/2 cloves Garlic', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 1/2 (14 oz) can Tomatoes', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.getByRole('list')).toContainText('36 oz');
      await expect(page.getByRole('list')).toContainText('1 1/2 cup');
      await expect(page.getByRole('list')).toContainText('1 1/2 (14 oz) can');
      await page.getByRole('button', { name: 'close Exit', exact: true }).click();
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.goto('/plan');
      await settlePlanner(page);
      await page.getByRole('heading', { name: recipeName, exact: true }).first().click();
      await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
      await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
      await expect(page.getByRole('checkbox', { name: '36 oz Chicken', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.getByRole('list')).toContainText('36 oz');
      await expect(page.getByRole('list')).toContainText('1 1/2 cup');
      await expect(page.getByRole('list')).toContainText('1.97 cups');
      await expect(page.getByRole('list')).toContainText('1 1/2 (14 oz) can');
      await page.getByRole('button', { name: 'close Exit', exact: true }).click();
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.getByRole('button', { name: 'Add to List', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Added 10 items');
      const saved = (await getDocs(collection(client.db, 'users', user.uid, 'groceryItems'))).docs.map(d => d.data());
      expect(saved).toHaveLength(11);
      expect(saved).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Chicken', quantity: 30, unit: 'oz' }),
        expect.objectContaining({ name: 'Rice', quantity: 2.5, unit: 'cups', isChecked: true }),
        expect.objectContaining({ name: 'Garlic', quantity: 4, unit: 'cloves' }),
        expect.objectContaining({ name: 'Oil', quantity: 0.625, unit: 'cups' }),
        expect.objectContaining({ name: 'Eggplant', quantity: 2, aisle: 'Produce' }),
        expect.objectContaining({ name: 'Black pepper', quantity: 0.625, aisle: 'Pantry' }),
        expect.objectContaining({ name: 'Onion', quantity: 4, unit: 'pcs' }),
        expect.objectContaining({ name: 'Tomatoes', quantity: 2, unit: '(14 oz) cans', isChecked: true }),
      ]));
      await page.goto('/grocery');
      await page.reload();
      await expect(page.getByRole('button', { name: 'Mark as not purchased: Rice', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: 'Mark as not purchased: Tomatoes', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('heading', { name: 'G1 manual control', exact: true })).toBeVisible();
      await page.getByPlaceholder('Quick add item (e.g. 2 avocados)...').fill('1 1/2 cups milk');
      await page.getByRole('button', { name: 'Add grocery item', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'milk', exact: true })).toBeVisible();
      const manual = (await getDocs(collection(client.db, 'users', user.uid, 'groceryItems'))).docs.find(d => d.data().name === 'milk')!.data();
      expect(manual).toEqual(expect.objectContaining({ quantity: 1.5, unit: 'cups', aisle: 'Dairy', source: 'manual' }));
      expect(failures).toEqual([]);
    });
  }

  test('data-loss: failed recipe image import cleans up the uploaded asset', async ({ page }) => {
    const failures = collectConsoleFailures(page, [/Vision Import Failed/i]);
    const email = `qa-import-cleanup-${Date.now()}@example.com`;
    const filename = `qa-import-fail-${Date.now()}.png`;
    const client = createFirebaseClient('import-cleanup');

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    await page.route('**/parseRecipeFromImage', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'mock parse failure' } }),
      });
    });

    await page.goto('/recipes/import');
    await expect(page.getByRole('heading', { name: 'Start with Magic Import' })).toBeVisible();

    const dialogMessagePromise = acceptNextDialog(page);
    await page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: 'image/png',
      buffer: Buffer.from('not-a-real-png-but-valid-upload-bytes'),
    });
    await expect(dialogMessagePromise).resolves.toContain('Failed to parse recipe');

    const folderRef = ref(client.storage, `users/${uid}/recipes`);
    await expect
      .poll(async () => {
        const listing = await listAll(folderRef);
        return listing.items.some((item) => item.name.includes(filename));
      })
      .toBe(false);

    expect(failures).toEqual([]);
  });

  test('recipe import rejects unsupported file types before upload', async ({ page }) => {
    await enableMockAi(page);
    const failures = collectConsoleFailures(page);
    const email = `qa-import-unsupported-${Date.now()}@example.com`;
    const filename = `qa-import-unsupported-${Date.now()}.txt`;
    const client = createFirebaseClient('import-unsupported');

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    await page.goto('/recipes/import');
    await expect(page.getByRole('heading', { name: 'Start with Magic Import' })).toBeVisible();

    const dialogPromise = page.waitForEvent('dialog');
    const dropPromise = page.getByTestId('recipe-library-page').evaluate(
      (element, droppedFilename) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File(['not a supported recipe import'], droppedFilename, { type: 'text/plain' }));
        element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
      },
      filename
    );
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Unsupported file type');
    await dialog.accept();
    await dropPromise;

    const folderRef = ref(client.storage, `users/${uid}/recipes`);
    await expect
      .poll(async () => {
        const listing = await listAll(folderRef);
        return listing.items.some((item) => item.name.includes(filename));
      })
      .toBe(false);

    expect(failures).toEqual([]);
  });

  test('data-loss: canceling a parsed recipe import cleans up the uploaded asset', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-import-cancel-${Date.now()}@example.com`;
    const filename = `qa-import-cancel-${Date.now()}.png`;
    const recipeTitle = `QA Imported Cancel ${Date.now()}`;
    const client = createFirebaseClient('import-cancel');

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    await page.route('**/parseRecipeFromImage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            title: recipeTitle,
            description: 'Mock imported draft',
            mealType: 'dinner',
            tags: ['Imported'],
            calories: 430,
            protein: 35,
            carbs: 40,
            fat: 12,
            ingredients: [{ item: 'Chicken breast', qty: 6, unit: 'oz' }],
            instructions: ['Cook until done.'],
          },
        }),
      });
    });

    await page.goto('/recipes/import');
    await page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: 'image/png',
      buffer: Buffer.from('mock-png-bytes'),
    });

    await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g., Mediterranean Chicken Bowl')).toHaveValue(recipeTitle);

    const discardRecipe = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await discardRecipe;
    await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeHidden();

    const folderRef = ref(client.storage, `users/${uid}/recipes`);
    await expect
      .poll(async () => {
        const listing = await listAll(folderRef);
        return listing.items.some((item) => item.name.includes(filename));
      })
      .toBe(false);

    expect(failures).toEqual([]);
  });

  test('recipe import saves a parsed draft as an imported recipe', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-import-save-${Date.now()}@example.com`;
    const filename = `qa-import-save-${Date.now()}.png`;
    const recipeTitle = `QA Imported Save ${Date.now()}`;
    const client = createFirebaseClient('import-save');

    await createBrowserUser(page, email);
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    await page.route('**/parseRecipeFromImage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            title: recipeTitle,
            description: 'Mock imported saved recipe',
            mealType: 'dinner',
            tags: ['Imported', 'Meal Prep'],
            calories: 510,
            protein: 45,
            carbs: 50,
            fat: 14,
            ingredients: [{ item: 'Rice', qty: 1, unit: 'cup' }],
            instructions: ['Combine ingredients and cook.'],
          },
        }),
      });
    });

    await page.goto('/recipes/import');
    await page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: 'image/png',
      buffer: Buffer.from('mock-png-bytes'),
    });

    await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g., Mediterranean Chicken Bowl')).toHaveValue(recipeTitle);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeHidden();
    await page.getByPlaceholder(/Search recipes/).fill(recipeTitle);
    await expect(page.getByText(recipeTitle)).toBeVisible();

    const snapshot = await getDocs(collection(client.db, 'users', uid, 'recipes'));
    const importedRecipe = snapshot.docs.map((doc) => doc.data()).find((recipe) => recipe.title === recipeTitle);
    expect(importedRecipe?.source).toBe('imported');
    expect(importedRecipe?.originalAssetPath).toContain(filename);

    expect(failures).toEqual([]);
  });

  // -------------------------------------------------------------- AUD-022

  test('AUD-022: a plan saved in the old shape keeps its ticks, and unticking one sticks', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-status-legacy-${Date.now()}@example.com`;
    const eatenName = `QA Already Eaten ${Date.now()}`;
    const untouchedName = `QA Not Eaten ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('meal-status-legacy');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: 'legacy-meal-eaten', name: eatenName, type: 'dinner', isEaten: true },
      { id: 'legacy-meal-open', name: untouchedName, type: 'lunch', isEaten: false },
    ]);

    await page.goto('/plan');
    await settlePlanner(page);

    // The tick stored in the array is still honoured, with no mealStatus map
    // anywhere in the document.
    const untick = page.getByRole('button', { name: `Mark as not eaten: ${eatenName}` });
    await expect(untick).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Mark as eaten: ${untouchedName}` })
    ).toBeVisible();

    // Untick it. This is the case that forces the map to beat the array: the
    // array still says true, and if it won, the tick would come back on reload
    // and the user could never clear it.
    await untick.click();
    await expect(
      page.getByRole('button', { name: `Mark as eaten: ${eatenName}` })
    ).toBeVisible();

    // The button is optimistic; confirm the independent stored value before reload.
    await expect.poll(async () => {
      const persisted = await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId));
      return persisted.data()?.mealStatus?.['legacy-meal-eaten'];
    }).toBe(false);

    await page.reload();
    await settlePlanner(page);
    await expect(
      page.getByRole('button', { name: `Mark as eaten: ${eatenName}` })
    ).toBeVisible();

    const stored = await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId));
    const data = stored.data() as {
      mealStatus?: Record<string, boolean>;
      days: { meals: { id: string; isEaten?: boolean }[] }[];
    };

    expect(data.mealStatus).toEqual({ 'legacy-meal-eaten': false });
    // The whole point of the change: the days array never went over the wire,
    // so it still carries the original, now-overridden value.
    expect(data.days[0].meals.find((m) => m.id === 'legacy-meal-eaten')?.isEaten).toBe(true);

    expect(failures).toEqual([]);
  });

  test('AUD-022: ticking a meal writes one field and leaves the days array alone', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-meal-status-write-${Date.now()}@example.com`;
    const mealName = `QA Tick Me ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('meal-status-write');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: 'tick-me', name: mealName, type: 'dinner', isEaten: false },
    ]);

    await page.goto('/plan');
    await settlePlanner(page);

    const before = await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId));
    const daysBefore = JSON.stringify(before.data()?.days);

    await page.getByRole('button', { name: `Mark as eaten: ${mealName}` }).click();
    await expect(
      page.getByRole('button', { name: `Mark as not eaten: ${mealName}` })
    ).toBeVisible();

    await expect
      .poll(async () => {
        const snap = await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId));
        return snap.data()?.mealStatus?.['tick-me'];
      })
      .toBe(true);

    const after = await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId));
    expect(JSON.stringify(after.data()?.days)).toBe(daysBefore);

    expect(failures).toEqual([]);
  });

  // -------------------------------------------------------------- AUD-132

  test('AUD-132: a meal ticked on a non-current week is actually saved', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const email = `qa-tick-other-week-${Date.now()}@example.com`;
    const mealName = `QA Next Week Dinner ${Date.now()}`;

    await createBrowserUser(page, email);
    const client = createFirebaseClient('tick-other-week');
    const credential = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    const uid = credential.user.uid;

    // NEXT week on purpose. Every other plan test seeds the current week, which
    // is the one week the planner happens to write to, so none of them could
    // ever have caught this.
    const nextWeek = getMondayWeekStart();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const planId = await seedLegacyShapePlan(client.db, uid, nextWeek, [
      { id: 'tick-me-next-week', name: mealName, type: 'dinner', isEaten: false },
    ]);

    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: 'Next week' }).click();

    const tick = page.getByRole('button', { name: `Mark as eaten: ${mealName}` });
    await expect(tick).toBeVisible();
    await tick.click();
    await expect(
      page.getByRole('button', { name: `Mark as not eaten: ${mealName}` })
    ).toBeVisible();

    // The screen says eaten. The database is what decides.
    await expect
      .poll(async () => {
        const snap = await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId));
        return snap.data()?.mealStatus?.['tick-me-next-week'];
      }, { message: 'the tick never reached the server' })
      .toBe(true);

    await page.reload();
    await expect(
      page.getByRole('button', { name: `Mark as not eaten: ${mealName}` })
    ).toBeVisible();

    expect(failures).toEqual([]);
  });

  // -------------------------------------------------------------- G-B

  // The real rules cap `mealStatus` at 200 keys. A plan already at the cap makes
  // the server refuse any tick that adds a key, while a meal that already has a
  // key can still be ticked. One refused and one accepted tick on the same plan,
  // from the real rules, with nothing injected.
  async function seedPlanAtMealStatusCap(
    db: Firestore,
    uid: string,
    meals: { id: string; name: string; type: string }[],
    alreadyInMap: string[] = [],
  ) {
    const mealStatus: Record<string, boolean> = {};
    for (const id of alreadyInMap) mealStatus[id] = false;
    for (let i = 0; Object.keys(mealStatus).length < 200; i++) mealStatus[`g-b-old-meal-${i}`] = false;
    const planId = await seedLegacyShapePlan(db, uid, getMondayWeekStart(), meals.map(meal => ({ ...meal, isEaten: false })));
    await setDoc(doc(db, 'users', uid, 'mealPlans', planId), { mealStatus }, { merge: true });
    return planId;
  }

  const refusedTickErrors = [/PERMISSION_DENIED/, /Missing or insufficient permissions/i];

  for (const width of [1440, 390]) {
    test(`G-B: a refused meal tick is undone with a message and a quick tick on another meal still saves at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page, refusedTickErrors);
      const stamp = Date.now();
      const refusedName = `QA Refused Dinner ${stamp}`;
      const acceptedName = `QA Accepted Lunch ${stamp}`;
      const email = `qa-g-b-refused-${width}-${stamp}@example.com`;
      await createBrowserUser(page, email);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const client = createFirebaseClient('g-b-refused');
      const uid = (await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD)).user.uid;
      const planId = await seedPlanAtMealStatusCap(client.db, uid, [
        { id: 'g-b-refused', name: refusedName, type: 'dinner' },
        { id: 'g-b-accepted', name: acceptedName, type: 'lunch' },
      ], ['g-b-accepted']);
      const stored = async () => (await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId))).data()?.mealStatus;

      await page.goto('/plan');
      await settlePlanner(page);

      // Two quick ticks: the first is refused, the second is accepted.
      await page.getByRole('button', { name: `Mark as eaten: ${refusedName}` }).click();
      await page.getByRole('button', { name: `Mark as eaten: ${acceptedName}` }).click();

      await expect(page.getByRole('alert')).toContainText(`Could not save your change to ${refusedName}`);
      await expect(page.getByRole('button', { name: `Mark as eaten: ${refusedName}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Mark as not eaten: ${acceptedName}` })).toBeVisible();

      await expect.poll(async () => (await stored())?.['g-b-accepted']).toBe(true);
      expect((await stored())?.['g-b-refused']).toBeUndefined();

      await page.reload();
      await settlePlanner(page);
      await expect(page.getByRole('button', { name: `Mark as eaten: ${refusedName}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Mark as not eaten: ${acceptedName}` })).toBeVisible();
      expect(failures).toEqual([]);
    });
  }

  test('G-B: a refused double tap on one meal lands back on the saved value', async ({ page }) => {
    const failures = collectConsoleFailures(page, refusedTickErrors);
    const stamp = Date.now();
    const mealName = `QA Double Tap Dinner ${stamp}`;
    const email = `qa-g-b-double-${stamp}@example.com`;
    await createBrowserUser(page, email);
    const client = createFirebaseClient('g-b-double');
    const uid = (await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD)).user.uid;
    const planId = await seedPlanAtMealStatusCap(client.db, uid, [{ id: 'g-b-double', name: mealName, type: 'dinner' }]);

    await page.goto('/plan');
    await settlePlanner(page);

    // Tick then untick before the server answers. Both are refused, so the
    // meal must end where the server has it: not eaten. Undoing only the last
    // tap would put the first tap's tick back on screen.
    await page.getByRole('button', { name: `Mark as eaten: ${mealName}` }).dblclick();

    await expect(page.getByRole('alert')).toContainText(`Could not save your change to ${mealName}`);
    await expect(page.getByRole('button', { name: `Mark as eaten: ${mealName}` })).toBeVisible();
    await expect.poll(async () => (await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId))).data()?.mealStatus?.['g-b-double'])
      .toBeUndefined();
    await expect(page.getByRole('button', { name: `Mark as eaten: ${mealName}` })).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('G-B: a refused tick is not saved later through Confirm Plan', async ({ page }) => {
    const failures = collectConsoleFailures(page, refusedTickErrors);
    const stamp = Date.now();
    const mealName = `QA Stale Draft Dinner ${stamp}`;
    const email = `qa-g-b-confirm-${stamp}@example.com`;
    await createBrowserUser(page, email);
    const client = createFirebaseClient('g-b-confirm');
    const uid = (await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD)).user.uid;
    const planId = await seedPlanAtMealStatusCap(client.db, uid, [{ id: 'g-b-stale', name: mealName, type: 'dinner' }]);
    const stored = async () => (await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId))).data();

    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: `Mark as eaten: ${mealName}` }).click();
    await expect(page.getByRole('alert')).toContainText(`Could not save your change to ${mealName}`);

    // Confirm Plan writes the whole plan, ticks included, and the rules accept
    // that: the new map is small. A tick left behind in the draft would be
    // saved here even though the server refused it.
    await page.getByRole('button', { name: /Preferences/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Plan Settings' })).toBeVisible();
    await page.getByRole('spinbutton').first().fill('2100');
    await page.getByRole('button', { name: 'Save Targets' }).click();
    await page.getByRole('button', { name: 'Confirm Plan' }).click();
    await expect(page.getByRole('button', { name: 'Saved!' })).toBeVisible();

    await expect.poll(async () => (await stored())?.dailyTargets?.calories).toBe(2100);
    expect((await stored())?.mealStatus).toEqual({});

    await page.reload();
    await settlePlanner(page);
    await expect(page.getByRole('button', { name: `Mark as eaten: ${mealName}` })).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('G-B: a tick made while offline is kept, not undone, and saves once back online', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const stamp = Date.now();
    const mealName = `QA Offline Dinner ${stamp}`;
    const email = `qa-g-b-offline-${stamp}@example.com`;
    await createBrowserUser(page, email);
    const client = createFirebaseClient('g-b-offline');
    const uid = (await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD)).user.uid;
    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: 'g-b-offline', name: mealName, type: 'dinner', isEaten: false },
    ]);

    await page.goto('/plan');
    await settlePlanner(page);

    // Offline is not a refusal. The write waits in the queue, so the tick must
    // stay on screen with no error for as long as it waits.
    await page.context().setOffline(true);
    await page.getByRole('button', { name: `Mark as eaten: ${mealName}` }).click();
    await page.waitForTimeout(5000);
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${mealName}` })).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();

    await page.context().setOffline(false);
    await expect.poll(async () => (await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId))).data()?.mealStatus?.['g-b-offline'],
      { timeout: 30_000 }).toBe(true);
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${mealName}` })).toBeVisible();
    expect(failures).toEqual([]);
  });


  async function g2Account(page: Page, width: number, label: string) {
    const email = `qa-g2-${label}-${width}-${Date.now()}@example.com`;
    const client = createFirebaseClient('g2-form');
    await createBrowserUser(page, email);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const { user } = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await setDoc(doc(client.db, 'users', user.uid), { settings: { measurementUnit: 'imperial' } }, { merge: true });
    return { client, uid: user.uid };
  }

  const g2Ingredients = [
    { item: 'Rice', quantity: '1.25', unit: 'Cup', altQuantity: '150', altUnit: 'g', amount: '', swaps: ['Quinoa', 'Millet'] },
    { item: 'Blueberries', amount: '1/2 cup' },
  ];
  const g2Instructions = [
    { step: 'Mix Rice and Blueberries.', timer: 120, note: 'Keep this instruction metadata.' },
    { step: 'Rest before serving.', timer: 45.5, temperature: 180 },
    { step: 'Serve gently.' },
  ];
  const g2Numbers = {
    cookTime: 0, servings: 2.5, calories: 450.25, protein: 12.5, carbs: 1.4, fat: 0.8,
    micronutrients: { vitaminA: 0, vitaminC: 1.25, calcium: 2.75, iron: 0.4 },
  };

  for (const width of [1440, 390]) {
    test(`G2 recipe form preserves timers and all saved metadata at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g2Account(page, width, 'timers');
      const title = `G2 Timers ${width}`;
      const id = await seedRecipe(client.db, uid, title, {
        cookTime: 10, ingredients: g2Ingredients, instructions: g2Instructions,
        micronutrients: { vitaminA: 0, vitaminC: 1, calcium: 2, iron: 3 },
        isFavorite: true, source: 'imported', originalAssetUrl: '',
        originalAssetPath: 'qa/roundtrip.pdf', originalAssetType: 'pdf',
      });
      const recipeRef = doc(client.db, 'users', uid, 'recipes', id);
      const before = (await getDoc(recipeRef)).data()!;
      await page.goto('/recipes');
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.getByPlaceholder('e.g., Mediterranean Chicken Bowl')).toHaveValue(title);
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      const saved = (await getDoc(recipeRef)).data()!;
      expect(saved.instructions).toEqual(before.instructions);
      const beforeFields = { ...before }; delete beforeFields.updatedAt;
      const savedFields = { ...saved }; delete savedFields.updatedAt;
      expect(savedFields).toEqual(beforeFields);
      await page.reload();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await page.getByRole('button', { name: /^Instructions/ }).click();
      await page.getByLabel('Step 1', { exact: true }).fill('Edited timed step.');
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      expect((await getDoc(recipeRef)).data()?.instructions).toEqual([
        { ...g2Instructions[0], step: 'Edited timed step.' }, ...g2Instructions.slice(1),
      ]);
      expect(failures).toEqual([]);
    });

    test(`G2 recipe form retains decimal and zero values on edit at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g2Account(page, width, 'decimals');
      const title = `G2 Decimals ${width}`;
      const id = await seedRecipe(client.db, uid, title, { ...g2Numbers, ingredients: g2Ingredients, instructions: g2Instructions });
      const recipeRef = doc(client.db, 'users', uid, 'recipes', id);
      await page.goto('/recipes');
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.getByPlaceholder('e.g., Mediterranean Chicken Bowl')).toHaveValue(title);
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      expect((await getDoc(recipeRef)).data()).toMatchObject(g2Numbers);
      await page.reload();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      const edited = {
        cookTime: 0, servings: 1.5, calories: 123.45, protein: 13.75, carbs: 0.25, fat: 0.5,
        micronutrients: { vitaminA: 0, vitaminC: 2.5, calcium: 1.1, iron: 0.2 },
      };
      for (const [label, value] of [['Cook Time (minutes)', edited.cookTime], ['Servings', edited.servings], ['Calories', edited.calories],
        ['Protein (g)', edited.protein], ['Carbs (g)', edited.carbs], ['Fat (g)', edited.fat], ['Vit A', 0],
        ['Vit C', edited.micronutrients.vitaminC], ['Calcium', edited.micronutrients.calcium], ['Iron', edited.micronutrients.iron]] as const) {
        const field = page.getByLabel(label, { exact: true });
        await field.fill(String(value));
        expect(await field.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true);
      }
      await page.getByRole('button', { name: /^Ingredients/ }).click();
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      expect((await getDoc(recipeRef)).data()).toMatchObject(edited);
      await page.reload();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.getByLabel('Vit A', { exact: true })).toHaveValue('0');
      await expect(page.getByLabel('Protein (g)', { exact: true })).toHaveValue('13.75');
      expect(failures).toEqual([]);
    });

    test(`G2 recipe form saves decimal and zero values on creation at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g2Account(page, width, 'create');
      const title = `G2 Created ${width}`;
      await page.goto('/recipes');
      await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
      await page.getByPlaceholder('e.g., Mediterranean Chicken Bowl').fill(title);
      for (const [placeholder, value] of [['30', 0], ['4', 2.5], ['450', 450.25], ['35', 12.5], ['40', 1.4], ['15', 0.8]] as const) {
        await page.getByPlaceholder(placeholder, { exact: true }).fill(String(value));
      }
      for (const [index, value] of [0, 1.25, 2.75, 0.4].entries()) {
        await page.getByPlaceholder('0', { exact: true }).nth(index).fill(String(value));
      }
      await page.getByRole('button', { name: /^Instructions/ }).click();
      await page.getByRole('button', { name: '+ Add Step', exact: true }).click();
      await page.getByPlaceholder('Step 1 details...').fill('Keep new decimal values.');
      await page.getByRole('button', { name: /Create Recipe$/ }).click();
      await expect(page.getByRole('heading', { name: 'New Recipe', exact: true })).toBeHidden();
      const docs = await getDocs(collection(client.db, 'users', uid, 'recipes'));
      const saved = docs.docs.map(d => d.data()).find(recipe => recipe.title === title);
      expect(saved).toMatchObject({ ...g2Numbers, instructions: [{ step: 'Keep new decimal values.', timer: 0 }] });
      await page.reload();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.getByLabel('Servings', { exact: true })).toHaveValue('2.5');
      await expect(page.getByLabel('Iron', { exact: true })).toHaveValue('0.4');
      expect(failures).toEqual([]);
    });

    test(`G2 recipe form defaults unknown imported servings without changing zero cook time at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g2Account(page, width, 'import-defaults');
      const title = `G2 Imported Defaults ${width}`;
      await page.route('**/parseRecipeFromImage', route => fulfillCallable(route, {
        title, description: 'Mock imported draft', mealType: 'dinner', tags: ['Imported'],
        calories: 450.25, protein: 12.5, carbs: 1.4, fat: 0.8,
        ingredients: [{ item: 'Rice', qty: 1, unit: 'cup' }], instructions: ['Cook the rice.'],
      }));
      await page.goto('/recipes/import');
      await page.locator('input[type="file"]').setInputFiles({
        name: `g2-import-${width}.png`, mimeType: 'image/png', buffer: Buffer.from('mock-png-bytes'),
      });
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeVisible();
      await expect(page.getByLabel('Servings', { exact: true })).toHaveValue('4');
      await expect(page.getByLabel('Cook Time (minutes)', { exact: true })).toHaveValue('0');
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      const docs = await getDocs(collection(client.db, 'users', uid, 'recipes'));
      const saved = docs.docs.map(d => d.data()).find(recipe => recipe.title === title);
      expect(saved).toMatchObject({ cookTime: 0, servings: 4, calories: 450.25, protein: 12.5, carbs: 1.4, fat: 0.8, source: 'imported' });
      await page.reload();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.getByLabel('Servings', { exact: true })).toHaveValue('4');
      await expect(page.getByLabel('Cook Time (minutes)', { exact: true })).toHaveValue('0');
      expect(failures).toEqual([]);
    });

    test(`G2 recipe form links details and dynamic field labels at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g2Account(page, width, 'labels');
      const title = `G2 Labels ${width}`;
      await seedRecipe(client.db, uid, title, { ingredients: g2Ingredients, instructions: g2Instructions });
      await page.goto('/recipes');
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      const missingLabels = () => page.locator('form input:not([type=file]),form select,form textarea').evaluateAll(controls =>
        controls.filter(el => !(el as HTMLInputElement).labels?.length).map(el => el.getAttribute('placeholder') || el.tagName));
      expect(await missingLabels()).toEqual([]);
      for (const label of ['Recipe Name *', 'Cook Time (minutes)', 'Servings', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Vit A', 'Vit C', 'Calcium', 'Iron', 'Recipe Image']) {
        await expect(page.getByLabel(label, { exact: true })).toHaveCount(1);
      }
      await page.locator('label').filter({ hasText: /^Recipe Name \*$/ }).click();
      await expect(page.getByLabel('Recipe Name *', { exact: true })).toBeFocused();
      await page.getByRole('button', { name: /^Ingredients/ }).click();
      expect(await missingLabels()).toEqual([]);
      await expect(page.getByLabel('Ingredient 1 quantity', { exact: true })).toHaveValue('1.25');
      await expect(page.getByLabel('Ingredient 1 unit', { exact: true })).toHaveValue('Cup');
      await expect(page.getByLabel('Ingredient 1 name', { exact: true })).toHaveValue('Rice');
      await expect(page.getByLabel('Ingredient 1 alternative 1', { exact: true })).toHaveValue('Quinoa');
      await expect(page.getByLabel('Ingredient 1 alternative 2', { exact: true })).toHaveValue('Millet');
      await page.getByRole('button', { name: '+ Add Item', exact: true }).click();
      await page.getByLabel('Ingredient 3 name', { exact: true }).fill('New labelled item');
      expect(await missingLabels()).toEqual([]);
      await page.getByRole('button', { name: /^Instructions/ }).click();
      expect(await missingLabels()).toEqual([]);
      await expect(page.getByLabel('Step 1', { exact: true })).toHaveValue('Mix Rice and Blueberries.');
      await page.getByRole('button', { name: '+ Add Step', exact: true }).click();
      await page.getByLabel('Step 4', { exact: true }).fill('New labelled step');
      expect(await missingLabels()).toEqual([]);
      const discardRecipe = acceptNextDialog(page);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await discardRecipe;
      expect(failures).toEqual([]);
    });
  }

});

// G4 uses SDK-owned accounts rather than an ignored/private emulator export.
async function g4Account(page: Page, width: number, label: string) {
  const client = createFirebaseClient('g4-layout');
  const email = `qa-g4-${label}-${width}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const { user } = await createUserWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
  await setDoc(doc(client.db, 'users', user.uid), {
    settings: {
      onboardingCompleted: true, measurementUnit: 'imperial', dailyCalorieTarget: 2400,
      macroSplit: { protein: 30, carbs: 40, fat: 30 }, dietaryTags: [], allergies: [], phase: 'maintenance',
    },
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto('/auth');
  await page.getByPlaceholder('name@example.com').fill(email);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /^Log In$/ }).last().click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading', { name: 'Hydration', exact: true })).toBeVisible();
  return { client, uid: user.uid };
}

async function g4Snapshot(db: Firestore, uid: string) {
  const collections: Record<string, Record<string, unknown>[]> = {};
  for (const name of ['recipes', 'mealPlans', 'groceryItems', 'pantryItems', 'weightHistory']) {
    collections[name] = (await getDocs(collection(db, 'users', uid, name))).docs
      .map(record => ({ id: record.id, ...record.data() }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  return { user: (await getDoc(doc(db, 'users', uid))).data(), collections };
}

function g4Icon(scope: Page | Locator, icon: string) {
  return scope.locator('button').filter({ hasText: new RegExp(`^\\s*${icon}\\s*$`) });
}

async function g4Purpose(control: Locator, name: string) {
  await expect(control).toHaveCount(1);
  // Soft/short here lets the unfixed run reach every owner and action. Concrete
  // action results and data assertions remain hard; labels must all pass green.
  await expect.soft(control).toHaveAccessibleName(name, { timeout: 750 });
}

function g4Day(page: Page, day: string) {
  return page.getByText(day, { exact: true }).locator('..').locator('..');
}

function g4Settings(page: Page) {
  return page.getByRole('heading', { name: /Plan Settings/ }).locator('..').locator('..');
}

async function g4SetTargets(page: Page, calories: number) {
  await page.getByTitle('Preferences', { exact: true }).click();
  // VM044 target field labels are a separate later group. Setup is bounded to
  // this existing four-field modal; this test does not claim those labels fixed.
  await expect(g4Settings(page).getByRole('spinbutton')).toHaveCount(4);
  await g4Settings(page).getByRole('spinbutton').nth(0).fill(String(calories));
  await page.getByRole('button', { name: 'Save Targets', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Plan Settings/ })).toBeHidden();
}

async function g4OpenDetail(page: Page, title: string) {
  await page.getByRole('heading', { name: title, exact: true }).click();
  await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
}

test.describe('G4 layout and copy', () => {
  test.setTimeout(90_000);
  const ingredients = [
    { item: 'Rice', quantity: '1.25', unit: 'Cup', altQuantity: '150', altUnit: 'g', amount: '', swaps: ['Quinoa', 'Millet'] },
    { item: 'Blueberries', amount: '1/2 cup' },
  ];
  const instructions = [
    { step: 'Mix Rice and Blueberries.', timer: 120, note: 'Preserve retained step metadata.' },
    { step: 'Rest before serving.', timer: 45.5, temperature: 180 },
    { step: 'Serve gently.', timer: 60 },
  ];
  for (const width of [1440, 390]) {
    test(`G4 VM014 Dashboard calendar and both check-in close modes at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'dashboard-icons');
      const before = await g4Snapshot(client.db, uid);
      const calendar = page.getByRole('heading', { name: 'Activity', exact: true }).locator('..').locator('..');
      const previous = g4Icon(calendar, 'chevron_left');
      const next = g4Icon(calendar, 'chevron_right');
      await g4Purpose(previous, 'Previous month'); await g4Purpose(next, 'Next month');
      const month = previous.locator('..').locator(':scope > p');
      const originalMonth = await month.textContent();
      await previous.click();
      await expect(month).not.toHaveText(originalMonth!);
      await next.click(); await expect(month).toHaveText(originalMonth!);
      const logWeight = page.getByTitle('Log Weight', { exact: true });
      await g4Purpose(logWeight, 'Log weight');
      await logWeight.click();
      const quickHeading = page.getByRole('heading', { name: 'Log Weight', exact: true });
      const quickClose = g4Icon(quickHeading.locator('..').locator('..'), 'close');
      await g4Purpose(quickClose, 'Close check-in');
      await page.getByRole('spinbutton').fill('161.25');
      await quickClose.click(); await expect(quickHeading).toBeHidden();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await page.getByRole('button', { name: 'Start Check-In' }).click();
      const fullHeading = page.getByRole('heading', { name: 'Weekly Check-In', exact: true });
      await expect(fullHeading).toBeVisible();
      const fullClose = g4Icon(fullHeading.locator('..').locator('..'), 'close');
      await g4Purpose(fullClose, 'Close check-in');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByLabel('Energy level').press('ArrowRight');
      await expect(page.getByLabel('Energy level')).toHaveValue('4');
      await fullClose.click(); await expect(fullHeading).toBeHidden();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });

    test(`G4 VM014 Planner suggestions settings and every swap caller at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'planner-icons');
      const types = ['tea', 'smoothie', 'breakfast', 'lunch', 'dinner'] as const;
      const fixtures = [];
      for (const type of types) {
        const title = `G4 ${type} original ${width}`;
        // Tea is an existing plan slot, not an allowed recipe mealType. The tea
        // picker can still open/close its honest empty type-filter result.
        const id = await seedRecipe(client.db, uid, title, { mealType: type === 'tea' ? 'breakfast' : type });
        fixtures.push({ type, title, id });
      }
      const replacementTitle = `G4 dinner replacement ${width}`;
      const replacementId = await seedRecipe(client.db, uid, replacementTitle);
      const planId = await seedCurrentMealPlan(client.db, uid, fixtures[4].id, fixtures[4].title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const seeded = (await getDoc(planRef)).data()!;
      seeded.days[0].meals = fixtures.map(fixture => ({ id: `g4-${fixture.type}`, recipeId: fixture.id, name: fixture.title, type: fixture.type, calories: 400, protein: 30, carbs: 40, fat: 10 }));
      seeded.mealStatus = { 'g4-tea': true, 'g4-lunch': true };
      seeded.days[0].totalCalories = 2000;
      await setDoc(planRef, seeded);
      await page.goto('/plan'); await settlePlanner(page);
      const before = await g4Snapshot(client.db, uid);
      const preferences = page.getByTitle('Preferences', { exact: true });
      await g4Purpose(preferences, 'Plan preferences');
      await preferences.click();
      const settingsClose = g4Icon(g4Settings(page).locator(':scope > div').first(), 'close');
      await g4Purpose(settingsClose, 'Close plan settings');
      await g4Settings(page).getByRole('spinbutton').nth(0).fill('3333');
      await settingsClose.click();
      await expect(page.getByRole('heading', { name: /Plan Settings/ })).toBeHidden();
      await preferences.click();
      await expect(g4Settings(page).getByRole('spinbutton').nth(0)).toHaveValue('1850');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      const monday = g4Day(page, 'Monday');
      const suggest = monday.getByTitle('Magic Suggest: Fill daily gap', { exact: true });
      await g4Purpose(suggest, 'Show suggestions for Monday');
      await suggest.click();
      const gap = page.getByRole('heading', { name: /Complete Monday/ });
      const gapClose = g4Icon(gap.locator('..').locator('..'), 'close');
      await g4Purpose(gapClose, 'Close suggestions for Monday');
      await expect(page.getByText('Tip: These are the best matches from your library.')).toBeVisible();
      await gapClose.click(); await expect(gap).toBeHidden();
      for (const fixture of fixtures) {
        const card = monday.getByRole('heading', { name: fixture.title, exact: true }).locator('..').locator('..');
        const swap = g4Icon(card, 'autorenew');
        await g4Purpose(swap, `Swap ${fixture.title}`);
        await card.hover(); await swap.click();
        const pickerHeading = page.getByRole('heading', { name: `Select ${fixture.type.charAt(0).toUpperCase() + fixture.type.slice(1)}`, exact: true });
        await expect(pickerHeading).toBeVisible();
        const pickerClose = g4Icon(pickerHeading.locator('..').locator('..'), 'close');
        await g4Purpose(pickerClose, 'Close recipe picker');
        await pickerClose.click(); await expect(pickerHeading).toBeHidden();
        await expect(monday.getByRole('heading', { name: fixture.title, exact: true })).toBeVisible();
      }
      // The other live RecipePicker mount is batch selection. Opening/closing
      // it must retain meals and never trigger AI generation.
      await page.getByRole('button', { name: /Batch Cook/ }).click();
      await page.getByRole('button', { name: 'Select Meal', exact: true }).click();
      await page.getByRole('heading', { name: 'Batch Cook Which Meal?', exact: true }).locator('..')
        .getByText(/^lunch$/i).click();
      const batch = page.getByRole('heading', { name: 'Select Batch Lunch for the Week', exact: true });
      const batchClose = g4Icon(batch.locator('..').locator('..'), 'close');
      await g4Purpose(batchClose, 'Close recipe picker');
      await batchClose.click(); await expect(batch).toBeHidden();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      const dinnerCard = monday.getByRole('heading', { name: fixtures[4].title, exact: true }).locator('..').locator('..');
      await dinnerCard.hover(); await g4Icon(dinnerCard, 'autorenew').click();
      await page.getByRole('heading', { name: replacementTitle, exact: true }).click();
      await expect(monday.getByRole('heading', { name: replacementTitle, exact: true })).toBeVisible();
      await expect(monday.getByRole('heading', { name: fixtures[4].title, exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Confirm Plan/ })).toBeEnabled();
      await page.getByRole('button', { name: /Confirm Plan/ }).click();
      await expect(page.getByRole('button', { name: /Saved!/ })).toBeVisible();
      const saved = (await getDoc(planRef)).data()!;
      expect(saved.days[0].meals).toContainEqual(expect.objectContaining({ recipeId: replacementId, name: replacementTitle, type: 'dinner' }));
      for (const fixture of fixtures.slice(0, 4)) expect(saved.days[0].meals).toContainEqual(seeded.days[0].meals.find((meal: { type: string }) => meal.type === fixture.type));
      expect(saved.mealStatus).toEqual(seeded.mealStatus);
      await page.reload(); await settlePlanner(page);
      await expect(g4Day(page, 'Monday').getByRole('heading', { name: replacementTitle, exact: true })).toBeVisible();
      expect((await getDoc(planRef)).data()).toEqual(saved);
      expect((await g4Snapshot(client.db, uid)).collections.recipes).toEqual(before.collections.recipes);
      expect(failures).toEqual([]);
    });

    test(`G4 VM023 Planner CTA and macro text stay contained at ${width}px`, async ({ page }) => {
      const { client, uid } = await g4Account(page, width, 'planner-bounds');
      const title = `G4 Macro Dinner ${width}`;
      const id = await seedRecipe(client.db, uid, title, { calories: 2300, protein: 175, carbs: 250, fat: 80 });
      const planId = await seedCurrentMealPlan(client.db, uid, id, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].totalCalories = 2300;
      Object.assign(plan.days[0].meals[0], { calories: 2300, protein: 175, carbs: 250, fat: 80 });
      plan.dailyTargets = { calories: 2400, protein: 175, carbs: 250, fat: 80 };
      await setDoc(planRef, plan);
      await seedGroceryItem(client.db, uid, { name: 'G4 Manual Sentinel', source: 'manual' });
      await page.goto('/plan'); await settlePlanner(page);
      await g4SetTargets(page, 2500);
      const addToList = page.locator('button').filter({ hasText: /shopping_cart/ });
      await g4Purpose(addToList, 'Add to List');
      const actions = addToList.locator('..');
      const actionBoxes = await actions.locator(':scope > button').evaluateAll(buttons => buttons.map(button => {
        const rect = button.getBoundingClientRect(); const panel = button.parentElement!.parentElement!.getBoundingClientRect();
        const text: { left: number; right: number; top: number; bottom: number }[] = [];
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT); let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent?.trim() || (node.parentElement && getComputedStyle(node.parentElement).display === 'none')) continue;
          const range = document.createRange(); range.selectNode(node); const r = range.getBoundingClientRect();
          if (r.width) text.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        }
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, text, panel: { left: panel.left, right: panel.right }, viewport: innerWidth };
      }));
      expect(actionBoxes).toHaveLength(3);
      for (const button of actionBoxes) for (const box of [button, ...button.text]) {
        expect.soft(box.left).toBeGreaterThanOrEqual(button.panel.left - 1);
        expect.soft(box.right, 'enabled planner action and text must not be clipped').toBeLessThanOrEqual(Math.min(button.panel.right, button.viewport) + 1);
      }
      for (let a = 0; a < actionBoxes.length; a++) for (let b = a + 1; b < actionBoxes.length; b++) {
        const area = Math.max(0, Math.min(actionBoxes[a].right, actionBoxes[b].right) - Math.max(actionBoxes[a].left, actionBoxes[b].left)) * Math.max(0, Math.min(actionBoxes[a].bottom, actionBoxes[b].bottom) - Math.max(actionBoxes[a].top, actionBoxes[b].top));
        expect.soft(area).toBeLessThanOrEqual(1);
      }
      for (const label of ['Daily Calories', 'Protein', 'Carbs', 'Fats']) {
        const metric = await page.getByText(label, { exact: true }).evaluate(element => {
          const card = element.parentElement!; const row = element.nextElementSibling!;
          const cardBox = card.getBoundingClientRect(); const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
          const text: { value: string; left: number; right: number; top: number; bottom: number }[] = []; let node;
          while ((node = walker.nextNode())) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange(); range.selectNode(node); const r = range.getBoundingClientRect();
            text.push({ value: node.textContent.trim(), left: r.left, right: r.right, top: r.top, bottom: r.bottom });
          }
          return { card: { left: cardBox.left, right: cardBox.right }, text, viewport: innerWidth, clientWidth: row.clientWidth, scrollWidth: row.scrollWidth };
        });
        expect(metric.text.some(node => node.value === (label === 'Daily Calories' ? 'kcal' : 'g'))).toBe(true);
        expect.soft(metric.scrollWidth, `${label} value row overflows`).toBeLessThanOrEqual(metric.clientWidth + 1);
        for (const node of metric.text) {
          expect.soft(node.left).toBeGreaterThanOrEqual(metric.card.left - 1);
          expect.soft(node.right, `${label}: ${node.value} must fit inside card`).toBeLessThanOrEqual(Math.min(metric.card.right, metric.viewport) + 1);
        }
        for (let a = 0; a < metric.text.length; a++) for (let b = a + 1; b < metric.text.length; b++) {
          const overlap = Math.max(0, Math.min(metric.text[a].right, metric.text[b].right) - Math.max(metric.text[a].left, metric.text[b].left)) * Math.max(0, Math.min(metric.text[a].bottom, metric.text[b].bottom) - Math.max(metric.text[a].top, metric.text[b].top));
          expect.soft(overlap, `${label}: separate number/unit text must not overlap`).toBeLessThanOrEqual(1);
        }
      }
      await addToList.click();
      await expect(page.getByRole('alert')).toContainText(/Added 1 item/i);
      const generated = (await g4Snapshot(client.db, uid)).collections.groceryItems;
      expect(generated).toHaveLength(2);
      expect(generated.find(item => item.name === 'G4 Manual Sentinel')).toMatchObject({ source: 'manual', quantity: 1 });
      expect(generated.find(item => item.name === 'Chicken breast')).toMatchObject({ source: 'generated', quantity: 1.5, unit: 'oz' });
      await page.getByRole('button', { name: /Confirm Plan/ }).click();
      await expect(page.getByRole('button', { name: /Saved!/ })).toBeVisible();
      expect((await getDoc(planRef)).data()?.dailyTargets.calories).toBe(2500);
      await page.reload(); await settlePlanner(page);
      await expect(page.getByRole('button', { name: /Confirm Plan/ })).toBeDisabled();
      expect((await g4Snapshot(client.db, uid)).collections.groceryItems).toEqual(generated);
    });

    test(`G4 VM013 Grocery blank add gives local guidance without writes at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'grocery-blank');
      await seedGroceryItem(client.db, uid, { name: 'G4 Keepsake', source: 'manual' });
      await page.goto('/grocery');
      await expect(page.getByRole('heading', { name: 'G4 Keepsake', exact: true })).toBeVisible();
      const before = await g4Snapshot(client.db, uid);
      const input = page.getByPlaceholder(/Quick add item/);
      for (const scenario of [{ value: '', enter: false }, { value: '', enter: true }, { value: '   ', enter: false }, { value: '   ', enter: true }]) {
        await page.reload();
        await expect(input).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        await input.fill(scenario.value);
        if (scenario.enter) await input.press('Enter');
        else await page.getByRole('button', { name: 'Add grocery item', exact: true }).click();
        await expect.soft(page.getByRole('alert')).toContainText(/enter|type|add|item/i, { timeout: 750 });
        await expect(input).toHaveValue(scenario.value);
        await expect(page.getByRole('button', { name: 'Add grocery item', exact: true })).toBeEnabled();
        expect(await g4Snapshot(client.db, uid)).toEqual(before);
      }
      await input.fill('2 G4 Keepsake Two');
      await page.getByRole('button', { name: 'Add grocery item', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'G4 Keepsake Two', exact: true })).toBeVisible();
      await expect(input).toHaveValue('');
      await expect(page.getByRole('alert')).toHaveCount(0);
      const saved = await g4Snapshot(client.db, uid);
      expect(saved.collections.groceryItems).toHaveLength(2);
      expect(saved.collections.groceryItems.find(item => item.name === 'G4 Keepsake')).toEqual(before.collections.groceryItems[0]);
      expect(saved.collections.groceryItems.find(item => item.name === 'G4 Keepsake Two')).toMatchObject({ quantity: 2, source: 'manual', isChecked: false });
      for (const name of ['recipes', 'mealPlans', 'pantryItems', 'weightHistory']) expect(saved.collections[name]).toEqual(before.collections[name]);
      expect(saved.user).toEqual(before.user);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'G4 Keepsake Two', exact: true })).toBeVisible();
      expect(await g4Snapshot(client.db, uid)).toEqual(saved);
      expect(failures).toEqual([]);
    });

    test(`G4 VM013 Pantry blank feedback stays beside prototype input at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'pantry-blank');
      await addDoc(collection(client.db, 'users', uid, 'pantryItems'), { name: 'G4 Pantry Sentinel', quantity: 1, unit: 'pc', category: 'Other', isLowStock: false });
      await page.goto('/pantry');
      await expect(page.getByRole('button', { name: 'Delete pantry item: G4 Pantry Sentinel', exact: true })).toBeVisible();
      const before = await g4Snapshot(client.db, uid);
      const input = page.getByPlaceholder(/200g Greek Yogurt/);
      for (const value of ['', '   \n  ']) {
        await page.reload();
        await expect(input).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        await input.fill(value);
        await page.getByRole('button', { name: 'Process Items', exact: true }).click();
        await expect.soft(page.getByRole('alert')).toContainText(/enter|type|add|item/i, { timeout: 750 });
        await expect(input).toHaveValue(value);
        await expect(page.getByRole('button', { name: 'Process Items', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
        expect(await g4Snapshot(client.db, uid)).toEqual(before);
      }
      await input.fill('200g G4 Pantry Lentils');
      await page.getByRole('button', { name: 'Process Items', exact: true }).click();
      await expect(page.getByText('G4 Pantry Lentils', { exact: true })).toBeVisible();
      await expect(input).toHaveValue('');
      await expect(page.getByRole('alert')).toHaveCount(0);
      for (const name of [/Scan Coming Soon/, /Full Pantry Coming Soon/, /Shortcut Coming Soon/, 'Previous pantry page (coming soon)', 'Next pantry page (coming soon)', 'Pantry AI suggestions coming soon', 'Pantry-to-shopping-list suggestions coming soon']) {
        await expect(page.getByRole('button', { name })).toBeDisabled();
      }
      const saved = await g4Snapshot(client.db, uid);
      expect(saved.collections.pantryItems).toHaveLength(2);
      expect(saved.collections.pantryItems.find(item => item.name === 'G4 Pantry Sentinel')).toEqual(before.collections.pantryItems[0]);
      expect(saved.collections.pantryItems.find(item => item.name === 'G4 Pantry Lentils')).toMatchObject({ quantity: 200, unit: 'g', isLowStock: false });
      for (const name of ['recipes', 'mealPlans', 'groceryItems', 'weightHistory']) expect(saved.collections[name]).toEqual(before.collections[name]);
      expect(saved.user).toEqual(before.user);
      await page.reload();
      await expect(page.getByText('G4 Pantry Lentils', { exact: true })).toBeVisible();
      expect(await g4Snapshot(client.db, uid)).toEqual(saved);
      expect(failures).toEqual([]);
    });

    test(`G4 VM025 category count follows one two one persisted items at ${width}px`, async ({ page }) => {
      const { client, uid } = await g4Account(page, width, 'count');
      await seedGroceryItem(client.db, uid, { name: 'G4 Keepsake', source: 'manual' });
      await page.goto('/grocery');
      const count = page.getByRole('heading', { name: 'Other', exact: true }).locator('..').locator('..').locator(':scope > span');
      await expect.soft(count).toHaveText('1 item', { timeout: 750 });
      const before = await g4Snapshot(client.db, uid);
      await page.getByPlaceholder(/Quick add item/).fill('2 G4 Keepsake Two');
      await page.getByRole('button', { name: 'Add grocery item', exact: true }).click();
      await expect(count).toHaveText('2 items');
      expect((await g4Snapshot(client.db, uid)).collections.groceryItems).toHaveLength(2);
      await page.getByRole('button', { name: 'Delete grocery item: G4 Keepsake Two', exact: true }).click();
      await expect.soft(count).toHaveText('1 item', { timeout: 750 });
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await page.reload();
      await expect.soft(count).toHaveText('1 item', { timeout: 750 });
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
    });

    test(`G4 VM014 VM038 VM039 recipe form actions and editable fields fit at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'form');
      const title = `G4 Form ${width}`;
      const id = await seedRecipe(client.db, uid, title, {
        ingredients, instructions, imageUrl: '', cookTime: 0, servings: 2.5,
        calories: 450.25, protein: 12.5, carbs: 1.4, fat: 0.8,
        micronutrients: { vitaminA: 0, vitaminC: 1.25, calcium: 2.75, iron: 0.4 },
        source: 'imported', originalAssetPath: 'qa/g4-roundtrip.pdf', originalAssetType: 'pdf',
      });
      const recipeRef = doc(client.db, 'users', uid, 'recipes', id);
      await page.goto('/recipes');
      const before = await g4Snapshot(client.db, uid);
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      const modal = page.getByRole('heading', { name: 'Edit Recipe', exact: true }).locator('..').locator('..');
      const headerClose = g4Icon(modal.locator(':scope > div').first(), 'close');
      // The persisted recipe obeys the unchanged HTTPS URL rule. A local
      // preview URL is only an unsaved form edit, canceled below.
      await page.getByLabel('Recipe Image', { exact: true }).fill('/vite.svg');
      const removeImage = g4Icon(modal.locator('form'), 'close');
      await g4Purpose(headerClose, 'Close recipe form');
      await g4Purpose(removeImage, 'Remove recipe image');
      await removeImage.click();
      await expect(page.getByLabel('Recipe Image', { exact: true })).toHaveValue('');
      await expect(modal.locator('form img')).toHaveCount(0);
      await page.getByLabel('Recipe Name *', { exact: true }).fill('Unsubmitted G4 title');
      const discardRecipe = acceptNextDialog(page);
      await headerClose.click();
      await discardRecipe;
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.getByLabel('Recipe Name *', { exact: true })).toHaveValue(title);
      const tabs = modal.getByRole('button', { name: /^(Details|Ingredients|Instructions)/ });
      await expect(tabs).toHaveCount(3);
      const tabBounds = await tabs.evaluateAll(buttons => buttons.map(button => {
        const box = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
        const text = [...button.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()).map(n => { const range = document.createRange(); range.selectNode(n); const r = range.getBoundingClientRect(); return { left: r.left, right: r.right }; });
        return { button: box(button), row: box(button.parentElement!), badges: [...button.querySelectorAll('span')].map(box), text, viewport: innerWidth };
      }));
      for (const item of tabBounds) {
        for (const box of [item.button, ...item.badges, ...item.text]) {
          expect.soft(box.left).toBeGreaterThanOrEqual(item.row.left - 1);
          expect.soft(box.right, 'every tab label and count badge must remain inside its row').toBeLessThanOrEqual(Math.min(item.row.right, item.viewport) + 1);
        }
      }
      await modal.getByRole('button', { name: /^Ingredients/ }).click();
      await expect(modal.getByRole('button', { name: /^Ingredients/ })).toContainText('2');
      const name = page.getByLabel('Ingredient 2 name', { exact: true });
      const textSpace = await name.evaluate((input: HTMLInputElement) => {
        const css = getComputedStyle(input); const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!; context.font = css.font;
        const letterSpacing = Number.parseFloat(css.letterSpacing) || 0;
        return { available: input.clientWidth - Number.parseFloat(css.paddingLeft) - Number.parseFloat(css.paddingRight), needed: context.measureText('Blueberries').width + letterSpacing * 10 };
      });
      expect.soft(textSpace.available, 'Blueberries must fit in the actual editable content box').toBeGreaterThanOrEqual(textSpace.needed);
      const firstRow = page.getByLabel('Ingredient 1 name', { exact: true }).locator('..').locator('..');
      const secondRow = name.locator('..').locator('..');
      for (const row of [firstRow, secondRow]) {
        const boxes = await row.locator('input, select, button').evaluateAll(controls => controls.map(control => {
          const r = control.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, viewport: innerWidth };
        }));
        for (const box of boxes) { expect.soft(box.left).toBeGreaterThanOrEqual(0); expect.soft(box.right).toBeLessThanOrEqual(box.viewport + 1); expect.soft(box.width).toBeGreaterThan(0); }
        for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
          const overlap = Math.max(0, Math.min(boxes[a].right, boxes[b].right) - Math.max(boxes[a].left, boxes[b].left)) * Math.max(0, Math.min(boxes[a].bottom, boxes[b].bottom) - Math.max(boxes[a].top, boxes[b].top));
          expect.soft(overlap, 'ingredient controls must not overlap').toBeLessThanOrEqual(1);
        }
      }
      await name.fill('Blueberries edited');
      const addAlternative = g4Icon(firstRow, 'swap_horiz');
      await g4Purpose(addAlternative, 'Add alternative for ingredient 1');
      await addAlternative.click();
      await page.getByLabel('Ingredient 1 alternative 3', { exact: true }).fill('Sorghum');
      const alternative = page.getByLabel('Ingredient 1 alternative 1', { exact: true });
      const removeAlternative = g4Icon(alternative.locator('..'), 'close');
      await g4Purpose(removeAlternative, 'Remove alternative 1 for ingredient 1');
      await removeAlternative.click();
      await expect(page.getByLabel('Ingredient 1 alternative 1', { exact: true })).toHaveValue('Millet');
      await expect(page.getByLabel('Ingredient 1 alternative 2', { exact: true })).toHaveValue('Sorghum');
      await page.getByRole('button', { name: '+ Add Item', exact: true }).click();
      await page.getByLabel('Ingredient 3 name', { exact: true }).fill('Temporary ingredient');
      await expect(modal.getByRole('button', { name: /^Ingredients/ })).toContainText('3');
      const deleteIngredient = g4Icon(page.getByLabel('Ingredient 3 name', { exact: true }).locator('..').locator('..'), 'delete');
      await g4Purpose(deleteIngredient, 'Delete ingredient 3');
      await deleteIngredient.click();
      await expect(page.getByLabel('Ingredient 3 name', { exact: true })).toHaveCount(0);
      await expect(name).toHaveValue('Blueberries edited');
      await expect(modal.getByRole('button', { name: /^Ingredients/ })).toContainText('2');
      await modal.getByRole('button', { name: /^Instructions/ }).click();
      await expect(modal.getByRole('button', { name: /^Instructions/ })).toContainText('3');
      await page.getByRole('button', { name: '+ Add Step', exact: true }).click();
      await page.getByLabel('Step 4', { exact: true }).fill('Temporary step');
      const deleteFourth = g4Icon(page.getByLabel('Step 4', { exact: true }).locator('..'), 'delete');
      await g4Purpose(deleteFourth, 'Delete instruction 4');
      await deleteFourth.click();
      const deleteInstruction = g4Icon(page.getByLabel('Step 2', { exact: true }).locator('..'), 'delete');
      await g4Purpose(deleteInstruction, 'Delete instruction 2');
      await deleteInstruction.click();
      await expect(page.getByLabel('Step 1', { exact: true })).toHaveValue(instructions[0].step);
      await expect(page.getByLabel('Step 2', { exact: true })).toHaveValue(instructions[2].step);
      await expect(modal.getByRole('button', { name: /^Instructions/ })).toContainText('2');
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      const saved = (await getDoc(recipeRef)).data()!;
      const expected = { ...before.collections.recipes[0] }; delete expected.id; delete expected.updatedAt;
      const actual = { ...saved }; delete actual.updatedAt;
      expect(actual).toEqual({ ...expected, ingredients: [{ ...ingredients[0], swaps: ['Millet', 'Sorghum'] }, { ...ingredients[1], item: 'Blueberries edited' }], instructions: [instructions[0], instructions[2]] });
      await page.reload();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await modal.getByRole('button', { name: /^Ingredients/ }).click();
      await expect(name).toHaveValue('Blueberries edited');
      await expect(page.getByLabel('Ingredient 1 quantity', { exact: true })).toHaveValue('1.25');
      await expect(page.getByLabel('Ingredient 1 alternative 1', { exact: true })).toHaveValue('Millet');
      await modal.getByRole('button', { name: /^Instructions/ }).click();
      await expect(page.getByLabel('Step 2', { exact: true })).toHaveValue(instructions[2].step);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      const after = await g4Snapshot(client.db, uid);
      for (const collectionName of ['mealPlans', 'groceryItems', 'pantryItems', 'weightHistory']) expect(after.collections[collectionName]).toEqual(before.collections[collectionName]);
      expect(after.user).toEqual(before.user);
      expect(failures).toEqual([]);
    });

    test(`G4 VM036 macro filters contain labels and do not overlap live chips at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'filters');
      await seedRecipe(client.db, uid, 'G4 High Protein Meal', { tags: ['High Protein', 'Meal Prep'], protein: 40, cookTime: 20 });
      await seedRecipe(client.db, uid, 'G4 Lower Protein Meal', { tags: [], protein: 10, cookTime: 45 });
      await page.goto('/recipes');
      const protein = page.getByRole('button', { name: 'Protein: 20g+', exact: true });
      const carbs = page.getByRole('button', { name: 'Carbs: <50g', exact: true });
      await expect(protein).toBeDisabled(); await expect(carbs).toBeDisabled();
      const bounds = await protein.evaluate(element => {
        const group = element.parentElement!;
        const next = group.nextElementSibling!;
        const box = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
        return { group: box(group), children: [...group.children].map(box), next: box(next), scroller: box(group.parentElement!), viewport: innerWidth, bodyWidth: document.documentElement.scrollWidth };
      });
      for (const child of bounds.children) {
        expect.soft(child.left).toBeGreaterThanOrEqual(bounds.group.left - 1);
        expect.soft(child.right, 'macro filter group must enclose its fixed-width children').toBeLessThanOrEqual(bounds.group.right + 1);
        expect.soft(child.right, 'macro label must not overlap High Protein chip').toBeLessThanOrEqual(bounds.next.left + 1);
      }
      expect(bounds.scroller.right).toBeLessThanOrEqual(bounds.viewport + 1);
      expect(bounds.bodyWidth).toBeLessThanOrEqual(bounds.viewport + 1);
      const before = await g4Snapshot(client.db, uid);
      await page.getByRole('button', { name: 'High Protein', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'G4 High Protein Meal', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'G4 Lower Protein Meal', exact: true })).toBeHidden();
      await page.getByRole('button', { name: /^High Protein/ }).click();
      await expect(page.getByRole('heading', { name: 'G4 Lower Protein Meal', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Meal Prep', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'G4 Lower Protein Meal', exact: true })).toBeHidden();
      await page.getByRole('button', { name: /^Meal Prep/ }).click();
      await page.getByRole('button', { name: /Under 30m/ }).click();
      await expect(page.getByRole('heading', { name: 'G4 High Protein Meal', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'G4 Lower Protein Meal', exact: true })).toBeHidden();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });
  }
});

test.describe('G4 shared recipe controls and emulator warning', () => {
  test.setTimeout(90_000);
  for (const width of [1440, 390]) for (const caller of ['Library', 'Planner'] as const) {
    test(`G4 VM014 VM043 ${caller} servings timer and unobscured cooking navigation at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, `cooking-${caller.toLowerCase()}`);
      const title = `G4 ${caller} Cooking ${width}`;
      const id = await seedRecipe(client.db, uid, title, {
        servings: 4,
        ingredients: [{ item: 'Rice', quantity: '4', unit: 'Cup', swaps: [] }],
        instructions: [
          { step: 'Mix the Rice.', timer: 120, note: 'Keep metadata.' },
          { step: 'Rest the Rice.', timer: 60 },
          { step: 'Serve the Rice.', timer: 30 },
        ],
      });
      if (caller === 'Planner') await seedCurrentMealPlan(client.db, uid, id, title);
      await page.goto(caller === 'Library' ? '/recipes' : '/plan');
      if (caller === 'Planner') await settlePlanner(page);
      const before = await g4Snapshot(client.db, uid);
      const warning = page.locator('.firebase-emulator-warning');
      await expect(warning).toBeVisible();
      await expect(warning).toContainText('Running in emulator mode. Do not use with production credentials.');
      await g4OpenDetail(page, title);
      const back = g4Icon(page.locator('main main'), 'arrow_back');
      await g4Purpose(back, 'Close recipe details');
      const ingredientHeader = page.getByRole('heading', { name: 'Ingredients', exact: true }).locator('..');
      const increase = ingredientHeader.locator('button').filter({ hasText: /^\+$/ });
      const decrease = ingredientHeader.locator('button').filter({ hasText: /^-$/ });
      await g4Purpose(increase, 'Increase servings'); await g4Purpose(decrease, 'Decrease servings');
      await expect(ingredientHeader).toContainText('4 Servings');
      await increase.click(); await expect(ingredientHeader).toContainText('5 Servings');
      await expect(page.getByRole('checkbox', { name: '5 Cup Rice', exact: true })).toBeVisible();
      await decrease.click(); await expect(ingredientHeader).toContainText('4 Servings');
      for (let count = 0; count < 4; count++) await decrease.click();
      await expect(ingredientHeader).toContainText('1 Servings');
      await expect(page.getByRole('checkbox', { name: '1 Cup Rice', exact: true })).toBeVisible();
      // Return to four servings; browser state only, never a recipe write.
      for (let count = 0; count < 3; count++) await increase.click();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
      const timer = page.getByText('Step Timer', { exact: true }).locator('..').locator('..').locator('..');
      const reset = g4Icon(timer, 'refresh');
      await g4Purpose(reset, 'Reset step timer');
      await reset.click(); // Initialize the existing duration; initial-zero is G7.
      const clock = timer.locator('span').filter({ hasText: /^\d{2}:\d{2}$/ });
      await expect(clock).toHaveText('02:00');
      const start = g4Icon(timer, 'play_arrow');
      await g4Purpose(start, 'Start step timer');
      await start.click();
      const pause = g4Icon(timer, 'pause');
      await g4Purpose(pause, 'Pause step timer');
      await expect(clock).not.toHaveText('02:00', { timeout: 5000 });
      await pause.click();
      const paused = await clock.textContent();
      await page.waitForTimeout(1200);
      await expect(clock).toHaveText(paused!);
      await g4Purpose(start, 'Start step timer');
      await reset.click(); await expect(clock).toHaveText('02:00');
      await expect(start).toBeVisible();
      const assertAboveWarning = async (control: Locator) => {
        await control.scrollIntoViewIfNeeded();
        await expect(warning).toBeVisible();
        const visibility = await control.evaluate(button => {
          const warningElement = document.querySelector('.firebase-emulator-warning')!;
          const b = button.getBoundingClientRect(); const w = warningElement.getBoundingClientRect();
          const center = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return {
            warningHeight: w.height, buttonBottom: b.bottom, warningTop: w.top,
            overlap: Math.max(0, Math.min(b.right, w.right) - Math.max(b.left, w.left)) * Math.max(0, Math.min(b.bottom, w.bottom) - Math.max(b.top, w.top)),
            centerHitsButton: !!center && (center === button || button.contains(center)),
          };
        });
        expect(visibility.warningHeight).toBeGreaterThan(0);
        expect(visibility.overlap, 'real Auth-emulator warning must not cover cooking controls').toBeLessThanOrEqual(1);
        expect(visibility.buttonBottom).toBeLessThanOrEqual(visibility.warningTop + 1);
        expect(visibility.centerHitsButton, 'ordinary button center must receive a click').toBe(true);
      };
      // The Planner's underlying week toolbar remains mounted. Scope cooking
      // navigation so its Previous button cannot match Previous week.
      const cookingMain = page.locator('main').last();
      const next = cookingMain.getByRole('button', { name: /Next Step/ });
      const previous = cookingMain.getByRole('button', { name: /Previous/ });
      await expect(previous).toBeDisabled();
      await assertAboveWarning(next);
      await next.click();
      await expect(page.getByRole('heading', { name: 'Step 2', exact: true })).toBeVisible();
      await assertAboveWarning(previous); await previous.click();
      await expect(page.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
      await assertAboveWarning(next); await next.click();
      await expect(page.getByRole('heading', { name: 'Step 2', exact: true })).toBeVisible();
      await assertAboveWarning(next); await next.click();
      await expect(page.getByRole('heading', { name: 'Step 3', exact: true })).toBeVisible();
      const finish = cookingMain.getByRole('button', { name: /Finish/ });
      await assertAboveWarning(finish); await finish.click();
      await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
      await back.click();
      await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toHaveCount(0);
      if (caller === 'Library') await expect(page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true })).toBeVisible();
      else await expect(page.getByRole('button', { name: 'Next week', exact: true })).toBeVisible();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });
  }
});

test.describe('G4 canonical shell week label', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });
  for (const sample of [
    { label: 'Thursday', instant: '2026-10-29T19:00:00Z', expected: 'Oct 26' },
    { label: 'Monday', instant: '2026-10-26T19:00:00Z', expected: 'Oct 26' },
    { label: 'Sunday after DST', instant: '2026-11-01T20:00:00Z', expected: 'Oct 26' },
    { label: 'UTC Monday still local Sunday', instant: '2026-10-26T00:30:00Z', expected: 'Oct 19' },
  ]) {
    test(`G4 VM024 shell uses canonical Monday on ${sample.label}`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      await page.clock.setFixedTime(new Date(sample.instant));
      const { client, uid } = await g4Account(page, 1440, `week-${sample.label.replace(/\W+/g, '-').toLowerCase()}`);
      const before = await g4Snapshot(client.db, uid);
      const label = page.locator('header').getByText(/^Week of .* - Planning$/);
      for (const route of ['/', '/plan', '/recipes', '/grocery']) {
        if (route !== '/') await page.goto(route);
        await expect.soft(label).toHaveText(`Week of ${sample.expected} - Planning`, { timeout: 750 });
        await page.reload();
        await expect.soft(label).toHaveText(`Week of ${sample.expected} - Planning`, { timeout: 750 });
      }
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });
  }
});

test.describe('G4 UTC week boundary control', () => {
  test.use({ timezoneId: 'UTC' });
  test('G4 VM024 UTC Monday boundary remains Monday', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-26T00:30:00Z'));
    const { client, uid } = await g4Account(page, 1440, 'week-utc');
    const before = await g4Snapshot(client.db, uid);
    await expect(page.locator('header').getByText(/^Week of .* - Planning$/)).toHaveText('Week of Oct 26 - Planning');
    expect(await g4Snapshot(client.db, uid)).toEqual(before);
  });
});

test.describe('G3 recipe images', () => {
  // A real, decoded 32x32 PNG. No ignored local export or private fixture required.
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR4nGOoSNlCU8QwasGoBaMWjFowasGoBaMWjFowasGoBaMWDBULAFSLQFujbhvWAAAAAElFTkSuQmCC', 'base64');
  const legacyUrl = 'https://images.unsplash.com/g3-legacy-image.png';

  async function imageAccount(page: Page, width: number, label: string) {
    const client = createFirebaseClient('g3-image');
    const email = `qa-g3-${label}-${width}-${Date.now()}@example.com`;
    const { user } = await createUserWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
    await setDoc(doc(client.db, 'users', user.uid), {
      settings: {
        onboardingCompleted: true, measurementUnit: 'imperial', dailyCalorieTarget: 2000,
        macroSplit: { protein: 30, carbs: 35, fat: 35 }, dietaryTags: [], allergies: [], phase: 'maintenance',
      },
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto('/auth');
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^Log In$/ }).last().click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(page.getByRole('heading', { name: 'Hydration', exact: true })).toBeVisible();
    return { client, uid: user.uid };
  }

  async function imageGuard(page: Page) {
    const violations: string[] = [];
    const attempted: string[] = [];
    const failures = collectConsoleFailures(page);
    await page.exposeBinding('__g3ImageViolation', (_source, blocked: string) => { violations.push(blocked); });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        if (event.effectiveDirective === 'img-src' && event.disposition === 'enforce') {
          void (window as unknown as { __g3ImageViolation: (blocked: string) => Promise<void> })
            .__g3ImageViolation(event.blockedURI);
        }
      });
    });
    // A test must never send the synthetic legacy/unsupported URL to a real host,
    // even if a future change accidentally relaxes the app's CSP.
    await page.route('**/images.unsplash.com/g3-*', route => { attempted.push(route.request().url()); return route.abort(); });
    await page.route('**/g3-external.example.invalid/**', route => { attempted.push(route.request().url()); return route.abort(); });
    await page.route('**://*.googleapis.com/g3-image.png', route => { attempted.push(route.request().url()); return route.abort(); });
    return () => {
      expect(violations, 'image rendering should not rely on CSP rejection').toEqual([]);
      expect(attempted, 'unsupported images must not be requested').toEqual([]);
      expect(failures).toEqual([]);
    };
  }

  async function assertDecodedImage(page: Page, scope: string, title: string, url: string) {
    const image = page.locator(scope).getByRole('img', { name: title, exact: true });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', url);
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }

  async function openRecipeDetail(page: Page, title: string) {
    await page.getByRole('heading', { name: title, exact: true }).click();
    await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
  }

  async function returnFromCooking(page: Page) {
    await page.getByRole('button', { name: /close Exit/ }).click();
    await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
  }

  for (const width of [1440, 390]) {
    test(`legacy library readers use a visible fallback at ${width}px`, async ({ page }) => {
      const { client, uid } = await imageAccount(page, width, 'legacy');
      const verifyGuard = await imageGuard(page);
      const title = `G3 Legacy ${width}`;
      const id = await seedRecipe(client.db, uid, title, {
        imageUrl: legacyUrl, micronutrients: { vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0 },
      });
      const recipeRef = doc(client.db, 'users', uid, 'recipes', id);
      const before = (await getDoc(recipeRef)).data()!;
      await page.goto('/recipes');
      await expect(page.getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await openRecipeDetail(page, title);
      await expect(page.locator('main').last().getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.locator('main').last().getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await returnFromCooking(page);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      await expect(page.locator('form').getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await expect(page.locator('form img')).toHaveCount(0);
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      const saved = (await getDoc(recipeRef)).data()!;
      const beforeFields = { ...before }; delete beforeFields.updatedAt;
      const savedFields = { ...saved }; delete savedFields.updatedAt;
      expect(savedFields).toEqual(beforeFields);
      await page.reload();
      await openRecipeDetail(page, title);
      await expect(page.locator('main').last().getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      verifyGuard();
    });

    test(`planner fetched and synthesized details respect image policy at ${width}px`, async ({ page }) => {
      const { client, uid } = await imageAccount(page, width, 'planner');
      const verifyGuard = await imageGuard(page);
      const title = `G3 Planned ${width}`;
      const missingTitle = `G3 Missing ${width}`;
      const id = await seedRecipe(client.db, uid, title, { imageUrl: legacyUrl });
      const pickerTitle = `G3 Breakfast ${width}`;
      await seedRecipe(client.db, uid, pickerTitle, { imageUrl: legacyUrl, mealType: 'breakfast', folders: ['breakfast'] });
      const planId = await seedCurrentMealPlan(client.db, uid, id, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals[0].imageUrl = legacyUrl;
      plan.days[0].meals.push({ ...plan.days[0].meals[0], id: 'g3-missing-meal', recipeId: 'g3-missing-recipe', name: missingTitle, type: 'lunch' });
      await setDoc(planRef, plan);
      await page.goto('/plan');
      await settlePlanner(page);
      await expect(page.locator('[style*="images.unsplash.com"]')).toHaveCount(0);
      await page.getByRole('heading', { name: title, exact: true }).click();
      await expect(page.locator('main').last().getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.locator('main').last().getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await returnFromCooking(page);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.getByRole('heading', { name: missingTitle, exact: true }).click();
      await expect(page.locator('main').last().getByRole('img', { name: `${missingTitle} — no photo`, exact: true })).toBeVisible();
      // The synthesized recipe has no instructions. Its cooking crash is VM029/G7,
      // so this image test covers that detail path without exercising the defect.
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.getByText('Add Breakfast', { exact: true }).first().click();
      await expect(page.getByPlaceholder('Search...', { exact: true })).toBeVisible();
      await expect(page.getByRole('img', { name: `${pickerTitle} — no photo`, exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      await page.reload();
      await settlePlanner(page);
      await page.getByRole('heading', { name: title, exact: true }).click();
      await expect(page.locator('main').last().getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      expect((await getDoc(doc(client.db, 'users', uid, 'recipes', id))).data()?.imageUrl).toBe(legacyUrl);
      expect((await getDoc(planRef)).data()).toEqual(plan);
      verifyGuard();
    });

    test(`unsaved normalized network paths and wrong protocols are rejected at ${width}px`, async ({ page }) => {
      await imageAccount(page, width, 'protocols');
      const verifyGuard = await imageGuard(page);
      const title = `G3 Unsaved ${width}`;
      await page.goto('/recipes');
      await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
      await page.getByLabel('Recipe Name *', { exact: true }).fill(title);
      const imageUrl = page.getByLabel('Recipe Image', { exact: true });
      for (const unsupported of [
        '//g3-external.example.invalid/image.png', '/\\g3-external.example.invalid/image.png',
        '/\t/g3-external.example.invalid/image.png', '/\n/g3-external.example.invalid/image.png',
        'http://firebasestorage.googleapis.com/g3-image.png', 'ftp://storage.googleapis.com/g3-image.png',
      ]) {
        if (unsupported.includes('\n')) {
          // fill() changes LF to a space. This DOM fixture uses the browser's
          // native single-line sanitization; it is not a human-paste assertion.
          await imageUrl.evaluate((input, raw) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, raw);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }, unsupported);
          await expect(imageUrl).toHaveValue(unsupported.replace(/\n/g, ''));
        } else {
          await imageUrl.fill(unsupported);
          await expect(imageUrl).toHaveValue(unsupported);
        }
        await expect(page.locator('form').getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
        await expect(page.locator('form img')).toHaveCount(0);
      }
      const dataImage = `data:image/png;base64,${pngBytes.toString('base64')}`;
      const blobImage = await page.evaluate((data) => {
        const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
        return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
      }, pngBytes.toString('base64'));
      for (const supported of ['/vite.svg?g3=image#preview', dataImage, blobImage]) {
        await imageUrl.fill(supported);
        await assertDecodedImage(page, 'form', title, supported);
      }
      await imageUrl.fill('');
      await page.evaluate(url => URL.revokeObjectURL(url), blobImage);
      const discardRecipe = acceptNextDialog(page);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await discardRecipe;
      verifyGuard();
    });

    test(`valid Storage images recover after an unsupported preview and survive save reload at ${width}px`, async ({ page }) => {
      const { client, uid } = await imageAccount(page, width, 'positive');
      const verifyGuard = await imageGuard(page);
      const title = `G3 Positive ${width}`;
      const id = await seedRecipe(client.db, uid, title, { imageUrl: legacyUrl });
      const imageRef = ref(client.storage, `users/${uid}/recipes/g3-positive.png`);
      await uploadBytes(imageRef, pngBytes, { contentType: 'image/png' });
      const url = await getDownloadURL(imageRef);
      expect(new URL(url).origin).toBe(`http://${readEmulatorConfig().host}:${readEmulatorConfig().ports.storage}`);
      await page.goto('/recipes');
      await page.getByRole('button', { name: `Edit recipe: ${title}`, exact: true }).click();
      // Let the original failed image finish. This also succeeds for a safe
      // fallback, which has no img element, without requiring the old behavior.
      await expect.poll(() => page.locator('form img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete))).toBe(true);
      await page.getByLabel('Recipe Image', { exact: true }).fill(url);
      const preview = page.locator('form img');
      await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(32);
      await expect(preview).toBeVisible();
      await expect(preview).toHaveAttribute('alt', title);
      await page.getByLabel('Recipe Image', { exact: true }).fill('//g3-external.example.invalid/image.png');
      await expect(page.locator('form').getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await page.getByLabel('Recipe Image', { exact: true }).fill(url);
      await assertDecodedImage(page, 'form', title, url);
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      expect((await getDoc(doc(client.db, 'users', uid, 'recipes', id))).data()?.imageUrl).toBe(url);
      await page.reload();
      await assertDecodedImage(page, 'main', title, url);
      await openRecipeDetail(page, title);
      await assertDecodedImage(page, 'main main', title, url);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await assertDecodedImage(page, 'main main', title, url);
      await returnFromCooking(page);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      const planId = await seedCurrentMealPlan(client.db, uid, id, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals[0].imageUrl = url;
      await setDoc(planRef, plan);
      await page.goto('/plan');
      await settlePlanner(page);
      await expect(page.locator('[style*="background-image"]')).toHaveCount(1);
      await expect(page.locator('[style*="background-image"]')).toHaveCSS('background-image', `url("${url}")`);
      await page.getByRole('heading', { name: title, exact: true }).click();
      await assertDecodedImage(page, 'main main', title, url);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await assertDecodedImage(page, 'main main', title, url);
      verifyGuard();
    });
  }

});

// G5: simulate UI availability only in these two tests. The app's runtime AI
// flags stay unset; every callable is intercepted before the wizard is enabled.
test.describe('G5 mocked plan recipe identity', () => {
  for (const width of [1440, 390]) {
    test(`G5 minimal payload and recipe IDs survive hydration, reload and groceries at ${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      const failures = collectConsoleFailures(page, [/Error calling AI service/, /Generation failed/]);
      const client = createFirebaseClient(`g5-${width}`);
      const email = `g5-contract-${width}-${Date.now()}@example.test`;
      await createBrowserUser(page, email);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const { user } = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
      const uid = user.uid;
      const title = `G5 same title ${width}`;
      const recipeA = await seedRecipe(client.db, uid, title, {
        ingredients: [{ item: 'G5 Rice', quantity: '2', unit: 'cup', swaps: [] }],
        instructions: [{ step: 'G5 cook the rice identity A.', timer: 60 }],
      });
      const recipeB = await seedRecipe(client.db, uid, title, {
        ingredients: [{ item: 'G5 Beans', quantity: '8', unit: 'oz', swaps: [] }],
        instructions: [{ step: 'G5 heat the beans identity B.', timer: 60 }],
      });
      await setDoc(doc(client.db, 'users', uid, 'groceryItems', 'g5-manual'), {
        name: 'G5 Manual Sentinel', quantity: 3, unit: 'oz', aisle: 'Pantry', source: 'manual', isChecked: true,
      });
      await setDoc(doc(client.db, 'users', uid, 'groceryItems', 'g5-checked-rice'), {
        name: 'G5 Rice', quantity: 9, unit: 'cup', aisle: 'Pantry', source: 'generated', isChecked: true,
      });
      await page.addInitScript(() => window.sessionStorage.setItem('viomacro:meal-planner:viewDate', JSON.stringify({ week: '2030-01-07', at: Date.now() })));
      let reject = false;
      let calls = 0;
      await enableMockAi(page);
      await page.route('**/viomacro/us-central1/*', async route => {
        expect(route.request().url()).toMatch(/\/generateMealPlan$/);
        const data = route.request().postDataJSON().data;
        calls++;
        expect(data.preferences.includeSnacks).toBe(false);
        expect(data.userRecipes.map((recipe: { id: string }) => recipe.id).sort()).toEqual([recipeA, recipeB].sort());
        for (const recipe of data.userRecipes) expect(Object.keys(recipe).sort()).toEqual(['id', 'mealType', 'title']);
        expect(isValidAiRequestId(data.requestId)).toBe(true);
        if (reject) {
          await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { status: 'INTERNAL', message: 'Mock server rejected invalid recipe reference' } }) });
          return;
        }
        const meal = (recipeId: string | null, type: string) => ({ recipeId, type, name: recipeId ? title : 'G5 generic tea', calories: 400, protein: 30, carbs: 40, fat: 12 });
        await fulfillCallable(route, { goal: 'G5 mocked draft', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, i) => ({ dayName, meals: i ? [] : [meal(recipeA, 'breakfast'), meal(recipeB, 'lunch'), meal(recipeA, 'dinner'), meal(null, 'tea')] })) });
      });
      await page.goto('/plan'); await settlePlanner(page);
      if (!(await page.getByRole('button', { name: 'Open Plan Wizard' }).isVisible().catch(() => false))) {
        await page.getByRole('button', { name: 'Create New Plan' }).click();
      }
      await page.getByRole('button', { name: 'Open Plan Wizard' }).click();
      await page.getByRole('checkbox', { name: /Include Snacks/ }).uncheck();
      await page.getByRole('button', { name: 'Auto-Generate Week' }).click();
      await expect(page.getByRole('alert')).toContainText('Generated a draft');
      await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(3);
      // A later rejected response cannot discard this unsaved valid draft.
      reject = true;
      await page.getByRole('button', { name: /Plan Week$/ }).click();
      await page.getByRole('checkbox', { name: /Include Snacks/ }).uncheck();
      await page.getByRole('button', { name: 'Auto-Generate Week' }).click();
      await expect(page.getByRole('alert')).toContainText('Mock server rejected');
      await page.getByRole('heading', { name: 'Create Your Week Plan', exact: true }).locator('..').locator('..').locator('..').click({ position: { x: 2, y: 2 } });
      await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(3);
      await page.getByRole('button', { name: /Confirm Plan/ }).click();
      await expect(page.getByRole('button', { name: /Saved!/ })).toBeVisible();
      const planSnapshot = await getDocs(collection(client.db, 'users', uid, 'mealPlans'));
      const plans = planSnapshot.docs.map(doc => doc.data());
      await setDoc(doc(client.db, 'users', uid, 'groceryItems', 'g5-checked-rice'), {
        mealPlanId: planSnapshot.docs[0].id,
      }, { merge: true });
      expect(plans).toHaveLength(1);
      const savedMeals = plans[0].days[0].meals;
      expect(savedMeals.map((meal: { recipeId?: string }) => meal.recipeId)).toEqual([recipeA, recipeB, recipeA, undefined]);
      expect(new Set(savedMeals.map((meal: { id: string }) => meal.id)).size).toBe(4);
      for (const meal of savedMeals) expect([recipeA, recipeB]).not.toContain(meal.id);
      await page.reload(); await settlePlanner(page);
      await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(3);
      await page.getByRole('heading', { name: title, exact: true }).nth(1).click();
      await expect(page.getByText('8 oz G5 Beans', { exact: true })).toBeVisible();
      await expect(page.getByText('G5 heat the beans identity B.', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.getByText('G5 heat the beans identity B.', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Exit/ }).click();
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.getByRole('button', { name: 'Add to List', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Added');
      const groceries = (await getDocs(collection(client.db, 'users', uid, 'groceryItems'))).docs.map(doc => doc.data());
      expect(groceries).toHaveLength(3);
      expect(groceries).toContainEqual(expect.objectContaining({ name: 'G5 Manual Sentinel', quantity: 3, isChecked: true, source: 'manual' }));
      expect(groceries).toContainEqual(expect.objectContaining({ name: 'G5 Rice', quantity: 1, unit: 'cups', isChecked: true }));
      expect(groceries).toContainEqual(expect.objectContaining({ name: 'G5 Beans', quantity: 2, unit: 'oz', isChecked: false }));
      expect(calls).toBe(2);
      expect(failures).toEqual([]);
    });
  }
});

// G7 exercises the real shared cooking UI through its two normal callers.
type G7Caller = 'Library' | 'Planner';

async function g7OpenCaller(page: Page, caller: G7Caller) {
  await page.goto(caller === 'Library' ? '/recipes' : '/plan');
  if (caller === 'Planner') await settlePlanner(page);
}

async function g7SeedPlanEntries(db: Firestore, uid: string, recipes: { id: string; title: string }[]) {
  const [first, ...rest] = recipes;
  const planId = await seedCurrentMealPlan(db, uid, first.id, first.title);
  if (rest.length) {
    const planRef = doc(db, 'users', uid, 'mealPlans', planId);
    const plan = (await getDoc(planRef)).data()!;
    for (const recipe of rest) {
      plan.days[0].meals.push({
        ...plan.days[0].meals[0], id: `g7-meal-${recipe.id}`,
        recipeId: recipe.id, name: recipe.title, type: 'lunch',
      });
    }
    await setDoc(planRef, plan);
  }
  return planId;
}

async function g7AssertWarningClear(page: Page, control: Locator) {
  await control.scrollIntoViewIfNeeded();
  const warning = page.locator('.firebase-emulator-warning');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('Running in emulator mode. Do not use with production credentials.');
  const bounds = await control.evaluate(button => {
    const b = button.getBoundingClientRect();
    const w = document.querySelector('.firebase-emulator-warning')!.getBoundingClientRect();
    const center = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return {
      warningHeight: w.height, buttonBottom: b.bottom, buttonTop: b.top,
      buttonLeft: b.left, buttonRight: b.right, viewportWidth: window.innerWidth, warningTop: w.top,
      overlap: Math.max(0, Math.min(b.right, w.right) - Math.max(b.left, w.left)) * Math.max(0, Math.min(b.bottom, w.bottom) - Math.max(b.top, w.top)),
      centerHitsButton: !!center && (center === button || button.contains(center)),
    };
  });
  expect(bounds.warningHeight).toBeGreaterThan(0);
  expect(bounds.overlap, 'real Auth-emulator warning must not cover cooking controls').toBeLessThanOrEqual(1);
  expect(bounds.buttonBottom).toBeLessThanOrEqual(bounds.warningTop + 1);
  expect(bounds.buttonTop).toBeGreaterThanOrEqual(-1);
  expect(bounds.buttonLeft).toBeGreaterThanOrEqual(-1);
  expect(bounds.buttonRight).toBeLessThanOrEqual(bounds.viewportWidth + 1);
  expect(bounds.centerHitsButton, 'ordinary button center must receive a click').toBe(true);
}

async function g7ExpectDetail(page: Page, title: string, empty = false) {
  await expect(page.getByRole('button', { name: /Start Guided Cooking/ })).toBeVisible();
  const detail = page.locator('main').last();
  await expect(detail.getByRole('heading', { name: title, exact: true })).toBeVisible();
  if (empty) {
    const fallback = detail.getByText('No preparation steps available for this recipe.', { exact: true });
    await fallback.scrollIntoViewIfNeeded();
    await expect(fallback).toBeVisible();
    await expect(detail.getByRole('heading', { name: 'No Instructions', exact: true })).toBeVisible();
  }
}

async function g7ExpectEmptyCooking(page: Page) {
  const cooking = page.locator('main').last();
  await expect(cooking.getByText('No instructions available', { exact: true })).toBeVisible();
  await expect(cooking.getByText('Cooking Progress', { exact: true })).toHaveCount(0);
  await expect(cooking.getByText('Step Timer', { exact: true })).toHaveCount(0);
  await expect(cooking.getByRole('heading', { name: /^(Step \d+|Start Cooking)$/ })).toHaveCount(0);
  await expect(cooking.getByText(/Step\s+\d+\s+of\s+0/)).toHaveCount(0);
  await expect(cooking.getByRole('button', { name: /Previous|Next Step|Finish|step timer/ })).toHaveCount(0);
  const back = cooking.getByRole('button', { name: 'Back to recipe', exact: true });
  await expect(back).toBeEnabled();
  await g7AssertWarningClear(page, back);
  const exit = page.getByRole('button', { name: /Exit$/ });
  await expect(exit).toBeEnabled();
  await g7AssertWarningClear(page, exit);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  return back;
}

function g7Timer(page: Page) {
  const panel = page.locator('main').last().getByText('Step Timer', { exact: true }).locator('..').locator('..').locator('..');
  return {
    display: panel.locator('span').filter({ hasText: /^\d{2}:\d{2}(?:\.\d+)?$/ }),
    start: panel.getByRole('button', { name: 'Start step timer', exact: true }),
    pause: panel.getByRole('button', { name: 'Pause step timer', exact: true }),
    reset: panel.getByRole('button', { name: 'Reset step timer', exact: true }),
  };
}

test.describe('G7 guided cooking supported saved recipes and real caller lifecycles', () => {
  test.setTimeout(90_000);

  for (const width of [1440, 390]) for (const caller of ['Library', 'Planner'] as const) {
    test(`G7 VM029 ${caller} empty and omitted instructions return honestly at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, `g7-empty-${caller.toLowerCase()}`);
      const fixtures: { id: string; title: string; omitted: boolean }[] = [];
      for (const omitted of [false, true]) {
        const title = `G7 ${caller} ${omitted ? 'Omitted' : 'Empty'} ${width}`;
        const id = await seedRecipe(client.db, uid, title, { instructions: omitted ? undefined : [] });
        const saved = (await getDoc(doc(client.db, 'users', uid, 'recipes', id))).data()!;
        expect(Object.hasOwn(saved, 'instructions')).toBe(!omitted);
        if (!omitted) expect(saved.instructions).toEqual([]);
        fixtures.push({ id, title, omitted });
      }
      if (caller === 'Planner') await g7SeedPlanEntries(client.db, uid, fixtures);
      await g7OpenCaller(page, caller);
      const before = await g4Snapshot(client.db, uid);

      for (const fixture of fixtures) {
        await g4OpenDetail(page, fixture.title);
        // Enter first so an empty Detail section cannot mask the Cooking crash.
        await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
        const back = await g7ExpectEmptyCooking(page);
        await g7AssertWarningClear(page, back);
        await back.click();
        await g7ExpectDetail(page, fixture.title, true);
        expect(await g4Snapshot(client.db, uid)).toEqual(before);

        // Both the local return action and the existing header Exit must work.
        await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
        await g7ExpectEmptyCooking(page);
        await page.getByRole('button', { name: /Exit$/ }).click();
        await g7ExpectDetail(page, fixture.title, true);
        await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
        await page.reload();
        if (caller === 'Planner') await settlePlanner(page);
        await g4OpenDetail(page, fixture.title);
        await g7ExpectDetail(page, fixture.title, true);
        const saved = (await getDoc(doc(client.db, 'users', uid, 'recipes', fixture.id))).data()!;
        expect(Object.hasOwn(saved, 'instructions')).toBe(!fixture.omitted);
        if (!fixture.omitted) expect(saved.instructions).toEqual([]);
        expect(await g4Snapshot(client.db, uid)).toEqual(before);
        await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      }
      expect(failures).toEqual([]);
    });
  }

  for (const width of [1440, 390]) {
    test(`G7 VM029 Planner missing recipe fallback stays absent and returns safely at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g7-missing-planner');
      const title = `G7 Missing Planner Recipe ${width}`;
      const missingId = `g7-absent-recipe-${width}`;
      const missingRef = doc(client.db, 'users', uid, 'recipes', missingId);
      await seedCurrentMealPlan(client.db, uid, missingId, title);
      expect((await getDoc(missingRef)).exists()).toBe(false);
      await g7OpenCaller(page, 'Planner');
      const before = await g4Snapshot(client.db, uid);
      expect(before.collections.recipes).toEqual([]);
      await g4OpenDetail(page, title);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      const back = await g7ExpectEmptyCooking(page);
      await g7AssertWarningClear(page, back);
      await back.click();
      await g7ExpectDetail(page, title, true);
      expect((await getDoc(missingRef)).exists()).toBe(false);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await g7ExpectEmptyCooking(page);
      await page.getByRole('button', { name: /Exit$/ }).click();
      await g7ExpectDetail(page, title, true);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.reload(); await settlePlanner(page);
      await g4OpenDetail(page, title);
      await g7ExpectDetail(page, title, true);
      expect((await getDoc(missingRef)).exists()).toBe(false);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });
  }

  for (const width of [1440, 390]) for (const caller of ['Library', 'Planner'] as const) {
    test(`G7 VM030 VM032 ${caller} first duration countdown lifecycle and Replay honesty at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      // Start at the real current time so the clock cannot invalidate Auth tokens.
      // Let Auth, Firestore and the rendered UI settle while time runs normally.
      await page.clock.install({ time: new Date() });
      const { client, uid } = await g4Account(page, width, `g7-timer-${caller.toLowerCase()}`);
      const auxImageUrl = new URL('/vite.svg?g7=decimal', page.url()).href;
      const title = `G7 ${caller} Timed ${width}`;
      const auxTitle = `G7 ${caller} Decimal ${width}`;
      const ingredients = [
        { item: 'Chicken', quantity: '24', unit: 'oz' },
        { item: 'Blueberries', amount: '1 cup' },
      ];
      const instructions = [
        { step: 'Mix Chicken and Blueberries.', timer: 120, note: 'Keep the first instruction metadata.' },
        { step: 'Rest the Chicken.', timer: 60, temperature: 180 },
        { step: 'Serve the Chicken.', timer: 30 },
      ];
      const auxInstructions = [
        { step: 'Rest the Chicken briefly.', timer: 45.5, note: 'Preserve the saved decimal duration.', temperature: 180 },
        { step: 'Mix the Blueberries.', timer: 0, note: 'A saved zero stays zero.' },
        { step: 'Serve the Chicken.', note: 'This timer field is genuinely omitted.' },
      ];
      const id = await seedRecipe(client.db, uid, title, {
        servings: 4, cookTime: 30.5, calories: 520.25, protein: 42.5, carbs: 55.75, fat: 14.25,
        ingredients, instructions,
      });
      const auxId = await seedRecipe(client.db, uid, auxTitle, {
        servings: 4, ingredients, instructions: auxInstructions, imageUrl: auxImageUrl,
        micronutrients: { vitaminA: 0, vitaminC: 1.25, calcium: 2.75, iron: 0.4 },
      });
      const savedAux = (await getDoc(doc(client.db, 'users', uid, 'recipes', auxId))).data()!;
      expect(savedAux.instructions).toEqual(auxInstructions);
      expect(Object.hasOwn(savedAux.instructions[2], 'timer')).toBe(false);
      if (caller === 'Planner') await g7SeedPlanEntries(client.db, uid, [{ id, title }, { id: auxId, title: auxTitle }]);
      await g7OpenCaller(page, caller);
      const before = await g4Snapshot(client.db, uid);
      await g4OpenDetail(page, title);
      const increase = page.getByRole('button', { name: 'Increase servings', exact: true });
      await increase.click(); await increase.click();
      await expect(page.getByRole('checkbox', { name: '36 oz Chicken', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 1/2 cup Blueberries', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      const cooking = page.locator('main').last();
      await expect(cooking.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
      await expect(cooking.getByRole('list').locator('li').filter({ hasText: 'Chicken' })).toContainText('36 oz');
      await expect(cooking.getByRole('list').locator('li').filter({ hasText: 'Blueberries' })).toContainText('1 1/2 cup');
      const tooltip = cooking.locator('span[class*="group/tooltip"]').filter({ hasText: /^Chicken/ });
      await tooltip.hover();
      await expect(tooltip.locator('span')).toHaveText('36 oz Chicken');
      await expect(tooltip.locator('span')).toHaveCSS('opacity', '1');
      await expect(cooking.getByRole('img', { name: `${title} — no photo`, exact: true })).toBeVisible();
      await expect(cooking.locator('img')).toHaveCount(0);

      const timer = g7Timer(page);
      await timer.display.scrollIntoViewIfNeeded();
      // The regression assertion precedes every Reset, Next and Start action.
      await expect(timer.display).toHaveText('02:00');
      await expect(timer.start).toBeVisible();
      await expect(timer.pause).toHaveCount(0);
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      await page.clock.runFor(3000);
      await expect(timer.display).toHaveText('02:00');
      await expect(timer.start).toBeVisible();

      const replay = cooking.getByRole('button', { name: /Replay Video/ });
      await expect(replay).toBeDisabled();
      await expect(replay.getByText(/Coming Soon/i)).toBeVisible();
      await expect(cooking.locator('video')).toHaveCount(0);
      const fullRecipe = page.getByRole('button', { name: /^(?:menu_book\s+)?Full Recipe$/ });
      if (width === 390) await expect(fullRecipe).toBeHidden();
      else await expect(fullRecipe).toBeVisible();
      const next = cooking.getByRole('button', { name: /Next Step/ });
      const previous = cooking.getByRole('button', { name: /Previous/ });
      await expect(previous).toBeDisabled();
      await g7AssertWarningClear(page, timer.start);
      await timer.start.click();
      await expect(timer.pause).toBeVisible();
      await page.clock.runFor(2000);
      await expect(timer.display).toHaveText('01:58');
      await g7AssertWarningClear(page, timer.pause);
      await timer.pause.click();
      await expect(timer.start).toBeVisible();
      await page.clock.runFor(3000);
      await expect(timer.display).toHaveText('01:58');
      await g7AssertWarningClear(page, timer.reset);
      await timer.reset.click();
      await expect(timer.display).toHaveText('02:00');
      await expect(timer.start).toBeVisible();
      await expect(timer.pause).toHaveCount(0);

      // Changing steps must also stop an already running countdown.
      await timer.start.click(); await page.clock.runFor(1000);
      await expect(timer.display).toHaveText('01:59');
      await g7AssertWarningClear(page, next); await next.click();
      await expect(cooking.getByRole('heading', { name: 'Step 2', exact: true })).toBeVisible();
      await expect(timer.display).toHaveText('01:00');
      await expect(timer.start).toBeVisible();
      await page.clock.runFor(2000); await expect(timer.display).toHaveText('01:00');
      await timer.start.click(); await page.clock.runFor(1000);
      await expect(timer.display).toHaveText('00:59');
      await g7AssertWarningClear(page, previous); await previous.click();
      await expect(cooking.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
      await expect(timer.display).toHaveText('02:00');
      await expect(timer.start).toBeVisible();
      await expect(previous).toBeDisabled();
      await page.clock.runFor(2000); await expect(timer.display).toHaveText('02:00');
      await g7AssertWarningClear(page, next); await next.click();
      await expect(timer.display).toHaveText('01:00');
      await g7AssertWarningClear(page, next); await next.click();
      await expect(cooking.getByRole('heading', { name: 'Step 3', exact: true })).toBeVisible();
      await expect(timer.display).toHaveText('00:30');
      await expect(timer.start).toBeVisible();
      await timer.start.click(); await page.clock.runFor(1000);
      await expect(timer.display).toHaveText('00:29');
      const finish = cooking.getByRole('button', { name: /Finish/ });
      await g7AssertWarningClear(page, finish); await finish.click();
      await g7ExpectDetail(page, title);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);

      await page.clock.runFor(3000); // Finished Cooking is unmounted.
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(timer.display).toHaveText('02:00');
      await expect(timer.start).toBeVisible();
      await page.clock.runFor(3000); await expect(timer.display).toHaveText('02:00');
      await timer.start.click(); await page.clock.runFor(2000);
      await expect(timer.display).toHaveText('01:58');
      const exit = page.getByRole('button', { name: /Exit$/ });
      await g7AssertWarningClear(page, exit); await exit.click();
      await g7ExpectDetail(page, title);
      await page.clock.runFor(3000); // Exited Cooking is unmounted.
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(timer.display).toHaveText('02:00');
      await expect(timer.start).toBeVisible();
      await expect(timer.pause).toHaveCount(0);
      await page.clock.runFor(3000); await expect(timer.display).toHaveText('02:00');
      await exit.click(); await g7ExpectDetail(page, title);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);

      // A different recipe must use its own first duration, without rounding it.
      await page.clock.resume();
      await g4OpenDetail(page, auxTitle);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(cooking.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
      const image = cooking.getByRole('img', { name: auxTitle, exact: true });
      await expect(image).toHaveAttribute('src', auxImageUrl);
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
      await expect(timer.display).toHaveText('00:45.5');
      await expect(timer.start).toBeVisible();
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      await page.clock.runFor(2000); await expect(timer.display).toHaveText('00:45.5');
      await g7AssertWarningClear(page, next); await next.click();
      await expect(timer.display).toHaveText('00:00');
      await expect(timer.start).toBeVisible();
      await page.clock.runFor(2000); await expect(timer.display).toHaveText('00:00');
      await g7AssertWarningClear(page, previous); await previous.click();
      await expect(timer.display).toHaveText('00:45.5');
      await expect(timer.start).toBeVisible();
      await next.click(); await next.click();
      await expect(cooking.getByRole('heading', { name: 'Step 3', exact: true })).toBeVisible();
      await expect(timer.display).toHaveText('00:00');
      await expect(timer.start).toBeVisible();
      await page.clock.runFor(2000); await expect(timer.display).toHaveText('00:00');
      await g7AssertWarningClear(page, finish); await finish.click();
      await g7ExpectDetail(page, auxTitle);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.clock.resume();
      await page.reload();
      if (caller === 'Planner') await settlePlanner(page);
      await g4OpenDetail(page, title);
      await g7ExpectDetail(page, title);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(failures).toEqual([]);
    });
  }

  for (const caller of ['Library', 'Planner'] as const) {
    test(`G7 VM032 ${caller} desktop Full Recipe returns to the selected detail independently of timer initialization`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, 1440, `g7-full-${caller.toLowerCase()}`);
      const title = `G7 ${caller} Full Recipe`;
      const id = await seedRecipe(client.db, uid, title, {
        servings: 4, ingredients: [{ item: 'Rice', quantity: '4', unit: 'Cup' }],
        instructions: [{ step: 'Mix the Rice.', timer: 120, note: 'Full Recipe is read-only.' }],
      });
      if (caller === 'Planner') await seedCurrentMealPlan(client.db, uid, id, title);
      await g7OpenCaller(page, caller);
      const before = await g4Snapshot(client.db, uid);
      await g4OpenDetail(page, title);
      await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.locator('main').last().getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
      // No timer assertion or Reset can mask this independent callback failure.
      const fullRecipe = page.getByRole('button', { name: /^(?:menu_book\s+)?Full Recipe$/ });
      await expect(fullRecipe).toBeEnabled();
      await g7AssertWarningClear(page, fullRecipe);
      await fullRecipe.click();
      await g7ExpectDetail(page, title);
      await expect(fullRecipe).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Exit$/ })).toHaveCount(0);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      // Existing caller semantics remount Detail; no serving-resume policy is added.
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.reload();
      if (caller === 'Planner') await settlePlanner(page);
      await g4OpenDetail(page, title);
      await g7ExpectDetail(page, title);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });
  }
});


// G8 uses real authenticated client writes and the normal Add to List workflow.
// Literal package/count expectations are independent of the production key.
async function g8GrocerySnapshot(db: Firestore, uid: string) {
  return (await getDocs(collection(db, 'users', uid, 'groceryItems'))).docs
    .map(record => ({ id: record.id, data: record.data() }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function g8SeedSentinels(db: Firestore, uid: string) {
  await setDoc(doc(db, 'users', uid, 'groceryItems', 'g8-manual'), {
    name: 'G8 manual sentinel', quantity: 7.125, unit: 'can (14 oz)',
    aisle: 'Pantry', isChecked: true, source: 'manual',
    createdAt: Timestamp.fromMillis(1_790_000_000_000), updatedAt: Timestamp.fromMillis(1_790_000_000_001),
  });
  await setDoc(doc(db, 'users', uid, 'groceryItems', 'g8-legacy'), {
    name: 'G8 legacy sentinel', quantity: 2.75, unit: '(28 oz) cans',
    aisle: 'Other', isChecked: false, createdAt: Timestamp.fromMillis(1_790_000_000_002),
  });
  return g8GrocerySnapshot(db, uid);
}

async function g8AddToList(page: Page) {
  await page.goto('/plan');
  await settlePlanner(page);
  await page.getByRole('button', { name: 'Add to List', exact: true }).click();
  const notice = page.getByRole('alert').locator('p');
  // This success boundary follows the real atomic write and store refresh.
  await expect(notice).toHaveText(/^Added \d+ items to your shopping list\.$/);
  return notice.textContent();
}

async function g8GroceryReload(page: Page, db: Firestore, uid: string) {
  const readRendered = () => page.getByRole('button', { name: /^Mark as (?:not )?purchased:/ }).evaluateAll(buttons =>
    buttons.map(button => ({
      name: button.parentElement!.querySelector('h4')!.textContent!.trim(),
      amount: button.parentElement!.querySelector('p')!.textContent!.trim(),
      checked: button.getAttribute('aria-pressed') === 'true',
    })));
  await page.goto('/grocery');
  await expect(page.getByRole('heading', { name: 'G8 manual sentinel', exact: true })).toBeVisible();
  const rendered = await readRendered();
  const saved = await g8GrocerySnapshot(db, uid);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'G8 manual sentinel', exact: true })).toBeVisible();
  expect(await g8GrocerySnapshot(db, uid)).toEqual(saved);
  expect(await readRendered()).toEqual(rendered);
  return rendered;
}

test.describe('G8 VM037 equivalent package identity through normal grocery workflows', () => {
  // Initial RED budget: auth, base/scaled recipe and cooking, two plan loads,
  // two real generations, and two Grocery reloads. Existing budgets stay intact.
  test.setTimeout(90_000);

  for (const width of [1440, 390]) {
    test(`G8 VM037 mixed package counts combine before rounding at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g8-aggregate');
      const title = `G8 mixed packages ${width}`;
      const recipeId = await seedRecipe(client.db, uid, title, {
        mealType: 'dinner', servings: 4,
        ingredients: [
          { item: 'Tomatoes', amount: '1 (14 oz) can' },
          { item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' },
          { item: 'Tomatoes', amount: '1 (28 oz) can' },
          { item: 'Rice', quantity: '3', unit: 'cups' },
        ],
        instructions: [{ step: 'Combine the tomatoes and rice.', timer: 0 }],
      });
      const recipeRef = doc(client.db, 'users', uid, 'recipes', recipeId);
      const originalRecipe = (await getDoc(recipeRef)).data();
      const planId = await seedCurrentMealPlan(client.db, uid, recipeId, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const originalPlan = (await getDoc(planRef)).data()!;
      const sentinels = await g8SeedSentinels(client.db, uid);

      await page.goto('/recipes');
      await g4OpenDetail(page, title);
      await expect(page.getByRole('checkbox', { name: '1 (14 oz) can Tomatoes', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 can (14 oz) Tomatoes', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 (28 oz) can Tomatoes', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.getByRole('list').getByText('1 (14 oz) can', { exact: true })).toBeVisible();
      await expect(page.getByRole('list').getByText('1 can (14 oz)', { exact: true })).toBeVisible();
      await expect(page.getByRole('list').getByText('1 (28 oz) can', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'close Exit', exact: true }).click();
      await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
      await expect(page.getByRole('checkbox', { name: '1 1/4 (14 oz) can Tomatoes', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 1/4 can (14 oz) Tomatoes', exact: true })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '1 1/4 (28 oz) can Tomatoes', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await expect(page.getByRole('list').getByText('1 1/4 (14 oz) can', { exact: true })).toBeVisible();
      await expect(page.getByRole('list').getByText('1 1/4 can (14 oz)', { exact: true })).toBeVisible();
      await expect(page.getByRole('list').getByText('1 1/4 (28 oz) can', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'close Exit', exact: true }).click();
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      expect((await getDoc(recipeRef)).data()).toEqual(originalRecipe);

      // Soft semantic assertions let the unfixed run record both rounding breaks.
      // Successful generation, immutable records and reload equality stay hard.
      expect.soft(await g8AddToList(page)).toBe('Added 3 items to your shopping list.');
      const onePortion = await g8GrocerySnapshot(client.db, uid);
      const oneGenerated = onePortion.filter(row => row.data.source === 'generated');
      expect.soft(oneGenerated).toHaveLength(3);
      expect.soft(oneGenerated.map(row => row.data)).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Tomatoes', quantity: 1, unit: 'cans (14 oz)', isChecked: false, mealPlanId: planId }),
      ]));
      expect.soft(oneGenerated.filter(row => row.data.name === 'Tomatoes' && ['cans (14 oz)', '(14 oz) cans'].includes(row.data.unit))).toHaveLength(1);
      expect(oneGenerated.map(row => row.data)).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Tomatoes', quantity: 1, unit: '(28 oz) cans', isChecked: false }),
        expect.objectContaining({ name: 'Rice', quantity: 0.75, unit: 'cups', isChecked: false }),
      ]));
      expect(onePortion.filter(row => row.data.source !== 'generated')).toEqual(sentinels);
      expect((await getDoc(recipeRef)).data()).toEqual(originalRecipe);
      const oneRendered = await g8GroceryReload(page, client.db, uid);
      expect(await g8GrocerySnapshot(client.db, uid)).toEqual(onePortion);
      expect.soft(oneRendered).toHaveLength(5);
      expect.soft(oneRendered).toEqual(expect.arrayContaining([
        { name: 'Tomatoes', amount: '1 can (14 oz)', checked: false },
        { name: 'Tomatoes', amount: '1 (28 oz) can', checked: false },
        { name: 'Rice', amount: '3/4 cups', checked: false },
        { name: 'G8 manual sentinel', amount: '7 1/8 can (14 oz)', checked: true },
        { name: 'G8 legacy sentinel', amount: '2 3/4 (28 oz) cans', checked: false },
      ]));

      // Five ordinary dinner portions consume 2.5 fourteen-ounce cans, rounded
      // once to 3. Two independently rounded spellings would incorrectly give 4.
      await setDoc(planRef, { days: Array.from({ length: 5 }, (_, index) => ({
        ...originalPlan.days[0],
        date: toDateKey(new Date(getMondayWeekStart().getTime() + index * 86400000)),
        meals: [{ ...originalPlan.days[0].meals[0], id: `g8-portion-${index}`, type: 'dinner' }],
      })) }, { merge: true });
      expect.soft(await g8AddToList(page)).toBe('Added 3 items to your shopping list.');
      const fivePortions = await g8GrocerySnapshot(client.db, uid);
      const fiveGenerated = fivePortions.filter(row => row.data.source === 'generated');
      expect.soft(fiveGenerated).toHaveLength(3);
      expect.soft(fiveGenerated.map(row => row.data)).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Tomatoes', quantity: 3, unit: 'cans (14 oz)', isChecked: false, mealPlanId: planId }),
      ]));
      expect.soft(fiveGenerated.filter(row => row.data.name === 'Tomatoes' && ['cans (14 oz)', '(14 oz) cans'].includes(row.data.unit))).toHaveLength(1);
      expect(fiveGenerated.map(row => row.data)).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Tomatoes', quantity: 2, unit: '(28 oz) cans', isChecked: false }),
        expect.objectContaining({ name: 'Rice', quantity: 3.75, unit: 'cups', isChecked: false }),
      ]));
      expect(fivePortions.filter(row => row.data.source !== 'generated')).toEqual(sentinels);
      expect((await getDoc(recipeRef)).data()).toEqual(originalRecipe);
      const fiveRendered = await g8GroceryReload(page, client.db, uid);
      expect(await g8GrocerySnapshot(client.db, uid)).toEqual(fivePortions);
      expect.soft(fiveRendered).toHaveLength(5);
      expect.soft(fiveRendered).toEqual(expect.arrayContaining([
        { name: 'Tomatoes', amount: '3 cans (14 oz)', checked: false },
        { name: 'Tomatoes', amount: '2 (28 oz) cans', checked: false },
        { name: 'Rice', amount: '3 3/4 cups', checked: false },
        { name: 'G8 manual sentinel', amount: '7 1/8 can (14 oz)', checked: true },
        { name: 'G8 legacy sentinel', amount: '2 3/4 (28 oz) cans', checked: false },
      ]));
      expect((await getDoc(recipeRef)).data()).toEqual(originalRecipe);
      expect(failures).toEqual([]);
    });

    test(`G8 VM037 equivalent checked packages survive both placement directions at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g8-checked');
      const title = `G8 checked packages ${width}`;
      const otherIngredients = [
        { item: 'Tomatoes', quantity: '1', unit: 'can (28 oz)' },
        { item: 'Size control tomatoes', quantity: '1', unit: 'can (14 oz)' },
        { item: 'Name control chickpeas', quantity: '1', unit: 'can (14 oz)' },
        { item: 'Count control tomatoes', quantity: '1', unit: 'stick (14 oz)' },
      ];
      const recipeId = await seedRecipe(client.db, uid, title, {
        mealType: 'dinner', servings: 4,
        ingredients: [{ item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' }, ...otherIngredients],
      });
      const recipeRef = doc(client.db, 'users', uid, 'recipes', recipeId);
      const planId = await seedCurrentMealPlan(client.db, uid, recipeId, title);
      const sentinels = await g8SeedSentinels(client.db, uid);
      await setDoc(doc(client.db, 'users', uid, 'groceryItems', 'g8-old-target'), {
        name: 'Tomatoes', quantity: 9, unit: '(14 oz) CANS', aisle: 'Produce', isChecked: true, source: 'generated', mealPlanId: planId,
      });

      const directions = [
        {
          label: 'prefix checked to suffix source', oldUnit: '(14 oz) CANS',
          ingredient: { item: 'Tomatoes', quantity: '1', unit: 'can (14 oz)' },
          savedUnit: 'cans (14 oz)', renderedAmount: '1 can (14 oz)',
        },
        {
          label: 'suffix checked to prefix source', oldUnit: 'cans (14 oz)',
          ingredient: { item: 'Tomatoes', amount: '1 (14 oz) can' },
          savedUnit: '(14 oz) cans', renderedAmount: '1 (14 oz) can',
        },
      ];
      for (const direction of directions) {
        if (direction.oldUnit === 'cans (14 oz)') {
          const previous = (await g8GrocerySnapshot(client.db, uid)).filter(row =>
            row.data.source === 'generated' && row.data.name === 'Tomatoes' && row.data.unit === 'cans (14 oz)');
          expect(previous).toHaveLength(1);
          await setDoc(doc(client.db, 'users', uid, 'groceryItems', previous[0].id), { isChecked: true }, { merge: true });
        }
        // These checked records must never transfer to another size/name/count
        // noun. Recreate only the owned negative fixtures for each direction.
        for (const control of [
          { id: 'g8-old-size', name: 'Size control tomatoes', unit: 'can (28 oz)' },
          { id: 'g8-old-name', name: 'Name control beans', unit: 'can (14 oz)' },
          { id: 'g8-old-count', name: 'Count control tomatoes', unit: 'can (14 oz)' },
        ]) {
          await setDoc(doc(client.db, 'users', uid, 'groceryItems', control.id), {
            name: control.name, quantity: 9, unit: control.unit, aisle: 'Other', isChecked: true, source: 'generated', mealPlanId: planId,
          });
        }
        await setDoc(recipeRef, { ingredients: [direction.ingredient, ...otherIngredients] }, { merge: true });
        const originalRecipe = (await getDoc(recipeRef)).data();
        const checkedBefore = (await g8GrocerySnapshot(client.db, uid)).filter(row =>
          row.data.source === 'generated' && row.data.name === 'Tomatoes' && row.data.unit === direction.oldUnit);
        expect(checkedBefore).toHaveLength(1);
        expect(checkedBefore[0].data.isChecked).toBe(true);
        expect(await g8AddToList(page)).toBe('Added 5 items to your shopping list.');
        // Read authoritative committed state before any Grocery navigation/reload.
        const saved = await g8GrocerySnapshot(client.db, uid);
        const generated = saved.filter(row => row.data.source === 'generated');
        expect(generated).toHaveLength(5);
        const target = generated.filter(row => row.data.name === 'Tomatoes' && row.data.unit === direction.savedUnit);
        expect(target).toHaveLength(1);
        expect(target[0].data).toEqual(expect.objectContaining({ quantity: 1, source: 'generated', mealPlanId: planId }));
        // Soft only at VM037's missing checked carryover; both directions run RED.
        expect.soft(target[0].data.isChecked, direction.label).toBe(true);
        expect(generated.map(row => row.data)).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: 'Tomatoes', quantity: 1, unit: 'cans (28 oz)', isChecked: false }),
          expect.objectContaining({ name: 'Size control tomatoes', quantity: 1, unit: 'cans (14 oz)', isChecked: false }),
          expect.objectContaining({ name: 'Name control chickpeas', quantity: 1, unit: 'cans (14 oz)', isChecked: false }),
          expect.objectContaining({ name: 'Count control tomatoes', quantity: 1, unit: 'sticks (14 oz)', isChecked: false }),
        ]));
        expect(saved.filter(row => row.data.source !== 'generated')).toEqual(sentinels);
        expect((await getDoc(recipeRef)).data()).toEqual(originalRecipe);
        const rendered = await g8GroceryReload(page, client.db, uid);
        expect(await g8GrocerySnapshot(client.db, uid)).toEqual(saved);
        expect(rendered).toHaveLength(7);
        expect.soft(rendered, direction.label).toEqual(expect.arrayContaining([
          { name: 'Tomatoes', amount: direction.renderedAmount, checked: true },
        ]));
        expect(rendered).toEqual(expect.arrayContaining([
          { name: 'Tomatoes', amount: '1 can (28 oz)', checked: false },
          { name: 'Size control tomatoes', amount: '1 can (14 oz)', checked: false },
          { name: 'Name control chickpeas', amount: '1 can (14 oz)', checked: false },
          { name: 'Count control tomatoes', amount: '1 stick (14 oz)', checked: false },
          { name: 'G8 manual sentinel', amount: '7 1/8 can (14 oz)', checked: true },
          { name: 'G8 legacy sentinel', amount: '2 3/4 (28 oz) cans', checked: false },
        ]));
        expect((await getDoc(recipeRef)).data()).toEqual(originalRecipe);
      }
      expect(failures).toEqual([]);
    });
  }
});


// G9: real client CSSOM coverage for both direct recipeTint consumers.
test.describe('G9 seeded recipe fallback styling', () => {
  const titles = ['G9 Tint Alpha', 'G9 Tint Beta'];
  const healthyTitle = 'G9 Healthy Image';
  const macros = { calories: 500, protein: 70, carbs: 30, fat: 10 };
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR4nGOoSNlCU8QwasGoBaMWjFowasGoBaMWjFowasGoBaMWDBULAFSLQFujbhvWAAAAAElFTkSuQmCC', 'base64');

  async function fallbackStyle(panel: Locator, label: string) {
    await expect(panel).toBeVisible();
    await expect(panel).toHaveText('G');
    return panel.evaluate((element: HTMLElement, sampleLabel) => {
      const computed = getComputedStyle(element);
      return {
        label: sampleLabel,
        styleAttribute: element.getAttribute('style'),
        inlineBackground: element.style.background,
        inlineBackgroundImage: element.style.backgroundImage,
        inlineFilter: element.style.filter,
        backgroundImage: computed.backgroundImage,
        filter: computed.filter,
        supportedBackground: CSS.supports('background-image', computed.backgroundImage),
        supportedFilter: CSS.supports('filter', computed.filter),
      };
    }, label);
  }

  function mealPanel(page: Page, title: string) {
    // MealCard is private; select its visible image panel through its heading.
    return page.getByRole('heading', { name: title, exact: true })
      .locator('..').locator('..').locator(':scope > .bg-cover');
  }

  for (const width of [1440, 390]) {
    test('G9 VM040 client gradients retain seed variation and healthy images after reload at ' + width + 'px', async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g9-tints');
      const imageRef = ref(client.storage, 'users/' + uid + '/recipes/g9-healthy.png');
      await uploadBytes(imageRef, pngBytes, { contentType: 'image/png' });
      const imageUrl = await getDownloadURL(imageRef);
      const config = readEmulatorConfig();
      expect(new URL(imageUrl).origin).toBe('http://' + config.host + ':' + config.ports.storage);

      // Current actual-helper probe confirms these same-macro seeds differ
      // (-2deg / 0deg); expectations below deliberately do not pin that mechanism.
      const fixtures = [
        { title: titles[0], type: 'breakfast', imageUrl: '' },
        { title: titles[1], type: 'lunch', imageUrl: '' },
        { title: healthyTitle, type: 'dinner', imageUrl },
      ];
      const recipeIds: string[] = [];
      for (const fixture of fixtures) {
        recipeIds.push(await seedRecipe(client.db, uid, fixture.title, {
          ...macros, mealType: fixture.type, folders: [fixture.type], imageUrl: fixture.imageUrl,
        }));
      }
      const planId = await seedCurrentMealPlan(client.db, uid, recipeIds[0], titles[0]);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals = fixtures.map((fixture, index) => ({
        id: 'g9-meal-' + index, recipeId: recipeIds[index], name: fixture.title,
        type: fixture.type, imageUrl: fixture.imageUrl, ...macros, isEaten: false,
      }));
      plan.days[0].totalCalories = 1500;
      await setDoc(planRef, plan);
      const before = await g4Snapshot(client.db, uid);
      const samples: Awaited<ReturnType<typeof fallbackStyle>>[] = [];

      for (let visit = 0; visit < 2; visit++) {
        if (visit === 0) await page.goto('/recipes');
        else await page.reload();
        await expect(page.getByRole('heading', { name: 'My Kitchen', exact: true })).toBeVisible();
        for (const title of titles) {
          samples.push(await fallbackStyle(
            page.getByRole('img', { name: title + ' — no photo', exact: true }),
            'Library ' + (visit === 0 ? 'initial ' : 'reload ') + title,
          ));
        }
        const healthy = page.getByRole('img', { name: healthyTitle, exact: true });
        await expect(healthy).toBeVisible();
        await expect(healthy).toHaveAttribute('src', imageUrl);
        await expect(healthy).toHaveAttribute('alt', healthyTitle);
        await expect.poll(() => healthy.evaluate((image: HTMLImageElement) =>
          image.complete && image.naturalWidth === 32)).toBe(true);
        await expect(healthy).toHaveCSS('background-image', 'none');
        await expect(healthy).toHaveCSS('filter', 'none');
        await expect(page.getByRole('img', { name: healthyTitle + ' — no photo', exact: true })).toHaveCount(0);
      }

      for (let visit = 0; visit < 2; visit++) {
        if (visit === 0) await page.goto('/plan');
        else await page.reload();
        await settlePlanner(page);
        for (const title of titles) {
          samples.push(await fallbackStyle(
            mealPanel(page, title),
            'Planner ' + (visit === 0 ? 'initial ' : 'reload ') + title,
          ));
        }
        const healthy = mealPanel(page, healthyTitle);
        await expect(healthy).toBeVisible();
        await expect(healthy).toHaveCSS('background-image', 'url("' + imageUrl + '")');
        await expect(healthy).toHaveCSS('filter', 'none');
        const decoded = await healthy.evaluate(async (element: HTMLElement) => {
          const background = getComputedStyle(element).backgroundImage;
          const source = background.match(/^url\("(.*)"\)$/)?.[1];
          if (!source) throw new Error('Healthy MealCard must retain its image URL.');
          const image = new Image();
          image.src = source;
          await image.decode();
          return { complete: image.complete, width: image.naturalWidth };
        });
        expect(decoded).toEqual({ complete: true, width: 32 });
        await expect(healthy.locator('span')).toHaveCount(0);
      }

      await test.info().attach('g9-client-cssom', {
        body: JSON.stringify(samples, null, 2), contentType: 'application/json',
      });
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
      expect(samples).toHaveLength(8);

      // Collect both real consumers before this strict assertion so the RED
      // receipt names both invalid client-applied backgrounds, not an SSR string.
      expect(samples.map(sample => sample.backgroundImage), JSON.stringify(samples, null, 2))
        .toEqual(Array.from({ length: 8 }, () => expect.stringMatching(/^linear-gradient\(/)));
      expect(samples.every(sample => sample.supportedBackground && sample.supportedFilter)).toBe(true);
      expect(samples.every(sample => !sample.backgroundImage.includes('url('))).toBe(true);

      const signature = (sample: typeof samples[number]) => [sample.backgroundImage, sample.filter];
      expect(signature(samples[0]), 'Same-macro recipes retain deterministic per-seed hue variation')
        .not.toEqual(signature(samples[1]));
      for (let index = 2; index < samples.length; index++) {
        expect(signature(samples[index]), samples[index].label + ' must match the same Library seed')
          .toEqual(signature(samples[index % 2]));
      }
    });
  }
});

// G10 fixtures are owned by fresh SDK accounts. Only exact local image HTTP
// responses are controlled; the app, image decoding and native events stay real.
const g10Png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR4nGOoSNlCU8QwasGoBaMWjFowasGoBaMWjFowasGoBaMWDBULAFSLQFujbhvWAAAAAElFTkSuQmCC', 'base64');
const g10BadPng = Buffer.from('G10 VM042 invalid PNG bytes!!!', 'utf8');
type G10NativeImage = { kind: string; src: string; currentSrc: string; alt: string; complete: boolean; width: number; height: number; trusted: boolean; inForm: boolean };

async function g10ObserveImages(page: Page) {
  await page.addInitScript(() => {
    const records: unknown[] = [];
    Object.defineProperty(window, '__g10NativeImages', { value: records });
    for (const kind of ['load', 'error']) document.addEventListener(kind, event => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      records.push({ kind: event.type, src: image.src, currentSrc: image.currentSrc, alt: image.alt,
        complete: image.complete, width: image.naturalWidth, height: image.naturalHeight,
        trusted: event.isTrusted, inForm: Boolean(image.closest('form')) });
    }, true);
  });
}

const g10NativeImages = (page: Page): Promise<G10NativeImage[]> => page.evaluate(() =>
  (window as unknown as { __g10NativeImages: G10NativeImage[] }).__g10NativeImages);

async function g10ImageResources(page: Page, sources: string[]) {
  const modes = new Map(sources.map(source => [source, 'bad' as 'bad' | 'good' | 'held']));
  const requests: { source: string; ordinal: number; mode: string; status?: number; contentType?: string; bytes?: number; outcome?: string }[] = [];
  const responses: { source: string; status: number; contentType: string }[] = [];
  const terminals: { source: string; kind: string; error?: string }[] = [];
  const resourceErrors: { text: string; url: string }[] = [];
  const releases: (() => void)[] = [];
  let pending = 0;
  const failures = collectConsoleFailures(page);
  page.on('response', response => {
    if (modes.has(response.url())) responses.push({ source: response.url(), status: response.status(), contentType: response.headers()['content-type'] ?? '' });
  });
  page.on('requestfinished', request => {
    if (modes.has(request.url())) terminals.push({ source: request.url(), kind: 'finished' });
  });
  page.on('requestfailed', request => {
    if (modes.has(request.url())) terminals.push({ source: request.url(), kind: 'failed', error: request.failure()?.errorText });
  });
  page.on('console', message => {
    if (message.type() === 'error' && message.text().startsWith('Failed to load resource:')) {
      resourceErrors.push({ text: message.text(), url: message.location().url });
    }
  });
  await page.route(url => modes.has(url.href), async route => {
    const source = route.request().url();
    const mode = modes.get(source)!;
    const receipt: typeof requests[number] = { source, ordinal: requests.length + 1, mode };
    requests.push(receipt);
    pending++;
    try {
      if (mode === 'held') await new Promise<void>(resolve => releases.push(resolve));
      const body = mode === 'good' ? g10Png : g10BadPng;
      Object.assign(receipt, { status: 200, contentType: 'image/png', bytes: body.length });
      await route.fulfill({ status: 200, contentType: 'image/png', body, headers: { 'Cache-Control': 'no-store' } });
      receipt.outcome = 'fulfilled';
    } catch (error) {
      receipt.outcome = String(error);
      if (mode !== 'held') throw error;
    } finally { pending--; }
  });
  return {
    requests, responses, terminals, modes,
    release: () => { for (const release of releases.splice(0)) release(); },
    pending: () => pending,
    async attach(label: string, extra: unknown = {}) {
      await test.info().attach('g10-' + label, { body: JSON.stringify({ requests, responses, terminals,
        native: await g10NativeImages(page), resourceErrors, extra }, null, 2), contentType: 'application/json' });
    },
    verify() {
      expect(failures).toEqual([]);
      // The shared helper suppresses resource diagnostics broadly; G10 requires
      // every such diagnostic to identify this exact controlled image fixture.
      expect(resourceErrors.filter(error => !modes.has(error.url))).toEqual([]);
    },
  };
}

async function g10Fixture(page: Page, width: number, label: string) {
  await g10ObserveImages(page);
  const { client, uid } = await g4Account(page, width, 'g10-' + label);
  const urls: string[] = [];
  for (const [name, bytes] of [['bad-a', g10BadPng], ['bad-c', g10BadPng], ['healthy-b', g10Png]] as const) {
    const asset = ref(client.storage, 'users/' + uid + '/recipes/g10-' + name + '.png');
    await uploadBytes(asset, bytes, { contentType: 'image/png' });
    const url = await getDownloadURL(asset);
    const config = readEmulatorConfig();
    expect(new URL(url).origin).toBe('http://' + config.host + ':' + config.ports.storage);
    urls.push(url);
  }
  const [badA, badC, healthyB] = urls;
  const http = await g10ImageResources(page, [badA, badC]);
  return { client, uid, badA, badC, healthyB, http };
}

async function g10NativeFailure(page: Page, http: Awaited<ReturnType<typeof g10ImageResources>>, source: string, label: string, after = 0, inForm = false) {
  await expect.poll(async () => (await g10NativeImages(page)).slice(after).some(record =>
    record.kind === 'error' && record.trusted && record.src === source && record.complete && record.width === 0 && record.height === 0 && record.inForm === inForm),
  { message: 'Prerequisite: actual rendered img received a native error for the admitted PNG' }).toBe(true);
  expect(http.requests.some(request => request.source === source && request.status === 200 && request.contentType === 'image/png' && request.bytes === 30)).toBe(true);
  await expect.poll(() => http.responses.some(response => response.source === source && response.status === 200 && response.contentType.startsWith('image/png'))).toBe(true);
  await http.attach(label + '-native-prerequisite');
}

async function g10Fallback(scope: Page | Locator, title: string, initial = 'G') {
  const panel = scope.getByRole('img', { name: title + ' — no photo', exact: true });
  await expect(panel, 'Native admitted-image failure must reach the existing accessible fallback').toBeVisible();
  await expect(panel).toHaveText(initial);
  const style = await panel.evaluate(element => {
    const background = getComputedStyle(element).backgroundImage;
    return { background, supported: CSS.supports('background-image', background) };
  });
  expect(style.background).toMatch(/^linear-gradient\(/);
  expect(style.background).not.toContain('url(');
  expect(style.supported).toBe(true);
  return panel;
}

async function g10Healthy(scope: Page | Locator, title: string, source: string, className?: string) {
  const image = scope.getByRole('img', { name: title, exact: true });
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', source);
  await expect(image).toHaveAttribute('alt', title);
  if (className) await expect(image).toHaveAttribute('class', className);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({ complete: element.complete, width: element.naturalWidth, height: element.naturalHeight }))).toEqual({ complete: true, width: 32, height: 32 });
  await expect(image).toHaveCSS('background-image', 'none');
  await expect(image).toHaveCSS('filter', 'none');
  await expect(scope.getByRole('img', { name: title + ' — no photo', exact: true })).toHaveCount(0);
}

async function g10Recipe(client: ReturnType<typeof createFirebaseClient>, uid: string, title: string, imageUrl: string, overrides: Record<string, unknown> = {}) {
  return seedRecipe(client.db, uid, title, { imageUrl, protein: 70, carbs: 10, fat: 3,
    micronutrients: { vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0 }, originalAssetUrl: imageUrl,
    originalAssetPath: decodeURIComponent(new URL(imageUrl).pathname.split('/o/')[1]), originalAssetType: 'image', ...overrides });
}

const g10MealPanel = (page: Page, title: string) => page.getByRole('heading', { name: title, exact: true })
  .locator('..').locator('..').locator(':scope > .bg-cover');

async function g10DecodeProbe(page: Page, source: string) {
  return page.evaluate(async url => {
    const image = new Image();
    const event = new Promise<{ kind: string; trusted: boolean }>(resolve => {
      for (const kind of ['load', 'error']) image.addEventListener(kind, receipt => resolve({ kind: receipt.type, trusted: receipt.isTrusted }), { once: true });
    });
    image.src = url;
    let errorName = '';
    try { await image.decode(); } catch (error) { errorName = (error as Error).name; }
    return { source: image.src, event: await event, errorName, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight };
  }, source);
}

test.describe('G10 VM042 admitted image failure', () => {
  for (const width of [1440, 390]) {
    test('G10 VM042 status200 native Library failure reaches fallback at ' + width + 'px', async ({ page }) => {
      const { client, uid, badA, healthyB, http } = await g10Fixture(page, width, 'native-red');
      const title = 'G10 Failed Library ' + width;
      const positive = 'G10 Healthy Library ' + width;
      await g10Recipe(client, uid, title, badA);
      await g10Recipe(client, uid, positive, healthyB);
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/recipes');
      await expect(page.getByRole('heading', { name: 'My Kitchen', exact: true })).toBeVisible();
      await g10NativeFailure(page, http, badA, 'library-' + width);
      await g10Healthy(page, positive, healthyB);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      http.verify();
      // On the unchanged app, all prerequisites pass before this missing-fallback RED.
      await g10Fallback(page, title);
    });

    test('G10 VM042 status200 CSS MealCard failure reaches fallback at ' + width + 'px', async ({ page }) => {
      const { client, uid, badA, healthyB, http } = await g10Fixture(page, width, 'css-red');
      const title = 'G10 CSS Failed ' + width;
      const positive = 'G10 CSS Healthy Control ' + width;
      const id = await g10Recipe(client, uid, title, badA, { mealType: 'breakfast', folders: ['breakfast'] });
      const healthyId = await g10Recipe(client, uid, positive, healthyB, { mealType: 'lunch', folders: ['lunch'] });
      const planId = await seedCurrentMealPlan(client.db, uid, id, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals = [
        { id: 'g10-css-failed', recipeId: id, name: title, type: 'breakfast', imageUrl: badA, calories: 520, protein: 70, carbs: 10, fat: 3, isEaten: false },
        { id: 'g10-css-healthy', recipeId: healthyId, name: positive, type: 'lunch', imageUrl: healthyB, calories: 520, protein: 70, carbs: 10, fat: 3, isEaten: false },
      ];
      plan.days[0].totalCalories = 1040;
      await setDoc(planRef, plan);
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/plan');
      await settlePlanner(page);
      const badPanel = g10MealPanel(page, title);
      await expect(badPanel).toBeVisible();
      const panelBeforeAssertion = await badPanel.evaluate(element => ({ background: getComputedStyle(element).backgroundImage, initial: element.textContent }));
      // Independent native decode corroborates the failed resource. A CSS div
      // receives no img error callback; the actual panel assertion stays separate.
      const badProbe = await g10DecodeProbe(page, badA);
      expect(badProbe).toEqual({ source: badA, event: { kind: 'error', trusted: true }, errorName: 'EncodingError', complete: true, width: 0, height: 0 });
      expect(http.requests.some(request => request.source === badA && request.status === 200 && request.contentType === 'image/png' && request.bytes === 30)).toBe(true);
      await expect.poll(() => http.responses.some(response => response.source === badA && response.status === 200 && response.contentType.startsWith('image/png'))).toBe(true);
      const healthyPanel = g10MealPanel(page, positive);
      await expect(healthyPanel).toHaveCSS('background-image', 'url("' + healthyB + '")');
      await expect(healthyPanel).toHaveCSS('filter', 'none');
      await expect(healthyPanel.locator('span')).toHaveCount(0);
      const healthyProbe = await g10DecodeProbe(page, healthyB);
      expect(healthyProbe).toEqual({ source: healthyB, event: { kind: 'load', trusted: true }, errorName: '', complete: true, width: 32, height: 32 });
      await expect(badPanel).toHaveClass('h-14 w-full bg-cover bg-center relative flex items-center justify-center');
      await expect(badPanel).toHaveCSS('height', '56px');
      await expect(badPanel).toHaveCSS('background-size', 'cover');
      await expect(badPanel).toHaveCSS('background-position', '50% 50%');
      await expect(page.getByRole('button', { name: 'Mark as eaten: ' + title, exact: true })).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByRole('button', { name: 'Swap ' + title, exact: true })).toHaveCount(1);
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      http.verify();
      await http.attach('css-' + width + '-native-prerequisite', { panelBeforeAssertion, badProbe, healthyProbe });
      // On the unchanged app, the real panel still has its failed URL at this RED.
      await expect(badPanel, 'Actual CSS panel must replace the failed URL with its generated gradient').toHaveCSS('background-image', /^linear-gradient\(/);
      await expect(badPanel).toHaveText('G');
      expect(await badPanel.evaluate(element => CSS.supports('background-image', getComputedStyle(element).backgroundImage))).toBe(true);
    });
  }
});

async function g10OpenForm(page: Page, title: string) {
  await page.getByRole('button', { name: 'Edit recipe: ' + title, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeVisible();
  return page.locator('form');
}

async function g10CssHealthy(page: Page, title: string, source: string) {
  const panel = g10MealPanel(page, title);
  await expect(panel).toHaveCSS('background-image', 'url("' + source + '")');
  await expect(panel).toHaveCSS('filter', 'none');
  await expect(panel.locator('span')).toHaveCount(0);
  expect(await g10DecodeProbe(page, source)).toEqual({ source, event: { kind: 'load', trusted: true }, errorName: '', complete: true, width: 32, height: 32 });
}

test.describe('G10 VM042 admitted image recovery guards', () => {
  for (const width of [1440, 390]) {
    test('G10 VM042 routed readers and mounted preview recover for replacement URLs at ' + width + 'px', async ({ page }) => {
      const { client, uid, badA, badC, healthyB, http } = await g10Fixture(page, width, 'preview-recovery');
      const title = 'G10 Preview ' + width;
      const positive = 'G10 Preview Healthy Control ' + width;
      await g10Recipe(client, uid, title, badA);
      await g10Recipe(client, uid, positive, healthyB);
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/recipes');
      await g10NativeFailure(page, http, badA, 'routed-library-' + width);
      await g10Fallback(page, title);
      await g10Healthy(page, positive, healthyB);
      let mark = (await g10NativeImages(page)).length;
      await page.getByRole('heading', { name: title, exact: true }).click();
      await g10NativeFailure(page, http, badA, 'routed-detail-' + width, mark);
      await g10Fallback(page.locator('main').last(), title);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await g10Fallback(page.locator('main').last(), title);
      await page.getByRole('button', { name: /close Exit/ }).click();
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      await page.reload();
      await g10Fallback(page, title);
      await g10Healthy(page, positive, healthyB);
      mark = (await g10NativeImages(page)).length;
      const form = await g10OpenForm(page, title);
      await g10NativeFailure(page, http, badA, 'preview-a-' + width, mark, true);
      await g10Fallback(form, title);
      const input = page.getByLabel('Recipe Image', { exact: true });
      await input.fill(healthyB);
      await g10Healthy(form, title, healthyB, 'w-full h-full object-cover');
      mark = (await g10NativeImages(page)).length;
      await input.fill(badC);
      await g10NativeFailure(page, http, badC, 'preview-c-' + width, mark, true);
      await g10Fallback(form, title);
      const updatedTitle = 'Updated G10 Preview ' + width;
      await page.getByLabel('Recipe Name *', { exact: true }).fill(updatedTitle);
      await g10Fallback(form, updatedTitle, 'U');
      await input.fill(healthyB);
      await g10Healthy(form, updatedTitle, healthyB, 'w-full h-full object-cover');
      await input.fill('');
      await expect(form.getByRole('img')).toHaveCount(0);
      const discardRecipe = acceptNextDialog(page);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await discardRecipe;
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await http.attach('routed-preview-recovery-' + width);
      http.verify();
    });

    test('G10 VM042 exact reused URLs retry and obsolete requests preserve current readers at ' + width + 'px', async ({ page }) => {
      const { client, uid, badA, badC, healthyB, http } = await g10Fixture(page, width, 'attempt-recovery');
      const title = 'G10 Attempts ' + width;
      const replacement = 'G10 Attempt Replacement ' + width;
      const positive = 'G10 Attempt Healthy Control ' + width;
      const id = await g10Recipe(client, uid, title, badA, { mealType: 'breakfast', folders: ['breakfast'] });
      const healthyId = await g10Recipe(client, uid, replacement, healthyB, { mealType: 'breakfast', folders: ['breakfast'] });
      const planId = await seedCurrentMealPlan(client.db, uid, id, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals = [
        { id: 'g10-attempt-failed', recipeId: id, name: title, type: 'breakfast', imageUrl: badA, calories: 520, protein: 70, carbs: 10, fat: 3, isEaten: false },
        { id: 'g10-attempt-healthy', recipeId: healthyId, name: positive, type: 'lunch', imageUrl: healthyB, calories: 520, protein: 70, carbs: 10, fat: 3, isEaten: false },
      ];
      plan.days[0].totalCalories = 1040;
      await setDoc(planRef, plan);
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/recipes');
      const mark = (await g10NativeImages(page)).length;
      const form = await g10OpenForm(page, title);
      await g10NativeFailure(page, http, badA, 'attempt-a-' + width, mark, true);
      await g10Fallback(form, title);
      const input = page.getByLabel('Recipe Image', { exact: true });
      await input.fill(healthyB);
      await g10Healthy(form, title, healthyB);
      const attempts = http.requests.length;
      // The exact same A URL now serves healthy bytes on its fresh attempt.
      http.modes.set(badA, 'good');
      await input.fill(badA);
      await g10Healthy(form, title, badA);
      expect(http.requests.slice(attempts).some(request => request.source === badA && request.bytes === 99)).toBe(true);
      http.modes.set(badC, 'held');
      const terminalMark = http.terminals.length;
      try {
        await input.fill(badC);
        await expect.poll(() => http.requests.some(request => request.source === badC && request.mode === 'held')).toBe(true);
        await input.fill(healthyB);
        await g10Healthy(form, title, healthyB);
      } finally { http.release(); }
      await expect.poll(http.pending).toBe(0);
      await expect.poll(() => http.terminals.slice(terminalMark).some(event => event.source === badC && ['finished', 'failed'].includes(event.kind))).toBe(true);
      await g10Healthy(form, title, healthyB);
      // Record cancellation versus delivery honestly. No obsolete event is dispatched.
      await http.attach('obsolete-request-' + width, { obsoleteTerminal: http.terminals.slice(terminalMark).filter(event => event.source === badC) });
      const discardRecipe = acceptNextDialog(page);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await discardRecipe;
      expect(await g4Snapshot(client.db, uid)).toEqual(before);

      // Repeat A-failure -> healthy B -> exact healthy A through real CSS-card
      // swap selections. These are unsaved local drafts, so saved data stays exact.
      http.modes.set(badA, 'bad');
      await page.goto('/plan');
      await settlePlanner(page);
      expect(await g10DecodeProbe(page, badA)).toEqual({ source: badA, event: { kind: 'error', trusted: true }, errorName: 'EncodingError', complete: true, width: 0, height: 0 });
      await expect(g10MealPanel(page, title)).toHaveCSS('background-image', /^linear-gradient\(/);
      await expect(g10MealPanel(page, title)).toHaveText('G');
      await g10CssHealthy(page, positive, healthyB);
      const picker = page.getByRole('button', { name: 'Close recipe picker', exact: true }).locator('..').locator('..');
      await page.getByRole('button', { name: 'Swap ' + title, exact: true }).click();
      await page.getByPlaceholder('Search...', { exact: true }).fill(replacement);
      await picker.getByRole('heading', { name: replacement, exact: true }).click();
      await g10CssHealthy(page, replacement, healthyB);
      const cssAttempts = http.requests.length;
      http.modes.set(badA, 'good');
      await page.getByRole('button', { name: 'Swap ' + replacement, exact: true }).click();
      await page.getByPlaceholder('Search...', { exact: true }).fill(title);
      await picker.getByRole('heading', { name: title, exact: true }).click();
      await g10CssHealthy(page, title, badA);
      expect(http.requests.slice(cssAttempts).some(request => request.source === badA && request.bytes === 99)).toBe(true);
      await expect(g10MealPanel(page, title)).toHaveClass('h-14 w-full bg-cover bg-center relative flex items-center justify-center');
      await expect(g10MealPanel(page, title)).toHaveCSS('height', '56px');
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await http.attach('exact-source-retries-' + width);
      http.verify();
    });

    test('G10 VM042 failed-source title and macros stay current after real edits at ' + width + 'px', async ({ page }) => {
      const { client, uid, badA, http } = await g10Fixture(page, width, 'props-recovery');
      const title = 'G10 Current Props ' + width;
      const id = await g10Recipe(client, uid, title, badA);
      const reference = doc(client.db, 'users', uid, 'recipes', id);
      const original = (await getDoc(reference)).data()!;
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/recipes');
      await g10NativeFailure(page, http, badA, 'props-' + width);
      const panel = await g10Fallback(page, title);
      const originalStyle = await panel.evaluate(element => [getComputedStyle(element).backgroundImage, getComputedStyle(element).filter]);
      const card = await page.getByRole('heading', { name: title, exact: true }).locator('..').locator('..').locator('..').elementHandle();
      await g10OpenForm(page, title);
      await page.getByLabel('Protein (g)', { exact: true }).fill('5');
      await page.getByLabel('Carbs (g)', { exact: true }).fill('75');
      await page.getByLabel('Fat (g)', { exact: true }).fill('3');
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      await g10Fallback(page, title);
      await expect.poll(() => panel.evaluate(element => [getComputedStyle(element).backgroundImage, getComputedStyle(element).filter])).not.toEqual(originalStyle);
      const macroEdit = (await getDoc(reference)).data()!;
      expect(macroEdit.updatedAt).toBeInstanceOf(Timestamp);
      expect(macroEdit).toEqual({ ...original, protein: 5, carbs: 75, fat: 3, updatedAt: macroEdit.updatedAt });
      const updatedTitle = 'Updated G10 Current Props ' + width;
      await g10OpenForm(page, title);
      await page.getByLabel('Recipe Name *', { exact: true }).fill(updatedTitle);
      await page.getByRole('button', { name: /Save Changes/ }).click();
      await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
      await g10Fallback(page, updatedTitle, 'U');
      expect(await page.getByRole('heading', { name: updatedTitle, exact: true }).locator('..').locator('..').locator('..').evaluate((element, prior) => element === prior, card)).toBe(true);
      const titleEdit = (await getDoc(reference)).data()!;
      expect(titleEdit.updatedAt).toBeInstanceOf(Timestamp);
      expect(titleEdit).toEqual({ ...macroEdit, title: updatedTitle, updatedAt: titleEdit.updatedAt });
      // Derive the expected whole-account delta from only the user edits above.
      const expected = { ...before, collections: { ...before.collections, recipes: before.collections.recipes.map(record =>
        record.id === id ? { ...record, protein: 5, carbs: 75, fat: 3, title: updatedTitle, updatedAt: titleEdit.updatedAt } : record) } };
      expect(await g4Snapshot(client.db, uid)).toEqual(expected);
      await test.info().attach('g10-intended-recipe-edits-' + width, { body: JSON.stringify({ original, macroEdit, titleEdit }, null, 2), contentType: 'application/json' });
      await page.reload();
      await g10Fallback(page, updatedTitle, 'U');
      expect(await g4Snapshot(client.db, uid)).toEqual(expected);
      http.verify();
    });

    test('G10 VM042 Planner shared readers preserve fallback and saved data at ' + width + 'px', async ({ page }) => {
      const { client, uid, badA, http } = await g10Fixture(page, width, 'planner-readers');
      const title = 'G10 Shared Breakfast ' + width;
      const lunch = 'G10 Shared Lunch ' + width;
      const missing = 'G10 Missing Recipe ' + width;
      const id = await g10Recipe(client, uid, title, badA, { mealType: 'breakfast', folders: ['breakfast'] });
      await g10Recipe(client, uid, lunch, badA, { mealType: 'lunch', folders: ['lunch'] });
      const planId = await seedCurrentMealPlan(client.db, uid, id, title);
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals = [
        { id: 'g10-shared-meal', recipeId: id, name: title, type: 'lunch', imageUrl: badA, calories: 520, protein: 70, carbs: 10, fat: 3, isEaten: false },
        { id: 'g10-missing-meal', recipeId: 'g10-does-not-exist', name: missing, type: 'dinner', imageUrl: badA, calories: 520, protein: 70, carbs: 10, fat: 3, isEaten: false },
      ];
      plan.days[0].totalCalories = 1040;
      await setDoc(planRef, plan);
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/plan');
      await settlePlanner(page);
      let mark = (await g10NativeImages(page)).length;
      await page.getByRole('heading', { name: title, exact: true }).click();
      await g10NativeFailure(page, http, badA, 'planner-fetched-' + width, mark);
      await g10Fallback(page.locator('main').last(), title);
      await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
      await g10Fallback(page.locator('main').last(), title);
      await page.getByRole('button', { name: /close Exit/ }).click();
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      mark = (await g10NativeImages(page)).length;
      await page.getByRole('heading', { name: missing, exact: true }).click();
      await g10NativeFailure(page, http, badA, 'planner-synthesized-' + width, mark);
      await g10Fallback(page.locator('main').last(), missing);
      await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
      const picker = page.getByRole('button', { name: 'Close recipe picker', exact: true }).locator('..').locator('..');
      // EmptySlotButton is an existing clickable div, not a semantic button.
      await page.getByText('Add Breakfast', { exact: true }).first().click();
      await page.getByPlaceholder('Search...', { exact: true }).fill(title);
      await g10Fallback(picker, title);
      await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      await page.getByRole('button', { name: 'Swap ' + title, exact: true }).click();
      await page.getByPlaceholder('Search...', { exact: true }).fill(lunch);
      await g10Fallback(picker, lunch);
      await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      await page.getByRole('button', { name: /Batch Cook/ }).click();
      await page.getByRole('button', { name: 'Select Meal', exact: true }).click();
      await page.getByRole('heading', { name: 'Batch Cook Which Meal?', exact: true }).locator('..').getByRole('button', { name: /lunch$/i }).click();
      await expect(page.getByRole('heading', { name: 'Select Batch Lunch for the Week', exact: true })).toBeVisible();
      await page.getByPlaceholder('Search...', { exact: true }).fill(lunch);
      await g10Fallback(picker, lunch);
      await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      await page.getByRole('button', { name: 'Show suggestions for Monday', exact: true }).click();
      const suggestions = page.getByRole('button', { name: 'Close suggestions for Monday', exact: true }).locator('..').locator('..');
      await g10Fallback(suggestions, title);
      await page.getByRole('button', { name: 'Close suggestions for Monday', exact: true }).click();
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      await http.attach('planner-shared-readers-' + width);
      http.verify();
    });
  }
});


// G11: native association, focus and persistence of existing target controls.
// Removing htmlFor/id must fail even where an old aria-label still names a field.
async function g11Association(scope: Page | Locator, text: string, control: Locator, away: Locator, accessibleName = text) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const label = scope.locator('label').filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) });
  await expect(label).toHaveCount(1);
  await expect(label).toBeVisible();
  await expect(control).toHaveCount(1);
  await expect(control).toBeVisible();
  // Soft assertions let unfixed code reach every label. All must pass green.
  await expect.soft(scope.getByLabel(accessibleName, { exact: true })).toHaveCount(1, { timeout: 750 });
  await expect.soft(control).toHaveAccessibleName(accessibleName, { timeout: 750 });
  const association = await control.evaluate((element, expectedText) => {
    const input = element as HTMLInputElement | HTMLSelectElement;
    const labels = Array.from(input.labels ?? []);
    const label = labels.find(item => item.textContent?.trim() === expectedText);
    return {
      labels: labels.map(item => item.textContent?.trim()),
      nativeControlMatches: label?.control === input,
      uniqueId: Boolean(input.id) && Array.from(document.querySelectorAll('[id]')).filter(item => item.id === input.id).length === 1,
    };
  }, text);
  expect.soft(association.labels).toContain(text);
  expect.soft(association.nativeControlMatches).toBe(true);
  expect.soft(association.uniqueId).toBe(true);
  await away.focus();
  await expect(control).not.toBeFocused();
  await label.click();
  await expect.soft(control).toBeFocused({ timeout: 750 });
}

test.describe('G11 target labels', () => {
  test.setTimeout(90_000);
  for (const width of [1440, 390]) {
    test(`planner labels focus and plan-only targets cancel save and reload at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g11-plan');
      await page.goto('/plan');
      await settlePlanner(page);
      await page.getByRole('button', { name: /^add_circle Create New Plan$/ }).click();
      await page.getByRole('button', { name: /^auto_fix_high Open Plan Wizard$/ }).click();
      await page.getByRole('button', { name: /^grid_on Start from Scratch \(Empty Grid\)$/ }).click();
      await page.getByRole('button', { name: /^check_circle Confirm Plan$/ }).click();
      await expect(page.getByRole('button', { name: /^check Saved!$/ })).toBeVisible();
      const plans = await getDocs(collection(client.db, 'users', uid, 'mealPlans'));
      expect(plans.size).toBe(1);
      const planRef = plans.docs[0].ref;
      const planBefore = (await getDoc(planRef)).data()!;
      const profileBefore = (await getDoc(doc(client.db, 'users', uid))).data();
      const names = ['Daily Calories', 'Protein', 'Carbs', 'Fat'];
      await page.getByRole('button', { name: /Preferences/ }).click();
      const modal = g4Settings(page);
      await expect(modal.getByRole('spinbutton')).toHaveCount(4);
      for (const [index, name] of names.entries()) {
        await g11Association(modal, name, modal.getByRole('spinbutton').nth(index), modal.getByRole('button', { name: 'Cancel', exact: true }));
      }
      await expect(modal.getByLabel('Daily Calories', { exact: true })).toHaveCount(1, { timeout: 750 });
      const original = [planBefore.dailyTargets.calories, planBefore.dailyTargets.protein, planBefore.dailyTargets.carbs, planBefore.dailyTargets.fat];
      for (const [index, name] of names.entries()) await modal.getByLabel(name, { exact: true }).fill(String([2221, 171, 206, 73][index]));
      await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('button', { name: 'Plan preferences', exact: true }).click();
      for (const [index, name] of names.entries()) await expect(modal.getByLabel(name, { exact: true })).toHaveValue(String(original[index]));
      await modal.getByLabel('Daily Calories', { exact: true }).fill('2222');
      await modal.getByRole('button', { name: 'Close plan settings', exact: true }).click();
      await page.getByRole('button', { name: /Preferences/ }).click();
      await expect(modal.getByLabel('Daily Calories', { exact: true })).toHaveValue(String(original[0]));
      const values = [2150, 170, 205, 72];
      for (const [index, name] of names.entries()) await modal.getByLabel(name, { exact: true }).fill(String(values[index]));
      await modal.getByRole('button', { name: 'Save Targets', exact: true }).click();
      await expect(page.getByText('Daily Calories', { exact: true }).locator('..').getByText('0 / 2150', { exact: true })).toBeVisible();
      expect((await getDoc(planRef)).data()).toEqual(planBefore);
      expect((await getDoc(doc(client.db, 'users', uid))).data()).toEqual(profileBefore);
      await expect(page.getByRole('button', { name: /^check_circle Confirm Plan$/ })).toBeEnabled();
      await page.getByRole('button', { name: /^check_circle Confirm Plan$/ }).click();
      await expect(page.getByRole('button', { name: /^check Saved!$/ })).toBeVisible();
      await page.reload();
      await expect(page.getByText('Daily Calories', { exact: true }).locator('..').getByText('0 / 2150', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Plan preferences', exact: true }).click();
      for (const [index, name] of names.entries()) await expect(modal.getByLabel(name, { exact: true })).toHaveValue(String(values[index]));
      await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
      expect((await getDoc(planRef)).data()?.dailyTargets).toEqual({ calories: 2150, protein: 170, carbs: 205, fat: 72 });
      expect((await getDoc(doc(client.db, 'users', uid))).data()).toEqual(profileBefore);
      expect(failures).toEqual([]);
    });

    test(`Settings visible gram labels focus and targets save discard and reload at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g11-settings');
      await seedMealPlanForWeek(client.db, uid, getMondayWeekStart(new Date()), 'g11-reference', 'G11 preserved plan');
      const before = await g4Snapshot(client.db, uid);
      await page.goto('/settings');
      await page.getByRole('button', { name: 'Exact Grams', exact: true }).click();
      const fields = [
        ['Protein (g)', 'Protein target grams', '160'],
        ['Carbs (g)', 'Carbs target grams', '210'],
        ['Fat (g)', 'Fat target grams', '70'],
      ];
      for (const [label, ariaName, value] of fields) {
        const input = page.getByLabel(ariaName, { exact: true });
        await g11Association(page, label, input, page.getByRole('button', { name: /Percentage/ }), ariaName);
        await input.fill(value);
      }
      await expect(page.getByLabel('Daily Calorie Target', { exact: true })).toHaveValue('2110');
      await page.getByRole('button', { name: 'Confirm Targets', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Discard', exact: true })).toBeHidden();
      const saved = await g4Snapshot(client.db, uid);
      expect(saved.user?.settings).toMatchObject({ macroMode: 'grams', macroTargets: { protein: 160, carbs: 210, fat: 70 }, dailyCalorieTarget: 2110 });
      expect(saved.collections).toEqual(before.collections);
      for (const [key, value] of Object.entries(before.user?.settings ?? {})) {
        if (!['macroMode', 'macroTargets', 'macroSplit', 'dailyCalorieTarget', 'updatedAt'].includes(key)) expect(saved.user?.settings[key]).toEqual(value);
      }
      await page.reload();
      await expect(page.getByRole('heading', { name: /Settings & Preferences/ })).toBeVisible();
      for (const [, ariaName, value] of fields) await expect(page.getByLabel(ariaName, { exact: true })).toHaveValue(value);
      await page.getByLabel('Protein target grams', { exact: true }).fill('161');
      await page.getByRole('button', { name: 'Discard', exact: true }).click();
      await expect(page.getByLabel('Protein target grams', { exact: true })).toHaveValue('160');
      expect(await g4Snapshot(client.db, uid)).toEqual(saved);
      expect(failures).toEqual([]);
    });

    test(`onboarding target and calculator labels focus and setup persists at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const email = `qa-g11-onboarding-${width}-${Date.now()}@example.com`;
      const client = createFirebaseClient('g11-onboarding');
      await page.goto('/auth');
      await page.getByRole('button', { name: 'Create Account', exact: true }).first().click();
      await page.getByPlaceholder('name@example.com').fill(email);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: 'Create Account', exact: true }).last().click();
      await expect(page.getByRole('heading', { name: 'Welcome to VioMacro', exact: true })).toBeVisible();
      const { user } = await signInWithEmailAndPassword(client.auth, email, TEST_PASSWORD);
      const profile = doc(client.db, 'users', user.uid);
      const before = (await getDoc(profile)).data()?.settings;
      const wizard = onboardingWizard(page);
      await wizard.getByRole('button', { name: /Next/ }).click();
      await expect(page.getByRole('heading', { name: 'The Basics', exact: true })).toBeVisible();
      if (width === 390) await wizard.getByRole('button', { name: 'Imperial (lbs)', exact: true }).click();
      const weights = width === 390 ? ['180.5', '165.5'] : ['80.5', '75.5'];
      for (const [index, label] of ['Current Weight', 'Goal Weight'].entries()) {
        const input = wizard.getByRole('spinbutton').nth(index);
        await g11Association(wizard, label, input, wizard.getByRole('button', { name: 'Back', exact: true }));
        // Positional setup lets the unchanged source reach every later RED
        // association. Native and getByLabel assertions above remain mandatory.
        await input.fill(weights[index]);
      }
      await wizard.getByRole('button', { name: /Next/ }).click();
      await expect(page.getByRole('heading', { name: 'Nutrition Goals', exact: true })).toBeVisible();
      const calories = wizard.getByRole('spinbutton').first();
      await g11Association(wizard, 'Daily Calorie Target', calories, wizard.getByRole('button', { name: 'Back', exact: true }));
      await wizard.getByRole('button', { name: /Calculate Needs/ }).click();
      const gender = wizard.getByRole('combobox').nth(0);
      const age = wizard.getByRole('spinbutton').nth(1);
      const activity = wizard.getByRole('combobox').nth(1);
      for (const [label, input] of [['Gender', gender], ['Age', age], ['Activity Level', activity]] as const) {
        await g11Association(wizard, label, input, wizard.getByRole('button', { name: 'Back', exact: true }));
      }
      await expect(gender).toHaveValue('male');
      await expect(age).toHaveValue('30');
      await expect(activity).toHaveValue('1.55');
      for (const label of width === 390 ? ['Height (ft)', 'Height (in)'] : ['Height (cm)']) {
        await g11Association(wizard, label, wizard.getByLabel(label, { exact: true }), wizard.getByRole('button', { name: 'Back', exact: true }));
      }
      await calories.fill('2234');
      await wizard.getByRole('button', { name: /Next/ }).click();
      await expect(page.getByRole('heading', { name: 'Preferences', exact: true })).toBeVisible();
      await wizard.getByRole('button', { name: 'Finish Setup', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Preferences', exact: true })).toBeHidden();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Hydration', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Welcome to VioMacro', exact: true })).toBeHidden();
      const after = (await getDoc(profile)).data()?.settings;
      expect(after).toMatchObject({ currentWeight: Number(weights[0]), goalWeight: Number(weights[1]), dailyCalorieTarget: 2234, measurementUnit: width === 390 ? 'imperial' : 'metric', onboardingCompleted: true });
      for (const [key, value] of Object.entries(before ?? {})) {
        if (!['currentWeight', 'goalWeight', 'dailyCalorieTarget', 'measurementUnit', 'onboardingCompleted', 'updatedAt'].includes(key)) expect(after[key]).toEqual(value);
      }
      expect(failures).toEqual([]);
    });
  }
});


// G13: real strategy interactions must scroll only the seven-day week, never
// the shared application shell. These fixtures use fresh emulator-owned data.
async function g13Fixture(page: Page, width: number, label: string) {
  const { client, uid } = await g4Account(page, width, 'g13-' + label);
  const breakfastTitle = 'G13 breakfast recipe ' + width;
  const lunchTitle = 'G13 original lunch recipe ' + width;
  const batchTitle = 'G13 replacement lunch ' + width;
  const breakfastId = await seedRecipe(client.db, uid, breakfastTitle, { mealType: 'breakfast' });
  const lunchId = await seedRecipe(client.db, uid, lunchTitle, { mealType: 'lunch' });
  const batchId = await seedRecipe(client.db, uid, batchTitle, { mealType: 'lunch' });
  const start = getMondayWeekStart();
  const end = new Date(start); end.setDate(end.getDate() + 6);
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = names.map((dayName, index) => {
    const date = new Date(start); date.setDate(date.getDate() + index);
    return {
      date: toDateKey(date), dayName, totalCalories: 920,
      meals: [
        { id: 'g13-breakfast-' + index, recipeId: breakfastId, name: 'G13 ' + dayName + ' breakfast ' + width, type: 'breakfast', calories: 400, protein: 30, carbs: 40, fat: 12 },
        { id: 'g13-lunch-' + index, recipeId: lunchId, name: 'G13 ' + dayName + ' lunch ' + width, type: 'lunch', calories: 520, protein: 42, carbs: 55, fat: 14 },
      ],
    };
  });
  const planRef = await addDoc(collection(client.db, 'users', uid, 'mealPlans'), {
    weekStart: toDateKey(start), weekEnd: toDateKey(end), goal: 'G13 toolbar regression',
    days, dailyTargets: { calories: 1850, protein: 140, carbs: 185, fat: 60 },
    mealStatus: { 'g13-breakfast-0': true, 'g13-breakfast-6': true },
    isAiGenerated: false, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
  await addDoc(collection(client.db, 'users', uid, 'groceryItems'), {
    name: 'G13 checked manual sentinel', quantity: 1, unit: 'pcs',
    aisle: 'Other', isChecked: true, source: 'manual',
  });
  await page.goto('/plan');
  await settlePlanner(page);
  await expect(g4Day(page, 'Sunday').getByRole('heading', { name: days[6].meals[0].name, exact: true })).toHaveCount(1);
  await page.evaluate(async () => { await document.fonts.ready; });
  return { client, uid, planRef, days, batchId, batchTitle };
}

async function g13Geometry(page: Page, stage: string) {
  const value = await page.evaluate(() => {
    const outers = document.querySelectorAll<HTMLElement>('main > div.overflow-y-auto');
    if (outers.length !== 1) throw new Error('Expected the real shared content scroller');
    const outer = outers[0];
    const inner = outer.querySelector<HTMLElement>('div.overflow-x-auto');
    const header = outer.querySelector('h1');
    const strategy = outer.querySelector<HTMLButtonElement>('button[title="Toggle Daily Smoothie"]')?.parentElement;
    if (!inner || !header || !strategy) throw new Error('Saved-week toolbar fixture is not ready');
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const controls = Array.from(strategy.querySelectorAll('button')).map(button => {
      const text: ReturnType<typeof rect>[] = [];
      const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent?.trim() || !node.parentElement || getComputedStyle(node.parentElement).display === 'none') continue;
        const range = document.createRange(); range.selectNode(node);
        const r = range.getBoundingClientRect();
        if (r.width) text.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
      return { name: button.title || button.textContent?.replace(/\s+/g, ' ').trim(), rect: rect(button), text };
    });
    const labels = ['Daily Calories', 'Protein', 'Carbs', 'Fats'];
    const macros = Array.from(outer.querySelectorAll('p'))
      .filter(p => labels.includes(p.textContent?.trim() || ''))
      .map(p => ({ name: p.textContent, rect: rect(p.parentElement!) }));
    return {
      outer: { left: outer.getBoundingClientRect().left, clientWidth: outer.clientWidth, scrollWidth: outer.scrollWidth, scrollLeft: outer.scrollLeft },
      inner: { clientWidth: inner.clientWidth, scrollWidth: inner.scrollWidth, scrollLeft: inner.scrollLeft },
      header: rect(header), controls, macros,
    };
  });
  // Soft geometry assertions let the unfixed run execute the whole interaction
  // sequence and preservation controls. Every one is required on the fixed run.
  expect.soft(Math.abs(value.outer.scrollLeft), stage + ': outer offset').toBeLessThanOrEqual(1);
  expect.soft(value.outer.scrollWidth - value.outer.clientWidth, stage + ': outer horizontal range').toBeLessThanOrEqual(1);
  const left = value.outer.left; const right = left + value.outer.clientWidth;
  expect.soft(value.header.left, stage + ': header left').toBeGreaterThanOrEqual(left - 1);
  expect.soft(value.header.right, stage + ': header right').toBeLessThanOrEqual(right + 1);
  expect(value.macros).toHaveLength(4);
  for (const item of [...value.macros, ...value.controls]) {
    expect.soft(item.rect.left, stage + ': ' + item.name + ' left').toBeGreaterThanOrEqual(left - 1);
    expect.soft(item.rect.right, stage + ': ' + item.name + ' right').toBeLessThanOrEqual(right + 1);
  }
  for (const control of value.controls) for (const text of control.text) {
    expect.soft(text.left, stage + ': text left in ' + control.name).toBeGreaterThanOrEqual(control.rect.left - 1);
    expect.soft(text.right, stage + ': text right in ' + control.name).toBeLessThanOrEqual(control.rect.right + 1);
  }
  return value;
}

async function g13OpenBatch(page: Page, type: string) {
  await page.getByRole('button', { name: 'Select Meal', exact: true }).click();
  const chooser = page.getByRole('heading', { name: 'Batch Cook Which Meal?', exact: true });
  await expect(chooser).toBeVisible();
  await chooser.locator('..').getByText(new RegExp('^' + type + '$', 'i')).click();
  const title = 'Select Batch ' + type[0].toUpperCase() + type.slice(1) + ' for the Week';
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}

test.describe('G13 strategy toolbar containment', () => {
  // Fixed before the first negative run: these cases include real keyboard
  // traversal and independent Firestore reads, with no worker/retry override.
  test.setTimeout(90_000);
  for (const width of [1440, 768, 390]) {
    test('original batch sequence and cancellation keep shell aligned at ' + width + 'px', async ({ page }, testInfo) => {
      const failures = collectConsoleFailures(page);
      const { client, uid, days } = await g13Fixture(page, width, 'cancel');
      const before = await g4Snapshot(client.db, uid);
      const check = async (stage: string) => {
        const value = await g13Geometry(page, stage);
        await testInfo.attach('geometry-' + stage, { body: JSON.stringify(value), contentType: 'application/json' });
      };
      const batch = page.getByRole('button', { name: /Batch Cook/ });
      await check('before');
      await batch.click(); await check('batch-on');
      await page.getByRole('button', { name: 'Select Meal', exact: true }).click();
      const chooser = page.getByRole('heading', { name: 'Batch Cook Which Meal?', exact: true });
      await expect(chooser).toBeVisible(); await check('chooser');
      await chooser.locator('..').getByText(/^lunch$/i).click();
      await expect(page.getByRole('heading', { name: 'Select Batch Lunch for the Week', exact: true })).toBeVisible();
      await check('lunch-picker');
      await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      await check('picker-closed');
      await batch.click(); await check('batch-off');

      for (const [title, offIcon] of [['Toggle Daily Smoothie', 'blender'], ['Toggle Daily Tea', 'emoji_food_beverage']]) {
        const control = page.getByTitle(title, { exact: true });
        await control.click(); await expect(control.locator('span')).toHaveText('check_circle');
        await check(title + '-on');
        await control.click(); await expect(control.locator('span')).toHaveText(offIcon);
        await check(title + '-off');
      }
      await batch.click();
      for (const type of ['breakfast', 'dinner', 'snack']) {
        await g13OpenBatch(page, type);
        await check(type + '-filter');
        await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      }
      await batch.click(); await check('all-filters-closed');
      for (const opener of [
        page.getByRole('button', { name: 'Plan preferences', exact: true }),
        page.getByRole('button', { name: /Preferences/ }),
      ]) {
        await opener.click();
        await expect(g4Settings(page).getByLabel('Daily Calories', { exact: true })).toHaveValue('1850');
        await g4Settings(page).getByRole('button', { name: 'Cancel', exact: true }).click();
      }
      await page.getByTitle('Clone Previous Week', { exact: true }).click();
      await expect(page.getByText('No previous saved plan was found to clone. Start from scratch or generate a new week instead.', { exact: true })).toBeVisible();
      await check('clone-feedback');
      await page.getByRole('button', { name: /Plan Week$/ }).click();
      const weekend = [0, 6].includes(new Date().getDay());
      if (weekend) {
        await expect(page.getByRole('heading', { name: 'Weekend Detected!', exact: true })).toBeVisible();
        await page.getByRole('button', { name: /Continue with This Week/ }).click();
      }
      const wizard = page.getByRole('heading', { name: 'Create Your Week Plan', exact: true });
      await expect(wizard).toBeVisible();
      await expect(page.getByRole('button', { name: /Auto-Generate paused$/ })).toBeDisabled();
      await wizard.locator('..').locator('..').locator('..').click({ position: { x: 2, y: 2 } });
      await expect(wizard).toBeHidden(); await check('wizard-dismissed');

      const inner = page.locator('main div.overflow-x-auto');
      await expect(inner).toHaveCount(1);
      await inner.hover();
      await page.mouse.wheel(1600, 0);
      await expect.poll(() => inner.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      await check('intentional-week-scroll');
      await page.mouse.wheel(-1600, 0);
      await expect.poll(() => inner.evaluate(el => el.scrollLeft)).toBe(0);
      const sunday = g4Day(page, 'Sunday').getByRole('button', { name: 'Swap ' + days[6].meals[0].name, exact: true });
      await expect(sunday).not.toBeInViewport();
      for (let count = 0; count < 120 && !await sunday.evaluate(el => document.activeElement === el); count++) {
        await page.keyboard.press('Tab');
      }
      await expect(sunday).toBeFocused();
      await expect.poll(() => inner.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      await check('offscreen-keyboard-focus');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Select Breakfast', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();
      await check('keyboard-picker-closed');
      expect(await g4Snapshot(client.db, uid)).toEqual(before);
      expect(failures).toEqual([]);
    });

    test('batch recipe keeps all seven days and saved data at ' + width + 'px', async ({ page }, testInfo) => {
      const failures = collectConsoleFailures(page);
      const { client, uid, planRef, days, batchId, batchTitle } = await g13Fixture(page, width, 'save');
      const before = await g4Snapshot(client.db, uid);
      const planBefore = (await getDoc(planRef)).data()!;
      await page.getByRole('button', { name: /Batch Cook/ }).click();
      await g13OpenBatch(page, 'lunch');
      await page.getByRole('heading', { name: batchTitle, exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Select Batch Lunch for the Week', exact: true })).toBeHidden();
      const geometry = await g13Geometry(page, 'batch-selected');
      await testInfo.attach('geometry-batch-selected', { body: JSON.stringify(geometry), contentType: 'application/json' });
      await expect(page.getByRole('heading', { name: batchTitle, exact: true })).toHaveCount(7);
      expect((await getDoc(planRef)).data()).toEqual(planBefore);
      await expect(page.getByRole('button', { name: /^check_circle Confirm Plan$/ })).toBeEnabled();
      await page.getByRole('button', { name: /^check_circle Confirm Plan$/ }).click();
      await expect(page.getByRole('button', { name: /^check Saved!$/ })).toBeVisible();
      const saved = (await getDoc(planRef)).data()!;
      expect(saved.days).toHaveLength(7);
      expect(saved.weekStart).toBe(planBefore.weekStart);
      expect(saved.weekEnd).toBe(planBefore.weekEnd);
      expect(saved.goal).toBe(planBefore.goal);
      expect(saved.createdAt).toEqual(planBefore.createdAt);
      expect(saved.dailyTargets).toEqual(planBefore.dailyTargets);
      expect(saved.isAiGenerated).toBe(false);
      expect(saved.mealStatus).toEqual(planBefore.mealStatus);
      for (const [index, day] of saved.days.entries()) {
        expect(day.date).toBe(days[index].date);
        expect(day.dayName).toBe(days[index].dayName);
        expect(day.meals.filter((meal: { type: string }) => meal.type === 'breakfast')).toEqual([days[index].meals[0]]);
        expect(day.meals.filter((meal: { type: string }) => meal.type === 'lunch')).toEqual([
          expect.objectContaining({ recipeId: batchId, name: batchTitle, type: 'lunch', calories: 520, protein: 42, carbs: 55, fat: 14 }),
        ]);
        expect(day.totalCalories).toBe(day.meals.reduce((sum: number, meal: { calories: number }) => sum + meal.calories, 0));
      }
      await page.reload(); await settlePlanner(page);
      for (const day of days) await expect(g4Day(page, day.dayName).getByRole('heading', { name: batchTitle, exact: true })).toHaveCount(1);
      expect((await getDoc(planRef)).data()).toEqual(saved);
      const after = await g4Snapshot(client.db, uid);
      expect(after.user).toEqual(before.user);
      for (const name of ['recipes', 'groceryItems', 'pantryItems', 'weightHistory']) expect(after.collections[name]).toEqual(before.collections[name]);
      expect(after.collections.mealPlans).toHaveLength(1);
      expect(after.collections.mealPlans[0].id).toBe(planRef.id);
      expect(failures).toEqual([]);
    });
  }
});


// G14: the shared grocery formatter changes labels, never stored quantities,
// canonical units, checked identity, recipe wording or serving arithmetic.
test.describe('G14 VM047 singular grocery labels preserve saved data', () => {
  // Initial RED budget covers fresh auth, generation, check, quick-add and reload.
  test.setTimeout(90_000);
  for (const width of [1440, 390]) {
    test(`G14 two planned portions render one cup and survive reload at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const { client, uid } = await g4Account(page, width, 'g14-copy');
      const ingredients = [
        { item: 'G14 Rice', quantity: '2', unit: 'cups', swaps: [] },
        { item: 'G14 Garlic', quantity: '2', unit: 'cloves', swaps: [] },
        { item: 'G14 Eggs', quantity: '2', unit: 'eggs', swaps: [] },
        { item: 'G14 Tomatoes', quantity: '2', unit: '(14 oz) cans', swaps: [] },
        { item: 'G14 Stock', quantity: '4', unit: 'cups', swaps: [] },
      ];
      const recipeId = await seedRecipe(client.db, uid, 'G14 Four Serving Recipe', { servings: 4, ingredients });
      const planId = await seedCurrentMealPlan(client.db, uid, recipeId, 'G14 Four Serving Recipe');
      const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
      const plan = (await getDoc(planRef)).data()!;
      plan.days[0].meals.push({ ...plan.days[0].meals[0], id: 'g14-second-portion', type: 'lunch' });
      plan.days[0].totalCalories = 1040;
      await setDoc(planRef, plan);
      await setDoc(doc(client.db, 'users', uid, 'groceryItems', 'g14-manual'), {
        name: 'G14 Manual Sentinel', quantity: 1, unit: 'pcs', aisle: 'Other', source: 'manual', isChecked: true,
      });
      const before = await g4Snapshot(client.db, uid);
      expect(await g8AddToList(page)).toBe('Added 5 items to your shopping list.');
      const generated = await g8GrocerySnapshot(client.db, uid);
      expect(generated.filter(row => row.data.source === 'manual')).toEqual([
        { id: 'g14-manual', data: { name: 'G14 Manual Sentinel', quantity: 1, unit: 'pcs', aisle: 'Other', source: 'manual', isChecked: true } },
      ]);
      const expected = [
        ['G14 Rice', 1, 'cups', '1 cup'], ['G14 Garlic', 1, 'cloves', '1 clove'],
        ['G14 Eggs', 1, 'eggs', '1 egg'], ['G14 Tomatoes', 1, '(14 oz) cans', '1 (14 oz) can'],
        ['G14 Stock', 2, 'cups', '2 cups'],
      ] as const;
      expect(generated.filter(row => row.data.source === 'generated')).toHaveLength(expected.length);
      for (const [name, quantity, unit] of expected) {
        expect(generated.filter(row => row.data.name === name)).toEqual([
          expect.objectContaining({ data: expect.objectContaining({ name, quantity, unit, isChecked: false, source: 'generated', mealPlanId: planId }) }),
        ]);
      }
      const row = (name: string) => page.getByRole('heading', { name, exact: true }).locator('..').locator('..');
      const assertAmounts = async () => {
        for (const [name, , , label] of expected) {
          await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
          // Soft short semantic assertions let RED complete every data workflow;
          // the initial budget, exact strings and all persistence checks stay fixed.
          await expect.soft(row(name).locator('p')).toHaveText(label, { timeout: 750 });
        }
        await expect.soft(row('G14 Manual Sentinel').locator('p')).toHaveText('1 pc', { timeout: 750 });
      };
      await page.goto('/grocery');
      await expect(page.getByRole('heading', { name: 'Smart Grocery List', exact: true })).toBeVisible();
      await assertAmounts();
      await page.getByRole('button', { name: 'Mark as purchased: G14 Rice', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Mark as not purchased: G14 Rice', exact: true })).toHaveAttribute('aria-pressed', 'true');
      const rice = generated.find(record => record.data.name === 'G14 Rice')!;
      // aria-pressed is optimistic; wait for the actual saved write before
      // comparing a separate authenticated client's full grocery snapshot.
      await expect.poll(async () => (await getDoc(doc(client.db, 'users', uid, 'groceryItems', rice.id))).data()?.isChecked).toBe(true);
      const checked = await g8GrocerySnapshot(client.db, uid);
      expect(checked).toEqual(generated.map(record => record.data.name === 'G14 Rice'
        ? { ...record, data: { ...record.data, isChecked: true } } : record));
      await page.getByPlaceholder('Quick add item (e.g. 2 avocados)...').fill('2 cups G14 Manual Rice');
      await page.getByRole('button', { name: 'Add grocery item', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'G14 Manual Rice', exact: true })).toBeVisible();
      await expect(row('G14 Manual Rice').locator('p')).toHaveText('2 cups');
      const saved = await g8GrocerySnapshot(client.db, uid);
      expect(saved).toHaveLength(7);
      expect(saved.filter(record => record.data.name === 'G14 Manual Rice')).toEqual([
        expect.objectContaining({ data: expect.objectContaining({ quantity: 2, unit: 'cups', source: 'manual', isChecked: false }) }),
      ]);
      expect(saved.filter(record => record.data.name !== 'G14 Manual Rice')).toEqual(checked);
      await page.reload();
      await expect(page.getByRole('button', { name: /^Mark as (?:not )?purchased:/ })).toHaveCount(saved.length);
      await assertAmounts();
      await expect(row('G14 Manual Rice').locator('p')).toHaveText('2 cups');
      await expect(page.getByRole('button', { name: 'Mark as not purchased: G14 Rice', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: 'Mark as not purchased: G14 Manual Sentinel', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect(await g8GrocerySnapshot(client.db, uid)).toEqual(saved);
      const after = await g4Snapshot(client.db, uid);
      expect(after.user).toEqual(before.user);
      for (const name of ['recipes', 'mealPlans', 'pantryItems', 'weightHistory']) expect(after.collections[name]).toEqual(before.collections[name]);
      expect((await getDoc(doc(client.db, 'users', uid, 'recipes', recipeId))).data()?.ingredients).toEqual(ingredients);
      expect(failures).toEqual([]);
    });
  }
});

// G15: measure the rendered option labels rather than pinning grid classes.
// Both callers must retain native selection and leave all saved data untouched.
test.describe('G15 VM048 week wizard labels remain inside their buttons', () => {
  test.setTimeout(90_000);
  for (const width of [1440, 390]) {
    for (const kind of ['empty', 'populated'] as const) {
      test('G15 ' + kind + ' week wizard fits every batch label at ' + width + 'px', async ({ page }) => {
        const failures = collectConsoleFailures(page);
        const account = kind === 'populated'
          ? await g13Fixture(page, width, 'g15-populated')
          : await g4Account(page, width, 'g15-empty');
        const { client, uid } = account;
        if (kind === 'empty') {
          await seedRecipe(client.db, uid, 'G15 saved recipe ' + width);
          await addDoc(collection(client.db, 'users', uid, 'groceryItems'), {
            name: 'G15 checked manual sentinel', quantity: 1, unit: 'pcs',
            aisle: 'Other', isChecked: true, source: 'manual',
          });
        }
        const before = await g4Snapshot(client.db, uid);
        expect(before.collections.mealPlans).toHaveLength(kind === 'empty' ? 0 : 1);
        await page.goto('/plan');
        await settlePlanner(page);
        if (kind === 'empty') {
          await page.getByRole('button', { name: /Create New Plan$/ }).click();
          await page.getByRole('button', { name: /Open Plan Wizard$/ }).click();
        } else {
          await page.getByRole('button', { name: /Plan Week$/ }).click();
          if ([0, 6].includes(new Date().getDay())) {
            await expect(page.getByRole('heading', { name: 'Weekend Detected!', exact: true })).toBeVisible();
            await page.getByRole('button', { name: /Continue with This Week/ }).click();
          }
        }
        const heading = page.getByRole('heading', { name: 'Create Your Week Plan', exact: true });
        await expect(heading).toBeVisible();
        const wizard = heading.locator('..').locator('..');
        const types = ['none', 'breakfast', 'lunch', 'dinner'] as const;
        const option = (type: typeof types[number]) => wizard.getByRole('button', { name: new RegExp('^' + type + '$', 'i') });
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(wizard.getByRole('button', { name: /Auto-Generate paused$/ })).toBeDisabled();
        for (const type of types) {
          await expect(option(type)).toHaveCount(1);
          await expect(option(type)).toBeEnabled();
        }
        const selectedColor = await option('lunch').evaluate(el => getComputedStyle(el).backgroundColor);
        const assertLabelBounds = async (stage: string) => {
          for (const type of types) {
            const bounds = await option(type).evaluate(el => {
              const range = document.createRange();
              range.selectNodeContents(el);
              const text = range.getBoundingClientRect();
              const button = el.getBoundingClientRect();
              return {
                text: { left: text.left, right: text.right, top: text.top, bottom: text.bottom },
                button: { left: button.left, right: button.right, top: button.top, bottom: button.bottom },
              };
            });
            // Soft numeric assertions let RED finish selection and persistence
            // controls; every label and every action must pass on fixed source.
            const message = kind + '/' + width + '/' + stage + '/' + type;
            expect.soft(bounds.text.left, message + ' left').toBeGreaterThanOrEqual(bounds.button.left - 0.5);
            expect.soft(bounds.text.right, message + ' right').toBeLessThanOrEqual(bounds.button.right + 0.5);
            expect.soft(bounds.text.top, message + ' top').toBeGreaterThanOrEqual(bounds.button.top - 0.5);
            expect.soft(bounds.text.bottom, message + ' bottom').toBeLessThanOrEqual(bounds.button.bottom + 0.5);
          }
          expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), stage + ' document width').toBeLessThanOrEqual(width);
        };
        await assertLabelBounds('initial');
        for (const type of types) {
          await option(type).click();
          await expect(option(type)).toBeFocused();
          await expect(option(type)).toHaveCSS('background-color', selectedColor);
          for (const other of types.filter(name => name !== type)) {
            await expect(option(other)).not.toHaveCSS('background-color', selectedColor);
          }
          await assertLabelBounds(type + '-selected');
          await expect(wizard.getByRole('button', { name: /Auto-Generate paused$/ })).toBeDisabled();
        }
        await wizard.locator('..').click({ position: { x: 2, y: 2 } });
        await expect(heading).toBeHidden();
        expect(await g4Snapshot(client.db, uid)).toEqual(before);
        await page.reload();
        await settlePlanner(page);
        if (kind === 'empty') {
          await expect(page.getByRole('button', { name: /Create New Plan$/ })).toBeVisible();
        } else {
          await expect(page.getByRole('button', { name: /Plan Week$/ })).toBeVisible();
        }
        expect(await g4Snapshot(client.db, uid)).toEqual(before);
        expect(failures).toEqual([]);
      });
    }
  }
});

// G35: these clocks affect only the new cases. Timers keep running normally;
// old G4 assertions/configs/budgets and all saved fixture data stay unchanged.
test.describe('G35 VM069 Activity calendar keeps adjacent months', () => {
  test.use({ timezoneId: 'UTC', locale: 'en-US' });
  test.setTimeout(180_000);

  const groups = [
    {
      name: 'shorter adjacent months',
      samples: [
        { at: '2026-10-31T12:00:00Z', initial: 'October 2026', direction: 'Previous month', expected: 'September 2026' },
        { at: '2026-10-31T12:00:00Z', initial: 'October 2026', direction: 'Next month', expected: 'November 2026' },
        { at: '2026-01-30T12:00:00Z', initial: 'January 2026', direction: 'Next month', expected: 'February 2026' },
      ],
    },
    {
      name: 'February and year boundaries',
      samples: [
        { at: '2026-03-31T12:00:00Z', initial: 'March 2026', direction: 'Previous month', expected: 'February 2026' },
        { at: '2024-03-31T12:00:00Z', initial: 'March 2024', direction: 'Previous month', expected: 'February 2024' },
        { at: '2026-01-31T12:00:00Z', initial: 'January 2026', direction: 'Previous month', expected: 'December 2025' },
        { at: '2026-12-31T12:00:00Z', initial: 'December 2026', direction: 'Next month', expected: 'January 2027' },
      ],
    },
  ] as const;

  for (const width of [1440, 390]) {
    for (const group of groups) {
      test('G35 ' + group.name + ' at ' + width + 'px', async ({ page }) => {
        const failures = collectConsoleFailures(page);
        const { client, uid } = await g4Account(page, width, 'g35-calendar');
        const recipeName = 'G35 preserved recipe ' + width;
        const recipeId = await seedRecipe(client.db, uid, recipeName, { servings: 3 });
        await seedCurrentMealPlan(client.db, uid, recipeId, recipeName);
        await addDoc(collection(client.db, 'users', uid, 'groceryItems'), {
          name: 'G35 checked manual sentinel', quantity: 2, unit: 'pcs',
          aisle: 'Other', source: 'manual', isChecked: true,
        });
        await addDoc(collection(client.db, 'users', uid, 'pantryItems'), {
          name: 'G35 pantry sentinel', quantity: 3, unit: 'cups', category: 'Other', isLowStock: false,
        });
        const logDate = toDateKey(new Date());
        await setDoc(doc(client.db, 'users', uid, 'weightHistory', logDate), {
          date: logDate, timestamp: Timestamp.now(), weight: 184, waterMl: 750, sleepHours: 7.5,
        });
        const before = await g4Snapshot(client.db, uid);
        for (const name of ['recipes', 'mealPlans', 'groceryItems', 'pantryItems', 'weightHistory']) {
          expect(before.collections[name].length, name + ' preservation fixture').toBeGreaterThan(0);
        }

        for (const sample of group.samples) {
          await page.clock.setFixedTime(new Date(sample.at));
          await page.goto('/');
          await expect(page.getByRole('heading', { name: 'Hydration', exact: true })).toBeVisible();
          const activity = page.getByRole('heading', { name: 'Activity', exact: true }).locator('..').locator('..');
          const previous = activity.getByRole('button', { name: 'Previous month', exact: true });
          const month = previous.locator('..').locator(':scope > p');
          await expect(month).toHaveText(sample.initial);
          const observedClock = await page.evaluate(() => ({
            iso: new Date().toISOString(), zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }));
          expect(observedClock).toEqual({ iso: sample.at.replace('Z', '.000Z'), zone: 'UTC' });
          const arrow = activity.getByRole('button', { name: sample.direction, exact: true });
          await arrow.click();
          await expect(arrow).toBeFocused();
          // Soft only lets RED finish every date and preservation control.
          // Fixed source must satisfy every exact target month.
          await expect.soft(month, sample.at + ' ' + sample.direction).toHaveText(sample.expected);
          expect(await g4Snapshot(client.db, uid)).toEqual(before);
        }

        await page.reload();
        await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible();
        const initialMonth = page.getByRole('button', { name: 'Previous month', exact: true })
          .locator('..').locator(':scope > p');
        await expect(initialMonth).toHaveText(group.samples[group.samples.length - 1].initial);
        expect(await g4Snapshot(client.db, uid)).toEqual(before);
        expect(failures).toEqual([]);
      });
    }
  }
});

// G-D: the library read stopped at the newest 500 recipes. Anything older was
// missing from search and the picker, and Add to List silently skipped it.
test.describe('G-D whole recipe library', () => {
  // Seeding 501 rule-checked recipes plus three real page loads.
  test.setTimeout(120_000);

  test('G-D the oldest of 501 recipes is searchable, pickable and reaches the grocery list', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const { client, uid } = await g4Account(page, 1440, 'gd-library');
    const oldest = 'GD Oldest Lentil Stew';
    const base = Date.UTC(2025, 0, 1);
    const recipe = (title: string, at: number, ingredients: unknown[] = []) => ({
      title, mealType: 'dinner', tags: [], folders: ['dinner'], imageUrl: '', cookTime: 10, servings: 1,
      calories: 400, protein: 20, carbs: 50, fat: 10, source: 'created', ingredients,
      instructions: [{ step: 'Cook.', timer: 0 }],
      createdAt: Timestamp.fromMillis(at), updatedAt: Timestamp.fromMillis(at),
    });
    // 501 is one past the old 500-document limit; index 0 is the oldest.
    const ids: string[] = [];
    for (let start = 0; start < 501; start += 250) {
      const batch = writeBatch(client.db);
      for (let i = start; i < Math.min(start + 250, 501); i++) {
        const ref = doc(collection(client.db, 'users', uid, 'recipes'));
        ids.push(ref.id);
        batch.set(ref, i === 0
          ? recipe(oldest, base, [{ item: 'GD Lentils', quantity: '2', unit: 'cups', swaps: [] }])
          : recipe(`GD Filler ${String(i).padStart(3, '0')}`, base + i * 60_000));
      }
      await batch.commit();
    }
    const planId = await seedCurrentMealPlan(client.db, uid, ids[0], oldest);
    const before = await g4Snapshot(client.db, uid);
    expect(before.collections.recipes).toHaveLength(501);
    expect(before.collections.groceryItems).toEqual([]);

    await page.goto('/recipes');
    await expect(page.getByRole('heading', { name: 'GD Filler 500', exact: true })).toBeVisible();
    // Soft only lets RED reach the grocery write; GREEN must pass every check.
    await expect.soft(page.getByRole('heading', { name: /^GD (?:Filler \d{3}|Oldest Lentil Stew)$/ })).toHaveCount(501, { timeout: 5000 });
    await page.getByPlaceholder('Search recipes, ingredients...').fill(oldest);
    await expect.soft(page.getByRole('heading', { name: oldest, exact: true })).toBeVisible({ timeout: 5000 });

    await page.goto('/plan');
    await settlePlanner(page);
    const picker = page.getByRole('button', { name: 'Close recipe picker', exact: true }).locator('..').locator('..');
    await page.getByRole('button', { name: 'Swap ' + oldest, exact: true }).click();
    await page.getByPlaceholder('Search...', { exact: true }).fill(oldest);
    await expect.soft(picker.getByRole('heading', { name: oldest, exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Close recipe picker', exact: true }).click();

    await page.getByRole('button', { name: 'Add to List', exact: true }).click();
    const notice = page.getByRole('alert').locator('p');
    await expect(notice).not.toBeEmpty();
    await expect.soft(notice).toHaveText('Added 1 item to your shopping list.', { timeout: 5000 });
    // The notice follows the write, but read the database back by polling.
    await expect.poll(async () => (await g8GrocerySnapshot(client.db, uid)).map(row => row.data)).toEqual([
      { name: 'GD Lentils', quantity: 2, unit: 'cups', aisle: expect.any(String), isChecked: false, mealPlanId: planId, source: 'generated', createdAt: expect.anything() },
    ]);
    const after = await g4Snapshot(client.db, uid);
    for (const name of ['recipes', 'mealPlans', 'pantryItems', 'weightHistory']) expect(after.collections[name]).toEqual(before.collections[name]);
    expect(after.user).toEqual(before.user);
    expect(failures).toEqual([]);
  });

  test('G-D a malformed planned recipe id is skipped instead of blocking Add to List', async ({ page }) => {
    const failures = collectConsoleFailures(page);
    const { client, uid } = await g4Account(page, 1440, 'gd-malformed');
    const title = 'GD Valid Bean Bowl';
    const recipeId = await seedRecipe(client.db, uid, title, {
      servings: 1, ingredients: [{ item: 'GD Valid Beans', quantity: '3', unit: 'cups', swaps: [] }],
    });
    const planId = await seedCurrentMealPlan(client.db, uid, recipeId, title);
    const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
    const plan = (await getDoc(planRef)).data()!;
    // Each id fails a real by-id read (checked on the emulator): "missing/recipe"
    // fails SDK path validation, "a/b/c" points outside the recipes collection
    // and is denied, ".." and "__reserved__" are refused by Firestore.
    // main skipped all of them; one bad meal must not block the valid one.
    ['missing/recipe', 'a/b/c', '..', '__reserved__'].forEach((badId, index) => plan.days[0].meals.push({
      ...plan.days[0].meals[0], id: `gd-malformed-${index}`, recipeId: badId, name: `GD Malformed ${index}`, type: 'snack',
    }));
    await setDoc(planRef, plan);
    const sentinel = { name: 'GD Manual Sentinel', quantity: 1, unit: 'pcs', aisle: 'Other', source: 'manual', isChecked: true };
    await setDoc(doc(client.db, 'users', uid, 'groceryItems', 'gd-manual'), sentinel);
    const before = await g4Snapshot(client.db, uid);

    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: 'Add to List', exact: true }).click();
    const notice = page.getByRole('alert').locator('p');
    await expect(notice).not.toBeEmpty();
    await expect.soft(notice).toHaveText('Added 1 item to your shopping list.', { timeout: 5000 });
    await expect.poll(async () => (await g8GrocerySnapshot(client.db, uid)).filter(row => row.id !== 'gd-manual').map(row => row.data)).toEqual([
      { name: 'GD Valid Beans', quantity: 3, unit: 'cups', aisle: expect.any(String), isChecked: false, mealPlanId: planId, source: 'generated', createdAt: expect.anything() },
    ]);
    expect((await getDoc(doc(client.db, 'users', uid, 'groceryItems', 'gd-manual'))).data()).toEqual(sentinel);
    const after = await g4Snapshot(client.db, uid);
    for (const name of ['recipes', 'mealPlans', 'pantryItems', 'weightHistory']) expect(after.collections[name]).toEqual(before.collections[name]);
    expect(after.user).toEqual(before.user);
    expect(failures).toEqual([]);
  });
});

test.describe('VM-054 unsent saves note', () => {
  const copy = 'Not saved yet. Keep this page open until your changes are saved.';
  const note = (page: Page) => page.getByRole('status').filter({ hasText: copy });

  async function holdWrites(page: Page) {
    const pattern = '**/google.firestore.v1.Firestore/Write/**';
    let resume!: () => void;
    const gate = new Promise<void>(resolve => { resume = resolve; });
    let held = 0;
    let released = false;
    const handler = async (route: Route) => {
      held++;
      await gate;
      await route.continue();
    };
    await page.route(pattern, handler);
    return {
      count: () => held,
      release: async () => {
        if (released) return;
        released = true;
        resume();
        await page.unroute(pattern, handler);
      },
    };
  }

  async function expectUnloadWarning(page: Page) {
    const warning = page.waitForEvent('dialog', { timeout: 5000 });
    await page.close({ runBeforeUnload: true });
    const dialog = await warning;
    const type = dialog.type();
    await dialog.dismiss();
    expect(type).toBe('beforeunload');
    expect(page.isClosed()).toBe(false);
  }

  async function expectNoUnloadWarning(page: Page) {
    const dialogs: string[] = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.type());
      await dialog.dismiss();
    });
    await page.close({ runBeforeUnload: true });
    // close(runBeforeUnload) returns before unloading; wait for the real close.
    await expect.poll(() => ({ closed: page.isClosed(), dialogs })).toEqual({ closed: true, dialogs: [] });
  }

  async function expectNoticeFits(page: Page, confirm?: Locator) {
    const status = note(page);
    await expect(status).toHaveText(copy);
    await expect(status).toHaveCSS('pointer-events', 'none');
    expect(await status.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const box = (await status.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThan(viewport.height - 64);
    const controls = [...await page.getByRole('navigation').all(), ...(confirm ? [confirm] : [])];
    for (const control of controls) {
      if (!await control.isVisible()) continue;
      const other = (await control.boundingBox())!;
      expect(box.x + box.width <= other.x || other.x + other.width <= box.x ||
        box.y + box.height <= other.y || other.y + other.height <= box.y).toBe(true);
    }
  }

  async function mealFixture(page: Page, width: number, label: string, atCap = false) {
    const { client, uid } = await g4Account(page, width, 'vm054-' + label);
    const name = `VM054 ${label} dinner ${width}`;
    const mealId = 'vm054-meal';
    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: mealId, name, type: 'dinner', isEaten: false },
    ]);
    const ref = doc(client.db, 'users', uid, 'mealPlans', planId);
    if (atCap) {
      // Same real 200-key rules boundary as G-B, without changing its helpers.
      const mealStatus = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`vm054-old-${i}`, false]));
      await setDoc(ref, { mealStatus }, { merge: true });
    }
    await page.goto('/plan');
    await settlePlanner(page);
    const tick = page.getByRole('button', { name: `Mark as eaten: ${name}`, exact: true });
    const ticked = page.getByRole('button', { name: `Mark as not eaten: ${name}`, exact: true });
    await expect(tick).toBeVisible();
    return { name, tick, ticked, stored: async () => (await getDoc(ref)).data()?.mealStatus?.[mealId] };
  }

  async function groceryFixture(page: Page, width: number, label: string) {
    const { client, uid } = await g4Account(page, width, 'vm054-' + label);
    const name = `VM054 ${label} apples ${width}`;
    await seedGroceryItem(client.db, uid, { name, source: 'manual' });
    const items = await getDocs(collection(client.db, 'users', uid, 'groceryItems'));
    expect(items.size).toBe(1);
    const ref = items.docs[0].ref;
    await page.goto('/grocery');
    const tick = page.getByRole('button', { name: `Mark as purchased: ${name}`, exact: true });
    const ticked = page.getByRole('button', { name: `Mark as not purchased: ${name}`, exact: true });
    await expect(tick).toBeVisible();
    return { tick, ticked, stored: async () => (await getDoc(ref)).data()?.isChecked };
  }

  for (const width of [1440, 390]) {
    test(`meal tick warns while held, then saves and clears at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const meal = await mealFixture(page, width, 'held');
      const hold = await holdWrites(page);
      try {
        await meal.tick.click();
        await expect(meal.ticked).toBeVisible();
        await expect(note(page)).toBeHidden();
        // The unload guard is immediate, even before the delayed note appears.
        await expectUnloadWarning(page);
        await expect.poll(hold.count).toBeGreaterThan(0);
        await expect(note(page)).toBeVisible();
        await expectNoticeFits(page, page.getByRole('button', { name: 'Confirm Plan', exact: true }));
        await expect.poll(meal.stored).toBeUndefined();
        await hold.release();
        await expect(note(page)).toBeHidden();
        await expect.poll(meal.stored).toBe(true);
        await expectNoUnloadWarning(page);
        expect(failures).toEqual([]);
      } finally {
        await hold.release();
      }
    });

    test(`grocery tick warns while held, then saves and clears at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const grocery = await groceryFixture(page, width, 'held');
      const hold = await holdWrites(page);
      try {
        await grocery.tick.click();
        await expect(grocery.ticked).toHaveAttribute('aria-pressed', 'true');
        await expect(note(page)).toBeHidden();
        const row = grocery.ticked.locator('..');
        const rowBeforeNotice = await row.boundingBox();
        expect(rowBeforeNotice).not.toBeNull();
        await expectUnloadWarning(page);
        await expect.poll(hold.count).toBeGreaterThan(0);
        await expect(note(page)).toBeVisible();
        expect(await row.boundingBox()).toEqual(rowBeforeNotice);
        await expectNoticeFits(page);
        await expect.poll(grocery.stored).toBe(false);
        await hold.release();
        await expect(note(page)).toBeHidden();
        await expect.poll(grocery.stored).toBe(true);
        await expectNoUnloadWarning(page);
        expect(failures).toEqual([]);
      } finally {
        await hold.release();
      }
    });

    test(`a fast normal save never shows the note or warns at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page);
      const grocery = await groceryFixture(page, width, 'fast');
      // Observe every insertion, so a fleeting note cannot pass a final hidden assertion.
      await page.evaluate(text => {
        const state = window as typeof window & { vm054NoteSeen: boolean };
        state.vm054NoteSeen = false;
        const inspect = () => {
          state.vm054NoteSeen ||= [...document.querySelectorAll('[role="status"]')]
            .some(el => el.textContent?.trim() === text);
        };
        new MutationObserver(inspect).observe(document.body, { childList: true, subtree: true });
        inspect();
      }, copy);
      await grocery.tick.click();
      await expect(grocery.ticked).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(grocery.stored).toBe(true);
      // This negative temporal assertion must outlast the 1.5-second threshold.
      await page.waitForTimeout(1700);
      await expect(note(page)).toBeHidden();
      expect(await page.evaluate(() => (window as typeof window & { vm054NoteSeen: boolean }).vm054NoteSeen)).toBe(false);
      await expectNoUnloadWarning(page);
      expect(failures).toEqual([]);
    });

    test(`an offline grocery tick keeps the note until reconnection at ${width}px`, async ({ page, context }) => {
      const grocery = await groceryFixture(page, width, 'offline');
      await context.setOffline(true);
      try {
        await grocery.tick.click();
        await expect(grocery.ticked).toHaveAttribute('aria-pressed', 'true');
        await expect(note(page)).toBeVisible();
        await expectUnloadWarning(page);
        await expect.poll(grocery.stored).toBe(false);
        await page.waitForTimeout(1700);
        await expect(note(page)).toBeVisible();
        await expectNoticeFits(page);
      } finally {
        await context.setOffline(false);
      }
      await expect.poll(grocery.stored).toBe(true);
      await expect(note(page)).toBeHidden();
      await expect(grocery.ticked).toHaveAttribute('aria-pressed', 'true');
      await expectNoUnloadWarning(page);
    });

    test(`a refused meal tick clears the note and unload guard at ${width}px`, async ({ page }) => {
      const failures = collectConsoleFailures(page, [/PERMISSION_DENIED/, /Missing or insufficient permissions/i]);
      const meal = await mealFixture(page, width, 'refused', true);
      const hold = await holdWrites(page);
      try {
        await meal.tick.click();
        await expect(meal.ticked).toBeVisible();
        await expect.poll(hold.count).toBeGreaterThan(0);
        await expect(note(page)).toBeVisible();
        await hold.release();
        await expect(page.getByRole('alert')).toContainText(`Could not save your change to ${meal.name}`);
        await expect(meal.tick).toBeVisible();
        await expect(note(page)).toBeHidden();
        await expect.poll(meal.stored).toBeUndefined();
        await expectNoUnloadWarning(page);
        expect(failures).toEqual([]);
      } finally {
        await hold.release();
      }
    });
  }
});

/** Opacity of a control and the parents that affect its visibility. */
function shownOpacity(locator: Locator, levels: number) {
  return locator.evaluate((element, depth) => {
    let node: Element | null = element;
    let value = 1;
    for (let i = 0; node && i <= depth; i++, node = node.parentElement) {
      value *= Number(getComputedStyle(node).opacity);
    }
    return value;
  }, levels);
}

test.describe('1.0 G1 R1 touch controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('shows five controls and performs each action on a touch phone', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r1-touch');
    const meal = 'R1 Touch Bowl';
    const snack = 'R1 Touch Yogurt';
    const snackId = 'r1-touch-snack';
    const grocery = 'R1 Touch Oats';
    const asset = ref(client.storage, `users/${uid}/recipes/r1-bowl.png`);
    await uploadBytes(asset, g10Png, { contentType: 'image/png' });
    const imageUrl = await getDownloadURL(asset);
    const recipeId = await seedRecipe(client.db, uid, meal, { imageUrl });
    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: recipeId, name: meal, type: 'dinner', isEaten: false },
      { id: snackId, name: snack, type: 'snack', isEaten: false },
    ]);
    await seedGroceryItem(client.db, uid, { name: grocery, source: 'manual' });
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches), 'touch profile has no hover').toBe(false);

    // Keep the opacity checks soft so the unfixed run can exercise all five controls.
    const expectOpacity = expect.configure({ soft: true, timeout: 1000 });
    await page.goto('/plan');
    await settlePlanner(page);
    const tick = page.getByRole('button', { name: `Mark as eaten: ${meal}`, exact: true });
    const swap = page.getByRole('button', { name: `Swap ${meal}`, exact: true });
    await expect(tick).toBeVisible();
    await expect(swap).toBeVisible();
    await expectOpacity.poll(() => shownOpacity(tick, 1), { message: 'meal tick control opacity' }).toBe(1);
    await expectOpacity.poll(() => shownOpacity(swap, 1), { message: 'meal swap control opacity' }).toBe(1);
    const tickRight = await tick.evaluate(button => button.getBoundingClientRect().right);
    const swapLeft = await swap.evaluate(button => button.getBoundingClientRect().left);
    expect(tickRight, 'meal tick and swap controls have separate tap targets').toBeLessThanOrEqual(swapLeft);

    await swap.tap();
    const picker = page.getByRole('heading', { name: 'Select Dinner', exact: true });
    await expect(picker).toBeVisible();
    await page.getByRole('button', { name: 'Close recipe picker', exact: true }).tap();
    await expect(picker).toBeHidden();
    await tick.tap();
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${meal}`, exact: true })).toHaveAttribute('aria-pressed', 'true');

    const snackTick = page.getByRole('button', { name: `Mark as eaten: ${snack}`, exact: true });
    await expect(snackTick).toBeVisible();
    await expectOpacity.poll(() => shownOpacity(snackTick, 0), { message: 'snack tick control opacity' }).toBe(1);
    const snackCircle = snackTick.getByText('circle', { exact: true });
    const snackDrink = snackTick.locator('../..').getByText('local_drink', { exact: true });
    await expectOpacity.poll(() => snackCircle.evaluate(element => {
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Canvas context is required to read the snack circle colour');
      context.fillStyle = getComputedStyle(element).color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3] / 255;
    }), { message: 'unticked phone snack circle alpha' }).toBe(1);
    await expectOpacity(snackCircle).toHaveCSS('color', 'rgb(168, 163, 184)');
    await expectOpacity.poll(() => shownOpacity(snackDrink, 0), { message: 'unticked phone snack drink icon opacity' }).toBe(0);
    await snackTick.tap();
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${snack}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    const plan = doc(client.db, 'users', uid, 'mealPlans', planId);
    await expect.poll(async () => (await getDoc(plan)).data()?.mealStatus).toMatchObject({ [recipeId]: true, [snackId]: true });

    await page.goto('/grocery');
    const deleteItem = page.getByRole('button', { name: `Delete grocery item: ${grocery}`, exact: true });
    const itemName = page.getByText(grocery, { exact: true });
    await expect(itemName).toBeVisible();
    await expect(deleteItem).toBeVisible();
    await expectOpacity.poll(() => shownOpacity(deleteItem, 0), { message: 'grocery delete control opacity' }).toBe(1);
    await deleteItem.tap();
    await expect(itemName).toHaveCount(0);

    await page.goto('/recipes');
    const form = await g10OpenForm(page, meal);
    const photo = form.getByRole('img', { name: meal, exact: true });
    const removePhoto = form.getByRole('button', { name: 'Remove recipe image', exact: true });
    await expect(photo).toBeVisible();
    await expect(photo).toHaveJSProperty('naturalWidth', 32);
    await expect(removePhoto).toBeVisible();
    await expectOpacity.poll(() => shownOpacity(removePhoto, 0), { message: 'remove photo control opacity' }).toBe(1);
    await removePhoto.tap();
    await expect(photo).toHaveCount(0);
    await expect(form.getByLabel('Recipe Image', { exact: true })).toHaveValue('');
    const discardRecipe = acceptNextDialog(page);
    await form.getByRole('button', { name: 'Cancel', exact: true }).tap();
    await discardRecipe;
    await expect(page.getByRole('heading', { name: 'Edit Recipe', exact: true })).toBeHidden();
  });
});

test.describe('1.0 G1 R1 desktop hover guard', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, hasTouch: false, isMobile: false });

  test('shows the meal tick on hover and keeps it shown once eaten', async ({ page }) => {
    const { client, uid } = await g4Account(page, 1440, 'r1-desktop');
    const meal = 'R1 Desktop Bowl';
    const mealId = 'r1-desktop-meal';
    const snack = 'R1 Desktop Yogurt';
    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: mealId, name: meal, type: 'dinner', isEaten: false },
      { id: 'r1-desktop-snack', name: snack, type: 'snack', isEaten: false },
    ]);

    await page.goto('/plan');
    await settlePlanner(page);
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches), 'desktop profile has hover').toBe(true);
    const tick = page.getByRole('button', { name: `Mark as eaten: ${meal}`, exact: true });
    await expect(tick).toBeVisible();
    const card = tick.locator('../..');
    await expect.poll(() => shownOpacity(tick, 1), { message: 'unhovered desktop meal tick opacity' }).toBe(0);
    const snackTick = page.getByRole('button', { name: `Mark as eaten: ${snack}`, exact: true });
    const snackCircle = snackTick.getByText('circle', { exact: true });
    const snackDrink = snackTick.locator('../..').getByText('local_drink', { exact: true });
    await expect.poll(() => shownOpacity(snackTick, 0), { message: 'unhovered desktop snack tick opacity' }).toBe(0);
    await expect.poll(() => shownOpacity(snackDrink, 0), { message: 'unhovered desktop snack drink icon opacity' }).toBe(1);
    const snackColour = await snackCircle.evaluate(element => {
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Canvas context is required to read the snack circle colour');
      context.fillStyle = getComputedStyle(element).color;
      context.fillRect(0, 0, 1, 1);
      const actual = Array.from(context.getImageData(0, 0, 1, 1).data);
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = 'rgb(168 163 184 / 20%)';
      context.fillRect(0, 0, 1, 1);
      return { actual, expected: Array.from(context.getImageData(0, 0, 1, 1).data) };
    });
    expect(snackColour.actual, 'unhovered desktop snack circle keeps its 20%-alpha secondary colour').toEqual(snackColour.expected);
    await card.hover();
    await expect.poll(() => shownOpacity(tick, 1), { message: 'hovered desktop meal tick opacity' }).toBe(1);

    await tick.click();
    const eatenTick = page.getByRole('button', { name: `Mark as not eaten: ${meal}`, exact: true });
    await expect(eatenTick).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Next week', exact: true }).hover();
    await expect.poll(() => shownOpacity(eatenTick, 1), { message: 'eaten desktop meal tick opacity' }).toBe(1);
    const plan = doc(client.db, 'users', uid, 'mealPlans', planId);
    await expect.poll(async () => (await getDoc(plan)).data()?.mealStatus?.[mealId]).toBe(true);
  });
});

test.describe('1.0 G2 R2 grocery ticks per week', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("R2: a new week's grocery list does not start with last week's ticks", async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r2-grocery-week');
    const meal = 'R2 Chicken Bowl';
    const recipeId = await seedRecipe(client.db, uid, meal);
    const thisWeek = getMondayWeekStart();
    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekPlan = await seedMealPlanForWeek(client.db, uid, lastWeek, recipeId, meal);
    const thisWeekPlan = await seedMealPlanForWeek(client.db, uid, thisWeek, recipeId, meal);
    await addDoc(collection(client.db, 'users', uid, 'groceryItems'), {
      name: 'Chicken breast', quantity: 1.5, unit: 'oz', aisle: 'Proteins', isChecked: true,
      source: 'generated', mealPlanId: lastWeekPlan, createdAt: Timestamp.now(),
    });

    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: 'Add to List', exact: true }).click();
    await expect(page.getByRole('alert').locator('p')).toHaveText(/^Added 1 item to your shopping list\./);

    const items = (await getDocs(collection(client.db, 'users', uid, 'groceryItems'))).docs.map(record => record.data());
    expect(items).toHaveLength(1);
    expect(items[0].mealPlanId).toBe(thisWeekPlan);
    expect(items[0].isChecked, "this week's chicken must still be on the to-buy list").toBe(false);

    await page.getByRole('button', { name: 'Dismiss meal planner message', exact: true }).click();
    await page.locator('header button').first().click();
    await page.locator('aside').last().locator('a[href="/grocery"]').click();
    await expect(page.getByRole('button', { name: 'Mark as purchased: Chicken breast', exact: true })).toHaveAttribute('aria-pressed', 'false');
  });
});


test.describe('1.0 G3 R3 honest loading', () => {
  test.afterEach(async ({ context }) => { await context.setOffline(false); });

  test('R3: with no connection, the Planner does not say a saved week has no plan', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 1440, 'r3-planner');
    const meal = 'R3 Next Week Stew';
    const recipeId = await seedRecipe(client.db, uid, meal);
    const nextWeek = getMondayWeekStart();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const planId = await seedMealPlanForWeek(client.db, uid, nextWeek, recipeId, meal);
    const savedPlan = (await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId))).data();
    await clickNav(page, '/plan');
    await settlePlanner(page);

    await context.setOffline(true);
    await page.getByRole('button', { name: 'Next week', exact: true }).click();
    await expect(page.getByText(/No plan found for this week|Could not load this week/)).toBeVisible();
    await expect(page.getByText(/No plan found for this week/)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Create New Plan', exact: true })).toBeHidden();
    await expect(page.getByText('Could not load this week', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Maybe Later', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeEnabled();

    await context.setOffline(false);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText(meal, { exact: true })).toBeVisible();
    await expect(page.getByText('Could not load this week', { exact: true })).toBeHidden();
    expect((await getDoc(doc(client.db, 'users', uid, 'mealPlans', planId))).data()).toEqual(savedPlan);

    await clickNav(page, '/');
    await context.setOffline(true);
    await clickNav(page, '/plan');
    await expect(page.getByText(meal, { exact: true })).toBeVisible();
    await expect(page.getByText('Could not load this week', { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Create New Plan', exact: true })).toBeHidden();
  });

  test('R3: an unread offline recipe library shows an error and retries', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 1440, 'r3-recipes');
    const title = 'R3 Saved Recipe';
    await seedRecipe(client.db, uid, title);
    // Load the route module while online without mounting it or reading recipes.
    await page.evaluate(async (modulePath) => { await import(modulePath); }, '/src/features/recipes/RecipeLibrary.tsx');

    await context.setOffline(true);
    await clickNav(page, '/recipes');
    await expect(page.getByText(/No recipes found|Could not load your recipes/)).toBeVisible();
    await expect(page.getByText('No recipes found', { exact: true })).toBeHidden();
    await expect(page.getByText('Could not load your recipes', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeEnabled();

    await context.setOffline(false);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('Could not load your recipes', { exact: true })).toBeHidden();

    await clickNav(page, '/');
    await context.setOffline(true);
    await clickNav(page, '/recipes');
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('Could not load your recipes', { exact: true })).toBeHidden();
    await expect(page.getByText('No recipes found', { exact: true })).toBeHidden();
  });

  test('R3: creating after an offline load error clears the error after deletion', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 1440, 'r3-create-recovery');
    const title = 'R3 Recipe After Reconnection';
    expect((await getDocs(collection(client.db, 'users', uid, 'recipes'))).empty).toBe(true);
    await page.evaluate(async (modulePath) => { await import(modulePath); }, '/src/features/recipes/RecipeLibrary.tsx');
    await context.setOffline(true);
    await clickNav(page, '/recipes');
    await expect(page.getByText('Could not load your recipes', { exact: true })).toBeVisible();

    await context.setOffline(false);
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByPlaceholder('e.g., Mediterranean Chicken Bowl').fill(title);
    await page.getByPlaceholder('450').fill('520');
    await page.getByPlaceholder('35').fill('42');
    await page.getByRole('button', { name: 'check Create Recipe', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Delete recipe: ' + title, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Delete Recipe?', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
    expect((await getDocs(collection(client.db, 'users', uid, 'recipes'))).empty).toBe(true);
    await expect(page.getByText('Could not load your recipes', { exact: true })).toBeHidden();
    await expect(page.getByText('No recipes found', { exact: true })).toBeVisible();
  });
});

test.describe('1.0 G4 R4 not saved yet', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.afterEach(async ({ context }) => { await context.setOffline(false); });

  const note = (page: Page) => page.getByRole('status').filter({
    hasText: 'Not saved yet. Keep this page open until your changes are saved.',
  });

  test('offline grocery add shows the note and saves exactly once after reconnecting', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-grocery-offline');
    const name = 'R4 Offline Apples';
    const stored = async () => (await getDocs(collection(client.db, 'users', uid, 'groceryItems'))).docs.map(item => item.data().name);
    await page.goto('/grocery');
    const input = page.getByPlaceholder('Quick add item (e.g. 2 avocados)...');
    await input.fill(name);
    await context.setOffline(true);
    await input.press('Enter');
    await expect(note(page)).toBeVisible();
    await expect(input).toBeEditable();
    await expect(page.getByRole('button', { name: 'Add grocery item', exact: true })).toBeEnabled();
    expect(await stored()).toEqual([]);
    await input.press('Enter');
    await context.setOffline(false);
    await expect(input).toHaveValue('');
    await expect(note(page)).toBeHidden();
    expect(await stored()).toEqual([name]);
    await page.reload();
    await expect(page.getByRole('button', { name: `Mark as purchased: ${name}`, exact: true })).toHaveCount(1);
  });

  test('pressing Enter twice online adds exactly one grocery item', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-grocery-double');
    const name = 'R4 Double Pears';
    await page.goto('/grocery');
    const input = page.getByPlaceholder('Quick add item (e.g. 2 avocados)...');
    await input.fill(name);
    // Deliver the two real key events before either server acknowledgement.
    await input.evaluate(element => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await expect(input).toHaveValue('');
    const stored = await getDocs(collection(client.db, 'users', uid, 'groceryItems'));
    expect(stored.docs.map(item => item.data().name), 'two Enter presses must create exactly one item').toEqual([name]);
    await page.reload();
    await expect(page.getByRole('button', { name: `Mark as purchased: ${name}`, exact: true })).toHaveCount(1);
    await expect(note(page)).toBeHidden();
  });

  test('offline recipe save shows the note, allows Cancel, and saves exactly once after reconnecting', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-recipe-offline');
    const title = 'R4 Offline Recipe';
    const stored = async () => (await getDocs(collection(client.db, 'users', uid, 'recipes'))).docs.map(recipe => recipe.data().title);
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByLabel('Recipe Name *', { exact: true }).fill(title);
    await page.getByPlaceholder('450').fill('520');
    await page.getByPlaceholder('35').fill('42');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'check Create Recipe', exact: true }).click();
    await expect(note(page)).toBeVisible();
    const form = page.getByRole('heading', { name: 'New Recipe', exact: true });
    if (await form.isVisible()) {
      await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeEnabled();
      const discardRecipe = acceptNextDialog(page);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await discardRecipe;
    }
    await expect(form).toBeHidden();
    await expect(note(page)).toBeVisible();
    expect(await stored()).toEqual([]);
    await context.setOffline(false);
    await expect(note(page)).toBeHidden();
    await expect.poll(stored).toEqual([title]);
    await page.reload();
    await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(1);
  });
});

test.describe('1.0 G4 round 1 responsive saves', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.afterEach(async ({ context }) => { await context.setOffline(false); });
  const note = (page: Page) => page.getByRole('status').filter({ hasText: 'Not saved yet. Keep this page open until your changes are saved.' });

  test('offline water updates immediately and accepts a second tap', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-round1-water');
    const card = page.getByRole('heading', { name: 'Hydration', exact: true }).locator('xpath=ancestor::div[contains(@class,"group")][1]');
    const add = card.getByRole('button', { name: '+250ml', exact: true });
    const displayed = async () => Number((await card.textContent())?.match(/(\d+)\s*ml\s*Goal/)?.[1]);
    await context.setOffline(true);
    await add.click();
    await expect.poll(async () => ({ enabled: await add.isEnabled(), water: await displayed() })).toEqual({ enabled: true, water: 250 });
    await add.click();
    await expect.poll(displayed).toBe(500);
    await expect(add).toBeEnabled();
    await expect(note(page)).toBeVisible();
    expect((await getDocs(collection(client.db, 'users', uid, 'weightHistory'))).size).toBe(0);
    await context.setOffline(false);
    await expect(note(page)).toBeHidden();
    await expect.poll(async () => (await getDocs(collection(client.db, 'users', uid, 'weightHistory'))).docs.map(item => item.data().waterMl)).toEqual([500]);
    await expect.poll(displayed).toBe(500);
  });

  test('offline Settings releases Saving while the pending note remains', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-round1-settings-button');
    await page.goto('/settings');
    await page.getByLabel('Daily Calorie Target', { exact: true }).fill('2300');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Confirm Targets', exact: true }).click();
    await expect(note(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Confirm Targets', exact: true })).toBeEnabled();
    await context.setOffline(false);
    await expect(note(page)).toBeHidden();
    expect((await getDoc(doc(client.db, 'users', uid))).data()?.settings.dailyCalorieTarget).toBe(2300);
  });

  test('Settings preserves draft B when pending save A completes', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-round1-settings-draft');
    await page.goto('/settings');
    const target = page.getByLabel('Daily Calorie Target', { exact: true });
    await target.fill('2300');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Confirm Targets', exact: true }).click();
    await expect(note(page)).toBeVisible();
    await target.fill('2450');
    await context.setOffline(false);
    await expect(note(page)).toBeHidden();
    await expect(target).toHaveValue('2450');
    await expect(page.getByRole('button', { name: 'Confirm Targets', exact: true })).toBeEnabled();
    expect((await getDoc(doc(client.db, 'users', uid))).data()?.settings.dailyCalorieTarget).toBe(2300);
    await page.getByRole('button', { name: 'Confirm Targets', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Discard', exact: true })).toBeHidden();
    expect((await getDoc(doc(client.db, 'users', uid))).data()?.settings.dailyCalorieTarget).toBe(2450);
  });

  test('offline recipe steps aside and New Recipe opens a fresh usable form', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-round1-recipe-launch');
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    const title = page.getByLabel('Recipe Name *', { exact: true });
    await title.fill('Round 1 Pending Recipe');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'check Create Recipe', exact: true }).click();
    await expect(note(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New Recipe', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'New Recipe', exact: true })).toBeVisible();
    await expect(title).toHaveValue('');
    await title.fill('Round 1 Fresh Draft');
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeEnabled();
    await context.setOffline(false);
    await expect(note(page)).toBeHidden();
    await expect(title).toHaveValue('Round 1 Fresh Draft');
    const discardRecipe = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await discardRecipe;
    expect((await getDocs(collection(client.db, 'users', uid, 'recipes'))).docs.map(recipe => recipe.data().title)).toEqual(['Round 1 Pending Recipe']);
  });
});

test.describe('1.0 G4 round 2 latest Settings intent', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.afterEach(async ({ context }) => { await context.setOffline(false); });

  test('the last confirmation wins for offline A then B then A', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-round2-latest-settings');
    const profile = doc(client.db, 'users', uid);
    const storedTarget = async () => (await getDoc(profile)).data()?.settings.dailyCalorieTarget;
    await page.goto('/settings');
    const target = page.getByLabel('Daily Calorie Target', { exact: true });
    const confirm = page.getByRole('button', { name: 'Confirm Targets', exact: true });
    const note = page.getByRole('status').filter({ hasText: 'Not saved yet. Keep this page open until your changes are saved.' });
    await target.fill('2300');
    await context.setOffline(true);
    await confirm.click();
    await expect(note).toBeVisible();
    await target.fill('2450');
    await confirm.click();
    await target.fill('2300');
    await confirm.click();
    await expect(confirm).toBeEnabled();
    await context.setOffline(false);
    await expect(note).toBeHidden();
    await expect.poll(storedTarget, { message: 'the server must keep the last confirmed target A' }).toBe(2300);
    await expect(target).toHaveValue('2300');
    await expect(page.getByRole('button', { name: 'Discard', exact: true })).toBeHidden();
  });
});

test.describe('1.0 G4 round 2 recipe recovery', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.afterEach(async ({ context }) => { await context.setOffline(false); });

  test('a late recipe rejection identifies and reopens its captured draft', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r4-round2-recipe-recovery');
    const rejectedTitle = 'Recover this recipe ' + 'x'.repeat(200);
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    const title = page.getByLabel('Recipe Name *', { exact: true });
    await title.fill(rejectedTitle);
    await page.getByPlaceholder('450').fill('520');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'check Create Recipe', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'New Recipe', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await title.fill('Fresh recipe draft');
    await context.setOffline(false);
    await expect(page.getByRole('status').filter({ hasText: 'Not saved yet.' })).toBeHidden();
    await expect(title).toHaveValue('Fresh recipe draft');
    const discardRecipe = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await discardRecipe;
    await expect(page.getByRole('alert').filter({ hasText: rejectedTitle })).toContainText('Could not save recipe');
    await page.getByRole('button', { name: 'Recover recipe ' + rejectedTitle, exact: true }).click();
    await expect(title).toHaveValue(rejectedTitle);
    await expect(page.getByPlaceholder('450')).toHaveValue('520');
    await title.fill('Recovered round 2 recipe');
    await page.getByRole('button', { name: 'check Save Changes', exact: true }).click();
    await expect.poll(async () => (await getDocs(collection(client.db, 'users', uid, 'recipes'))).docs.map(recipe => recipe.data().title)).toEqual(['Recovered round 2 recipe']);
  });
});

test.describe('1.0 G5 R5 R6 recipe form', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('R5 backdrop preserves the typed recipe title', async ({ page }) => {
    await g4Account(page, 390, 'g5-backdrop');
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByLabel('Recipe Name *', { exact: true }).fill('Keep my typed recipe');
    await page.locator('.fixed.inset-0.z-50 > .absolute.inset-0').tap({ position: { x: 2, y: 2 } });
    expect(await page.getByRole('heading', { name: 'New Recipe', exact: true }).isVisible(),
      'R5 backdrop must keep the unsaved recipe form open').toBe(true);
    await expect(page.getByLabel('Recipe Name *', { exact: true })).toHaveValue('Keep my typed recipe');
  });

  test('R5 Cancel asks before discarding and Keep editing preserves the title', async ({ page }) => {
    await g4Account(page, 390, 'g5-cancel');
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByLabel('Recipe Name *', { exact: true }).fill('Keep editing this recipe');
    const questions: string[] = [];
    page.once('dialog', async dialog => {
      questions.push(dialog.message());
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: 'Cancel', exact: true }).tap();
    expect(questions, 'R5 Cancel must ask before discarding the unsaved recipe').toEqual(['Discard this recipe?']);
    await expect(page.getByLabel('Recipe Name *', { exact: true })).toHaveValue('Keep editing this recipe');
    const discard = acceptNextDialog(page);
    await page.getByRole('button', { name: 'Close recipe form', exact: true }).tap();
    expect(await discard).toBe('Discard this recipe?');
    await expect(page.getByRole('heading', { name: 'New Recipe', exact: true })).toBeHidden();
  });

  test('R6 photo upload blocks Save and shows Uploading until the photo appears', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g5-photo');
    await page.goto('/recipes');
    await page.getByRole('button', { name: 'New Recipe', exact: true }).click();
    await page.getByLabel('Recipe Name *', { exact: true }).fill('Recipe with uploaded photo');
    let started!: () => void;
    let release!: () => void;
    const uploadStarted = new Promise<void>(resolve => { started = resolve; });
    const uploadReleased = new Promise<void>(resolve => { release = resolve; });
    await page.route(url => url.port === '9199', async route => {
      if (route.request().method() === 'POST') {
        started();
        await uploadReleased;
      }
      await route.continue();
    });
    try {
      await page.locator('.fixed input[type="file"]').setInputFiles({
        name: 'g5-photo.png', mimeType: 'image/png', buffer: g10Png,
      });
      await uploadStarted;
      await expect(page.getByRole('button', { name: 'check Create Recipe', exact: true })).toBeDisabled();
      await expect(page.getByRole('status').filter({ hasText: 'Uploading...' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeEnabled();
      expect((await getDocs(collection(client.db, 'users', uid, 'recipes'))).size).toBe(0);
    } finally {
      release();
    }
    const image = page.locator('.fixed').getByRole('img', { name: 'Recipe with uploaded photo', exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const uploadedUrl = await image.getAttribute('src');
    await expect(page.getByRole('status').filter({ hasText: 'Uploading...' })).toBeHidden();
    await page.getByRole('button', { name: 'check Create Recipe', exact: true }).click();
    await expect.poll(async () => (await getDocs(collection(client.db, 'users', uid, 'recipes'))).docs.map(recipe => recipe.data().imageUrl))
      .toEqual([uploadedUrl]);
  });
});

test.describe('1.0 G6 R7 no blank page', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('a bad day date leaves the Dashboard and valid plan days usable', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r7-bad-date');
    const planId = await seedCurrentMealPlan(client.db, uid, 'r7-valid-recipe', 'R7 Valid Dinner');
    const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
    const plan = (await getDoc(planRef)).data()!;
    const validDay = plan.days[0];
    plan.days = [
      { ...validDay, date: 'not-a-date', meals: [{ ...validDay.meals[0], id: 'r7-bad-format', name: 'R7 Bad Format Dinner' }] },
      { ...validDay, date: '2026-02-30', meals: [{ ...validDay.meals[0], id: 'r7-impossible-date', name: 'R7 Impossible Date Dinner' }] },
      validDay,
    ];
    await setDoc(planRef, plan);
    const before = await g4Snapshot(client.db, uid);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const renderError = page.waitForEvent('pageerror');
    await page.reload();
    await Promise.race([
      page.getByRole('heading', { name: /Weekly Planner/ }).waitFor(),
      renderError,
    ]);
    expect(await page.getByRole('heading', { name: 'Hydration', exact: true }).count(),
      `Dashboard must survive bad day dates; page errors: ${errors.join('; ')}`).toBe(1);
    await expect(page.getByText('R7 Valid Dinner', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reload', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: /Start Check-In/ }).click();
    await page.getByRole('button', { name: 'Close check-in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Check-In', exact: true })).toBeHidden();
    expect(errors).toEqual([]);
    expect(await g4Snapshot(client.db, uid)).toEqual(before);
  });

  test('a failed lazy page load shows Reload and recovers after reloading', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r7-lazy-load');
    const before = await g4Snapshot(client.db, uid);
    await expect(page.getByRole('button', { name: 'Reload', exact: true })).toHaveCount(0);
    const lazyPage = (url: URL) => url.pathname === '/src/features/settings/Settings.tsx';
    await page.route(lazyPage, route => route.abort('failed'));
    const failedRequest = page.waitForEvent('requestfailed', request => lazyPage(new URL(request.url())));
    const renderError = page.waitForEvent('pageerror');
    await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
    await page.locator('#mobile-navigation-drawer a[href="/settings"]').first().click();
    await failedRequest;
    await Promise.race([
      page.getByRole('button', { name: 'Reload', exact: true }).waitFor(),
      renderError,
    ]);
    expect(await page.locator('#root').innerText(), 'a failed lazy page must offer recovery instead of a blank page')
      .toContain("We couldn't open this page.");
    await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeEnabled();
    await expect(page).toHaveURL('http://127.0.0.1:5173/settings');
    await page.unroute(lazyPage);
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Reload', exact: true }).click(),
    ]);
    await expect(page.getByLabel('Daily Calorie Target', { exact: true })).toBeEditable();
    await expect(page.getByRole('button', { name: 'Reload', exact: true })).toHaveCount(0);
    expect(await g4Snapshot(client.db, uid)).toEqual(before);
  });
});


test.describe('1.0 G10b R13 ingredient validation', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('Add to List keeps Rice and normalized Butter and skips two invalid ingredients', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g10b-r13');
    const title = 'G10b Mixed Ingredients';
    const recipeId = await seedRecipe(client.db, uid, title, {
      servings: 1,
      ingredients: [
        { item: 'Rice', quantity: '2', unit: 'cups' },
        { item: 'x'.repeat(201), quantity: '1', unit: 'g' },
        { item: 'Milk', quantity: '100001', unit: 'ml' },
        { item: 'Butter', quantity: '1', unit: 'tablespoons (level, plus extra for greasing the pan)' },
      ],
    });
    const recipeRef = doc(client.db, 'users', uid, 'recipes', recipeId);
    const before = (await getDoc(recipeRef)).data();
    const planId = await seedCurrentMealPlan(client.db, uid, recipeId, title);
    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: /Add to List/ }).first().tap();
    const notice = page.getByRole('alert');
    await expect(notice).toBeVisible();
    expect(await notice.textContent(), 'R13 must skip two invalid contributions and complete the list').toMatch(/Skipped 2 ingredients/i);
    const saved = (await getDocs(collection(client.db, 'users', uid, 'groceryItems'))).docs.map(row => row.data());
    expect(saved.map(row => [row.name, row.quantity, row.unit, row.aisle, row.source, row.mealPlanId, row.isChecked]).sort()).toEqual([
      ['Butter', 1, 'tbsp (level, plus extra for greasing the pan)', 'Dairy', 'generated', planId, false],
      ['Rice', 2, 'cups', 'Pantry', 'generated', planId, false],
    ]);
    expect((await getDoc(recipeRef)).data()).toEqual(before);
    await page.goto('/grocery');
    await expect(page.getByText('Rice', { exact: true })).toBeVisible();
    await expect(page.getByText('Butter', { exact: true })).toBeVisible();
    await expect(page.getByText('Milk', { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('Rice', { exact: true })).toBeVisible();
    await expect(page.getByText('Butter', { exact: true })).toBeVisible();
    expect((await getDoc(recipeRef)).data()).toEqual(before);
  });
});

test.describe('1.0 G9 plan edits are kept', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('B12 R11 draft dinner and tick survive reload until Confirm Plan saves once', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g9-draft-reload');
    const title = 'G9 Draft Dinner';
    await seedRecipe(client.db, uid, title);
    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: 'add_circle Create New Plan', exact: true }).click();
    await page.getByRole('button', { name: 'auto_fix_high Open Plan Wizard', exact: true }).click();
    await page.getByRole('button', { name: 'grid_on Start from Scratch (Empty Grid)', exact: true }).click();
    await g4Day(page, 'Monday').getByText('Add Dinner', { exact: true }).click();
    await page.getByRole('heading', { name: title, exact: true }).click();
    await page.getByRole('button', { name: `Mark as eaten: ${title}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    const plans = collection(client.db, 'users', uid, 'mealPlans');
    expect((await getDocs(plans)).size).toBe(0);
    page.on('dialog', async dialog => { await dialog.accept(); });
    await page.reload();
    await settlePlanner(page);
    expect(await page.getByRole('heading', { name: title, exact: true }).count(),
      'B12 draft dinner must survive reload before Confirm Plan').toBe(1);
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    const bar = page.getByRole('status').filter({ hasText: 'Not saved yet' });
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect((await getDocs(plans)).size).toBe(0);
    await bar.getByRole('button', { name: /Confirm Plan/ }).click();
    await expect(bar).toBeHidden();
    const records = await getDocs(plans);
    expect(records.size).toBe(1);
    const plan = records.docs[0].data();
    const dinner = plan.days[0].meals.find((meal: { name: string }) => meal.name === title);
    expect(plan.mealStatus[dinner.id]).toBe(true);
    await page.reload();
    await settlePlanner(page);
    await expect(page.getByRole('button', { name: `Mark as not eaten: ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect((await getDocs(plans)).size).toBe(1);
    await expect(bar).toBeHidden();
  });

  test('R11 Planner start from scratch asks and Cancel keeps the saved meals', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g9-scratch-cancel');
    const title = 'G9 Saved Dinner';
    const recipeId = await seedRecipe(client.db, uid, title);
    const planId = await seedCurrentMealPlan(client.db, uid, recipeId, title);
    const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
    const before = (await getDoc(planRef)).data();
    await page.goto('/plan');
    await settlePlanner(page);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Plan Week/ }).click();
    const questions: string[] = [];
    page.on('dialog', async dialog => { questions.push(dialog.message()); await dialog.dismiss(); });
    await page.getByRole('button', { name: 'grid_on Start from Scratch (Empty Grid)', exact: true }).click();
    expect(questions.length, 'R11 starting from scratch must ask before replacing meals').toBe(1);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect((await getDoc(planRef)).data()).toEqual(before);
  });

  test('R12 Planner Add Tea lists snack recipes', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g9-tea');
    const recipeId = await seedRecipe(client.db, uid, 'G9 Existing Dinner');
    await seedCurrentMealPlan(client.db, uid, recipeId, 'G9 Existing Dinner');
    await seedRecipe(client.db, uid, 'G9 Tea Snack', { mealType: 'snack', folders: ['snack'] });
    await page.goto('/plan');
    await settlePlanner(page);
    await page.getByTitle('Toggle Daily Tea', { exact: true }).click();
    await g4Day(page, 'Monday').getByText('Add Tea', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Select Tea', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'G9 Tea Snack', exact: true }),
      'R12 Tea must list snack recipes through the slot mapping').toHaveCount(1);
    await page.getByRole('heading', { name: 'G9 Tea Snack', exact: true }).click();
    await expect(g4Day(page, 'Monday').getByRole('heading', { name: 'G9 Tea Snack', exact: true })).toBeVisible();
  });
});
test.describe('1.0 G9 draft recovery controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('G9 R2 C8 draft warns from another tab only when local storage fails and recovers', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'g9-reopen');
    await page.goto('/plan');
    await settlePlanner(page);
    await page.evaluate(() => {
      const state = window as typeof window & { g9R2SetItem?: typeof Storage.prototype.setItem };
      state.g9R2SetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('viomacro:plan-drafts:')) throw new DOMException('Storage full', 'QuotaExceededError');
        return state.g9R2SetItem!.call(this, key, value);
      };
    });
    await g9R2CreateDraft(page);
    await g9R2Navigate(page, '/recipes');
    const warned = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const warning = await warned;
    expect(warning.type()).toBe('beforeunload');
    await warning.dismiss();
    expect(page.isClosed()).toBe(false);
    await page.evaluate(() => {
      const state = window as typeof window & { g9R2SetItem?: typeof Storage.prototype.setItem };
      Storage.prototype.setItem = state.g9R2SetItem!;
      delete state.g9R2SetItem;
    });
    await g9R2Navigate(page, '/plan');
    await settlePlanner(page);
    await page.getByRole('button', { name: /Preferences/ }).first().click();
    await page.getByRole('spinbutton').first().fill('2300');
    await page.getByRole('button', { name: 'Save Targets', exact: true }).click();
    await g9R2Navigate(page, '/recipes');
    await g9R2CloseKeptDraft(page);
    const reopened = await context.newPage();
    await installAiCallableGuard(reopened);
    await reopened.goto('/plan');
    await settlePlanner(reopened);
    await expect(g9R2Bar(reopened)).toBeVisible();
    expect((await getDocs(collection(client.db, 'users', uid, 'mealPlans'))).size).toBe(0);
    await reopened.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await expect(g9R2Bar(reopened)).toBeHidden();
    await expect(reopened.getByText('No plan found for this week. Create a new one or check other weeks!', { exact: true })).toBeVisible();
    assertNoUnexpectedAiCalls(reopened);
    await reopened.close();
  });

  test('Planner Discard restores saved meals and draft ticks never write early', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g9-discard');
    const recipeId = await seedRecipe(client.db, uid, 'G9 Saved Meal');
    await seedRecipe(client.db, uid, 'G9 Unsaved Breakfast', { mealType: 'breakfast', folders: ['breakfast'] });
    const planId = await seedCurrentMealPlan(client.db, uid, recipeId, 'G9 Saved Meal');
    const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
    const before = (await getDoc(planRef)).data();
    await page.goto('/plan');
    await settlePlanner(page);
    await g4Day(page, 'Monday').getByText('Add Breakfast', { exact: true }).click();
    await page.getByRole('heading', { name: 'G9 Unsaved Breakfast', exact: true }).click();
    await page.getByRole('button', { name: 'Mark as eaten: G9 Unsaved Breakfast', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mark as not eaten: G9 Unsaved Breakfast', exact: true })).toBeVisible();
    expect((await getDoc(planRef)).data()).toEqual(before);
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'G9 Unsaved Breakfast', exact: true })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'G9 Saved Meal', exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Not saved yet' })).toBeHidden();
    expect((await getDoc(planRef)).data()).toEqual(before);
  });
});
test.describe('1.0 G9 latest draft tick', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('B12 latest local draft tick survives an older saved tick refusal', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g9-latest-tick');
    const title = 'G9 Existing Dinner';
    const mealId = 'g9-existing-dinner';
    await seedRecipe(client.db, uid, 'G9 Latest Breakfast', { mealType: 'breakfast', folders: ['breakfast'] });
    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: mealId, name: title, type: 'dinner', isEaten: false },
    ]);
    const planRef = doc(client.db, 'users', uid, 'mealPlans', planId);
    const mealStatus = Object.fromEntries(Array.from({ length: 200 }, (_, index) => [`g9-old-${index}`, false]));
    await setDoc(planRef, { mealStatus }, { merge: true });
    const before = (await getDoc(planRef)).data();
    await page.goto('/plan');
    await settlePlanner(page);
    const pattern = '**/google.firestore.v1.Firestore/Write/**';
    let release!: () => void;
    let held = 0;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const handler = async (route: Route) => {
      held++;
      await gate;
      await route.continue();
    };
    await page.route(pattern, handler);
    try {
      await page.getByRole('button', { name: `Mark as eaten: ${title}`, exact: true }).click();
      await expect.poll(() => held).toBeGreaterThan(0);
      await g4Day(page, 'Monday').getByText('Add Breakfast', { exact: true }).click();
      await page.getByRole('heading', { name: 'G9 Latest Breakfast', exact: true }).click();
      await page.getByRole('button', { name: `Mark as not eaten: ${title}`, exact: true }).click();
      await page.getByRole('button', { name: `Mark as eaten: ${title}`, exact: true }).click();
      const tick = page.getByRole('button', { name: /^Mark as (?:not )?eaten: G9 Existing Dinner$/ });
      await expect(tick).toHaveAttribute('aria-pressed', 'true');
      release();
      await expect(page.getByRole('alert').filter({ hasText: `Could not save your change to ${title}.` })).toBeVisible();
      await expect(tick, 'B12 an older saved-tick refusal must preserve the newer local draft tick').toHaveAttribute('aria-pressed', 'true');
      expect((await getDoc(planRef)).data()).toEqual(before);
      const bar = page.getByRole('status').filter({ hasText: 'Draft kept on this device' });
      await bar.getByRole('button', { name: /Confirm Plan/ }).click();
      await expect(bar).toBeHidden();
      const saved = (await getDoc(planRef)).data()!;
      expect(saved.mealStatus[mealId]).toBe(true);
      expect(saved.days[0].meals).toContainEqual(expect.objectContaining({ name: 'G9 Latest Breakfast' }));
      expect((await getDocs(collection(client.db, 'users', uid, 'mealPlans'))).size).toBe(1);
    } finally {
      release();
      await page.unroute(pattern, handler);
    }
  });
});

const g9R2Bar = (page: Page) => page.getByRole('status').filter({
  has: page.getByRole('button', { name: 'Discard changes', exact: true }),
});

async function g9R2CreateDraft(page: Page) {
  await page.getByRole('button', { name: 'add_circle Create New Plan', exact: true }).click();
  await page.getByRole('button', { name: 'auto_fix_high Open Plan Wizard', exact: true }).click();
  await page.getByRole('button', { name: 'grid_on Start from Scratch (Empty Grid)', exact: true }).click();
  await expect(g9R2Bar(page)).toBeVisible();
}

async function g9R2Add(page: Page, slot: string, title: string) {
  await g4Day(page, 'Monday').getByText(`Add ${slot}`, { exact: true }).click();
  await page.getByRole('heading', { name: title, exact: true }).click();
  await expect(g4Day(page, 'Monday').getByRole('heading', { name: title, exact: true })).toBeVisible();
}

async function g9R2Navigate(page: Page, route: '/plan' | '/recipes') {
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await page.locator(`#mobile-navigation-drawer a[href="${route}"]`).first().click();
  if (route === '/recipes') await expect(page.getByRole('heading', { name: 'My Kitchen', exact: true })).toBeVisible();
}

async function g9R2CloseKeptDraft(page: Page) {
  const dialogs: string[] = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => ({ closed: page.isClosed(), dialogs }),
    'C8 a kept draft must not warn after storage recovers').toEqual({ closed: true, dialogs: [] });
}

async function g9R2Hold(page: Page, kind: 'save' | 'query') {
  const pattern = kind === 'save' ? /(?:Commit|:commit|Firestore\/Write)/ : /(?:Firestore\/Listen|:runQuery)/;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let held = 0;
  let released = false;
  const handler = async (route: Route) => { held++; await gate; await route.continue(); };
  await page.route(pattern, handler);
  return { count: () => held, release: async () => {
    if (released) return;
    released = true;
    release();
    if (!page.isClosed()) await page.unroute(pattern, handler);
  } };
}

async function g9R2SavedDraft(page: Page, label: string) {
  const { client, uid } = await g4Account(page, 390, label);
  await seedRecipe(client.db, uid, 'R2 Breakfast', { mealType: 'breakfast', folders: ['breakfast'] });
  await seedRecipe(client.db, uid, 'R2 Lunch', { mealType: 'lunch', folders: ['lunch'] });
  const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
    { id: 'r2-dinner', name: 'R2 Saved Dinner', type: 'dinner', isEaten: false },
  ]);
  await page.goto('/plan');
  await settlePlanner(page);
  await g9R2Add(page, 'Breakfast', 'R2 Breakfast');
  return { client, uid, planId, ref: doc(client.db, 'users', uid, 'mealPlans', planId) };
}

test.describe('1.0 G9 R2 review', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('C1 two tabs keep independent weeks and receive storage changes', async ({ page, context }) => {
    const { client, uid } = await g4Account(page, 390, 'r2-two-tabs');
    await seedRecipe(client.db, uid, 'R2 Tab A Dinner');
    await seedRecipe(client.db, uid, 'R2 Tab B Dinner');
    await page.goto('/plan');
    await settlePlanner(page);
    const second = await context.newPage();
    await installAiCallableGuard(second);
    await second.goto('/plan');
    await settlePlanner(second);
    try {
      await g9R2CreateDraft(page);
      await g9R2Add(page, 'Dinner', 'R2 Tab A Dinner');
      await second.getByRole('button', { name: 'Next week', exact: true }).click();
      await settlePlanner(second);
      await g9R2CreateDraft(second);
      await g9R2Add(second, 'Dinner', 'R2 Tab B Dinner');
      for (const tab of [page, second]) tab.on('dialog', async dialog => { await dialog.accept(); });
      await page.reload();
      await second.reload();
      await settlePlanner(page);
      await settlePlanner(second);
      expect(await page.getByRole('heading', { name: 'R2 Tab A Dinner', exact: true }).count(),
        'C1 writing week B in another tab must retain week A').toBe(1);
      await expect(second.getByRole('heading', { name: 'R2 Tab B Dinner', exact: true })).toBeVisible();
      await second.getByRole('button', { name: 'Previous week', exact: true }).click();
      await settlePlanner(second);
      await page.getByRole('button', { name: 'Mark as eaten: R2 Tab A Dinner', exact: true }).click();
      await expect(second.getByRole('button', { name: 'Mark as not eaten: R2 Tab A Dinner', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect((await getDocs(collection(client.db, 'users', uid, 'mealPlans'))).size).toBe(0);
      assertNoUnexpectedAiCalls(second);
    } finally { await second.close(); }
  });

  test('C2 stale draft asks and Discard keeps the newer saved week byte for byte', async ({ page }) => {
    const fixture = await g9R2SavedDraft(page, 'r2-conflict');
    const stored = (await getDoc(fixture.ref)).data()!;
    stored.days[0].meals[0].name = 'R2 Newer Remote Dinner';
    await setDoc(fixture.ref, { ...stored, updatedAt: Timestamp.now() });
    const newer = (await getDoc(fixture.ref)).data();
    await g9R2Bar(page).getByRole('button', { name: /Confirm Plan/ }).click();
    await expect(page.getByText('This week was changed on another device since this draft.', { exact: true }),
      'C2 Confirm must ask before replacing a newer saved week').toHaveCount(1);
    expect((await getDoc(fixture.ref)).data()).toEqual(newer);
    await g9R2Bar(page).getByRole('button', { name: 'Discard changes', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'R2 Newer Remote Dinner', exact: true })).toBeVisible();
    expect((await getDoc(fixture.ref)).data()).toEqual(newer);
  });

  test('C3 Confirm stays serialized across navigation and the last confirmed edits win', async ({ page }) => {
    const fixture = await g9R2SavedDraft(page, 'r2-overlap');
    const hold = await g9R2Hold(page, 'save');
    try {
      await g9R2Bar(page).getByRole('button', { name: /Confirm Plan/ }).click();
      await expect.poll(hold.count).toBeGreaterThan(0);
      await g9R2Navigate(page, '/recipes');
      await g9R2Navigate(page, '/plan');
      await settlePlanner(page);
      await page.getByRole('button', { name: /Preferences/ }).first().click();
      await page.getByRole('spinbutton').first().fill('2333');
      await page.getByRole('button', { name: 'Save Targets', exact: true }).click();
      const confirm = g9R2Bar(page).getByRole('button', { name: /Confirm Plan|Saving/ });
      await expect(confirm, 'C3 a pending Confirm must remain busy after Planner remounts').toBeDisabled();
      expect(hold.count()).toBe(1);
      await hold.release();
      await expect(confirm).toBeEnabled();
      const expected = (await getDoc(fixture.ref)).data()!;
      expected.dailyTargets.calories = 2333;
      delete expected.updatedAt;
      await confirm.click();
      await expect(g9R2Bar(page)).toBeHidden();
      const saved = (await getDoc(fixture.ref)).data()!;
      delete saved.updatedAt;
      expect(saved).toEqual(expected);
      expect((await getDocs(collection(fixture.client.db, 'users', fixture.uid, 'mealPlans'))).size).toBe(1);
    } finally { await hold.release(); }
  });

  test('C4 Clone asks first and Cancel keeps the current draft unchanged', async ({ page }) => {
    const fixture = await g9R2SavedDraft(page, 'r2-clone-cancel');
    const previous = getMondayWeekStart(); previous.setDate(previous.getDate() - 7);
    await seedLegacyShapePlan(fixture.client.db, fixture.uid, previous, [
      { id: 'r2-old', name: 'R2 Prior Dinner', type: 'dinner', isEaten: false },
    ]);
    const before = await page.evaluate(uid => localStorage.getItem(`viomacro:plan-drafts:${uid}`), fixture.uid);
    const questions: string[] = [];
    page.on('dialog', async dialog => { questions.push(dialog.message()); await dialog.dismiss(); });
    await page.getByRole('button', { name: /Clone Last Week/ }).click();
    await expect.poll(() => questions.length, 'C4 Clone must ask before replacing the current draft or meals').toBe(1);
    await expect(page.getByRole('heading', { name: 'R2 Breakfast', exact: true })).toBeVisible();
    expect(await page.evaluate(uid => localStorage.getItem(`viomacro:plan-drafts:${uid}`), fixture.uid)).toBe(before);
  });

  test('C4 a slow Clone cannot replace edits made while it loads', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r2-clone-slow');
    await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: 'r2-current', name: 'R2 Current Dinner', type: 'dinner', isEaten: false },
    ]);
    const previous = getMondayWeekStart(); previous.setDate(previous.getDate() - 7);
    await seedLegacyShapePlan(client.db, uid, previous, [
      { id: 'r2-old', name: 'R2 Prior Dinner', type: 'dinner', isEaten: false },
    ]);
    await page.goto('/plan'); await settlePlanner(page);
    const hold = await g9R2Hold(page, 'query');
    page.on('dialog', async dialog => { await dialog.accept(); });
    try {
      await page.getByRole('button', { name: /Clone Last Week/ }).click();
      await expect.poll(hold.count).toBeGreaterThan(0);
      await page.getByRole('button', { name: /Preferences/ }).first().click();
      await page.getByRole('spinbutton').first().fill('2333');
      await page.getByRole('button', { name: 'Save Targets', exact: true }).click();
      await hold.release();
      await expect(page.getByText(/Previous saved plan cloned into this week\.|Clone cancelled\./)).toBeVisible();
      await page.getByRole('button', { name: /Preferences/ }).first().click();
      await expect(page.getByRole('spinbutton').first(), 'C4 a slow clone must preserve the newer target edit').toHaveValue('2333');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    } finally { await hold.release(); }
  });

  test('C5 one invalid stored week stays untouched while a valid week reloads and edits', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r2-partial-cache');
    await seedRecipe(client.db, uid, 'R2 Valid Dinner');
    await seedRecipe(client.db, uid, 'R2 Valid Breakfast', { mealType: 'breakfast', folders: ['breakfast'] });
    await page.goto('/plan'); await settlePlanner(page);
    await g9R2CreateDraft(page);
    await g9R2Add(page, 'Dinner', 'R2 Valid Dinner');
    const next = getMondayWeekStart(); next.setDate(next.getDate() + 7);
    const badWeek = toDateKey(next);
    const bad = { weekStart: badWeek, weekEnd: badWeek, goal: 'Bad week', days: 'invalid days' };
    await page.evaluate(({ uid, badWeek, bad }) => {
      const key = `viomacro:plan-drafts:${uid}`;
      const value = JSON.parse(localStorage.getItem(key)!) as Record<string, unknown>;
      value[badWeek] = bad;
      localStorage.setItem(key, JSON.stringify(value));
    }, { uid, badWeek, bad });
    page.on('dialog', async dialog => { await dialog.accept(); });
    await page.reload(); await settlePlanner(page);
    expect(await page.getByRole('heading', { name: 'R2 Valid Dinner', exact: true }).count(),
      'C5 one invalid stored week must not hide a valid draft').toBe(1);
    await expect(g9R2Bar(page).getByText(/could not.*restor/i)).toBeVisible();
    await g9R2Add(page, 'Breakfast', 'R2 Valid Breakfast');
    expect(await page.evaluate(({ uid, badWeek }) => {
      const data = JSON.parse(localStorage.getItem(`viomacro:plan-drafts:${uid}`)!) as Record<string, unknown>;
      return data[badWeek];
    }, { uid, badWeek })).toEqual(bad);
    await page.reload(); await settlePlanner(page);
    await expect(page.getByRole('heading', { name: 'R2 Valid Breakfast', exact: true })).toBeVisible();
  });

  test('C7 Discard stays disabled while Confirm is saving', async ({ page }) => {
    await g9R2SavedDraft(page, 'r2-discard-busy');
    const hold = await g9R2Hold(page, 'save');
    try {
      await g9R2Bar(page).getByRole('button', { name: /Confirm Plan/ }).click();
      await expect.poll(hold.count).toBeGreaterThan(0);
      await expect(g9R2Bar(page).getByRole('button', { name: 'Discard changes', exact: true }),
        'C7 Discard cannot run during a waiting Confirm').toBeDisabled();
      await hold.release();
      await expect(g9R2Bar(page)).toBeHidden();
    } finally { await hold.release(); }
  });

  test('C8 a normally kept draft reloads without a leave warning', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r2-normal-leave');
    await seedRecipe(client.db, uid, 'R2 Kept Dinner');
    await page.goto('/plan'); await settlePlanner(page);
    await g9R2CreateDraft(page);
    await g9R2Add(page, 'Dinner', 'R2 Kept Dinner');
    const dialogs: string[] = [];
    page.on('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.accept(); });
    await page.reload(); await settlePlanner(page);
    expect(dialogs, 'C8 a normally kept draft must not warn on reload').toEqual([]);
    await expect(page.getByRole('heading', { name: 'R2 Kept Dinner', exact: true })).toBeVisible();
  });
});


test.describe('1.0 G9 R2 positive choices', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('C2 a saved tick completing during Confirm does not create a false conflict', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'r2-own-tick');
    const planId = await seedLegacyShapePlan(client.db, uid, getMondayWeekStart(), [
      { id: 'r2-own-tick', name: 'R2 Own Tick Dinner', type: 'dinner', isEaten: false },
    ]);
    const ref = doc(client.db, 'users', uid, 'mealPlans', planId);
    await page.goto('/plan'); await settlePlanner(page);
    const hold = await g9R2Hold(page, 'save');
    try {
      await page.getByRole('button', { name: 'Mark as eaten: R2 Own Tick Dinner', exact: true }).click();
      await expect.poll(hold.count).toBeGreaterThan(0);
      await page.getByRole('button', { name: /Preferences/ }).first().click();
      await page.getByRole('spinbutton').first().fill('2333');
      await page.getByRole('button', { name: 'Save Targets', exact: true }).click();
      await g9R2Bar(page).getByRole('button', { name: /Confirm Plan/ }).click();
      await expect(g9R2Bar(page).getByRole('button', { name: /Saving/ })).toBeDisabled();
      expect(hold.count()).toBe(1);
      await hold.release();
      await expect(g9R2Bar(page)).toBeHidden();
      const saved = (await getDoc(ref)).data()!;
      expect(saved.dailyTargets.calories).toBe(2333);
      expect(saved.mealStatus['r2-own-tick']).toBe(true);
      await expect(page.getByText('This week was changed on another device since this draft.', { exact: true })).toHaveCount(0);
    } finally { await hold.release(); }
  });

  test('C2 Replace saved week saves the draft only after the explicit choice', async ({ page }) => {
    const fixture = await g9R2SavedDraft(page, 'r2-replace-choice');
    const stored = (await getDoc(fixture.ref)).data()!;
    stored.days[0].meals[0].name = 'R2 Remote Choice Dinner';
    await setDoc(fixture.ref, { ...stored, updatedAt: Timestamp.now() });
    const newer = (await getDoc(fixture.ref)).data();
    await g9R2Bar(page).getByRole('button', { name: /Confirm Plan/ }).click();
    const replace = g9R2Bar(page).getByRole('button', { name: 'Replace saved week', exact: true });
    await expect(replace).toBeVisible();
    expect((await getDoc(fixture.ref)).data()).toEqual(newer);
    await replace.click();
    await expect(g9R2Bar(page)).toBeHidden();
    const saved = (await getDoc(fixture.ref)).data()!;
    expect(saved.days[0].meals.map((meal: { name: string }) => meal.name)).toEqual(['R2 Breakfast', 'R2 Saved Dinner']);
    expect(saved.createdAt).toEqual(stored.createdAt);
    expect((await getDocs(collection(fixture.client.db, 'users', fixture.uid, 'mealPlans'))).size).toBe(1);
  });
});

test.describe('1.0 G11 AI off is fully off', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const [extension, mimeType] of [['png', 'image/png'], ['pdf', 'application/pdf']]) {
    const fileBytes = extension === 'png' ? g10Png : Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
    test(`R14 paused Recipes ignores ${extension} drag and drop without upload or AI calls`, async ({ page }) => {
      const { client, uid } = await g4Account(page, 390, `g11-paused-${extension}`);
      const uploads: string[] = [];
      const calls: string[] = [];
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.port === String(readEmulatorConfig().ports.storage) && request.method() === 'POST') uploads.push(url.pathname);
      });
      await page.route('**/parseRecipeFromImage', async route => {
        calls.push(route.request().url());
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({
          error: { status: 'FAILED_PRECONDITION', message: 'AI features are paused.' },
        }) });
      });
      page.on('dialog', dialog => dialog.dismiss());
      await page.goto('/recipes');
      await expect(page.getByRole('heading', { name: 'My Kitchen', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /AI Search/ })).toBeDisabled();
      const transfer = await page.evaluateHandle(({ extension, mimeType, bytes }) => {
        const data = new DataTransfer();
        data.items.add(new File([new Uint8Array(bytes)], `g11-paused.${extension}`, { type: mimeType }));
        return data;
      }, { extension, mimeType, bytes: [...fileBytes] });
      const library = page.getByTestId('recipe-library-page');
      await library.dispatchEvent('dragover', { dataTransfer: transfer });
      await expect.soft(page.getByText('We will extract the data automatically', { exact: true }),
        'paused drag must not promise extraction').toHaveCount(0);
      await library.dispatchEvent('drop', { dataTransfer: transfer });
      await expect(page.getByRole('heading', { name: 'Analyzing Recipe...', exact: true })).toBeHidden();
      expect.soft(uploads, 'paused drop must not upload to Storage').toEqual([]);
      expect.soft(calls, 'paused drop must not call a Function').toEqual([]);
      await expect(page.getByText('We will extract the data automatically', { exact: true })).toHaveCount(0);
      await expect(page.getByLabel('Recipe Name *', { exact: true })).toHaveCount(0);
      expect((await listAll(ref(client.storage, `users/${uid}/recipes`))).items).toEqual([]);
      await transfer.dispose();
    });

    test(`R14 AI enabled Recipes ${extension} drop still opens a reviewable imported draft`, async ({ page }) => {
      await enableMockAi(page);
      const { client, uid } = await g4Account(page, 390, `g11-enabled-${extension}`);
      const payloads: Record<string, unknown>[] = [];
      await page.route('**/parseRecipeFromImage', async route => {
        payloads.push(route.request().postDataJSON().data);
        await fulfillCallable(route, { title: `G11 ${extension} recipe`, mealType: 'dinner',
          calories: 400, protein: 25, carbs: 40, fat: 15,
          ingredients: [{ item: 'Rice', qty: 1, unit: 'cup' }], instructions: ['Cook rice.'],
        });
      });
      await page.goto('/recipes');
      await expect(page.getByRole('heading', { name: 'My Kitchen', exact: true })).toBeVisible();
      const transfer = await page.evaluateHandle(({ extension, mimeType, bytes }) => {
        const data = new DataTransfer();
        data.items.add(new File([new Uint8Array(bytes)], `g11-enabled.${extension}`, { type: mimeType }));
        return data;
      }, { extension, mimeType, bytes: [...fileBytes] });
      const library = page.getByTestId('recipe-library-page');
      await library.dispatchEvent('dragover', { dataTransfer: transfer });
      await expect(page.getByText('We will extract the data automatically', { exact: true })).toBeVisible();
      await library.dispatchEvent('drop', { dataTransfer: transfer });
      await expect(page.getByLabel('Recipe Name *', { exact: true })).toHaveValue(`G11 ${extension} recipe`);
      expect(payloads).toHaveLength(1);
      expect(payloads[0]).toMatchObject({ mimeType, imageBase64: fileBytes.toString('base64') });
      expect((await listAll(ref(client.storage, `users/${uid}/recipes`))).items).toHaveLength(1);
      const discard = acceptNextDialog(page);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      expect(await discard).toBe('Discard this recipe?');
      await expect(page.getByLabel('Recipe Name *', { exact: true })).toBeHidden();
      await expect.poll(async () => (await listAll(ref(client.storage, `users/${uid}/recipes`))).items.length).toBe(0);
      await transfer.dispose();
    });
  }
});

test.describe('1.0 G15 B20 dark design on every device', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  async function expectReadable(text: Locator, label: string) {
    await text.scrollIntoViewIfNeeded();
    await expect(text).toBeVisible();
    const sample = await text.evaluate(element => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const rgba = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      const over = (foreground: number[], background: number[]) =>
        background.map((channel, index) => foreground[index] * foreground[3] / 255 + channel * (1 - foreground[3] / 255));
      const ancestors: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      let background = [255, 255, 255];
      for (const node of ancestors) background = over(rgba(getComputedStyle(node).backgroundColor), background);
      const color = getComputedStyle(element).color;
      const foreground = over(rgba(color), background);
      const luminance = (channels: number[]) => channels.map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      const light = luminance(foreground);
      const dark = luminance(background);
      return { color, background, ratio: (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05) };
    });
    await test.info().attach(label, { body: JSON.stringify(sample), contentType: 'application/json' });
    expect.soft(sample.ratio, `${label}: ${sample.color} on ${JSON.stringify(sample.background)}`).toBeGreaterThanOrEqual(4.5);
  }

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Planner Recipe Guided cooking text is readable on a ${colorScheme} device at 390px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      const { client, uid } = await g4Account(page, 390, `g15-${colorScheme}`);
      const title = 'G15 Chicken Bowl';
      const recipeId = await seedRecipe(client.db, uid, title, {
        instructions: [{ step: 'Cook Chicken breast for 10 minutes at 180 C.', timer: 600 }],
      });
      await seedCurrentMealPlan(client.db, uid, recipeId, title);
      expect(await page.evaluate(scheme => matchMedia(`(prefers-color-scheme: ${scheme})`).matches, colorScheme)).toBe(true);
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);

      await test.step('Planner saved meal title', async () => {
        await page.goto('/plan');
        await settlePlanner(page);
        await expectReadable(page.getByRole('heading', { name: title, exact: true }), 'Planner meal title');
      });
      await test.step('Recipe detail title and ingredient', async () => {
        await page.getByRole('heading', { name: title, exact: true }).click();
        await expectReadable(page.getByRole('heading', { name: title, level: 2, exact: true }), 'Recipe detail title');
        await expectReadable(page.locator('label').filter({ hasText: 'Chicken breast' }).locator('span').first(), 'Recipe ingredient line');
      });
      await test.step('Guided cooking first step text', async () => {
        await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
        const heading = page.getByRole('heading', { name: 'Step 1', exact: true });
        await expectReadable(heading, 'Guided step title');
        const fragments = heading.locator('..').locator(':scope > div > span > span');
        await expect(fragments).toHaveCount(7);
        for (const [index, fragment] of (await fragments.all()).entries()) {
          await expectReadable(fragment, `Guided step text ${index + 1}`);
        }
        await page.getByRole('button', { name: /Exit/ }).click();
        await expect(page.getByRole('heading', { name: title, level: 2, exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Next week', exact: true })).toBeVisible();
      });
    });
  }
});
test.describe('1.0 G16 B23 dark design labels are readable', () => {
  async function colorsBehind(text: Locator) {
    return text.evaluate(element => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const rgba = (color: string) => {
        if (!CSS.supports('color', color)) throw new Error(`Unsupported computed color: ${color}`);
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      const over = (foreground: number[], background: number[]) => background.map((channel, index) =>
        foreground[index] * foreground[3] / 255 + channel * (1 - foreground[3] / 255));
      const splitArguments = (value: string) => {
        let depth = 0;
        let start = 0;
        const parts: string[] = [];
        for (let index = 0; index < value.length; index++) {
          if (value[index] === '(') depth++;
          if (value[index] === ')') depth--;
          if (value[index] === ',' && depth === 0) {
            parts.push(value.slice(start, index).trim());
            start = index + 1;
          }
        }
        parts.push(value.slice(start).trim());
        return parts;
      };
      const ancestors: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      let backgrounds = [[255, 255, 255]];
      const gradients: { image: string; stops: string[] }[] = [];
      for (const node of ancestors) {
        const style = getComputedStyle(node);
        backgrounds = backgrounds.map(background => over(rgba(style.backgroundColor), background));
        if (style.backgroundImage === 'none') continue;
        const layers = splitArguments(style.backgroundImage).reverse();
        for (const layer of layers) {
          if (!layer.startsWith('linear-gradient(')) throw new Error(`Unsupported background: ${layer}`);
          const stops = splitArguments(layer.slice('linear-gradient('.length, -1))
            .map(part => part.match(/^([a-z][\w-]*\([^)]*\)|#[\da-f]+|[a-z]+)/i)?.[1])
            .filter((color): color is string => !!color && CSS.supports('color', color));
          if (stops.length < 2) throw new Error(`Missing computed gradient stops: ${layer}`);
          gradients.push({ image: layer, stops });
          backgrounds = backgrounds.flatMap(background => stops.map(stop => over(rgba(stop), background)));
        }
      }
      const luminance = (channels: number[]) => channels.map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      const color = getComputedStyle(element).color;
      return {
        color, gradients,
        samples: backgrounds.map(background => {
          const foreground = over(rgba(color), background);
          const a = luminance(foreground);
          const b = luminance(background);
          return { background, luminance: b, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
        }),
      };
    });
  }

  async function readable(text: Locator, label: string) {
    await text.scrollIntoViewIfNeeded();
    await expect(text).toBeVisible();
    const result = await colorsBehind(text);
    await test.info().attach(label, { body: JSON.stringify(result), contentType: 'application/json' });
    for (const sample of result.samples) {
      expect.soft(sample.ratio, `${label}: ${result.color} on ${JSON.stringify(sample.background)}`)
        .toBeGreaterThanOrEqual(4.5);
    }
    return result;
  }

  for (const width of [390, 1440]) {
    test.describe(`${width}px light device`, () => {
      test.use({ colorScheme: 'light', viewport: { width, height: width === 390 ? 844 : 1000 },
        hasTouch: width === 390, isMobile: width === 390 });

      test(`Recipe Guided cooking labels and dark surfaces meet contrast at ${width}px`, async ({ page }) => {
        const { client, uid } = await g4Account(page, width, 'g16');
        const title = 'G16 Chicken Bowl';
        await seedRecipe(client.db, uid, title, {
          instructions: [{ step: 'Cook Chicken breast for 10 minutes.', timer: 600 },
            { step: 'Serve Chicken breast.', timer: 60 }],
        });
        expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches)).toBe(true);
        expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(width === 1440);
        await page.goto('/recipes');
        await page.getByRole('heading', { name: title, exact: true }).click();
        const detail = page.getByRole('heading', { name: title, level: 2, exact: true });
        await expect(detail).toBeVisible();
        const detailPanel = detail.locator('xpath=ancestor::main[1]');
        for (const label of ['High Protein', 'Quick Prep', 'Calories', 'Protein', 'Carbs', 'Fats']) {
          await readable(detailPanel.getByText(label, { exact: true }), `Recipe ${label}`);
        }
        await page.getByRole('button', { name: /Start Guided Cooking/ }).click();
        await expect(page.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
        await readable(page.getByText('of 2', { exact: true }), 'Guided of N');
        const timer = await readable(page.getByText('Step Timer', { exact: true }), 'Guided Step Timer');
        expect(timer.gradients).toHaveLength(1);
        expect(timer.gradients[0].stops).toHaveLength(2);
        for (const sample of timer.samples) {
          expect.soft(sample.luminance, 'Timer gradient must be dark at every computed stop').toBeLessThan(0.15);
        }
        const track = page.getByText('Cooking Progress', { exact: true }).locator('../..').locator(':scope > div').last();
        const trackColors = await colorsBehind(track);
        for (const sample of trackColors.samples) {
          expect.soft(sample.luminance, 'Progress track must be dark rather than light slate').toBeLessThan(0.15);
        }
        if (width === 1440) {
          await readable(page.getByRole('button', { name: 'Full Recipe', exact: true }).getByText('Full Recipe'), 'Guided Full Recipe');
        }
        await page.getByRole('button', { name: /Next Step/ }).click();
        await expect(page.getByRole('heading', { name: 'Step 2', exact: true })).toBeVisible();
        const previous = page.getByRole('button', { name: /Previous/ });
        await expect(previous).toBeEnabled();
        await readable(previous.getByText('Previous', { exact: true }), 'Guided Previous at rest');
        if (width === 1440) {
          await page.hover('button:has-text("Previous")');
          await previous.evaluate(async element => {
            await Promise.all(element.getAnimations().map(animation => animation.finished));
          });
          expect(await previous.evaluate(element => element.matches(':hover'))).toBe(true);
          await readable(previous.getByText('Previous', { exact: true }), 'Guided Previous on hover');
        }
        await previous.click();
        await expect(page.getByRole('heading', { name: 'Step 1', exact: true })).toBeVisible();
        await page.getByRole('button', { name: /Exit/ }).click();
        await expect(detail).toBeVisible();
        await page.getByRole('button', { name: 'Close recipe details', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'My Kitchen', exact: true })).toBeVisible();
      });
    });
  }
});

test.describe('1.0 G17 Planner shows the right week', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  const g17Key = 'viomacro:meal-planner:viewDate';
  const g17Hour = 3_600_000;
  const g17Header = (page: Page) => page.getByText(/^Week of [A-Z][a-z]{2} \d+$/);
  const g17ThisWeek = (page: Page) => page.getByRole('button', { name: 'This week', exact: true });
  // Week maths run in the page, so the browser's own clock and timezone decide.
  const g17Week = (page: Page, weeks = 0) => page.evaluate(offset => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);
    const pad = (value: number) => String(value).padStart(2, '0');
    return {
      key: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      label: `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      startsAt: start.getTime(),
    };
  }, weeks);
  // The user is back at a page that stayed open: the clock moved on, and then one
  // of the five things happens that tell the Planner someone is there.
  type G17Return = 'shown' | 'restored' | 'focused' | 'touched' | 'typed';
  const g17ComeBack = async (page: Page, at: number, how: G17Return) => {
    await page.clock.setFixedTime(at);
    if (how === 'touched') await g17Header(page).click();
    else if (how === 'typed') await page.keyboard.press('Shift');
    else await page.evaluate(event => {
      if (event === 'shown') document.dispatchEvent(new Event('visibilitychange'));
      else window.dispatchEvent(event === 'restored' ? new PageTransitionEvent('pageshow', { persisted: true }) : new Event('focus'));
    }, how);
    await page.evaluate(() => new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  };
  // The page goes to the background: the same event as "shown", but the page is hidden.
  const g17Hide = async (page: Page, at: number) => {
    await page.clock.setFixedTime(at);
    await page.evaluate(() => new Promise<void>(resolve => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      delete (document as unknown as { visibilityState?: string }).visibilityState;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
  };
  const g17Draft = (weekKey: string, meal: string) => {
    const [year, month, day] = weekKey.split('-').map(Number);
    const date = (index: number) => toDateKey(new Date(year, month - 1, day + index));
    return {
      weekStart: weekKey, weekEnd: date(6), goal: 'G17 draft', isAiGenerated: false,
      dailyTargets: { calories: 1850, protein: 140, carbs: 185, fat: 60 },
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, index) => ({
        date: date(index), dayName, totalCalories: index ? 0 : 520,
        meals: index ? [] : [{ id: `g17-${meal}`, name: meal, type: 'dinner', calories: 520, protein: 42, carbs: 55, fat: 14, isEaten: false }],
      })),
    };
  };

  test('R9 an old saved week opens this week and a fresh one is kept', async ({ page }) => {
    await g4Account(page, 390, 'g17-stale');
    const thisWeek = await g17Week(page);
    const nextWeek = await g17Week(page, 1);
    // What a tab opened before this fix still holds: a bare week with no age.
    await page.evaluate(key => window.sessionStorage.setItem(key, '2020-01-06'), g17Key);
    await page.goto('/plan');
    await settlePlanner(page);
    await expect(g17Header(page), 'R9 a week saved on an earlier visit must not open again').toHaveText(thisWeek.label);
    await expect(g17ThisWeek(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(g17Header(page)).toHaveText(nextWeek.label);
    await page.reload();
    await settlePlanner(page);
    await expect(g17Header(page), 'a week picked a moment ago must survive a reload').toHaveText(nextWeek.label);

    await page.evaluate(([key, week]) => window.sessionStorage.setItem(key,
      JSON.stringify({ week, at: Date.now() - 5 * 3_600_000, pick: true })), [g17Key, nextWeek.key]);
    await page.reload();
    await settlePlanner(page);
    await expect(g17Header(page), 'R9 a week picked 5 hours ago must not open again').toHaveText(thisWeek.label);
  });

  test('R9 a Planner left open keeps a picked week while it is used and returns to this week after 4 hours away', async ({ page }) => {
    await g4Account(page, 390, 'g17-live');
    await page.goto('/plan');
    await settlePlanner(page);
    const thisWeek = await g17Week(page);
    const nextWeek = await g17Week(page, 1);
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(g17Header(page)).toHaveText(nextWeek.label);
    const start = Date.now();

    // Each visit is 3 hours after the one before. The week stays only if every
    // visit, of every kind, counted as use and renewed the 4 hours.
    const visits: [number, G17Return][] = [[3, 'focused'], [6, 'typed'], [9, 'restored'], [12, 'touched'], [15, 'shown']];
    for (const [hours, how] of visits) {
      await g17ComeBack(page, start + hours * g17Hour, how);
      await expect(g17Header(page), `${hours} hours in, ${how}: 3 hours since the last use keeps the picked week`).toHaveText(nextWeek.label);
    }
    // Going to the background is not use: it must not renew the 4 hours.
    await g17Hide(page, start + 18.5 * g17Hour);
    await expect(g17Header(page)).toHaveText(nextWeek.label);
    await g17ComeBack(page, start + 19.5 * g17Hour, 'typed');
    await expect(g17Header(page), 'R9 4.5 hours after the last use the open Planner must return to this week').toHaveText(thisWeek.label);
    await expect(g17ThisWeek(page)).toHaveCount(0);
  });

  test('R9 a Planner left open on this week moves on when Monday starts', async ({ page }) => {
    await g4Account(page, 390, 'g17-rollover');
    const thisWeek = await g17Week(page);
    const nextWeek = await g17Week(page, 1);
    // Sunday 23:00 of this week: the Planner is opened and used on this week.
    await page.clock.setFixedTime(nextWeek.startsAt - g17Hour);
    await page.goto('/plan');
    await settlePlanner(page);
    await expect(g17Header(page)).toHaveText(thisWeek.label);
    await g17ComeBack(page, nextWeek.startsAt - 0.5 * g17Hour, 'touched');
    await expect(g17Header(page), 'on Sunday at 23:30 it is still this week').toHaveText(thisWeek.label);

    await g17ComeBack(page, nextWeek.startsAt + g17Hour, 'focused');
    await expect(g17Header(page), 'R9 on Monday at 01:00, 90 minutes after the last use, the open Planner must show the new week')
      .toHaveText(nextWeek.label);
    await expect(g17ThisWeek(page)).toHaveCount(0);

    // A week picked on purpose is given up after 4 hours too, however the user comes back.
    for (const [hours, how] of [[6, 'shown'], [11, 'restored']] as [number, G17Return][]) {
      // The restarted Planner offers to plan the empty new week, as a fresh visit does.
      // A pointer in the first quarter second belongs to the gesture that woke the page,
      // and its click is dropped. A person needs longer than that to read and tap.
      await page.waitForTimeout(500);
      await settlePlanner(page);
      await page.getByRole('button', { name: 'Previous week' }).click();
      await expect(g17Header(page)).toHaveText(thisWeek.label);
      await expect(g17ThisWeek(page)).toHaveCount(1);
      await g17ComeBack(page, nextWeek.startsAt + hours * g17Hour, how);
      await expect(g17Header(page), `R9 5 hours after a pick, ${how}: back to the current week`).toHaveText(nextWeek.label);
    }
  });

  const g17OldMeal = 'G17 Old Week Dinner';
  const g17NewMeal = 'G17 New Week Dinner';
  const g17Tick = (page: Page, meal: string) => page.getByRole('button', { name: `Mark as eaten: ${meal}`, exact: true });
  const g17Ticked = (page: Page, meal: string) => page.getByRole('button', { name: `Mark as not eaten: ${meal}`, exact: true });
  // This week and next week each hold an unsaved draft with one Monday dinner.
  // A draft is drawn at once, with no wait for the server, so right after a
  // restart the new week's tick button sits where the old week's was.
  // Returns the point of that tick button.
  const g17TwoDraftWeeks = async (page: Page, uid: string) => {
    // Tall enough that the Monday dinner tick needs no scrolling, before and after the restart.
    await page.setViewportSize({ width: 390, height: 1600 });
    const thisWeek = await g17Week(page);
    const nextWeek = await g17Week(page, 1);
    await page.evaluate(([key, drafts]) => window.localStorage.setItem(key, drafts), [`viomacro:plan-drafts:${uid}`,
      JSON.stringify({ [thisWeek.key]: g17Draft(thisWeek.key, g17OldMeal), [nextWeek.key]: g17Draft(nextWeek.key, g17NewMeal) })]);
    await page.goto('/plan');
    await settlePlanner(page);
    await expect(g17Tick(page, g17OldMeal)).toBeVisible();
    const box = (await g17Tick(page, g17OldMeal).boundingBox())!;
    const point = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
    expect(point.y).toBeLessThan(1600);
    return { point, thisWeek, nextWeek };
  };
  const g17FingerRestsOn = async (page: Page, point: { x: number; y: number }, meal: string) => {
    const landed = (await g17Tick(page, meal).boundingBox())!;
    expect(point.x, `the pointer rests on the tick button of ${meal}`).toBeGreaterThan(landed.x);
    expect(point.x).toBeLessThan(landed.x + landed.width);
    expect(point.y).toBeGreaterThan(landed.y);
    expect(point.y).toBeLessThan(landed.y + landed.height);
  };

  test('R9 the tap that wakes a stale Planner ticks no meal in either week', async ({ page }) => {
    const { client, uid } = await g4Account(page, 390, 'g17-tap');
    const oldMeal = g17OldMeal;
    const newMeal = g17NewMeal;
    const { point, nextWeek } = await g17TwoDraftWeeks(page, uid);
    const tick = (meal: string) => g17Tick(page, meal);
    const ticked = (meal: string) => g17Ticked(page, meal);

    // A finger, not a mouse. First show that a tap at this point is real: it ticks the meal, then unticks it.
    await page.touchscreen.tap(point.x, point.y);
    await expect(ticked(oldMeal), 'a tap at this point must tick the meal under the finger').toHaveAttribute('aria-pressed', 'true');
    await page.touchscreen.tap(point.x, point.y);
    await expect(tick(oldMeal)).toBeVisible();

    // Monday 01:00 of the next week: the same tap now wakes a stale Planner.
    await page.clock.setFixedTime(nextWeek.startsAt + g17Hour);
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(1000);
    await expect(ticked(oldMeal), 'R9 the waking tap must not tick the meal of the stale week').toHaveCount(0);
    await expect(g17Header(page), 'R9 the waking tap must bring the Planner to the new week').toHaveText(nextWeek.label);
    await expect(ticked(newMeal), 'R9 the waking tap must not tick a meal in the new week').toHaveCount(0);
    await expect(tick(newMeal), 'the draft of the new week is kept and drawn').toBeVisible();
    await g17FingerRestsOn(page, point, newMeal);

    // The stale week kept its draft, unticked. The Planner works as usual after it woke up.
    await page.getByRole('button', { name: 'Previous week' }).tap();
    await expect(tick(oldMeal), 'the draft of the old week is kept, and its meal is not ticked').toBeVisible();
    await expect(ticked(oldMeal)).toHaveCount(0);
    await g17ThisWeek(page).tap();
    await tick(newMeal).tap();
    await expect(ticked(newMeal)).toHaveAttribute('aria-pressed', 'true');
    expect((await getDocs(collection(client.db, 'users', uid, 'mealPlans'))).size, 'drafts are never saved by a tick').toBe(0);
  });

  test('R9 a click into a background window wakes the Planner and ticks nothing, and the guard ends with the gesture', async ({ page }) => {
    const { uid } = await g4Account(page, 390, 'g17-focus-click');
    const { point, thisWeek, nextWeek } = await g17TwoDraftWeeks(page, uid);

    // Monday 01:00: the window was in the background. The click that brings it
    // forward gives it focus first, and the pointer arrives just after.
    await page.clock.setFixedTime(nextWeek.startsAt + g17Hour);
    // Sent back to back, with no wait for the first to answer, as one physical click does.
    const focused = page.evaluate(() => { window.dispatchEvent(new Event('focus')); });
    await page.touchscreen.tap(point.x, point.y);
    await focused;
    await page.waitForTimeout(1000);
    await expect(g17Header(page), 'R9 the focus must bring the Planner to the new week').toHaveText(nextWeek.label);
    await expect(g17Ticked(page, g17NewMeal), 'R9 the click that brought the window forward must not tick a meal in the new week').toHaveCount(0);
    await expect(g17Tick(page, g17NewMeal)).toBeVisible();
    await g17FingerRestsOn(page, point, g17NewMeal);

    // The guard is over: the next tap is the user's own and ticks the meal. Then it is unticked.
    await page.touchscreen.tap(point.x, point.y);
    await expect(g17Ticked(page, g17NewMeal), 'the next tap after the waking gesture must work').toHaveAttribute('aria-pressed', 'true');
    await page.touchscreen.tap(point.x, point.y);
    await expect(g17Tick(page, g17NewMeal)).toBeVisible();

    // A waking touch that becomes a scroll has no click. It must not cost the user the next key press.
    await page.getByRole('button', { name: 'Previous week' }).tap();
    await expect(g17Header(page)).toHaveText(thisWeek.label);
    await page.clock.setFixedTime(nextWeek.startsAt + 6 * g17Hour);
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(g17Header(page), 'R9 5 hours after the pick the touch must wake the Planner').toHaveText(nextWeek.label);
    await expect(g17Ticked(page, g17NewMeal)).toHaveCount(0);
    await page.getByRole('button', { name: 'Previous week' }).focus();
    await page.keyboard.press('Enter');
    await expect(g17Header(page), 'a key press after a waking touch with no click must work').toHaveText(thisWeek.label);

    // Waking with no pointer at all (the user switched to the window with the keyboard): a tap one second later is the user's own.
    // One second is 4 times the quarter second in which a pointer still counts as the waking gesture.
    await page.clock.setFixedTime(nextWeek.startsAt + 11 * g17Hour);
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')); });
    await expect(g17Header(page)).toHaveText(nextWeek.label);
    await page.waitForTimeout(1000);
    await page.touchscreen.tap(point.x, point.y);
    await expect(g17Ticked(page, g17NewMeal), 'a tap one second after the window came forward must work').toHaveAttribute('aria-pressed', 'true');
  });

  test('R9 another week offers a This week button that returns', async ({ page }) => {
    await g4Account(page, 390, 'g17-button');
    await page.goto('/plan');
    await settlePlanner(page);
    const thisWeek = await g17Week(page);
    const earlier = await g17Week(page, -2);
    await expect(g17ThisWeek(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Previous week' }).click();
    await page.getByRole('button', { name: 'Previous week' }).click();
    await expect(g17Header(page)).toHaveText(earlier.label);

    expect(await g17ThisWeek(page).count(), 'R9 another week must offer a This week button').toBe(1);
    const box = (await g17ThisWeek(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.height).toBeGreaterThanOrEqual(40);
    await g17ThisWeek(page).click();
    await expect(g17Header(page)).toHaveText(thisWeek.label);
    await expect(g17ThisWeek(page)).toHaveCount(0);
  });

  test('R9 the This week button stays next to the week box at tablet and computer width', async ({ page }) => {
    await g4Account(page, 390, 'g17-button-wide');
    for (const width of [768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/plan');
      await settlePlanner(page);
      if (await g17ThisWeek(page).count() === 0) await page.getByRole('button', { name: 'Next week' }).click();
      await expect(g17ThisWeek(page)).toBeVisible();
      const button = (await g17ThisWeek(page).boundingBox())!;
      const weekBox = (await page.getByRole('button', { name: 'Next week' }).locator('..').boundingBox())!;
      expect(button.x, `at ${width}px the button starts inside the width of the week box`).toBeGreaterThanOrEqual(weekBox.x);
      expect(button.x + button.width, `at ${width}px the button ends inside the width of the week box`)
        .toBeLessThanOrEqual(weekBox.x + weekBox.width + 1);
      expect(button.y, `at ${width}px the button sits right under the week box`).toBeGreaterThanOrEqual(weekBox.y + weekBox.height);
      expect(button.y - (weekBox.y + weekBox.height)).toBeLessThanOrEqual(16);
      expect(button.x + button.width).toBeLessThanOrEqual(width);
    }
  });

  for (const view of ['day', 'month'] as const) {
    test(`N1 ${view} view arrows keep a Monday week and Start from Scratch saves it`, async ({ page }) => {
      const { client, uid } = await g4Account(page, 390, `g17-${view}`);
      await page.goto('/plan');
      await settlePlanner(page);
      const nextWeek = await g17Week(page, 1);
      const nextWeekEnd = await page.evaluate(key => {
        const [year, month, day] = key.split('-').map(Number);
        const end = new Date(year, month - 1, day + 6);
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
      }, nextWeek.key);

      await page.getByRole('button', { name: view, exact: true }).click();
      await page.getByRole('button', { name: 'Next week' }).click();
      await page.getByRole('button', { name: 'week', exact: true }).click();
      await expect(g17Header(page), `N1 a ${view} view arrow must land on a Monday week`).toHaveText(nextWeek.label);

      await page.getByRole('button', { name: 'add_circle Create New Plan', exact: true }).click();
      await page.getByRole('button', { name: 'auto_fix_high Open Plan Wizard', exact: true }).click();
      await page.getByRole('button', { name: 'grid_on Start from Scratch (Empty Grid)', exact: true }).click();
      await expect(g4Day(page, 'Monday').getByText('Add Dinner', { exact: true }),
        'N1 Start from Scratch must show the empty grid').toBeVisible();
      const bar = page.getByRole('status').filter({ hasText: 'Not saved yet' });
      await bar.getByRole('button', { name: /Confirm Plan/ }).click();
      await expect(bar).toBeHidden();

      const plans = collection(client.db, 'users', uid, 'mealPlans');
      await expect.poll(async () => (await getDocs(plans)).size).toBe(1);
      const plan = (await getDocs(plans)).docs[0].data();
      expect(plan.weekStart).toBe(nextWeek.key);
      expect(plan.weekEnd).toBe(nextWeekEnd);
      expect(plan.days.map((day: { dayName: string }) => day.dayName))
        .toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
      expect(plan.days[0].date).toBe(nextWeek.key);
      expect(plan.days[6].date).toBe(nextWeekEnd);
    });
  }
});
