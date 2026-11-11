# VioMacro Firebase Foundation Contract

Date created: 2026-06-24
Status: Active contract; Firebase foundation tasks 1-6 locally reverified on 2026-06-25; step 7 remains pending

This document is the working contract for Firebase data, security, storage, functions, indexes, and verification. Use it before changing Firestore rules, Storage rules, Firebase Functions, import flows, grocery generation, semantic search, or deployment gates.

The goal is simple: protect private user data, prevent accidental data loss, make every persisted shape explicit, and prove Firebase behavior before Hosting or broader live AI use.

Workflow owner: global `webapp-contract-sprint` skill. Treat this as the Firebase Foundation contract board: complete one checklist item, verify it, then mark it off here.

## Foundation Task Checklist

- [x] 1. Create Firebase Foundation Contract and task checklist.
- [x] 2. Harden Firestore rules in small slices.
  - [x] 2.1 Harden `weightHistory` daily metric rules.
  - [x] 2.2 Harden `groceryItems` rules.
  - [x] 2.3 Harden `pantryItems` rules.
  - [x] 2.4 Harden `mealPlans` rules.
  - [x] 2.5 Harden `recipes` rules without breaking import/create flows.
- [x] 3. Add Firebase rules tests.
  - [x] 3.1 Add first Firestore rules test harness for `weightHistory`.
  - [x] 3.2 Add Firestore rules tests for `groceryItems`.
  - [x] 3.3 Add Firestore rules tests for `pantryItems`, `mealPlans`, and `recipes`.
  - [x] 3.4 Expand rules tests across user settings, folders, and Storage.
  - [ ] 3.5 Add future nested/lifecycle rules tests as those contracts are implemented.
- [x] 4. Fix grocery and recipe import data-loss flows.
  - [x] 4.1 Preserve manual grocery items when refreshing generated items from a meal plan.
  - [x] 4.2 Tag generated grocery items with `source: generated` and the current meal plan ID.
  - [x] 4.3 Clean up uploaded recipe-import assets on parse failure.
  - [x] 4.4 Clean up uploaded recipe-import assets when an imported draft is canceled before save.
- [x] 5. Build Functions contract test lane.
  - [x] 5.1 Add a direct callable contract test script for Firebase Functions.
  - [x] 5.2 Prove Auth, App Check, payload, and emulator live-AI guard behavior.
  - [x] 5.3 Mock Gemini success, provider failure, and malformed JSON without live AI calls.
  - [x] 5.4 Prove semantic-search callable guardrails before vector/provider execution.
- [x] 6. Clean indexes and vector search setup.
  - [x] 6.1 Remove stale composite index definitions for old root-recipe fields.
  - [x] 6.2 Pin server embedding vectors to a Firestore-compatible 1536 dimensions.
  - [x] 6.3 Format document and query embeddings for retrieval-style semantic search.
  - [x] 6.4 Document the required live vector index and keep live creation as a deploy gate.
- [ ] 7. Resume page-by-page QA after foundation passes.

## Current Manager Verdict

Firebase is the right foundation for the current private alpha.

The strongest part is ownership and access control: app data is mostly under `users/{uid}/...`, Firestore denies unknown paths, Storage is owner-scoped, callable Functions require Auth and App Check outside the emulator, Gemini keys stay server-side, and AI quota controls exist.

The weakest remaining part is now live search/deploy proof and deeper workflow lifecycle proof: Functions callable contracts have a local mocked test lane, local vector dimensions are Firestore-compatible, but the live vector index, live AI smoke, UI fallback behavior, and nested data lifecycle rules still need separate gates.

Latest local foundation recertification on 2026-06-25 passed:
- Firestore rules: 19 tests passed.
- Storage rules: 3 tests passed.
- Functions callable contracts: 16 tests passed.
- Functions lint passed.
- App lint passed.
- Production build passed with known non-blocking Vite/Browserslist/chunk warnings.
- `firestore.indexes.json` parsed as valid JSON.
- `git diff --check` found no whitespace errors beyond normal Windows line-ending warnings.

Broad page/browser QA was intentionally not used as foundation proof in this recertification. The Dashboard failure-state detour was resolved later in the Dashboard page contract, not counted as Firebase foundation proof.

## Non-Negotiable Rules

- User data belongs under `users/{uid}/...` unless a future decision record explicitly approves a shared/public model.
- No root-level `recipes`, `weeks`, `mealPlans`, pantry, grocery, or log collections for user-owned private data.
- Client writes must be owner-scoped and shape-validated by Firestore rules where practical.
- Generated data must not overwrite user-entered data without an explicit source flag or confirmation.
- Storage uploads must have an owner, type, lifecycle, and cleanup path.
- Live AI calls must be Auth-protected, App Check-protected, quota-limited, and failure-safe.
- Emulator proof is not live proof. Live canary proof requires explicit approval, budget controls, secrets check, and rollback awareness.

