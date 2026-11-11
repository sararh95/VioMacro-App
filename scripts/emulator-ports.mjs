/**
 * The single source of truth for emulator ports: firebase.json.
 *
 * AUD-042 predicted this exactly -- "ports are written in two places, changing
 * one silently breaks the other, and a future port change breaks local QA in a
 * confusing way". By the time it mattered the ports were written in SIX places:
 * firebase.json, src/lib/firebase.ts, tests/e2e/emulator-auth.spec.ts,
 * scripts/seed-dev-recipe.mjs, scripts/clear-fabricated-expiry.mjs and
 * scripts/verify-hosting-artifact.mjs.
 *
 * What forced the change: an unrelated SSH tunnel on this machine holds
 * 127.0.0.1:8080 and restarts itself, so the Firestore emulator could not bind
 * its port. Two processes fighting over one port is not something a test suite
 * can be made robust against -- the emulator has to move.
 *
 * Node code imports from here. The browser gets the same numbers through
 * vite.config.ts, which reads this module at config time and injects them.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Read straight from firebase.json so there is nothing to keep in sync. */
export function readEmulatorPorts(root = appRoot) {
    const config = JSON.parse(
        readFileSync(path.join(root, 'firebase.json'), 'utf8')
    );
    const emulators = config?.emulators ?? {};

    const port = (name) => {
        const value = emulators[name]?.port;
        if (!Number.isInteger(value) || value < 1 || value > 65535) {
            throw new Error(
                `firebase.json is missing a valid emulators.${name}.port (got ${JSON.stringify(value)}).`
            );
        }
        return value;
    };

    return {
        firestore: port('firestore'),
        auth: port('auth'),
        storage: port('storage'),
        functions: port('functions'),
    };
}

export const EMULATOR_HOST = '127.0.0.1';

/** `127.0.0.1:8085` style, which is what the Admin SDK env vars want. */
export function emulatorHostPort(name, root = appRoot) {
    return `${EMULATOR_HOST}:${readEmulatorPorts(root)[name]}`;
}
