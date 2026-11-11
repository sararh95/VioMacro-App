import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { emulators: { auth: { port: authPort } } } = JSON.parse(
    readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8'),
);
const isLoopback = (source: string) => /^https?:\/\/(?:localhost|127\.0\.0\.1)(?=[:/]|$)/.test(source);

async function buildPolicy(mode: string, emulators: boolean) {
    const env: Record<string, string> = {
        NODE_ENV: 'production',
        VITE_USE_FIREBASE_EMULATORS: String(emulators),
        VITE_AI_ENABLED: 'false',
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'demo-viomacro.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'demo-viomacro',
        VITE_FIREBASE_STORAGE_BUCKET: 'demo-viomacro.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: '1:123456789:web:test',
        VITE_RECAPTCHA_SITE_KEY: 'test-recaptcha-site-key',
    };
    const previous = new Map(
        [...Object.keys(env), 'VITE_USER_NODE_ENV'].map(key => [key, process.env[key]]),
    );

    try {
        Object.assign(process.env, env);
        const result = await build({
            root,
            mode,
            envDir: false,
            logLevel: 'silent',
            build: { write: false, emptyOutDir: false },
        });
        const bundles = Array.isArray(result) ? result : [result];
        const asset = bundles.flatMap(bundle => 'output' in bundle ? bundle.output : [])
            .find(output => output.type === 'asset' && output.fileName === 'index.html');
        assert.ok(asset?.type === 'asset', 'Vite must emit index.html');
        const html = typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source);
        const meta = html.match(/<meta\b(?=[^>]*\bhttp-equiv=["']Content-Security-Policy["'])[^>]*>/i)?.[0];
        assert.ok(meta, 'Built HTML must contain the CSP meta tag');
        const policy = meta.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2];
        assert.ok(policy, 'Built CSP must have a content attribute');
        return new Map(policy.split(';').filter(part => part.trim()).map(part => {
            const [directive, ...sources] = part.trim().split(/\s+/);
            return [directive, sources] as const;
        }));
    } finally {
        for (const [key, value] of previous) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
}

for (const mode of ['production', 'development']) {
    test(`built CSP permits Google Auth without emulator frames (mode=${mode})`, async () => {
        const policy = await buildPolicy(mode, false);
        assert.ok(policy.get('connect-src')?.includes('https://www.google.com'),
            'reCAPTCHA v3 posts need the exact www.google.com connection source');
        assert.ok(policy.get('connect-src')?.includes('https://apis.google.com'),
            'GAPI telemetry needs the exact apis.google.com connection source');
        assert.ok(policy.get('script-src')?.includes('https://apis.google.com'),
            'The Firebase Auth mobile gapi loader must remain permitted');
        assert.deepEqual(policy.get('frame-src')?.filter(isLoopback), [],
            'A production build must not allow localhost or 127.0.0.1 frames, even with mode=development');
    });
}

test('built emulator CSP permits only the configured Auth port on both loopback hosts', async () => {
    const policy = await buildPolicy('production', true);
    assert.ok(policy.get('connect-src')?.includes('https://www.google.com'));
    assert.ok(policy.get('connect-src')?.includes('https://apis.google.com'));
    assert.ok(policy.get('script-src')?.includes('https://apis.google.com'));
    assert.deepEqual(policy.get('frame-src')?.filter(isLoopback).sort(), [
        `http://127.0.0.1:${authPort}`,
        `http://localhost:${authPort}`,
    ].sort());
});
