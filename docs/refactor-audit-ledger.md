# VioMacro Refactor & Audit Ledger

## Folder migration note (2026-10-22)

Dated entries, exact allowlists, quoted excerpts, commit IDs, and path spellings below are historical evidence. Their source paths and line numbers may refer to the earlier Web App/ layout. Local clickable links now target retained files; this does not recertify old line numbers. Current locations are indexed in [docs/README.md](README.md).

Repository cleanup retired the former agent coordination and app-brain files. Paths and recommendations inside dated entries describe the checkout and workflow at that time; they are historical evidence. Current contributor guidance is AGENTS.md, the retained contracts and current PR scope.

Verified 2026-10-22: [#2](https://github.com/sararh95/VioMacro/pull/2) closed; [#3](https://github.com/sararh95/VioMacro/pull/3) merged; [#4](https://github.com/sararh95/VioMacro/pull/4) merged; [#5](https://github.com/sararh95/VioMacro/pull/5) merged. The checked main checkpoint is `87915b969c59210b79ed47703a2b9794f362d078`. Current delivery state is maintained in docs/delivery-map.json; dated audit snapshots below retain their original context.

## Original audit snapshot (2026-08-25)

Date created: 2026-08-25
Original status: **Sweep in progress** — foundation and services complete, pages pending
Original owner: VioMacro Manager
Original scope: Full-codebase read-only audit. **No code has been changed.**

---

## What This File Is

This is the single board for everything found during the full-codebase sweep:
bugs, security weaknesses, performance and cost problems, refactor
opportunities, dead code, and misleading UI.

It is **not** a replacement for the existing ledgers. Use it like this:

| File | Holds |
|---|---|
| `docs/refactor-audit-ledger.md` (this file) | Everything found in the 2026-08 audit sweep, grouped into PR batches |
| `docs/bug-ledger.md` | User-facing defects promoted from here (P0/P1 only) |
| `docs/qa/qa-ledger.md` | Proof that a fix actually worked |

**Promotion rule:** when an item here reaches P0 or P1 and is confirmed by
repro, copy it into `docs/bug-ledger.md` as a `BUG-0xx` and cross-link both IDs.
Everything else stays here until its PR merges.

---

## How To Read An Entry

- **Type** — `Security` / `Bug` / `Data` / `Perf` / `Cost` / `Refactor` / `UX` / `Dead code` / `Docs`
- **Severity** — same scale as `docs/bug-ledger.md`:
  - **P0** outage, data loss, private data exposure, irreversible harm
  - **P1** launch blocker, broken core workflow, no acceptable workaround
  - **P2** real defect with a workaround, or localised failure
  - **P3** cosmetic, rare, low risk, or high fix cost
- **Confidence** — `Confirmed` (read in source, logic is certain) / `Likely` (strong reading, wants a repro) / `Theory` (needs proof before fixing)
- **Effort** — `S` under 1 hour · `M` 1–4 hours · `L` over 4 hours
- **PR batch** — which pull request this ships in. One theme per PR.
- **Status** — `Open` / `In PR` / `Fixed` / `Deferred` / `Rejected`

---

## Rules For This Sweep

1. **Do not fix anything during the sweep.** Record only. Fixing mid-sweep hides
   context and makes PR batching impossible.
2. **One theme per PR.** Never mix a security fix with a refactor. A reviewer
   must be able to reason about one kind of risk at a time.
3. **Every P0/P1 needs a failing test before its fix.** Add it to the PR.
4. **Nothing merges without a `docs/qa/qa-ledger.md` entry.**
5. **Confidence must be raised to `Confirmed` before the fix is written.**
   `Theory` items get a repro task first, not a code change.

---

## Progress — Ordered By Real User Journey

The sweep follows the order a real user meets the app, not file order. A page is
only "Done" when its code is read **and** its links to the next step are checked.

| # | Step in the journey | Route | Files | Static read | Live browser |
|---|---|---|---|---|---|
| — | Foundation: Firebase init, auth context, store, services, rules | — | `lib/**`, `services/**`, `*.rules` | Done | n/a |
| 1 | Sign up / log in | `/auth` | `AuthPage.tsx` | Done | Done |
| 2 | First-run onboarding | `/` overlay | `OnboardingWizard.tsx` | Done | Pending |
| 3 | Daily home | `/` | `Dashboard.tsx` | Done | Pending |
| 4 | Build recipe library | `/recipes` | `features/recipes/**` | Done | Pending |
| 5 | Import a recipe | `/recipes/import` | `RecipeLibrary.tsx` | Done | Pending |
| 6 | Plan the week | `/plan` | `MealPlanner.tsx` | Done | Pending |
| 7 | Generate grocery list | `/grocery` | `ShoppingList.tsx` | Done | Pending |
| 8 | Track pantry | `/pantry` | `Pantry.tsx` | Done | Pending |
| 9 | Review progress | `/progress` | `History.tsx` | Done | Pending |
| 10 | Adjust targets | `/settings` | `Settings.tsx` | Done | Pending |
| — | Nav shell wrapping every step | — | `AppLayout.tsx` | Pending | Pending |
| — | Modals & widgets | — | `components/**` | Pending | Pending |
| — | AI client + Cloud Functions | — | `aiService.ts`, `functions/src/**` | Pending | Pending |
| — | Test coverage gaps | — | `tests/**` | Pending | n/a |

### Live environment used for browser checks

Verified working on 2026-08-25:

- Node v24.18.0, npm 11.16.0, Firebase CLI 15.25.1, OpenJDK 21.0.12
- `npm install` and `npm --prefix functions install` both exit 0
- Auth, Firestore and Storage emulators start cleanly
- Vite dev server serves the app with **zero console errors**
- Protected routes `/plan`, `/settings`, `/dev/map` all correctly redirect a
  signed-out visitor to the auth screen — **the auth boundary works**

---

## Score So Far

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 17 |
| P2 | 55 |
| P3 | 43 |
| **Total** | **115** |

Coverage so far: foundation, services, security rules, the vision-vs-build gap,
and journey steps 1–7 (Auth, Onboarding, Dashboard, Recipe Library, Recipe
Import, Meal Planner, Shopping List, Pantry, Progress/History, Settings).

**Sweep complete.** All ten journey steps, the nav shell, the AI client services,
the Cloud Functions and the test-coverage gaps have all been reviewed, and the
verification baseline has been run green on unchanged code.

**Densest area so far:** the Onboarding Wizard — 8 findings in 342 lines,
including 3 of the 13 P1s. It is also the component that sets the numbers every
other screen depends on, so it is the highest-leverage thing to fix.

Counted by primary type (several items are dual-typed):

| Type | Count |
|---|---|
| Bug | 13 |
| Security | 9 |
| Perf / Cost | 7 |
| Data integrity | 6 |
| Dead code | 5 |
| Refactor | 3 |
| UX / Docs | 1 |

---

## 2026-10-02 delivery correction

The earlier claim that the retired branch had reached remote main was contradicted
by fetched Git refs and GitHub PR metadata. PR3 restores only Web App; PR4 contains
the new core recovery work. Both are open, with no deployment. The remaining
planned rows shift from PR3-PR10 to PR5-PR12; `previous_plan_ids` in the delivery
map preserves the former labels. Historical commit/status text remains unchanged.

The 2026-08 audit counts below describe that audit only. Newly reproduced core
defects are BUG-032 through BUG-036 in `docs/bug-ledger.md`; their verification is
recorded in `docs/qa-ledger.md`. An implemented finding is not proof of a merge or
production release.

## PR Batch Plan — 7 waves, 10 pull requests

### Where the repair stands — 88 of 133 findings closed

| | |
|---|---|
| Findings closed | **88 of 133** |
| P1 still open | **0** (none) |
| P2 still open | 17 |
| Implemented work in PRs | [#1](https://github.com/sararh95/VioMacro/pull/1) — PR1.1, PR1.2, PR1.3, PR1.4, PR1.5, PR1.6, PR1.7, PR1.8, PR1.9, PR1.10, PR1.11, PR1.12, PR1.13, PR1.14, PR1.15, PR1.16<br>[#2](https://github.com/sararh95/VioMacro/pull/2) — PR2 |
| Next | **PR5** |

18 findings were added by the work itself and are not in the original
count of 115 (AUD-116 to AUD-133), found by running and clicking the app.
None of them was visible in a diff.

Two are not code and are waiting on the owner:

- **AUD-061** — turn on Email Enumeration Protection in the Firebase console.
- **AUD-126** — check whether AI Search returns results in the deployed app. If
  it does not, the vector index was never created and the button charges for an
  AI call before failing.

**Definition of Done applies to every row below** — see the section under the
table. A PR is not finished until the app has been driven by hand against the
emulator and the database read back.

This audit summary is maintained deliberately after retirement of its generator. Cross-check current delivery status against docs/delivery-map.json and verified GitHub outcomes. Preserve original AUD/BUG IDs, historical plan IDs, dates and evidence; a recorded implementation does not establish deployment.

### The numbering, and what the "Was" column is for

**Actual delivery IDs match GitHub pull request numbers.** PR3 restores the
audited Web App baseline; PR4 contains core recovery fixes. Remaining audit
rows moved to PR5-PR12 on 2026-10-02. Their former planned IDs remain in
`previous_plan_ids`; future numbers are provisional until creation. Open PRs
are references to implementation work, not evidence of a merge or deployment.

It was not always so. Until 2026-09-10 the plan used its own sequence, PR-1 to
PR-18, invented before any code existed and unrelated to pull requests — so
"PR-12" and "#12" meant different things, which is a trap nobody survives three
months later. Everything that shipped in pull request #1 is now a **step** of
PR1: PR1.1 through PR1.16, still individually addressable.

**The "Was" column is load-bearing.** The commits inside pull request #1 say
the old ids — `(PR-1)`, `(PR-8a)`, `(PR-11d)`. Rewriting that history would
break the open pull request, so the column is the only way back from a commit
message to a row. Finding status lines keep their original wording for the same
reason: `**Fixed** (PR-11d, 2026-09-09)` matches the commit that did it.

The map lives in `docs/delivery-map.json`.

**This table is the authoritative plan.** It is mirrored by the interactive
tracker at `https://claude.ai/code/artifact/de98948b-f269-46cf-8982-b32dbd3998d0`,
which is the same plan with tick-boxes. If the two ever disagree, **this file wins** —
the tracker is a convenience, this is the record.

Every one of the original 115 findings appears in exactly one row. Findings added since (AUD-116 onward) are listed in their own sections and assigned individually. Ship top to bottom;
the ordering encodes real dependencies, not preference.

### Definition of Done for every PR in this plan

A PR in this plan is **not done** until all five of these are true. They are
listed in the order they must happen.

1. `npm run check` exits 0 (lint + typecheck + build + unit tests).
2. The full emulator e2e suite is green, and **the output was read**, not the
   exit code. `67 passed, 0 failed` is a result; `exit 0` is not.
3. Any new test has been **proved able to fail** -- revert the fix, watch it go
   red, restore.
4. **The app is driven by hand in a browser against the running emulator**, and
   every finding the PR claims to fix is exercised through the real UI. Firestore
   is read back with the Admin SDK afterwards, so "it looked right on screen" is
   never the evidence.
5. Anything broken, nearly broken, or surprising along the way is written into
   this ledger and **reported for review** -- including mistakes in the testing
   itself, which are as easy to make as bugs and much easier to mis-report.

Step 4 is not optional and not a formality. It is the step that found
[AUD-121](#aud-121----the-maintenance-scripts-write-to-a-project-id-the-app-never-reads)
(a repair script writing to a project nothing reads, reporting success) and
[AUD-122](#aud-122----five-screens-still-print-lbs-to-a-metric-user)
(a P1 marked Fixed that was fixed on one screen out of six). Neither was visible
in a diff, and neither was caught by the suite.

The per-PR results of that pass are recorded in
[Verification pass: every shipped PR, driven by hand](#verification-pass-every-shipped-pr-driven-by-hand-2026-09-04).

### Wave 1 — Stop the app inventing things

*The app shows made-up recipes, made-up targets, a made-up expiry on every pantry
item, and a fabricated sentence about the user's own adherence. Settings goes
furthest: it can write a stranger's body weight into the database as real.*

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR1.1** | PR-1 | Make metric actually work | AUD-063, 064, 065, 106 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.2** | PR-2 | Delete every invented value | AUD-030, 031, 032, 037, 038, 044, 045, 066, 071, 075, 083, 090, 095, 103, 105 | L | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.3** | PR-3 | Cut the outside world | AUD-072, 091, 104 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |

### Wave 2 — Stop losing what the user typed

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR1.4** | PR-4 | Wrap every read-modify-write in a transaction | AUD-016, 017, 020, 021, 023, 024, 047, 081 | L | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.5** | PR-5 | Give every silent failure a voice | AUD-012, 048, 074, 079, 080, 084 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.6** | PR-6 | One way to read a date | AUD-099 | S | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.7** | PR-7 | Make the stored shape match the type | AUD-036, 039, 082, 092 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |

### Wave 3 — Close the gaps in the rules

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR1.8** | PR-8a | Harden the Firestore and Storage rules | AUD-001, 002, 004, 005, 006, 007, 008, 028, 061 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.9** | PR-8b | Close the AI prompt boundary | AUD-113, 115 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.10** | PR-8c | Lock the recipe embedding field | AUD-003 | S | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |

*PR-8 was one row and three jobs. Rules, the AI prompt boundary, and moving
`embedding` into a server-only collection break in different ways and must be
separable when something goes wrong -- one theme per PR. Two of the original
twelve are not code: AUD-007 is an accepted risk with a client-side follow-up,
and **AUD-061 needs the owner to switch on Email Enumeration Protection in the
Firebase console** -- nothing in this repo can do it.*

### Wave 4 — Fix the floor everything stands on

*Safe now, and not before. Reshaping the store touches every page.*

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR1.11** | PR-9 | Auth session correctness | AUD-010, 011, 013, 013b, 015, 050 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.12** | PR-10 | Stop re-rendering the whole app | AUD-014, 018, 019, 046, 086, 101, 111 | L | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |

### Wave 5 — Stop paying for reads you throw away

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR1.13** | PR-11a | Query cost: limits, filters, ordering | AUD-025, 026, 027, 029, 100 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.14** | PR-11b | Batch the writes that loop | AUD-049, 098 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.15** | PR-11c | Split the bundle | AUD-109, AUD-130 | M | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |
| **PR1.16** | PR-11d | Restructure the plan document | AUD-022 | L | **done** | [#1](https://github.com/sararh95/VioMacro/pull/1) |

*PR-11 was nine findings across three themes plus a schema change. Split, so
a failure points at one thing. **AUD-022 is deliberately last:** it changes the
shape of every stored meal plan, so it needs a migration plan and legacy
handling of its own, not a corner of a cost PR.* not started |
| **PR2** | — | Stop showing saves that never happened | AUD-131, 132 | M | **done** | [#2](https://github.com/sararh95/VioMacro/pull/2) |
| **PR5** | PR-12 | Fix the file lifecycle | AUD-033, 034, 035, 073, 077 | M | not started | — |

*PR2 sits in this table only so the plan reads in pull-request order. It is a
data-integrity fix, not a cost one. AUD-131 and AUD-132 were both found after
the waves were written, and they go first because both lose data on a core
screen. They are one theme: the screen shows a save the server never got --
AUD-131 because the button hides before the write lands, AUD-132 because the
write is skipped entirely.*

### Wave 6 — Make it feel finished

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR6** | PR-13 | Real forms, reachable by keyboard | AUD-057, 058, 059, 060, 062, 070 | M | not started | — |
| **PR7** | PR-14 | One way to show an error | AUD-051, 096, 107, 110 | L | not started | — |
| **PR8** | PR-15 | Onboarding you cannot get stuck in | AUD-067, 068, 069 | M | not started | — |
| **PR9** | PR-16 | Page-level fixes | AUD-076, 078, 085, 093, 094, 097 | M | 1/6 — left: AUD-076, AUD-078, AUD-093, AUD-094, AUD-097 | — |

### Wave 7 — Tidy up

*Pure refactor. The app must behave identically afterwards. Last on purpose, so
it never conflicts with a fix and never gets blamed for one.*

| PR | Was | Theme | Findings | Effort | Progress | PR reference |
|---|---|---|---|---|---|---|
| **PR10** | PR-17 | Delete dead code and log noise | AUD-040, 041, 042, 043, 052, 054, 087, 088, 102, 112, 114 | S | 1/11 — left: AUD-040, AUD-041, AUD-043, AUD-052, AUD-054, AUD-087, AUD-088, AUD-102, AUD-112, AUD-114 | — |
| **PR11** | PR-18 | Split the two giant files | AUD-053, 089 | L | not started | — |
| **PR12** | — | Self-host the two Google fonts | AUD-133 | S | not started | — |

### Not in any PR — these are not bug fixes

| Finding | Why it is out |
|---|---|
| **AUD-009** | Storage quota. Needs an owner decision first — accept the risk under the $50 cap, or build a counter Function. |
| **AUD-055** | The pantry drives nothing. Unbuilt, not broken. Feature work. |
| **AUD-056** | Recipes cannot be pushed into a plan. The button honestly says Coming Soon. Feature work. |

**Count check:** 22 + 20 + 12 + 13 + 13 + 19 + 13 = 112 in PRs, plus 3 out of
scope = **115 findings, all accounted for**.

---

# A. Security Rules

## AUD-001 — User document accepts any field with no validation

- **Type:** Security · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [firestore.rules:233](../firestore.rules) — `allow update: if isOwner(userId);`
- **Problem:** The `users/{userId}` document allows an authenticated owner to write **any** field of **any** shape and size. The comment on that line openly says validation was skipped. There is a written validator, `isValidSettings()` at line 96, that is **never called anywhere in the file**.
- **Impact:** A compromised or buggy client can write junk into the same document Cloud Functions later read for settings. There is no size ceiling short of the 1 MB Firestore document limit, so one bad write can bloat a document that is fetched on every app start.
- **Fix:** Either wire `isValidSettings()` into the update rule, or write a `hasOnly()` key allow-list for the user document that matches the `UserSettings` interface in `src/services/userService.ts:6`. Prefer the key allow-list — the current `isValidSettings()` requires `currentWeight`, `goalWeight` and `dailyCalorieTarget` to all be present and positive, which would reject the default settings written by `createDefaultUserSettings()` (it sets `dailyCalorieTarget: 0`). **Wiring it in as-is would break new-account creation.**
- **Effort:** M · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, branch `fix/pr8a-rules-hardening`, 2026-09-04)
- **Verified in the browser:** on the legacy imperial account, an unknown settings key, a 5000-character profileName, `phase: 'bulking-forever'` and a negative weight all return `permission-denied`, while `bottleSize: 750` and `profileName` save normally.
- **Verify:** Extend `tests/rules/firestore-rules.test.mjs` with a rejected oversized/unknown-key write, plus a passing new-account default write.

## AUD-002 — `isValidSettings()` is dead and would reject new accounts

- **Type:** Dead code / Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [firestore.rules:96-101](../firestore.rules)
- **Problem:** Defined, never referenced. Worse, it demands `dailyCalorieTarget > 0`, but `createDefaultUserSettings()` (`src/services/userService.ts:74`) writes `dailyCalorieTarget: 0`.
- **Impact:** Gives a false sense that settings are validated. A future maintainer wiring it in would silently break account creation.
- **Fix:** Delete it, or rewrite it to match reality and then wire it in. Do this together with AUD-001.
- **Effort:** S · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, branch `fix/pr8a-rules-hardening`, 2026-09-04)
- **Replaced, not deleted.** `isValidSettings()` now takes the settings map as an argument, matches the optional-everything `UserSettings` interface, and is actually called. A brand-new account with `dailyCalorieTarget: 0` still saves -- there is a test for exactly that.

## AUD-003 — Recipe `embedding` field is client-writable and unvalidated

- **Type:** Security / Data · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [firestore.rules:49](../firestore.rules) — `embedding` is in the `hasOnly()` allow-list but has no type or size check.
- **Problem:** `embedding` is meant to be written **only** by the server-side `generateRecipeEmbedding` trigger (`functions/src/index.ts:819`). The rules let the client write it directly, in any shape, at any size.
- **Impact:** A client can forge or corrupt semantic-search vectors, or push a document toward the 1 MB limit. It also means the trigger and the client can fight over the same field.
- **Fix:** Add `&& (!('embedding' in data) || request.auth.token.firebase.sign_in_provider == ...)` is not workable for a same-user trigger. The correct fix is to **move `embedding` out of the recipe document** into a sibling server-only collection (for example `users/{uid}/recipeEmbeddings/{recipeId}`) guarded by `allow read, write: if false`, matching the existing `ops/**` pattern at line 288.
- **Effort:** M · **PR:** **PR1.10** · **Status:** **Fixed** (PR-8c, 2026-09-04) -- by locking the field, not by moving it. Owner's decision, see below.
- **Fix:** `clientDoesNotTouchEmbedding()` in `firestore.rules`. On create, `embedding` must be absent; on update, it must not appear in `diff(resource.data).affectedKeys()`. The client can no longer write, change, or delete it.
- **Why this is complete for the security finding:** the field is written only by the `generateRecipeEmbedding` trigger, which uses the **Admin SDK and therefore bypasses these rules entirely** -- so locking the client out costs the trigger nothing. Confirmed by grep that no client code reads or writes `embedding` anywhere.
- **The trap this could have walked into:** `embedding` had to STAY in the `isValidRecipe()` key allow-list. Editing a recipe sends the whole merged document, vector included, so a rule saying "embedding must never be present" would have made **every recipe the server had already processed permanently uneditable**. There is a test for exactly that case, seeded through `withSecurityRulesDisabled` the way the trigger writes it.
- **Verified by hand:** on a recipe carrying a real `FieldValue.vector`, editing the title and calories through the actual Edit Recipe form saved fine and the vector came back byte-identical; forging one at create time and bolting one on at update time both returned `permission-denied`.
- **Deliberately NOT done -- see [AUD-125](#aud-125----the-search-vector-is-dead-weight-on-every-recipe-read):** moving the vector into a server-only collection. That is a **cost and speed** change, not a security one, and it cannot be verified here.
- **Note:** Links to `BUG-009` (semantic search vector index gate, deferred). Fixing this is a natural prerequisite.

## AUD-004 — URL fields are length-checked but not scheme-checked

- **Type:** Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [firestore.rules:70](../firestore.rules) (`imageUrl`), [firestore.rules:82](../firestore.rules) (`originalAssetUrl`); rendered at [RecipeForm.tsx:476](../src/features/recipes/components/RecipeForm.tsx)
- **Problem:** Both fields accept any string up to 2000 characters. `originalAssetUrl` is then placed straight into an `<a href={...}>`. React warns about `javascript:` URLs but does not remove them.
- **Impact:** Low today — only the account owner can write their own recipes, so this is self-harm at worst. It becomes a real vulnerability the moment recipes are shared, exported, or populated from AI-parsed content.
- **Mitigation already present:** the link correctly carries `rel="noopener noreferrer"` (line 478), so tab-nabbing is **not** an issue.
- **Fix:** Add `data.imageUrl.matches('^(https://|$)')` and the same for `originalAssetUrl` in the rules, and guard the render site with a small `isSafeHttpUrl()` helper.
- **Effort:** S · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, branch `fix/pr8a-rules-hardening`, 2026-09-04)
- **One deliberate exception:** `http://` on `127.0.0.1` / `localhost` is allowed, because `getDownloadURL` against the **Storage emulator** returns exactly that. Without it the rule is right in production and breaks every local recipe import -- the same trap the CSP hit in PR-3. A loopback host cannot occur in a deployed app, so the production surface is unchanged. `tests/rules/firestore-rules.test.mjs` pins both halves: the emulator host is accepted, `http://example.com` is not.

## AUD-005 — Meal plan `days` contents are completely unvalidated

- **Type:** Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [firestore.rules:212-213](../firestore.rules) — `data.days is list && data.days.size() <= 14`
- **Problem:** The array length is capped but nothing inside it is checked. Each day holds a `meals` array of arbitrary objects with arbitrary strings.
- **Impact:** Only the 1 MB document limit stops an oversized plan. A single fat plan document is re-read and fully re-written on every meal checkbox toggle (see AUD-022), so bloat here multiplies cost.
- **Accepted-risk note:** the rule comment says this is deliberate, to avoid blocking nested editing. Keeping it is defensible — but cap the nesting.
- **Fix:** Add a total-size guard, e.g. each day's `meals` list `size() <= 12`. Firestore rules cannot walk deeply, so pair it with client-side validation in `planService.saveMealPlan`.
- **Effort:** M · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, client-side, 2026-09-04)
- **Not fixable in the rules, and that is the finding.** Firestore rules cannot iterate a list, so `days.size() <= 14` is the most they can ever express -- nothing server-side can count the meals inside a day. The guard lives in `src/lib/plan-limits.ts` (`assertPlanWithinLimits`, cap 12) and is called by `saveMealPlan`.
- The helper is a **separate pure module on purpose**: `planService.ts` imports Firebase, which the unit runner cannot resolve, so a guard living there could not be unit-tested at all. Covered by `tests/unit/plan-limits.test.ts`, and the rules test file carries a note saying the gap is deliberate rather than forgotten.
- **Verified in the browser:** saving a plan with 40 meals in one day fails with `2026-08-31 has 40 meals; the limit is 12.`

## AUD-006 — `folders` subcollection has zero validation

- **Type:** Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [firestore.rules:269-274](../firestore.rules)
- **Problem:** `allow create/update: if isOwner(userId)` with no shape check at all. Also, no client code writes to this collection — folder names live in `src/data/mock/mock-data.ts` as `recipeFolders`.
- **Impact:** An unvalidated, unused write surface. Dead attack surface is still attack surface.
- **Fix:** Either delete the rule block (if custom folders are not a real feature yet) or add a validator matching the eventual shape. **Recommend delete** — it can come back when the feature is real.
- **Effort:** S · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, branch `fix/pr8a-rules-hardening`, 2026-09-04)
- **Closed** with `allow read, write: if false`, and the old test that asserted this unused surface worked was replaced by one asserting it is shut. Confirmed first that nothing reads or writes it: the folder names in `RecipeForm` come from a hardcoded list and are stored as strings on the recipe.

## AUD-007 — Storage accepts any file the client *claims* is an image

- **Type:** Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [storage.rules:21-24](../storage.rules) — `request.resource.contentType.matches('image/.*')`
- **Problem:** `contentType` is set by the uploading client, not derived from the file bytes. Any file can be uploaded as `image/png`.
- **Impact:** Genuinely low. Firebase serves the object with the declared content type from `firebasestorage.googleapis.com`, which is a different origin from the app, so a disguised HTML payload cannot script against the app. The real cost is storage of arbitrary binary content.
- **Fix:** Accept the residual risk, but add magic-byte checking client-side in `uploadRecipeAsset` before upload so the user gets an honest error instead of a silent bad upload.
- **Effort:** M · **PR:** **PR1.8** · **Status:** **Accepted risk, documented** (PR-8a, 2026-09-04)
- The reasoning now lives in `storage.rules` next to `isValidFile()`, so the next reader does not have to rediscover it: `contentType` is client-declared, the objects are served from a different origin than the app, and the residual cost is storing arbitrary bytes under the 10 MB cap.
- **Still worth doing:** a magic-byte check in `uploadRecipeAsset` so the user gets an honest error rather than a silent bad upload. That is a client change, not a rules change, and does not belong in a rules PR.

## AUD-008 — Storage rules comment contradicts the rules

- **Type:** Docs · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [storage.rules:5](../storage.rules) — "Anyone authenticated can read"
- **Problem:** The code on line 29 says `allow read: if isOwner(userId)`. The comment describes a **less secure** policy than what ships.
- **Impact:** A future maintainer trusting the comment could weaken the rule to "match the documented intent".
- **Fix:** Delete or correct the comment.
- **Effort:** S · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, branch `fix/pr8a-rules-hardening`, 2026-09-04)
- The header now states what the rules actually do (owner-only read **and** write), and says why the old comment was dangerous rather than merely wrong.

## AUD-009 — No per-user storage quota

- **Type:** Cost / Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [storage.rules:27-32](../storage.rules)
- **Problem:** Each upload is capped at 10 MB, but there is no cap on how many uploads a user makes.
- **Impact:** Unbounded storage bill. The project has a `$20` AI breaker and a `$50` project cap, but nothing equivalent for Storage.
- **Fix:** Storage rules cannot count objects. Add a counter on the user document maintained by a Storage `onFinalize` Cloud Function, and refuse client uploads past a threshold. Alternatively accept and rely on the `$50` project cap.
- **Effort:** L · **PR:** Not in a PR (see the out-of-scope table) · **Status:** Open

---

# B. Auth & Session

## AUD-010 — App renders before the user document exists

- **Type:** Bug · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [auth-context.tsx:33-42](../src/app/providers/auth-context.tsx)
- **Problem:** `setLoading(false)` runs on line 34. `await initializeUser(...)` runs on line 38, **after**. So the app unblocks and starts rendering while the Firestore user document may not exist yet.
- **Impact:** `AppProvider`'s initial load (`store.tsx:127`) can fire `getUserSettings` before `initializeUser` has created the document. `getUserSettings` returns `null`, so the store falls back to `createDefaultUserSettings()` — and the user briefly sees default targets instead of their saved ones. On a slow connection this window is wide.
- **Fix:** Move `setLoading(false)` into a `finally` block after the `initializeUser` await.
- **Effort:** S · **PR:** **PR1.11** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)
- **Verify:** The existing `consumeDevDelay('initializeUserAfterRead')` hook (`userService.ts:144`) exists precisely to test this. Write a Playwright test that sets the delay and asserts saved settings, not defaults, appear.
- **Related:** the auth contract mentions a "delayed initialization race" — confirm whether this is the same one already closed, or a second instance.

## AUD-011 — Profile update destroys the Firebase user object

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed (latent — no live caller yet)
- **Where:** [auth-context.tsx:69](../src/app/providers/auth-context.tsx) — `setUser({ ...auth.currentUser })`
- **Problem:** The Firebase `User` is a class instance. Its methods (`getIdToken`, `reload`, `delete`, `toJSON`) live on the prototype. Object spread copies **own enumerable properties only**, so every method is dropped. What lands in state is a lookalike plain object.
- **Impact:** Latent today — a grep of `src/` shows nothing calls `user.getIdToken()`. It becomes a live crash the first time any code needs a fresh ID token after a profile edit.
- **Fix:** `setUser(auth.currentUser)` and force a re-render another way, or store a separate `profileVersion` counter in state.
- **Effort:** S · **PR:** **PR1.11** · **Status:** **Fixed** (PR-9, 2026-09-08)
- **Confirmed live in the browser console**, not just by reading: on the real signed-in user, `typeof user.getIdToken` is `"function"`, while `typeof { ...user }.getIdToken` is `"undefined"`. The spread copy really did drop every prototype method.
- **Fix:** keep the real `User` instance (`setUser(auth.currentUser)`) and force the re-render with a separate `profileVersion` counter, which is also part of the memoised context value so consumers still update.

## AUD-012 — Failed user initialisation is invisible to the user

- **Type:** UX / Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [auth-context.tsx:39-41](../src/app/providers/auth-context.tsx)
- **Problem:** If `initializeUser` throws, it is written to `console.error` and swallowed. The app proceeds as if sign-in succeeded.
- **Impact:** The user lands on a working-looking app with no settings document. Any later save may fail in a confusing way. This directly conflicts with the project's "honest failure states" principle.
- **Fix:** Add an `initError` to the auth context and render a retry banner in `AppLayout`.
- **Effort:** M · **PR:** **PR1.5** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)

