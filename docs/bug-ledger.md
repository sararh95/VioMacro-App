# VioMacro Bug Ledger

## Folder migration note (2026-10-22)

Dated entries, exact allowlists, quoted excerpts, commit IDs, and path spellings below are historical evidence. Their source paths and line numbers may refer to the earlier Web App/ layout. Local clickable links now target retained files; this does not recertify old line numbers. Current locations are indexed in [docs/README.md](README.md).

This is the unresolved bug and risk board for the VioMacro web app.

Repository cleanup retired the former agent coordination and app-brain files. Paths and recommendations inside dated entries describe the checkout and workflow at that time; they are historical evidence. Current contributor guidance is AGENTS.md, the retained contracts and current PR scope.

Use this for bugs, launch blockers, deferred defects, broken workflows, misleading UI, reliability risks, and follow-up verification. Use `docs/qa/qa-ledger.md` for completed QA evidence and test runs.

## Workflow

Statuses:

- New
- Needs Repro
- Needs Evidence
- Immediate Fix
- Deep Investigation
- Regression Needed
- Verify
- Fix in PR
- Deferred
- Closed

Severity:

- P0 Incident: active outage, data loss, private data exposure, critical security, irreversible harm.
- P1 Stabilization: launch blocker, broken core workflow, high-frequency user failure, no acceptable workaround.
- P2 Important: user-visible bug with workaround or localized feature failure.
- P3 Deferred: cosmetic, rare, low-risk, uncertain value, or high fix cost.
- Security Override: any auth, permission, secret, upload, prompt-injection, or supply-chain issue.

Required fields:

- ID:
- Date opened:
- Status:
- Severity:
- Workflow/page:
- Expected:
- Actual:
- User impact:
- Evidence:
- Suspected area:
- Next action:
- Verification target:
- Revisit trigger:
- Date closed:

## Open Items

### B12/R11 (1.0 review) Unsaved plan changes disappear or replace meals silently

