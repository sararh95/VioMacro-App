# Settings Page Contract

Date created: 2026-06-25
Status: Graduated for private alpha; AI Spend Safety UI is published and its seven-Function breaker is active; Stage 6 Settings persistence and Dashboard target-effects recertification passed under accepted CMD-049 with AI Safety interaction excluded

## Page

- Route: `/settings`
- Component: `src/features/settings/Settings.tsx`
- Launch tier: Critical
- Page job: Let a signed-in user manage profile display, nutrition targets, macro mode, hydration preferences, dietary tags, and allergies without losing changes or misleading the rest of the app.
- Entry point: App navigation `Settings`, onboarding/default profile follow-up, Meal Planner prompt to set profile, direct `/settings` route.
- Auth boundary: Protected route. Signed-out users should redirect to `/auth`.

## G11 label-association follow-up — VM-060

1. [x] Reproduce all three Exact Grams visible-label click failures at desktop/390px, distinguishing them from the already-present ARIA names.
2. [x] Add failing native-label/focus regressions and link labels to the existing ids without changing names, macro math, handlers or values.
3. [x] Verify exact targets save/reload and Discard restores saved values, preserving unrelated settings and existing plan data.
4. [x] Full gates, actual Chrome and both fresh reviews complete; merged PR #21 (3638798). Display Name remains VM-061/G27.

Native and saved-data controls pass at both widths, with existing ARIA names retained. Existing save behavior materializes default bottleSize500 in a fresh profile; other existing keys/reference plans are preserved. The desktop Discard frame and broader author gaps were completed; current CI and both fresh reviews passed, then PR #21 merged 2026-10-30. See G11 log for bounded diagnostic/data identity limits.

## CMD-018 AI Spend Safety Extension - 2026-07-09

This extension adds one owner-controlled operational workflow without redesigning the existing Settings page.

Required owner workflow:

1. Open an `AI Safety` Settings tab/section.
2. Load sanitized status only through the authenticated, App-Checked owner callable; never read `/ops/...` from the client or expose owner configuration.
3. Show loading, unavailable/unauthorized, disabled, active, approaching-limit, automatically paused, manually paused, and mutation-pending states honestly.
4. Show approved allowance, estimated spent, reserved, remaining, period, pricing version, and last pause time/reason.
5. Allow manual pause only while active.
6. Allow `Resume with another $20` only while paused, behind an in-app confirmation. A successful mutation must refresh server status before claiming completion.
7. Keep every control unavailable when status cannot be verified.

Client idempotency extension:

- Meal Plan generation, Recipe Import parsing, and semantic-search callables must send a fresh validated request ID per explicit logical user action.
- Firebase/internal retries of one callable invocation must reuse the same payload ID; a later explicit user action receives a new ID.
- Background recipe embedding continues to use its server event identity and needs no frontend request ID.

Data and safety boundary:

- Direct client access to `/ops/...` remains forbidden.
- The server remains authoritative for owner identity, allowance, spend, state, pricing, pause, and resume. The existing email-status response field remains compatibility-only and is not displayed.
- CMD-018 is local and mocked/emulator-only. It must not add email transport, stale-reservation recovery, deploy, activation, live Gemini, provider/billing/IAM/App Check changes, secrets, or production mutation.
- `BUG-026` closed locally through CMD-025, the disabled deploy completed in CMD-030, UI proof completed through CMD-033, `BUG-029` production-neutral disabled copy closed through CMD-036, CMD-042 published the owner surface, CMD-044 configured the native `$50` provider backstop, and CMD-046 activated exactly seven Functions. One owner status POST returned the clean `$20` active state with zero Gemini/provider traffic; the optional canary is deferred and does not block Stage 5 closure.

2026-07-11 scope correction:

- The user chose in-app-only pause notification for the current one-owner private alpha; custom outbound email is deferred.
- `CMD-032` removes provider-setup/delivery language from this page without changing the backend/service response contract or dormant server-only outbox.
- Automatically paused copy must state that AI calls are stopped while non-AI VioMacro workflows remain available.

CMD-032/CMD-033 result:

- The custom email/provider alert and status stat are removed; the backend compatibility field remains hidden and unchanged.
- Manager `check` passed and independent focused emulator QA passed 5/5 with mocked callables and zero provider/production execution.
- Desktop and 390x844 mobile paused-state screenshots show readable status/copy without email/provider language, clipping, or overlap in the captured area.
- The lower resume controls are below the screenshot frame, but the focused test successfully asserts and completes `Resume with another $20.00`; no product defect was opened.

