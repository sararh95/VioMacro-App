# AI And Functions Launch-Readiness Contract

Date created: 2026-06-26
Status: Closed for private-alpha AI/Functions readiness - semantic search index and valid live AI provider smoke remain deferred behind explicit gates

## Scope

- Workflow/surfaces: Firebase Functions, callable AI functions, Firestore embedding trigger, client AI calls, Gemini provider configuration, App Check, usage limits, semantic search readiness, live smoke plan.
- Owner files: `functions/src/index.ts`, `functions/tests/callable-contracts.test.cjs`, `functions/package.json`, `src/services/aiService.ts`, `src/features/meal-planning/MealPlanner.tsx`, `src/features/recipes/RecipeLibrary.tsx`, `src/services/firebase/firebase.ts`, `firestore.indexes.json`, `docs/security-cost-control.md`, `docs/bug-ledger.md`, `docs/pre-hosting-readiness.md`.
- Launch tier: Critical before live AI use.
- User goal: Let the private-alpha app use AI features deliberately, with Auth/App Check protection, clear local-vs-live boundaries, current provider configuration, bounded cost, failure-safe UI, and no accidental broad provider calls.

## Task Checklist

1. [x] Define AI/Functions launch-readiness scope and diagnosis.
   - Outcome: Contract identifies current AI surfaces, proven controls, launch blockers, and explicit non-goals.
   - Verification target: Source review of Functions, client services, readiness docs, bug ledger, security/cost docs, and current official provider docs.
   - Ledger target: This contract.

2. [x] Refresh local Functions contract proof.
   - Outcome: Existing callable contract tests, Functions lint, and Functions build pass in the current working tree.
   - Verification target: `npm.cmd run test:functions:contracts`, `npm.cmd --prefix functions run lint`, `npm.cmd --prefix functions run build`.
   - Ledger target: QA ledger.

3. [x] Confirm provider SDK/model readiness.
   - Outcome: Gemini SDK and configured model IDs are production-current enough for local readiness; exact deployed models still need live smoke after user approval.
   - Verification target: Source-backed review against current Gemini docs plus local build/tests after any provider patch.
   - Ledger target: Contract, bug ledger if deferred.

4. [x] Harden embedding dimensionality and semantic-search gate.
   - Outcome: Recipe embeddings and query embeddings use the same explicit dimension, Firestore vector-index requirements are documented, and live semantic search remains blocked until the live index is created and smoke-tested.
   - Verification target: Source review, Functions build/tests, and semantic-search guardrails; live index checklist remains deferred until approved.
   - Ledger target: Contract, BUG-009.

5. [x] Prove local emulator cannot accidentally spend AI money.
   - Outcome: Emulator blocks live AI calls by default for meal plans, recipe parsing, embeddings, and semantic search.
   - Verification target: Callable contract tests and source review of Firestore trigger behavior.
   - Ledger target: QA ledger.

6. [x] Prove callable protection and input bounds.
   - Outcome: Callable AI functions require Auth, require App Check outside emulator, reject oversized or invalid payloads, enforce owner/default usage limits outside emulator, and return bounded errors on provider failures.
   - Verification target: Contract tests and source review.
   - Ledger target: QA ledger.

7. [x] Verify client UI failure boundaries for AI features.
   - Outcome: Meal Planner AI generation, Recipe Import parsing, and Recipe Library semantic search show recoverable user-facing states when callable AI fails or is unavailable.
   - Verification target: Existing page/workflow contract evidence plus any missing targeted Playwright tests.
   - Ledger target: QA ledger; bug ledger for gaps.

