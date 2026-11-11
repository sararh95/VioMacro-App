# VioMacro Web App

VioMacro is a private meal-planning and recipe workflow app built with React, Vite, Firebase, and Playwright QA. The current development goal is to keep the live private-alpha app stable for daily trusted use while new deploys remain approval-gated.

## Current Deploy Posture

- Firebase Hosting is live at `https://viomacro.web.app`.
- Verified 2026-10-22: [#2](https://github.com/sararh95/VioMacro/pull/2) closed; [#3](https://github.com/sararh95/VioMacro/pull/3) merged; [#4](https://github.com/sararh95/VioMacro/pull/4) merged; [#5](https://github.com/sararh95/VioMacro/pull/5) merged. The restoration/core/CSP checkpoint is `87915b969c59210b79ed47703a2b9794f362d078`. Cleanup PRs [#6](https://github.com/sararh95/VioMacro/pull/6), [#7](https://github.com/sararh95/VioMacro/pull/7) and [#8](https://github.com/sararh95/VioMacro/pull/8) are merged; the app now lives at the repository root and code is grouped by feature. PR #2 is superseded by #3. See `docs/delivery-map.json` for verified branch and delivery metadata.
- Production Hosting may still be behind local branch changes until Release opens and completes a later deploy command.
- New Hosting deploys require explicit user approval through the Release lane.
- Functions-only deploy preparation is allowed when explicitly requested.
- Firebase budget alerts are required before wider use.
- The billing kill switch is a later required milestone, not enabled yet.

## Pull Requests and CI

Every pull request and push to main runs the CI workflow with Node 22, both clean dependency installs and npm run check. A separate browser job installs Java 21 and Chromium, then runs public, fresh-data emulator and built-app emulator QA with dummy values. CI makes no deployment. The pull request template records the summary, verification and screenshots. Existing Functions lint selects no source files; its exit status does not establish lint coverage.

## Local Development

Use Node 22. Run all commands from the repository root (npm.cmd works in PowerShell).

Install dependencies:

```bash
npm ci
npm --prefix functions ci
```

Run the Vite app:

```bash
npm run dev
```

Default local app URL:

```text
http://127.0.0.1:5173/
```

## Firebase Emulators

Vite development connects to emulators. Production builds do so only when VITE_USE_FIREBASE_EMULATORS is exactly true. Use dummy Firebase values and synthetic accounts for local browser QA, never production credentials.

The local QA harness uses Auth, Firestore, and Storage emulators. Functions are not part of the standard UI emulator run yet, so AI callable failure states should be tested with mocks unless a Functions-specific test run is being performed.

The repository pins its Firebase CLI. Install Node 22, Java 21 and Playwright Chromium (`npx playwright install chromium`; Linux CI uses `--with-deps`) after the dependency installs. No private export, Firebase login or `.env` file is required. The wrapper explicitly selects the `.firebaserc` project (`viomacro`) and only Auth, Firestore and Storage using firebase.json ports. Conflicting project/host settings or enabled AI flags fail before startup. Each CLI launch gets an empty local login store; both AI runtime flags stay unset.

Run the emulator-backed e2e suite:

```bash
npm run test:e2e:emulator
```

This command starts fresh data, creates only the synthetic `test@test.com` / `123456` account with onboarding complete and imperial settings, and owns a strict-port test server at http://127.0.0.1:5173. It fails if another server occupies the port. Compatible existing seed settings are preserved; incompatible profiles are refused instead of reset. Feature collections are not prefilled. Infrastructure regressions run as a mandatory prefix of this command.

The QA-only Vite config ignores private env files. Ordinary pages remain paused. Existing AI-flow tests intercept callables and replace availability in that page only. Normal Vite/Hosting builds have no mocked-availability module. No Functions emulator or live provider is used.

Run the app and emulators manually when debugging in the browser:

```bash
npm run dev
npm run emulator
```

With the emulators running, `node scripts/seed-qa-account.mjs` creates the same minimal account. Use dummy Firebase values for the manual dev server and stop both servers before the owned E2E suite. Manual emulator data is ephemeral unless explicitly exported.

For a particular existing export, set `VIOMACRO_FIREBASE_EMULATOR_IMPORT` (or `FIREBASE_EMULATOR_IMPORT`) to its path. Metadata and all three service directories are validated before launch. Private/generated exports are never chosen implicitly or modified. `npm run emulator -- --export-on-exit <new-path>` requests preservation into a new destination; existing destinations are refused. Keep exports ignored under `_local/firebase/exports/`.

## Verification Commands

Use these before any commit that changes app behavior:

```bash
npm run check
npm run test:e2e:emulator
```

The built-app emulator smoke suite verifies a local QA artifact without deploying it and also runs in the CI browser job:

```bash
npm run test:e2e:prod-emulator
```

Run the full local QA ladder when preparing a stabilization checkpoint:

```bash
npm run qa:local
```

## Environment Files

Do not commit local secrets or owner identifiers.

Local-only examples:

```text
functions/.env
.env.local
_local/
```

The Functions owner cap uses:

```text
OWNER_UIDS=<Firebase Auth UID>
```

## QA Ledger

Meaningful app audits and test passes should be recorded in:

```text
docs/qa/qa-ledger.md
```

Record what was tested, what passed, what failed, and which items remain deferred or Coming Soon.

## Contributor Guidance

Contributor guidance is in [AGENTS.md](AGENTS.md). Use the [contract roadmap](docs/app-contract-roadmap.md), the relevant existing contracts, the [QA ledger](docs/qa/qa-ledger.md) and the [bug ledger](docs/bug-ledger.md). Every change goes through a focused PR into main. Run commands from the repository root.

## Public Smoke And Release

Run the public suite with dummy Firebase/reCAPTCHA values, VITE_USE_FIREBASE_EMULATORS=false and CI=1 so it builds the normal production configuration and owns its preview server:

```bash
npm run test:e2e
```

Merging into main does not deploy the app. After a separately approved [release gate](docs/contracts/production-deploy-readiness-contract.md), build the final production artifact from the repository root:

```bash
npm run build:hosting
firebase deploy --only hosting
```

Require the artifact verifier to pass after emulator/browser QA before treating dist/ as deployable. Functions, rules, indexes, production data changes and live AI calls need their own explicit approval.
