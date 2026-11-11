import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer as createNetServer } from 'node:net';
import { chromium } from '@playwright/test';
import { build, createServer, loadConfigFromFile, preview, type InlineConfig } from 'vite';

const root = process.cwd();
const evidence = path.join(root, '_local/qa/fix-loop-2026-10-22/g6/qa-server-fixture');
fs.mkdirSync(evidence, { recursive: true });

async function mockHelper() {
  const filename = path.join(root, 'tests/e2e/helpers/mock-ai.ts');
  return fs.existsSync(filename) ? import(pathToFileURL(filename).href) : null;
}

async function unusedPort(): Promise<number> {
  const server = createNetServer();
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = server.address();
  assert.ok(url && typeof url !== 'string');
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return url.port;
}

async function fixture(kind: 'qa' | 'normal', dotenvAi: boolean) {
  const dir = fs.mkdtempSync(path.join(evidence, `${kind}-`));
  const relativeConstants = path.relative(dir, path.join(root, 'src/shared/constants.ts')).replaceAll('\\', '/');
  fs.writeFileSync(path.join(dir, '.env.local'), `VITE_AI_ENABLED=${dotenvAi}\nVITE_FIREBASE_PROJECT_ID=private-fixture-sentinel\n`);
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><button id="availability"></button><output id="project"></output><script type="module" src="/consumer.ts"></script>');
  fs.writeFileSync(path.join(dir, 'consumer.ts'), `import { AI_ENABLED } from ${JSON.stringify(relativeConstants)}; document.querySelector('#availability').textContent = AI_ENABLED ? 'AI enabled' : 'AI paused'; document.querySelector('#project').textContent = import.meta.env.VITE_FIREBASE_PROJECT_ID;`);
  // When source-only reverted, exercise the real old config rather than fail
  // merely because the new file is absent.
  const candidate = path.join(root, 'vite.emulator.config.ts');
  const filename = kind === 'qa' && fs.existsSync(candidate) ? candidate : path.join(root, 'vite.config.ts');
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' }, filename, root);
  assert.ok(loaded);
  return { dir, config: {
    ...loaded.config, configFile: false, root: dir, mode: 'test', logLevel: 'silent',
    cacheDir: path.join(dir, 'cache'),
    optimizeDeps: { noDiscovery: true },
    server: { ...loaded.config.server, host: '127.0.0.1', port: await unusedPort(), strictPort: true, fs: { allow: [root] } },
    preview: { host: '127.0.0.1', port: await unusedPort(), strictPort: true },
    build: { ...loaded.config.build, outDir: path.join(dir, 'dist'), emptyOutDir: false },
  } as InlineConfig };
}

function address(server: { address(): string | { port: number } | null }) {
  const value = server.address();
  assert.ok(value && typeof value !== 'string');
  return `http://127.0.0.1:${value.port}`;
}

