# Recipe Import Workflow Contract

Date created: 2026-06-25
Status: Locally graduated

## Workflow

- Owner workflow: Recipe import from image or PDF into a reviewable recipe draft.
- Routes/surfaces: `/recipes/import`, `src/features/recipes/RecipeLibrary.tsx`, `src/features/recipes/components/RecipeForm.tsx`, Firebase Storage, callable `parseRecipeFromImage`.
- Launch tier: Critical if import is part of private-alpha launch; Important if manual recipe creation is enough for launch.
- User goal: Upload a recipe image or PDF, receive an editable draft, save it only after review, and avoid orphaned uploads when parsing fails or the draft is canceled.
- Entry points:
  - Direct `/recipes/import`.
  - Recipe Library `Magic Import`.
  - Empty-state `Import your first recipe`.
  - Drag/drop on Recipe Library.

## Task Checklist

1. [x] Define Recipe Import workflow scope and current diagnosis.
   - Outcome: Contract identifies workflow job, route, data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `src/features/recipes/RecipeLibrary.tsx`, `src/features/recipes/recipeService.ts`, `src/services/aiService.ts`, Firebase Foundation contract, QA ledger, and bug ledger.
   - Ledger target: Recipe Import workflow contract.

2. [x] Run baseline Recipe Import route smoke.
   - Outcome: A signed-in user reaches `/recipes/import`, sees `Start with Magic Import`, and can access `Choose recipe file`.
   - Verification target: Playwright emulator test `direct launch routes render after sign-in without App Check token warnings` passed on 2026-06-25.
   - Ledger target: QA ledger.

3. [x] Prove Recipe Library empty-state import link reaches the import workflow.
   - Outcome: `Import your first recipe` does not leave the user on a missing route.
   - Verification target: Playwright emulator test `recipe empty-state import link does not leave the user on a missing route` passed on 2026-06-25.
   - Ledger target: QA ledger and Recipe Library page contract.

4. [x] Prove unsupported file type is rejected visibly.
   - Outcome: Uploading an unsupported file type does not upload/parse and gives the user clear feedback.
   - Verification target: Playwright emulator test `recipe import rejects unsupported file types before upload` passed on 2026-06-25.
   - Ledger target: QA ledger.

5. [x] Prove parse failure cleans up uploaded image assets.
   - Outcome: If callable parsing fails after image upload, the uploaded asset is deleted from Storage and the user sees failure feedback.
   - Verification target: Playwright emulator test `data-loss: failed recipe image import cleans up the uploaded asset` passed on 2026-06-25.
   - Ledger target: QA ledger and bug ledger if cleanup regresses.

6. [x] Prove canceled imported draft cleans up uploaded assets.
   - Outcome: If parsing succeeds and opens a draft, closing/canceling before save deletes the pending original asset.
   - Verification target: Playwright emulator test `data-loss: canceling a parsed recipe import cleans up the uploaded asset` passed on 2026-06-25.
   - Ledger target: QA ledger and bug ledger if cleanup regresses.

7. [x] Prove successful import opens a reviewable draft.
   - Outcome: Mocked parser success opens `RecipeForm` with parsed title, ingredients/instructions when available, imported source metadata, and editable fields.
   - Verification target: Playwright emulator tests for parsed import cancel and save passed on 2026-06-25.
   - Ledger target: QA ledger.

8. [x] Prove saving an imported draft persists it as an imported recipe.
   - Outcome: User can save parsed draft and find it in Recipe Library with `source: imported` behavior intact.
   - Verification target: Playwright emulator test `recipe import saves a parsed draft as an imported recipe` passed on 2026-06-25 and verified Firestore `source: imported` plus `originalAssetPath`.
   - Ledger target: QA ledger.

9. [x] Prove import copy and model naming are current and honest.
   - Outcome: User-facing import status does not mention stale model names or overpromise extraction accuracy.
   - Verification target: Source review changed stale `Analyzing with Gemini 2.0...` to model-neutral `Analyzing recipe...` on 2026-06-25.
   - Ledger target: QA ledger.

10. [x] Classify future resumable/background import architecture.
   - Outcome: Decide whether current upload-before-parse flow is acceptable for private alpha, or defer import draft records as a future architecture item.
   - Verification target: Manager review completed on 2026-06-25. Current upload-before-parse flow is acceptable for private alpha because unsupported file, parse failure, cancel, and save paths are proven. Resumable/background import draft records remain deferred.
   - Ledger target: Workflow contract and bug ledger if deferred.

11. [x] Close Recipe Import workflow contract.
   - Outcome: No open P0/P1 import blockers remain, known deferrals are recorded, and Recipe Library can rely on import behavior.
   - Verification target: Grouped import/data-loss Playwright emulator run plus lint/build if code changes occur.
   - Ledger target: QA ledger, bug ledger, and app contract roadmap.

