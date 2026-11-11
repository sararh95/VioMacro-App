# VioMacro E2E QA

This project uses Playwright for repeatable browser smoke tests. Use these tests before any new Hosting deploy.

For exploratory Chrome plus subagent testing, use `docs/qa/chrome-subagent-page-qa-playbook.md`. Chrome is the real-browser discovery lane; Playwright remains the repeatable proof lane.

## What Is Covered

- Public/auth smoke:
  - Auth page renders.
  - Login/signup controls respond.
  - Protected routes redirect signed-out users to `/auth`.
  - Runs on desktop Chromium and mobile Chromium.

- Emulator authenticated smoke:
  - Starts Firebase Auth, Firestore, and Storage emulators from the local export.
  - Starts Vite dev server.
  - Logs in with the seeded emulator user.
  - Clicks through Dashboard, Plan, Recipes, Grocery List, Pantry, Progress, and Settings.
  - Checks onboarding skip, settings save, manual recipe creation, pantry quick-add/delete, grocery quick-add/check, and recipe import route behavior.

- Production-build authenticated emulator smoke:
  - Starts Firebase Auth, Firestore, and Storage emulators from the local export.
  - Builds the production bundle with emulator wiring enabled.
  - Serves `dist` and verifies authenticated navigation plus the recipe import workflow.

The tests intentionally avoid paid or production AI paths:
- Do not click Auto-Generate Week.
- Do not click Magic Import.
- Do not use AI Search.
- Do not use Google sign-in.

## Commands

Run the non-browser app and Functions gate:

```powershell
npm run check
```

Run every local QA gate:

```powershell
npm run qa:local
```

Run only the browser suites:

```powershell
npm run qa:browser
```

Run production-build public smoke:

```powershell
npm run test:e2e
```

Run authenticated emulator smoke:

```powershell
npm run test:e2e:emulator
```

Run authenticated production-build emulator smoke:

```powershell
npm run test:e2e:prod-emulator
```

Open Playwright UI mode for interactive debugging:

```powershell
npm run test:e2e:ui
```

## Notes

- Playwright reports and traces are generated into `_local/qa/playwright-report/` and `_local/qa/test-results/`; `_local/` is ignored by Git.
- The emulator suite uses `scripts/firebase-emulator.mjs` to resolve local emulator data. Set `VIOMACRO_FIREBASE_EMULATOR_IMPORT` for a specific export; otherwise the wrapper uses `FIREBASE_EMULATOR_IMPORT`, then `_local/firebase/exports/firebase-export`, then the newest non-empty `_local/firebase/exports/firebase-export-*` directory, with legacy root `firebase-export*` folders as a fallback.
- If a test fails, inspect the trace with:

```powershell
npx playwright show-trace path\to\trace.zip
```

- Chrome connector status for the 2026-06-26 deploy-readiness rerun: available and used for serialized route/overlay/console checks. Keep using Playwright for repeatable proof and use Chrome for exploratory page-contract passes.
