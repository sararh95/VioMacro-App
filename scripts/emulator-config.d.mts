import type { EmulatorPorts } from './emulator-ports.mjs';
export interface EmulatorConfig {
  projectId: string; host: string; ports: EmulatorPorts;
  firebase: { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string };
}
export function readEmulatorConfig(root?: string, env?: NodeJS.ProcessEnv): EmulatorConfig;
export function emulatorEnvironment(root?: string, env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
