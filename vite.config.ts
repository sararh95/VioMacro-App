import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readEmulatorPorts } from './scripts/emulator-ports.mjs'

// AUD-042: emulator ports live in firebase.json and nowhere else. They are read
// here at config time and injected, so the browser client cannot drift from
// what the emulators actually bind. Changing a port means editing one file.
const emulatorPorts = readEmulatorPorts()

function emulatorAuthFrames(): Plugin {
  let useEmulators = false
  return {
    name: 'emulator-auth-frames',
    configResolved(config) {
      useEmulators = config.env.DEV === true || config.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    },
    transformIndexHtml(html) {
      if (!useEmulators) return html
      return html.replace(
        /<meta\b(?=[^>]*\bhttp-equiv=["']Content-Security-Policy["'])[^>]*>/i,
        meta => meta.replace(
          /(\bframe-src\s+[^;]+);/i,
          `$1 http://127.0.0.1:${emulatorPorts.auth} http://localhost:${emulatorPorts.auth};`,
        ),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emulatorAuthFrames()],
  server: {
    // Playwright writes HTML snapshots and locked trace files here. Watching
    // them reloads the app mid-test and can crash the Windows file watcher.
    watch: { ignored: ['**/_local/**'] },
  },
  define: {
    __EMULATOR_PORTS__: JSON.stringify(emulatorPorts),
  },
  build: {
    rollupOptions: {
      output: {
        // AUD-109: the app shipped as one 1.24 MB chunk, so every visitor
        // downloaded the charting library and all eight pages before the login
        // screen could render.
        //
        // Splitting the vendors out is the half that matters for repeat visits:
        // these change only when a dependency is upgraded, so a browser that has
        // been here before re-downloads only the app code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'charts';
          }
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('react-router')) return 'router';
          // React itself is deliberately NOT split out. Pulling it into its own
          // chunk produced "Circular chunk: react -> charts -> react", because
          // the charting library imports React at module-eval time. A circular
          // chunk is a load-order hazard for a saving that does not exist --
          // React is needed on the very first paint either way.
          return undefined;
        },
      },
    },
  },
})