## AUD-013 — Auth context value is rebuilt on every render

- **Type:** Perf · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [auth-context.tsx:73-81](../src/app/providers/auth-context.tsx)
- **Problem:** The five auth functions are recreated each render and the context `value` is a fresh object literal each time. Every `useAuth()` consumer re-renders whenever `AuthProvider` renders.
- **Impact:** Small on its own; compounds badly with AUD-014.
- **Fix:** `useCallback` each function, `useMemo` the value object.
- **Effort:** S · **PR:** **PR1.11** · **Status:** **Fixed** (PR-9, 2026-09-08)
- Each of the five auth functions is now `useCallback`, and the context value is `useMemo`. Consumers no longer re-render merely because `AuthProvider` did.

## AUD-013b — Dead loading branch in the route guard

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [App.tsx:18](../src/app/App.tsx) — `if (loading) return <div>Loading...</div>`
- **Problem:** `AuthProvider` renders `{!loading && children}` (`auth-context.tsx:82`). Children never mount while loading, so this branch is unreachable.
- **Impact:** None functionally. It misleads readers into thinking there is a loading state here.
- **Fix:** Pick one owner of the loading UI. Recommend removing `{!loading && children}` from the provider and keeping the guard, so a real spinner can render inside the app shell.
- **Effort:** S · **PR:** **PR1.11** · **Status:** **Fixed** (PR-9, 2026-09-08)
- Took the recommended option: `AuthProvider` now always renders its children, and `App.tsx` owns the loading UI. One owner instead of two.
- **What that exposed:** with children always mounted, `/auth` rendered the login form while auth was still resolving, so a signed-in user reloading the page would have seen it flash before the redirect. Added an `AuthGate` wrapper showing the same spinner. Removing dead code is not free -- the dead branch was hiding the fact that nothing guarded the auth route.

---

# C. Global Store

## AUD-014 — Every page re-renders on every store change

- **Type:** Perf · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [store.tsx:328-357](../src/app/providers/store.tsx)
- **Problem:** The context `value` is an inline object literal, rebuilt on every render. `updateSettings` is defined inline inside it and is never memoised at all. On top of that, `refreshPlan` depends on `state.activePlan`, which cascades new identities into `updatePlan`, `toggleMealCompletion`, `toggleGroceryCheck` and `deleteGroceryItem`.
- **Impact:** Ticking one meal checkbox re-renders **every** component subscribed to `useAppStore()`, including `MealPlanner.tsx` at 1,690 lines. This is the single biggest performance defect found so far.
- **Fix:** Three steps. (1) Move `updateSettings` into a `useCallback`. (2) Wrap the whole value in `useMemo`. (3) Hold state in a ref for the callbacks that only read it, so their identities stop changing — or split into two contexts, one for state and one for actions.
- **Effort:** L · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08) -- the last P1 in the audit.
- **Fix, the three steps the finding asked for.** State is mirrored into a ref that is assigned during render; every action reads `stateRef.current` instead of closing over a slice of state, so each one depends on `user` alone and keeps its identity for the session. `updateSettings` moved out of the inline object literal into a `useCallback`. The whole context value is `useMemo`d.
- **The ref is assigned during render on purpose.** An effect would update it a tick late, and a callback fired in that window would read stale state -- which is the bug this is meant to remove, not introduce.
- **What it unblocked:** [AUD-086](#aud-086--the-plan-refetch-effect-re-runs-whenever-the-store-changes) was caused entirely by this churn, and the workaround PR-9 needed in `MealPlanner` exists because of it.
- **Verify:** React DevTools Profiler before/after on a meal toggle.

## AUD-015 — Sign-out mid-load can show one user another user's data

- **Type:** Security / Bug · **Severity:** P1 · **Confidence:** Likely
- **Where:** [store.tsx:126-186](../src/app/providers/store.tsx)
- **Problem:** The initial `loadData()` effect has **no cleanup function and no cancellation**. If `user` changes while the three `Promise.allSettled` requests are in flight, the stale responses still `dispatch` into the new user's state.
- **Impact:** Sign out as user A, sign in as user B fast enough, and B can see A's settings, plan or grocery list. On a single-owner private alpha this is near-impossible to hit, but it is a genuine cross-account leak and it will matter the moment a second account exists.
- **Fix:** Standard `let cancelled = false;` guard, returned as the effect cleanup, checked before every dispatch. Also dispatch a full state reset when `user` becomes `null`.
- **Effort:** M · **PR:** **PR1.11** · **Status:** **Fixed** (PR-9, 2026-09-08) · **Confidence raised to Confirmed** -- the finding asked for a reproduction first, and got one.
- **Reproduced 3/3.** With a 5-second delay injected into the settings read, sign in as A, sign out, sign in as B: **B's dashboard showed A's calorie target of 1111.** Not theoretical, and a genuine cross-account leak.
- **Fix, two parts, neither sufficient alone:** a `cancelled` flag returned as the effect cleanup and checked before every dispatch, so a late reply from the previous user is dropped; and a new `RESET_FOR_NEW_USER` action dispatched whenever the user changes, so the incoming user does not see the previous one's data in the gap before their own arrives.
- **Verified by hand in the browser**, not only by the suite: signed out of the imperial account mid-load and straight into a second account. B's dashboard showed **3333 kcal / Muscle Gain** with no trace of A's `1900 kcal` or `206.7 lbs`.
- **The test hook this needed:** `consumeDevDelay('getUserSettings')` was added to `userService.getUserSettings`. Without a way to widen the window the leak cannot be reproduced at all, which is exactly why it sat at "Likely" for so long.
- **Verify:** Needs a repro first — raise Confidence to Confirmed before writing the fix. Use the existing `consumeDevDelay` hook to widen the window.

## AUD-016 — Meal toggle can crash on a bad day index

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [store.tsx:236-241](../src/app/providers/store.tsx)
- **Problem:** `const day = newDays[dayIndex];` then `day.meals.findIndex(...)` with no check that `day` exists. `planService.toggleMealStatus` **does** guard this (`planService.ts:124`), but the optimistic path in the store does not.
- **Impact:** A `TypeError` that unmounts the React tree — a white screen — if `dayIndex` is ever out of range for the current plan. Reachable if a plan is edited in another tab, or if a plan has fewer than 7 days.
- **Fix:** Add the same `if (!day) return;` guard the service already has.
- **Effort:** S · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)

## AUD-017 — `refreshPlan` cannot ever load a first plan

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [store.tsx:190](../src/app/providers/store.tsx) — `if (!user || !state.activePlan) return;`
- **Problem:** The function refuses to run unless a plan is **already** loaded, and it refetches by `state.activePlan.id`. So it can only ever refresh the plan it already has.
- **Impact:** After a plan is created somewhere that does not directly set `activePlan`, calling `refreshPlan()` is a silent no-op. Every error-recovery path in the store calls `refreshPlan()` to roll back — those rollbacks do nothing when `activePlan` is null.
- **Fix:** Fall back to `getMealPlanByDate(user.uid, getWeekStartKey())` when there is no `activePlan.id`.
- **Effort:** S · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)

## AUD-018 — Grocery callbacks capture stale item lists

- **Type:** Bug · **Severity:** P2 · **Confidence:** Likely
- **Where:** [store.tsx:265](../src/app/providers/store.tsx), [store.tsx:299](../src/app/providers/store.tsx)
- **Problem:** `toggleGroceryCheck` and `deleteGroceryItem` build their optimistic next state from `state.groceryItems` captured in the closure.
- **Impact:** Two fast actions (check two boxes quickly, or delete two items) can compute from the same stale snapshot, so the second overwrites the first in the UI. The server write still lands, so a reload corrects it — which reads as a flaky UI.
- **Fix:** Move the optimistic computation into the reducer (`dispatch({type:'TOGGLE_GROCERY', payload:{itemId,isChecked}})`) so it always reads current state.
- **Effort:** M · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08) · **Confidence raised to Confirmed.**
- **Fix as the finding recommended:** the optimistic edit moved into the reducer as `TOGGLE_GROCERY_OPTIMISTIC` and `REMOVE_GROCERY_OPTIMISTIC`, so it always reads current state instead of a closed-over snapshot. The `stateRef` from AUD-014 would not have been enough here: two clicks in the same tick are batched, and the ref is not reassigned between them.
- **Verified by hand:** three grocery checkboxes clicked in a single tick. All three stayed checked on screen and all three were `isChecked: true` in Firestore.

## AUD-019 — Settings rollback costs an extra network read

- **Type:** Perf · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [store.tsx:343-350](../src/app/providers/store.tsx)
- **Problem:** On a failed settings write, the code re-fetches settings from Firestore to roll back. The code comment admits this is a simplification.
- **Impact:** An extra read on every failure, and the rollback itself can fail (it has its own nested try/catch).
- **Fix:** Snapshot `state.userSettings` before the optimistic dispatch and restore it locally.
- **Effort:** S · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08)
- The previous settings object is captured before the optimistic dispatch and restored from memory on failure. No network read, and no nested try/catch that can fail on its own.

---

# D. Data Services

## AUD-020 — Double-saving a plan creates two plans for one week

- **Type:** Data integrity · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [planService.ts:81-103](../src/features/meal-planning/planService.ts)
- **Problem:** `saveMealPlan` reads (`getMealPlanByDate`) then writes (`addDoc`) with **no transaction**. Two saves that overlap both see "no existing plan" and both create one.
- **Impact:** Two documents for the same `weekStart`. `getMealPlanByDate` then returns `snapshot.docs[0]` with **no `orderBy`** (line 66), so which one wins is undefined and can change between reloads. The user's edits appear to vanish and come back. This is a real data-loss-shaped bug.
- **Fix:** Wrap the whole read-check-write in `runTransaction`, the same pattern already used correctly in `userService.initializeUser`. Also add a deterministic `orderBy('updatedAt','desc')` and `limit(1)` to `getMealPlanByDate` as a belt-and-braces guard.
- **Effort:** M · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)
- **Verify:** Emulator test: fire two `saveMealPlan` calls without awaiting the first; assert exactly one document exists.
- **Promote to `bug-ledger.md`:** yes, once repro'd.

## AUD-021 — Meal toggles lose each other's writes

- **Type:** Data integrity · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [planService.ts:118-133](../src/features/meal-planning/planService.ts)
- **Problem:** `toggleMealStatus` fetches the whole plan, edits it in memory, and writes the whole `days` array back. No transaction.
- **Impact:** Tick two meals within one round-trip of each other and the second write, built from the pre-first-write snapshot, erases the first. The UI still shows both ticked because both optimistic updates applied. The loss only appears after reload.
- **Fix:** `runTransaction`, or restructure `isEaten` into a separate small document so toggles do not contend. The in-file comment already flags this trade-off.
- **Effort:** M · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-022 — One checkbox rewrites the entire plan document

- **Type:** Cost / Perf · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [planService.ts:118-133](../src/features/meal-planning/planService.ts)
- **Problem:** Each `isEaten` toggle is 1 document read plus 1 full document write of all 7 days and all their meals.
- **Impact:** A full week of ticking meals is ~21+ full-document reads and writes. Combined with AUD-005 (unbounded plan size) the write payload has no ceiling.
- **Fix:** Same restructure as AUD-021 — a `mealStatus` map keyed by meal id, or a subcollection. Fix both together in PR-2.
- **Effort:** L · **PR:** **PR1.16** · **Status:** **Fixed** (PR-11d, 2026-09-09)
- **Deliberately last in the plan.** This changes the shape of every stored meal plan, so it needs its own migration and legacy handling rather than a corner of a cost PR. It was listed under PR-4's row as well as PR-11's, which made the plan report PR-4 as unfinished long after it shipped; PR-4's row no longer claims it.

### What shipped

`isEaten` moved out of `days[].meals[]` into a flat `mealStatus` map keyed by
meal id. A tick is now `updateDoc(planRef, new FieldPath('mealStatus', mealId), value)`
-- **one field write, no read, no transaction**, and the `days` array never
goes over the wire. A week of ticking went from ~21 reads plus 21
full-document writes to 21 single-field writes.

**AUD-021 is now closed by construction rather than by locking.** Two ticks on
different meals write different fields and cannot collide at all. Two ticks on
the same meal settle last-write-wins, which is the correct answer for a toggle.
The transaction that PR-4 added is gone from this path.

**AUD-023 still holds.** `updateDoc` on a missing document fails with
`not-found`, so the store's catch still refreshes the screen. Dropping the
explicit existence check did not drop the guarantee -- there is a test for it.

### There is no migration script, on purpose

Every plan saved before this change stores its ticks in the array. Rather than
a one-off backfill that can half-run, `hydratePlanStatus` merges both shapes on
every read, so old plans keep their ticks forever and re-saving one moves it to
the new shape. A backfill would have had to touch every plan document of every
account to buy nothing a read-time merge does not already buy.

**The map wins wherever it has an entry, including when that entry is `false`.**
Untick a meal on an old plan and the map records `false` while the array still
says `true`. If the array won, the tick would come back on the next reload and
the user could never clear it. That single case is why this is a key lookup and
not an `||`, and it is covered by a unit test, an e2e test, and the hand pass.

### The bug this nearly shipped with

`extractMealStatus` first read the *incoming* map to decide what to store. That
is wrong for exactly one caller, and it is the common one: the planner ticks a
meal in its local draft while that draft still carries the map as it was
fetched. Saving would have quietly undone the tick the user had just made. It
now reads the meals array, which hydration has already made the merged truth.

### Two things the rules cannot do

`mealStatus` is allow-listed and checked to be a map with at most 200 keys.
Rules cannot iterate a map's values, so nothing server-side proves each value is
a boolean -- the same wall that put the per-day meal cap in the client
(AUD-005). The cap lives in `src/lib/meal-status.ts` next to it.

The service uses `FieldPath` rather than the string `mealStatus.<id>`, because a
dotted string is parsed as a path. Meal ids are UUIDs today, but one dot in one
id would silently write a nested map that nothing reads back. There is a test
that seeds `legacy.meal.7` and proves it stays one key.

### One small thing that had to change with it