## Firestore Data Contract

### `users/{uid}`

Owner: Firebase Auth user with matching UID.

Purpose:
- User account profile.
- Settings and preferences.
- Current macro/weight targets.

Current writer:
- `src/services/userService.ts`
- `src/app/providers/auth-context.tsx`

Expected fields:
- `email`: string or null
- `createdAt`: timestamp
- `settings`: map

Settings fields currently used:
- `currentWeight`: number, optional
- `goalWeight`: number, optional
- `rateOfChange`: number, optional
- `macroSplit`: map with protein, carbs, fat numbers
- `dietaryTags`: list
- `dailyCalorieTarget`: number
- `allergies`: list
- `measurementUnit`: `imperial` or `metric`
- `onboardingCompleted`: boolean
- `phase`: `fat-loss`, `maintenance`, or `muscle-gain`
- `phaseStartDate`: string
- `bottleSize`: number, optional
- `macroMode`: `percentage` or `grams`, optional
- `macroTargets`: map with protein, carbs, fat numbers, optional
- `updatedAt`: timestamp

Rule status:
- Owner read/create/update exists.
- Delete is denied.
- Settings validation exists but is not enforced.
- Rules tests now prove owner create/read/update, cross-user denial, delete denial, and root collection denial.

Foundation gap:
- Add field allowlist and safe type/range validation without blocking current app writes.

### `users/{uid}/weightHistory/{dateId}`

Owner: Firebase Auth user with matching UID.

Document ID:
- Local date key in `YYYY-MM-DD`.

Purpose:
- Daily weight, hydration, sleep, and biofeedback metrics.

Current writer:
- `src/services/userService.ts`
- Dashboard modals/components.

Expected fields:
- `date`: string, must match document ID when possible
- `timestamp`: timestamp
- `weight`: number, optional
- `waterMl`: number, optional
- `sleepHours`: number, optional
- `sleepQuality`: number, optional
- `sleepNotes`: string, optional
- `energy`: number, optional
- `hunger`: number, optional

Rule status:
- Owner read/create/update/delete exists.
- Create/update now require a valid local date document ID, allowed fields only, required `date` and `timestamp`, safe numeric ranges, and bounded sleep notes.
- Cross-user access remains denied.

Foundation gap:
- Consider delete policy later: user delete may be acceptable for mistaken daily logs, but must be intentional.

Current proof:
- Red test first: `npm.cmd run test:rules:firestore` failed because malformed daily metric logs were still allowed.
- Green verification: `npm.cmd run test:rules:firestore` passed after `weightHistory` rule hardening: 3 tests passed.
- App gates: `npm.cmd run lint` passed; `npm.cmd run build` passed after rerunning outside the sandbox.

### `users/{uid}/recipes/{recipeId}`

Owner: Firebase Auth user with matching UID.

Purpose:
- User recipe library.
- Imported, created, and seeded recipes.
- Semantic search embeddings generated server-side.

Current writers:
- `src/features/recipes/recipeService.ts`
- `src/features/recipes/components/RecipeForm.tsx`
- `src/features/recipes/RecipeLibrary.tsx`
- `functions/src/index.ts` for `embedding`

Expected fields:
- `title`: string
- `mealType`: `breakfast`, `lunch`, `dinner`, `snack`, or `smoothie`
- `tags`: list
- `folders`: list
- `ingredients`: list
- `instructions`: list
- `imageUrl`: string
- `description`: string, optional
- `cookTime`: number
- `servings`: number
- `calories`: number
- `protein`: number
- `carbs`: number
- `fat`: number
- `isFavorite`: boolean, optional
- `source`: `created` or `imported`, optional
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `originalAssetUrl`: string, optional
- `originalAssetPath`: string, optional
- `originalAssetType`: `image` or `pdf`, optional
- `micronutrients`: map, optional
- `embedding`: vector, server-generated

Rule status:
- Owner CRUD exists.
- Create/update now require owner access, allowed fields only, required core recipe fields, safe type/range validation, optional import metadata validation, optional micronutrient map validation, and bounded list sizes for tags, folders, ingredients, and instructions.
- Cross-user access remains denied.
- Nested ingredient and instruction item contents are not deeply validated yet.
- `embedding` remains allowed as an optional field so existing server-generated recipe documents are not blocked during client updates.

