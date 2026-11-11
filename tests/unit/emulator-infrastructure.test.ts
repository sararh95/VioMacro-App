import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';

const root = process.cwd();
const fixtures = path.join(root, '_local/qa/fix-loop-2026-10-22/g6/unit-fixtures');
fs.mkdirSync(fixtures, { recursive: true });

function fixture() {
  const dir = fs.mkdtempSync(path.join(fixtures, 'case-'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  for (const name of ['firebase-emulator.mjs', 'emulator-ports.mjs', 'emulator-config.mjs']) {
    const source = path.join(root, 'scripts', name);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dir, 'scripts', name));
  }
  fs.writeFileSync(path.join(dir, '.firebaserc'), JSON.stringify({ projects: { default: 'viomacro' } }));
  fs.writeFileSync(path.join(dir, 'firebase.json'), JSON.stringify({ emulators: {
    auth: { port: 19099 }, firestore: { port: 18085 }, storage: { port: 19199 }, functions: { port: 15001 },
  } }));
  const bin = path.join(dir, 'node_modules/firebase-tools/lib/bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'firebase.js'), `console.log('G6_FAKE_CLI='+JSON.stringify({args:process.argv.slice(2),project:process.env.VITE_FIREBASE_PROJECT_ID,ai:process.env.VITE_AI_ENABLED,backendAI:process.env.AI_ENABLED,configRoot:process.env.XDG_CONFIG_HOME,adcPath:process.env.GOOGLE_APPLICATION_CREDENTIALS,hasInheritedCredential:Object.entries(process.env).some(([key,value])=>['GOOGLE_APPLICATION_CREDENTIALS','FIREBASE_TOKEN'].includes(key.toUpperCase())&&['fake-never-read.json','fake-never-use'].includes(value))}));`);
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(?:VITE_FIREBASE_|VIOMACRO_FIREBASE_|FIREBASE_|GCLOUD_PROJECT$|GOOGLE_CLOUD_PROJECT$|AI_ENABLED$|VITE_AI_ENABLED$)/.test(key)) delete env[key];
  }
  return { dir, env };
}

function run(dir: string, env: NodeJS.ProcessEnv, args = ['start']) {
  return spawnSync(process.execPath, ['scripts/firebase-emulator.mjs', ...args], { cwd: dir, env, encoding: 'utf8', timeout: 15_000 });
}

function cli(result: ReturnType<typeof run>) {
  assert.equal(result.status, 0, `${result.error ?? ''}\n${result.stderr}\n${result.stdout}`);
  const line = result.stdout.split('\n').find(line => line.startsWith('G6_FAKE_CLI='));
  assert.ok(line, 'the local CLI must be invoked');
  return JSON.parse(line.slice('G6_FAKE_CLI='.length));
}

function exportFixture(dir: string) {
  const target = path.join(dir, 'export');
  fs.mkdirSync(target);
  for (const name of ['auth_export', 'firestore_export', 'storage_export']) fs.mkdirSync(path.join(target, name));
  fs.writeFileSync(path.join(target, 'auth_export/accounts.json'), '{"users":[]}');
  fs.writeFileSync(path.join(target, 'storage_export/metadata.json'), '{}');
  fs.writeFileSync(path.join(target, 'firestore_export/firestore_export.overall_export_metadata'), 'synthetic-fixture');
  fs.writeFileSync(path.join(target, 'firebase-export-metadata.json'), JSON.stringify({
    auth: { path: 'auth_export' }, storage: { path: 'storage_export' },
    firestore: { path: 'firestore_export', metadata_file: 'firestore_export/firestore_export.overall_export_metadata' },
  }));
  return target;
}

test('emulator bootstrap needs no private export and explicitly selects project and safe services', () => {
  const { dir, env } = fixture();
  const result = cli(run(dir, env));
  assert.equal(result.args.includes('--import'), false);
  assert.equal(result.args[result.args.indexOf('--project') + 1], 'viomacro');
  assert.equal(result.args[result.args.indexOf('--only') + 1], 'auth,firestore,storage');
  assert.equal(result.project, 'viomacro');
  assert.equal(result.ai, undefined);
  assert.equal(result.backendAI, undefined);
});