8. [x] Confirm production config checklist.
   - Outcome: Required production config is documented: `GEMINI_API_KEY`, optional model env vars, `OWNER_UIDS`, App Check/reCAPTCHA site key, Firebase API key restrictions, budget alert, and no committed secrets.
   - Verification target: Docs/source review and local secret scan where feasible.
   - Ledger target: Pre-hosting readiness and security/cost docs.
   - Current status: Proven for current private-alpha readiness. `GEMINI_API_KEY` exists in Secret Manager, deployed Functions exist on Node 22, local ignored `functions/.env` has `OWNER_UIDS`, App Check reCAPTCHA v3 config exists in Firebase, local web `.env` has the public `VITE_RECAPTCHA_SITE_KEY`, Firebase browser API key restrictions were verified through API Keys metadata, `localhost` was added to the reCAPTCHA domain list, and one SDK callable smoke proved Firebase Auth + App Check tokens are accepted before request validation. Callable Cloud Run services are intentionally set to public invoker at the infrastructure layer so Firebase callable requests can reach the handler; handler-level Firebase Auth and App Check checks remain required.

9. [x] Define live smoke plan without running broad live AI.
   - Outcome: A small live canary plan exists for Functions-only validation after user approval: one meal plan, one tiny recipe parse, one semantic search only after vector index exists.
   - Verification target: Written smoke checklist and rollback/stop conditions.
   - Ledger target: Contract and pre-hosting readiness.

10. [x] Close AI/Functions launch-readiness contract.
    - Outcome: No P0/P1 AI/Functions blockers remain for private-alpha live use, or blockers are explicitly deferred with user approval and hard gates.
   - Verification target: Task checklist proof, QA ledger entry, bug ledger updated, roadmap updated.
   - Ledger target: QA ledger, bug ledger, app contract roadmap.
   - Current status: Closed for private-alpha scope. Semantic search is not launch-critical and remains deferred behind `BUG-009`; normal keyword search and friendly semantic-search fallback remain the launch path. `BUG-010` remains an accepted managed dependency-audit gate for private-alpha.

## Current Diagnosis

Proven:

- Callable Functions exist for `generateMealPlan`, `parseRecipeFromImage`, and `semanticSearchRecipes`.
- Firestore trigger `generateRecipeEmbedding` exists for recipe embedding generation.
- Functions keep the Gemini API key server-side through Firebase Functions secrets.
- Callable AI functions require Firebase Auth.
- Callable AI functions require App Check outside the emulator.
- Local emulator AI calls are blocked unless `ALLOW_EMULATOR_AI_CALLS=true`.
- Recipe image/PDF parsing enforces a 10 MB asset limit.
- Server-side Storage reads validate `users/{uid}/recipes/` ownership before downloading uploaded recipe assets.
- Search query length and result count are capped.
- AI usage limits exist for default users and owner users outside the emulator.
- Existing direct callable contract tests cover Auth, App Check assumption, payload guardrails, provider failure, malformed provider output, parser guardrails, cross-user Storage path rejection, and search query guardrails.
- Functions provider layer now uses the maintained `@google/genai` SDK instead of legacy `@google/generative-ai`.
- Embeddings now request `GEMINI_EMBEDDING_DIMENSIONS` from the provider through `outputDimensionality` and reject vectors that do not exactly match the configured Firestore index dimension.
- Client emulator tests already prove AI feature failure states in the relevant page contracts for Meal Planner, Recipe Import, and Recipe Library semantic-search fallback.
- Deployed Functions list shows `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, `semanticSearchRecipes`, and `billingBudgetMonitor` running as v2 Node 22 functions.
- Secret Manager metadata confirms `GEMINI_API_KEY` exists without reading the secret value.
- App Check Admin API metadata confirms reCAPTCHA v3 config exists for the Firebase web app.
- Local ignored `functions/.env` exists and contains `OWNER_UIDS`, so owner limits are ready for local deploy configuration without committing the UID.
- Local app `.env` contains Firebase app config fields and the public `VITE_RECAPTCHA_SITE_KEY`.
- Firebase browser API key restrictions include `https://viomacro.web.app/*`, `https://viomacro.firebaseapp.com/*`, `http://localhost:5173/*`, and `http://127.0.0.1:5173/*`.

