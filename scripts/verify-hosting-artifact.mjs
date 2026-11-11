import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEmulatorPorts } from './emulator-ports.mjs';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetArgument = process.argv[2] ?? 'dist';

const textAssetExtensions = new Set([
  '.cjs',
  '.css',
  '.htm',
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

// AUD-042: derived from firebase.json, not written out again. These ports were
// hardcoded here too, so moving Firestore from 8080 to 8085 would have left this
// guard silently scanning for a port nothing uses -- a leaked emulator endpoint
// in a production bundle would have passed.
const emulatorPorts = readEmulatorPorts(workspaceRoot);

const emulatorMarkers = [
  ['Firestore', emulatorPorts.firestore],
  ['Auth', emulatorPorts.auth],
  ['Storage', emulatorPorts.storage],
  ['Functions', emulatorPorts.functions],
].map(([name, port]) => ({
  markerClass: `${name} emulator endpoint`,
  value: `127.0.0.1:${port}`,
  generatedPattern: new RegExp(`127\.0\.0\.1.{0,120}${port}`, 's'),
}));

// G-R: the Firebase values that the CI and test builds use. A build that
// contains any of them was made without the real .env values and cannot sign
// anyone in, so it must never be deployed. Do NOT add a bare "demo-" here: the
// Firebase SDK itself ships the string "demo-project" in every real build.
const testConfigMarkers = [
  'demo-api-key',
  'demo-key',
  'demo-recaptcha-site-key',
  'demo-viomacro',
  '1:1234567890:web:',
].map((value) => ({ markerClass: `test Firebase value "${value}"`, value }));

// G-R: the placeholders in .env.example and .env.local.example. A build that
// contains one was made from an unedited copy of an example file.
// tests/unit/verify-hosting-artifact.test.ts reads both files, so a new
// placeholder there that is not caught here turns that test red.
const placeholderMarkers = [
  'your_api_key_here',
  'your_project_id',
  'your_messaging_sender_id',
  'your_app_id',
  'your_recaptcha_v3_site_key_here',
].map((value) => ({ markerClass: `placeholder value "${value}" from .env.example`, value }));

// G-R: src/services/firebase/firebase.ts throws this in production when
// VITE_RECAPTCHA_SITE_KEY is empty. When the key is set, the minifier drops the
// whole branch, so the text is only in a bundle built without the key.
const missingRecaptchaMarker = {
  markerClass: 'missing reCAPTCHA site key (VITE_RECAPTCHA_SITE_KEY was not set at build time)',
  value: 'Missing VITE_RECAPTCHA_SITE_KEY',
};

const artifactMarkers = [...emulatorMarkers, ...testConfigMarkers, ...placeholderMarkers, missingRecaptchaMarker];

// G-R: the app's Firebase web config, as Vite inlines it from VITE_FIREBASE_*:
//   {apiKey:"…",authDomain:"…",projectId:"…",storageBucket:"…",messagingSenderId:"…",appId:"…"}
// An unset variable is inlined as `void 0`. Every field must be a string with
// the shape the Firebase console hands out, and the artifact must contain the
// config at all: if the bundle format ever changes, this fails closed.
const firebaseConfigFields = [
  ['apiKey', /^AIza[0-9A-Za-z_-]{35}$/],
  ['authDomain', /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i],
  ['projectId', /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/],
  ['storageBucket', /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/i],
  ['messagingSenderId', /^\d+$/],
  ['appId', /^1:\d+:web:[0-9a-f]+$/],
];
const configValueSource = String.raw`("[^"\\]*"|'[^'\\]*'|\x60[^\x60\\]*\x60|void 0|undefined|null)`;
const firebaseConfigPattern = new RegExp(
  firebaseConfigFields
    .map(([key]) => String.raw`["']?${key}["']?\s*:\s*${configValueSource}`)
    .join(String.raw`\s*,\s*`),
  'g',
);

function firebaseConfigProblems(match) {
  return firebaseConfigFields.flatMap(([key, shape], index) => {
    const raw = match[index + 1];
    if (!/^["'\x60]/.test(raw)) return [`Firebase config ${key} is missing`];
    return shape.test(raw.slice(1, -1)) ? [] : [`Firebase config ${key} is not a real Firebase value`];
  });
}

function isWorkspaceContained(candidatePath) {
  const relativePath = path.relative(workspaceRoot, candidatePath);
  return relativePath === '' || (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function displayPath(candidatePath) {
  return path.relative(workspaceRoot, candidatePath).split(path.sep).join('/');
}

async function resolveArtifactPath() {
  const targetPath = path.resolve(workspaceRoot, targetArgument);
  if (targetPath === workspaceRoot || !isWorkspaceContained(targetPath)) {
    throw new Error('Artifact path must resolve to a directory inside the app workspace.');
  }

  let targetStat;
  try {
    targetStat = await lstat(targetPath);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Artifact directory is absent: ${displayPath(targetPath)}`);
    }
    throw error;
  }

  if (targetStat.isSymbolicLink() || !targetStat.isDirectory()) {
    throw new Error(`Artifact path is not a regular directory: ${displayPath(targetPath)}`);
  }

  const resolvedTargetPath = await realpath(targetPath);
  if (!isWorkspaceContained(resolvedTargetPath)) {
    throw new Error('Artifact directory resolves outside the app workspace.');
  }

  return resolvedTargetPath;
}

async function collectFiles(directoryPath) {
  const files = [];
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Artifact contains a symbolic link: ${displayPath(entryPath)}`);
    }
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    } else {
      throw new Error(`Artifact contains an unsupported filesystem entry: ${displayPath(entryPath)}`);
    }
  }

  return files;
}

async function verifyHostingArtifact() {
  const artifactPath = await resolveArtifactPath();
  const files = await collectFiles(artifactPath);

  if (files.length === 0) {
    throw new Error(`Artifact directory is empty: ${displayPath(artifactPath)}`);
  }

  const textAssets = files.filter((filePath) => textAssetExtensions.has(path.extname(filePath).toLowerCase()));
  if (textAssets.length === 0) {
    throw new Error(`Artifact contains no generated text assets: ${displayPath(artifactPath)}`);
  }

  const violations = [];
  let firebaseConfigCount = 0;
  for (const filePath of textAssets) {
    const contents = await readFile(filePath, 'utf8');
    const markerClasses = artifactMarkers
      .filter(({ value, generatedPattern }) => contents.includes(value) || generatedPattern?.test(contents))
      .map(({ markerClass }) => markerClass);
    for (const match of contents.matchAll(firebaseConfigPattern)) {
      firebaseConfigCount += 1;
      markerClasses.push(...firebaseConfigProblems(match));
    }

    if (markerClasses.length > 0) {
      violations.push({ label: displayPath(filePath), markerClasses });
    }
  }
  if (firebaseConfigCount === 0) {
    violations.push({
      label: 'artifact',
      markerClasses: ['no Firebase web config found (expected apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)'],
    });
  }

  if (violations.length > 0) {
    console.error(`Hosting artifact verification failed: ${displayPath(artifactPath)}`);
    for (const violation of violations) {
      console.error(`- ${violation.label}: ${violation.markerClasses.join(', ')}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Hosting artifact verified: ${displayPath(artifactPath)} ` +
    `(${files.length} files, ${textAssets.length} generated text assets, real-shaped Firebase config, ` +
    'no Firebase emulator endpoints, test values or placeholders).',
  );
}

try {
  await verifyHostingArtifact();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown artifact verification failure.';
  console.error(`Hosting artifact verification failed: ${message}`);
  process.exitCode = 1;
}
