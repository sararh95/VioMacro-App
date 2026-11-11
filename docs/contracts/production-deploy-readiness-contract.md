# Production Deploy Readiness Contract

Date created: 2026-06-26
Status: Private-alpha Hosting live at CMD-042 version `762e5b25bfb28e0c` from immutable `f9769ae`; CMD-046 activated exactly seven AI-spend Functions from immutable `464d404` and proved one clean owner status call without Gemini; the `$50` native cap remains configured; further deploys and any Gemini canary remain explicitly approval-gated

## Scope

- Workflow/surfaces: pre-Hosting release gate, local validation, emulator QA, production-build QA, browser/Chrome happy-path testing, bug ledger review, Firebase deploy settings, rollback readiness, and production data safety.
- Owner files: `package.json`, `firebase.json`, `.firebaserc`, `docs/pre-hosting-readiness.md`, `docs/app-contract-roadmap.md`, `docs/bug-ledger.md`, `docs/qa/qa-ledger.md`, page/workflow contracts, and Firebase console configuration.
- Launch tier: Required before any new Hosting deploy.
- User goal: Know whether the private-alpha web app is safe enough to deploy to Hosting without breaking core workflows, hiding critical bugs, spending AI money accidentally, or risking data loss.

## Task Checklist

1. [x] Define production deploy readiness scope and rules.
   - Outcome: This contract separates deploy readiness from feature expansion and keeps Hosting blocked until proof exists.
   - Verification target: Contract exists and roadmap points here.
   - Ledger target: This contract and app contract roadmap.

2. [x] Run baseline repo validation.
   - Outcome: Current working tree passes `npm run check`.
   - Verification target: Frontend lint/build and Functions lint/build pass from the repository root.
   - Ledger target: QA ledger.

3. [x] Run full local browser QA suite.
   - Outcome: Current working tree passes `npm run qa:browser`.
   - Verification target: Public/protected route smoke, authenticated emulator smoke, and production-build emulator smoke pass.
   - Ledger target: QA ledger and bug ledger for failures.

4. [x] Run targeted rules/data-loss checks.
   - Outcome: Firestore and Storage rules still protect owner-scoped data, and data-loss e2e still passes.
   - Verification target: `npm run test:rules` and `npm run test:e2e:emulator:data-loss`.
   - Ledger target: QA ledger and bug ledger for failures.

5. [x] Run parallel QA bug-finding lanes.
   - Outcome: Independent QA agents inspect launch-critical flows for blockers, honest UI, and deploy readiness gaps.
   - Verification target: Agent summaries are reviewed by the manager and converted into fixes, deferrals, or bug-ledger entries.
   - Ledger target: QA ledger and bug ledger.

6. [x] Run Chrome/manual happy-path smoke.
   - Outcome: In the user/browser environment, the app can complete the private-alpha happy path or any blocker is documented.
   - Verification target: Chrome/browser pass over Auth, Dashboard, Meal Planner, Grocery, Recipes, Settings, Progress, Navigation shell, and known deferred Pantry/Semantic Search states.
   - Ledger target: QA ledger and bug ledger.

7. [x] Confirm Firebase deploy controls.
   - Outcome: Firebase project, Hosting target, rollback command, App Check/reCAPTCHA, API key restrictions, callable Cloud Run public-invoker settings, and budget alerts are verified immediately before deploy.
   - Verification target: Local config/source review plus console/CLI checks where safe.
   - Ledger target: Pre-hosting readiness and security/cost docs.

8. [x] Review open bugs and deferrals.
   - Outcome: No P0/P1 blockers remain. Deferred items are explicitly accepted for private alpha.
   - Verification target: `docs/bug-ledger.md` and page/workflow contracts.
   - Ledger target: Bug ledger and this contract.

9. [x] Produce deploy/no-deploy decision.
   - Outcome: Manager recommendation says either "ready for user-approved Hosting deploy" or lists blockers in priority order.
   - Verification target: All checklist evidence is recorded.
   - Ledger target: QA ledger, pre-hosting readiness, roadmap.

10. [x] Commit readiness documentation.
    - Outcome: Contract, ledgers, and readiness docs are committed after tests and secret scan pass.
    - Verification target: `git diff --check`, docs secret scan, `git status -sb`.
    - Ledger target: Git commit.

