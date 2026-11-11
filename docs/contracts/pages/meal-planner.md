# Meal Planner Page Contract

Date created: 2026-06-25
Status: Locally graduated after 2026-06-27 manual-QA repair. Week navigation, selected-week reload context, tab active state, wizard checkbox accessibility, clone recovery, and auto-generate failure recovery are covered under `BUG-015`.

## Page

- Route: `/plan`
- Component: `src/features/meal-planning/MealPlanner.tsx`
- Launch tier: Critical
- Page job: Let a signed-in user create, review, edit, save, and reuse a weekly meal plan without losing plan data or accidentally triggering cross-page confusion.
- Entry point: App navigation `Plan`, Dashboard `Create New Plan`, Dashboard `Edit Plan`, direct `/plan` route.
- Auth boundary: Protected route. Signed-out users should redirect to `/auth`.

## Task Checklist

### G15 wizard batch-label containment — VM-048, 2026-10-30

Scope: fit None, Breakfast, Lunch and Dinner labels inside their existing week-wizard buttons at390px while preserving all four choices, selection behavior, AI pause and saved data. Root is the unconditional four-column grid in PlanGenerationWizard.tsx:75; the same component is rendered by both empty-week and populated-week MealPlanner branches at:964 and:1171. Other responsive card/stat grids and G13 strategy-toolbar wrapping are separate roots.

1. [x] Plan from latest main80a8 after G14 merge; search src/functions and identify both shared-component call paths. Expected source change is the wizard grid layout only, with appended geometry/behavior regressions and ordinary contract/ledger updates.
2. [x] Fresh G15 branch/main80a8 and actualfour-case Chrome reproduction complete: bothphoneBreakfast labels71.21875px in56.5px buttons; desktop97px fit. All16nativechoices/raw4before-afterdataexact,55completewindows/126payloads/currentpixels audited and dataset preserved before normalcleanup/rootshutdown. See g15/parent-unfixed-audit.json.
3. [x] Fournewcases demonstrate valid2phoneboundsFAIL/2desktopPASS/infra4PASS beforeAppfix, withallnative/dataactions complete. InitialnewselectorSETUPfailures retained/excluded andcorrectedwithoutchangingassertions/budgets; entire349794-byte oldprefix exact.
4. [x] Onegridclasschange aftervalidRED; focused4G15+infra4PASS, selection/focus/pausedgeneration/fullsaveddata preserved. Parent145-inputRED/GREENcompare differsONLYWizard, testbytesexact. Sourceattempt1; prematureunfixedfocusedrunfromrootguarderror retained/excluded.
5. [x] Final145inputs exactacrosscheck238App+125Functions/public18/built4/infra4 andfresh178PASS1originalVM063FAIL. Userallowedpreexisting-main exception verifiedagainstactualoldmainCI/sameassertion+testblock+nine sources; commandexit1keptexplicit, no skip/AIflag/timer/retry workaround. Local567PASS1documentedexistingFAIL; all4G15casesPASS. parent-final-gates-audit.json.
6. [x] Fixed actual Chrome both callers1440/390: all16 choices/focus/colors/label bounds, ordinary modal scrolling, lower controls, close/reload and raw saved-data preservation pass. Core Dashboard/Plan/Recipes/detail/Grocery both widths/reloads and listed nonwriting controls pass. Parent225 payload hashes/32JPEG headers/five current images/102 complete diagnostic windows audited; setup fixture correction and stale frame excluded. One verify-only local transport failure recovered with exact data after preserved export; cause/main runtime parity unknown (VM068/G34). Favicon/canceled Fetch/password-form limits retained; no global clean-history claim. See g15/parent-fixed-chrome-audit.json.
7. [ ] One PR, exact-head green CI, fresh blind sequential R1/R2, normal guarded merge and branch audit.

Evidence/status belongs in the G15 fix-loop and QA ledgers. No labels/options/handlers, AI availability, serving/data behavior or schema/rules change is authorized here.

### G13 strategy toolbar containment — VM-046, 2026-10-30

Scope: preserve existing strategy controls and saved-week behavior while keeping the phone shell aligned. Current-main Chrome reproduction and failure-first tests confirm shared-shell overflow. Three existing control rows now wrap; the intentional week scroller and all handlers remain unchanged. Six focused regressions pass at1440/768/390; full gates and fixedChrome/reviews remain pending.

1. [x] Reproduced on current main363: normal Select Meal click moves outer0->44/header33->-11 and off retains44; desktop stays0.21steps/22JPEGs recorded; desktop native1440x641 versusCSS1440x1000 qualified.
2. [x] Six appended390/768/1440 regressions: original Appsource gives4narrow geometryFAIL/2desktopPASS plusinfra4PASS; original328668-byte prefix exact, existing budgets/assertions unchanged.
3. [x] Verify the three wrapping changes in fixed Chrome; all toggles, chooser filters, both picker origins, keyboard/week scroll, batch save/reload and prior label fixes remain functional.
4. [x] Full current-head CI556PASS, author/independent Chrome and both fresh reviews complete; PR22 merged b040f7f with bundle/branch cleanup. Local gate qualifications and final whole-loop work remain recorded.

Evidence/step status: G13 in `docs/qa/fix-loop-2026-10-22.md`. Global overflow clipping/reset hacks, wizard redesign, AI/provider changes and schema/rules changes are outside this group.

### G11 target-label follow-up — 2026-10-29

1. [x] Reproduce VM-044 through both existing Preferences openers at desktop and390px, with the four labels and actual focus behavior recorded.
2. [x] Add failing native-label/name/focus regression coverage, then associate each target label with its existing input without changing parsing or values.
3. [x] Prove all four plan-specific targets survive Save Targets/Confirm Plan/reload; Cancel/Close discard unsaved edits and global Settings stay unchanged.
4. [x] Full gates, Chrome/core pages, exact-head CI and both fresh reviews complete; merged PR #21 (3638798).

Only the label associations are in scope. Existing modal/save/calculation behavior is a preservation control. Evidence belongs in `docs/qa/fix-loop-2026-10-22.md` G11 and the QA ledger.

Native and saved-data controls pass at both widths. Remaining author Chrome gaps, current-head CI and both fresh reviews passed; PR #21 merged 2026-10-30. See G11 log for excluded transition/truncated records and reviewer data-baseline/identity limits.

1. [x] Define Meal Planner page scope and current diagnosis.
   - Outcome: Contract identifies the page job, route, data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `src/features/meal-planning/MealPlanner.tsx`, `src/features/meal-planning/components/PlanGenerationWizard.tsx`, `src/features/meal-planning/components/PlanPromptModal.tsx`, `src/features/meal-planning/planService.ts`, existing Playwright tests, QA ledger, and bug ledger.
   - Ledger target: Meal Planner page contract.

2. [x] Run baseline Meal Planner route smoke.
   - Outcome: A signed-in user reaches `/plan`, sees the correct empty or existing-plan state, and no unexpected console/App Check errors occur.
   - Verification target: Existing authenticated navigation and mobile key-route smoke passed on 2026-06-25.
   - Ledger target: QA ledger.

3. [x] Prove empty-plan creation stays page-local and usable.
   - Outcome: From the no-plan state, `Create New Plan` opens the prompt, `Open Plan Wizard` opens the wizard, and `Start from Scratch (Empty Grid)` creates a visible weekly plan without overlay blockers.
   - Verification target: Playwright emulator test `meal planner empty-grid creation stays page-local and usable` passed on 2026-06-25.
   - Ledger target: QA ledger; bug ledger if overlay interception reproduces.

4. [x] Prove confirm/save and reload persistence for a Meal Planner-created plan.
   - Outcome: `Confirm Plan` saves the empty/manual plan for the current canonical week, shows saved feedback, disables unnecessary resave, and the plan still appears after `/plan` reload.
   - Verification target: Playwright emulator test `meal planner empty-grid plan saves and persists after reload` passed on 2026-06-25.
   - Ledger target: QA ledger.

5. [x] Prove page-local editing marks the plan dirty and can be saved again.
   - Outcome: At least one Meal Planner edit path changes the visible plan state, enables `Confirm Plan`, saves successfully, and persists after reload.
   - Verification target: Playwright emulator test `meal planner preferences edit enables resave and persists after reload` passed on 2026-06-25.
   - Ledger target: QA ledger; bug ledger if the chosen edit path is broken or misleading.

6. [x] Prove honest non-week modes and future controls.
   - Outcome: Day and Month modes clearly show `Coming Soon`, do not pretend to be complete, and do not break return to Week mode.
   - Verification target: Playwright emulator test `meal planner non-week modes show honest coming soon states` passed on 2026-06-25.
   - Ledger target: QA ledger.

7. [x] Prove page-level error states for save and generation.
   - Outcome: Failed plan save and AI generation failure show user-visible feedback without silently losing the draft plan.
   - Verification target: Playwright emulator tests `meal-planner-failure save alert keeps draft visible` and `meal-planner-failure generation feedback keeps current draft visible` passed on 2026-06-27.
   - Ledger target: QA ledger and bug ledger as needed.

8. [x] Classify `Add to List` as page-local or cross-page.
   - Outcome: Decide whether Meal Planner only needs to verify the button gives honest feedback, or whether generated grocery data belongs to the later Grocery / cross-page contract.
   - Verification target: Source and manager review completed on 2026-06-25.
   - Ledger target: Meal Planner contract and, if needed, Grocery or cross-page workflow contract.

9. [x] Close Meal Planner page contract.
   - Outcome: No open P0/P1 Meal Planner blockers remain, known deferrals are recorded, and the page is ready to feed the later cross-page workflow.
   - Verification target: Grouped Meal Planner Playwright emulator run passed 6 tests, followed by lint/build.
   - Ledger target: QA ledger, bug ledger, and parked cross-page prerequisite gate.

10. [x] Repair manual-QA week navigation and navigated-week persistence regression.
   - Outcome: Navigating from the current empty week to the next week no longer causes the empty-week prompt to trap the page, previous-week navigation returns to the original week, and the selected planner week survives reload for the same browser session.
   - Verification target: Playwright test `meal planner week navigation moves next and previous without prompt trap`; Playwright test `meal planner future-week empty grid saves and stays selected after reload`; in-app browser proof on `/plan`.
   - Ledger target: `BUG-015`, QA ledger, and QA audit repair addendum.

11. [x] Repair manual-QA tab and wizard control accessibility regression.
   - Outcome: Day/Week/Month tabs expose selected state with `aria-pressed`; Daily Smoothie, Daily Tea, and Include Snacks are named checkbox controls.
   - Verification target: Updated Playwright test `meal planner non-week modes show honest coming soon states`; Playwright test `meal planner wizard exposes named smoothie and tea toggles`; in-app browser proof on `/plan`.
   - Ledger target: `BUG-015`, QA ledger, and QA audit repair addendum.

12. [x] Repair native alert / interruption paths for clone and auto-generate.
   - Outcome: Clone Last Week and Auto-Generate Week use visible, recoverable in-app feedback instead of relying on native alert interruption paths; generation failure leaves the wizard/page usable and avoids a blank-plan trap. Clone also tolerates partial saved plans by creating a full seven-day target week.
   - Verification target: Playwright tests `meal planner clone without saved history shows recoverable feedback`, `meal planner clone from previous saved plan creates a draft for the selected week`, and `meal-planner-failure generation feedback keeps current draft visible`; manual in-app browser proof on `/plan`.
   - Ledger target: Closed `BUG-PLAN-005` scope under `BUG-015`.

## Current Diagnosis

Proven:

- Authenticated route-smoke coverage already reaches `/plan` and checks that a `Plan` heading and either `Create New Plan` or `Add to List` is visible.
- Existing cross-page regression coverage can create an empty weekly plan from Meal Planner, confirm it, and verify downstream Dashboard/Grocery recognition when the whole flow succeeds.
- Firebase Foundation rules for `mealPlans` are hardened and locally tested for owner access, cross-user denial, malformed dates, malformed days, malformed targets, and unexpected extra fields.
- `BUG-001` closed the prior active-plan week-key mismatch by aligning plan week keys and saving the returned Firestore plan ID locally.
- 2026-06-27 manual-QA repair proved Week navigation moves Jun 22 -> Jun 29 -> Jun 22 without the prompt trapping the page.
- 2026-06-27 repair proved a future-week empty grid can be saved and the selected week remains selected after reload.
- 2026-06-27 repair proved Day/Week/Month expose selected state with `aria-pressed`.
- 2026-06-27 repair proved Daily Smoothie and Daily Tea are named checkbox controls.
- 2026-06-27 repair proved Clone Last Week gives recoverable no-history feedback, creates a draft from a seeded previous saved plan, and tolerates partial saved plan data.
- 2026-06-27 repair proved Auto-Generate Week failure uses in-app feedback and keeps the wizard usable.

Assumed:

- The empty-grid creation path is still usable as a Meal Planner page-owned flow after Dashboard failure-state work.
- Existing saved plans still reload correctly when the user visits `/plan` directly.
- The current UI has enough honest disabled or Coming Soon treatment for Day and Month modes.

Remaining proof boundary:

- No open Meal Planner page-owned P0/P1 proof gap remains. The cross-page Dashboard -> Meal Planner -> Grocery chain still needs its own contract proof.

## Primary Workflow

User goal: Create a weekly plan from the Meal Planner page and see that the saved plan remains available when returning to the page.

Expected happy path:

1. User signs in.
2. User navigates to `/plan`.
3. If no plan exists for the selected week, the page shows `Plan Week of ...` and `Create New Plan`.
4. User clicks `Create New Plan`.
5. Prompt opens with `Open Plan Wizard`, `Clone Last Week`, and `Maybe Later`.
6. User clicks `Open Plan Wizard`.
7. Wizard opens with `Auto-Generate Week` and `Start from Scratch (Empty Grid)`.
8. User clicks `Start from Scratch (Empty Grid)`.
9. A weekly plan grid appears with macro cards and `Confirm Plan`.
10. User clicks `Confirm Plan`.
11. Page shows saved feedback and keeps the saved weekly plan visible.
12. Reloading `/plan` preserves the saved plan for the same canonical week.

## Secondary Workflows

- User switches between Week, Day, and Month modes.
- User navigates previous/next week.
- User opens Preferences and changes plan targets.
- User toggles daily smoothie or tea strategy.
- User toggles meal completion for saved plans.
- User clones a previous week if one exists.
- User starts AI generation from the wizard when recipes and settings are available.
- User sends a plan to the shopping list through `Add to List`.

## Data Read

- Firebase Auth user.
- User settings and macro targets from the app store.
- Current week meal plan through `getMealPlanByDate(user.uid, getWeekStartKey(viewDate))`.
- User recipes through `getRecipes(user.uid)`, with mock fallback if the database is empty.
- Active plan from app context.

## Data Write

- Draft plan in app store through `setDraftPlan`.
- Saved weekly meal plan under `users/{uid}/mealPlans/{planId}` through `saveMealPlan`.
- Saved meal completion updates through app store / `toggleMealCompletion`.
- Potential grocery items through `generateGroceryList` when `Add to List` is used.

## Auth And Permissions

- All plan reads and writes must stay under `users/{uid}/mealPlans`.
- Cross-user plan reads/writes remain denied by Firestore rules.
- AI generation must remain callable only for authenticated users, and live AI use stays behind the Firebase Foundation live-AI gates.

## Empty, Loading, And Error States

- No current week plan: show `Plan Week of ...`, explanatory copy, and `Create New Plan`.
- Day or Month mode: show `Coming Soon`, not a fake complete planner.
- Missing settings during AI generation: show visible in-app feedback and keep the wizard usable.
- Missing recipes during AI generation: show visible in-app feedback and keep the wizard usable.
- Failed plan save: alert the user and keep the draft visible.
- Failed grocery-list generation: alert the user.

## Mobile Expectation

- `/plan` renders without horizontal layout breaking the shell.
- The week grid may scroll horizontally, but core actions remain reachable.
- Modals fit within the viewport and remain dismissible.

## Risks And Non-Goals

- Do not close the cross-page Dashboard -> Meal Planner -> Grocery workflow under this page contract.
- Do not launch Pantry work from this contract.
- Do not require live AI generation proof for page closure; live AI remains a separate Firebase/deploy gate.
- Do not turn Day or Month modes into full features in this contract unless they block Week mode.
- `Add to List` may be deferred to Grocery or the parked cross-page workflow if it requires downstream proof.

## `Add to List` Classification

Decision: split ownership.

- Meal Planner owns whether `Add to List` is visible only when a plan exists, does not block the page, and gives honest immediate success/failure feedback.
- Grocery / Shopping List owns generated item display, manual item preservation, checked/deleted item behavior, and the user-facing shopping workflow.
- The parked cross-page workflow owns the full chain: Meal Planner saved plan -> Dashboard recognition -> Grocery connected state and generated list confidence.

Rationale:

- `src/features/meal-planning/MealPlanner.tsx` calls `generateGroceryList(user.uid, displayPlan)` and alerts success/failure.
- `src/features/groceries/shopping-generator.ts` writes `users/{uid}/groceryItems` and refreshes generated items.
- Existing Firebase/data-loss coverage already proves generated grocery refresh preserves manual items, which is a Grocery/data workflow rather than a Meal Planner page-only responsibility.
- A future Grocery / Shopping List page contract should own deeper grocery-list behavior before the parked cross-page contract resumes.

## Verification Plan

1. Run baseline route smoke for `/plan`.
2. Add or run a targeted Meal Planner empty-grid creation test.
3. Add or run a targeted save/reload persistence test.
4. Add or run one page-local edit/resave test.
5. Verify Day and Month honest Coming Soon states.
6. Add failure-state proof for save and generation, or create a bug ledger item if deterministic failure hooks are needed.
7. Run `npm.cmd run lint` and `npm.cmd run build` after any code/test edits.
8. Update QA ledger only after proof exists.

## Current Proof

- Source diagnosis completed on 2026-06-25.
- Existing route smoke includes `/plan`.
- 2026-06-25 baseline Meal Planner route smoke passed through existing authenticated navigation coverage: 2 tests.
- 2026-06-25 page-local empty-grid creation proof passed: 1 test.
- 2026-06-25 page-local empty-grid save/reload proof passed: 1 Meal Planner test inside a 5-test persistence run.
- 2026-06-25 page-local Preferences edit/resave proof passed: 1 test.
- 2026-06-25 honest non-week mode proof passed: 1 test.
- 2026-06-27 page-level save and AI generation failure-state proof passed: 2 tests, including in-app generation feedback.
- 2026-06-25 `Add to List` classification completed by source and manager review.
- 2026-06-25 grouped Meal Planner closure proof passed: 6 tests.
- 2026-06-25 app lint and production build passed after closure fixes.
- 2026-06-27 manual-QA repair proof passed: focused Meal Planner Playwright slice 11/11; focused `meal-planner-failure` slice 2/2; app lint passed; production build passed.
- 2026-06-27 in-app browser proof confirmed no-history clone feedback, seeded partial-plan clone-success with cloned recipe visible and `Confirm Plan` enabled, no JS dialog, emulator-guarded Auto-Generate feedback, wizard still usable, and no console errors.
- Existing cross-page regression includes empty-grid creation and confirm-save as part of a broader Dashboard/Grocery workflow.
- Meal Planner page-owned emulator workflows are locally graduated.

## Open Bugs And Deferrals

- The plan-wizard overlay blocker reproduced during grouped closure QA and was fixed by preventing the empty-week prompt from reopening while the prompt or wizard is already open.
- `BUG-PLAN-005` native alert / clone / auto-generate interruption scope is closed for clone and generation paths.
- `Add to List` downstream correctness is assigned to the future Grocery / Shopping List page contract and parked cross-page workflow.
- AI generation quality and live provider behavior are out of scope for this page contract.

## Next Action

Stop on Meal Planner. Continue the existing Grocery / Shopping List page contract next, then resume the parked cross-page workflow after its dependent page contracts are stable.
