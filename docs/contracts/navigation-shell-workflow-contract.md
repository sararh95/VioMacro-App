# Navigation Shell And Mobile Layout Contract

Date created: 2026-06-26
Status: Stage 6 foundation recertification graduated under CMD-048 on 2026-07-12

## VM-054 pending-save feedback — 2026-11-04

Scope: report unconfirmed optimistic writes in the signed-in shell without enabling an offline cache. Leaving anyway can still lose the change. Preserve G-B refusal recovery, routes and write behavior.

1. [x] Inspect optimistic writes and the existing shell, Grocery and Meal Planner contracts.
2. [x] Implement counting through fulfillment/rejection, optimistic-write wrappers, the exact status delayed by 1.5 seconds and an immediate pending-only unload guard. Counter unit proof passes; rendered proof remains pending.
3. [x] Add seven unit tests and ten appended desktop/390px emulator cases for held, fast, offline and refused writes; preserve the original 382,569-byte E2E prefix.
4. [x] Run unit tests, changed-file ESLint and TypeScript checks; record local evidence in the QA ledger and hand emulator/browser execution to Claude Code.
5. [ ] Claude Code runs the emulator cases and reviews desktop/390px rendering, native unload dialogs, acknowledgement/rejection and reconnection before closing VM-054.

## Workflow

- Routes/surfaces: `AppLayout`, desktop sidebar, mobile sidebar, protected shell header, route title, notifications Coming Soon, Settings/profile/sign-out controls.
- Components/routes: `src/app/AppLayout.tsx`, `src/app/App.tsx`, all protected primary routes.
- Launch tier: Critical for private-alpha usability.
- Workflow job: Let signed-in users reliably reach every primary app surface on desktop and mobile, understand what is active, and sign out without dead active-looking shell controls.
- Entry point: Any protected route after login, direct route entry, mobile menu button, sidebar/footer controls.
- Auth boundary: The shell only renders for signed-in users through `Protected`.

## Stage 6 Foundation Recertification - 2026-07-12

CMD-048 rechecks the existing shell contract as part of the Auth/Onboarding foundation slice. It must prove direct routes, every primary desktop route and active state, nested Recipe Import title, profile Settings access, desktop/mobile sign-out, and the `390x844` mobile menu without changing shell behavior.

The in-app Browser is the single manual Browser Captain; the existing focused Playwright navigation tests remain the repeatable proof. Notifications, Pantry expansion, shell redesign, and new routes remain deferred.

## Task Checklist

1. [x] Define Navigation shell and mobile layout scope and current diagnosis.
   - Outcome: Contract identifies route surface, current proof, risks, and non-goals.
   - Verification target: Source review of `AppLayout`, `App`, existing tests, QA ledger, roadmap, and bug ledger.
   - Ledger target: Navigation shell workflow contract.

2. [x] Run baseline shell smoke.
   - Outcome: Existing desktop and mobile shell smoke still proves authenticated route access.
   - Verification target: Playwright emulator route/mobile navigation tests.
   - Ledger target: QA ledger.

3. [x] Prove every primary desktop nav route is reachable and active.
   - Outcome: Dashboard, Plan, Recipes, Progress, Grocery, Pantry, and Settings are reachable from the desktop shell and active state is visible/semantic.
   - Verification target: Targeted Playwright emulator test.
   - Ledger target: QA ledger.

4. [x] Prove mobile menu route coverage.
   - Outcome: Mobile menu opens/closes, routes to Menu and Inventory items, includes Settings, and closes after route selection.
   - Verification target: Targeted mobile Playwright emulator test.
   - Ledger target: QA ledger.

5. [x] Prove sign-out access on desktop and mobile.
   - Outcome: Signed-in users can sign out from desktop and mobile shell and return to `/auth`.
   - Verification target: Playwright emulator test.
   - Ledger target: QA ledger.

6. [x] Prove no dead active-looking shell controls.
   - Outcome: Profile/name area either routes to Settings or is visually passive; notifications are disabled and labeled Coming Soon; Pantry remains reachable only because route exists and is already deferred.
   - Verification target: Source review plus Playwright assertions.
   - Ledger target: QA ledger; bug ledger if deferred.

7. [x] Prove shell titles and nested routes are honest.
   - Outcome: Header title matches current main surface, including nested `/recipes/import`; unknown protected fallbacks do not produce misleading shell state.
   - Verification target: Playwright emulator test.
   - Ledger target: QA ledger.

8. [x] Prove responsive layout basics.
   - Outcome: Desktop sidebar is hidden on mobile, mobile menu is hidden on desktop, and page content remains visible without horizontal layout breakage.
   - Verification target: Mobile/desktop Playwright assertions and console failure collection.
   - Ledger target: QA ledger.

