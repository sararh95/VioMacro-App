# Dashboard Page Contract

Date created: 2026-06-22
Status: Dashboard page workflows are locally graduated; Settings-fed target effects were recertified under accepted CMD-049 on 2026-07-13

## Page

- Route: `/`
- Component: `src/features/dashboard/Dashboard.tsx`
- Launch tier: Critical
- Page job: Give the signed-in user a truthful daily command center for check-ins, weight trend, macros, hydration, sleep, and weekly plan status.
- Entry point: Successful login redirects from `/auth` to `/`.
- Auth boundary: Protected route. Signed-out users should redirect to `/auth`.

## Task Checklist

### G35 — VM-069 month-end navigation, approved before G15

Scope: Dashboard Activity calendar month controls must advance exactly one month regardless of the starting day, leap years or year boundaries. Only the displayed calendar month changes; profile, logs, plans, recipes, grocery and pantry data stay unchanged. Sara approved a separate G35 PR before resuming G15/PR24; the existing wizard fix remains on its own branch.

1. [x] Diagnose the CI failure and search src/functions. Root ActivityCalendarWidget.tsx:14/:81-85 carries today's day into setMonth. Exact main80a8 source/original G4 tests reproduce both calendar failures under controlled UTC;243baseblobs exact with only private timezoneIdUTC added. MealPlanner.tsx:517 is the only analogous caller, but unfinished Month-mode semantics/runtime are unproven and no repair there is claimed.
2. [x] Preserve all G15 evidence/pushed595d61f and three local bookkeeping files, fetch latest main80a8 and create codex/fix-g35-calendar-months. Product/test files are exact base. Archive receipts are under g35/; no reset, force push or file deletion.
3. [x] Actual Chrome both1440/390 on originalmain: realOctober30/Pacific, four normal Next clicks produce Nov-Dec-Jan-Mar instead of February. Reload resetsOctober; five raw full own-data snapshots exact8ba56f... with nonempty features/full7dayplan. Parent89payloads/16JPEGs/three valid current images/25 complete windows744events/source145inputs verified. Two scroll-overshoot frames excluded, favicon/canceledFetch/password-form limits retained; no clock/state injection. New23-file export verified before normal cleanup/owned-only shutdown, all9portsclosed. parent-unfixed-audit.json.
4. [x] Four append-only cases/14 transitions fail on unchanged Calendar solely10 exact-month assertions (four FAIL, infra4PASS,336.16s). UTC/clock/focus/full data/reload controls complete, all145inputs stable, original349794byteprefix exact. No setup/timeout/data failures, budget/oldassertion changes. valid-negative-proof.json.
5. [x] Sourceattempt1 adds cloned-date day1 normalization before originalsetMonth. SamefourG35+infra4PASS/110.67s,14transitions/focus/fullsaveddata/reload controls pass. Parent145-input RED/GREEN comparison differsONLYCalendar; test354400/8c1eb4... andoriginal349794prefix exact, negative outputs archived/rehashed. parent-negative-positive-audit.json.
6. [x] Preserved fullcheck/public/built pass; fresh178PASS1provenVM063FAIL(exit1) qualified. Original fixed calendar/desktop/phone-other evidence retained. Receiving chat completed ONLY missing phone Grocery settled/reload/control/currentpixels, phone/final full-data comparisons and final signed-in UID/project/AI/real-date binding. New28payload continuation manifest/8completewindows276events audited, known diagnostic/capture/paint limits retained. Fresh23-file export032654Z verified before normal cleanup/owned-only shutdown; all145inputs unchanged. No completed gates replayed.
7. [x] PR25 exact-head CI568PASS, fresh sequential R1/R2 APPROVE (R2 owncheck+actualChrome/data), normal cleanup and guarded merge complete as main0c2f7d7. Remote branch deleted; verified full-history bundle preserved. Normal main integration into G15 PR24 follows, retaining source/evidence and requiring fresh current-head reviews. Local VM063 exit1 and diagnostic/paint limits remain qualified.

Expected paths: ActivityCalendarWidget.tsx, append-only emulator-auth.spec.ts, this contract and bug/fix-loop/QA ledgers. No unfinished Month feature, AI/provider, persistence/schema/rules or broad date-helper refactor is included. Evidence lives in the G35 fix-loop and QA ledger.


- [x] Define Dashboard launch-critical scope, user goal, data reads/writes, and primary workflows.
  - Outcome: Dashboard contract exists with route, component, launch tier, workflows, auth boundary, and data surface.
  - Verification target: Source/contract review.
  - Ledger target: Dashboard page contract.
