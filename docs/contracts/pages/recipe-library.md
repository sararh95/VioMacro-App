# Recipe Library Page Contract

Date created: 2026-06-25
Status: Regression repair verified on 2026-06-27

## G9 shared fallback styling — VM040

2026-10-27, P3 follow-up from main21a7905. Seeded recipe fallbacks must show a valid locally generated macro-family gradient with deterministic per-recipe hue variation. Preserve initials/accessibility, URL policy, healthy image appearance, stored recipe/plan data and offline/no-third-party behavior. This scope does not implement permitted-image decode recovery (VM042/G10).

1. [x] Search src/functions and map both direct recipeTint consumers and all seven RecipeThumb callers. Root visuals.ts:60–66 supplies a declaration list as one background value; direct boundaries RecipeThumb.tsx:37 and MealPlanner.tsx:1714/1737. Static inventory: g9/pattern-scout.md.
2. [x] Fresh codex/fix-g9-recipe-tint from main21a7905; actual unfixedChrome1440/390 reproduces both direct consumers/all routed shared callers, healthy images/data preserved. g9/unfixed-chrome/report.md has16exactPNGs and diagnostic/fixture limits; root97source/testfreeze exact before test writes, current9fileexport verified before teardown.
3. [x] Before App changes: actual-boundary unit8 yields2PASS6meaningfulFAIL; two client tests both fail on eight computed none backgrounds after healthy-image/data controls. Final-format exact E2E repeated RED, original278586byteprefix unchanged; no old assertion/budget/retry/config change. SSR alone unused.
4. [x] Source iteration1 separates background/filter in shared recipeTint and passes properties at both consumers. Unit8PASS; focused client2PASS(1440/390) plus infrastructure4PASS, unchanged inputs. Same-seed cross-consumer/reload styles match; distinct seeds vary, healthy images remain decoded/unfiltered and saved data exact.
5. [x] Fullcheck232/125/public18/fresh149+infra4/built4 PASS on133stableinputs. Fixed actualChrome1440/390/bothconsumers/routedcallers/healthyimages/core4controls+reloads PASS,35exactPNGs. Readonlymatrix byteexact; intentionalcore metadata/manualrow deltas explicit. After-fixed9fileexport verified at that stage before normalcleanup/ownedruntimeoff; diagnostic/capture limits in report.
6. [x] [PR19](https://github.com/sararh95/VioMacro/pull/19) merged c3768e05c2c5085af894cd1694a341c18443b49c. Current369be12 CI40590980765green; fresh sequential R1APPROVE6455332509/R2APPROVE6456047874, ownsource-negative/restoredtests and owncheck/Chrome1440/390/50assertions pass. ActualAPI/proof audits preserve diagnostic/main-parity limits. Latest11fileafter-reviewer2export verified before normalcleanup/all8portsfree. Mergecommit/tree/two-parent/ancestry onmain verified, bothG9refs deleted, maintenancecleanmainFF, VM040Closed. VM042/G10 remains separate.

Detailed plan, source line inventory, command results and actual screenshots belong in docs/qa/fix-loop-2026-10-22.md and QA ledger. Standalone RecipeCard has no proven routed mount; do not invent a test-only page.

## G10 permitted-image failure lifecycle — VM042

Plan on merged mainc3768e0, 2026-10-27. Scope is runtime decode/load failure after existing URL admission, followed by valid-source recovery. Reuse the existing accessible fallback and G9 styling; preserve original saved URLs/assets, healthy appearance and all current callers. This is not a URL-policy or upload lifecycle change.

1. [x] Refresh source/functions/callers/tests at currentmain; shared root RecipeThumb28–29, seven callers, separate CSSMealCard analog documented without assuming runtime proof. Plan and expected files/tests in runninglog/G10 and g10/pattern-refresh-c376.md/json.
2. [x] Fresh c3768e0 G10 branch and actual Chrome1440/390 reproduced shared native200/image-png decodefailure/no fallback, all6mountedreaders, same-form healthy/newURL recovery and Planner fetched/synthesized paths. Separate CSS11panels independently reproduced with resource/actualpanel/separateprobe proof; include its owner in G10. Own canonical SDK payload exactly unchanged (077fac995d2f85a717e2018c1bdf7012d90d67e5df17a097a2bb936394c5992d). Root viewed Library/CSS/phoneSuggestions/healthyForm images; report/manifest and capture/diagnostic/helper limitations in g10/unfixed-recovery-c376/. AfterUI142inputs/sixcopies exact before test-author release. NEW17-file current export verified after actualCLI EPERMfinalrename/sourceorder qualification; normalUIcleanup/authnull/onlyownQAclose/LEASEFREE and root9portsfree complete. No App/newtest execution yet; original E2E prefix preserved for regression work.
3. [x] Before Appfix,4meaningful nativeLibrary/CSS RED cases at1440/390 on unchangedAppsource, with native200PNG failure/healthy32px/data/control prerequisites passing first. First missing-browser setup failure retained separately, notRED. Total12G10cases appended; entire285801original E2E prefix and first299770meaningfulRED slice exact. G9normalReact/rawJSX invocation adapter preserves every8case/helper/assertion byte; scratch8PASS→oldsemicolon rawbackground6meaningfulFAIL/2PASS→byteexactrestore8PASS, canonical8PASS including newheaderLF correction. Root inspected rawstack/diff/prefix/assertiontail proof. No sourceimplementation before this gate.
4. [x] Sourceattempt2 shared keyed RecipeImage lifecycle: nativeimage failure and separateCSSprobe select existingfallback, changedURL/newattempt recovers, sameAafterB retries; currenttitle/macros/classes/labels and readonlydata/intendededits preserved. All12G10+infra4PASS/0failure-skip-flaky-retry on frozen143inputs. CSScover/center preservation corrected with specificbackgroundImage/filter; only2newfixture99byteconstants corrected after offlineproof, noassertionsloosened. ObsoleteC HTTPfinished and Bhealthy atbothwidths; no observedoldnativecallbackdeliveryclaim. Fullgates/actualfixedChrome remain next.
5. [x] New regressions GREEN and fullcheck/public/fresh-emulator/built-emulator gates; actualChrome originalrepros/allroutedcallers/core4/reloads desktop390, bounded diagnostics and verified currentdata preservation before cleanup. Focused12+infra4/fullcheck232/125/public18/fresh161+infra4/built4 PASS on unchanged143-input attempt2. ActualChrome complete: six mounted shared readers/three Picker origins/localGap/fetched+synthesized details/eleven CSS panels/same-form recovery/current props/core4+reloads. Report213files/39PNGs and independent integrity audit under g10/fixed-chrome-attempt2 and parent-fixed-chrome-proof-audit.md/json. Canonical own data unchanged; NEW CURRENT17-file after-fixed export verified before normalUIcleanup/leasefree/ownedservicesoff. VM035 read timeouts+Retry recovery and VM041 favicon errors remain explicitly logged; broad diagnostic/crop/runner classifier limits retained, no global clean-console claim. No source/test/config edits after gates.
6. [x] [PR20](https://github.com/sararh95/VioMacro/pull/20) merged5b97627d7ed7b4e264c834eb8457490ad9353f0c; VM042Closed. Exact6be1019 CI40830321630green/fresh R1APPROVE6490664898/R2APPROVE6500724898, own12PASS→12meaningfulFAIL→12PASS and owncheck232/125/actualChrome1440/390/core4/reloads/data pass. Root actualAPI/canonical log/savedproof audits complete, current23-file export/original verified before normalcleanup and ownedservicesoff/directTCP9closed/PIDsgone. Merge2parents/tree/headancestry/main verified, bothG10refs removed after bundle, maintenancecleanmainFF and occupiedlegacyexceptions preserved. Existing VM035/041 observations and VM057/G25,VM058/G26 stay separate; no deploy/provider/rules/schema change. Final whole-loop certificate remains pending.

## Page

- Route: `/recipes`
- Component: `src/features/recipes/RecipeLibrary.tsx`
- Launch tier: Critical
- Page job: Let a signed-in user view, create, find, inspect, organize, and delete recipes without losing recipe data or trusting controls that are not real yet.
- Entry point: App navigation `Recipes`, sidebar `Create Recipe`, Dashboard/Meal Planner recipe needs, direct `/recipes` route.
- Auth boundary: Protected route. Signed-out users should redirect to `/auth`.

## Task Checklist

2026-06-27 regression repair checklist:

12. [x] Fix recipe card action accessibility and targetability.
   - Outcome: Favorite, edit, and delete actions are visible or keyboard/focus accessible, have clear accessible names, and do not rely on hover-only discovery.
   - Verification target: Manual in-app browser action pass plus targeted recipe library test if existing coverage allows.
   - Ledger target: `BUG-014`, `docs/qa/QA_AUDIT.md`, and `docs/qa/qa-ledger.md`.

13. [x] Fix recipe delete flow from card action through confirmation.
   - Outcome: A user can open delete confirmation from a recipe card, confirm deletion, and the recipe disappears after refresh.
   - Verification target: Manual in-app browser QA on `/recipes`; existing manual create/find/delete emulator test should still pass.
   - Ledger target: `BUG-014`, `docs/qa/QA_AUDIT.md`, and `docs/qa/qa-ledger.md`.

14. [x] Fix AI Search reset behavior.
   - Outcome: Clearing the AI prompt, toggling AI Search off, or clicking All Recipes restores the full library without requiring page reload.
   - Verification target: Manual in-app browser QA on `/recipes`.
   - Ledger target: `BUG-014`, `docs/qa/QA_AUDIT.md`, and `docs/qa/qa-ledger.md`.

15. [x] Clarify Magic Import top action.
   - Outcome: The compact `auto_awesome` button has a stable accessible label and either clearly opens file selection/import or routes to the import page when that is the safer user contract.
   - Verification target: Manual in-app browser QA on `/recipes` and `/recipes/import`.
   - Ledger target: `BUG-014`, `docs/qa/QA_AUDIT.md`, and `docs/qa/qa-ledger.md`.

16. [x] Run focused verification and close or keep `BUG-014` in verify state.
   - Outcome: Relevant checks pass or remaining failures are explicitly logged for the next batch.
   - Verification target: `npm.cmd run lint`, `npm.cmd run build`, and targeted/manual Recipe Library browser QA.
   - Ledger target: `BUG-014`, `docs/qa/qa-ledger.md`.

1. [x] Define Recipe Library page scope and current diagnosis.
   - Outcome: Contract identifies page job, route, data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `src/features/recipes/RecipeLibrary.tsx`, `src/features/recipes/components/RecipeForm.tsx`, `src/features/recipes/components/RecipeDetail.tsx`, `src/features/recipes/recipeService.ts`, existing tests, Firebase Foundation contract, QA ledger, and bug ledger.
   - Ledger target: Recipe Library page contract.

2. [x] Run baseline Recipe Library route smoke.
   - Outcome: A signed-in user reaches `/recipes`, sees `My Kitchen`, sees the search field, and no unexpected console/App Check errors occur.
   - Verification target: Playwright emulator test `direct launch routes render after sign-in without App Check token warnings` passed on 2026-06-25.
   - Ledger target: QA ledger.

3. [x] Prove empty-state import route is honest and live.
   - Outcome: Empty library state does not point to a missing route; `Import your first recipe` reaches `/recipes/import` and shows import controls.
   - Verification target: Playwright emulator test `recipe empty-state import link does not leave the user on a missing route` passed on 2026-06-25.
   - Ledger target: QA ledger.

4. [x] Prove manual recipe create, search, and delete.
   - Outcome: User can create a manual recipe, find it with keyword search, delete it through confirmation, and verify it no longer appears.
   - Verification target: Playwright emulator test `user can create, find, and delete a manual recipe` passed on 2026-06-25.
   - Ledger target: QA ledger.

5. [x] Prove recipe detail and guided cooking entry behavior.
   - Outcome: A recipe card opens detail view, detail view can close, and `Start Guided Cooking` opens a usable guided cooking mode.
   - Verification target: Existing or new Playwright emulator test.
   - Ledger target: QA ledger.

6. [x] Prove active-looking Recipe Library controls are honest.
   - Outcome: Favorite, edit, delete, collections, macro filters, advanced filters, recipe-detail favorite/share, and meal-plan linking either work or clearly show disabled / Coming Soon states.
   - Verification target: Source review plus targeted Playwright assertions.
   - Ledger target: QA ledger; bug ledger if any dead active-looking control remains.

7. [x] Decide and prove filter chip behavior.
   - Outcome: Tag chips either actually filter results or are made honest/disabled until real filtering exists.
   - Verification target: Source review and Playwright proof.
   - Ledger target: QA ledger; bug ledger if active chips remain misleading.

8. [x] Prove Recipe Form save failure recovery.
   - Outcome: Manual recipe save failure gives user-visible feedback and keeps the draft available instead of failing silently.
   - Verification target: Deterministic failure hook plus Playwright emulator test if needed.
   - Ledger target: QA ledger; bug ledger if implementation is needed.

9. [x] Prove AI semantic search failure fallback remains safe.
   - Outcome: If `semanticSearchRecipes` fails, the user sees fallback feedback and can continue with keyword search.
   - Verification target: Playwright emulator test `AI recipe search fails gracefully when the callable returns an error` passed on 2026-06-25.
   - Ledger target: QA ledger.

10. [x] Classify live semantic search readiness.
   - Outcome: Local fallback/guardrails are documented separately from production vector-index readiness.
   - Verification target: Source/manager review against `BUG-009`.
   - Ledger target: Bug ledger and Recipe Library contract.

11. [x] Close Recipe Library page contract.
   - Outcome: No open P0/P1 Recipe Library blockers remain, known deferrals are recorded, and Recipe Import workflow can graduate independently.
   - Verification target: Grouped Recipe Library Playwright emulator run plus lint/build if code changes occur.
   - Ledger target: QA ledger, bug ledger, and app contract roadmap.

## Current Diagnosis

Proven:

- `/recipes` exists and renders `RecipeLibrary.tsx` with the visible heading `My Kitchen`.
- Existing route smoke reaches `/recipes` and checks for the search field.
- Existing Playwright coverage proves manual recipe create, keyword find, delete confirmation, and deletion from the visible library.
- Existing Playwright coverage proves AI recipe search failure falls back to keyword search.
- Firebase Foundation coverage hardens recipe documents, storage rules, AI callable guardrails, import cleanup, and semantic-search local guardrails.
- Many future controls already use disabled / Coming Soon states.

Assumed:

- Live semantic search is not proven until the vector-index gate is handled.

Broken or risky:

- Production semantic search still depends on a live Firestore vector index tracked by `BUG-009`.

## Data And Permissions

Data read:

- Firebase Auth user.
- User recipes under `users/{uid}/recipes`.
- Optional recipe assets under `users/{uid}/recipes/...`.

Data write:

- Manual recipe creation through `addRecipe`.
- Recipe updates through `updateRecipe`.
- Recipe deletion through `deleteRecipe`.
- Favorite toggles through `updateRecipe`.
- Optional image uploads through `uploadRecipeAsset`.

Auth boundary:

- Recipes and assets are private user-owned data.
- Cross-user recipe and asset reads/writes remain denied by Firestore and Storage rules.

Rules or backend boundary:

- Recipe rules validate owner access, allowed fields, required core fields, bounded list sizes, and optional import metadata.
- Semantic search callable remains a backend boundary and production vector index readiness is not proven by local page QA.

## States

Empty state:

- Show `No recipes found`, clear next action, and a working import route link.

Loading state:

- Show a spinner while recipes load.

Error state:

- Recipe load failures currently degrade to an empty list through `setRecipes([])`.
- Manual save failures alert the user and keep the draft open.
- Delete failure alerts the user.
- AI semantic search failure alerts the user and falls back to keyword search.

Mobile expectation:

- `/recipes` should render without horizontal breakage.
- Primary actions `Magic Import`, `New Recipe`, search, recipe cards, and mobile shell navigation remain reachable.

## Risks And Non-Goals

- Do not close Recipe Import lifecycle under this page contract; use `docs/contracts/recipe-import-workflow-contract.md`.
- Do not require live semantic search success until the AI/Functions readiness and vector-index gate are approved.
- Do not implement custom folders, advanced filters, macro filters, recipe-detail sharing, or meal-plan linking in this contract unless active-looking UI is misleading.
- Do not launch Pantry work from this contract.

## Verification Plan

1. Run baseline route smoke for `/recipes`.
2. Prove empty-state import link reaches `/recipes/import`.
3. Prove manual create/search/delete.
4. Prove recipe detail and guided cooking entry.
5. Audit and test active-looking controls.
6. Fix or defer tag filter chip behavior.
7. Add save-failure proof if needed.
8. Reuse semantic-search failure fallback proof.
9. Run grouped Recipe Library proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-25.
- 2026-06-25 route smoke passed through Playwright emulator direct-route test.
- 2026-06-25 empty-state import link proof passed.
- 2026-06-25 manual recipe create/search/delete proof passed.
- 2026-06-25 AI semantic search failure fallback proof passed.
- 2026-06-25 recipe detail and guided cooking proof passed.
- 2026-06-25 active Recipe Library controls proof passed: card favorite and edit work; delete is covered by the manual recipe test; macro filters, advanced filters, new folder, detail favorite/share, and add-to-meal-plan controls are disabled / Coming Soon.
- 2026-06-25 filter chip proof passed after wiring `activeFilters` into visible results and making the initial filter state neutral.
- 2026-06-25 Recipe Form save-failure recovery proof passed after adding a deterministic `addRecipe` failure hook and visible alert while keeping the draft open.
- 2026-06-25 grouped recipe emulator proof passed: 11 tests.
- `npm.cmd run lint`: passed on 2026-06-25.
- `npm.cmd run build`: passed on 2026-06-25 after rerunning outside the restricted sandbox. Non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.

## Open Bugs And Deferrals

Open bugs:

- None for local Recipe Library page-owned workflows after the 2026-06-27 regression repair pass.

Deferred items:

- Production semantic search vector index remains deferred under `BUG-009`; local fallback/error behavior is proven, but live vector search is not a page-contract closure requirement.
- Custom recipe folders, advanced filters, macro filters, recipe-detail favorite/share, and meal-plan linking remain future features.

Revisit trigger:

- Before Recipe Library expansion, live semantic-search testing, or Hosting deploy.

## 2026-06-27 Regression Repair Proof

- Fixed card action discoverability by making favorite, edit, and delete actions visible and giving each action a recipe-specific accessible name.
- Fixed delete state handling so deletion updates the main recipe list, any active AI result list, and an open selected recipe if applicable.
- Fixed saved-recipe refresh so an empty Firestore recipe collection can update the UI instead of preserving stale recipes.
- Fixed AI Search reset by clearing AI results and the query when `All Recipes` is selected, plus adding a dedicated `Clear recipe search` action.
- Clarified Magic Import by making the top action route to `/recipes/import` on the library page and act as a labeled file chooser only on the import page.
- Verification passed:
  - `npm.cmd run lint`
  - `npm.cmd run build` after rerunning outside the restricted sandbox because Vite/esbuild could not resolve the config path inside the sandbox.
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "user can create, find, and delete a manual recipe|recipe library controls either work|AI recipe search can reset|AI recipe search fails gracefully"`: 4 passed.
  - In-app browser manual sanity pass confirmed the leftover `QA Test Recipe Edited` card exposed `Delete recipe: QA Test Recipe Edited`, opened `Delete Recipe?`, and disappeared after confirmation.

## Next Action

Recipe Library is locally graduated for the current private-alpha scope. Continue with the next roadmap contract instead of expanding this page.

## 2026-10-26 G3 image-policy repair

Scope VM-022/033; no upload lifecycle, schema, Firestore rules or CSP changes. Private-alpha graduation above is historical and does not close these newly reproduced defects.

1. [x] Reproduce raw legacy image detail/cooking/preview failures at1440/390 and the unsaved network-path URL normalization, with separate actual helper probe and enforced CSP evidence.
2. [x] Add and prove failing actual-helper/rendered-view/emulator regressions before source edits.
3. [x] Route detail, cooking and preview through shared RecipeThumb; reject normalized network paths and wrong-protocol Storage URLs while preserving supported images.
4. [x] Assess focused/full gates (four exact authorized paused-AI main exceptions retained for G6), pass desktop390 Chrome/reload/console, current CI and both fresh reviews; PR13 merged106303a, VM022/033 Closed without deployment.

Evidence and current status: docs/qa/fix-loop-2026-10-22.md G3; ignored _local/qa/fix-loop-2026-10-22/g3/.
