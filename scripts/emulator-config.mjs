import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMULATOR_HOST, readEmulatorPorts } from './emulator-ports.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** One local namespace for the CLI, seed, Vite and authenticated SDK fixtures. */
export function readEmulatorConfig(root = appRoot, env = process.env) {
  const projectId = JSON.parse(readFileSync(path.join(root, '.firebaserc'), 'utf8'))?.projects?.default;
  if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) throw new Error('A valid projects.default is required in .firebaserc.');
  for (const key of ['VITE_FIREBASE_PROJECT_ID', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) {
    if (env[key] && env[key] !== projectId) throw new Error(`${key} disagrees with .firebaserc (${projectId}).`);
  }
  const ports = readEmulatorPorts(root);
  const hosts = { FIRESTORE_EMULATOR_HOST: ports.firestore, FIREBASE_AUTH_EMULATOR_HOST: ports.auth, FIREBASE_STORAGE_EMULATOR_HOST: ports.storage };
  for (const [key, port] of Object.entries(hosts)) {
    if (env[key] && ![`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(env[key])) throw new Error(`${key} must use the configured loopback emulator port ${port}.`);
  }
  if (env.VITE_AI_ENABLED === 'true' || env.AI_ENABLED === 'true') throw new Error('AI must remain paused for emulator QA.');
  return {
    projectId, host: EMULATOR_HOST, ports,
    firebase: { apiKey: 'demo-key', authDomain: 'localhost', projectId, storageBucket: `${projectId}.appspot.com`, messagingSenderId: '1234567890', appId: '1:1234567890:web:0000000000000000000000' },
  };
}

export function emulatorEnvironment(root = appRoot, env = process.env) {
  const config = readEmulatorConfig(root, env);
  const result = { ...env, GCLOUD_PROJECT: config.projectId, VITE_USE_FIREBASE_EMULATORS: 'true' };
  for (const [name, value] of Object.entries(config.firebase)) {
    const key = name.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase();
    result[`VITE_FIREBASE_${key}`] = value;
  }
  result.FIRESTORE_EMULATOR_HOST = `${config.host}:${config.ports.firestore}`;
  result.FIREBASE_AUTH_EMULATOR_HOST = `${config.host}:${config.ports.auth}`;
  result.FIREBASE_STORAGE_EMULATOR_HOST = `${config.host}:${config.ports.storage}`;
  const excluded = ['AI_ENABLED', 'VITE_AI_ENABLED', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_TOKEN'];
  for (const key of Object.keys(result)) if (excluded.includes(key.toUpperCase())) delete result[key];
  return result;
}
