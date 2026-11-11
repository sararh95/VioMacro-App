import type { Page } from '@playwright/test';
import { readEmulatorConfig } from '../../../scripts/emulator-config.mjs';

const guardedPages = new WeakMap<Page, string[]>();

/** Register before expected RPC routes, so those explicit mocks take priority. */
export async function installAiCallableGuard(page: Page): Promise<void> {
  if (guardedPages.has(page)) return;
  const unexpected: string[] = [];
  guardedPages.set(page, unexpected);
  const functionsPort = String(readEmulatorConfig().ports.functions);
  await page.route(url => {
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    const callablePath = /^\/[^/]+\/[a-z]+(?:-[a-z]+)+\d+\/[^/]+/.test(url.pathname);
    return (local && (url.port === functionsPort || callablePath)) ||
      url.hostname.endsWith('.cloudfunctions.net') ||
      /^(api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com)$/.test(url.hostname) ||
      url.hostname.endsWith('.aiplatform.googleapis.com');
  }, async route => {
    const url = new URL(route.request().url());
    unexpected.push(`${route.request().method()} ${url.origin}${url.pathname}`);
    await route.abort('blockedbyclient');
  });
}

/** Call from afterEach, including tests where the normal UI remains paused. */
export function assertNoUnexpectedAiCalls(page: Page): void {
  const unexpected = guardedPages.get(page);
  if (!unexpected) throw new Error('AI callable guard was not installed for this page.');
  if (unexpected.length) throw new Error(`Unexpected unmocked AI requests:\n${unexpected.join('\n')}`);
}

/** Availability is faked in this page only; neither runtime flag is enabled. */
export async function enableMockAi(page: Page): Promise<void> {
  await installAiCallableGuard(page);
  await page.route(url => ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && url.pathname === '/__qa/ai-availability.js', async route => {
    await route.fulfill({ contentType: 'text/javascript', body: 'export const AI_ENABLED = true;\n', headers: { 'Cache-Control': 'no-store' } });
  });
}