- [x] Prove Dashboard opens the weekly check-in and sleep modals.
  - Outcome: Primary actions are visible and launch their modals without runtime errors.
  - Verification target: Playwright emulator test `dashboard check-in and sleep actions open their modals`.
  - Ledger target: QA ledger.
- [x] Prove weekly check-in saves weight and persists after reload.
  - Outcome: Full check-in writes a weight log and Dashboard still shows it after reload.
  - Verification target: Playwright emulator test `dashboard weekly check-in saves weight and persists after reload`.
  - Ledger target: QA ledger.
- [x] Prove sleep logging saves hours, quality, notes, and persists after reload.
  - Outcome: Sleep modal data writes to the current local day and remains visible after reload.
  - Verification target: Playwright emulator test `dashboard sleep log saves and persists after reload`.
  - Ledger target: QA ledger.
- [x] Prove hydration quick-add saves water intake and persists after reload.
  - Outcome: Hydration card increments today's water metric and remains accurate after reload.
  - Verification target: Playwright emulator test `dashboard hydration quick-add saves and persists after reload`.
  - Ledger target: QA ledger.
- [x] Prove hydration correction sets an explicit water total and persists after reload.
  - Outcome: Hydration correction opens an inline correction form, saves the corrected current-day ml total, and remains accurate after reload.
  - Verification target: Playwright emulator test `dashboard hydration quick-add saves and persists after reload` plus in-app browser smoke.
  - Ledger target: QA ledger and `BUG-016` closure.
- [x] Prove quick weight logging saves to Weight History and Activity Calendar.
  - Outcome: Quick weight log writes the local-day weight and both Dashboard widgets show it after reload.
  - Verification target: Playwright emulator test `dashboard quick weight log saves and persists after reload`.
  - Ledger target: QA ledger and bug ledger for closed UTC drift bugs.
- [x] Prove Dashboard failure states for weight-history load, hydration save, sleep save, and check-in save.
  - Outcome: Failed reads/writes produce visible recovery or alert behavior and do not silently corrupt visible state.
  - Verification target: Playwright emulator failure-state group, 4 tests passed.
  - Ledger target: QA ledger and `BUG-006` closure.
- [x] Close `BUG-006` Dashboard Failure-State Coverage Gap.
  - Outcome: Bug ledger marks Dashboard failure-state coverage complete for the current Dashboard scope.
  - Verification target: `BUG-006` status closed with proof links in QA ledger.
  - Ledger target: Bug ledger.
- [x] Create a separate cross-page workflow contract for saved weekly plan recognition across Dashboard, Meal Planner, and Grocery.
  - Outcome: Cross-page plan creation/recognition is tracked outside the Dashboard-only contract.
  - Verification target: `docs/contracts/meal-plan-recognition-workflow-contract.md` created.
  - Ledger target: New cross-page workflow contract; bug ledger if defects are found during reproduction.
- [x] Run final Dashboard-only smoke verification before closing the Dashboard contract.
  - Outcome: Dashboard happy paths and failure states pass together in one final targeted emulator browser run.
  - Verification target: Nine targeted Dashboard Playwright emulator tests passed on 2026-06-25.
  - Ledger target: QA ledger final Dashboard smoke entry.

## Primary Workflow

User goal: Complete a weekly check-in and see the Dashboard reflect the updated health log.

Expected happy path:

1. User signs in.
2. Dashboard renders with greeting, phase/week, macro cards, check-in card, weight widget, hydration card, sleep card, and plan preview or empty plan prompt.
3. User clicks `Start Check-In`.
4. Weekly Check-In modal opens.
5. User reviews adherence.
6. User enters energy and hunger feedback.
7. User enters current weight.
8. User clicks `Complete Check-In`.
9. Modal closes.
10. Dashboard refreshes weight history and current weight-backed widgets.
11. Reloading the page preserves the logged weight entry.

## Secondary Workflows

- Quick weight log opens the check-in modal directly in weight mode.
- Log Sleep opens the sleep modal and saves sleep hours, quality, and notes.
- Hydration quick-add increments or corrects the current day's water log.
- Create New Plan routes to `/plan` when no active plan exists.
- Edit Plan routes to `/plan` when an active plan exists.

## Data Read

- Firebase Auth user.
- User settings.
- Active meal plan.
- Weight and daily metric history.

## Data Write

- `currentWeight` in user settings.
- Weight log with date, weight, energy, and hunger.
- Daily water metric.
- Daily sleep metric.

## Empty States