Assumed:

- Private-alpha users are the owner and maybe one trusted tester.
- Live AI should not run until the user explicitly approves a deliberate smoke test.
- Functions-only deploy can happen before Hosting, but live AI should still be treated as a separate gate from deploy mechanics.

Broken or risky:

- Current model defaults may drift with provider availability. `gemini-3.5-flash` is currently documented as a stable model, but any live rollout should still smoke-test the exact deployed model IDs.
- Embedding code currently pins Firestore storage/query vectors to 1536 dimensions in code, but the live Firestore vector index does not exist yet. `BUG-009` remains deferred.
- `firestore.indexes.json` has no vector index, and Firebase docs show vector indexes are configured as manual indexes with field path and dimensions, not ordinary composite indexes.
- App Check callable acceptance is now proven through the Firebase Web SDK path for `generateMealPlan`. The smoke used an intentionally invalid `{}` payload and returned `functions/invalid-argument` / `Missing user settings.`, which means Firebase Auth and App Check passed before validation and before any Gemini request.
- Cloud Run IAM had been set to `Require authentication` for callable services, which blocked browser callable traffic at the infrastructure layer before Firebase Auth/App Check could run. `generateMealPlan`, `parseRecipeFromImage`, and `semanticSearchRecipes` were changed in Cloud Run Security to `Allow public access`; this is intentional for Firebase callable services and is paired with handler-level Auth + App Check enforcement.
- Live Gemini behavior has not been tested in this readiness pass.
- Production-only `npm audit --omit=dev` still reports 8 moderate advisories tied to `firebase-admin` transitive dependencies. A focused `firebase-admin@14.1.0` trial passed local build/lint/callable tests but created an unsupported peer-dependency tree with the current `firebase-functions` package line, so the app remains on the supported `firebase-admin@13.10.0` line until Firebase Functions declares Admin SDK v14 support.

## Data Read/Write

Data read:

- User settings and recipes sent from client to `generateMealPlan`.
- Uploaded recipe image/PDF data or Storage object read by `parseRecipeFromImage`.
- Recipe documents read by `semanticSearchRecipes`.
- Existing recipe document data read by `generateRecipeEmbedding`.
- AI usage counters under `users/{uid}/usage/ai-YYYY-MM-DD`.

Data write:

- AI usage counters outside emulator.
- Recipe embedding vector written to `users/{uid}/recipes/{recipeId}` by the Firestore trigger.
- No callable should write meal plans or recipes directly; page services own saved app data after review.

## Auth And Permissions

- Callable AI functions must require Firebase Auth.
- Callable AI functions must require App Check outside emulator.
- Storage-backed recipe parsing must only read files under the authenticated user's recipe upload path.
- Usage counters must be scoped under the authenticated user's document.
- Owner limits must be configured by environment variable, not hardcoded in source.

## Empty, Loading, And Error States

- Meal Planner should show recoverable AI generation failure and preserve manual planning.
- Recipe Import should clean uploaded assets on parse failure or cancel and keep draft review before save.
- Recipe Library semantic search should fall back to keyword search and friendly failure copy.
- Provider errors should become bounded client-safe errors, not raw provider dumps.

## Risks And Non-Goals

- Do not deploy Hosting in this contract.
- Do not run broad live AI tests without user approval, budget alert, App Check readiness, and secret verification.
- Do not implement the billing kill switch here; keep it as a separate required milestone before broader use.
- Do not promote Pantry or add new AI product features in this contract.
- Do not commit or push automatically.

## Verification Plan

1. Refresh local Functions contract tests, lint, and build.
2. Patch smallest safe launch blockers found in provider/embedding/schema guardrails.
3. Re-run Functions contract tests after each Functions patch.
4. Confirm relevant frontend AI failure-state evidence from page/workflow contracts.
5. Update QA ledger and bug ledger with proof and deferrals.
6. Keep live smoke test as a documented manual gate until user approves it.

