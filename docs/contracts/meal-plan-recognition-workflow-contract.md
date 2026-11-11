# Meal Plan Recognition Workflow Contract

Date created: 2026-06-25
Status: Graduated locally for cross-page emulator workflow on 2026-06-25

## Workflow

- Owner workflow: Meal plan creation and downstream recognition.
- Pages involved: Dashboard `/`, Meal Planner `/plan`, Grocery `/grocery`.
- Launch tier: Critical cross-page workflow.
- User goal: Create or save a weekly meal plan and have the rest of the app recognize it without confusion, duplicate states, or broken overlays.
- Entry points:
  - Dashboard empty plan prompt: `Create New Plan`.
  - Dashboard active plan prompt: `Edit Plan`.
  - Meal Planner direct navigation.
  - Grocery plan-connected state.

## Task Checklist

1. [x] Confirm owning page prerequisites are locally graduated.
   - Outcome: Dashboard, Meal Planner, and Grocery / Shopping List each have page-level contracts with no open P0/P1 blockers.
   - Verification target: Source review of `docs/contracts/pages/dashboard.md`, `docs/contracts/pages/meal-planner.md`, and `docs/contracts/pages/grocery-shopping-list.md`.
   - Ledger target: This workflow contract.

2. [x] Run isolated cross-page saved-plan creation flow.
   - Outcome: Fresh user can enter the plan creation flow, choose the empty/manual plan path, save it, and keep the saved plan visible without overlay blockers.
   - Verification target: Playwright emulator test `saved weekly plan is recognized by dashboard and grocery after reload` passed on 2026-06-25.
   - Ledger target: QA ledger.

3. [x] Prove Dashboard recognizes the saved current-week plan after reload.
   - Outcome: Dashboard hides `Ready to plan your week?` and shows `Weekly Planner` before and after reload.
   - Verification target: Playwright emulator test `saved weekly plan is recognized by dashboard and grocery after reload` passed on 2026-06-25.
   - Ledger target: QA ledger.

4. [x] Prove Grocery recognizes the saved current-week plan after Dashboard reload.
   - Outcome: Grocery hides `Manual List Mode` and shows `Meal Plan Connected`.
   - Verification target: Playwright emulator test `saved weekly plan is recognized by dashboard and grocery after reload` passed on 2026-06-25.
   - Ledger target: QA ledger.

5. [x] Prove the old plan-wizard overlay blocker stays fixed inside the full cross-page flow.
   - Outcome: The user can click `Start from Scratch (Empty Grid)` from the Dashboard/Meal Planner flow without a stale prompt overlay intercepting the action.
   - Verification target: Playwright emulator test `saved weekly plan is recognized by dashboard and grocery after reload` passed on 2026-06-25.
   - Ledger target: QA ledger; bug ledger if the blocker returns.

6. [x] Run closure checks for this integration workflow.
   - Outcome: Cross-page proof passes cleanly and any code changes are covered by lint/build if needed.
   - Verification target: Targeted Playwright emulator proof passed on 2026-06-25. No app code changed in this sprint, so lint/build were not rerun.
   - Ledger target: QA ledger.

7. [x] Decide whether this workflow can graduate.
   - Outcome: Either mark this workflow locally graduated, or route remaining issues into a Meal Planner page contract before moving to another page.
   - Verification target: Manager review completed on 2026-06-25; no open P0/P1 blocker remains in this workflow scope.
   - Ledger target: Workflow contract, bug ledger, and QA ledger.

## Prerequisite Gate

Do not run this cross-page workflow as the active sprint until these page contracts exist and have no open P0/P1 blockers:

1. [x] Dashboard page contract.
2. [x] Meal Planner page contract.
3. [x] Grocery / Shopping List page contract.

Reason: this workflow depends on plan creation, plan persistence, Dashboard recognition, and Grocery connection. If the owning pages are not individually stable, cross-page failures become noisy and harder to fix safely.

## Current Diagnosis

Proven:

- Earlier Dashboard work proved a saved weekly plan can be recognized by Dashboard and Grocery after reload when the flow succeeds.
- The app has a canonical Monday week-start helper and existing regression coverage around active-plan recognition.
- Firebase Foundation rules and data-loss tests are locally green for the relevant collections.

Current proof completed:

- The cross-page saved-plan flow passed after Dashboard, Meal Planner, and Grocery / Shopping List page contracts locally graduated.
- Meal Planner grouped closure QA reproduced and fixed the plan-wizard overlay blocker where the empty-week prompt could intercept `Start from Scratch (Empty Grid)`, and the blocker stayed fixed in the cross-page proof.
- Grocery / Shopping List grouped closure QA passed 7 tests and proves manual persistence, delete persistence, honest controls, Planner link routing, connected state, generated-refresh data safety, and write-failure recovery.

## Data Read

- Firebase Auth user.
- User settings.
- Active meal plan for the canonical current week.
- Grocery items connected to the active meal plan.

## Data Write

- Weekly meal plan under `users/{uid}/mealPlans/{planId}`.
- Potential generated grocery items under `users/{uid}/groceryItems/{itemId}` when the user generates a grocery list from the plan.

## Auth And Permissions

- All reads/writes must remain under `users/{uid}/...`.
- Cross-user plan, grocery, or recipe access must remain denied by Firestore rules.

## Empty, Loading, And Error States

- Dashboard no-plan state should show `Ready to plan your week?`.
- Dashboard active-plan state should show `Weekly Planner`.
- Grocery no-plan/manual state should not falsely claim a connected plan.
- Grocery connected state should show `Meal Plan Connected` when the active weekly plan exists.
- Plan wizard overlays should not block their own action buttons or leave stale modal layers behind.

## Risks And Non-Goals

- This workflow does not cover AI meal generation quality.
- This workflow does not cover pantry intelligence.
- This workflow does not cover full grocery item generation beyond plan connection unless task 4 expands scope.
- If the plan wizard has deeper UX issues, route them into a Meal Planner page contract instead of burying them here.

## Verification Plan

- Run the isolated cross-page Playwright emulator test.
- If it fails, classify the failure as app defect, test fragility, or missing contract assumption.
- Patch only the smallest surface needed for this workflow.
- Rerun the isolated test.
- Run lint/build after code changes.
- Update this contract and ledgers only after proof exists.

## Current Proof

- Contract created on 2026-06-25.
- Dashboard, Meal Planner, and Grocery / Shopping List prerequisites are now locally graduated.
- 2026-06-25 isolated cross-page proof passed: `saved weekly plan is recognized by dashboard and grocery after reload`.
- 2026-06-25 manager graduation review completed; this workflow is locally graduated for emulator proof.

## Open Bugs And Deferrals

- Plan-wizard overlay blocker stayed fixed in the full cross-page proof.
- Live Hosting deploy remains out of scope.

## Next Action

Stop this workflow. Choose the next page contract or launch-readiness gate.