test('private local exports are never selected implicitly', () => {
  const { dir, env } = fixture();
  const original = exportFixture(dir);
  const stable = path.join(dir, '_local/firebase/exports/firebase-export');
  fs.mkdirSync(path.dirname(stable), { recursive: true });
  fs.cpSync(original, stable, { recursive: true });
  assert.equal(cli(run(dir, env)).args.includes('--import'), false);
});

test('CLI gets a fresh isolated login store and no inherited credential variables', () => {
  const { dir, env } = fixture();
  const result = cli(run(dir, { ...env, GOOGLE_APPLICATION_CREDENTIALS: 'fake-never-read.json', FIREBASE_TOKEN: 'fake-never-use' }));
  assert.equal(result.hasInheritedCredential, false);
  assert.equal(typeof result.configRoot, 'string');
  const relative = path.relative(dir, result.configRoot);
  assert.equal(relative.startsWith('..') || path.isAbsolute(relative), false);
  assert.equal(fs.existsSync(path.join(result.configRoot, 'configstore/firebase-tools.json')), false);
});

test('CLI cannot discover real Google ADC or inherited credential aliases', () => {
  const { dir, env } = fixture();
  const result = cli(run(dir, { ...env, google_application_credentials: 'fake-never-read.json', firebase_token: 'fake-never-use' }));
  assert.equal(result.hasInheritedCredential, false);
  assert.equal(result.adcPath, result.configRoot, 'explicit ADC must be the unique empty directory');
  assert.equal(fs.statSync(result.adcPath).isDirectory(), true);
  const proof = `
    const assert = require('node:assert/strict');
    const {createRequire} = require('node:module');
    const cliRequire = createRequire(${JSON.stringify(path.join(root, 'node_modules/firebase-tools/lib/requireAuth.js'))});
    const {GoogleAuth} = cliRequire('google-auth-library');
    let network=0, fallback=0, compute=0;
    const deny=()=>{network++;throw Error('Network forbidden in ADC regression');};
    require('node:net').Socket.prototype.connect=deny;
    for(const name of ['node:http','node:https']) { require(name).request=deny;require(name).get=deny; }
    const auth = new GoogleAuth({projectId:'viomacro'});
    auth._tryGetApplicationCredentialsFromWellKnownFile=async()=>{fallback++;throw Error('Real ADC fallback forbidden');};
    auth._checkIsGCE=async()=>{compute++;throw Error('Compute credentials forbidden');};
    (async()=>{
      await assert.rejects(auth.getClient(), /does not exist, or it is not a file/);
      assert.equal(fallback,0);assert.equal(compute,0);assert.equal(network,0);
      // Demonstrate sensitivity without touching any real credential path.
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;delete process.env.google_application_credentials;
      const control=new GoogleAuth({projectId:'viomacro'});
      control._tryGetApplicationCredentialsFromWellKnownFile=async()=>{fallback++;throw Error('CONTROL_FAKE_FALLBACK');};
      control._checkIsGCE=auth._checkIsGCE;
      await assert.rejects(control.getClient(), /CONTROL_FAKE_FALLBACK/);
      assert.equal(fallback,1);assert.equal(compute,0);assert.equal(network,0);
    })().catch(error=>{console.error(error);process.exitCode=1;});
  `;
  const child = spawnSync(process.execPath, ['-e', proof], { cwd: root, env: { ...env, GOOGLE_APPLICATION_CREDENTIALS: result.adcPath }, encoding: 'utf8', timeout: 10_000 });
  assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stderr}`);
});

test('explicit complete import is passed through without changing export bytes', () => {
  const { dir, env } = fixture();
  const imported = exportFixture(dir);
  const before = fs.readFileSync(path.join(imported, 'firebase-export-metadata.json'));
  const result = cli(run(dir, { ...env, VIOMACRO_FIREBASE_EMULATOR_IMPORT: imported }));
  assert.equal(result.args[result.args.indexOf('--import') + 1], imported);
  assert.deepEqual(fs.readFileSync(path.join(imported, 'firebase-export-metadata.json')), before);
});

test('malformed and incomplete explicit exports fail before CLI launch', () => {
  const { dir, env } = fixture();
  const imported = exportFixture(dir);
  const metadata = path.join(imported, 'firebase-export-metadata.json');
  for (const invalid of ['{bad-json', JSON.stringify({ auth: { path: 'missing' } })]) {
    fs.writeFileSync(metadata, invalid);
    const result = run(dir, { ...env, VIOMACRO_FIREBASE_EMULATOR_IMPORT: imported });
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.includes('G6_FAKE_CLI='), false);
  }
});

test('project mismatch, nonlocal emulator hosts and live AI flags refuse before CLI launch', () => {
  const { dir, env } = fixture();
  const imported = exportFixture(dir);
  for (const unsafe of [
    { VITE_FIREBASE_PROJECT_ID: 'wrong-project' },
    { FIRESTORE_EMULATOR_HOST: 'example.com:8085' },
    { VITE_AI_ENABLED: 'true' },
    { AI_ENABLED: 'true' },
  ]) {
    const result = run(dir, { ...env, VIOMACRO_FIREBASE_EMULATOR_IMPORT: imported, ...unsafe });
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.includes('G6_FAKE_CLI='), false);
  }
});

test('exec cannot accidentally start Functions or change the selected project', () => {
  const { dir, env } = fixture();
  const imported = exportFixture(dir);
  const explicit = { ...env, VIOMACRO_FIREBASE_EMULATOR_IMPORT: imported };
  for (const args of [
    ['start', '--only', 'functions'], ['start', '--project', 'other'],
    ['exec', '--only', 'auth,firestore,storage,functions', '--', 'node', 'never.js'],
  ]) {
    const result = run(dir, explicit, args);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.includes('G6_FAKE_CLI='), false);
  }
});

test('SDK helper uses the selected namespace and every configured service port', () => {
  const filename = path.join(root, 'tests/e2e/emulator-auth.spec.ts');
  const text = fs.readFileSync(filename, 'utf8');
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'createFirebaseClient');
  assert.ok(declaration);
  const code = ts.transpileModule(declaration.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const calls: Record<string, unknown> = {};
  const config = { projectId: 'demo-g6-fixture', host: '127.0.0.1', ports: { auth: 19099, firestore: 18085, storage: 19199 }, firebase: { apiKey: 'demo-key', projectId: 'demo-g6-fixture', authDomain: 'localhost', storageBucket: 'demo-g6-fixture.appspot.com' } };
  vm.runInNewContext(`${code}\ncreateFirebaseClient('unit');`, {
    EMULATOR_PORTS: config.ports, readEmulatorConfig: () => config, e2eApps: [],
    initializeApp: (options: unknown) => { calls.options = options; return {}; },
    getAuth: () => ({}), initializeFirestore: () => ({}), getStorage: () => ({}),
    connectAuthEmulator: (_: unknown, url: string) => { calls.auth = url; },
    connectFirestoreEmulator: (_: unknown, host: string, port: number) => { calls.firestore = `${host}:${port}`; },
    connectStorageEmulator: (_: unknown, host: string, port: number) => { calls.storage = `${host}:${port}`; },
  });
  assert.equal((calls.options as { projectId: string }).projectId, config.projectId);
  assert.equal(calls.auth, 'http://127.0.0.1:19099');
  assert.equal(calls.firestore, '127.0.0.1:18085');
  assert.equal(calls.storage, '127.0.0.1:19199');
});

test('Functions ignore protects its secret independently of the root ignore', () => {
  const { dir } = fixture();
  fs.mkdirSync(path.join(dir, 'functions'));
  fs.copyFileSync(path.join(root, 'functions/.gitignore'), path.join(dir, 'functions/.gitignore'));
  fs.writeFileSync(path.join(dir, 'functions/.secret.local'), 'fake-unit-fixture');
  fs.writeFileSync(path.join(dir, 'empty-gitconfig'), '');
  const options = { cwd: dir, encoding: 'utf8' as const, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(dir, 'empty-gitconfig') } };
  assert.equal(spawnSync('git', ['init', '--quiet'], options).status, 0);
  const result = spawnSync('git', ['-c', 'core.excludesFile=', 'check-ignore', '-v', 'functions/.secret.local'], options);
  // Retain inactive nested metadata for review without leaving a nested checkout.
  fs.renameSync(path.join(dir, '.git'), path.join(dir, '.git.fixture-archive'));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /functions\/.gitignore:1:\.secret\.local/);
});
