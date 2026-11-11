import { installAiCallableGuard, assertNoUnexpectedAiCalls } from './helpers/mock-ai';
import { expect, test, type Page } from '@playwright/test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, initializeFirestore, setDoc } from 'firebase/firestore';
import { readEmulatorConfig } from '../../scripts/emulator-config.mjs';

const apps: ReturnType<typeof initializeApp>[] = [];
const password = 'local-qa-only-123';

async function account(completed = true) {
  const config = readEmulatorConfig();
  const app = initializeApp(config.firebase, `core-${Date.now()}-${Math.random()}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${config.host}:${config.ports.auth}`, { disableWarnings: true });
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  connectFirestoreEmulator(db, config.host, config.ports.firestore);
  const email = `qa-core-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const ref = doc(db, 'users', user.uid);
  await setDoc(ref, { email, settings: {
    onboardingCompleted: completed, measurementUnit: 'metric', currentWeight: 72.5,
    goalWeight: 68.5, dailyCalorieTarget: 2150, allergies: ['Dairy'], dietaryTags: [],
    macroSplit: { protein: 30, carbs: 35, fat: 35 }, phase: 'maintenance',
  } });
  return { email, ref, db, uid: user.uid, authUser: user };
}

async function login(page: Page, email: string) {
  await page.goto('/auth');
  await page.getByPlaceholder('name@example.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Log In', exact: true }).last().click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
}

test.beforeEach(async ({ page }) => { await installAiCallableGuard(page); });
test.afterEach(async ({ page }) => { assertNoUnexpectedAiCalls(page); });

test.afterAll(async () => { await Promise.all(apps.map(app => deleteApp(app))); });

function onboardingWizard(page: Page) {
  return page.getByRole('heading', {
    name: /^(Welcome to VioMacro|The Basics|Nutrition Goals|Preferences)$/,
  }).locator('..').locator('..').locator('..');
}

test('core recovery: failed onboarding save keeps the step and draft for retry', async ({ page }) => {
  const user = await account(false);
  await login(page, user.email);
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('spinbutton').nth(0).fill('73');
  await page.getByRole('spinbutton').nth(1).fill('68');
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('spinbutton').first().fill('2250');
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  // A delayed rejection exposes optimistic completion that destroys the wizard.
  await page.evaluate(() => {
    sessionStorage.setItem('viomacro:e2e:delay:updateUserSettings', '500');
    sessionStorage.setItem('viomacro:e2e:fail:updateUserSettings', 'once');
  });
  await page.getByRole('button', { name: 'Finish Setup', exact: true }).click();
  await expect(page.getByText('We could not save onboarding yet. Please retry before leaving this screen.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preferences', exact: true })).toBeVisible();
  expect((await getDoc(user.ref)).data()?.settings.onboardingCompleted).toBe(false);
  await page.getByRole('button', { name: 'Finish Setup', exact: true }).click();
  await expect.poll(async () => (await getDoc(user.ref)).data()?.settings.onboardingCompleted).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  const saved = (await getDoc(user.ref)).data()?.settings;
  expect(saved.currentWeight).toBe(73);
  expect(saved.goalWeight).toBe(68);
  expect(saved.dailyCalorieTarget).toBe(2250);
});

test('core recovery: failed settings read cannot turn a returning account into onboarding', async ({ page }) => {
  const user = await account();
  await page.goto('/auth');
  await page.evaluate(() => sessionStorage.setItem('viomacro:e2e:delay:getUserSettings', '11000'));
  await page.getByPlaceholder('name@example.com').fill(user.email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Log In', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Retry Saved Data', exact: true })).toBeVisible({ timeout: 18000 });
  await expect(page.getByRole('heading', { name: 'Welcome to VioMacro', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Retry Saved Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry Saved Data', exact: true })).toBeHidden();
  expect((await getDoc(user.ref)).data()?.settings.currentWeight).toBe(72.5);
});

test('core recovery: failed weight history write does not change saved profile weight', async ({ page }) => {
  const user = await account();
  const today = new Intl.DateTimeFormat('en-CA').format(new Date());
  const historyRef = doc(user.db, 'users', user.uid, 'weightHistory', today);
  const { Timestamp } = await import('firebase/firestore');
  await setDoc(historyRef, { date: today, timestamp: Timestamp.now(), weight: 72.5, waterMl: 750, sleepHours: 7.5 });
  await login(page, user.email);
  await page.getByTitle('Log Weight', { exact: true }).click();
  await page.getByRole('spinbutton').fill('74.3');
  await page.evaluate(() => sessionStorage.setItem('viomacro:e2e:fail:logDailyMetric:weight', 'once'));
  page.on('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Complete Check-In', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete Check-In', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Log Weight', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('could not save your check-in');
  expect((await getDoc(user.ref)).data()?.settings.currentWeight).toBe(72.5);
  expect((await getDoc(historyRef)).data()?.weight).toBe(72.5);
  await page.getByRole('button', { name: 'Complete Check-In', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Log Weight', exact: true })).toBeHidden();
  expect((await getDoc(user.ref)).data()?.settings.currentWeight).toBe(74.3);
  expect((await getDoc(historyRef)).data()).toMatchObject({ weight: 74.3, waterMl: 750, sleepHours: 7.5, energy: 3, hunger: 3 });
});

test('core recovery: a completed save from an old session cannot overwrite the next account', async ({ page }) => {
  const a = await account();
  const b = await account();
  await setDoc(b.ref, { settings: { profileName: 'Account B' } }, { merge: true });
  await updateProfile(b.authUser, { displayName: 'Account B' });
  await login(page, a.email);
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByPlaceholder('Enter your name').fill('Pending Account A');
  await page.evaluate(() => sessionStorage.setItem('viomacro:e2e:delay:updateUserSettingsAfterCommit', '6000'));
  page.on('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Confirm Targets', exact: true }).click();
  await expect.poll(async () => (await getDoc(a.ref)).data()?.settings.profileName).toBe('Pending Account A');
  // Keep this JS document alive while A's promise resolves in the background.
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByPlaceholder('name@example.com').fill(b.email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Log In', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  // This delay deliberately spans the injected pending completion.
  await page.waitForTimeout(6500);
  expect((await getDoc(b.ref)).data()?.settings.profileName).toBe('Account B');
  await b.authUser.reload();
  expect(b.authUser.displayName).toBe('Account B');
  await page.locator('aside').getByRole('link', { name: /Settings/ }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByPlaceholder('Enter your name')).toHaveValue('Account B');
});

test('core recovery: onboarding validates weights and targets and keeps decimal weights', async ({ page }) => {
  const user = await account(false);
  await login(page, user.email);
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('spinbutton').nth(0).fill('-10');
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await expect(page.getByRole('heading', { name: 'The Basics', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('weight');
  await page.getByRole('spinbutton').nth(0).fill('73.4');
  await page.getByRole('spinbutton').nth(1).fill('68.2');
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('spinbutton').first().fill('');
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await expect(page.getByRole('heading', { name: 'Nutrition Goals', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('calorie');
  await page.getByRole('spinbutton').first().fill('2250');
  await onboardingWizard(page).getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('button', { name: 'Finish Setup', exact: true }).click();
  await expect.poll(async () => (await getDoc(user.ref)).data()?.settings.onboardingCompleted).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome to VioMacro', exact: true })).toBeHidden();
  expect((await getDoc(user.ref)).data()?.settings).toMatchObject({ currentWeight: 73.4, goalWeight: 68.2, dailyCalorieTarget: 2250 });
});

test('core recovery: invalid check-in weight never changes saved data', async ({ page }) => {
  const user = await account();
  await login(page, user.email);
  await page.getByTitle('Log Weight', { exact: true }).click();
  page.on('dialog', dialog => dialog.dismiss());
  for (const weight of ['0', '-5', '1000']) {
    await page.getByRole('spinbutton').fill(weight);
    await page.getByRole('button', { name: 'Complete Check-In', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('weight');
    expect((await getDoc(user.ref)).data()?.settings.currentWeight).toBe(72.5);
    await expect(page.getByRole('spinbutton')).toHaveValue(weight);
  }
});

test('core recovery: Firestore rejection of check-in history leaves the profile unchanged', async ({ page }) => {
  const user = await account();
  await login(page, user.email);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  // Exercise the real service and security rules, beyond a pre-write failure
  // hook: the profile patch is valid, but this history score must be rejected.
  const rejected = await page.evaluate(async ({ uid, modulePath }) => {
    const { saveWeightCheckIn } = await import(modulePath);
    try {
      await saveWeightCheckIn(uid, { weight: 74.3, date: '2026-10-02', energy: 99 });
      return false;
    } catch {
      return true;
    }
  }, { uid: user.uid, modulePath: '/src/services/userService.ts' });
  expect(rejected).toBe(true);
  expect((await getDoc(user.ref)).data()?.settings.currentWeight).toBe(72.5);
  expect((await getDoc(doc(user.db, 'users', user.uid, 'weightHistory', '2026-10-02'))).exists()).toBe(false);
});