Foundation gap:
- Add deeper nested validation once recipe import/create/edit flows are contract-tested in isolation.
- Decide whether client writes may include or preserve `embedding`; likely no long-term, but this needs a server-field strategy.

Data-loss fix:
- Imported files now persist `originalAssetPath` alongside `originalAssetUrl`.
- Uploaded import assets are deleted if parsing fails.
- Uploaded import assets are deleted if the parsed draft opens but the user closes/cancels before saving.

Current proof:
- Red test first: `npm.cmd run test:rules:firestore` failed because malformed recipe writes with bad fields/shapes still succeeded.
- Green rules verification: `npm.cmd run test:rules:firestore` passed: 15 tests passed.
- App gates: `npm.cmd run lint` passed; `npm.cmd run build` passed.
- Browser/emulator proof: `npm.cmd run test:e2e:emulator` passed: 17 tests passed, including manual recipe create/find/delete.
- Data-loss proof: `npm.cmd run test:e2e:emulator:data-loss` passed, including failed recipe image import cleanup.

### `users/{uid}/mealPlans/{planId}`

Owner: Firebase Auth user with matching UID.

Purpose:
- Weekly meal plans.
- AI-generated or manual plans.
- Dashboard/Grocery active plan source.

Current writer:
- `src/features/meal-planning/planService.ts`
- `src/features/meal-planning/MealPlanner.tsx`

Expected fields:
- `weekStart`: string, local canonical week key
- `weekEnd`: string
- `goal`: string
- `days`: list
- `dailyTargets`: map, optional
- `isAiGenerated`: boolean, optional
- `createdAt`: timestamp
- `updatedAt`: timestamp

Rule status:
- Owner CRUD exists.
- Create/update now require owner access, allowed fields only, required `weekStart`, `weekEnd`, `goal`, and `days`, local date-key validation, bounded `days` list size, optional daily target map validation, optional timestamp validation, and optional `isAiGenerated` boolean validation.
- Cross-user access remains denied.

Foundation gap:
- Consider deterministic ID by `weekStart` or transaction protection to avoid duplicate week plans.
- Consider separating daily meal completion logs from the plan template before scale.
- Add deeper nested day/meal validation after meal-plan editing has its own contract tests.

Current proof:
- Red test first: `npm.cmd run test:rules:firestore` failed because malformed meal-plan writes still succeeded.
- Green rules verification: `npm.cmd run test:rules:firestore` passed: 15 tests passed.
- App gates: `npm.cmd run lint` passed; `npm.cmd run build` passed.
- Browser/emulator proof: `npm.cmd run test:e2e:emulator` passed: 17 tests passed, including saved weekly plan recognition by Dashboard and Grocery after reload.

### `users/{uid}/groceryItems/{itemId}`

Owner: Firebase Auth user with matching UID.

Purpose:
- Manual and generated grocery list items.

Current writer:
- `src/features/groceries/shoppingService.ts`
- `src/features/groceries/shopping-generator.ts`

Expected fields:
- `name`: string
- `quantity`: number
- `unit`: string
- `aisle`: string
- `isChecked`: boolean
- `mealPlanId`: string, optional
- `source`: `manual` or `generated`, recommended
- `createdAt`: timestamp, recommended
- `updatedAt`: timestamp, recommended

Rule status:
- Owner CRUD exists.
- Create/update now require owner access, allowed fields only, required `name`, `quantity`, `unit`, `aisle`, and `isChecked`, safe type/range validation, optional timestamp validation, and optional `source` limited to `manual` or `generated`.
- Cross-user access remains denied.

Foundation gap:
- Consider whether delete should remain fully user-allowed or move to a softer archive behavior later.

Data-loss fix:
- Grocery generation now clears only items marked `source: generated`.
- Manual grocery items are preserved across generated-list refreshes.
- Newly generated items are tagged with `source: generated` and `mealPlanId`.

Current proof:
- Red test first: `npm.cmd run test:rules:firestore` failed because malformed `groceryItems` writes still succeeded.
- Green rules verification: `npm.cmd run test:rules:firestore` passed: 6 tests passed.
- App gates: `npm.cmd run lint` passed; `npm.cmd run build` passed.
- Browser/emulator proof: `npm.cmd run test:e2e:emulator` passed: 17 tests passed.
- Extra finding during verification: grocery quick-add/check had a UI race where the user could check a temporary optimistic item before the real Firestore ID existed. `src/app/providers/store.tsx` now refreshes after add instead of exposing a temporary grocery item.
- Data-loss proof: `npm.cmd run test:e2e:emulator:data-loss` passed, proving manual grocery items survive generated-list refresh while stale generated items are replaced.

### `users/{uid}/pantryItems/{itemId}`

