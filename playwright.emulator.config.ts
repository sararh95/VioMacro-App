import { defineConfig, devices } from '@playwright/test';
import { emulatorEnvironment } from './scripts/emulator-config.mjs';

process.env.VIOMACRO_E2E_EMULATOR = 'true';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/emulator-auth.spec.ts', '**/core-settings-recovery.spec.ts'],
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  outputDir: '_local/qa/test-results/emulator',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '_local/qa/playwright-report/emulator' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config vite.emulator.config.ts --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: emulatorEnvironment(),
  },
  projects: [
    {
      name: 'chromium-emulator',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
