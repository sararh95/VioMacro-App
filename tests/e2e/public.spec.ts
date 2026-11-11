import { expect, test, type Page } from '@playwright/test';

function collectConsoleFailures(page: Page) {
  const failures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (
        !text.includes("Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive") &&
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

test.describe('public smoke', () => {
  test('auth page renders and login/signup controls respond', async ({ page }) => {
    const failures = collectConsoleFailures(page);

    await page.goto('/auth');

    await expect(page).toHaveTitle(/VioMacro/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Log In$/ }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google Sign-In Coming Soon' })).toBeDisabled();
    await expect(page.getByText('Join 25,000+ users')).toHaveCount(0);
    await expect(page.getByText('Private alpha access')).toHaveCount(1);

    await page.getByRole('button', { name: 'Create Account' }).first().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Create Account$/ }).last()).toBeVisible();

    expect(failures).toEqual([]);
  });

  for (const route of ['/', '/plan', '/recipes', '/recipes/import', '/pantry', '/grocery', '/progress', '/settings']) {
    test(`protected route ${route} redirects to auth when signed out`, async ({ page }) => {
      const failures = collectConsoleFailures(page);

      await page.goto(route);

      await expect(page).toHaveURL(/\/auth$/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
      expect(failures).toEqual([]);
    });
  }
});
