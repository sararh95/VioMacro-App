import { defineConfig, mergeConfig, normalizePath, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import baseConfig from './vite.config';
import { readEmulatorConfig } from './scripts/emulator-config.mjs';

const availabilityUrl = '/__qa/ai-availability.js';
const pausedModule = 'export const AI_ENABLED = false;\n';
const constantsFile = normalizePath(fileURLToPath(new URL('./src/shared/constants.ts', import.meta.url)));

/** Only this local QA config has a page-scoped mocked availability boundary. */
function mockedAvailability(environment: Record<string, string>): Plugin {
  return {
    name: 'emulator-qa-mocked-availability',
    enforce: 'pre',
    configResolved(config) {
      Object.assign(config.env, environment);
      delete config.env.VITE_AI_ENABLED;
    },
    resolveId(id) {
      if (id === availabilityUrl) return { id, external: true };
    },
    transform(source, id) {
      if (normalizePath(id.split('?')[0]) !== constantsFile) return;
      const assignment = /export const AI_ENABLED = import\.meta\.env\.VITE_AI_ENABLED === 'true';/;
      if (!assignment.test(source)) throw new Error('QA availability boundary no longer matches the client flag.');
      return { code: source.replace(assignment, `export { AI_ENABLED } from '${availabilityUrl}';`), map: null };
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== availabilityUrl) return next();
        response.setHeader('Content-Type', 'text/javascript');
        response.setHeader('Cache-Control', 'no-store');
        response.end(pausedModule);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: availabilityUrl.slice(1), source: pausedModule });
    },
  };
}

export default defineConfig(() => {
  const config = readEmulatorConfig();
  const environment: Record<string, string> = { VITE_USE_FIREBASE_EMULATORS: 'true', VITE_ENABLE_INTERNAL_QA_ROUTES: 'false' };
  for (const [name, value] of Object.entries(config.firebase)) {
    const key = name.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase();
    environment[`VITE_FIREBASE_${key}`] = value;
  }
  return mergeConfig(baseConfig, {
    envDir: false,
    plugins: [mockedAvailability(environment)],
    define: Object.fromEntries(Object.entries(environment).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])),
    server: { host: config.host, strictPort: true },
    preview: { host: config.host, strictPort: true },
  });
});