11. [x] Operationalize the Hosting-only deploy and rollback path.
    - Outcome: Release captured the current live Hosting version, verified the Hosting-only impact boundary, and documented exact deploy, rollback, smoke, and abort procedures without mutating production.
    - Verification target: QA ledger CMD-011 evidence, official Firebase Hosting documentation, and independent Manager read-only live-channel metadata check.
    - Ledger target: This contract, QA ledger, and `BUG-025` closure in the bug ledger.

12. [x] Deploy the accepted checkpoint to Hosting and run signed-out smoke.
    - Outcome: Under explicit user approval, Release deployed checkpoint `541a7f2` with `--only hosting`, preserved the pre-deploy rollback target, and proved Auth plus protected-route signed-out behavior.
    - Verification target: QA ledger CMD-014 evidence, Release smoke, independent Manager browser smoke, and independent Manager live-channel metadata check.
    - Ledger target: This contract, QA ledger, manager roadmap, and `BUG-021` watch classification.

## Current Diagnosis

Proven:

- Core page/workflow contracts have locally graduated except Pantry, which remains deferred by product decision.
- AI/Functions launch-readiness is closed for private-alpha scope.
- App Check callable acceptance is proven for the Firebase Web SDK path.
- Semantic search is deferred and not a private-alpha blocker.
- Billing phase 1-3 alert-only monitoring is complete; hard cutoff remains deferred.
- CMD-042 now serves the corrected disabled-state build from immutable `f9769ae7deb1406526cffa43d5c737297c1fdcd1` as live version `762e5b25bfb28e0c`. Branch `codex/webapp-folder-structure-v1` and its upstream remain aligned at that exact checkpoint; later Manager closeout docs must not be used as a deploy source.
- 2026-09-27: the line above records July. The working branch is now `main`, which is 43 commits ahead of the deployed source `f9769ae`. Those commits change `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json` and `functions/src`, so the next deploy cannot follow the Hosting-only runbook below. For example, the live meal-plan rule's `hasOnly` list has no `mealStatus`, and the current app writes `mealStatus` on every meal tick.
- CMD-038 proved that `test:e2e:prod-emulator` rebuilt default `dist/` with emulator mode and made it unsafe to deploy. Manager rolled back the failed `db2ff99bfb34e9b1` release through Firebase Console; signed-out `/auth` and `/plan` smoke passed after recovery. CMD-039/CMD-040 then closed `BUG-030` locally: prod-emulator output is isolated under ignored `_local/qa/prod-emulator-dist`, exact production hashes remain unchanged across that suite, and `build:hosting` fails closed on emulator-contaminated artifacts.
- CMD-042 proved the correction in production: the isolated suite passed 4/4, public E2E passed 18/18, final `build:hosting` verified a clean five-file artifact, and Release plus Manager signed-out smoke passed without recurrence or rollback.
- CMD-044 configured only VioMacro's experimental Gemini project monthly spend cap at `$50`; Release proved persistence and Manager independently confirmed the settled `$0.00 / $50.00` state without invoking Gemini or any production/Firebase path.
- CMD-045 accepted immutable `464d404` as the exact activation source, freshly reconfirmed the seven targets active and disabled with preserved bindings/scaling, and documented exact enable/disable commands plus bounded owner-status side effects without deploying or invoking production.
- CMD-046 activated exactly those seven Functions with the exact `true` flag. Release postdeploy metadata and independent Manager metadata-only verification confirmed all seven ACTIVE on v2 Node 22 with preserved scaling/bindings and unchanged flag-absent `billingBudgetMonitor`. Exactly one owner status POST returned the clean `$20` active state with zero Gemini/provider traffic; no rollback trigger occurred.

Assumed:

- Private alpha means owner/trusted tester usage, not public launch.
- Any future Hosting deploy remains a separate user-approved Release action after the relevant readiness gate.
- Valid live AI provider smoke is not part of this pass unless the user explicitly approves it.

Current release caveats:

- The latest Hosting deploy was explicitly approved and completed on 2026-07-12 with `npx.cmd --yes firebase-tools deploy --only hosting --project viomacro`.
- The live Hosting URL is `https://viomacro.web.app`.
- Current live Hosting metadata is version `762e5b25bfb28e0c`, release `1783842374869000`, at `2026-07-12T07:46:14.869Z`, with deploy message `Hosting-only artifact-safe disabled AI safety from codex/webapp-folder-structure-v1 f9769ae`.
- The freshly captured pre-deploy rollback target for CMD-042 is version `0d45e0cec1e830e8`, release `1783823928312000`, at `2026-07-12T02:38:48.312Z`. Recapture the live version again before any future deploy; do not assume either snapshot remains current forever.
- CMD-042 ran signed-out live smoke only. Authenticated production workflows were not rerun after this deploy and remain separately approval-gated.
- Open deferred risks `BUG-004`, `BUG-009`, `BUG-010`, and `BUG-013` must stay accepted/deferred, not accidentally promoted into blockers.

## Hosting-Only Deploy And Rollback Runbook

This runbook is operational guidance, not standing deploy approval. Every deploy, rollback, or Hosting version clone requires a separately active Release command and explicit user approval.

### Pre-Deploy Gate

From the repository root:

1. Record `git status -sb`, branch, `HEAD`, upstream, and the exact commit to publish. Stop if dirty runtime or Firebase configuration changes are ambiguous.
2. Run `npm.cmd run qa:local` unless the Manager explicitly approves a narrower fresh verification ladder. CMD-039/CMD-040 independently proved that prod-emulator output is isolated and cannot alter `dist/`. After every emulator/browser test, run `npm.cmd run build:hosting` as the final artifact gate and require its verifier to pass before treating `dist/` as deployable. Confirm that final artifact was built from the exact immutable commit in production mode.
3. Re-read `firebase.json`. Confirm Hosting still serves `dist`, the SPA rewrite still targets `/index.html`, and no Functions/Cloud Run rewrite or `pinTag` has been added.
4. Capture the then-current live rollback target with this read-only command:

```powershell
npx.cmd --yes firebase-tools hosting:channel:list --site viomacro --project viomacro --json
```

5. Record the live version ID, release ID, and release time. If the metadata cannot be captured, stop until Firebase Console Hosting release history is inspected read-only.
6. Present the exact commit, verification result, Hosting-only command, rollback target, smoke plan, and abort criteria to the user. Proceed only after explicit deploy approval.

### Hosting-Only Deploy

Run only under a separately approved Release command:

```powershell
npx.cmd --yes firebase-tools deploy --only hosting --project viomacro -m "Hosting-only deploy from <BRANCH> <COMMIT>"
```

Current impact boundary: `firebase.json` contains a static SPA Hosting rewrite only and no `pinTag`, so this command targets Hosting content/config and does not include Functions, Firestore rules/indexes, Storage rules, Auth, App Check, billing, provider settings, secrets, live AI, or semantic-search index work. Reopen Release review if the Hosting rewrite configuration changes.

### Rollback Path A: Firebase Console

This is the current proven primary rollback path. Under a separately approved rollback command, open Firebase Console > Hosting & Serverless > Hosting > site `viomacro` > Release history. Choose the freshly captured pre-deploy known-good release, open its overflow menu, select **Rollback**, and then run the signed-out smoke ladder. CMD-038 used this path successfully to restore version `0d45e0cec1e830e8`.

### Rollback Path B: CLI Version Clone

Unavailable with the currently installed Firebase CLI and not an operational rollback path. During CMD-038, both the documented version-ID form and the PowerShell-quoted equivalent were rejected before mutation; current `hosting:clone --help` advertises channel sources only. Do not retry, guess, or advertise version-ID clone as executable. A future channel-snapshot or API rollback method requires separate research and non-live proof before adoption. See `BUG-031`.

### Smoke And Rollback Triggers

After an approved deploy, first run signed-out/read-only smoke: `/auth` returns `200`, the private-alpha Auth UI renders, a protected route redirects to `/auth`, and no bundle/config blocker appears in page or console errors. Authenticated smoke requires separate approval, the dedicated ignored test account, no live AI, and tiny reversible data only if mutation is explicitly approved.

Consider rollback for a blank/crashing app shell, broken Auth entry or protected-route redirect, deployed bundle/config blockers, a P0/P1 core-route failure, or evidence that a supposed Hosting-only command touched unexpected resources. Do not roll back for known deferred Pantry, semantic-search, live-AI, or cosmetic P3 items.

Official procedure references, verified 2026-07-09:

- https://firebase.google.com/docs/hosting/manage-hosting-resources
- https://firebase.google.com/docs/hosting/test-preview-deploy
- https://firebase.google.com/docs/cli

## Stage 5 Disabled Functions Deploy Packet