## Current Proof

- Source diagnosis completed on 2026-06-26.
- 2026-06-26 baseline before provider patch:
  - `npm.cmd run test:functions:contracts`: passed, 16 tests.
  - `npm.cmd --prefix functions run lint`: passed.
  - `npm.cmd --prefix functions run build`: passed.
- 2026-06-26 provider migration:
  - Installed `@google/genai`.
  - Migrated text generation, multimodal parsing, recipe embedding, and semantic-search embedding calls to `GoogleGenAI`.
  - Removed legacy `@google/generative-ai`.
  - Added explicit embedding `outputDimensionality: 1536` and exact vector-length validation.
- 2026-06-26 after provider patch:
  - `npm.cmd --prefix functions run lint`: passed.
  - `npm.cmd --prefix functions run build`: passed.
  - `npm.cmd run test:functions:contracts`: passed, 16 tests.
- 2026-06-26 production-only audit:
  - `npm.cmd --prefix functions audit --omit=dev`: remaining 8 moderate advisories.
  - Non-breaking `npm.cmd --prefix functions audit fix --omit=dev` removed critical/high production advisories.
  - Remaining fix requires breaking major upgrade to `firebase-admin@14.1.0`; do not force inside this contract without a focused upgrade pass.
- 2026-06-26 `firebase-admin@14.1.0` focused trial:
  - Official Firebase Admin Node release notes checked. v14 breaking changes include dropping Node 18/20 support, removing deprecated legacy namespace support, removing deprecated Instance ID service, and dropping legacy messaging types.
  - `npm.cmd --prefix functions install firebase-admin@14.1.0`: installed but produced peer-dependency warnings because current `firebase-functions` and `firebase-functions-test` declare support only through `firebase-admin@13`.
  - With v14 installed, `npm.cmd --prefix functions run build`, `npm.cmd --prefix functions run lint`, and `npm.cmd run test:functions:contracts` passed.
  - `npm.cmd --prefix functions audit fix --omit=dev` failed with `ERESOLVE` because `firebase-functions` does not declare `firebase-admin@14` peer support.
  - Decision: reverted to supported `firebase-admin@13.10.0` and kept the 8 moderate advisories as a managed gate rather than forcing an unsupported peer tree.
  - Final proof after revert: Functions build passed, Functions lint passed, callable contract tests passed, and production-only audit reports only the known 8 moderate `uuid` chain advisories.
- 2026-06-26 client failure-boundary review:
  - Meal Planner page contract already proves AI generation failure shows feedback and keeps the current draft visible.
  - Recipe Import workflow contract already proves parse failure cleans uploaded image assets and alerts the user.
  - Recipe Library page contract already proves semantic-search failure alerts the user and falls back to keyword search.
- 2026-06-26 local secret-pattern scan:
  - `rg -n "GEMINI_API_KEY=|PASTE_YOUR_API_KEY|AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{20,}|VITE_RECAPTCHA_SITE_KEY=" "Web App" --glob "!node_modules/**" --glob "!functions/node_modules/**" --glob "!dist/**" --glob "!functions/lib/**"`
  - Findings were placeholders/example keys only; no live API key pattern was found in app source.