Both eaten-toggles were icon-only buttons with no accessible name, so a screen
reader announced them as "button" and a test had no handle to grab. They now
carry `aria-label` and `aria-pressed`. That is PR4 territory, pulled forward
only because an unnamed control is the reason this change could not be tested
through the UI at all.

### Verified

Emulator suite **73/73 green twice**, rules 34 + 3, concurrency 8/8, unit
82/82, build and lint clean. Then by hand against the emulator: a plan seeded in the
old shape rendered its ticks, unticking one stuck across a reload, and the
stored document showed `mealStatus: {"legacy-dinner": false}` with the days
array still holding the original `true` -- untouched, which is the whole saving.

## AUD-023 — `toggleMealStatus` fails silently and the UI lies

- **Type:** Bug · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [planService.ts:120](../src/features/meal-planning/planService.ts), [planService.ts:124](../src/features/meal-planning/planService.ts), [planService.ts:127](../src/features/meal-planning/planService.ts)
- **Problem:** Three separate `return;` statements — plan not found, day not found, meal not found — all return **normally**, not as errors.
- **Impact:** The store's optimistic tick stays on screen. `store.tsx` only calls `refreshPlan()` inside `catch`, and no error is ever thrown, so nothing rolls back. The user sees a ticked meal that was never saved and only discovers it on reload. This is the "misleading UI" category the project explicitly cares about.
- **Fix:** Throw a typed error on each of the three paths so the store's existing `catch` → `refreshPlan()` recovery actually runs.
- **Effort:** S · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-024 — `toggleMealStatus` mutates the object it copied

- **Type:** Bug · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [planService.ts:122-130](../src/features/meal-planning/planService.ts)
- **Problem:** `const updatedDays = [...plan.days]` is a **shallow** copy. `day` is the same object reference as `plan.days[dayIndex]`, and line 130 assigns into `day.meals[mealIndex]`, mutating the original.
- **Impact:** Harmless right now because `plan` is freshly fetched and discarded. It becomes a live bug the moment this function is given a plan from React state.
- **Fix:** Copy the day and its meals array before editing, matching the correct pattern already used in `store.tsx:236-243`.
- **Effort:** S · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)

## AUD-025 — Grocery "clear" operations read the whole collection

- **Type:** Cost · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [shoppingService.ts:66](../src/features/groceries/shoppingService.ts), [shoppingService.ts:87](../src/features/groceries/shoppingService.ts), [shoppingService.ts:101](../src/features/groceries/shoppingService.ts)
- **Problem:** All three clear functions call `getDocs` on the entire collection and then filter in JavaScript.
- **Impact:** You pay to read every grocery item to delete a subset. `clearCheckedItems` should be `query(ref, where('isChecked','==',true))`; `clearGeneratedGroceryItems` should be `where('source','==','generated')` plus an optional `where('mealPlanId','==',id)`.
- **Fix:** Push the filters into the query. The compound one needs a composite index in `firestore.indexes.json` (currently empty).
- **Effort:** M · **PR:** **PR1.13** · **Status:** **Fixed** (PR-11a, 2026-09-08)
- Both filters pushed into the query. **Behaviour preserved deliberately:** an item with no `isChecked` is still not matched by `clearCheckedItems`, and an item with no `source` is still not matched by `clearGeneratedGroceryItems` -- manual items written before AUD-092 have an undefined source and must survive a regenerate.
- The two-equality form needs a composite index. It is declared in `firestore.indexes.json`, which was empty. **The emulator does not enforce indexes**, so a green local run proves nothing about this -- see [AUD-126](#aud-126----firestoreindexesjson-declares-no-vector-index-so-semantic-search-may-already-be-broken-in-production).

## AUD-026 — Batch writes break past 500 items

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [shoppingService.ts:71](../src/features/groceries/shoppingService.ts), [shoppingService.ts:91](../src/features/groceries/shoppingService.ts), [shoppingService.ts:105](../src/features/groceries/shoppingService.ts)
- **Problem:** Firestore caps a `writeBatch` at 500 operations. None of the three clear functions chunk.
- **Impact:** With more than 500 grocery items, `commit()` throws and the clear silently fails. Unlikely today, certain eventually if generated items are never pruned.
- **Fix:** Chunk into batches of 400. Write one shared `deleteInChunks(refs)` helper and use it in all three.
- **Effort:** S · **PR:** **PR1.13** · **Status:** **Fixed** (PR-11a, 2026-09-08)
- One `deleteInChunks(refs)` helper at 400 per batch, used by all three clear functions, so the next one cannot forget.

## AUD-027 — Grocery list has no sort order

- **Type:** Bug / UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [shoppingService.ts:30-36](../src/features/groceries/shoppingService.ts) — the code comment openly says the ordering decision was never made.
- **Problem:** `getDocs` with no `orderBy` returns documents in an unspecified order.
- **Impact:** The grocery list can reshuffle between reloads. Items appear to move on their own. Very confusing while shopping.
- **Fix:** Add `createdAt` on write (the rules already permit it, line 160) and `orderBy('createdAt','asc')` on read.
- **Effort:** S · **PR:** **PR1.13** · **Status:** **Fixed** (PR-11a, 2026-09-08)
- `createdAt` is stamped on write and the list is sorted by it.
- **Sorted in memory, not with `orderBy`, on purpose.** `orderBy('createdAt')` would be cheaper and would have **silently hidden every grocery item saved before this change** -- Firestore omits documents missing the ordered field. That is precisely the AUD-095 regression that already bit this project once in the pantry. Verified by seeding an item with no `createdAt` and confirming it still renders, sorted last.
- **A trap the emulator caught and reading did not:** the first attempt wrote `createdAt` as an ISO string. `firestore.rules` requires `data.createdAt is timestamp`, so **every grocery add was rejected** -- six e2e specs went red at once. Now a `Timestamp`.
- **Verified by hand:** five items added through the real quick-add box, then read five times. Identical order every time, in the order they were added.

## AUD-028 — Recipes without `createdAt` become invisible

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [recipeService.ts:65](../src/features/recipes/recipeService.ts) — `orderBy('createdAt', 'desc')`
- **Problem:** Firestore **silently omits** any document missing the field named in `orderBy`. The rules make `createdAt` optional (`firestore.rules:80`), so a valid write without it is accepted — and then never appears in the library.
- **Impact:** A recipe that saved successfully is simply gone from the list, with no error anywhere. Extremely hard to diagnose from the UI. Every current write path does set `createdAt`, so this is latent — but it is a trap.
- **Fix:** Make `createdAt` **required** in `firestore.rules` (move it into `hasAll`), so the failure is loud instead of silent.
- **Effort:** S · **PR:** **PR1.8** · **Status:** **Fixed** (PR-8a, branch `fix/pr8a-rules-hardening`, 2026-09-04)
- `createdAt` moved into `hasAll`, so a recipe that would have been invisible is now refused at the write instead.

## AUD-029 — Every list read is unbounded

- **Type:** Cost / Perf · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [userService.ts:131](../src/services/userService.ts) (`getWeightHistory`), [planService.ts:70](../src/features/meal-planning/planService.ts) (`getMealPlans`), [recipeService.ts:63](../src/features/recipes/recipeService.ts) (`getRecipes`), [shoppingService.ts:30](../src/features/groceries/shoppingService.ts) (`getGroceryList`)
- **Problem:** None of these queries has a `limit()`.
- **Impact:** Read count and payload grow forever. `getWeightHistory` is one document per day — 365 reads a year, on every Progress page visit. This is the clearest long-term cost leak in the codebase.
- **Fix:** Add `limit()` with paging. For weight history, add a date-range filter driven by the chart's visible window.
- **Effort:** M · **PR:** **PR1.13** · **Status:** **Fixed** (PR-11a, 2026-09-08)
- Ceilings, not page sizes: `MAX_WEIGHT_HISTORY_DAYS` 400, `MAX_MEAL_PLANS` 50, `MAX_RECIPES` 500, `MAX_GROCERY_ITEMS` 500. Each is far above realistic use and exists so one bad loop cannot turn a page load into an unbounded read.
- **`getWeightHistory` needed its order reversed to be capped safely.** It was `orderBy('date','asc')`; adding `limit()` to that returns the OLDEST days and silently drops everything recent. It is now `desc` + `limit`, reversed in memory, so callers still receive ascending order.
- The grocery cap is paired with an in-memory sort rather than `orderBy` -- see AUD-027 for why.

---

# E. Cross-Cutting

## AUD-030 — Fake demo recipes appear in the real recipe picker

- **Type:** Data integrity / UX · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [RecipePicker.tsx:29-31](../src/features/recipes/components/RecipePicker.tsx) and [RecipePicker.tsx:34-36](../src/features/recipes/components/RecipePicker.tsx)
- **Problem:** Two fallbacks to `mockRecipeLibrary`. One when the user has zero recipes, and one **inside the `catch`** — so a Firestore permission error or network failure also silently swaps in 11 fake recipes.
- **Impact:** The user picks a recipe they do not own and adds it to a real meal plan. The stored `recipeId` points at nothing in their Firestore. Downstream lookups then fail — this is the same shape as the already-closed `BUG-022`. Worse, a **failed read is presented as a successful one**, which directly violates the project's honest-failure principle.
- **Fix:** Delete both fallbacks. Show a real empty state ("No recipes yet — add one") and a real error state with retry.
- **Effort:** M · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-031 — The meal plan generator falls back to fake recipes

- **Type:** Data integrity / UX · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:267-279](../src/features/meal-planning/MealPlanner.tsx)
- **Problem:** When the user's recipe library is empty, `userRecipes` is filled with `mockRecipeLibrary` — the comment says "for demo purposes".
- **Impact:** A generated plan can be built entirely from recipes the user has never seen and does not own. Every meal in it carries a dangling `recipeId`.
- **Fix:** Delete the fallback. If the library is empty, block generation and point the user at `/recipes` to add one.
- **Effort:** M · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-032 — The shopping generator *always* loads fake recipes

- **Type:** Data integrity · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [shopping-generator.ts:75-86](../src/features/groceries/shopping-generator.ts)
- **Problem:** This one is not even a fallback. `mockRecipeLibrary` is loaded into the lookup map **unconditionally, every time**, before the user's real recipes are layered on top.
- **Impact:** Any plan meal whose `recipeId` happens to match a mock id resolves to fake ingredients, and those fake ingredients are written into the user's real grocery list as real items. This is the most direct route for fabricated data to reach persistent user state.
- **Fix:** Remove the mock preload entirely. Report unresolvable `recipeId`s honestly in the returned result so the UI can say which meals were skipped.
- **Effort:** M · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-033 — Recipe delete removes files before the record

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [recipeService.ts:103-177](../src/features/recipes/recipeService.ts) — Storage deletes at steps 2 and 3, Firestore delete at step 4 (line 176).
- **Problem:** The order is backwards. Files are deleted first; the document is deleted last.
- **Impact:** If `deleteDoc` fails — offline, rules error, quota — the recipe survives with its image and source file already gone. A permanently broken recipe with no recovery path. The safe order is: delete the document first, then clean up assets, because an orphaned file is cheap and an orphaned record is not.
- **Fix:** Reorder. Delete the Firestore document first, then best-effort the Storage cleanup.
- **Effort:** S · **PR:** **PR5** · **Status:** Open
- **Related:** `BUG-003` (orphaned upload cleanup) is closed for the **import** flow. This is the **delete** flow, which was not covered.

## AUD-034 — Deleting one recipe costs up to four extra round-trips

- **Type:** Perf · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [recipeService.ts:114-142](../src/features/recipes/recipeService.ts)
- **Problem:** Two full collection queries (shared-image check, shared-asset check) plus up to two Storage deletes, per recipe deleted.
- **Impact:** Slow deletes, and cost that scales with library size on every single delete.
- **Fix:** Store a `assetRefCount` on the asset, or give each recipe its own copy of the asset so sharing never happens. Simpler: skip the shared check when `source === 'created'`.
- **Effort:** M · **PR:** **PR5** · **Status:** Open

## AUD-035 — Upload filenames are not sanitised

- **Type:** Security / Bug · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [paths.ts:56](../src/services/firebase/paths.ts) — `${timestamp}_${fileName}` · called from [recipeService.ts:223](../src/features/recipes/recipeService.ts)
- **Problem:** The raw `file.name` from the browser is concatenated into the Storage object path with no cleaning.
- **Impact:** Path traversal is **not** possible — the rules matcher still resolves `userId` from the second segment, so the file stays under the owner's prefix. The real problems are unicode, control characters, very long names, and `/` characters creating unexpected nested paths that later cleanup code will not find.
- **Fix:** Slugify: strip to `[A-Za-z0-9._-]`, cap length at 100, always append a generated id.
- **Effort:** S · **PR:** **PR5** · **Status:** Open

## AUD-036 — `addRecipe` does not strip `id` before writing

- **Type:** Bug · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [recipeService.ts:83-87](../src/features/recipes/recipeService.ts)
- **Problem:** `{...recipe}` is written straight through. The type says `Omit<Recipe,'id'>`, but TypeScript does not remove excess properties at runtime — any caller passing a full `Recipe` object sends `id` as a document **field**.
- **Impact:** `isValidRecipe()`'s `hasOnly()` list has no `id`, so the write is **rejected by the rules**. The user sees a generic permission error for what looks like a valid save.
- **Fix:** Destructure `id` out explicitly before writing.
- **Effort:** S · **PR:** **PR1.7** · **Status:** **Fixed** (PR-7, branch `fix/pr7-schema-truth`, 2026-08-26)

## AUD-037 — `seedInitialRecipes` is dead code

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [recipeService.ts:180-219](../src/features/recipes/recipeService.ts)
- **Problem:** A 40-line function that batch-writes 11 mock recipes into a real user's library. A grep of `src/` finds **no callers**.
- **Impact:** No runtime effect today. It is a loaded gun: one import and a user's real library fills with demo data. Given AUD-030/031/032, this is the same class of problem.
- **Fix:** Delete it.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-038 — `uploadRecipeImage` is dead code

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [recipeService.ts:237-241](../src/features/recipes/recipeService.ts) — already marked "Deprecated" in a comment.
- **Problem:** No callers.
- **Fix:** Delete it.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-039 — `addWeightLog` misclassifies logs

- **Type:** Bug · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [userService.ts:105-108](../src/services/userService.ts) — `Object.keys(data).includes('weight')`
- **Problem:** `Object.keys()` sees a key whose value is `undefined`. So `{ weight: undefined, energy: 4 }` is classified as a `'weight'` log.
- **Impact:** Small. The `type` argument is only used for the dev failure-injection key, so today it only makes test hooks fire under the wrong name. It is still wrong, and `CheckInModal.tsx:82` is a live caller.
- **Fix:** `typeof data.weight === 'number'`.
- **Effort:** S · **PR:** **PR1.7** · **Status:** **Fixed** (PR-7, branch `fix/pr7-schema-truth`, 2026-08-26)

## AUD-040 — 18 `console.log` calls ship to production

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** 18 sites across `src/`, including [MealPlanner.tsx:262](../src/features/meal-planning/MealPlanner.tsx), [shopping-generator.ts:72](../src/features/groceries/shopping-generator.ts), [recipeService.ts:149](../src/features/recipes/recipeService.ts)
- **Problem:** Debug logging left in shipped code. Some of it prints recipe counts and plan contents.
- **Impact:** Console noise makes the project's own QA rule — "no console errors" — harder to verify. Mild information disclosure in a shared browser.
- **Fix:** Replace with a `logger` helper that is a no-op when `import.meta.env.PROD`. Add an ESLint `no-console` rule with an `error`/`warn` allow-list so it cannot regress.
- **Effort:** M · **PR:** **PR10** · **Status:** Open

## AUD-041 — Firebase imports are scattered mid-file

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [firebase.ts:30-33](../src/services/firebase/firebase.ts)
- **Problem:** Four `import` statements sit at line 30, below executable code.
- **Impact:** Style only — ES module imports hoist. It reads as if the emulator connection is conditional on the imports, which it is not.
- **Fix:** Move to the top of the file.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

## AUD-042 — Emulator ports are hardcoded in two places

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [firebase.ts:39-42](../src/services/firebase/firebase.ts) and [firebase.json](../firebase.json) `emulators` block
- **Problem:** Ports 8080 / 9099 / 9199 / 5001 are written in both files. Changing one silently breaks the other.
- **Impact:** A future port change breaks local QA in a confusing way.
- **Fix:** Read the ports from Vite env vars set by `scripts/firebase-emulator.mjs`, or generate a small constants module from `firebase.json`.
- **Effort:** M · **PR:** **PR10** · **Status:** **Fixed** (2026-09-07, pulled forward out of PR-17)
- **Its own prediction came true.** The finding said "a future port change breaks local QA in a confusing way". By the time a port change was actually needed -- an unrelated SSH tunnel holding 8080, see [AUD-127](#aud-127----the-emulator-e2e-suite-went-flaky-two-causes-both-found) -- the ports were written in **six** places, not two: `firebase.json`, `src/lib/firebase.ts`, `tests/e2e/emulator-auth.spec.ts`, `scripts/seed-dev-recipe.mjs`, `scripts/clear-fabricated-expiry.mjs` and `scripts/verify-hosting-artifact.mjs`.
- **Fix:** `firebase.json` is the single source. `scripts/emulator-ports.mjs` reads it; Node consumers import that, and `vite.config.ts` reads it at config time and injects the numbers so the browser client cannot drift.
- **The one that mattered most was the easiest to miss.** `verify-hosting-artifact.mjs` scans a production bundle for leaked emulator endpoints. It hardcoded 8080, so moving Firestore to 8085 would have left that guard scanning for a port nothing uses -- a real leak would have passed silently. Found by grepping every site rather than the obvious two.

## AUD-043 — `VITE_FIREBASE_MEASUREMENT_ID` is set but never used

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** `.env` defines it; [firebase.ts:10-17](../src/services/firebase/firebase.ts) omits it from `firebaseConfig`.
- **Problem:** An environment variable that does nothing.
- **Impact:** Confusion about whether Analytics is enabled. It is not.
- **Fix:** Remove it from `.env` and `.env.example`, or wire up Analytics deliberately.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

---

# F. Vision vs What Is Actually Built

Source of truth for the vision: `docs/reference/northstar-prototype/vio_macro_blueprint_markdown.md`.

The blueprint names **four pillars**. This table is an honest read of how much of
each one exists in code today. It is not a criticism of the build order — it is
the map you need to decide what to build next, and to spot places where the UI
is currently **promising something the code cannot do**.

| Blueprint pillar | Promised | Built today | Gap |
|---|---|---|---|
| **1. Adaptive Coaching Engine** | Dynamic TDEE learned from intake + weight trend; trend-weight smoothing that filters daily noise; weekly recalculation of targets | **Nothing.** Targets are a static percentage split of a number the user typed in Settings (`Dashboard.tsx:95-101`). No TDEE. No trend weight. No weekly recalculation. | **Total.** This is pillar 1 and the app's stated differentiator. |
| **2. Seamless Food & Recipe Management** | URL recipe import; barcode scanner; quick-add; verified food database; copy/paste meals; favourites; clone previous days | Image and PDF import via Gemini ✓. Favourites ✓. Clone Last Week ✓. **No URL import** (the blueprint's headline one-click feature). No barcode. No food database. No per-meal logging at all — the only "logging" is ticking `isEaten` on a meal that was already planned. | **Large.** The 15-second logging promise has no mechanism behind it. |
| **3. Intelligent Meal Planning & Logistics** | Modular building blocks; AI weekly plans; pantry inventory that *feeds the planner*; smart categorised shareable grocery list; delivery integration | AI plan generation ✓. Grocery list generated from plan and grouped by aisle ✓. Batch-lunch preference ✓ (partial building blocks). **Pantry exists but is not connected to the planner at all.** No sharing. No delivery. | **Medium.** The pantry→planner link is the missing keystone. |
| **4. Behavioural Science & Engagement** | Household sharing; guided cooking; positive reinforcement and streaks; smart reminders | Guided cooking ✓ (`GuidedCooking.tsx`). Streak counter ✓ (but see AUD-046). **No household sharing. No reminders** — the notification bell is an honest "coming soon" (`AppLayout.tsx:206`). | **Medium.** |

## AUD-044 — The Dashboard claims an "Adaptive Engine" that does not exist

- **Type:** UX / Honesty · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:305-330](../src/features/dashboard/Dashboard.tsx) and [Dashboard.tsx:389-390](../src/features/dashboard/Dashboard.tsx)
- **Problem:** Three separate claims are made on screen that no code backs up:
  1. A banner headed **"Weekly Check-In Required"** is rendered with **no condition at all** (line 305). It shows on every load, forever, whether or not the user has just checked in.
  2. Its body text is a hardcoded string: *"The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. **Adherence was high last week!**"* (line 315). The adherence claim is fabricated — nothing measures adherence.
  3. A sidebar headed **"Engine Insights"** carries a pulsing **"Live"** badge (line 390). There is no engine and nothing is live.
- **Impact:** The app tells the user a made-up fact about their own behaviour. That is the most damaging kind of dishonest UI — it is not a dead button, it is false information presented as a personal insight. It also directly breaks the project's own rule in `docs/north-star-compass.md`: *"Do not add live-looking controls unless they work"* and *"Prefer honest disabled or Coming Soon states over fake interactivity."*
- **Fix (small, do now):** Make the banner conditional on a real signal — for example, no `weightHistory` entry in the last 7 days. Delete the "Adherence was high last week!" sentence. Change the "Live" badge to an honest label until pillar 1 exists.
- **Fix (real, later):** Build the adaptive engine. Until then the honest framing is "Your Targets", not "Engine Insights".
- **Effort:** S for the honesty fix · L for the engine · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-045 — Dashboard invents macro targets when a plan has none

- **Type:** Data integrity / UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:78](../src/features/dashboard/Dashboard.tsx) — `activePlan.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 65 }`
- **Problem:** If the active plan has no `dailyTargets` (the field is optional in both the type and the rules), the Dashboard silently displays a hardcoded 2000 / 150 / 200 / 65.
- **Impact:** A user whose Settings say 1600 kcal can be shown 2000 kcal as their target for the day, with no indication it is a guess. Same family as AUD-030/031/032 — invented data shown as real.
- **Fix:** Fall back to the user's own settings-derived targets (already computed in `dashboardTargets`), never to a constant. If neither exists, show an empty state pointing at Settings.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-046 — Streak calculation is O(365 × n) on every render

- **Type:** Perf · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:107-127](../src/features/dashboard/Dashboard.tsx)
- **Problem:** A 365-iteration loop, and inside each iteration `weightHistory.some(...)` scans the whole history array.
- **Impact:** With a year of logs that is ~133,000 string comparisons every time `weightHistory` changes — and it changes on every water tap, sleep log and check-in. Combined with AUD-014 (everything re-renders) this is a visible jank source.
- **Fix:** Build a `Set` of date keys once, then loop. Drops it to O(n + 365).
- **Effort:** S · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08)
- A `Set` of date keys is built once, so the 365-iteration loop does a hash lookup instead of rescanning the array. O(365 x n) becomes O(n + 365).

## AUD-047 — Water quick-add is a read-modify-write race

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:144](../src/features/dashboard/Dashboard.tsx) — `const newAmount = (todayLog.waterMl || 0) + amount;`
- **Problem:** The new total is computed from `todayLog`, which comes from state loaded on the last refresh. Two quick taps both read the same base value.
- **Impact:** Tap `+250ml` twice fast and you get 250, not 500. Exactly the same defect class as AUD-021.
- **Fix:** Use a Firestore `increment()` field-value update instead of read-then-write.
- **Effort:** S · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)

## AUD-048 — Water quick-add skips the validation the correction form has

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:140-159](../src/features/dashboard/Dashboard.tsx) vs [Dashboard.tsx:172](../src/features/dashboard/Dashboard.tsx)
- **Problem:** `handleSaveWaterCorrection` correctly checks `0 <= value <= 10000` before writing. `handleLogWater` checks nothing.
- **Impact:** Keep tapping `+250ml` past 10,000 ml and the Firestore rule (`firestore.rules:122`) rejects the write. The user gets `alert("Failed to log water. Please check your connection.")` — a message that blames the network for a validation problem.
- **Fix:** Clamp in `handleLogWater`, and show an honest "daily maximum reached" message.
- **Effort:** S · **PR:** **PR1.5** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)

## AUD-049 — Every water tap refetches the entire weight history

- **Type:** Cost / Perf · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:30-40](../src/features/dashboard/Dashboard.tsx) — effect keyed on `refreshTrigger`
- **Problem:** Every `setRefreshTrigger(prev => prev + 1)` — fired on water add, water correct, sleep save, and check-in close — refetches **all** weight history with no limit (see AUD-029).
- **Impact:** One water tap = one full-collection read. A year of logs is 365 documents read to add 250 ml.
- **Fix:** Update the single changed day in local state instead of refetching everything. Keep the full refetch only for explicit "Retry".
- **Effort:** M · **PR:** **PR1.14** · **Status:** **Fixed** (PR-11b, 2026-09-09)
- **Three of the five triggers replaced with a local merge**, because in those three the app already knows exactly what changed: the water tap (previous total plus the allowed delta), the water correction (an exact value), and the sleep save (which can log a *previous* night, so it patches `data.date`, not today).
- **Two keep the refetch deliberately.** The check-in modal writes its own record and does not report back what it saved, so the Dashboard genuinely does not know — and it is a weekly action, not a per-tap one. The Retry button is the user explicitly asking for fresh data.
- The merge is `src/lib/daily-logs.ts`, a pure module with six tests, including that a sleep save must not wipe the day's water and that the list is never mutated in place.
- **Measured in the browser** on an account seeded with 120 days of history: Firestore requests for one water tap went **4 → 2**. Request count is what could be measured — cross-origin responses do not expose body size — but the 120-document read is gone by construction, because `getWeightHistory` is no longer called on that path.

## AUD-050 — Dashboard history load has no cancellation

- **Type:** Bug · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:30-40](../src/features/dashboard/Dashboard.tsx)
- **Problem:** No cleanup function. A stale response can land after `user` changes. Same class as AUD-015.
- **Fix:** `let cancelled = false` guard in the effect cleanup.
- **Effort:** S · **PR:** **PR1.11** · **Status:** **Fixed** (PR-9, 2026-09-08)
- **The finding named one file. There were five effects across four.** `Dashboard`, `WeightHistoryWidget`, `RecipeLibrary` and two in `MealPlanner` all fetched without cleanup. `RecipePicker` already had the guard and was used as the pattern.
- **One of them needed a different guard, and getting that wrong made things worse.** The plan fetch in `MealPlanner` lists `refreshPlan` as a dependency -- it is never called in the body, it is there to force a refetch, and its identity changes whenever the store's `activePlan` does. A plain `cancelled` boolean therefore cancelled the request that was about to answer, and **sometimes no result was applied at all**: a passing spec became a 1-in-6 failure. Proved it was mine by reverting only that hunk -- 6/6 passed without it, 1/6 failed with it.
- **Replaced with a request sequence number**, so a superseded reply is ignored *and* the newest reply always lands. 8/8 after. The `cancelled` boolean is right where dependencies are stable; it is wrong where they churn. The churning dependency itself is [AUD-014](#aud-014--every-page-re-renders-on-every-store-change)'s territory.

## AUD-051 — Native `alert()` and `prompt()` are used for real workflows

- **Type:** UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** 15 sites. Notably [Dashboard.tsx:197](../src/features/dashboard/Dashboard.tsx) uses `prompt()` to capture bottle size — a **data-entry** step, not just a message. Plus `alert()` at `Dashboard.tsx:155/206/211/242`, `MealPlanner.tsx:604/792/796`, `RecipeLibrary.tsx:118/160/265/315/332`, `RecipeForm.tsx:201/448`, `CheckInModal.tsx:92`, `SleepLogModal.tsx:41`.
- **Problem:** Native dialogs block the main thread, cannot be styled, are suppressible by the browser, are not translatable, and give no retry affordance. Using `prompt()` for data entry is the worst case — some browsers disable it entirely in cross-origin frames.
- **Impact:** Inconsistent error UX. The Dashboard already has a **good** inline error pattern (the retry banner at line 288-302) and a **good** inline form pattern (water correction at line 522). Those should be the standard.
- **This is the missing evidence for `BUG-024`** (native dialog UX watchlist, status "Needs Evidence"). Consider this finding the evidence, and promote `BUG-024` to actionable.
- **Fix:** Replace `prompt()` for bottle size with the same inline-form pattern already used for water correction. Replace `alert()` with a shared toast or inline banner component.
- **Effort:** L (15 sites) · **PR:** **PR7** · **Status:** Open

## AUD-052 — Dead comment block left in the sleep handler

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx:234-239](../src/features/dashboard/Dashboard.tsx) — an `if` block whose entire body is comments.
- **Fix:** Delete.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

## AUD-053 — Dashboard is 794 lines with 11 `useState` hooks

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [Dashboard.tsx](../src/features/dashboard/Dashboard.tsx)
- **Problem:** One component owns greeting, macros, streak, hydration, sleep, weight history, onboarding and check-in.
- **Fix:** Extract `HydrationCard`, `SleepCard` and `useDailyMetrics()`. `MacroCard`, `DayCard` and `MealPill` are already extracted at the bottom of the file — move them to `components/`.
- **Effort:** L · **PR:** **PR11** · **Status:** Open

## AUD-054 — `npm run dev` does not serve where the README says

- **Type:** Docs / Bug · **Severity:** P2 · **Confidence:** Confirmed (reproduced live)
- **Where:** [README.md:32](../README.md) says `http://127.0.0.1:5173/`; [vite.config.ts](../vite.config.ts) sets no `server.host`.
- **Problem:** Vite defaults to binding `localhost`, which on this Windows machine resolves to IPv6 `::1` only. Reproduced today: `curl http://127.0.0.1:5173/` returns **no response**; `curl http://localhost:5173/` returns **HTTP 200**.
- **Impact:** Anyone following the README to start local dev hits a dead page. The Playwright configs are unaffected because they pass `--host 127.0.0.1` explicitly (`playwright.emulator.config.ts:27`) — which is exactly why this has never shown up in QA.
- **Fix:** Add `server: { host: '127.0.0.1' }` to `vite.config.ts` so the README, the Playwright configs and `firebase.ts`'s emulator host all agree on one address.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

---

# G. Are The Pages Actually Connected?

This traces the real journey and marks where a step **fails to hand off** to the next.

```
/auth  ──►  onboarding  ──►  /  ──►  /recipes  ──►  /plan  ──►  /grocery
                                          ▲            │
                                          └── broken ──┘
/pantry ····· not connected to anything ····· 
```

| Link | Works? | Notes |
|---|---|---|
| Signed-out visitor → `/auth` | **Yes** | Verified live today. `/plan`, `/settings`, `/dev/map` all redirect. |
| `/auth` → user document created | **Mostly** | Works, but the app renders before the document exists — AUD-010. |
| New user → onboarding overlay | Yes | `Dashboard.tsx:259` fires it on `!onboardingCompleted`. |
| Onboarding → Dashboard targets | Yes | Certified under CMD-049 per `docs/app-contract-roadmap.md`. |
| Settings → Dashboard / Planner targets | Yes | Certified under CMD-049. |
| Dashboard → `/plan` | Yes | Two links: "Create New Plan" and "Edit Plan". |
| `/recipes` → `/plan` | **NO** | Recipe Detail's "Add to Meal Plan" is a disabled **Coming Soon** button (`RecipeDetail.tsx:140-144`). The only way into a plan is from the Planner side. The blueprint's flow assumes you can push a recipe into a plan. |
| `/plan` picks a recipe | **Broken** | `RecipePicker` silently substitutes fake recipes — AUD-030. |
| `/plan` → `/grocery` | **Broken, two ways** | (a) `shopping-generator` always mixes in fake recipes — AUD-032. (b) Generated items **never appear** on the Grocery page until a full browser reload — AUD-080. |
| `/plan` "Add to List" failure | **Broken** | A failed generation produces no message at all — AUD-079. |
| `/pantry` → `/plan` | **NO** | Blueprint pillar 3 says the pantry should drive recipe selection. Nothing reads `pantryItems` outside the Pantry page. The keystone feature is unwired. |
| `/grocery` → pantry restock | **NO** | Not built. |
| Weight logs → target adjustment | **NO** | AUD-044. The loop the whole product is named for is not closed. |
| Guided cooking → mark meal eaten | Pending check | To verify in the next pass. |

## AUD-055 — The pantry is not connected to anything

- **Type:** Architecture gap · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** `src/pages/Pantry.tsx` is the only reader of `pantryItems`. `plan-generator.ts` and `shopping-generator.ts` never mention it.
- **Problem:** The blueprint calls pantry-aware planning *"a critical, underserved user need"* and *"a powerful retention driver"*. Today the pantry is a standalone list with an honest "Coming Soon" banner and no effect on anything.
- **Impact:** No user-facing bug — the page is honest about being a prototype. But it is the single highest-value unbuilt connection in the product.
- **Fix:** Not a bug fix. This is a feature slice: make `plan-generator` prefer recipes whose ingredients are in stock, and make the grocery generator subtract pantry stock from the list.
- **Effort:** L · **PR:** Not in a PR (see the out-of-scope table) · **Status:** Open
- **Note:** Depends on `BUG-004` (Pantry product decision, deferred).

## AUD-056 — Recipes cannot be pushed into a meal plan

- **Type:** Architecture gap / UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeDetail.tsx:140-144](../src/features/recipes/components/RecipeDetail.tsx) — the button is disabled and labelled "Add to Meal Plan Coming Soon".
- **Problem:** The connection only exists in one direction. From the Planner you can pick a recipe; from a recipe you cannot reach a plan.
- **Impact:** Honest (the button says Coming Soon, which is correct behaviour per the project's rules) but it forces a detour through the Planner for the most natural action in the app.
- **Fix:** Feature slice. Wire the button to the Planner with the recipe pre-selected.
- **Effort:** M · **PR:** Not in a PR (see the out-of-scope table) · **Status:** Open

---

# H. Journey Step 1 — Auth Page (`/auth`)

**What works well.** Google sign-in and password reset are both honestly
disabled with a visible "Coming Soon" label and a `title` explaining why — this
is exactly the pattern `docs/north-star-compass.md` asks for. Login errors
correctly collapse `user-not-found`, `wrong-password` and `invalid-credential`
into one generic "Invalid email or password", which is the right call: it stops
an attacker from discovering which emails have accounts.

## AUD-057 — Pressing Enter does not log you in

- **Type:** Bug / UX · **Severity:** P2 · **Confidence:** Confirmed (reproduced live in browser)
- **Where:** [AuthPage.tsx:183-235](../src/features/auth/AuthPage.tsx) — the fields sit in a `<div className="space-y-4">`, not a `<form>`, and the submit is a plain `onClick` button.
- **Problem:** With no `<form>` there is no implicit submission, so the Enter key does nothing in either field.
- **Reproduced today:** typed an email into the email field, pressed Enter. No request fired, and the "Please enter both email and password" validation message never appeared — proving the handler never ran.
- **Impact:** Every user expects Enter to submit a login. This is the very first interaction in the product and it silently ignores the most common keyboard action. It also means no native browser validation and degraded password-manager behaviour.
- **Fix:** Wrap the fields in `<form onSubmit={...}>`, make the button `type="submit"`, and call `event.preventDefault()`.
- **Effort:** S · **PR:** **PR6** · **Status:** Open
- **Promote to `bug-ledger.md`:** yes.

## AUD-058 — Screen readers announce the placeholder, not the field name

- **Type:** Accessibility · **Severity:** P2 · **Confidence:** Confirmed (read from the live accessibility tree)
- **Where:** [AuthPage.tsx:191-198](../src/features/auth/AuthPage.tsx) and [AuthPage.tsx:203-220](../src/features/auth/AuthPage.tsx) — the `<label>` elements have no `htmlFor`, and the `<input>` elements have no `id`.
- **Problem:** Nothing links the visible label to its field.
- **Reproduced today:** the browser accessibility tree reports the two fields as `textbox "name@example.com"` and `textbox "••••••••"`. The password field's accessible name is literally a row of bullet characters — meaningless to a screen-reader user.
- **Impact:** The login form is not usable with a screen reader. Clicking a label also fails to focus its field.
- **Good news:** the correct pattern already exists in this codebase — see the water-correction form at `Dashboard.tsx:524-529`, which pairs `htmlFor="water-correction-ml"` with a matching `id`. Copy that.
- **Fix:** Add matching `id` / `htmlFor` pairs.
- **Effort:** S · **PR:** **PR6** · **Status:** Open

## AUD-059 — No `autoComplete` attributes on the login fields

- **Type:** UX · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [AuthPage.tsx:192-198](../src/features/auth/AuthPage.tsx), [AuthPage.tsx:214-220](../src/features/auth/AuthPage.tsx)
- **Problem:** No `autoComplete="email"`, and no `autoComplete="current-password"` / `"new-password"` switched on `mode`.
- **Impact:** Browsers and password managers cannot reliably fill or save credentials, and cannot tell a login from a signup.
- **Fix:** Add the attributes; switch the password one on `mode`.
- **Effort:** S · **PR:** **PR6** · **Status:** Open

## AUD-060 — Auth errors are not announced to screen readers

- **Type:** Accessibility · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [AuthPage.tsx:184-188](../src/features/auth/AuthPage.tsx) — the error box has no `role="alert"`.
- **Impact:** A failed login is silent for screen-reader users. `Dashboard.tsx:290` does this correctly, so the codebase is inconsistent.
- **Fix:** Add `role="alert"`.
- **Effort:** S · **PR:** **PR6** · **Status:** Open

## AUD-061 — Signup reveals whether an email already has an account

- **Type:** Security · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [AuthPage.tsx:64-65](../src/features/auth/AuthPage.tsx) — `auth/email-already-in-use` → "Email already in use".
- **Problem:** The login path is carefully non-enumerable, but the signup path is not. Anyone can test an email address for membership by attempting to register it.
- **Impact:** Low for a private alpha with one user. It matters if the app opens up. Note that Firebase Auth has a project-level **Email Enumeration Protection** setting that closes this properly.
- **Fix:** Enable Email Enumeration Protection in the Firebase console, and soften the message.
- **Effort:** S · **PR:** **PR1.8** · **Status:** **Owner action required** -- not fixable in this repo
- Firebase Auth itself produces `auth/email-already-in-use`. Softening the wording in `AuthPage.tsx` would be theatre: the provider still behaves differently for a real address than a fake one.
- **What closes it:** Firebase console → Authentication → Settings → turn on **Email enumeration protection**.
- **After it is on:** errors become less specific (`auth/invalid-credential` in place of a precise reason). Re-check that nothing in `AuthPage.tsx` depends on the old codes.
- **Note:** Console setting — needs owner action, not just code.

## AUD-062 — Fields stay editable while the request is in flight

- **Type:** UX · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [AuthPage.tsx:227](../src/features/auth/AuthPage.tsx) — only the submit button honours `loading`.
- **Fix:** Disable both inputs while `loading` is true.
- **Effort:** S · **PR:** **PR6** · **Status:** Open

---

# I. Journey Step 2 — Onboarding Wizard

This is the most defect-dense component found so far. It is also the component
that sets the numbers every other screen depends on.

## AUD-063 — The calorie calculator is wrong for metric users

- **Type:** Bug · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:75](../src/features/auth/OnboardingWizard.tsx) — `const weightKg = formData.currentWeight * 0.453592;`
- **Problem:** The Mifflin-St Jeor calculation **unconditionally** converts the entered weight from pounds to kilograms. It never checks `formData.measurementUnit`, even though the wizard offers a Metric / Imperial toggle two steps earlier (line 174-177) and `createDefaultUserSettings()` makes **metric the default**.
- **Impact:** A metric user entering 75 (kg) has it treated as 75 lb → 34.0 kg. Their BMR is computed from a body less than half their real mass.
  **Worked example** — 75 kg, 5'10" (177.8 cm), 30-year-old man, activity 1.55:
  - Correct: BMR = 10(75) + 6.25(177.8) − 5(30) + 5 = 1716 → TDEE **≈ 2,660 kcal**
  - This code: BMR = 10(34.0) + 6.25(177.8) − 5(30) + 5 = 1306 → TDEE **≈ 2,025 kcal**
  - Shortfall **≈ 635 kcal/day**, and it scales with body mass — a heavier user is underfed by more.

  Every downstream screen — Dashboard macros, meal plan generation, grocery quantities — inherits the error.
- **This is the single most consequential correctness bug in the audit.** It is the only real calculation the app performs, and it silently produces a health-relevant wrong answer for the default unit setting.
- **Fix:** Branch on `formData.measurementUnit`. Only convert when the unit is imperial.
- **Effort:** S · **PR:** **PR1.1** · **Status:** **Fixed** (PR-1, branch `fix/pr1-metric-units`, 2026-08-26)
- **Verify:** Unit-test `calculateTDEE` against known Mifflin-St Jeor values in both units. There is currently **no test file for this function at all**.
- **Promote to `bug-ledger.md`:** yes, as P1.

## AUD-064 — Weight fields always say "lbs" even in metric mode

- **Type:** Bug / UX · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:157](../src/features/auth/OnboardingWizard.tsx) and [OnboardingWizard.tsx:169](../src/features/auth/OnboardingWizard.tsx) — the suffix is the hardcoded string `lbs`.
- **Problem:** The unit toggle changes `formData.measurementUnit` but nothing in the UI reacts to it. The suffix stays "lbs" forever.
- **Impact:** This is what makes AUD-063 invisible. A metric user sees "lbs", may enter a pounds value to match the label, and now the stored `currentWeight` unit disagrees with `measurementUnit` — corrupting weight-history charts and progress tracking later.
- **Fix:** Drive the suffix from `formData.measurementUnit`. Convert the entered value when the toggle changes, or clear the field and warn.
- **Effort:** S · **PR:** **PR1.1** · **Status:** **Fixed** (PR-1 fixed the wizard only, 2026-08-26; the other five screens were missed and are fixed under [AUD-122](#aud-122----five-screens-still-print-lbs-to-a-metric-user), 2026-09-04)
- **The "Where" above named one file. There were six.** The wizard fix was real but partial, and the ledger recorded the finding closed. Verified end to end in a browser on 2026-09-04.
- **Promote to `bug-ledger.md`:** yes.

## AUD-065 — Height can only be entered in feet and inches

- **Type:** Bug / UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:230-243](../src/features/auth/OnboardingWizard.tsx) — two inputs, "Height (ft)" and "Height (in)". No metric alternative anywhere.
- **Impact:** A metric user must convert their own height by hand to use the calculator. Combined with AUD-063 and AUD-064, metric is effectively unsupported despite being the default.
- **Fix:** Add a cm input shown when the unit is metric.
- **Effort:** M · **PR:** **PR1.1** · **Status:** **Fixed** (PR-1, branch `fix/pr1-metric-units`, 2026-08-26)

## AUD-066 — "Use Balanced Macros" is a dead checkbox

- **Type:** Bug / Dead control · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:276](../src/features/auth/OnboardingWizard.tsx) — `<input type="checkbox" ... defaultChecked />`
- **Problem:** The checkbox is uncontrolled. It has no `checked` prop, no `onChange`, and its state is never read anywhere in the file. `macroSplit` is not part of `formData` (line 9-16) and is never sent by `completeOnboarding`.
- **Impact:** The user can untick "Use Balanced Macros — 30% Protein / 35% Carbs / 35% Fat" and absolutely nothing happens. It is a live-looking control in the app's primary setup workflow that does nothing at all. `docs/north-star-compass.md` lists exactly this — *"A dead control that looks active in a primary workflow"* — under **Fix immediately**.
- **Fix:** Either wire it to a real alternative macro split, or replace it with plain static text stating the default split.
- **Effort:** S (make it honest) / M (make it work) · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-067 — Clearing a number field stores `NaN`

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:154](../src/features/auth/OnboardingWizard.tsx), [:166](../src/features/auth/OnboardingWizard.tsx), [:234](../src/features/auth/OnboardingWizard.tsx), [:243](../src/features/auth/OnboardingWizard.tsx) — all use bare `parseInt(e.target.value)`.
- **Problem:** `parseInt('')` returns `NaN`. There is no fallback.
- **Impact:** Clear the weight box and `currentWeight` becomes `NaN`. `calculateTDEE` then returns `NaN`, and `updateSettings` can persist it. Firestore stores `NaN` as a valid double, so it survives a reload and every screen that reads the value shows `NaN`. The rules do not block it — `isValidSettings()` would have, but it is never wired in (see AUD-001).
- **Fix:** `const n = Number.parseInt(e.target.value, 10); setFormData({...f, currentWeight: Number.isFinite(n) ? n : 0})`.
- **Effort:** S · **PR:** **PR8** · **Status:** Open

## AUD-068 — A failed save locks the user out of the whole app

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:99](../src/features/auth/OnboardingWizard.tsx) (`fixed inset-0 z-50` full-screen overlay) and [OnboardingWizard.tsx:322-326](../src/features/auth/OnboardingWizard.tsx)
- **Problem:** "Skip Setup" is only offered on **step 0**. From step 1 onward the left button becomes "Back". There is no close button, no Escape handler, and no way out other than a successful save.
- **Impact:** If `updateSettings` keeps failing — offline, rules rejection, quota — the user is trapped behind an opaque overlay with no route to the rest of the app. The error message says *"Please retry before leaving this screen"*, but there is no way to leave the screen.
- **Fix:** Keep "Skip Setup" visible on every step, and reveal an explicit escape once an error has occurred.
- **Effort:** S · **PR:** **PR8** · **Status:** Open

