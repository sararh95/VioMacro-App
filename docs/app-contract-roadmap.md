# VioMacro App Contract Roadmap

Date created: 2026-06-25
Status: Active overall task list

Use this as the manager-level task list for page-by-page and workflow-by-workflow stabilization. Each active item should be handled with the `webapp-contract-sprint` skill: create or update the contract, diagnose current state, build a numbered checklist, work one item at a time, verify, then update the QA ledger.

This retained roadmap and its linked contracts describe workflow status. Scope current work in its GitHub PR, record verification in docs/qa/qa-ledger.md and confirmed defects in docs/bug-ledger.md.

For Chrome plus subagent page QA, use `docs/qa/chrome-subagent-page-qa-playbook.md`. Use it as an evidence lane inside the current contract, not as a separate roadmap.

## Operating Rule

- One page or workflow at a time.
- Do not start implementation until that page or workflow has a contract and a numbered checklist.
- Mark roadmap items complete only after the owning contract is locally graduated or explicitly deferred.
- Put proof in `docs/qa/qa-ledger.md`.
- Put unresolved defects in `docs/bug-ledger.md`.
- Do not run a new Hosting deploy unless the launch-readiness/Release gate passes and the user explicitly approves the deploy.

## Overall Task List

1. [x] Firebase Foundation contract.
   - Contract: `docs/contracts/firebase-foundation-contract.md`
   - Status: Locally completed for current foundation scope.
   - Proof: Firestore rules, data-loss, functions contract, and build evidence are recorded in `docs/qa/qa-ledger.md`.

2. [x] Dashboard page contract.
   - Contract: `docs/contracts/pages/dashboard.md`
   - Status: Locally graduated for core emulator workflows.
   - Scope: Daily metrics, active-plan visibility, local date handling, Dashboard failure states.

3. [x] Meal Planner page contract.
   - Contract: `docs/contracts/pages/meal-planner.md`
   - Status: Locally graduated for page-owned emulator workflows.
   - Scope: Empty/manual plan creation, save/reload, edit/resave, non-week honesty, save/generation failure states, `Add to List` ownership split.

4. [x] Grocery / Shopping List page contract.
   - Contract: `docs/contracts/pages/grocery-shopping-list.md`
   - Status: Locally graduated for page-owned emulator workflows.
   - Scope: Manual item add/check/delete persistence, honest future controls, Meal Planner link, connected state, generated refresh safety, write-failure recovery.

5. [x] Meal Plan Recognition cross-page workflow.
   - Contract: `docs/contracts/meal-plan-recognition-workflow-contract.md`
   - Status: Locally graduated for cross-page emulator workflow.
   - Scope: Dashboard -> Meal Planner -> saved plan -> Dashboard reload recognition -> Grocery connected recognition.

6. [x] Recipe Library page contract.
   - Contract: `docs/contracts/pages/recipe-library.md`
   - Route: `/recipes`
   - Status: Locally graduated for page-owned emulator workflows.
   - Scope: recipe list loading, empty state, create recipe, edit/view details, guided cooking entry, search/filter chips, favorite/edit/delete/source states, semantic search fallback boundary, honest future controls.
   - Known linked risk: `BUG-009` semantic search live vector index gate remains deferred for live AI/Functions readiness.

7. [x] Recipe Import workflow contract.
   - Contract: `docs/contracts/recipe-import-workflow-contract.md`
   - Routes/surfaces: `/recipes/import`, `RecipeLibrary`, image/PDF/text parsing, Storage cleanup.
   - Status: Locally graduated for local upload/import lifecycle with mocked parser behavior.
   - Scope: route landing, unsupported file rejection, upload, parse failure cleanup, cancel cleanup, reviewable draft, imported draft save, model-neutral import copy.
   - Must not regress: `BUG-003` orphaned upload cleanup remains closed for the current upload-before-parse flow.