- No active plan: show `Ready to plan your week?` and route to `/plan`.
- No sleep logged today: show `No sleep logged yet` and allow logging.
- Low/no weight history: show getting-started insight.

## Loading State

- During initial app load: show `Loading dashboard...`.

## Error State

Proven locally:

- Failed water save alerts the user and leaves hydration unchanged.
- Failed sleep save alerts the user and keeps the sleep modal open.
- Failed check-in settings save alerts the user and keeps the check-in modal open.
- Weight history load failure shows a visible Dashboard recovery alert with retry.

## Mobile Expectation

- Dashboard renders without chart container warnings.
- User can access navigation through the mobile shell.
- Start Check-In remains visible and tappable.

## Current Proof

- Existing emulator Playwright test passes for opening and closing Weekly Check-In and Log Sleep modals.
- Existing route smoke coverage verifies `/` renders after sign-in.
- Existing mobile shell coverage verifies Dashboard loads and no Recharts ResponsiveContainer warning is emitted.
- Emulator Playwright coverage now proves full weekly check-in completion saves a unique weight and the saved value is still visible after Dashboard reload.
- Emulator Playwright coverage now proves sleep logging saves hours, quality, and notes, and the saved values remain visible after Dashboard reload.
- Emulator Playwright coverage now proves hydration quick-add saves water intake and the saved value remains visible after Dashboard reload.
- Emulator Playwright coverage now proves quick weight logging opens directly in weight mode, saves a unique weight, and the saved value remains visible after Dashboard reload.
- Emulator Playwright coverage now proves a weekly plan saved through Meal Planner is recognized by Dashboard after reload and by Grocery as `Meal Plan Connected`.
- Emulator Playwright coverage now proves Dashboard failure states for weight-history load, hydration save, sleep save, and check-in save.
- Full emulator Playwright suite passed after the Dashboard local-date fix: 17 passed.
- Lint and production build passed after the Dashboard local-date fix.
- 2026-06-25 isolated Dashboard happy-path proof passed: 5 tests.
- 2026-06-25 isolated Dashboard failure-state proof passed: 4 tests.
- 2026-06-25 final Dashboard-only emulator smoke passed: 9 tests.
- 2026-06-25 app lint, Functions lint, and production build passed.
- 2026-06-27 Dashboard repair batch fixed four P2 manual QA findings: Weight History chart-size warnings, Weekly Check-In Energy/Hunger slider keyboard/value sync, mobile nav accessible-name ambiguity, and Sleep quality button names.
- 2026-06-27 focused emulator Playwright batch passed 4/4: mobile shell, Dashboard modal controls, weekly check-in persistence, and quick weight persistence.
- 2026-06-27 in-app browser proof confirmed a rendered Weight History chart with no chart-size warning logs, Energy/Hunger sliders moving from `3/5` to `4/5` by keyboard, one mobile nav opener plus one closer, and named sleep-quality buttons with `aria-pressed`.
- 2026-06-27 app lint and production build passed; build retained existing non-blocking Browserslist/chunk warnings.
- 2026-06-27 Dashboard hydration correction repair replaced the ambiguous `Correct Entry` hard-coded subtract action with an explicit inline current-total editor.
- 2026-06-27 focused hydration Playwright batch passed 2/2: hydration quick-add/correction persistence and hydration save-failure alert coverage.
- 2026-06-27 in-app browser proof confirmed `+250ml`, `Correct Entry`, inline `Correct water intake (ml)`, save to `125 ml`, reload persistence at `125 ml`, and no console warnings/errors during the manual hydration pass.
- 2026-06-27 app lint and production build passed for the hydration correction patch; build retained existing non-blocking Browserslist/chunk warnings.
- 2026-07-13 CMD-049 cross-page recertification proved that saved Settings Exact Grams `160/210/70` produce clearly labeled Dashboard targets `2110 kcal`, `160 g`, `210 g`, and `70 g`, while saved bottle size `650 ml` produces the reachable `+650ml` hydration action. The exact five-test group passed 5/5, desktop and `390x844` Browser views fit without horizontal overflow, and no AI/Functions/provider/production path was contacted.

## Gaps

- No open P0/P1 Dashboard gaps after `BUG-001` closure and the Dashboard local-date sleep/weight fixes.
- `BUG-006` is closed for explicit Dashboard failure-state injection coverage.
- Cross-page plan creation recognition should be handled in a separate workflow contract, not as additional Dashboard-only work.
- No open P2 Dashboard manual-audit polish gaps remain from `BUG-016`.

## Next Verification Target

Dashboard can stay in maintenance/regression mode while we continue page-by-page launch QA.