Owner: Firebase Auth user with matching UID.

Purpose:
- Pantry inventory.
- Currently under development.

Current writer:
- `src/features/pantry/pantryService.ts`

Expected fields:
- `name`: string
- `quantity`: number
- `unit`: string
- `category`: string, optional
- `expiresAt`: string, optional
- `isLowStock`: boolean
- `createdAt`: timestamp, recommended
- `updatedAt`: timestamp, recommended

Rule status:
- Owner CRUD exists.
- Create/update now require owner access, allowed fields only, required `name`, `quantity`, `unit`, and `isLowStock`, safe type/range validation, optional local expiry date validation, optional category validation, and optional timestamp validation.
- Cross-user access remains denied.

Foundation gap:
- Keep advanced pantry intelligence as Coming Soon until the page contract is reviewed.
- Add deeper pantry lifecycle rules after the Pantry page graduates from Coming Soon into real inventory intelligence.

Current proof:
- Red test first: `npm.cmd run test:rules:firestore` failed because malformed pantry writes still succeeded.
- Green rules verification: `npm.cmd run test:rules:firestore` passed: 15 tests passed.
- App gates: `npm.cmd run lint` passed; `npm.cmd run build` passed.
- Browser/emulator proof: `npm.cmd run test:e2e:emulator` passed: 17 tests passed, including pantry quick-add/delete.

### `users/{uid}/folders/{folderId}`

Owner: Firebase Auth user with matching UID.

Purpose:
- Custom recipe folders or future organization.

Rule status:
- Owner CRUD exists.
- No schema validation.
- Rules tests now prove owner CRUD and cross-user denial.

Foundation gap:
- Either define the shape before use or keep minimal owner-only rules and classify as future.

### `users/{uid}/usage/{usageId}`

Owner:
- Server-admin writes only.
- Client should not read or write.

Purpose:
- AI daily/per-minute usage tracking.

Current writer:
- `functions/src/index.ts`

Rule status:
- Not explicitly matched, so client access is denied by fallback.

Foundation gap:
- Keep denied to clients unless a future UI needs safe read-only quota display.

## Storage Contract

### `users/{uid}/recipes/{assetName}`

Owner: Firebase Auth user with matching UID.

Purpose:
- Recipe images and recipe import PDFs/images.

Current writer:
- `src/features/recipes/recipeService.ts`
- `src/features/recipes/RecipeLibrary.tsx`
- `src/features/recipes/components/RecipeForm.tsx`

Current rule:
- Owner read/write/delete.
- Write requires image or PDF content type and size under 10 MB.
- Storage rules tests now prove owner image upload/read/delete, cross-user denial, unauthenticated denial, and invalid file type denial.

Foundation gap:
- Prefer import draft records for uploaded assets before parsing.
- Consider path structure `users/{uid}/recipes/{recipeId}/images/{assetId}` or `users/{uid}/recipeImports/{importId}/{assetName}` before scale.

Data-loss fix:
- Recipe import now uses `uploadRecipeAsset()` for images and PDFs.
- Imported recipe drafts keep `originalAssetPath` so assets can be cleaned up by path.
- Parse failure and draft cancel both trigger asset cleanup.

## Functions Contract

### Callable Functions

Current functions:
- `generateMealPlan`
- `parseRecipeFromImage`
- `semanticSearchRecipes`

Required controls:
- Require Auth.
- Require App Check outside emulator.
- Keep Gemini key in Firebase Functions secret.
- Apply payload limits.
- Apply AI usage limits outside emulator.
- Block accidental live AI calls in emulator unless explicitly enabled.
- Return friendly, bounded errors to the client.

Current status:
- Most controls exist in `functions/src/index.ts`.
- Direct callable contract tests exist in `functions/tests/callable-contracts.test.cjs`.
- Root script: `npm.cmd run test:functions:contracts`.
- Functions script: `npm.cmd --prefix functions run test:contracts`.
- The local contract lane mocks Gemini and does not require live provider calls.

Foundation gap:
- Add explicit runtime options where appropriate: region, timeout, memory, max instances or concurrency.
- Add UI fallback coverage in page/workflow contracts for friendly user-facing error copy.
- Add deliberate live AI smoke only after budget controls, secrets, App Check, and rollback gates are approved.
- Align Functions runtime metadata. Current package uses Node 22; verify lock/runtime consistency before deploy.