8. [x] Settings page contract.
   - Contract: `docs/contracts/pages/settings.md`
   - Route: `/settings`
   - Status: Stage 6 recertified under accepted CMD-049 on 2026-07-13. Exact focused Playwright passed 5/5 and desktop/mobile in-app Browser proof confirmed persistence plus Dashboard target effects without AI or production access.
   - Scope: user profile display, exact macro targets, save/reload persistence, save failure recovery, discard reset, Dashboard target propagation, Meal Planner target propagation, honest integrations.
   - Must not regress: onboarding defaults, Dashboard/Meal Planner target usage.

9. [x] Progress / History page contract.
   - Contract: `docs/contracts/pages/progress-history.md`
   - Route: `/progress`
   - Status: Locally graduated for page-owned emulator workflows.
   - Scope: history loading, empty state, plan history visibility, deterministic completion metrics, recent daily metric summary, no chart warnings/dead controls, failure/retry behavior.
   - Must not regress: Dashboard date-key fixes and weight/sleep history behavior.

10. [ ] Pantry page contract.
   - Contract to create: `docs/contracts/pages/pantry.md`
   - Route: `/pantry`
   - Suggested launch tier: Deferred / under development unless the user promotes it.
   - Current decision: User explicitly said not to create Pantry yet; keep deferred.
   - Scope to diagnose: honest Coming Soon states, quick-add/delete if kept live, disabled intelligence features, load timeout/retry, no fake pantry intelligence.
   - Known linked risk: `BUG-004` Pantry prototype controls still need full product decision.
   - Manager note: Keep Pantry modest until it is a real launch feature.

11. [x] Auth and onboarding workflow contract.
   - Contract: `docs/contracts/auth-onboarding-workflow-contract.md`
   - Routes/surfaces: `/auth`, protected route redirect, account creation, login, onboarding skip/setup.
   - Status: Stage 6 daily-use recertification graduated under accepted CMD-048 on 2026-07-12. Focused Playwright passed 7/7 and the desktop/mobile in-app Browser pass found no product defect.
   - Scope: email login/create account, onboarding skip persistence, delayed initialization race, onboarding finish persistence, local Google sign-in honesty, auth error messages, protected route behavior, sign out.
   - Must not regress: emulator auth smoke and default settings creation.

12. [x] Navigation shell and mobile layout contract.
   - Contract: `docs/contracts/navigation-shell-workflow-contract.md`
   - Routes/surfaces: `AppLayout`, sidebar, mobile menu, protected shell, notifications Coming Soon, profile/sign out.
   - Status: Stage 6 foundation recertification graduated under accepted CMD-048 on 2026-07-12 at desktop and `390x844` mobile.
   - Scope: every primary route reachable on desktop/mobile, active nav state, mobile Settings/profile access, desktop/mobile sign out, honest notifications, nested route titles, emulator-warning-safe mobile footer.

13. [x] AI and Functions launch-readiness contract.
   - Contract: `docs/contracts/ai-functions-readiness-contract.md`
   - Suggested launch tier: Critical before live AI use.
   - Status: Closed for private-alpha readiness. Local provider migration, callable proof, App Check acceptance, usage limits, and failure boundaries are complete; valid live AI provider smoke remains a later explicit approval gate.
   - Scope: callable contract tests, provider SDK/model IDs, emulator AI guard, live smoke plan, API key/config, App Check, rate/cost guardrails.
   - Known linked risks: `BUG-009` semantic search live vector index gate is deferred and not private-alpha blocking; `BUG-010` Functions production dependency audit gate is accepted/deferred for private-alpha.
   - Must not do yet: broad live AI testing without explicit approval.
   - Billing dependency: task 15 phase 1-3 is complete for alert-only monitoring; hard cutoff remains deferred.

14. [x] Production deploy readiness gate.
   - Contract/readiness doc to update: `docs/contracts/production-deploy-readiness-contract.md`
   - Suggested launch tier: Required before Hosting deploy.
   - Status: CMD-042 deployed the corrected private-alpha disabled-state build from immutable `f9769ae` to `https://viomacro.web.app` as version `762e5b25bfb28e0c` on 2026-07-12. Artifact-safe local gates, rollback capture, Hosting-only deployment, Release signed-out smoke, and independent Manager signed-out smoke passed. Authenticated production smoke was not rerun after this deploy.
   - Scope to diagnose: full local check, browser QA, bug ledger review, Firebase budget alert, environment variables, App Check/API restrictions, rollback command, production data mutation risk.
   - Must not include yet: authenticated live production mutation smoke without explicit user approval.

