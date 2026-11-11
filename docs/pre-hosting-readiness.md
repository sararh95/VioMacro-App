# VioMacro Pre-Hosting Readiness

The next Hosting deploy is intentionally blocked until these gates pass in the same working tree and the user explicitly approves the deploy.

Track page-by-page and workflow-by-workflow readiness in `docs/app-contract-roadmap.md`.

## Current Rating

Private Alpha Hosting is live at `https://viomacro.web.app`. CMD-014 deployed the build generated from checkpoint `541a7f2` as version `0d45e0cec1e830e8`, release `1783629623146000`, at `2026-07-09T20:40:23.146Z`. Any future Hosting deploy remains approval-gated.

CMD-014 preserved the pre-deploy rollback target as version `ed0f58dc8bbc9796`, release `1782584943034000`, from `2026-06-27T18:29:03.034Z`. This is a snapshot, not a permanent rollback target; recapture the live version immediately before any future deploy.

CMD-013 fresh local pre-deploy regression passed on 2026-07-09 against pushed checkpoint `541a7f2`. This is local readiness evidence only and does not imply deploy approval or prove that checkpoint is live.

CMD-014 then completed the separately approved Hosting-only deploy. Release and Manager independently confirmed signed-out Auth rendering and protected-route redirect; no rollback trigger was found.

Operational deploy and rollback procedure: `docs/contracts/production-deploy-readiness-contract.md`.

## Proven Locally

- Frontend lint exits with zero errors.
- Frontend lint exits with zero warnings.
- Frontend production build completes.
- Functions lint exits with zero errors.
- Functions TypeScript build completes.
- AI callable contract tests complete locally with mocked provider behavior.
- AI Functions use the maintained `@google/genai` SDK.
- Deployed AI Functions are visible as v2 Node 22 Functions.
- `GEMINI_API_KEY` exists in Secret Manager metadata; the secret value was not read.
- Public `VITE_RECAPTCHA_SITE_KEY` is present in ignored local web `.env`.
- Firebase browser API key restrictions were verified through API Keys metadata for Hosting domains and local smoke origins.
- App Check callable acceptance is proven for the Firebase Web SDK path: a controlled `generateMealPlan` smoke returned `functions/invalid-argument` / `Missing user settings.` before any Gemini request.
- Cloud Run public invoker is intentionally enabled for callable AI services so browser callable requests can reach handler-level Firebase Auth + App Check.
- Semantic search is deferred for private alpha; normal keyword recipe search and semantic-search failure fallback remain the launch path until the Firestore vector index is deliberately promoted.
- Billing safety phase 1-2 is complete: `$20` budget email alert confirmed and Pub/Sub budget notification topic connected.
- Billing phase 3 alert-only monitor source builds and passes local parser contract tests.
- Billing phase 3 deployed monitor proof is complete: a Pub/Sub sample message was logged by `billingBudgetMonitor` with `destructiveAction: false`.
- Signed-out public/protected-route Playwright smoke passes on desktop and mobile Chromium.
- Authenticated emulator Playwright smoke passes for onboarding, navigation, meal planner prompt dismissal, recipe import route, settings save, manual recipe creation, pantry quick-add/delete, grocery quick-add/check, dashboard persistence, and data-loss cleanup paths.
- Authenticated production-build emulator smoke passes for built app login, direct launch routes, recipe import route, and Pantry/Grocery stale-prototype guards.
- Fresh CMD-013 proof at checkpoint `541a7f2` passed app and Functions checks, public E2E 18/18, authenticated emulator E2E 61/61, and production-build emulator E2E 4/4.
- Chrome manual smoke passes for login, Dashboard render, strict sidebar navigation, Pantry Coming Soon, and `/recipes/import` Magic Import landing.
- QA runs are recorded in `docs/qa/qa-ledger.md`.

## Must Pass Before Hosting Deploy

- Confirm the exact branch/commit and review `git status -sb`; dirty runtime or Firebase config changes must be absent or explicitly understood.
- Run `npm.cmd run qa:local` unless the Manager explicitly approves a narrower fresh ladder, and confirm `dist/` was built from the exact commit to publish.
- Re-read `firebase.json` and confirm no Functions/Cloud Run Hosting rewrite or `pinTag` has been added.
- Recapture the current live version with `npx.cmd --yes firebase-tools hosting:channel:list --site viomacro --project viomacro --json` and record it as the rollback target.
- Confirm the Hosting-only deploy and rollback commands in `docs/contracts/production-deploy-readiness-contract.md` and confirm no unintended production data mutation.
- Confirm `VITE_RECAPTCHA_SITE_KEY`, reCAPTCHA domains, Firebase browser API key restrictions, callable Cloud Run public-invoker settings, and budget alert/monitoring remain intact immediately before deploy.
- Get explicit user approval for a Hosting-only deploy command.

## Still Deferred

- Any next Hosting deploy until explicitly approved.
- Billing kill switch hard cutoff code and live enablement.
- Billing hard cutoff dry-run matrix and live enablement.
- GitHub Actions / CI.
- Live AI provider smoke tests.
- Production semantic-search vector index, because semantic search is deferred for private alpha.
- `firebase-admin@14` dependency-upgrade pass, deferred until Firebase Functions packages declare compatible peer support.