Current proof:
- `npm.cmd run test:functions:contracts` passed: 16 callable contract tests.
- Covered App Check enforcement outside the emulator, Auth requirement, oversized payload rejection, missing input rejection, local emulator live-AI blocking, mocked Gemini success, mocked provider failure, malformed provider JSON, image/PDF parser guardrails, cross-user Storage path denial, and semantic-search query guardrails.
- `npm.cmd --prefix "Web App/functions" run lint` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed after rerunning with elevated filesystem access because the sandbox blocked Vite/esbuild config resolution.

### Firestore Trigger

Current trigger:
- `generateRecipeEmbedding` on `users/{userId}/recipes/{recipeId}` writes `embedding`.
- Embedding vectors are truncated/pinned to `GEMINI_EMBEDDING_DIMENSIONS`, default `1536`, so they fit Firestore vector-index limits.
- Recipe document embeddings use a retrieval-document style input: `title: ... | text: ...`.
- Search query embeddings use a retrieval-query style input: `task: search result | query: ...`.

Foundation gap:
- Confirm vector index and supported production setup.
- Confirm emulator behavior does not call live AI unless intentionally enabled.
- Confirm client rules do not permit unsafe embedding writes.

## Index Contract

Current query map:
- Recipes ordered by `createdAt`.
- Recipes filtered by `imageUrl`.
- Recipes filtered by `originalAssetUrl`.
- Meal plans filtered by `weekStart`.
- Meal plans ordered by `weekStart`.
- Pantry ordered by `expiresAt`.
- Weight history ordered by `date`.
- Semantic search by vector field `embedding`.

Current setup:
- `firestore.indexes.json` is intentionally empty because the previous composite indexes referenced stale root-recipe fields: `uid`, `meal_type`, `created_at`, and `tags`.
- Current collection-scoped single-field queries rely on Firestore automatic single-field indexes.
- Semantic search still needs a live vector index for collection group `recipes`, field `embedding`, dimension `1536`, distance measure used by code: `COSINE`.
- Source basis: Firebase vector search docs say nearest-neighbor queries require a vector index, vector index dimensions must match the embedding field, and vector index dimensions can be up to 2048. Gemini embedding docs say `gemini-embedding-2` defaults to 3072 dimensions and recommends smaller dimensions such as 768, 1536, or 3072.

Live vector index command draft:

```powershell
gcloud firestore indexes composite create `
  --project=viomacro `
  --database="(default)" `
  --collection-group=recipes `
  --query-scope=COLLECTION `
  --field-config="field-path=embedding,vector-config={\"dimension\":\"1536\", \"flat\": \"{}\"}"
```

Foundation gap:
- Create and verify the live vector index before enabling production semantic search.
- Consider moving from `@google/generative-ai` to the newer `@google/genai` SDK later so output dimensionality can be requested directly instead of safely truncating the MRL prefix.

Current proof:
- Source scan found no current code path using the stale composite index fields.
- `firestore.indexes.json` now contains no stale composite indexes.
- `functions/src/index.ts` now pins Firestore vectors to `1536` dimensions by default and validates vectors before writing/querying.
- `npm.cmd run test:functions:contracts` passed: 16 callable contract tests.
- `npm.cmd --prefix "Web App/functions" run lint` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed after rerunning with elevated filesystem access because the sandbox blocked Vite/esbuild config resolution.

## Verification Contract

Before changing rules or data flows:
- Read the affected service file.
- Read the rule path.
- Identify existing Playwright coverage.
- Decide if this is a rules test, service test, Playwright test, or manual proof.

Minimum proof by slice:
- Firestore rule changes: rules negative and positive tests.
- Storage rule changes: upload type/size/path tests.
- Grocery generation changes: emulator test proving manual items are preserved and generated items refresh safely.
- Recipe import changes: test proving failed parse/cancel does not leave an unintended user-visible orphan state.
- Functions changes: Functions build plus contract tests or a documented mocked harness.
- Index changes: build plus emulator/prod query smoke where possible.

## Implementation Order

1. Add this contract.
2. Add rule-test tooling and first negative tests for owner boundaries.
3. Harden `weightHistory` rules first because Dashboard depends on it and the shape is small.
4. Harden `groceryItems` and fix generated-vs-manual lifecycle.
5. Harden `recipes` enough to preserve current create/import flows.
6. Add recipe import draft/cleanup lifecycle.
7. Add Functions contract lane.
8. Review indexes and vector search.
9. Rerun `npm run check`, emulator QA, and production-build emulator smoke.

## Current Open Foundation Items

- `BUG-009`: Semantic Search Live Vector Index Gate.
- Recipe import draft records remain a future architecture option if imports become resumable or background processed.
- Live AI smoke and UI-facing AI fallback proof remain future gates.
- Billing kill switch remains required before broader sharing.
- Hosting deploy remains blocked until readiness gates pass.
