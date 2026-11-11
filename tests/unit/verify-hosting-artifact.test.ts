// G-R: the Hosting verifier must refuse a build made with the repo's own
// test/CI Firebase values, with the .env.example placeholders, or with the
// Firebase config missing. Before this, a `build:hosting` run without real
// .env values (the CI env, or a fresh checkout) passed the verifier and could
// be deployed as a site that cannot sign anyone in.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const verifier = path.join(root, 'scripts', 'verify-hosting-artifact.mjs');

// The verifier only accepts directories inside the workspace; _local/ is ignored.
mkdirSync(path.join(root, '_local'), { recursive: true });
const scratch = mkdtempSync(path.join(root, '_local', 'verify-hosting-artifact-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

function verify(directory: string) {
    const result = spawnSync(process.execPath, [verifier, path.relative(root, directory)], {
        cwd: root,
        encoding: 'utf8',
    });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

const configKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_RECAPTCHA_SITE_KEY',
] as const;
type ConfigKey = typeof configKeys[number];
type Config = Partial<Record<ConfigKey, string>>;

// The field each variable lands in, in the order src/services/firebase/firebase.ts declares them.
const firebaseFields: Array<[string, ConfigKey]> = [
    ['apiKey', 'VITE_FIREBASE_API_KEY'],
    ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
    ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
    ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'],
    ['messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'],
    ['appId', 'VITE_FIREBASE_APP_ID'],
];

// Real-shaped, but made up. Assembled at runtime so no key-shaped literal sits
// in the source for a secret scanner to trip on.
const realShaped: Required<Config> = {
    VITE_FIREBASE_API_KEY: `AIza${'Q'.repeat(35)}`,
    VITE_FIREBASE_AUTH_DOMAIN: 'viomacro.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'viomacro',
    VITE_FIREBASE_STORAGE_BUCKET: 'viomacro.firebasestorage.app',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '402918374651',
    VITE_FIREBASE_APP_ID: '1:402918374651:web:5c1d9e7a3b2f4c6d8e0a1b',
    VITE_RECAPTCHA_SITE_KEY: `6L${'Q'.repeat(38)}`,
};

// Exactly what .github/workflows/ci.yml builds with.
const ciDemo: Required<Config> = {
    VITE_FIREBASE_API_KEY: 'demo-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-viomacro.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'viomacro',
    VITE_FIREBASE_STORAGE_BUCKET: 'viomacro.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
    VITE_FIREBASE_APP_ID: '1:1234567890:web:0000000000000000000000',
    VITE_RECAPTCHA_SITE_KEY: 'demo-recaptcha-site-key',
};

// The Firebase values in an example env file, read from the file itself so a
// new placeholder there cannot slip past these tests.
function exampleValues(file: string): Required<Config> {
    const values: Config = {};
    for (const line of readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)) {
        const match = line.match(/^([A-Z_]+)=(.*)$/);
        if (match && (configKeys as readonly string[]).includes(match[1])) {
            values[match[1] as ConfigKey] = match[2].trim();
        }
    }
    assert.deepEqual(Object.keys(values).sort(), [...configKeys].sort(), `${file} must set every Firebase variable`);
    return values as Required<Config>;
}
const examples: Array<[string, Required<Config>]> = ['.env.example', '.env.local.example']
    .map(file => [file, exampleValues(file)]);

const literal = (value: string | undefined) => value === undefined ? 'void 0' : JSON.stringify(value);

// A hand-made artifact shaped like Vite output: an unset variable is inlined as
// `void 0`. The Firebase SDK really ships the string "demo-project" (and
// rules-unit-testing "demo-test"), which is why the verifier must not match a
// bare "demo-" prefix.
function writeArtifact(name: string, config: Config, { includeConfig = true } = {}) {
    const directory = path.join(scratch, name);
    mkdirSync(path.join(directory, 'assets'), { recursive: true });
    writeFileSync(path.join(directory, 'index.html'),
        '<!doctype html><html><head><script type="module" src="/assets/index-abc123.js"></script></head></html>');
    writeFileSync(path.join(directory, 'assets', 'firebase-abc123.js'),
        'const t={alg:"none",type:"JWT"},r=e||"demo-project";const u="demo-test";');
    const firebaseConfig = firebaseFields.map(([field, key]) => `${field}:${literal(config[key])}`).join(',');
    writeFileSync(path.join(directory, 'assets', 'index-abc123.js'),
        (includeConfig ? `const firebaseConfig={${firebaseConfig}};` : '') +
        `const siteKey=${literal(config.VITE_RECAPTCHA_SITE_KEY)};`);
    return directory;
}

test('a real-shaped artifact passes even though the Firebase SDK says "demo-project"', () => {
    const { status, output } = verify(writeArtifact('real-shaped', realShaped));
    assert.equal(status, 0, output);
    assert.match(output, /Hosting artifact verified/);
});

const testValues: Array<[string, ConfigKey, string]> = [
    ['demo-api-key', 'VITE_FIREBASE_API_KEY', 'demo-api-key'],
    ['demo-key', 'VITE_FIREBASE_API_KEY', 'demo-key'],
    ['demo-recaptcha-site-key', 'VITE_RECAPTCHA_SITE_KEY', 'demo-recaptcha-site-key'],
    ['demo-viomacro', 'VITE_FIREBASE_AUTH_DOMAIN', 'demo-viomacro.firebaseapp.com'],
    ['1:1234567890:web:', 'VITE_FIREBASE_APP_ID', '1:1234567890:web:0000000000000000000000'],
];

for (const [index, [marker, key, value]] of testValues.entries()) {
    test(`an artifact containing the test value ${marker} fails`, () => {
        const directory = writeArtifact(`marker-${index}`, {
            ...realShaped,
            [key]: value,
        });
        const { status, output } = verify(directory);
        assert.equal(status, 1, output);
        assert.match(output, /Hosting artifact verification failed/);
        assert.ok(output.includes(marker), `The failure must name ${marker}:\n${output}`);
    });
}

for (const [index, [field, key]] of firebaseFields.entries()) {
    test(`an artifact whose Firebase config has no ${field} fails`, () => {
        const directory = writeArtifact(`missing-${index}`, { ...realShaped, [key]: undefined });
        const { status, output } = verify(directory);
        assert.equal(status, 1, output);
        assert.ok(output.includes(`Firebase config ${field} is missing`), output);
    });
}

test('an artifact with no Firebase config at all fails', () => {
    const { status, output } = verify(writeArtifact('no-config', realShaped, { includeConfig: false }));
    assert.equal(status, 1, output);
    assert.match(output, /no Firebase web config found/);
});

for (const [file, values] of examples) {
    for (const key of configKeys) {
        test(`an artifact containing the ${file} placeholder for ${key} fails`, () => {
            const directory = writeArtifact(`placeholder-${file}-${key}`, { ...realShaped, [key]: values[key] });
            const { status, output } = verify(directory);
            assert.equal(status, 1, output);
            assert.match(output, /placeholder value "your_[a-z0-9_]+" from \.env\.example/,
                `The placeholder ${values[key]} must be named as a placeholder:\n${output}`);
        });
    }
}

test('an artifact containing an emulator endpoint still fails', () => {
    const directory = writeArtifact('emulator', realShaped);
    writeFileSync(path.join(directory, 'assets', 'emulator-abc123.js'), 'connect("127.0.0.1:8085")');
    const { status, output } = verify(directory);
    assert.equal(status, 1, output);
    assert.match(output, /Firestore emulator endpoint/);
});

// Builds with exactly the given Firebase variables; any of the seven that is
// not given is removed from the environment, so CI's own values cannot leak in.
async function viteBuild(name: string, config: Config) {
    const outDir = path.join(scratch, name);
    const env: Record<string, string | undefined> = {
        ...Object.fromEntries(configKeys.map(key => [key, config[key]])),
        NODE_ENV: 'production',
        VITE_USE_FIREBASE_EMULATORS: 'false',
        VITE_AI_ENABLED: 'false',
    };
    const previous = new Map(
        [...Object.keys(env), 'VITE_USER_NODE_ENV'].map(key => [key, process.env[key]]),
    );
    try {
        for (const [key, value] of Object.entries(env)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        // envDir: false keeps a developer's real .env files out of this build.
        await build({
            root,
            mode: 'production',
            envDir: false,
            logLevel: 'silent',
            build: { outDir, emptyOutDir: true },
        });
    } finally {
        for (const [key, value] of previous) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
    return outDir;
}

test('a real Vite build with the CI demo values fails; one with real-shaped values passes', async () => {
    const demo = verify(await viteBuild('vite-ci-demo', ciDemo));
    assert.equal(demo.status, 1, demo.output);
    for (const marker of ['demo-api-key', 'demo-recaptcha-site-key', 'demo-viomacro', '1:1234567890:web:']) {
        assert.ok(demo.output.includes(marker), `The CI demo build must be flagged for ${marker}:\n${demo.output}`);
    }

    const real = verify(await viteBuild('vite-real-shaped', realShaped));
    assert.equal(real.status, 0, real.output);
    assert.match(real.output, /Hosting artifact verified/);
});

test('a real Vite build with no Firebase variables set fails', async () => {
    const { status, output } = verify(await viteBuild('vite-missing', {}));
    assert.equal(status, 1, output);
    for (const [field] of firebaseFields) {
        assert.ok(output.includes(`Firebase config ${field} is missing`), output);
    }
    assert.match(output, /missing reCAPTCHA site key/);
});

test('a real Vite build from the .env.example placeholders fails', async () => {
    const [, values] = examples[0];
    const { status, output } = verify(await viteBuild('vite-placeholders', values));
    assert.equal(status, 1, output);
    for (const placeholder of ['your_api_key_here', 'your_project_id', 'your_app_id', 'your_recaptcha_v3_site_key_here']) {
        assert.ok(output.includes(`placeholder value "${placeholder}"`), output);
    }
});

test('a real Vite build with everything but the reCAPTCHA site key fails', async () => {
    const { status, output } = verify(await viteBuild('vite-no-recaptcha', {
        ...realShaped,
        VITE_RECAPTCHA_SITE_KEY: undefined,
    }));
    assert.equal(status, 1, output);
    assert.match(output, /missing reCAPTCHA site key/);
    assert.doesNotMatch(output, /Firebase config \w+ is/, 'Only the reCAPTCHA key is missing here');
});