Status: Accepted and completed under CMD-030 on 2026-07-10. Exact seven-Function deployment and metadata-only proof passed; the breaker remains disabled. This completion grants no invocation, activation, rollback, deletion, or other-resource authority.

Immutable source and scope:

- Deploy only from a clean worktree or equivalent immutable artifact pinned to `464d404cc76f62d1640ae4ef6d1e889ca04d4095`. Do not deploy from the dirty Manager coordination checkout.
- Update `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, and `semanticSearchRecipes`.
- Create `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend`.
- Exclude `billingBudgetMonitor`, Hosting, Firestore rules/indexes, Storage, App Check configuration, IAM, billing, provider settings, secrets, email transport, and production data.

Exact future deploy command, to run only inside the pinned clean worktree after explicit approval:

```powershell
npx.cmd --yes firebase-tools deploy --only functions:generateMealPlan,functions:parseRecipeFromImage,functions:generateRecipeEmbedding,functions:semanticSearchRecipes,functions:getAiSpendStatus,functions:resumeAiSpendAllowance,functions:manualPauseAiSpend --project viomacro -m "Disabled AI spend Functions deploy from 464d404"
```

Preconditions and proof:

- Reconfirm immutable source, upstream checkpoint, target project, and exact Function list immediately before deploy.
- Reconfirm `AI_SPEND_CIRCUIT_BREAKER_ENABLED` is absent or false and the `GEMINI_API_KEY` binding exists by metadata only.
- Stop if the command expands beyond the seven named Functions or any excluded surface appears in the deployment plan.
- After deploy, use metadata only to confirm all seven selected Functions, bounded scaling, absent/false flag, secret binding name/version, and unchanged `billingBudgetMonitor` posture.
- Do not invoke a Function, Auth/App Check flow, production app/data path, or Gemini. Do not read logs unless a later command explicitly approves a narrow log read.

Rollback:

- Use a separate clean worktree pinned to `541a7f2b1fb4274e4a75894c3688ddaa88102326` and redeploy only the four prior AI Functions after separate rollback approval.
- The three new owner callables are not removed by that redeploy. They may remain temporarily fail-closed only while the circuit-breaker flag remains absent/false and Manager accepts the residual surface.
- Deleting any new callable is a separate production mutation and requires explicit approval; never add `--force` by default.

## Stage 5 AI Spend Breaker Activation Packet

Status: Accepted and completed under CMD-046 on 2026-07-12. The AI-only breaker is active; the optional Gemini canary remains deferred and is not required for breaker acceptance.

- Immutable source: clean detached `464d404cc76f62d1640ae4ef6d1e889ca04d4095`.
- Local gates: locked installs, Functions lint/build, and exactly 62/62 mocked contracts passed with no Gemini request.
- Deployment: exactly `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, `semanticSearchRecipes`, `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend`; no `--force`, deletion, or unrelated resource.
- Metadata: all seven ACTIVE on v2 Node 22 with exact flag `true`, accepted memory/scaling, owner config present by name, expected provider secret version metadata, and unchanged separate `billingBudgetMonitor`.
- Owner proof: exactly one `getAiSpendStatus` POST plus OPTIONS returned `Active`, `$20.00` allowance, `$0.00` spent/reserved, `$19.00` remaining, `$1.00` reserve, expected pricing version, and no pause details. Zero other callable or Gemini/provider requests occurred.
- Rollback: no named trigger occurred, so the pre-authorized same-source false-flag redeploy was not used.
- Manager acceptance: independent sanitized metadata-only verification matched all eight Functions and did not repeat the consumed owner status call.
- Local hygiene: both copied worktree env files are absent; the retained worktree is clean at exact `464d404`.

## Non-Goals

- Do not deploy Hosting in this contract without explicit user approval after the readiness decision.
- Do not implement the billing hard cutoff in this contract.
- Do not enable semantic search or create the vector index in this contract.
- Do not run broad valid Gemini/provider tests without explicit approval.
- Do not start Pantry feature work.

## Verification Plan

1. Run local validation commands.
2. Dispatch independent QA agents for source/contract review and launch flow bug hunting.
3. Run browser/Chrome happy-path smoke after the app/emulators are available.
4. Convert any finding into a fix, explicit deferral, or bug-ledger item.
5. Produce a deploy/no-deploy recommendation.

## Current Proof