## AUD-069 — Onboarding can complete with every value at zero

- **Type:** Bug / Data · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [OnboardingWizard.tsx:42-52](../src/features/auth/OnboardingWizard.tsx) — `handleNext` and `handleSkip` perform no validation.
- **Problem:** You can press Next through every step and finish with `currentWeight: 0`, `goalWeight: 0`, `dailyCalorieTarget: 0`. Skipping does the same by design.
- **Impact:** The Dashboard then shows a 0 kcal target, and `dashboardTargets` computes 0 for every macro (`Dashboard.tsx:98-100` short-circuits on falsy calories). The user reaches a working-looking home screen with no usable targets and no prompt to fix it.
- **Fix:** Require weight and calorie target before "Finish Setup" enables. Keep Skip as an explicit, clearly-labelled choice that routes the user to Settings afterwards.
- **Effort:** M · **PR:** **PR8** · **Status:** Open
- **Related:** this is the same mismatch as AUD-002 — the unused `isValidSettings()` rule would reject exactly these values.

## AUD-070 — Onboarding labels are not associated with their inputs

- **Type:** Accessibility · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** Every `<label>` in [OnboardingWizard.tsx](../src/features/auth/OnboardingWizard.tsx) — lines 149, 161, 185, 210, 221, 230, 239, 248, 290, 308 — none has `htmlFor`, and no input has an `id`.
- **Impact:** Same as AUD-058. The one exception is line 275, where the checkbox is nested inside its label, which is a valid association — though that control is dead anyway (AUD-066).
- **Fix:** Add `id` / `htmlFor` pairs throughout.
- **Effort:** M · **PR:** **PR6** · **Status:** Open

---

# J. Journey Step 4–5 — Recipe Library & Import (`/recipes`, `/recipes/import`)

**What works well.** The import flow's asset cleanup is genuinely careful:
`processFile` deletes the uploaded file if parsing throws (line 255-264), and
`handleRecipeFormClose` deletes it if the user cancels the draft (line 290-294),
tracked through `pendingImportAssetPathRef`. That is `BUG-003` properly closed —
with one hole, below. The "Coming Soon" states on folders, macro filters and
advanced filters are all honestly disabled.

## AUD-071 — Every imported recipe is given a made-up cook time and serving count

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:226-227](../src/features/recipes/RecipeLibrary.tsx) — `cookTime: 30, servings: 4` are hardcoded into every draft.
- **Problem:** These two values are never read from the AI response. The `ParsedRecipeData` interface (line 23-34) does not even declare `cookTime` or `servings`, so if the model returns them they are silently dropped.
- **Impact:** Every imported recipe claims 30 minutes and 4 servings. That is invented data presented as parsed-from-your-recipe. It also breaks a filter: the "Under 30m" chip tests `r.cookTime <= 30` (line 411), so **every imported recipe always matches "Under 30m"**, whether it takes 5 minutes or 3 hours.
- **Fix:** Add `cookTime` and `servings` to `ParsedRecipeData`, ask the model for them, and leave the fields blank in the draft form when the model does not supply them — a blank the user fills in is honest; a fabricated 30 is not.
- **Effort:** M · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-072 — All PDF imports share one hardcoded stock photo from an external site

- **Type:** Data integrity / Privacy · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:177](../src/features/recipes/RecipeLibrary.tsx) — `imageUrl = 'https://images.unsplash.com/photo-1544787210-...'`
- **Problem:** Every recipe imported from a PDF is assigned the same third-party stock image as its own picture.
- **Impact:** Three separate problems.
  1. **Honesty** — a generic stock photo is shown as if it were this recipe's image.
  2. **Availability** — the app now depends on `images.unsplash.com` staying up and keeping that photo ID. If it 404s, every PDF recipe in the library breaks at once.
  3. **Privacy** — rendering any PDF recipe sends a request to Unsplash from the user's browser, leaking a referrer and IP to a third party. Nothing else in the app does this.
- **Fix:** Ship a local placeholder asset, or render an honest empty image slot with the recipe's initial. Never point user data at an external CDN.
- **Effort:** S · **PR:** **PR1.3** · **Status:** **Fixed** (PR-3, branch `fix/pr3-no-external-hosts`, 2026-08-26)

## AUD-073 — Navigating away mid-import leaves an orphaned file in Storage

- **Type:** Bug / Cost · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx](../src/features/recipes/RecipeLibrary.tsx) — the component has exactly two `useEffect` calls (lines 340 and 350) and **neither returns a cleanup function**.
- **Problem:** `pendingImportAssetPathRef` is only drained by `handleRecipeFormClose` and `handleRecipeSaved`. If the user uploads a file, the draft form opens, and they then click a nav link instead of Cancel, the component unmounts and the ref is discarded — the uploaded file stays in Storage forever.
- **Impact:** Silent, permanent storage growth that no UI ever surfaces. Combined with AUD-009 (no per-user storage quota) there is nothing to stop it accumulating.
- **This is the hole in `BUG-003`.** That bug was closed for the cancel and parse-failure paths. The navigate-away path was never covered, and the page contract does not mention it.
- **Fix:** Add an unmount cleanup effect that deletes `pendingImportAssetPathRef.current`. Consider also a scheduled Cloud Function that sweeps Storage objects with no matching recipe document.
- **Effort:** S for the unmount fix · **PR:** **PR5** · **Status:** Open
- **Promote to `bug-ledger.md`:** yes — reopen or link to `BUG-003`.

## AUD-074 — Favouriting a recipe has no error handling

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:366-380](../src/features/recipes/RecipeLibrary.tsx)
- **Problem:** The optimistic state update happens on line 372, then `await updateRecipe(...)` runs on line 378 with **no `try`/`catch`**.
- **Impact:** If the write fails the heart stays filled but Firestore never changed, so the favourite silently vanishes on reload. The unhandled rejection also surfaces as a raw console error, which breaks the project's "no console errors" QA rule.
- **Fix:** Wrap in try/catch, revert the optimistic update on failure, surface an inline message.
- **Effort:** S · **PR:** **PR1.5** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)

## AUD-075 — Favouriting branches on demo data

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:377](../src/features/recipes/RecipeLibrary.tsx) — `if (recipe.id && !mockRecipeLibrary.find(m => m.id === recipeId))`
- **Problem:** Production save logic consults the demo recipe list to decide whether to persist.
- **Impact:** Any real recipe whose Firestore document ID happens to match a mock ID would never have its favourite saved. More importantly it is another place where demo data is load-bearing in a real code path — same family as AUD-030/031/032.
- **Fix:** Delete the mock check. Once the mock fallbacks in PR-1 are gone, this branch has no reason to exist.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-076 — The "Low Carb" filter hides zero-carb recipes

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:409](../src/features/recipes/RecipeLibrary.tsx) — `return normalizedTags.includes('low carb') || (r.carbs > 0 && r.carbs < 50);`
- **Problem:** The `r.carbs > 0` guard excludes recipes with exactly zero carbs — which are the *most* low-carb recipes there are.
- **Impact:** Filtering by Low Carb hides the best matches. The guard was presumably meant to skip recipes with no macro data entered, but it cannot tell "0 carbs" from "unknown".
- **Fix:** Use `r.carbs < 50` and handle missing data explicitly (e.g. treat `undefined` as unknown rather than coercing to 0).
- **Effort:** S · **PR:** **PR9** · **Status:** Open

## AUD-077 — Imported files are transferred twice

- **Type:** Cost / Perf · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:169](../src/features/recipes/RecipeLibrary.tsx) uploads the file to Storage; [RecipeLibrary.tsx:183-203](../src/features/recipes/RecipeLibrary.tsx) then reads the same file as base64 and sends it again inside the callable request.
- **Problem:** The same bytes leave the user's device twice, and base64 inflates the second copy by about 33%.
- **Impact:** For a 10 MB PDF (the ceiling `storage.rules:23` allows) that is 10 MB to Storage plus ~13.3 MB to the Function. Slow on a phone, and it doubles the egress bill.
- **Fix:** The file is already in Storage before parsing starts. Send `parseRecipeFromImage` the storage path and let the Function read it with the Admin SDK — it already imports `getStorage` (`functions/src/index.ts:8`).
- **Effort:** M · **PR:** **PR5** · **Status:** Open

## AUD-078 — AI search reuses the whole-page loading state

- **Type:** UX · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:321](../src/features/recipes/RecipeLibrary.tsx) — `setLoading(true)` is the same flag as the initial library load.
- **Impact:** Running a semantic search blanks the entire recipe grid and shows the first-load skeleton, so the user loses their place.
- **Fix:** Add a separate `isSearching` flag and show a spinner in the search field only.
- **Effort:** S · **PR:** **PR9** · **Status:** Open

---

# K. Journey Step 6 — Meal Planner (`/plan`)

The largest file in the app: 1,690 lines, 26 `useState` hooks, 6 `useEffect`
hooks and 15 handlers in one component.

## AUD-079 — "Add to List" does nothing, silently, when generation fails

- **Type:** Bug · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:790-793](../src/features/meal-planning/MealPlanner.tsx) — `if (result.success) { alert(...) }` with **no `else`**.
- **Problem:** `generateGroceryList` has three success-shaped returns and one failure return. `shopping-generator.ts:66` returns `{ success: false, message: "No recipes in plan" }` — and the caller checks only the truthy branch. There is no `else`, so a failed generation produces no alert, no banner, no console message, nothing.
- **Impact:** The user clicks "Add to List". The button un-disables. Absolutely nothing else happens. They cannot tell whether it worked, whether it is still running, or whether it failed. The failure message the generator carefully returns is thrown away.
- **Fix:** Handle the `else`, surface `result.message`, and use an inline banner rather than `alert()` (the page already has `PlannerNoticeBanner` — use it).
- **Effort:** S · **PR:** **PR1.5** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-080 — Generated grocery items do not appear on the Grocery page

- **Type:** Bug / Broken connection · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [shopping-generator.ts:3](../src/features/groceries/shopping-generator.ts), [ShoppingList.tsx:1-17](../src/features/groceries/ShoppingList.tsx), [store.tsx:126](../src/app/providers/store.tsx)
- **Problem:** Three facts combine into a broken handoff:
  1. `shopping-generator.ts` imports `addGroceryItem` **directly from the service layer**, bypassing the store entirely.
  2. `ShoppingList.tsx` imports only `useState` — it has **no `useEffect` at all** and never calls `refreshGrocery()`. It renders `groceryItems` straight out of the store.
  3. The store loads `groceryItems` exactly once, in the initial `loadData()` effect keyed on `user`.
- **Impact:** Generate a grocery list from the Meal Planner, see "Added 12 items to your shopping list!", navigate to `/grocery` — **and the new items are not there.** The store's array was never updated, and nothing on the Grocery page asks it to reload. Only a full browser reload (which remounts `AppProvider`) surfaces them.
- **Why it was missed:** the Grocery page's own quick-add works fine, because it goes through the *store's* `addGroceryItem`, which calls `refreshGrocery()` afterwards (`store.tsx:281-284`). Only the cross-page path is broken, so single-page testing never catches it.
- **Fix:** Call `refreshGrocery()` after a successful `generateGroceryList`, or move grocery generation into a store action so every write path refreshes consistently. Longer term, a Firestore `onSnapshot` listener removes this whole class of bug.
- **Effort:** S for the immediate fix · **PR:** **PR1.5** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes. This is the clearest broken page-to-page connection in the app.

## AUD-081 — Toggling a meal mutates React state in place

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:774-775](../src/features/meal-planning/MealPlanner.tsx)
- **Problem:** `const newDays = [...displayPlan.days]` copies the **array**, not the day objects inside it. Line 775 then writes `newDays[dayIndex].meals[mealIndex] = {...}` — and `newDays[dayIndex]` is the very same object as `displayPlan.days[dayIndex]`, whose `.meals` is the very same array. The assignment mutates it directly.
- **Impact:** `displayPlan` can be `contextActivePlan` — a value owned by the global store. This mutates store state from outside the reducer. The store's own copy silently diverges from what its reducer believes, and because the array identity never changed, memoised consumers may not re-render.
- **Difference from AUD-024:** that one mutates a freshly-fetched throwaway object, so it is latent. **This one mutates live React state.**
- **Fix:** Deep-copy the day and its meals array, exactly as `store.tsx:236-243` already does correctly.
- **Effort:** S · **PR:** **PR1.4** · **Status:** **Fixed** (PR-4, branch `fix/pr4-transactions`, 2026-08-26)

## AUD-082 — `isAiGenerated` is never actually saved

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:536-574](../src/features/meal-planning/MealPlanner.tsx) (the save payload) vs [MealPlanner.tsx:592](../src/features/meal-planning/MealPlanner.tsx)
- **Problem:** The object passed to `saveMealPlan` contains `weekStart`, `weekEnd`, `goal`, `days` and optionally `dailyTargets` — but **no `isAiGenerated`**. Immediately afterwards, line 592 sets `isAiGenerated: false` in local state.
- **Impact:** The field exists in the `MealPlan` type (`planService.ts:38`) and is permitted by the rules (`firestore.rules:222`), but Firestore never receives it. After any reload, `isAiGenerated` is `undefined` for every plan. Local state claims `false`, the database says nothing, and there is no way to tell an AI plan from a manual one.
- **Fix:** Include `isAiGenerated` in the save payload, sourced from the plan being confirmed.
- **Effort:** S · **PR:** **PR1.7** · **Status:** **Fixed** (PR-7, branch `fix/pr7-schema-truth`, 2026-08-26)

## AUD-083 — Meal detail invents a cook time and serving count

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:627-628](../src/features/meal-planning/MealPlanner.tsx) — `cookTime: 15, // Default` and `servings: 4, // Default fallback`
- **Problem:** When a planned meal has no matching recipe document, the app builds a display object with fabricated values.
- **Impact:** The recipe detail panel shows "15 min" and "4 servings" as though they were real. Same family as AUD-071 and AUD-045 — three separate places now invent plausible-looking numbers.
- **Fix:** Make these fields optional on the display object and render an em-dash when unknown.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-084 — Clicking a meal fails silently

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:637-639](../src/features/meal-planning/MealPlanner.tsx) — `catch (err) { console.log("Could not load recipe details", err); }`
- **Problem:** Two defects in three lines. The error is logged with `console.log` rather than `console.error`, so it does not show as an error; and the user gets no feedback at all — the detail panel simply never opens.
- **Impact:** A failed recipe read looks identical to a dead button.
- **Fix:** Use the existing `PlannerNoticeBanner` to report the failure.
- **Effort:** S · **PR:** **PR1.5** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)

## AUD-085 — "Add to List" and "Save Plan" share one busy flag

- **Type:** UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:787](../src/features/meal-planning/MealPlanner.tsx) — the code comment says *"Reuse saving state or create new one? reuse is fine for blocking UI"*.
- **Impact:** Clicking "Add to List" disables the Save button and can flip its label to "Saving...", implying the plan is being saved when it is not. Two unrelated operations report each other's progress.
- **Fix:** Give grocery generation its own `isAddingToList` flag.
- **Effort:** S · **PR:** **PR9** · **Status:** **Fixed** (PR-5, branch `fix/pr5-no-silent-failures`, 2026-08-26)

## AUD-086 — The plan refetch effect re-runs whenever the store changes

- **Type:** Perf · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:298](../src/features/meal-planning/MealPlanner.tsx) — dependency array includes `refreshPlan`.
- **Problem:** `refreshPlan` is a `useCallback` keyed on `state.activePlan` (`store.tsx:203`), so its identity changes every time the active plan changes. That re-triggers this effect and issues another Firestore query.
- **Impact:** Saving a plan calls `refreshPlan()` (line 600), which changes `activePlan`, which changes `refreshPlan`'s identity, which refetches the plan again. Extra reads on every save. Not an infinite loop — `setFetchedPlan` is local state — but pure waste.
- **Fix:** Remove `refreshPlan` from the dependency array, or fix its identity churn in PR-5 (AUD-014).
- **Effort:** S · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08)
- **Both halves of the finding's fix, because one alone was not safe.** [AUD-014](#aud-014--every-page-re-renders-on-every-store-change) made `refreshPlan`'s identity stable, which removed the redundant refetch -- but that churn was **accidentally load-bearing**: it was the only thing re-running this effect after a save, and without it `fetchedPlan` could shadow a fresher `contextActivePlan` for the same week.
- The dependency is now `contextActivePlan` -- the thing that actually changed -- rather than a function identity. One refetch when the plan really changes, none otherwise.

## AUD-087 — A `useEffect` that contains no code

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:321-330](../src/features/meal-planning/MealPlanner.tsx)
- **Problem:** The effect runs `if (today.getDay() === 6) { }` where the block body is **entirely comments** — five lines of unresolved design questions about a Saturday planning prompt.
- **Impact:** Ships a no-op effect to production and leaves a reader thinking a Saturday feature exists. It does not.
- **Fix:** Delete it, and put the Saturday-prompt idea in the feature registry.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

## AUD-088 — Commented-out deliberation left inside the save path

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx:575-581](../src/features/meal-planning/MealPlanner.tsx) — seven consecutive comment lines mid-function, including `// window.location.reload(); // Too harsh.`
- **Impact:** Noise in the most important function on the page. Also line 600's `refreshPlan?.()` uses optional chaining on a value that is always defined.
- **Fix:** Delete the commented block; drop the unnecessary `?.`.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

## AUD-089 — `MealPlanner.tsx` is 1,690 lines

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [MealPlanner.tsx](../src/features/meal-planning/MealPlanner.tsx)
- **Problem:** 26 `useState` hooks, 6 `useEffect` hooks, 15 handlers, plus day/week/month view rendering, five modals and the grocery handoff — all in one component.
- **Impact:** It is the hardest file in the codebase to change safely, and it is the one that owns the most user-visible workflows. Several bugs above (AUD-081, AUD-085, AUD-087) are the kind that hide in a file this size.
- **Fix:** Extract `useWeekPlan()` (fetch/draft/display resolution), `usePlanGeneration()` (wizard + AI), and a `PlannerWeekGrid` component. Do it **after** PR-5, or the store refactor will conflict.
- **Effort:** L · **PR:** **PR11** · **Status:** Open

---

# L. Journey Step 7 — Shopping List (`/grocery`)

**This page has the best error handling and accessibility in the app.** All
three write handlers (`handleQuickAdd`, `toggleItem`, `handleDelete`) check
their return value and set an inline `listError` rendered with `role="alert"`.
The quick-add input supports the Enter key. The checkboxes carry proper
`aria-label` and `aria-pressed`. **Use this page as the reference pattern** when
fixing AUD-051 (native dialogs) and AUD-057/058 (form semantics) elsewhere.

## AUD-090 — Fake collaborator avatars imply sharing that does not exist

- **Type:** UX / Honesty · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [ShoppingList.tsx:158-161](../src/features/groceries/ShoppingList.tsx) — two gradient avatar circles and a badge reading `+2`.
- **Problem:** This is the standard visual language for "3 other people are collaborating on this list". No sharing feature exists. The button immediately to its right is honestly labelled **"Share Coming Soon"** (line 167) — so the same header contains an honest disabled control and a decorative element contradicting it.
- **Impact:** Household sharing is a real blueprint promise (Pillar 4). Showing fake participants suggests it is already working. Same family as AUD-044.
- **Fix:** Delete the avatar stack until sharing exists.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-091 — A second hardcoded external stock photo

- **Type:** Privacy / Availability · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [ShoppingList.tsx:98](../src/features/groceries/ShoppingList.tsx) — `src="https://images.unsplash.com/photo-1512621776951-..."` in the "Meal Plan Source" card.
- **Problem:** Same defect as AUD-072, in a different place. A decorative image loaded from a third-party CDN on every visit to the Grocery page.
- **Impact:** Leaks the user's IP and referrer to Unsplash, and breaks if the photo ID is retired. These are the **only two** external network calls the app makes outside Firebase — fixing both removes the entire third-party surface.
- **Fix:** Replace with a local asset or a CSS gradient. Then add a lint rule or a CSP that forbids external image hosts, so a third one cannot creep in.
- **Effort:** S · **PR:** **PR1.3** · **Status:** **Fixed** (PR-3, branch `fix/pr3-no-external-hosts`, 2026-08-26)

## AUD-092 — Manually added items are not tagged as manual

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [ShoppingList.tsx:51-57](../src/features/groceries/ShoppingList.tsx) — the `newItem` object sets `name`, `quantity`, `unit`, `aisle`, `isChecked` and **no `source`**.
- **Problem:** `GroceryItem.source` is typed `'manual' | 'generated'` (`shoppingService.ts:13`) and the rules permit it (`firestore.rules:159`), but the quick-add path never sets it. Every hand-added item is stored with `source: undefined`.
- **Impact:** It works today only by accident. `clearGeneratedGroceryItems` filters on `source === 'generated'`, so undefined items happen to survive — which is the desired behaviour. But the guarantee is accidental: any future code that filters on `source === 'manual'` (a "show only my items" toggle, an export, a merge) will silently drop every existing manual item. The Meal Planner's regenerate flow depends on this distinction being correct.
- **Fix:** Set `source: 'manual'` explicitly here, and backfill existing documents.
- **Effort:** S · **PR:** **PR1.7** · **Status:** **Fixed** (PR-7, branch `fix/pr7-schema-truth`, 2026-08-26)

## AUD-093 — An item with an unexpected aisle renders nowhere

- **Type:** Bug · **Severity:** P3 · **Confidence:** Confirmed (latent — not reachable through the UI today)
- **Where:** [ShoppingList.tsx:81-83](../src/features/groceries/ShoppingList.tsx) and [ShoppingList.tsx:209-211](../src/features/groceries/ShoppingList.tsx)
- **Problem:** The page renders exactly five hardcoded buckets and filters with `item.aisle === category` — an exact string match. There is no catch-all for an aisle outside that list.
- **Verified safe today:** `guessAisle` (`shopping-generator.ts:5-12`) can only ever return one of those same five strings, and it is the only writer of `aisle` on both the quick-add path and the generator path. So no item can currently go missing.
- **Why it still matters:** the Firestore rules accept **any** string up to 80 characters for `aisle` (`firestore.rules:154-156`). A document written by a future import, a data migration, or a manual console edit would vanish from the UI entirely — present in `items`, counted nowhere, rendered nowhere, with no error. Note the empty state only checks `items.length === 0`, so the user would see buckets that do not add up rather than a clear "nothing here".
- **Fix:** Group by the distinct aisles actually present in the data, with the five known ones ordered first, or add an explicit fallback bucket.
- **Effort:** S · **PR:** **PR9** · **Status:** Open

## AUD-094 — Quick-add parsing mishandles common inputs