CMD-035/CMD-036 result:

- Disabled copy is exactly `AI spend controls are currently disabled.` and no longer labels a production-capable build as local.
- The focused status badge locator is exact, and Builder plus independent QA each passed the five mocked AI Safety cases with clean shutdown.
- `BUG-029` is closed locally with no service/backend/config/provider change.

Verification target:

- Focused Playwright emulator tests prove all status/control states, mobile fit, owner-denied/unavailable behavior, confirmation/pending behavior, and request-ID payloads for all three client callable paths without live provider access.
- Functions unit/contracts prove any new sanitized status fields and preserve the 46 passing backend contracts.
- Full app `check`, focused Settings/AI Playwright, and relevant existing Recipe/Meal Planner regression slices pass before Manager review.

CMD-019 result:

- Accepted evidence: Functions contracts 50/50, unrestricted `check`, focused AI Safety 4/4, all three client request-ID paths, and existing macro/nutrition/save-failure/discard/profile Settings tests.
- Failed graduation gate: the full emulator suite finished 65/66 because the inactive AI Safety tab still mounted its panel and issued two aborted status calls (`BUG-027`).
- Responsive finding: the final Settings tab label clipped at 390x844 (`BUG-028`).
- CMD-020 must fix only those two defects and return targeted plus full local evidence before this extension can graduate.

CMD-020 returned Settings 7/7, AI Safety 5/5, full emulator 67/67, an unrestricted green `check`, and a clean 390x844 screenshot. CMD-021 independently accepted the corrected source/screenshot boundaries and repeated the full local emulator suite at 67/67.

## Task Checklist

1. [x] Define Settings page scope and current diagnosis.
   - Outcome: Contract identifies page job, route, data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `src/features/settings/Settings.tsx`, `src/services/userService.ts`, `src/app/providers/store.tsx`, `src/features/auth/OnboardingWizard.tsx`, Dashboard/Meal Planner settings usage, existing tests, QA ledger, and bug ledger.
   - Ledger target: Settings page contract.

2. [x] Run baseline Settings route smoke.
   - Outcome: A signed-in user reaches `/settings`, sees `Settings & Preferences`, and no unexpected console/App Check errors occur.
   - Verification target: Playwright emulator direct route smoke or targeted Settings route test.
   - Ledger target: QA ledger.

3. [x] Prove nutrition target save and reload persistence.
   - Outcome: User can change calorie target, macro mode/targets or split, dietary tags, allergies, phase, rate, weights, and bottle size; saved values persist after reload.
   - Verification target: Targeted Playwright emulator test plus source review for fields not covered by the test.
   - Ledger target: QA ledger.

4. [x] Prove app-wide target effects.
   - Outcome: Saved Settings targets are consumed by Dashboard and Meal Planner without stale or inconsistent values.
   - Verification target: Playwright emulator cross-page check: Settings save -> Dashboard target cards and/or Meal Planner empty plan targets reflect the saved values.
   - Ledger target: QA ledger; bug ledger if cross-page drift appears.

5. [x] Prove save failure recovery.
   - Outcome: If `updateUserSettings` fails, the user gets visible feedback and the page does not silently claim saved changes.
   - Verification target: Deterministic `updateUserSettings` failure hook plus Playwright emulator test.
   - Ledger target: QA ledger; bug ledger if implementation is needed.

6. [x] Prove discard behavior is honest.
   - Outcome: `Discard` actually restores local form values to the last saved/store values or is relabeled if it only hides the footer.
   - Verification target: Source review and Playwright emulator test.
   - Ledger target: QA ledger; bug ledger if misleading behavior remains.

7. [x] Prove profile tab behavior.
   - Outcome: Display name/avatar edits either persist through Firebase profile update or show user-visible failure recovery; unsaved changes are handled honestly.
   - Verification target: Source review plus targeted Playwright emulator test if practical.
   - Ledger target: QA ledger.

8. [x] Prove integrations tab is honest.
   - Outcome: Wearable integrations are clearly non-interactive / Coming Soon and do not look like connect buttons.
   - Verification target: Source review plus Playwright assertions if needed.
   - Ledger target: QA ledger.

