/**
 * Types for scripts/emulator-ports.mjs.
 *
 * The module itself stays plain JavaScript because it is imported from
 * vite.config.ts, from Node scripts, and from the e2e specs -- three different
 * TypeScript configurations. A .d.ts beside it keeps all three happy without
 * adding a build step to something whose whole job is to be read early.
 */

export interface EmulatorPorts {
    firestore: number;
    auth: number;
    storage: number;
    functions: number;
}

/** Reads emulators.*.port out of firebase.json. Throws if one is missing. */
export function readEmulatorPorts(root?: string): EmulatorPorts;

export const EMULATOR_HOST: string;

/** `127.0.0.1:8085` style, for the Admin SDK host environment variables. */
export function emulatorHostPort(
    name: keyof EmulatorPorts,
    root?: string
): string;
