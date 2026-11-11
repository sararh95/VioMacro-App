import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Guard tests for PR-3 — "cut the outside world".
 *
 * The app used to reach two third-party hosts for decoration: Unsplash for
 * placeholder food photos and DiceBear for avatars. Neither is a considered
 * dependency; both crept in as convenient fallbacks. They leak the viewer's
 * IP and referrer, and they break the day a photo id is retired.
 *
 * Google Fonts stays on purpose — it is a deliberate typography choice made
 * in index.html, not an accidental image fallback. It is allow-listed below.
 */

const SRC = join(process.cwd(), 'src');

/** Hosts that live code may reference. Everything else is a failure. */
const ALLOWED_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'www.w3.org',                 // SVG namespaces
    'firebasestorage.googleapis.com',
    'example.com',                // placeholder text in an input, not a request
    '127.0.0.1',                  // local emulator hosts
    'localhost',
];

/** Demo data is not shipped to any real user; it is excluded from the sweep. */
const EXCLUDED_PATHS = ['dev/mock/'];

function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else if (/\.(ts|tsx)$/.test(full)) out.push(full);
    }
    return out;
}

/**
 * Scan shipped code only. A comment explaining why a host was removed must not
 * count as the host still being referenced — same rule as no-invented-data.
 */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\r\n]*/g, '$1');
}

const files = walk(SRC)
    .map((f) => ({ path: relative(SRC, f).split(sep).join('/'), text: stripComments(readFileSync(f, 'utf8')) }))
    .filter((f) => !EXCLUDED_PATHS.some((p) => f.path.startsWith(p)));

function externalHostsIn(text: string): string[] {
    const found = new Set<string>();
    for (const match of text.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
        const host = match[1].toLowerCase();
        if (!ALLOWED_HOSTS.includes(host)) found.add(host);
    }
    return [...found];
}

// ---------------------------------------------------------------- the sweep

test('no live source file references an unapproved external host', () => {
    const offenders = files
        .map((f) => ({ path: f.path, hosts: externalHostsIn(f.text) }))
        .filter((f) => f.hosts.length > 0)
        .map((f) => `${f.path} -> ${f.hosts.join(', ')}`);

    assert.deepEqual(
        offenders,
        [],
        'These files reach a third-party host. Generate the visual locally instead:\n  ' +
        offenders.join('\n  '),
    );
});

// ------------------------------------------------------------ named findings

test('AUD-104: avatars are generated locally, not fetched from DiceBear', () => {
    // Looks for a DiceBear *URL*, i.e. somewhere that would actually fetch one.
    // `visuals.ts` names the host in isRemoteAvatar() so that legacy values
    // saved before this fix are explicitly NOT fetched — that is the fix, not
    // a violation of it.
    const offenders = files
        .filter((f) => /https?:\/\/[a-z.]*dicebear\.com/i.test(f.text))
        .map((f) => f.path);
    assert.deepEqual(offenders, [], 'DiceBear avatars are saved into photoURL and then load on every page.');
});

test('AUD-072/091/117/118: no Unsplash placeholder images', () => {
    const offenders = files.filter((f) => f.text.includes('unsplash')).map((f) => f.path);
    assert.deepEqual(offenders, [], 'Unsplash stock photos were shown as though they were the user’s own content.');
});

test('AUD-116: a blank image field is never saved as a stock photo URL', () => {
    const form = files.find((f) => f.path === 'features/recipes/components/RecipeForm.tsx');
    assert.ok(form, 'RecipeForm.tsx not found');
    assert.ok(
        !/imageUrl:\s*imageUrl\.trim\(\)\s*\|\|\s*['"]https?:/.test(form.text),
        'Leaving the image blank wrote a third-party stock photo into the saved recipe, permanently.',
    );
});

// -------------------------------------------------- legacy stored image URLs

test('a stored image URL from an untrusted host is never requested', async () => {
    const { isRenderableImage } = await import('../../src/shared/visuals.ts');

    // Recipes saved before PR-3 carry an Unsplash URL, because RecipeForm used
    // to write one whenever the field was left blank (AUD-116). Those values
    // are still in real databases. Requesting one now trips the CSP and shows
    // a broken image for something the user never chose.
    assert.equal(isRenderableImage('https://images.unsplash.com/photo-123'), false);
    assert.equal(isRenderableImage('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'), false);
    assert.equal(isRenderableImage(''), false);
    assert.equal(isRenderableImage(undefined), false);
    assert.equal(isRenderableImage('not a url at all'), false);

    // Real user uploads must still render.
    assert.equal(isRenderableImage('https://firebasestorage.googleapis.com/v0/b/x/o/y.png?alt=media'), true);
    assert.equal(isRenderableImage('http://127.0.0.1:9199/v0/b/x/o/y.png?alt=media'), true);
    assert.equal(isRenderableImage('data:image/png;base64,AAAA'), true);
    assert.equal(isRenderableImage('/local-asset.png'), true);
});

// ------------------------------------------------------------------- the CSP

test('index.html carries a Content-Security-Policy that pins image sources', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    assert.match(
        html,
        /http-equiv=["']Content-Security-Policy["']/i,
        'Without a CSP, a fourth external host can creep back in unnoticed.',
    );
    assert.match(html, /img-src[^"']*'self'/i, 'img-src must be pinned.');
    const scriptSrc = html.match(/(?:^|[;\r\n])\s*script-src\s+([^;]+);/)?.[1];
    assert.ok(scriptSrc?.split(/\s+/).includes('https://apis.google.com'), 'Firebase Auth mobile gapi loader must be allowed by script-src.');
    const connectSrc = html.match(/(?:^|[;\r\n])\s*connect-src\s+([^;]+);/)?.[1]?.split(/\s+/);
    assert.ok(connectSrc?.includes('https://www.google.com'), 'reCAPTCHA v3 posts must be allowed by connect-src.');
    assert.ok(connectSrc?.includes('https://apis.google.com'), 'GAPI telemetry must be allowed by connect-src.');
});