- **Type:** Bug · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [ShoppingList.tsx:30-46](../src/features/groceries/ShoppingList.tsx)
- **Problem:** The parser splits on spaces and tests `parseFloat(parts[0])`. Three concrete failures:
  - `"2kg flour"` → `parseFloat("2kg")` is `2`, but `parts[1]` is `"flour"`, not a unit, so it becomes quantity 2 of an item named "flour" — **the kg is silently lost**.
  - `"1/2 cup rice"` → `parseFloat("1/2")` is `1`, so it records **1 cup**, not a half.
  - `"2"` on its own → an item literally named `"2"`.
- **Impact:** Wrong quantities on a shopping list, with no indication anything was misread. The placeholder invites this format ("e.g. 2 avocados").
- **Note:** a correct fraction parser already exists in this codebase — `parseAmount` in `shopping-generator.ts:14-45` handles `"1/2 cup"` properly. The two parsers should be one.
- **Fix:** Reuse `parseAmount` here instead of the ad-hoc split.
- **Effort:** M · **PR:** **PR9** · **Status:** Open

---

# M. Journey Step 8 — Pantry (`/pantry`)

**Context:** this page is deliberately deferred. `docs/app-contract-roadmap.md`
item 10 records the decision not to build it yet, and the page carries an honest
"Pantry tracking is coming soon" banner plus three correctly-disabled Coming
Soon controls. The findings below are about the **quick-add prototype that is
live**, not about the unbuilt parts.

**What works well.** `withTimeout` wraps the load, and there is a proper
full-page error state with a working Retry button. Deletion is optimistic with a
refresh-on-failure fallback. This is more careful than several finished pages.

## AUD-095 — Every pantry item is stamped with a fake 7-day expiry

- **Type:** Data integrity · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [Pantry.tsx:118](../src/features/pantry/Pantry.tsx) — `expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days expiry`
- **Problem:** Every item added, of any kind, is given an expiry date exactly seven days out. The user is never asked, and there is no indication the date was guessed.
- **Impact:** This is the most **actionable** piece of invented data in the app. Unlike a fabricated cook time, an expiry date is something a person acts on directly — they throw food away, or they trust something that is actually spoiled. A bag of rice and a carton of milk both get the same seven days. The field is stored in Firestore and validated as a real date key by the rules (`firestore.rules:189`), so nothing downstream can tell it apart from a date the user actually entered.
- **Fix:** Leave `expiresAt` unset unless the user supplies it. The rules already make it optional. Render "No expiry set" and let the user add one.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes.

## AUD-096 — One failed item wipes the whole page, then hides the error

- **Type:** Bug / UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Pantry.tsx:149](../src/features/pantry/Pantry.tsx) (`if (loadError) return <full-page error>`), set from [Pantry.tsx:122](../src/features/pantry/Pantry.tsx) and [Pantry.tsx:137](../src/features/pantry/Pantry.tsx)
- **Problem:** `loadError` is a **full-page early return** — when it is set, the entire pantry UI is replaced by an error card. But the same state is reused for two very different failures:
  1. **Load failed** — a full-page error is the right response.
  2. **One quick-add line failed**, or **one delete failed** — here the page still has perfectly good data, yet the user's whole list vanishes behind an error screen.
- **Second defect, same path:** after setting the error, `handleQuickAdd` immediately calls `loadItems()` (line 127), and `loadItems` starts with `setLoadError(null)` (line 47). So the message the code just wrote is wiped within milliseconds. Depending on timing the user either sees a jarring full-page flash, or never learns that some items failed to save at all.
- **Impact:** Add five items where one fails: either the list disappears and comes back, or the failure is silent. Neither tells the user which item failed.
- **Fix:** Split the state. Keep `loadError` for load failures only (full-page). Add a separate `actionError` rendered as an inline banner above the list, and name the items that failed. The Shopping List page already does exactly this — copy its pattern.
- **Effort:** M · **PR:** **PR7** · **Status:** Open

## AUD-097 — Items categorised "Other" have no filter tab

- **Type:** Bug / UX · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [Pantry.tsx:10](../src/features/pantry/Pantry.tsx) lists `['All Items', 'Proteins', 'Produce', 'Grains', 'Freezer', 'Fridge']`, but [Pantry.tsx:79](../src/features/pantry/Pantry.tsx) defaults `category = 'Other'`.
- **Problem:** `'Other'` is the fallback for anything the keyword guesser does not recognise — which will be most real groceries, since the lists at lines 105-109 hold only about 22 words total. There is no `'Other'` tab.
- **Impact:** Items are not lost — the filter at line 143 short-circuits on `'All Items'`, so they still appear there, and their category chip renders at line 297. But they are unreachable by any filter, and the tab row silently under-represents the pantry. Selecting every tab in turn will never show them.
- **Fix:** Add `'Other'` to the categories array, or derive the tabs from the categories actually present in the data.
- **Effort:** S · **PR:** **PR9** · **Status:** Open

## AUD-098 — Quick-add saves items one at a time

- **Type:** Perf · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [Pantry.tsx:73-124](../src/features/pantry/Pantry.tsx) — a `for...of` loop with `await addPantryItem(...)` inside.
- **Problem:** The input accepts multiple lines (line 71 splits on `\n`), and each line is written in its own sequential round trip. Ten items means ten sequential writes, then one full reload.
- **Impact:** Pasting a shopping haul is slow, and a failure partway through leaves a partial save with no rollback.
- **Fix:** Use a `writeBatch` (chunked at 400 — see AUD-026), and report per-line results together.
- **Effort:** M · **PR:** **PR1.14** · **Status:** **Fixed** (PR-11b, 2026-09-09)
- Parsing and writing were one loop with an `await` inside it. They are now separate: `src/lib/pantry-parse.ts` works out what the user meant, and `addPantryItems` writes it in a single `writeBatch`, chunked at 400 (the AUD-026 lesson).
- **The rollback problem is gone rather than handled.** A batch is atomic, so either every item lands or none does — there is no partial state to roll back from, and the error message can now honestly say "nothing was added".
- **The parsing had never been tested**, because it lived inside the write loop. Nine tests now cover it, including two cases that used to produce nonsense: `"200g"` with no name created an item with an empty name, and `"6 Large Eggs"` must not read "Large" as a unit.
- **Verified by hand:** eight lines pasted into the real quick-add box saved as eight correct items — quantities, units and categories all right, and not one carrying a fabricated expiry — in **4 Firestore requests instead of eight sequential writes**.

---

# N. Journey Step 9 — Progress / History (`/progress`)

**What works well.** Clean load-error state with a working Retry, `Promise.all`
for parallel fetches, and honest `--` placeholders when a metric is missing. The
completion-rate ring is computed from real `isEaten` data, not invented.
Importantly, the summary tile labelled **"Target kcal"** is honestly labelled —
it shows the plan's target and says so.

## AUD-099 — Plan date ranges show one day early west of UTC

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed (reproduced with a live Node test)
- **Where:** [History.tsx:55-59](../src/features/progress/History.tsx) — `new Date(start)` where `start` is a `YYYY-MM-DD` string.
- **Problem:** JavaScript parses a bare `YYYY-MM-DD` string as **UTC midnight**, not local midnight. `toLocaleDateString` then renders it in the viewer's timezone, shifting it backwards for anyone in a negative UTC offset.
- **Reproduced today:**
  ```
  TZ=America/New_York
  new Date('2026-08-24').toLocaleDateString('en-US',{month:'short',day:'numeric'})
  → "Aug 23"        (expected "Aug 24")
  ```
- **Impact:** Every saved plan in the history list displays a date range one day earlier than the plan actually covers, for every user west of Greenwich. The weekStart values themselves are correct — only the display is wrong, which makes it especially confusing: the Meal Planner and the History page disagree about the same plan.
- **This is the same defect family as `BUG-007` and `BUG-008`**, both closed as P1 UTC-drift bugs on the Dashboard. This instance was never covered.
- **Fix:** The safe pattern already exists in this codebase — `MealPlanner.tsx:46` uses ``new Date(`${savedDate}T00:00:00`)``, which parses as local time. Use that here, or better, add a shared `parseLocalDateKey()` helper to `src/lib/date-utils.ts` and use it everywhere a `YYYY-MM-DD` string becomes a `Date`.
- **Effort:** S · **PR:** **PR1.6** · **Status:** **Fixed** (PR-6, branch `fix/pr6-local-dates`, 2026-08-26) — the finding named one site; seven were found and fixed
- **Promote to `bug-ledger.md`:** yes — link to `BUG-007` / `BUG-008` as the same family.

## AUD-100 — History reads every plan, then silently shows only 8

- **Type:** Cost / UX · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [History.tsx:82](../src/features/progress/History.tsx) — `savedPlans.slice(0, 8).map(planToHistoryWeek)`
- **Problem:** `getMealPlans` has no `limit()` (see AUD-029), so every plan the user has ever saved is fetched and paid for. The page then throws all but the newest eight away, with no pagination, no "showing 8 of 34", and no way to reach the rest.
- **Impact:** Two distinct problems from one line. **Cost:** read charges grow forever while the visible output stays fixed at eight. **Honesty:** after eight weeks of use, older plans simply stop existing as far as the UI is concerned. `docs/north-star-compass.md` explicitly calls this out under Anti-Burnout Rules — a silent cap reads as "we showed you everything" when it did not.
- **Fix:** Push the limit into the query (`limit(8)`) so the cost matches what is shown, and add either paging or an honest "Showing the 8 most recent plans" line.
- **Effort:** S · **PR:** **PR1.13** · **Status:** **Fixed** (PR-11a, 2026-09-08)
- The limit is in the query now, so the read charge matches what is shown.
- **And the page says so.** When more plans exist than are rendered it prints "Showing your 8 most recent weeks of N saved." The finding called out the honesty half specifically -- a silent cap reads as "we showed you everything" when it did not.

## AUD-101 — The metric summary rebuilds three array copies on every render

- **Type:** Perf · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [History.tsx:40-42](../src/features/progress/History.tsx) — three separate `[...logs].reverse()` calls, plus three more `logs.filter(...)` passes at lines 46-48. Called unmemoised at [History.tsx:98](../src/features/progress/History.tsx).
- **Problem:** `buildMetricSummary` runs on every render and does six full passes over the log array, three of which copy and reverse it first.
- **Impact:** With a year of daily logs that is ~2,200 array operations per render, and this page re-renders on every store change (see AUD-014). Not visible today; it degrades steadily as history accumulates.
- **Fix:** Wrap in `useMemo` keyed on `metricLogs`, and compute all six values in a single reverse pass.
- **Effort:** S · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08)
- Six passes (three of them copying and reversing the array) collapsed into one backwards pass, and the call site is now `useMemo`d on the logs.
- Moved to `src/lib/metric-summary.ts` so it can be unit-tested: Node's type stripping does not handle `.tsx`. Same reason as `src/lib/plan-limits.ts`. Five tests lock the behaviour, including that a logged `0` stays `0` rather than becoming "not logged".

## AUD-102 — `avgCalories` and `avgProtein` do not hold averages

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [History.tsx:14-15](../src/features/progress/History.tsx) (the `HistoryWeek` interface) and [History.tsx:33-34](../src/features/progress/History.tsx) — both are assigned from `plan.dailyTargets`.
- **Problem:** The field names say "average", but the values are the plan's **daily targets**. Nothing is averaged.
- **Impact:** **No user-facing bug** — the rendered label at line 237 correctly reads "Target kcal", so the screen is honest. This is purely a trap for the next developer: a name that lies invites someone to reuse the field as a real average.
- **Fix:** Rename to `targetCalories` / `targetProtein`. If a genuine average of what was actually eaten is wanted later, that is a separate feature and needs per-meal logging that does not exist yet (see the Pillar 2 gap in section F).
- **Effort:** S · **PR:** **PR10** · **Status:** Open

---

# O. Journey Step 10 — Settings (`/settings`)

**What works well.** The draft/commit model is careful: `localSettings` holds an
editable draft, `hasChangesRef` stops the store from overwriting the user's
in-progress edits, `resetDraft` gives a real Discard, and a save failure keeps
the draft intact with an honest message. Auth profile sync is treated as a
best-effort mirror with app settings as the source of truth — the comment at
line 131 states that deliberately, which is good design.

## AUD-103 — Settings pre-fills invented personal data that can be saved as real

- **Type:** Data integrity · **Severity:** P1 · **Confidence:** Confirmed
- **Where:** [Settings.tsx:47-59](../src/features/settings/Settings.tsx) — `getSettingsSnapshot`
  ```
  currentWeight:      settings?.currentWeight      || 185
  goalWeight:         settings?.goalWeight         || 170
  rateOfChange:       settings?.rateOfChange       || 65
  dailyCalorieTarget: settings?.dailyCalorieTarget || 2200
  macroTargets:       settings?.macroTargets       || { protein: 150, carbs: 200, fat: 60 }
  ```
- **Problem:** A user who has never set these values opens Settings and sees a fully populated form — 185 lb current weight, 170 lb goal, 2,200 kcal — presented as their own saved settings. Nothing marks them as placeholders.
- **Why it triggers for real users:** `createDefaultUserSettings()` writes `dailyCalorieTarget: 0` and leaves `currentWeight` / `goalWeight` **undefined** (`userService.ts:71-82`). So every brand-new account, and every account that skipped onboarding (see AUD-069), hits the `||` fallbacks on first visit.
- **Impact:** This is the most severe variant of the invented-data pattern in the audit, because it does not merely *display* fiction — **pressing Save writes it to Firestore as the user's genuine profile.** Those numbers then drive Dashboard targets, meal plan generation, and grocery quantities. A user who opens Settings, changes their dietary tags, and saves has silently adopted a stranger's body weight and calorie goal.
- **Fix:** Use empty values, not fabricated ones. Render placeholders (`placeholder="e.g. 75"`) rather than pre-filled values, disable Save until required fields are supplied, and never persist a field the user did not set.
- **Effort:** M · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)
- **Promote to `bug-ledger.md`:** yes, as P1.

## AUD-104 — Profile avatars load from a third external service, on every page

- **Type:** Privacy / Availability · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Settings.tsx:14-21](../src/features/settings/Settings.tsx) — six `https://api.dicebear.com/7.x/avataaars/svg?seed=...` URLs; rendered app-wide via [AppLayout.tsx:109-113](../src/app/AppLayout.tsx).
- **Problem:** The avatar picker fetches six SVGs from `api.dicebear.com`. The chosen URL is then saved into `profileAvatar` **and** mirrored into the Firebase Auth `photoURL`, and `AppLayout` renders `user.photoURL` in the sidebar on **every route**.
- **Impact:** Once a user picks an avatar, every page load of the entire app sends a request to a third-party host, carrying their IP and referrer. If dicebear.com goes down or changes its API version, every user's avatar breaks everywhere at once. Combined with AUD-072 and AUD-091 this is the **third** external host, and the only one that persists into stored user data.
- **Fix:** Generate avatars locally (initials on a colour derived from the uid — `AppLayout` already has a `getUserInitials()` fallback that does exactly this), or bundle the six SVGs as local assets. Then add a Content-Security-Policy that permits only Firebase hosts, so a fourth cannot appear.
- **Effort:** M · **PR:** **PR1.3** · **Status:** **Fixed** (PR-3, branch `fix/pr3-no-external-hosts`, 2026-08-26)

## AUD-105 — The two invented defaults contradict each other

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Settings.tsx:51](../src/features/settings/Settings.tsx) vs [Settings.tsx:54](../src/features/settings/Settings.tsx)
- **Problem:** The fallback `dailyCalorieTarget` is **2200**. The fallback `macroTargets` is `{ protein: 150, carbs: 200, fat: 60 }`, which by the app's own formula at line 105 is `150×4 + 200×4 + 60×9 =` **1940 kcal**.
- **Impact:** A user on the invented defaults who flips `macroMode` from `percentage` to `grams` silently loses 260 kcal from their daily target, with no prompt and no explanation. The two placeholder sets were clearly written at different times and never reconciled.
- **Fix:** Falls away entirely once AUD-103 removes the fabricated defaults. If any default survives, derive one from the other rather than hardcoding both.
- **Effort:** S · **PR:** **PR1.2** · **Status:** **Fixed** (PR-2, branch `fix/pr2-no-invented-data`, 2026-08-26)

## AUD-106 — Rate-of-change labels are hardcoded to pounds

- **Type:** Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [Settings.tsx:154-159](../src/features/settings/Settings.tsx) — `getRateLabel` returns the literal strings `'-0.5 lbs / week'`, `'-1.0 lbs / week'`, `'-1.5 lbs / week'`, `'-2.0 lbs / week'`.
- **Problem:** The function never consults `measurementUnit`, exactly like the onboarding weight suffix (AUD-064). Metric is the default unit.
- **Impact:** A metric user setting their rate of loss reads a target in pounds. Together with AUD-063, AUD-064 and AUD-065 this is now the **fourth** place where metric is the stated default but imperial is what the UI actually speaks.
- **Fix:** Fix all four together in PR-0. Add a shared `formatWeight(value, unit)` helper so there is exactly one place that decides units.
- **Effort:** S · **PR:** **PR1.1** · **Status:** **Fixed** (PR-1, branch `fix/pr1-metric-units`, 2026-08-26)

## AUD-107 — A failed save reports itself twice

- **Type:** UX · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [Settings.tsx:139-140](../src/features/settings/Settings.tsx) — sets `saveError` for the inline banner **and** fires `alert("Failed to save settings. Please try again.")`.
- **Problem:** Two error surfaces for one failure. The inline message is the better one — it is honest that the draft survives ("Your draft is still here"). The `alert` is blocking, says less, and must be dismissed before the user can even read the banner.
- **Fix:** Delete the `alert`. Part of AUD-051.
- **Effort:** S · **PR:** **PR7** · **Status:** Open

---

# O2. Nav Shell, AI Client & Cloud Functions

The last unswept areas. Completes the sweep.

## AUD-111 — The whole sidebar is destroyed and rebuilt on every render

- **Type:** Perf / Bug · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [AppLayout.tsx:49](../src/app/AppLayout.tsx) — `const NavLink = ({ item, onClick }) => {...}` is declared **inside** the `AppLayout` function body.
- **Problem:** A component defined inside another component is a **new component type on every render**. React cannot reconcile it against the previous one, so it unmounts the old subtree and mounts a fresh one — it does not re-render, it *replaces*.
- **Impact:** Every time `AppLayout` renders, all seven nav links are torn down and rebuilt. Combined with AUD-014 (any store change re-renders every consumer), ticking one meal on the Dashboard destroys and recreates the entire sidebar. That drops focus, restarts CSS transitions, and does real layout work for nothing.
- **Fix:** Move `NavLink` to module scope, outside `AppLayout`. One-line move, meaningful win.
- **Effort:** S · **PR:** **PR1.12** · **Status:** **Fixed** (PR-10, 2026-09-08)
- `NavLink` moved to module scope. One-line move, and the measurement is unambiguous.
- **Measured in the browser, both ways.** Captured the sidebar's DOM nodes, re-rendered `AppLayout`, then checked how many of the same nodes survived:

| Build | Nav links surviving a re-render |
|---|---|
| `NavLink` declared inside `AppLayout` | **3 of 13** |
| `NavLink` at module scope | **13 of 13** |

- **The finding's stated cause was wrong, and the first measurement found nothing because of it.** It said ticking a meal destroys the sidebar via AUD-014 -- but `AppLayout` subscribes to `useAuth()`, not `useAppStore()`, so a store change does not re-render it at all. Tapping water showed 13/13 surviving on the *broken* build. The real triggers are a route change, an auth context change, and the mobile menu toggle; the last of those is what produced the numbers above.
- Worth recording because the reflex on seeing 13/13 was "fixed already". It was not: the test was wrong.

## AUD-112 — The entire "Soon" badge feature is dead code

- **Type:** Dead code · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [AppLayout.tsx:50-60](../src/app/AppLayout.tsx) and [AppLayout.tsx:85-89](../src/app/AppLayout.tsx)
- **Problem:** `isComingSoon` tests `item.badge === 'Soon'`. Every item that sets `badge` sets it to `null` (lines 26, 27, 31), and the four `menuItems` omit it entirely. **No item can ever have `badge === 'Soon'`**, so the nine-line disabled branch is unreachable — and the `{item.badge && ...}` render at line 85 never fires either.
- **Impact:** None at runtime. It misleads a reader into thinking the nav has a Coming Soon mechanism, when the honest disabled states actually live inside the pages themselves.
- **Fix:** Delete the branch and the `badge` field, or wire it up for real. **Recommend delete** — the per-page pattern is already better.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

## AUD-113 — Recipe titles are injected straight into the AI prompt

- **Type:** Security · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [functions/src/index.ts:508-510](../functions/src/index.ts) —
  `` `Available Recipes: ${userRecipes.map((r: any) => `${r.title} (${r.mealType})`).join(", ")}.` ``
  interpolated into the prompt at line 512.
- **Problem:** Recipe titles are user-controlled text (up to 200 characters per `firestore.rules:64`) placed **directly into the model's instructions** with no delimiter, no escaping and no quoting. There is also no structured-output schema constraining what comes back (see AUD-115).
- **Why it is not merely self-inflicted:** a user can only write their own recipe titles — but titles also arrive from **`parseRecipeFromImage`**, which reads an image or PDF the user did not author. So the chain is real: a malicious recipe image proposes a crafted title &rarr; the user saves the draft &rarr; that title is later interpolated into `generateMealPlan`'s prompt. That is **second-order prompt injection**, and the untrusted content genuinely originates outside the user.
- **Impact:** Bounded — the blast radius is the user's own generated plan, and the AI spend breaker caps cost. But it could produce a plan with attacker-chosen content, and the pattern gets worse the moment recipes are ever shared.
- **Fix:** Wrap untrusted values in explicit delimiters and tell the model to treat them as data, never instructions. Strip control characters and cap length before interpolation. Combine with AUD-115 so the response shape is schema-enforced regardless of what the prompt says.
- **Effort:** M · **PR:** **PR1.9** · **Status:** **Fixed** (PR-8b, 2026-09-04)
- **Fix:** new `functions/src/promptSafety.ts`. Untrusted values are stripped of control characters, bidi overrides and zero-width joiners, have `<` and `>` removed, whitespace collapsed, and length and item count capped. The list is wrapped in `<user_recipes>` with an explicit instruction that it is data and must never be followed. `mealType` is checked against a closed set rather than echoed, so it cannot carry free text either.
- **The newline was the exploit.** It is what let a value stop looking like a list item and start looking like a new line of instructions. `tests/prompt-safety.test.cjs` asserts exactly that, plus the invisible-character and fence-closing cases.
- **Kept as a separate pure module on purpose** -- no Firebase or SDK import, so it is directly unit-testable. Same reasoning as `src/lib/plan-limits.ts` in PR-8a.
- **Side note closed:** the `(r: any)` on the old inline map was the only `any` in the source tree. It is gone with the map.
- **Side note:** `(r: any)` on line 509 is the **only** `any` in the entire source tree. Type it.