9. [x] Validate settings data shape and defaults.
   - Outcome: Settings writes preserve existing settings where intended, default settings do not create misleading zeros, and optional fields are bounded enough for private alpha.
   - Verification target: Source review of `createDefaultUserSettings`, `updateUserSettings`, store optimistic merge, Firestore rules if relevant.
   - Ledger target: Settings contract; bug ledger if data-shape risk remains.

10. [x] Close Settings page contract.
   - Outcome: No open P0/P1 Settings blockers remain, known deferrals are recorded, and Dashboard/Meal Planner can trust Settings values.
   - Verification target: Grouped Settings Playwright emulator run plus lint/build if code changes occur.
   - Ledger target: QA ledger, bug ledger, and app contract roadmap.

11. [x] Graduate the AI Spend Safety Settings extension.
   - Outcome: AI status loading begins only after the AI Safety tab is active, all tab labels fit at 390x844, and prior Settings behavior stays green.
   - Verification target: CMD-020 targeted red/green tests and mobile screenshot, followed by a fully green `test:e2e:emulator` and independent QA review.
   - Ledger target: Settings contract, QA ledger, `BUG-027`, and `BUG-028`.

12. [x] Prove the production owner AI Safety status without Gemini.
   - Outcome: CMD-046 clicked AI Safety exactly once, observed exactly one `getAiSpendStatus` POST plus OPTIONS, and rendered `Active`, `$20.00` allowance, `$0.00` spent/reserved, `$19.00` remaining, `$1.00` reserve, expected pricing version, and no pause details.
   - Verification target: Release bounded network/UI proof plus independent Manager sanitized Function metadata only; Manager must not repeat the owner status call.
   - Ledger target: Settings contract, QA ledger, AI spend contract, and production readiness contract.

## Current Diagnosis

Proven:

- `/settings` exists and renders `Settings.tsx` with the visible heading `Settings & Preferences`.
- Route smoke coverage includes `/settings`.
- Existing Playwright coverage proves a user can toggle `Dairy Free`, click `Confirm Targets`, and hide the save footer.
- `updateUserSettings` has a deterministic dev-only failure hook.
- Store-level `updateSettings` optimistically updates settings and attempts rollback by reloading the original settings on failure.
- Dashboard reads `userSettings` for phase, targets, and bottle size.
- Meal Planner reads `userSettings` for empty plan creation and AI plan targets.
- Settings exact gram targets, bottle size, dietary/allergy choices, and profile display name now persist through reload in emulator proof.
- Dashboard fallback target cards now derive gram targets from Settings instead of displaying macro percentages with `g` units.
- Meal Planner empty plan creation uses saved Settings targets.
- Failed Settings saves alert the user and keep the draft available.
- `Discard` now restores the local draft to the last saved/store values.
- 2026-06-27 manual-audit regression batch repaired Settings input accessibility and persistence confidence:
  - all primary numeric/range controls have exact labels or ARIA names;
  - Custom Bottle Size is uniquely targetable by label and persists after save/reload;
  - Dietary tags, allergies, phase buttons, and macro mode buttons expose pressed state;
  - Save/Discard remains visible with status copy after changes, including small screens.

Assumed:

- Live production Auth provider profile behavior may vary, but the app now also persists profile display fields in user settings for reliable app-level display.

Broken or risky:

- Percentage macro mode can be saved when split total is not 100%; current UI warns with orange total text. This is acceptable for private alpha and can become stricter later.
- `createDefaultUserSettings` uses `dailyCalorieTarget: 0`, while the Settings UI presents fallback `2200`; current app behavior treats UI fallback as acceptable until onboarding/settings defaults are revisited.
- Firestore settings updates are owner-only but not deeply schema-validated in rules yet. This remains acceptable for private alpha and should be revisited in a future rules-hardening pass.

## Data And Permissions

Data read:

- Firebase Auth user profile: `displayName`, `photoURL`.
- User settings under `users/{uid}.settings`.

Data write:

- Settings via `updateSettings` -> `updateUserSettings`.
- Firebase Auth profile via `updateUserProfile`.

Auth boundary:

- Settings are private user-owned data.
- Cross-user settings reads/writes should remain denied by Firestore rules.

Rules or backend boundary:

- Settings write shape is governed primarily by client service and Firestore rules.
- No live AI/provider work belongs to this page contract.

## States

Initial/loading state:

- Settings depends on app-level initial data load. When settings are unavailable, the page falls back to local defaults in the form.

Save state:

- Sticky footer appears only when local changes are present.
- `Confirm Targets` shows `Saving...` while saving.