15. [x] Billing kill switch milestone.
   - Contract: `docs/contracts/billing-kill-switch-contract.md`
   - Suggested launch tier: Required before broader sharing or higher live AI usage.
   - Status: Complete for the one-owner private alpha. Alert-only monitoring remains deployed, custom email and project-wide billing unlink remain explicitly deferred, CMD-044 configured the `$50` native provider cap, and CMD-046 activated exactly seven AI-spend Functions from immutable `464d404`. Release and Manager metadata proof passed; exactly one owner status POST returned the clean `$20` active state with zero Gemini/provider requests.
   - Scope: budget email alerts, Pub/Sub budget notifications, alert-only monitor, Billing API permissions, graceful warnings, hard cutoff tradeoffs.
   - Current state: project-wide billing unlink/hard cutoff stays deferred; the AI-only `$20` circuit breaker is active and is the accepted Stage 5 protection. Any Gemini canary remains optional and separately approval-gated.

16. [x] Git hygiene and commit checkpoint.
   - Contract/checklist to create or use: `docs/contracts/git-checkpoint-contract.md`
   - Suggested launch tier: Required before deploy or major new feature work.
   - Status: CMD-028 established the disabled backend baseline at `464d404`; CMD-037 checkpointed in-app AI spend safety as `fe48d25`; CMD-041 checkpointed artifact hardening as `f9769ae`; and CMD-047 checkpointed the final nine Stage 5 documents as `c7df65f`. CMD-050 is the user-approved, Web App-only checkpoint for accepted Stage 6 Auth/Navigation and Settings/Dashboard certification docs. Manager independently confirms each completed scope and local/upstream equality.
   - Scope to diagnose: current dirty tree, app-only cleanup boundaries, generated docs, ignored env files, private repo safety, commit grouping.
   - Must not do automatically: commit or push without explicit user approval.

## Stage 6 Certification Order

1. Auth, Onboarding, protected routes, and Navigation foundation - graduated under accepted CMD-048.
2. Settings persistence and promised Dashboard target effects - graduated under accepted CMD-049.
3. Recipe Library, Recipe Import, details, and cooking flow without live AI - next after the approved documentation checkpoint.
4. Meal Planner daily-use workflows and promised recipe connections.
5. Grocery generation/manual preservation and reload safety.
6. Dashboard plus Progress tracking/history consistency.
7. Pantry current honest quick-add/delete behavior only.
8. Final connected daily-use journey across the graduated slices.

Each slice uses one in-app Browser Captain plus focused Playwright. Confirmed defects go through one bounded Bugfix batch before independent QA. Pantry expansion, semantic vector indexing, native-dialog polish, production-authenticated mutation, deploys, and live AI remain deferred or separately approval-gated.

## Recommended Next Contract

Do not create duplicate contracts. After CMD-050 preserves the accepted Stage 6 foundation, use the existing Recipe Library and Recipe Import contracts for the next local-only certification slice.

## Current Stop Point

Completed spine:

Firebase Foundation -> Dashboard -> Meal Planner -> Grocery / Shopping List -> Meal Plan Recognition workflow -> Recipe Library -> Recipe Import workflow -> Settings -> Progress / History -> Auth/Onboarding -> Navigation Shell.

Next sprint:

Stage 4 and Stage 5 are complete. CMD-042 published live version `762e5b25bfb28e0c` from immutable Hosting source `f9769ae`; CMD-044 configured the `$50` VioMacro native cap; CMD-046 activated the seven-Function `$20` AI-only breaker with one zero-Gemini owner status proof; and CMD-047 checkpointed the final Stage 5 documents as `c7df65f`. Project-wide billing unlink, custom email, Pantry expansion, semantic indexing, native-dialog polish, and Gemini canary remain deferred. Accepted CMD-048 graduated Auth/Onboarding/Navigation, and accepted CMD-049 graduated Settings persistence plus promised Dashboard target effects. CMD-050 is the approved economical documentation checkpoint before app-brain work or the next Recipe certification slice.
