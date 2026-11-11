import { installAiCallableGuard, assertNoUnexpectedAiCalls, enableMockAi } from './helpers/mock-ai';
import { expect, test, type Page } from '@playwright/test';

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';

function collectConsoleFailures(page: Page) {
  const failures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (
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

async function signIn(page: Page) {
  await page.goto('/auth');
  await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /^Log In$/ }).last().click();
  await expect(page).toHaveURL(new URL('/', test.info().project.use.baseURL).href);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

test.beforeEach(async ({ page }) => { await installAiCallableGuard(page); });
test.afterEach(async ({ page }) => { assertNoUnexpectedAiCalls(page); });

test.describe('production build with Firebase emulators', () => {
  test('authenticated user can load built app, navigate, and open import workflow', async ({ page }) => {
    await enableMockAi(page);
    const failures = collectConsoleFailures(page);

    await signIn(page);

    await page.locator('aside a[href="/recipes"]').first().click();
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByRole('heading', { name: 'My Kitchen' })).toBeVisible();

    await page.goto('/recipes/import');
    await expect(page).toHaveURL(/\/recipes\/import$/);
    await expect(page.getByRole('heading', { name: 'Start with Magic Import' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'upload_file Choose recipe file' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('authenticated direct launch routes render in the built app without App Check token warnings', async ({ page }) => {
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

  test('internal dev map route is not exposed in the built private-alpha app', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await signIn(page);
    await page.goto('/dev/map');

    await expect(page).not.toHaveURL(/\/dev\/map$/);
    await expect(page.getByRole('heading', { name: 'Screen Map / Dev Playground' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('built pantry and grocery pages do not show stale prototype claims', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await signIn(page);

    await page.goto('/pantry');
    await expect(page.getByText('Coming Soon').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Scan Coming Soon/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Full Pantry Coming Soon/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Shortcut Coming Soon/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
    await expect(page.getByPlaceholder(/scan barcode/)).toHaveCount(0);
    await expect(page.getByText('Lemon Herb Chicken Bowl')).toBeHidden();
    await expect(page.getByText('24+')).toBeHidden();

    await page.goto('/grocery');
    await expect(page.getByText('Checkout Coming Soon')).toBeVisible();
    await expect(page.getByText('Store pricing and checkout integrations are coming soon')).toBeVisible();
    await expect(page.getByText('Week of Oct 24')).toBeHidden();
    await expect(page.getByText('High-Performance Macro Cycle')).toBeHidden();
    await expect(page.getByText('$Total')).toBeHidden();

    expect(failures).toEqual([]);
  });
});