Error state:

- Store rollback exists for failed settings writes.
- Page-level save failures now alert the user, keep the draft open, and display recovery copy in the sticky footer.

Empty/default state:

- New users receive default settings from `createDefaultUserSettings`.
- UI applies fallbacks for weights, target calories, phase, macro split, macro targets, and bottle size.

Mobile expectation:

- Tabs, numeric inputs, slider controls, sticky footer, and save/discard actions should remain reachable without horizontal breakage.

## Risks And Non-Goals

- Do not redesign the Settings page during this contract.
- Do not build wearable integrations.
- Do not add new diet-coaching logic beyond making current target inputs reliable.
- Do not change onboarding unless Settings proof shows a shared settings/defaults bug.
- Do not solve live AI/Functions readiness here; Settings only supplies targets/preferences.

## Verification Plan

1. Run baseline `/settings` route smoke.
2. Prove nutrition target save and reload persistence.
3. Prove saved values affect Dashboard and Meal Planner.
4. Add visible save-failure recovery if needed and prove it.
5. Fix or relabel discard behavior and prove it.
6. Audit profile and integrations tabs for honest controls.
7. Classify defaults/data-shape risks.
8. Run grouped Settings proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-25.
- 2026-06-25 baseline route smoke passed through Playwright emulator `routes` run. The direct-launch test included `/settings` and no App Check warning failures.
- 2026-06-25 grouped Settings emulator proof passed: 5 tests.
- Grouped proof covered basic settings save, exact macro target persistence, direct Firestore settings document assertion, Dashboard target propagation, Meal Planner empty-plan target propagation, save failure recovery, discard reset, and profile display-name persistence after reload.
- 2026-06-27 reopened manual-audit findings `BUG-SETTINGS-001`, `BUG-SETTINGS-002`, and `A11Y-SETTINGS-001` were repaired and reverified.
- 2026-06-27 focused Settings emulator proof passed: 6 tests. Coverage includes exact labels for Settings numeric/range controls, visible Save/Discard after bottle-size edits, Dairy Free and Gluten Free `aria-pressed` state, bottle-size reload persistence, exact macro target reload persistence, save failure recovery, discard reset, profile persistence, and navigation shell Settings access.
- 2026-06-27 in-app browser proof confirmed `Custom Bottle Size (ml)` has exactly one accessible target, changing it to `582` shows Save/Discard, saving and reloading keeps the visible value at `582`, Gluten Free remains `aria-pressed=true`, percentage slider labels are present after switching modes, and console errors were empty.
- 2026-06-27 follow-up network limitation fix: raw CDP network inspection remained unavailable in the in-app browser runtime, so the Settings persistence test now includes a Playwright network-failure collector for the save/reload workflow. The focused Settings network-backed pair passed 2/2 and the full Settings slice passed 6/6.
- 2026-07-13 CMD-049 Stage 6 recertification passed exactly 5/5 focused emulator tests plus desktop and `390x844` in-app Browser proof. Exact Grams `160/210/70`, calculated `2110 kcal`, bottle size `650 ml`, Dairy Free, Peanuts, and the app-level profile display name survived reload; Discard restored the saved draft; Dashboard showed the correctly labeled target values and `+650ml`; and no AI, Functions, provider, production, HTTP error, console error, or App Check traffic was observed.
- `npm.cmd run lint`: passed on 2026-06-25.
- `npm.cmd run build`: passed on 2026-06-25. Non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.
- `npm.cmd run lint`: passed on 2026-06-27.
- `npm.cmd run build`: passed on 2026-06-27 after sandbox-elevated rerun. Existing non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.

## Open Bugs And Deferrals

Open bugs:

- None for current locally tested Settings workflows. BUG-027 and BUG-028 closed on 2026-07-10 after CMD-021 independent QA.

Deferred items:

- Wearable integrations remain future / Coming Soon.
- More advanced settings validation, health-specific guidance, and diet-coaching intelligence remain future product work.
- Stricter Firestore settings schema validation remains a future foundation hardening item.
- Enforcing percentage macro split totals at save time remains future polish; current UI warns when the total is not 100%.

Revisit trigger:

- Before Dashboard/Meal Planner target expansion, onboarding changes, settings rules hardening, or Hosting deploy.

## Next Action

Settings and its promised Dashboard target effects are locally graduated for the current private-alpha scope under accepted CMD-049. Continue with the Recipe certification slice instead of expanding Settings.