## AUD-115 — AI responses are requested as prose, then scraped for JSON

- **Type:** Bug / Security · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** [functions/src/index.ts:472-483](../functions/src/index.ts) — a three-stage fallback: `JSON.parse(text)`, then strip ```` ```json ```` fences and retry, then substring between the first `{` and the last `}` and retry again.
- **Problem:** The prompt *asks in English* for JSON ("Return ONLY valid JSON... no markdown formatting") rather than using the Gemini SDK's structured-output configuration. A grep confirms **zero** uses of `responseMimeType` or `responseSchema` anywhere in the Functions source.
- **Impact:** Two problems. **Reliability** — the fence-stripping and brace-substring heuristics exist because the model does not reliably obey a prose instruction, and each fallback is a place where a slightly-off response silently produces wrong data instead of a clean failure. **Security** — a prompt-injected instruction can change the response shape, because nothing but the prompt constrains it. Schema-enforced output removes both problems at once.
- **Fix:** Set `responseMimeType: "application/json"` and a `responseSchema` matching the expected shape on both `generateMealPlan` and `parseRecipeFromImage`. Then delete the fallback chain and let a genuine parse failure be a real, loud error.
- **Effort:** M · **PR:** **PR1.9** · **Status:** **Fixed** (PR-8b, 2026-09-04)
- **Fix:** both callables now send `responseMimeType: "application/json"` and a `responseSchema`. The three-stage salvage chain is deleted; `parseModelJson` is a plain `JSON.parse` and a genuine failure is surfaced instead of hidden.
- **The prompts no longer plead for formatting.** "Return ONLY raw JSON, no markdown" was a request the schema now enforces; leaving it in would tell the next reader something untrue about how the shape is guaranteed.
- **Test that asserted the bug:** one contract test fed a ```` ```json ````-fenced response and asserted it parsed -- that was asserting the salvage behaviour. Updated to raw JSON, which is what a schema-constrained provider returns, and the fenced and chatty cases are now asserted as **loud failures**.

## AUD-114 — Two callables bypass the service layer

- **Type:** Refactor · **Severity:** P3 · **Confidence:** Confirmed
- **Where:** [RecipeLibrary.tsx:189](../src/features/recipes/RecipeLibrary.tsx) and [RecipeLibrary.tsx:323](../src/features/recipes/RecipeLibrary.tsx) call `httpsCallable` directly for `parseRecipeFromImage` and `semanticSearchRecipes`.
- **Problem:** `src/services/aiService.ts` exists and is 49 lines long — it wraps exactly one callable, `generateMealPlan`. The other two AI callables are invoked inline from a page component.
- **Impact:** No bug today. But the service layer is where the dev failure-injection hooks, error normalisation and request-ID generation live, so two of the three AI paths miss that treatment — and a page component now knows Firebase callable names.
- **Fix:** Move both into `aiService.ts` alongside `generateAiMealPlan`.
- **Effort:** S · **PR:** **PR10** · **Status:** Open

## What is genuinely good in the Functions layer

Worth recording so a future refactor does not undo it:

- **`createAiCallableRequestId`** uses `crypto.getRandomValues` and **throws** if browser randomness is unavailable rather than silently falling back to `Math.random` (`aiSpendService.ts:39-52`). Correct idempotency keys, done properly.
- **`assertLiveAiAllowed` and `assertAiSpendPricingSafeWhenEnabled`** gate every AI callable before any provider request is made.
- **Reserve &rarr; claim &rarr; reconcile** spend accounting, with per-feature and per-owner rate limits, App Check enforcement outside the emulator, and `maxInstances: 1`. This is more disciplined than most production codebases.

---

# R. Found By Subagent Review (2026-08-26)

Two gaps in my own PR-2 work, found by an independent agent asked to review the
pantry fix. Neither was visible from the diff.

## AUD-119 — A contract doc still claims the old pantry ordering

- **Type:** Docs · **Severity:** P3 · **Confidence:** Confirmed · **PR:** **PR10** · **Status:** Open
- **Where:** [docs/firebase-foundation-contract.md:459](contracts/firebase-foundation-contract.md) — "Pantry ordered by `expiresAt`."
- **Problem:** PR-2 removed that `orderBy` precisely because it silently dropped items with no expiry. The contract still describes the old behaviour.
- **Impact:** A future developer reading the contract would restore the bug. This is the same failure mode as AUD-008, where a rules comment described a weaker policy than the code enforced.

## AUD-120 — Pantry items saved before PR-2 still carry the fabricated expiry

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed · **PR:** **PR1.7** · **Status:** **Tool provided** (PR-7) — `npm run clean:expiry` clears them; not yet run against any data, that is the owner's call
- **Where:** Existing `users/{uid}/pantryItems` documents.
- **Problem:** PR-2 stopped *writing* a fake 7-day expiry, but did nothing about items already stored with one. Those dates are indistinguishable from ones a user actually entered.
- **Impact:** The exact harm AUD-095 described is still live for every pantry item added before the fix — the user may throw food away, or trust something spoiled, on a date the app invented.
- **Why it was missed:** PR-3 handled legacy data carefully for image URLs (`isRenderableImage`). PR-2 did not apply the same thinking to pantry dates. **Fixing a write path does not fix what is already written** — the skill now says this, but the lesson arrived after PR-2 shipped.
- **Fix options:** a one-time cleanup script, or a `expiryWasGuessed` marker; simplest honest option is to clear `expiresAt` on items whose value is exactly 7 days after their creation date.

---

# R. Found By Clicking The App In A Browser (2026-09-04)

The owner's rule: before a PR is called done, drive the running app in a browser
against the emulator by hand. The first session under that rule found this
immediately -- no test suite would have.

## Verification pass: every shipped PR, driven by hand (2026-09-04)

Signed in as a seeded QA account against the running emulators, and clicked
through each fix. Firestore was read back with the Admin SDK after every action,
so "it looked right" was never the evidence.