- 2026-06-26 production config metadata probe:
  - `npx.cmd --yes firebase-tools functions:list --project viomacro`: confirmed deployed v2 Node 22 Functions for `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, `semanticSearchRecipes`, and `billingBudgetMonitor`.
  - Secret Manager REST metadata confirmed `projects/861419117306/secrets/GEMINI_API_KEY` exists with automatic replication; the secret value was not read.
  - Local ignored `Web App/functions/.env` exists and has `OWNER_UIDS` configured; the UID value was not printed or committed.
  - Local ignored `Web App/.env` exists and has the Firebase app config fields.
  - App Check Admin API metadata confirmed reCAPTCHA v3 config exists for the Firebase web app with token TTL `86400s`; the site secret is intentionally not returned by the API.
  - `gcloud` is not installed locally, and this Firebase CLI version does not expose safe App Check/API key restriction metadata commands, so browser API key restriction proof remains a console/manual gate.
- 2026-06-26 App Check smoke attempt after Codex restart:
  - Public `VITE_RECAPTCHA_SITE_KEY` was added to ignored local `Web App/.env`.
  - `npm.cmd run build`: passed after site key addition.
  - Firebase browser API key restrictions were verified through API Keys metadata: two Firebase Hosting referrers plus `localhost:5173` and `127.0.0.1:5173`, with API target restrictions present.
  - Temporary Firebase Auth user `codex-smoke-2e67bb1980a3@viomacro.test` was created with the restricted API key only after supplying an allowed localhost referrer, then deleted in Firebase Console after smoke attempts.
  - Local low-level App Check smoke could not mint a reCAPTCHA token because the reCAPTCHA key domain list currently contains `viomacro.web.app`, not `localhost`.
  - Hosted-origin smoke could not be completed from local headless Chrome/Edge because `https://viomacro.web.app/` returned `ERR_NETWORK_ACCESS_DENIED` in that automation surface; the in-app browser could reach Firebase/Google pages but does not allow the script injection needed for low-level token minting.
- 2026-06-26 App Check callable smoke completion:
  - Added `localhost` to the reCAPTCHA v3 domain list and verified it remained listed after saving.
  - `npm.cmd run build`: passed after local config remained in place.
  - Temporary SDK browser harness on `http://localhost:5173/` proved reCAPTCHA/App Check token minting and Firebase Auth sign-in worked from the local smoke origin.
  - Initial callable SDK smoke returned `functions/internal`; Cloud Run Security showed `generateMealPlan` was set to `Require authentication`, blocking callable traffic before Firebase handler-level checks.
  - Cloud Run Security for `generateMealPlan`, `parseRecipeFromImage`, and `semanticSearchRecipes` was changed to `Allow public access`. This is the infrastructure-level setting needed for browser callable access; the functions still require Firebase Auth and App Check in the handler.
  - Final Firebase Web SDK callable smoke against `generateMealPlan` returned `functions/invalid-argument` with `Missing user settings.` for `{}`. This proves Firebase Auth and App Check were accepted and the request stopped before Gemini execution.
  - Temporary Firebase Auth smoke user was deleted and the local temp credential file and temporary smoke harness were removed.
- Current official Gemini docs checked on 2026-06-26:
  - Gemini model docs list `gemini-3.5-flash` as a stable model and identify Gemini Embedding 2 as a specialized task model.
  - Gemini library docs recommend the GA `@google/genai` JavaScript/TypeScript SDK and classify `@google/generative-ai` as legacy/not actively maintained.
  - Firestore vector search docs require a vector field path and vector embedding dimensions when creating a manual vector index.

## Open Bugs And Deferrals

Open bugs:

- `BUG-009` Semantic Search Live Vector Index Gate remains deferred. Decision: semantic search is not required for private-alpha launch; normal keyword search and failure fallback are acceptable until the vector index is deliberately promoted.
- `BUG-010` Functions Production Dependency Audit Gate remains open as a managed ecosystem gate and accepted for private-alpha. Revisit when `firebase-functions` and `firebase-functions-test` declare compatibility with `firebase-admin@14` or when npm provides a non-breaking fix path.
- `BUG-011` App Check Client Site Key Gate is closed. App Check callable acceptance is proven for the SDK callable path.

Deferred items:

- Live AI smoke tests.
- Live semantic search and Firestore vector index.
- Billing kill switch.
- Hosting deploy.
- Broad AI feature expansion.

## Controlled Live Smoke Plan

Do not run this until the user approves live AI testing and the production config checklist is satisfied. For private alpha, omit semantic search from the live smoke unless the user explicitly promotes semantic search into scope and `BUG-009` is completed first.

Preconditions:

- Google Cloud budget alert exists.
- `GEMINI_API_KEY` is configured as a Firebase Functions secret.
- `OWNER_UIDS` is configured if owner limits are expected.
- App Check/reCAPTCHA is configured, `VITE_RECAPTCHA_SITE_KEY` is present in the web environment, and production callable Functions accept App Check tokens.
- Firebase browser API key restrictions include the intended production and local testing referrers.
- `BUG-010` is resolved or explicitly accepted.
- For semantic search only: `BUG-009` vector index exists for `users/{uid}/recipes.embedding` dimension `1536`.

Live smoke sequence:

1. Deploy Functions only. Do not deploy Hosting in this contract.
2. Create or use one owner/tester account.
3. Run one meal-plan generation with a small settings payload.
4. Run one tiny image recipe parse under 10 MB, then confirm failed/canceled imports clean Storage if a failure is induced.
5. Create one test recipe and wait for embedding generation logs.
6. Skip semantic-search smoke for private alpha. Only after the vector index exists and semantic search is promoted, run one semantic-search query and confirm either expected recipe results or a friendly empty/fallback state.
7. Check Functions logs for App Check, Auth, quota, provider, and vector-index errors.
8. Stop live testing immediately if usage limits, App Check, provider credentials, or index errors appear.

Revisit trigger:

- Before Functions-only production deploy validation, live AI smoke testing, Hosting deploy, semantic search promotion, or broader sharing.

## Next Action

Move to the Production Deploy Readiness Gate. Keep `BUG-009` deferred unless semantic search is promoted, and keep `BUG-010` visible as an accepted moderate dependency-risk gate until the Firebase Functions ecosystem supports Admin SDK v14 cleanly.

## 2026-10-27 G5 repair: bounded meal-plan identity contract

Sara's current repair loop keeps AI paused and authorizes local mocked verification only. The historical deploy next action above does not authorize a deploy or live provider call in this loop.

1. [x] Reproduce VM-003 and VM-004 on unchanged main with the actual client service and callable handler behind local provider/database doubles. Rich recipe documents exceeded the raw request cap; unknown recipe IDs and snacks despite an explicit false preference were accepted.
2. [x] Prove failing regressions before source changes, then repair the shared callable boundary. Requests contain bounded `id`/`title`/`mealType` summaries plus planning targets/preferences. Prompt data and response validation use the same effective recipe library. Every returned meal has a known `recipeId` or explicit `null` for an existing generic suggestion; empty, missing, malformed and unknown references fail. An explicit `includeSnacks=false` prohibits snack slots, including a conflicting batch preference.
3. [x] Preserve the existing raw payload cap, prompt fence, authentication, App Check, pause and spend guards. Generic meals remain supported. Planner normalizes the nullable wire reference into its existing optional-string persistence model; no Firestore schema/rules change is needed.
4. [x] Verify actual Planner hydration, confirmation, reload, recipe detail/cooking and grocery generation with duplicate recipe titles and independent meal instance IDs. Mocked integration passes at desktop and390px. The ordinary application still presents disabled AI controls. Parent Chrome evidence and authenticated readbacks retain checked/manual groceries and unrelated saved data.
5. [x] Completed the full emulator gate (126pass/4exact authorized paused-AI main exceptions), current-head CI and two fresh sequential APPROVE reviews; merged [PR15](https://github.com/sararh95/VioMacro/pull/15) as a8dc25b. Check169frontend/125mockedFunctions and public18pass. No live availability or deployment certification is claimed.

Evidence: `docs/qa/fix-loop-2026-10-22.md`, `docs/qa/qa-ledger.md`, `_local/qa/fix-loop-2026-10-22/g5/unfixed/negative-control-proof.json` and `g5/fixed/parent-proof-index.json`. Eight final core-page console windows are clean; the earlier transient cold-read timeout is retained as VM-035/G6 evidence. New pre-existing singular-unit copy issue VM-047 is assigned to G14.
