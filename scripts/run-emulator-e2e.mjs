import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedQaAccount } from './seed-qa-account.mjs';
import { emulatorEnvironment } from './emulator-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const args = process.argv.slice(2);
  const configs = ['--config=playwright.emulator.config.ts', '--config=playwright.prod-emulator.config.ts'];
  if (!configs.includes(args[0])) throw new Error('Select an emulator Playwright config.');
  const result = await seedQaAccount();
  console.log('[qa-bootstrap]', JSON.stringify(result));
  const child = spawnSync(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', ...args], { cwd: root, env: emulatorEnvironment(), stdio: 'inherit', shell: false });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} catch (error) {
  console.error('[emulator-e2e]', error.message);
  process.exitCode = 1;
}