- 2026-06-26: Contract created after AI/Functions private-alpha gate closure.
- 2026-06-26: `npm.cmd run check` passed for frontend lint/build and Functions lint/build. Known non-blocking warnings remain: stale Browserslist data, Vite dynamic/static import chunking, and large bundle size.
- 2026-06-26: Chrome manual smoke on emulator-backed `http://127.0.0.1:5173/` proved login, Dashboard render, strict sidebar navigation to Grocery/Recipes/Progress/Settings/Pantry, Pantry Coming Soon route, and `/recipes/import` Magic Import landing with enabled `image/*,.pdf` file input.
- 2026-06-26: Chrome smoke found a P1 Plan modal bug: `Maybe Later` immediately reopened and blocked sidebar navigation. Fixed in `src/features/meal-planning/MealPlanner.tsx` with a dismissed-week guard.
- 2026-06-26: Regression test added: `meal planner prompt can be dismissed without blocking sidebar navigation`.
- 2026-06-26: `npm.cmd run qa:browser` passed: public/protected route smoke 18/18, authenticated emulator smoke 53/53, production-build emulator smoke 3/3.
- 2026-06-26: `npm.cmd run test:rules` passed: Firestore rules 19/19 and Storage rules 3/3. Expected permission-denied logs appeared only for negative rules cases.
- 2026-06-26: Dedicated data-loss proof passed inside the full emulator suite and in targeted form: generated grocery refresh preserves manual items, failed recipe image import cleans up uploaded asset, and canceled parsed recipe import cleans up uploaded asset.
- 2026-06-26: Read-only QA agents found no P0 source/config blockers. Their P1 items were converted into current proof requirements; semantic search, billing hard cutoff, Pantry, and dependency audit remain accepted deferrals.
- 2026-06-26: Local deploy controls confirmed. `.firebaserc` default project is `viomacro`; `firebase.json` includes Hosting, Firestore, Storage, and Functions, so deploy commands must use explicit `--only`; ignored web `.env` contains Firebase project config and `VITE_RECAPTCHA_SITE_KEY`; ignored Functions `.env` contains `OWNER_UIDS`.
- 2026-06-26: Reran readiness after restart and checkpoint commit. `npm.cmd run check`, `npm.cmd run qa:browser`, `npm.cmd run test:rules`, and `npm.cmd run test:e2e:emulator:data-loss` passed before the Pantry patch.
- 2026-06-26: Serialized Chrome smoke plus read-only subagent scouts found no P0/P1 launch blocker. The pass reverified real route content, Meal Planner prompt dismissal, and no blocking overlays. It found smaller active-looking Pantry prototype controls, which were converted to disabled/coming-soon affordances.
- 2026-06-26: After the Pantry honesty patch, `npm.cmd run build`, `npm.cmd run test:e2e:emulator` (53 tests), and `npm.cmd run test:e2e:prod-emulator` (3 tests) passed.
- 2026-06-26: Added `docs/qa/chrome-subagent-page-qa-playbook.md` and linked it from the North Star Compass, E2E QA guide, and app contract roadmap. Final `npm.cmd run check`, `git diff --check`, and diff secret-pattern scan passed before commit.
- 2026-06-27: Final bug checkpoint was verified, committed, and pushed. Verification included frontend lint/build, Functions lint/build, Functions contracts 19/19, direct Firestore rules 19/19, direct Storage rules 3/3, full emulator Playwright 59/59, and production-preview emulator smoke 3/3.
- 2026-06-27: Hosting-only deploy completed. `npx.cmd --yes firebase-tools deploy --only hosting --project viomacro` released the app to `https://viomacro.web.app` without deploying Functions, Firestore rules, Storage rules, or indexes.
- 2026-06-27: Live hosted signed-out smoke passed. `/auth` rendered expected auth controls, and protected routes redirected to `/auth` with no blocking page errors or unexpected console errors.
- 2026-06-27: Authenticated live smoke passed with reusable ignored test account `viomacro.live.qa.1782585650579@example.com`. The smoke authenticated, dismissed onboarding, verified all protected routes rendered, and completed a non-AI Grocery add/check/delete/reload cleanup cycle. No live AI actions were triggered.
- 2026-07-09: CMD-011 completed as a plan-only Release gate. Official Firebase docs and read-only CLI metadata confirmed the Hosting-only scope, current live version `ed0f58dc8bbc9796`, Console rollback path, and CLI version-clone rollback path. Manager independently reran `hosting:channel:list` and confirmed the same version/release metadata. No deploy, rollback, clone, production sign-in, production data mutation, or live AI occurred.
- 2026-07-09: CMD-013 fresh pre-deploy local regression passed against pushed checkpoint `541a7f2`. The exact `npm.cmd run qa:local` command passed outside the known restricted-sandbox Vite boundary: app and Functions checks passed, public E2E passed 18/18, authenticated emulator E2E passed 61/61, and production-build emulator E2E passed 4/4. Manager independently confirmed green Playwright result manifests. No deploy, production sign-in/mutation, live AI, or Firebase configuration change occurred.
- 2026-07-09: CMD-014 deployed checkpoint `541a7f2` with the exact approved `firebase deploy --only hosting` command. Post-deploy metadata identified live version `0d45e0cec1e830e8` and release `1783629623146000`; Manager independently confirmed the metadata and expected deploy message. Release and Manager signed-out smoke confirmed `/auth` private-alpha controls and protected `/plan` redirect. Known environment-dependent reCAPTCHA/App Check noise did not block behavior, no rollback was needed, and no authenticated production use, data mutation, live AI, other Firebase deploy, commit, or push occurred.
- 2026-07-10: CMD-026 completed the read-only Stage 5 live-safety preflight. Manager accepted six separate approval packets and added clean-worktree rollback, deployed-rules verification, and email-adapter requirements. The circuit breaker remains disabled/undeployed; no Git, deploy, cloud, production, email, or live-AI action occurred.
- 2026-07-10: CMD-028 checkpointed the accepted Stage 5 Web App baseline as `464d404` after a green unrestricted check, 62/62 mocked Functions contracts, staged-scope review, and secret hygiene. One push succeeded and local/upstream equality was confirmed; no deploy or cloud/live action occurred.
- 2026-07-10: CMD-029 captured read-only deployed Function metadata, confirmed the circuit-breaker flag absent and secret binding present without value access, and defined the exact seven-Function disabled target plus rollback source. Manager read-only Console evidence confirmed the deployed catch-all rules denial and accepted App Check posture for planning. No deploy, invocation, production-data access, log read, cloud mutation, Git mutation, or live AI occurred.
- 2026-07-10: CMD-030 used clean immutable `464d404` source, passed corrected lint/build and 62/62 mocked contracts, deployed exactly four existing plus three new approved Functions, and passed metadata-only proof. All seven are active with bounded scaling; the breaker flag remains absent, owner/secret bindings were preserved by metadata, and `billingBudgetMonitor` remained unchanged. Manager independently confirmed the live inventory. No invocation, production data, logs, live AI, rollback/deletion, commit, or push occurred.
- 2026-07-11: CMD-037 passed the unrestricted full check, mocked Functions contracts 62/62, and focused mocked AI Safety 5/5; committed exactly 13 accepted Web App files as `fe48d25`; pushed once; and finished with exact local/upstream equality. No deploy, production access, provider/configuration change, Function invocation, or live AI occurred.
- 2026-07-11: CMD-038 deployed Hosting-only version `db2ff99bfb34e9b1`, but immediate signed-out smoke found an emulator-mode Auth blocker because the prod-emulator suite had overwritten `dist/`. Both CLI rollback attempts failed before mutation. Manager used the pre-authorized Firebase Console rollback to restore `0d45e0cec1e830e8`; independent `/auth` and `/plan` smoke passed with no warning/error logs. The incident is recovered, the publication is rejected, and no Functions/provider/data/AI action occurred.
- 2026-07-11: CMD-039/CMD-040 closed BUG-030 locally. Bugfix and independent QA each passed prod-emulator 4/4 and public E2E 18/18; unrestricted full checks passed; five-file production path/byte/SHA-256 manifests stayed identical across the prod-emulator suite; ignored emulator output failed the verifier with all four marker classes; default `dist/` and final `build:hosting` passed clean. No cloud, production, provider, package, Git mutation, or live AI occurred.
- 2026-07-11: CMD-041 committed exactly the 11 accepted artifact-hardening and incident-closure files as `f9769ae fix: protect hosting artifacts from emulator builds`, pushed once, and ended with exact local/upstream equality and `0 0` divergence. Final `build:hosting` passed; no Actions workflow, deploy, cloud/provider, production, package, or live-AI action occurred.
- 2026-07-12: CMD-042 used a clean detached `f9769ae` worktree, passed unrestricted `check`, prod-emulator 4/4, public E2E 18/18, and final `build:hosting`, then deployed Hosting only as version `762e5b25bfb28e0c`. Release and Manager independently passed signed-out `/auth` and `/plan` smoke with the expected production assets and no captured warning/error logs. No rollback, Functions/rules/indexes/config/provider change, production sign-in/data/callable, Git mutation, or live AI occurred.
- 2026-07-12: CMD-043 completed the read-only native Gemini decision. Release and Manager independently confirmed Tier 1 Postpay, an available but unset experimental VioMacro project cap, the shared `$250` account cap, and current Google latency/overrun limits. Manager retained `$50` as the provider-cap candidate because `$20` would conflict with the accepted owner resume tranche. No setting, production path, Firebase resource, Git state, or live AI changed or ran.
- 2026-07-12: CMD-044 configured exactly the approved `$50` VioMacro Gemini project cap with one Save. Release verified persistence after navigation, and Manager independently confirmed `VioMacro`, Tier 1, `Edit spend cap`, and `$0.00 / $50.00`. No Gemini request, Function/callable, VioMacro Auth/data/log access, Firebase resource, other provider/account setting, deploy, or Git action changed or ran.
- 2026-07-12: CMD-045 returned `READY_FOR_EXPLICIT_ACTIVATION_APPROVAL`. Fresh sanitized metadata confirmed all eight Functions active, the exact seven breaker targets bounded and disabled, owner config present by name, expected secret version metadata, and separate unchanged `billingBudgetMonitor`. Manager independently confirmed immutable source parity, ignored env-file handling, exact flag semantics, `/ops` denial, and clean status behavior. No deploy, invocation, production-data/log access, configuration, Git, or Gemini action occurred.
- 2026-07-12: CMD-046 completed as `ACTIVATED_AND_STATUS_PROVEN` after one blocked-before-deploy attempt was cleaned and retried under explicit approval. The exact seven-Function true-flag deploy succeeded from immutable `464d404`; postdeploy and independent Manager metadata-only proof passed; exactly one owner status POST returned the clean `$20` active state; zero Gemini/provider requests occurred; and no rollback trigger fired. Temporary env copies were deleted and no commit/push occurred.

