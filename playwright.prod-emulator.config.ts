import { defineConfig, devices } from '@playwright/test';
import { emulatorEnvironment } from './scripts/emulator-config.mjs';

process.env.VITE_USE_FIREBASE_EMULATORS = 'true';

const prodEmulatorOutDir = '_local/qa/prod-emulator-dist';
const previewPort = Number(process.env.VIOMACRO_QA_PREVIEW_PORT || 4173);
const previewUrl = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*prod-emulator*.spec.ts'],
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  outputDir: '_local/qa/test-results/prod-emulator',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '_local/qa/playwright-report/prod-emulator' }],
  ],
  use: {
    baseURL: previewUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build --config vite.emulator.config.ts --outDir ${prodEmulatorOutDir} && node node_modules/vite/bin/vite.js preview --config vite.emulator.config.ts --host 127.0.0.1 --port ${previewPort} --strictPort --outDir ${prodEmulatorOutDir}`,
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...emulatorEnvironment(),
      VITE_ENABLE_INTERNAL_QA_ROUTES: 'false',
    },
  },
  projects: [
    {
      name: 'chromium-prod-emulator',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