test('QA dev server ignores private dotenv values and renders paused with canonical dummy project', async () => {
  const { dir, config } = await fixture('qa', true);
  const server = await createServer(config);
  const browser = await chromium.launch();
  try {
    await server.listen();
    assert.ok(server.httpServer);
    const url = address(server.httpServer);
    const page = await browser.newPage();
    await page.goto(url);
    await page.getByRole('button', { name: /^AI (enabled|paused)$/ }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('#availability').textContent(), 'AI paused');
    assert.equal(await page.locator('#project').textContent(), 'viomacro');
    const response = await fetch(`${url}/__qa/ai-availability.js`);
    assert.match(response.headers.get('content-type') ?? '', /javascript/);
    const module = await import(`data:text/javascript,${encodeURIComponent(await response.text())}`);
    assert.equal(module.AI_ENABLED, false);
    fs.writeFileSync(path.join(dir, 'proof.json'), JSON.stringify({ url, state: 'AI paused', project: 'viomacro', envDir: server.config.envDir, strictPort: server.config.server.strictPort }, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
});

test('QA built artifact stays paused but one page can mock availability without recompiling', async () => {
  const { dir, config } = await fixture('qa', false);
  await build(config);
  const server = await preview(config);
  const browser = await chromium.launch();
  try {
    const url = address(server.httpServer);
    const ordinary = await browser.newPage();
    await ordinary.goto(url);
    await ordinary.getByRole('button', { name: /^AI (enabled|paused)$/ }).waitFor({ state: 'visible' });
    assert.equal(await ordinary.locator('#availability').textContent(), 'AI paused');
    const scoped = await browser.newPage();
    let availabilityRequests = 0;
    scoped.on('request', request => { if (new URL(request.url()).pathname === '/__qa/ai-availability.js') availabilityRequests++; });
    const helper = await mockHelper();
    if (helper) await helper.enableMockAi(scoped);
    await scoped.goto(url);
    await scoped.getByRole('button', { name: /^AI (enabled|paused)$/ }).waitFor({ state: 'visible' });
    assert.equal(await scoped.locator('#availability').textContent(), 'AI enabled');
    assert.equal(availabilityRequests, 1);
    await ordinary.reload();
    await ordinary.getByRole('button', { name: /^AI (enabled|paused)$/ }).waitFor({ state: 'visible' });
    assert.equal(await ordinary.locator('#availability').textContent(), 'AI paused');
    fs.writeFileSync(path.join(dir, 'proof.json'), JSON.stringify({ url, ordinary: 'AI paused', scoped: 'AI enabled', ordinaryReload: 'AI paused', availabilityRequests }, null, 2));
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  }
});

test('normal build has no QA availability seam and cannot be enabled by the fixture URL', async () => {
  const { dir, config } = await fixture('normal', false);
  await build(config);
  const server = await preview(config);
  const browser = await chromium.launch();
  try {
    const url = address(server.httpServer);
    const page = await browser.newPage();
    let availabilityRequests = 0;
    await page.route('**/__qa/ai-availability.js', async route => {
      availabilityRequests++;
      await route.fulfill({ contentType: 'text/javascript', body: 'export const AI_ENABLED = true;' });
    });
    await page.goto(url);
    await page.getByRole('button', { name: /^AI (enabled|paused)$/ }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('#availability').textContent(), 'AI paused');
    assert.equal(availabilityRequests, 0);
    assert.equal(fs.existsSync(path.join(dir, 'dist/__qa/ai-availability.js')), false);
    fs.writeFileSync(path.join(dir, 'proof.json'), JSON.stringify({ url, state: 'AI paused', availabilityRequests, emittedQaAsset: false }, null, 2));
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  }
});

test('unmocked callable is aborted and reported before it reaches even a local fake backend', async () => {
  const { dir, config } = await fixture('qa', false);
  const server = await createServer(config);
  const browser = await chromium.launch();
  let backendRequests = 0;
  assert.ok(server.httpServer);
  server.httpServer.on('request', request => {
    if (request.url === '/viomacro/us-central1/unexpectedCallable') {
      backendRequests++;
    }
  });
  try {
    await server.listen();
    assert.ok(server.httpServer);
    const url = address(server.httpServer);
    const page = await browser.newPage();
    const helper = await mockHelper();
    if (helper) await helper.installAiCallableGuard(page);
    await page.goto(url);
    const result = await page.evaluate(async target => {
      try { await fetch(target); return 'backend reached'; } catch { return 'blocked'; }
    }, `${url}/viomacro/us-central1/unexpectedCallable`);
    assert.equal(result, 'blocked');
    assert.equal(backendRequests, 0);
    assert.ok(helper);
    assert.throws(() => helper.assertNoUnexpectedAiCalls(page), /Unexpected unmocked AI requests/);
    fs.writeFileSync(path.join(dir, 'proof.json'), JSON.stringify({ url, result, backendRequests, unexpectedReported: true }, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
});
