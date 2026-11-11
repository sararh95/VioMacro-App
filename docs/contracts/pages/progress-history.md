# Progress / History Page Contract

Date created: 2026-06-26
Status: Locally graduated

## Page

- Route: `/progress`
- Component: `src/features/progress/History.tsx`
- Launch tier: Important
- Page job: Let a signed-in user review saved meal-plan history and recent progress signals without fake metrics, silent failures, or dead navigation.
- Entry point: App navigation `Progress`, direct `/progress` route, follow-up after saving a meal plan or logging daily metrics.
- Auth boundary: Protected route. Signed-out users should redirect to `/auth`.

## Task Checklist

1. [x] Define Progress / History page scope and current diagnosis.
   - Outcome: Contract identifies route, data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `src/features/progress/History.tsx`, `src/features/meal-planning/planService.ts`, `src/services/userService.ts`, `src/app/App.tsx`, existing tests, QA ledger, and bug ledger.
   - Ledger target: Progress / History page contract.

2. [x] Run baseline Progress route smoke.
   - Outcome: A signed-in user reaches `/progress`, sees `Plan History`, and no unexpected console/App Check errors occur.
   - Verification target: Playwright emulator direct route smoke.
   - Ledger target: QA ledger.

3. [x] Prove honest empty state.
   - Outcome: A new user with no saved plans sees an explicit empty state and a working route back to Meal Planner.
   - Verification target: Targeted Playwright emulator test.
   - Ledger target: QA ledger.

4. [x] Prove saved plan history visibility.
   - Outcome: A saved meal plan appears in history with deterministic meals, macro, calorie, and completion values after reload.
   - Verification target: Firestore-seeded or UI-saved Playwright emulator test.
   - Ledger target: QA ledger.

5. [x] Remove fake or random performance metrics.
   - Outcome: History never invents adherence, archive status, or performance data. Unknown values are labeled honestly.
   - Verification target: Source review plus targeted Playwright assertion.
   - Ledger target: QA ledger or bug ledger if deferred.

6. [x] Prove metric history expectations.
   - Outcome: Recent daily metric history is either summarized from real user logs or clearly marked as not part of this page yet.
   - Verification target: Source review and Playwright emulator test if implemented.
   - Ledger target: QA ledger; bug ledger if deferred.

7. [x] Prove failure and retry behavior.
   - Outcome: Plan or metric history load failures show visible recovery copy and a retry action, not an empty success-looking page.
   - Verification target: Deterministic dev failure hook plus Playwright emulator test.
   - Ledger target: QA ledger.

8. [x] Prove no chart/container warnings or dead controls.
   - Outcome: The page does not emit chart sizing warnings and all visible active controls navigate to owned routes or are disabled/honest.
   - Verification target: Playwright console warning collection and route/control assertions.
   - Ledger target: QA ledger or bug ledger if deferred.

9. [x] Close Progress / History page contract.
   - Outcome: No open P0/P1 Progress blockers remain, known deferrals are recorded, and the app roadmap can move to the next contract.
   - Verification target: Grouped Progress proof plus lint/build if code changes occur.
   - Ledger target: QA ledger, bug ledger, and app contract roadmap.

## Current Diagnosis

Proven:

- `/progress` exists and renders `History.tsx` with the heading `Plan History`.
- The app route is protected by the shared authenticated shell.
- Existing route smoke coverage includes `/progress`.
- Meal plans are read from Firestore through `getMealPlans(user.uid)`.
- Daily metric history exists in `getWeightHistory(user.uid)` and is already used by Dashboard.
- Empty Progress users now see a clear empty state and a working `/plan` route.
- Saved meal plans now render deterministic completion, meal, calorie, and protein values.
- Recent metric summary now uses real daily logs from `weightHistory`.
- Plan/metric load failures now show a visible retry panel.
- The page no longer links to the unowned `/plan/new` route.

Assumed:

- The first history card currently represents the most recent saved plan, not necessarily the user's current active week.
- The page is intended to become a progress/history overview, but current implementation is mostly meal-plan history.

Broken or risky:

- No open page-owned P0/P1 risks remain for the current private-alpha Progress scope.

## Data And Permissions

Data read:

- User meal plans under `users/{uid}/mealPlans`.
- Daily metric logs under `users/{uid}/weightHistory` if metric summary is implemented.

Data write:

- None expected for this contract. History should be read-only unless a future action explicitly copies or opens a plan.

Auth boundary:

- History is private user-owned data.
- Cross-user reads/writes should remain denied by Firestore rules.

Rules or backend boundary:

- This contract should not change Firestore rules unless a proven permissions bug appears.
- No live AI/provider work belongs to this page contract.

## States

Loading state:

- Page should show a visible loading spinner while history data is loading.

Empty state:

- A new user should see clear copy that no saved plans exist yet and a working link to `/plan`.

Error state:

- Plan or metric load failures should show visible recovery copy and a retry button.

History state:

- Saved plans should list deterministic plan data: week range, goal, meals completed, target calories/macros, and honest completion percentage.

Metric state:

- If daily metrics are shown, they must come from real `weightHistory` logs and must preserve Dashboard's local date-key behavior.
- If not shown yet, the page must say metric trends are still coming soon rather than implying they were analyzed.

Mobile expectation:

- Cards, summary panels, and action links should remain readable and reachable without horizontal scrolling.

## Risks And Non-Goals

- Do not build advanced analytics, charts, exports, or AI coaching in this contract.
- Do not change Dashboard metric write logic except to preserve its closed date-key fixes.
- Do not add a `/plan/new` route as part of this page; use the existing `/plan` route unless a separate planner contract approves a new route.
- Do not redesign the entire progress experience; stabilize the current private-alpha surface first.

## Verification Plan

1. Run baseline `/progress` route smoke.
2. Fix fake/random metrics, empty state, and dead navigation if proven.
3. Add a deterministic saved-plan history test.
4. Add visible failure/retry behavior and prove it with a dev hook.
5. Prove recent metric-history behavior or honest deferral.
6. Run grouped Progress proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-26.
- 2026-06-26 baseline route smoke passed through Playwright emulator `routes` run. The direct-launch test included `/progress` and no App Check warning failures.
- 2026-06-26 grouped Progress emulator proof passed: 3 tests.
- Grouped proof covered empty state routing back to Meal Planner, deterministic saved-plan visibility, real daily metric summary, and load failure retry behavior.
- 2026-06-26 post-patch route smoke passed: 4 tests.
- `npm.cmd run lint`: passed on 2026-06-26.
- `npm.cmd run build`: passed on 2026-06-26 after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox. Non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.

## Open Bugs And Deferrals

Open bugs:

- None for current Progress / History page-owned private-alpha workflows.

Deferred items:

- Advanced progress analytics and charts are future product work.
- Editing or duplicating a prior plan from history is future product work unless the Meal Planner contract adds an owned flow.

Revisit trigger:

- Before adding progress charts, plan duplication, trend coaching, or Hosting launch readiness.

## Next Action

Progress / History is locally graduated for the current private-alpha scope. Continue with the next roadmap contract instead of expanding Progress analytics.