9. [x] Close Navigation shell and mobile layout contract.
   - Outcome: No open P0/P1 shell blockers remain, known deferrals are recorded, and the app roadmap can move to the next contract.
   - Verification target: Grouped navigation proof plus lint/build if code changes occur.
   - Ledger target: QA ledger, bug ledger, and app contract roadmap.

## Current Diagnosis

Proven:

- Protected routes render through `AppLayout`.
- Existing authenticated smoke proves desktop sidebar navigation reaches Plan, Recipes, Grocery, Pantry, Progress, and Settings.
- Existing direct-route smoke proves protected routes render after sign-in.
- Existing mobile shell smoke proves the mobile menu opens and can navigate at least to Recipes and Grocery.
- Notifications are currently disabled with `Notifications coming soon` labeling.
- Pantry is still route-reachable but explicitly deferred in the roadmap by user decision.
- Desktop shell now proves every primary route is reachable and semantically active through `aria-current`.
- Mobile shell now exposes Settings and profile settings.
- Desktop and mobile sign-out both return users to `/auth`.
- Nested `/recipes/import` now keeps the header title on `Recipes`.
- Mobile footer spacing now clears the local Firebase emulator warning so Sign out remains clickable.

Assumed:

- Desktop and mobile shell are the main private-alpha navigation surfaces.
- Settings should be reachable from mobile because it controls user targets and profile data.
- Header title should help orientation, but it does not need to become a breadcrumb system yet.

Broken or risky:

- No open P0/P1 Navigation shell blockers remain for the current private-alpha workflow.

## Data And Permissions

Data read:

- Firebase Auth current user display name/photo.

Data write:

- None. Shell navigation should not write app data.
- Sign out mutates auth session state only.

Auth boundary:

- Shell renders only for signed-in users.
- Signed-out users should never see protected shell controls.

Rules or backend boundary:

- No Firestore rules, Functions, AI, or provider work belongs to this contract.

## States

Desktop state:

- Sidebar is visible at medium widths and above.
- Active route is visibly highlighted and semantically marked by `NavLink`.
- Settings and sign out are reachable from the footer.

Mobile state:

- Mobile top menu button opens an overlay/sidebar.
- Selecting a route closes the mobile menu.
- Closing the menu button or overlay returns to the page without navigation.

Disabled/future state:

- Notifications remain disabled and labeled Coming Soon.
- Pantry remains deferred at product level, but route availability is not changed in this shell contract.

Error state:

- Shell should not swallow route/render console errors. Playwright console collection should remain clean.

## Risks And Non-Goals

- Do not redesign the full shell.
- Do not remove Pantry route in this contract.
- Do not add notification functionality.
- Do not change page content except where shell navigation requires stable route titles.
- Do not deploy Hosting.

## Verification Plan

1. Run baseline route/mobile shell smoke.
2. Patch shell-owned dead/honesty gaps if proven.
3. Add focused desktop shell coverage.
4. Add focused mobile shell coverage.
5. Prove sign-out and nested route title behavior.
6. Run grouped navigation proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-26.
- 2026-06-26 baseline shell smoke passed before patching: 2 tests.
- 2026-06-26 focused Navigation shell proof passed: 2 tests.
- Focused proof covered desktop route reachability, active route state, nested route title, desktop profile settings, desktop sign out, mobile Settings, mobile profile settings, mobile menu close-after-selection, and mobile sign out.
- 2026-06-26 existing mobile shell route smoke passed: 1 test.
- `npm.cmd run lint`: passed on 2026-06-26.
- `npm.cmd run build`: passed on 2026-06-26 after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox. Non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.
- 2026-07-12 CMD-048 focused Auth/Onboarding/Navigation proof passed 7/7 with 0 failures, 0 skips, and 0 retries in 32.2 seconds.
- The in-app Browser Captain reached Dashboard, Plan, Recipes, Progress, Grocery List, Pantry, and Settings on desktop with matching semantic active state; `/recipes/import` retained the Recipes shell title; profile Settings and sign-out passed.
- At `390x844`, Auth controls fit without horizontal overflow, the drawer exposed one honest open/close path, remained inside the viewport, closed directly and after route selection, reached Settings/profile Settings, and returned cleanly to `/auth` on sign-out.
- Manager independently reviewed the desktop Auth, onboarding, and mobile drawer screenshots and accepted the `GRADUATED` verdict with no P0-P3 product finding.

## Open Bugs And Deferrals

Open bugs:

- None for current Navigation shell private-alpha workflows.

Deferred items:

- Pantry remains deferred by user decision.
- Notifications remain Coming Soon.
- Full shell redesign and notification center are future product work.

Revisit trigger:

- Before Hosting launch, mobile redesign, role-based navigation, notification work, or Pantry promotion.

## Next Action

CMD-048 is accepted and this workflow remains graduated for the current private-alpha scope. Preserve the shell while Stage 6 moves to the Recipe Library and Recipe Import slice after CMD-049 graduation and the approved documentation checkpoint.