- ID: B12/R11 (1.0 review)
- Date opened: 2026-11-12
- Status: Fix in PR [#6](https://github.com/sararh95/VioMacro-App/pull/6)
- Severity: P1
- Workflow/page: Planner draft creation, editing, ticks, scratch and discard.
- Expected: Drafts and ticks survive reopening per user and week until confirm or discard. The phone shows unsaved actions, leaving warns, and starting from scratch asks before replacing meals.
- Actual: BASE keeps drafts only in memory and replaces meals without a question or discard action.
- User impact: A week of unsaved edits can disappear without warning.
- Evidence: BASE red failures, matching source-only control, passing reload/save-once, leave-warning, reopen and discard cases, four passing tab filters and opened phone/desktop pictures. See the [QA ledger](qa/qa-ledger.md#2026-11-12-viomacro-10-g9-b12-r11-r10-r12-plan-edits-are-kept).
- Suspected area: Store draft lifecycle and Planner dirty state, action placement and copied days.
- Next action: Coordinator review after latest-commit full CI proof.
- Verification target: Draft/tick reload retention, no pre-confirm plan write, one saved plan, visible actions, scratch Cancel, discard, old saved-tick behavior and full CI floors.
- Revisit trigger: PR #6 review.
- Date closed: Pending.

### R10 (1.0 review) Planner summaries use Monday alone

- ID: R10 (1.0 review)
- Date opened: 2026-11-12
- Status: Fix in PR [#6](https://github.com/sararh95/VioMacro-App/pull/6)
- Severity: P2
- Workflow/page: Planner macro cards and Plan Analysis.
- Expected: Both surfaces use the average of days with meals and state that basis.
- Actual: BASE reads days[0], ignoring edits on other days.
- User impact: The summaries describe only Monday while appearing to describe the week.
- Evidence: Two-day red/control `400 !== 600`, green unit proof and opened 600 kcal pictures at both widths. See the [QA ledger](qa/qa-ledger.md#2026-11-12-viomacro-10-g9-b12-r11-r10-r12-plan-edits-are-kept).
- Suspected area: Planner macro total calculation.
- Next action: Coordinator review after latest-commit full CI proof.
- Verification target: Two different populated days, empty-day exclusion, matching analysis basis and unchanged targets.
- Revisit trigger: PR #6 review.
- Date closed: Pending.

### R12 (1.0 review) Add Tea lists no snack recipes

- ID: R12 (1.0 review)
- Date opened: 2026-11-12
- Status: Fix in PR [#6](https://github.com/sararh95/VioMacro-App/pull/6)
- Severity: P2
- Workflow/page: Planner Tea slot recipe picker.
- Expected: Tea lists snack recipes through the existing slot mapping and remains a Tea plan slot.
- Actual: BASE passes tea as a recipe filter although tea is not a recipe type.
- User impact: The Tea slot appears unusable even with snack recipes available.
- Evidence: BASE and source-only control expected one snack and received zero; the fixed picker and selection pass, with both-width pictures. See the [QA ledger](qa/qa-ledger.md#2026-11-12-viomacro-10-g9-b12-r11-r10-r12-plan-edits-are-kept).
- Suspected area: Planner RecipePicker filter argument.
- Next action: Coordinator review after latest-commit full CI proof.
- Verification target: Tea shows snacks, selection fills Tea, other meal filters stay unchanged and AI remains paused.
- Revisit trigger: PR #6 review.
- Date closed: Pending.

### R5 (1.0 review) Recipe form discards unsaved typing

- ID: R5 (1.0 review)
- Date opened: 2026-11-11
- Status: Fix in PR [#4](https://github.com/sararh95/VioMacro-App/pull/4)
- Severity: P2
- Workflow/page: Recipes, new and edited recipe forms.
- Expected: Dirty backdrop taps preserve the form. Cancel and X ask before discarding. Clean forms close immediately.
- Actual: BASE close handlers discard the draft without checking changes.
- User impact: A stray tap loses typed recipe content.
- Evidence: Two BASE red cases, matching source-only control, green regressions and opened phone pictures. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g5-r5-r6-recipe-form-keeps-your-typing).
- Suspected area: RecipeForm initial snapshot and close handlers.
- Next action: Coordinator review after full public CI proof.
- Verification target: Backdrop preservation, native question text, Keep editing, discard, import cleanup and full CI floors.
- Revisit trigger: PR #4 review.
- Date closed: Pending.

### R6 (1.0 review) Recipe saves before its photo upload ends

- ID: R6 (1.0 review)
- Date opened: 2026-11-11
- Status: Fix in PR [#4](https://github.com/sararh95/VioMacro-App/pull/4)
- Severity: P2
- Workflow/page: Recipes, photo upload in the recipe form.
- Expected: Uploading... is visible and Save waits for completion or failure. Cancel remains usable.
- Actual: BASE upload has no pending state, so submission can capture an empty image URL.
- User impact: The saved recipe can omit the selected photo.
- Evidence: Held-upload BASE failure, matching source-only control, green saved-image regression and opened phone picture. Failure recovery and late completion preserve the next form. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g5-r5-r6-recipe-form-keeps-your-typing).
- Suspected area: RecipeForm upload state, submit guard and form-session version.
- Next action: Coordinator review after full public CI proof.
- Verification target: Disabled Save, visible status, saved image URL, failure recovery, usable Cancel and full CI floors.
- Revisit trigger: PR #4 review.
- Date closed: Pending.

### R7 (1.0 review) Page errors leave a blank screen

- ID: R7 (1.0 review)
- Date opened: 2026-11-11
- Status: Fix in PR [#3](https://github.com/sararh95/VioMacro-App/pull/3)
- Severity: P2
- Workflow/page: Routes and Dashboard weekly day cards.
- Expected: A page render or lazy-load error offers Reload. An invalid stored day date leaves the Dashboard and valid days usable.
- Actual: BASE has no route error boundary. DayCard throws while parsing a bad date, unmounting the page.
- User impact: A screen error leaves no visible recovery control; reloading is the workaround.
- Evidence: Two BASE browser failures, matching source-only control and two passing new cases. Dashboard/layout/navigation pass 14/16/8. Check passes 293 app and 125 Functions tests. Four opened phone pictures show both error fallbacks and the bad-date Dashboard; both Reload paths recover. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g6-r7-page-recovery).
- Suspected area: App route boundary and Dashboard DayCard date parsing.
- Next action: Coordinator review after full CI proof.
- Verification target: Both R7 browser cases, unchanged saved data, healthy navigation and CI floors.
- Revisit trigger: PR #3 review.
- Date closed: Pending.

### R8 (1.0 review, code part) Metric Auto-Update uses pound arithmetic

- ID: R8 (1.0 review, code part)
- Date opened: 2026-11-11
- Status: Fix in PR [#2](https://github.com/sararh95/VioMacro-App/pull/2)
- Severity: P2
- Workflow/page: Settings, Goals & Nutrition, Auto-Update.
- Expected: Equivalent weights produce equivalent calorie targets in either measurement unit, with existing imperial rounding and deficit thresholds preserved.
- Actual: BASE multiplies the entered weight by 14 without unit conversion. At the default deficit, 70 kg produces 730 kcal while rounded-equivalent 154 lb produces 1906 kcal.
- User impact: Metric users receive an incorrect calorie target; manual target entry is a workaround.
- Evidence: Red and source-only control reproduce both metric calculation failures. Four new unit cases pass; required browser filters pass 22/22/6; check passes 297 app and 125 Functions cases. Phone visual proof verifies 1911 kcal, Discard and save/reload. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g7-r8-weight-units).
- Suspected area: Settings Auto-Update maintenance calculation.
- Next action: Coordinator review after full public CI proof. The live stored-unit mismatch portion of R8 remains separately deferred.
- Verification target: Unit equivalence, all deficit boundaries, missing-weight guard, fractional-pound rounding and full CI floors.
- Revisit trigger: PR #2 review; stored-unit repair only with Sara's separate approval.
- Date closed: Pending.

### R4 (1.0 review, fix round 2) Final Settings confirmation is dropped

- ID: R4 (1.0 review, fix round 2)
- Date opened: 2026-11-11
- Status: Fix in PR [#1](https://github.com/sararh95/VioMacro-App/pull/1)
- Severity: P1
- Workflow/page: Settings, offline target confirmations.
- Expected: After confirming A, B and A offline, the server keeps the last confirmed A after reconnecting.
- Actual: The pre-round pending-snapshot Set drops final A because the first A is still pending. B remains the last server write.
- User impact: The saved target silently differs from the user's final confirmation.
- Evidence: Red and Settings-only control report Expected 2300, Received 2450. Both new browser cases pass, G4 passes 9, Settings passes 22 and check passes 293 app/125 Functions. Both phone pictures were opened. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g4-r4-fix-round-2-latest-settings-intent).
- Suspected area: Settings pending-submission comparison and completion cleanup.
- Next action: Coordinator review after full public CI proof.
- Verification target: A/B/A server state, responsive controls, late recipe rejection recovery and full CI floors.
- Revisit trigger: PR #1 fix-round review.
- Date closed: Pending.

### R4 (1.0 review, fix round 1) Pending saves block controls and lose newer drafts

- ID: R4 (1.0 review, fix round 1)
- Date opened: 2026-11-11
- Status: Fix in PR [#1](https://github.com/sararh95/VioMacro-App/pull/1)
- Severity: P1
- Workflow/page: Dashboard water, Settings and recipe/check-in/sleep forms.
- Expected: Offline controls stay usable, water totals update immediately, late save A preserves draft B, and each launcher opens a fresh form. A rejected save identifies its item and retains a recoverable payload.
- Actual: Pre-round source holds water and Settings state until acknowledgement, clears Settings dirty state unconditionally and hides mounted forms while parent open flags stay active.
- User impact: Offline saves block further input and can erase a newer Settings draft.
- Evidence: Four pre-round failures, matching source-only control and four passing new browser cases. Required filters pass 7/10/5/21/13/65. Check passes 293 app and 125 Functions cases. Five phone browser scenarios verify pictures, independent form sessions and failure recovery. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g4-r4-fix-round-1-responsive-saves).
- Suspected area: Water optimistic state, Settings draft comparisons and parent-owned modal sessions/recovery.
- Next action: Coordinator review after full public CI proof.
- Verification target: Four round regressions, four optimistic queue unit cases, original G4 cases, required feature filters and full CI floors.
- Revisit trigger: PR #1 fix-round review.
- Date closed: Pending.

### R4 (1.0 review) Untracked saves omit the pending warning

- ID: R4 (1.0 review)
- Date opened: 2026-11-11
- Status: Fix in PR [#1](https://github.com/sararh95/VioMacro-App/pull/1)
- Severity: P2
- Workflow/page: Recipes, Groceries, Dashboard, Settings, Onboarding and Pantry.
- Expected: Every listed save shows the existing pending note and leave warning while offline. Rapid grocery or pantry submissions create one item. Cancel remains usable and reconnection saves each record once.
- Actual: BASE awaits these writes without trackSave and has no synchronous add guard. Offline grocery and recipe saves omit the note. Double Enter creates two groceries.
- User impact: Unconfirmed saves can be lost when the page closes, and a rapid submission can create duplicates.
- Evidence: Three browser regressions fail on BASE and in the source-only control, then pass after the fix. Required filters pass 10/5/26/64/3/19/8. Check passes 289 app and 125 Functions tests. Nine opened phone pictures verify offline saves and reconnection. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g4-r4-pending-saves).
- Suspected area: Save handlers, grocery/pantry in-flight guards and shared pending-save tracking.
- Next action: Coordinator review after full CI proof. Review the existing notice overlap with route headings separately.
- Verification target: Three R4 browser regressions, pending-save unit cases, VM-054, required feature filters and full CI floors.
- Revisit trigger: PR #1 review.
- Date closed: Pending.

### R3 (1.0 review, fix round 1) Recipe recovery keeps a stale load error

- ID: R3 (1.0 review, fix round 1)
- Date opened: 2026-11-11
- Status: Fix in PR [#35](https://github.com/sararh95/VioMacro/pull/35)
- Severity: P2
- Workflow/page: Recipe Library load recovery.
- Expected: A successful read or save refresh clears the error. Deleting the created recipe returns to the real empty state. Confirmed recipes remain visible if a follow-up full read fails.
- Actual: Pre-round code retains loadError after save refresh and discards a nonempty confirmation snapshot if the next read fails.
- User impact: A recovered empty library shows a stale error, and a later failed read can hide already confirmed recipes.
- Evidence: New create/delete recovery test fails before the fix and in the RecipeLibrary.tsx control, then passes after the fix. G3 3, G-D 2, recipe 63 and check 286/125 pass. Two 390 px touch images were opened. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g3-r3-fix-round-1-recipe-recovery).
- Suspected area: RecipeLibrary.tsx successful list updates and confirmation fallback.
- Next action: Coordinator full local run and review under fix-round-1.txt.
- Verification target: Three G3 regressions, G-D pagination, recipe workflows and the coordinator's full-suite floors.
- Revisit trigger: PR #35 review.
- Date closed: Pending.

### R3 (1.0 review) Unconfirmed empty reads hide saved data

- ID: R3 (1.0 review)
- Date opened: 2026-11-10
- Status: Fix in PR [#35](https://github.com/sararh95/VioMacro/pull/35)
- Severity: P1
- Workflow/page: Meal Planner and Recipe Library.
- Expected: Loading stays visible until the week is checked. Confirm empty reads from the server. Failed reads offer Retry. Found cached records remain usable offline.
- Actual: BASE offers Create New Plan for an unread saved week offline and displays No recipes found for an unread offline library.
- User impact: Creating and confirming a plan from the false empty state can replace the saved week.
- Evidence: Both new emulator tests fail on BASE and with the three source fixes removed. Both pass after the fix, including Retry, cached offline remounts and unchanged plan data. Required filters pass and four final 390 px touch captures were opened. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g3-r3-honest-loading).
- Suspected area: MealPlanner.tsx week read and state cards, planService.ts opt-in empty confirmation, RecipeLibrary.tsx load state.
- Next action: Coordinator review and full CI verification.
- Verification target: R3 red/control/green, G-B, meal.planner.prompt, meal.planner.week.navigation, AUD-022, VM-054, data-loss, npm run check and CI floors.
- Revisit trigger: Coordinator review of PR #35.
- Date closed: Pending.

### R2 (1.0 review) Grocery ticks carry into another week

- ID: R2 (1.0 review)
- Date opened: 2026-11-10
- Status: Fix in PR [#34](https://github.com/sararh95/VioMacro/pull/34)
- Severity: P1
- Workflow/page: Meal Planner Add to List and Grocery List.
- Expected: Keep a tick only for matching ingredient identity in the same mealPlanId. Another plan and generated items without a plan start unticked.
- Actual: BASE copies ticks from every generated item with a matching ingredient key, across plans.
- User impact: The new shopping list marks unpurchased items as bought.
- Evidence: Two new unit cases and the fresh-account phone browser fail on BASE and with only the source fix removed. All three new unit cases and the browser pass after the fix. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g2-r2-grocery-ticks-per-week).
- Suspected area: replaceGeneratedGroceryItems in src/features/groceries/shoppingService.ts.
- Next action: Coordinator review of [PR #34](https://github.com/sararh95/VioMacro/pull/34).
- Verification target: Cross-plan and missing-plan ticks reset, same-plan ticks survive, manual items survive, and validation plus the 499-write atomic limit remain covered.
- Revisit trigger: Changes to generated grocery identity or refresh persistence.
- Date closed: Pending merge.

### R1 (1.0 review) Five controls are invisible on touch phones

- ID: R1 (1.0 review)
- Date opened: 2026-11-10
- Status: Fix in PR [#33](https://github.com/sararh95/VioMacro/pull/33)
- Severity: P1
- Workflow/page: Meal Planner, Grocery and Recipe Form at 390 px on a no-hover device.
- Expected: The meal tick, swap, snack tick, grocery delete and remove-photo controls are visible and tappable. The meal tick reveals on desktop hover and stays shown once eaten.
- Actual: All five controls compute to opacity 0 on a no-hover phone.
- User impact: Phone users cannot see how to perform these actions.
- Evidence: The BASE test reports `Expected: 1` and `Received: 0` on all five controls. The fixed test and desktop guard both pass. See the [QA ledger](qa/qa-ledger.md#2026-11-10-viomacro-10-g1-r1-touch-controls).
- Suspected area: The unconditional hide classes in `MealPlanner.tsx:1726,1767,1793`, `ShoppingList.tsx:242` and `RecipeForm.tsx:509`.
- Next action: Coordinator review of [PR #33](https://github.com/sararh95/VioMacro/pull/33).
- Verification target: Five phone controls at opacity 1, all tap effects, separate meal tap targets and the desktop hover guard.
- 2026-11-11 fix round 1: Coordinator pictures showed that the unticked snack circle still used 20%-alpha color and overlapped the drink icon. SnackCard now applies full secondary color and hides the drink on no-hover devices. Desktop and eaten styles retain their existing values.
- Round 1 proof: The extended phone test failed with circle alpha `0.2` and drink opacity `1` on `72e06ed`. It passes with the fix and fails identically with only the two SnackCard changes removed. The desktop snack guard passed throughout. Both 390 px touch and 1440 px pictures were opened. See the [QA ledger](qa/qa-ledger.md#2026-11-11-viomacro-10-g1-r1-snack-circle-fix-round-1).
- Revisit trigger: Changes to these controls or their hover styles.
- Date closed: Pending merge.

### VM-039 Mobile recipe ingredient names are squeezed out

- ID: VM-039
- Date opened: 2026-10-26
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P2
- Workflow/page: Recipe form Ingredients, 390x844
- Expected: Ingredient names remain readable and editable alongside quantity, unit and row actions.
- Actual: The name input measures about26px outer width; padding and borders consume its text area. Rice and Blueberries cannot be meaningfully read in the mobile row.
- Repro: At390x844, edit a recipe containing named ingredients and open Ingredients. Inspect the quantity/unit/name/actions row.
- Main comparison: Reviewer2 compared baseb2a705d and head37f700c: fixed quantity/unit widths, flex/min-w-0 name container and input padding are unchanged; new sr-only labels do not change those layout classes. Pre-existing attribution is source-backed; no separate main runtime control has been run. Reproduce on the G4 baseline before fixing.
- Evidence: [PR12 Reviewer2](https://github.com/sararh95/VioMacro/pull/12#issuecomment-6410082457); `_local/qa/fix-loop-2026-10-22/g2/reviewer2-37f700c/verified-mobile-ingredients.png`, `mobile-ingredients-labels.json`, `mobile-layout-base-head.txt`.
- Suspected area: `src/features/recipes/components/RecipeForm.tsx:627`, fixed-width ingredient row.
- Assigned group: G4 responsive layout; nonblocking for G2 persistence/labels under Sara's updated review criteria.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target: Ingredient names and row actions usable at390px, including alternatives/dynamic rows; preserve desktop layout.
- Revisit trigger: G4 or changes to ingredient row widths.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-038 Recipe form instruction count clips at 390px

- ID: VM-038
- Date opened: 2026-10-25
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P3
- Workflow/page: Recipe form, 390x844
- Expected: Details, Ingredients and Instructions tabs and counts fit inside the modal.
- Actual: The Instructions count badge is partly clipped at the right edge. The tab remains operable.
- Repro: Edit a recipe with two ingredients and three instruction steps at 390x844; inspect the three-tab row.
- Main behavior: Same clipping in the retained unfixed-main b2a705d red-test screenshot; the unfixed RecipeForm hash matches red-2 and normalized source matches the main blob. Current screenshot shows the same edge. No G2 layout class change.
- Evidence: `_codex-trash/2026-10-25/g2-green-1/_local/qa/test-results/emulator/emulator-auth-emulator-aut-79fbe-namic-field-labels-at-390px-chromium-emulator/test-failed-1.png`; `_local/qa/fix-loop-2026-10-22/g2/final-chrome/phone-decimals.png`; `g2/final-chrome-proof.json`.
- Suspected area: `src/features/recipes/components/RecipeForm.tsx:235,249-276`, fixed tab padding inside an overflow-hidden modal.
- Assigned group: G4 layout follow-ups. Pre-existing P3; outside G2 field persistence/labels and nonblocking under Sara's review rule.
- Verification target: Phone tab/count bounds and operability with multiple ingredients/steps; preserve desktop layout.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-037 Equivalent package placement uses different grocery identities

- ID: VM-037
- Date opened: 2026-10-25
- Status: Closed ([#18](https://github.com/sararh95/VioMacro/pull/18), merged21a7905e46d054c9bd5eae310039b743bd01212c)
- Severity: P3 (Sara's classification, 2026-10-25)
- Workflow/page: Meal Planner Add to List / Grocery aggregation and checked-state matching
- Expected: `1 (14 oz) can` and `1 can (14 oz)` describe the same package identity. Combine their counts before final rounding and retain an equivalent checked package; keep different package sizes separate.
- Actual: Prefix/suffix package units have different keys. A checked prefix-package row refreshed using the suffix spelling becomes unchecked. A four-serving recipe with one can in each spelling, planned for one portion, produces two one-can rows instead of one combined one-can row.
- Main comparison: Both unchanged main `dd5f6fb` and PR source `6432916` lose the checked state and produce two rows totaling two cans for these inputs. Main's two source files are byte-verified against Git. Unit strings differ only in singular/plural normalization; the identity/checked/count defect already exists on main.
- User impact: Duplicate package rows and avoidable extra purchase/checking for equivalent wording. This edge case is outside the bugs PR11 claims to close under Sara's updated scope.
- Evidence: [PR11 Reviewer1 finding](https://github.com/sararh95/VioMacro/pull/11#issuecomment-6366830313); `_local/qa/fix-loop-2026-10-22/g1/resume-2026-10-25/package-main-comparison.{mjs,json,log}` exercises actual generator/persistence services with only Firebase I/O and recipe reads mocked. Earlier independent parent/reviewer probes are retained under attempt-4.
- Suspected area: `src/shared/ingredients.ts:125-134` (normalization and identity); aggregation and shopping checked matching consume the same key.
- Next action: Retain G8 regressions/evidence; no further G1 or G8 code attempt needed.
- Verification target: Prefix/suffix legacy and structured forms share one final count; cross-placement checked state and reload survive; different package sizes stay distinct; original recipe wording remains.
- G8 proof: actual unfixedChrome all6cases desktop390 (`g8/unfixed-chrome-35d2e2a/`); unitRED61PASS11expectedFAIL then72PASS; realE2ERED4expectedFAIL then4PASS. Shared key-only fix; full check224/125, public18, fresh147+infra4, built4 PASS. Author actualChrome all6cases1440/390/readbacks/reloads/wording/core4 PASS; fresh R1 source-only negatives/restored72/4 and R2 owncheck224/125/Chrome12generations+reloads/29saved assertions pass. CI40560640681green, both exactc7fc08a APPROVE6451241737/6452056002. Tree/two-parent/ancestry verified onmain21a7905; full audit limits/verdicts in runninglog. Reobserved favicon noise remains VM041/G23, not a G8 fix.
- Revisit trigger: Changes to shared ingredient identity after verified G8 closure.
- Date closed: 2026-10-27

## 2026-10-22 Fix-loop observations — need further evidence

### VM-035 Intermittent local hard-load timeout

- Date opened: 2026-10-22
- Status: Open (G16 final follow-up; G6 found browser-side queuing, root cause still unproved)
- Severity: P2
- Workflow/page: Repeated local Chrome hard loads of Dashboard/Recipes/Planner/Grocery
- Actual: One hard load waited for settings/plan/groceries until the existing 10-second timeout; the app showed Retry Saved Data. Clicking Retry recovered. Authenticated SDK readback remained available. Local demo emulators only.
- Expected: Healthy local services load saved data reliably, or show a recoverable error for a demonstrated service failure.
- Evidence: G0 Chrome console captured settings/plan/grocery timeout and Firestore backend timeout at 2026-10-22T20:38:27Z. Source timeout guard: `src/app/providers/store.tsx:40-45`. G0 source changes do not affect this initial-load path.
- Additional evidence (G1 attempt4): aligned viomacro candidate full run1 hit the same global saved-settings guard at Recipes, not an ingredient assertion; screenshot/context retained in the rerun-2 recoverable artifact archive. The unchanged direct-launch test passes25.7s in full rerun2. Store/userService/App Git blobs equal main DD (attempt-4/unchanged-settings-loader.json). First run remains a failed gate, not silently accepted as a main exception; full unchanged rerun2 finishes80pass/4known-main AI failures with no additional failed titles.
- Next action: G6 should distinguish emulator/Chrome connection pressure from a reproducible application defect, prove the same behavior on main, and retain the existing recovery guard. Do not relax timeout assertions to hide a real failure.

- G6 evidence: Reproduced390px phone Planner10s timeout on unchanged App/store source; raw CDP requests queued6.8–9.6s beforeDNS, then200responses in milliseconds. Same-profile SDK99ms; Retry and latercold582.8ms recovered. No injected delays/Fetch/AI. Eight separate settled core-page windows clean. Source unchanged versus main; no claimed G6 fix. Evidence `g6/unfixed-browser/report.md`/stalled-network-timing.json. Preserveguard; separate follow-up because an application root cause has not been established.
- G9 additional evidence: fresh [PR19 Reviewer2](https://github.com/sararh95/VioMacro/pull/19#issuecomment-6456047874) retained two local startup delays and normal Retry Saved Data recoveries, readonlydata preserved. First FirestorebatchGet/Listen200~32s versus Auth200~20ms; root samePIDs/services responsive withoutrestart. Classified P2 observation/nonblocking, source-only immutable21a7905 comparison of unchanged auth/store/data paths, no mainruntime build proof. Own timeout/recovery captures and fresh eight complete bounded routewindows under g9/reviewer2-369be12; root delay-health receipt separate. Keep G16/guard/root-cause investigation; no G9 fix or new duplicate ID.

- G13 additional evidence: [PR22 Reviewer2](https://github.com/sararh95/VioMacro/pull/22#issuecomment-6530740833) recorded P2 temporary settings/plan/grocery unavailability during rapid route churn, recovered by one normal reload. Same-PID HTTP responses~0.109s and authenticated own SDK0.594s/data exact; subsequent six settled core windows/two Planner sequence windows/recovery window complete and clean. Current actual-main runtime comparison remains unknown; auth/store logging paths have source parity and no G13 attribution. Keep existing G16 investigation/guard; do not infer a new G13 fix. Evidence `g13/reviewer2-aa70c8f/gap-diagnostics.json`, `core-windows.json`, `reviewer2-authenticated-rpc-health.json`.

### VM-036 Recipe filter labels appear to overlap at 390px

- Date opened: 2026-10-22
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P2 (confirmed G4 layout/operability evidence)
- Workflow/page: Recipes, phone filter row
- Actual: Settled Chrome screenshot at 390x844 shows the Carbs and High Protein text visually crossing near the horizontal filter row. A DOM bounds/scroll probe was not completed before the review safety stop; this is not yet a confirmed root cause.
- Evidence: g4/unfixed/desktop-recipes-filters and phone-recipes-filters screenshot/JSON: parent176.875px, children244.34375px overlap following chip51.46875px, source106303a.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

## 2026-10-22 Bug Hunt — P0 Stop

Audited base: `a4d0bc7`. Stage 1 stopped for VM-028 before fixes. See [investigation and test plans](qa/bug-hunt-2026-10-22.md). Existing BUG IDs and history remain intact; VM IDs preserve Sara's supplied audit identifiers. Evidence filenames below are under `_local/qa/bug-hunt-2026-10-22/` unless described as scout/source probes. Short source paths resolve through the investigation report. No new issue is closed. `Immediate Fix` records priority, not permission to bypass the P0 stop.

### VM-001 Grocery quantities ignore recipe servings

- ID: VM-001
- Date opened: 2026-10-22
- Status: Closed ([#11](https://github.com/sararh95/VioMacro/pull/11), merge `b2a705d9adb80676e92f84a4cb0439d7118441d2`)
- Severity: P1
- Workflow/page: Grocery / planner
- Expected: Five single-serving meals from a four-serving recipe should use 30 oz chicken and 2.5 cups rice.
- Actual: Chrome Add to List produced 120 oz and 10 cups; Firestore confirmed both.
- User impact: Grocery quantities ignore recipe servings.
- Evidence: grocery-generated.txt; grocery-generated.jpg; recipe-after-save.json
- Suspected area: shopping-generator.ts:106-126
- Classification: A: shared ingredient parsing, serving scale and aggregation.
- Next action: Preserve the merged G1 regressions; equivalent package placement is separately Open/P3 VM-037 in G8.
- Verification target: Unit aggregation plus emulator five-meal/reload test.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-25 (merged; no deployment)

### VM-002 Recipe save resets instruction timers

- ID: VM-002
- Date opened: 2026-10-22
- Status: Closed ([PR12](https://github.com/sararh95/VioMacro/pull/12), merged2026-10-26; no deployment)
- Severity: P1
- Workflow/page: Recipes
- Expected: An unchanged save preserves step timers and other untouched fields.
- Actual: Chrome no-change save changed timer 120 to 0 in Firestore.
- User impact: Recipe save resets instruction timers.
- Evidence: recipe-form-fields.json; recipe-after-save.json
- Suspected area: RecipeForm.tsx:191; recipeService.ts:120
- Classification: B: lossy serialization of rewritten fields; updateDoc preserves omitted top-level fields.
- Next action: Preserve the proven-red/green regressions and saved desktop390 evidence; any release remains separately gated.
- Verification target: Roundtrip emulator test comparing every recipe field, plus cooking timer test.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-26 — merge b6975942fbfb8c7f9b838496d75c3e17cc83a5ac

### VM-003 AI meal-plan request forwards oversized documents

- ID: VM-003
- Date opened: 2026-10-22
- Status: Closed
- PR: [#15](https://github.com/sararh95/VioMacro/pull/15)
- Severity: P2
- Workflow/page: AI meal plan (paused)
- Expected: Only bounded recipe summaries including IDs reach the callable.
- Actual: Mocked actual client forwards embeddings/assets/instructions. Four 1536-dimensional recipe embeddings produced 123624 JSON characters and actual handler rejected the 120000 cap before provider invocation.
- User impact: AI meal-plan request forwards oversized documents.
- Evidence: Original scout plus current failing-first unit/handler tests, actual mocked Chrome reproductions and desktop390 consumer proof under `_local/qa/fix-loop-2026-10-22/g5/`; see final-gates-proof.json and fixed/parent-proof-index.json.
- Suspected area: src/services/aiService.ts:40-43; MealPlanner.tsx:423; functions/src/index.ts:579
- Classification: C: incomplete bounded request/response contract.
- Next action: Preserve the merged mocked-contract and desktop390 evidence. AI remains paused; runtime availability/deployment stay separately gated.
- Verification target: Capture client payload and test summary projection; retain server oversized-payload rejection.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27 — mergea8dc25b0eec879bcc0cf9b11fccc00d89d17c318

### VM-004 AI plan omits recipe IDs and ignores snack preference

- ID: VM-004
- Date opened: 2026-10-22
- Status: Closed
- PR: [#15](https://github.com/sararh95/VioMacro/pull/15)
- Severity: P2
- Workflow/page: AI meal plan (paused)
- Expected: Response IDs refer to supplied recipes; includeSnacks=false excludes snacks.
- Actual: Mocked handler accepted unknown-recipe and a snack with includeSnacks=false; prompt omitted the sole input ID.
- User impact: AI plan omits recipe IDs and ignores snack preference.
- Evidence: Original scout plus current actual-handler reference/snack tests, actual mocked Chrome refusals and Planner save/reload/detail/Grocery integration under `_local/qa/fix-loop-2026-10-22/g5/`; all provider calls mocked.
- Suspected area: functions/src/promptSafety.ts:73-75,110; functions/src/index.ts:530-533,608-625,671-679
- Classification: C: request context/schema/semantic validation missing.
- Next action: Preserve the merged mocked-contract and desktop390 evidence. AI remains paused; runtime availability/deployment stay separately gated.
- Verification target: Mocked valid/unknown/missing ID and snack on/off tests, then saved-plan grocery integration.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27 — mergea8dc25b0eec879bcc0cf9b11fccc00d89d17c318

### VM-006 Legacy text amounts display undefined

- ID: VM-006
- Date opened: 2026-10-22
- Status: Closed ([#11](https://github.com/sararh95/VioMacro/pull/11), merge `b2a705d9adb80676e92f84a4cb0439d7118441d2`)
- Severity: P2
- Workflow/page: Recipe detail
- Expected: Legacy and structured quantities display and scale correctly.
- Actual: Chrome rendered undefined Blueberries at four and five servings.
- User impact: Legacy text amounts display undefined.
- Evidence: recipe-legacy.jpg; recipe-legacy-scaled.txt
- Suspected area: RecipeDetail.tsx:24-37
- Classification: A: legacy/structured ingredient model mismatch; Guided Cooking has the opposite mismatch (VM-031).
- Next action: Preserve the merged G1 regressions; equivalent package placement is separately Open/P3 VM-037 in G8.
- Verification target: Unit normalize/scale cases plus legacy browser detail at two serving counts.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-25 (merged; no deployment)

### VM-007 Quantity formatting fails to carry rounded fractions

- ID: VM-007
- Date opened: 2026-10-22
- Status: Closed ([#11](https://github.com/sararh95/VioMacro/pull/11), merge `b2a705d9adb80676e92f84a4cb0439d7118441d2`)
- Severity: P2
- Workflow/page: Recipe detail
- Expected: Scaled quantity has one valid numeric representation.
- Actual: 1.31 cups for four servings, increased to six, displayed 1 1 cups Carry Flour in Chrome. Pure probes also show 1.96 -> 1 1.
- User impact: Quantity formatting fails to carry rounded fractions.
- Evidence: recipe-rounding.txt; recipe-rounding.jpg
- Suspected area: src/shared/format-quantity.ts:28-32
- Classification: A: independent fractional rounding and concatenation.
- Next action: Preserve the merged G1 regressions; equivalent package placement is separately Open/P3 VM-037 in G8.
- Verification target: Unit boundary/decimal tests and six-serving detail regression.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-25 (merged; no deployment)

### VM-008 Mixed fractions and ranges are misparsed

- ID: VM-008
- Date opened: 2026-10-22
- Status: Closed ([#11](https://github.com/sararh95/VioMacro/pull/11), merge `b2a705d9adb80676e92f84a4cb0439d7118441d2`)
- Severity: P2
- Workflow/page: Grocery
- Expected: Amounts retain their numeric/text meaning and scale appropriately.
- Actual: Chrome generated 10 -3 cloves for five meals containing 2-3 cloves. Pure probes: 1 1/2 cups -> 1 plus unit 1/2 cups; half-symbol cup -> 1 plus text unit; structured 1/2 parsed as 1.
- User impact: Mixed fractions and ranges are misparsed.
- Evidence: grocery-generated.txt; grocery-generated.jpg
- Suspected area: shopping-generator.ts:24-45,112
- Classification: A: incompatible legacy and structured parsers.
- Next action: Preserve the merged G1 regressions; equivalent package placement is separately Open/P3 VM-037 in G8.
- G1 round3 blocker: https://github.com/sararh95/VioMacro/pull/11#issuecomment-6361284970; src/shared/ingredients.ts:134 recognized parenthetical plural cans only. Legacy 1 (14 oz) can at yield4/planned5 wrote1.25 instead of2. Parent and reviewer actual-generator probes confirmed. Sara authorized extra attempt4; package-aware normalization/countability and new regressions now pass focused, full-check and Chrome gates. Full emulator rerun has only the same four paused-AI failures as corrected main and CI passes. Fresh Reviewer1 found a remaining cross-placement identity gap at lines127/131: equivalent prefix/suffix package units split aggregation and lose checked state. Parent actual-service probe confirms; extra-attempt cap reached, no further source fix authorized.
- Verification target: Mixed/simple/Unicode fractions, ranges and qualitative amount tests; do not invent precision.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-25 (merged; no deployment)

### VM-010 Fresh checkout cannot start the emulator harness

- ID: VM-010
- Date opened: 2026-10-22
- Status: Closed ([#16](https://github.com/sararh95/VioMacro/pull/16), merge `35c518565a490b55e20872cf6172365d4df4606f`)
- Severity: P2
- Workflow/page: Developer QA
- Expected: Documented emulator command can bootstrap synthetic data without an ignored preexisting export.
- Actual: npm.cmd run emulator exited 1 with No usable Firebase emulator export found before spawning Firebase.
- User impact: Fresh checkout cannot start the emulator harness.
- Evidence: emulator-bootstrap.log
- Suspected area: scripts/firebase-emulator.mjs:66-70,89
- Classification: F1: nonportable fixture bootstrap; older BUG-020 covered finding existing exports only.
- Next action: Finish final-current-source gates and Chrome, then PR and independent reviews; no deploy.
- Verification target: Fresh-root wrapper invocation and deterministic synthetic account bootstrap; full emulator suite.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- G6 evidence: `_local/qa/fix-loop-2026-10-22/g6/test-first-main.log` (unchanged source7FAIL/1controlPASS), current13unitPASS and required infrastructure4PASS; fresh emulator131PASS and built-emulator4PASS. Exact later/current-source receipts in the fix-loop log. Shared namespace/ports, UTF8 ignore and fresh bootstrap verified; PR16 open; merge/review gates pending.

- G6 closure: exact-head570db88 CIgreen, both fresh reviewers APPROVE, localcheck190/125/public18/fresh131/built4 and parent+independentChrome verified. Merge tree/ancestry and remote/local branch cleanup confirmed; receipts in g6/merge-receipt-2026-10-27.json. CI retained one unrelated existing count-readiness retry as VM049/G17, no hidden first-attempt claim.

### VM-011 Aisle classification matches substrings

- ID: VM-011
- Date opened: 2026-10-22
- Status: Closed ([#11](https://github.com/sararh95/VioMacro/pull/11), merge `b2a705d9adb80676e92f84a4cb0439d7118441d2`)
- Severity: P3
- Workflow/page: Grocery
- Expected: Eggplant is Produce and black pepper is Pantry/spices.
- Actual: Chrome grouped eggplant in Proteins and black pepper in Produce.
- User impact: Aisle classification matches substrings.
- Evidence: grocery-generated.txt; grocery-generated.jpg
- Suspected area: shopping-generator.ts:7-10,133; ShoppingList.tsx:49
- Classification: Standalone classification defect adjacent to A; shared by generated and quick-add groceries.
- Next action: Preserve the merged G1 regressions; equivalent package placement is separately Open/P3 VM-037 in G8.
- Verification target: Token/phrase aisle tests and browser grouping.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-25 (merged; no deployment)

### VM-013 Empty quick-add silently does nothing

- ID: VM-013
- Date opened: 2026-10-22
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P3
- Workflow/page: Grocery / Pantry
- Expected: Empty and whitespace input gets clear local validation and no write.
- Actual: Chrome empty Add grocery item and Process Items leave the page unchanged without feedback.
- User impact: Empty quick-add silently does nothing.
- Evidence: grocery-before.txt; pantry-empty-add.txt; pantry-empty-add.jpg
- Suspected area: ShoppingList.tsx:28,184,188; Pantry.tsx:70,82,374
- Classification: E: independently implemented missing validation feedback.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target: Empty/whitespace then valid-input E2E for both pages; preserve Pantry Coming Soon scope.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-014 Icon controls lack meaningful accessible names

- ID: VM-014
- Date opened: 2026-10-22
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P3
- Workflow/page: Planner and shared interaction surfaces
- Expected: Action names describe their purpose to assistive technology.
- Actual: Chrome exposes tune, autorenew and auto_fix_high rather than meaningful Preferences, Swap and Magic Suggest names.
- User impact: Icon controls lack meaningful accessible names.
- Evidence: planner-desktop.txt
- Suspected area: MealPlanner.tsx:1101-1106,1556-1561,1749-1754
- Classification: E: repeated ad hoc icon labeling; related callers listed in report.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target: Role/name and keyboard/touch assertions for every included active icon action.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-015 Recipe labels are not linked to inputs

- ID: VM-015
- Date opened: 2026-10-22
- Status: Closed ([PR12](https://github.com/sararh95/VioMacro/pull/12), merged2026-10-26; no deployment)
- Severity: P3
- Workflow/page: Recipe form
- Expected: Visible labels programmatically identify their controls.
- Actual: Chrome DOM probe finds zero associated labels on recipe name, all ten number inputs and image URL; source has no htmlFor.
- User impact: Recipe labels are not linked to inputs.
- Evidence: recipe-form-fields.json; recipe-form-preview.jpg
- Suspected area: RecipeForm.tsx:270,305,346,563,574,588,674
- Classification: Standalone accessibility defect suitable for B.
- Next action: Preserve the proven-red/green regressions and saved desktop390 evidence; any release remains separately gated.
- Verification target: getByLabel tests across Details, Ingredients and Instructions tabs.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-26 — merge b6975942fbfb8c7f9b838496d75c3e17cc83a5ac

### VM-016 Recipe save truncates decimals and changes valid zero

- ID: VM-016
- Date opened: 2026-10-22
- Status: Closed ([PR12](https://github.com/sararh95/VioMacro/pull/12), merged2026-10-26; no deployment)
- Severity: P3
- Workflow/page: Recipe form
- Expected: Valid decimals and zero survive a no-change save.
- Actual: Chrome save and Firestore: cookTime 0->30; protein 12.5->12, carbs 1.4->1, fat .8->0; micronutrients also truncated.
- User impact: Recipe save truncates decimals and changes valid zero.
- Evidence: recipe-form-fields.json; recipe-after-save.json
- Suspected area: RecipeForm.tsx:162-172
- Classification: B: parseInt and truthiness defaults corrupt valid numeric values.
- Next action: Preserve the proven-red/green regressions and saved desktop390 evidence; any release remains separately gated.
- Verification target: Unchanged-save precision/zero tests, invalid-number cases, actual form submission.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-26 — merge b6975942fbfb8c7f9b838496d75c3e17cc83a5ac

### VM-020 Functions ignore file uses UTF-16

- ID: VM-020
- Date opened: 2026-10-22
- Status: Closed ([#16](https://github.com/sararh95/VioMacro/pull/16), merge `35c518565a490b55e20872cf6172365d4df4606f`)
- Severity: P3
- Workflow/page: Developer tooling
- Expected: Git reads the intended ignore patterns.
- Actual: Read-only byte probe found FF FE and NUL-interleaved UTF-16LE. Root ignore still excludes .secret.local; no secret exposure demonstrated.
- User impact: Functions ignore file uses UTF-16.
- Evidence: Read-only scout byte inspection and git check-ignore; report.
- Suspected area: functions/.gitignore:1
- Classification: F2: standalone text encoding defect.
- Next action: Finish final-current-source gates and Chrome, then PR and independent reviews; no deploy.
- Verification target: UTF-8/no-NUL and isolated Git ignore behavior checks.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- G6 evidence: `_local/qa/fix-loop-2026-10-22/g6/test-first-main.log` (unchanged source7FAIL/1controlPASS), current13unitPASS and required infrastructure4PASS; fresh emulator131PASS and built-emulator4PASS. Exact later/current-source receipts in the fix-loop log. Shared namespace/ports, UTF8 ignore and fresh bootstrap verified; PR16 open; merge/review gates pending.

- G6 closure: exact-head570db88 CIgreen, both fresh reviewers APPROVE, localcheck190/125/public18/fresh131/built4 and parent+independentChrome verified. Merge tree/ancestry and remote/local branch cleanup confirmed; receipts in g6/merge-receipt-2026-10-27.json. CI retained one unrelated existing count-readiness retry as VM049/G17, no hidden first-attempt claim.

### VM-022 Recipe image surfaces bypass image policy

- ID: VM-022
- Date opened: 2026-10-22
- Status: Closed ([PR13](https://github.com/sararh95/VioMacro/pull/13), merge `106303adc7c2dad1730446163ac93355fa9b5162`; no deployment)
- Severity: P2
- Workflow/page: Recipe detail / form / cooking
- Expected: Unsupported external images render a safe fallback without CSP errors.
- Actual: Chrome form image had naturalWidth 0 and display none; CDP Log captured CSP rejection for images.unsplash.com. Detail hero was blank.
- User impact: Recipe image surfaces bypass image policy.
- Evidence: recipe-image-errors.json; recipe-legacy.jpg; recipe-form-preview.jpg
- Suspected area: RecipeDetail.tsx:69; RecipeForm.tsx:461-465; GuidedCooking.tsx:115
- Classification: D: three raw-image callers bypass RecipeThumb/isRenderableImage.
- Next action: Preserve shared-policy/caller regressions; separate existing decode-failure fallback VM042 remains G10.
- Verification target: External and permitted-image tests across detail, form, cooking and planner detail.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: Merged2026-10-26; parent and both independent reviews passed, no deployment.

### VM-023 Planner controls clip on a phone viewport

- ID: VM-023
- Date opened: 2026-10-22
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P2
- Workflow/page: Meal Planner
- Expected: Confirm Plan and calorie unit fit at 390px.
- Actual: Chrome 390x844 measured Confirm Plan right edge 399.953125px with viewport width 390; captured screenshot. Kcal clipping still needs a targeted bound assertion.
- User impact: Planner controls clip on a phone viewport.
- Evidence: planner-phone.jpg
- Suspected area: MealPlanner.tsx:1000,1016-1045,1050,1466-1480
- Classification: E: unwrapped action and macro rows inside clipped containers.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target: 390px bounds/operability test with four-digit macro values and save states.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-024 Shared header labels today as the week start

- ID: VM-024
- Date opened: 2026-10-22
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P3
- Workflow/page: Protected app shell
- Expected: Week of reports the canonical local Monday.
- Actual: Chrome on Thursday Oct 22 showed Week of Oct 22 - Planning; actual week starts Oct 19.
- User impact: Shared header labels today as the week start.
- Evidence: dashboard-date.jpg; grocery-before.txt; planner-desktop.txt
- Suspected area: src/app/AppLayout.tsx:234-235
- Classification: Standalone shared-shell date-copy error in E.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target: Frozen Thursday/local-timezone test expecting Oct 19.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-025 Singular grocery count uses items

- ID: VM-025
- Date opened: 2026-10-22
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P3
- Workflow/page: Grocery
- Expected: One item uses singular grammar.
- Actual: Chrome Pantry and Other aisles each displayed 1 items.
- User impact: Singular grocery count uses items.
- Evidence: grocery-before.txt; grocery-generated.txt
- Suspected area: ShoppingList.tsx:224
- Classification: Standalone copy error in E. Pantry footer repeats it but is outside approved Pantry scope.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target: Count 1/2 rendering regression and Chrome evidence.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-026 Emulator fixture project IDs disagree with app configuration

- ID: VM-026
- Date opened: 2026-10-22
- Status: Closed ([#16](https://github.com/sararh95/VioMacro/pull/16), merge `35c518565a490b55e20872cf6172365d4df4606f`)
- Severity: P3
- Workflow/page: Developer QA
- Expected: App, fixture clients and CLI use one explicit emulator project/config.
- Actual: Source confirms test fixtures hardcode viomacro while CI environment uses demo-viomacro. Current CI only runs check. Full mismatched suite not executed before P0 stop.
- User impact: Emulator fixture project IDs disagree with app configuration.
- Evidence: Source-confirmed mismatch, not a reproduced suite failure in this run.
- Suspected area: tests/e2e/emulator-auth.spec.ts:50-64; tests/e2e/core-settings-recovery.spec.ts:11-14; .github/workflows/ci.yml:19
- Classification: F1: portable fixture/config assumptions; also hardcoded Auth/Storage ports and seed helpers.
- Next action: Finish final-current-source gates and Chrome, then PR and independent reviews; no deploy.
- Verification target: Nondefault demo project/ports end-to-end fixture test.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- G6 evidence: `_local/qa/fix-loop-2026-10-22/g6/test-first-main.log` (unchanged source7FAIL/1controlPASS), current13unitPASS and required infrastructure4PASS; fresh emulator131PASS and built-emulator4PASS. Exact later/current-source receipts in the fix-loop log. Shared namespace/ports, UTF8 ignore and fresh bootstrap verified; PR16 open; merge/review gates pending.

- G6 closure: exact-head570db88 CIgreen, both fresh reviewers APPROVE, localcheck190/125/public18/fresh131/built4 and parent+independentChrome verified. Merge tree/ancestry and remote/local branch cleanup confirmed; receipts in g6/merge-receipt-2026-10-27.json. CI retained one unrelated existing count-readiness retry as VM049/G17, no hidden first-attempt claim.

### VM-027 AI search failure test is reportedly flaky

- ID: VM-027
- Date opened: 2026-10-22
- Status: Closed ([#16](https://github.com/sararh95/VioMacro/pull/16), merge `35c518565a490b55e20872cf6172365d4df4606f`)
- Severity: P3
- Workflow/page: Developer QA
- Expected: Fast and delayed mocked failures complete deterministically.
- Actual: PR16 CI timed out45000ms on the callable-error test and its retry at dialog.accept after the page closed. The test awaits its triggering click before accepting the native dialog; failed-image-import repeats this ordering.
- User impact: AI search failure test is reportedly flaky.
- Evidence: CI run40471016682/job122077880599,130PASS/1FAIL; original and retry fail at emulator-auth.spec.ts:2277. Full log and immutable-main comparison in _local/qa/fix-loop-2026-10-22/g6/ci-40471016682-failure.json and ci-40471016682-browser-job.log.
- Suspected area: tests/e2e/emulator-auth.spec.ts:2273-2277,3073-3081; existing helper:290.
- Classification: F3 native-dialog event ordering; immutable main and head have identical affected dialog sequences.
- Next action: Actual-callback RED4FAIL/4controlPASS; existing auto-accept helper applied to both affected triggers, focused8PASS. Repeat required gates and fresh reviews before merge; no closure yet.
- Verification target: Immediate/delayed mocked errors complete without deadlock; preserve message, recovery and upload-cleanup assertions, timeout and retry settings.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- Earlier G6 local result: Nine actual unchanged-app mocked500 trials (0/50/250ms ×3) all resolved the click before the expected dialog and reached keyword fallback; original assertions/order retained. `_local/qa/fix-loop-2026-10-22/g6/unfixed-browser/dialog-order-playwright.json` and report.md. This bounded local non-reproduction and local full-suite pass are superseded for disposition by the later repeatable CI failure above; no CI pass or fix claimed yet.

- G6 closure: exact-head570db88 CIgreen, both fresh reviewers APPROVE, localcheck190/125/public18/fresh131/built4 and parent+independentChrome verified. Merge tree/ancestry and remote/local branch cleanup confirmed; receipts in g6/merge-receipt-2026-10-27.json. CI retained one unrelated existing count-readiness retry as VM049/G17, no hidden first-attempt claim.

### VM-028 Failed grocery refresh deletes the existing generated list

- ID: VM-028
- Date opened: 2026-10-22
- Status: Closed ([#10](https://github.com/sararh95/VioMacro/pull/10), merge `dd5f6fb8019b4227c94bcf2e8be70f1aa124d2e9`)
- Severity: P0
- Workflow/page: Meal Planner -> Grocery
- Expected: A rejected refresh preserves existing groceries, checked state and other weeks.
- Actual: Chrome next-week empty draft -> Add to List returned No recipes in plan, yet all five generated documents were deleted, including checked Chicken breast. Manual control survived; reload confirmed loss.
- User impact: Failed grocery refresh deletes the existing generated list.
- Evidence: groceries-before-failure.json; groceries-after-empty-plan.json; grocery-before-failure.jpg; grocery-empty-plan-error.txt; grocery-after-loss.txt; grocery-after-loss.jpg
- Suspected area: shopping-generator.ts:52,64-71,160-163; shoppingService.ts:110-116,138-155; MealPlanner.tsx:874
- Classification: G: destructive replacement before validation/read/write; all generated weeks are cleared without passing mealPlanId.
- Next action: Closed after CI, Chrome and both fresh round-3 approvals on `6e89c4d`; merge confirmed on main. Retain the G0 regressions through G1. Full emulator54/82 remains under Sara's explicit G0 exception and G6 follow-up.
- Verification target: Validate/build first; replace atomically or with equivalent failure preservation. Test empty/missing recipes/read failure/write failure/manual and checked preservation.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-22 (Pacific)

### VM-029 Guided Cooking crashes for an empty instruction array

- ID: VM-029
- Date opened: 2026-10-22
- Status: Closed ([#17](https://github.com/sararh95/VioMacro/pull/17), merged35d2e2aff07fa0947fc6c7cde3e482da67778aef)
- Severity: P1
- Workflow/page: Guided Cooking
- Expected: A valid recipe with no steps shows an honest empty state.
- Actual: Actual component rendered in isolation with instructions:[] threw Cannot read properties of undefined (reading title). Browser follow-up stopped for VM-028.
- User impact: Guided Cooking crashes for an empty instruction array.
- Evidence: Read-only scout actual-component render; report.
- Suspected area: GuidedCooking.tsx:17-21,73,132; RecipeForm.tsx:191
- Classification: Standalone empty-array fallback defect.
- Next action: None for this G7 fix; retain regressions and evidence.
- Verification target: Create no-step recipe, open cooking, assert no exception and honest empty state.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- Historical pre-fix G7 evidence: actual CodexChrome1440x1000/390x844, Library+Planner, including synthesized missing-recipe no-step fallback. Source7hashes/data unchanged; `_local/qa/fix-loop-2026-10-22/g7/unfixed-chrome-35c5185/report.md` and proof-index.json. Actual-component unit RED9cases6expectedFAIL/3preservationPASS before implementation; real E2E RED in progress, no fix/closure yet.

- Merged verification: source iteration2 check201frontend/125mockedFunctions, public18, fresh143, built4; CI40530516578green; author+freshR2actualChrome desktop390/reloads/savedvalues; fresh R1APPROVE6446909133/R2APPROVE6447608970. Exact reviewed5d08b5d tree/ancestry verified onmain35d2e2a; full verdicts/proof in runninglog/QAledger.

### VM-030 First cooking timer initializes at zero

- ID: VM-030
- Date opened: 2026-10-22
- Status: Closed ([#17](https://github.com/sararh95/VioMacro/pull/17), merged35d2e2aff07fa0947fc6c7cde3e482da67778aef)
- Severity: P2
- Workflow/page: Guided Cooking
- Expected: First-step countdown starts at its saved duration.
- Actual: Chrome Audit Chicken Rice first step timer=120 displayed 00:00; isolated component confirmed.
- User impact: First cooking timer initializes at zero.
- Evidence: guided-cooking.txt; guided-cooking.jpg
- Suspected area: GuidedCooking.tsx:14,52,59,69
- Classification: Standalone timer initialization defect adjacent to B.
- Next action: None for this G7 fix; retain regressions and evidence.
- Verification target: First step and next/previous/reset timer transitions.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- Historical pre-fix G7 evidence: actual CodexChrome1440x1000/390x844, Library+Planner, including synthesized missing-recipe no-step fallback. Source7hashes/data unchanged; `_local/qa/fix-loop-2026-10-22/g7/unfixed-chrome-35c5185/report.md` and proof-index.json. Actual-component unit RED9cases6expectedFAIL/3preservationPASS before implementation; real E2E RED in progress, no fix/closure yet.

- Merged verification: source iteration2 check201frontend/125mockedFunctions, public18, fresh143, built4; CI40530516578green; author+freshR2actualChrome desktop390/reloads/savedvalues; fresh R1APPROVE6446909133/R2APPROVE6447608970. Exact reviewed5d08b5d tree/ancestry verified onmain35d2e2a; full verdicts/proof in runninglog/QAledger.

### VM-031 Guided Cooking hides structured ingredient quantities

- ID: VM-031
- Date opened: 2026-10-22
- Status: Closed ([#11](https://github.com/sararh95/VioMacro/pull/11), merge `b2a705d9adb80676e92f84a4cb0439d7118441d2`)
- Severity: P2
- Workflow/page: Guided Cooking
- Expected: Cooking shows quantity and unit for both ingredient shapes and uses the servings selected in detail from either Recipes or Meal Planner.
- Actual: Chrome showed Chicken breast and Rice with no amounts; legacy Garlic still showed 2-3 cloves.
- User impact: Guided Cooking hides structured ingredient quantities.
- Evidence: guided-cooking.txt; guided-cooking.jpg
- Suspected area: GuidedCooking.tsx:149
- Classification: A: opposite shape assumption from RecipeDetail.
- Next action: Preserve the merged G1 regressions; equivalent package placement is separately Open/P3 VM-037 in G8.
- Verification target: Shared formatter tests plus structured/legacy cooking DOM assertions, and desktop/390px selected-servings round trips through both Recipes and Meal Planner.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-25 (merged; no deployment)

### VM-032 Cooking media and full-recipe controls have no handler

- ID: VM-032
- Date opened: 2026-10-22
- Status: Closed ([#17](https://github.com/sararh95/VioMacro/pull/17), merged35d2e2aff07fa0947fc6c7cde3e482da67778aef)
- Severity: P3
- Workflow/page: Guided Cooking
- Expected: Enabled Full Recipe and Replay Video controls perform their labeled action.
- Actual: Source has enabled buttons without handlers; Chrome exposes them but actions were not exercised before P0 stop.
- User impact: Cooking media and full-recipe controls have no handler.
- Evidence: Source and guided-cooking.txt; action proof pending.
- Suspected area: GuidedCooking.tsx:87-90,118-121
- Classification: Standalone misleading control state.
- Next action: None for this G7 fix; retain regressions and evidence.
- Verification target: Browser click assertions; wire existing navigation or show an honest unavailable state.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: 2026-10-27

- Historical pre-fix G7 evidence: actual CodexChrome1440x1000/390x844, Library+Planner, including synthesized missing-recipe no-step fallback. Source7hashes/data unchanged; `_local/qa/fix-loop-2026-10-22/g7/unfixed-chrome-35c5185/report.md` and proof-index.json. Actual-component unit RED9cases6expectedFAIL/3preservationPASS before implementation; real E2E RED in progress, no fix/closure yet.

- Merged verification: source iteration2 check201frontend/125mockedFunctions, public18, fresh143, built4; CI40530516578green; author+freshR2actualChrome desktop390/reloads/savedvalues; fresh R1APPROVE6446909133/R2APPROVE6447608970. Exact reviewed5d08b5d tree/ancestry verified onmain35d2e2a; full verdicts/proof in runninglog/QAledger.

### VM-033 Image helper accepts protocol-relative URLs

- ID: VM-033
- Date opened: 2026-10-22
- Status: Closed ([PR13](https://github.com/sararh95/VioMacro/pull/13), merge `106303adc7c2dad1730446163ac93355fa9b5162`; no deployment)
- Severity: P2
- Workflow/page: Shared image policy
- Expected: A URL accepted as local stays on the app origin and complies with image policy.
- Actual: Source begins with startsWith('/') and accepts //external.example; permitted host check does not require HTTPS. No browser runtime probe before P0 stop.
- User impact: Image helper accepts protocol-relative URLs.
- Evidence: G3 unfixed browser helper probe plus unsaved preview normalization/CSP at1440/390; `_local/qa/fix-loop-2026-10-22/g3/unfixed-browser-helper-probe.json` and `unfixed-protocol-relative-preview.json`. Preview bypasses helper; evidence distinguishes the two. CSP enforced; no security exposure claimed.
- Suspected area: src/shared/visuals.ts:154,160
- Classification: D: shared image policy validation gap; CSP remains a backstop.
- Next action: Preserve shared-policy/caller regressions; separate existing decode-failure fallback VM042 remains G10.
- Verification target: Pure protocol-relative/wrong-protocol/valid-path tests and browser request/fallback proof.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed: Merged2026-10-26; parent and both independent reviews passed, no deployment.

### VM-034 Pantry duplicates substring category errors

- ID: VM-034
- Date opened: 2026-10-22
- Status: Deferred
- Severity: P3
- Workflow/page: Pantry prototype
- Expected: Category matching uses appropriate tokens/phrases.
- Actual: Read-only actual parser probes: eggplant->Proteins and spice->Freezer.
- User impact: Pantry duplicates substring category errors.
- Evidence: Read-only scout parser probes; Pantry expansion explicitly outside this task.
- Suspected area: src/features/pantry/pantry-parse.ts:33
- Classification: Standalone parallel classification logic. Deferred because Sara excludes Pantry changes beyond VM-013.
- Next action: Keep deferred under Sara's Pantry boundary.
- Verification target: If scope is later approved, parser category tests and quick-add grouping.
- Revisit trigger: Resume of this bug hunt or changes to the named owning paths.
- Date closed:

### BUG-030 Production-Emulator Test Overwrites The Hosting Artifact

- Date opened: 2026-07-11
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Release artifact creation; `test:e2e:prod-emulator`; Firebase Hosting publication
- Expected: Production-emulator tests use an isolated generated output and cannot alter the production `dist/` later consumed by a Hosting deploy. The final Hosting artifact has an automated guard against Firebase emulator endpoints.
- Actual: Fixed. CMD-039 redirects the prod-emulator Vite build and preview to ignored `_local/qa/prod-emulator-dist`. `build:hosting` creates the production artifact and immediately runs a fail-closed verifier that rejects the four named Firebase emulator endpoint classes. Firebase Hosting remains configured to publish default `dist/`.
- User impact: The CMD-038 Auth outage was recovered by rollback. The root cause is closed, and CMD-042 proved the corrected artifact sequence in production by publishing the disabled-state build without recurrence.
- Evidence: `docs/qa-ledger.md` entries `2026-07-11 CMD-038 Hosting Publication Incident And Recovery`, `2026-07-11 CMD-039/CMD-040 Hosting Artifact Isolation Closure`, `2026-07-11 CMD-041 Artifact-Hardening Checkpoint`, and `2026-07-12 CMD-042 Corrected Artifact-Safe Hosting Publication`; live failed version `db2ff99bfb34e9b1`; restored version `0d45e0cec1e830e8`; corrected live version `762e5b25bfb28e0c`; Bugfix and QA prod-emulator 4/4 each; public E2E 18/18 each; exact before/after five-file SHA-256 equality; four-class red proof; clean `dist/` green proof; unrestricted full checks and final Hosting builds passed; exact 11-file fix checkpoint `f9769ae7deb1406526cffa43d5c737297c1fdcd1` pushed with `0 0` divergence; CMD-042 final build/verifier, signed-out Auth, protected redirect, asset, console, and independent Manager proof all passed.
- Suspected area: Fixed in `playwright.prod-emulator.config.ts`, `package.json`, and `scripts/verify-hosting-artifact.mjs`.
- Next action: None. Preserve isolated prod-emulator output and require `npm.cmd run build:hosting` after every emulator/browser test and immediately before any later approved Hosting deploy.
- Verification target: Completed locally and in production. Production `dist/` stayed byte-identical across the prod-emulator suite; isolated output was ignored and contained all four expected emulator classes; default `dist/` contained none; the verifier failed red and passed green; CMD-042 then published the guarded artifact and passed Release plus Manager signed-out smoke.
- Revisit trigger: The prod-emulator output path, Vite build/preview command, Firebase Hosting public directory, emulator host/ports, or Hosting build/deploy workflow changes; or a future verifier/manifest proof fails.
- Date closed: 2026-07-11

### BUG-031 Installed Firebase CLI Rejects Documented Version-ID Rollback Clone

- Date opened: 2026-07-11
- Status: Deferred
- Severity: P2 Important
- Workflow/page: Firebase Hosting rollback automation
- Expected: The documented `hosting:clone SITE:@VERSION_ID SITE:live` path restores the freshly captured known-good Hosting version, or the runbook names another independently proven non-guessing mechanism.
- Actual: Both unquoted and PowerShell-quoted version-ID clone forms failed before mutation. `firebase-tools hosting:clone --help` in the installed CLI advertises only `<siteId>:<channelId>` sources. Firebase Console rollback succeeded and restored production.
- User impact: Automated version-ID rollback is unavailable in the current local CLI, increasing recovery time if the Console is not immediately reachable. A proven Console rollback remains an acceptable private-alpha fallback.
- Evidence: CMD-038 Release output; current CLI help; Firebase Console recovery recorded in `docs/qa-ledger.md` entry `2026-07-11 CMD-038 Hosting Publication Incident And Recovery`.
- Suspected area: Firebase CLI/documentation capability drift, not VioMacro runtime code.
- Next action: Use Firebase Console rollback as the primary operational path. Treat CLI version-ID clone as unavailable. Research and prove a channel-based rollback snapshot or supported API path only in a separately approved Release-hardening packet.
- Verification target: Future automated rollback method is demonstrated against a non-live preview boundary before it is restored to the production runbook.
- Revisit trigger: Before requiring unattended deploys, delegating production release without Console access, or replacing the current manual rollback path.
- Date closed:

### BUG-029 Disabled AI Safety Copy Mislabels Production As Local

- Date opened: 2026-07-11
- Status: Closed
- Severity: P2 Important
- Workflow/page: `/settings` > AI Safety while `AI_SPEND_CIRCUIT_BREAKER_ENABLED` is absent or false
- Expected: The disabled owner panel describes the control state without claiming that the environment is local, so the same accepted build remains truthful in emulator, preview, and production Hosting.
- Actual: Fixed. `AiSpendSafetyPanel.tsx` now says `AI spend controls are currently disabled.` The focused test asserts that exact sentence and uses exact matching for the `Disabled` status badge.
- User impact: The owner could mistake an intentional production safety posture for a local-only build condition and misunderstand whether AI spend enforcement is available.
- Evidence: `docs/qa-ledger.md` entries `2026-07-11 CMD-034 Final Stage 5 Release Preflight` and `2026-07-11 CMD-035/CMD-036 Production-Neutral Disabled AI Safety Copy Closure`; Manager unrestricted `check` exit 0; Builder focused mocked AI Safety 5/5; independent QA focused mocked AI Safety 5/5.
- Suspected area: Fixed in `src/components/AiSpendSafetyPanel.tsx`; deterministic coverage is in `tests/e2e/emulator-auth.spec.ts`.
- Next action: None for local BUG-029 behavior. Preserve the exact environment-neutral sentence and status-badge locator during the later checkpoint and Hosting-only disabled publication.
- Verification target: Completed. Exact production-neutral copy is rendered; the old runtime/test sentence is absent; both corrected focused runs passed 5/5; no backend/service/config/provider behavior changed.
- Revisit trigger: A future copy or status composition change reintroduces environment-specific wording, ambiguous strict locators, or a focused AI Safety failure.
- Date closed: 2026-07-11

### BUG-027 Inactive AI Safety Tab Performs Eager Status Calls

- Date opened: 2026-07-10
- Status: Closed
- Severity: P2 Important
- Workflow/page: `/settings`; ordinary Settings load and save while the AI Safety tab is inactive
- Expected: `getAiSpendStatus` runs only when the owner opens the AI Safety tab. Existing profile and nutrition workflows do not create unrelated owner-status traffic or fail their network-error guards.
- Actual: Fixed. `Settings.tsx` now conditionally mounts `AiSpendSafetyPanel` only while `activeTab === 'ai-safety'`. Ordinary Settings visits no longer issue owner-status traffic, while opening the tab still loads the full fail-closed workflow.
- User impact: A normal Settings visit can make unnecessary owner-only callable requests and surface avoidable network noise even when AI Safety is not being viewed. The regression also prevents the combined local gate from graduating.
- Evidence: `docs/qa-ledger.md` entry `2026-07-10 CMD-018 Through CMD-021 AI Spend Safety UI Closure`; CMD-019 red full suite 65/66; CMD-020 and independent CMD-021 full suites 67/67; named old Settings save and inactive-tab guard lines passed.
- Suspected area: Fixed in `src/pages/Settings.tsx`; regression coverage is in `tests/e2e/emulator-auth.spec.ts`.
- Next action: None. Preserve the inactive-tab network guard and full Settings/AI Safety regression coverage.
- Verification target: Focused Settings save and AI Safety tests pass; inactive-tab network-call guard passes; full `npm.cmd run test:e2e:emulator` is green.
- Revisit trigger: Any future Settings composition change remounts the panel while inactive or ordinary Settings QA captures `getAiSpendStatus` traffic.
- Date closed: 2026-07-10

### BUG-028 Mobile Settings Tab Label Clipping

- Date opened: 2026-07-10
- Status: Closed
- Severity: P3 Deferred
- Workflow/page: `/settings` at 390x844 mobile viewport
- Expected: All four Settings tab labels are fully readable and the tab control has stable dimensions without page-level horizontal overflow.
- Actual: Fixed. The mobile tab strip uses a stable two-column layout; all four labels fit at 390x844 without page-level horizontal overflow, while the desktop row remains horizontal.
- User impact: The final Settings destination is harder to read and the tab row looks unfinished on a common mobile viewport.
- Evidence: `docs/qa-ledger.md` entry `2026-07-10 CMD-018 Through CMD-021 AI Spend Safety UI Closure`; `test-results/cmd-020-settings-tabs-mobile.png`; CMD-020 and independent CMD-021 full suites 67/67.
- Suspected area: Fixed in `src/pages/Settings.tsx`; viewport/text-fit coverage is in `tests/e2e/emulator-auth.spec.ts`.
- Next action: None. Preserve the mobile bounding-box, text-fit, and body-overflow regression assertions.
- Verification target: 390x844 screenshot and bounding-box/overflow assertion prove all four labels are fully visible; desktop layout remains stable.
- Revisit trigger: A future Settings tab addition or label change fails the 390x844 viewport guard.
- Date closed: 2026-07-10

### BUG-026 Stale AI Spend Reservation Recovery

- Date opened: 2026-07-09
- Status: Closed
- Severity: P2 Important
- Workflow/page: Server-side AI spend circuit breaker; interrupted or crashed paid-AI requests
- Expected: A reservation that never reaches reconciliation cannot remain `reserved` forever; recovery must preserve idempotency, avoid double provider calls, and return its conservative amount only when non-billing or safe expiry is proven.
- Actual: Resolved locally through CMD-022 through CMD-025. The server now uses two-phase leases and bounded current-period recovery, validates the complete bounded open lifecycle set, fails closed on malformed/missing leases, validates canonical handles before provider start, and uses the parsed stored reservation as the sole reconciliation accounting authority.
- User impact: Interrupted requests no longer hold allowance indefinitely. Proven pre-provider expiry releases the reservation without charge; ambiguous provider-started expiry is charged conservatively. Non-AI VioMacro workflows remain available.
- Evidence: `docs/qa-ledger.md` entry `2026-07-10 CMD-022 Through CMD-025 AI Spend Recovery Closure`; `docs/ai-spend-circuit-breaker-contract.md`; final Functions contracts 62/62; Manager post-change `npm.cmd run check` exit 0; independent CMD-025 authority/recovery matrix passed with no new defect.
- Suspected area: Fixed in `functions/src/aiSpendReservations.ts`; focused contracts are in `functions/tests/ai-spend-policy.test.cjs` and the shared callable source-order coverage.
- Next action: None for local BUG-026 behavior. Preserve the lifecycle, bounded scan, canonical handle, stored-authority, and idempotency regressions. Disabled deploy, email, native provider backstop, activation, and canary remain separate Release gates rather than BUG-026 reopen conditions.
- Verification target: Completed locally with mocked crash/timeout, malformed-open-set, 10/11 boundary, race, duplicate, forged-handle, conservative accounting, and no-second-provider-call proof.
- Revisit trigger: After combined backend/UI QA and before enabling `AI_SPEND_CIRCUIT_BREAKER_ENABLED`, before any Functions deploy intended for activation, or sooner if CMD-018 exposes a reservation-lifecycle UX dependency.
- Date closed: 2026-07-10

### BUG-021 Auth Production Posture Follow-Up

- Date opened: 2026-07-06
- Status: Closed
- Severity: P2 Important
- Workflow/page: Auth, protected route gate, private-alpha production posture
- Expected: The live Auth page presents only proven private-alpha sign-in paths, avoids misleading scale claims, keeps internal/dev routes classified, and has console/network noise either resolved or documented as non-blocking.
- Actual: CMD-002 patched the code-owned Auth posture items and classified the config-owned noise. Auth copy now uses private-alpha wording instead of "Join 25,000+ users." Google sign-in is disabled by default unless `VITE_ENABLE_GOOGLE_SIGN_IN=true` and Firebase emulators are not active. `/dev/map` is hidden from production builds unless `VITE_ENABLE_INTERNAL_QA_ROUTES=true` or dev mode is active. The `POST /recaptcha/api2/clr` 403/abort events are classified as third-party reCAPTCHA/App Check noise from production App Check initialization, not a code-owned Auth failure. CMD-014 live smoke after the 2026-07-09 Hosting deploy reproduced the same non-blocking shape while Auth and protected-route redirect remained functional; a separate Manager browser capture saw the same UI behavior with no captured warning/error logs.
- User impact: Reduced for private alpha. Users now see email-first private-alpha Auth posture, unproven Google sign-in is not offered by default, and the internal route is not exposed in production builds.
- Evidence: `docs/qa-ledger.md` entries `2026-07-06 CMD-001 Private Alpha QA Command-Room Distillation`, `2026-07-06 CMD-002 Auth Production Posture Bugfix`, and `2026-07-09 CMD-014 Hosting-Only Deploy And Signed-Out Smoke`; CMD-002 red/green proof: public Auth smoke failed on the old social-proof claim before patch and passed 2/2 after patch; production-emulator internal route test failed while `/dev/map` was exposed and passed after gating; Manager rerun on 2026-07-07 passed `npm.cmd run check`, public Auth smoke 2/2, and production-emulator internal route 1/1; CMD-014 Release and Manager smoke both confirmed the deployed Auth controls and `/plan` redirect.
- Suspected area: Patched in `src/pages/AuthPage.tsx`, `src/app/App.tsx`, `.env.example`, `.env.local.example`, `tests/e2e/public.spec.ts`, and `tests/e2e/prod-emulator-auth.spec.ts`.
- Next action: Closed for code-owned items. Keep App Check/reCAPTCHA console noise as a non-blocking Release watch item; reopen only if future live smoke shows blocking Auth behavior or a materially changed error shape.
- Verification target: Completed for code-owned items and the optional post-deploy read-only Auth capture through CMD-014.
- Revisit trigger: Release lane review, before any broader private-alpha sharing, or before changing Auth providers.
- Date closed: 2026-07-07

### BUG-022 Meal Planner Detail Lookup And Clone Last Week Risks

- Date opened: 2026-07-06
- Status: Closed
- Severity: P2 Important
- Workflow/page: Meal Planner
- Expected: Clicking a planned meal opens the correct recipe details, and Clone Last Week copies the immediately previous week relative to the selected planner week.
- Actual: Fixed in CMD-003 on 2026-07-07. Meal detail lookup now uses `meal.recipeId || meal.id`, preserving manual/fallback meal details while loading saved recipe data when a planned meal stores a separate recipe reference. Clone Last Week now selects the exact immediately previous week relative to the selected planner week instead of the latest saved plan.
- User impact: Users can open persisted recipe details from planned meals and Clone Last Week no longer copies a newer/current/future saved plan into the selected week.
- Evidence: `docs/qa-ledger.md` entry `2026-07-07 CMD-003 Meal Planner Detail Lookup And Clone Last Week Bugfix`; red/green emulator proof for recipeId detail lookup and exact previous-week clone targeting; `npm.cmd run check` passed after sandbox-escalated rerun.
- Suspected area: Closed for Meal Planner recipe detail lookup and clone-last-week logic.
- Next action: Closed. Keep the focused regression tests in the Meal Planner emulator group.
- Verification target: Completed. Focused Meal Planner emulator tests proved saved recipe detail lookup through `recipeId` and exact previous-week clone selection; `npm.cmd run check` passed.
- Revisit trigger: After CMD-002 is accepted, before Meal Planner page graduation, or before broader private-alpha user testing of planning workflows.
- Date closed: 2026-07-07

### BUG-023 Documentation And Private-Alpha Posture Drift

- Date opened: 2026-07-06
- Status: Closed
- Severity: P2 Important
- Workflow/page: Developer docs, private-alpha readiness docs, source path references
- Expected: README, contracts, QA docs, and coordination docs describe the current deployed private-alpha state and current folder structure.
- Actual: Fixed in CMD-006 on 2026-07-08. README, roadmap, release-readiness docs, active workflow/page contracts, and active ledger references now describe the live private-alpha Hosting posture, pushed checkpoint branch/commit, approval-gated future deploys, and current `src/app` / `src/features/recipes` paths.
- User impact: Future Release, QA, Builder, and Bugfix chats should land on current docs and source paths instead of stale deploy assumptions or pre-migration locations.
- Evidence: `docs/qa-ledger.md` entry `2026-07-08 CMD-006 Documentation And Private-Alpha Posture Drift Bugfix`; `git diff --check -- "Web App/docs" "Web App/README.md"` passed; focused `rg` verification found no remaining stale source-path or deploy-posture hits in current guidance outside intentionally historical ledger/audit entries. Manager also cleared the old CMD-006 command-room text during acceptance.
- Suspected area: Closed for `README.md`, active docs, page/workflow contracts, release-readiness docs, and active ledger references.
- Next action: Closed. Manager cleared the active CMD-006 command-room text during acceptance.
- Verification target: Completed. Diff whitespace check passed and focused stale-path/deploy-posture scan confirmed remaining hits are historical evidence only.
- Revisit trigger: Before Release lane work, before onboarding a new worker chat, or after accepting Auth and Meal Planner bugfix reports.
- Date closed: 2026-07-08

### BUG-024 Native Dialog UX Watchlist

- Date opened: 2026-07-06
- Status: Needs Evidence
- Severity: P3 Deferred
- Workflow/page: Cross-page user paths with native `alert()` or `prompt()` flows
- Expected: Important user workflows use in-app, accessible, recoverable feedback patterns and do not trap mobile/browser users in native dialogs.
- Actual: CMD-001 QA reported that some native `alert()`/`prompt()` flows remain in user paths. No blocking mobile/dialog trap was confirmed in CMD-001. CMD-009 Stage 3 browser/manual QA captured no native dialogs during the scoped local daily-use pass, so the issue remains watchlist-only rather than a confirmed blocker.
- User impact: Native dialogs can interrupt mobile/browser workflows and make failures harder to style, recover from, or regression-test.
- Evidence: `docs/qa-ledger.md` entry `2026-07-06 CMD-001 Private Alpha QA Command-Room Distillation`: native `alert()`/`prompt()` flows remain in several user paths; keep watching for mobile/dialog traps. `docs/qa-ledger.md` entry `2026-07-08 CMD-009 Stage 3 Browser/Manual Private-Alpha QA Pass`: no native dialogs were captured during the scoped local daily-use browser pass.
- Suspected area: Cross-page UI feedback and confirmation flows.
- Next action: Keep as a watchlist item until QA produces a reproducible trap or a future polish batch intentionally replaces native dialogs.
- Verification target: A focused route/workflow pass confirms no native dialog interrupts critical save, delete, import, auth, or navigation paths.
- Revisit trigger: Before mobile private-alpha expansion, before page graduation for a workflow that still uses native dialogs, or when QA captures a reproducible dialog trap.
- Date closed:

### BUG-025 Firebase Hosting Rollback Procedure Gap

- Date opened: 2026-07-08
- Status: Closed
- Severity: P2 Important
- Workflow/page: Release readiness, Firebase Hosting deploy/rollback
- Expected: Before any next Hosting deploy, Release has a concrete rollback procedure that identifies the previous good Firebase Hosting release and explains how to roll back without touching Functions, Firestore rules/indexes, Storage rules, Firebase config, live AI, or production data.
- Actual: Closed through CMD-011 on 2026-07-09. Release verified the official Firebase Console rollback and Hosting version-clone procedures, captured the current live version `ed0f58dc8bbc9796`, confirmed this repo has no Hosting Functions/Cloud Run rewrite or `pinTag`, and documented pre-deploy, smoke, abort, and rollback steps. Manager independently confirmed the live metadata and distilled the runbook into `docs/production-deploy-readiness-contract.md`.
- User impact: A deploy could still be performed carefully, but rollback would depend on operator memory or live CLI discovery instead of a pre-reviewed command path, increasing stress and risk if the deploy needs to be backed out quickly.
- Evidence: `docs/qa-ledger.md` entries `2026-07-08 CMD-010 Release Readiness Refresh` and `2026-07-09 CMD-011 Hosting-Only Deploy And Rollback Runbook`; official Firebase Hosting docs; successful read-only `hosting:channel:list` metadata capture; Manager spot-check of the same live version/release.
- Suspected area: Resolved in `docs/production-deploy-readiness-contract.md`, `docs/git-checkpoint-contract.md`, `docs/pre-hosting-readiness.md`, and Manager command sequencing.
- Next action: Before any future deploy, recapture the live version, run fresh local verification, and obtain explicit user deploy approval. Rollback or version clone also requires a separately approved Release command.
- Verification target: Completed. The durable runbook names exact Console and CLI rollback paths and confirms the current Hosting-only impact boundary.
- Revisit trigger: Before any next Hosting deploy, rollback, or production smoke that depends on the deployed app matching the branch.
- Date closed: 2026-07-09

### BUG-020 QA Harness Drift: Missing Emulator Export In npm Scripts

- Date opened: 2026-06-29
- Status: Closed
- Severity: P2 Important
- Workflow/page: Local QA harness; `npm.cmd run test:e2e:emulator`, `npm.cmd run test:e2e:prod-emulator`, `npm.cmd run test:e2e:emulator:data-loss`, and `npm.cmd run emulator`
- Expected: Documented npm QA scripts run from the local checkout using an available emulator import or a tracked/generated fixture.
- Actual: Fixed on 2026-06-29. Active npm scripts now call `scripts/firebase-emulator.mjs`, which resolves an import from `VIOMACRO_FIREBASE_EMULATOR_IMPORT`, `FIREBASE_EMULATOR_IMPORT`, `_local/firebase/exports/firebase-export`, the newest non-empty `_local/firebase/exports/firebase-export-*` directory, or legacy root `firebase-export*` folders.
- User impact: Resolved for the local Phase 4 readiness path. Future QA runs no longer depend on one missing timestamped export name.
- Evidence: Original failure: Phase 2 `npm.cmd run test:e2e:prod-emulator` failed before app code with a missing export directory. Fix proof: `npm.cmd run test:e2e:prod-emulator` passed 3/3, `npm.cmd run test:e2e:emulator` passed 59/59, and `npm.cmd run test:e2e:emulator:data-loss` passed 3/3 using `firebase-export-1782525385123HUjsoD`.
- Suspected area: Resolved in `Web App/package.json`, `Web App/scripts/firebase-emulator.mjs`, `Web App/README.md`, and `Web App/docs/e2e-qa.md`.
- Next action: Closed. Keep `VIOMACRO_FIREBASE_EMULATOR_IMPORT` available for exact fixture selection if a future test requires a specific export.
- Verification target: Completed: `npm.cmd run test:e2e:emulator`, `npm.cmd run test:e2e:prod-emulator`, and `npm.cmd run test:e2e:emulator:data-loss` start emulators and complete Playwright without missing-directory failure.
- Revisit trigger: Before the next broad QA pass, before onboarding a fresh worker, or before treating npm script verification as release evidence.
- Date closed: 2026-06-29

### BUG-014 Manual QA Regression Batch: Recipe Library Controls

- Date opened: 2026-06-27
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Recipe Library
- Expected: Recipe cards expose reliable create/search/edit/favorite/delete controls, AI search can be cleared back to the full library, and import/create entry buttons have clear accessible behavior.
- Actual: Fixed. Recipe card actions are visible and have recipe-specific accessible names; delete confirmation removes recipes from the main list and active AI results; `All Recipes` clears sticky AI result/query state; top Magic Import routes to `/recipes/import` on the library page and is a labeled file chooser on the import page.
- User impact: Resolved for current private-alpha Recipe Library scope.
- Evidence: `docs/qa/QA_AUDIT.md` findings `BUG-RECIPES-001`, `BUG-RECIPES-002`, `BUG-RECIPES-003`, and `A11Y-RECIPES-001`; 2026-06-27 focused regression proof in `docs/qa-ledger.md`; in-app browser confirmed leftover `QA Test Recipe Edited` deleted through the UI.
- Suspected area: Resolved in `src/features/recipes/pages/RecipeLibrary.tsx` and `tests/e2e/emulator-auth.spec.ts`.
- Next action: Closed. Continue with `BUG-015` Meal Planner batch.
- Verification target: Completed: lint passed; build passed; focused Recipe Library Playwright slice passed 4/4; in-app browser manual delete sanity pass passed.
- Revisit trigger: Before closing Recipe Library contract, before Hosting readiness, or before adding recipe feature expansion.
- Date closed: 2026-06-27

### BUG-015 Manual QA Regression Batch: Meal Planner Week And Wizard

- Date opened: 2026-06-27
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Meal Planner
- Expected: Week navigation moves both directions, view tabs expose consistent active state, empty-grid plan creation persists after refresh, and plan generation/clone paths avoid native alert interruption traps.
- Actual: Fixed for the Meal Planner page-contract scope on 2026-06-27. Week navigation now moves next and previous without the empty-week prompt trapping the route; the selected planner week persists through reload; Day/Week/Month tabs expose `aria-pressed`; Daily Smoothie, Daily Tea, and Include Snacks are named checkbox controls. `BUG-PLAN-005` is also repaired: Clone Last Week and Auto-Generate Week now use visible, dismissible in-app feedback instead of native alert interruption paths, and generation failure leaves the wizard/page usable.
- User impact: Meal planning is a primary workflow; users may not trust saved plans or navigation state.
- Evidence: `docs/qa/QA_AUDIT.md` findings `BUG-PLAN-001` through `BUG-PLAN-005`; 2026-06-27 repair proof in `docs/qa-ledger.md`; focused Playwright Meal Planner slice passed 11/11, including no-history clone and seeded clone-success coverage; focused failure slice passed 2/2; in-app browser manual proof confirmed Jun 22 -> Jun 29 -> Jun 22 navigation with no prompt trap, `aria-pressed` tab state, named wizard checkboxes, no-history clone feedback with no JS dialog, seeded partial-plan clone-success with cloned recipe visible and `Confirm Plan` enabled, emulator-guarded Auto-Generate feedback with wizard still open, and no console errors.
- Suspected area: Resolved in `src/pages/MealPlanner.tsx`, `src/components/PlanGenerationWizard.tsx`, and `tests/e2e/emulator-auth.spec.ts`.
- Next action: Closed. Keep save failure and Add to List/shopping-list native alerts as separate future Grocery/cross-page polish, not blockers for the current Meal Planner page contract.
- Verification target: Completed: focused Meal Planner Playwright slice passed 11/11; focused `meal-planner-failure` slice passed 2/2; lint passed; build passed; in-app browser manual recovery proof passed.
- Revisit trigger: Before closing cross-page Dashboard -> Meal Planner -> Grocery workflow or before changing plan generation/prompt UX.
- Date closed: 2026-06-27

### BUG-016 Manual QA Regression Batch: Dashboard Metrics UX

- Date opened: 2026-06-27
- Status: Closed
- Severity: P2 Important
- Workflow/page: Dashboard
- Expected: Dashboard renders without chart-size warnings, check-in sliders are keyboard-accessible and visually synced, hydration correction is explicit/non-destructive, mobile nav names are unique, and sleep quality controls have accessible names.
- Actual: Closed in two Dashboard repair passes on 2026-06-27. Batch A fixed and verified Recharts width/height warnings, Energy/Hunger slider keyboard/value sync, mobile nav accessible-name ambiguity, and sleep quality button names. Batch B replaced hydration `Correct Entry`'s hard-coded `-250 ml` behavior with an explicit inline correction form that sets the current day's water total.
- User impact: Dashboard now avoids the known manual-audit trust, accessibility, and console-noise defects in the current local private-alpha scope.
- Evidence: `docs/qa/QA_AUDIT.md` findings `BUG-DASH-001`, `BUG-DASH-002`, `BUG-DASH-003`, `A11Y-DASH-001`, `A11Y-DASH-002`; repair addenda `REPAIR-DASH-2026-06-27-A` and `REPAIR-DASH-2026-06-27-B`; focused Playwright Dashboard/mobile batch passed 4/4; focused hydration Playwright batch passed 2/2; in-app browser proof confirmed chart render with no chart-size warnings, keyboard slider updates from 3/5 to 4/5, one mobile nav opener plus one closer, named sleep-quality buttons with `aria-pressed`, and hydration correction from 250 ml to 125 ml persisted after reload with no console warnings/errors.
- Suspected area: `src/pages/Dashboard.tsx`, `src/components/WeightHistoryWidget.tsx`, `src/components/CheckInModal.tsx`, `src/components/SleepLogModal.tsx`, `src/app/AppLayout.tsx`.
- Next action: Closed. Keep Dashboard hydration correction in the focused Dashboard regression group.
- Verification target: Completed. Manual browser hydration correction smoke, targeted hydration emulator test, lint, and production build passed.
- Revisit trigger: Dashboard page redesign, hydration target customization, or changes to `logDailyMetric` water writes.
- Date closed: 2026-06-27

### BUG-017 Manual QA Regression Batch: Settings Persistence Contract

- Date opened: 2026-06-27
- Status: Closed
- Severity: P2 Important
- Workflow/page: Settings
- Expected: Settings either autosave clearly or expose Save/Discard controls consistently; bottle size persists after refresh; dietary tags visibly toggle; numeric inputs have labels.
- Actual: Fixed and verified on 2026-06-27. Settings inputs now expose exact labels/ARIA names, dietary/allergy/phase/macro toggles expose pressed state, the changed-state footer keeps Save/Discard visible on mobile, Gluten Free remains selected after save/reload, and custom bottle size persists after refresh.
- User impact: Resolved for the current private-alpha Settings workflow.
- Evidence: `docs/qa/QA_AUDIT.md` findings `BUG-SETTINGS-001`, `BUG-SETTINGS-002`, `A11Y-SETTINGS-001`; repair addendum `REPAIR-SETTINGS-2026-06-27-A`; focused Settings Playwright slice passed 6/6; focused network-backed Settings pair passed 2/2; lint passed; build passed; in-app browser proof confirmed unique labels, Save/Discard visibility, Gluten Free `aria-pressed=true`, bottle size value `582` after reload, percentage slider labels after switching modes, and no console errors.
- Suspected area: Resolved in `src/pages/Settings.tsx` and `tests/e2e/emulator-auth.spec.ts`.
- Next action: Closed. Keep broader nutrition/default validation and Firestore schema hardening as future non-blocking Settings/foundation work.
- Verification target: Completed: manual settings persistence after refresh; targeted settings save/accessibility tests.
- Revisit trigger: Settings repair batch.
- Date closed: 2026-06-27

### BUG-018 Manual QA Regression Batch: Pantry And Grocery Prototype Polish

- Date opened: 2026-06-27
- Status: Closed
- Severity: P2 Important
- Workflow/page: Pantry, Grocery
- Expected: Prototype counts and controls stay synchronized, and check/delete/edit affordances have accessible names or honest disabled states.
- Actual: Fixed and verified on 2026-06-27. Grocery check/delete controls now expose item-specific accessible names and checked state. Pantry prototype controls now expose item-specific disabled/edit/delete labels, category selected state, named pagination/coming-soon controls, and a readable stat-card label for total items.
- User impact: Resolved for current private-alpha scope. Pantry remains deferred as a feature, but its prototype controls are now honest and testable.
- Evidence: `docs/qa/QA_AUDIT.md` findings `BUG-PANTRY-001`, `A11Y-PANTRY-001`, `A11Y-GROCERY-001`; repair addendum `REPAIR-PANTRY-GROCERY-2026-06-27-A`; focused Playwright Grocery slice passed 7/7; focused Playwright Pantry slice passed 1/1; Chrome Browser Captain proof confirmed Grocery check state persisted after reload, Pantry count returned to `0 Total Items` after deleting two QA entries and stayed at `0` after reload, row controls are named/testable, and the duplicate exact-name `Coming Soon` buttons were removed.
- Suspected area: Resolved in `src/pages/Pantry.tsx`, `src/pages/ShoppingList.tsx`, and `tests/e2e/emulator-auth.spec.ts`.
- Next action: Closed. Keep Pantry itself deferred unless promoted, and keep Grocery in maintenance/regression mode.
- Verification target: Completed. Browser/subagent proof, focused Pantry/Grocery Playwright regressions, lint, and production build passed.
- Revisit trigger: Pantry/Grocery repair batch or pantry feature promotion.
- Date closed: 2026-06-27

### BUG-019 Manual QA Gap: Recipe Import File Upload Fixture

- Date opened: 2026-06-27
- Status: Closed
- Severity: P2 Important
- Workflow/page: Recipe Import
- Expected: Image/PDF upload extraction has repeatable verification for success and failure states.
- Actual: Original in-app browser manual QA could not complete file selection because the runtime blocked CDP file selection and exposed no controllable file chooser. A follow-up real Chrome/manual pass selected `manual-recipe-import-card.svg`, triggered the parser, showed the expected safe failure alert, and recovered back to `/recipes/import` with `Choose recipe file` visible again.
- User impact: Resolved for current private-alpha scope. The upload safe-failure/recovery path is browser-proven; parsed-draft success remains covered by Playwright fixtures and should be rechecked with a real recipe image before promoting import as a public launch-critical workflow.
- Evidence: `docs/qa/QA_AUDIT.md` finding `BUG-IMPORT-001`; 2026-06-27 Chrome/manual screenshots showing `127.0.0.1:5173 says Failed to parse recipe. Please try again.` and recovery to the import page; 2026-06-27 follow-up `npx.cmd playwright test --config=playwright.emulator.config.ts -g "recipe import|failed recipe image import|parsed recipe import|unsupported file"` passed 4/4 and covered image upload parse failure cleanup, unsupported type rejection, parsed import cancel cleanup, and parsed draft save.
- Suspected area: `tests/e2e`, `src/features/recipes/pages/RecipeLibrary.tsx`, file upload test harness.
- Next action: Closed for private-alpha QA. Keep the in-app browser CDP limitation documented; use real Chrome/manual or a future dev-only QA fixture harness for any deeper manual import proof.
- Verification target: Completed for upload safe-failure/recovery. Playwright remains the parsed-draft success proof until a real recipe image/manual success pass is run.
- Revisit trigger: Import workflow repair batch or before promoting recipe import as launch-critical.
- Date closed: 2026-06-27

### BUG-001 Meal Plan Week-Key Persistence Mismatch

- Date opened: 2026-06-21
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Meal Planner, Dashboard, Grocery
- Expected: A saved weekly plan is recognized consistently by Dashboard, Grocery, and Meal Planner.
- Actual: Source inspection confirmed `store.tsx` computed the active week from Sunday while `MealPlanner.tsx` normalized weeks to Monday. Meal Planner also saved a plan without retaining the returned Firestore plan ID in local fetched state.
- User impact: Meal plans may appear missing or fail to power downstream workflows.
- Evidence: Prior Chief of Staff backlog analysis; 2026-06-22 source trace of `src/lib/store.tsx`, `src/pages/MealPlanner.tsx`, and `src/services/planService.ts`; targeted Playwright emulator regression passed after fix.
- Suspected area: `src/lib/store.tsx`, `src/pages/MealPlanner.tsx`, `src/services/planService.ts`, `src/lib/date-utils.ts`.
- Next action: Closed. Keep regression test in the Dashboard group.
- Verification target: Completed. Playwright emulator test proves a saved weekly plan is visible on Dashboard after reload and Grocery shows `Meal Plan Connected`.
- Revisit trigger: Before meal-plan feature expansion or Hosting readiness.
- Date closed: 2026-06-22

### BUG-002 AI Functions Local Harness Gap

- Date opened: 2026-06-21
- Status: Closed
- Severity: P2 Important
- Workflow/page: AI meal generation, recipe parsing, semantic search
- Expected: Local QA can test AI callable success and failure states without live provider calls.
- Actual: Fixed for the backend callable contract layer. A direct Functions contract lane now mocks Gemini and tests callable success, failure, malformed output, and guardrail behavior without live provider calls.
- User impact: AI callable regressions are now easier to catch before live AI smoke or page-level QA.
- Evidence: `functions/tests/callable-contracts.test.cjs`; `npm.cmd run test:functions:contracts` passed on 2026-06-25 with 16 tests.
- Suspected area: `functions/src/index.ts`, `src/services/aiService.ts`, Playwright/emulator scripts.
- Next action: Closed for direct callable contract coverage. Keep UI-facing failure copy in the relevant page/workflow contracts and run a deliberate live AI smoke only after budget/secrets/App Check gates.
- Verification target: Completed for backend callable contracts: unauthenticated call, App Check assumption, provider failure, malformed schema, oversized payload, parser guardrails, and semantic-search query guardrails.
- Revisit trigger: Before live AI release or Functions-only deploy validation.
- Date closed: 2026-06-25

### BUG-003 Recipe Import Orphaned Upload Risk

- Date opened: 2026-06-21
- Status: Closed
- Severity: P2 Important
- Workflow/page: Recipe Library import, image/PDF parsing
- Expected: Failed recipe parsing should not leave user-visible orphaned uploads or unclear recovery states.
- Actual: Fixed. Recipe import now tracks uploaded asset paths and cleans them up on parse failure or if the parsed draft is canceled before save.
- User impact: Failed or canceled imports no longer leave known uploaded recipe assets behind in Storage.
- Evidence: Source trace and 2026-06-25 Playwright emulator regression `data-loss: failed recipe image import cleans up the uploaded asset`.
- Suspected area: `src/features/recipes/pages/RecipeLibrary.tsx`, `src/services/recipeService.ts`, `src/services/aiService.ts`, Storage rules.
- Next action: Closed for current upload-before-parse flow. Consider import draft records if the workflow becomes multi-step or resumable.
- Verification target: Completed. The targeted data-loss suite passed and the full emulator suite passed.
- Revisit trigger: Before introducing resumable import drafts, background parsing, or alternate upload paths.
- Date closed: 2026-06-25

### BUG-004 Pantry Prototype Controls Still Need Full Product Decision

- Date opened: 2026-06-21
- Status: Deferred
- Severity: P2 Important
- Workflow/page: Pantry
- Expected: Pantry controls either work or clearly show Coming Soon.
- Actual: Pantry full intelligence is still under development. The major page actions are Coming Soon, and the 2026-06-26 Chrome/subagent pass found smaller active-looking controls: shortcut, quantity +/- controls, edit, and pagination. These were converted to disabled or coming-soon affordances while preserving the lightweight quick-add/delete prototype.
- User impact: Reduced for private alpha. Pantry still should not be treated as a launch feature, but the remaining prototype no longer advertises barcode scanning, keyboard shortcuts, quantity editing, item editing, or pagination as live behavior.
- Evidence: Prior backlog analysis; 2026-06-26 Chrome/subagent production-readiness pass; `npm.cmd run test:e2e:emulator` passed 53/53 after Pantry honesty assertions were added; `npm.cmd run test:e2e:prod-emulator` passed 3/3 after built-app Pantry assertions were added.
- Suspected area: `src/pages/Pantry.tsx`, `src/services/pantryService.ts`.
- Next action: Keep Pantry deferred unless the user promotes it. If promoted, create a Pantry page contract and decide whether quick-add/delete remain or the page becomes fully disabled until the real inventory workflow exists.
- Verification target: Current private-alpha verification is complete for honest deferred UI. Future Pantry contract should assert every remaining control is working, disabled, Coming Soon, or intentionally removed.
- Revisit trigger: Before pantry feature work.
- Date closed:

### BUG-005 Documentation And QA Command Drift

- Date opened: 2026-06-21
- Status: Closed
- Severity: P2 Important
- Workflow/page: Developer workflow
- Expected: README and readiness docs point to scripts that exist.
- Actual: README previously referenced `npm run test:e2e:prod`, while package scripts use `test:e2e:prod-emulator`.
- User impact: Wrong command increases confusion and slows QA.
- Evidence: `Web App/package.json` scripts.
- Suspected area: `README.md`, `docs/pre-hosting-readiness.md`, `docs/qa-ledger.md`.
- Next action: Completed in the North Star Compass and Bug Ledger setup pass.
- Verification target: Source inspection confirms README now uses `npm run test:e2e:prod-emulator`.
- Revisit trigger: Whenever package scripts change.
- Date closed: 2026-06-21

### BUG-006 Dashboard Failure-State Coverage Gap

- Date opened: 2026-06-22
- Status: Closed
- Severity: P2 Important
- Workflow/page: Dashboard
- Expected: Dashboard save/load failures for water, sleep, check-in, and weight history have explicit user-facing recovery coverage.
- Actual: Fixed for Dashboard scope. Water save, sleep save, check-in save, and weight-history load failures now have user-visible recovery/alert coverage.
- User impact: Dashboard users get visible feedback when primary metric writes or history loading fail instead of silent partial failure.
- Evidence: Dashboard page contract error-state section; 2026-06-25 isolated Dashboard failure-state Playwright run passed: 4 tests.
- Suspected area: `src/pages/Dashboard.tsx`, `src/components/SleepLogModal.tsx`, `src/components/CheckInModal.tsx`, `src/services/userService.ts`, Playwright mocking strategy.
- Next action: Closed. Keep the isolated failure-state tests with the Dashboard group.
- Verification target: Completed. Playwright tests prove failed water save, failed sleep save, failed check-in settings save, and failed weight-history load produce user-visible feedback or retry behavior.
- Revisit trigger: Before Hosting launch readiness or when adding Firestore/rules failure tests.
- Date closed: 2026-06-25

### BUG-007 Dashboard Sleep Date UTC Drift

- Date opened: 2026-06-22
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Dashboard sleep logging
- Expected: A sleep log saved from Dashboard appears on the same local calendar day after save and reload.
- Actual: `SleepLogModal` defaulted to a UTC date key while Dashboard read today's sleep using the local wall-clock date. In the full emulator suite, this saved sleep to the next calendar day and Dashboard still showed `No sleep logged yet`.
- User impact: Users near UTC date rollover could save sleep successfully but not see it on today's Dashboard.
- Evidence: Full emulator Playwright suite failed `dashboard sleep log saves and persists after reload`; failure context showed Sleep `8h` on Jun 23 while Dashboard today was Jun 22.
- Suspected area: `src/components/SleepLogModal.tsx`, `src/pages/Dashboard.tsx`, `src/services/userService.ts`, `src/lib/date-utils.ts`.
- Next action: Closed. Keep the grouped Dashboard and full emulator suite coverage.
- Verification target: Completed. Targeted sleep test, Dashboard group, and full emulator suite all pass after local-date key fix.
- Revisit trigger: If any daily metric introduces new UTC-derived `YYYY-MM-DD` keys.
- Date closed: 2026-06-22

### BUG-008 Dashboard Weight Date UTC Drift In Activity Calendar

- Date opened: 2026-06-23
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Dashboard quick weight logging, Weight History, Activity Calendar
- Expected: A weight logged from Dashboard appears on the Weight History card and on the same local-day Activity Calendar tooltip after save and reload.
- Actual: The Weight History card could show the latest weight while the Activity Calendar tooltip for the local day still showed `-- lbs`. `CheckInModal` saved weight dates with UTC `toISOString()`, while Dashboard sleep/water and calendar matching use local day keys.
- User impact: Users could log today's weight successfully but see the local-day Activity Calendar report no weight, creating misleading progress evidence.
- Evidence: User screenshot on 2026-06-23 showed `180 lbs` in Weight History while the Activity tooltip for the active local day showed `Weight -- lbs`; source trace confirmed UTC date write in `src/components/CheckInModal.tsx`.
- Suspected area: `src/components/CheckInModal.tsx`, `src/services/userService.ts`, `src/components/ActivityCalendarWidget.tsx`, `tests/e2e/emulator-auth.spec.ts`.
- Next action: Closed. Weight check-ins now use local date keys, daily metric persistence normalizes `date` to the document date key, and Activity Calendar uses the shared local date helper.
- Verification target: Completed. Targeted quick-weight regression now asserts the Activity Calendar tooltip shows the saved weight before and after reload; Dashboard group, lint, and build pass.
- Revisit trigger: If new daily metric writers introduce UTC-derived dates or Activity Calendar gets a new date-matching path.
- Date closed: 2026-06-23

### BUG-009 Semantic Search Live Vector Index Gate

- Date opened: 2026-06-25
- Status: Deferred
- Severity: P2 Important
- Workflow/page: Recipe Library semantic search, Firebase Functions, Firestore vector search
- Expected: Production semantic search has a live Firestore vector index matching the server embedding dimension before users rely on search.
- Actual: Local foundation is prepared: stale composite indexes were removed, embeddings are pinned to 1536 dimensions, and callable guard tests pass. The live vector index has not been created or smoke-tested in Firebase yet. Product decision on 2026-06-26: semantic search is deferred for private alpha and normal keyword search/fallback remains the launch path.
- User impact: Semantic search can fail in production even if local build/tests pass, because nearest-neighbor queries require a matching Firestore vector index. This is acceptable for private alpha only because semantic search is not launch-critical and must remain treated as an enhancement.
- Evidence: `firestore.indexes.json`; `functions/src/index.ts`; Firebase vector search docs; Gemini embeddings docs; 2026-06-25 Functions contract test pass; 2026-06-25 Recipe Library grouped emulator proof passed local semantic-search failure fallback; 2026-06-26 provider migration now requests explicit 1536-dimensional embeddings through `@google/genai`.
- Suspected area: `functions/src/index.ts`, live Firestore indexes, Firebase project `viomacro`.
- Next action: Do not block private-alpha deploy on this. Before enabling or promoting live semantic search, create a `recipes.embedding` vector index with dimension `1536` and run a live canary search after budget/secrets/App Check gates are approved.
- Verification target: Live semantic search returns expected recipes or a friendly empty state without index/provider errors.
- Revisit trigger: Before enabling semantic search, before treating semantic search as launch-critical, or before any production semantic-search smoke test.
- Date closed:

### BUG-010 Functions Production Dependency Audit Gate

- Date opened: 2026-06-26
- Status: Deferred
- Severity: P2 Important
- Workflow/page: Firebase Functions, production AI/backend deploy readiness
- Expected: Production Functions dependencies have no unresolved high/critical advisories and any remaining moderate advisories are either resolved or accepted with a documented reason.
- Actual: `npm.cmd --prefix functions audit --omit=dev` initially reported production advisories including critical/high transitive packages. A non-breaking `npm.cmd --prefix functions audit fix --omit=dev` removed the critical/high production advisories, but 8 moderate advisories remain through `firebase-admin` transitive dependencies. npm reports the remaining fix as `firebase-admin@14.1.0`, a breaking major upgrade. A focused v14 trial passed local build/lint/callable contracts, but current `firebase-functions` and `firebase-functions-test` peer ranges do not declare `firebase-admin@14` support, and non-forced audit remediation fails with `ERESOLVE`.
- User impact: For private-alpha local work this is acceptable and better than forcing an unsupported peer tree. For broader production use, revisit when Firebase Functions packages support Admin SDK v14 or npm provides a non-breaking remediation path.
- Evidence: 2026-06-26 production audit output; 2026-06-26 `firebase-admin@14.1.0` trial; official Firebase Admin Node v14 release notes; `functions/package.json`; `functions/package-lock.json`; `docs/ai-functions-readiness-contract.md`.
- Suspected area: `firebase-admin`, `@google-cloud/firestore`, `@google-cloud/storage`, `google-gax`, `teeny-request`, `uuid`.
- Next action: Do not force `firebase-admin@14` while the Firebase Functions peer range excludes it. Watch for a compatible `firebase-functions` / `firebase-functions-test` release or a non-breaking audit remediation. Keep the known 8 moderate advisories accepted for private-alpha until then.
- Verification target: Completed for current decision: `npm.cmd --prefix functions run lint` passed; `npm.cmd --prefix functions run build` passed; `npm.cmd run test:functions:contracts` passed; `npm.cmd --prefix functions audit --omit=dev` reports only the known 8 moderate advisories.
- Revisit trigger: Before broader sharing, production hardening, or when Firebase Functions packages declare `firebase-admin@14` compatibility.
- Date closed:

### BUG-011 App Check Client Site Key Gate

- Date opened: 2026-06-26
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: AI/Functions production readiness, App Check, browser callable smoke
- Expected: The production web client has `VITE_RECAPTCHA_SITE_KEY` configured, App Check initializes outside emulator mode, reCAPTCHA can mint a token on the selected smoke origin, and production callable AI Functions accept App Check tokens during a controlled live smoke.
- Actual: Fixed. Firebase App Check reCAPTCHA v3 config exists for the web app, ignored local `Web App/.env` has the public site key, `localhost` is listed in the reCAPTCHA domain list, and the Firebase Web SDK callable smoke from `http://localhost:5173/` reached `generateMealPlan` with Auth + App Check.
- User impact: Resolved for private-alpha callable readiness. Browser callable traffic can reach handler-level Firebase Auth/App Check validation instead of being blocked by missing App Check client config or Cloud Run IAM.
- Evidence: 2026-06-26 production config metadata probe; `src/lib/firebase.ts`; `Web App/.env` boolean presence scan; App Check Admin API metadata confirmed reCAPTCHA v3 config exists with token TTL `86400s`; reCAPTCHA Admin showed `localhost` added and saved; Cloud Run Security for `generateMealPlan`, `parseRecipeFromImage`, and `semanticSearchRecipes` set to `Allow public access`; final SDK smoke returned `functions/invalid-argument` with `Missing user settings.` for `{}`, proving Auth/App Check passed before validation and before Gemini execution.
- Suspected area: Resolved: reCAPTCHA domain list plus Cloud Run callable invoker setting.
- Next action: Keep callable Cloud Run services public at the infrastructure layer while preserving handler-level Firebase Auth + App Check. Do not run valid live AI provider smoke until explicitly approved.
- Verification target: Completed for current scope: controlled SDK smoke passed and temporary Auth user/harness were cleaned up.
- Revisit trigger: Before live AI smoke, Functions-only production validation, or Hosting deploy.
- Date closed: 2026-06-26

### BUG-012 Meal Planner Prompt Blocks Navigation After Dismiss

- Date opened: 2026-06-26
- Status: Closed
- Severity: P1 Stabilization
- Workflow/page: Meal Planner, Navigation shell
- Expected: On an empty plan week, the user can click `Maybe Later`, dismiss the plan prompt, and continue navigating to other sidebar routes.
- Actual: Chrome smoke showed `Maybe Later` closed the prompt only momentarily. The auto-prompt effect reopened it because no plan existed, leaving the overlay in place and intercepting sidebar clicks.
- User impact: A user who chooses not to create a plan can become trapped on `/plan` until they create/clone a plan or reload into another route.
- Evidence: 2026-06-26 Chrome manual smoke on emulator-backed `http://127.0.0.1:5173/`; DOM hit test showed `.fixed.inset-0 z-[60]` still covering the page after `Maybe Later`; strict route smoke failed before fix and passed after fix.
- Suspected area: `src/pages/MealPlanner.tsx`, `src/components/PlanPromptModal.tsx`.
- Next action: Closed. Keep regression coverage.
- Verification target: Completed. `npm.cmd run qa:browser` passed with the new emulator test `meal planner prompt can be dismissed without blocking sidebar navigation`; Chrome strict sidebar route smoke passed after the fix.
- Revisit trigger: If Meal Planner prompt timing, Saturday planning prompts, or empty-week modal behavior changes.
- Date closed: 2026-06-26

### BUG-013 Dashboard Recharts Container Warning

- Date opened: 2026-06-26
- Status: Closed
- Severity: P2 Important
- Workflow/page: Dashboard, Weight History chart
- Expected: Dashboard renders without chart container-size console warnings.
- Actual: Fixed. Weight History now measures its chart container and renders the Recharts chart with numeric width/height only after a real width is available.
- User impact: Low immediate user impact for private alpha, but the warning can hide more important console issues and may indicate unstable chart sizing in edge layouts.
- Evidence: 2026-06-27 Dashboard repair batch. Focused emulator Playwright tests passed 4/4 with tightened chart-warning collector. In-app browser proof loaded Dashboard with a rendered `svg.recharts-surface` and no chart-size warning logs after the verification fence.
- Suspected area: `src/components/WeightHistoryWidget.tsx`.
- Next action: Closed. Keep the tightened chart warning collector in Dashboard/mobile tests.
- Verification target: Completed. Browser Dashboard smoke showed no Recharts width/height warning.
- Revisit trigger: Before Dashboard visual polish, responsive chart work, or if chart warnings become test-blocking.
- Date closed: 2026-06-27

## Automation Ideas

Local reminder automation:

- Good for: "Every Monday at 10 AM, remind me to review the bug ledger."
- Works when: Codex automation or local reminders are available and the machine/context can run.
- Limitation: Local reminders are not the same as cloud CI; they depend on the app/thread environment.

Cloud automation:

- Good for: GitHub Actions running lint/build/tests on push or pull request.
- Good for: Scheduled dependency checks or nightly emulator smoke if secrets and emulator setup are stable.
- Limitation: It will not click around like a human unless we intentionally configure browser tests in CI.

Manual phone reminder:

- Good for: low-stress habit building.
- Suggested reminder: "Review VioMacro bug ledger and pick one page contract."

Future improvement:

- Add a GitHub issue sync or GitHub Actions workflow after the local bug-ledger process proves useful.

### BUG-032 Onboarding draft lost after a rejected save

- Date opened: 2026-10-02
- Status: Verify (merged in PR4 on 2026-10-22 and locally verified; release verification pending)
- Severity: P1 Stabilization
- Workflow/page: First-run onboarding
- Expected: A rejected save keeps the current step and entered values.
- Actual: Reproduced before repair. Optimistic onboardingCompleted unmounted the wizard before persistence; rollback mounted a blank Welcome step.
- User impact: A user had to re-enter the entire setup without seeing the failure.
- Evidence: `docs/qa-ledger.md`, 2026-10-02 Core recovery; `tests/e2e/core-settings-recovery.spec.ts`; [PR4](https://github.com/sararh95/VioMacro/pull/4).
- Suspected area: src/app/providers/store.tsx; src/features/auth/OnboardingWizard.tsx
- Next action: Preserve the regression coverage; assess production rollout only through a separately approved release gate.
- Verification target: Delayed save rejection keeps Preferences and values; retry and reload preserve the saved profile.
- Revisit trigger: Changes to account loading, settings publication, check-in persistence, or browser QA ownership.
- Date closed: Merged 2026-10-22; not closed for release because no deployment occurred.

### BUG-033 Settings timeout sends returning users to onboarding

- Date opened: 2026-10-02
- Status: Verify (merged in PR4 on 2026-10-22 and locally verified; release verification pending)
- Severity: P1 Stabilization
- Workflow/page: Account loading and dashboard
- Expected: Unknown saved settings show a retry state until the read succeeds.
- Actual: Reproduced before repair. The rejected-read branch manufactured default settings with onboardingCompleted false.
- User impact: A temporary read failure misrepresented an established account as new.
- Evidence: `docs/qa-ledger.md`, 2026-10-02 Core recovery; `tests/e2e/core-settings-recovery.spec.ts`; [PR4](https://github.com/sararh95/VioMacro/pull/4).
- Suspected area: src/app/providers/store.tsx; src/app/App.tsx
- Next action: Preserve the regression coverage; assess production rollout only through a separately approved release gate.
- Verification target: Delayed settings read shows Retry Saved Data, never onboarding; retry restores the account without changing stored values.
- Revisit trigger: Changes to account loading, settings publication, check-in persistence, or browser QA ownership.
- Date closed: Merged 2026-10-22; not closed for release because no deployment occurred.

### BUG-034 Check-in partially saves profile before history

- Date opened: 2026-10-02
- Status: Verify (merged in PR4 on 2026-10-22 and locally verified; release verification pending)
- Severity: P1 Stabilization
- Workflow/page: Dashboard weight check-in
- Expected: Profile and daily history commit together or remain unchanged.
- Actual: Reproduced before repair. The modal updated profile weight, then separately wrote history; a rejected history write left conflicting weights.
- User impact: Dashboard profile and progress history could disagree after a reported failed save.
- Evidence: `docs/qa-ledger.md`, 2026-10-02 Core recovery; `tests/e2e/core-settings-recovery.spec.ts`; [PR4](https://github.com/sararh95/VioMacro/pull/4).
- Suspected area: src/features/dashboard/components/CheckInModal.tsx; src/services/userService.ts; src/app/providers/store.tsx
- Next action: Preserve the regression coverage; assess production rollout only through a separately approved release gate.
- Verification target: Injected failure and real security-rule rejection preserve both records; retry commits both and preserves water/sleep fields.
- Revisit trigger: Changes to account loading, settings publication, check-in persistence, or browser QA ownership.
- Date closed: Merged 2026-10-22; not closed for release because no deployment occurred.

### BUG-035 Onboarding and check-in accept invalid numeric input

- Date opened: 2026-10-02
- Status: Verify (merged in PR4 on 2026-10-22 and locally verified; release verification pending)
- Severity: P2 Important
- Workflow/page: Onboarding and weight check-in
- Expected: Invalid weights/targets show a visible error; decimal weights survive setup.
- Actual: Reproduced before repair. Negative weights and blank targets could advance; parseInt truncated decimal measurements. Zero check-in weight could partially update the profile.
- User impact: Users could lose precision or encounter avoidable server rejections.
- Evidence: `docs/qa-ledger.md`, 2026-10-02 Core recovery; `tests/e2e/core-settings-recovery.spec.ts`; [PR4](https://github.com/sararh95/VioMacro/pull/4).
- Suspected area: src/features/auth/OnboardingWizard.tsx; src/features/dashboard/components/CheckInModal.tsx
- Next action: Preserve the regression coverage; assess production rollout only through a separately approved release gate.
- Verification target: Negative/zero/out-of-range weights and empty calories are rejected in place; 73.4/68.2 remain decimal after reload; phone-width controls remain usable.
- Revisit trigger: Changes to account loading, settings publication, check-in persistence, or browser QA ownership.
- Date closed: Merged 2026-10-22; not closed for release because no deployment occurred.

### BUG-036 Browser QA reloads itself and can test another app

- Date opened: 2026-10-02
- Status: Verify (merged in PR4 on 2026-10-22 and locally verified; release verification pending)
- Severity: P2 Important
- Workflow/page: Local browser verification
- Expected: QA owns its preview server and evidence files cannot reload or crash the app.
- Actual: Reproduced before repair. Vite watched generated Playwright HTML/traces and crashed on a Windows EBUSY lock. Preview config reused another app already listening on its default port. Shared check-in history and a premature onboarding wait also made tests depend on prior runs.
- User impact: False failures and unintended navigation to an unrelated local app undermined verification.
- Evidence: `docs/qa-ledger.md`, 2026-10-02 Core recovery; `tests/e2e/core-settings-recovery.spec.ts`; [PR4](https://github.com/sararh95/VioMacro/pull/4).
- Suspected area: vite.config.ts; playwright*.config.ts; tests/e2e/emulator-auth.spec.ts; tests/e2e/prod-emulator-auth.spec.ts
- Next action: Preserve the regression coverage; assess production rollout only through a separately approved release gate.
- Verification target: Ignore _local watcher events; strict owned preview on configurable port; disposable check-in fixtures; wait for the active onboarding step to disappear after commit.
- Revisit trigger: Changes to account loading, settings publication, check-in persistence, or browser QA ownership.
- Date closed: Merged 2026-10-22; not closed for release because no deployment occurred.

### BUG-037 Mobile email sign-in loads a blocked Google popup script

- Date opened: 2026-10-02
- Status: Verify (CSP correction merged in PR5 on 2026-10-22; release verification pending)
- Severity: P2 Important
- Workflow/page: Signed-out authentication and protected-route redirects on mobile browsers
- Expected: Firebase Auth's mobile loader and reCAPTCHA requests comply with the approved CSP, with no enforced CSP failures.
- Actual: The October 2 mobile smoke failures came from Firebase Auth loading apis.google.com/js/api.js. Probes also confirmed reCAPTCHA's www.google.com connection and GAPI's apis.google.com telemetry connection. PR5 permits those exact origins; no wildcard was added. Source frame-src is unchanged, and only emulator builds/dev receive configured Auth loopback frames.
- Evidence: [PR5](https://github.com/sararh95/VioMacro/pull/5), merged through [PR3](https://github.com/sararh95/VioMacro/pull/3); 2026-10-22 combined verification in the QA ledger; tests/unit/no-external-hosts.test.ts and tests/unit/csp-build.test.ts.
- Suspected area: index.html CSP and vite.config.ts build transform.
- Next action: Preserve the exact-origin and emitted-build regressions. Production rollout requires a separately approved release gate.
- Verification target: Completed locally with PR4: public 18/18 including mobile-chrome, authenticated emulator 81/81 and production-build emulator 4/4 cleanly. No console filter or assertion was weakened; production frame-src excludes loopback hosts.
- Revisit trigger: Firebase Auth, reCAPTCHA, CSP or emulator-mode initialization changes.
- Date closed: Merged 2026-10-22; not closed for release because no deployment occurred.

### VM-040 Generated recipe fallback loses its gradient

- ID: VM-040
- Date opened: 2026-10-26
- Status: Closed ([PR19](https://github.com/sararh95/VioMacro/pull/19), merge c3768e05c2c5085af894cd1694a341c18443b49c)
- Severity: P3
- Workflow/page: Shared recipe fallback visuals
- Expected: The generated fallback's gradient and hue variation are valid CSS.
- Actual: recipeTint appends `; filter: hue-rotate(...)` to the value assigned to React's single background property; the browser rejects that property. Existing library fallback on unfixed main has style:null, computed backgroundImage:none and filter:none.
- User impact: The fallback initial remains visible but the intended generated gradient is absent.
- Evidence: Historical `_local/qa/fix-loop-2026-10-22/g3/unfixed-shared-tint-baseline.json` / `unfixed-shared-tint-visible.png`, Chrome390 on b697594. Fresh G9 actual Chrome1440/390 on21a7905 reproduces shared RecipeThumb AND direct MealCard missing computed gradient/filter, all routed shared callers; healthy images and own saved data unchanged. `g9/unfixed-chrome/report.md`,16exactPNGs/CSSOM/DOM/readbacks; diagnostic and fixture limits retained.
- Suspected area: src/shared/visuals.ts:60–66; src/features/recipes/components/RecipeThumb.tsx:37 and src/features/meal-planning/MealPlanner.tsx:1714/1737
- Classification: Pre-existing on main, separate nonblocking visual root; final follow-up group G9.
- Next action: Preserve shared-property/client-CSSOM regressions and existing image/data behavior. Meaningful unit RED2PASS6FAIL/client2FAIL preceded source iteration1; unit8/client2+infra4/fullcheck232/125/public18/fresh149+infra4/built4 and authoractualChrome35PNG PASS. CI40590980765green on369be12; fresh R1APPROVE6455332509 source-onlynegative/restoredtests and R2APPROVE6456047874 owncheck/actualChrome1440/390/50assertions pass. ActualAPIbodies/integrityproof audited, merge tree/two-parent/ancestry verified onmainc3768e0; bothG9refs removed. ExistingmainP2decodefallback VM042/G10 remains separate; VM035/041 observations retain laterassignments/diagnosticlimits. No deploy/liveAI/data-rule change.
- Verification target: Pure helper/style regression and actual fallback computed gradient at desktop390.
- Revisit trigger: Shared fallback styling or recipe-image rendering changes.
- Date closed: 2026-10-27

### VM-041 Local QA observes fallback favicon 404 requests

- ID: VM-041
- Date opened: 2026-10-26
- Status: Open — G23 owner investigation after reobservation in G8 fresh Reviewer2; historical G6 Cannot reproduce result retained
- Severity: P3
- Workflow/page: Local Chrome QA resource logging
- Expected: Explain and eliminate spurious favicon failures at their actual owner.
- Actual: Two network Log errors request /favicon.ico although the app declares /vite.svg. Identical errors exist in approved G2/main evidence; no app exception or image-policy CSP failure accompanies them.
- User impact: Console noise in local QA; no demonstrated broken app control.
- Evidence: g3/chrome-final/mobile-console-final.json; same-main g2/reviewer2-37f700c/foreground-desktop-console.json under _local/qa/fix-loop-2026-10-22/.
- Suspected area: Browser/QA fallback favicon request; app owner not established.
- Classification: Historical same-main observations plus current source parity; no G3/G8 product regression established. Owner remains unproved, final follow-up G23.
- Next action: G23 should compare normal Chrome and QA instrumentation, request initiator and icon DOM before any product workaround. Do not suppress errors or add assets without proving the owner.
- Verification target: Bounded resource/console provenance on main and candidate.
- Revisit trigger: New retained resource evidence, now G23 after the other final follow-ups.
- Date closed:

- G6 result: Actual ordinary Chrome requested /vite.svg with200 and no /favicon.ico404 in retained windows. Codex badge rewrites icon DOM; historical404 owner remains unproved. `_local/qa/fix-loop-2026-10-22/g6/unfixed-browser/report.md` and resources. No product workaround/filter added.

- G8 reobservation2026-10-27: fresh [Reviewer2](https://github.com/sararh95/VioMacro/pull/18#issuecomment-6452056002) actual Chrome1440/390 retained Log/Network records, including repeated localhost favicon.ico404s. `reviewer2-c7fc08a/review.md`, `diagnostic-audit.json` and raw windows under the G8 evidence folder. Report totals54Log entries (52favicon errors/2verboseDOM recommendations) are retained-event counts, not a claim of52unique requests. index.html/public assets match immutable main35d2e2a; main Chrome was not rerun. P3/nonblocking under Sara's updated rule; no G8 source fix or proven app owner. Preserve separate probe/truncated-window qualifications.
- G14 unfixed reobservation2026-10-30: actual Chrome on unchanged mainb040 at1440/390 retained seven `/favicon.ico`404 responses plus corresponding Log error entries across five consecutive complete diagnostic windows (809 selected events, zero Runtime exceptions/loadingFailed). G14 own synthetic account/core Grocery controls and reload persisted correctly apart from VM047 wording. Evidence `g14/unfixed-chrome/diagnostics-*.json`, `report.md` and `g14/parent-unfixed-audit.json`. This is actual current-main observation, not just source parity; origin/initiator remains unproved. Keep P3/G23, no workaround/error filter or widened G14 fix.
- G9 reobservation: fresh [PR19 Reviewer2](https://github.com/sararh95/VioMacro/pull/19#issuecomment-6456047874) records two implicitfavicon.ico404s in fresh mobile diagnostic windows, no visible routebreakage. index/assets unchanged versus immutable21a7905 SOURCEONLY; no mainChrome comparison or proven app owner. P3/nonblocking; keep G23. Aggregate earlytruncation records remain qualified separately from eight final complete bounded windows, no continuouslossless networkclaim.

### VM-042 Permitted recipe image decode failure lacks fallback

- ID: VM-042
- Date opened: 2026-10-26
- Status: Closed ([PR20](https://github.com/sararh95/VioMacro/pull/20), merge5b97627d7ed7b4e264c834eb8457490ad9353f0c)
- G10 verification progress (2026-10-28): sourceattempt2 focused12+infra4/fullcheck232frontend125Functions/public18/fresh161+infra4/built4 PASS; actualnpmcommands exit0, exact143-input freeze/originalE2E/assertions preserved. ActualChrome1440/390 originalrepros/six mounted shared readers/eleven CSS panels/form recovery/core4controls+reloads PASS. Report213files/39PNGs, independent integrity audit and data equality/preservation/cleanup receipts in g10/fixed-chrome-attempt2 and g10/parent-fixed-chrome-proof-audit.md/json. VM035 timeouts/Retry and VM041 favicon errors, diagnostic/crop/runner-classifier limits remain qualified. Latest CURRENT17-file after-fixed export verified before normal cleanup/runtime off. CI/freshreviews pending, noPR/closureyet.
- Severity: P2 (fresh PR19 Reviewer1 runtime classification; originally logged P3)
- Workflow/page: Shared recipe thumbnails and their image readers
- Expected: A permitted image URL that cannot decode falls back to the existing accessible recipe stand-in, and a later valid URL recovers.
- Actual: RecipeThumb renders an img solely from URL policy and has no runtime image-error fallback. The independent base/head probe with /review-missing-image.png completes with zero natural width and no fallback. A later valid image recovers on G3; this entry concerns the failed-image state itself.
- User impact: Missing or broken permitted images leave an empty/broken image surface.
- Evidence: [PR13 Reviewer1](https://github.com/sararh95/VioMacro/pull/13#issuecomment-6427561907); _local/qa/fix-loop-2026-10-22/g3/reviewer1-fresh-retry/base-edges.json and head-edges.json, kind thumb and /review-missing-image.png. Same behavior independently observed on unchanged b697594 main and G3 candidate.
- G9 additional evidence: [PR19 fresh Reviewer1](https://github.com/sararh95/VioMacro/pull/19#issuecomment-6455332509) independently fulfilled a loopback permitted image with404 on immutable21a7905, candidate369be12 and restoredsource; all have complete img/naturalWidth0/no fallback at1440/390. Own candidate/base/restored-edge-results.json under g9/reviewer1-369be12. P2/nonblocking under Sara's rule because runtimeidentical onmain and outside VM040's seeded-no-photo styling fix; retain G10 assignment, no new ID or G9 code change.
- Suspected area: src/features/recipes/components/RecipeThumb.tsx:29.
- Classification: Existing shared-thumbnail lifecycle defect, originallyP3 and now independently ratedP2; nonblocking for G3/G9 under Sara's review rule. Separate final group G10, after G9.
- G10 fresh evidence (2026-10-28): actualChrome1440/390 admitted200/image-png badbytes/nativecomplete+zerowidth+decodeEncodingError with no fallback across6mountedsharedreaders; healthy32px/absent/blocked/newURLcontrols preserved. Separate CSSMealCard11panels independently reproduce URL/noinitialgradient using actualpanel/resource/separateImageprobe evidence. FullcanonicalownSDKpayload/URLs/assets unchanged after read-only/canceledUI and core4reloads. Source142/sixcopies exactafterUI/beforetestwriting. Report/207artifactmanifest and per-capture/diagnostic/mobilehelper limits under `_local/qa/fix-loop-2026-10-22/g10/unfixed-recovery-c376/`. NEW17-file currentexport verified before normalcleanup/servicesoff. No codefix/testpass/PRclosure claimed.
- Next action: Preserve native/CSS failure and recovery regressions plus URL/data policy. Exact6be1019 CI40830321630green, fresh R1APPROVE6490664898/R2APPROVE6500724898, own source-only negative/restored tests and own check/actualChrome1440/390/data proof audited. Strict merge5b97627 onmain has expected2parents/tree/headancestry; both G10refs removed after bundle backup. Current23-file export verified before normalcleanup/ownedservicesoff. VM057/G25 and VM058/G26 remain separate existing-main P2 follow-ups, with diagnostic/source-parity limits retained.
- Verification target: Accessible fallback after permitted image decode failure, followed by successful image replacement at desktop and390px across existing callers.
- Revisit trigger: Final follow-ups after G9.
- Date closed: 2026-10-29

### VM-043 Local emulator warning overlaps phone cooking controls

- ID: VM-043
- Date opened: 2026-10-26
- Status: Closed ([PR14](https://github.com/sararh95/VioMacro/pull/14), merge `4f760fc936b4e5edb534227439eea3d132e96776`)
- Severity: P2 (confirmed G4 layout/operability evidence)
- Workflow/page: Guided Cooking at390px in local emulator mode
- Expected: The emulator safety warning remains visible without covering active cooking navigation.
- Actual: Fixed Auth-emulator warning y794-844 covers50px of lower64px cooking controls at390x844. Ordinary Next Step center click did not advance; thin upper area is a workaround. Existing main layout, no G3 regression.
- User impact: Local QA controls are partially obscured; no production behavior or data defect established.
- Evidence: PR13 Reviewer2 comment6428801293; current G4 original phone-cooking-footer-overlap screenshot/JSON under _local/qa/fix-loop-2026-10-22/g4/unfixed; source106303a, exact warning/button bounds.
- Suspected area: src/services/firebase/firebase.ts:53 connectAuthEmulator default warning, and GuidedCooking fixed viewport/footer layout. Exact minimal CSS owner requires G4 baseline bounds.
- Classification: Existing local layout edge, nonblocking G3; closest planned responsive-layout group G4.
- Next action: Preserve merged regression and Chrome evidence; existing follow-up defects retain their separate groups.
- Verification target:390px cooking controls and safety warning both visible/operable, plus desktop and ordinary route layout preservation.
- Revisit trigger: G4 layout reproduction.
- Fix PR: [#14](https://github.com/sararh95/VioMacro/pull/14); merged2026-10-27 with both current-head reviewer comments APPROVE.
- Date closed: 2026-10-27 — merge 4f760fc936b4e5edb534227439eea3d132e96776; no deployment.

### VM-044 Planner target inputs have no programmatic labels

- ID: VM-044
- Date opened: 2026-10-26
- Status: Closed ([PR #21](https://github.com/sararh95/VioMacro/pull/21), merged 2026-10-30)
- Severity: P3
- Workflow/page: Plan Settings dialog
- Expected: Daily Calories, Protein, Carbs and Fat target inputs expose their visible field labels to assistive technology.
- Actual: Four current target spinbuttons have empty id, no associated labels and no aria-label; accessible state presents their numeric values without purpose names.
- User impact: Screen reader users cannot identify the target fields reliably.
- Evidence: _local/qa/fix-loop-2026-10-22/g4/unfixed/phone-plan-settings-icon-and-fields.json and screenshot on unchanged106303a, fields array and actual accessible snapshot.
- Suspected area: src/features/meal-planning/components/PlanSettingsModal.tsx target input markup.
- Classification: Existing unassociated input-label edge case, distinct from G4 icon naming. Record for later G11; do not widen current G4 source changes.
- Next action: Closed; reopen only if native label/focus or existing persistence controls regress.
- Verification target: All four existing target controls reachable by their visible purpose labels, value/draft/save round-trip unchanged.
- Revisit trigger: Final follow-ups after G10.
- Fix PR: [#21](https://github.com/sararh95/VioMacro/pull/21); merge3638798fa66e2904800f9613e05a633778907a3d, current CI green, fresh [R1 APPROVE](https://github.com/sararh95/VioMacro/pull/21#issuecomment-6524238905) and [R2 APPROVE](https://github.com/sararh95/VioMacro/pull/21#issuecomment-6525013312).
- Verification: Six append-only real-browser regressions fail with only base App source restored and pass at the reviewed head; actual Chrome desktop/390 native focus/names and normal save/reload proof under `_local/qa/fix-loop-2026-10-22/g11/fixed-chrome-source1/` and `g11/reviewer2-accea7d/`. See review comments/log for bounded diagnostic, snapshot and image limits.
- Date closed: 2026-10-30 — merged on main; no deployment.

### VM-045 Pantry multi-batch failure reports that nothing was added

- ID: VM-045
- Date opened: 2026-10-27
- Status: Deferred (final follow-ups G12; Pantry BUG-004 scope)
- Severity: P2
- Workflow/page: Pantry prototype Quick Add, more than400 entries
- Expected: A write failure reports the actual saved state, so retry does not duplicate already committed entries.
- Actual: For401 entries, a mocked second batch commit failure leaves the first400 committed while the page says "Nothing was added, so you can try again."
- User impact: Misleading failure feedback can lead to duplicate prototype inventory entries on retry; no existing record deletion or cross-account access was observed.
- Repro: Invoke actual addPantryItems with401 synthetic entries, allow first400-write batch, reject second commit, inspect saved count and current Pantry catch message.
- Main comparison: Fresh G4 Reviewer1 executed the same isolated mock on base106303adc7c2dad1730446163ac93355fa9b5162 and heada9607a4463ddd2c6c3bc6d234a71bef6baafb724. Both commit400 then throw; pantryService bytes identical SHA2561c62bcbb90b726d6a37b9438a8e5da582d81e90530c43b51e4494ab1481bc7e8. No Firebase initialization or writes in this probe.
- Evidence: `_local/qa/fix-loop-2026-10-22/g4/reviewer1-a9607a4/nonblocking-pantry-partial.json`; [PR14 Reviewer1 comment](https://github.com/sararh95/VioMacro/pull/14#issuecomment-6431949181).
- Suspected area: src/features/pantry/pantryService.ts:53-64 chunked commits; src/features/pantry/Pantry.ts:97 unconditional no-write error copy.
- Assigned group: G12 final follow-ups; deferred triage only in this loop.
- Classification: Existing-main P2, no G4 regression and outside VM-013 blank validation. Sara explicitly defers Pantry Coming Soon features (BUG-004) except VM-013; do not expand G4 or implement this deferred prototype behavior here.
- Next action: Retain evidence. Reopen with separately authorized Pantry stabilization; add a partial-commit failure regression and report/resolve saved state without weakening batch limits.
- Verification target: First-batch success plus later failure, honest saved count/retry and no duplicated original entries, once this Pantry scope is reopened.
- Revisit trigger: Explicit reopening of deferred Pantry BUG-004 work.
- Date closed:

### VM-046 Planner strategy toolbar shifts phone content sideways

- ID: VM-046
- Date opened: 2026-10-27
- Status: Closed ([PR22](https://github.com/sararh95/VioMacro/pull/22), merge `b040f7f1957035448df1967203810e686c3ca335`)
- Severity: P2
- Workflow/page: Meal Planner saved-week strategy toolbar at390x844
- Expected: Batch selection and toolbar toggles keep the shared content scroller horizontally aligned; intentional weekly scrolling stays within the week view.
- Actual: Batch Cook -> Select Meal -> Lunch -> close picker -> toggle Batch Cook off leaves the outer content scroller scrollLeft44, with the week header left-11. The toolbar's wide row can shift the whole header/macros left. At scrollLeft0, G4's repaired header and units fit correctly.
- User impact: Part of the phone planner content is clipped after an ordinary batch-selection sequence; resetting horizontal scroll is a workaround.
- Repro: At390px with a saved plan, perform the sequence above and inspect the outer AppLayout content scrollLeft and header position.
- Main comparison: Fresh G4 Reviewer2 independently reproduced the same scrollLeft44/header-left-11 on exact106303adc7c2dad1730446163ac93355fa9b5162 source and the G4 head. All base src bytes verified; an ignored index wrapper only changes module URL/history for that source-only browser control. Toolbar/scroller code is unchanged. No data written by this comparison.
- Evidence: `_local/qa/fix-loop-2026-10-22/g4/reviewer2-a9607a4/base-main-phone-after-batch-offset.json` and `.jpg`, `base-source-provenance.json`, and head phone bounds/screenshots in the same folder; [PR14 Reviewer2 comment](https://github.com/sararh95/VioMacro/pull/14#issuecomment-6432442196).
- Root cause: src/features/meal-planning/MealPlanner.tsx:1097 toolbar row, :1118 strategy row and :1398 shared view/date row do not wrap. Their intrinsic width overflows the shared AppLayout scroller at:241; the intentional week scroller is separate.
- Assigned group: G13 final follow-ups after G11/G12 disposition.
- Classification: Existing-main P2, distinct root from G4 top action-container/macro intrinsic-width fixes. Nonblocking for G4 under Sara's review rule; do not expand current PR.
- Current G13 proof: Actual main363 Chrome repeats outer0→44/header33→-11; evidence `g13/unfixed-chrome-main363/`. Six appended real regressions give four narrow failures on original App source and six passes after three wrapping classes. Existing test prefix and all handlers/data paths remain unchanged. Full check and public smoke pass; full fresh/built/Chrome/review gates remain pending.
- Closure: Actual desktop390Chrome/core4/reloads, failure-first/restored tests and CI556PASS complete; both current-head fresh reviewers APPROVE. Exact merge parents/tree/ancestry and branch bundle/deletion verified. Local two original failures remain qualified in the QA log; no deployment claim.
- Verification target: Normal batch selection/toggle and keyboard/offscreen week interactions leave outer scrollLeft0; all strategy actions and weekly scrolling remain usable at390px and desktop, with save/reload intact.
- Revisit trigger: Final follow-ups G13.
- Date closed: 2026-10-30

### VM-047 Grocery amount uses a plural unit for a single item

- ID: VM-047
- Date opened: 2026-10-27
- Status: Closed (G14, merged PR [#23](https://github.com/sararh95/VioMacro/pull/23), main80a8f6ba3470330d25d7d5107a4b5a354526fb07)
- Severity: P3
- Workflow/page: Grocery saved item amount
- Expected: Quantity1 uses readable singular unit copy, for example1cup; other amounts retain appropriate units.
- Actual: A generated quantity1 canonicalcups item renders "1 cups" after reload.
- User impact: Minor amount-label grammar; stored quantity, checked/manual preservation and aggregation remain correct.
- Repro: Generate two planned portions from a four-serving2cup recipe; open Grocery/reload and read the amount.
- Main comparison: At G5 discovery both display owners matched main4f760fc (actual git show/SHA256 proof retained). G14 actual Chrome on unchanged mainb040 reproduces the original1cups result at desktop/390; candidate native generation/reload displays1cup with the same numericquantity1/canonicalunitcups. This is a pre-existing display-copy defect, not a G5 regression.
- Evidence: `_local/qa/fix-loop-2026-10-22/g5/fixed/390-grocery-reloaded.txt` and `.jpg`, `1440-grocery-final.txt` and `.jpg`, authenticated final-parent snapshot and parent-proof-index.json.
- Confirmed root on mainb040: src/shared/ingredients.ts:201-202 appends the canonical saved unit verbatim; sole Grocery row caller src/features/groceries/ShoppingList.tsx:237. Current formatter is at ingredients.ts:209-221.
- G14 verification2026-10-30: six new formatter cases/two actual emulator workflows; valid pre-fix failures and final43ingredientunit/238App+125Functions/public18/infra4+fresh175/built4 allPASS,145inputs unchanged. Actual Chrome1440/390 original generation/check/reload and manualcup/plural/package values retain numeric quantities/canonical units/manualchecks/profile/recipe/plan data. Evidence g14/parent-final-gates-audit.json, fixed-chrome/report.md, parent-fixed-chrome-audit.json and screenshot paths in PR23 under _local/qa/fix-loop-2026-10-22/. Favicon/tooling/history/warning qualifications remain explicit under VM041/066/052; no globalcleanclaim.
- Assigned group: G14 final follow-ups after G13.
- Classification: Existing-main P3 display-copy issue, separate from G5 request/response identity contract. Do not change quantities or persist a new unit schema.
- Next action: Preserve merged G14 evidence and final whole-loop QA; the separate near-rounding display edge remains VM067/G33.
- Verification target: Singular1cup and plural2cups render correctly without changing stored quantities/units or checked state.
- Revisit trigger: G14 after G13.
- Closure: CI564PASS/local564PASS, actual author and fresh independent desktop390Chrome, fresh R1APPROVE6534416077/R2APPROVE6534922455 on exact197; two-parent/tree/ancestry verified. Diagnostic/fixture/control limits preserved in G14 log; existing-main rounding edge is separate VM067/G33. Both G14refs deleted after verified fullhistorybundle. No deployment.
- Date closed: 2026-10-30

### VM-048 Phone wizard clips the Breakfast batch label

- ID: VM-048
- Date opened: 2026-10-27
- Status: Closed (PR #24 merged 2026-11-05)
- Severity: P3
- Workflow/page: Meal Planner week wizard at390x844
- Expected: Each existing batch option label fits inside its own button.
- Actual: The four-column batch grid clips or overlaps the end of BREAKFAST beside LUNCH at390px.
- User impact: One option label is partly obscured; the button retains its accessible name and selection behavior.
- Repro: Open Create Your Week Plan at390px and inspect the None/Breakfast/Lunch/Dinner grid.
- Main comparison: Fresh G5 Reviewer1 independently reproduced on base4f760fc and restored2460134. PlanGenerationWizard component blob is identical; parent verified the blob equality and inspected both saved phone screenshots.
- Evidence: `_local/qa/fix-loop-2026-10-22/g5/reviewer1-2460134/baseline-e2e-results/emulator-auth-G5-mocked-pl-19e2b-load-and-groceries-at-390px-reviewer1-chromium/test-failed-1.png` and `paused-final-e2e-results/reviewer1-paused-smoke-Rev-939e6-reload-no-callable-at-390px-reviewer1-chromium/paused-plan-390.png`; [PR15 Reviewer1](https://github.com/sararh95/VioMacro/pull/15#issuecomment-6433643956).
- Suspected area: src/features/meal-planning/components/PlanGenerationWizard.tsx:71 four-column batch grid and labels.
- Assigned group: G15 final follow-ups after G14.
- Classification: Existing-main P3 layout edge, no G5 regression or claimed contract-fix miss. Separate component/root from G13 strategy toolbar scrolling.
- Current-main G15 reproduction2026-10-30: both empty/populated openers at390 reproduce71.21875px Breakfast inside56.5px button; desktop97px controlsfit. Allfourchoice/focus/data/reload controls preserved; parent126payloads/55completewindows/fourdataexact snapshots/currentpixels verified. Evidence g15/parent-unfixed-audit.json and workspace-parent _local/qa/fix-loop-2026-10-22/g15/unfixed-chrome/; failures/console/cleanup qualifications retained.
- Next action: Keep PR24/head5f9aee8 unmerged. After human recovery/new turn, resume ONLY same R2 actual Chrome proof with NEW runtime phase/latest061358Z export; required desktop/390/both callers/core/data evidence and R2 approval remain missing. Preserve passed CI572/R1/owncheck/author proof; no head change, source repair, extra push or suite replay for this tool blocker.
- Verification target: All option labels readable at390px, named selection behavior unchanged, no outer-page clipping.
- Revisit trigger: G15 after G14.
- Date closed:

### VM-049 Grocery count reload assertion races page readiness

- ID: VM-049
- Date opened: 2026-10-27
- Status: Needs Evidence (final follow-ups group G17)
- Severity: P3
- Workflow/page: Emulator E2E Grocery category count afterreload
- Expected: The existing one/two/one persisted count assertion executes after the saved page is ready and remains deterministic without weakening assertions/timeouts/retries.
- Actual: CI570db88 first desktop attempt cannot find Other count locator within existing750ms afterreload; firstretrypasses. Suite exits0with130passed/1flaky, not131first-attemptpasses.
- Repro: Run authenticated suite in fresh CI; G4 VM025 category count follows one two one persisted items at1440px, emulator-auth.spec.ts:3920/3935. Deterministic focused reproduction still needed.
- Main comparison: Exact entire test callback is byte-equivalent after line-ending normalization on immutable maina8dc25b and570db88; Appsource unchanged. Main runtime was not rerun, so same-runtime flake is not claimed.
- Evidence: _local/qa/fix-loop-2026-10-22/g6/ci-40477859554-browser-job.log and ci-40477859554-success.json; public18/infrastructure4/emulator130+1flaky/built4 all exit0.
- Suspected area: Existing fixed750ms count assertion after page.reload without a page-ready assertion; root cause remains a timing hypothesis.
- Assigned group: G17 final follow-ups after G16.
- Classification: Pre-existing test timing assumption, no changed App behavior or proved G6 regression; do not widen G6 or claim VM025 copy is wrong.
- Next action: Reproduce deterministically; add failing readiness regression before a narrow harness repair. Keep original count/data checks and timeouts/retries.
- Verification target: Fresh-run/reload count and document-preservation assertions pass without flaky retry.
- Date closed:

### VM-050 Guided timer loses countdown phase after delayed rendering

- ID: VM-050
- Date opened: 2026-10-27
- Status: Closed ([#17](https://github.com/sararh95/VioMacro/pull/17), merged35d2e2aff07fa0947fc6c7cde3e482da67778aef)
- Severity: P2
- Workflow/page: Guided Cooking countdown, captured through Meal Planner at1440px and390px.
- Expected: A running timer retains its one-second interval until Pause, Reset, step change or exit; rendering a tick should not restart its interval phase.
- Actual: The effect depends on timeLeft. After the first tick at+1000ms, delayed effect cleanup clears the interval and registers another at+1400ms. Its next tick is due at+2400ms, so uninterrupted2000ms advancement displays01:59 instead of01:58.
- User impact: Countdown can run slowly when rendering/effect cleanup is delayed. The captured reproduction uses Playwright's clock; a quantified real-time Chrome drift measurement has not been performed.
- Repro: Run all G7 emulator regressions, Planner timer lifecycle at either width. Finish, re-enter cooking, Start and runFor2000ms. Existing exact01:58 assertion fails at emulator-auth.spec.ts:4874. Two unchanged focused runs and the full diagnostic reproduce both Planner widths; isolated1440px probes pass.
- Main comparison: Owning timer effect is byte-identical after newline normalization on origin/main35c5185 and G7 source iteration1, SHA256cd31c67ff06e603985569ced566c23e7cd5f45792fbd68caef39babc7bd713cf. Main runtime was not rerun; same-runtime main behavior is not claimed.
- Evidence: `_local/qa/fix-loop-2026-10-22/g7/focused-1793098315-result.json`, `focused-1793099573-result.json`, `clock-diagnosis/full-probe-1793099913-result.json` and full-probe event buffers; `clock-diagnosis/confirmed-root.json` records source equality and restored test SHA.
- Root: src/features/recipes/components/GuidedCooking.tsx:46–60, timeLeft-dependent interval recreation.
- Assigned group: G7 by Sara's explicit2026-10-27 narrow exception; G18 no longer needs a separate PR for this bug.
- Classification: Existing source defect exposed by new lifecycle coverage; no evidence of a G7 interval-logic regression. Original continuous2000ms assertion, all other assertions, timeouts and retries remain unchanged.
- Next action: None for this G7 fix; retain regressions and evidence.
- Verification target: Existing continuous-countdown regressions pass through both callers/widths; Pause/Reset/step change/Finish/Exit still stop timers, and stored durations remain unchanged.
- Date closed: 2026-10-27

- Merged verification: source iteration2 check201frontend/125mockedFunctions, public18, fresh143, built4; CI40530516578green; author+freshR2actualChrome desktop390/reloads/savedvalues; fresh R1APPROVE6446909133/R2APPROVE6447608970. Exact reviewed5d08b5d tree/ancestry verified onmain35d2e2a; full verdicts/proof in runninglog/QAledger.

### VM-051 Full Recipe button has faint desktop text

- ID: VM-051
- Date opened: 2026-10-27
- Status: Open (final follow-ups group G19)
- Severity: P3
- Workflow/page: Guided Cooking desktop Full Recipe button.
- Expected: Its active label is readily readable against the button background.
- Actual: Computed white text on backgroundoklch(0.929 0.013 255.508) measures about1.232:1 contrast at14px/700weight. The button works but looks faint.
- Repro: At1440x1000, open any timed recipe in Guided Cooking and inspect Full Recipe.
- Main comparison: Full Recipe CSS classes exactly match origin/main35c5185; stylesheet and shell are unchanged. This is a source-backed existing style issue; main runtime was not rerun.
- Evidence: `_local/qa/fix-loop-2026-10-22/g7/fixed-chrome-iteration1/desktop-full-recipe-contrast-observation.png` and matchingJSON; `proof-index.json` mainClassComparison. The initial genericRGB parsing error was corrected using explicitOKLCH-to-linear-sRGB conversion before the final report.
- Root area: src/features/recipes/components/GuidedCooking.tsx:108, light background with inherited white text.
- Assigned group: G19 final follow-ups after G18; do not change G7 style scope.
- Classification: Existing P3 visual issue, no G7 regression or Full Recipe callback-fix miss.
- Next action: Reproduce, add an actual computed-style/contrast regression, repair the button colors and preserve its responsive visibility and return behavior.
- Date closed:

### VM-052 Emulator warning overlaps desktop sidebar footer

- ID: VM-052
- Date opened: 2026-10-27
- Status: Open (final follow-ups group G20)
- Severity: P3
- Workflow/page: Desktop app shell footer in local emulator mode.
- Expected: Profile and sign-out controls remain entirely above the visible Auth-emulator safety warning.
- Actual: At1440x1000 the warning beginsy974; profile bottomy984 and sign-out bottomy978 overlap it by10px/4px. Centers remain clickable and sign-out succeeds.
- Repro: Sign in with emulator data, load Dashboard at1440x1000 and inspect the sidebar footer against the fixed warning. Verify other shell routes and390px when repairing.
- Main comparison: AppLayout.tsx blob0cf74503fb4e63c628ef7a2b9519bcf607f7645c equals origin/main35c5185. No G7 shell, CSS, Firebase SDK or warning changes; main runtime not rerun.
- Evidence: `_local/qa/fix-loop-2026-10-22/g7/fixed-chrome-iteration1/desktop-shell-footer-geometry.json`, core-dashboard-1440 screenshots and proof-index.json shellFooterObservation. Cooking/empty return/Finish controls have no warning overlap.
- G14 author observation2026-10-30: final lower390Grocery frame has last sentinel row content under the same fixed emulator warning; checkbox ends at banner boundary795 and all8checked values persist. No whole-row-unobscured claim. `g14/fixed-chrome/390-grocery-manual-reloaded-lower.jpg` and report; parent pixels inspected. Treat this as additional shell-warning evidence for G20, with actual main runtime comparison for this lower-list frame not repeated; no G14 layout/source change.
- Root area: src/app/AppLayout.tsx:150,185 full-height shell/footer does not reserve the warning height; separate owner from fixed VM043 cooking layout.
- Assigned group: G20 final follow-ups after G19.
- Classification: Existing local-only P3 layout issue; no G7 regression and no production/data defect established. No global no-clipping claim for G7 evidence.
- Next action: Add a real-warning geometry regression, reserve its actual height in the shell and retain the warning and all controls.
- Date closed:

### VM-053 Legacy untick persistence test reloads before acknowledgment

- ID: VM-053
- Date opened: 2026-10-27
- Status: Closed ([#17](https://github.com/sararh95/VioMacro/pull/17), merged35d2e2aff07fa0947fc6c7cde3e482da67778aef)
- Severity: P3 (test synchronization)
- Workflow/page: Existing AUD022 legacy meal-status emulator test, not a new application behavior.
- Expected: Verify legacy-map hydration after the independently observed write completes, retaining the original reload/UI/exact map/legacy-array assertions.
- Actual: The test observes optimistic untick UI then reloads before updateDoc acknowledgment. It can unload an outstanding write and report the old tick instead of testing explicit-false hydration.
- Repro/evidence: CI40499228920 and40499383962 each fail initial+retry at oldspec3280. Controlled actual local Write/channel delay1500ms reproduces the missing postreload button: uncached Node reads lack mealStatus, reload aborts the request, old tick remains. Same-delay control adds exact persisted-false assertion then every original assertion passes. This confirms the controlled mechanism; missing historical CI artifacts prevent claiming the exact CI transport chronology.
- Main comparison: Original callback/helpers and all plan/store/Firebase owners equal main35c5185. No main browser runtime/exemption claim; current full/CI gates must pass.
- Root: tests/e2e/emulator-auth.spec.ts original3271–3280; immediate reload after optimistic UI, unlike adjacent persisted-map polling cases.
- Fix: Add one independent stored-false expect.poll assertion before the existing reload. No existing assertion, locator, timeout, retry, timer case or application code changed. All original bytes remain in order and the entire G7 appended helper/case block remains byte-identical.
- Regression: tests/unit/meal-status-persistence-order.test.ts executes the actual callback/helpers. Before correction immediate-commit controlPASS/delayed-commitFAIL; after correction2PASS/0skip. This is callback ordering proof, not an App transport simulation claim.
- Evidence paths: `_local/qa/fix-loop-2026-10-22/g7/aud022-write-diagnostic/report.md`, `aud022-order-{red,green}-result.json`, `aud022-sync-change.json`.
- Assigned group: G7 CI correction under loop step9 and Sara's remaining-CI investigation instruction. Application scope stays VM029/030/032/050.
- Verification target: Full fresh emulator143 and exact-head CI pass with all original assertions intact; fresh reviewers independently verify correction and negative control.
- Date closed: 2026-10-27

- Merged verification: source iteration2 check201frontend/125mockedFunctions, public18, fresh143, built4; CI40530516578green; author+freshR2actualChrome desktop390/reloads/savedvalues; fresh R1APPROVE6446909133/R2APPROVE6447608970. Exact reviewed5d08b5d tree/ancestry verified onmain35d2e2a; full verdicts/proof in runninglog/QAledger.

### VM-054 Optimistic meal edit can be lost on immediate reload while pending

- ID: VM-054
- Date opened: 2026-10-27
- Status: Partly fixed: a "not saved yet" note and a warning before leaving the page. A tick can still be lost if the page is closed anyway. The offline cache fix (PR #30) was held back; see that PR
- Severity: P2
- Workflow/page: Meal Planner meal tick during an unacknowledged write.
- Expected: The user can distinguish a pending edit from a durable saved tick, or the pending edit survives navigation/reload under the chosen persistence policy.
- Actual: Under a controlled1500ms local write delay, optimistic untick renders before server acknowledgment; immediate reload aborts the outstanding browser request and the previous persisted tick returns. No committed data is overwritten and the edit can be repeated; this is not irreversible data loss.
- Main comparison: MealPlanner/store/planService/Firebase memory-cache code is identical on main35c5185/current, outside G7's two component changes. Main runtime was not rerun; the actual controlled reproduction is on G7. No frequency claim for normal networks.
- Evidence: `g7/aud022-write-diagnostic/report.md` and event summaries show uncached independent reads, aborted target request, old UI after reload. VM053 repairs the test's hydration precondition; it does not repair this product edge.
- Root area: src/features/meal-planning/MealPlanner.tsx:842–848 optimistic state, src/app/providers/store.ts:335–373 async update, src/services/firebase/firebase.ts memory-cache policy.
- Assigned group: G21 after G20, separate application/pending-write root. No G7 product expansion.
- Next action: Reproduce as a dedicated user-flow case and resolve pending-feedback versus durable-queue behavior before any application change. Preserve existing ownership/security and do not turn the hydration test into an implicit persistence-policy decision.
- Verification target: Chosen pending/durable behavior works under controlled latency and reload through normal emulator clients, with no false saved-state indication.
- Date closed:

### VM-055 Zero-duration timer shows Pause after Start

- ID: VM-055
- Date opened: 2026-10-27
- Status: Open (source-only finding; runtime confirmation in final follow-ups G22)
- Severity: P3
- Workflow/page: Guided Cooking for a saved zero/absent instruction duration.
- Expected: The timer control accurately reflects whether a countdown can run at00:00.
- Actual: Source inspection shows Start unconditionally sets timerActive=true while the positive-time interval guard prevents an interval at00:00; the label/icon stays Pause. This is not a claim of a newly observed Chrome failure.
- Main comparison: The unconditional toggle and positive-time interval condition also exist on main35c5185. The current PR preserves this behavior; no separate main runtime reproduction was performed.
- Repro for G22: Open zero/absent-duration step, press Start, observe label/time atdesktop/390, then Pause/Reset/reload. Confirm actual runtime before implementation.
- Root: src/features/recipes/components/GuidedCooking.tsx:46,69,202, active-state toggle versus positive-duration eligibility.
- Evidence: fresh [Reviewer1 correctness comment](https://github.com/sararh95/VioMacro/pull/17#issuecomment-6446909133), report under `g7/reviewer1-5d08b5d/`; source-only/P3/nonblocking explicitly recorded.
- Assigned group: G22, after G21. Separate control-state root from G19contrast/G20shell geometry; no additional G7 code attempt.
- Verification target: Reproduce before fix; add behavior regression for zero/absent and positive controls; accurate labels with unchanged positive countdown and saved-data behavior.
- Date closed:

### VM-056 Infrastructure browser-launch failure leaves Vite resources open

- ID: VM-056
- Date opened: 2026-10-28
- Status: Open (final follow-ups group G24)
- Severity: P3
- Workflow/page: Local emulator test infrastructure, failure cleanup before application E2E starts.
- Expected: If the required test browser cannot launch, the infrastructure command reports the setup error, closes already acquired Vite resources and exits without manual process cleanup.
- Actual: All four existing infrastructure cases failed because the pinned Chromium executable was absent. Their Vite resources were acquired before browser launch, but cleanup try/finally began only after launch. The owned infrastructure child stayed alive until explicitly stopped after process/command/parent revalidation. No G10 test or Firebase emulator started in that attempt.
- Repro: With the required Playwright browser absent from the selected cache, run the infrastructure prefix. Observe browserType.launch failures and the nonexiting owned test child. Keep this local-only; inject a controlled launch failure for a future regression instead of removing an installed browser.
- Root: tests/infrastructure/emulator-qa-server.test.ts:55–60,82–85,112–115,136–139; resource acquisition and chromium.launch precede cleanup coverage.
- Main comparison: Observed on unchanged infrastructure source at G10 base/mainc3768e05, before any App fix; the new appended E2E cases were not reached. No separate checkout run is claimed.
- Evidence: `_local/qa/fix-loop-2026-10-22/g10/test-author/first-red-attempt-20261028/` classification.md, wrapper.log, owned-infra-cleanup.json and completion.json. Four launch failures/zeroG10cases/exit1 after owned-child cleanup. Installing the pinned browser in a new ignored project cache lets the second attempt's four infrastructure cases pass without source/config/assertion changes.
- Recurrence2026-10-30: fresh G35 R1 private workspace lacked pinned browser1228; same unchanged infrastructure launch-before-cleanup left only owned Node59356 alive before anyG35case. Root exact PID/parent/exe/command/CIM+nativebirth guard stopped it; esbuild exited. Initial failure preserved, private pinned browser repaired, actualRED/GREEN theninfra4PASS. This is the existing VM056/G24 root, no G35 source regression or new bug group. Evidence g35/reviewer1-setup-owned-stop.json and workspace-parent g35/reviewer1-d4d34cb/diagnostics.md.
- Assigned group: G24 after G23, narrow infrastructure resource-cleanup root. Do not widen G10 or replace/weaken existing assertions.
- Next action: Add a controlled browser-launch-failure regression, extend cleanup coverage around every acquired server/browser resource, then verify normal infrastructure and fresh emulator commands without changing test timeouts/retries or app behavior.
- Date closed:

### VM-057 Recipe draft preview retains saved macro family

- ID: VM-057
- Date opened: 2026-10-29
- Status: Open (final follow-ups group G25)
- Severity: P2
- Workflow/page: RecipeForm image preview while editing an existing recipe.
- Expected: Unsaved nutrition edits update the preview's generated macro-family tint while saved recipe data remains untouched until Save.
- Actual: RecipeForm passes editRecipe to RecipeThumb, so draft macro inputs do not reach the preview. Title/initial and seed changes appear, but the saved macro family remains until Save. Saved card/detail and reload show the new macros correctly.
- Repro/evidence: Fresh [PR20 Reviewer2](https://github.com/sararh95/VioMacro/pull/20#issuecomment-6500724898) observed the existing-edit preview at1440/390 using a failed permitted image and unsaved protein/carbs changes. Report and own proof under `_local/qa/fix-loop-2026-10-22/g10/reviewer2-6be1019/`. Main comparison is byte-identical owning caller on immutable c3768e05; no base runtime run claimed.
- Root: src/features/recipes/components/RecipeForm.tsx:502, macros={editRecipe ?? undefined} instead of current draft values.
- Classification: Existing caller-state defect, outside VM042 admitted-image failure/recovery. Nonblocking for G10 under Sara's existing-main P2/P3 rule. No source change in PR20.
- Assigned group: G25 after G24. Search all create/edit/import preview callers; new-draft behavior is a source candidate until reproduced.
- Next action: Fresh Chrome reproduction and failing actual draft-preview regression, then pass current draft macro values without changing persistence, image admission, upload or serving behavior.
- Date closed:

### VM-058 Functions lint reports success without matching source files

- ID: VM-058
- Date opened: 2026-10-29
- Status: Open (final follow-ups group G26)
- Severity: P2
- Workflow/page: Functions static-check infrastructure.
- Expected: The Functions lint command processes its intended source files; a passing check is supported by real coverage.
- Actual: The bare eslint invocation resolves the ancestor flat configuration, whose functions/** global ignore yields zero files and exit0. TypeScript builds and125 mocked Functions tests still execute; their success does not establish lint coverage.
- Repro/evidence: Fresh [PR20 Reviewer2](https://github.com/sararh95/VioMacro/pull/20#issuecomment-6500724898) own command/debug probe and functions-lint-coverage.* receipts. Both configurations match immutable c3768e05; base command not rerun. Earlier QA qualifications retained; this entry supplies explicit tracking.
- Root: functions/package.json:4 and eslint.config.js:9.
- Classification: Existing test-infrastructure gap; nonblocking for G10 because no Functions/config change is introduced. Separate from deferred BUG-010 dependency advisories.
- Assigned group: G26 after G25.
- Next action: Add a meaningful controlled lint-violation/coverage regression, select an appropriate real Functions target/configuration, and verify full checks without weakening rules or assertions. Do not fold dependency-audit remediation into this group.
- Date closed:

### VM-059 Onboarding target and calculator labels do not name or focus their controls

- ID: VM-059
- Date opened: 2026-10-29
- Status: Closed ([PR #21](https://github.com/sararh95/VioMacro/pull/21), merged 2026-10-30)
- Severity: P3
- Workflow/page: Onboarding Basics and Nutrition Goals, including the existing needs calculator.
- Expected: Current Weight, Goal Weight, Daily Calorie Target, Gender, Age and Activity Level expose their visible labels and focus their existing controls when clicked.
- Actual: All six labels have no htmlFor/control; adjacent inputs/selects have no id, associated native label or ARIA name. Clicking each label after focusing Back leaves BODY active. The associated Height (cm) control focuses correctly.
- Repro: Create a synthetic emulator account normally; Next to Basics, click each weight label from Back focus; enter valid weights and Next to Nutrition Goals; click the calorie label, open Calculate Needs, click Gender/Age/Activity Level labels from Back focus. Repeat at1440x1000 and390x844.
- Evidence: Actual unchanged-main5b Chrome files under `_local/qa/fix-loop-2026-10-22/g11/unfixed-chrome-main5b/`, desktop/phone onboarding and calculator JSON/JPEG/diagnostics; screenshot `phone-calculator-age.jpg`. No source change or head-versus-base runtime substitution.
- Root: src/features/auth/OnboardingWizard.tsx:198/211/236/261/272/320 detached label markup; only caller src/features/dashboard/Dashboard.tsx:335.
- Assigned group: G11 because the same target-entry/native association repair needs only ids/htmlFor, preserving calculations, units, validation and normal onboarding persistence.
- Next action: Closed; reopen only if native label/focus or existing persistence controls regress.
- Fix PR: [#21](https://github.com/sararh95/VioMacro/pull/21); merge3638798fa66e2904800f9613e05a633778907a3d, current CI green, fresh [R1 APPROVE](https://github.com/sararh95/VioMacro/pull/21#issuecomment-6524238905) and [R2 APPROVE](https://github.com/sararh95/VioMacro/pull/21#issuecomment-6525013312).
- Verification: Six append-only real-browser regressions fail with only base App source restored and pass at the reviewed head; actual Chrome desktop/390 native focus/names and normal save/reload proof under `_local/qa/fix-loop-2026-10-22/g11/fixed-chrome-source1/` and `g11/reviewer2-accea7d/`. See review comments/log for bounded diagnostic, snapshot and image limits.
- Date closed: 2026-10-30 — merged on main; no deployment.

### VM-060 Settings macro labels do not focus their already-named inputs

- ID: VM-060
- Date opened: 2026-10-29
- Status: Closed ([PR #21](https://github.com/sararh95/VioMacro/pull/21), merged 2026-10-30)
- Severity: P3
- Workflow/page: Settings, Exact Grams targets.
- Expected: Clicking Protein (g), Carbs (g) or Fat (g) focuses the corresponding existing input while retaining its established ARIA name.
- Actual: The three inputs retain their settings-*-target ids and Protein/Carbs/Fat target grams ARIA names, but visible labels have no htmlFor/native control association. Each click from Percentage button focus leaves BODY active.
- Repro: Open Settings in a completed local account, choose Exact Grams, focus Percentage % before clicking each visible gram label. Repeat at1440x1000 and390x844; wrapped Current Weight is a successful focus control.
- Evidence: `_local/qa/fix-loop-2026-10-22/g11/unfixed-chrome-main5b/desktop-settings-protein-g-label.json` and `.jpg`, corresponding carbs/fat and phone captures. Observed on unchanged main5b source before G11 tests/fix.
- Root: src/features/settings/Settings.tsx:502/513/524 visible labels omit htmlFor; existing input ids504/515/526 need no change. Single /settings route in src/app/App.tsx:111.
- Assigned group: G11. Preserve established ARIA names, macro math, handlers, values, validation and persistence; add label-click regression because name-only tests already pass on main.
- Next action: Closed; reopen only if native label/focus or existing persistence controls regress.
- Fix PR: [#21](https://github.com/sararh95/VioMacro/pull/21); merge3638798fa66e2904800f9613e05a633778907a3d, current CI green, fresh [R1 APPROVE](https://github.com/sararh95/VioMacro/pull/21#issuecomment-6524238905) and [R2 APPROVE](https://github.com/sararh95/VioMacro/pull/21#issuecomment-6525013312).
- Verification: Six append-only real-browser regressions fail with only base App source restored and pass at the reviewed head; actual Chrome desktop/390 native focus/names and normal save/reload proof under `_local/qa/fix-loop-2026-10-22/g11/fixed-chrome-source1/` and `g11/reviewer2-accea7d/`. See review comments/log for bounded diagnostic, snapshot and image limits.
- Date closed: 2026-10-30 — merged on main; no deployment.

### VM-061 Other auth, profile and tracking labels lack native association

- ID: VM-061
- Date opened: 2026-10-29
- Status: Needs Repro (final follow-ups group G27)
- Severity: P3
- Workflow/page: Auth Email/Password, Settings Display Name, check-in Current Weight, Sleep Date/Bed Time/Wake Time/Duration/Notes.
- Expected: Each visible native label names and focuses its intended existing input/select/textarea.
- Actual source candidate: Nine label/control pairs are detached with no htmlFor/wrapping/forwarded click. Five controls have placeholders, which may provide browser name fallback; do not claim every computed name is empty. Actual Chrome reproduction is still pending.
- Root/callers: AuthPage.tsx:191/203 via App.tsx AuthGate47 and /auth101; Settings.tsx:267 via /settings111; CheckInModal.tsx:213 via Dashboard336 (full Start Check-In404 and quick WeightHistoryWidget94); SleepLogModal.tsx:64/95/104/118/156 via Dashboard752 (Log Sleep676 and Log Previous Night745).
- Evidence: Complete src/functions source search `_local/qa/fix-loop-2026-10-22/g11/orphan-label-addendum-main5b.md`; no functions markup. Owning source inspected on main5b; no runtime claim.
- Assigned group: G27 after G26. These non-target entry workflows stay outside G11's declared target/calculator claims; no source repair or closure here.
- Next action: Actual desktop/390 repro on its own branch, failing real name/native-label/focus tests plus retained Auth/profile/check-in/sleep save/reload behavior, then association-only repair for every listed caller.
- Date closed:

### VM-062 Phone onboarding calorie row clips its calculator caption

- ID: VM-062
- Date opened: 2026-10-29
- Status: Needs Evidence (final follow-ups group G28)
- Severity: P3
- Workflow/page: Onboarding Nutrition Goals at390px.
- Expected: The calorie input and Calculate Needs/Hide Calc control remain readable and usable within the form.
- Observed: The actual unchanged-main390px calculator screenshot shows only the calculator icon at the right edge of the calorie row; the caption is outside the visible content. Full geometry, accessible name and click reachability have not yet been independently measured for this layout finding.
- Evidence: `_local/qa/fix-loop-2026-10-22/g11/unfixed-chrome-main5b/phone-calculator-age.jpg`, inspected by root; label/focus reproduction did not claim this row's layout fixed.
- Suspected area: src/features/auth/OnboardingWizard.tsx:237–253, flex calorie input and calculator button inside the overflow-contained wizard.
- Assigned group: G28 after G27, distinct responsive-layout root from G11 associations. Existing main screenshot, no G11 source change yet.
- Next action: Reproduce both calculator states, measure viewport/ancestor/control bounds and reachable label/caption, add a failing responsive regression if confirmed, then contain the row without altering target/calculator behavior.
- Date closed:

### VM-063 Empty-library import navigation test races readiness and assumes enabled AI

- ID: VM-063
- Date opened: 2026-10-29
- Status: Open (final follow-ups group G29)
- Severity: P3
- Workflow/page: Existing emulator import-navigation regression at tests/e2e/emulator-auth.spec.ts:1392–1403.
- Expected: The test consistently exercises the empty-library import link and verifies the appropriate paused or mocked-enabled destination without live provider calls.
- Actual: It checks importLink.isVisible immediately after navigation. If the asynchronous empty state is not ready, it passes without clicking the link or checking the destination. When the branch is reached with AI paused, route and heading succeed but its Choose recipe file assertion fails because the correct control is Magic Import paused and disabled.
- Evidence: G11 full run165PASS/2FAIL includes this exact assertion failure. On untouched main5b, three original repeats passed through the conditional skip; their report contains no import click/destination assertions. A separate ignored diagnostic adds only empty-link readiness before the original route/heading/upload assertions and reproduces the same upload assertion failure on main. All145 tracked main inputs, including the original test and configs, remain byte-identical. `_local/qa/fix-loop-2026-10-22/g11/import-main-proof/` and `import-main-proof-validation.json` retain source, reports, screenshots, traces and this qualification.
- Classification: Existing test precondition/paused-mode gap, separate from G11 label associations. Main proof is a controlled branch reproduction, not an unmodified full-suite failure. No G11 test assertion or AI flag was changed to hide it.
- Additional actual-main proof2026-10-30: unmodified mainb040 push CI41109691027/fresh emulator173cases records this original test failing at1403 waiting15000ms for ChooseRecipeFile after route+heading passed, then retry1passing. Overall run SUCCESS/fresh172PASS+1FLAKY, not a no-retry run. Screened raw browser lines660-661/801-822/844-846 and hash-audited proof are workspace-parent `_local/qa/fix-loop-2026-10-22/g13/main-ci-b040-20261030/`; `g13/parent-main-ci-b040-audit.json`. This supplements the controlled G11 proof with an actual original main CI failure attempt; the root remains readiness plus paused-mode precondition, no G14 test workaround.
- Additional G15 observation2026-10-30: fullfresh179-case run again reaches original1403 with actual Magic Import paused disabled and15000ms ChooseRecipeFile timeout. Parent matched exactoldmainb040 originalCI failure, rehashedpayloads/testblock/nine relevantunchangedblobs and verified currentviomacro/fresh-noimport/AIpaused config beforepre-existing classification. g15/preexisting-vm063-comparison.json. Terminal G15 run:178PASS/1FAIL, this sole original VM063 assertion, plusinfra4PASS; no other failure/retry/flaky/skip. Emulatorcommandexit1 remains explicit under the user-allowed existing-main exception; no skip/test/AI workaround.
- Assigned group: G29 after G28. Keep original enabled-mode assertions with explicit page-scoped mocked availability; add paused-mode navigation proof and deterministic empty-state readiness with an isolated fixture. Preserve actual runtime AI pause and callable guards.
- Next action: Reproduce the branch/race on its own group, add meaningful coverage that fails when the branch is skipped or paused UI is misclassified, then correct test setup without weakening assertions, timeouts or retries.
- Date closed:


### VM-064 Tablet Planner action panel overlaps its date and clips confirmation

- ID: VM-064
- Date opened: 2026-10-30
- Status: Open (final follow-ups group G30; fresh Chrome repro pending)
- Severity: P2
- Workflow/page: Saved Meal Planner at768x1000 with the desktop sidebar.
- Expected: The date heading and Add to List/Preferences/Confirm controls remain separately readable and reachable inside the action panel.
- Actual: The md flex row compresses the date heading to two overlapping lines and pushes confirmation beyond the overflow-hidden panel. A normal automated click can reveal its internal clipped content; no saved-data loss was observed.
- Repro: Load a current seven-day saved plan at768px, inspect the header action panel before and after normal confirmation/reload.
- Main comparison: Actual original main363 source run and G13 candidate1 screenshots show the same clipping; the entire source prefix containing this panel is byte-identical. This is not a regression from toolbar wrapping. Main runtime proof is Playwright Chromium, not a separate Chrome session.
- Evidence: `_local/qa/fix-loop-2026-10-22/g13/tablet-header-existing-main/{main363.png,candidate1.png,proof.json}`; originals retained with the negative/candidate test reports.
- Root hypothesis: src/features/meal-planning/MealPlanner.tsx:1006 md row and1024 auto-width, nonshrinking action group inside an overflow-hidden panel. This internal clipping boundary differs from G13's shared-shell horizontal overflow.
- Assigned group: G30 after G29, an existing-main P2 follow-up under Sara's rule. Do not widen G13 to repair it or weaken its current tests.
- Next action: Reproduce in actual Chrome at the affected breakpoint, add failing readable/nonoverlapping date/control bounds and normal save/cancel regressions, then contain the existing action panel without changing button behavior or data.
- Date closed:


### VM-065 Settings persistence test treats a reload-cancelled external font as a failed save

- ID: VM-065
- Date opened: 2026-10-30
- Status: Open (final follow-ups group G31; controlled main runtime parity verified)
- Severity: P3
- Workflow/page: Emulator settings persistence regression, tests/e2e/emulator-auth.spec.ts:1409–1447.
- Expected: Verify every settings persistence and application-network assertion deterministically, while recording external resource failures accurately.
- Actual: The original test completes all save/reload/value assertions, then fails its final network assertion because an external Material Symbols font request is cancelled with net::ERR_ABORTED during reload. The replacement font request succeeds. No settings data failure was observed in this run.
- Repro: Full G13 fresh-emulator run `emulator-20261030T160655Z.log`, original settings test at1409. Inspect its retained error context and trace; pending font request starts at213294ms, normal reload at214126ms, replacement font200.
- Main comparison: Relevant Settings, AppLayout, index.html, Vite/Playwright configs and the entire original328668-byte test prefix are byte-identical to main363. Three unmodified main settings repeats pass. A separate diagnostic prepends only a5000ms icon-font delay hook to an exact copy of the original spec; normal reload produces the identical final font-cancellation assertion failure on main. All244 tracked main files remain exact. This is controlled parity, not an unmodified full-suite main failure or a globally red-main claim.
- Evidence: `_local/qa/fix-loop-2026-10-22/g13/settings-font-investigation.json` retains trace hashes, timing extraction and exact source parity. Original failure artifacts remain under the emulator results until archived with hashes by the next gate. `main-font-parity-validation.json` links the isolated main positive/control runs and their hashes.
- Root hypothesis: `collectNetworkFailures:168` retains external font cancellation across the intentional reload at1441. Global font links are index.html:52–54. This is separate from G13 Planner control wrapping.
- Assigned group: G31 after G30, pending main comparison. Do not remove or loosen network/persistence assertions to get green.
- Next action: Establish an isolated main reproduction and deterministic external-resource lifecycle regression, then repair test setup within its own group while preserving strict application failures.
- Date closed:


### VM-066 Chrome navigation and event capture need investigation after a timeout

- ID: VM-066
- Date opened: 2026-10-30
- Status: Needs Evidence (final follow-ups group G32)
- Severity: P3, local QA observation; no app data loss or broken saved-data result established.
- Workflow/page: Actual Chrome QA during a late Dashboard reload at1440px after desktop/390 route checks.
- Expected: Navigation/inspection settles and bounded diagnostic windows accurately describe retained events and any loss.
- Actual: goto('/') timed out and subsequent Runtime.evaluate hit3000ms timeout although native AX/screenshot showed Dashboard loaded. An ordinary reload briefly showed Checking your sign-in, then settled. Two short diagnostic reads reported truncated=true (6 and4retained events); the first includes two chrome-extension://gighmmpiobklfepjocnamgkkbiglidom exceptions in globals-front.js/adblock-picreplacement.js. Lost selected-event counts are unknown. Re-enabling observation domains/new cursor plus ordinary reloads produced complete windows without changing settings, processes, source or data.
- Repro/evidence: `_local/qa/fix-loop-2026-10-22/g14/fixed-chrome/report.md`, diagnostics-desktop-dashboard-navigation-timeout.json, diagnostics-desktop-dashboard-normal-reload-recovery.json, diagnostics-rebaseline-after-native-recovery.json, fresh explicit-reload windows and parent-fixed-chrome-audit.json. The earlier long phone window was also incomplete; it is retained separately and not evidence of a specific lost-event count.
- Main comparison: Dashboard/navigation/read owners are unchanged from mainb040; actual main Chrome reproduction of these particular timeout/extension events has not been run. No G14 attribution, same-main runtime equivalence, or causal connection between extension exceptions and tool timeout is established. The Grocery formatter does not own navigation or CDP capture.
- User impact: QA evidence needs explicit recovery and qualifications. Final Grocery values, profile/recipe/plan/pantry/weight and manual rows remained correct; complete fresh windows cover the affected workflows afterward.
- Assigned group: G32 after G31, narrow evidence/owner investigation. Keep G14 scoped; do not suppress errors, infer missing counts from global cursor gaps, add app workarounds or disable user extensions to obtain a clean result.
- Next action: Reproduce with a frozen single-tab environment on main; distinguish application request timing, tool buffer/session semantics and extension-source exceptions before proposing any repair or deferral. Preserve incomplete histories and use small complete per-action windows.
- Date closed:


### VM-067 Rounded grocery quantity can display one with a plural unit

- ID: VM-067
- Date opened: 2026-10-30
- Status: Needs Evidence (final follow-ups group G33)
- Severity: P3
- Workflow/page: Grocery quantity display near a whole-number rounding boundary.
- Expected: The displayed number and known unit agree while persisted quantity and identity remain unchanged.
- Actual: Source inspection shows quantity0.999 formats as displayed1 while the exact numeric-one singular condition does not apply, yielding1cups.
- Repro candidate: Call formatGroceryAmount(0.999, 'cups'); establish a reachable saved-data/UI case on current main before repair. No actual Chrome reproduction is claimed yet.
- Main comparison: Fresh PR23 Reviewer1 labels this existing-main behavior, source-only. Base b040 formatGroceryAmount appends cups at every quantity; both base and head use unchanged formatQuantity rounding. No G14 regression and exact numeric1 VM047 is fixed.
- Evidence: https://github.com/sararh95/VioMacro/pull/23#issuecomment-6534416077; private reviewer1-1972583/canonical-comment.md and parent-reviewer1-audit.json under G14 evidence.
- Suspected root: src/shared/ingredients.ts:82-94 rounds the displayed number; :210 selects singular from the unrounded quantity.
- Assigned group: G33 final follow-ups after G32; no G14 source expansion.
- Next action: Reproduce and define a narrow display-agreement regression without changing stored quantities, serving scaling or aggregation.
- Revisit trigger: G33 after preceding groups; retain Needs Evidence until runtime/source proof is completed.
- Date closed:


### VM-068 Local Chrome profile verification can fail with ERR_NO_BUFFER_SPACE

- ID: VM-068
- Date opened: 2026-10-30
- Status: Needs Evidence (final follow-ups group G34)
- Severity: P3 (transport observation; user-visible impact and cause are unproven)
- Workflow/page: Actual Chrome, local emulator, ordinary Grocery reload.
- Expected: Reload settles with the existing profile and saved feature data, without a local transport failure.
- Actual: One complete102-window G15 capture contains a Firestore Commit/unavailable warning, one XHR net::ERR_NO_BUFFER_SPACE (canceled=false), and its network Log error. The failed request contains only an existing-own-profile verify with an updateTime precondition, no update/delete/transform.
- Repro: Signed in with a newly created synthetic completed imperial account, visit Grocery at390px and reload normally. This happened once; no failure-time screenshot or broken UI state was captured. Retain the original interval rather than treating later pixels as the failure state.
- Recovery/evidence: Stop all UI/SDK input, preserve a new23-file emulator export, then one ordinary reload. Grocery settles and the profile plus recipes, mealPlans, groceryItems, pantryItems and weightHistory are byte-exact to the corrected baseline; subsequent captured windows do not repeat the buffer error. No settings, extension, reset or process workaround was used. Evidence workspace-parent `_local/qa/fix-loop-2026-10-22/g15/fixed-chrome/diagnostics-core-grocery-390-reload.json`, recovery-grocery-390-reloaded-settled.json and core-390-after-recovery.json; root parent-fixed-chrome-audit.json and parent-fixed-partial-export-audit.json.
- Main comparison: Actual-main runtime parity is unknown. Auth context, userService and Firebase source bytes exactly match main80a8; the G15 source diff only changes wizard grid columns. No regression, data loss, security problem or cause is established.
- Suspected area: Browser/local network transport and existing-profile transaction verification in src/services/userService.ts:226-251. Source equality does not establish a browser/resource cause.
- Assigned group: G34 after G33, narrow transport/owner investigation. Separate from VM066 capture/session semantics and from G15 label containment.
- Next action: Reproduce with preserved data and bounded diagnostics on current main; establish impact, main parity and owner before changing code or deferring with a reason. Do not suppress errors or stop unrelated processes.
- Date closed:


### VM-069 Calendar month navigation overflows at the end of a month

- ID: VM-069
- Date opened: 2026-10-30
- Status: Closed ([PR #25](https://github.com/sararh95/VioMacro/pull/25), merged 2026-10-30 local; main0c2f7d7, exact reviewed tree. CI568PASS and fresh R1/R2 APPROVE; source attempt1.)
- Severity: P2
- Workflow/page: Dashboard Activity calendar, previous/next month.
- Expected: Each month-navigation click displays the adjacent calendar month, including month ends, February and year boundaries.
- Actual: ActivityCalendarWidget initializes viewDate with today's day. changeMonth clones it and calls setMonth while retaining that day. On October31, previous month requests September31, which normalizes to October1; the heading remains October2026. Forward transitions to shorter months can also overflow.
- Root cause: src/features/dashboard/components/ActivityCalendarWidget.tsx:14 and :81-85.
- Actual Chrome on unchanged main: at realOctober30/Pacific, both1440/390 nativeNext sequence skipsFebruary afterJanuary; normalreloadreset and fullsaveddata exact. g35/parent-unfixed-audit.json/89payloadmanifest79f25397..., latest23-fileexport preserved before cleanup. Newfourcase/14transition regressions appended with original349794byteprefix exact; validRED then same-test GREEN completed. Source attempt1 normalizes cloned date to day1 before setMonth.
- CI evidence: PR24 exact head595d61f CI41150760594 fails original emulator-auth.spec.ts:3655/3666 at1440 and390, initial+retry each: expected notOctober2026, receivedOctober2026 after one Previous month click. All four G15 wizard tests pass; fresh177PASS/2FAIL, built stage skipped.
- Main comparison: Fresh Terra diagnosis reproduced BOTH original main80a8 calendar tests at1440/390 using the CI UTC timezone/currentOctober31 date. All244 base blobs were compared:243 exact including all App/test source, with only private Playwright timezoneId UTC added because Windows Chromium ignores TZ=UTC and otherwise remains October30/Pacific. This is a controlled focused main reproduction, not an unmodified full-main CI run. Focused result:8PASS/2calendarFAIL plusinfra4PASS, exit1/no retries. Parent rehashed16payloads/manifest e97329619a8e56503cd7bffd8d8e2f532374be5167f1859da3b2c711056ad8fe, independently comparedall244baseblobs and raw failure DOM, verified Node+browserUTC/October31 and requiredportsavailable via directTCP+exclusivebind. Report under workspace-parent `_local/qa/fix-loop-2026-10-22/g15/calendar-main-diagnostic/`; root g15/parent-calendar-main-audit.json. Initial zero-test filter launch and intermittent netstatPID0 observation are retained/excluded; no source fix.
- Related-pattern search: The only other src/functions setMonth caller is MealPlanner.tsx:517, its Month-mode navigation branch. Source is unchanged on main, but its runtime behavior and day/week-return semantics are unproven; inspect it before choosing any shared fix. Do not build the unfinished Month view or assume identical semantics.
- Classification: Existing-main month-end bug outside G15 wizard-label scope. Not a G15 regression, test waiver or reason to remove/double-click/loosen the existing assertion. It blocks current-head green CI.
- Assigned group: G35, explicitly inserted before finishing G15 by Sara. One separate calendar PR; preserve open PR24/head595d61f and its source/evidence.
- Proposed narrow repair: Represent the calendar's displayed month with day1 before applying the month offset. Add controlled month-end/February/year-rollover regressions, preserve original tests, run all gates/Chrome and two fresh reviews. Source attempt1 implements only this day1 normalization; no broader date or unfinished Month-view work is included.
- Author continuation: missing phone Grocery/reload/control/pixels/full-data/final-binding proof completed without replay; parent-fixed-resume-chrome-audit.json/new28payload manifest c3814a9e..., latest after-fixed-resume032654Z data preserved and own runtime stopped. First blank reload capture retained/excluded, later native focus/current capture valid; no regression/owner inference.
- Next action: G35 merged as main0c2f7d7; normal main integration into preserved G15 PR24 is underway. Retain all author proof and qualifications; obtain new-head CI and fresh G15 R1/R2. No test weakening or mixed product changes.
- Date closed:

### VM-070 Phone calendar numeral paint needs owner/main evidence

- ID: VM-070
- Date opened: 2026-10-30
- Status: Needs Evidence (final follow-ups G36; no fix in G35)
- Severity: P3, bounded visual/capture observation; no broken month control or saved-data loss established.
- Workflow/page: Dashboard Activity calendar at390x844.
- Expected: Day numerals remain visually separated and legible in settled native pixels.
- Actual: Some fixed phone January numerals touch or appear duplicated in g35/fixed-chrome/phone-calendar-step-3.jpg. Month label and February result remain clear; DOM dates are correct.
- Main comparison: Saved unfixed-main80a8 January frame g35/unfixed-chrome/phone-month-3.jpg appears spaced. These isolated frames establish neither same-main behavior nor a regression; app paint versus capture owner is UNKNOWN. Only G35 source change normalizes view-date day before setMonth; no grid/CSS repair claimed.
- Evidence: Outside-app _local/qa/fix-loop-2026-10-22/g35/fixed-chrome/REPORT.md and both exact frames; parent-fixed-partial-pause-audit.json records parent inspection. No extra repro was run after Sara requested pause.
- Assigned group: G36, final narrow evidence/owner investigation. Do not widen G35 or certify whole-grid paint from month-label proof.
- Next action: Investigate with matched main/candidate conditions and current DOM/native pixels before deciding whether an app or QA-capture repair is needed.
- Date closed:

### VM-071 Manual QA logs a missing optional availability module

- ID: VM-071
- Date opened: 2026-10-30
- Status: Needs Evidence (final follow-ups G37; no fix in G35)
- Severity: P3, local server diagnostic; no captured App runtime exception or live AI request established.
- Workflow/page: Manual emulator Vite startup/Chrome source binding with AI paused.
- Actual: Vite reports a Pre-transform error loading /__qa/ai-availability.js from src/shared/constants.ts. Both g35/runtime-unfixed-vite.log:9 and runtime-fixed-vite.log:9 contain the same message.
- Main comparison: Actual unfixed main80a8 manual runtime logs it too; source/config parity is independently recorded by the G35 unfixed145-input audit. No G35 regression established. Root cause/user impact beyond server noise remain unclassified.
- Suspected area: vite.emulator.config.ts:6 defines the optional QA availability URL; investigate its interaction with Vite dependency processing before proposing any repair. AI must remain paused; no feature/provider enablement is authorized by this entry.
- Evidence: AppRoot/_local/qa/fix-loop-2026-10-22/g35/runtime-unfixed-vite.log and runtime-fixed-vite.log; parent-fixed-partial-pause-audit.json retains the diagnostic limit. Browser-selected windows contain no Runtime.exceptionThrown and only favicon404/canceledFetch/password-form diagnostics, not a globally clean-history claim.
- Assigned group: G37, final narrow infrastructure diagnostic investigation, separate root cause from G36.
- Next action: Classify expected optional-module processing versus a fixable local QA defect using existing evidence first; do not suppress logs or force AI on.
- Date closed:
