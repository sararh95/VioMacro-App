# Grocery / Shopping List Page Contract

Date created: 2026-06-25
Status: Graduated locally for page-owned emulator workflows on 2026-06-25

## G14 VM-047 display-copy repair — 2026-10-30

Scope: show a singular known grocery unit at quantity1 without changing persisted quantities/units, aggregation, checked identity, recipe wording or serving calculations. The shared formatter at `src/shared/ingredients.ts:201-202` and its sole Grocery row caller at `ShoppingList.tsx:237` own this display issue.

1. [x] Inspect current main, formatter, all src/functions callers and the existing Grocery contract; plan one scoped PR in the fix-loop log.
2. [x] Reproduce the original two-portions/four-serving/two-cup generation and reload in actual Chrome at desktop and390; retain screenshot and authenticated saved value (`g14/unfixed-chrome/report.md`, parent36-file/145-input/data/diagnostic audit).
3. [x] Add meaningful failing formatter and append-only workflow regressions before the source change, preserving every original test byte except eight corrected G8 expected display literals. Unit42:38PASS/4FAIL; completed G14 desktop/phone workflows fail only20singular-label assertions; G8 four cases fail corrected display labels, data assertions retained. New-test saved-write readiness strengthens synchronization without changing budgets.
4. [x] Fix only quantity1 known-unit wording; initial unit42PASS/G14desktop3902PASS/G8packagedcount4PASS prove quantities, canonical units, package descriptions, recipe wording and checked/manual data stay intact. A pre-review legacy-nontext-unit regression test then failed before a typeof-string guard and passed afterward (43unitPASS/current source). Parent source-only negative/positive/main-helper parity and exact test-prefix audits retained under g14/; final full gates pending.
5. [x] Run check, public, fresh emulator and built-app emulator gates on the final guarded source:238App+125Functions, public18, infra4/fresh175, built4 =564PASS; zero fail/skip/flaky/retry, all145inputs unchanged. Exact receipts and parent final-gates audit under g14/. Existing Functions lint0/startup/dependency warning qualifications retained.
6. [x] Repeat Chrome originals/native manual amounts/reload plus Dashboard, Meal Planner, Recipes/detail and Grocery at both widths. Parent144hashes/194assertions/8savedcheckedrows/profile+othercollections/browserUID/29JPEGheaders/sixvalidpixels verified. Thirty-six complete windows cover workflows; three incomplete histories/two extension exceptions retained, recovered without source/settings changes (VM066/G32 Needs Evidence). Favicon404s remain VM041/G23 and lower-row warning overlap VM052/G20; no global clean-history or whole-row-visibility claim. Report g14/fixed-chrome/report.md.
7. [x] PR23 merged80a8f6ba3470330d25d7d5107a4b5a354526fb07; CI564PASS and fresh R1APPROVE6534416077/R2APPROVE6534922455 on exact197, actual desktop390Chrome preserved with explicit diagnostic/fixture/control limits. Exact two-parent/tree/ancestry verified; fullhistorybundle retained, both G14refs deleted, maintenance mainfastforwarded. VM047Closed; no deployment.

## Page

- Route: `/grocery`
- Component: `src/features/groceries/ShoppingList.tsx`
- Launch tier: Critical
- Page job: Let a signed-in user view a manual or meal-plan-connected grocery list, add items, check items off, delete items, and see honest future-shopping states without losing grocery data.
- Entry point: App navigation `Grocery List`, Meal Planner `Add to List`, direct `/grocery` route.
- Auth boundary: Protected route. Signed-out users should redirect to `/auth`.

## Task Checklist

1. [x] Define Grocery / Shopping List page scope and current diagnosis.
   - Outcome: Contract identifies the page job, route, data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `src/features/groceries/ShoppingList.tsx`, `src/features/groceries/shoppingService.ts`, `src/features/groceries/shopping-generator.ts`, existing Playwright tests, Firebase Foundation contract, QA ledger, and bug ledger.
   - Ledger target: Grocery / Shopping List page contract.

2. [x] Run baseline Grocery route and manual-state smoke.
   - Outcome: A signed-in user reaches `/grocery`, sees `Smart Grocery List`, sees manual-list copy when no plan is active, and no unexpected console/App Check errors occur.
   - Verification target: Targeted Playwright emulator run for existing grocery manual/honest-state coverage passed on 2026-06-25.
   - Ledger target: QA ledger.

3. [x] Prove manual quick-add, check, and reload persistence.
   - Outcome: A user can add an item from Quick Add, check it off, reload the page, and still see the item with the checked state.
   - Verification target: Playwright emulator test `user can quick-add, check off, and reload a grocery item` passed on 2026-06-25.
   - Ledger target: QA ledger; bug ledger if state is lost.

4. [x] Prove manual item delete and reload persistence.
   - Outcome: A user can delete a grocery item and the item stays deleted after reload.
   - Verification target: Playwright emulator test `user can delete a grocery item and reload without it returning` passed on 2026-06-25.
   - Ledger target: QA ledger; bug ledger if deletion is only visual.