## Open Bugs And Deferrals

- `BUG-004`: Pantry remains deferred, but active-looking shortcut, quantity, edit, and pagination controls have been converted to honest disabled/coming-soon affordances.
- `BUG-009`: Semantic search live vector index remains deferred and not private-alpha blocking.
- `BUG-010`: Functions dependency audit moderate advisories remain accepted/deferred for private alpha.
- `BUG-012`: Plan prompt dismissal/navigation blocker was found during Chrome smoke and closed with automated regression proof.
- `BUG-013`: Dashboard Recharts container warning remains deferred as non-blocking visual/console cleanup.
- `BUG-025`: Hosting rollback procedure gap closed on 2026-07-09 after CMD-011 was accepted and this operational runbook was distilled.
- Pantry remains deferred/under development by user decision.
- `BUG-029`: closed locally on 2026-07-11 after CMD-035/CMD-036 corrected the production-neutral disabled copy and independently passed the focused mocked group 5/5.
- `BUG-030`: closed locally on 2026-07-11 after CMD-039/CMD-040 isolated prod-emulator output, added the fail-closed Hosting artifact guard, and independently passed manifest, red/green, E2E, and full-check proof.
- `BUG-031`: deferred release-tooling gap. Current CLI version-ID clone is unproven/unavailable; Firebase Console rollback is the current operational path.
- Project-wide billing unlink remains deferred. The AI-only `$20` allowance circuit breaker is active through CMD-046; custom pause email is deferred by user decision. The owner UI is published through CMD-042 and the native `$50` cap is configured through CMD-044. No Gemini canary has run; it remains optional and separately approval-gated.

## Next Action

CMD-042 remains the accepted healthy Hosting version `762e5b25bfb28e0c`; the `$50` native cap is configured; and CMD-046 has activated and proven the AI-only `$20` breaker. Do not repeat the consumed owner status call. No Gemini canary is required for this safety milestone; keep any canary, later deploy, production mutation, provider change, or authenticated production workflow separately approval-gated. The next product-roadmap lane is Stage 6 feature-promotion decisions.
