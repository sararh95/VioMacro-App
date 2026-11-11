#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, mkdirSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emulatorEnvironment, readEmulatorConfig } from './emulator-config.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const services = 'auth,firestore,storage';

function validatedImport(input) {
  const target = realpathSync(path.resolve(appRoot, input));
  const metadata = JSON.parse(readFileSync(path.join(target, 'firebase-export-metadata.json'), 'utf8'));
  const contained = (relative, directory) => {
    if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('Invalid export service path.');
    const resolved = realpathSync(path.resolve(target, relative));
    const suffix = path.relative(target, resolved);
    if (!suffix || suffix.startsWith('..') || path.isAbsolute(suffix)) throw new Error('Export service path must stay inside its directory.');
    if (directory ? !statSync(resolved).isDirectory() : !statSync(resolved).isFile()) throw new Error('Incomplete export.');
    return resolved;
  };
  for (const name of ['auth', 'firestore', 'storage']) {
    const directory = contained(metadata[name]?.path, true);
    if (!readdirSync(directory, { recursive: true, withFileTypes: true }).some(entry => entry.isFile())) throw new Error(`Incomplete ${name} export.`);
  }
  contained(metadata.firestore.metadata_file, false);
  return target;
}

try {
  const [mode, ...args] = process.argv.slice(2);
  if (!['start', 'exec'].includes(mode)) throw new Error('Usage: firebase-emulator.mjs start [options] | exec [options] -- <command>');
  const separator = args.indexOf('--');
  if (mode === 'exec' && (separator < 0 || separator === args.length - 1)) throw new Error('exec requires -- <command>.');
  const options = mode === 'exec' ? args.slice(0, separator) : args;
  const config = readEmulatorConfig(appRoot);
  let imported = process.env.VIOMACRO_FIREBASE_EMULATOR_IMPORT || process.env.FIREBASE_EMULATOR_IMPORT;
  const extra = [];
  for (let index = 0; index < options.length; index++) {
    const flag = options[index];
    if (['--debug', '--non-interactive'].includes(flag)) { extra.push(flag); continue; }
    const value = options[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}.`);
    if (flag === '--only' && value === services) continue;
    if (flag === '--project' && value === config.projectId) continue;
    if (flag === '--config' && path.resolve(appRoot, value) === path.join(appRoot, 'firebase.json')) continue;
    if (flag === '--import') {
      if (imported && path.resolve(appRoot, imported) !== path.resolve(appRoot, value)) throw new Error('Conflicting imports.');
      imported = value; continue;
    }
    if (flag === '--export-on-exit') {
      const target = path.resolve(appRoot, value);
      if (existsSync(target)) throw new Error('Export destination already exists; choose a new path.');
      extra.push(flag, target); continue;
    }
    throw new Error(`Unsupported or conflicting emulator option ${flag}.`);
  }
  const cli = path.join(appRoot, 'node_modules/firebase-tools/lib/bin/firebase.js');
  if (!existsSync(cli)) throw new Error('Local Firebase CLI missing. Run npm ci with Node 22.');
  const firebaseArgs = [`emulators:${mode}`, '--project', config.projectId, '--only', services, ...extra];
  if (imported) firebaseArgs.push('--import', validatedImport(imported));
  if (mode === 'exec') firebaseArgs.push(args.slice(separator + 1).join(' '));
  console.error(`[firebase-emulator] project=${config.projectId}; services=${services}; ${imported ? 'explicit validated import' : 'fresh data (no import)'}; AI paused`);
  const cliConfigRoot = path.join(appRoot, '_local/firebase/cli-config');
  mkdirSync(cliConfigRoot, { recursive: true });
  const env = emulatorEnvironment(appRoot);
  // Configstore honors XDG_CONFIG_HOME on Windows and Linux. A new empty
  // store prevents this lane from loading the developer's Firebase login.
  env.XDG_CONFIG_HOME = mkdtempSync(path.join(cliConfigRoot, 'run-'));
  // GoogleAuth checks an explicit ADC path before its separate gcloud cache
  // and compute metadata. A directory is rejected locally as a non-file,
  // so optional CLI authentication never discovers a real identity.
  env.GOOGLE_APPLICATION_CREDENTIALS = env.XDG_CONFIG_HOME;
  const result = spawnSync(process.execPath, [cli, ...firebaseArgs], { cwd: appRoot, env, shell: false, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(`[firebase-emulator] ${error.message}`);
  process.exitCode = 1;
}