| PR | What was clicked | Result |
|---|---|---|
| **PR-1** metric | Settings, Check-In modal, dashboard widgets, account flipped metric <-> imperial | **2 of 3 held.** AUD-063 and AUD-106 correct (`-0.23 kg / week`). AUD-064 **failed on five screens** -> [AUD-122](#aud-122----five-screens-still-print-lbs-to-a-metric-user), now fixed |
| **PR-2** invented data | Dashboard, Recipes, Pantry, Settings; added a new pantry item | **Held.** No demo recipes, no "Adaptive Engine", "Your Targets" not "Engine Insights", real 2180 kcal targets, `placeholder="Not set"`, and the new item stored **no `expiresAt`** |
| **PR-3** external hosts | Every page; 480 network requests inspected | **Held.** Every request is `localhost:5173`, `127.0.0.1:8080` or `:9099`. Zero Unsplash, Dicebear or font CDN. Recipes render the initial tile, alt text "Overnight Oats — no photo" |
| **PR-4** transactions | "Confirm Plan" x3; "+250ml" x3 fast then x2 spaced; toggled a meal eaten | **Held.** 3 confirms -> **1** plan (doc id `2026-08-31`). Water 250 -> 750, nothing lost. `isEaten: true` persisted |
| **PR-5** silent failures | "Add to List" on an empty plan, then on a real one; opened Grocery | **Held.** Empty plan raised **"No recipes in plan"** instead of doing nothing. Real plan: "Added 5 items", and all five appear on the Grocery page, correctly aisled |
| **PR-6** dates | Plan week header, all 7 day labels, saved `weekStart`/`weekEnd` | **Held.** "Week of Aug 31 - Sep 6", Monday Aug 31 through Sunday Sep 6, `weekEnd: 2026-09-06`. No off-by-one |
| **PR-7** stored shape | Added a grocery item by hand; checked one off; read the plan document | **Held.** Manual item stored `source: "manual"`, generated ones `source: "generated"`. `isChecked` persisted. Plan carries `isAiGenerated`. A water-only log did **not** create a bogus weight row |

**Also found by clicking:** [AUD-123](#aud-123----an-empty-plan-claims-a-2180-kcal-deficit-and-high-adherence) (P3) and
[AUD-124](#aud-124----fast-taps-on-the-water-quick-add-are-dropped-without-a-word) (P3).

### PR-8a: two things the rules lock-down broke, surfaced for review

The rules tests went green and the app suite went from 69 passing to **3
failing**. Both causes are worth keeping.

**1. I invented a range from a field name.** `rateOfChange` sounded like a weight
per week, so the new validator allowed -10..10. It is actually the **0-100
position of the Settings slider** (`<input type="range" min="0" max="100">`), and
a real stored account holds **65**. That account could no longer save anything at
all -- not the slider, not their weight, nothing, because the whole settings map
is validated on every merge.

Enumerating the *keys* of the stored data was not enough. I did that, and it
passed. The **values** were the problem, and I only read those after the suite
went red. **Read the values, not just the shape, before writing a range check.**

**2. An https-only rule broke the local Storage emulator.** `getDownloadURL`
returns `http://127.0.0.1:9199/...` in development, so every recipe import
failed. This is the *same trap* the Content-Security-Policy hit in PR-3, in a
different file, three PRs later.

The tempting move is to drop the scheme check. That would be loosening a policy
to make a test pass. What shipped instead is a loopback-only exception with the
reason written next to it, plus a test asserting that `http://example.com` is
**still** refused -- so the exception cannot quietly widen later.

**And one of my own mistakes, again.** Probing the rules from the browser
console, all five writes came back `invalid-argument` -- including one that
should have been allowed. That was not the rules. I had mixed two copies of the
Firestore module (`/node_modules/.vite/deps/...` with a `db` built in
`src/lib/firebase.ts`), which fails before any rule is consulted. Re-running
through the app's own `updateUserSettings` gave the honest answer:
`permission-denied` on the bad writes, `ALLOWED` on the good ones. **A blocked
write that says `invalid-argument` instead of `permission-denied` is your test
being wrong, not the rules.**

### Near-miss on the AUD-122 fix -- surfaced for review

The AUD-122 fix turned 3 e2e specs red. Every one of them asserted `lbs`.
The obvious move -- and the one I made -- was to update them all to `kg`.

**That was wrong, and it would have silently deleted real coverage.**

The suite uses two kinds of account:

- fresh accounts made in-test, which are `metric` (the app default), and
- the seeded `test@test.com` from the imported emulator export, which is
  **`measurementUnit: 'imperial'`**.

For the imperial account, `lbs` was never the bug -- it was the correct answer.
Blanket-updating turned 3 red into 2 red, and the 2 that stayed red were the app
telling me so. Had I "fixed" those too, the suite would have asserted `kg` for an
imperial user, and the next person to hardcode a unit would have shipped green.

What actually settled it: reading `measurementUnit` straight out of
`_local/firebase/exports/.../firestore_export`, rather than guessing from which
tests were failing.

The suite is now **stronger than before the fix**: some specs assert `kg` for
metric accounts and others assert `lbs` for the imperial one, so a hardcoded
unit in either direction now fails.

**The rule this adds:** *"the test asserted the old bug"* is a claim about a
specific account, screen and setting -- not about a string. Before changing an
assertion, find out which fixture it runs against. Two specs asserting the same
text can be one bug and one correct behaviour.

**Also worth recording:** the ledger said the baseline was `67 passed`. It is
**69**. I only learned that by stashing the change and re-running -- which is
also what told me the 2 remaining failures were genuinely mine and not flake.
A baseline that is quoted from a document is not a baseline.

**Three of my own testing mistakes, recorded so they are not re-learnt:**

1. `computer` click coordinates are in the **screenshot frame**, not page pixels. With a 1440x900 viewport rendering into an 800x500 frame, several clicks landed on empty space and looked like dead buttons. Convert: `sx = pageX * 800 / innerWidth`.
2. Setting a React input's `value` through the native setter did not always register. Focus the field and type with the keyboard instead.
3. Guessing a document's field names (`mealType`, `recipeTitle`) printed `undefined` and briefly looked like data loss. The real fields were `type` and `name`. **Dump the object before asserting on it.**

None of the three were app bugs. All three would have been reported as bugs if I had trusted the first screen.

## AUD-121 -- The maintenance scripts write to a project id the app never reads

- **Type:** Tooling / data integrity - **Severity:** P2 - **Confidence:** Confirmed - **PR:** **PR1.7** - **Status:** **Fixed** (2026-09-04)
- **Where:** `scripts/seed-dev-recipe.mjs` and `scripts/clear-fabricated-expiry.mjs` -- both had `process.env.GCLOUD_PROJECT || 'viomacro-app'`. The real id is `viomacro` (`.firebaserc`, and `VITE_FIREBASE_PROJECT_ID` in `.env`).
- **Problem:** The Firestore emulator keeps a **separate dataset per project id and does not error on an unknown one** -- it silently serves an empty namespace. So both scripts reported success while reading and writing a project nothing else touches.
- **Impact:** `npm run seed:recipe` printed success and the recipe never appeared in the app. Worse, `npm run clean:expiry` would have printed **"Nothing to clean"** for a user whose pantry was full of fabricated expiries -- a false all-clear on the exact data-integrity problem AUD-120 exists to fix.
- **How it surfaced:** Seeding a QA fixture by hand, the Dashboard showed the onboarding wizard, `0 kcal` and `Phase: Maintenance`, while the Admin SDK read back `2180 kcal` and `fat-loss` from the same "database". Reading the client's own config in the browser console showed `projectId: "viomacro"` against the script's `viomacro-app`.
- **Fix:** Both scripts now read `projects.default` from `.firebaserc`, the same source the emulators use, and exit if it is missing. `GCLOUD_PROJECT` still overrides.
- **Lesson (added to the skill):** an emulator that partitions by an id you supply will not tell you the id is wrong. A tool reporting "nothing to do" is only trustworthy once you have seen it report something to do.

## AUD-122 -- Five screens still print "lbs" to a metric user

- **Type:** Bug / data integrity - **Severity:** P1 - **Confidence:** Confirmed - **PR:** **PR1.1** - **Status:** **Fixed** (2026-09-04)
- **Where:** `Settings.tsx` (x4), `CheckInModal.tsx` (x2), `WeightHistoryWidget.tsx` (x2), `ActivityCalendarWidget.tsx`, `History.tsx`.
- **Problem:** AUD-064 was recorded **Fixed by PR-1**, but PR-1 only changed `OnboardingWizard.tsx`. Every other weight display kept a hardcoded `lbs`. Metric is the app default.
- **Impact:** A metric user opened Settings and read **"Current Weight (lbs): 75"** for 75 kilograms. If they had believed the label and re-typed their weight in pounds, 165 would have been stored as their real weight and every calorie target computed from it. That is a write-path data-corruption route, not a cosmetic label.
- **How it surfaced:** The first click-through of Settings under the manual-emulator rule. No test caught it -- the unit tests covered `units.ts`, which was correct, and no test read a rendered label.
- **Fix:** Every site now calls `weightSuffix(unit)`. Weights are stored **in the unit the user chose**, so this is a labelling fix; no conversion or migration is involved. Two guard tests added in `tests/unit/no-hardcoded-weight-unit.test.ts`: one scans for a rendered hardcoded unit, one asserts each of the five screens resolves the unit at runtime.
- **Verified:** flipping the account metric -> imperial -> metric in the emulator, the labels and the rate line follow (`-0.23 kg / week` <-> `-0.5 lbs / week`).
- **Lesson:** the audit undercounts, every time. AUD-099 named 1 site and had 7; PR-3 listed 3 and had 6; AUD-064 named 1 and had 6. **Treat a finding's "Where" as one example, never the list.**

## AUD-123 -- An empty plan claims a 2180 kcal deficit and "High" adherence

- **Type:** Invented data - **Severity:** P3 - **Confidence:** Confirmed - **PR:** **PR9** - **Status:** Open
- **Where:** MealPlanner "Plan Analysis" panel.
- **Problem:** With zero meals planned, the panel reads "This plan creates a **2180kcal Deficit**" and "ADHERENCE EST.: **High**". Planning nothing is not a deficit, and there is no evidence for an adherence estimate.
- **Impact:** Same class as AUD-044 -- confidence the app has not earned. Low harm, but it is exactly what PR-2 was meant to remove.
- **How it surfaced:** Creating an empty plan by hand in the browser.

## AUD-124 -- Fast taps on the water quick-add are dropped without a word

- **Type:** UX - **Severity:** P3 - **Confidence:** Confirmed - **PR:** **PR7** - **Status:** Open
- **Where:** `Dashboard.tsx:183` -- the `isLoggingWater` flag blocks a second tap while the first is in flight.
- **Problem:** Three quick taps on "+250ml" logged 250 ml. Two taps spaced a few seconds apart logged 500 ml. Nothing tells the user a tap was ignored.
- **Not a data bug:** `addWaterMl` uses Firestore `increment()`, so no write is ever lost -- confirmed 250 -> 750 in the emulator. The drop is purely client-side.
- **Note:** the comment on that line reads "increment() is applied server-side, so two fast taps both count." That is true of the write, but the guard above it means the second tap never reaches the write. Worth correcting the comment even before the UX.

## AUD-128 -- The AI rate limiter is never executed by any test

- **Type:** Test coverage / cost · **Severity:** P2 · **Confidence:** Confirmed · **PR:** unassigned · **Status:** Open
- **Where:** `functions/src/index.ts:413` -- `enforceAiUsageLimit` opens with `if (process.env.FUNCTIONS_EMULATOR === "true") return;`
- **Problem:** Every test in `functions/tests/callable-contracts.test.cjs` sets `FUNCTIONS_EMULATOR = "true"` at the top of the file, so that early return fires and **the whole function body is skipped**. The one test that deletes the variable ("production callable config requires App Check before request validation") fails at App Check, before it ever reaches the limiter.
- **Net effect:** the daily and per-minute AI caps -- the thing standing between a bug and a runaway Gemini bill -- have **zero executed coverage**. The transaction, the owner-vs-normal limit selection, the minute-bucket rollover and the "Missing usage limit" branch have never run in a test.
- **How it surfaced:** clicking Auto-Generate Week against the functions emulator and then checking `users/{uid}/usage` for a counter. There was none. The counter turned out to be correctly skipped in the emulator -- which is what exposed that nothing exercises it anywhere.
- **Impact is asymmetric.** If this logic is wrong, nothing local tells you; the first evidence is the bill.
- **Fix:** extract the limiter into its own module (no Firebase import at the top level, the `plan-limits.ts` / `promptSafety.ts` pattern), pass the clock and the store in, and unit-test the branches directly. The emulator short-circuit can stay -- it exists so local clicking does not burn quota -- but it should not be the reason the logic is untested.

## AUD-129 -- Settings can save defaults over a real account

- **Type:** Data integrity · **Severity:** **P1** · **Confidence:** Confirmed, reproduced · **PR:** unassigned · **Status:** **Fixed** (2026-09-07)
- **Where:** `src/pages/Settings.tsx` -- `getSettingsSnapshot(userSettings)` plus the sync effect guarded by `hasChangesRef`.
- **Problem:** The form renders immediately, before the account's settings have loaded. At that point `userSettings` is `null`, so the draft is built from **defaults**: `measurementUnit: 'metric'`, `phase: 'fat-loss'`, `bottleSize: 500`, a `phaseStartDate` of now. The moment the user touches any control, `hasChangesRef.current` becomes true and the sync effect stops replacing the draft -- so the real settings, when they arrive, are never merged in. Saving writes the defaults.
- **Impact:** An imperial user opens Settings, toggles one dietary tag, presses save, and is **silently switched to metric**, with `phase` and `phaseStartDate` reset too. The save reports success. Nothing warns them. Their weights then read in the wrong unit everywhere -- the same class of harm as [AUD-064](#aud-064--weight-fields-always-say-lbs-even-in-metric-mode) and [AUD-122](#aud-122----five-screens-still-print-lbs-to-a-metric-user), arriving by a different route.
- **Why it hid:** it needs the user to act inside the load window. On a fast local emulator that is roughly **1 attempt in 4**; on a real connection it would be most of them. It surfaced as an intermittently red test, not a bug report -- see [AUD-127](#aud-127----the-emulator-e2e-suite-went-flaky-two-causes-both-found).
- **Fix:** Settings renders a spinner until `loading.initial` clears. No draft is ever built from defaults, so there is nothing to freeze and nothing to overwrite. There is nothing meaningful to edit before the data is there.
- **Proved both ways:** with the fix, `saving one setting does not clobber the others` passed **8/8**; with the fix removed, **6+ of 8 failed** on `measurementUnit` returning `metric`.
- **Worth checking elsewhere:** any other screen that builds an editable draft from store state which may still be `null`. The Settings page was found by accident; nothing has swept for the pattern.

## AUD-133 -- Every page load sends the visitor's IP address to Google, for two fonts

- **Type:** Privacy · **Severity:** P3 · **Confidence:** Confirmed (measured, 2026-09-15) · **PR:** **PR12** · **Status:** Open
- **Where:** `index.html:49-53` loads Inter and Material Symbols Outlined from `fonts.googleapis.com`, with the font files from `fonts.gstatic.com`. Allowed on purpose by the CSP (`index.html:38-39`) and by `ALLOWED_HOSTS` in `tests/unit/no-external-hosts.test.ts`.

### What happens

Every visitor's browser fetches the Google Fonts stylesheet and font files on
every page load, so Google receives their IP address, user agent and the page
they are on. Some EU regulators and courts have treated exactly this as a
personal-data transfer that needs consent.

### Not a regression, but it was mis-described

The links were already in `e58ddca`, before PR1. PR1.3 (was PR-3) added the CSP
and deliberately allow-listed these two hosts; its real scope was image hosts
(Unsplash, dicebear), and those are genuinely gone. But its commit title says
"cut every third-party host", the PR #1 description said the CSP "permits
Firebase hosts only", and the 2026-09-10 hand-test report said "zero third-party
hosts". All three were wrong about fonts. The PR #1 description was corrected on
2026-09-15; the commit title is frozen history.

### Why the checks said "none"

The browser pane's network log records fetch/XHR, documents and scripts, but
not stylesheets or font files. On 2026-09-15 the full session log (478 requests)
contained only `localhost:5173`, `127.0.0.1:8085` and `127.0.0.1:9099`, while the
page's own Resource Timing showed `fonts.googleapis.com` x2 and
`fonts.gstatic.com` x2. **Check third-party hosts with
`performance.getEntriesByType('resource')`, not only the network panel.**

### Fix direction, to decide

Self-host both families under `public/fonts/`, then remove both hosts from the
CSP and from `ALLOWED_HOSTS`, so the test fails if they come back. Material
Symbols is a large variable font: subset it to the icons actually used, or
accept the size. The CSP also allows `www.google.com` / `www.gstatic.com` for App
Check's reCAPTCHA, which did not load in emulator mode and was not exercised.

## AUD-132 -- Ticking a meal on any week except this one is never saved

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed (measured, 2026-09-15) · **PR:** **PR2** · **Status:** **Fixed** (PR2, 2026-09-15)
- **Where:** `src/pages/MealPlanner.tsx:812-845` (`handleToggleMealStatus`), the guard at `:841`; `src/lib/store.tsx:208-213` (how `activePlan` is chosen); `src/pages/MealPlanner.tsx:1032` (Confirm Plan's `disabled`).

### What happens

Open the planner on a week other than the current one -- last week, to catch up
on logging, or next week -- and tick or untick a meal. The tick changes on
screen. Reload, and it is back the way it was.

Nothing was ever sent. Three things line up:

1. `handleToggleMealStatus` always updates a local draft, but only writes to the
   database `if (displayPlan.id && displayPlan.id === contextActivePlan?.id)`.
2. The store's `activePlan` is **always the current week's plan**
   (`getMealPlanByDate(user.uid, getWeekStartKey())`). So for every other week
   the condition is false and the write is skipped.
3. The tick never calls `setIsDirty(true)` (six other edits do), and Confirm
   Plan is `disabled={saving || (!!displayPlan.id && !isDirty)}`. On a saved
   plan the button stays greyed out, so there is not even a manual way to save
   the tick -- and nothing on screen says it is unsaved.

### Measured

Found by hand against the emulator while testing the PR1 merge (`5d583cd`):

- Seeded an old-shape plan for **next week** (2026-09-21): Roast ticked, Salad not.
- In the browser: the old ticks rendered correctly. Unticked Roast; the button
  flipped to "Mark as eaten". Reloaded; it flipped back to "Mark as not eaten".
- Read the document back: **unchanged** -- no `mealStatus`, Roast still `true`.
  No console errors, so no rule rejected a write; there was no write.
- Progress then showed that week as **1/2 meals**, matching the stored data, not
  what the user did.
- Control, same session: ticking a meal on **this** week wrote exactly one
  `mealStatus` key and persisted across reload.

### Not introduced by PR1

`git blame` puts the guard in commits from 2026-01-14 and 2026-01-21, and it is
present in `e58ddca`, the commit PR1 started from. PR1.16 changed *what*
`toggleMealCompletion` writes (one map key instead of the whole week); it did
not change *when* the planner calls it.

### Why every test missed it

The AUD-022 e2e spec and the 2026-09-09 hand test both seeded the legacy plan
into `getMondayWeekStart()` -- the current week, which is the active plan. So
the old-shape merge is proven, but the non-current-week tick path was never
exercised by anything. **Seed the week you are testing, not the week that is
convenient.**

### Same family as AUD-131

Both are the UI showing a change as done when the server never got it:
AUD-131 because the button hides before the write lands, AUD-132 because the
write is skipped entirely.

### Fix direction, to decide

- Write ticks for any saved plan, not just the active one -- `toggleMealStatus`
  already takes a `planId`, so the service needs no change; the store action
  would need to accept the displayed plan's id instead of reading `activePlan`.
- Or, if ticking non-current weeks is not meant to be possible, disable the
  tick there instead of accepting it silently.

### Fixed

`toggleMealCompletion` now takes the id of the plan on screen and writes to it.
The optimistic store update still applies only when that plan is the active one,
because only the active plan lives in the store -- any other week is the
planner's own draft, which it has already updated itself. The planner's guard
`displayPlan.id === contextActivePlan?.id` became `displayPlan.id`, so a plan
that has never been saved still stays local until Confirm Plan.

The test was written first and watched fail for the right reason -- *"the tick
never reached the server: expected true, received undefined"* -- then passed
after the fix. It seeds **next** week on purpose: every other plan spec seeds the
current week, which is the one week the old code happened to write to.


## AUD-131 -- The settings specs reload while the save is still running

- **Type:** Test reliability · **Severity:** P2 · **Confidence:** Confirmed (measured, 2026-09-15) · **PR:** **PR2** · **Status:** **Fixed** (PR2, 2026-09-15)
- **Where:** `tests/e2e/emulator-auth.spec.ts` -- five waits after a save click. Not app code.

### Correction: the original write-up was wrong

This finding was first written on 2026-09-10 as an app bug: *"the save button says
saved before the server has it."* **That is not what happens.** The claim, the
measurement behind it, and the wording in pull request #1 were all wrong, and
they were wrong for the same reason.

### What is actually true, measured

`setDoc` does wait for the server. Two Firestore clients, the writer configured
exactly as the app configures it (`initializeFirestore` with only
`ignoreUndefinedProperties`, so the default memory cache, no offline
persistence), eight runs:

```
Visible to a second client the moment setDoc resolved: 8 of 8
Median setDoc resolve time: 22ms
Max waitForPendingWrites after resolve: 1ms
```

So the write is on the server before the promise resolves, and
`waitForPendingWrites` has nothing left to wait for. `Settings.saveChanges`
awaits that promise before clearing the dirty flag. The app never claims a save
it has not made.

### The real cause

While a save is in flight the save bar **stays on screen** and the same button is
relabelled:

```tsx
{hasChanges && ( ... <button disabled={saving}>{saving ? 'Saving...' : 'Confirm Targets'}</button> ... )}
```

Five specs did this:

```ts
await page.getByRole('button', { name: 'Confirm Targets' }).click();
await expect(page.getByRole('button', { name: 'Confirm Targets' })).toBeHidden();
await page.reload();   // <- in two of them, immediately
```

The button named "Confirm Targets" disappears the instant the label becomes
"Saving...". So the wait meant **the save started**, not the save finished, and
the reload then tore down the page mid-write. The write never reached the
server, the field fell back to its default, and the assertion read 500 instead
of 575.

Reproduced before the fix, `--repeat-each=6` over the settings specs: **2 of 42
failed** (an earlier run of the same command: 6 of 42).

### The fix

Wait for the bar to go, not for a name to change. `Discard` exists only while
there are unsaved changes and has no second label, so its disappearance means
`hasChanges` is false -- the save resolved.

```ts
await expect(page.getByRole('button', { name: 'Discard' })).toBeHidden();
```

Applied to all five save waits at once. The sixth occurrence of that line follows
a **Discard** click, not a save, and is left alone.

### How the wrong diagnosis happened, and what prevents it next time

The 2026-09-10 diagnostic script was written to check the app -- and it copied
the spec's own wait, `getByRole('button', { name: 'Confirm Targets' })` going
hidden. So it read the database at the moment the save *started* and reported
"6 of 8 runs had no stored value", which was then written into this ledger, into
a commit message, and into pull request #1's description as a fact about the app.

The mistake was not the measurement; it was **measuring against the same
assumption the bug lives in**. The check and the thing being checked shared a
wait condition, so the check could only ever agree.

**Rule:** when a UI signal is the thing under suspicion, do not use that signal
as the trigger for the measurement. Measure the layer underneath directly --
here, timing `setDoc` against a second client, which took one script and settled
it in eight runs.

AUD-132 is a genuine app bug found in the same session. The two are not the
same thing, and only AUD-132 lost user data.

## AUD-130 -- Route-level code splitting is blocked by the planner's timed auto-prompt

- **Type:** Perf · **Severity:** P2 · **Confidence:** Confirmed · **PR:** **PR1.15** · **Status:** **Fixed** (PR-11c, 2026-09-09)
- **What it bought:** a signed-out visitor now downloads `index` 219 kB + `firebase` 396 kB + `router` 35 kB = **650 kB**, instead of 1,242 kB. The 340 kB charting chunk and all eight pages arrive on demand as 9-59 kB chunks. Verified in a real build and by watching the network log in a browser: each page's chunk is requested only when that route is first opened.
- **The app fix, not a test fix.** The prompt no longer opens on a 500 ms wall-clock timer. `MealPlanner` records which week the plan read has finished checking (`checkedWeek`) and opens the prompt on that answer. It is both correct and instant, and it cannot land mid-interaction because of a slow network.
- **A guard that was added and then removed.** An interaction flag (`hasInteractedRef`) was meant to stop the modal interrupting the user. It suppressed the prompt after the user navigated to a new empty week -- exactly when it should fire. Data-driven timing alone was enough; the guard was deleted.
- **Three of the e2e failures were the tests being wrong, not the app.** `Clone Last Week` and `Create New Plan` are buttons **inside** the prompt modal, so a helper that dismissed the modal first destroyed the control the spec was about. And `meal planner future-week ... after reload` asserted the empty-state heading `Plan Week of X` **after** saving a plan -- a heading that only exists while the week is empty. It passed only when the assertion beat the plan load. It now reads the week off the toolbar, which is present in both states.
- **Original write-up follows.**
- **What it would buy:** with `React.lazy` on the eight pages, a signed-out visitor stops downloading the 340 kB charting chunk and every page component before the login form can render. Measured on a working branch: first-paint JS drops from **1,242 kB to ~650 kB**, and the pages arrive as 9–59 kB chunks on demand.
- **Why it is not shipped:** it turns 8–17 e2e specs red, and not because the app is broken. `MealPlanner` opens its "Plan for Week of X?" modal on a **500 ms timer** after it decides the week is empty. Lazy loading makes the page arrive one round trip later, so that timer now fires *during* the specs' first interactions, and the modal is a full-screen overlay that intercepts pointer events.
- **The specs were already fragile.** One did `if (await maybeLater.isVisible())` immediately after `goto('/plan')` -- a race by construction. Before lazy loading it usually won; afterwards it usually lost.
- **Two attempts at a test-side fix failed, and the failures are the useful part.** The first waited for the heading `Plan Week of ...`, which only renders when the week is EMPTY, so every spec that seeds a plan failed on the wait itself. The second waited for a `button` named `Week`, which is not a button. Both were guesses about a DOM I had not looked at. **Read the accessibility tree of the loaded page before writing the wait** -- the third attempt should start there, not with a third guess.
- **The better fix is probably in the app, not the tests.** A modal that appears on a wall-clock timer regardless of what the user is doing will interrupt a real person on a slow connection exactly as it interrupts the suite. Basing it on data-readiness, or suppressing it once the user has interacted, fixes both at once.
- **Kept out of PR-11c on purpose.** Bundle splitting is a one-line config change with a measurable result; this is a behavioural question about the planner. Mixing them would have meant a red suite with two candidate causes.

## AUD-125 -- The search vector is dead weight on every recipe read

- **Type:** Perf / cost · **Severity:** P3 · **Confidence:** Confirmed · **PR:** unassigned · **Status:** Open
- **Where:** `users/{uid}/recipes/{id}.embedding`, read by `getRecipes` in `src/services/recipeService.ts`.
- **Problem:** The semantic-search vector lives **inside** the recipe document. Every recipe list fetch therefore downloads it -- hundreds of floats per recipe -- and nothing in the client ever reads it. `semanticSearchRecipes` even strips it before returning (`embedding: undefined`), which is the app admitting it is not wanted.
- **Impact:** Slower reads and more billed bytes on the most common query in the app, growing linearly with the library. It also pushes each recipe toward the 1 MB document limit for no benefit.
- **The fix is the one AUD-003 chose not to take:** move it to `users/{uid}/recipeEmbeddings/{recipeId}` guarded by `allow read, write: if false`, matching the `ops/**` pattern.
- **Why it was split off rather than done:** it is a cost problem, not a security one -- AUD-003 is fully closed without it. Doing it means rewriting `semanticSearchRecipes` (`findNearest` would query the new collection, then fetch recipes by id), and **it cannot be verified here**: semantic search needs live paid AI calls, which the emulator blocks by design. Shipping an unverifiable rewrite of working code to fix a speed problem is the wrong trade.
- **Do it together with the missing vector index below.**

## AUD-126 -- `firestore.indexes.json` declares no vector index, so semantic search may already be broken in production

- **Type:** Config · **Severity:** P2 · **Confidence:** Needs owner check · **PR:** unassigned · **Status:** Open
- **Where:** `firestore.indexes.json` is `{"indexes": [], "fieldOverrides": []}`. `functions/src/index.ts` calls `.findNearest("embedding", ...)`.
- **Problem:** Firestore `findNearest` requires a declared vector index. Nothing in the repo declares one.
- **Impact:** If no index was created by hand in the console, the AI Search button in `RecipeLibrary.tsx` fails **after** the paid embedding call has already been made -- so it costs money and returns nothing.
- **Not confirmed, and cannot be from here:** the emulator does not enforce vector indexes, so a local run proves nothing either way. **Owner check:** does AI Search actually return results in the deployed app?
- **Fix:** declare the index in `firestore.indexes.json` so it is version-controlled rather than a console click nobody remembers.

## AUD-127 -- The emulator e2e suite went flaky: two causes, both found

- **Type:** Test reliability · **Severity:** P1 · **Confidence:** Confirmed · **PR:** unassigned · **Status:** **Fixed** (2026-09-07)

Four consecutive runs, four *different* failures, one of them on a completely
unmodified tree at HEAD. That last run is what proved it was not any one change.

### Cause 1 -- a locator that could only pass by losing a race

`getByRole('button', { name: /New Recipe/ })` matched **two** elements once the
recipe grid rendered: the header button and the "Add New Recipe" card at the end
of the grid. Playwright's strict mode fails on two matches.

The spec passed only when it clicked **before** the grid finished loading, when
just one existed. It was a coin toss by construction, and it got worse as the
machine got busier.

**Fixed at the source, not in the test.** The icon ligature was leaking into the
accessible name -- the header announced as "add New Recipe" and the card as "add
Add New Recipe Create manually" -- so the two were never cleanly distinguishable.
Both buttons now carry a real `aria-label` and their icons are `aria-hidden`,
which a screen reader wanted anyway. The specs then use an exact name, and wait
for the library to load before touching it.

**Wider issue, not fixed here:** only ~16 of 183 `material-symbols-outlined`
spans are `aria-hidden`. Every icon-plus-text button in the app has the same
polluted accessible name. That belongs with the accessibility work in PR4.

### Cause 2 -- something else on the machine owns port 8080

An SSH tunnel, unrelated to this project, holds `127.0.0.1:8080` and restarts
itself:

```
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:8080:127.0.0.1:8080 purple-lighthouse
```

The Firestore emulator wants the same port. Whichever binds first wins, so runs
failed to start at all, or started against a contested port. **A test suite
cannot be made robust against two processes fighting over one socket.**

**Fixed by moving the emulator to 8085**, with the owner's agreement -- the
tunnel is theirs and stays. See [AUD-042](#aud-042--emulator-ports-are-hardcoded-in-two-places),
which predicted this precise situation and had to be fixed first.

### The third cause, which I first found, then wrongly dismissed

Two failures pointed at settings and weight. The theory was that the Settings
draft is built from `getSettingsSnapshot(null)` -- i.e. defaults -- before the
real settings arrive, that `hasChangesRef` then freezes that draft, and that
saving writes the defaults over the account.

**That theory was correct.** It is now [AUD-129](#aud-129----settings-can-save-defaults-over-a-real-account).

It was nearly lost, and the way it was nearly lost is worth more than the bug:

1. A spec was written to prove it. The spec read the document **immediately**
   after the UI said saved, got `dietaryTags: []`, and failed on the wrong
   assertion -- the change appearing to vanish rather than the units flipping.
2. Reading the same document 1.5 seconds later showed the value present. The
   conclusion drawn was "my read was stale, so there is no bug", and **the fix
   was reverted** on the grounds that a finding without a reproduction is a
   theory.
3. That rule is right. The application of it was wrong: the stale read had only
   ever falsified *one* assertion. It said nothing about the units, which were
   the actual symptom, and which were never re-checked after the read was fixed.

Once the read used `expect.poll`, the spec failed on the real assertion --
`measurementUnit` came back **"metric"** on an imperial account -- at about
**1 run in 4**. With the fix: **8 of 8 passed**. Without it: **6+ of 8 failed**.

**The lesson:** when a test fails for a reason you have shown to be your own
mistake, that clears *that assertion*, not the finding. Fix the test and run it
again before concluding the bug was imaginary.

## AUD-116 — A blank image field was saved as a stock photo URL

- **Type:** Data integrity · **Severity:** P2 · **Confidence:** Confirmed · **PR:** **PR1.3** · **Status:** **Fixed** (PR-3, 2026-08-26)
- **Where:** `RecipeForm.tsx:174` — `imageUrl: imageUrl.trim() || 'https://images.unsplash.com/...'`
- **Problem:** Leaving the image field blank on save wrote a third-party stock photo into Firestore **as the recipe's own image**. Not a render-time fallback — persisted.
- **Why it matters beyond the URL:** those values are in real databases now. Adding a CSP without handling them would have broken the image on every recipe already saved. Handled by `isRenderableImage()`, which declines to request an image from an untrusted host.
- **Why the audit missed it:** the static sweep looked for `<img src>` render sites, not for a third-party URL on the *write* path.

## AUD-117 — RecipeCard rendered an Unsplash placeholder

- **Type:** Privacy · **Severity:** P2 · **Confidence:** Confirmed · **PR:** **PR1.3** · **Status:** **Fixed** (PR-3, 2026-08-26)
- **Where:** `RecipeCard.tsx:20` — `getPlaceholderImage()` returned a hardcoded Unsplash URL.

## AUD-118 — MealPlanner kept six meal-type stock photos

- **Type:** Privacy · **Severity:** P2 · **Confidence:** Confirmed · **PR:** **PR1.3** · **Status:** **Fixed** (PR-3, 2026-08-26)
- **Where:** `MealPlanner.tsx:1602-1607` — one Unsplash URL per meal type.

---

# P. Found By Running The Baseline (2026-08-26)

Verified on unchanged code, before any fix:

```
npm run check            exit 0   app lint + build, functions lint + build
npm run test:e2e:emulator exit 0   67 passed, 0 failed (3.9m)  [grew to 69 by 2026-09-04]
```

**The baseline is green.** Any future test failure is caused by the change under
review, not by pre-existing breakage. That is what makes ticking an item off mean
something.

## AUD-109 — The whole app ships as one 1.2 MB chunk

- **Type:** Perf · **Severity:** P2 · **Confidence:** Confirmed (observed in a real build)
- **Where:** `vite.config.ts` — no `manualChunks`, no route-level code splitting.
- **Problem:** `npm run build` emits a single `dist/assets/index-*.js` at **1,235.99 kB** (360.43 kB gzipped). Vite warns: *"Some chunks are larger than 500 kB after minification."*
- **Impact:** Every visitor downloads, parses and executes the entire app — Recharts, pdfjs-dist, the full Firebase SDK, every page — before the login screen can render. `pdfjs-dist` alone is large and is only needed on the recipe-import path. On a phone on mobile data this is the single biggest thing standing between tapping the link and seeing the app.
- **Fix:** Route-level `React.lazy` on the eight page components, and a dynamic `import()` for `pdfjs-dist` inside the import flow. Recharts likewise only on Progress and Dashboard. Add `build.rollupOptions.output.manualChunks` to split the Firebase vendor bundle.
- **Effort:** M · **PR:** **PR1.15** · **Status:** **Fixed** (PR-11c, 2026-09-09) -- the caching half shipped first, the first-paint half followed in [AUD-130](#aud-130----route-level-code-splitting-is-blocked-by-the-planners-timed-auto-prompt).
- **First paint is now 650 kB, down from 1,242 kB**, for a signed-out visitor.
- **What shipped:** `manualChunks` splits the vendors out, so the single 1,242 kB chunk becomes app code 467 kB plus charts 340 kB, firebase 396 kB and router 35 kB. No chunk exceeds 500 kB and Vite's warning is gone.
- **Be precise about the win: it is repeat visits, not first paint.** A first-time visitor still downloads roughly the same total. What changed is that a deploy no longer invalidates everything: the vendor chunks only change when a dependency is upgraded, so a returning browser re-downloads **467 kB instead of 1,242 kB**.
- **The finding was wrong about pdfjs-dist.** It is not in the bundle and never was: `src/lib/pdf-utils.ts` has no importers, so tree-shaking already dropped it. Grepping the built bundle for `pdfjs` returns zero matches. That also means **pdfjs-dist is an unused dependency**, which belongs with the dead-code work in PR8.
- **React is deliberately not split out.** Doing so produced `Circular chunk: react -> charts -> react`, because the charting library imports React at module-eval time. A circular chunk is a load-order hazard for a saving that does not exist -- React is needed on the first paint either way.
- **Note:** This was invisible to the static audit. It only appeared once a real build ran — which is the argument for running the verification ladder early rather than at the end.

## AUD-110 — Some tests assert behaviour this audit wants changed

- **Type:** Process · **Severity:** P2 · **Confidence:** Confirmed
- **Where:** `tests/e2e/emulator-auth.spec.ts` — at least four tests, including
  `dashboard hydration save failure alerts the user`,
  `dashboard sleep save failure alerts and keeps the modal open`, and
  `dashboard check-in save failure alerts and keeps the modal open`.
- **Problem:** These tests pass **because** the app calls native `alert()`. AUD-051 proposes replacing all fifteen `alert()` / `prompt()` sites with inline banners. Doing so will turn these tests red — correctly, because the behaviour genuinely changed.
- **Impact:** Not a bug. It is a **planning fact** that would otherwise ambush PR5. A red test there is expected and the test must be rewritten to assert the new inline message, not deleted.
- **Action:** Before PR5 starts, grep the suite for `alert` assertions and list them in the PR brief. Rewrite each alongside its fix, in the same PR.
- **Effort:** S to identify · **PR:** **PR7** · **Status:** Open

## What the test suite does *not* cover

Worth knowing before trusting green as "safe to change anything":

| Area | Covered? | Note |
|---|---|---|
| Auth, onboarding, dashboard metrics | **Yes**, thoroughly | Including failure and retry paths |
| Recipe import cleanup on parse-failure and cancel | **Yes** | This is `BUG-003`'s regression proof |
| Recipe import cleanup on **navigate-away** | **No** | Exactly the hole AUD-073 describes — untested, so it stayed invisible |
| Grocery generation reaching the Grocery page | **No** | AUD-080's broken handoff is cross-page; the suite tests each page alone |
| Concurrent writes (double-save, double-toggle) | **No** | AUD-020 / AUD-021 need new tests written before their fix |
| Metric vs imperial unit maths | **No** | There is no test for `calculateTDEE` at all — AUD-063 |

---

## Decisions Needed From The Owner

These are not code problems. They need a product call before a PR can be written.

1. **AUD-009 storage quota** — accept the risk and rely on the `$50` project cap, or build a counter Function? A counter is `L` effort for a one-user alpha.
2. **AUD-003 embeddings** — move `embedding` to a server-only collection now, or leave it until `BUG-009` (semantic search) is un-deferred?
3. **AUD-005 plan size caps** — is 12 meals per day a reasonable hard ceiling?
4. **AUD-030/031/032 empty states** — when a user has zero recipes, should the Meal Planner block generation outright, or generate an empty scaffold they fill in manually?

---

## Change Log

| Date | Change |
|---|---|
| 2026-08-25 | Ledger created. Foundation, services, and security rules swept. 43 findings recorded. |