5. [x] Prove active-looking controls are honest.
   - Outcome: Checkout, Print/PDF, store matching, and Share controls either work or clearly show disabled / Coming Soon states.
   - Verification target: Playwright emulator test `grocery page uses honest manual and coming soon states` passed on 2026-06-25 and asserts disabled `Share Coming Soon`.
   - Ledger target: QA ledger; bug ledger if any dead active-looking control remains.

6. [x] Prove `View Full Meal Plan` routes correctly.
   - Outcome: The sidebar link navigates from `/grocery` to `/plan` without a dead click or confusing no-op.
   - Verification target: Playwright emulator test `grocery view full meal plan link routes to planner` passed on 2026-06-25.
   - Ledger target: QA ledger.

7. [x] Prove meal-plan-connected state remains honest.
   - Outcome: With a saved current-week plan, `/grocery` hides manual-only status and shows `Meal Plan Connected` with source/target context.
   - Verification target: Playwright emulator test `saved weekly plan is recognized by dashboard and grocery after reload` passed on 2026-06-25.
   - Ledger target: QA ledger.

8. [x] Prove generated-list refresh protects manual items.
   - Outcome: Refreshing generated grocery items from a meal plan preserves manual items and replaces stale generated items.
   - Verification target: Playwright emulator test `data-loss: generated grocery refresh preserves manual items and replaces generated items` passed on 2026-06-25.
   - Ledger target: QA ledger and Firebase Foundation contract cross-reference.

9. [x] Prove page-level error or recovery behavior for grocery writes.
   - Outcome: Add, check, and delete failures do not silently mislead the user or leave the UI in a false success state.
   - Verification target: Playwright emulator test `grocery write failures show visible recovery` passed on 2026-06-25.
   - Ledger target: QA ledger; bug ledger if visible recovery needs implementation.

10. [x] Close Grocery / Shopping List page contract.
   - Outcome: No open P0/P1 Grocery blockers remain, known deferrals are recorded, and the page is ready to feed the parked cross-page meal-plan recognition workflow.
   - Verification target: Grouped Grocery Playwright emulator run passed 7 tests, followed by lint/build on 2026-06-25.
   - Ledger target: QA ledger, bug ledger, and parked cross-page prerequisite gate.

## Current Diagnosis

Proven:

- `/grocery` exists and renders `ShoppingList.tsx` with the visible heading `Smart Grocery List`.
- Existing authenticated route smoke reaches `/grocery`.
- Existing Playwright coverage proves a user can quick-add and check off a grocery item.
- Existing honest-state coverage proves checkout, store pricing, store matching, and old prototype copy are not presented as live checkout features.
- Firebase Foundation coverage hardens `users/{uid}/groceryItems/{itemId}` owner access, cross-user denial, malformed-write rejection, and generated-vs-manual lifecycle.
- Existing data-loss coverage proves generated grocery refresh preserves manual items and replaces stale generated items.
- Meal Planner page contract assigns generated item display, manual item preservation, checked/deleted item behavior, and the user-facing shopping workflow to this Grocery / Shopping List contract.

Assumed:

- No launch-critical Grocery behavior remains assumed after the grouped local emulator pass.

Broken or risky:

- No open P0/P1 Grocery page blockers remain.
- Delete button visibility still depends on hover styling, but current browser proof can reach it and prove persistence. Revisit before a full accessibility pass.

## Data And Permissions

Data read:

- Firebase Auth user.
- App store `activePlan`.
- App store `groceryItems`, loaded from `users/{uid}/groceryItems`.
- Optional active-plan calories, goal, week start, and meal count for source context.

Data write:

- Manual grocery items through `addGroceryItem`.
- Checked state through `toggleGroceryCheck`.
- Item deletion through `deleteGroceryItem`.
- Generated grocery items through Meal Planner `Add to List` and `generateGroceryList`.

Auth boundary:

- Grocery items are private user-owned data under `users/{uid}/groceryItems`.
- Cross-user grocery reads/writes must remain denied by Firestore rules.

Rules or backend boundary:

- Firestore rules require valid grocery item shape and owner-only access.
- Generated items should be tagged with `source: generated` and `mealPlanId`; manual items should remain manual and survive generated refreshes.

## States

Empty state:

- Show an empty grocery list message and allow manual Quick Add.

Manual state:

- Show `Manual List Mode`, `Manual grocery list`, and copy that no active meal plan is connected.

Meal-plan-connected state:

- Show `Meal Plan Connected`, source context, planned meal count, and target calories when available.

Loading state:

- Show `Loading list...` when the initial store load is in progress.

Error state:

- Add/check/delete failures show visible recovery messages and refresh/revert the list as needed.

Mobile expectation:

- `/grocery` should remain usable without the desktop sidebars. Primary heading, Quick Add, item list, check, and delete must remain reachable.

## Risks And Non-Goals

- Do not implement checkout, delivery, store matching, or print/PDF in this contract.
- Do not launch Pantry work from this contract.
- Do not close the parked Dashboard -> Meal Planner -> Grocery recognition workflow until this Grocery page contract is locally graduated.
- Do not require live store integrations or live AI provider calls.
- Do not broaden grocery generation quality beyond preserving data and showing generated items honestly.

## Verification Plan

1. Run baseline route/manual honest-state proof.
2. Add or run persistence proof for manual quick-add/check after reload.
3. Add or run persistence proof for manual delete after reload.
4. Fix and verify any dead active-looking Grocery controls.
5. Prove `View Full Meal Plan` navigation to `/plan`.
6. Reuse current saved-plan recognition proof for connected state.
7. Reuse current generated-list refresh data-loss proof for manual item preservation.
8. Add failure-state hooks or a documented bug if add/check/delete failures cannot be proven visibly.
9. Run grouped Grocery proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-25.
- 2026-06-25 baseline Grocery manual/honest-state proof passed through the `honest` Playwright emulator grep: 2 tests passed, including `grocery page uses honest manual and coming soon states`.
- 2026-06-25 Grocery persistence proof passed through exact-line Playwright emulator tests: quick-add/check/reload and delete/reload, 2 passed.
- 2026-06-25 active-control honesty proof passed through exact-line Playwright emulator test after making Share a disabled `Share Coming Soon` control.
- 2026-06-25 `View Full Meal Plan` route proof passed through exact-line Playwright emulator test.
- 2026-06-25 connected-state and generated-refresh proof passed through exact-line Playwright emulator tests: saved plan recognized by Grocery, and generated grocery refresh preserved manual items while replacing stale generated items.
- 2026-06-25 grocery write-failure recovery proof passed through exact-line Playwright emulator test covering add, check, and delete failures.
- 2026-06-25 grouped Grocery closure proof passed: 7 Playwright emulator tests.
- 2026-06-25 `npm.cmd run lint` passed.
- 2026-06-25 `npm.cmd run build` passed with existing non-blocking Vite warnings for stale Browserslist data, dynamic/static import chunking, and large bundle size.
- 2026-06-27 `BUG-018` accessibility polish passed dual proof: Grocery item check/delete controls expose item-specific names and checked state; focused Grocery Playwright slice passed 7/7; Browser Captain verified check-off state persisted after reload in real Chrome.

## Open Bugs And Deferrals

Open bugs:

- None in Grocery page scope after task 9.
- `BUG-018` is closed for the Grocery-owned check-off accessibility finding.

Deferred items:

- Checkout, delivery, store pricing, store matching, and print/PDF remain future integrations.
- Pantry-to-shopping-list intelligence remains outside this page contract.

Revisit trigger:

- Before resuming the parked meal-plan recognition workflow or deploying Hosting.

## Next Action

Return to the parked Meal Plan Recognition workflow for the cross-page integration proof, unless the user chooses a different page contract first.

## G8 package identity regression — VM037

2026-10-27, active follow-up/P3. Equivalent `(14 oz) can` and `can (14 oz)` must combine before final count rounding and share generated checked carryover. Different sizes/count nouns/names/preparation identities remain separate; preserve manual/source-less rows, recipe wording, current quantities/scaling and atomic errors. Application boundary is shared groceryIngredientKey only; no schema/rules/provider change.

1. [x] Plan and search every key/normalization caller; root shared/ingredients.ts:124–131, consumers aggregate and shoppingService.
2. [x] Fresh branch from latestmain and actual unfixed CodexChrome1440/390 reproduction/data evidence.
3. [x] Meaningful failing shared/helper/persistence/emulator regressions before code.
4. [x] Narrow identity correction and new regressions green with prior tests retained. Unit72 and real focusedemulator4 pass after meaningfulRED, originaltestbytes unchanged.
5. [x] Full check/public/fresh-emulator/built-emulator gates and actual finalChrome/reload/corepages/data safety. Check224/125/public18/fresh147+infra4/built4; all6actualChrome cases1440/390,25PNGs/readbacks/reloads/rawrecipe+sentinel preservation. Bounded Runtime clean; Log/Network coverage not certified, no global clipping claim.
6. [x] [PR18](https://github.com/sararh95/VioMacro/pull/18) merged21a7905e46d054c9bd5eae310039b743bd01212c; CI40560640681green/fresh R1APPROVE6451241737+R2APPROVE6452056002 on exactc7fc08a. Reviewed tree/two-parent/ancestry verified onmain, both G8refs deleted. Current exported data preserved; VM037Closed, no deployment.

Execution/evidence belongs in docs/qa/fix-loop-2026-10-22.md and QAledger; this follow-up does not invalidate earlier proven page workflows. Known unrelated later bugs remain in their assigned groups.