## Current Diagnosis

Proven:

- `/recipes/import` exists through `RecipeLibrary initialAction="import"`.
- Existing emulator route smoke reaches `/recipes/import` and sees `Start with Magic Import`.
- Existing production-build emulator smoke reaches `/recipes/import`.
- Existing data-loss proof shows failed image parse cleans up the uploaded asset.
- `BUG-003` is closed for the current upload-before-parse flow.
- Firebase Foundation contract records Storage owner rules and recipe import cleanup behavior.

Assumed:

- Live provider parsing still needs a deliberate AI/Functions readiness smoke after budget, secrets, App Check, and vector-index gates are approved.

Broken or risky:

- Current import flow uploads before parsing; this is acceptable for private alpha because cleanup paths are proven.
- Resumable/background import draft records remain deferred.

## Data And Permissions

Data read:

- Firebase Auth user.
- Uploaded Storage asset download URL after owner upload.
- Callable parser response from `parseRecipeFromImage`.

Data write:

- Storage asset under `users/{uid}/recipes/...`.
- Recipe draft state in the browser before save.
- Saved imported recipe under `users/{uid}/recipes/{recipeId}` after user review.
- Storage cleanup through `deleteRecipeAsset`.

Auth boundary:

- Import requires an authenticated user.
- Parser must only accept current-user recipe assets or current upload payloads.
- Cross-user Storage paths remain denied.

Rules or backend boundary:

- Storage rules limit owner access and valid asset types.
- Callable parser guardrails validate asset type/size/path before provider execution.
- Live AI/provider behavior is not proven by local emulator mocks.

## States

Empty route state:

- `/recipes/import` shows `Start with Magic Import`, explanation copy, and `Choose recipe file`.

Loading/parsing state:

- Show a visible parsing overlay and current status.

Success state:

- Open a reviewable `RecipeForm` draft. The user must save before the recipe enters the library.

Error state:

- Unsupported type alerts user.
- Parse failure alerts user and cleans up uploaded asset.
- Cleanup failure is logged as warning; future improvement could surface retry/manual cleanup if needed.

Cancel state:

- Closing a parsed imported draft before save should delete the pending uploaded asset.

## Risks And Non-Goals

- Do not require live AI parse success until AI/Functions readiness gates approve live provider testing.
- Do not build resumable/background import drafts in this contract unless current cleanup cannot be proven.
- Do not claim nutrition accuracy from imported data; imported macros are parser suggestions until user review.
- Keep Recipe Library page behavior governed by `docs/contracts/pages/recipe-library.md`.

## Verification Plan

1. Run `/recipes/import` route smoke.
2. Reuse empty-state import link proof.
3. Add unsupported file type proof if missing.
4. Reuse failed parse cleanup proof.
5. Add current successful parse -> reviewable draft proof.
6. Add current parsed draft cancel cleanup proof.
7. Add successful imported draft save proof if missing.
8. Fix stale import status copy and rerun route/import proof.
9. Manager-review resumable import records as deferred or needed.
10. Run grouped import proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-25.
- 2026-06-25 route smoke passed through Playwright emulator direct-route test.
- 2026-06-25 empty-state import link proof passed.
- 2026-06-25 failed image parse cleanup proof passed.
- 2026-06-25 unsupported file rejection proof passed and confirmed no matching asset was uploaded.
- 2026-06-25 parsed draft cancel cleanup proof passed and confirmed uploaded asset deletion.
- 2026-06-25 parsed draft save proof passed and confirmed Firestore `source: imported` plus `originalAssetPath`.
- 2026-06-25 stale model-name import copy was replaced with model-neutral status text by source review.
- 2026-06-25 import architecture review completed: current upload-before-parse flow is acceptable for private alpha; resumable/background import draft records remain deferred.
- 2026-06-25 grouped recipe emulator proof passed: 11 tests, including unsupported type rejection, failed parse cleanup, parsed draft cancel cleanup, and imported draft save with Firestore `source: imported` plus `originalAssetPath`.
- `npm.cmd run lint`: passed on 2026-06-25.
- `npm.cmd run build`: passed on 2026-06-25 after rerunning outside the restricted sandbox. Non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.

## Open Bugs And Deferrals

Open bugs:

- None in completed import lifecycle tasks after task 9.

Deferred items:

- Resumable/background import draft records remain future architecture unless current cleanup proof fails.
- Live AI parse success remains part of AI/Functions readiness, not this local workflow contract.

Revisit trigger:

- Before live AI smoke, resumable/background import work, alternate upload paths, or Hosting deploy.

## Next Action

Recipe Import is locally graduated for the current private-alpha scope. Revisit only before live AI parse smoke, resumable/background import work, or Hosting deploy.
