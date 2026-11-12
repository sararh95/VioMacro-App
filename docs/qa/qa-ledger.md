# VioMacro QA Ledger

## 2026-11-11 VioMacro 1.0 G4 R4 fix round 1 responsive saves

Water totals update immediately and each pending operation can roll back independently. Settings keeps its controls active and clears dirty state only when the latest submitted snapshot matches the current draft. Pending recipe, check-in and sleep sessions close through their parent, allowing a fresh form to open. Late completions preserve the fresh session. [PR #1](https://github.com/sararh95/VioMacro-App/pull/1)

- Red on pre-round `9693c2f`, `npm.cmd run test:e2e:emulator -- -g 1.0.G4.round.1` reported `4 failed`. Line 7515 expected `{ enabled: true, water: 250 }` and received `{ enabled: false, water: 0 }`. Line 7534 expected zero Saving buttons and received one. Line 7552 expected target `2450` and received `2300`. Line 7571 expected a visible New Recipe heading after relaunch and reported `Error: element(s) not found`.
- Final green with the same command reported `4 passed (22.9s)`. The final control restored only the six changed source files from `9693c2f` and reported `4 failed` on the same assertions. The committed source was restored and the tree was clean. Evidence is `round-1-green-run-3.txt` and `round-1-control-run-3.txt` in RUN.
- Required `npm.cmd run test:e2e:emulator -- -g <filter>` results were `1.0.G4` 7, `VM-054` 10, `G-B` 5, `settings` 21, `Dashboard` 13 and `recipe` 65 passed. Each command exited 0. Infrastructure passed 4 per invocation. Desktop and phone coverage passed.
- The first G4 try introduced duplicate numeric React keys on the check-in and sleep siblings. Eight VM-054 cases caught the console errors. Distinct key prefixes fixed the regression, and green, control and all filters were repeated. A subsequent import-asset handoff change also received fresh green/control proof. These failures were corrected regressions, with no flaky designation or test edit.
- `npm.cmd run check` exited 0 with lint 0 errors, app `293` passed, Functions `125` passed and both builds passed. Failed 0 and skipped 0. Four appended unit cases prove optimistic increments, rejection rollback and out-of-order confirmation. The small shared queue helper prevents a rejected water write from removing later taps or corrections.
- The copied picture kit reported `5 passed (29.4s)` with `page errors=[]` in each scenario. Both 390 px touch images were opened. Water shows 500 ml offline with active controls. Settings shows the pending note, target B=2450 and Confirm Targets while A=2300 waits. Files are `C:/Users/sarar/viomacro-sol-runs/g4/g4-round-1-after-1-water-responsive-390.png` and `g4-round-1-after-1-settings-responsive-390.png`.
- RecipeLibrary owns the open flag, import cleanup and failed recipe snapshots, which requires the coordinator's expanded source allowlist. Submitted import assets leave cancel-cleanup ownership immediately. An active rejected draft regains cleanup ownership. Inactive failures expose a named Recover recipe action that opens the full captured draft. The rules-refused recipe case recovered its title and calories, then saved successfully after correcting the title.
- Dashboard retains full failed check-in and sleep payloads in page-owned retry closures, with item/date/value messages. A delayed failed check-in preserved a fresh form and successfully retried the captured 73.5 kg payload. A rules-refused sleep log preserved the fresh form and retained its notes and retry action. Recovery entries live in page memory. The existing shell notice still overlays underlying content at the top.
- The prior 413,301 browser-test bytes and 5,214 unit-test bytes are identical to `9693c2f`. No old assertion, timeout or retry changed. Local Node was 24. Full CI floors are now app 293 and emulator browser 217, with total 706. Live data and physical phones remain untested. All required local ports were free after shutdown.

## 2026-11-11 VioMacro 1.0 G4 R4 pending saves

Recipe create/edit, grocery add, water add/correction, sleep, weight check-in, settings, onboarding and pantry add now register pending saves. Grocery and pantry add use synchronous in-flight guards and preserve the next typed draft. Water Cancel stays usable. A small optional 1.5-second callback in trackSave temporarily hides waiting modal overlays so the existing shell note is readable. Component drafts remain available for rejection recovery. [PR #1](https://github.com/sararh95/VioMacro-App/pull/1)

- Red on BASE `17ff4c3`, `npm.cmd run test:e2e:emulator -- -g 1.0.G4.R4` reported `3 failed`. Grocery line 7443 and recipe line 7486, `await expect(note(page)).toBeVisible();`, reported `Expected: visible` and `Error: element(s) not found`. Double Enter line 7469 reported `Error: two Enter presses must create exactly one item` and returned two `R4 Double Pears` records.
- Green with the same command reported `3 passed (20.6s)`. Reconnection, exact record counts and reload passed. The recipe form closed while its save waited. The source-only BASE control reported `3 failed` on the same assertions. Restoring the committed sources left a clean tree.
- Required `npm.cmd run test:e2e:emulator -- -g <filter>` results were `VM-054` 10, `G-B` 5, `grocery` 26, `recipe` 64, `pantry` 3, `settings` 19 and `onboarding` 8 passed. Each command exited 0. Infrastructure passed 4 in every invocation. These filters include 1440 px and 390 px coverage.
- `npm.cmd run check` exited 0. Lint had 0 errors, app tests reported `289` passed and Functions reported `125` passed. Both builds passed. Failed 0 and skipped 0. Three appended unit cases cover the waiting callback, fast fulfillment and rejection. Existing Functions lint selects no source files.
- The copied picture kit verified nine offline paths at 390 px with touch. Eight cases passed in the first run. Correcting the water-correction selector to include its icon text produced `1 passed (7.8s)` for that case. All nine PNGs were opened. Grocery and pantry double submission saved one item, next drafts survived, water Cancel and Settings Discard worked, and all submitted values reached the emulator after reconnection. Each scenario recorded `page errors=[]` with the AI guard installed.
- Pictures are in `C:/Users/sarar/viomacro-sol-runs/g4/`, named `g4-after-1-<path>-pending-390.png`, with water correction in `g4-after-2-water-correction-pending-390.png`. The note is readable. The existing absolute notice overlaps the Grocery and Recipes headings at 390 px. AppLayout owns that presentation outside W4's source allowlist.
- The first G1 attempt used a desktop-only navigation helper in the new phone tests. Only the new test navigation was corrected. The prior 409,187 browser-test bytes and 3,985 unit-test bytes are unchanged. Assertions, timeouts and retries in prior tests are unchanged.
- Local Node was 24. Full browser, rules, concurrency and built-app suites are assigned to Node 22 CI. The required CI floors are app 289 and emulator browser 213 after the six new cases. Physical phones and live data remain untested. All six required ports were free after shutdown.

## 2026-11-11 VioMacro 1.0 G3 R3 fix round 1 recipe recovery

Successful recipe reads and save refreshes clear the previous load error. If a full-library read fails after a nonempty server confirmation, the confirmed page remains available. The coordinator assigns the full local run to its own lane while GitHub billing blocks CI. [PR #35](https://github.com/sararh95/VioMacro/pull/35)

- Red before the fix on `2f3b8b9`, `npm.cmd run test:e2e:emulator -- -g 1.0.G3.R3.*creating` reported `1 failed` at `await expect(page.getByText('Could not load your recipes', { exact: true })).toBeHidden();`, with `Expected: hidden` and `Received: visible`. The account started empty, and the test created and deleted its recipe without Retry before the assertion. The SDK confirmed the final library was empty.
- The first attempt timed out on an incorrect create-button selector. Its corrected accessible name is `check Create Recipe`. Existing assertions and timeouts are retained. The corrected run reproduced the stale error.
- Green with the same command reported `1 passed (6.9s)`. The control restored only RecipeLibrary.tsx from `ecdc049`, reported `1 failed` at the same assertion with `Expected: hidden`, `Received: visible`, and ended with the committed source restored and a clean tree.
- Required filters with `npm.cmd run test:e2e:emulator -- -g <filter>` passed `1.0.G3.R3` 3, `G-D` 2 and `recipe` 63. All native exits and the capture-loop exit were 0. Infrastructure passed 4 in each invocation. G-D preserves access to the oldest of 501 recipes through search, the picker and groceries. The confirmation fallback has source-review proof and no dedicated forced-read-failure test.
- `npm.cmd run check` exited 0 with lint 0 errors, app `286` passed, Functions `125` passed and both builds passed. Failed 0 and skipped 0. Local Node was 24. Functions lint retains its existing zero-source coverage.
- The copied picture kit in `_local/pictures-g3-round-1/` reported `1 passed (7.6s)`. Both 390 px touch images were opened. Creation after reconnection shows the saved card, deletion shows No recipes found, and a later new form still cancels. Images are `C:/Users/sarar/viomacro-sol-runs/g3/round-1-after-1-recipes-created-390.png` and `round-1-after-1-recipes-empty-390.png`.
- Picture diagnostics recorded 0 page errors and four expected aborted or disconnected requests. All six ports were free after shutdown. Physical phones, live data and Node 22 execution remain untested.
- Under fix-round-1.txt, CI cells read `CI blocked by GitHub billing; local full run by the coordinator`. Coordinator full-suite counts remain pending at this handoff. The emulator floor for this PR is now 210, including all three G3 regressions.

## 2026-11-11 VioMacro 1.0 G3 R3 honest loading

The Planner confirms empty reads from the server before offering plan creation. Pending reads show Loading and failed reads expose Retry. Recipe-library empty reads receive server confirmation and failed loads expose Retry. Found cached plans and recipes remain usable offline. [PR #35](https://github.com/sararh95/VioMacro/pull/35)

- Red on BASE `1cad35c`, `npm.cmd run test:e2e:emulator -- -g 1.0.G3.R3` reported `2 failed`. Planner `await expect(page.getByText(/No plan found for this week/)).toBeHidden();` and Recipes `await expect(page.getByText('No recipes found', { exact: true })).toBeHidden();` both reported `Expected: hidden`, `Received: visible`.
- Green with the same command reported `2 passed (10.1s)`. Both Retry paths, cached offline remounts and unchanged saved-plan data passed at 1440 px.
- Control restored only MealPlanner.tsx, planService.ts and RecipeLibrary.tsx from BASE. The same command reported `2 failed` on the same two assertions with `Expected: hidden`, `Received: visible`. The committed sources were restored and `git status --short` printed nothing.
- Required touched filters passed with `npm.cmd run test:e2e:emulator -- -g <filter>`. Results were `G-B` 5, `meal.planner.prompt` 1, `meal.planner.week.navigation` 1, `AUD-022` 2, `VM-054` 10 and `data-loss` 6. Infrastructure passed 4 in every invocation. Each emulator script printed `Script exited successfully (code 0)`. The five-filter PowerShell capture loop itself returned 1 after recording native stderr.
- `npm.cmd run check` exited 0 with lint 0 errors, app `286` passed and Functions `125` passed. Both builds passed. Local Node was 24. Functions lint retains its existing zero-source coverage. Full browser, public, rules, concurrency and built-app suites are assigned to CI under the gauntlet.
- The isolated picture kit at `_local/pictures-g3/` reported `2 passed (14.1s)`. All four final 390 px touch captures were opened. Loading, Planner error and Recipes error are legible, Retry is reachable, reconnection restores the saved plan, cached offline remounts work, and both forms' Cancel buttons work. Evidence is in `C:/Users/sarar/viomacro-sol-runs/g3/g3-after-2-planner-loading-390.png`, `g3-after-2-planner-error-390.png`, `g3-after-2-planner-retry-390.png` and `g3-after-2-recipes-error-390.png`.
- The first picture attempt failed in helper route cleanup and a duplicate mobile link selector. The helper was corrected for attempt 2. Earlier evidence is retained. The saved-plan capture shows the previously recorded unreadable white meal title on a white card, outside this loading-state scope.
- Picture diagnostics recorded 0 page errors in each scenario, expected disconnected-read errors, aborted loopback requests and blocked Firebase SDK connectivity probes. All six required ports were free after shutdown. Physical phones and live data remain untested.

## 2026-11-11 VioMacro 1.0 G2 R2 grocery ticks per week

Generated grocery ticks now follow mealPlanId and ingredient identity. A same-plan refresh preserves ticks. Another plan and old generated items without a plan start unticked. The coordinator authorized matching-plan IDs in existing ingredient and refresh fixtures. Every existing assertion is retained. [PR #34](https://github.com/sararh95/VioMacro/pull/34)

- Red on BASE `728207e`, `npm.cmd run test:unit` reported `284 passed`, `2 failed`, `0 skipped`. Both new negative cases failed at `assert.equal(generated[0].isChecked, false)` with `true !== false`. The same-week case passed.
- Browser red, `npm.cmd run test:e2e:emulator -- -g 1.0.G2.R2` reported `1 failed`, `Expected: false`, `Received: true` for this week's chicken.
- Green, `npm.cmd run test:unit` reported `286 passed`, `0 failed`, `0 skipped`. The same browser command reported `1 passed (13.7s)` at 390 px with touch and verified the unticked row.
- Control restored only shoppingService.ts from BASE. Unit output was `284 passed`, `2 failed`, with the same `true !== false` lines. Browser output was `1 failed`, `Expected: false`, `Received: true`. The committed source was restored and the tree was clean.
- Touched filters passed with `npm.cmd run test:e2e:emulator -- -g <filter>`. The corrected `data-loss..generated.grocery.refresh` selected 1 case, `G-A` passed 4, and `VM-054` passed 10 across 1440 px and 390 px. Infrastructure passed 4 in each invocation. W2's single-dot grocery filter initially selected zero tests because the title contains a colon and a space.
- `npm.cmd run check` passed with lint 0 errors, 286 app tests, 125 Functions tests and both builds. Local Node was 24. Full browser, public, rules, concurrency and built-app suites are assigned to CI. Functions lint retains its existing zero-source coverage.
- The picture kit reported `1 passed (10.0s)`. Both final 390 px touch pictures were opened. The new-week row is unticked and readable, the same-week refresh keeps its tick, and the manual bag item is preserved. Files are `C:/Users/sarar/viomacro-sol-runs/g2/g2-round3b-new-week-390.png` and `g2-round3b-same-week-390.png`. The first same-week capture caught the closing drawer and was retaken after a drawer-position assertion.
- Picture diagnostics recorded 0 page errors, one transient Firestore unavailable message and six aborted loopback requests during navigation. Saved state, reload and both refreshes passed. Physical phones and live data remain untested.
- The initial new phone test reached the correct database result, then the Planner success banner intercepted the navigation button. The test now dismisses the banner before navigation. The screenshot is retained for the coordinator. All six required ports were free after emulator shutdown.

## 2026-11-11 VioMacro 1.0 G1 R1 snack circle fix round 1

The unticked snack circle uses the full secondary color on no-hover devices, and the drink icon is hidden there. The desktop guard checks the existing 20%-alpha circle and visible drink icon before hover. The two R1 test blocks gained assertions and a desktop snack fixture. All earlier test lines are retained. [PR #33](https://github.com/sararh95/VioMacro/pull/33)

- Red on `72e06ed`, `npm.cmd run test:e2e:emulator -- -g 1.0.G1.R1` reported `Error: unticked phone snack circle alpha`, `Expected: 1`, `Received: 0.2`, and `Error: unticked phone snack drink icon opacity`, `Expected: 0`, `Received: 1`. Browser output was `1 failed`, `1 passed (32.7s)`.
- Green with the same command reported `2 passed (25.6s)`. All five phone actions and picker/form dismissal passed.
- Control with only the two SnackCard classes restored from `4de5d0a` reported the same alpha and drink-opacity failures, `1 failed`, `1 passed (29.5s)`. The tree was clean after restore.
- `npm.cmd run test:e2e:emulator -- -g <filter>` passed `G4.layout` 16, `G13` 6, `G15` 4 and `VM-054` 10 cases. Infrastructure passed 4 in each invocation.
- `npm.cmd run check` passed with lint 0 errors, 283 app tests, 125 Functions tests and both builds. The compiled color and icon-hide rules are inside `@media(hover:none)`. The local full emulator suite is assigned to CI under the updated gauntlet.
- The picture kit reported `2 passed (16.5s)`. Both Planner pictures were opened. At 390 px with touch, the circle is clear and the drink has opacity 0. At 1440 px, the drink is visible and the unhovered tick is hidden. Evidence is in `C:/Users/sarar/viomacro-sol-runs/g1/g1-round1-after-planner-390.png` and `g1-round1-after-planner-1440.png`.
- Both pictures show an unreadable white meal title on a white MealCard, outside this SnackCard round. Phone picture diagnostics recorded one transient Firestore unavailable message and aborted loopback requests during navigation. Both profiles had 0 page errors. These observations are retained for the coordinator.
- All six required ports were free after the owned emulators stopped. Local Node was 24. Physical phones and live data remain untested.

## 2026-11-10 VioMacro 1.0 G1 R1 touch controls

Five controls are visible on no-hover devices. The 390 px test taps each control, checks separate meal tick and swap targets, and closes the picker and recipe form. The 1440 px guard checks the meal tick before hover, during hover and after marking the meal eaten. [PR #33](https://github.com/sararh95/VioMacro/pull/33)

- Red on `bc57b30`, `npm.cmd run test:e2e:emulator -- -g 1.0.G1.R1`: `Error: meal tick control opacity`, `Expected: 1`, `Received: 0`. All five controls returned the same opacity mismatch. `1 failed`, `1 passed (47.6s)`.
- Green, same command: `2 passed (28.9s)`.
- Control, same command with the five classes restored from BASE: `1 failed`, `1 passed (35.3s)`. `Error: meal tick control opacity`, `Expected: 1`, `Received: 0` and the same mismatch on the other four controls. The tree was clean after restore.
- `npm.cmd run build`: passed. The compiled hide rule is inside `@media (hover:hover)`.
- `npm.cmd run test:e2e:emulator -- -g <filter>`: `G4.layout` 16 passed, `G13` 6 passed, `G15` 4 passed and `VM-054` 10 passed.
- `npm.cmd run check`: lint 0 errors, 283 app tests and 125 Functions tests passed. Both builds passed.
- `npm.cmd run test:e2e:emulator`: infrastructure 4 passed, browser `206 passed (25.1m)`, 0 failed, 0 skipped. The test command exited 0. All six loopback ports could be rebound after shutdown. Local Node 24.

## 2026-11-04 VM-054 local implementation checks; emulator proof pending

Sara's decision is pending-save honesty with no persistent offline cache. The signed-in shell has a noninteractive, in-flow `role="status"` notice after 1.5 seconds of continuous pending saves and an immediate `beforeunload` guard removed when the count reaches zero. Leaving anyway can still lose unconfirmed changes. Firebase configuration and rules are unchanged.

- Wrapped optimistic writes: store `updatePlan`, `toggleMealCompletion`, `toggleGroceryCheck`, `deleteGroceryItem`; Dashboard custom bottle size; Pantry delete; Recipe Library favorite. Existing success/error/rollback paths are unchanged, including G-B. Grocery add and `addWaterMl` update displayed data only after their awaited writes, so they remain unwrapped; the same applies to water correction, sleep, ordinary settings/check-in, recipe create/edit/delete and pantry add.
- `node --test tests/unit/pending-saves.test.ts`: 7 PASS, 0 FAIL. All seven first failed meaningfully against a placeholder implementation. Coverage includes original promise identity, fulfillment/rejection, concurrent/out-of-order settlement, subscribe/unsubscribe, already settled promises and a faulty subscriber without a stuck count or an unhandled rejection.
- `node --test tests/unit/pending-saves.test.ts tests/unit/meal-status.test.ts`: 26 PASS, 0 FAIL, 0 skipped (7 new plus 19 existing, including G-B rollback logic).
- `npx --no-install eslint` on all eight changed TS/TSX files: exit 0, no output. `npx --no-install tsc -b`: exit 0, no output. These checks used the available Node v24.18.0; the repo's Node 22 CI target was not run here.
- Playwright `--list --grep 'VM-054 unsent saves note' --reporter=list` with the existing emulator config: 10 cases discovered, not executed. Both 1440px and 390px cover held meal/grocery writes, dismissed native unload warnings, polling independent database reads after release, a fast save with a mutation observer, offline grocery/reconnection and a real 200-key rules refusal. Geometry checks cover viewport containment, pointer-events and navigation/Confirm Plan overlap.
- The original E2E prefix is byte-identical to HEAD (382,569 bytes). No prior test, assertion, retry or timeout was changed. No server/emulator, production operation, deployment, live AI call or Git write was performed. Claude Code owns emulator/browser execution, review and all Git work; VM-054 remains open pending that proof.

## 2026-10-29 G11 target-label verification — in progress

[Draft PR21](https://github.com/sararh95/VioMacro/pull/21) is open/attached for VM044/059/060, source checkpoint2a2bc9d normally committed/pushed. Automated gates below remain pass with145/final E2E/prefix exact; native labels/data flows at both widths are established in two qualified reports. Full Chrome is not certified: phone Grocery/Recipes reload, three desktop pixel repairs and complete desktop diagnostics remain. Latest23-file after-visible-partial dataset/original verified before ACK/owned service stop. No closure/fresh-review/merge claim. Evidence `g11/fixed-chrome-source1/recovered-captain/` and `visible-continuation/`; exact gaps/preservation in G11 log. Initial CI41015451901 runs on2a2bc9d; this link/status-only follow-up requires its own current-head CI, then both fresh sequential reviews after author Chrome completes.

VM044/059/060 reproduced on main5b97627 through actual Chrome at1440x1000/390x844:4Planner+6Onboarding/calculator+3Settingsgram controls. BothPlanneropeners and associatedHeight/wrappedSettings positivecontrols recorded. Evidence `_local/qa/fix-loop-2026-10-22/g11/unfixed-chrome-main5b/` report/134files/38nativeJPEGs; root133hashes/123inputmap verified. Two diagnostictruncations, one inputtimeout, native-proxy/initialsuffix corrections and boundedfavicon/canceledFirestore observations remain qualified. NEW23-file manualexport verified before normalcleanup/ownedservicestop; no production/provider/deploy.

Sourceiteration1 links existing labels/controls in3files only, preserving all calculations/handlers/values/styles/existingARIAnames. Six append-only real E2E cases preserve the entire315947-byte legacy prefix. Correctedfinaltests328668SHAa298bb2fc8a8e80c846e863e57d2e03fac0a2b04c65aa1e2f775b0c073cb1d65: source-only basecopy6meaningfulFAIL+infra4PASS, candidate6PASS+infra4PASS (`gates/focused-2026-10-29T16-43-03-322Z`),123inputs exact/Node22/viomacro/AIunset/no privateimport. Native names/association/label-click focus, bothopeners, plan-onlysave/cancel/reload/globalpreservation, Settingssave/discard/reload and onboardingdecimalsetup persistence pass. Earlier newtestobserver/setup failures retained and corrected, not accepted as bug proof; no legacy assertion/budget/retry loosened. Two intervening Vite startup failures traced to an old renamed QA dependencyjunction exposing re2demoHTML; onlytask-createdjunction archivedoutsideapp, unchangedcandidate thenpasses. Actualtrace/archive/negative/greenreceipts inG11 folder.

`npm run check` completed with npm exit0: frontend lint,232 unit tests, both builds and125 mocked Functions tests. Its capture wrapper's later flag assertion was overstrict for intentional mock/guard/CSP fixtures; raw error and qualification are retained without a command replay. Functions lint still selects zero source files. Public18 passes after correcting only the local launcher's dummy Auth domain; the first mobile CSP failures are retained. Built-app smoke4 passes. Future gate snapshots cover145 inputs; earlier123-file snapshots remain explicitly scoped.

Final isolated full command PASS167/0FAIL+infra4, exit0/default2workers, all6G11PASS. Startup subset5 also passes. Both244-file tracked maps,145 runtime inputs and original E2E prefix remain exact; Node22/viomacro/AIunset/no import,891 locked versions/81 optional platform absences, valid private cache paths and unchanged primary cache metadata independently audited. Cache isolation changes only ignored QA setup, not App/config/tests/dependency versions or assertion/budget/retry. Earlier165/2,163/4 and interrupted19/3 attempts remain recorded as failed/incomplete; no baseline waiver or sole-cause attribution. Main startup5 passes but its install has six transitive mismatches, fully qualified. All author commands now pass; fixed actual Chrome/core-four/data, current-head CI and both fresh reviews remain. VM061/G27, VM062/G28 and VM063/G29 are separate follow-ups. Exact scope/paths in the G11 log and isolated-emulator-audit.json.

Chrome recovery remains tool-blocked after the fresh Terra preflight and the parent's bounded native/browser alternatives (2026-10-30UTC/29local). Chrome inventory works but exposes no QA tab; the single new blank QA tab cannot bind because CDP focus emulation times out, and direct navigation also times out. Native window discovery fails initial/retry/fresh-session calls. No fixed-page DOM, screenshot, product action or formal review is claimed; underlying cause remains unproven. Fresh backend health verifies145 unchanged inputs, viomacro/AIpaused/no Functions. Passing suites are not replayed. Screened evidence: `g11/fixed-chrome-source1/root-reconnect-20261030/connection-preflight.json`. NEW CURRENT23-file after-fixed-preflight export plus retained original are hash/metadata verified before owned service interruption; final9 ports closed, five known PIDs absent,145 inputs/final E2E/legacy prefix exact. The initial surviving owned JVM and guarded stop are explicitly recorded. Export CLI's final EPERM rename is qualified, not a successful CLI exit. Manual Codex restart/reconnect is the next tooling recovery step; G11 remains uncommitted/unpushed, with no PR or closure.

G11 reconnect update (2026-10-30UTC): fresh Chrome tab959673556 now returns actual/auth URL/title/live content and a native1920x911 screenshot; paired evidence `g11/fixed-chrome-source1/reconnected-20261030/connection-auth.*`. Old tab528 remains unattached; no underlying-cause claim. This supersedes the connection blocker only, not the pending fixed-label/core-page verification. New fixed-reconnect runtime restores the verified23-file partial export;145 unchanged inputs, viomacro/actualAIfalse/no Functions verified in runtime-fixed-reconnect-health.json. No green suite replay, login or product write in this connection preflight.

The author Captain cannot claim parent-owned556 across sessions; the refusal is honored. Parent normal close fails/unverified and stops all input. Exactly one Captain-owned tab959673563 now independently passes actual/auth state+native screenshot preflight and begins scoped1440/390 QA. No formal verdict or full fixed-page pass yet; report/evidence under `g11/fixed-chrome-source1/recovered-captain/`. Root alone owns current-data export and service shutdown.

G11 author pass remains PARTIAL:13 desktop native/data results established, phone2controls partial/remaining11 unverified, at least3 lagging JPEGs and truncated29-event diagnostics. Parent verifies108 artifacts/45JPEG magic/145 unchanged inputs and NEW23-file partial export before ACK. No full Chrome pass or merge. Read-only manifest attributes the extension exception to Capital One Shopping0.1.1399 only. Native window access now works: QA Chrome was minimized; supported activation restores fresh native screenshot/AX. Old556 debugger remains unattached. No setting/extension changed and no claim that minimization explains every failure. A bounded continuation in one fresh owned tab with Chrome visible is next; complete notes/data are retained.

## 2026-10-29 G10 merged — VM042 closed

[PR20](https://github.com/sararh95/VioMacro/pull/20) merge5b97627d7ed7b4e264c834eb8457490ad9353f0c is verified onmain with exact reviewed6be1019 tree/two parents/ancestry. CI40830321630green and actual fresh [R1APPROVE6490664898](https://github.com/sararh95/VioMacro/pull/20#issuecomment-6490664898)/[R2APPROVE6500724898](https://github.com/sararh95/VioMacro/pull/20#issuecomment-6500724898), own negative/restoredtests/check/Chrome1440+390/core4/reloads/data proof pass. Authorcheck232/125/public18/fresh161+infra4/built4 unchanged; no postreviewrerun/loosening. Parent223file/46JPEG/41activeUI/146union Git-current proof audited; excluded641px capture and diagnostic/source-parity limits retained. Current23-file export+original verified after qualifiedCLI EPERMfinalrename, then normal signout/authnull/onlyownQAclose/LEASEFREE and rootownedservicesoff/directTCP9closed/PIDsgone. BothG10refsremoved afterbundlebackup; maintenancecleanmainFF, twooccupiedlegacyexceptions preserved. New existing-mainP2 VM057draftpreview/G25 and VM058lint0coverage/G26 loggedseparately. No deploy/provider/production/rules/schema change; finalwholeloop main/everypage certification pending.

## 2026-10-28 G10 VM042 — author verification complete

2026-10-29 resumed on unchangedPR20head6be1019/CIgreen. Actual R1APPROVE6490664898 and independent parent135-map/source-negative/restored-log proof audit complete; corrected canonical local log copy matches actual API (initial encoding receipt retained/superseded). Fresh R2 OWN check PASS232frontend/125Functions/lint-build;137before/after +143during/after maps exact. Its initial wrong-project runner attempt is invalid setup, partial logs preserved, no App/test/config/assertion change. Functions lint still selects zero source. Root restored verified pre-R2 snapshot and released strict5173/viomacro/AIpaused/AuthFirestoreStorage runtime to soleR2Chrome; fresh desktop390/data/reload review and verdict pending. NEWcurrentexport required before cleanup because own R2 fixtures now live; no merge/closure claim.

2026-10-29 exacthead6be1019 [CI40830321630](https://github.com/sararh95/VioMacro/actions/runs/40830321630) attempt1 SUCCESS/bothjobs22steps:232frontend/125Functions/public18/infra4/fresh161/built4, no failed/skipped/flaky/retry markers. Screenedlogs/identity/metadata g10/ci-6be1019; root syntheticmerge-parent/tree equality separately verified. Fresh restricted R1 correctness now owns independent scratch sensitivity proof; R2 pending its APPROVE. No source/test/config change; no merge or closure claim.

[PR20](https://github.com/sararh95/VioMacro/pull/20) opened and attached from normal push55498cdbc5e229299e8fd669bcc60338740ac794. VM042 Fix in PR. Explicit nine-path staged/current binding and independent precommit scope audit pass;143frozen inputs/originalE2E/assertions exact. PR-link docs change no App/test/config bytes; current-head CI and fresh sequential R1/R2 remain pending.

Actual Chrome1440x1000/390x844 passes native admitted-image failure fallback and recovery across all six mounted shared readers, all three Picker origins/local GapSolver, fetched/synthesized Planner detail, eleven independent CSS panels and same-form URL/A-B-A/current-title-macro/blank/blocked controls. Dashboard/Planner/Recipes/Grocery controls and reloads pass. Zero intentional saved UI writes; full own SDK canonical payload unchanged before/after/original (five recipes/one plan/three assets). Root verified final opaque snapshot hash and all143 candidate inputs. Evidence: `_local/qa/fix-loop-2026-10-22/g10/fixed-chrome-attempt2/report.md` +213-file manifest/39nativePNGs; independent `g10/parent-fixed-chrome-proof-audit.md/json` verifies file hashes,39decodes/1270CRCs, source/E2E/prefixes, diagnostic and cleanup consistency. Standalone RecipeCard remains source-only.

Retain qualifications: eight final console-only route windows complete; phone Recipes/Plan each have two favicon404 errors (VM041/G23). Separate complete desktop Plan failure window records three local-load timeouts and Retry Saved Data (VM035/G16), followed by normal Retry recovery of all11panels. Network recording was off during the failure; no fresh main runtime comparison or timing/root-cause claim. Earlier broad truncated windows, unattributed canceled Fetches, zero-event samples and partial phone captures remain recorded. No globally clean-console/network claim.

Actual commands all exit0 on unchanged143inputs: npmcheck232frontend/125Functions, public18/18, fresh161/161+infra4/4, built4/4. Node22/dummyviomacro/AIunset/no private gate import. Existing Functions lint selects no source. Earlier launcher/domain failures and ADC collector false-positive remain separately retained; no assertion/retry/budget change and no completed-suite replay for recovery. NEW CURRENT17-file `_local/firebase/exports/firebase-export-g10-after-fixed-2026-10-28` verified with original retained despite qualified CLI final-rename EPERM. Only then normal signout/authnull/viewportreset/diagnosticsoff/ownQAclose/LEASEFREE and root owned-runtime shutdown; eight ports free/recordedPIDs gone. CI and fresh sequential reviews/merge still pending.

## 2026-10-28 G10 recovery — gates passed, Chrome restored, fixed QA in progress

After Sara's iCloud-off/original-QA-reload report, root143 rehash/runtime/HTTP200/no5001 checks passed without tests/restart/restore. Same959672731 firstfreshDOM read succeeded, normal synthetic login reached Dashboard, then actual Library/detail/cooking/form interactions worked; recovery-guard-gone.json and three earlier denial receipts retained. This verifies Chrome-extension control recovery, not the separate native Windows fallback. User-disabled iCloud restoration remains pending after overall QA. SettledLibrary1440x1000 PNG/JSON show five fixtures/four fallback controls and decoded healthy32px image; root viewed actual Library pixels. Initialempty image capture excluded/preserved. Full desktop/390/data/diagnostics/NEWcurrentexport/cleanup/PR/CI/reviews pending; no G10closure or newsourceattempt.

Chrome cause narrowed to live iCloud Passwords completion DOCUMENT inside local QA, matching public-package iframe retention and Chromium cross-extension denial; no remedy A/B yet. Authorized repair attempt opened a temporary tab and typed the exact iCloud extension-details URL. Native Return was refused by URL-confidence policy, ending input for the turn before any confirmed details navigation/toggle. OriginalQA959672731 retained, temporary address prepared; manual Enter/iCloud-only-off/original-QA-reload requested. No setting change, source/test edit, fixture reset, test rerun or Git action by root. All prior passing gates remain valid; Chrome QA/PR/CI/fresh reviews still pending.

Nextturnuserconfirmedvisible; root143/17/runtime reverified/no tests. SamecaptainDOMguardpersisted. NativeownQA screenshot confirmscorrect5173auth/no visiblepopup; installedsource mapscross-extensionURLaccessdenial togenericpopupmessage. NormalAppblur unsuccessful; nativeordinaryReload then refusedbyComputerUse currentURLconfidencepolicy, explicitlyendedinputforthisturn. No reload/authoutcomeclaimed, no moreUI/settingsbypass. Same959672731handoff/runtime78087+64846/latest17backupretained. Blockers2/3 andsourcequalification ing10/chrome-guard-diagnostic-20261028.md. FixedQA/PR/CI/freshreviews/merge remainpending; nextmanualnormalreload/newturn, completedgatesnorerun.

ActualfixedChrome blocked beforelogin by another-extension-UI guard on singleowned959672731/G10fixedQA/5173auth. PreUI SDKbaseline exactoriginal077fac...5992d,5recipes/1plan/3assets/143sourceexact; credentialsfilled/clicktimeout/authUNKNOWN. RootrestoredminimizedChrome but nativeindexedselection failedcoordinategeometry; keyboardsearchdidnotselectQA; allinputhalted/no settingsbypass. Oneasyncmanualexisting-tabfocus requestpending, no newAppbug/attempt. Samecaptain/tabhandoffretained; no fixedQApass/closure.

NEWcurrent17-file after-fixed-start-blocker export +originalfirebase-export-179324954206003LxLr independentlyrehash/metadata/sourceorder/owned78087EPERMfinalrename qualified in g10preservationreceipts. LatestRESTORABLE now `_local/firebase/exports/firebase-export-g10-after-fixed-start-blocker-2026-10-28`; olderunfixedsnapshot historical. Runtime78087/64846active; cleanupNOTauthorized beforecompletedQA/newcurrentpreservation. No completedtestsrerun/Gitmutations.

Built actualnpm+collector0/4PASS/1worker/143exact/all9portsfree, directnonfiledirectory-XDG telemetry0→1, independentlyaudited g10/parent-built-emulator-audit.md/json. Previewexittrace remainsqualified. Aggregatecurrentcandidate: check232/125/public18/fresh161+infra4/built4, nofailed/skipped/flaky/retry tests. Rootarchivednewdebug, reverifiedoriginal+backup17manualfiles/143sourceinputs and restoredlatestG10after-unfixed-recovery dataset. Manualemulators78087/Vite64846 readystrict5173/projectviomacro/AIunset/noFunctions/HTTPauth200; g10/fixed-runtime-inputs.json and fixed-runtime-health.json. Samecaptainreleased actualfixedChrome1440/390/ownexistingfixtures, noSDKseed/reset/overwrite. NEWcurrentexportrequired beforeteardown. Chrome/PR/CI/freshreviews/merge pending; VM042stillOpen.

Fresh full gate now COMPLETE: actual npmtest:e2e:emulator exit0/infra4+161PASS/0failure-skip-flaky-retry,143beforeaftercurrent exact, embeddedHTML161expected/2workers/oneresultpertest, required8portsfree. Own ignoredcollector exit1 is a retained ADCdirectoryemptiness falsepositive after CLIcreatesconfigstore; actualnpm/tests0, no rerun or assertion/source/config/securitywrapper change. Exacthistoricalguardpath/shelllinkage is source/timinginference; metadata confirmsnonfiledirectory/sole-newdir byUTCticks, credential/configJSONcontentsunread. Rawstderr/Viteexittrace limits retained in g10/parent-full-emulator-audit.md. Root archived22priorbuilt/debugfiles and released supported4174builtgate, actuallystarted04:40:00.961Z; otherClaude4173untouched. FixedactualChrome/PR/CI/freshreviews/merge stillpending.

Fresh emulator gate started04:08:17.630Z: mandatoryinfra4PASS; full161tests running on freshviomacro/noimport/AIpaused/unchanged2workers, exact143before/preflight. ActualChrome inventory-only preflight succeeds, fixedQA captain prepared but no tab/UI/SDK actions before rootREADY. Independent read-only saved-gate audit confirms check/public counts and rawhashes/current143files; missing preview exittrace events limit shutdown claims to immediate freeport receipt. Full proof/qualifications in g10/parent-recovered-gate-audit.md. No completed suites replayed.

Recovered actual artifacts after the Codex error without replaying completed tests. `_local/qa/fix-loop-2026-10-22/g10/gates/check-attempt2/` has `npm run check` exit0:232 frontend/125 Functions passed, pinnedNode22.23.4, all143 candidate inputs unchanged. Nine intentional refusal-fixture exit1 processes are qualified in its report; Functions lint selects no source files. Initial preload launcher failure ran no npm command.

`gates/public-attempt2/` has `npm run test:e2e` exit0:18/18 passed, no failures/skips/flaky/retry markers. Prior9mobile CSP failures came from the runner's localhost auth domain with emulators off; corrected only to unchangedCI/G9 dummy `demo-viomacro.firebaseapp.com`, preserving CSP/tests/source/config. Both raw attempts retained. Existing Browserslist/color advisories remain qualified. Root archived generated outputs between commands and one prior debug log before the next fresh-data emulator gate. Current sourceattempt2 remains frozen143; noG10commit/push/PR. Separate Claude-owned4173Vite left untouched. Fresh and built emulator gates, fixed actualChrome1440/390, CI and fresh sequential reviews remain pending; VM042 remains Open.

## 2026-10-28 G10 VM042 — focused RED/GREEN complete, full gates pending

Sourceattempt2: keyedsharedRecipeImage localfailurestate/nativeimgonError/separateCSSprobe/handlercleanup, twoexistingconsumers only. Existing URLpolicy/data/healthyappearance preserved. Meaningfulfirstslice Library/CSS1440/390 RED4 on unchangedApp followsnative200PNG/healthy32/saveddata prerequisites; firstmissing-browser setupfailure retainedseparately. OriginalE2E285801bytes/acceptedRED299770prefixes exact. Total12newG10cases plusnormalReactG9unitinvocationadapter withall8case/helper/assertiontail bytes exact; scratch8PASS→oldrawsemicolonobject6regexFAIL/2PASS→restore8PASS/canonical8PASS, format-onlyheadercorrection8PASS. Source1 focusedimageunits38PASS/ESLint3files0; Source2corrects CSSbackgroundshorthand cover-center reset usingbackgroundImage/filter, ESLintMealPlanner0; newfixturetwo104→99literal mistakes proven99bytePNG/IHDR32/SHAf9e155... correctedonly. No assertion/timebudget/retry loosened.

SecondactualfocusedGREEN mandatoryinfra4PASS/all12G10PASS/0failure-skip-flaky-retry on143frozeninputs/newhelperincluded, currentE2E315947SHA5aebf9e40806cf37aa3921013d945281da29e152b4de32a9fcd0386495e69d5e. Bothwidths coverallmountedreaders/formnewURL/exactA-B-A/currentprops/actualCSSswap/data. HeldobsoleteHTTPfinished/currentBhealthy;0observedobsoleteDOMerror so no stronger nativecallbackdeliveryclaim.30verifiedJSONattachments/resourceErrors0; normalshutdown9portsfree. Fullproof `_local/qa/fix-loop-2026-10-22/g10/test-author/second-green-attempt-20261028/`; failedsetup/firstGREEN and classificationsretained. RootCHECKphaseonlyinprogressafterarchivinggenerateddist/functions/lib; fullpublic/freshemulator/built/fixedChrome/PR/CI/freshreviews/mergepending. VM042remainsOpen, newexistinginfraleak VM056assignedG24notfixedhere.

## 2026-10-28 G10 VM042 — fresh unfixed Chrome complete

ActualChrome1440x1000/390x844 reproduces shared admitted200/image-png invalid-byte failure/nativecomplete+zerowidth+decodeEncodingError with no fallback, sixmountedcallers/allpickerorigins/localgaps/Planner fetched+synthesized. IndependentCSS11panels preservebadURL/noinitialgradient; separateImageprobe clearly distinguished fromCSSdiv. Healthy32px, absent/blockedG9fallbacks and same-form replacementURLrecovery controls preserved. Read-only/canceledUI and core4reloads leave fullcanonicalownSDKpayload/URLs/assets exactoriginal077fac995d2f85a717e2018c1bdf7012d90d67e5df17a097a2bb936394c5992d.142inputs/sixbaselinecopies exactafterUI/beforetestauthorrelease. Evidence `_local/qa/fix-loop-2026-10-22/g10/unfixed-recovery-c376/`: report/manifest207files,41originalimages with individual magic/dimensions/pixel limits. Root viewed4keyframes. Stale/loadingJPEGs/capturetimeouts/mobileemptyidentityaggregate excluded; finalshortphoneGrocery4eventwindow complete but noNetwork/Log capture/globalcleanclaim. No tests replayed for recovery or Appfix yet.

Root preserved NEWcurrent17-file export with source+backup rehash/3servicemetadata/actualCLI EPERMfinalrename qualification before normalUIcleanup/signout/authnull/reset/diagnosticsoff/ownQAclose/LEASEFREE. Root services82803/63980 stopped,9portsfree. Latestrestore `_local/firebase/exports/firebase-export-g10-after-unfixed-recovery-2026-10-28`; olderafter-unfixed17snapshot nowhistorical. Viteshutdownunconfirmedavailability pretransform observation retained, no current productdefect claim. Regressiontests now inwriteprep; meaningfulRED/fullgates/fixedChrome/PR/CI/freshreviews/merge pending. VM042 stays Open.

## 2026-10-28 G10 browser-access diagnosis — inventory recovered

Both root and same continuation captain now list connected Chrome with no settings change. Installed local code shows the earlier generic Work-settings error can also follow a missing session/executor mapping or other host-access denial; it does not prove the user turned browser access off. Actual cause unconfirmed. Official extension troubleshooting mentions chat-specific connection state. Prior QA tab was absent and manual ports free; root reverified142inputs/latest17-file setup export, archived2owned logs and restored the same local-only dataset (new sessions82803/63980). No app/test change or completed-suite rerun; G10 unfixed reproduction remains pending. Root owns runtime/export, captain reuses fixtures and may replace only the absent QA tab after readiness. Details/official links/source anchors/limits/change report in `_local/qa/fix-loop-2026-10-22/g10/browser-access-diagnosis-20261028.md`. Earlier disabled-setting request is superseded; no user toggle is needed based on current successful inventories.

## 2026-10-28 G10 continuation — browser access disabled

Checkpoint165 and current Git agree on G10 branch `codex/fix-g10-image-recovery`, headc3768e05. No completed suite was rerun. Root independently reverified142 recorded source/test/config inputs and17 files in the latest G10 setup export; archived one owned debug log before restoring the local-only Auth/Firestore/Storage runtime (Node22, dummyviomacro, actualAI flagsunset, noFunctions). Emulators85020/Vite33980 reached ready; loopback5173/8085/9099/9199 listeners verified. Actual Chrome inventory returned `Browsers: Error: Local browser use is disabled in Work settings`. No tab binding, UI/SDK action, screenshot or new reproduction; current existing QA URL/auth remain unknown. VM042 remains Open and G10 has no App/new-test edit/commit/push/PR. Native/headless workaround was not attempted. User was asked to enable local browser use; same continuation captain can resume existing fixtures afterward. Evidence: `_local/qa/fix-loop-2026-10-22/g10/resume-preparation-20261028.json` and `unfixed-resume-c376/report.md`/manifest. Runtime is retained for that manual setting change; preserve current live data before any later stop/reset.

## 2026-10-27 G4 merged — nine bugs closed

[PR14](https://github.com/sararh95/VioMacro/pull/14) merge4f760fc936b4e5edb534227439eea3d132e96776 closes VM013/014/023/024/025/036/038/039/043 plus native plan-save alert. [Reviewer1 APPROVE](https://github.com/sararh95/VioMacro/pull/14#issuecomment-6431949181), [Reviewer2 APPROVE](https://github.com/sararh95/VioMacro/pull/14#issuecomment-6432442196), current-head CI SUCCESS/CLEAN, parent desktop390 and independent24-image/data/owner/console Chrome verification pass. Merge tree equals exact revieweda9607a4, ancestry and branch deletion verified. R1 source-only negative25intendedFAIL/2controls then restored27PASS/48pureunits; R2 own check167/116PASS0skips and117-file manifest unchanged. Parent independently inspected key screenshots and verified posted bodies, data/image/provenance/owner artifacts. Required check167/116/lint/build and public18PASS; full emulator124PASS/4exact authorized main paused-AI exceptions untilG6, all27G4PASS. Existing Functions lint selects no source files; no all-green emulator claim.

Evidence `_local/qa/fix-loop-2026-10-22/g4/`: parent58acceptedimages, both fresh reviewer folders, parent reviewer audits and merge receipt. Known favicon404/tooling/intentional errors retained and separated; truncated windows excluded. No source/test change after gates/reviews. No production/deploy/provider/rules/schema/AI availability change. Two existing-main review findings: VM045/P2 Pantry partial-batch copy deferredG12 under BUG004 scope; VM046/P2 strategy-toolbar outer scroll OpenG13. Both actual verdicts copied into running log. Remote onlymain; localmain plus two occupied bundled legacy refs preserved. Final main/all-page certification awaits remaining groups.

## 2026-10-27 G4 PR #14 — parent verification complete, CI/reviews pending

[PR #14](https://github.com/sararh95/VioMacro/pull/14), source commit4c8f002b5be56221059c77d6330a1f6e45089f77. VM013/014/023/024/025/036/038/039/043 and plan-save alert: current source iteration2 is frozen and parent Chrome passes original repros at1440x1000/390x844.58 accepted images with paired DOM/geometry/actual observer/SDK evidence under `_local/qa/fix-loop-2026-10-22/g4/fixed/`;3wrong-size frames retained/excluded. All live named owners, both picker mounts/full+quick check-in, layout/filter/form bounds, real-warning cooking navigation through Library+Planner, blank feedback, valid retry/reload and 1/2/1 Grocery count pass. Failed plan saves leave user/all5collections exact untouched, keep draft and show inline notice without dialog; retry/reload saves. Recipe metadata/decimals/timers survive save. Final SDK keeps original manual Grocery row plus two expected generated rows, user2400/plan2700, original Pantry and160lbs/7h/500ml. Shared page pass includes Dashboard/Plan/Recipes/Grocery/Pantry/Progress/Settings/pausedImport at both sizes.

Eight final bounded core-page console windows are untruncated with no app error/exception/CSP;2known favicon404s VM041 remain. Whole-phase expected two injected save errors and two Grammarly warnings are retained; long-cursor truncation is excluded as complete proof. Signed out, temporary viewport reset, Date restored and DEV hooks consumed/removed. Check167/116/lint/build PASS; public18PASS; full emulator124PASS/4exact authorized main paused-AI failures, all27G4PASS/no skips. Source/test hashes still equal those gate inputs. No automated tests replayed for recovery. PR/CI/fresh sequential R1+R2/merge remain required; no G4 closure yet.

## 2026-10-26 G4 automated gates complete — fixed Chrome pending

Latest `npm run check` PASS167frontend/116mockedFunctions/lint/build; public E2E PASS18/18; final full emulator run124PASS/4exact authorized main paused-AI failures (128executed,16.1m,exit1). All27G4/allG1G2/all8G3 pass, zero skips. The extra Next-selector failures from the preceding run are fixed with narrower selectors and all original assertions retained. `g4/final-gates-proof.json` verifies exact baseline failure set/log hash, latest check/emulator source-test byte equality, unchanged relevant public inputs and preserved export hashes. Do not describe emulator as all green; G6 must repair those four tests. Existing Functions lint coverage limitation remains.

Preserved current G4 local data restored with explicit projectviomacro, dummy config, both AI flags unset and no Functions emulator. Authenticated user and all5collections exactly match the canonical pre-verification fixture; `g4/restoration-proof.json`/`sdk-restored-before-fixed-chrome.json`. Current plan has21legacy false eaten flags which existing AUD022 canonicalizes on intentional save; retain semantic/field evidence. No production access/deploy/provider call or source/test change after completed gates. Fixed desktop/390 Chrome, CI and both fresh independent reviews remain pending; bugs stay open until their PR merges.

## 2026-10-26 G4 candidate — automated verification in progress

Computer Use recovered on Sara's next authorized turn. The original native alert is gone, its once-only hook is consumed, and the unsaved2500 target remained visible without retrying save. Authenticated user/all5collection snapshots exactly match the canonical baseline (saved2400). Retained17 original groups plus10additional phone images complete the baseline caller/blank-input lane; no completed G3 work was replayed. Evidence: `g4/recovery-proof.json`, `remaining-original-repros.json` and `unfixed/` under `_local/qa/fix-loop-2026-10-22/`.

G4 source iteration2 covers VM013/014/023/024/025/036/038/039/043 and the native plan-save alert. Intended failure-first evidence is retained: unchanged-source27cases produced25fail/2datecontrolsPASS; test-only fixture/selector corrections then reached every targeted control and preserved all assertions. First source run25PASS/2phonewarningFAIL exposed0.25px remaining warning overlap; the one-pixel inset correction leaves the real Auth warning visible and passes all4Library/Planner desktop/phone cooking cases. With the23unchanged passing cases, current focused coverage27/27PASS. No timer initialization, AI runtime, auth/rules/schema or Coming Soon feature change.

Latest `npm run check` PASS after all current selector migrations:167frontend/116mockedFunctions, lint and builds, source/testfreeze and zero skips. Existing configured Functions lint selects no source files; it does not establish source lint coverage. `npm run test:e2e` PASS18/18 (21.4s test phase); app/config/publicspec inputs remain unchanged. Full128 emulator run2:121PASS/7FAIL; all27G4/allG1G2/all8G3PASS. Four are exact retained paused-AI main failures; three are G4-caused older loose Next locators also matching the newly named calendar Next month. Those three are not baseline exceptions. All affected onboarding/check-in selectors are now scoped/exact with every original assertion retained; audited all4E2Efiles. Final full128 run remains in progress, with the three corrected cases now passing. Do not claim a complete full gate or all-green emulator result yet.

Runtime is dummy local projectviomacro with both AI flags unset and no Functions emulator; the manually paused Vite avoids the existing config's forced-AI branch. Prior live emulator data was preserved as a verified identical23-file export copy after the confirmed Windows EPERM rename failure, original retained. Full-suite runs use the known stable local test export. Restore the preserved G4 snapshot before parent fixed Chrome verification. Source iteration2, no G4commit/push/PR/reviews/closure yet. Fixed desktop1440/phone390 browser proof, exact final exception comparison, CI and both fresh sequential reviewers remain required. See `docs/qa/fix-loop-2026-10-22.md` and `g4/*-result.json` for the exact receipts.

## 2026-10-26 G4 baseline partial — Computer Use policy stop

On unchanged106303a, fresh local emulator fixtures/paused AI, original Chrome1440/390 evidence confirms blank quick-add silence/Grocery singular copy, controlled-Thursday week label, filter overlap, form tab/name-field clipping, cooking warning overlap, Planner header/macro clipping and multiple ambiguous icon names.17 paired screenshot/state groups plus actual native plan-save alert event retained under `_local/qa/fix-loop-2026-10-22/g4/`; clock override restored and initial blank/Form-cancel SDK comparisons prove all seeded collections unchanged. Full caller/phone matrix remains incomplete; no new automated regression or source fix yet. VM044/P3 new input-label finding assigned G11.

After actual save-failure alert, dismissal/observation timed out. Computer Use then explicitly stopped because it could not determine the Windows browser URL confidently. No further UI/testing/implementation; alert dismissal, post-failure persistence and cleanup remain unverified. Reuse completed evidence on next user-authorized turn, do not retrigger save blindly. Known favicon404 errors retained as VM041; expected injected save error is not a clean-console claim. No G4 closure, PR, commit, push or final certification.

## 2026-10-26 G3 merged — VM022/033 closed

[PR13](https://github.com/sararh95/VioMacro/pull/13) merge `106303adc7c2dad1730446163ac93355fa9b5162` closes VM022/033. Current-head CI SUCCESS; [Reviewer1 APPROVE](https://github.com/sararh95/VioMacro/pull/13#issuecomment-6427561907) and [Reviewer2 APPROVE](https://github.com/sararh95/VioMacro/pull/13#issuecomment-6428801293). Merge tree equals approved5b4225b; ancestry/branch deletion verified, clean main checkout fast-forwarded. Parent check167/116/lint/build and public18PASS; full emulator98PASS/4exact aligned-main paused-AI exceptions90/4, all8newpass. This is not an all-green emulator claim; G6 remains required. Parent28 desktop/phone screenshot+SDK groups retained, R1 independent source-only red/green proof and R2 own check/42 observed images/35 clean bounded windows/SDK reload comparison passed. Two initial wrong-height images retained/excluded, corrected images used; parent inspected settled images. No tests replayed solely for recovery.

VM042/P3 shared permitted-image decode fallback assigned G10; VM043/P3 local warning/control overlap assigned G4. Existing filter/tab/tint issues retain later scope. Receipt/evidence: `_local/qa/fix-loop-2026-10-22/g3/` merge-receipt, reviewer parent audits and exact API comments. No deploy/production/provider/rules/schema/CSP/auth/upload changes, test weakening or history rewrite. Final-main/all-page certification pending after remaining groups.

## 2026-10-26 G3 parent verification complete

VM022/033 candidate: check167frontend/116Functions/lint/build PASS; public18PASS; full emulator98PASS/4exact authorized main paused-AI exceptions. No tests rerun on resumption; source/test hash freeze verified. Desktop1440x1000 and phone390x844 each14 accepted current images, DOM/viewport/probe/SDK pairs; original repros, new/edit recovery, image save/reload, both planner detail paths/cooking, Dashboard water500ml and Grocery check persistence passed. Original legacy recipe/plan exactunchanged. Audits `_local/qa/fix-loop-2026-10-22/g3/chrome-final/{desktop,phone}-audit.json`.

App console exceptions/imageCSP0. Verbose planner event truncation retained and replaced with bounded isolated recheck. Two identical-main favicon404 network entries recorded as VM041/P3/G6 Needs Repro; known G4 layout/copy and G9 tint remain. Signedout, observers cleared by reload, viewport reset. [PR13](https://github.com/sararh95/VioMacro/pull/13) subsequently merged; see the closure and independent review receipts above.

## 2026-10-26 G3 image repair — gates in progress

VM022/033 reproduced on unfixed b697594 at1440/390 with paired DOM/browser helper/CSP/screenshot proof. Same new helper/render tests:25FAIL before fix,30/30PASS after. Eight emulator tests have intended red proof; focused verification has six earlier passes plus corrected two-case pass, with full final-byte run pending. My new-form null-macros regression was caught and fixed; LF test-input normalization corrected with stronger exact-value assertions and unchanged behavior expectations. Failed artifacts retained, no existing test weakened.

`npm run check` PASS167frontend/116Functions,lint/build; `npm run test:e2e` PASS18/18. Source/test hashes unchanged during gates. Full102test emulator run finished98PASS/4FAIL, all8G3cases PASS. The four exact paused-AI failures match the90PASS/4FAIL corrected main baseline;91baseline file hashes match b697594 Git blobs. Authorized G6 exception, not an all-green emulator claim. Actualviomacro/dummy/AIpaused namespace verified. Windows export-rename lock recovered by verified19file copy; original retained and manual emulators shut down cleanly. Evidence `_local/qa/fix-loop-2026-10-22/g3/`; details running log G3. Chrome desktop14screenshots/cleanboundedconsole/SDK/reload PASS; phoneunfinished because physical Escape stopped Computer Use during foreground recovery. First phone DOM JSON has no accepted screenshot. Completed checks must be reused on resume. No PR/review/merge closure claim. New pre-existing P3 tint issue VM040 assigned finalG9; current source scope remains image policy/callers, no rules/schema/CSP/upload changes.

## 2026-10-26 G2 merged with completed saved proof

[PR12](https://github.com/sararh95/VioMacro/pull/12) merge `b6975942fbfb8c7f9b838496d75c3e17cc83a5ac` closes VM002/015/016. Both latest current-head reviewers APPROVE; CI green, no conflicts/protection bypass. Parent assessed accepted saved screenshots and exact API verdicts. Reused completed check137/116/public18PASS and emulator90pass/4exact main paused-AI exceptions; no test/browser rerun. Merge main source/tests equal approved37f700c; merge ancestry and remote/local branch deletion verified, clean main checkout normally fast-forwarded. VM039/P2 remains G4. Receipt `_local/qa/fix-loop-2026-10-22/g2/merge-receipt-2026-10-26.json`. No deploy/production/provider/rules/schema/history rewrite. G3 begins from this main; final all-group green certification remains pending.


## 2026-10-26 G2 completed review — saved gates reused

[PR12](https://github.com/sararh95/VioMacro/pull/12) head37f700c has both exact-head reviewers APPROVE and current CI SUCCESS/CLEAN/MERGEABLE. [Reviewer2](https://github.com/sararh95/VioMacro/pull/12#issuecomment-6410082457) independently passed check137/116, all15 authenticated persistence/native-label assertions and14 individually inspected current images across1440/390 forms and Dashboard/Plan/Recipes/Grocery. Supported one-PNG upload used only a mocked localhost parser; imported default4/cookTime0/decimals/source/assets survive save/reload. Final bounded app console is clean, including isolated nontruncated Planner recheck. Earlier failures/stale frames are preserved and excluded from final proof. Signed out, viewport reset and interception cleared.

Parent verified live published bodies and saved final images. Reused completed parent check137/116/public18PASS and emulator90pass/4exact known-main paused-AI exceptions authorized untilG6; no test or browser journey repeated after recovery. No app/test changes or new fix attempt. VM039/P2 mobile ingredient-name row crowding logged for G4; main attribution is source-backed, no separate main runtime control claimed. Merge/closure pending guarded command and main ancestry receipt. Evidence `_local/qa/fix-loop-2026-10-22/g2/premerge-2026-10-26.json` and `reviewer2-37f700c/{review-report.md,verified-image-audit.json,snapshot-verification.json,final-console-summary.json,final-mobile-plan-console-recheck.json}`.


## 2026-10-25 G2 supported mocked import verified

After Sara enabled the required Chrome setting, the same Reviewer2 used the supported chooser API on active QA178/Chrome2 to upload its validated99-byte synthetic PNG. Scoped localhost-only OPTIONS/POST mock, no Functions/provider. Draft at1440/390 preserves cookTime0, default4 servings and exact decimal nutrition; Ingredients save/reload and authenticated persisted imported-source/asset/instruction values pass. Parent independently compared mock and SDK document (`g2/parent-r2-import-proof.py/.json`) and visually inspected both matching verified-import screenshots/provenance. Earlier stale frames remain excluded; final page/form visual/console recertification is still pending. No R2 verdict/comment or merge, source/tests/head37f700c unchanged.


## 2026-10-25 G2 upload setting handoff and visual-proof correction

PR12 remains open at37f700c, CI green, Reviewer1 approved and Reviewer2 pending. Ten independent data/label assertions pass, but foreground-mobile-recipes.png still shows an earlier Dashboard/navigation-drawer frame and is explicitly excluded as Recipes proof. Reviewer is preserving stale frames and will verify target provenance and inspect matching replacements. Final visual/console gate remains incomplete.

No human file drop occurred; Sara requested the agent perform upload. Exact chooser denials and prescribed Chrome setup are recorded in `g2/reviewer2-37f700c/upload-capability-denials.md`. Agent upload requires the user-only Allow access to file URLs setting; no permission change or alternate denied-path workaround was performed. Reviewer has paused Chrome UI for that setup, preserving active QA178/original171 and local mock. After readiness it must arm the mock on the correct tab, complete one synthetic-file import/save/reload and final stable visual/console checks before its verdict. No source/test change, new attempt or merge.


## 2026-10-25 G2 independent Chrome review — partial, manual handoff pending

Chrome reconnected and the same Reviewer2 resumed on PR12 head37f700c. All ten independent snapshot assertions passed at1440/390: no-change document equality apart fromupdatedAt, intended text/numeric edits, zero/decimal values, creation, native labels, timers120/45.5, nested metadata and an absent optional timer. Parent separately verified the authenticated snapshots with `_local/qa/fix-loop-2026-10-22/g2/parent-r2-sdk-proof.py` and saved `parent-r2-sdk-proof.json`. Phone plan, Grocery and Dashboard persistence also have SDK evidence.

Desktop navigation temporarily timed out with backend-unreachable logs while the QA tab was inactive. The failure is retained in `g2/reviewer2-37f700c/desktop-plan-auth-wait-logs.json`; Retry Saved Data restored the plan and Grocery loaded. Final foreground visual/clean-console recertification remains pending. This is not claimed as a reproduced main failure or a completed browser gate.

Manual import handoff is ready on the existing `/recipes/import` QA tab. Extension file access denied setFiles, and disabling chooser interception was also denied; no guard bypass or permission change. Sara must manually drop the single existing synthetic PNG, after which the reviewer can fulfill its localhost-only mocked parser and finish import/save/reload plus final desktop checks. Handoff path/patterns/cursor: `g2/reviewer2-37f700c/manual-upload-handoff.json`. No Functions emulator, provider, production data or live AI call. PR12 remains open, CI green and Reviewer1 APPROVE; Reviewer2 has no final verdict/comment. No application/test changes or new fix attempt.

## 2026-10-25 G2 independent review interruption recovery

PR12 exact head37f700c remains open/ready, current CI SUCCESS and Reviewer1 APPROVE. Reviewer2 independently passed full check137frontend/116Functions and captured partial authenticated desktop Dashboard/Recipes evidence, but has no final verdict. After interruption, both reviewer and parent found Chrome disconnected; parent inventory lists only in-app Browser and MCPApps. Required Chrome desktop390/round-trip/reload/four-page/console review remains pending user reconnection. No alternative browser substituted, no merge or independent Chrome-pass claim.

Parent restored stopped Vite/Auth/Firestore/Storage using unchanged local-only launcher:5173/9099/8085/9199 ready, projectviomacro/dummykey, both AI flagsunset/noFunctions. Served constants and port receipt: `_local/qa/fix-loop-2026-10-22/g2/runtime-resume-receipt.json`. No app/test/config changes or new fix attempt. Parent's previously completed Chrome proof and automated gates remain recorded separately; partial reviewer proof is not a substitute for its remaining checks.


## 2026-10-25 G2 Chrome recovery and parent pass

Original browser-control blocker cleared; resetting the long-lived automation JS session cured its long stalls. No Chrome profile/extension/security/network settings changed. Parent1440/390 Chrome repeats recipe no-change/edited-step/numeric/create/label/reload checks; SDK full-field comparison passes including timers, embedding, assets and nested metadata. Dashboard/Planner/Recipes/Grocery plus import surface checked at both widths. All33 document-width records fit, recorded controls natively labelled/valid, final error/warn console empty. One existing phone tab-count clipping is VM-038/P3/G4, proven by actual unfixed-main and current screenshots. Viewport reset, signed out, own tabs closed. Proof `_local/qa/fix-loop-2026-10-22/g2/final-chrome-proof.json` and `final-chrome/`. Check/public/full automated results unchanged; current CI2df314f green; fresh sequential reviews pending. No merge/closure yet.


G2 continuation: source commit7f04184 pushed normally; draft [PR12](https://github.com/sararh95/VioMacro/pull/12) preserves the tested VM-002/015/016 fix. Current CI pending; final Chrome blocked by Windows URL-confidence control stop; both fresh reviews pending. No merge/closure or final Chrome-pass claim.

## 2026-10-25 G2 final Chrome blocked

Final automated gates: check137/116 and public18 pass; full emulator90pass/4fail exactly matches the proven-main paused-AI exception. Ten new regressions pass, source/tests unchanged. Final parent Chrome is **pending**: extension obstruction persisted after dismissal, then the Windows browser helper ended Computer Use because it could not verify the active Chrome URL confidently. No UI input after that stop. Own signed-out QA tab959671359 is marked for handoff; paused local services and synthetic final-before fixture remain ready. Draft PR preservation is not a merge/closure or Chrome-pass claim. Resume parent desktop390/reload/SDK proof, current CI, then both fresh sequential reviews.


## 2026-10-25 G2 full verification after import correction

Check **PASS** (137 frontend / 116 Functions, lint/build); public E2E **18/18 PASS**; full emulator **90 passed / 4 failed**, 12.4m, exit 1. The only failures exactly equal the corrected main paused-AI baseline; comparison has no added/missing failed titles. All ten G2 cases, existing import save and unchanged onboarding/filter cases pass. Earlier 86/6 and 89/5 runs are retained, not reclassified as main failures. Evidence: `_local/qa/fix-loop-2026-10-22/g2/{gates-attempt2,full-emulator-3,emulator-comparison.json}`. Source/test hashes stayed frozen. Parent Chrome, CI and fresh reviews pending; no merge/closure claim.


## 2026-10-25 G2 attempt 2 — imported draft compatibility

VM-002/016/015: ten actual UI regressions now pass at 1440px and 390px after proven-red assertions. Existing onboarding and parsed-image import tests pass unchanged. First full run is retained at 86 passed / 6 failed and is not accepted as the final gate: four known-main paused-AI failures, the corrected zero-servings import regression, and a Dashboard lazy-module timeout. The onboarding trace shows successful auth/settings writes followed by slow module loads; unchanged focused rerun passes. No main runtime reproduction is claimed for that timeout. Full check, public and complete emulator suite are being repeated after the correction. Chrome/CI/reviews pending. Evidence: `_local/qa/fix-loop-2026-10-22/g2/{import-red-2,green-import-3,existing-import-onboarding,full-emulator-1,onboarding-triage,gates-attempt2}/`. No deploy, production data, Functions emulator, live AI, schema/rule change or weakened tests.


## 2026-10-25 G1 merged after fresh safety approval

[PR11](https://github.com/sararh95/VioMacro/pull/11) merge `b2a705d9adb80676e92f84a4cb0439d7118441d2` closes VM-001/006/007/008/011/031. Exact reviewed head1dd3382 is on fetchedmain. [Fresh Reviewer2 APPROVE](https://github.com/sararh95/VioMacro/pull/11#issuecomment-6404102796): independent check137frontend/116Functions, Chrome1440/390 all repros/both cooking paths, real form counts, legacy/structured packages, manual+checked preservation and reload, all24documents unchanged on no-addable refusal, four-page smoke and empty error/warn console. Parent inspected settled fresh screenshots/integrity proof; all80source/testfiles unchanged. CurrentCIgreen, no conflicts, merge commit/exact-head guard/branchdeletion, no protection bypass.

Historical Reviewer1 REQUEST CHANGES remains recorded. Sara's explicit2026-10-25 policy accepted the sole pre-existing edge as new Open/P3 VM-037/G8 and authorized freshReviewer2 directly; no extra G1code attempt. Full emulator80pass/4known-main paused-AI failures retained for G6, no fullgreen claim. G1branch deleted remotely/locally; main worktree cleanlyff to b2a705d. Seven old localrefs deleted after nine verified bundles; two occupied refs skipped. G2 begins from this mergedmain; final all-page certification remains pending.

## 2026-10-25 G1 resumed, no additional code attempt

Sara reclassified the package-placement gap as P3 VM-037, assigned final follow-ups G8, and authorized fresh Reviewer2 directly. New blockers are P0/P1, regressions versus main, or failures to fix claimed IDs; every reviewer finding must state severity and main behavior. Historical Reviewer1 REQUEST CHANGES retained; no claim it was APPROVE. Actual unchanged main/PR generator+persistence comparison reproduces the same checkedfalse/two rows/two cans on both; main source bytes verified. Proof: `_local/qa/fix-loop-2026-10-22/g1/resume-2026-10-25/package-main-comparison.json` and `.log`. No application/test changes after6432916. Fresh Reviewer2/fullcheck/Chrome and new-head CI pending; PR11 remains open until those pass. Nine-branch audit/bundle work complete: all9bundles verified,7unoccupied refs deleted,2occupied refs skipped; exact ancestry/count/hash receipts in resume-2026-10-25/branch-backups.json. Working files untouched.

## 2026-10-23 G1 stopped after final extra attempt

Fresh [Reviewer1](https://github.com/sararh95/VioMacro/pull/11#issuecomment-6366830313) REQUEST CHANGES on6432916: equivalent '(14 oz) can'/'can (14 oz)' have different grocery identities, losing cross-placement checked state and rounding two quarter-can contributions into two whole rows instead of one. Parent actual-generator/service probe confirms assertion failure on unchanged source (attempt-4/parent-confirm-package-identity.log/json). Reviewer source-only negative controls prove existing tests, but the cross-placement interaction is not covered. Restoration proof:56source restored/24tests byte-identical/80author source+tests unchanged. Reviewer2 not run because Reviewer1 did not approve. Sara authorized exactly this extra attempt and instructed stop if unresolved; no more source changes, merge or G2 work.

Requested singular packaged-count case and parent desktop/390 Chrome pass, focused54/54, check137frontend/116Functions, public18/18 and6432916CI pass. Aligned full emulator80pass/4fail equals corrected main78pass/4fail on all four failed titles, with no added failures; earlier28failure classification superseded. Full suite remains red untilG6. G0 PR10 remains the only merged group, both final reviewers APPROVE, mainDD. Stop report and exact reviewer comment copied to fix-loop log. Next requires Sara's decision on another same-PR attempt; PR11 left open/pushed.

## 2026-10-23 G1 extra attempt4 and corrected emulator baseline

Sara authorized one additional same-PR attempt for packaged count units. Unfixed Chrome on0404867 with local app/CLI projectviomacro shows1.25 (14 oz) can after five portions of a four-serving recipe, with matching checked plural-alias row becoming unchecked. Authenticated SDK and settled screenshot/DOM retained under _local/qa/fix-loop-2026-10-22/g1/attempt-4/unfixed-package*; measured Rice3.75cups and manual controls remain. Seven new helper/generator regressions run red49pass/5assertion failures before shared source correction, then54/54pass. Both existing desktop/390 G1 e2e cases expanded with package-size/count/scaled-view/cooking/checked/reload assertions, keeping all prior assertions. Full check passes137frontend/116Functions; public, full emulator, final Chrome/CI/fresh sequential reviewers remain pending. No G1 closure or merge yet.

Environment correction under investigation before any pre-existing-failure claim: prior app/CLI demo-viomacro mismatched most test SDK clients viomacro. The unchanged Playwright config forces AI on if it starts Vite; prior and current allowed runs manually start Vite with both AI flags unset and reuse it. Corrected fresh git-archive a4d0bc7 full81-test baseline is running with CLI/app/SDK matchingviomacro, dummy credentials and Auth/Firestore/Storage only. Served-module/runtime identity saved. Latest-main/candidate comparison required; old28-failure counts must not be used as the corrected baseline. No permanent infrastructure/config/rules changes in G1.

Merged-branch cleanup: G0 remote/local removed after PR10 merge/ancestry and open-PR checks; local merged PR3 branch removed. Exact merged PR1 branch removed only after verified recoverable Git bundle at _codex-trash/2026-10-23/branches/fix--pr7-schema-truth-8de6c21a54ef.bundle. Remote now onlymain/G1. Unknown and occupied local branches preserved for Sara in attempt-4/branch-audit.json. Future merges use --merge --delete-branch and repeat audit.

Aligned extra-attempt results: check137frontend/116Functions and public18/18 pass. Unchanged a4d0bc7 full81tests:76pass/5fail (four paused-AI-control timeouts plus one browser-context teardown timeout). Latest-main dd5f6fb full82tests:78pass/4fail, same four AI-control cases, manual recipe passes. Runtime IDs allviomacro, both AI flags unset, noFunctions; exact failure titles in attempt-4/emulator-comparison.json. Earlier28-failure result is superseded as the corrected baseline. Candidate full84-test run is in progress under identical settings; no passing full-suite/merge claim. Permanent paused-AI/test infrastructure repair remainsG6.

Final attempt4: complete candidate rerun2 has80pass/4fail10.5m, exit1, exactly corrected main DD's four paused-AI failed titles (candidateOnly=[]/mainOnly=[]). G1 expanded desktop/390 cases pass11.2s/11.3s and G0 safety15.4s. First candidate79pass/5fail retained: extra Recipes direct-load failed in global saved-settings timeout guard (VM035), then unchanged full rerun passes that case25.7s; loader/App/userService blobs equal main. No skipped/disabled/loosened tests, worker/timeout/retry changes or AI-on server. This supersedes old28-failure baseline; full suite remains honestly red until G6.

Final Chrome on unchanged source1440x1000/390x844 repeats all original six IDs, actual countable dropdown units and new packaged-can. Recipe4->5->6 shows1/1¼/1½can with unchanged14oz; both cooking entry points retain selected amounts and matching SmartText. Grocery five portions gives16correct totals, including2 (14oz) cans, fractional measured units and whole countables. Checked Rice/Onion/Tomatoes survive aliases. Exact manual and recipe documents plus4quickadd rows survive regenerate/reload; verify-final.py passes. Dashboard/Planner/Recipes/Grocery8width/content probes fit1440/390 and0console errors. Settled final-desktop-cooking.png/final-desktop-reload.png/final-phone-reload.png plus paired DOM/SDKJSON in attempt4. Browser lease released; paused aligned services remain for reviewers. New CI and two fresh sequential reviews required; no G1 closure/merge yet.

## 2026-10-23 G1 stop - third review still requests changes

Fresh [Reviewer1 round3](https://github.com/sararh95/VioMacro/pull/11#issuecomment-6361284970) REQUEST CHANGES on040486765918c23a4fdade5ba58db3eedd5237fb. New P2: four-serving Tomatoes legacy amount '1 (14 oz) can' planned five times persists1.25 instead of final countable total2. Parent independently reran the reviewer actual-generator/persistence-service test, with mocked Firebase I/O only: ERR_ASSERTION1.25vs2, exit1. Evidence: _local/qa/fix-loop-2026-10-22/g1/attempt-3/parent-confirm-singular-can.log and reviewer1-0404867-fresh/can-legacy-probe-restored-head.log. Parent original desktop/390 checks did not exercise this newly discovered case.

Existing final gates remain accurately recorded below: check130frontend/116Functions pass, public18/18 pass, focused47/47 and G1 emulator2/2 pass; full emulator56pass/28fail matches main exactly. Reviewer independently proves base-source18assertion failures/restored47pass, helper-only7assertion failures/restored47pass, and actual Planner caller failure/restored pass, with unchanged tests. This evidence does not close the singular-can gap. CI passed on0404867. Reviewer2 is gated and was not run. PR11 remains open; no G1 closure/merge or final-main certification. Stop under Sara's three-attempt cap; one decision: authorize an additional same-PR attempt with regression, full gates and fresh sequential reviews. G0 PR10 is the only merged loop group. No source/test changes for this stop report.

## 2026-10-23 G1 attempt3 - supported countable units

Fresh Reviewer1 round2 requested changes for the form-supported Unit value bypassing final rounding. Root shared aliases/countable also omitted Large/Medium/Small/Stick from the same dropdown vocabulary. Unfixed Chrome and SDK show3.75 for each countable after5portions of a4-serving recipe, while Rice3.75cups/Garlic4cloves controls are correct. Seven new unit regressions and both updated actual-emulator cases failed before source change. Shared aliases and countability now cover these actual form values, keep sizes distinct, preserve checked aliases and recognize the same units in quick-add. Recipe views keep original/fractional quantities.

Focused47/47 and expanded desktop/390 emulator2/2 pass25.5s. Full check130frontend/116Functions passes; public18/18 passes15.1s. Full84-test emulator completed56pass/28fail12.7m exit1, exactly the main-identical baseline failed-title set (currentOnly=[]/baselineOnly=[]). Final parent Chrome and saved-data verification passed at both widths; CI and both fresh sequential reviewers on the pushed candidate remain required. No G1 closure or merge claim. Evidence under _local/qa/fix-loop-2026-10-22/g1/attempt-3/: unfixed-countables.txt/.png, unfixed-countable-saved.json, red-countable-unit.log/red-countable-e2e.log, green-countable-unit.log/green-countable-e2e.log, full-check.log/public-e2e.log.

Final attempt3 Chrome: original six IDs and both cooking entries pass at1440x1000/390x844. Whole countable totals4 coexist with fractional measured quantities, checked Rice/Onion preserve cup/cups and UNITS/pcs identity, manual controls and all quick-add forms survive reload. Dashboard/Planner/Recipes/Grocery have no new clipping and0console errors; existing G4 findings remain. Settled final-desktop-cooking.png/final-desktop-reload.png/final-phone-reload.png, paired final-*.txt/.json and verify-saved.py in attempt3 retain proof. Exact saved manual document and all totals checked against SDK snapshots. No source changes during final gates, no merge/closure yet.

## 2026-10-22 G1 attempt1 — shared ingredient amounts, PR11

[PR #11](https://github.com/sararh95/VioMacro/pull/11), `codex/fix-g1-ingredient-amounts`, from main `dd5f6fb`. VM-001/006/007/008/011/031 are **Fix in PR**, awaiting full emulator comparison, CI and both fresh reviewers. Sara chose upper range endpoint before grocery serving scaling, countable rounding upward on the final aggregate, and original recipe range wording in views; no schema/rules change.

Before source edits, actual generator/service and React component regressions failed11/27; all16 prior G0 tests passed. After source edits, focused38/38 passed; full `npm.cmd run check` passed121 frontend/116 Functions; public `npm.cmd run test:e2e` passed18/18. Updated G0 emulator regression passed; G1 desktop/390 tests passed2/2 after correcting the new test's account-creation viewport setup. No existing test was skipped/disabled/loosened. G0 quantity expectations now precisely assert G1's intentional recipe-yield scaling.

Parent Codex Chrome at1440x1000 and390x844 repeated all six original repros: legacy Blueberries scales, decimal carry is1.97, structured/legacy cooking quantities agree, original Garlic2-3 stays in recipe views, five planned portions save30oz Chicken/2.5cups Rice/4cloves, eggplant/black pepper get correct aisles, Unicode-half and mixed/simple fractions survive grocery reload. Manual controls, checked Rice and mixed-fraction quick-add persist. Dashboard/Planner/Recipes/Grocery load with root width equal to viewport and no new clipped controls; existing G4 observations remain. Recovered QA tab recorded0 red console errors. Intermittent browser-control timeouts and stale initial screenshots are excluded from pass evidence.

Evidence under `_local/qa/fix-loop-2026-10-22/g1/attempt-1/`: `red-caller-tests.log`, `green-focused.log`, `check.log`, `public-e2e.log`, `emulator-focused*.log`; settled `desktop-carry-fixed-settled.png`, `desktop-chicken-reload.png`, `desktop-fractions-reload.png`, `mobile-legacy-fixed.png`, `mobile-carry-fixed.png`, `mobile-cooking-fixed.png`, `mobile-chicken-fixed.png`, `mobile-fractions-reload.png`; paired DOM and Firestore JSON, page-width JSON, `chrome-console-errors.json`. Full84-test emulator run pending. `main-baseline-identity.txt` proves the prior G0 tested source/tests/config match current main byte-for-byte; prior54pass/28fail baseline retained. No G1 merge/closure or final-main certification claimed.

Final pre-review source `f66b751`: two additional compatibility regressions failed before correcting legacy pinch/dash descriptions and legitimate food families; focused40/40 now pass. Frozen-source full check passed123 frontend/116 Functions, public18/18. Full emulator completed **56pass/28fail,13.3m,exit1**; both new G1 cases passed and the failed-title sets exactly match the main-identical baseline (no added or removed failures). `verified-*.log`, `emulator-baseline-comparison.json`, `main-baseline-identity.txt` retain the proof. Two earlier partial emulator runs were interrupted when pre-review source changed; they are retained without completion claims. Final Chrome compatibility check, CI and both reviewers pending. No G1 closure/merge claim.

After all full commands completed, parent repeated every G1 repro on frozen source at1440x1000/390x844 using a combined synthetic recipe. `frozen-*` DOM/images/SDK JSON show correct base/scaled/cooking labels, range projection, countable rounding, fractional groceries, aisles, checked/manual and quick-add reload, retained qualitative descriptions and Walnuts category. Dashboard/Planner/Recipes/Grocery root widths match viewports; `frozen-console-errors.json` records0errors. One automation click immediately after reload needed a settled-state repeat; one correct manual row saved, without console errors or source changes. Cold-load synchronization remains a VM-035 investigation observation. CI and both independent reviews remain pending.

## 2026-10-22 G1 baseline — range-policy decision pending

Pushed branch `codex/fix-g1-ingredient-amounts`, draft [PR #11](https://github.com/sararh95/VioMacro/pull/11), from merged main `dd5f6fb`. Chrome current-week five-lunch regeneration still shows Chicken120oz/Rice10cups/Garlic10 -3cloves; Eggplant is grouped in Proteins and Black pepper in Produce. DOM, settled desktop PNG and Firestore: `_local/qa/fix-loop-2026-10-22/g1/`. Actual emulator probes reject both a range-valued quantity and an added upper-endpoint field; exact saved rows remain unchanged. No rules/source changes. G1 is stopped before implementation for Sara's range projection/deferral decision under her product-behavior stop rule. VM-006/007/031 and other fraction cases remain open and have not yet been repeated in G1. This is diagnostic evidence, not a fix or a passing G1 gate.

## 2026-10-22 G0 merged — VM-028 closed

[PR #10](https://github.com/sararh95/VioMacro/pull/10), merge `dd5f6fb8019b4227c94bcf2e8be70f1aa124d2e9`, fetched and verified on main. Both fresh reviewers approved exact source head `6e89c4d`: [correctness](https://github.com/sararh95/VioMacro/pull/10#issuecomment-6356284266), [regressions & safety](https://github.com/sararh95/VioMacro/pull/10#issuecomment-6356528512). CI, 99 frontend/116 Functions full check and18/18public smoke passed. Independent desktop1440x1000/phone390x844 Chrome verified empty/invalid/mixed/legacy/read-build-commit failure preservation, checked/manual reload and Dashboard/Planner/Recipes/Grocery. Strongest independent settled screenshots: `_local/qa/reviewer2-round3/desktop-final-grocery.png` and `mobile-legacy-reload.png`. Full emulator54pass/28fail is recorded under Sara's explicit G0 exception; new VM-028 emulator test passed. No deployment or production/live-AI action. G1 planning begins from this main; final-main/all-page certification remains outstanding.

## 2026-10-22 G0 attempt 3 — preserve legacy descriptive amounts

Final requested emulator command result: **54/82 passed, 28 failed, exit 1 in 14.4m**. The new VM-028 emulator regression passed (18.0s). Unchanged fixture project mismatch (VM-026) and paused-AI assumptions remain G6; these 28 failures are not individually claimed reproduced on main. Original clean-main no-export failure is retained, and Sara explicitly made emulator E2E non-blocking for G0. Log: `_local/qa/fix-loop-2026-10-22/g0/attempt-3/full-emulator-e2e.log`. CI on source head `6e89c4d` passed. Fresh Reviewer 1 approved that head; fresh Reviewer 2's own check passed and Chrome verification is pending. Source has not changed.

Fresh round-2 Reviewer 1 requested a bounded P2 correction for the valid legacy amount `2, juice and zest`. New mixed legacy regression failed before correction; all 16 grocery unit tests now pass. Full check passes lint/build, 99 frontend and 116 Functions tests. Public E2E passes 18/18 with explicit demo Firebase values; an earlier setup run without those values failed initialization and is retained. The full 82-test emulator run restarted on attempt-3 source and is pending, under Sara's existing G0 non-blocking exception.

Chrome desktop1440x1000/phone390x844 repeated empty-plan, malformed, zero-only, mixed, and valid legacy punctuation cases. Firestore comparisons prove preservation or valid-only replacement as appropriate. Checked Rice/Lemon and manual items survive reload. Dashboard/Planner/Recipes/Grocery smoke and post-reload console pass (zero errors). Existing G4 layout/copy findings remain separate. Evidence: `_local/qa/fix-loop-2026-10-22/g0/attempt-3/`, especially `verify-evidence.mjs`, `legacy-reload-phone-exact.png`, `mixed-phone.png`, `mixed-desktop.png`, `empty-desktop.png`, `mixed-reload-desktop.png`, `console-errors.json`, `full-check.log`, `public-e2e-demo.log`. CI and both fresh sequential reviews pending; no closure/merge claimed.

## 2026-10-22 G0 attempt 2 — quantity validation

Sara authorized correction of the round-1 finding on [PR #10](https://github.com/sararh95/VioMacro/pull/10), same branch. Four new tests failed on pushed head before source edits; another ordering regression failed before correction. All 14 grocery tests now pass. `npm.cmd run check` passed lint/build, 97 frontend and 116 Functions tests; public E2E passed 18/18. Focused emulator regression passed 1/1. Full emulator suite is being run against the requested synthetic imperial export; user explicitly made existing VM-010 emulator infrastructure failures non-blocking for G0. CI and both fresh reviewers are pending. No merge or closure yet.

Chrome at 1440x1000 and 390x844: malformed-only and zero-only return an error with exact saved Firestore rows unchanged; mixed input writes only Rice 3 cups, reports two skipped ingredients, preserves its checked state and the manual control after reload. Dashboard/Planner/Recipes/Grocery smoke completed. Post-reload runtime interval has zero red console errors; an earlier dev HMR context error and its full-reload recovery are retained, not hidden. Existing planner clipping and Recipes filter overlap remain G4. Screenshots/DOM/Firestore/logs: `_local/qa/fix-loop-2026-10-22/g0/attempt-2/`, especially `fixed-reload-desktop.jpg`, `fixed-reload-phone-settled.jpg`, `fixed-before/after-{malformed,zero}-{desktop,phone}.json`, `fixed-after-mixed-{desktop,phone}.json`, `clean-runtime-console.json`, `final-check.log` and `public-e2e.log`. See [running log](fix-loop-2026-10-22.md) for every gate and the historical round-1 stop below.

## 2026-10-22 G0 — VM-028 atomic grocery replacement

**Outcome: stopped; not ready to merge.** [PR #10](https://github.com/sararh95/VioMacro/pull/10) source/test commit `84df095` passed CI, but [Reviewer 1 requested changes](https://github.com/sararh95/VioMacro/pull/10#issuecomment-6350985705) for a serious P1 data-safety gap: malformed structured quantities become accepted zeros and can replace checked saved groceries. Malformed-only, zero-only and mixed valid/invalid probes reproduce it. Independent source-only mutation verification confirmed 7/9 tests fail on base source and 9/9 pass on reviewed source; those tests do not cover the newly demonstrated unsafe cases. Sara's immediate-stop rule applies. Reviewer 2 was not started, no merge attempted and no bug is closed. See the running log for the one required decision and complete verdict.

Branch `codex/fix-g0-grocery-atomic`, base `a4d0bc7`; [running log](fix-loop-2026-10-22.md). Sara authorized this grouped local-only fix loop. No deploys, production access or live AI/provider calls.

| Command / mode | Result |
|---|---|
| New actual-source unit regressions | 7 failed / 2 passed before source changes; 9/9 passed after |
| `npm.cmd run check` on Node 22.23.4 | Passed: lint, 92 frontend tests, app build, Functions commands and 116 tests |
| `npm.cmd run test:e2e` | 18/18 passed on unchanged main and after repair |
| `npm.cmd run test:e2e:emulator` | Exit 1 before launch: no usable export. Independently identical in clean archive of main; existing VM-010/G6 exception, not a passing suite |
| Original Chrome empty-plan repro | Before: checked generated row deleted, manual survives; after: both survive and retain state after reload, desktop and 390px |
| Chrome successful regeneration | Five generated rows replace prior generated rows; check Chicken breast, regenerate, reload: chicken remains checked and manual control survives |

Chrome uses `http://127.0.0.1:5173`, demo-viomacro Auth/Firestore/Storage only and unset AI switches. Original exact path: next week → Create New Plan → Open Plan Wizard → Start from Scratch → Add to List → `No recipes in plan` → Grocery → reload. Firestore before/after reads independently confirm the data states. Amount/scaling/aisle defects remain G1; known phone planner layout/copy defects remain G4.

The first QA tab lost debugger attachment; a fresh tab restored control, with no extension toggle needed. During broader repeated hard-load smoke, one local Firestore cold read timed out (settings/plan/grocery); Retry Saved Data recovered. This is recorded as an unresolved local QA limitation, not suppressed or represented as a clean console pass. Some immediate screenshots caught loading frames; the settled `fixed-desktop-regenerated.jpg` and `fixed-phone-preserved.jpg` were recaptured and visually inspected. Remaining page/review/CI gates are tracked in the running log.

Evidence under `_local/qa/fix-loop-2026-10-22/g0/`: `before-empty-plan.json/.txt/.jpg`, `after-empty-plan.json`, `unfixed-empty-plan-error.txt/.jpg`, `unfixed-after-reload.txt/.jpg`, `fixed-desktop-preserved.txt`, `fixed-desktop-regenerated.txt/.jpg`, `fixed-phone-empty-error.txt/.jpg`, `fixed-phone-preserved.txt/.jpg`, `fixed-final-groceries.json`, `red-tests.log`, `green-tests.log`, `main-check.log`, `fixed-check.log`, `main-public-e2e.log`, `fixed-public-e2e.log`, `main-emulator-e2e.log`, `fixed-emulator-e2e.log`.

## 2026-10-22 Bug Hunt Investigation — P0 Stop

Base `a4d0bc7`; isolated app-root worktree. Stage 1 only; see [full investigation](bug-hunt-2026-10-22.md) and the new VM entries in [bug ledger](../bug-ledger.md).

**Stop:** VM-028 reproduced real deletion of all five generated grocery documents after Add to List on an empty next-week draft. Manual item survived. Chrome displayed No recipes in plan; authenticated Firestore reads and reload confirmed deletion. No production data was used. Sara's explicit P0/data-loss gate prevents Stage 2 until her response.

### Test runs

| Command / mode | Result |
|---|---|
| npm.cmd ci; npm.cmd --prefix functions ci | Both passed, lockfiles unchanged; installation host Node 24.18.0 |
| npm.cmd run check with Node 22.23.4 | Passed: app lint, 83 unit tests, build, Functions commands, 116 Functions tests |
| npm.cmd run emulator, fresh checkout | Exit 1, no usable export: VM-010 reproduced |
| Direct emulator bootstrap | Auth/Firestore/Storage only on demo-viomacro; synthetic requested account, onboarding complete and imperial |
| Mocked actual-source/callable probes | VM-003/004 reproduced without live provider; parsing/formatting/roundtrip and additional cooking cases reproduced |
| npm.cmd run test:e2e | Not run before P0 stop |
| npm.cmd run test:e2e:emulator | Not run before P0 stop; existing runner forces frontend AI on and needs reconciliation with the paused requirement |
| Full Stage 3 desktop/phone pass | Pending; investigation coverage below is not certification |

Logs, screenshots, DOM snapshots, synthetic fixture scripts and Firestore readbacks: `_local/qa/bug-hunt-2026-10-22/`. Baseline Functions bare eslint has known limited coverage; its exit does not prove substantive source linting. Installation dependency advisories were not remediated or interpreted as demonstrated exploits.

### Chrome investigation matrix — incomplete

Codex Chrome extension, one synthetic account, one active QA tab at http://127.0.0.1:5173. Desktop 1440x1000 for named captures; planner also 390x844. Initial dashboard/grocery captures used Chrome's existing desktop viewport. Viewport override reset afterward. AI switches remained unset; Functions emulator was not started.

| Page / flow | Desktop result | Phone result | Persistence / console evidence |
|---|---|---|---|
| Sign-up / onboarding | Pending. Fixture created through emulator SDK; login succeeded | Pending | No browser onboarding completion claimed |
| Dashboard | Partial: wrong Week of Oct 22 header (VM-024); seeded plan displayed | Pending | dashboard-date.jpg; metric actions still pending |
| Meal Planner | Fail: meaningless icon names; five-meal Add to List quantities wrong; empty next-week draft loses old groceries (VM-028) | Fail: Confirm Plan extends to 399.95px in a 390px viewport | planner-desktop.txt, planner-phone.jpg, grocery-empty-plan-error.txt/jpg; no-ID warning captured |
| Recipes / detail | Fail: legacy undefined text and 1 1 cups formatting | Pending | recipe-legacy.jpg, recipe-legacy-scaled.txt, recipe-rounding.txt/jpg |
| Recipe edit/save | Fail: timer 120->0, cook time 0->30, decimal nutrients truncated; missing labels | Pending | recipe-form-fields.json and recipe-after-save.json; Firestore confirms persisted values |
| Recipe images | Fail: raw preview blocked by CSP and hidden; blank hero | Pending | recipe-image-errors.json from CDP Log.entryAdded; form preview naturalWidth=0/display=none |
| Guided Cooking | Fail: first timer 00:00 instead of saved 120 seconds; structured amounts absent | Pending | guided-cooking.txt/jpg; no-step crash confirmed separately by isolated component, not Chrome |
| Recipe import | Pending | Pending | AI-paused library controls observed; full chooser/import pass not run |
| Grocery | Fail: 120 oz vs 30; 10 cups vs 2.5; 10 -3 cloves; wrong aisles; 1 items; empty quick-add silent | Pending | grocery-generated.txt/jpg; generated checked item disappeared after failed refresh and reload; manual item remained |
| Pantry | Partial fail: empty Process Items silent; deferred controls visibly Coming Soon/disabled | Pending | pantry-empty-add.txt/jpg; no feature expansion |
| Progress | Pending | Pending | Stopped for P0 |
| Settings | Pending | Pending | Stopped for P0 |

The extension initially blocked automation because another extension UI was open, and later recovered. A transient CDP timeout after Add to List required a fresh read; mutation was independently confirmed in Firestore and browser reload. Security/CSP entries did not appear in the ordinary tab log collector, so CDP Log was used. No console filter or assertion was weakened.

### Decision and handoff

Evidence review found three screenshots captured a preceding UI frame: grocery-generated.jpg, recipe-rounding.jpg and guided-cooking.jpg. Their paired DOM/Firestore evidence supports the recorded findings; those images are retained only as context. Final grocery-after-loss.jpg was recaptured and visually checked, alongside planner-phone.jpg and grocery-empty-plan-error.jpg. Export CLI encountered a post-export libuv assertion and then a rename EPERM; the intact task-owned export directory was recoverably moved under _local after server shutdown. Metadata/files exist, but re-import remains unverified. App/emulator ports were confirmed closed.

18/20 supplied bugs reproduced (14 Chrome, four local probes), VM-026 source-confirmed only, VM-027 not reproduced/test run pending. New P0 VM-028 is the stop gate; additional findings VM-029..034 are recorded with evidence limits and Pantry deferral. No fixes, commits, pushes, PRs, deployments or live AI. Resume requires Sara's response to the P0 finding.


## Folder migration note (2026-10-22)

Dated entries, exact allowlists, quoted excerpts, commit IDs, and path spellings below are historical evidence. Their source paths and line numbers may refer to the earlier Web App/ layout. Local clickable links now target retained files; this does not recertify old line numbers. Current locations are indexed in [docs/README.md](../README.md).

This ledger records app QA, runtime checks and deploy-readiness evidence for VioMacro.

Repository cleanup retired the former agent coordination and app-brain files. Paths and recommendations inside dated entries describe the checkout and workflow at that time; they are historical evidence. Current contributor guidance is AGENTS.md, the retained contracts and current PR scope.

## 2026-10-22 Repository Cleanup Step5 CI

Added GitHub Actions for every pull request and push to main, plus a Summary / How tested / Screenshots PR template. CI uses Node 22 to match Functions and the native TypeScript test runner, read-only repository permissions, both lockfile cache keys, fresh app/Functions installs, dummy Firebase/reCAPTCHA values, emulator flag false and AI disabled. It runs npm run check and contains no deploy step.

- Fresh local npm ci and npm --prefix functions ci passed with unchanged lockfiles.
- Local npm run check passed: 83 frontend and 116 Functions tests, frontend lint/build and existing Functions commands. Public e2e passed 18/18 without retry, including mobile-chrome and existing console/CSP assertions.
- The feature checkpoint additionally passed emulator 81/81, production-emulator 4/4 and the seven-route local click-through; CI adds no runtime changes.
- The workflow's own pull-request run is a required merge gate; its actual GitHub result and run link are recorded in the PR description. Local Node 24 installation warnings are not claimed as Node 22 proof.
- Existing Functions eslint selects no source files; this cleanup does not claim substantive Functions lint coverage. Dependency audit advisories predate the cleanup and no dependency versions changed.
- Contributor status and delivery metadata now include merged cleanup PRs #6, #7 and #8. No deployment, production mutation or live provider calls occurred.

## 2026-10-22 Repository Cleanup Step4 Feature and Documentation Grouping

Moved 43 source files into app/providers, feature folders, shared, services/firebase and dev; updated import references and test source locators without changing runtime logic or assertions. Grouped ten workflow contracts, six page contracts, three QA guides and all 38 prototype files. Added the documentation index. Both obsolete source placeholders were moved into the primary workspace's dated recovery folder.

- Fresh npm ci and npm --prefix functions ci passed with unchanged lockfiles.
- npm run check passed: 83 frontend and 116 Functions tests, frontend lint/build and existing Functions commands.
- Public e2e passed 18/18, authenticated emulator 81/81 and production-build emulator 4/4, all without retry or changed console/CSP assertions.
- Manual local sidebar click-through verified /, /plan, /recipes, /grocery, /pantry, /progress and /settings with the synthetic emulator fixture and AI disabled. The plan prompt dismissed normally; Coming Soon states remained honest. An initial stale persisted sign-in at the 127.0.0.1 origin failed before login; the fresh localhost session logged in and loaded every route with no new captured warning/error entries. A redundant final dashboard click had a browser-control timeout; the dashboard had already been verified and captured. No source or timeout changed for either browser-session issue.
- Independent review verified source token streams and route definitions are unchanged apart from import paths, test assertions are unchanged, protected Firebase/Functions payloads match, both placeholder backups match, 57 documentation moves resolve, all 38 prototype files match byte-for-byte, and 215 retained links resolve. Historical checkpoint allowlists and quoted evidence retain their original spellings.
- Local screenshots and console/session notes accompany the task evidence. No deployment, production mutation or live provider calls occurred.

## 2026-10-22 Repository Cleanup Step3 Root Move

Moved the retained app tree from the wrapper to the repository root with git mv. The two ignore rule sets were merged without dropping protections; both originals remain in local recoverable archives. Generated wrapper residue was preserved outside the checkout. Active commands now run from the repository root; dated checkpoint path spellings remain historical.

- Fresh npm ci and npm --prefix functions ci passed with unchanged lockfiles.
- npm run check passed: 83 frontend and 116 Functions tests, frontend lint/build and existing Functions commands.
- Public e2e passed 18/18 without retry, including mobile-chrome and unchanged console/CSP assertions.
- Firestore emulators:exec --only firestore with echo ok passed from the new root using the demo-viomacro project and shut down cleanly. Firebase configuration still resolves its relative files.
- Independent review mapped every baseline tracked payload. Firebase config, .firebaserc, rules, indexes and every Functions source file are byte-identical after removing the old filesystem prefix. Both ignore archives match their original bytes; no active functional wrapper path remains.
- Other content changes are contributor/readme cwd guidance, architecture's current root, deploy-readiness cwd and two artifact-verifier diagnostic labels. No route or app behavior changed.
- No deployment, production mutation or live AI calls. The existing Functions lint limitation remains documented in the integration entry.

## 2026-10-22 Restore, Core Recovery and CSP Integration

PR5 merged into the restore branch, PR3 merged into main, then PR4 was retargeted and updated normally with main. The final main checkpoint 87915b969c59210b79ed47703a2b9794f362d078 has the exact verified combined tree b7e3531fbd058fd9c72eb1e8d4ab2593d0e399cd. PR2 was closed as superseded; obsolete remote branches were retired after verifying a complete local recovery bundle, including divergent PR2 and local-only history.

- npm run check passed: 88 frontend and 116 Functions tests, frontend lint/build and the existing Functions commands.
- Public e2e: 18/18 without retry, including mobile-chrome, with existing CSP/console assertions unchanged. Uses dummy Firebase/reCAPTCHA values, emulator flag false and CI=1.
- Authenticated emulator: 81/81. Production-build emulator: 4/4 without retry after warming the synthetic fixture before browser startup.
- Standalone PR5 emulator 73/74 exposed the onboarding reload race already corrected in PR4. Sara explicitly approved combined verification before merging in order.
- Retained intermediate evidence: an incorrectly enabled emulator flag in the public runner; production-emulator AI=false produced paused import UI (3/4); corrected AI=true exposed a cold Firestore read at 10.8s versus the existing 10s app timeout (passed on retry). The clean fresh 4/4 used the same synthetic data with startup warm-up. No app timeout, assertion or error filter changed for these harness issues.
- Emulators contain only synthetic accounts/data. No deployment, production mutation or live provider calls occurred.
- Existing verification limitation: Functions' bare eslint command selects no source files. Its exit status does not establish substantive Functions lint coverage; fixing that command remains outside this cleanup.

PRs: [CSP #5](https://github.com/sararh95/VioMacro/pull/5), [restoration #3](https://github.com/sararh95/VioMacro/pull/3), [core recovery #4](https://github.com/sararh95/VioMacro/pull/4).

## 2026-10-22 Repository Cleanup Step2 Retirement

Status: Retirement verified and ready for PR delivery.
Scope: Recoverably retire exactly 192 approved tracked files and replace active retired-guide pointers. Source placeholders remain until Step4.
Base checkpoint: `87915b969c59210b79ed47703a2b9794f362d078`.
Recovery location: Primary workspace `_codex-trash/2026-10-22/`, preserving original repository-relative paths; deliberately visible/untracked and outside the isolated app checkout.

Verification evidence:
- Archive: all 192 backups confirmed; exact retirement diff independently reviewed. Both source placeholders remain.
- npm ci and npm --prefix functions ci: passed with unchanged lockfiles.
- npm run check: passed, 83 frontend tests and 116 Functions tests, frontend lint/build and existing Functions commands. Exactly the obsolete repair-plan test file (five tests) retired; the frontend count changed from 88 to 83.
- npm run test:e2e: 18/18 without retry, including mobile-chrome; existing console/CSP assertions unchanged.
- Runtime behavior, Firebase config/rules/indexes and Functions logic are unchanged. The prior combined emulator 81/81 and production-emulator 4/4 proof remains attached to the restoration checkpoint; no new emulator pass is claimed for retirement.
- Retained references rescanned: active retired-guide pointers replaced; dated provenance and privacy ignore protections preserved. No retained import of App.css/react.svg found.
- Verdict: passed independent scope/recovery review; delivery is the focused Remove retired and agent-only files PR into main.

No deploy, provider call or production mutation occurred.

## 2026-07-13 CMD-050 Stage 6 Certification Documentation Checkpoint

Date: 2026-07-13
Mode: Explicitly approved Web App-only documentation checkpoint, Release report, and independent Manager Git verification
Scope: Preserve accepted CMD-048 Auth/Onboarding/Navigation and CMD-049 Settings/Dashboard target-effects evidence before app-brain work.

### Result

- Accepted with verdict `CHECKPOINT_COMPLETE`.
- Release started from branch and upstream exact `c7df65f6db27b094eaf772e8489d8e34e8059dd3`, divergence `0 0`, and an empty index.
- The full candidate and cached diff contained exactly seven approved Web App documentation files. Whitespace, secret/value, email/private-data, config-value, and local absolute-path hygiene checks passed.
- Commit `1d93c16c5eac32b7c7af4b2df0e311fa14d62054` used exact message `docs: checkpoint stage 6 auth and settings certification` and contains exactly the seven-file allowlist.
- One normal push succeeded with no retry. Manager independently confirmed the exact commit tree, local and upstream full hash equality at `1d93c16c5eac32b7c7af4b2df0e311fa14d62054`, divergence `0 0`, and an empty index.
- `Web App/.gitignore`, the live command room, the live Manager checklist, temporary reports, screenshots, Chef GPT, runtime/config/tests, packages, Firebase/cloud, production, deploys, provider/billing, and AI were excluded.
- Accepted CMD-048 focused 7/7 and CMD-049 focused 5/5 plus Browser evidence were reused. No app check, test, Browser, emulator, package, Firebase, production, or AI action was rerun for this docs-only checkpoint.

### Manager Decision

- Accept and clear CMD-050. Treat `1d93c16c5eac32b7c7af4b2df0e311fa14d62054` as the current coordination-branch restore point; immutable deployed Hosting source remains `f9769ae7deb1406526cffa43d5c737297c1fdcd1`.
- Distill and delete the temporary Release report. Do not create another commit merely to record this self-referential closeout; include it in the next meaningful approved Web App batch.
- Keep all worker lanes idle until the Manager defines the app-brain scope and separately reviews the already-present `.gitignore` brain-preparation changes. This checkpoint does not authorize brain implementation or the next Recipe certification slice.

## 2026-07-13 CMD-049 Settings And Dashboard Target Certification

Date: 2026-07-13
Mode: Local Firebase emulator certification, exact focused Playwright group, one in-app Browser Captain, and independent Manager review
Scope: Recertify ordinary Settings persistence and the promised Dashboard nutrition/hydration target effects while keeping AI Safety and every callable/provider path inactive.

### Result

- Accepted with verdict `GRADUATED`; no P0, P1, P2, or P3 product defect was confirmed.
- Exactly five named Settings tests passed 5/5 with 0 failures, 0 skips, and 0 retries in 25.0 seconds. Coverage proved save/reload persistence, exact target propagation, save-failure recovery with the draft preserved, honest Discard behavior, and app-level profile display-name persistence.
- A fresh disposable emulator account saved Exact Grams `160/210/70`, calculated `2110 kcal`, bottle size `650 ml`, Dairy Free, Peanuts, and a distinctive display name. Reload preserved each value and selection.
- Dashboard visibly and correctly labeled `2110 kcal`, `160 g`, `210 g`, `70 g`, and the `+650ml` hydration action. Desktop and `390x844` mobile views remained reachable without horizontal overflow, clipped controls, or trapped sticky actions.
- Console/network review found 0 HTTP 4xx/5xx responses, 0 runtime exceptions, 0 console warnings/errors, and 0 App Check warnings. There were zero `getAiSpendStatus`, pause/resume callable, Functions, Gemini/provider, production Hosting, or other forbidden requests.
- Manager independently inspected the three ignored screenshots, verified their SHA-256 hashes against the report, and confirmed ports `5173`, `8080`, `9099`, and `9199` clear. The documented replacement-tab screenshot timeout was a Browser-harness issue, not a reproducible app defect.

### Manager Decision

- Accept and clear CMD-049. Graduate the Settings persistence and Dashboard target-effects slice for the current local private-alpha scope.
- No Bugfix or Builder lane is justified. Preserve the local-only evidence boundary; production-authenticated mutation, AI Safety interaction, Functions, Gemini/provider use, deploys, and full-suite expansion remain separately gated.
- Distill this result into the Settings and Dashboard page contracts plus the Stage 6 roadmap, then delete the temporary QA report.
- Use one economical Web App-only Release checkpoint for the accepted Auth/Navigation and Settings/Dashboard certification documents before beginning the app-brain work or the next Recipe certification slice.

## 2026-07-12 CMD-048 Auth, Onboarding, And Navigation Certification

Date: 2026-07-12
Mode: Local Firebase emulator certification, focused Playwright, one in-app Browser Captain, and independent Manager review
Scope: Recertify Auth, Onboarding, protected/direct routes, and desktop/mobile Navigation as the first Stage 6 private-alpha daily-use slice without app changes, production access, or live AI.

### Result

- Accepted with verdict `GRADUATED`; no P0, P1, P2, or P3 product defect was confirmed.
- The exact intended seven-test Auth/Onboarding/Navigation group passed 7/7 with 0 failures, 0 skips, and 0 retries in 32.2 seconds. Three earlier attempts stopped before Playwright because of restricted PATH or Windows grep reconstruction and were classified as harness-only evidence.
- The Windows command that preserved the seven exact test-name alternatives was:

```powershell
node scripts/firebase-emulator.mjs exec --only auth,firestore,storage -- npx playwright test --config=playwright.emulator.config.ts --grep '\"new email user sees onboarding and can skip setup|onboarding skip survives delayed user initialization and reload|onboarding finish persists saved setup values after reload|auth page shows useful local auth states and disables unverified Google sign-in|protected routes redirect signed-out users and sign out returns to auth|desktop navigation shell exposes active routes, profile settings, and sign out|mobile navigation shell reaches account routes and closes after selection\"'
```

- Desktop Browser proof covered Auth mode switching, disabled Google/password-reset honesty, recoverable missing/invalid credential errors, signed-out `/settings` redirect, two disposable onboarding paths with reload persistence, returning login, direct `/`, `/recipes/import`, and `/settings`, every primary sidebar route with semantic active state, nested Recipes title, profile Settings, and sign-out.
- The `390x844` pass proved Auth fit, one honest mobile menu open/close path, in-viewport drawer geometry, direct close, close-after-selection, Settings/profile Settings access, and clean sign-out without trapped overlay or horizontal overflow.
- Console/network evidence contained only intentionally triggered invalid-login errors and canceled local Firestore listener teardown. There were no unexpected HTTP 4xx/5xx responses, App Check warnings, production VioMacro requests, callable traffic, Gemini/provider requests, or live-AI actions.
- Manager independently reviewed the report and three screenshots, confirmed the report was the only QA-created project file, and confirmed ports `5173`, `8080`, `9099`, and `9199` clear after exact command-owned process cleanup.

### Manager Decision

- Accept and clear CMD-048. Distill its evidence into this ledger, both workflow contracts, the app roadmap, the Manager checklist, and the command room; delete the temporary QA report.
- Keep Auth/Onboarding/Navigation graduated for the current private-alpha scope. Open Settings persistence and its promised Dashboard target effects as the next bounded QA certification slice.
- No Bugfix, Builder, Release, deploy, production, provider, billing, Firebase cloud/configuration, or live-AI action is justified by this result. Full regression, production-authenticated proof, Google sign-in, password reset, and deferred feature work remain separately gated.

## 2026-07-12 CMD-047 Final Stage 5 Documentation Checkpoint

Date: 2026-07-12
Mode: Explicitly approved Web App-only documentation checkpoint, Release report, and independent Manager Git verification
Scope: Preserve the accepted Stage 5 AI spend-safety state in one economical Git checkpoint without publishing a stale active command or mixing Chef GPT/runtime/cloud work.

### Result

- Accepted with verdict `CHECKPOINT_COMPLETE`.
- Initial branch `codex/webapp-folder-structure-v1`, local `HEAD`, and upstream were exact `f9769ae7deb1406526cffa43d5c737297c1fdcd1` with divergence `0 0` and an empty index.
- Release reviewed and staged exactly nine approved Stage 5 documentation files. Cached allowlist, whitespace, secret/value, email, private-data, and local-path hygiene checks passed.
- Commit `c7df65f6db27b094eaf772e8489d8e34e8059dd3` used exact message `docs: close stage 5 ai spend safety` and contains exactly the nine approved paths.
- One normal push succeeded with no retry. Manager independently confirmed `HEAD` and upstream exact `c7df65f6db27b094eaf772e8489d8e34e8059dd3`, divergence `0 0`, exact message, and exact nine-file commit tree.
- `docs/command-room.md` and `docs/manager-roadmap-checklist.md` remained unstaged so the pushed branch did not preserve CMD-047 as an active assignment. Chef GPT, the temporary report, runtime/config/tests, generated/environment files, and `codex_handoff.md` were excluded.
- No test, package, browser, Firebase/cloud, deploy, production, provider, billing, data-mutation, or live-AI action occurred. Existing accepted CMD-046 runtime evidence was reused as required.

### Manager Decision

- Accept and clear CMD-047. The temporary Release report was distilled and deleted.
- Treat `c7df65f` as the current coordination-branch documentation checkpoint while immutable deployed Hosting source remains `f9769ae` / live version `762e5b25bfb28e0c`.
- Begin Stage 6 as page-by-page private-alpha daily-use certification, starting with Auth/Onboarding/Navigation under CMD-048. Future Git actions remain separately approval-gated and should be batched economically.

## 2026-07-12 CMD-046 AI Spend Breaker Activation And Owner Proof

Date: 2026-07-12
Mode: Explicitly approved exact seven-Function production activation, one owner status-only call, Release report, and independent Manager metadata-only verification
Scope: Activate only the seven AI-spend breaker Functions from immutable `464d404`, prove the enabled metadata, allow exactly one owner `getAiSpendStatus` call without Gemini, and use the same-source false-flag deploy only on a named rollback trigger.

### Result

- Accepted with final outcome `ACTIVATED_AND_STATUS_PROVEN`.
- The first attempt passed immutable source, owner-session, locked install, Functions lint/build, and 62/62 mocked contract gates, but stopped before deploy when the execution approval service blocked fresh metadata. It made no deploy, Function invocation, production mutation, or Gemini request.
- After explicit approval, the Manager deleted only the first attempt's copied `.env` and `.env.viomacro`, removed only the exact clean activation worktree, and proved the path absent and unregistered. Release then restarted every gate from Phase 0 in a new worktree.
- The retry used exact immutable `464d404cc76f62d1640ae4ef6d1e889ca04d4095`, passed both locked installs, Functions lint/build, and exactly 62/62 mocked contracts, and remained tracked-clean.
- Fresh predeploy metadata confirmed exactly eight Functions: seven active Node 22 breaker targets with accepted bounded scaling and flag absent, plus separate unchanged flag-absent `billingBudgetMonitor`.
- Release deployed exactly `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, `semanticSearchRecipes`, `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend` with `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`. No `--force`, deletion, unrelated Function, or other Firebase resource appeared.
- Fresh postdeploy metadata confirmed all seven ACTIVE on v2 Node 22 with exact flag `true`, 256 MB memory, `maxInstances: 1`, accepted concurrency, owner config present by name, expected Gemini secret version `2` on the four provider paths, and unchanged `billingBudgetMonitor` hash/posture.

### One Owner Status Proof

- AI Safety was clicked exactly once. Network proof observed exactly one `getAiSpendStatus` POST plus its OPTIONS preflight, zero other callable POSTs, and zero Gemini/provider/generation/token-count/embedding/semantic-search requests.
- Sanitized UI result: `Active`; `$20.00` allowance; `$0.00` estimated spent; `$0.00` reserved; `$19.00` remaining; `$1.00` reserve; pricing version `gemini-standard-2026-07-09-v2`; period `Jul 1 - Aug 1 PT`; no pause time or reason.
- No rollback trigger occurred, so the same-source false-flag redeploy was not used. No second status call, resume, manual pause, AI feature, canary, log read, or raw `/ops` inspection occurred.

### Independent Manager Verification

- Manager ran sanitized Functions metadata only and did not repeat the consumed owner status call.
- Exactly eight Functions matched. All seven breaker targets were ACTIVE on `gcfv2` Node 22 in `us-central1`, 256 MB, `maxInstances: 1`, accepted concurrency, owner config present by name, and exact flag `true`.
- Gemini secret version `2` remained bound only to the four provider-backed targets. `billingBudgetMonitor` remained ACTIVE in `us-east1`, 256 MB, concurrency `80`, flag absent, and hash `4cc33feebd660d773012059a3baf286a342050e6`.
- Both temporary env files are absent. The retained activation worktree is clean at exact `464d404`. No new bug was opened.

### Manager Decision And Safety Boundary

- Accept and clear CMD-046. The breaker portion of Stage 5 is complete; project-wide billing unlink and custom email remain deferred.
- The Gemini canary is optional and remains separately approval-gated. It was not run and is not required for breaker acceptance.
- Do not repeat the owner status call as verification. A second status call, resume/manual pause, live AI, production data/log access, provider-cap change, unrelated deploy, or Git action requires a new command and explicit approval.
- Gemini/provider cost was zero. The approved actions incurred only ordinary Cloud Build/Artifact Registry/Functions deployment exposure, one Function status invocation, normal Settings reads, and the status path's bounded recovery possibility. No commit or push occurred.

## 2026-07-12 CMD-045 Final AI Spend Breaker Activation Preflight

Date: 2026-07-12
Mode: Zero-Gemini, report-only Release preflight plus independent Manager source/parity review
Scope: Prove the exact future activation and disable packet without deploying, invoking Functions, accessing production data/logs, changing configuration, mutating Git, or calling Gemini.

### Result

- Accepted with verdict `READY_FOR_EXPLICIT_ACTIVATION_APPROVAL`. This verdict does not itself authorize activation.
- Immutable `464d404cc76f62d1640ae4ef6d1e889ca04d4095`, the source of the accepted disabled Functions deploy, remains byte-equivalent to current `f9769ae` for Functions, rules/indexes, Storage rules, Firebase config, `.firebaserc`, and lockfiles. Only later root Hosting-artifact scripts differ.
- Fresh sanitized Firebase metadata confirmed all eight Functions active on Node 22. The seven breaker targets retain accepted bounded scaling, `AI_SPEND_CIRCUIT_BREAKER_ENABLED` is absent, `OWNER_UIDS` exists by name, and Gemini secret version `2` remains bound only to the four provider paths. `billingBudgetMonitor` remains separate in `us-east1`.
- Manager independently confirmed the immutable-path diff, Git-ignore coverage for `functions/.env.viomacro`, exact-string `true` flag predicate, explicit client denial for `/ops/...`, disabled zero-read/write behavior, and enabled owner-status recovery flow.
- No new bug was opened. Fresh CLI metadata cannot expose per-callable App Check enforcement or deployed rule text, so accepted CMD-029 evidence plus unchanged immutable source remains the proof bridge for those two facts.

### Accepted Activation And Disable Boundary

- Activation must use a new, clean detached worktree at exact `464d404`; copy the ignored `functions/.env` without printing values; create ignored `functions/.env.viomacro` containing only `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`; pass locked lint/build and 62/62 mocked contracts; and deploy exactly the seven breaker Functions.
- Postdeploy proof is sanitized metadata only until the separately approved owner status step. It must confirm exact flag `true`, bounded scaling, owner-config presence by name, preserved Gemini secret version metadata, and unchanged `billingBudgetMonitor`.
- Emergency disable uses the same immutable source and same seven targets with only `AI_SPEND_CIRCUIT_BREAKER_ENABLED=false`, followed by metadata proof. It does not delete Functions or operational state.
- One later enabled `getAiSpendStatus` call invokes no Gemini method but may recover stale reservations. Source-bounded accepted-path maximums are 32 logical document reads and 32 committed writes; transaction retries prevent an exact billed-read ceiling. A clean first status read does not initialize a period document.
- The expected clean owner result is enabled/active with `$20` allowance, `$0` spent/reserved, `$19` available after the `$1` reserve, and no pause details. Any denial, App Check failure, malformed/unavailable/non-default state, unexpected resource change, provider traffic, or non-AI regression is a stop/disable trigger.

### Safety And Cost Boundary

- CMD-045 made no deploy, configuration, Function invocation, production Auth/data/log access, provider/native-cap change, package install, build/test run, Git mutation, or Gemini request.
- The future activation can incur ordinary Cloud Build, Artifact Registry, and Functions deployment usage. The owner-status proof can incur one Function invocation plus bounded Firestore operations, but no Gemini charge.
- The native `$50` VioMacro project cap remains unchanged. Any Gemini canary remains optional and separately approval-gated.

## 2026-07-12 CMD-044 VioMacro Gemini Project Cap Configuration

Date: 2026-07-12
Mode: Explicitly approved one-setting Release mutation, Release persistence proof, and independent Manager read-only verification
Scope: Configure only project `viomacro`'s experimental Gemini monthly project spend cap to exactly `$50`, without any Gemini request or other provider, Firebase, production, deploy, or Git change.

### Result

- Accepted. Release confirmed the pre-change VioMacro project cap was unset, opened only the project-level monthly cap control, entered exactly `50`, and clicked Save exactly once.
- The settled Spend page displayed project `VioMacro`, Tier 1, `Edit spend cap`, and `$0.00 / $50.00`. Release proved the value again after navigation without retrying or saving a second time.
- Manager independently opened the same VioMacro Spend page read-only and confirmed the identical settled state: `VioMacro`, `Tier 1`, `Edit spend cap`, and `$0.00 / $50.00`.
- The page retained the warning that overages may occur during roughly ten minutes of processing latency and that the cap resets on the first day of each month in Pacific time. The `$50` control is an emergency backstop, not an exact invoice guarantee.

### Manager Decision

- Accept and clear CMD-044, distill its temporary report, and delete the report. No new bug is opened.
- Treat the `$50` native project cap as configured. Preserve the application gate as the primary behavior: initial `$20` allowance, AI-only pause before an unsafe next provider call, and one owner-approved `$20` resume tranche.
- Keep the application breaker disabled. The next recommended gate is a separately approved, zero-AI Release activation preflight; activation, owner production status proof, production data access, and any Gemini canary remain separate decisions.
- Reassess the native cap before approving application allowance above `$40`, and do not edit or remove the cap without another explicit approval.

### Safety Boundary

- No prompt, generation, token-count request, embedding, semantic search, Gemini API request, production Function/callable, VioMacro Auth/data/log access, or AI charge was intentionally created.
- No billing account, payment setting, plan, IAM, API key, quota, model, unrelated project, Firebase resource, application flag, deploy, stage, commit, push, or other Git state changed.

## 2026-07-12 CMD-043 Gemini Native Provider-Backstop Decision

Date: 2026-07-12
Mode: Read-only Release account assessment, official-document reconciliation, and independent Manager verification
Scope: Determine the native Gemini safeguard available to project `viomacro` without changing billing/provider state, invoking Gemini, accessing VioMacro production, or mutating Git.

### Result

- Accepted for factual evidence. Release and Manager independently confirmed that `viomacro` is Tier 1 Postpay, is billing-enabled, and exposes an experimental project-level monthly spend cap that is currently unset.
- The serving billing account has a broader `$250` Tier 1 monthly cap shared with two other paid projects. VioMacro showed `$0.00` on the Projects surface and no available project usage data; the shared account showed `$0.02`, which is not attributable to VioMacro from the inspected views and may lag.
- Current official Google guidance confirms that project caps can overrun during roughly ten minutes of billing latency and during long-running work. Tier 1 also has a `$10` rolling ten-minute spend-rate limit. Cloud Billing budgets remain alert-only.

### Manager Decision

- Accept and clear CMD-043, distill its temporary report, and delete the report. No new bug is opened.
- Do not adopt Release's proposed `$20` native project cap. A fixed provider cap at `$20` would conflict with the accepted owner workflow, because `Resume with another $20` raises the application allowance to `$40` while the provider would remain stopped near `$20`.
- Keep the application gate as the primary `$20` pause. Retain `$50` as the recommended native emergency-cap candidate: one initial `$20` allowance, one complete `$20` owner-approved resume tranche, and a `$10` planning margin. The margin is not an exact overrun guarantee.
- Configuring `$50` remains a separate provider mutation requiring explicit user approval. Before any later application allowance above `$40`, reassess or deliberately raise the native cap through another approval-gated Release decision.
- Breaker activation, owner-authenticated production status proof, production data, and any Gemini canary remain blocked.

### Safety Boundary

- No spend cap, billing plan/account, payment setting, IAM, API key, Firebase resource, application flag, production path, or Git state changed.
- No Gemini generation, token count, embedding, semantic search, production Function/callable, or other cost-bearing AI request ran.

## 2026-07-12 CMD-042 Corrected Artifact-Safe Hosting Publication

Date: 2026-07-12
Mode: Approved Hosting-only Release packet, immediate signed-out production smoke, and independent Manager acceptance
Scope: Publish the disabled AI Safety UI from immutable `f9769ae7deb1406526cffa43d5c737297c1fdcd1` without Functions, provider/configuration, production Auth/data, Git mutation, or live AI.

### Result

- Accepted. Release deployed exactly Firebase Hosting once from a clean detached worktree at `f9769ae7deb1406526cffa43d5c737297c1fdcd1`.
- Live Hosting is version `762e5b25bfb28e0c`, release `1783842374869000`, finalized at `2026-07-12T07:46:14.869Z`, with exact message `Hosting-only artifact-safe disabled AI safety from codex/webapp-folder-structure-v1 f9769ae`.
- The fresh predeploy rollback target was recovered known-good version `0d45e0cec1e830e8`, release `1783823928312000`. No rollback trigger occurred, so Firebase Console remained untouched.
- `BUG-030` did not recur. The corrected disabled-state UI is now published, while the AI spend breaker remains disabled.

### Verification

- Locked root and Functions installs completed without tracked changes. Unrestricted `npm.cmd run check` passed after the restricted attempt hit only the documented temporary-worktree write boundary.
- Production-build emulator E2E passed 4/4 with clean local Auth/Firestore/Storage shutdown; public E2E passed 18/18 across desktop and mobile.
- Final `npm.cmd run build:hosting` ran after all tests. The verifier accepted five generated files with no Auth, Firestore, Functions, or Storage emulator endpoint class.
- Temporary `.env` and `.env.local` copies contained only the eight expected browser-facing variable names, no values were printed, and both copies were removed before deploy.
- Release signed-out smoke passed: `/auth?cmd042=1` rendered the private-alpha Auth controls and production JS/CSS; `/plan?cmd042=1` redirected to `/auth`; neither route showed an emulator warning, blank/crash state, missing core asset, or captured warning/error log.
- Manager independently confirmed the same live version/message, reran the artifact verifier, proved the detached worktree remains exact and tracked-clean with env copies absent, and repeated signed-out `/auth` plus `/plan` smoke with zero warning/error logs.
- An optional deep browser network-event capture timed out. This was tooling-only: independent route, asset, control, redirect, and console evidence remained green.

### Manager Decision

- Accept and clear CMD-042. Distill and delete its temporary report.
- Keep Firebase Console rollback to `0d45e0cec1e830e8` as the recorded recovery target for this release packet; `BUG-031` remains deferred and unchanged.
- The next Stage 5 gate is a separate Release decision packet for native Gemini project-cap configuration or explicit private-alpha deferral. Activation, owner-authenticated status proof, production data, and any live canary remain blocked.

### Safety Boundary

- No Gemini/provider request, token count, generation, embedding, semantic search, production Function/callable, production sign-in/data access, or AI API charge occurred.
- No Functions, rules/indexes, Storage, Firebase config, App Check, IAM, billing, provider, secret, or environment configuration changed.
- No stage, commit, push, GitHub Actions, paid CI, package publication, PR, tag, or release action occurred. Exactly one Hosting-only deploy used ordinary Hosting quota exposure.

## 2026-07-11 CMD-041 Artifact-Hardening Checkpoint

Date: 2026-07-11
Mode: Exact-scope Release checkpoint plus independent Manager Git/report review
Scope: Make the accepted CMD-039/CMD-040 `BUG-030` artifact hardening immutable without deploying, accessing production, changing cloud/provider configuration, installing packages, or invoking Gemini.

### Result

- Accepted. Release staged exactly the 11-file Web App allowlist, created commit `f9769ae7deb1406526cffa43d5c737297c1fdcd1` with message `fix: protect hosting artifacts from emulator builds`, and pushed the existing branch once.
- Manager independently confirmed the commit contains exactly the eight durable incident/closure docs, `package.json`, `playwright.prod-emulator.config.ts`, and `scripts/verify-hosting-artifact.mjs` named by CMD-041.
- Local `HEAD` and `origin/codex/webapp-folder-structure-v1` equal the same full hash with `0 0` divergence.
- Unrelated Chef GPT modifications and untracked skill-governance work remained outside staging, commit, and push.

### Verification

- `node --check scripts/verify-hosting-artifact.mjs`: passed.
- Final unrestricted `npm.cmd run build:hosting`: passed after the restricted attempt hit only the known Vite/esbuild ancestor-read boundary. The verifier accepted five production files with no Firebase emulator endpoints.
- Unstaged and cached whitespace checks passed; LF-to-CRLF notices were non-blocking.
- Cached scope was exactly 11 files, 728 insertions, and 47 deletions. High-confidence secret-pattern scanning returned no path; one broad documentation-only config-name reference contained no secret-form value.
- The repository had no `.github/` directory, so the one push could not trigger a repository Actions workflow or consume Actions minutes.

### Manager Decision

- Accept and clear CMD-041, distill its temporary report, and delete that report.
- Immutable artifact-hardening source is now `f9769ae7deb1406526cffa43d5c737297c1fdcd1`.
- The next gate is a separately approved corrected Hosting-only disabled-state publication from that exact commit. CMD-041 itself grants no deploy authority.

### Safety Boundary

- No Hosting/Functions/rules/indexes/Storage/config deployment, Firebase Console or production access, provider/billing/App Check/IAM/secret change, package action, production Function/data/log invocation, semantic-index action, or live AI occurred.
- No PR, paid CI, tag, release, force-push, or other unapproved Git action occurred.

## 2026-07-11 CMD-039/CMD-040 Hosting Artifact Isolation Closure

Date: 2026-07-11
Mode: Narrow Bugfix, Manager source/red-green review, and independent local-only QA
Scope: Close `BUG-030` without deploying, accessing production, changing Firebase/provider configuration, installing packages, or invoking Gemini.

### Result

- Accepted and closed locally. `test:e2e:prod-emulator` now builds and previews from ignored `_local/qa/prod-emulator-dist` instead of deployable `dist/`.
- `build:hosting` now performs the normal production build and immediately runs a dependency-free, fail-closed artifact verifier.
- The verifier rejects absent, empty, invalid, path-escaped, symlinked, or emulator-contaminated artifacts. It detects the four VioMacro emulator classes for Firestore `8080`, Auth `9099`, Storage `9199`, and Functions `5001` in exact or compiled host-plus-port form without printing environment values or matching bundle content.
- Firebase Hosting configuration remains unchanged and still publishes `dist/`. No runtime source, tests, Functions, rules/indexes, Firebase config, environment file, dependency, or lockfile changed.

### Verification

- Bugfix prod-emulator proof: 4/4 passed with clean local Auth/Firestore/Storage shutdown. Independent QA repeated 4/4.
- Bugfix public E2E: 18/18 passed across desktop and mobile. Independent QA repeated 18/18, including private-alpha Auth and protected-route behavior.
- Bugfix and QA unrestricted `npm.cmd run check`: both passed app lint/build and Functions lint/build. Restricted attempts failed only at the known Vite/esbuild ancestor-read sandbox boundary.
- Before/after prod-emulator manifests matched exactly across all five production artifact paths, byte counts, and SHA-256 hashes in both Bugfix and independent QA.
- Intentional red proof rejected `_local/qa/prod-emulator-dist` with all four endpoint classes. Default `dist/` passed the green verifier, and final `npm.cmd run build:hosting` left the deployable artifact production-clean.
- Manager independently reviewed the complete implementation/report scope, passed scoped `git diff --check`, confirmed clean-production green behavior, and confirmed four-class contaminated-artifact red behavior.

### Manager Decision

- Accept CMD-039 and CMD-040 and close `BUG-030` locally.
- Keep `build:hosting` as the mandatory final artifact gate after every emulator/browser test and immediately before every later approved Hosting deploy.
- Distill and delete both temporary reports. The next step is one economical Web App-only checkpoint commit/push under separate user approval, followed by a separately approved corrected Hosting-only publication from that new immutable commit.
- Keep `BUG-031` separate. Firebase Console rollback remains the proven primary recovery path.

### Safety Boundary

- No stage, commit, push, deploy, rollback, Firebase Console/production access, production data/log/callable action, provider/billing/App Check/IAM/secret/configuration change, package install, semantic-index action, or live AI occurred.
- All Firebase activity was limited to local Auth/Firestore/Storage emulators using the ignored local export. No Gemini or AI API charge was possible.

## 2026-07-11 CMD-038 Hosting Publication Incident And Recovery

Date: 2026-07-11
Mode: Approved Hosting-only Release packet, signed-out production smoke, conditional rollback, and Manager recovery
Scope: Publish immutable `fe48d25` while the AI breaker remained disabled, without Functions/provider/data/AI work.

### Result

- CMD-038 publication is rejected. The Hosting-only deploy succeeded technically as version `db2ff99bfb34e9b1`, but fresh signed-out `/auth` rendered only `Running in emulator mode. Do not use with production credentials.` instead of the Auth surface.
- Root cause is proven: `test:e2e:prod-emulator` ran after the production build and rebuilt default `dist/` with `VITE_USE_FIREBASE_EMULATORS=true`; that test artifact was then deployed.
- Both Release CLI version-clone rollback attempts failed before mutation because the installed Firebase CLI accepts channel sources but rejected `site:@VERSION_ID`, despite the current official reference describing version-ID clone syntax.
- Manager used the already pre-authorized Firebase Console rollback on known-good version `0d45e0cec1e830e8`. Console now records the failed `db2ff99bfb34e9b1` release as rolled back and the 2026-07-09 `541a7f2` release as current.
- Independent post-rollback smoke passed: `/auth?cmd038-rollback=1` rendered private-alpha Auth controls with no warning/error logs, and `/plan?cmd038-rollback=1` redirected to `/auth` with the same clean result.

### Local And Safety Evidence

- Detached source was exactly `fe48d25`; checkpoint-locked installs did not change tracked files.
- Unrestricted full `check` passed. Corrected production-build emulator proof passed 4/4 with clean Auth/Firestore/Storage shutdown.
- Copied ignored client environment files contained only expected browser-facing Firebase/reCAPTCHA names and were removed from the temporary worktree before deploy.
- One Hosting-only deploy and one Firebase Console rollback occurred. No Functions/rules/indexes/Storage/config/provider/billing/App Check/IAM/secret change, production sign-in/data access, callable invocation, semantic-index action, or Gemini/live-AI request occurred.
- Firebase Hosting has no per-deploy fee; only ordinary project-level storage/data-transfer quota exposure applied. No AI API charge was possible.

### Manager Decision

- Accept the recovery evidence and production health, but reject CMD-038 as a successful publication.
- Open `BUG-030` as a P1 repeat-deploy blocker for artifact isolation and a deploy-time hosting-artifact guard.
- Record `BUG-031` as a deferred release-tooling gap. Firebase Console rollback is the only currently proven operational path; do not advertise version-ID CLI clone as executable until independently proven with the installed CLI.
- Keep Hosting republish, native provider disposition, Functions activation, owner production proof, and live canary blocked until BUG-030 passes Bugfix plus independent QA.

## 2026-07-11 CMD-037 Consolidated In-App AI Spend Safety Checkpoint

Date: 2026-07-11
Mode: Release checkpoint plus independent Manager Git/report review
Scope: Checkpoint the accepted in-app AI spend safety state without deploying, activating the circuit breaker, accessing production, or calling Gemini.

### Result

- Accepted. Release staged exactly the 13-file Web App allowlist, created commit `fe48d25f87622431a39a38560cc92ec277e7bca9` with message `chore: checkpoint in-app ai spend safety`, and pushed the existing branch once.
- Manager independently confirmed the commit contains exactly the intended 13 Web App files and that local `HEAD` equals `origin/codex/webapp-folder-structure-v1` with `0 0` divergence.
- The checkpoint includes the production-neutral disabled AI Safety copy, deterministic focused coverage, and the durable CMD-029 through CMD-036 lifecycle records.
- Unrelated Chef GPT modifications and untracked skill-governance work remained outside staging and were not changed.

### Verification

- Unrestricted `npm.cmd run check`: exit 0; app lint/build and Functions lint/build passed with only the existing non-blocking Browserslist, mixed-import, and large-chunk warnings.
- Mocked Functions contracts: passed 62/62 with no real provider path.
- Focused mocked AI Safety emulator group: passed 5/5 with clean Auth/Firestore/Storage emulator shutdown.
- Staged scope: exactly 13 allowlisted files, `1205` insertions and `97` deletions; cached diff check and secret/config hygiene passed.
- Commit/push proof: branch advanced once from `464d404` to `fe48d25`; post-push local/upstream equality is exact.

### Manager Decision

- Accept and clear CMD-037, distill its temporary report here and in the owning contracts, then delete the report.
- The next gate is a separately approved Hosting-only publication from immutable `fe48d25` while the circuit breaker remains disabled. This checkpoint itself grants no deploy authority.

### Safety Boundary

- No Hosting/Functions/rules/indexes/Storage/config deployment, rollback, provider/billing/email/IAM/App Check/secret change, production authentication/data/log access, Function invocation, semantic-index action, or live AI occurred.
- The seven AI-spend Functions remain deployed but disabled. Production Hosting still serves the older `541a7f2` build until a separate approved Release command publishes the new disabled UI.

## 2026-07-11 CMD-035/CMD-036 Production-Neutral Disabled AI Safety Copy Closure

Date: 2026-07-11
Mode: Narrow Builder correction, Manager red/green review, and independent report-only QA
Scope: Close `BUG-029` without changing the `$20` allowance, AI-only pause/resume behavior, backend/service compatibility, or any live/deployed state.

### Result

- Accepted and closed locally. The disabled owner panel now says `AI spend controls are currently disabled.` instead of describing the environment as a `local build`.
- The existing disabled-state test asserts the exact sentence and uses `getByText('Disabled', { exact: true })` for deterministic status-badge matching.
- The Manager's first focused run correctly failed only because the old non-exact `Disabled` locator matched both the badge and new sentence. Builder corrected that test-only ambiguity without changing runtime behavior.
- Scoped source/diff review confirmed the CMD-035 delta is limited to the disabled sentence plus focused locator/assertion. Accepted CMD-032 email/provider cleanup remains in the same two uncommitted files.
- `aiSpendService.ts`, Functions, rules, indexes, Firebase configuration, packages, routes, allowance values, pause/resume controls, and dormant email/outbox compatibility remained unchanged.

### Verification

- Manager unrestricted `npm.cmd run check`: exit 0; app lint/build and Functions lint/build passed with only existing Browserslist, mixed-import, and large-chunk warnings.
- Builder corrected focused mocked AI Safety group: passed 5/5 with clean Auth/Firestore/Storage emulator shutdown.
- Independent CMD-036 focused mocked AI Safety group: passed 5/5 again with clean shutdown.
- QA confirmed all focused callable responses are intercepted through Playwright routes; no Functions emulator, production path, Gemini/provider API, or email path ran.
- Scoped `git diff --check` exited 0; LF-to-CRLF warnings were environment-only and no whitespace error was found.

### Manager Decision

- Accept CMD-035/CMD-036 and close `BUG-029` locally.
- Distill both temporary reports into the QA ledger, bug ledger, AI-spend/Settings/readiness contracts, roadmap, Git checkpoint contract, and command room, then delete both reports.
- No worker command is active. The next decision is explicit user approval for one consolidated Web App-only checkpoint commit and one reserved push using the exact 13-file allowlist in `docs/git-checkpoint-contract.md`.

### Safety Boundary

- No stage, commit, push, deploy, rollback, production authentication/data/log access, cloud/provider/billing/email configuration, Function invocation, or live AI occurred.
- The circuit breaker remains deployed but disabled. Production Hosting remains on the older `541a7f2` build.

## 2026-07-11 CMD-034 Final Stage 5 Release Preflight

Date: 2026-07-11
Mode: Release report-only preflight plus Manager source, Git, and official-document review
Scope: Determine the exact checkpoint, disabled Hosting publication, native Gemini backstop, activation, status proof, rollback, and optional canary sequence without mutation or live AI.

### Result

- Accepted as the Stage 5 activation sequence, with one narrow pre-checkpoint correction.
- Branch and upstream were aligned at `464d404`; tracked Functions source, manifests/locks, rules, indexes, and Firebase configuration remained byte-equivalent to the accepted disabled deploy source.
- The seven AI-spend Functions remain accepted as deployed with bounded scaling and the breaker absent/false. CMD-034 invoked no Function and read no production data or logs.
- Production Hosting still serves the older `541a7f2` build as version `0d45e0cec1e830e8`, so it does not yet contain the owner AI Spend Safety panel.
- Current official Gemini documentation confirms experimental project-level monthly spend caps in AI Studio. They can lag around ten minutes and overrun, so they are an emergency provider backstop rather than the precise application `$20` allowance.
- Cloud Billing budgets remain alert-only. Project-wide billing unlink remains out of scope because it can interrupt non-AI Firebase services.
- Custom outbound email remains deferred and absent from every required activation gate.
- Release found `BUG-029`: the disabled panel says `local build`, which would be misleading after the next Hosting publication.

### Ordered Gates

1. Correct `BUG-029` locally and obtain independent focused QA.
2. Create one consolidated Web App-only checkpoint and one reserved push under separate approval.
3. Publish Hosting only while the breaker remains disabled, capture rollback metadata, and run signed-out smoke under separate approval.
4. Configure a separately approved native Gemini project cap or record an explicit private-alpha deferral.
5. Activate only the seven AI-spend Functions with metadata-only proof under separate approval.
6. Run an owner-authenticated status-only proof, acknowledging that stale-reservation recovery can perform a bounded production write.
7. Run one smallest live canary only if the user separately approves a cost-bearing Gemini call.

### Manager Decision

- Open `BUG-029` and route only `CMD-035` to Builder. Do not checkpoint, push, deploy, configure a provider cap, activate the breaker, authenticate to production, or call Gemini yet.
- Expand the future checkpoint allowlist from 12 to 13 files only to include the required `docs/bug-ledger.md` lifecycle record; every other Release exclusion remains in force.
- Keep the app product rule unchanged: the initial allowance is `$20`, only AI actions pause at the boundary, non-AI workflows remain available, and owner approval grants another `$20` tranche.

### Safety Boundary

- CMD-034 changed only its temporary report. Manager distilled the accepted evidence here and deleted that report.
- No stage, commit, push, deploy, rollback, cloud/provider/billing/configuration change, production authentication/data/log access, Function invocation, email, or Gemini request occurred.

## 2026-07-11 Manager Scope Decision - In-App AI Pause Only

Date: 2026-07-11
Mode: Manager product decision; no runtime verification claimed
Scope: Simplify the one-owner Stage 5 notification behavior without weakening the server-side `$20` allowance.

### Decision

- Keep Gemini as the AI provider and keep the race-safe application allowance.
- At the allowance boundary, pause only Gemini-backed AI actions; Hosting, Auth, Firestore, Storage, and non-AI workflows remain usable.
- Use the owner-only AI Spend Safety Settings state as the required notification and keep `Resume with another $20` as the explicit recovery action.
- Defer Resend, SMTP, Firebase Trigger Email, and every other custom outbound-email implementation/configuration packet.
- Preserve the already deployed server-only deterministic outbox/audit compatibility path for now; it sends nothing externally and is not an activation prerequisite.
- Existing Google Cloud budget emails remain alert-only and are not a hard cap.

### Next Evidence

- `CMD-032` must remove email-provider language from the owner UI without changing backend/service contracts, then pass the focused mocked AI Safety group and full local `check`.
- Independent QA must verify the in-app paused state, non-AI availability statement, owner-only `$20` resume flow, fail-closed states, and absence of custom-email/provider language before Manager accepts the cleanup.
- The circuit breaker remains deployed but disabled. This decision authorizes no activation, live AI, production invocation/data access, provider configuration, deploy, commit, or push.

## 2026-07-11 CMD-032/CMD-033 In-App AI Pause Status Closure

Date: 2026-07-11
Mode: Local Builder cleanup, Manager source/gate review, and independent report-only QA
Scope: Remove custom email/provider language from the owner AI Spend Safety Settings surface without changing the deployed backend compatibility contract or `$20` pause/resume behavior.

### Result

- Accepted. Builder changed only `src/components/AiSpendSafetyPanel.tsx` and the focused cases in `tests/e2e/emulator-auth.spec.ts`.
- Removed the email-status formatter/import, email-warning alert/icon, provider-setup failure copy, and `Last automatic pause email` stat.
- Preserved the exact automatically paused copy: `AI calls are stopped. Non-AI VioMacro workflows remain available.`
- Preserved manual pause, owner-denied/unavailable fail-closed states, stale-authority clearing after mutation/refetch failure, request IDs, and explicit `Resume with another $20.00` behavior.
- `AiSpendStatus.lastPauseEmailStatus`, `functions/src/emailOutbox.ts`, and every Functions/backend path remained unchanged. The deterministic server-only compatibility outbox remains dormant and sends nothing externally.

### Verification

- Manager unrestricted `npm.cmd run check`: passed with app lint/build and Functions lint/build green; only existing Browserslist, mixed-import, and large-chunk warnings remained.
- Independent QA focused local emulator group: passed 5/5 using mocked callable responses, with clean Auth/Firestore/Storage emulator shutdown and zero Gemini/provider/production calls.
- Independent source/diff review confirmed only the two allowed implementation files changed and service/Functions diffs were empty.
- Desktop 1280x720 and mobile 390x844 paused-state screenshots showed readable status/copy, no email/provider wording, no clipping, and no incoherent overlap in the captured areas.
- The screenshots did not include the lower resume controls; the focused test independently asserted and completed the `$20.00` resume flow. Manager accepts this as an evidence-framing caveat, not a product defect.
- Full and scoped `git diff --check` exited 0 with line-ending warnings only.

### Manager Decision

- Accept and close CMD-032/CMD-033 with no new bug.
- Distill this evidence into the AI-spend, Settings, roadmap, readiness, and command-room records, then delete both temporary reports.
- Keep the circuit breaker disabled. The next lane is a read-only Release preflight for one economical Web App checkpoint and the exact Hosting/activation/rollback packets.

### Safety Boundary

- No backend/service/outbox/rules/index/config/secret/provider/email/production-data/runtime-log change occurred.
- No deploy, commit, push, live Gemini/provider request, email, production authentication, or production Function invocation occurred.

## 2026-07-10 CMD-031 Owner Pause-Email Transport Decision

Date: 2026-07-10
Mode: Read-only local architecture audit plus current official Firebase/Resend research
Scope: Select the smallest reliable transport from the existing deterministic server-only outbox to one verified owner email without configuring or sending anything.

Follow-up: the 2026-07-11 Manager scope decision defers this provider path for the current private alpha. The research remains historical evidence only and email is no longer an activation prerequisite.

### Result

- Accepted as the default architecture: one dedicated second-generation Firestore-triggered worker calling the Resend HTTPS Email API directly.
- The worker will use the existing outbox document ID as Resend's 24-hour idempotency key, preserving one logical email across duplicate Firestore events and ambiguous network timeouts.
- Firebase Trigger Email remains a supported fallback, but the current outbox lacks its recipient/message/delivery schema. Preserving verified Firebase Auth recipient lookup would require an adapter, normally a second collection, extension-managed resources, and another status mapping.
- Resolve exactly one enabled, verified Firebase Auth owner record from `OWNER_UIDS` at send time. Do not store/log the owner UID, recipient, provider response body, or secret.
- Bound provider submission to three attempts within two hours with a stable body/key, transactional claim lease, retryable/permanent classification, and sanitized `pending`/`sent`/`failed` state. Email failure must leave AI paused.

### Rollout Decision

- Keep new outbox events at `pending_provider_setup` through local adapter work and disabled worker deployment.
- Separate later packets govern: local adapter/tests; Resend account/domain/restricted key/Firebase secret; deploy only the dormant worker; one controlled email to the verified owner; producer integration while the breaker remains disabled; native provider backstop; activation; and canary.
- Current Resend Free posture reviewed 2026-07-10 is `$0/month`, 3,000 sent/received emails monthly, 100/day, one domain, and no free-plan overage. This is expected to fit the one-owner private alpha but is not a hard future zero-cost guarantee.

### User Decision Required

- Approve Resend Free and the direct HTTPS worker architecture.
- Choose an owned sender subdomain/address, recommended `notify.<owned-domain>` and `VioMacro <alerts@notify.<owned-domain>>`, or explicitly accept the test-only Resend sender restriction for private-alpha testing.
- Confirm the single verified Firebase Auth owner email is the intended recipient.

### Safety Boundary

- No provider account/session, domain/DNS, key/secret, extension/package, source/test/config/rules/index change, email, production Auth/data/log access, Function/provider/Gemini invocation, deploy, cloud mutation, worktree action, commit, or push occurred.

### Manager Decision

Accept and clear CMD-031. Distill the architecture into the AI-spend, cost-control, release, roadmap, and command-room records, delete the temporary report, and hold all worker lanes for the user provider/sender/recipient decision.

## 2026-07-10 CMD-030 Disabled AI Spend Functions Deployment

Date: 2026-07-10
Mode: Explicitly approved Release deployment from immutable source plus zero-Gemini metadata proof
Scope: Deploy exactly the four existing AI Functions and three owner AI-spend callables while keeping the circuit breaker disabled and every unrelated production surface untouched.

### Result

- Accepted. Release deployed from detached, tracked-clean checkpoint `464d404cc76f62d1640ae4ef6d1e889ca04d4095`; the coordination checkout and upstream remained aligned at the same commit with `0 0` divergence.
- A first clean-worktree lint attempt stopped correctly before deployment because root ESLint dependencies were absent. Manager confirmed they were checkpoint-pinned and authorized only root `npm.cmd ci --ignore-scripts`; no source, manifest, or lockfile changed.
- Corrected Functions lint passed, TypeScript built, and mocked contracts passed 62/62 with no Gemini/provider call.
- The exact deploy updated `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, and `semanticSearchRecipes`; it created `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend`. Firebase reported deploy success with no deletion or extra resource.

### Metadata Proof

- All seven selected Functions are active v2 `nodejs22` in `us-central1`, with 256 MB memory and bounded `maxInstances: 1`.
- `generateMealPlan`, `parseRecipeFromImage`, `semanticSearchRecipes`, and `getAiSpendStatus` use concurrency `5`; embedding, resume, and manual-pause use concurrency `1`.
- `AI_SPEND_CIRCUIT_BREAKER_ENABLED` is absent everywhere, so the deployed gate remains disabled. `OWNER_UIDS` is preserved by name only; the four AI Functions retain `GEMINI_API_KEY` version `2` binding metadata without value access.
- `billingBudgetMonitor` remains active and unchanged in `us-east1`, including its prior source hash and scaling posture.
- Manager independently ran read-only `functions:list` and confirmed the expected eight-Function inventory: seven selected targets plus `billingBudgetMonitor`.

### Safety Boundary

- The only production mutation was the exact seven-Function deploy. No Function/callable, Auth/App Check flow, production app/data path, runtime log, Gemini/provider API, email, activation, rollback, deletion, Hosting, rules/indexes, Storage, App Check configuration, IAM, billing, or secret change was invoked.
- No commit or push occurred. The temporary clean worktree remains at `C:\tmp\viomacro-deploy-464d404` pending separate cleanup.

### Manager Decision

Accept and clear CMD-030. Distill the disabled deployment into the AI-spend, release-readiness, cost-control, roadmap, and command-room records, then delete the temporary report. Keep email delivery, native provider protection, breaker activation, and any canary as separate gates.

## 2026-07-10 CMD-029 Disabled Functions Predeploy Inventory

Date: 2026-07-10
Mode: Release read-only deployed-metadata inventory plus Manager read-only Console closure
Scope: Decide whether the Stage 5 disabled Functions deployment packet is complete without deploying, invoking Functions, accessing production data, or calling Gemini.

### Result

- Accepted as deploy-planning evidence. Local `HEAD` and upstream were both `464d404cc76f62d1640ae4ef6d1e889ca04d4095` with `0 0` ahead/behind before cloud inspection.
- Current inventory contains `generateMealPlan`, `generateRecipeEmbedding`, `parseRecipeFromImage`, and `semanticSearchRecipes` in `us-central1`, plus `billingBudgetMonitor` in `us-east1`. All are active v2 `nodejs22` Functions; the four AI paths still report `maxInstances: 20` and `concurrency: 80`.
- Deployed metadata does not contain `AI_SPEND_CIRCUIT_BREAKER_ENABLED`, so the circuit breaker is not live-enabled. `GEMINI_API_KEY` binding/version metadata exists; no secret value was accessed.
- Manager read-only Firebase Console evidence confirmed deployed Firestore rules end with a catch-all deny covering `/ops/...`. VioMacro Web App is registered for App Check with reCAPTCHA. Immutable `464d404` enforcement plus prior accepted callable smoke is sufficient for the disabled-deploy plan; post-deploy invocation proof remains blocked.

### Accepted Deploy Packet

- Future target: update the four current AI Functions and create `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend` only.
- `billingBudgetMonitor`, Hosting, rules, indexes, Storage, App Check configuration, IAM, billing, provider settings, secrets, email, and production data are excluded.
- Deployment source must be a clean worktree or equivalent immutable artifact at `464d404`, not the dirty Manager checkout. Rollback source is clean immutable `541a7f2b1fb4274e4a75894c3688ddaa88102326`.
- A code rollback does not delete the three new owner callables. They fail closed while the flag is absent/false; any deletion requires separate explicit production approval.
- Post-deploy proof is metadata-only and zero-Gemini: verify the seven selected Functions, bounded scaling, absent/false flag, safe secret-binding metadata, and untouched `billingBudgetMonitor` without invoking callables or production paths.

### Safety Boundary

- No deploy or dry-run deploy, Function/callable invocation, production app/Auth/data access, logs read, cloud mutation, Git mutation, test run, live AI/provider call, or secret-value access occurred.
- CMD-029 grants no deploy authority. The exact disabled Functions deployment remains a separate user-approved Release command.

### Manager Decision

Accept and clear CMD-029. Distill the packet into the AI spend, release-readiness, roadmap, and command-room records, then delete the temporary report. Hold all worker lanes until the user explicitly approves the narrow disabled deploy.

## 2026-07-10 CMD-028 Consolidated Stage 5 Checkpoint

Date: 2026-07-10
Mode: User-approved Release verification, Web App-only commit, and one push
Scope: Preserve the accepted Stage 5 local AI Spend Safety baseline without granting deploy or live authority.

### Result

- Accepted. Release committed exactly 27 reviewed files under `Web App/` as `464d404cc76f62d1640ae4ef6d1e889ca04d4095 chore: checkpoint ai spend safety baseline`.
- One normal push advanced `origin/codex/webapp-folder-structure-v1` from `541a7f2` to `464d404`.
- Manager independently confirmed local `HEAD` and the upstream tracking ref both equal the full `464d404cc76f62d1640ae4ef6d1e889ca04d4095` hash with `0 0` ahead/behind.

### Verification

- Exact unrestricted `npm.cmd run check` passed with app lint/build and Functions lint/build green; only existing Browserslist, mixed-import/chunking, and large-bundle warnings remained.
- Functions contracts passed 62/62 using the mocked provider; no Gemini cost was incurred.
- Staged diff check passed. All 27 staged paths were under `Web App/`; no Chef GPT, `codex_handoff.md`, environment/secret file, Firebase export, generated artifact, screenshot, test result, or temporary report was included.
- Secret-hygiene pattern hits were inspected in redacted form and classified as test/documentation placeholders, not real credentials or owner IDs.

### Safety Boundary

- Exactly one commit and one push occurred. There was no second push, amend, force-push, rebase, reset, tag, pull request, release, or GitHub Actions inspection.
- No deploy or dry-run deploy, production access/data action, Firebase/Google Cloud/AI Studio change, billing/provider cap, Prepay, email, IAM, App Check, secret/config change, prompt, live callable, token count, generation, or embedding occurred.
- The circuit breaker remains disabled and undeployed. This checkpoint grants no authority for any later Stage 5 gate.

### Manager Decision

Accept and clear CMD-028. Distill this evidence into the Git, AI spend, roadmap, release, and command-room records, then delete the temporary report. The next decision remains a separately approved disabled Functions-deploy inventory/rollback gate.

## 2026-07-10 CMD-027 Zero-Cost Gemini Spend Audit

Date: 2026-07-10
Mode: Read-only Release source audit plus Manager read-only AI Studio verification
Scope: Determine whether routine VioMacro checks incur Gemini cost and whether the live VioMacro Gemini project currently shows spend.

### Result

- Accepted. The current scripted local check/test ladder is zero-cost with respect to Gemini under its present configuration.
- Functions contracts replace `@google/genai` with a fake provider; browser AI paths are route-mocked or emulator-guarded; lint/build and rules tests do not execute provider methods.
- Manager inspected Google AI Studio through the existing signed-in session without submitting a prompt or changing a setting. Project `VioMacro` showed monthly spend `$0.00`, `Tier 1 - Postpay`, no available usage data for June 13 through July 10, 2026, and no project spend cap configured.
- AI Studio warns that cost information can take up to 24 hours to update. The evidence means no visible charge in the current reporting surface, not a permanent hard-zero guarantee.

### Cost Boundary

- Routine `check`, Functions contracts, rules tests, Playwright emulator tests, production-build emulator tests, `qa:browser`, and `qa:local` do not intentionally reach live Gemini.
- Manual Functions emulator work can reach Gemini only if `ALLOW_EMULATOR_AI_CALLS=true` is deliberately enabled with a usable provider secret. That override is not part of routine QA and remains approval-gated.
- Production AI callables can incur cost if a valid authenticated/App-Checked user invokes them. Do not exercise production AI until the remaining Stage 5 gates are approved.
- The existing Cloud Billing `$20` budget/alerts and the Gemini AI Studio project spend cap are different controls. The VioMacro Gemini project currently has no native project cap.

### Safety Evidence

- Release ran no test, build, live callable, provider API, browser, production, deploy, commit, push, or configuration action; it created only its temporary report.
- Manager's browser pass opened Projects and Spend read-only, selected VioMacro as a display filter, recorded the visible evidence, and closed the audit tab. No prompt, API key, secret, model call, cap edit, billing edit, or production-data action occurred.

### Manager Decision

Accept and clear CMD-027, distill this evidence, and delete the temporary report. Keep local checks available because they are not Gemini cost-bearing. Keep native provider protection as a P1 activation gate; no spend-cap or billing mutation is approved by this audit.

## 2026-07-10 CMD-026 Stage 5 Live-Safety Preflight

Date: 2026-07-10
Mode: Read-only Release preflight reviewed and corrected by Manager
Scope: Remaining AI Spend Safety release gates after local acceptance through CMD-025.

### Result

- Accepted as a planning-only Release pass. Stage 5 is not complete, and no release or live action is approved by this result.
- The local AI Spend Safety baseline remains disabled and undeployed. Accepted proof remains Functions contracts 62/62 plus the Manager's green post-CMD-024 `npm.cmd run check`.
- The safest next gate is one consolidated Web App-only Git checkpoint after explicit user approval. Disabled Functions deploy, email transport, native Gemini protection, activation, and the smallest live canary remain five later, separately approved gates.

### Release Findings

- The branch remains aligned with upstream at `541a7f2`, while the accepted Stage 5 source, tests, and Manager docs form a broad local dirty tree with untracked runtime files.
- Current deployed Functions revisions, live runtime environment, App Check posture, owner configuration, secret version, production `/ops` state, and Gemini billing/backstop state were intentionally not inspected and remain cloud-only unknowns.
- The local email outbox is deterministic server state only; it has no delivery transport. Any email provider or Firebase extension requires a separate design/configuration packet and an adapter compatible with the current outbox schema.
- Current official Gemini documentation independently confirms `gemini-3.5-flash` is a stable model at the locally recorded Standard prices. Prepay and experimental project spend caps are useful provider-side layers, but both can have roughly ten minutes of billing latency and cannot be represented as an exact invoice ceiling.
- Semantic search remains outside the smallest canary because its live vector-index state is a separate unresolved gate.

### Manager Corrections

- A Functions rollback must be prepared from an isolated clean worktree or equivalent known-good source artifact. Do not switch this dirty checkout with `git checkout <old-commit>`.
- Before any Functions-only deploy, Release must capture the current deployed Functions inventory and verify the deployed Firestore rules posture read-only. Local `HEAD` already has a catch-all deny for unmatched paths, and the new explicit `/ops` rule is defense in depth, but deployed state must not be inferred from local Git.
- A disabled deploy must confirm `AI_SPEND_CIRCUIT_BREAKER_ENABLED` is absent or false and must stop on any unexpected `/ops` write or Gemini request.
- Git checkpoint approval does not imply deploy approval. Email, provider backstop, activation, and canary approval may not be bundled into the checkpoint or disabled-deploy packet.

### Safety Boundary

- CMD-026 created only its temporary report. It ran no tests, browser smoke, deploy/dry-run, authenticated production access, production data read/write, email send, provider configuration, live Gemini call, commit, or push.
- Manager distilled the accepted evidence here and into the owning contracts/roadmap before deleting the temporary report.

### Manager Decision

Accept and clear CMD-026. Hold the worker queue at standby until the user explicitly approves one consolidated Web App-only checkpoint command. Stage 5 remains open after that checkpoint and must proceed through the five later approval packets in order.

## 2026-07-10 CMD-022 Through CMD-025 AI Spend Recovery Closure

Date: 2026-07-10
Mode: Bugfix, Manager adversarial review, independent QA, narrow correction, and final independent QA
Scope: `BUG-026` stale reservation recovery, provider-start lifecycle, malformed/open-reservation integrity, and stored-document reconciliation authority.

### Result

- Accepted locally. `BUG-026` is closed for the code-owned local backend scope.
- The circuit breaker remains disabled and undeployed. This closure does not approve email delivery, native provider controls, cloud configuration, production access, activation, or live Gemini.
- Final Functions contracts passed 62/62, and the exact post-CMD-024 `npm.cmd run check` passed outside the known restricted Vite boundary with app and Functions lint/build green.

### Evidence Sequence

- CMD-022 introduced `reserved` and `provider_started` lifecycle states, a five-minute pre-provider lease, a conservative 65-minute provider-started lease, transactional recovery, and provider-start claims immediately before all four paid Gemini calls. Recipe Import keeps non-billed token counting before the claim.
- Manager rejected the first 58/58 implementation because an expiry-field query could not see an open reservation with a missing or wrong-type lease. The correction used a bounded `status in [reserved, provider_started]` integrity scan with `limit(11)`, blocked malformed/missing leases across different request IDs, captured one owner-status clock, and passed 60/60.
- CMD-023 independently passed the recovery matrix at 60/60 but found that reconciliation mixed stored reservation data with caller-handle feature, fallback amount, and audit identity. Manager kept BUG-026 open.
- CMD-024 reproduced the gap: mismatched provider-start handles were accepted and a forged reconciliation handle could bill one micro instead of the stored pricing result. It added canonical path/handle validation before provider start, returned a canonical stored-data handle, and made parsed stored reservation data authoritative for pricing, fallback billing, reserved subtraction, pause calculation, email payload, and audit identity.
- CMD-024 passed 62/62 Functions contracts. Manager's exact post-change unrestricted `check` exited 0; only existing Browserslist/import/chunk warnings remained.
- CMD-025 independently passed 62/62, reviewed every authority and recovery row, found no new defect, and confirmed the prior lifecycle, lease, malformed/missing-lease, 10/11 boundary, disabled zero-query, terminal idempotency, and race tests stayed green.

### Final Boundary

- Expired `reserved` work closes without charge only when the transaction proves provider start never occurred.
- Expired `provider_started` work is charged conservatively at the full stored reservation amount.
- A malformed open lifecycle set, query failure, aggregate mismatch, or caller/stored-handle mismatch fails closed before a new provider call.
- Terminal requests remain idempotent and cannot start a second provider call or double-account.
- No deploy, production mutation, email send, live token count, generation, embedding, commit, or push occurred in CMD-022 through CMD-025.

### Manager Decision

Accept and clear CMD-022 through CMD-025, close BUG-026 for local code-owned behavior, and delete the four temporary reports after this evidence is recorded in the QA ledger, bug ledger, AI spend contract, roadmap, and command room. Keep disabled deploy proof, email delivery, native provider backstop, activation, and live canary as separate Release/approval gates.

## 2026-07-10 CMD-018 Through CMD-021 AI Spend Safety UI Closure

Date: 2026-07-10
Mode: Builder, Manager review, Bugfix, and independent QA closure
Scope: Owner Settings AI Spend Safety workflow, client callable request IDs, combined backend/UI regression, and correction of BUG-027/BUG-028.

### Result

- Accepted locally. The disabled AI spend circuit-breaker backend, owner Settings workflow, and client request-ID slice passed independent combined QA after one narrow correction batch.
- `BUG-027` inactive-tab owner-status traffic and `BUG-028` mobile Settings tab clipping are closed with source, automated, and screenshot proof.
- The feature remains disabled, undeployed, and mocked/emulator-only. This closure does not approve email transport, provider/native-cap setup, Functions/rules deploy, activation, production access, or live Gemini.
- `BUG-026` stale-reservation recovery remains the next P2 activation blocker.

### Evidence Sequence

- CMD-018 Builder added sanitized owner status fields, the Settings AI Safety panel, pause/resume confirmation and refetch behavior, and browser-crypto request IDs for Meal Plan, Recipe Import, and semantic search. Manager corrections made permission errors recognize `functions/permission-denied`, cleared stale authority after mutation/refetch failure, clarified email-history labeling, and kept tests deterministic.
- CMD-018 proof passed Functions contracts 50/50, focused AI Safety 4/4, request-ID coverage 1/1, and the unrestricted app/Functions check. Desktop/mobile active and paused screenshots showed readable AI Safety content.
- CMD-019 independently accepted the source, backend, request-ID, and focused UI boundaries but rejected the full gate at 65/66. It found eager `getAiSpendStatus` calls from a CSS-hidden panel (`BUG-027`) and clipped `Integrations` text at 390x844 (`BUG-028`).
- CMD-020 conditionally mounted `AiSpendSafetyPanel` only after the AI Safety tab becomes active and changed the mobile tab strip to a stable two-column layout. Targeted Settings passed 7/7, AI Safety passed 5/5, the unrestricted check passed, and the full emulator suite passed 67/67. The corrected 390x844 screenshot showed all four labels fully readable.
- CMD-021 independently reviewed the source/test boundaries, found no global test-only bypass, inspected the corrected screenshot, and passed one unfiltered local emulator suite 67/67 in 3.5 minutes.
- Named final QA lines passed: old Settings save, inactive-tab/mobile guard, four AI Safety state/fail-closed tests, and three-path request-ID coverage.
- Final `git diff --check` exited 0 with Windows line-ending warnings only.

### Safety Boundary

- No live Gemini, email provider, token-count, production URL/account/data, deployment, rollback, billing/IAM/App Check/provider configuration, commit, or push action occurred in CMD-018 through CMD-021.
- No client reads `/ops/...`; owner identity and operational spend state remain server-authorized and sanitized.
- Non-AI VioMacro behavior remains available while the future gate is paused.

### Manager Decision

Accept and clear CMD-018 through CMD-021, close BUG-027 and BUG-028, graduate the local Settings AI Safety extension, and delete the four temporary reports after this durable entry and the owning contracts/ledgers are updated. Keep BUG-026 and every live/deploy/activation gate open.

## 2026-07-10 CMD-019 AI Spend Safety Combined QA

Date: 2026-07-10
Mode: Independent QA lane report reviewed by Manager
Scope: Combined local verification of the disabled CMD-016 through CMD-018 AI spend circuit-breaker backend, owner Settings UI, and client request-ID wiring.

### Result

- Not accepted as fully green. QA passed the financial boundary and focused AI Safety evidence, but the full emulator suite finished 65/66 because the new AI Safety panel issued status calls while its Settings tab was inactive.
- Functions contracts passed 50/50, the exact unrestricted `npm.cmd run check` passed, focused AI Safety passed 4/4, and the three client callable request-ID paths passed inside the full suite.
- Existing Settings macro/nutrition, save-failure, discard, and profile tests passed. `user can save settings changes` failed its network-failure collector after two aborted unmocked `getAiSpendStatus` requests.
- The four active/paused desktop/mobile screenshots showed readable AI Safety content. Both 390x844 screenshots clipped the final `Integrations` tab label.

### Manager Classification

- `BUG-027` is a P2 Settings integration regression: `AiSpendSafetyPanel` is mounted inside a CSS-hidden inactive section, so its mount effect performs owner-status network work on ordinary Settings visits.
- `BUG-028` is a P3 responsive Settings-shell defect: the mobile tab row does not keep every label fully visible.
- `BUG-026` remains an unchanged P2 activation blocker for stale AI spend reservations.
- The positive CMD-019 backend, request-ID, focused UI, and source-boundary evidence is accepted and need not be repeated unless the correction changes those surfaces.

### Safety Boundary

- QA created only `docs/qa/CMD-019-qa-ai-spend-safety-combined-report-2026-07-09.md`.
- No app/test/Functions/rules/configuration file was changed by QA, and no live Gemini, email, provider, cloud, production, deploy, commit, or push action occurred.

### Manager Decision

Keep CMD-018/CMD-019 unresolved and open `CMD-020` as one narrow Bugfix batch for `BUG-027` and `BUG-028`. Require targeted red/green proof plus a fully green local emulator suite before independent QA rechecks the corrected slice.

## 2026-07-09 CMD-017 AI Spend Circuit Breaker Backend QA

Date: 2026-07-09
Mode: Independent QA lane report reviewed and accepted by Manager
Scope: Evidence-only local verification of the default-disabled CMD-016 backend core before any owner Settings UI work.

### Result

- Accepted. QA marked all 16 backend matrix rows passed and found no new P0/P1/P2/P3 backend defect.
- The circuit breaker remains disabled, undeployed, and unconnected to any live provider or production control.
- `BUG-026` stale-reservation recovery remains a P2 activation blocker. Manager accepts its deferral only for the next mocked, local, non-live UI batch.
- Frontend request-ID wiring remains a required activation dependency and is assigned with the Settings UI batch.

### Independent Evidence

- Functions contract suite passed 46/46 with mocked/local provider behavior only.
- Functions lint and TypeScript build passed.
- The direct rules script failed only because `firebase` was not on PATH; the required Firebase CLI fallback passed 20/20, including deny-all `/ops/...` proof.
- Exact `npm.cmd run check` hit the known restricted-sandbox Vite ancestor-read boundary, then passed through the unrestricted local rerun with only existing Browserslist, import-chunking, and large-bundle warnings.
- QA independently inspected disabled-mode behavior, all four gate orderings, exact pricing/policy values, threshold and concurrency behavior, request and owner idempotency, Recipe Import provider-count handling, malformed-state/metadata behavior, pause/outbox behavior, Pacific rollover, owner authorization, App Check posture, scaling, and no-network test isolation.
- No browser was required because CMD-017 had no UI surface.

### Safety Boundary

- QA created only the required temporary report.
- No source, test, rules, configuration, command-room, ledger, contract, roadmap, or Chef GPT file was changed by QA.
- No live Gemini/token-count call, production URL/account/data access, email setup, deploy, commit, push, billing/provider/IAM/App Check/secret change, or production mutation occurred.

### Manager Decision

Accept and clear CMD-017. Open `CMD-018` as a local Builder batch for the owner AI Spend Safety section in Settings, sanitized status fields required by that UI, and client request-ID wiring. Keep `BUG-026`, email transport, deploy, activation, provider backstop, and live canary outside that batch.

## 2026-07-09 CMD-016 AI Spend Circuit Breaker Backend Core

Date: 2026-07-09
Mode: Builder implementation report reviewed by Manager with independent source and local verification
Scope: Disabled, local-only backend core for the AI-only `$20` allowance, automatic pause, email-outbox event, and owner-only status/pause/resume controls.

### Result

- Accepted as sufficient to enter independent focused QA. This does not approve UI work, email transport, deploy, activation, live Gemini, provider configuration, or any production/cloud mutation.
- `AI_SPEND_CIRCUIT_BREAKER_ENABLED` remains false by default, so the current client contract and provider path remain unchanged unless a later approved activation deliberately enables the gate.
- The shared server gate covers Meal Plan generation, Recipe Import, recipe embedding generation, and semantic-search embeddings before paid provider execution.

### Accepted Architecture

- Versioned integer-micros pricing is tied to exact configured model IDs and fails closed on model or saved-pricing mismatch.
- Firestore transactions reserve conservative per-feature cost before provider execution, enforce the exact allowance-minus-reserve boundary, prevent concurrent use of one final slot, and reconcile supported usage metadata afterward.
- Recipe Import reserves first, then uses mocked provider token counting on the exact multimodal contents; missing, malformed, zero, or over-limit counts close the reservation without charge before generation.
- Callable retries require validated, UID/feature-namespaced request IDs only when the breaker is enabled. Owner mutation keys are validated and namespaced separately.
- Automatic active-to-paused transitions create deterministic audit and email-outbox records. Manual pause is preserved during later reconciliation, and owner resume adds exactly one `$20` tranche only from a paused state.
- `/ops/{document=**}` is explicitly denied to every client. Owner status and mutation surfaces remain authenticated, App-Checked outside the emulator, and server-authorized through `OWNER_UIDS`.
- Present malformed usage fields, contradictory totals, and ambiguous thinking fields keep the full conservative reservation instead of permitting an undercharge.

### Verification

- Manager independently ran `npm.cmd --prefix functions run test:contracts`: 46/46 passed with mocked/local provider and Firestore behavior only.
- Manager independently ran Functions lint and build: both passed.
- Manager independently ran the Firestore emulator rules suite through the Firebase CLI fallback: 20/20 passed, including deny-all client access to `/ops/...`.
- Manager independently reran exact `npm.cmd run check` outside the known restricted-sandbox Vite boundary after the final correction: app lint/build and Functions lint/build passed. Existing Browserslist, mixed-import, and large-chunk warnings remain non-blocking.
- `git diff --check` found no whitespace errors; only expected Windows line-ending warnings were printed.
- No browser check was required because CMD-016 adds no UI. No live Gemini, email delivery, production sign-in, or production data path was exercised.

### Residual Risks And Boundaries

- Stale `reserved` recovery after a process crash is not implemented and is tracked separately as `BUG-026`; it must be resolved or explicitly accepted before live activation.
- Real email transport, owner Settings UI, frontend request-ID wiring, disabled deployment proof, provider backstop review, activation, and live canary remain separate approval-gated stages.
- The pricing snapshot is a conservative application estimate, not a guaranteed Cloud Billing invoice cap.

### Manager Decision

Accept and clear CMD-016. Open `CMD-017` for independent backend-core QA before any owner Settings UI batch. Keep the gate disabled and all production/live actions blocked.

## 2026-07-09 CMD-015 AI Spend Circuit Breaker Preflight

Date: 2026-07-09
Mode: Release lane report reviewed and accepted by Manager with corrections
Scope: Read-only Stage 5 preflight for an AI-only `$20` allowance, automatic pause, owner email event, and owner-only resume workflow.

### Result

- Accepted as sufficient to start a disabled local backend implementation.
- Project-wide billing unlink remains rejected for Stage 5 because it would affect non-AI Firebase/Google Cloud services.
- The product contract is an application allowance, not a guaranteed invoice cap: VioMacro pauses before the next unsafe Gemini call while the rest of the app remains available.
- Current Console-only Gemini plan/cap, auto-reload, budget-detail, billing-link, and IAM facts remain unverified. They do not block local mocked implementation and remain required before any live activation.

### Current Evidence

- Four Gemini paths exist and require one shared gate: `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, and `semanticSearchRecipes`.
- Existing owner/default limits count requests but do not atomically reserve spend.
- Deployed AI Functions are active 2nd gen Node 22 Functions and reported `maxInstances: 20`, `concurrency: 80`, and the default Compute Engine service-account pattern.
- `billingBudgetMonitor` remains active and alert-only; it has no Cloud Billing unlink path.
- No transactional email package/outbox exists, and the read-only Firebase Extensions list was empty.
- Current model defaults are `gemini-3.5-flash` and `gemini-embedding-2`.
- Current official pricing and API docs support input/output/thinking/cached token accounting, token counting, usage metadata, output-token limits, and modality-sensitive embedding pricing.

### Manager Architecture Decisions

- Store spend in integer micros and use a transactional, idempotent reservation before provider execution.
- Initial allowance: `$20.00`; owner resume adds exactly another `$20.00`; period safety reserve: `$1.00`.
- Period rollover follows the Cloud Billing calendar month at 12:00 AM US/Canadian Pacific Time, never browser time.
- Meal Plan: reserve `$0.10`, cap input at 30,000 tokens, and cap output at 4,096 tokens.
- Recipe Import: preserve the existing 10 MB file limit, cap provider-counted input at 100,000 tokens, reserve `$0.25`, and cap output at 4,096 tokens.
- Embedding generation and semantic-search embedding: reserve `$0.01` per operation.
- `/ops/...` is a server-only operational-data exception. Firestore rules deny every client read/write; sanitized owner status and actions use Auth/App Check callables.
- Real email transport is deferred. Builder creates only an idempotent server-owned outbox abstraction; SMTP/Trigger Email setup remains a separate Release approval.
- A native Gemini cap is an independent emergency backstop. The report's `$25-$30` suggestion was rejected because it would interrupt a complete second `$20` allowance. `$50` is only a later Console-review candidate, not an approved setting.

### Scope Control

- Release added only the temporary CMD-015 report.
- No billing, Gemini, email, IAM, Firebase configuration/rules/index, provider, production-data, deploy, rollback, commit, push, or live-AI mutation occurred.
- The temporary CMD-015 report was deleted only after this ledger and the AI spend contract preserved the accepted evidence and corrections.

### Manager Decision

Accept and clear CMD-015. Open `CMD-016` as a backend-only Builder batch: disabled local spend policy, atomic reservation/reconciliation, all-path gate, idempotent pause/outbox state, owner callables, deny-all `/ops` rules, and focused tests. Settings UI and real email delivery remain later batches.

## 2026-07-09 CMD-014 Hosting-Only Deploy And Signed-Out Smoke

Date: 2026-07-09
Mode: Release lane report reviewed and accepted by Manager
Scope: User-approved Firebase Hosting-only deploy of checkpoint `541a7f2`, followed by signed-out/read-only production smoke.

### Pre-Deploy Evidence

- Local `HEAD` and `origin/codex/webapp-folder-structure-v1` both resolved to `541a7f2b1fb4274e4a75894c3688ddaa88102326`.
- The only dirty tracked files were the six Manager-owned coordination/evidence docs; no runtime, test, Firebase, package/env, build-config, Chef GPT, or `codex_handoff.md` file was dirty.
- Accepted CMD-013 supplied the fresh full regression gate for the exact checkpoint: app and Functions checks passed, public E2E 18/18, authenticated emulator E2E 61/61, and production-build emulator E2E 4/4.
- A fresh `npm.cmd run build` passed outside the known restricted-sandbox Vite boundary and regenerated `dist` with `index-CfEJ2ulV.css` and `index-BdOrOwLI.js`.
- `firebase.json` still served `dist` with the SPA rewrite to `/index.html`, `.firebaserc` still targeted `viomacro`, and no Hosting Functions/Cloud Run rewrite or `pinTag` was present.
- The pre-deploy rollback target was captured as version `ed0f58dc8bbc9796`, release `1782584943034000`, released `2026-06-27T18:29:03.034Z`.

### Deploy Evidence

- Release ran the exact approved command: `npx.cmd --yes firebase-tools deploy --only hosting --project viomacro -m "Hosting-only deploy from codex/webapp-folder-structure-v1 541a7f2"`.
- Firebase CLI reported a successful Hosting-only upload, version finalization, and live release at `https://viomacro.web.app`.
- The new live version is `0d45e0cec1e830e8`, release `1783629623146000`, released `2026-07-09T20:40:23.146Z` with the expected checkpoint message.
- Manager independently reran read-only live-channel metadata and confirmed the same version, release, release time, finalized status, SPA rewrite, and deploy message.
- The preserved rollback target remains `ed0f58dc8bbc9796`; no rollback or Hosting clone was needed or run.

### Signed-Out Smoke

- Release smoke loaded `/auth` with HTTP 200, a nonblank app, private-alpha copy, email/password inputs, enabled `Log In` and `Create Account`, disabled Google sign-in, and disabled password reset.
- Signed-out `/plan` resolved to `/auth` and rendered the same controls without a blank shell or route blocker.
- Release reproduced the previously classified third-party reCAPTCHA/App Check 403/abort noise from closed `BUG-021`; it did not block Auth rendering or redirect behavior.
- Manager independently repeated the read-only smoke in a fresh in-app browser: `/auth` exposed the expected controls, `/plan` resolved to `/auth`, and that browser capture contained no warning/error log entries.

### Scope Control And Residual Risk

- No commit, push, branch change, authenticated production smoke, production data mutation, live AI, valid Gemini smoke, semantic vector index, rollback, Functions/rules/index deploy, Firebase/App Check/provider/billing/secret change, or Chef GPT work occurred.
- The new release has signed-out production proof plus full local authenticated emulator proof. Authenticated production workflows were not rerun after this deploy and remain separately approval-gated.
- Known build warnings and environment-dependent reCAPTCHA/App Check noise remain non-blocking watch items. No new P0/P1 or rollback trigger was found.
- The temporary CMD-014 report was deleted only after this durable evidence was recorded.

### Manager Decision

Accept and clear CMD-014. Mark Stage 4 complete: Firebase Hosting now serves the build generated from checkpoint `541a7f2` as version `0d45e0cec1e830e8`, signed-out smoke passed, and no rollback is recommended. Stage 5 cost/live-AI safety remains a separate Manager/user decision.

## 2026-07-09 CMD-013 Fresh Pre-Deploy Local Regression

Date: 2026-07-09
Mode: QA lane report reviewed and accepted by Manager
Scope: Fresh full local pre-deploy regression against pushed checkpoint `541a7f2`.

### Evidence

- Local `HEAD` and `origin/codex/webapp-folder-structure-v1` both resolved to `541a7f2b1fb4274e4a75894c3688ddaa88102326` before the gate.
- The first `npm.cmd run qa:local` attempt failed before app verification at the known restricted Windows sandbox Vite/esbuild ancestor-read boundary. QA reran the exact command outside that sandbox as authorized by CMD-013.
- The outside-sandbox `qa:local` run passed with app lint/build and Functions lint/build green.
- Public E2E passed 18/18, authenticated emulator E2E passed 61/61, and production-build emulator E2E passed 4/4.
- Both emulator legs selected `_local\\firebase\\exports\\firebase-export-1782525385123HUjsoD`.
- Manager independently confirmed `HEAD`/upstream equality and all three ignored Playwright `.last-run.json` manifests reported `passed` with no failed tests.

### Classification And Residual Risk

- No app or test regression was found. The sandbox failure is environment-only and not a release blocker.
- Known non-blocking warnings remain: stale Browserslist data, mixed static/dynamic imports, a large minified JavaScript chunk, local Git/global-ignore and line-ending warnings, and normal emulator runtime warnings.
- This was automated local proof, not a new manual production-browser pass. It does not prove checkpoint `541a7f2` is currently deployed.
- No new bug-ledger item was opened.

### Scope Control

- QA changed no app source, tests, configs, Firebase files, package/env files, ledgers, roadmap, command room, Chef GPT files, or production systems.
- No production URL/account, deploy, rollback, production mutation, live AI, semantic vector index, valid Gemini smoke, rules/index/Functions change, provider change, or billing change was used.
- The temporary CMD-013 report was deleted only after this durable evidence was recorded.

### Manager Decision

Accept and clear CMD-013. Checkpoint `541a7f2` has fresh local pre-deploy proof; any Hosting-only deploy remains blocked until the user gives separate explicit approval.

## 2026-07-09 CMD-012 Stable Hosting Runbook Checkpoint

Date: 2026-07-09
Mode: Release lane report reviewed and accepted by Manager
Scope: User-approved commit and push of the six stable CMD-011 Hosting runbook and ledger documents.

### Result

Accepted. Release committed and pushed exactly the approved six-file checkpoint.

### Commit / Push

- Commit: `541a7f2 docs: checkpoint hosting deploy rollback runbook`
- Branch: `codex/webapp-folder-structure-v1`
- Push range: `ae9c8f1..541a7f2`
- Manager independently confirmed local `HEAD` and upstream both resolve to full commit `541a7f2b1fb4274e4a75894c3688ddaa88102326`.

### Exact Commit Scope

- `docs/app-contract-roadmap.md`
- `docs/bug-ledger.md`
- `docs/git-checkpoint-contract.md`
- `docs/pre-hosting-readiness.md`
- `docs/production-deploy-readiness-contract.md`
- `docs/qa-ledger.md`

### Verification

- Scoped `git diff --check` and staged `git diff --cached --check` passed; only expected line-ending/global-ignore warnings appeared.
- Secret-pattern review of the six-file diff returned zero key, token, private-key, or generic secret-assignment hits.
- Manager independently inspected `git show --name-status --format=fuller --stat 541a7f2` and confirmed exactly the six approved documents.
- `command-room.md` and `manager-roadmap-checklist.md` remained unstaged because they are live Manager coordination files.
- The repo has no `.github/workflows`, GitHub Actions configuration, or Git LFS configuration, so this push did not trigger repository-defined Actions or LFS usage.

### Scope Control

- No app runtime, tests, Firebase config/rules/indexes/Functions, package/env/build files, Chef GPT files, `codex_handoff.md`, ignored local artifacts, or secrets were committed.
- No deploy, rollback, Hosting clone, production sign-in/mutation, live AI, semantic-search index, provider setting, billing, or Firebase configuration change occurred.
- The temporary CMD-012 report was deleted only after this durable evidence was recorded.

### Manager Decision

Accept and clear CMD-012. Open QA CMD-013 for fresh full local regression evidence before any separate Hosting deploy approval decision.

## 2026-07-09 CMD-011 Hosting-Only Deploy And Rollback Runbook

Date: 2026-07-09
Mode: Release lane report reviewed and accepted by Manager
Scope: Plan-only, read-only resolution of `BUG-025` before any next Hosting deploy.

### Result

Accepted. Release produced an operational Hosting-only deploy and rollback runbook without deploying, rolling back, cloning a version, signing in to production, mutating production data, or running live AI.

### Verification

- Branch `codex/webapp-folder-structure-v1` and upstream were aligned at `ae9c8f1` before the Manager opened CMD-011; the only later dirty files were Manager-owned assignment/distillation docs and the temporary report.
- `firebase.json` serves `dist` with a static SPA rewrite to `/index.html`; no Functions/Cloud Run Hosting rewrite and no `pinTag` exists.
- Release verified current official Firebase Hosting deploy, Console rollback, and version-clone procedures from Firebase documentation dated/accessed 2026-07-09.
- Read-only `hosting:sites:list` and `hosting:channel:list` checks identified site `viomacro`, live version `ed0f58dc8bbc9796`, release `1782584943034000`, and release time `2026-06-27T18:29:03.034Z`.
- Manager independently reran `npx.cmd --yes firebase-tools hosting:channel:list --site viomacro --project viomacro --json` and confirmed the same live version/release metadata.
- The installed CLI did not support `hosting:releases:list`; this is non-blocking because `hosting:channel:list` exposes the current live version and Firebase Console provides release-history rollback.

### Durable Outcome

- `docs/production-deploy-readiness-contract.md` now contains the pre-deploy gate, Hosting-only command, Console and CLI rollback paths, smoke ladder, and rollback triggers.
- `docs/pre-hosting-readiness.md` now reflects that Hosting is already live and requires a fresh live-version capture before any next deploy.
- `docs/git-checkpoint-contract.md` now reflects the current branch/checkpoint state.
- `BUG-025` is closed in `docs/bug-ledger.md`.

### Scope Control

- No Hosting deploy, rollback, clone, preview-channel change, Functions/rules/index/config change, production sign-in, production data mutation, live AI, semantic index work, stage, commit, or push occurred.
- The temporary CMD-011 worker report was deleted only after this ledger and the release contracts held the accepted evidence.

### Manager Decision

Accept and clear CMD-011. The next decision is whether to keep production intentionally held or ask the user for explicit approval to open a separate Hosting-only deploy command. CMD-011 itself is not deploy approval.

## 2026-07-08 CMD-010 Release Readiness Refresh

Date: 2026-07-08
Mode: Release lane report reviewed and accepted by Manager
Scope: Stage 4 report-only release readiness refresh after accepted Stage 2 local regression and Stage 3 browser/manual private-alpha QA.

### Result

Accepted as a report-only Release readiness refresh. Release found no confirmed P0/P1 release blocker, did not deploy, and did not mutate production.

### Verification

- Release confirmed current branch: `codex/webapp-folder-structure-v1`.
- Release reported local `HEAD` and upstream `origin/codex/webapp-folder-structure-v1` both at `053c956`.
- Manager spot-check confirmed branch and upstream are both `053c956`.
- Release reported latest relevant pushed Web App checkpoints:
  - `053c956 docs: checkpoint web app docs drift cleanup`
  - `5503240 chore: checkpoint web app private-alpha roadmap fixes`
- Release performed signed-out/read-only production Hosting checks against `https://viomacro.web.app/auth` and reported `200 OK`.
- Manager spot-check reran the signed-out/read-only `HEAD` request outside the restricted sandbox and confirmed `200 OK`.

### Production Currentness

Production Hosting is live and reachable, but cannot be proven current to branch `codex/webapp-folder-structure-v1` from this report-only pass. The last documented Hosting deploy remains 2026-06-27, while later accepted Web App checkpoints exist on the pushed branch.

Release classification accepted by Manager: production Hosting is likely behind the current pushed branch or intentionally held pending a separate user-approved Hosting deploy.

### Release Findings

- P2 Release Readiness: Production Hosting is reachable but not provably current to the pushed branch.
- P2 Release Process: Rollback readiness is required by docs, but the exact Firebase Hosting rollback command/procedure is not operationally explicit enough for the next deploy lane.
- P3 Deferred Risk: Hard billing cutoff remains deferred; alert-only controls are acceptable for private alpha but not a true spend cap.
- P3 Deferred Risk: `BUG-024` remains watchlist-only after CMD-009 found no native dialogs in scoped local daily-use browser QA.

### Scope Control

- Release created only the required report file.
- Release did not stage, commit, push, deploy Hosting, deploy Functions, deploy rules/indexes, change Firebase config/App Check/API restrictions/provider settings/billing settings, run live AI, create semantic-search vector indexes, run authenticated production smoke, mutate production data, touch Chef GPT files, or touch `codex_handoff.md`.
- Manager distilled this report into this ledger and `docs/bug-ledger.md`, then deleted the temporary report file.

### Manager Decision

Accept and clear CMD-010. Next recommended lane: open a separate Release command to prepare a precise Hosting-only deploy plan and rollback procedure. That next command should still stop before any deploy until the user explicitly approves deploy.

## 2026-07-08 CMD-009 Stage 3 Browser/Manual Private-Alpha QA Pass

Date: 2026-07-08
Mode: Manager-performed Stage 3 browser/manual QA after user requested this phase stay in the Manager chat
Scope: Current local app state, user-visible private-alpha daily-use flows, Firebase emulators, no production mutation.

### Result

Passed for the scoped local browser/manual private-alpha pass. No P0/P1 issues were found.

### Local Target

- App target: `http://127.0.0.1:5173/`
- Firebase emulators: Auth, Functions, Firestore, Hosting, Storage, Extensions.
- Emulator import: `_local\firebase\exports\firebase-export-1782525385123HUjsoD`.
- Test user: `cmd009.1783483162754@example.com` in local emulator Auth.
- Browser harness artifact: `_local/qa/cmd009-manual/cmd009-manual-qa-result.json`.

### Verification

- Auth private-alpha entry passed: Google sign-in was disabled with Coming Soon labeling.
- Signup and authenticated Dashboard landing passed.
- Onboarding skip passed: `Skip Setup` dismissed the onboarding wizard.
- Dashboard passed: macro and hydration cards rendered.
- Meal Planner route passed at `/plan`.
- Recipe Library browse/search passed: Recipes loaded and search accepted input.
- Recipe Import safe state passed: import route rendered without invoking live AI or uploading a file.
- Grocery quick add passed with local/emulator item `cmd009 apples`.
- Settings route passed.
- Progress / History route passed.
- Pantry honest deferred state passed.
- Mobile navigation shell passed: mobile drawer opened, navigated to Grocery List, and moved offscreen after navigation.

### Console / Network / Dialog Evidence

- Console errors: none captured.
- Network failures: none captured.
- Page errors: none captured.
- Native dialogs: none captured.

### Artifacts

- `_local/qa/cmd009-manual/01-auth.png`
- `_local/qa/cmd009-manual/02-dashboard.png`
- `_local/qa/cmd009-manual/03-meal-plan.png`
- `_local/qa/cmd009-manual/04-recipes-search.png`
- `_local/qa/cmd009-manual/05-recipe-import.png`
- `_local/qa/cmd009-manual/06-grocery-added.png`
- `_local/qa/cmd009-manual/07-settings.png`
- `_local/qa/cmd009-manual/08-progress.png`
- `_local/qa/cmd009-manual/09-pantry.png`
- `_local/qa/cmd009-manual/10-mobile-grocery-nav.png`

### Warnings / Setup Notes

- First sandboxed emulator and Vite starts failed before app verification due local sandbox/tooling constraints. Rerunning outside the restricted sandbox started the local dev target and Firebase emulators successfully.
- Firebase emulator startup warned that Functions node version `22` did not match host node `24`; this did not block the scoped browser pass.
- Existing stale Browserslist/caniuse-lite warning appeared during local server startup.

### Scope Control

- No app runtime code, tests, Firebase rules/indexes/Functions/config, package/env files, Chef GPT files, `codex_handoff.md`, deploys, live AI, semantic vector index, valid Gemini provider smoke, production data, commit, or push were touched.
- This was local browser/manual evidence, not a production Hosting smoke and not a live AI/provider validation.

### BUG-024 Native Dialog Recommendation

Keep `BUG-024` watchlist-only. CMD-009 found no native dialogs and no mobile/dialog trap in the scoped daily-use pass, but it did not intentionally exercise every known native alert/prompt path enough to close the watchlist item.

### Remaining Risks

- Production Hosting may still be behind the pushed branch until Release verifies and, if approved, deploys.
- Live AI, semantic search/vector index, billing hard cutoff, Functions deploy, Firebase rules/index changes, production data mutation, and valid Gemini provider smoke remain approval-gated.
- This pass complements, but does not replace, Stage 2 automated regression evidence.

## 2026-07-08 CMD-008 Stage 2 Broad Local Regression Gate

Date: 2026-07-08
Mode: QA lane report reviewed and accepted by Manager
Scope: Stage 2 broad local regression gate after accepted Stage 1 docs cleanup and checkpoint.

### Result

Accepted. The broad local regression gate passed after rerunning outside the restricted sandbox.

### Verification

- First `npm.cmd run qa:local` attempt failed before app verification due restricted sandbox ancestor-read access while loading Vite config. Classified as environment/sandbox issue, not an app regression.
- Rerun outside the restricted sandbox passed with exit code 0.
- `npm run check`: passed app lint, app TypeScript/build, Functions lint, and Functions build.
- `npm run test:e2e`: passed 18/18.
- `npm run test:e2e:emulator`: passed 61/61.
- `npm run test:e2e:prod-emulator`: passed 4/4.
- Manager spot-checked generated `.last-run.json` files for public, emulator, and prod-emulator test-result folders; all reported `status: passed`.

### Emulator Export Path

- QA confirmed no explicit `VIOMACRO_FIREBASE_EMULATOR_IMPORT` or `FIREBASE_EMULATOR_IMPORT` override was present.
- Emulator legs logged import from `_local\firebase\exports\firebase-export-1782525385123HUjsoD`.
- Classification: passed; current emulator tests used the newest local export path under `_local/firebase/exports/`.

### Warnings

- Known build hygiene/performance warnings remain: stale Browserslist/caniuse-lite data, mixed dynamic/static import chunking warnings, and large bundle size warning.
- Known environment/runtime warnings remain: `NO_COLOR` ignored because `FORCE_COLOR` is set, Firebase emulator Java deprecation warning, and expected Firestore emulator shutdown `SIGINT`.
- No app/test failures occurred in the successful gate.

### Scope Control

- QA created only the temporary report file and updated ignored local QA artifacts under `_local/qa/`.
- QA did not edit app runtime code, tests, configs, ledgers, command room, roadmap, Firebase files, package/env/build files, Chef GPT files, `codex_handoff.md`, or production data.
- No commit, push, deploy, live AI, semantic vector index, billing hard cutoff, Firebase rules/index/config deploy, Functions deploy, Hosting deploy, production mutation, or valid Gemini provider smoke occurred.

### Notes

- This was automated local regression proof, not manual browser/private-alpha UX proof.
- Production Hosting may still be behind the pushed branch until a later explicitly approved Release deploy command.
- `BUG-024` remains watchlist-only; CMD-008 did not materially strengthen it into a confirmed blocker.
- The temporary CMD-008 QA report was deleted after this durable ledger entry and command-room decision note captured the outcome.

## 2026-07-08 CMD-007 Web App Docs-Cleanup Checkpoint Commit And Push

Date: 2026-07-08
Mode: Release lane report reviewed and accepted by Manager
Scope: User-approved Web App docs-cleanup checkpoint commit and push for accepted `CMD-006` / `BUG-023`.

### Result

Accepted. Release staged only the approved docs-cleanup scope, committed it, and pushed the current branch.

### Commit / Push

- Commit: `053c956 docs: checkpoint web app docs drift cleanup`
- Branch: `codex/webapp-folder-structure-v1`
- Push: succeeded to `origin/codex/webapp-folder-structure-v1`
- Remote range reported by Release: `5503240..053c956`

### Scope Control

- Included: `Web App/README.md` and `Web App/docs/`.
- Excluded: `Chef Professional AI GPT/`, `codex_handoff.md`, app runtime source files, tests, Firebase rules/indexes/Functions/config, package/env/build files, and unrelated dirty files.
- Release confirmed no deploy, live AI, production data mutation, Firebase rules/indexes/config change, Functions/package/env change, app runtime source change, test change, or provider setting change occurred.

### Verification Basis

- Release reviewed the unstaged docs diff, staged only the approved docs scope, and reviewed staged files with `git diff --cached --name-status`.
- `git diff --check -- "Web App/README.md" "Web App/docs"` passed with only expected CRLF conversion warnings.
- Manager verified `HEAD` and `origin/codex/webapp-folder-structure-v1` point to `053c956`, and `git show --name-only --format= HEAD` lists only the approved README/docs files.

### Notes

- The temporary CMD-007 Release report was deleted after this ledger entry and command-room decision note captured the durable outcome.
- Chef GPT files and `codex_handoff.md` remain dirty by design and need a separate Manager/user decision.
- Stage 2 QA was not opened or run during this Release checkpoint.

## 2026-07-08 CMD-006 Documentation And Private-Alpha Posture Drift Bugfix

Date: 2026-07-08
Mode: Bugfix lane under Manager command CMD-006
Scope: Patch `BUG-023` documentation/private-alpha posture drift without editing command-room, app runtime code, tests, Chef GPT files, `codex_handoff.md`, Firebase rules/indexes/Functions/config, production data, deploys, billing, live AI, semantic search, or Gemini model IDs.

### Result

Passed for Bugfix-owned docs. Current README, roadmap, release-readiness docs, active contracts, and active ledger references now describe the live private-alpha Hosting posture, approval-gated future deploys, pushed checkpoint branch/commit, and current `src/app` / `src/features/recipes` paths.

### Changes

- Updated `README.md` to state that Firebase Hosting is live at `https://viomacro.web.app`, future deploys require explicit Release/user approval, the accepted checkpoint is pushed on `codex/webapp-folder-structure-v1`, and production Hosting may lag local branch changes until a later Release deploy command.
- Updated `docs/manager-roadmap-checklist.md` to reflect CMD-005 commit/push completion, current CMD-006 docs cleanup, and likely next QA/Release gate.
- Updated `docs/app-contract-roadmap.md`, `docs/production-deploy-readiness-contract.md`, and `docs/e2e-qa.md` so future Hosting deploy language no longer implies Hosting has never been deployed.
- Updated active contracts and foundation docs from pre-migration paths to current `src/app/App.tsx`, `src/app/AppLayout.tsx`, and recipe feature paths under `src/features/recipes/`.
- Updated `docs/bug-ledger.md` to close `BUG-023` and correct active stale source-path references.

### Verification

- `git diff --check -- "Web App/docs" "Web App/README.md"` passed.
- Focused stale path scan found remaining old source-path hits only in historical QA/audit evidence that was intentionally preserved after Manager cleared the old active CMD-006 command-room text.
- Focused deploy-posture scan found remaining old deploy wording only in historical QA evidence or legitimate future-deploy guidance.

### Notes

- Manager accepted CMD-006 and cleared the active command-room assignment text after reviewing the Bugfix report.
- Historical `docs/qa-ledger.md` and `docs/qa/QA_AUDIT.md` entries retain old paths because they document evidence from before the folder migration.
- No browser/manual QA was run; this was a docs-only cleanup with static verification.

## 2026-07-08 CMD-005 Web App Checkpoint Commit And Push

Date: 2026-07-08
Mode: Release lane report reviewed and accepted by Manager
Scope: User-approved Web App-only checkpoint commit and push for accepted private-alpha roadmap, Auth posture, Meal Planner, coordination, and test changes.

### Result

Accepted. Release staged only the approved checkpoint scope, committed it, and pushed the current branch.

### Commit / Push

- Commit: `5503240 chore: checkpoint web app private-alpha roadmap fixes`
- Branch: `codex/webapp-folder-structure-v1`
- Push: succeeded to `origin/codex/webapp-folder-structure-v1`
- Remote range reported by Release: `ced7202..5503240`

### Scope Control

- Included: `AGENTS.md` and `Web App/`.
- Excluded: `Chef Professional AI GPT/`, `codex_handoff.md`, and unrelated dirty files.
- Release confirmed no Chef GPT files and no `codex_handoff.md` file were staged or committed.

### Verification Basis

- Stage 0 verification already passed before this commit: `npm.cmd run check`, full emulator suite 61/61, production-build emulator smoke 4/4, and `git diff --check -- AGENTS.md "Web App"`.
- Release reviewed staged files with `git diff --cached --name-status` before committing.
- Release ran `git status -sb` and `git log -1 --oneline` after push.

### Notes

- The temporary CMD-005 Release report was deleted after this ledger entry and command-room decision note captured the durable outcome.
- No deploy, live AI, production data mutation, Firebase rules/indexes/config change, or provider setting change occurred.
- Chef GPT files and `codex_handoff.md` remain dirty by design and need a separate Manager/user decision.

## 2026-07-07 CMD-004 Release Stage 0 Checkpoint Gate

Date: 2026-07-07
Mode: Release lane report reviewed and accepted by Manager
Scope: Independent Release review of the Stage 0 Web App checkpoint gate before commit/push approval.

### Result

Accepted. Release confirmed the Web App-only checkpoint is ready for Manager/user commit and push approval, with no commit or push performed.

### Evidence

- Release reviewed required startup docs, command room, roadmap checklist, git checkpoint contract, production deploy readiness contract, QA ledger, and bug ledger.
- Release reviewed scoped changed Web App files and confirmed the intended checkpoint scope is `AGENTS.md` plus `Web App/`.
- Release confirmed excluded dirty work remains outside CMD-004 scope: `Chef Professional AI GPT/`, `codex_handoff.md`, and unrelated untracked Chef GPT files.
- Release accepted same-day Stage 0 verification already recorded in this ledger: `npm.cmd run check` passed, `npm.cmd run test:e2e:emulator` passed 61/61, and `npm.cmd run test:e2e:prod-emulator` passed 4/4.
- Release reran `git diff --check -- AGENTS.md "Web App"` and it passed with only expected CRLF conversion warnings.

### Commit / Push Status

- Commit: not performed.
- Push: not performed.
- Staging: not performed.

### Manager Decision

Accept and clear CMD-004. The temporary Release report was deleted after this durable ledger entry and command-room decision note captured the outcome. Next checkpoint action requires explicit user approval and should be assigned to Release as a new command.

### Remaining Risks

- Chef GPT and `codex_handoff.md` remain dirty and excluded.
- `BUG-023` documentation/private-alpha posture drift remains open.
- The deployed Hosting build may be behind accepted local fixes until a later explicitly approved Release deploy command.
- No live AI, production data mutation, Firebase rules/indexes change, Functions deploy, Hosting deploy, or provider setting check was performed.

## 2026-07-07 Stage 0 Manager Checkpoint Verification

Date: 2026-07-07
Mode: Manager checkpoint verification before Web App-only commit/push approval
Scope: Verify accepted Web App coordination, Auth posture, Meal Planner bugfix, command-room cleanup, and roadmap checklist changes while excluding Chef GPT dirty files, deploys, live AI, production data, Firebase rules/indexes, and provider configuration.

### Result

Passed. The Web App checkpoint scope is ready for user review and explicit commit/push approval.

### Diff Review

- Reviewed Web App-only dirty scope: `AGENTS.md`, Web App env examples, coordination docs/templates, roadmap/ledger docs, Auth posture changes, Meal Planner fixes, and focused Playwright regression tests.
- Confirmed Chef GPT dirty files remain separate and were not staged or touched during this checkpoint pass.
- Confirmed `docs/command-room.md` has no active worker command after `CMD-003` acceptance and cleanup.

### Verification

- `git diff --check -- AGENTS.md "Web App"`: passed; only expected CRLF conversion warnings appeared.
- `npm.cmd run check`: sandboxed run failed before app verification due known Vite/esbuild ancestor-read access denial; rerun outside sandbox passed app lint, app build, Functions lint, and Functions build.
- `npm.cmd run test:e2e:emulator`: sandboxed run failed before tests because Firebase tools were not discoverable from the restricted PATH; rerun outside sandbox passed 61/61.
- `npm.cmd run test:e2e:prod-emulator`: sandboxed run failed before tests because Firebase tools were not discoverable from the restricted PATH; rerun outside sandbox passed 4/4.

### Notes

- Known non-blocking warnings remain: stale Browserslist data, Vite mixed static/dynamic import chunk warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning.
- No commit, push, deploy, live AI, production mutation, Firebase rules/indexes change, or Chef GPT change was performed in this verification pass.

## 2026-07-07 CMD-003 Meal Planner Detail Lookup And Clone Last Week Bugfix

Date: 2026-07-07
Mode: Bugfix lane under Manager command CMD-003
Scope: Patch and verify `BUG-022` Meal Planner detail lookup and Clone Last Week risks without touching command-room, Firebase config/rules/indexes, production data, live AI, deploys, Auth, Pantry, semantic search, billing, docs drift, native-dialog polish, or Chef GPT files.

### Result

Passed. `BUG-022` is fixed for the Meal Planner code-owned scope. Planned meals with separate meal instance IDs now open saved recipe details through `recipeId`, and Clone Last Week now targets the immediately previous week relative to the selected planner week instead of the latest saved plan.

### Changes

- Updated Meal Planner detail lookup to fetch recipes with `meal.recipeId || meal.id`, while preserving fallback/manual meal detail behavior.
- Updated Clone Last Week to calculate the source week as selected planner week minus seven days and load that exact week with `getMealPlanByDate`.
- Added focused emulator regression coverage for planned-meal `recipeId` detail lookup.
- Added focused emulator regression coverage for clone exact previous-week selection when a newer/latest saved plan also exists.

### Verification

- Red proof: `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import "_local\firebase\exports\firebase-export-1782525385123HUjsoD" -- "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:768"` failed before the app patch because saved recipe ingredient text was missing from the Meal Planner detail modal.
- Red proof: `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import "_local\firebase\exports\firebase-export-1782525385123HUjsoD" -- "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:803"` failed before the app patch because the cloned draft did not show the immediately previous week's meal.
- Green proof: `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import "_local\firebase\exports\firebase-export-1782525385123HUjsoD" -- "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:768 tests/e2e/emulator-auth.spec.ts:803"` passed 2/2 after the app patch.
- `npm.cmd run check` passed after rerunning with sandbox escalation. The first sandboxed attempt failed during Vite config loading with `Access is denied`; the escalated rerun passed app lint, app build, Functions lint, and Functions build. Non-blocking existing warnings: Browserslist data age, Vite dynamic/static import chunk warnings, and chunk size warning.
- 2026-07-07 Manager verification rerun: `npm.cmd run check` passed outside sandbox after the known sandbox/Vite access issue; `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import "_local\firebase\exports\firebase-export-1782525385123HUjsoD" -- "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:768 tests/e2e/emulator-auth.spec.ts:803"` passed 2/2.

### Notes

- Broader emulator verification was not run because the patch did not change save/load persistence, AppProvider active-plan recognition, Grocery/Dashboard recognition, Firebase rules/indexes, Functions, or production data.
- Browser/Chrome manual confirmation was not run; focused Playwright emulator coverage exercised the user-visible Meal Planner behavior.
- Manager accepted CMD-003 on 2026-07-07 for code-owned Meal Planner fixes and closed `BUG-022`. The temporary CMD-003 worker report was deleted after this ledger and `docs/bug-ledger.md` held the durable evidence.

## 2026-07-06 CMD-002 Auth Production Posture Bugfix

Date: 2026-07-06
Mode: Bugfix lane under Manager command CMD-002
Scope: Patch and classify `BUG-021` Auth production posture follow-up without deploy, production mutation, Firebase config changes, or Chef GPT edits.

### Result

Passed for code-owned Auth posture items. Auth production/private-alpha copy, Google sign-in visibility, and `/dev/map` exposure were repaired and regression-tested. reCAPTCHA/App Check `POST /recaptcha/api2/clr` 403/abort noise was classified as third-party App Check/reCAPTCHA noise rather than a code-owned Auth failure.

### Changes

- Replaced Auth social-proof copy `Join 25,000+ users` with private-alpha wording.
- Changed Google sign-in to disabled-by-default posture unless `VITE_ENABLE_GOOGLE_SIGN_IN=true` and Firebase emulators are not active.
- Added `VITE_ENABLE_GOOGLE_SIGN_IN=false` and `VITE_ENABLE_INTERNAL_QA_ROUTES=false` to example env files.
- Hid `/dev/map` from production builds unless dev mode or `VITE_ENABLE_INTERNAL_QA_ROUTES=true` is active.
- Added public Auth smoke assertions for private-alpha copy and disabled Google sign-in.
- Added production-build emulator coverage proving `/dev/map` is not exposed.

### Verification

- Red proof: focused public Auth smoke failed before patch because `Join 25,000+ users` was still present.
- Red proof: focused production-emulator test failed before patch because `/dev/map` remained exposed.
- `npm.cmd run build`: passed after the code patch, with known non-blocking Browserslist/chunk warnings.
- `npx.cmd playwright test --config=playwright.config.ts --grep "auth page renders"`: passed 2/2 after responsive-safe assertion update.
- `npm.cmd run test:e2e:prod-emulator -- --grep internal`: passed 1/1.
- `npm.cmd run test:e2e:emulator -- --grep auth`: passed 59/59 because the grep run exercised the full emulator file.
- `npm.cmd run check`: passed.
- 2026-07-07 Manager verification rerun: `npm.cmd run check` passed outside sandbox after the known sandbox/Vite access issue; `npx.cmd playwright test --config=playwright.config.ts --grep "auth page renders"` passed 2/2; `npm.cmd run test:e2e:prod-emulator -- --grep internal` passed 1/1.

### Notes

- No deploy, live AI, production data mutation, Firebase rules/indexes, provider settings, semantic search, billing, or Chef GPT files were touched.
- App Check remains enabled in production when `VITE_RECAPTCHA_SITE_KEY` exists. Disabling App Check would violate existing readiness proof, so this pass classified the observed reCAPTCHA endpoint noise instead of removing App Check.
- Manager accepted CMD-002 on 2026-07-07 for code-owned Auth posture fixes and closed `BUG-021`. The temporary CMD-002 worker report was deleted after this ledger and `docs/bug-ledger.md` held the durable evidence.

## 2026-07-06 CMD-001 Private Alpha QA Command-Room Distillation

Date: 2026-07-06
Mode: manager distillation of QA command-room report
Scope: Convert the CMD-001 broad private-alpha QA report into durable QA and bug-tracking records before assigning Bugfix work.

### Result

Passed as a QA evidence pass. No fixes were made during QA. No P0/P1 blockers were confirmed. Several P2/P3 risks were routed to the bug ledger for manager-sequenced follow-up.

### Evidence

- `npm.cmd run check` passed when QA reran it outside the restricted sandbox after a sandboxed Vite build access-denied tooling issue.
- Live read-only Chrome smoke against `https://viomacro.web.app` confirmed `/auth` loads while signed out.
- Live read-only Chrome smoke confirmed protected routes `/`, `/plan`, `/recipes`, `/recipes/import`, `/grocery`, `/pantry`, `/progress`, and `/settings` redirect to `/auth` while signed out.
- QA did not perform authenticated production mutations, live AI calls, deploys, or Firebase rules/index changes.

### Findings Routed

- `BUG-021`: Auth production posture follow-up for reCAPTCHA/App Check console noise, Google sign-in visibility, private-alpha copy, and `/dev/map` classification.
- `BUG-022`: Meal Planner follow-up for meal detail lookup and Clone Last Week behavior risks.
- `BUG-023`: Documentation/private-alpha posture drift for README deploy wording and stale pre-migration source paths.
- `BUG-024`: Native dialog UX watchlist for remaining `alert()`/`prompt()` flows.

### Manager Decision

Open Bugfix work one batch at a time. CMD-002 is assigned first for Auth production posture because it affects private-alpha trust and release safety. Meal Planner and docs drift wait for later commands so fixes remain small, reviewable, and testable.

### Notes

- The temporary CMD-001 worker report was deleted after its findings were distilled into this ledger, `docs/bug-ledger.md`, and the command-room follow-up sequence.
- Chef GPT files, Pantry promotion, semantic search/vector index, billing/live AI, Firebase rules/indexes, production data mutation, deployment, and broad strategy rewrites remain out of scope.

## 2026-06-29 Web App Root Hygiene Cleanup, Phase 4.5

Date: 2026-06-29
Mode: structure-only root cleanup on branch `codex/webapp-folder-structure-v1`
Scope: Move local-only/generated artifacts and tracked historical reference material out of the Web App root while preserving app behavior, Firebase paths, and test harness behavior.

### Result

Passed. The Web App root is cleaner without moving root-bound tool outputs or changing app runtime behavior.

### Changes

- Added `docs/architecture/root-hygiene.md` with root-level ownership rules and `_local/` conventions.
- Moved ignored local-only artifacts into `_local/`:
  - Firebase exports: `_local/firebase/exports/`
  - Firebase emulator data: `_local/firebase/data/`
  - Playwright reports/results: `_local/qa/`
  - local live-smoke files: `_local/live/`
  - old local conversation archive: `_local/archive/`
- Updated Playwright configs so reports and test artifacts write to `_local/qa/`.
- Updated `scripts/firebase-emulator.mjs` to prefer `_local/firebase/exports/` while preserving legacy root `firebase-export*` fallback.
- Moved tracked historical/reference material:
  - `Northstar Prototype/` -> `docs/reference/northstar-prototype/`
  - `supabase/` -> `docs/archive/supabase/`
  - `QA_AUDIT.md` -> `docs/qa/QA_AUDIT.md`
- Updated docs and ledgers that referenced the old QA audit location.

### Verification

- `npm.cmd run check`: passed after Batch A and again after Batch B. Known warnings remain for Browserslist age, mixed dynamic/static import chunking, and large bundle size.
- `npm.cmd run test:e2e:emulator`: passed 59/59 using `_local\firebase\exports\firebase-export-1782525385123HUjsoD`.
- `npm.cmd run test:e2e:prod-emulator`: passed 3/3 using `_local\firebase\exports\firebase-export-1782525385123HUjsoD`.

### Notes

- No live AI, deploys, production data, Firebase rules/indexes, semantic-search promotion, or Gemini model changes were performed.
- `dist/`, `.firebase/`, `node_modules/`, `.env`, `.env.local`, Firebase config/rules files, and build/test config files intentionally remain root-level.
- `firestore-debug.log` may still be regenerated at the Web App root by Firebase emulators and remains ignored.
- Sandboxed Vite/esbuild checks hit a Windows ancestor-read permission error; the same checks passed in normal local execution after approval.

## 2026-06-29 Shared Data And Firebase Helpers Migration, Phase 4

Date: 2026-06-29
Mode: structure-only refactor on branch `codex/webapp-folder-structure-v1`
Scope: Move shared mock data into `src/data/mock`, add Firebase path helpers, and adopt helpers in service boundaries without changing `users/{uid}/...` paths.

### Result

Passed. Mock/demo data moved under `src/data/mock`, service code now uses `src/services/firebase/paths.ts`, and local verification preserved recipe, meal-plan, settings, grocery, pantry, metric, and recipe asset cleanup behavior.

### Changes

- Moved `src/lib/mock-data.ts` to `src/data/mock/mock-data.ts`.
- Added `src/services/firebase/paths.ts` for user document, collection/document refs, and recipe asset storage paths.
- Updated recipe, meal plan, user/settings, grocery, and pantry services to use the helpers while preserving existing Firestore and Storage paths.
- Removed now-unused `.gitkeep` anchors under `src/data/mock/` and `src/services/firebase/`.

### Verification

- `npm.cmd run check`: passed. Known warnings remain for Browserslist age, mixed dynamic/static import chunking, and large bundle size.
- `npm.cmd run test:rules`: passed. Firestore rules passed 19/19 and Storage rules passed 3/3.
- First `npm.cmd run test:e2e:emulator`: 58/59 passed; `user can save settings changes` had a transient bottle-size reload assertion.
- Focused rerun `node scripts/firebase-emulator.mjs exec --only auth,firestore,storage -- npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:1068`: passed 1/1.
- Clean rerun `npm.cmd run test:e2e:emulator`: passed 59/59.
- `npm.cmd run test:e2e:prod-emulator`: passed 3/3.

### Notes

- No live AI, deploys, production data, Firebase rules/indexes, semantic-search promotion, or Gemini model changes were performed.
- No collection/storage paths were intentionally changed; helpers still produce `users/{uid}/recipes`, `users/{uid}/mealPlans`, `users/{uid}/groceryItems`, `users/{uid}/pantryItems`, `users/{uid}/weightHistory`, and `users/{uid}/recipes/...` storage paths.

## 2026-06-29 QA Harness Emulator Import Resolver, BUG-020

Date: 2026-06-29
Mode: local QA harness fix on branch `codex/webapp-folder-structure-v1`
Scope: Replace stale hardcoded Firebase emulator export paths in active npm scripts before Phase 4 folder work.

### Result

Passed. The named npm emulator scripts now resolve an available local Firebase export and reach Playwright without the missing-directory failure.

### Changes

- Added `scripts/firebase-emulator.mjs` to resolve a Firebase emulator import from `VIOMACRO_FIREBASE_EMULATOR_IMPORT`, `FIREBASE_EMULATOR_IMPORT`, `_local/firebase/exports/firebase-export`, the newest non-empty `_local/firebase/exports/firebase-export-*` directory, or legacy root `firebase-export*` folders.
- Updated `package.json` emulator scripts to call the resolver instead of hardcoding `firebase-export-1769202055289c4PDRf`.
- Updated README and E2E QA docs with the resolver behavior.

### Verification

- `npm.cmd run test:e2e:prod-emulator`: passed 3/3 using `firebase-export-1782525385123HUjsoD`.
- `npm.cmd run test:e2e:emulator`: passed 59/59 using `firebase-export-1782525385123HUjsoD`.
- `npm.cmd run test:e2e:emulator:data-loss`: passed 3/3 using `firebase-export-1782525385123HUjsoD`.

### Notes

- No live AI, deploys, production data, Firebase rules/indexes, semantic-search promotion, or Gemini model changes were performed.
- `npm.cmd run emulator` was not run because it starts persistent emulators for manual debugging; it uses the same resolver path verified by the `emulators:exec` scripts.

## 2026-06-29 Recipe Feature Folder Migration, Phase 3

Date: 2026-06-29
Mode: structure-only refactor on branch `codex/webapp-folder-structure-v1`
Scope: Move Recipe Library, import, and cooking UI into `src/features/recipes` while preserving routes and behavior.

### Result

Passed. The Recipe Library route, Recipe Import route, guided cooking, recipe create/edit/detail controls, and Meal Planner usages of moved recipe components remained functional in local verification.

### Changes

- Moved `RecipeLibrary` to `src/features/recipes/pages/`.
- Moved `GuidedCooking`, `RecipeForm`, `RecipeDetail`, and `RecipeCard` to `src/features/recipes/components/`.
- Updated imports in `src/app/App.tsx`, the moved recipe files, and `src/pages/MealPlanner.tsx`.
- Left `RecipePicker` in `src/components/` because it remains Meal Planner-owned for now.

### Verification

- `npm.cmd run check`: passed after fixing one missed dynamic import in `RecipeForm`; known warnings remain for Browserslist age, mixed dynamic/static import chunking, and large bundle size.
- `firebase emulators:exec --only auth,firestore,storage --import=firebase-export-1782525385123HUjsoD "npx playwright test --config=playwright.emulator.config.ts -g recipe"`: passed 12/12.
- `firebase emulators:exec --only auth,firestore,storage --import=firebase-export-1782525385123HUjsoD "npx playwright test --config=playwright.emulator.config.ts"`: passed 59/59.
- `firebase emulators:exec --only auth,firestore,storage --import=firebase-export-1782525385123HUjsoD "npx playwright test --config=playwright.prod-emulator.config.ts"`: passed 3/3.

### Notes

- No live AI, deploys, production data, Firebase rules/indexes, semantic-search promotion, or Gemini model changes were performed.
- The named npm emulator scripts still reference missing local export `firebase-export-1769202055289c4PDRf`; direct equivalent verification used available export `firebase-export-1782525385123HUjsoD`. Tracked separately as `BUG-020`.

## 2026-06-27 Authenticated Live Private Alpha Smoke

Date: 2026-06-27
Mode: live hosted authenticated smoke with a reusable ignored test account
Scope: Verify the deployed Firebase Hosting app can authenticate, render protected routes, and perform a small non-AI Firestore write/update/delete cycle in production.

### Result

Passed. The live private-alpha app worked with the reusable test account.

### Verification

- Live URL: `https://viomacro.web.app`.
- Test account email: `viomacro.live.qa.1782585650579@example.com`.
- Credentials are stored only in ignored local file `Web App/_local/live/live-test-account.local`; password is not committed.
- Smoke helper is stored only in ignored local file `Web App/_local/live/live-smoke.local`.
- Auth flow:
  - Reused or created the test account.
  - Dismissed onboarding with `Skip Setup` when present.
  - Confirmed Dashboard rendered after authentication.
- Protected routes checked while signed in:
  - `/`
  - `/plan`
  - `/recipes`
  - `/recipes/import`
  - `/grocery`
  - `/pantry`
  - `/progress`
  - `/settings`
- Production write/update/delete smoke:
  - Added a temporary Grocery item.
  - Marked it purchased.
  - Reloaded.
  - Deleted it.
  - Reloaded again and confirmed it did not return.

### Notes

- No live AI actions were triggered. The smoke did not use Auto-Generate, Magic Import parsing, semantic search, recipe embedding, or any provider-backed AI call.
- The live browser emitted transient Firestore backend reachability console noise during one run, matching noise already filtered in public smoke tests. Functional Firestore add/check/delete/reload assertions passed.
- Deferred gates remain unchanged: Pantry full product decision, live semantic-search vector index, Functions dependency audit gate, and billing hard cutoff.

## 2026-06-27 Hosting-Only Private Alpha Deploy

Date: 2026-06-27
Mode: Firebase Hosting-only deploy plus live hosted smoke
Scope: Publish the already-verified private-alpha web app to Firebase Hosting without deploying Functions, Firestore rules, or Storage rules.

### Result

Passed. Firebase Hosting deployed successfully to `https://viomacro.web.app`.

### Verification

- `npm.cmd run build`: passed before deploy. Existing non-blocking warnings remained: Browserslist age, Vite mixed dynamic/static import chunking, and large bundle size.
- `npx.cmd --yes firebase-tools deploy --only hosting --project viomacro`: passed.
- Firebase CLI output confirmed:
  - Hosting target: `hosting[viomacro]`.
  - Found 5 files in `dist`.
  - Upload complete.
  - Version finalized.
  - Release complete.
  - Hosting URL: `https://viomacro.web.app`.
- Live hosted smoke with Playwright against `https://viomacro.web.app` passed:
  - `/auth` rendered expected auth controls.
  - Protected routes `/`, `/plan`, `/recipes`, `/recipes/import`, `/grocery`, `/pantry`, `/progress`, and `/settings` redirected to `/auth` while signed out.
  - No blocking page errors or unexpected console errors were captured during the smoke.

### Notes

- This was Hosting only. It did not deploy Functions, Firestore rules, Storage rules, or indexes.
- Live authenticated workflow smoke is still a separate optional step because it may create production user data.
- Deferred gates remain unchanged: Pantry full product decision, live semantic-search vector index, Functions dependency audit gate, and billing hard cutoff.

## 2026-06-27 Final Bug Checkpoint Verification

Date: 2026-06-27
Mode: final verification gate before Git checkpoint
Scope: Verify the full current bug-fix and QA checkpoint before committing and pushing.

### Result

Passed. The current VioMacro Web App checkpoint is verified locally against lint/build, Functions contracts, Firestore/Storage rules, full emulator Playwright, and production-preview emulator smoke.

### Verification

- `npm.cmd run lint`: passed.
- `npm.cmd --prefix functions run lint`: passed.
- `npm.cmd --prefix functions run build`: passed.
- `npm.cmd run build`: passed after elevated rerun because the restricted Codex sandbox blocked Vite/esbuild config reads; build warnings were the existing non-blocking Browserslist, mixed import chunking, and large bundle warnings.
- `npm.cmd run test:functions:contracts`: passed 19/19.
- `npm.cmd run test:rules`: wrapper could not start a duplicate Firestore emulator because port `8080` was already occupied by the active emulator Java process.
- Direct rules reuse of the active emulator stack passed:
  - `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --test tests/rules/firestore-rules.test.mjs`: passed 19/19.
  - `node --test tests/rules/storage-rules.test.mjs`: passed 3/3.
- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal-planner-failure generation feedback|recipe filter chips"`: passed 2/2 after repairing test selectors/setup for the current UI.
- `npx.cmd playwright test --config=playwright.emulator.config.ts`: passed 59/59.
- `npx.cmd playwright test --config=playwright.prod-emulator.config.ts`: passed 3/3 after targeting the exact Recipe Import card upload button.

### Notes

- The first full emulator run found two verification-only test issues: the Meal Planner generation-failure test did not account for the weekend choice prompt, and the Recipe filter-chip test used locators that became ambiguous after card action controls were made accessible. Both were repaired in `tests/e2e/emulator-auth.spec.ts` and then passed focused and full reruns.
- The first production-preview smoke found one verification-only locator issue: `/recipes/import` has two valid file chooser buttons. The smoke now targets the main Recipe Import card button in `tests/e2e/prod-emulator-auth.spec.ts`.
- No new app defect was opened from this final verification gate.

## 2026-06-27 Manual QA Audit Reconciliation

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, documentation hygiene pass
Scope: Reconcile `docs/qa/QA_AUDIT.md` with the already-closed bug batches in `docs/bug-ledger.md` and the existing repair evidence in this QA ledger.

### Goal

Prevent future bug triage from treating repaired manual-audit findings as still-open defects while preserving the original failing rows and repair addenda.

### Findings And Fixes

- `docs/qa/QA_AUDIT.md` summary still marked `/plan`, `/recipes`, and `/settings` as simple audited routes even though their repair batches had already been verified and closed.
- The top `Findings Requiring Review` list still showed Settings, Recipe Library, Meal Planner, and Dashboard findings without repaired status labels.
- Updated the audit header and route summary to show the current private-alpha local scope is audited, repaired, and reconciled.
- Marked repaired findings with the matching repair addendum IDs while keeping the original finding text for traceability.

### Verification

- Source reconciliation only. No app code changed and no new browser path needed.
- Evidence source: `docs/bug-ledger.md` closed statuses for `BUG-014`, `BUG-015`, `BUG-016`, `BUG-017`, `BUG-018`, and `BUG-019`; existing `docs/qa/QA_AUDIT.md` repair addenda; existing focused Playwright and browser/subagent proof already recorded below.

### Notes

- This pass did not close any new app defect. It only removed ledger drift after prior dual-proof repair batches.
- Deferred items remain unchanged: Pantry full product decision, live semantic-search vector index, Functions dependency audit gate, and billing hard cutoff.

## 2026-06-27 Pantry And Grocery Prototype Polish, BUG-018

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, browser QA subagent, focused Pantry/Grocery repair batch, emulator-backed Playwright regression
Scope: Close `BUG-018` findings `A11Y-GROCERY-001`, `BUG-PANTRY-001`, and `A11Y-PANTRY-001`.

### Goal

Make Grocery and Pantry prototype controls honest, accessible, and regression-tested without promoting Pantry into a launch feature.

### Findings And Fixes

- Grocery check-off was visually blank and previously had no useful accessible name or state. It now exposes item-specific names: `Mark as purchased: <item>` and `Mark as not purchased: <item>`, plus `aria-pressed`.
- Grocery delete now exposes `Delete grocery item: <item>`.
- Pantry category filters expose `aria-pressed`.
- Pantry quantity, edit, delete, pagination, AI suggestion, and pantry-to-shopping-list controls now expose specific accessible names while preserving disabled Coming Soon behavior where appropriate.
- Pantry total stat cards now expose readable labels such as `Total Items: 0`, making the count testable after delete/reload.
- The browser QA subagent identified a residual duplicate exact-name `Coming Soon` issue in the right column; this was patched and re-verified.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g grocery`: passed 7/7 after elevated rerun because the first sandboxed run failed before app code with Chromium `spawn EPERM`.
- `npx.cmd playwright test --config=playwright.emulator.config.ts -g pantry`: passed 1/1 after elevated reruns.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after elevated rerun, with existing non-blocking Browserslist/chunk warnings.
- Browser QA subagent proof on real installed Chrome:
  - `/grocery`: added a QA item, verified the check button had item-specific label and `aria-pressed=false`, clicked it, verified the label/state changed, and confirmed checked state persisted after reload.
  - `/pantry`: added two QA pantry entries, verified `2 Total Items` and `Showing 2 items`, deleted both, verified `0 Total Items` and `Showing 0 items`, and confirmed both persisted after reload.
  - `/pantry` follow-up: verified `Pantry AI suggestions coming soon` count `1` disabled, `Pantry-to-shopping-list suggestions coming soon` count `1` disabled, and exact-name `Coming Soon` button count `0`.

### Notes

- Pantry remains deferred as a full product feature. This batch only makes the lightweight prototype and Coming Soon states honest/testable.
- Browser console/network contained only expected local/sandbox noise reported by the subagent: Google Fonts blocked by `ERR_NETWORK_ACCESS_DENIED`, Unsplash image aborts, and Firestore emulator long-poll `ERR_ABORTED` during navigation/auth. No app JS exception or broken UI state was observed.
- `BUG-018` is closed for current private-alpha scope.

### Commit/PR

Not created.

## 2026-06-27 Dashboard Hydration Correction Repair, Batch B

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, focused Dashboard hydration repair, emulator-backed Playwright regression, in-app browser manual verification
Scope: Close remaining `BUG-016` hydration finding `BUG-DASH-003`.

### Goal

Replace the ambiguous Dashboard hydration `Correct Entry` action, which directly subtracted `250 ml`, with an explicit correction workflow that lets the user set today's current water total.

### Findings And Fixes

- The manual audit finding was valid: `Correct Entry` behaved like a hidden decrement action and could surprise users.
- Replaced the hard-coded decrement with an inline correction form in `src/pages/Dashboard.tsx`.
- The form pre-fills today's current water total, validates `0` to `10,000 ml`, saves the corrected current-day total through `logDailyMetric`, and leaves a visible inline error if correction save fails.
- Extended the existing hydration persistence regression so it proves quick-add, correction to a specific total, and reload persistence in one flow.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard hydration"`: passed 2/2 after elevated rerun because the first sandboxed run failed before app code with Chromium `spawn EPERM`.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after elevated rerun because the restricted sandbox blocked Vite/esbuild config access.
- In-app browser proof on `http://127.0.0.1:5173/`:
  - Created a throwaway emulator account and dismissed onboarding.
  - Hydration `+250ml` changed the visible total to `250 ml`.
  - `Correct Entry` opened inline `Correct water intake (ml)`.
  - Saving `125` changed the visible total to `125 ml`.
  - Reloading Dashboard preserved `125 ml`.
  - Console warnings/errors for the verified hydration path were empty.

### Notes

- Existing non-blocking build warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, and large bundle/chunk warning.
- `BUG-016` is now closed for the current local private-alpha Dashboard scope.

### Commit/PR

Not created.

## 2026-06-27 Recipe Import Upload Fixture Proof, BUG-019

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, CDP limitation retry, real Chrome/manual upload check, emulator-backed Playwright verification
Scope: Close the Recipe Import manual QA proof gap created when the in-app browser could not drive the hidden file input/file chooser.

### Result

- Raw CDP was retried after the laptop/Codex restart. The in-app browser and Chrome backends both advertised `cdp`, but attaching to the in-app browser tab timed out twice. The limitation remains a browser-control/tooling limitation, not a confirmed app bug.
- The blocked workflow was verified through dedicated Playwright emulator upload fixtures, then strengthened with a real Chrome/manual upload safe-failure check.
- Closed `BUG-019` because repeatable fixture evidence covers the Recipe Import upload lifecycle, and Chrome/manual evidence proves the visible upload button can open the native file picker, submit a local file, surface the safe parse-failure alert, and recover to the import page.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "recipe import|failed recipe image import|parsed recipe import|unsupported file"`: passed 4/4.
- Real Chrome/manual proof: selected `Web App/tests/fixtures/manual-recipe-import-card.svg`; app displayed `Failed to parse recipe. Please try again.` from `127.0.0.1:5173`; after dismissing the alert, `/recipes/import` showed `Choose recipe file` again.
- Covered paths:
  - Failed image import cleans up the uploaded asset.
  - Unsupported file type is rejected before upload.
  - Canceling a parsed recipe import cleans up the uploaded asset.
  - Saving a parsed draft creates an imported recipe record.

### Notes

- `docs/qa/QA_AUDIT.md` keeps the original `IMPORT-2` row as `FAIL` because that row describes the in-app browser file-picker attempt. Repair addenda now point to both the passing Playwright fixture evidence and the later real Chrome/manual safe-failure proof.
- Parsed-draft success remains automated fixture evidence, not manual Chrome success evidence. Revisit with a real recipe image or dev-only QA fixture harness before treating import success as public launch-critical.

## 2026-06-27 Settings Persistence And Accessibility Repair, Batch A

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, focused four-item Settings repair batch, emulator-backed Playwright regression, in-app browser manual verification
Scope: `BUG-017` Settings findings `BUG-SETTINGS-001`, `BUG-SETTINGS-002`, `A11Y-SETTINGS-001`, and Settings contract/ledger drift.

### Goal

Repair the reopened Settings manual-audit findings without redesigning the page: make preference edits clearly savable, prove bottle-size persistence, expose stable selected state for dietary tags, and give form controls reliable accessible labels.

### Findings And Fixes

- The manual audit contradicted the earlier Settings contract: `settings.md` said no open bugs, while `BUG-017` showed unresolved Settings persistence/accessibility findings.
- Added exact ARIA names/IDs for Settings numeric and range controls: current weight, goal weight, rate of change, daily calorie target, macro percentage sliders, exact gram targets, and custom bottle size.
- Added `aria-pressed` state to phase buttons, macro mode buttons, dietary tags, and allergies.
- Kept the existing manual save contract but made the changed-state footer more explicit by adding status semantics and keeping the explanatory text visible on small screens.
- Strengthened the Settings Playwright regression so it verifies exact labels, Save/Discard visibility, Dairy Free and Gluten Free selected state, custom bottle-size reload persistence, and the existing macro/profile/save-failure/discard paths.
- Corrected the Settings contract and `BUG-017` lifecycle after verification.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "settings"`: passed 6/6 after rerunning with elevated sandbox permission because the first run failed before app code with Chromium `spawn EPERM`.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated sandbox permission because the restricted sandbox blocked Vite/esbuild config access.
- In-app browser proof on `http://127.0.0.1:5173/settings`:
  - `Custom Bottle Size (ml)` resolved to exactly one accessible target.
  - Editing custom bottle size to `582` exposed `Discard` and `Confirm Targets`.
  - Saving and reloading kept the visible bottle-size value at `582`.
  - `Gluten Free` changed from `aria-pressed=false` to `aria-pressed=true` and remained true after reload.
  - Switching to `Percentage %` exposed exactly one `Protein percentage`, `Carbs percentage`, and `Fat percentage` control, then `Discard` restored the previous exact-grams mode.
  - Console error log for the verified Settings path was empty.

### Notes

- Follow-up on the network limitation: raw CDP network inspection was attempted again from a fresh in-app browser tab and remained unavailable while the browser runtime resolved a paused document response. To close the proof gap, `tests/e2e/emulator-auth.spec.ts` now includes a Playwright network-failure collector on the Settings save/reload workflow. The collector ignores expected Firestore emulator long-poll channel aborts and fails on real request failures or HTTP 4xx/5xx responses.
- Follow-up verification: `npx.cmd playwright test --config=playwright.emulator.config.ts -g "user can save settings changes|settings exact macro targets persist"` passed 2/2, and `npx.cmd playwright test --config=playwright.emulator.config.ts -g "settings"` passed 6/6 with the network-backed Settings test included.
- Existing non-blocking build warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, and large bundle/chunk warning.
- Settings is locally graduated again for the current private-alpha scope. Future work should keep stricter Firestore schema validation and deeper nutrition/default validation as foundation hardening, not as reopened Settings page bugs.

### Commit/PR

Not created.

## 2026-06-27 Dashboard Metrics UX Repair, Batch A

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, focused four-bug repair batch, emulator-backed Playwright regression, in-app browser manual verification
Scope: Four `BUG-016` Dashboard findings plus duplicate `BUG-013`: Weight History chart warnings, Weekly Check-In slider keyboard/value sync, mobile nav accessible-name ambiguity, and Sleep quality control names.

### Goal

Repair four Dashboard UI/accessibility defects without expanding into the remaining hydration correction product decision.

### Findings And Fixes

- Reproduced the Weight History chart warning in the in-app browser after creating a weight log: Recharts emitted width/height `-1` warnings when the chart rendered.
- Reproduced Weekly Check-In slider issues in the browser: Energy/Hunger range inputs had no accessible names and ArrowRight left DOM values and visible labels at `3/5`.
- Reproduced Sleep quality issue in the browser: quality star buttons were visible but had no accessible names or selected state.
- Reproduced mobile nav ambiguity in the browser: while the drawer was open, the header menu and drawer close controls both exposed `Close navigation menu`.
- Replaced the Weight History `ResponsiveContainer` path with measured numeric chart dimensions in `src/components/WeightHistoryWidget.tsx`.
- Added labels, described-by value readouts, and explicit keyboard handling for Energy/Hunger sliders in `src/components/CheckInModal.tsx`.
- Added named sleep-quality buttons and `aria-pressed` state in `src/components/SleepLogModal.tsx`.
- Kept the mobile header button named `Open navigation menu`, added `aria-expanded`/`aria-controls`, and left the drawer close button as `Close navigation menu` in `src/components/AppLayout.tsx`.
- Tightened the Playwright chart-warning collector so it catches Recharts `chart should be greater than 0` warnings even when the message does not include `ResponsiveContainer`.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard check-in and sleep actions|mobile navigation shell reaches account routes|dashboard weekly check-in saves weight|dashboard quick weight log saves"`: passed 4/4 after rerunning with elevated sandbox permission for Chromium launch.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated sandbox permission for Vite/esbuild config access.
- In-app browser proof:
  - Mobile nav: one `Open navigation menu` button with `aria-expanded=true` and one `Close navigation menu` button after opening.
  - Chart: Dashboard rendered one `svg.recharts-surface` with no chart-size warning logs after the verification fence.
  - Sliders: Energy/Hunger inputs exposed names and moved from `3/5` to `4/5` via ArrowRight with synced visible labels.
  - Sleep quality: five named `Set sleep quality to N out of 5` buttons appeared; selecting 5 set `aria-pressed=true`.

### Notes

- First Playwright run failed with `spawn EPERM` before reaching the app; rerun with elevated sandbox permission passed.
- First build run failed with sandbox `Access is denied` while loading `vite.config.ts`; rerun with elevated sandbox permission passed.
- Existing non-blocking build warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, and large bundle/chunk warning.
- Hydration `Correct Entry` (`BUG-DASH-003`) was intentionally left open in this Batch A pass, then closed later in `2026-06-27 Dashboard Hydration Correction Repair, Batch B`.

### Commit/PR

Not created.

## 2026-06-27 Meal Planner Native Alert Recovery Repair, Batch C

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, focused repair batch, emulator-backed Playwright regression, in-app browser manual verification
Scope: Remaining `BUG-015` finding `BUG-PLAN-005`.

### Goal

Repair the remaining Meal Planner clone/generate interruption paths without expanding into save failure, shopping-list, Grocery, or live-AI deploy work.

### Findings And Fixes

- Confirmed the remaining page-contract gap:
  - `Clone Last Week` used a native alert when no prior plan existed;
  - `Auto-Generate Week` closed the wizard before validation/failure and used a native alert on failure.
- Added `plannerNotice` state and `PlannerNoticeBanner` in `src/pages/MealPlanner.tsx`.
- `Clone Last Week` now:
  - clears stale notices before running;
  - shows recoverable in-app info feedback when no prior saved plan exists;
  - marks cloned plans dirty and shows success feedback when cloning succeeds;
  - tolerates partial saved plans by building a full seven-day target week and cloning meals from source days that exist;
  - shows in-app error feedback if cloning fails.
- `Auto-Generate Week` now:
  - keeps the wizard open for missing settings, missing recipes, local emulator AI guard failures, and injected AI failures;
  - surfaces errors through an in-app alert banner instead of a browser dialog;
  - closes the wizard only after a draft plan is successfully generated.
- Added and updated Playwright coverage in `tests/e2e/emulator-auth.spec.ts`:
  - new `meal planner clone without saved history shows recoverable feedback`;
  - new `meal planner clone from previous saved plan creates a draft for the selected week`;
  - updated `meal-planner-failure generation feedback keeps current draft visible`.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal planner"`: passed 11/11.
- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal-planner-failure"`: passed 2/2.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed. Existing warnings remain for Browserslist freshness, mixed static/dynamic imports, and large bundle chunk size.
- In-app browser manual proof on `http://127.0.0.1:5173/plan`:
  - `Clone Last Week` with no saved history showed `No previous saved plan was found to clone...`;
  - `Clone Last Week` with a seeded partial previous plan created a next-week draft, showed `Previous saved plan cloned into this week...`, displayed the cloned `Browser Clone Bowl...` recipe, and left `Confirm Plan` enabled;
  - no JavaScript dialog appeared;
  - console error log after clone was empty;
  - `Auto-Generate Week` in the local emulator showed `Could not generate a meal plan: generateMealPlan is disabled in the local emulator...`;
  - no JavaScript dialog appeared;
  - the `Create Your Week Plan` wizard remained open and `Auto-Generate Week` remained available;
  - console error log after generation was empty.

### Decision

`BUG-PLAN-005` is repaired for the current private-alpha Meal Planner page contract. `BUG-015` can be closed. Native alerts still exist in save-failure and Add-to-List/shopping-list paths, but those belong to separate future batches because their ownership is save recovery and Grocery/cross-page workflow, not clone/generate recovery. The added clone-success test caught and closed a partial-plan clone bug during this batch.

## 2026-06-27 Meal Planner Manual-QA Regression Repair, Batch A/B

Date: 2026-06-27
Mode: `frontend-qa-bug-hunter` workflow, read-only subagent diagnosis, focused repair batch, Playwright regression, in-app browser manual verification
Scope: `BUG-015` Meal Planner findings `BUG-PLAN-001` through `BUG-PLAN-004`.

### Goal

Repair the first related Meal Planner batch from the manual audit without mixing in the native alert / AI-generation cleanup. The batch covered week navigation, selected-week reload context, tab active state, and named wizard controls.

### Findings And Fixes

- Confirmed the live `/plan` bug before editing:
  - after dismissing the empty-week prompt, `Next week` moved from `Plan Week of Jun 22` to `Plan Week of Jun 29`;
  - the empty-week prompt reopened on the navigated week and trapped the page;
  - `Previous week` could not return to Jun 22 while the modal was covering the planner.
- Fixed navigated-week behavior in `src/pages/MealPlanner.tsx`:
  - week navigation now closes any open prompt;
  - the destination week is marked dismissed so the prompt does not immediately reopen over every empty navigated week;
  - the selected planner week is stored in session storage so a refresh keeps the user on the week they were planning.
- Added accessible planner header semantics:
  - Day/Week/Month tabs now expose `aria-pressed`;
  - week navigation controls have explicit names: `Previous week` and `Next week`.
- Fixed wizard controls in `src/components/PlanGenerationWizard.tsx`:
  - Daily Smoothie, Daily Tea, and Include Snacks are native named checkbox controls;
  - decorative material icons in those labels are marked `aria-hidden`.
- Added focused Playwright coverage in `tests/e2e/emulator-auth.spec.ts`:
  - `meal planner week navigation moves next and previous without prompt trap`;
  - `meal planner future-week empty grid saves and stays selected after reload`;
  - upgraded non-week mode test to assert tab `aria-pressed`;
  - `meal planner wizard exposes named smoothie and tea toggles`.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal planner"`: passed 9/9 after elevated rerun because sandboxed Chromium launch failed with `spawn EPERM`.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after elevated rerun because sandboxed Vite/esbuild could not read the config path.
- In-app browser manual proof on `http://127.0.0.1:5173/plan`:
  - initial empty current week still showed the intentional prompt;
  - `Maybe Later` dismissed it;
  - `Next week` moved to `Plan Week of Jun 29` with `promptVisible: false`;
  - `Previous week` returned to `Plan Week of Jun 22` with `promptVisible: false`;
  - tab state showed Day false, Week true, Month false;
  - wizard controls exposed checkbox IDs for smoothie, tea, and snacks;
  - console warnings/errors during the focused route check: none.

### Decision

`BUG-PLAN-001`, `BUG-PLAN-002`, `BUG-PLAN-003`, and `BUG-PLAN-004` are repaired for the current private-alpha scope. Keep `BUG-015` open for the next Meal Planner batch: `BUG-PLAN-005` native alert / clone / auto-generate interruption cleanup.

## 2026-06-27 Recipe Library Manual-QA Regression Repair

Date: 2026-06-27
Mode: Focused repair batch, automated regression tests, in-app browser manual sanity pass
Scope: `BUG-014` Recipe Library controls from the manual QA audit.

### Goal

Resolve the first 3-4 bug batch from the manual audit: recipe card delete reliability, card action accessibility, sticky AI Search reset behavior, and Magic Import action clarity.

### Findings And Fixes

- Reopened the Recipe Library page contract because the 2026-06-27 manual audit contradicted the earlier local-graduated status.
- Added manual-audit regression batches to `docs/bug-ledger.md` so subsequent work can proceed 3-4 bugs at a time.
- Fixed Recipe Library card action controls:
  - favorite, edit, and delete actions are now visible rather than hover-only;
  - each action has a recipe-specific accessible name.
- Fixed recipe deletion state:
  - deletion updates the main recipe list;
  - deletion updates any active AI result list;
  - deletion closes an open selected recipe if it matches the deleted recipe.
- Fixed recipe refresh after save so an empty Firestore recipe collection can update the UI instead of preserving stale recipes.
- Fixed sticky AI Search reset:
  - `All Recipes` clears AI results and query text;
  - a dedicated `Clear recipe search` control clears the query and AI result state;
  - the AI submit button now has the accessible name `Run AI recipe search`.
- Clarified Magic Import:
  - on `/recipes`, the top Magic Import control routes to `/recipes/import`;
  - on `/recipes/import`, the top Magic Import control is a labeled file chooser.

### Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning outside the restricted sandbox because Vite/esbuild could not resolve the config path inside the sandbox.
- Focused Playwright emulator slice passed 4/4:
  - `user can create, find, and delete a manual recipe`
  - `recipe library controls either work or show honest coming soon states`
  - `AI recipe search can reset back to the full library`
  - `AI recipe search fails gracefully when the callable returns an error`
- In-app browser manual sanity pass on `http://127.0.0.1:5173/recipes`:
  - confirmed Magic Import exposes `Open Magic Import recipe upload page`;
  - confirmed visible recipe-specific favorite/edit/delete actions;
  - confirmed leftover `QA Test Recipe Edited` opened `Delete Recipe?` through `Delete recipe: QA Test Recipe Edited`;
  - confirmed `QA Test Recipe Edited` disappeared after Delete confirmation.

### Decision

`BUG-014` is closed for the current private-alpha scope. Continue with `BUG-015` Meal Planner week/navigation/wizard batch next.

## 2026-06-26 Chrome/Subagent Deploy Readiness Rerun And Pantry Honesty Patch

Date: 2026-06-26
Mode: Serialized Chrome smoke, read-only subagent scouts, local build, emulator QA, production-build emulator QA
Scope: Reassess private-alpha deploy readiness after the checkpoint commit and pressure-test active-looking controls.

### Goal

Confirm whether production deploy readiness can proceed, while using Chrome and read-only scout agents to find workflow bugs that route smoke alone can miss.

### Findings And Fixes

- Full local readiness was rerun after the restart.
- Read-only scout agents found no new P0/P1 launch blocker.
- Chrome route sweep proved login, Dashboard, Meal Planner, Grocery, Recipe Library, Recipe Import, Progress, Settings, and Pantry render real route content in `main`.
- Chrome re-tested the Meal Planner empty-week prompt: `Maybe Later` dismissed the modal and sidebar navigation to Grocery worked with no blocking overlay.
- Chrome found no console errors during the final Pantry check.
- Known Dashboard Recharts warning remains `BUG-013` and is still deferred.
- Pantry remains deferred, but the red-team scout correctly flagged active-looking prototype controls. Fixed:
  - removed barcode-scan language from the search placeholder;
  - disabled shortcut affordance as `Shortcut Coming Soon`;
  - disabled quantity +/- controls with coming-soon titles;
  - disabled item edit with coming-soon title;
  - disabled pagination buttons.
- Quick-add/delete remains active as the intentional lightweight Pantry prototype.
- Added `docs/chrome-subagent-page-qa-playbook.md` and linked it from the North Star Compass, E2E QA guide, and contract roadmap so future page passes use the same Browser Captain plus scout-agent workflow.

### Verification

- `npm.cmd run check`: passed before the Pantry patch.
- `npm.cmd run qa:browser`: passed before the Pantry patch.
  - Public/protected route smoke: 18 passed.
  - Authenticated emulator smoke: 53 passed.
  - Production-build emulator smoke: 3 passed.
- `npm.cmd run test:rules`: passed.
  - Firestore rules: 19 passed.
  - Storage rules: 3 passed.
- `npm.cmd run test:e2e:emulator:data-loss`: passed, 3 tests.
- Chrome Pantry honesty check after patch:
  - `Scan Coming Soon`, `Full Pantry Coming Soon`, `Shortcut Coming Soon`, `Previous`, `Next`, and Pantry suggestion buttons were disabled;
  - `Process Items` remained enabled;
  - search placeholder no longer mentioned barcode scanning;
  - console errors: none.
- `npm.cmd run build`: passed after the Pantry patch.
- `npm.cmd run test:e2e:emulator`: passed after the Pantry patch, 53 tests.
- `npm.cmd run test:e2e:prod-emulator`: passed after the Pantry patch, 3 tests.
- `npm.cmd run check`: passed after adding the Chrome/subagent playbook and doc links.

### Decision

Private-alpha deploy readiness remains green from local evidence, with Hosting still requiring explicit user approval and a fresh commit/push decision. Pantry should remain deferred and not be promoted until a real Pantry page contract is opened.

### Remaining Deferrals

- `BUG-009`: Semantic search vector index remains deferred.
- `BUG-010`: Remaining moderate Functions audit advisories remain accepted for private alpha.
- `BUG-013`: Dashboard Recharts warning remains non-blocking cleanup.
- Billing hard cutoff remains deferred.
- Valid live AI provider smoke remains a separate explicit approval gate.

## 2026-06-26 Production Deploy Readiness Gate

Date: 2026-06-26
Mode: Local validation, Chrome manual smoke, emulator QA, production-build emulator QA, rules/data-loss verification
Scope: Prepare the current private-alpha tree for a future user-approved Hosting deploy without deploying Hosting.

### Goal

Prove the current working tree is locally stable enough to be considered for an explicit Hosting-only deploy, while finding launch blockers before they reach production.

### Findings And Fixes

- Found and fixed a P1 Meal Planner blocker: the empty-week `PlanPromptModal` reopened immediately after `Maybe Later`, leaving the overlay in place and blocking sidebar navigation.
- Added a dismissed-week guard in `src/pages/MealPlanner.tsx`.
- Added emulator regression coverage: `meal planner prompt can be dismissed without blocking sidebar navigation`.
- Preserved the earlier Settings fix where app settings are the source of truth and Firebase Auth profile sync is best-effort.
- Preserved the production-emulator console filter for the known transient Firestore emulator offline startup message.
- Chrome still reports a non-blocking Dashboard Recharts container-size warning; this is logged as `BUG-013`.

### Verification

- `npm.cmd run check`: passed.
- `npm.cmd run qa:browser`: passed.
  - Public/protected route smoke: 18 passed.
  - Authenticated emulator smoke: 53 passed.
  - Production-build emulator smoke: 3 passed.
- `npm.cmd run test:rules`: passed.
  - Firestore rules: 19 passed.
  - Storage rules: 3 passed.
- Targeted data-loss run also passed before the final full suite:
  - generated grocery refresh preserves manual items and replaces generated items;
  - failed recipe image import cleans up uploaded asset;
  - canceling a parsed recipe import cleans up uploaded asset.
- Chrome manual smoke against emulator-backed `http://127.0.0.1:5173/`:
  - login succeeded with emulator account;
  - Dashboard rendered real widgets;
  - Plan prompt dismissal released navigation after the fix;
  - strict sidebar navigation reached Grocery, Recipes, Progress, Settings, and Pantry;
  - Pantry showed Coming Soon state;
  - `/recipes/import` showed Magic Import copy and an enabled file input accepting `image/*,.pdf`.
- Read-only QA agents found no P0 source/config blockers and confirmed Hosting should remain blocked until validation, bug review, and commit hygiene are complete.
- Local deploy controls checked:
  - `.firebaserc` default project is `viomacro`;
  - `firebase.json` includes Hosting, Firestore, Storage, and Functions, so deploy commands must use explicit `--only`;
  - ignored web `.env` contains Firebase project config and `VITE_RECAPTCHA_SITE_KEY`;
  - ignored Functions `.env` contains `OWNER_UIDS`.

### Decision

The local production deploy readiness gate is green for private-alpha consideration, but Hosting is not deployed and still requires an explicit user approval plus a clean committed checkpoint. Use `firebase deploy --only hosting --project viomacro` only after the final safety scan and commit.

### Remaining Deferrals

- `BUG-004`: Pantry remains deferred and needs its own future page contract if promoted.
- `BUG-009`: Semantic search vector index remains deferred.
- `BUG-010`: Remaining moderate Functions audit advisories remain accepted for private alpha.
- `BUG-013`: Dashboard Recharts warning remains non-blocking cleanup.
- Billing hard cutoff remains deferred; alert-only monitoring is already proven.

## 2026-06-26 AI/Functions Production Config Probe

Date: 2026-06-26
Mode: Read-only production metadata + local ignored env checks
Scope: Continue AI/Functions launch-readiness task 8 without running broad live AI or deploying Hosting.

### Goal

Confirm which production AI/Functions config pieces are proven and identify the smallest remaining gate before controlled live smoke.

### Verification

- `npx.cmd --yes firebase-tools functions:list --project viomacro`: confirmed deployed v2 Node 22 Functions for `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, `semanticSearchRecipes`, and `billingBudgetMonitor`.
- Secret Manager metadata confirmed `GEMINI_API_KEY` exists with automatic replication; the secret value was not read.
- Local ignored `Web App/functions/.env` exists and contains `OWNER_UIDS`; the UID value was not printed.
- Local ignored `Web App/.env` exists and contains Firebase app config fields, but `VITE_RECAPTCHA_SITE_KEY` is missing.
- App Check Admin API metadata confirmed reCAPTCHA v3 config exists for the Firebase web app and reports token TTL `86400s`; the site secret is intentionally not returned by the API.
- `gcloud` is not installed locally, and the Firebase CLI version here does not expose safe App Check/API key metadata commands.

### Decisions

- Do not close the AI/Functions launch-readiness contract yet.
- Open `BUG-011` for the App Check client site key gate.
- Do not run live AI/browser callable smoke until `VITE_RECAPTCHA_SITE_KEY` is set and API key restrictions are manually confirmed.

### Notes

- No Hosting deploy was performed.
- No broad live AI calls were performed.
- No secret value or token was written to docs.

## 2026-06-26 App Check Callable Smoke Attempt

Date: 2026-06-26
Mode: Production config smoke attempt + temporary Auth user cleanup
Scope: Try to prove production callable App Check acceptance without deploying Hosting and without spending Gemini tokens.

### Goal

Run one controlled callable request against `generateMealPlan` with an intentionally invalid `{}` payload. Passing proof would be a `400 INVALID_ARGUMENT` response with `Missing user settings`, because that means Auth and App Check passed before payload validation and Gemini execution.

### Verification

- Public reCAPTCHA v3 site key was found in reCAPTCHA Admin for `https://viomacro.web.app/` and added to ignored local `Web App/.env`.
- `npm.cmd run build`: passed after adding the site key.
- Firebase browser API key restrictions were verified through API Keys metadata:
  - `https://viomacro.web.app/*`
  - `https://viomacro.firebaseapp.com/*`
  - `http://localhost:5173/*`
  - `http://127.0.0.1:5173/*`
  - API target restrictions are present.
- Temporary Firebase Auth user `codex-smoke-2e67bb1980a3@viomacro.test` was created only after supplying the allowed `http://localhost:5173/` referrer to the restricted browser API key.
- Temporary user deletion was confirmed in Firebase Console with success message `Deleted codex-smoke-2e67bb1980a3@viomacro.test`.

### Findings

- Local production smoke on `localhost:5173` could not mint a reCAPTCHA token because the reCAPTCHA key domain list currently contains `viomacro.web.app`, not `localhost`.
- Hosted-origin smoke against `https://viomacro.web.app/` could not be completed from local headless Chrome/Edge because that automation surface returned `ERR_NETWORK_ACCESS_DENIED`.
- The in-app browser could reach Google/Firebase pages, but its safe evaluation scope does not allow the script injection needed for low-level reCAPTCHA token minting.

### Decisions

- `BUG-011` stays open.
- Do not mark AI/Functions launch-readiness closed yet.
- Next approval needed: add `localhost` to the reCAPTCHA v3 domain list, or use another reachable hosted smoke origin.

### Notes

- No Hosting deploy was performed.
- No broad live AI call was performed.
- No Gemini token-spending request was sent; smoke stopped before a valid AI payload.
- No temp password, ID token, or App Check token was written to docs.

## 2026-06-26 App Check Callable Smoke Completion

Date: 2026-06-26
Mode: Production callable SDK smoke with temporary Auth user cleanup
Scope: Prove production callable App Check acceptance without deploying Hosting and without sending a valid Gemini request.

### Goal

Run the real Firebase Web SDK callable path from `http://localhost:5173/` with an intentionally invalid `{}` payload. Passing proof is `functions/invalid-argument` with `Missing user settings.`, because that means Firebase Auth and App Check passed before request validation and before Gemini execution.

### Verification

- Added `localhost` to the reCAPTCHA v3 domain list and verified it remained listed after saving.
- `npm.cmd run build`: passed.
- A temporary local SDK smoke harness signed in with a temporary Firebase Auth user, initialized App Check with reCAPTCHA v3, and called `generateMealPlan` through `httpsCallable`.
- Initial SDK smoke returned `functions/internal`; Cloud Run Security showed the callable service was set to `Require authentication` at the infrastructure layer.
- Changed Cloud Run Security to `Allow public access` for callable AI services: `generateMealPlan`, `parseRecipeFromImage`, and `semanticSearchRecipes`. Handler-level Firebase Auth and App Check remain required in source.
- Final SDK smoke returned `functions/invalid-argument` with `Missing user settings.` for `{}`.
- Temporary Firebase Auth smoke user was deleted; the temp credential file and temporary harness directory were removed.

### Decisions

- `BUG-011` is closed.
- Production config checklist task 8 in the AI/Functions readiness contract is checked off.
- Do not run valid live Gemini smoke yet; this pass intentionally stopped before provider execution.

### Notes

- No Hosting deploy was performed.
- No broad live AI call was performed.
- No valid Gemini token-spending request was sent.
- No temp password, ID token, App Check token, or secret value was written to docs.

## 2026-06-26 AI/Functions Private-Alpha Closure Decision

Date: 2026-06-26
Mode: Contract closure decision
Scope: Close AI/Functions launch-readiness for private alpha without making semantic search a launch blocker.

### Decision

- Semantic search is deferred for private alpha.
- Normal keyword recipe search and semantic-search failure fallback are the launch path.
- `BUG-009` stays deferred and must be completed only before semantic search is enabled, promoted, or tested live.
- `BUG-010` stays accepted/deferred for private-alpha scope until Firebase Functions supports the clean Admin SDK v14 upgrade path.
- AI/Functions launch-readiness contract task 10 is closed for private-alpha scope.

### Next Gate

Move to the Production Deploy Readiness Gate before any Hosting deploy.

## 2026-06-26 Billing Safety Phase 3 Deployed Proof

Date: 2026-06-26
Mode: Functions-only deploy + Pub/Sub sample verification
Scope: Prove the deployed alert-only billing monitor receives budget notification messages and does not perform destructive billing actions.

### Goal

Complete billing safety phase 3 by proving the deployed `billingBudgetMonitor` function receives a Pub/Sub budget message and logs parsed fields in alert-only mode.

### Cloud Actions

- Pushed checkpoint commits to GitHub:
  - `a0e32f1 chore: checkpoint viomacro launch readiness`
  - `06d0857 chore: checkpoint chef gpt knowledge pack`
- Deployed Functions only to project `viomacro`.
- Did not deploy Hosting.
- Created `billingBudgetMonitor(us-east1)`.
- Updated existing Functions: `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, and `semanticSearchRecipes`.
- Set Artifact Registry cleanup policy for `projects/viomacro/locations/us-east1/repositories/gcf-artifacts` to delete images older than 1 day.
- Published one safe sample message to `projects/viomacro/topics/viomacro-budget-alerts`.

### Verification

- `git push`: succeeded, `main -> main`.
- `npx.cmd --yes firebase-tools deploy --only functions --project viomacro`: Functions deployed successfully; CLI exited nonzero only because cleanup policy setup was missing in `us-east1`.
- `npx.cmd --yes firebase-tools functions:artifacts:setpolicy --location us-east1 --days 1 --force --project viomacro`: passed.
- Pub/Sub sample message ID: `20264525250022298`.
- `npx.cmd --yes firebase-tools functions:log --only billingBudgetMonitor --project viomacro`: confirmed the function logged `Billing budget notification received.`
- Logged fields included:
  - `budgetDisplayName: "$20 Monthly Budget Alert"`
  - `billingAccountId: "012928-6470BD-6D1EFF"`
  - `budgetId: "45c38598-4a54-4292-8134-a120fd9962f8"`
  - `costAmount: 18`
  - `budgetAmount: 20`
  - `percentUsed: 0.9`
  - `alertThresholdExceeded: 0.9`
  - `currencyCode: "USD"`
  - `mode: "alert-only"`
  - `destructiveAction: false`

### Decisions

- Billing phase 3 alert-only monitor is proven for one sample message.
- Hard cutoff remains deferred and unimplemented.
- Multi-threshold dry-run matrix remains optional/future: 25%, 90%, 100%, and over-cutoff samples.

### Notes

- Cloud Shell browser authorization got stuck, so the sample message was published through the Pub/Sub REST API using the already-authenticated local Firebase CLI credential path.
- The access token was not written to files or docs.

## 2026-06-26 Git Checkpoint Gate - Web App

Date: 2026-06-26
Mode: Git hygiene + verification
Scope: Prepare Web App stabilization and launch-readiness work for a separate checkpoint commit from Chef Professional AI GPT changes.

### Goal

Prevent the large dirty tree from turning into one risky mixed commit, while proving the Web App work still passes the minimum local gate before staging.

### Files Changed

- `docs/git-checkpoint-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/qa-ledger.md`

### Findings

- Dirty tree contains two major workstreams: Web App stabilization/launch-readiness and Chef Professional AI GPT knowledge-pack restructuring.
- Group A should include `Web App/` only.
- Group B should include `Chef Professional AI GPT/` only.
- A casual `git add .` would mix unrelated workstreams.

### Verification

- `git status -sb`: confirmed dirty tree on `main` tracking `origin/main`.
- `git diff --name-status`: confirmed tracked Web App changes and tracked Chef GPT module deletions.
- `git ls-files --others --exclude-standard`: confirmed new Web App contract/test files and new Chef GPT condensed module files.
- `npm.cmd run check`: passed outside sandbox. The first sandboxed attempt failed at Vite/esbuild config resolution with access denied, matching the known local sandbox issue rather than an app failure.
- `npm.cmd run test:functions:contracts`: passed, 19 tests.
- Secret-pattern scan found placeholders/examples and scan documentation only; no live key pattern was found in app source.

### Decisions

- Stage and commit Web App first because it is the prerequisite for Functions-only deploy proof.
- Keep Chef GPT package work separate for a second checkpoint.
- Do not push until checkpoint commits are reviewed.

### Commit

- `chore: checkpoint viomacro launch readiness`
- Scope: Web App only.
- Chef Professional AI GPT changes remain uncommitted for a separate checkpoint.

## 2026-06-26 Billing Safety Phase 3 Source Monitor

Date: 2026-06-26
Mode: Functions implementation + local contract tests
Scope: Add the alert-only Pub/Sub billing monitor source for topic `viomacro-budget-alerts` without implementing any billing cutoff behavior.

### Goal

Give the existing budget Pub/Sub topic a safe Functions listener that can parse and log budget notifications, while proving locally that malformed payloads are rejected by the parser and no destructive Billing API behavior exists in this phase.

### Files Changed

- `functions/src/index.ts`
- `functions/tests/callable-contracts.test.cjs`
- `docs/billing-kill-switch-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/security-cost-control.md`
- `docs/pre-hosting-readiness.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Added `billingBudgetMonitor`, a Pub/Sub-triggered Firebase Function subscribed to topic `viomacro-budget-alerts`.
- Added `parseBillingBudgetNotification`, a pure parser for Cloud Billing budget notification payloads.
- The monitor logs parsed budget fields with `mode: "alert-only"` and `destructiveAction: false`.
- Malformed Pub/Sub budget messages are logged as invalid and acknowledged rather than retried indefinitely.
- No Cloud Billing API import, IAM cutoff role, project unlinking, or billing-disable behavior was added.

### Verification

- `npm.cmd --prefix "Web App\functions" run build`: passed.
- `npm.cmd --prefix "Web App\functions" run lint`: passed.
- `npm.cmd --prefix "Web App\functions" run test:contracts`: passed, 19 tests.
- New parser tests prove:
  - valid budget payloads extract billing account ID, budget ID, cost, budget amount, thresholds, currency, and percent used;
  - not-yet-exceeded threshold fields can be absent;
  - malformed numeric fields are rejected.

### Decisions

- Keep billing contract task 5 open until the monitor is deployed and a Pub/Sub sample/budget message proves the live trigger path.
- Keep hard cutoff deferred. It requires separate user approval, exact allowlisting, IAM review, dry-run tests, and an explicit enable flag.

### Notes

- Existing contract-test provider error logs are expected from negative AI tests; all tests passed.
- The prior no-default-subscription topic warning is addressed by source code only after Functions deploy creates the trigger subscription. Cloud proof remains pending.

## 2026-06-26 Billing Safety Phase 1-2 Completed

Date: 2026-06-26
Mode: Google Cloud Console setup + verification
Scope: Complete budget email alert confirmation, create Pub/Sub topic, and connect budget notifications for project `viomacro`.

### Goal

Create a non-destructive programmatic budget-notification path before live AI smoke testing or broader Firebase usage, while leaving hard billing cutoff code deferred.

### Cloud Resources Confirmed

- Billing account: `012928-6470BD-6D1EFF`.
- Budget: `$20 Monthly Budget Alert`.
- Budget ID: `45c38598-4a54-4292-8134-a120fd9962f8`.
- Budget scope: project `VioMacro`.
- Alert thresholds: `25%`, `50%`, `75%`, `90%`, `100%`.
- Pub/Sub topic: `projects/viomacro/topics/viomacro-budget-alerts`.

### Files Changed

- `docs/billing-kill-switch-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/security-cost-control.md`
- `docs/pre-hosting-readiness.md`
- `docs/qa-ledger.md`

### Verification

- Google Cloud Billing budget list showed `$20 Monthly Budget Alert` with current spend `$0.00 / $20.00`.
- Google Cloud Pub/Sub topic page showed `projects/viomacro/topics/viomacro-budget-alerts`.
- Budget edit page showed `Connect a Pub/Sub topic to this budget` enabled.
- Budget edit page showed selected topic `projects/viomacro/topics/viomacro-budget-alerts`.
- After saving and reopening the budget edit page, the selected topic still appeared, confirming persistence.

### Decisions

- No destructive billing cutoff was implemented.
- No Cloud Function, Cloud Run service, IAM cutoff role, or Billing API unlink behavior was deployed.
- Next phase is an alert-only monitor that can receive or process budget messages without disabling billing.

### Notes

- The Pub/Sub topic was created without a default subscription. This is acceptable for phase 2, but phase 3 must add a subscriber or trigger so budget messages are not merely published and dropped.
- Hard cutoff remains deferred until alert-only behavior, IAM scope, dry-run tests, and explicit user approval are complete.

## 2026-06-26 Billing Safety Contract Created

Date: 2026-06-26
Mode: Launch-readiness planning + official-doc verification
Scope: Connect AI/Functions live-readiness with budget alerts and staged billing kill switch safety.

### Goal

Prevent live AI or Firebase usage from moving forward without a clear cost-safety ladder: email budget alert first, Pub/Sub notifications second, alert-only monitor third, hard billing cutoff last and only with explicit user approval.

### Files Changed

- `docs/billing-kill-switch-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/security-cost-control.md`
- `docs/pre-hosting-readiness.md`
- `docs/qa-ledger.md`

### Findings

- Firebase budget alerts help monitor spend but do not cap usage or charges and can be delayed.
- Google Cloud Billing supports Pub/Sub programmatic budget notifications.
- Google Cloud Billing supports disabling billing by unlinking a project from its billing account.
- Disabling billing is destructive: Google Cloud services stop, Firebase downgrades from Blaze to Spark, and services can shut off if Spark quotas are exceeded.

### Decision

Do not implement or deploy a hard cutoff immediately. First complete budget email alerts and Pub/Sub budget notifications. Then build an alert-only monitor. Add hard cutoff code only behind an explicit environment flag after alert-only behavior and IAM are proven.

### Verification

- Created `docs/billing-kill-switch-contract.md` with a numbered task checklist.
- Updated roadmap task 15 to active.
- Updated pre-hosting readiness to require billing safety phase 1-2 before Hosting readiness.
- Updated security/cost control docs to point to the contract.

### Notes

- No destructive billing action was performed.
- No Cloud resources were created from Codex in this pass.
- Next user-visible step is Google Cloud/Firebase Console setup: budget email alert plus Pub/Sub topic connection.

## 2026-06-26 Functions Dependency Audit Decision

Date: 2026-06-26
Mode: Dependency-upgrade trial + Functions QA
Scope: Address `BUG-010` and decide whether the remaining production-only audit advisories should be fixed now or accepted temporarily.

### Goal

Determine whether the remaining 8 moderate production audit advisories can be safely resolved by upgrading to `firebase-admin@14.1.0` without creating an unsupported Firebase Functions dependency tree.

### Files Changed

- `functions/package.json`
- `functions/package-lock.json`
- `docs/ai-functions-readiness-contract.md`
- `docs/bug-ledger.md`
- `docs/security-cost-control.md`
- `docs/pre-hosting-readiness.md`
- `docs/qa-ledger.md`

### Findings

- Official Firebase Admin Node v14 release notes identify v14 as a breaking major release.
- v14 breaking changes include dropping Node 18/20 support, removing deprecated legacy namespace support, removing deprecated Instance ID service, and dropping legacy messaging types.
- The VioMacro Functions runtime already targets Node 22, and current source uses modular Admin SDK imports.
- `firebase-admin@14.1.0` passed local Functions build, lint, and callable contract tests.
- Current `firebase-functions` and `firebase-functions-test` peer ranges do not declare `firebase-admin@14` compatibility.
- Non-forced `npm.cmd --prefix functions audit fix --omit=dev` failed with `ERESOLVE` under `firebase-admin@14.1.0`.

### Decision

Do not force `firebase-admin@14.1.0` right now. Revert to supported `firebase-admin@13.10.0`, keep the previously applied non-breaking audit remediation, and accept the remaining 8 moderate production advisories for private-alpha work until Firebase Functions packages support Admin SDK v14 cleanly.

### Verification

- With `firebase-admin@14.1.0`:
  - `npm.cmd --prefix functions run build`: passed.
  - `npm.cmd --prefix functions run lint`: passed.
  - `npm.cmd run test:functions:contracts`: 16 passed.
  - `npm.cmd --prefix functions audit fix --omit=dev`: failed with peer dependency `ERESOLVE`.
- Final supported state after reverting to `firebase-admin@13.10.0`:
  - `npm.cmd --prefix functions run build`: passed.
  - `npm.cmd --prefix functions run lint`: passed.
  - `npm.cmd run test:functions:contracts`: 16 passed.
  - `npm.cmd --prefix functions audit --omit=dev`: exits non-zero with only the known 8 moderate `uuid` chain advisories.

### Notes

- This is not a P0/P1 blocker for private-alpha work.
- Revisit before broader production launch or when Firebase Functions packages declare Admin SDK v14 peer support.
- Local npm still warns that the machine is running Node `v24.12.0` while Functions declares Node `22`; this is local tooling drift, not a Functions runtime change.

## 2026-06-26 AI And Functions Launch-Readiness Partial Graduation

Date: 2026-06-26
Mode: Workflow contract + provider migration + Functions QA
Scope: Start AI/Functions launch-readiness contract and harden local callable/provider foundation.

### Goal

Move AI/Functions readiness from assumed to evidenced: refresh callable contract tests, migrate off the legacy Gemini SDK, keep emulator AI-spend guardrails, and document remaining live gates before any broad live AI test.

### Files Changed

- `functions/src/index.ts`
- `functions/tests/callable-contracts.test.cjs`
- `functions/package.json`
- `functions/package-lock.json`
- `docs/ai-functions-readiness-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/bug-ledger.md`
- `docs/security-cost-control.md`
- `docs/pre-hosting-readiness.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Functions now use the maintained `@google/genai` SDK instead of legacy `@google/generative-ai`.
- Meal-plan generation now calls `ai.models.generateContent`.
- Recipe image/PDF parsing now calls `ai.models.generateContent` with multimodal contents.
- Recipe and search embeddings now call `ai.models.embedContent` with explicit `outputDimensionality`.
- Embedding vectors must exactly match the configured Firestore vector dimension before writing/querying.
- Legacy Gemini SDK dependency was removed from Functions.
- Non-breaking production audit fixes were applied to remove critical/high production advisories.

### Bugs Found And Managed

- `BUG-009` remains open: live semantic search still needs a production Firestore vector index for `recipes.embedding` dimension `1536`.
- `BUG-010` opened: production-only Functions audit still reports 8 moderate advisories requiring a breaking `firebase-admin@14.1.0` upgrade path.

### Behavior Proved

- Existing callable protection still works after provider migration.
- Emulator live-AI guard still blocks accidental provider calls by default.
- Mocked provider success still works for meal-plan generation and recipe parsing.
- Mocked provider failure and malformed JSON still return bounded internal errors.
- Unsupported asset type, cross-user Storage path, oversized meal-plan payload, missing search query, and long search query guardrails still pass.
- Functions lint and TypeScript build still pass after dependency and provider changes.

### Verification

- Baseline before provider migration:
  - `npm.cmd run test:functions:contracts`: 16 passed.
  - `npm.cmd --prefix functions run lint`: passed.
  - `npm.cmd --prefix functions run build`: passed.
- Provider/dependency patch:
  - `npm.cmd --prefix functions install @google/genai`: completed.
  - `npm.cmd --prefix functions uninstall @google/generative-ai`: completed.
  - `npm.cmd --prefix functions audit fix --omit=dev`: removed critical/high production advisories; left moderate advisories requiring breaking major upgrade.
  - `npm.cmd --prefix functions install`: restored normal dev dependency install shape after production-only audit fix.
- After provider migration:
  - `npm.cmd --prefix functions run lint`: passed.
  - `npm.cmd --prefix functions run build`: passed.
  - `npm.cmd run test:functions:contracts`: 16 passed.
- Production-only dependency audit after non-breaking fix:
  - `npm.cmd --prefix functions audit --omit=dev`: exits non-zero with 8 moderate advisories.
  - Remaining fix path: `firebase-admin@14.1.0`, a breaking major upgrade.
- Client failure-boundary review:
  - Meal Planner page contract already proves AI generation failure shows feedback and keeps the draft visible.
  - Recipe Import workflow contract already proves parse failure cleanup and failure feedback.
  - Recipe Library page contract already proves semantic-search failure fallback.
- Local secret-pattern scan:
  - `rg -n "GEMINI_API_KEY=|PASTE_YOUR_API_KEY|AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{20,}|VITE_RECAPTCHA_SITE_KEY=" "Web App" --glob "!node_modules/**" --glob "!functions/node_modules/**" --glob "!dist/**" --glob "!functions/lib/**"`
  - Findings were placeholders/example keys only; no live API key pattern was found in app source.

### Notes

- Live Gemini calls were not run in this pass.
- Hosting deploy remains blocked.
- Broad live AI testing still requires user approval, production config confirmation, App Check, budget readiness, and the semantic-search vector index gate.
- npm warns that local Node is `v24.12.0` while Functions declares Node `22`; this is local tooling drift, not a deployed runtime change.

## 2026-06-26 Navigation Shell And Mobile Layout Local Graduation

Date: 2026-06-26
Mode: Workflow contract + implementation + emulator QA
Scope: Close Navigation shell and mobile layout contract for current private-alpha scope.

### Goal

Prove signed-in users can reach primary app surfaces, understand active route state, access Settings/profile controls, and sign out from desktop and mobile shell without dead active-looking controls.

### Files Changed

- `src/components/AppLayout.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/navigation-shell-workflow-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Mobile shell now exposes Settings under an Account section.
- Desktop and mobile profile rows now route to Settings instead of looking clickable without behavior.
- Desktop and mobile sign-out buttons now have accessible names.
- Header title now handles nested protected routes such as `/recipes/import`.
- Header planning copy no longer contains mojibake.
- Mobile footer has extra bottom padding so the local Firebase emulator warning does not intercept Sign out.

### Bugs Found And Fixed

- Mobile users could not reach Settings from the shell.
- Desktop profile row looked interactive but did not navigate.
- Icon-only desktop sign out had weak accessible naming.
- Nested routes fell back to `VioMacro` in the shell title.
- Local emulator warning could intercept the mobile Sign out button.

### Behavior Proved

- Desktop shell reaches Dashboard, Plan, Recipes, Progress, Grocery List, Pantry, and Settings.
- Desktop active nav state is semantically marked with `aria-current="page"`.
- Desktop profile settings link routes to `/settings`.
- Desktop sign out returns to `/auth`.
- Mobile shell exposes Settings and profile settings.
- Mobile menu closes after Settings selection.
- Mobile sign out returns to `/auth`.
- Existing mobile route smoke still reaches Recipes and Grocery.
- Notifications remain disabled with Coming Soon labeling.

### Verification

- Baseline shell smoke passed before patching:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:426 tests/e2e/emulator-auth.spec.ts:463 tests/e2e/emulator-auth.spec.ts:954"`
  - Result: 2 passed.
- Focused Navigation shell proof passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:491 tests/e2e/emulator-auth.spec.ts:527 tests/e2e/emulator-auth.spec.ts:1169"`
  - Result: 2 passed after line shift; focused desktop and mobile shell tests passed.
- Existing mobile route smoke passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:1165"`
  - Result: 1 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox.

### Notes

- Non-blocking warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning during emulator startup.
- Pantry remains intentionally deferred by user decision, even though the shell still links to the existing `/pantry` route.
- Notifications remain Coming Soon.

## 2026-06-26 Auth And Onboarding Local Graduation

Date: 2026-06-26
Mode: Workflow contract + implementation + emulator QA
Scope: Close Auth/Onboarding workflow contract for current private-alpha scope.

### Goal

Prove users can create an account, log in, skip or finish onboarding once, and return to the app without onboarding repeating because of late user initialization.

### Files Changed

- `src/services/userService.ts`
- `src/components/OnboardingWizard.tsx`
- `src/pages/AuthPage.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/auth-onboarding-workflow-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/qa-ledger.md`

### Behavior Changed

- New user initialization now uses a Firestore transaction so a late default user-document write cannot overwrite an already-completed onboarding flag.
- A dev-only delayed-initialization hook was added for deterministic onboarding race regression coverage.
- Onboarding skip and finish now show visible save failure recovery instead of silently failing.
- Local emulator mode disables Google sign-in with honest `Google Sign-In Coming Soon` copy; production can still use the Google flow when configured and tested.
- Auth error mapping now treats missing user, wrong password, invalid credential, and invalid email as `Invalid email or password`.

### Bugs Found And Fixed

- `initializeUser()` previously used a read-then-write flow. If the user skipped onboarding while initialization was still in flight, the late default write could restore `onboardingCompleted: false`, making onboarding repeat.
- Existing onboarding smoke only proved immediate hide after skip, not persistence after reload.
- Onboarding finish had no focused persistence coverage.
- Local Google sign-in looked active even though it is not part of emulator QA.
- Invalid login could fall to generic `Authentication failed. Please try again.` in emulator paths.

### Behavior Proved

- New email user can create an account, reach Dashboard, see onboarding, and skip setup.
- Onboarding skip survives delayed user initialization and reload.
- Onboarding finish persists current weight, goal weight, calorie target, allergy choice, and `onboardingCompleted: true`.
- Local Google sign-in is visibly disabled as Coming Soon.
- Missing fields, invalid login, weak password, and duplicate email show useful messages.
- Signed-out protected routes redirect to `/auth`.
- Sign out returns the user to `/auth`.
- Existing test user can still sign in and navigate launch-critical screens.

### Verification

- Baseline onboarding smoke passed before patching:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:283 tests/e2e/emulator-auth.spec.ts:301"`
  - Result: 1 passed.
- Grouped onboarding proof passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g onboarding"`
  - Result: 3 passed.
- Failed auth-state proof found generic invalid-login copy; patched and reran:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:384"`
  - Result: 1 passed after patch.
- Grouped Auth/Onboarding proof passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:292 tests/e2e/emulator-auth.spec.ts:311 tests/e2e/emulator-auth.spec.ts:341 tests/e2e/emulator-auth.spec.ts:384 tests/e2e/emulator-auth.spec.ts:411 tests/e2e/emulator-auth.spec.ts:426"`
  - Result: 6 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox.

### Notes

- Non-blocking warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning during emulator startup.
- Live Google sign-in remains unproven and should be tested deliberately before production promotion.
- Onboarding design itself remains future product work; this pass stabilized completion, persistence, and honesty.

## 2026-06-26 Progress / History Page Local Graduation

Date: 2026-06-26
Mode: Page contract + implementation + emulator QA
Scope: Close Progress / History `/progress` page contract for current private-alpha scope.

### Goal

Prove Progress / History can show saved plan history and recent daily metrics without fake performance data, silent failures, or dead navigation.

### Files Changed

- `src/pages/History.tsx`
- `src/services/planService.ts`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/progress-history.md`
- `docs/app-contract-roadmap.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Progress history no longer uses random adherence values.
- Saved meal plans now show deterministic completion, meal count, calorie target, and protein target data.
- Recent Metrics now summarize real daily logs from `weightHistory`.
- Empty history now has a clear empty state and a working route to `/plan`.
- Load failures now show a visible retry panel instead of a success-looking empty page.
- The old `/plan/new` history action was replaced with the owned `/plan` route.

### Bugs Found And Fixed

- `Math.random()` invented adherence evidence and changed values between reloads.
- Firestore history load failures were console-only and collapsed into an empty state.
- New users had no useful empty state.
- The history action linked to an unowned `/plan/new` route.
- Footer copy claimed automatic archival behavior that was not implemented.

### Behavior Proved

- `/progress` is reachable for a signed-in user through direct route smoke.
- Empty Progress users see `No saved plans yet` and can open Meal Planner.
- A seeded saved plan appears with deterministic meal and target values.
- A seeded daily log appears in the Recent Metrics summary.
- Injected `getMealPlans` failure shows `History could not load`.
- Retrying after an injected failure recovers to the empty state.
- No active Progress control routes to an unowned page.

### Verification

- Baseline route smoke passed before patching:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g routes"`
  - Result: 3 passed, including direct launch routes and `/progress`.
- Grouped Progress emulator proof passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g progress"`
  - Result: 3 passed.
- Post-patch route smoke passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g routes"`
  - Result: 4 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox.

### Notes

- Non-blocking warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning during emulator startup.
- Future Progress work: richer trend charts, plan duplication/editing from history, and coaching analytics. These are intentionally outside the current private-alpha contract.

## 2026-06-25 Settings Page Local Graduation

Date: 2026-06-25
Mode: Page contract + implementation + emulator QA
Scope: Close Settings `/settings` page contract for current private-alpha scope.

### Goal

Prove Settings can safely own nutrition targets, profile display, dietary preferences, and hydration preferences, and that saved targets flow into Dashboard and Meal Planner.

### Files Changed

- `src/pages/Settings.tsx`
- `src/pages/Dashboard.tsx`
- `src/lib/auth-context.tsx`
- `src/services/userService.ts`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/settings.md`
- `docs/app-contract-roadmap.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Settings now guards dirty drafts with a synchronous ref so late store hydration cannot overwrite active user edits.
- Settings save failures now show a visible alert and recovery copy while keeping the draft available.
- `Discard` now restores the local form to the last saved/store values instead of only hiding the footer.
- Dashboard fallback macro cards now derive gram targets from Settings, including exact gram mode, instead of showing macro percentages with `g` units.
- Profile display name/avatar are persisted into user settings as the app-level source of truth, while still attempting Firebase Auth profile updates.

### Bugs Found And Fixed

- Late settings hydration could reset the form back to Percentage mode after the user clicked Exact Grams.
- Dashboard displayed `macroSplit` percentages as gram targets when no active plan existed.
- Profile display name did not survive reload reliably when relying on Auth profile alone.

### Behavior Proved

- `/settings` is reachable for a signed-in user through the direct route smoke.
- Basic Settings save hides the sticky save footer after success.
- Exact gram targets persist to Firestore and reload into Settings.
- Saved Settings targets feed Dashboard target cards.
- Saved Settings targets feed Meal Planner empty-plan targets.
- Custom bottle size persists and updates the Dashboard water quick-add button.
- Failed settings save alerts the user and leaves the draft available for retry.
- `Discard` restores unsaved local edits.
- Profile display name persists after reload through app settings.
- Integrations are passive Coming Soon copy, not active connection controls.

### Verification

- Baseline route smoke passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g routes"`
  - Result: 3 passed, including direct launch routes and `/settings`.
- Grouped Settings emulator proof passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g settings"`
  - Result: 5 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

### Notes

- Non-blocking warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning during emulator startup.
- Future settings hardening: stricter Firestore settings schema validation and optional enforcement of percentage macro split totals.

## 2026-06-25 Recipe Library And Import Local Graduation

Date: 2026-06-25
Mode: Page contract + workflow contract + implementation + emulator QA
Scope: Close Recipe Library `/recipes` page contract and Recipe Import `/recipes/import` workflow contract for the current private-alpha local scope.

### Goal

Finish the remaining Recipe Library proof items without expanding scope: guided cooking entry, active-control honesty, real filter-chip behavior, save-failure recovery, and semantic-search readiness classification. Then close Recipe Import after grouped proof and build checks.

### Files Changed

- `src/pages/RecipeLibrary.tsx`
- `src/components/RecipeForm.tsx`
- `src/services/recipeService.ts`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/recipe-library.md`
- `docs/recipe-import-workflow-contract.md`
- `docs/app-contract-roadmap.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Recipe Library filter chips now actually narrow visible recipes instead of only changing visual state.
- Recipe Library no longer starts with `High Protein` silently selected, so new/manual recipes are not hidden by default.
- Recipe Form save failures now show a user-visible alert and keep the draft open.
- `recipeService` now has deterministic dev-only failure hooks for `addRecipe` and `updateRecipe`, matching the existing test strategy for meal plans, groceries, AI, and settings.

### Behavior Proved

- Recipe cards open detail view, `Start Guided Cooking` opens guided mode, and `Exit` returns to detail.
- Card favorite and edit controls work; delete remains covered by manual recipe create/search/delete.
- Macro filters, advanced filters, new folder, detail favorite/share, and add-to-meal-plan controls are disabled or Coming Soon.
- Filter chips narrow recipes for High Protein and Low Carb cases.
- Manual recipe save failure gives visible feedback, keeps the draft open, and can recover on retry.
- Import lifecycle remains proven: unsupported file rejection, failed parse cleanup, parsed draft cancel cleanup, and imported draft save.
- Local AI semantic-search failure fallback remains proven. Live vector-index readiness remains deferred under `BUG-009`.

### Verification

- Grouped recipe emulator run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts -g recipe"`
  - Result: 11 passed.
  - Included Recipe Library page proof and Recipe Import workflow proof.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning outside the restricted sandbox because Vite/esbuild could not resolve `vite.config.ts` under sandboxed filesystem access.

### Notes

- Non-blocking warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning during emulator startup.
- Recipe Library and Recipe Import are locally graduated for current private-alpha scope.
- Do not treat this as live AI semantic-search proof; `BUG-009` remains deferred until the live Firestore vector index and provider smoke are approved.

## 2026-06-25 Recipe Library And Import Contract Kickoff

Date: 2026-06-25
Mode: Page contract + workflow contract + emulator QA
Scope: Start Recipe Library `/recipes` page contract and Recipe Import `/recipes/import` workflow contract.

### Goal

Separate Recipe Library page responsibilities from Recipe Import lifecycle responsibilities, then prove the current baseline routes and existing recipe/import regressions before deeper fixes.

### Files Changed

- `docs/page-contracts/recipe-library.md`
- `docs/recipe-import-workflow-contract.md`
- `docs/qa-ledger.md`

### Behavior Proved

- `/recipes` renders for a signed-in user and shows `My Kitchen`.
- `/recipes/import` renders for a signed-in user and shows `Start with Magic Import`.
- Empty-state `Import your first recipe` reaches `/recipes/import` instead of a missing route.
- User can create, search for, and delete a manual recipe.
- AI semantic search failure falls back safely to keyword search.
- Failed recipe image import cleans up the uploaded Storage asset.
- Unsupported file drops are rejected visibly before upload.
- Canceling a successfully parsed imported draft deletes the pending uploaded asset.
- Saving a parsed imported draft persists it as `source: imported` and preserves `originalAssetPath`.
- Import parsing status copy no longer references stale `Gemini 2.0` wording.

### Verification

- Empty-state import link run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:330 tests/e2e/emulator-auth.spec.ts:552"`
  - Result: 1 passed.
  - Included proof: `recipe empty-state import link does not leave the user on a missing route`.
- Direct route run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:335"`
  - Result: 1 passed.
  - Included `/recipes` and `/recipes/import`.
- Targeted Recipe/Import regression run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:581 tests/e2e/emulator-auth.spec.ts:607 tests/e2e/emulator-auth.spec.ts:1101"`
  - Result: 3 passed.
  - Included manual create/search/delete, AI search fallback, and failed-import cleanup.
- First focused import lifecycle run found two issues:
  - Unsupported-file test needed to use drag/drop instead of `setInputFiles` because the hidden file input has `accept="image/*,.pdf"`.
  - Imported draft save dropped `originalAssetPath` because `RecipeForm` did not preserve it from the parsed draft.
- Focused import lifecycle rerun passed after fixes:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:1143 tests/e2e/emulator-auth.spec.ts:1181 tests/e2e/emulator-auth.spec.ts:1237"`
  - Result: 3 passed.
  - Included unsupported file rejection, parsed draft cancel cleanup, and parsed draft save as imported recipe.

### Notes

- Current Recipe Library risks remain: recipe detail/guided cooking proof, active control honesty, tag chip filtering, manual save failure recovery, and semantic-search production readiness classification.
- Current Recipe Import risks remain: resumable/background import architecture classification and grouped closure proof.

## 2026-06-25 Meal Plan Recognition Cross-Page Proof

Date: 2026-06-25
Mode: Cross-page workflow contract + emulator QA
Scope: Dashboard -> Meal Planner -> Grocery saved-weekly-plan recognition.

### Goal

Prove the saved meal plan recognition workflow after Dashboard, Meal Planner, and Grocery / Shopping List page contracts locally graduated.

### Files Changed

- `docs/meal-plan-recognition-workflow-contract.md`
- `docs/qa-ledger.md`

### Behavior Proved

- A fresh user can enter the plan creation flow.
- The user can choose the empty/manual plan path and save the plan.
- Dashboard recognizes the saved current-week plan and hides `Ready to plan your week?`.
- Dashboard still recognizes the saved plan after reload and shows `Weekly Planner`.
- Grocery recognizes the same saved plan and shows `Meal Plan Connected`.
- The previous plan-wizard overlay blocker did not reproduce in the full cross-page flow.

### Verification

- Exact-line cross-page workflow run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:1019"`
  - Result: 1 passed.
  - Included proof: `saved weekly plan is recognized by dashboard and grocery after reload`.

### Notes

- No app code changed for this sprint; only the workflow contract and QA ledger were updated.
- Lint/build were not rerun for this documentation-only sprint because the cross-page proof passed and no source/test code changed.
- Manager graduation review completed: Dashboard, Meal Planner, and Grocery / Shopping List prerequisites are locally graduated; the exact cross-page proof passed; no open P0/P1 blocker remains in this workflow scope.
- Meal Plan Recognition workflow is locally graduated for emulator proof.

## 2026-06-25 Grocery / Shopping List Contract Kickoff And Baseline Smoke

Date: 2026-06-25
Mode: Page contract + emulator QA
Scope: Start the Grocery / Shopping List page contract for `/grocery`.

### Goal

Define the launch-critical Grocery page contract and prove the current baseline manual/honest state before fixing deeper page gaps.

### Files Changed

- `docs/page-contracts/grocery-shopping-list.md`
- `docs/qa-ledger.md`

### Behavior Proved

- A signed-in user can reach `/grocery` and see `Smart Grocery List`.
- The page uses honest manual-list language when no active meal plan is connected.
- Checkout, store pricing, and store matching are framed as unavailable / coming soon rather than live integrations.
- Old prototype checkout copy is not visible.
- A manual grocery item can be added, checked off, reloaded, and still appear checked.
- A manual grocery item can be deleted, reloaded, and stay deleted.
- The previous dead-looking Share affordance is now an honest disabled `Share Coming Soon` control.
- The `View Full Meal Plan` link routes from `/grocery` to `/plan`.
- A saved current-week plan is recognized by Grocery after reload and shows `Meal Plan Connected`.
- Generated grocery refresh preserves manual items and replaces stale generated items.
- Grocery add, check, and delete write failures now show visible recovery messages instead of silent false success.

### Verification

- Initial targeted run failed before reaching the app because PowerShell quoting mangled the Playwright `-g` pattern into an invalid regex. This was a harness quoting issue, not a page failure.
- Rerun passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g honest"`
  - Result: 2 passed.
  - Included Grocery proof: `grocery page uses honest manual and coming soon states`.
- A later grouped Grocery run passed 4 Grocery-relevant tests but failed because the strengthened quick-add/check/reload test captured a transient Firestore emulator connection message as a console error.
- A broad `quick-add` rerun proved the Grocery quick-add/check/reload test but failed on an unrelated Pantry quick-add test for the same transient Firestore emulator message.
- The emulator console helper now ignores only the known transient Firestore emulator offline/reconnect message while continuing to collect other console and page errors.
- Exact-line Grocery persistence run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:681 tests/e2e/emulator-auth.spec.ts:704"`
  - Result: 2 passed.
  - Included Grocery proof: `user can quick-add, check off, and reload a grocery item`; `user can delete a grocery item and reload without it returning`.
- Exact-line Grocery honest-control run passed after disabling Share:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:727"`
  - Result: 1 passed.
- Exact-line Grocery-to-Planner navigation run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:746"`
  - Result: 1 passed.
- Exact-line connected-state and generated-refresh run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:983 tests/e2e/emulator-auth.spec.ts:1024"`
  - Result: 2 passed.
- Exact-line Grocery write-failure recovery run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:759"`
  - Result: 1 passed.
- Grouped Grocery closure run passed:
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g grocery"`
  - Result: 7 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed with existing non-blocking Vite warnings for stale Browserslist data, dynamic/static import chunking, and large bundle size.

### Notes

- The broader `honest` grep also ran the Meal Planner non-week honest-state test. Only the Grocery proof is counted for Grocery contract task 2.
- Grocery / Shopping List page contract is locally graduated for page-owned emulator workflows.
- The parked Meal Plan Recognition workflow prerequisite gate is now unblocked for its cross-page integration proof.

## 2026-06-25 Meal Planner Page Contract Kickoff

Date: 2026-06-25
Mode: Meal Planner page contract sprint + baseline emulator route smoke
Scope: Park the cross-page meal-plan recognition workflow, create the Meal Planner page contract, and run the first route-level QA proof.

### Goal

Start Meal Planner logically as a page contract before returning to cross-page Dashboard -> Meal Planner -> Grocery recognition.

### Files Changed

- `src/pages/MealPlanner.tsx`
- `src/services/aiService.ts`
- `src/services/planService.ts`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/meal-plan-recognition-workflow-contract.md`
- `docs/page-contracts/meal-planner.md`
- `docs/qa-ledger.md`

### Verification

- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g navigate"`: 2 passed.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g empty-grid"`: 1 passed.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g persists"`: 5 passed, including `meal planner empty-grid plan saves and persists after reload`.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g preferences"`: 1 passed.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g non-week"`: 1 passed.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g meal-planner-failure"`: 2 passed.
- First grouped closure attempt `-g planner`: 5 passed, 1 failed because the empty-week prompt overlay intercepted the plan wizard action.
- Final grouped closure retry `-g planner`: 6 passed after fixing the prompt/wizard overlay race.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed with existing non-blocking Vite warnings for stale Browserslist data, dynamic/static import chunking, and large bundle size.

### Result

- Cross-page meal-plan recognition is preserved but parked behind Dashboard, Meal Planner, and Grocery / Shopping List page-contract prerequisites.
- Meal Planner page contract exists with a numbered task checklist.
- Baseline `/plan` route smoke is complete through existing authenticated desktop navigation coverage and mobile key-route navigation coverage.
- Page-local empty-plan creation is complete: `Create New Plan` -> `Open Plan Wizard` -> `Start from Scratch (Empty Grid)`.
- Page-local confirm/save and reload persistence is complete for an empty/manual Meal Planner-created plan.
- Page-local Preferences target edits now mark the plan dirty, can be saved again, and persist after reload.
- Honest Day/Month non-week states are complete and return to Week mode without breaking the page.
- Page-level save and AI generation failure states are complete: both alert the user and keep the current draft visible.
- `Add to List` ownership is classified: Meal Planner owns immediate button/feedback behavior; Grocery / Shopping List owns generated item display and list behavior; the parked cross-page workflow owns end-to-end recognition.
- The grouped Meal Planner closure pass exposed and fixed the prompt/wizard overlay race.
- Meal Planner page-owned emulator workflows are locally graduated.
- Next recommended contract is Grocery / Shopping List, because the parked cross-page workflow still needs that prerequisite before resuming.

### Commit/PR

Not created.

## 2026-06-25 Dashboard Final Smoke Verification

Date: 2026-06-25
Mode: Dashboard page contract sprint + final targeted emulator browser smoke
Scope: Verify Dashboard-only happy paths and failure states before treating the Dashboard contract as closed.

### Goal

Prove the Dashboard contract still passes as a combined page smoke after the checklist and `BUG-006` closure work, without accidentally including the separate cross-page saved-plan workflow.

### Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated filesystem access because the sandbox blocked Vite/esbuild config resolution.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:526 tests/e2e/emulator-auth.spec.ts:543 tests/e2e/emulator-auth.spec.ts:571 tests/e2e/emulator-auth.spec.ts:601 tests/e2e/emulator-auth.spec.ts:636 tests/e2e/emulator-auth.spec.ts:677 tests/e2e/emulator-auth.spec.ts:691 tests/e2e/emulator-auth.spec.ts:713 tests/e2e/emulator-auth.spec.ts:730"`: 9 passed.

### Result

- Dashboard-only contract is smoke-verified locally.
- No Dashboard P0/P1 blocker was found.
- The saved weekly plan recognition flow remains outside this closure and belongs to `docs/meal-plan-recognition-workflow-contract.md`.

### Commit/PR

Not created.

## 2026-06-25 Dashboard Failure-State Contract Closure

Date: 2026-06-25
Mode: Dashboard page contract sprint + targeted emulator browser tests
Scope: Close `BUG-006` by proving Dashboard save/load failure states.

### Goal

Make Dashboard primary metric failures visible and test-protected before moving to another page contract.

### Behavior Changed

- Dashboard now shows a visible retry alert when weight-history loading fails.
- Dashboard hydration save failure alert coverage now proves water remains unchanged.
- Dashboard sleep save failure alert coverage proves the sleep modal stays open.
- Dashboard check-in settings save failures now propagate from the app store so the check-in modal can alert the user and stay open.
- Dev-only e2e failure hooks in `userService.ts` allow deterministic failure injection through `sessionStorage` during Vite dev/test runs.

### Files Changed

- `src/pages/Dashboard.tsx`
- `src/lib/store.tsx`
- `src/services/userService.ts`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/dashboard.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`
- `docs/firebase-foundation-contract.md`

### Verification

- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts -g failure"`: 4 passed.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,firestore,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts tests/e2e/emulator-auth.spec.ts:526 tests/e2e/emulator-auth.spec.ts:543 tests/e2e/emulator-auth.spec.ts:571 tests/e2e/emulator-auth.spec.ts:601 tests/e2e/emulator-auth.spec.ts:636"`: 5 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd --prefix "Web App/functions" run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated filesystem access because the sandbox blocks Vite/esbuild config resolution on this machine.

### Notes

- `BUG-006` is closed.
- This intentionally did not advance to another page.
- The saved weekly plan recognition test crosses Dashboard, Meal Planner, and Grocery. Treat that as a future cross-page workflow contract rather than more Dashboard-only work.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Recertification Before Page QA

Date: 2026-06-25
Mode: Contract sprint + foundation-only proof set
Scope: Reconfirm Firebase Foundation tasks 1-6 before deciding whether to open step 7 page-by-page QA.

### Goal

Verify the Firebase foundation without accidentally treating the parked Dashboard page-QA detour as completed work.

### Board State

- Firebase Foundation tasks 1-6 are checked off in `docs/firebase-foundation-contract.md`.
- Step 7, page-by-page QA, remains unchecked.
- `BUG-009` remains open/deferred as a live semantic-search vector-index gate.
- Billing kill switch remains required before broader sharing.
- Hosting deploy remains blocked until readiness gates pass.

### Verification

- `npx.cmd --yes firebase-tools emulators:exec --only firestore "node --test tests/rules/firestore-rules.test.mjs"`: 19 passed.
- `npx.cmd --yes firebase-tools emulators:exec --only auth,storage "node --test tests/rules/storage-rules.test.mjs"`: 3 passed.
- `npm.cmd run test:functions:contracts`: 16 passed.
- `npm.cmd --prefix "Web App/functions" run lint`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated filesystem access because the sandbox blocks Vite/esbuild config resolution on this machine.
- `node -e "JSON.parse(require('fs').readFileSync('Web App/firestore.indexes.json','utf8'))"`: passed.
- `git diff --check`: no whitespace errors; Windows line-ending warnings only.

### Important Boundary

Broad emulator page QA was intentionally not used as foundation proof in this pass. At the time, a premature Dashboard failure-state detour was parked and not fully passing. That Dashboard detour was later resolved in the 2026-06-25 Dashboard Failure-State Contract Closure entry above.

### Manager Decision

Firebase foundation is locally strong enough to consider step 7 next. The live vector index, live AI smoke, billing kill switch, and Hosting deploy remain separate gates.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Index And Vector Search Setup

Date: 2026-06-25
Mode: Contract sprint + source scan + official-doc verification + lint/build gates
Scope: Complete Firebase Foundation task 6 by cleaning stale Firestore indexes and preparing semantic-search vectors for Firestore.

### Goal

Remove obsolete index configuration and prevent semantic-search embeddings from exceeding Firestore vector-index limits.

### Behavior Changed

- `firestore.indexes.json` no longer contains stale composite indexes for old root-recipe fields: `uid`, `meal_type`, `created_at`, and `tags`.
- Server embeddings are pinned to `GEMINI_EMBEDDING_DIMENSIONS`, default `1536`.
- Embedding vectors are validated as numeric arrays before Firestore write/query use.
- Recipe document embedding input now uses retrieval-document style text.
- Search query embedding input now uses retrieval-query style text.

### Live Gate

- A live Firestore vector index is still required before production semantic search.
- Required index: collection group `recipes`, field `embedding`, dimension `1536`, flat vector index.
- `BUG-009` tracks this as a deploy/live-search gate.

### Sources Checked

- Firebase vector search docs: https://firebase.google.com/docs/firestore/vector-search
- Gemini embeddings docs: https://ai.google.dev/gemini-api/docs/embeddings

### Files Changed

- `firestore.indexes.json`
- `functions/src/index.ts`
- `docs/firebase-foundation-contract.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Verification

- Source scan found no current code path using the removed stale composite index fields.
- `npm.cmd run test:functions:contracts`: 16 passed.
- `npm.cmd --prefix "Web App/functions" run lint`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated filesystem access because the sandbox blocked Vite/esbuild config resolution.

### Notes

- This does not create the live vector index.
- The current older `@google/generative-ai` package did not expose an obvious output-dimensionality option in installed local types, so the safe local fix truncates the MRL prefix to 1536 dimensions. A future SDK migration to `@google/genai` can request output dimensionality directly.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Functions Contract Lane

Date: 2026-06-25
Mode: Contract sprint + direct callable unit/contract tests + build/lint gates
Scope: Complete Firebase Foundation task 5 by adding a local Functions contract lane for callable AI functions.

### Goal

Prove callable AI guardrails and provider failure handling without making live Gemini calls.

### Behavior Covered

- Production callable configuration requires App Check before request validation.
- Callable functions require Firebase Auth.
- Oversized and malformed inputs are rejected before AI execution.
- Local emulator AI calls are blocked unless `ALLOW_EMULATOR_AI_CALLS=true`.
- Mocked Gemini success paths return parsed data for meal-plan generation and recipe parsing.
- Mocked provider failures return bounded internal errors.
- Malformed provider JSON returns bounded internal errors.
- Recipe parser rejects unsupported asset types and cross-user Storage paths before AI.
- Semantic search rejects missing or overly long queries before embedding/vector execution.

### Files Changed

- `functions/tests/callable-contracts.test.cjs`
- `functions/package.json`
- `package.json`
- `docs/firebase-foundation-contract.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Verification

- `npm.cmd run test:functions:contracts`: 16 passed.
- `npm.cmd --prefix "Web App/functions" run lint`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with elevated filesystem access because the sandbox blocked Vite/esbuild config resolution.

### Notes

- This is not a live Gemini smoke test.
- UI-facing AI failure copy still belongs in the relevant page/workflow QA contracts.
- `BUG-002` is closed for direct callable contract coverage.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Data-Loss Workflow Fixes

Date: 2026-06-25
Mode: Contract sprint + implementation + targeted emulator regression + full emulator QA
Scope: Complete Firebase Foundation task 4 by fixing grocery generated-list refresh and recipe import upload cleanup.

### Goal

Prevent user-entered grocery items from being erased by generated-list refreshes and prevent failed/canceled recipe imports from leaving known uploaded assets behind.

### Behavior Changed

- Grocery generation now clears only items marked `source: generated`.
- Manual grocery items survive generated grocery refreshes.
- Newly generated grocery items are tagged with `source: generated` and `mealPlanId`.
- Recipe import now uses `uploadRecipeAsset()` for both image and PDF inputs.
- Imported recipe drafts include `originalAssetPath` for cleanup.
- Parse failure deletes the uploaded asset.
- Closing/canceling an imported draft before save deletes the uploaded asset.

### Files Changed

- `src/lib/shopping-generator.ts`
- `src/services/shoppingService.ts`
- `src/services/recipeService.ts`
- `src/pages/RecipeLibrary.tsx`
- `firestore.rules`
- `tests/e2e/emulator-auth.spec.ts`
- `package.json`
- `docs/firebase-foundation-contract.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Verification

- `npm.cmd run test:rules`: Firestore 19 passed; Storage 3 passed.
- `npm.cmd run test:e2e:emulator:data-loss`: 2 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run test:e2e:emulator`: 19 passed.

### Notes

- `BUG-003` is closed for the current upload-before-parse import flow.
- Recipe import draft records remain a future architecture option if imports become resumable or background processed.
- Existing non-blocking build warnings remain: old Browserslist/caniuse-lite data, Vite dynamic/static import chunking warnings, and large bundle warning.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Rules Coverage Completion

Date: 2026-06-25
Mode: Contract sprint + Firestore/Storage rules tests + emulator browser QA
Scope: Complete Firebase Foundation task 3 by adding missing rules coverage for user documents/settings, folders, root-denial checks, and Storage recipe assets.

### Goal

Prove the Firebase rules foundation protects owner-scoped data and Storage assets across the current primary app surfaces before moving into data-loss workflow fixes.

### Behavior Covered

- Firestore user documents:
  - Owner can create/read/update their user document.
  - User document delete is denied.
  - Cross-user read/update/delete is denied.
- Firestore folders:
  - Owner CRUD is allowed.
  - Cross-user read/update/delete is denied.
- Root collections:
  - Unexpected root `recipes` and `mealPlans` writes are denied.
- Storage recipe assets:
  - Owner can upload/read/delete a valid recipe image under `users/{uid}/recipes/...`.
  - Cross-user read/write/delete is denied.
  - Unauthenticated upload is denied.
  - Invalid `text/plain` upload is denied.

### Files Changed

- `tests/rules/firestore-rules.test.mjs`
- `tests/rules/storage-rules.test.mjs`
- `package.json`
- `docs/firebase-foundation-contract.md`
- `docs/qa-ledger.md`

### Verification

- `npm.cmd run test:rules`: Firestore 19 passed; Storage 3 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run test:e2e:emulator`: 17 passed.

### Notes

- This completes the current task 3 coverage lane. It does not mean every future nested/lifecycle rule exists; those are now tracked as future task `3.5` and tied to the workflow contracts that introduce them.
- User settings shape validation remains a foundation gap. The current slice proves ownership/delete/root-denial behavior without changing the settings schema.
- Existing non-blocking build warnings remain: old Browserslist/caniuse-lite data, Vite dynamic/static import chunking warnings, and large bundle warning.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Pantry, Meal Plan, And Recipe Rules Pass

Date: 2026-06-25
Mode: Contract sprint + Firestore rules TDD + emulator browser QA
Scope: Complete Firebase Foundation task 2 slices for `pantryItems`, `mealPlans`, and `recipes`.

### Goal

Close the remaining primary user-collection Firestore rules gaps without breaking current Pantry, Meal Planner, Recipe Library, Dashboard, or Grocery workflows.

### Red Test

- Extended `tests/rules/firestore-rules.test.mjs` with positive owner flows, cross-user-denial flows, and malformed-write cases for `pantryItems`, `mealPlans`, and `recipes`.
- Initial run failed as expected:
  - `denies malformed or out-of-range pantry items` failed because invalid pantry writes still succeeded.
  - `denies malformed meal plans` failed because invalid meal-plan writes still succeeded.
  - `denies malformed recipes` failed because invalid recipe writes still succeeded.

### Behavior Changed

- `pantryItems` create/update now requires owner access, allowed fields only, required `name`, `quantity`, `unit`, and `isLowStock`, bounded values, optional local expiry date validation, optional category validation, and optional timestamp validation.
- `mealPlans` create/update now requires owner access, allowed fields only, required `weekStart`, `weekEnd`, `goal`, and `days`, local date-key validation, bounded `days` list size, optional daily target map validation, optional timestamp validation, and optional `isAiGenerated` validation.
- `recipes` create/update now requires owner access, allowed fields only, required core recipe fields, bounded type/range validation, optional import metadata validation, optional micronutrient map validation, and bounded list sizes for tags, folders, ingredients, and instructions.

### Files Changed

- `firestore.rules`
- `tests/rules/firestore-rules.test.mjs`
- `docs/firebase-foundation-contract.md`
- `docs/qa-ledger.md`

### Verification

- Red: `npm.cmd run test:rules:firestore` failed on malformed pantry, meal-plan, and recipe writes because invalid writes succeeded.
- Green: `npm.cmd run test:rules:firestore`: 15 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run test:e2e:emulator`: 17 passed.

### Notes

- Recipe and meal-plan nested arrays are intentionally shallow-validated for now. The goal of task 2.5 was to harden without breaking import/create flows; deeper ingredient, instruction, day, and meal validation should be handled after those workflows have isolated contract tests.
- `embedding` remains an optional allowed recipe field so existing server-generated recipe documents are not blocked during client updates. A future server-field strategy should prevent client-authored embeddings more strictly.
- Existing non-blocking build warnings remain: old Browserslist/caniuse-lite data, Vite dynamic/static import chunking warnings, and large bundle warning.

### Commit/PR

Not created.

## 2026-06-25 Firebase Foundation Grocery Rules Slice

Date: 2026-06-25
Mode: Contract sprint + Firestore rules TDD + emulator browser QA
Scope: Continue Firebase Foundation task 2 by hardening grocery list documents under `users/{uid}/groceryItems/{itemId}`.

### Goal

Prevent malformed grocery list documents from being written while preserving valid owner CRUD and the existing grocery quick-add/check workflow.

### Red Test

- Extended `tests/rules/firestore-rules.test.mjs` with `groceryItems` positive, cross-user-denial, and malformed-write cases.
- Initial grocery malformed-write test failed as expected because invalid grocery items still succeeded.

### Behavior Changed

- `groceryItems` create/update now requires:
  - Owner access.
  - Allowed fields only.
  - Required `name`, `quantity`, `unit`, `aisle`, and `isChecked`.
  - Bounded string and numeric values.
  - Optional `mealPlanId`, `createdAt`, and `updatedAt` with type checks.
  - Optional `source` limited to `manual` or `generated`.
- Grocery quick-add no longer exposes a temporary optimistic item before Firestore returns a real document ID. The store now waits for the add to complete and refreshes the saved list.

### Files Changed

- `firestore.rules`
- `tests/rules/firestore-rules.test.mjs`
- `src/lib/store.tsx`
- `docs/firebase-foundation-contract.md`
- `docs/qa-ledger.md`

### Verification

- Red: `npm.cmd run test:rules:firestore` failed on `denies malformed or out-of-range grocery items` because invalid writes succeeded.
- Green: `npx.cmd --yes firebase-tools emulators:exec --only firestore "node --test tests/rules/firestore-rules.test.mjs"`: 6 passed.
- Green retry through package script: `npm.cmd run test:rules:firestore`: 6 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run test:e2e:emulator`: 17 passed.

### Notes

- The Firebase CLI was briefly unavailable on PATH after restart, then the normal package script passed on retry.
- This completes the `groceryItems` rules slice only. Task 2 remains open for `pantryItems`, `mealPlans`, and `recipes`.
- Existing non-blocking build warnings remain: old Browserslist/caniuse-lite data, Vite dynamic/static import chunking warnings, and large bundle warning.

### Commit/PR

Not created.

## 2026-06-24 Firebase Foundation Weight History Rules Slice

Date: 2026-06-24
Mode: Contract sprint + Firestore rules TDD
Scope: Start Firebase Foundation task 2 by hardening the smallest high-confidence Firestore rules slice: daily metric logs under `users/{uid}/weightHistory/{dateId}`.

### Goal

Prevent malformed Dashboard daily metric documents from being written while preserving valid owner reads/writes for weight, hydration, sleep, and biofeedback logs.

### Red Test

- Added the first Firestore rules test harness with `@firebase/rules-unit-testing`.
- Added `npm.cmd run test:rules:firestore`.
- Initial run failed as expected because malformed `weightHistory` writes still succeeded.

### Behavior Changed

- `weightHistory` create/update now requires:
  - Owner access.
  - Document ID matching `date`.
  - Local date format `YYYY-MM-DD`.
  - Required `date` and `timestamp`.
  - Allowed fields only.
  - Numeric range checks for weight, water, sleep, energy, and hunger.
  - Bounded `sleepNotes`.

### Files Changed

- `firestore.rules`
- `package.json`
- `package-lock.json`
- `tests/rules/firestore-rules.test.mjs`
- `docs/firebase-foundation-contract.md`
- `docs/qa-ledger.md`

### Verification

- Red: `npm.cmd run test:rules:firestore` failed on `denies malformed or out-of-range daily metric logs` because the invalid write succeeded.
- Green: `npm.cmd run test:rules:firestore`: 3 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after rerunning with normal filesystem access. First sandboxed build attempt failed while resolving `vite.config.ts` with `Access is denied`.

### Notes

- This does not complete all Firestore rule hardening. The Firebase Foundation Contract keeps task 2 open and tracks `weightHistory` as slice 2.1 complete.
- Broader rules tests remain open under task 3.
- Existing non-blocking build warnings remain: old Browserslist/caniuse-lite data, dynamic/static import chunking warnings, and large bundle warning.

### Commit/PR

Not created.

## 2026-06-23 Dashboard Weight Activity Calendar Drift Fix

Date: 2026-06-23
Mode: Implementation + local emulator QA
Scope: Fix Dashboard quick weight logs so the Activity Calendar tooltip shows the saved weight on the same local day as Weight History.

### Goal

Repair the user-visible mismatch where the Weight History card could show today's saved weight while the Activity Calendar tooltip still showed `Weight -- lbs`.

### Root Cause

- `CheckInModal` saved weight check-ins with `new Date().toISOString()`, which can resolve to the next UTC calendar date while the user's local Dashboard day is still the prior day.
- `ActivityCalendarWidget` matches logs by local calendar date.
- The shared daily metric service preserved the raw `date` field instead of normalizing it to the document date key.

### Files Changed

- `src/components/CheckInModal.tsx`
- `src/services/userService.ts`
- `src/components/ActivityCalendarWidget.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Quick/full check-in weight logs now use `toLocalDateKey(new Date())`.
- `logDailyMetric()` now stores the normalized daily date key in the `date` field.
- Activity Calendar uses the shared local date helper for day keys and today matching.
- The quick-weight Dashboard regression now hovers today's Activity Calendar cell and asserts the tooltip shows the saved weight before and after reload.

### Verification

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard quick weight log saves and persists after reload"`: 1 passed.
- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`: 6 passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

### Notes

- Existing weight logs saved before this fix may remain under their old UTC-derived date in local emulator data. Logging the weight again after the fix writes it to the local day.
- Existing non-blocking build warnings remain: old Browserslist/caniuse-lite data, Vite dynamic/static import chunking warnings, and large bundle warning.

### Commit/PR

Not created.

## 2026-06-22 Dashboard Chief Of Staff Kickoff

Date: 2026-06-22
Mode: Dashboard page contract + local emulator baseline QA
Scope: Start the Web App Chief of Staff page-by-page workflow on Dashboard.

### Goal

Define the Dashboard page contract and establish a current browser-test baseline before deeper Dashboard fixes or feature work.

### Files Changed

- `docs/page-contracts/dashboard.md`
- `docs/qa-ledger.md`

### Current State

- Dashboard is the first launch-critical page because login redirects there and it owns onboarding, check-in, metrics, hydration, sleep, and plan preview entry points.
- The current most important Dashboard workflow is weekly check-in completion and persistence.
- Existing automated coverage proves modal opening/closing, not full check-in save/reload.

### Verification

- Local Vite app started at `http://127.0.0.1:5173/`.
- Firebase Auth, Firestore, and Storage emulators started with imported local data.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard check-in and sleep actions open their modals"`
- Result:
  - 1 passed.

### Open Risks

- Full weekly check-in completion and reload persistence is not yet covered.
- Quick weight log save/reload is not yet covered.
- Hydration save/reload is not yet covered.
- Sleep save/reload is not yet covered.
- Dashboard active-plan accuracy may still be affected by `BUG-001` week-key mismatch.

### Next Slice

Add a Dashboard workflow test for full weekly check-in save and reload persistence, then fix any discovered Dashboard or data-service issue.

### Commit/PR

Not created.

## 2026-06-22 Dashboard Weekly Check-In Persistence Coverage

Date: 2026-06-22
Mode: Implementation + local emulator QA
Scope: Add and verify Dashboard weekly check-in save/reload browser coverage.

### Goal

Prove the Dashboard's primary weekly check-in workflow does more than open the modal: it must save the entered weight, close cleanly, refresh the Dashboard, and preserve the saved weight after reload.

### Files Changed

- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/dashboard.md`
- `docs/qa-ledger.md`

### Behavior Covered

- Signed-in user opens Weekly Check-In from Dashboard.
- User advances through adherence and biofeedback steps.
- User enters a unique current weight.
- User completes check-in.
- Dashboard shows the saved weight in the weight history surface.
- Reloading Dashboard still shows the saved weight.
- Test also fails on unexpected console errors and Recharts chart sizing warnings.

### Verification

- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard weekly check-in saves weight and persists after reload"`
- Result:
  - 1 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`
- Result:
  - 2 passed.

### Notes

- The first test draft failed because the assertion expected `275.0 lbs` while the app stores weight as a number and correctly displayed `275 lbs`. The test now uses a stable non-zero decimal weight.
- No app code changed in this slice.

### Open Risks

- Quick weight log save/reload is not yet covered.
- Hydration save/reload is not yet covered.
- Sleep save/reload is not yet covered.
- Dashboard active-plan accuracy may still be affected by `BUG-001` week-key mismatch.

### Commit/PR

Not created.

## 2026-06-22 Dashboard Sleep Persistence Coverage

Date: 2026-06-22
Mode: Implementation + local emulator QA
Scope: Add and verify Dashboard sleep log save/reload browser coverage.

### Goal

Prove the Dashboard sleep workflow saves the modal data and renders it after a reload, rather than only proving the modal can open.

### Files Changed

- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/dashboard.md`
- `docs/qa-ledger.md`

### Behavior Covered

- Signed-in user opens Log Sleep from Dashboard.
- User saves the default 8-hour sleep range, default quality 4/5, and a unique note.
- Dashboard shows the saved note, hours, and quality.
- Reloading Dashboard still shows the saved sleep note, hours, and quality.
- Test also fails on unexpected console errors and Recharts chart sizing warnings.

### Verification

- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard sleep log saves and persists after reload"`
- Result:
  - 1 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`
- Result:
  - 3 passed.

### Notes

- The first sleep test draft failed because the raw `8` assertion matched calendar dates and chart-related text. The final test scopes the hours, unit, quality, and note assertions to the Sleep card.
- No app code changed in this slice.

### Open Risks

- Quick weight log save/reload is not yet covered.
- Hydration save/reload is not yet covered.
- Dashboard active-plan accuracy may still be affected by `BUG-001` week-key mismatch.

### Commit/PR

Not created.

## 2026-06-22 Dashboard Hydration Persistence Coverage

Date: 2026-06-22
Mode: Implementation + local emulator QA
Scope: Add and verify Dashboard hydration quick-add save/reload browser coverage.

### Goal

Prove the Dashboard hydration quick-add workflow saves daily water intake and renders the saved value after a reload.

### Files Changed

- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/dashboard.md`
- `docs/qa-ledger.md`

### Behavior Covered

- A fresh test user signs up and skips onboarding.
- Dashboard hydration starts from a clean `0 ml` state.
- User clicks `+250ml`.
- Dashboard shows `250 ml`.
- Reloading Dashboard still shows `250 ml`.
- Test also fails on unexpected console errors and Recharts chart sizing warnings.

### Verification

- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard hydration quick-add saves and persists after reload"`
- Result:
  - 1 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`
- Result:
  - 4 passed.

### Notes

- The first grouped run reused the shared `test@test.com` account and collided with existing daily water state. The final test uses a fresh throwaway account so the hydration proof starts from a known clean state.
- No app code changed in this slice.

### Open Risks

- Quick weight log save/reload is not yet covered.
- Dashboard active-plan accuracy may still be affected by `BUG-001` week-key mismatch.

### Commit/PR

Not created.

## 2026-06-22 Dashboard Quick Weight Persistence Coverage

Date: 2026-06-22
Mode: Implementation + local emulator QA
Scope: Add and verify Dashboard quick weight log save/reload browser coverage.

### Goal

Prove the Dashboard quick weight log workflow opens directly in weight mode, saves the entered weight, refreshes the Weight History card, and preserves the saved weight after reload.

### Files Changed

- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/dashboard.md`
- `docs/qa-ledger.md`

### Behavior Covered

- A fresh test user signs up and skips onboarding.
- User clicks the Weight History `Log Weight` action.
- The modal opens as `Log Weight` and starts on `Weigh-In`.
- User enters a unique decimal weight and completes the check-in.
- The Weight History card shows the saved weight.
- Reloading Dashboard still shows the saved weight.
- Test also fails on unexpected console errors and Recharts chart sizing warnings.

### Verification

- Local Vite app started at `http://127.0.0.1:5173/`.
- Firebase Auth, Firestore, and Storage emulators started with imported local data.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard quick weight log saves and persists after reload"`
- Result:
  - 1 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`
- Result:
  - 5 passed.

### Notes

- No app code changed in this slice.
- This completes Dashboard health-metric persistence coverage for weekly check-in, quick weight, sleep, and hydration.

### Open Risks

- Dashboard active-plan accuracy may still be affected by `BUG-001` week-key mismatch.

### Commit/PR

Not created.

## 2026-06-22 BUG-001 Week-Key Fix Verified

Date: 2026-06-22
Mode: Debug + implementation + local emulator QA
Scope: Patch the Meal Planner/Dashboard/Grocery active-plan mismatch root cause and add regression coverage.

### Goal

Fix the source-level cause of `BUG-001` so a plan saved in Meal Planner uses the same canonical week key as the app-wide active-plan loader, then prove Dashboard and Grocery recognize that saved plan after reload.

### Files Changed

- `src/lib/date-utils.ts`
- `src/lib/store.tsx`
- `src/lib/plan-generator.ts`
- `src/pages/MealPlanner.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/page-contracts/dashboard.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Added one shared local-date utility for `YYYY-MM-DD` keys and Monday-based week starts.
- AppProvider now loads the active plan using the same Monday week key as Meal Planner.
- Plan generation now writes local date keys instead of UTC-derived ISO date keys.
- Meal Planner now fetches, drafts, clones, generates, and saves plans using the shared week-key helper.
- Meal Planner now captures the Firestore ID returned by `saveMealPlan()` and stores it in `fetchedPlan` after confirmation.
- Added a Playwright regression test that creates a fresh user, saves an empty weekly plan through the UI, then checks Dashboard and Grocery recognize it after reload.

### Verification

- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "saved weekly plan is recognized by dashboard and grocery after reload"`
- Result:
  - 1 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`
- Result:
  - 6 passed.
- Ran:
  - `npx.cmd tsc -b`
- Result:
  - Passed.
- Ran:
  - `npm.cmd run lint`
- Result:
  - Passed.
- Ran:
  - `npm.cmd run build`
- Result:
  - Passed when run outside the restricted sandbox.

### Open Risks

- Existing non-blocking build warnings remain: Browserslist/caniuse-lite age, dynamic/static import chunking warnings, and large bundle warning.
- No open P0/P1 Dashboard issue remains from this bug.

### Commit/PR

Not created.

## 2026-06-22 Dashboard Graduation And Sleep Local-Date Fix

Date: 2026-06-22
Mode: Dashboard graduation QA + debug + implementation
Scope: Run broad Dashboard/local emulator confidence checks, fix grouped sleep date drift, and mark Dashboard locally graduated for core workflows.

### Goal

Confirm Dashboard can graduate from the page-by-page stabilization pass by proving its core local emulator workflows hold up inside the broader suite, not only as isolated tests.

### Files Changed

- `src/components/SleepLogModal.tsx`
- `src/pages/Dashboard.tsx`
- `src/services/userService.ts`
- `docs/page-contracts/dashboard.md`
- `docs/bug-ledger.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Sleep log date defaults now use the shared local date helper instead of UTC `toISOString().split('T')[0]`.
- Dashboard daily metric comparisons now use the shared local date helper consistently.
- `logDailyMetric()` now uses the shared local date helper when no explicit date is supplied.
- Dashboard page contract is now marked locally graduated for core emulator workflows.
- Added `BUG-006` as a non-blocking failure-injection coverage gap.
- Added and closed `BUG-007` for the sleep UTC date drift found by the broader suite.

### Verification

- First full emulator run:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts`
  - Result: 16 passed, 1 failed.
  - Failure: `dashboard sleep log saves and persists after reload`.
  - Root cause: sleep saved under a UTC-derived date key one day ahead of Dashboard's local `today`.
- After fix, ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard sleep log saves and persists after reload"`
  - Result: 1 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard"`
  - Result: 6 passed.
- Ran:
  - `npx.cmd playwright test --config=playwright.emulator.config.ts`
  - Result: 17 passed.
- Ran:
  - `npm.cmd run lint`
  - Result: Passed.
- Ran:
  - `npm.cmd run build`
  - Result: Passed.

### Open Risks

- Existing non-blocking build warnings remain: Browserslist/caniuse-lite age, dynamic/static import chunking warnings, and large bundle warning.
- Dashboard failure-injection coverage is deferred under `BUG-006`.

### Commit/PR

Not created.

## 2026-06-21 North Star Compass And Bug Ledger Setup

Date: 2026-06-21
Mode: Research synthesis + documentation
Scope: Create an operating compass for future Chief of Staff sessions and a durable unresolved bug ledger.

### Goal

Give VioMacro a stable development operating system before more feature work: page-by-page contracts, browser-agent testing rules, build/debug loop, QA ladder, release gates, and a bug ledger for unresolved defects.

### Files Changed

- `docs/north-star-compass.md`
- `docs/bug-ledger.md`
- `README.md`
- `docs/pre-hosting-readiness.md`
- `docs/qa-ledger.md`

### Decisions

- Use `docs/north-star-compass.md` as the project-local Chief of Staff operating compass.
- Use `docs/bug-ledger.md` as the unresolved bug and defect board.
- Keep `docs/qa-ledger.md` for completed QA evidence, not open bug tracking.
- Browser agents should test one page or workflow contract at a time and report evidence, not roam broadly.
- Automations should start as reminders or CI checks later; no cloud automation was created in this pass.

### Verification

- Documentation-only change.
- No app code changed.
- No tests run.

### Commit/PR

Not created.

## 2026-06-21 Honest Controls And AI Failure Regression Pass

Date: 2026-06-21
Mode: Implementation + Local QA
Scope: Remove launch-blocking dead affordances, add mocked AI failure coverage, harden mobile chart rendering, and replace the default Vite README with a VioMacro runbook.

### Goal

Make visible app controls more honest before deploy readiness, prove the recipe AI search fallback works when a callable fails, and keep local QA documentation aligned with the current Firebase emulator workflow.

### Files Changed

- `src/components/AppLayout.tsx`
- `src/components/RecipeDetail.tsx`
- `src/components/WeightHistoryWidget.tsx`
- `src/pages/AuthPage.tsx`
- `src/pages/RecipeLibrary.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `README.md`
- `docs/qa-ledger.md`

### Behavior Changed

- Mobile sidebar `Quick Add` is now a real `Create Recipe` link to `/recipes` and closes the mobile menu.
- Header notifications, password reset, recipe detail favorite/share, recipe detail meal-plan linking, custom recipe folders, macro filters, and advanced filters now present as disabled/Coming Soon instead of live-looking dead controls.
- Recipe AI search placeholder no longer uses a spicy-food example.
- Recipe AI search has mocked Playwright coverage for callable failure and confirms the UI falls back to keyword search.
- Mobile navigation coverage now verifies the former Quick Add path reaches Recipes.
- Mobile dashboard coverage now fails if the Recharts ResponsiveContainer width/height warning returns.
- Weight history chart containers now use stable minimum sizing to avoid mobile ResponsiveContainer warnings.
- `README.md` now documents VioMacro local development, emulator QA, deploy guardrails, environment files, and the QA ledger.

### Verification

- Sandboxed `npm run build`: blocked by local PowerShell execution policy for `npm.ps1`.
- `npm.cmd run build`: blocked inside the restricted sandbox while Vite/esbuild resolved config paths.
- Escalated `npm.cmd run build`: passed.
- `npm.cmd run test:e2e:emulator`: could not start because Auth, Firestore, Storage, Emulator UI, and Vite ports were already occupied by the active local harness.
- `npx.cmd playwright test --config=playwright.emulator.config.ts`: 12 passed against the already-running local app and emulators.
- Rerun after adding the chart-warning guard: `npx.cmd playwright test --config=playwright.emulator.config.ts`: 12 passed.

### Notes

- No Functions deploy, Hosting deploy, git commit, or push was performed in this pass.
- Existing non-blocking build warnings remain: Browserslist/caniuse-lite age, Vite dynamic/static import chunking warnings, and large bundle warning.
- Password reset, custom folders, notification center, advanced filters, macro filters, recipe-detail favorite/share, and meal-plan linking remain deferred features.
- Pantry full intelligence remains under development; current tests continue to verify honest Coming Soon states.

### Commit/PR

Not created.

## 2026-06-20 Final Local Checkpoint Proof After Restart

Date: 2026-06-20
Mode: Local QA + Checkpoint Preparation
Scope: Restart local harness after laptop restart and rerun the full pre-commit proof stack.

### Goal

Confirm the verified stabilization work still passes after a clean laptop restart before creating a Git checkpoint.

### Stack Status

- Vite localhost: `http://127.0.0.1:5173` reachable.
- Firebase Emulator UI: `http://127.0.0.1:4000` reachable.
- Firebase Auth emulator: `127.0.0.1:9099` reachable.
- Firestore emulator: `127.0.0.1:8080` reachable.
- Storage emulator: `127.0.0.1:9199` reachable.

### Verification

- `npm.cmd run lint`: passed.
- `npm.cmd --prefix functions run lint`: passed.
- `npm.cmd --prefix functions run build`: passed.
- Escalated `npm.cmd run build`: passed.
- `npx.cmd playwright test --config=playwright.emulator.config.ts`: 11 passed.
- `npx.cmd playwright test --config=playwright.prod-emulator.config.ts`: 3 passed.

### Notes

- Browser skill is available, but this pass used the repo's configured Playwright suites because the goal was repeatable regression proof against the emulator harness.
- Existing non-blocking warnings remain: Browserslist/caniuse-lite age, Vite dynamic/static import chunking warnings, large bundle warning, and Firebase Storage rules runtime Java deprecation warning.
- No Hosting deploy, Functions deploy, git commit, or push was performed in this pass.

### Commit/PR

Not created.

## 2026-06-20 Post-Restart Emulator Restore And Step 7 Regression Coverage

Date: 2026-06-20
Mode: Local QA + Implementation
Scope: Restore local dev stack after PC restart, finish step 6 proof, and add step 7 launch-critical regression coverage.

### Goal

Keep Hosting undeployed, restore the local app/emulator harness, and strengthen browser coverage for recipe cleanup plus authenticated mobile navigation.

### Stack Status

- Vite localhost: `http://127.0.0.1:5173` reachable from the existing server process.
- Firebase Emulator UI: `http://127.0.0.1:4000` reachable from the existing emulator process.
- Firebase Auth emulator: `127.0.0.1:9099` reachable.
- Firestore emulator: `127.0.0.1:8080` reachable.
- Storage emulator: `127.0.0.1:9199` reachable.
- An accidental extra Vite process started on `5174` because `5173` was already occupied; it was stopped.

### Files Changed

- `src/lib/store.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `docs/qa-ledger.md`

### Behavior Changed

- Grocery quick-add now replaces the optimistic temporary item ID with the saved Firestore ID immediately after `shoppingService.addGroceryItem()` returns.
- This prevents a fast check-off click from targeting a `temp-` ID that cannot persist.
- The manual recipe browser test now creates, searches, confirms delete, and verifies the recipe title is removed from the library.
- The emulator browser suite now includes an authenticated mobile shell smoke test that opens the mobile menu and navigates to Recipes and Grocery.

### Verification

- `npm.cmd run lint`: passed.
- Sandboxed `npm.cmd run build`: blocked by sandbox access denial while Vite/esbuild loaded config paths.
- Escalated `npm.cmd run build`: passed.
- `npx.cmd playwright test --config=playwright.emulator.config.ts`: 11 passed.
- `npx.cmd playwright test --config=playwright.prod-emulator.config.ts`: 3 passed.

### Notes

- Existing non-blocking warnings remain: Browserslist/caniuse-lite age, Vite dynamic/static import chunking warnings, and large bundle warning.
- Pantry remains intentionally marked as Coming Soon for full pantry intelligence; only quick-add prototype behavior is covered.
- Functions provider-failure tests remain a separate mocked-backend slice.
- Hosting deploy remains blocked until the Web App Chief of Staff QA pass approves launch-critical workflows.
- Billing kill switch remains deferred and required before broader sharing.

### Commit/PR

Not created.

## 2026-06-20 Localhost And Emulator Smoke

Date: 2026-06-20
Mode: Local QA
Scope: Web App localhost, Firebase emulators, authenticated browser smoke tests.

### Goal

Confirm the local Vite app and Firebase emulators are running, then test launch-critical authenticated workflows before any Hosting deploy.

### Stack Status

- Vite localhost: `http://127.0.0.1:5173` reachable.
- Firebase Auth emulator: `127.0.0.1:9099` reachable.
- Firestore emulator: `127.0.0.1:8080` reachable.
- Storage emulator: `127.0.0.1:9199` reachable.
- Functions emulator: `127.0.0.1:5001` reachable.
- Emulator UI: `http://127.0.0.1:4000` reachable.

### Verification

- Initial sandboxed Playwright attempt: blocked before app interaction by Windows/browser launch error `browserType.launch: spawn EPERM`.
- Escalated Playwright run: `npx.cmd playwright test --config=playwright.emulator.config.ts`.
- Result: 7 passed.

### Workflows Covered

- New email user can reach onboarding and skip setup.
- Existing test user can sign in and navigate launch-critical screens.
- Recipe empty-state import link resolves to a real route.
- User can save settings changes.
- User can create a manual recipe and find it in the recipe library.
- User can quick-add and delete pantry items.
- User can quick-add and check off a grocery item.

### Decisions

- Use this ledger for Web App QA/runtime verification.
- Keep Chef Professional AI GPT instruction governance separate under the GPT folder.
- Hosting remains blocked until the Chief of Staff/manual happy-path pass is complete.

### Open Risks

- Live AI provider calls were not tested in this run.
- Hosting was not deployed.
- Billing kill switch remains a required later milestone before broader use.
- The app still needs a user-facing/manual happy-path pass before Hosting.

### Follow-Up

- Run the Chief of Staff QA pass against the local app.
- Preserve this run as evidence when deciding whether the next step is Functions-only deploy or more local stabilization.

## 2026-06-20 Chief Of Staff Emulator QA With Subagents

Date: 2026-06-20
Mode: QA
Scope: Local Vite app, Firebase emulators, in-app browser checks, four read-only QA subagents.

### Goal

Use the Web App Chief of Staff workflow and testing subagents to pressure-test the emulator-backed app before any Hosting deploy.

### Verification

- Local ports reachable: Vite `5173`, Emulator UI `4000`, Auth `9099`, Firestore `8080`, Storage `9199`, Functions `5001`.
- Existing Playwright authenticated emulator suite passed earlier in this run: `7 passed`.
- In-app browser login succeeded with `test@test.com`.
- Dashboard `Skip Setup` responded.
- Dashboard `Start Check-In` opened the weekly check-in modal.
- Manual recipe create/search/detail/start guided cooking worked in subagent testing.
- Grocery quick-add/check persisted after reload in subagent testing.
- Settings profile save persisted after reload in subagent testing.
- Non-AI plan `Start from Scratch (Empty Grid)`, target edits, and confirm/persist worked in subagent testing.
- Pantry quick-add/delete worked after the page recovered from loading.

### Stabilization Board

Severity: P1
Finding: Fresh/direct route loads can intermittently show only the emulator warning banner and an empty app shell.
Evidence: Product/UX Explorer reproduced blank or near-blank fresh-tab loads on `/grocery`, `/pantry`, and `/progress`; coordinator browser pass also briefly observed an empty `#root` before the app recovered.
Impact: Route QA is unreliable, and users may see a blank app after reload or direct navigation.
Recommended Action: Reproduce in one controlled Playwright/browser test, inspect Firebase initialization/auth restoration timing, and fix before Hosting.
Verification: Fresh-load each launch route after sign-in in dev and production preview, assert expected heading and non-empty `#root`.

Severity: P1
Finding: Local Firestore client can enter offline mode during emulator QA.
Evidence: Data Workflow Explorer saw console messages: `Firestore: Could not reach Cloud Firestore backend. Backend didn't respond within 10 seconds`, plus failed user/settings reads.
Impact: Data-backed pages can hang, show stale/default state, or appear unreliable.
Recommended Action: Investigate emulator/client connectivity and add visible timeout/error/retry states around initial Firestore reads.
Verification: Reload Pantry/Settings/Plan repeatedly under emulator and confirm no offline console errors or indefinite loading states.

Severity: P1
Finding: Current Gemini model IDs are stale for production AI features.
Evidence: Functions pin `gemini-2.0-flash-exp` and `text-embedding-004`. Google Gemini docs list Gemini 2.0 Flash as shut down June 1, 2026 and `text-embedding-004` as shut down January 14, 2026. Sources: https://ai.google.dev/gemini-api/docs/models and https://ai.google.dev/gemini-api/docs/deprecations.
Impact: Meal generation, recipe image/PDF parsing, embeddings, and semantic search may fail even if app code is otherwise healthy.
Recommended Action: Replace model IDs with current supported model constants and retest Functions.
Verification: Functions build plus emulator-safe mocked provider tests, then one approved live smoke later.

Severity: P1
Finding: Pantry primary buttons are dead.
Evidence: Product/UX Explorer clicked `Add Item` and `Scan Item`; no modal, toast, navigation, dialog, or visible state change.
Impact: Prominent pantry actions look usable but do nothing.
Recommended Action: Wire buttons to real add/scan flows or hide/disable with clear coming-soon treatment.
Verification: Browser test clicks both controls and asserts expected UI state.

Severity: P1
Finding: Grocery `View Full Meal Plan` button is dead.
Evidence: Product/UX Explorer clicked it; URL stayed `/grocery` and no modal/navigation appeared.
Impact: User cannot follow a prominent route from grocery list back to meal planning.
Recommended Action: Link it to `/plan` or remove the button until available.
Verification: Browser test clicks the button and asserts `/plan` or expected modal.

Severity: P2
Finding: Pantry can sit on `Loading pantry...` with no visible error.
Evidence: Data Workflow Explorer observed extended `Loading pantry...` after route load and reload; it later recovered.
Impact: User gets no retry path or explanation when Firestore is slow/offline.
Recommended Action: Add timeout/error/retry UI for pantry loading.
Verification: Mock/force failed pantry read and assert user-facing fallback.

Severity: P2
Finding: Local App Check warnings repeat during emulator testing.
Evidence: In-app browser and data agent saw repeated `@firebase/auth` App Check 403 warnings on localhost.
Impact: Console noise hides real failures and may indicate App Check is being initialized when emulator mode should avoid real token fetches.
Recommended Action: Gate App Check initialization so emulator/dev mode does not fetch real App Check tokens.
Verification: Local sign-in and route sweep show no App Check 403 warnings.

Severity: P2
Finding: Dashboard Recharts container warning repeats.
Evidence: In-app browser and data agent saw `The width(-1) and height(-1) of chart should be greater than 0`.
Impact: Possible chart sizing/render instability on dashboard widgets.
Recommended Action: Give the chart container stable nonzero dimensions or render chart only after container/data is ready.
Verification: Dashboard render has no Recharts width/height warning.

Severity: P2
Finding: Grocery page contains stale prototype copy.
Evidence: Product/UX Explorer saw `Week of Oct 24`, `High-Performance Macro Cycle`, `2,400 kcal / day`, and `Estimated Total $Total.00` while app header showed current planning date.
Impact: Page appears mock-like and untrustworthy.
Recommended Action: Replace with live plan data or honest empty/default copy.
Verification: Grocery route shows current plan/date or clear empty state.

Severity: P2
Finding: Pantry empty state contradicts itself.
Evidence: Product/UX Explorer saw `0 Total Items` but also `24+ Meals Possible` and expiring ingredient claims.
Impact: Empty pantry appears inaccurate.
Recommended Action: Suppress AI/meal claims when pantry is empty or source them from real pantry data.
Verification: Empty pantry shows consistent zero-data messaging.

Severity: P2
Finding: Empty plan analysis is misleading.
Evidence: Empty grid showed `0 / 2000` calories and “This plan creates a 2000kcal Deficit.”
Impact: No-meal state is interpreted as a nutrition plan.
Recommended Action: Show “No meals added yet” analysis until the plan has meals.
Verification: Empty plan state avoids deficit language.

Severity: P2
Finding: AI callable failure paths and schema validation are not covered.
Evidence: Current emulator browser tests do not exercise Functions emulator failure states; AI JSON is parsed as `any` and client code maps `aiPlan.days` directly.
Impact: Provider failure or malformed model JSON can crash UI or persist bad drafts.
Recommended Action: Add Functions-emulator tests with mocked provider failures and schema validation.
Verification: Tests cover unauthenticated call, malformed JSON, oversized payload, provider error, and friendly UI failure copy.

### Decisions

- Hosting remains blocked.
- Prioritize stability and current provider compatibility before adding more features.
- Treat the blank/direct-load issue and Firestore offline behavior as the first debugging target because they can invalidate other browser QA.
- Treat stale Gemini model IDs as a production AI blocker before any live AI release.

### Proposed Fix Order

1. Reproduce and fix blank/direct-route loads plus Firestore offline behavior.
2. Gate App Check initialization correctly for emulator/dev mode.
3. Update Gemini model IDs to currently supported models.
4. Patch dead Pantry and Grocery buttons.
5. Clean stale Grocery/Pantry/Plan placeholder and misleading empty-state copy.
6. Add missing automated tests: production-build authenticated route sweep, non-AI plan save/reload, authenticated mobile shell, dashboard check-in/sleep, recipe edit/delete cleanup, and Functions failure states.

### Open Risks

- Mobile authenticated testing remains inconclusive.
- Live AI provider behavior was not tested.
- Firebase Console API-key restrictions and App Check registration were not verified in this run.
- Billing kill switch remains deferred and required before broader sharing.

### Commit/PR

Not created.

## 2026-06-20 Stabilization Patch: Honest Placeholder States And Regression Tests

Date: 2026-06-20
Mode: Implementation + QA
Scope: Step 5 and Step 6 from the stabilization plan: stale placeholder cleanup and additional regression coverage.

### Goal

Remove misleading prototype claims from Pantry and Grocery while preserving the small manual/prototype flows that still work, then add tests to catch the same drift later.

### Decisions

- Pantry is still under development, so it should be framed as Coming Soon instead of pretending that scan, expiry tracking, AI pantry suggestions, meal forecasting, or pantry-to-shopping-list intelligence are live.
- Grocery remains useful as a manual list, so the quick-add/check-off flow stays active.
- Grocery should no longer claim a hardcoded generated macro cycle, fake week, fake checkout total, fake store availability, or live sync.
- Functions failure-state tests remain a follow-up because they need a mocked AI/provider harness; routine local QA should not call live providers.

### Files Changed

- `src/pages/Pantry.tsx`
- `src/pages/ShoppingList.tsx`
- `tests/e2e/emulator-auth.spec.ts`
- `tests/e2e/prod-emulator-auth.spec.ts`

### Behavior Changed

- Pantry now shows a prominent Coming Soon notice.
- Pantry scan and full-add buttons are disabled and labeled as coming soon.
- Pantry stats for expiry tracking and meals possible now show `Soon` with explicit not-live-yet subtitles.
- Pantry no longer displays fake dinner suggestions, fake pantry-to-shopping-list items, or the hardcoded `24+` meal claim.
- Grocery now derives meal-plan source details from `activePlan` when present and otherwise displays Manual List Mode.
- Grocery checkout, print/PDF, store matching, and delivery availability are disabled or marked coming soon.
- Grocery no longer shows hardcoded `Week of Oct 24`, `High-Performance Macro Cycle`, `$Total.00`, `Whole Foods`, or fake sync/cycle copy.
- Emulator tests now assert Pantry/Grocery do not regress into the stale prototype claims.
- Emulator tests now check Dashboard check-in and sleep actions open their modals.
- Production-build emulator tests now assert Pantry/Grocery placeholder cleanup in the built app.

### Verification

- `npm.cmd run lint`: passed after the final copy cleanup.
- `npm.cmd run build`: passed before the final `Local list ready` copy cleanup. The final build rerun was blocked by the Codex usage-limit approval gate, not by an app error.
- Source scan for old production-facing stale copy: no remaining matches in `Web App/src` except the legitimate mock recipe title `Grilled Lemon Herb Chicken`.
- Browser emulator QA was not rerun in this slice because the escalation request for `firebase-tools emulators:exec` was rejected by the Codex usage-limit gate. Do not treat the new browser tests as passed until the emulator suites are run again.

### Open Risks

- Need rerun:
  - `npm.cmd run build`
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts"`
  - `npx.cmd --yes firebase-tools emulators:exec --only auth,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.prod-emulator.config.ts"`
- Functions AI failure-state tests still need a mocked provider path.
- Recipe edit/delete cleanup coverage is still not complete.
- Mobile authenticated testing remains incomplete.

### Commit/PR

Not created.

## 2026-06-20 Stabilization Patch: Recovery UI And AI Provider Guard

Date: 2026-06-20
Mode: Implementation + QA
Scope: Step 3 and Step 4 from the stabilization plan: loading/error recovery and stale Gemini model/provider isolation.

### Goal

Make local and production-build QA less fragile by preventing indefinite loading states, surfacing Pantry load failures with a retry path, and stopping local Functions emulator runs from making accidental live Gemini calls.

### Root Cause

- Pantry loaded Firestore data silently. If local services were unavailable or slow, the user could only see a generic loading state or console-only failures.
- Initial app data loads waited on Firestore without a timeout, so slow settings, plan, or grocery reads could hold the app in a fragile startup state.
- Functions still referenced shut-down Gemini model IDs: `gemini-2.0-flash-exp` for generation/vision and `text-embedding-004` for embeddings.
- Firestore-triggered embedding generation could run inside the Functions emulator and call the live Gemini API during local QA.

### Files Changed

- `src/pages/Pantry.tsx`
- `src/lib/store.tsx`
- `functions/src/index.ts`

### Behavior Changed

- Pantry reads now use a 10-second timeout and show a visible retry panel if loading fails.
- Pantry save/delete failures now surface a user-visible message and refresh where appropriate.
- Initial settings, plan, and grocery reads now use a 10-second timeout so app initialization can recover instead of waiting forever.
- Missing settings fall back to default settings even when the settings read rejects.
- Gemini model IDs are centralized and configurable with environment variables:
  - `GEMINI_TEXT_MODEL`, default `gemini-3.5-flash`
  - `GEMINI_MULTIMODAL_MODEL`, default `GEMINI_TEXT_MODEL`
  - `GEMINI_EMBEDDING_MODEL`, default `gemini-embedding-2`
- Callable AI functions are disabled in the local Functions emulator unless `ALLOW_EMULATOR_AI_CALLS=true`.
- Firestore embedding generation is skipped in the local Functions emulator unless `ALLOW_EMULATOR_AI_CALLS=true`.
- Gemini API key validation now uses one shared helper.

### Source Checks

- Google Gemini model docs list `gemini-3.5-flash` as a current stable model and list Gemini Embedding 2 as the current multimodal embedding model.
- Google Gemini deprecation docs list `gemini-2.0-flash` as shut down on June 1, 2026 with replacement `gemini-3.5-flash`.
- Google Gemini deprecation docs list `text-embedding-004` as shut down on January 14, 2026 with replacement `gemini-embedding-2`.
- Google image and document processing docs show `gemini-3.5-flash` handling inline images and PDFs.

Sources:
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/deprecations
- https://ai.google.dev/gemini-api/docs/embeddings
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/document-processing

### Verification

- `npm.cmd run build`: passed after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox.
- `npm.cmd --prefix functions run build`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd --prefix functions run lint`: passed.
- Raw `npx.cmd playwright test --config=playwright.emulator.config.ts`: failed because Auth emulator was not running; both signup and login stayed on `/auth` with `Authentication failed. Please try again.`
- Raw `npx.cmd playwright test --config=playwright.prod-emulator.config.ts`: failed for the same missing Auth emulator reason.
- Correct harness `npx.cmd --yes firebase-tools emulators:exec --only auth,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.emulator.config.ts"`: 8 passed.
- Correct harness `npx.cmd --yes firebase-tools emulators:exec --only auth,storage --import=firebase-export-1769202055289c4PDRf "npx playwright test --config=playwright.prod-emulator.config.ts"`: 2 passed.

### Notes

- Firestore emulator was already running on port `8080` under a Java process, so the full `auth,firestore,storage` emulator harness could not start. Auth and Storage were started around the existing Firestore emulator for this pass.
- Live Gemini behavior was not tested. The local guard intentionally blocks accidental live AI calls; a live AI smoke test should be deliberate and use `ALLOW_EMULATOR_AI_CALLS=true` or production Functions after budget controls are ready.
- Existing non-blocking warnings remain: Browserslist data age, Vite dynamic/static import chunking warnings, large bundle/chunk warning, and Firebase storage rules runtime Java deprecation warning.
- Dead Pantry/Grocery buttons and stale placeholder copy remain deferred.
- Billing kill switch remains deferred and required before broader sharing.

### Commit/PR

Not created.

## 2026-06-20 Stabilization Patch: Route Hydration And Local App Check

Date: 2026-06-20
Mode: Implementation + QA
Scope: Step 1 and Step 2 from the stabilization plan: direct-route app loading and emulator App Check behavior.

### Goal

Prevent fresh/direct route loads from rendering a blank app shell when Firestore is slow, and stop local emulator testing from fetching real App Check tokens.

### Root Cause

- `AuthProvider` waited for `initializeUser()` before rendering children. Because `initializeUser()` reads/writes Firestore, a slow or offline Firestore emulator could leave React with no app UI to render beyond the Firebase emulator banner.
- App Check was initialized whenever a reCAPTCHA site key existed, even when Firebase emulators were active. That caused repeated localhost App Check 403 token warnings.

### Files Changed

- `src/lib/auth-context.tsx`
- `src/lib/firebase.ts`
- `src/lib/store.tsx`
- `src/services/userService.ts`
- `tests/e2e/emulator-auth.spec.ts`
- `tests/e2e/prod-emulator-auth.spec.ts`

### Behavior Changed

- Auth state now renders the app as soon as Firebase Auth resolves; user document initialization continues in the background.
- New users receive immediate default settings from the app store if their Firestore user document is not available yet, preserving onboarding without blocking rendering.
- App Check initialization is skipped when Firebase emulators are active.
- Dev-emulator and production-build emulator tests now hard-load launch routes and fail on App Check token warnings.

### Verification

- `npm.cmd run check`: passed.
- `npx.cmd playwright test --config=playwright.emulator.config.ts`: 8 passed.
- `npx.cmd playwright test --config=playwright.prod-emulator.config.ts`: 2 passed.

### Notes

- During setup, the all-in-one emulator command could not start because an existing Firestore emulator process was already holding port `8080`. Auth, Storage, and Functions were started separately around the existing Firestore process for this QA run.
- Functions emulator warned that it did not own a Firestore emulator in that split-start state; this pass focused on client route hydration and App Check console behavior.
- While Functions was running, Firestore write activity triggered `generateRecipeEmbedding`, which attempted `text-embedding-004` against the live Gemini API and failed with 404. This confirms the stale model ID risk and shows that Functions-emulator QA can still cause live provider attempts unless provider calls are mocked or disabled.
- Existing non-blocking build warnings remain: Browserslist data age, large bundle/chunk warning, and dynamic import chunking warnings.

### Open Risks

- Need a clean full-stack emulator restart later to confirm all emulators are owned by one process.
- Pantry-specific visible timeout/error/retry handling is still not implemented.
- Dead Pantry/Grocery buttons and stale placeholder copy remain deferred.
- Stale Gemini model IDs and live-provider mocking/disablement remain the next stabilization step.

### Commit/PR

Not created.

## 2026-10-02 Core recovery: BUG-032 through BUG-036

Scope: Web App only. GitHub main was verified at `428a523`; original local committed app source was `1412441`. PR3 restores that exact Web App tree in `466d267`, with every changed path under Web App. Independent read-only comparison found no tree differences from the source. Original uncommitted work and Chef work were excluded. PR4 (`fcd1904` code checkpoint) stacks the new fixes on PR3; neither PR is merged or deployed.

### Reproduction and correction

- Onboarding: a delayed rejected save unmounted Preferences and reset the draft. Commit-before-publication now keeps the form and error visible until retry succeeds.
- Returning account: a settings read delayed beyond the initial timeout produced Welcome onboarding. Unknown settings now show a retry gate inside the navigation shell; retries do not reset unrelated state.
- Check-in: manually entering zero left the profile at zero while daily history retained the previous valid weight. The new batch commits profile and history together, preserving hydration/sleep fields; validation rejects invalid weights before writes.
- Numeric setup: negatives advanced and decimal weights were truncated. Bounds are checked in place and decimal measurements are preserved.
- QA: generated trace HTML caused unsolicited page reloads, followed by a Windows EBUSY watcher crash. `_local` is now excluded. Preview checks originally attached to an unrelated app on the default port; that run was stopped, and preview configs now require an owned server with a selectable strict port. Shared-account check-in assumptions and an onboarding wait on an already-hidden Welcome step were corrected without changing product behavior.

### Verification recorded so far

- Baseline `npm run check`: passed, 85 frontend tests and 116 Functions tests. Baseline E2E: 72/74; two imperial assertions used a metric fresh fixture. Correcting the fixture resolved Settings discard; existing recent history explained the check-in rerun failure.
- Patched `npm run check`: passed, including lint, TypeScript/build, 85 frontend and 116 Functions tests.
- Seven new emulator regressions pass: onboarding save rejection/retry, settings timeout/retry, atomic check-in failure/retry with daily-field preservation, stale post-commit account switching, decimal/invalid onboarding input, invalid check-in input, and real Firestore rejection of the history half of a batch.
- First expanded E2E run: 58/81, interrupted by the watcher crash; 19 failures were connection refused after the server stopped. Remaining failures included shared-history assumptions and reloads from generated traces. After watcher/fixture correction: 80/81. The remaining onboarding test reloaded before commit; replacing its already-hidden Welcome wait with the active Preferences step passed 3/3 consecutive repetitions.
- Built app against emulators: 4/4 passed on an owned alternate preview port. Firestore rules: 34/34 passed.
- Hands-on in-app browser: repeated settings timeout/retry; entered negative weight and blank calories; verified inline errors; entered 73.4/68.2 and 2250, injected delayed save rejection, went Back to confirm preserved values, retried and reloaded. Database readback confirmed the exact saved values and onboarding completion.
- Hands-on check-in: invalid zero stayed editable; injected history failure kept the prior saved weight and draft; retry/reload showed 74.3 in both profile and history. Phone viewport 390x844 showed visible error/input/save controls. Temporary viewport was reset.
- Local evidence: `_local/qa/onboarding-retry.jpg`, `checkin-retry.jpg`, `mobile-weight-validation.jpg`, `core-final.log`, `onboarding-wait-recheck/`, `prod-isolated.log`, and `check-final.log`. These ignored machine-local artifacts are not shipped in the PR.

Limits: local emulator evidence only; AI callable paths use mocks and no Functions emulator was run. No live provider calls, production account edits, deployments, or merge actions. Historical audit closure counts do not prove that all remaining web-app bugs are fixed. Remaining backlog includes keyboard/form behavior, recipe load recovery and file lifecycle, grocery/pantry edge cases, and deferred features. Preserve AUD-068's wider onboarding escape requirement as open; this batch proves retry, not every escape path.

Additional public smoke: 9/18 passed. All nine desktop cases passed; every mobile case reached the expected page but failed its console assertion on a blocked `apis.google.com` script requested by Firebase Auth. This is tracked separately as BUG-037; do not describe the entire QA gate as green. Browser keyboard check also confirmed AUD-057: Enter in the filled password field did nothing, while clicking Log In with the same disposable credentials succeeded.

Final emulator rerun after the test-wait correction: **81/81 passed** (5.6 minutes), including all seven new recovery regressions. Log: `_local/qa/core-release-check.log`. Product code checkpoint remains `fcd1904`. The separate public mobile gate still fails on BUG-037; these results do not clear that known issue or certify deployment.

## 2026-10-22 G1 attempt2 — selected servings through Planner

Fresh Reviewer1 requested one P2 correction on PR11/head6a6cb16: Planner dropped the selected detail yield before cooking. Independent source-only revert produced17 assertion failures/29; restored40/40 G1 and123/123 unit passed. Both new actual-emulator Planner entry assertions failed36oz-versus24oz before source correction and now pass2/2 at1440/390px (26.6s). Parent Chrome independently reproduced the mismatch and confirms the desktop correction; full gates and both fresh reviews are pending. Evidence: _local/qa/fix-loop-2026-10-22/g1/attempt-2/. No merge or closure claim.

Attempt2 final gates: npm check123frontend/116Functions pass; public18/18 pass45.2s; full emulator56pass/28fail14.7m exit1, failed-title set exactly equals main-identical baseline, no additions/removals. Both expanded G1 cases and updated G0 regression pass. Final parent Chrome1440x1000/390x844 repeated all G1 repros through both Recipes/Planner cooking entries, scaled/range/fraction/classification groceries, checked/manual/quick-add reload, and Dashboard/Planner/Recipes/Grocery smoke. Root widths fit; both console logs0errors. Settled screenshots final-desktop-reload-settled.png/final-phone-reload.png and current-source cooking planner-fixed-desktop.png/planner-fixed-phone.png under attempt2. Stale final-desktop-planner-cooking.png is excluded; DOM reflects the correct quantities. Independent fresh reviews and CI on the new pushed commit remain required before merge.

## 2026-10-27 G5 mocked contract — parent focused verification

VM003/004 sourceiteration1 on codex/fix-g5-ai-contract/base4f760fc. Failing-before client2 and server8 regressions proven; generic/snack preservation control1 passes both. Focused green client2/server9; check169frontend/125mockedFunctions/lint/buildPASS. Actual Planner mocked integration2/2desktop390PASS including payload, IDs/null, rejected draft preservation, save/reload/detail/cooking/Grocery sentinels. Parent Chrome mock contract and ordinary paused consumer pages both widths complete; eight final bounded console windows clean, prior VM035 cold timeout and truncated window retained/excluded. Main-identical P3VM047 assignedG14. Evidence `_local/qa/fix-loop-2026-10-22/g5/fixed/parent-proof-index.json`; full final gates/PR/CI/fresh reviews pending. No live AI/provider/production/deploy or schema/rule changes.

G5 final gates: check169frontend/125mockedFunctions/lint/buildPASS; public18PASS; full emulator126PASS/4exact authorized paused-AI main exceptions (exit1,16.1m), both new G5 cases PASS. All gate source/test hashes match current files. Proof: `_local/qa/fix-loop-2026-10-22/g5/final-gates-proof.json`. Twenty-five current synthetic export files preserved byte-identically after confirmed EPERMrename; original retained. PR/CI/fresh sequential reviews still pending.

G5 [PR15](https://github.com/sararh95/VioMacro/pull/15) opened/attached from main4f760fc; source/test/docs51ac872 committed/pushed. VM003/004 Fix in PR. Current-head CI and fresh sequential reviewers pending; no closure/merge claim. Manual emulator runtime restored from the25-file current G5 snapshot with explicit projectviomacro; actual AI flags unset.

G5 PR15 mergeda8dc25b, VM003/004 Closed. Exactreviewedhead2460134 has both fresh APPROVE comments6433643956/6434018890, currentCI40447236055SUCCESS, matching main tree/ancestry verified. Parent169unit/125Functions/check/public18PASS, emulator126/4exact authorized main exceptions; independent R1source-onlynegative/restoredpositive and R2owncheck/actualChrome desktop390/data/console audited. Later VM046/G13 and VM048/G15 remain existing-main nonblocking issues. Merged branch removed remote/local; cleanmaintenance mainff; two occupied bundled legacy branches preserved. No deployment/liveprovider/production access.
# G6 local certification — 2026-10-27 UTC ([PR16](https://github.com/sararh95/VioMacro/pull/16))

Fresh-data test infrastructure addresses the local reproductions for VM-010/020/026. At head33eeff15, VM-027 and VM-041 could not be reproduced in the bounded local investigation; later CI reproduced VM-027 as recorded below, requiring a new harness correction and gates. VM-035 remains Open/G16 because the observed browser queuing has no established application root cause; the recovery guard is unchanged.

- Frozen inputs before the later VM027 CI correction (head33eeff15): `npm run check` PASS (182 frontend,125 mocked Functions, lint/build,0 skipped); public E2E18PASS17.5s; authenticated emulator E2E131PASS13.1m; built-emulator smoke4PASS35.6s. Mandatory infrastructure4PASS is included in the authenticated command. All four receipts'120 captured source/config/test/dependency inputs matched that head: `_local/qa/fix-loop-2026-10-22/g6/{check-1793082417,public-1793082682,emulator-1793082940,prod-1793082298}-result.json`. These receipts do not certify the subsequent changed test harness.
- No private import/login/env required: actual wrapper explicitly used viomacro, only Auth/Firestore/Storage, fresh data/no import and paused AI. Minimal normal-client seed creates only an absent completed imperial profile, preserves compatible saved state and refuses incompatible state. Pinned CLI's optional credential discovery is quarantined with an empty XDG store and explicit non-file ADC directory; actual GoogleAuth fallback/compute/network counters0 in the regression and independent offline proof. Runtime AI flags remain unset; expected AI flows use scoped mock availability plus intercepted callables.
- Test-first proof: original8cases7FAIL/1controlPASS; scoped QA-server baseline3FAIL/1normal-build-controlPASS; credential-discovery regressionFAIL before its fix. Current13unit and4infrastructure regressionsPASS, no assertions/tests/timeouts weakened. UTF16 original ignore bytes and wrapper preserved under `_codex-trash/2026-10-26/g6-before-infrastructure/`.
- Actual Codex Chrome: fresh synthetic account, Dashboard/Plan/Recipes/Grocery plus Settings and Import at1440x1000/390x844;12 accepted exact-pixel PNGs, meaningful route/content/root-width and untruncated settled error windows, plus available tab error logs. Settings saved2200 and imperial labels; checked2.5oz manual grocery and full profile survive seed rerun exactly and browser reload. Runtime SDK readback confirms all3 loopback endpoints/projectviomacro/AI unavailable. Phone/desktop visible sign-out controls work; final fresh cleanup tab verifiesuidnull/auth. Viewport/diagnostics reset, own tabs gone, no permission/settings changes. Proof: `g6/chrome-final/proof-index.json`, browser-runtime-config.json, saved-data-preservation-profile.json and cleanup-final.json.
- Chrome limitations retained honestly:13 earlier browser-API resized images and truncated cross-navigation windows excluded; raw CDP PNG capture replaced only the visual evidence. Hidden responsive DOM duplicates required visible locators; initial failed default sign-out selector was setup, not a product failure. All old frames/setup receipts remain. Console proof is scoped to bounded settled windows, not an unrecorded whole lifetime.
- Supplemental alternate-port functional assertions (19099/18085/19199/App15173) prove nonzero/checked-data preservation, refusal, Storage bytes and UI reloads, but its auxiliary probe exit1 remains because an expected connectivity pixel missed its local mock. Raw startup warnings retained; this is not an all-green auxiliary gate. Own state exported/verified and services stopped. Source-identical copies/data/config receipts in `g6/nondefault-ports/`.
- Before replacing old services, all25 current synthetic export files were byte-verified into `_local/firebase/exports/firebase-export-g6-before-fresh-2026-10-26`; original completed export retained after Windows EPERM rename. Prior QA reports/results archived, no permanent file deletion. Current paused manual runtime: Vite session89210/PID30760; Auth/Storage session68843/Node5128; FirestoreJava42976; no Functions. Preserve current new QA data before any later service restart/import.

No deploy, live AI/provider call, production data, rules/index/schema or product-feature change. Fresh-checkout CI and independent sequential PR reviews remain pending.

G6 CI update: current-head33eeff15 run[40471016682](https://github.com/sararh95/VioMacro/actions/runs/40471016682) FAILED at authenticated E2E:130PASS/1FAIL, the AI-search callable-error native-dialog test also fails its retry with45000ms timeout at dialog.accept. Code checks, public18 and infrastructure4 pass; built-emulator not run. VM027 now Open/reproduced in G6, superseding only its earlier local Cannot reproduce disposition. Immutable main/head dialog sequences match. Actual-callback ordering regression is being written before any harness repair; no timeout/retry/assertion weakening. Reviewer1 precondition session stopped without review/verdict, Reviewer2 not started. PR16 remains open and unmerged. Failure log/receipt: g6/ci-40471016682-browser-job.log and ci-40471016682-failure.json.

G6 VM027 test-first correction: actual callbacks4behavioralFAIL/4controlsPASS then minimal existing-helper orchestration produces8PASS/0skip. Failed-image same-pattern caller included, unsupported drop preserved. Full gates restarting on changed harness; all original E2E assertions/timeouts/retries retained. Current Chrome synthetic state7files byte-verified in a new after-parent-QA export before owned services stopped; old snapshot/original export kept. See G6 running log and g6/dialog-regression/report.md. No new commit/push or review approval yet.

G6 corrected-harness final local gates: check190frontend/125mockedFunctions/lint/build0skipPASS; public18PASS29.6s; fresh emulator131PASS17.2m plus infrastructure4PASS; built-emulator4PASS1.0m. All121 inputs equal/current, both affected native-dialog paths pass. g6/final-dialog-proof.json also verifies55 App inputs unchanged versus accepted desktop390 Chrome/main and all12 PNG hashes/dimensions. Retained CLI pre-transform warning is not asserted as a browser-console error; functional guards pass. New exact-head CI/fresh sequential reviews remain mandatory, previous CI failure retained; no merge claim.

G6 exact570db88 CI40477859554 SUCCESS (check/browser jobs bothgreen). Public18PASS32.6s, infrastructure4PASS, freshviomacro/paused/noimport emulator130PASS+1flaky retryPASS17.3m, built4PASS39.7s. Native dialog cases pass. Flaky G4 count reload750ms unchanged on immutablemain/Appsource; main runtime not rerun. Recorded VM049/P3/G17 NeedsEvidence, no test/timeout/retry weakening or131first-attemptCIclaim. Fresh R1 source/tests started afterCI; R2 pending. Receipt g6/ci-40477859554-success.json and fulljoblog retained.

G6 PR16 MERGED35c518565a490b55e20872cf6172365d4df4606f; VM010020026027Closed. Exactreviewed570db88 tree/ancestry verified, currentCI40477859554green and freshR1APPROVE6438364516/R2APPROVE6438826031 APIbodies/evidence audited. Localcheck190/125/public18/fresh131/built4, independentcheck190/125/infra4/actualChrome1440+390/reload/seedpreservation/mockfailures/importcleanup pass. CIemulator130+1flaky retrypass retainedasVM049/G17. BothG6refsdeleted, remote mainonly, maintenance mainffclean/twooccupiedlegacyrefs preserved. No deploy/provider/production/rules/index/schema change; closure docs carriedG7, finalwholeloopcertificatepending.

G7 unfixed35c5185 Chrome1440/390 bothLibrary+Planner:VM029[]blankroot+TypeError6paths inclmissingfallback, VM030first120initial00Reset02/decimalpreserved, VM032desktopFullRecipeinert/Replaybothwidthsinert. ExactPNGs/boundedwindows/data/sourcefreeze in g7/unfixed-chrome-35c5185/. UnitSSRRED9/6expectedFAIL/3controlsPASS, sourceunchanged; E2EfocusedRED29078running, noAppfixyet. Currentfullsyntheticstate7fileexportverifiedbeforeownedruntimestop/freshRED; EPERMcompletedoriginalkept. No provider/production/deploy/schema/testweakening.

G7 finalbehavioralRED: earlier6emptycrashes +correctedfixture rerun4zero-firsttimer/2FullRecipenoop failures onunchanged35c5185; unit6FAIL3controls. Firstfixturefailuresretained/classifiednotbugproof. Sourceiteration1 only2recipecomponents, originalbytesarchived. UnitGREEN9PASS0skip. Completed focused-1793098315: infrastructure4PASS, browser10PASS/2FAIL, inputs unchanged. Both failures are Planner countdown after Finish/reentry:01:59 after2000ms fake-clock advance versus01:58 expected; no claim of a completed browser gate. Full check-1793098927 passes199 frontend/125 mocked Functions with lint/build and zero skipped tests, inputs unchanged. Existing timer/effect trace under read-only diagnosis. No existingtest/assertion/timeouts/retries/rules/provider/data-schema changes; no G7closure/PRclaim yet.

G7 subsequent proof: unchanged focused-1793099573 repeats10PASS/2PlannerFAIL. Full minimal diagnostic1793099913 captures intervalclear/recreate+1400 afterfirsttick+1000, movingnexttick+2400; originalcontinuous2000 assertion fails atbothPlannerwidths. Spec fullyrestored/allApphashesunchanged. VM050/P2 loggedfinalG18, owningeffectidenticalmain35c5185; mainruntimeandquantifiedrealChromedriftnotrerun. Scopeexceptionpending; no source/harnessfixapplied and no testweakening. Public-1793100230 PASS18/31s; built prod-1793100357 PASS4/39.5s plusinfrastructure4; inputsunchanged. Manualruntime restoredlatestG7snapshot, original-fix Chrome captain collecting1440/390/corepagesproof. Fullfreshsuite/PR/CI/freshreview/finalcertificatepending.

G7 originalfix actualChrome complete: bothcallers1440/390, eightempty/omittedpaths and full originalVM029030032controlmatrix PASS; coreDashboard/Planner/Recipes/Grocery reload/modal/search/inlinefeedback quickchecks PASS. Parent audit347nonselfSHA256/103decodedPNGs/nineunchangedinputs/fullbefore-afterdataequality/20boundedcleanwindows passes; twoearlytruncatedstartupwindowsretained. Onlynewownomittedrecipe added; allpriordataunchanged. `g7/parent-fixed-qa-audit.json` and `g7/fixed-chrome-iteration1/report.md`. VM051/P3FullRecipecontrast/VM052/P3localdesktopfooterwarningoverlaploggedG19/G20, sameowningmainclasses/blob, no globalnoclipclaim. Freshest7fileexportverified `firebase-export-g7-after-fixed-qa-2026-10-27`; olderpre-redsnapshotnowstale. OriginalfixesmoveFixinPR/draft; VM050scopeanswerstillrequired, no sourceproposalapplied/noformalreviews/noG7merge.

G7 [PR17](https://github.com/sararh95/VioMacro/pull/17) DRAFT/open, source/test commitdb109d786b09a837344ae58380ddb21e3a1b0d86 pushed; VM029030032FixinPR. Stop pending one required scope exception for main-identicalVM050 intervalphase. Three-line sourceproposal unapplied, exactcontinuousE2Eassertions unchanged; no fresh reviews or merge while gates red. Full fresh/current-headCI/finalwholeloopcertificate not complete. Current preserved manual runtime/data remains available; no deploy/production/provider operation.

G7 resume2026-10-27: Sara explicitly approves VM050 narrowexception. Source iteration2 onlystable-runningguard/dependency; originalupdater/cleanup/clock/assertions untouched. `focused-1793107717` infrastructure4PASS/G7all12PASS/inputsunchanged. E2Ee349d166 andunit3359091d remainexact; sourceFF4ee1b1 matchespreviousscratchproposal. RemainingCIrun40499383962 is142PASS1FAIL AUD022legacyuntick/reload3280initial+retry, allG7PASS; previoussourceCI141PASS1flaky(timer390)1FAIL(sameAUD022). Two pushes/twofailedruns, notthree. Logs preservedg7/ci-investigation-7c4220c/. Controlledactualwrite-ack/reload diagnostic pending; no hiddenharnessfix or mainruntimeexemption. Current-sourcefullgates/finalChrome/freshsequentialreviews stillrequired beforemerge.

G7 CI diagnostic confirms controlled AUD022 unload-before-ack mechanism: held-originalFAIL/same-delaystored-falsecontrolPASS, all original assertions/timeouts retained, authoritative before/after readbacks and requestabort recorded. HistoricalCI artifacts unavailable; no exact-CI chronology claim. Actual-callback ordering regression RED1PASS1FAIL ->GREEN2PASS0skip. VM053fix addsoneindependentpersistedfalseassertion BEFOREoriginalreload; originalbytes/assertions/actions/timeouts/retries preserved, entireG7append byte-identical; testfileSHA4a129dbe. No App meal-status policy change; observed pending-write edge VM054 logged G21. New fullcheck running201frontend/125mockedFunctions; no thirdpush/CIgreen/review/merge claim yet.

G7 source2 final local verification: check201frontend/125mockedFunctions/0skip+lint/build, public18, fullfresh143/19.3m+infra4, built4+infra4 PASS;123currentinputs unchanged. Receipts `g7/{check-1793108596,public-1793108943,emulator-1793111098,prod-1793110655}-result.json`. Earlier full142PASS/1pre-AppbootstrapFAIL retained: @react-refresh net::ERR_NO_BUFFER_SPACE preventsG3authsetup, beforeApp/Firebase/imageassertions. ONEclean same-input rerun passes; no assertion/timeout/retry change or main exemption. Functions lint selects no source, known limit.

Final source2 actual Codex Chrome bothLibrary/Planner1440x1000/390x844: VM029/030/032 matrix, decimal/localserving/reload/savedvalue preservation and coreDashboard/Planner/Recipes/Grocery quickchecksPASS. VM050 four native cycles each>=2realDOMdecrements/ONEintervalregistration/0runningclears/Pauseclear/nativeexactrestore. Separate Blegacy untick independentlystoredfalse before reload persists desktop/phone/rawdaysunchanged; only expectedmap+updatedAt delta, noVM054fixclaim. A profile/allcollections unchanged4recipes/1plan. Evidence `g7/fixed-chrome-iteration2/{report.md,proof-index.json}`234nonselfhashes/38exactPNGs/21cleanboundedwindows;2truncatedsetupwindows excluded. Source10hashesunchanged, signedout/reset/closed/leasefree. VM051/052visualfollowups retained/no globalnoclip claim. Exact-headCI/freshsequentialreviews/merge stillrequired.

G7 exacthead5d08b5d CI[40530516578](https://github.com/sararh95/VioMacro/actions/runs/40530516578) COMPLETE SUCCESS: check201frontend/125mockedFunctions, public18/19.5s, fresh143/16.5m, built4/29.8s. Actual AUD022 and all12G7cases pass; parent independently fetched bothsuccessfuljobs/steps and read terminalcounts. Evidence `g7/ci-5d08b5d/`. Raw warnings/Functions-lint coverage limit retained. Fresh correctnessreview started afterCI, safetyreview awaitsAPPROVE; no merge/finalwholeloopcertificate yet.

G7 PR17 MERGED35d2e2aff07fa0947fc6c7cde3e482da67778aef: VM029/030/032/050/053Closed. Reviewed5d08b5d exacttree/ancestry andtwo-parentmerge verified. CI40530516578green201/125/public18/fresh143/built4/0retries-skips-flaky; fresh [R1APPROVE](https://github.com/sararh95/VioMacro/pull/17#issuecomment-6446909133)/[R2APPROVE](https://github.com/sararh95/VioMacro/pull/17#issuecomment-6447608970) bothoncurrenthead. R1source-only negatives/restored11unit/14+8runtime; R2owncheck201/125/actualChrome1440+390/33PNGs/38qualifiedcleanwindows/readbacks. Log/Networkdomaincoverage notcertified; callback-probe limits explicit. Parent121source+196artifacthashes/APIbody+dataexportverified. Latestexportafter-reviewer2 preservedallfixtures, servicesstopped/leasefree. BothG7refsdeleted, remotemainonly/cleanmaintenancemainFF/twooccupiedlegacyrefsretained. No deploy/provider/production/rules/index/schema change. Closurebookkeeping carriedG8; finalmain/allpagescertificatepending.

G8 VM037unfixedChrome6/6reproduced1440+390duplicatecounts/checkedlossbothdirections; g8/unfixed-chrome-35d2e2a210hashes/40PNGs/31boundedwindows(2truncatedexcluded)/source+rawrecipes+sentinelsunchanged, LogNetworknotcertified. CURRENT7fileexportbefore-redverified/ownedservicesstopped. Append-onlyunitRED72/61PASS11expectedFAIL; freshE2EREDred-1793122242infra4PASS/browser4expectedFAIL/123inputsunchanged/noTimeouts. No Appfixyet/noG8closure; rawlogs, setup/helpercorrections andpre-fixsourcebackupretained.

G8 source iteration1 changes only the shared grocery identity key. Unchanged RED tests pass: focused72unit and4emulator cases plus infrastructure4. Full local check224frontend/125mockedFunctions/0skip+lint/build, public18, fresh emulator147/16.6m plus infrastructure4, built emulator4/35.2s PASS. Receipts `g8/{check-1793122900,public-1793123161,emulator-1793123315,prod-1793124426}-result.json/log`; all123 inputs unchanged. Built gate has no infrastructure prefix. Existing raw warnings/pre-transform error retained; Functions lint selects no source. Latest seven-file G8 manual dataset verified/restored for sole-captain fixed Chrome desktop390/reload/corepages; final Chrome/PR/CI/fresh sequential reviews pending, no closure claim.

G8 final actual CodexChrome sixcases1440/390 PASS: combined14ozqty1checkedtrue and checkedcarryoverbothdirections, all realAddtoList4/normalSDK/Groceryreload;28oz/Beans/Rice/manuallegacy andrawprofile/3recipes preserved. Base4/selected5Detail+Cooking wording/package sizes unchanged; coreDashboard/Planner/Recipes/Grocery quickchecks/reloads PASS. `g8/fixed-chrome-iteration1/`233nonselfhashes/25exactPNGs/20SDKsnapshots/14×7stableApphashes/48DOM/43diagnostics. Two truncated windows excluded,0capturedRuntimeerrors/exceptions; Log/Network coverage uncertified. TwelvePNGs individually inspected bycaptain, fiveparent samples; no globalclipping claim. Latest seven-file CURRENTexport `firebase-export-g8-after-fixed-qa-2026-10-27` byteverified/originalWindowsrenamefailure retained, then ownruntimesstopped/all5portsfree/Chromeleasefree. PR/CI/freshreviews pending; VM037 notClosed yet.

G8 [PR18](https://github.com/sararh95/VioMacro/pull/18) open from source commitf7c1f45; VM037 Fix in PR. All local gates/actualChrome/savedproof audits pass. PR-link documentation update preserves every App/test input; exact published-head CI and both fresh sequential verdicts remain required, no merge claim.

G8 current-head c7fc08a CI[40560640681](https://github.com/sararh95/VioMacro/actions/runs/40560640681) SUCCESS, attempt1:224frontend/125mockedFunctions/public18/fresh147+infra4/built4,0skips-flaky-retry markers. Both jobs/all steps successful; CI mergecheckout tree equals head; raw Vitepretransformwarning retained. Full metadata/logs `g8/ci-c7fc08a/`; root independently refetched terminal run/jobs. Fresh fork-none correctnessReviewer1 now running its own source-only scratch negatives/restored tests; safetyReviewer2 waitsAPPROVE. No merge/closure claim.

G8 fresh [R1APPROVE6451241737](https://github.com/sararh95/VioMacro/pull/18#issuecomment-6451241737) on exactc7fc08a: own candidate72unit/4E2E PASS, source-only immutablebase61PASS11meaningfulunitFAIL/4behavioralE2EFAIL, restored72/4PASS. Tests/config exact all6runs; unrelated data/recipe controls preserved. Initial Java/PATH pre-test setup failure retained separately. Root API body/seven current+Git hashes verified and copied verbatimlog; ownservices/PIDs gone/allcanonical+auxportsfree. Fresh R2 starts its independent check, Chrome awaits rootREADY; no merge/VM037closure yet.

G8 [PR18](https://github.com/sararh95/VioMacro/pull/18) MERGED21a7905e46d054c9bd5eae310039b743bd01212c; VM037Closed. Exactc7fc08a tree/two-parent/ancestry verified; CI40560640681green224/125/public18/fresh147+infra4/built4, freshR1APPROVE6451241737/R2APPROVE6452056002 APIbodies/proof audited/verbatimlog. R1source-onlynegatives/restored72/4; R2owncheck224/125/actualChrome1440+390/29savedassertions/26exactPNGs pass. ActualfaviconLogerrors remain VM041/G23/source-onlymaincomparison; capture and audit read-scope limits recorded, no globallycleanconsole claim. Latest CURRENT7fileafter-reviewer2 export verified/servicesstopped/leasefree; bothG8refsdeleted/remote mainonly/maintenance mainFFclean/twooccupiedlegacyrefs retained. Closurebookkeeping carriesG9; finalmain/allpagescertificatepending.

G9 VM040 actual unfixedChrome1440/390 on21a7905 reproduces rejected seeded backgrounds at RecipeThumb/directMealCard and all routed shared callers,16exactPNGs/DOM/CSSOM/readbacks. Healthy32x32 loopback/unsaved-data preview unfiltered, own8recipes/1plan/profile byteequal. Runtime diagnostics observed, Network/Log coverage uncertified/three truncated windows and fixture/tool limits explicit in g9/unfixed-chrome/report.md. Root97App/testfreeze exact before new tests, current9fileafter-unfixed export verified before signout/leasefree/ownedservice stop. Then new actual-boundary unit regressions RED2PASS6meaningfulFAIL on unchanged App, strictNode22/no skip/cancel (unit-red-1793134695176051700). New two-width client E2E pending; no App fix/PR/closure yet.

G9 test-first final-byte browser RED2meaningfulFAIL+infra4PASS (red1793134943964786600) confirmed both consumers/reloads computednone after healthyimage/data controls; original278586E2Ebyteprefix preserved, only2newCRbytes normalized/archived/no assertion weakening. THEN minimal3Appfile source iteration1 separates gradient/filter properties. Unit8PASS (1793135113514807900), focusedclient2PASS+infra4PASS (1793135122269768700), inputs exact/no skipretry. Full check running, broad public/fresh149/built4/fixedactualChrome/PR/freshreviews/merge pending; VM040 remainsOpen.

G9 fullcheck1793135225253793400 PASS:lint/build/232frontend/125mockedFunctions,zero fail-skip-cancel; Functions lint selectsnosource (no lintcoverage claim). Public1793135424980746900 PASS18. Fresh emulator1793135497227219800 PASS149+mandatoryinfra4 in17.6m, no failed/flaky/skipped/retry summary; real viomacro namespace/fresh-no-import/unsetAI, all inputs unchanged. G7timers/exactoriginaltests remain intact andpass. Built-app gate running; finalactualChrome/currentheadCI/freshreviews/merge pending, VM040Open.

G9 built-app1793136607577360500 PASS4 in39.0s/noinfraprefix. All133input maps exact before/after/across4broadcommands/current; root reverified9fileafter-unfixed manual export before isolated fixedChrome restore. Root98183/54700 fourloopbackports/HTTP200/no5001/dummyviomacro/actualAIunset, soleCaptain fixedphase underway. FinalactualChrome/proofpreservation/currentheadCI/freshreviews/merge still required; no VM040closure yet.

G9 fixedactualChrome COMPLETE/PASS1440/390/bothdirectconsumers/sharedroutedcallers/fourmacro+seedvariation/healthy32images/core4controls+reloads;35exactPNGs/35states/all11checksTRUE in fixed-chrome-iteration1/report.md+manifest174files. Readonlymatrix snapshotsbyteexactSHA1166aed5a112176c15d64ff98ef71beb56adb894f3ba4f9d4ee9169d02d2fdc9; intentionalcore timestamps/falsemealStatus/newuncheckedmanualrow explicit, no SDKoverwrite/delete. Rootreadreport/safeprojection/viewed4PNGs; boundedRuntimeclean/NetworkLogunavailable/two truncatedwindows/setupJPEGqualified. Root133inputsunchanged andCURRENT9fileafter-fixed exportverified BEFOREnormalcleanup/leasefree/runtimeoff/all5portsfree. PR/exactheadCI/freshreviews/mergepending, VM040Open.

G9 [PR19](https://github.com/sararh95/VioMacro/pull/19) OPEN, sourcefc573e6 pushed normally/attached, VM040 Fix in PR. Tenintentfiles/137union current+Git bytebinding/original278586E2Eprefix exact. Parentfixedproof174hashes/35PNG/90originalpreservation passed; scope125intersection/4captainextra/8rootextra qualified. PR-link docs update changes no App/test/config bytes. Exact current-head CI/freshR1thenR2/merge still pending; no closure yet.

G9 currenthead369be12 CI[40590980765](https://github.com/sararh95/VioMacro/actions/runs/40590980765) attempt1 SUCCESS/bothjobs22steps:232frontend/125mockedFunctions/public18/fresh149+infra4/built4,0retry-flaky-skip. CIcheckoutmerge tree equalshead; rootindependentchecks/head/mergeability APIreceipt verified. Rawlogs/metadata g9/ci-369be12. Freshfork-none correctnessReviewer1 nowownscratchnegative/restoredtests; R2 waitsAPPROVE. No App/test/config edits or merge; latestafter-fixed9filemanualsnapshot preserved/runtime+Chromeleasefree.

G9 fresh [R1APPROVE6455332509](https://github.com/sararh95/VioMacro/pull/19#issuecomment-6455332509) exact369be12: owncandidate8unit/2E2E PASS→ONLY3Appfilesbase6unitFAIL/2gradientFAIL→restored8/2PASS, infra4each/everyheadtest+config exact139inputs. Extra14cases/width, existing-main runtimeP2decode404 mappedVM042/G10. Setuptransport/Javafailures retained, onlyownrunnerfixed; servicePIDs/portsfree. ActualAPIbody/currenthead/14inputhashes verified/copiedverbatimlog (localbodyextraCRLFqualified). FreshR2 owncheck now, Chrome awaitsrootREADY; saved-proof audit pending, no merge.

G9 R1saved-proof audit COMPLETE879regularhashes+1excludedjunction/139inputs6maps/current14exact. ExactAPIrawbody preserved; lognewline-only LFqualification leaves canonicalwording/Markdown unchanged and gitdiff--check green. FreshR2 own fullcheck PASS232/125/lint-build after retained ownrunner failures; actualChrome nowrunning on verified9fileafter-fixed restore/dummyviomacro/AIunset/no5001, soleQA lease. Desktop directconsumers/reloads/seedfamilies/healthy16px/sharedroutedcallers pass sofar; phone/corecontrols/finalreadback/verdict/exportcleanup stillpending. No G9source/test/config change or merge. Read-only branchpreflight confirms expectedrefs/occupiedlegacybundleexceptions, no eligiblecleanup; repeataftermerge.

G9 fresh [R2APPROVE6456047874](https://github.com/sararh95/VioMacro/pull/19#issuecomment-6456047874) current369be12, ownfullcheck232/125/all67Node22,146Git/currentinputsunchanged, actualChrome1440/390/direct+6mountedshared/core4/normalUIpersistence+reloads/50assertions PASS. Readonlyrawdataexact; only intentionalfavorites/completionmetadata/water500/twocheckedmanualrows, noSDKoverwrite. RootactualAPIbody+head+bothgreenchecks independentlyverified, canonicalverbatimlogcopy/raw3515bytebodyretained. P2runtime delays mapVM035/G16; P3favicon mapsVM041/G23, SOURCEONLYmaincomparison/no mainruntimeproof. Earlier failures/JPEGcrop/kernelreset/truncations retained; reportfourearlytruncations versus aggregate9truncatedrecords qualified, final8freshwindows complete. No globallycleancontinuouscaptureclaim. Elevenfileafter-reviewer2export+original independentlyverified despite finalEPERMrename; CLIawait/write/moveorder confirms complete serviceexports. NormalSignout/authnull/reset/diagnosticsoff/ownQAclose/LEASEFREE→rootservicesoff/all8portsfree beforefinalverdict. Parentcheckaudit complete/browser-integrityaudit pending; no approvedhead/source/test/config change, no merge yet.

G9 MERGED [PR19](https://github.com/sararh95/VioMacro/pull/19), VM040Closed, mainc3768e05c2c5085af894cd1694a341c18443b49c. Exactreviewed369be12 tree/doubleparents/headancestry verified; gh--merge--delete-branch--match-head fromnonGitcwd, no bypass. BothcurrentCIjobsSUCCESS/no requiredreviewdecision/conflicts; latestactualR1APPROVE6455332509/R2APPROVE6456047874 verified/canonicalverbatimlog with exactrawbodies retained. R2savedproof153regularhashes/146Git-currentinputs/36imagemagic+dimensions/50assertions/eightfreshcompletewindows audited; earlytruncation/JPEG/source-onlyparity scope kept. BothG9refs removed; maintenancecleanmainFF; threebookkeepingdocscarriedbyteexact beforeclosureupdates. Remoteonlymain/localmain+twooccupiedlegacybundleexceptions re-audited. No gate reruns/source edits after reviews. Latestmanualdataset11after-reviewer2 export and original verified, all8portsfree. G10VM042next; full-loop finalmain/everypagecertification remains pending.

G10 baseline: newmainc376 pushCI[40602591607](https://github.com/sararh95/VioMacro/actions/runs/40602591607) terminalSUCCESS, bothjobs22steps;232/125/infra4/public18/fresh149/built4, nofailed/skipped/flaky/retrymarkers, freshviomacro/AIpaused wrappers. RootAPIjobstates/sixmanifesthashes/numericlogs independentlyverified; savedlogsfivecredential-headerlinesredactedperjob, rawsecretbytesnotread/claimedidentical. No testsrerunforrecovery. G10plan/freshbranch/source142/sixbaselinecopies/currentE2E285801bytes exact; actualunfixedChrome SETUPBLOCKED beforeimage/CSSrepro by ComputerUse nativeURLconfidenceguard. OneownedQA959672494 remainsopen/loginUNKNOWN; initialhelperAuthpartial and successfulown5recipes/1plan/3assets preserved. Captainreport16artifacts+manifest/0screens, no VM042repro/afterUIequality/closure/cannotreproduce claim. No App/new-testcode/commit/push/PR. Current17fileG10setup export+original independentlyverified afterCLI EPERMfinalrename/sourceorderqualification; olderG9exports stale. Rootemulators47828/Vite53282leftactive forone manualfocusstep/freshturnresume; noSDKafterDATAREADY, no furtherappinput/bypass. g10/stop-report-chrome-focus.md and nextscreenedcheckpoint owncurrentstate; finalwholeloopcertificate remainspending.

G11 author Chrome complete (2026-10-30, accea7d): all 13 native-label workflows at desktop/390px, normal persistence and four core routes pass across the retained author reports and final `g11/fixed-chrome-source1/idle-gap-finish/report.md`. Parent verified the final 87 artifact hashes/17 native JPEGs, 145 runtime inputs and unchanged E2E/original prefix. Earlier lagging or truncated evidence stays qualified; complete bounded windows contain no unexpected application errors. Current 23-file export verified despite qualified final EPERM rename. Normal signout/Auth-null/reset/diagnostics disable/owned-tab closure and nine-port/five-PID shutdown verified. Exact-head CI41015906899 green: 232/125/public18/fresh167+infra4/built4. Fresh independent reviews pending; no merge or production-readiness claim.


G11 fresh R1 APPROVE on accea7d: https://github.com/sararh95/VioMacro/pull/21#issuecomment-6524238905. Independent base-source-only6 meaningful FAIL -> restored6PASS, infrastructure4 each, no source/test/config/assertion/worker/retry/budget change; parent244Git-blob+log hash audit and configured nine-port closure verified. Nonblocking existing-main Display Name label remains VM061/G27 (source parity; main runtime not claimed). R2 owncheck and actualChrome pending.


G11 fresh R2 APPROVE/currentaccea7d: https://github.com/sararh95/VioMacro/pull/21#issuecomment-6525013312. Owncheck232/125/no fails-skips, actualChrome13labels desktop390/onboarding/Planner/Settings/core4/reloads,15savedJPEGs incloneexcludedtransition; representativegrams1440x641/390x844. Own current profile+fivecollections exact across staged2151/unconfirmed/reload2150; baselines after earlier saves, UIDcorrelated by owncredentials not independentbrowserprojection. Narrow complete diagnostics clean; longtruncatedwindows qualified. Final23-file data export verified; normalLoginpage signout/reset/diagnosticsoff/ownclose, noAuthnullprojection;9ports/5PIDs stopped. ExistingcaptionVM062/G28 unchanged. Parent27artifact+145input+log audits pass; currentCIgreen/guardedmergepending.


G11 PR21 MERGED3638798 (2026-10-30), VM044/059/060Closed. Both current-head R1/R2APPROVE, CI41015906899green232/125/public18/fresh167+infra4/built4; exact reviewed tree/parents/ancestry and branch bundle/deletion verified. Both branchrefs removed, remoteonlymain/localmain+twooccupiedbundled exceptions preserved. Latest23-file after-reviewer2 data retained; allservicesstopped. NewmainCI41071073827 in_progress, finalwhole-loop certificatepending.


Main363 post-G11 pushCI41071073827 terminalSUCCESS/attempt1, bothjobs/all22steps; parent screened6filehash/localtree/APIbinding/numericlog audit verifies232app+125Functions+18public+4infra+167fresh+4built=550PASS. No fail/skip/flaky/retry markers reported; no local suite rerun. Node22.23.4/projectviomacro/freshnoimport/AIpaused.30credential/authheaderlines screened/LFnormalized, persisted logs not claimed byteidentical; source evidence outside Viteroot in workspace-parent `_local/qa/g11-main-ci363-20261030/`. Existing advisory outputs and Functionslint0 limits remain separately deferred/unresolved; no deployment/production-readiness certification.


### G13 — VM-046, failure-first and focused containment proof (2026-10-30)

- Baseline: main `3638798fa66e2904800f9613e05a633778907a3d`; source attempt 2 of 3. No PR or merge yet.
- Actual Chrome baseline: at 390×844, ordinary Batch Cook → Select Meal → Lunch → close → Batch Cook off shifts the shared outer scroller from 0 to 44 px and the header from x=33 to x=-11; the week scroller stays at 0. Desktop CSS 1440×1000 stays aligned. Native desktop captures are 1440×641 and do not prove the full CSS height. Keyboard Tab/Return alone did not cause the same shift.
- Baseline evidence: `_local/qa/fix-loop-2026-10-22/g13/unfixed-chrome-main363/`; 22 saved native JPEGs, 21 step metrics, manifests and parent audit. Setup Firestore timeout/retry warnings remain qualified separately from the bounded interaction diagnostics.
- New tests: six real interaction/data cases at 1440, 768 and 390 px. Baseline App source produces four meaningful narrow-width geometry failures and two desktop control passes; infrastructure four pass. All existing 328668 test-file bytes are preserved. Final appended test file SHA-256: `f70c3fbdd5b2950d8bf0ef314da86a48074a086f02f7a0ada40a27bff28e0f5d`.
- Attempt 2: three existing control rows wrap. The same six cases and four infrastructure tests pass, including native offscreen keyboard access, intentional week scrolling, four chooser filters, cancellation data invariants, seven-day batch replacement and save/reload. No handler, value, schema, rule or AI behavior changed.
- Gates completed: `npm run check` exit 0 (232 app and 125 mocked Functions tests); `npm run test:e2e` exit 0 (18 tests). All 145 runtime input hashes unchanged. Functions lint still selects no files (VM-058/G26), so its exit status does not establish source coverage.
- Logs: `g13/red-20261030T153331Z.*`, `focused-20261030T155152Z.*`, `focused-green-validation.json`, `check-20261030T155955Z.*`, `public-20261030T160555Z.*` under the same ignored QA root. Prior generated reports/builds are retained with hashes under `_codex-trash/2026-10-30/g13-generated-output/`.
- Remaining: full fresh-emulator and built-emulator gates, fixed Chrome/core routes, PR CI and two fresh sequential reviews. Existing-main tablet internal action-panel clipping is VM-064/G30; it is outside this shared-shell fix. No deployment, live provider or production data operation.


G13 full gates (2026-10-30): fresh emulator actual exit1,171 browser passes including all6G13,2 failures and infrastructure4PASS;145inputs unchanged. Failures: original paused-import assertion VM063 (existing controlled main proof) and final settings network assertion VM065 after all persistence values pass. Main363 settings3ordinaryPASS; controlled exact-main spec plus5000ms second icon-font delay reproduces identical net::ERR_ABORTED final assertion, all244trackedmainfiles exact. This is controlled parity, not an unmodified full-suite failure on main. Logs/audits `g13/full-emulator-validation.json`, `settings-font-investigation.json`, `main-font-parity-validation.json`; isolated diagnostics in workspace-parent `_local/qa/fix-loop-2026-10-22/g13/main363-settings-probe/`. First misquoted space-bearing filter run was interrupted/excluded; corrected discovery selected only the intended cases. No test assertions, timeouts or retries were loosened.

Built-app emulator command exit0/4PASS/55.2s, all145inputs unchanged (`prod-20261030T163603Z.*`). Fixed author Chrome now uses the preserved23-file currentmanual export, actualAI=false/noFunctions/projectviomacro; desktop/390 originalsequence/core4/reload and fresh reviews/CI remain pending. No allgreen/merge/production claim.


G13 fixed Chrome author COMPLETE: ordinary originalsequence at1440/390 leavesouter0/zerorange andheader337/33; Sundaykeyboard pansinner850 only. Core4/reloads pass; ownprofile+5collections exact/browserUIDmatched/145inputhashesexact. Parent93hashes/33JPEGheaders/32steps/17completecleanwindows verified and representativepixels inspected. Evidence `g13/fixed-chrome-attempt2/report.md`, `parent-fixed-chrome-audit.json`. Nativephoneframes1920x1032 contain390x844page;13desktop1440x641qualified/1validfullheight/3badframesexcluded. Rawnativeframes remainignored/local. Optional768manualcheckomitted; all3widthsautomatedpass. Dashboard15/30rangeonly/sl0 is an observation, no verifiedclipping or newconfirmeddefect.

Current23-file after-fixed export/original bothrehashed (actualCLI1 finalEPERMrenamequalified); normalSignout/Authnull/reset/diagnosticsoff/onlyownclose completed. RootCtrlC plus exactidentity/handle-guarded stop of remainingownedFirestoreJava29132;9portsclosed/5recordedPIDs absent. No unrelatedprocess/source/testchange; existingVitepretransformwarningqualified. G13PR/CI/freshreviews remainpending; no mergeclaim.

G13 evidence is in [PR #22](https://github.com/sararh95/VioMacro/pull/22), initial163551f; author desktop390Chrome complete andpreserved, localcheck/public/built pass/fresh171+2qualifiedfail retained. Exact-head CI andfreshR1/R2 pending; no mergeclaim.


G13 PR22 MERGEDb040f7f (2026-10-30), VM046Closed. Bothfresh currentaa70APPROVE R1[6529401396](https://github.com/sararh95/VioMacro/pull/22#issuecomment-6529401396)/R2[6530740833](https://github.com/sararh95/VioMacro/pull/22#issuecomment-6530740833); CI41095278186SUCCESS556PASS, root authoractualChrome+freshR2desktop390/core4/reloads/data andcompleteboundeddiagnostics verified. RawrapidnavP2timeoutsretained/normalreloadrecovered/sourceparityactualmainunknown mapsVM035/G16; no globalcleanclaim. BrowserUID/AuthnullR2notprojected/emptyfixturelimits explicit; authorownUID/145hashes/data exact. Final23fileoriginal+backup currentdata verified(actualCLI1 finalEPERMqualified), normalcleanup/onlyown614closed/all9ports+5PIDsgone. Mergeparents/tree/ancestry andbranchcompletebundle/deletionverified; remoteonlymain/localmain+twooccupiedbundledexceptions. MainpushCI/finalwholeloopcertificatepending; no deploy/provider/prod.

G14 VM047 unfixed actual Chrome2026-10-30, unchanged mainb040: desktop1440/390 original two-portions/four-serving/raw2cups generation renders1cups after Grocery reload while saved quantity1/unitcups/checks/manualsentinel stay correct. Parent36hashes/all145inputs/browserUID/ownprofile+other4collections/5completeconsecutivewindows809events verified; validdesktop+phonepixels inspected, stale desktop frame excluded. Seven favicon404s/Logerrors retained under VM041/G23; zero Runtimeexceptions/loadingFailed, no globallycleanhistoryclaim. Evidence `_local/qa/fix-loop-2026-10-22/g14/unfixed-chrome/report.md`, `g14/parent-unfixed-audit.json`. Updated manualdataset exported/frozen,23files original+backup independently exact (actualCLI1 finalEPERMrenamequalified). No source/tests changed and no G14 green/review/merge claim yet.

G13 postmerge main CI41109691027 audited2026-10-30 at b040f7f: SUCCESS/bothjobsSUCCESS/attempt1,555plainPASS+1FLAKY=556cases (232app125Functions18public4infra172fresh+1flaky4built), zero finalfail/skip. Existing import-link spec1392/1403 failed ChooseRecipeFile then passed retry1; VM063/G29 now includes actual-main evidence. Parent sixpayload/twomanifesthashes/checkouttree/rawcountlines verified. GitHub21returnedsteps remained16success/1in_progress/4pending despite completedrawscripts; no allstepsgreen claim. Screened30credential/headerlines/LFnormalized. External workspace-parent g13/main-ci-b040-20261030/REPORT.md, local g13/parent-main-ci-b040-audit.json. No G11/G13 retest or CI rerun; prior PR22 clean556PASS proof retained separately.


G14 final local gates — 2026-10-30, source attempt2/3, guarded formatter5794fddc/unit0bd1685d/E2E8be0410f. All four commands exit0 and every145source/test/config input stays unchanged: npm run check238App+125Functions (202.66s), npm run test:e2e18PASS (41.86s), npm run test:e2e:emulator175PASS+infra4 (1331.37s), npm run test:e2e:prod-emulator4PASS (68.84s). Total564PASS, zero fail/skip/flaky/retry. Fresh suite explicitly projectviomacro/freshdata-noimport/AIpaused. Parent checked exact command args, summaries/counts and current145hashes; g14/parent-final-gates-audit.json. The read-only fresh watcher receipt and its three artifact hashes were independently verified. Existing Functions lint selects0sourcefiles (VM058); startup/dependency/intentional error-path warnings remain qualified, no globallyclean-console claim.

Failure-first proof includes original-source unit38PASS/4FAIL, completed desktop/390 G14 workflows failing only20singular labels and four G8 cases failing corrected display arrays, then positives with source-only input differences. A pre-review legacy-unit rendering regression produced42PASS/1FAIL before the typeof-string guard and43PASS after; actual immutable main helper passes those legacy cases. Original E2E343423-byte prefix/f70c3f reconstructs exact after reversing only eight corrected G8 display literals; all other original assertions/callbacks/budgets/config and original unit bytes retained. Evidence g14/parent-negative-positive-audit.json, parent-legacy-unit-guard-audit.json and test-preservation-after-legacy-unit-guard.json. Initial edit-guard/chained-old-unit run is excluded, initial optimistic-write read race is qualified and corrected with a stronger saved-write assertion; no timeout/retry/worker or existing assertion was weakened.

Fixed actual Chrome originals/core4/detail/reloads at desktop/390 are now in progress against the preserved manual dataset, with source/tests frozen and actual AI availabilityfalse/noFunctions. PR/current-head CI/fresh sequential reviews still pending; these command results are not a merge or production certificate. Completed G11/G13 evidence remains preserved without recovery replay.


G14 fixed actual Chrome — 2026-10-30, desktop1440x1000/phone390x844. Normal originaltwoportion/fourserving/raw2cups generation nowrenders1cup and check/reload persists; sixunique native manual1cup/2cups/1(14oz)can rows retain canonicalcups/(14oz)cans and quantities1/2/1. Final8rows/7manual1generated/allchecked; profile/rawrecipe/fullplan/pantry/weight/sentinel exact, desktopmanuals survivephonegeneration, browserUID/project/AI=false independently bound. CoreDashboard/Plan/Recipes+detail/Grocery and explicitreloads bothwidths complete. Parent144hashes/39olderpayloads/194assertions/all145sourceinputs/29JPEGheaders verified and sixvalidactualframes inspected: g14/parent-fixed-chrome-audit.json, parent-fixed-chrome-pixels.json, fixed-chrome/report.md.

Do not read this as globallyerror-free:36completewindows/4390unique selectedevents include17favicon404s/Logerrors(VM041/G23); threeincompletehistories/twoextensionexceptions retained, missingselectedcountsunknown. Freshsmallwindows cover missingphoneoriginal/desktopreloadobservations afterward. ActualDashboard goto/evaluate timeout and CheckingSignin recovered normally; cause/mainruntimeparityunknown, new P3NeedsEvidence VM066/G32. Excludedold-helper/stale/context frames and invalidJSON-order setupcomparison remain explicit; lowerphone row underemulatorwarning mapsVM052/G20, no whole-row-unobscured claim. No errorfilter/source/extension/process workaround used to pass.

Data preserved afterfreeze in current23file original+backup(g14/emulator-preservation-after-fixed.json; backupfirebase-export-g14-after-fixed-20261030T202508Z), independentlyexact; actualCLI1 finalWindowsEPERMrenamequalified. NormalownSignout/Authnull/reset/diagnosticsoff/onlyownedtabclosed, cleanup5hashes verified; idle2canceledlocalListenFetch+2favicon404s retained. Root guardedonlyownedJava4448stop afterpreservation/cleanup, all8PIDsabsent/all9portsclosed. Local564-test gates remain exact; PR/currentCI/freshR1thenR2 stillpending. No deploy/provider/prod change.


G14 evidence is in PR #23: https://github.com/sararh95/VioMacro/pull/23, initialhead ef44ee334000afd8404ceca3adaa92338249dd13, base mainb040. VM047 Fix in PR. Final local564PASS/actual desktop390Chrome complete and preserved, source/test hashes unchanged. PR description includes root, sixformatter/twoworkflow regressions, allcommands/results, screenshotpaths and VM041/052/066 qualifications. InitialCI41125555333 is inprogress; final bookkeepinghead CI/freshR1thenR2 remain gates, no mergeapproval or G14verdict claim.

G14 PR23 current-head CI41125876976 SUCCESS: exact19725838cf55d79d2d9db6f8db228eb3b28da3be/tree551e3d1f, bothjobs/all22steps green. Actual238App+125Functions+18public+4infra+175fresh+4built=564PASS, zero failure/skip/flaky/retry; import-link passes firsttry. Parent audited exact merge checkout5aaf26aa with parents b040/197 and same tree, sixteenpayloads+manifest hashes/all145inputs/safetyheaders. Evidence g14/parent-pr-ci-1972583-audit.json and workspace-parent _local/qa/fix-loop-2026-10-22/g14/ci-1972583-20261030/. One retained Vite pre-transform error/dependency warnings, screened-normalized logs and Node22.23.4 versus browser22.23.3 explicitly qualified. No clean-log/production claim. Fresh blind sequential R1/R2 pending; no merge yet.


G14 fresh R1 APPROVE comment6534416077 on immutable197, verbatim/APIexact. Independent43unit base39PASS4FAIL/head43PASS; bothwidths semanticbaseRED afterreload and headG14twoPASS. Parent81artifact hashes/244restoredGitblobs/supplementalnineportshash verified; setupfails/initialdesktoptimeout/twointerruptedstartups excluded. G8notindependentlyrerun; Vitemockpretransformwarning retained. VM067/G33 P3existingmain source-only rounding observation logged forlater; independentquickadd/uncheckcoverage limitation remains for freshR2 actualChrome. Evidence g14/parent-reviewer1-audit.json, reviewer1-post-receipt.json, canonicalcomment copied verbatim in fixlooplog. No G14source/test change; freshR2 stillpending.


G14 fresh R2 APPROVE comment6534922455/current197/verbatim/APIexact, following R1APPROVE6534416077. Owncheck238+125/lint-builds green; actualChrome1440/390 original+manual/check-uncheck-recheck/reloads/regeneration/core4/detail/UIDprojectdata binding pass. Parent56manifestentries/55distinctpayloads/244headGitblobs/16JPEGheaders/fourvalidpixels verified; rawsnapshotprofile/recipe/fullplan exact, fourmanuals exact acrossmobilegeneration, generated1cupschecked/newIDexpected, pantryweight emptyfixtures. Fifteennontruncateddiagnosticsummaryreceipts plus desktopmanual+cleanup1000-eventtruncations retained; no globalclean/fullrawstreamclaim, staleuncheckedframeexcluded, Dashboardcontrols beyondnavnotexercisedbyR2. FaviconVM041/G23, roundingVM067/G33; cleanupunmappedERR_ABORTED/password-formwarningmainruntime-impactunknown. Evidence g14/parent-reviewer2-check-audit.json/parent-reviewer2-final-audit.json/reviewer2-post-receipt.json; screenshots in workspace-parent _local/qa/fix-loop-2026-10-22/g14/reviewer2b-1972583/{desktop-manual-reload,mobile-grocery,mobile-rechecked-reload,desktop-detail}.png (actualJPEGbytes).

AfterDATA_READY new23fileoriginal+backupexact, parentrehashedboth: g14/emulator-preservation-after-reviewer2-final.json, backupfirebase-export-g14-after-reviewer2-final-20261030T222711Z; CLI1finalEPERMrenamequalified/originalretained. NormalownSignout/Authnull/reset/domainsOff/owntabclose/LEASE_FREE, cleanuphashverified. Rootonlyowned8processesshutdown/exactguardedremainingJava46912withoutForce, nineportlistenerszero; no unrelatedprocessstop. CurrentheadCI564PASS/local564PASS preserved; PR23normalmergeguardnext, no mergeclaimyet.


G14 PR23 merged80a8f6b on2026-10-30; VM047Closed locally. Exactparentsb040+197/tree551/ancestry, sourcebranchnoopenPR/unoccupied, fullhistorybundle and bookkeepingarchive verified. Both G14refs deleted, remoteONLYmain/noopenPR; maintenancecleanmain80a8, twooccupiedlocalexceptions retained. BothfreshAPPROVE comments6534416077/6534922455 and currentPRCI564PASS preserved, latestR2final23fileexport/dataoriginalsafe/allservicesOFF. Separate newmainCI41139270624 inprogress. G15VM048plan nowcovers bothwizardcallers/fournativegeometry-and-dataregressions; no G15App/test change yet.


G15 unfixedactualChrome all4variants audited: phoneBreakfast71.21875px/button56.5, desktop97fit;16nativechoice/focuschecks and4rawfullown-data comparisons exact/nonempty sentinels. Parent126payloads/145inputs/55completewindows1316uniqueevents/13JPEGheaders/fourcurrentpixelsverified;7faviconerrors/3localListenFetchcancellations/verbosepasswordadvisory retained, noRuntimeexceptions/observedAIrequests, stale/transitionframesexcluded. Latestafter-unfixed23fileoriginal+backuphashverified/CLI1finalEPERMqualified; normalcleanup/LEASE_FREE/root8processshutdown/nineportszero. Fourappend-onlynewtests preserve349794oldbytes; firstRED3FAIL1PASS includes2newselectorSETUPfailures excluded andvalidpopulatedphoneboundsRED. Only2newtailselectors corrected to actualicon-prefixaccessiblebutton; allold/newgeometry-data-budget assertions retained; sourceunfixed, validREDpending. MainCI41139270624 separately564PASS/audited, existingVitediagnosticqualified.


G15 failure-first/currenttargetedGREEN audited:validRED231214Z infra4PASS/desktop2PASS/phone2FAIL only10Breakfastbounds; sourceattempt1oneclassresponsivegrid; focused231809Z exit0/103.22s/G15fourPASS+infra4PASS. Parent145inputcomparison differsONLYWizard/test355157SHA2c4e06... identical/old349794prefixexact. Source8947SHA500dfb... current. InitialselectorSETUPfailures+rootguard-causedprematureunfixedfocusedrun preserved/excluded, no testbudget/assertion/retry loosening. Fullgates/fixedactualChrome/PR/CI/freshreviews stillpending. Main80a8CI41139270624 independentlyaudited564PASS/all22steps/fresh-noimport-AIpaused, retainedVitewarningqualified.


G15 fullcheck232247Z exit0/314.73s/145inputsunchanged:lint/App238+Functions125PASS/bothbuilds, zero fail-skip. ExistingFunctions lint0/warningsqualified. TargetedG15four+infra4 alreadyPASS/samefrozen145inputs; public/fresh/built/fixedChrome/PR/CI/reviews remainpending.


G15 public18PASS/51.88s/145inputsunchanged. Fullfresh179stillrunning/infra4PASS; originalimport-link1392failed15000ms ChooseRecipeFile withactualMagicImportpaused disabled. Parentpreexistingcomparison verifiesrawoldunmodifiedmainb040 CI41109691027 samefailurebeforeG15/retry1recovery, exactoriginaltestblock+nine sources/configblobs, currentviomacro/fresh-noimport/AIpaused. Evidence g15/preexisting-vm063-comparison.json. KnownVM063/G29 exception onlyifterminalhasnoadditionalunprovenfailure; neverlabelwholecommandgreen orchangeAI/tests. Current80a8mainCI564PASS separate. Source/testsremainfrozen.


G15 finalfour-gateparentaudit COMPLETE:check0/238App125Functions/public0/18/built0/4 andfullfresh1/178PASS1documentedVM063FAIL+infra4PASS =567PASS1knownmainexception/568. AllnewG15fourcasesPASS;145inputs exactacrosscommands/current, actualargs/header/counts/contextarchivehash verified. DoNOTdescribeentireemulatorcommandgreen; unchangedoriginaltest/nine sources matchunmodifiedmainb040 CI41109691027 samefailedfirstattempt. Currentmain80a8CI564PASSseparate; permanentVM063G29later. Evidence g15/parent-final-gates-audit.json, parent-fresh-gate-audit.json, preexisting-vm063-comparison.json; built235956Z109.7s/exit0. FixedactualChrome/PR/CI/reviews remainpending.


G15 fixed author actual Chrome/parent audit COMPLETE: both wizard callers1440/390, all16 native selections/label bounds/focus/colors/lower controls/normal scroll/close/reload and own data exact. Core Dashboard/Plan/Recipes+valid detail/Grocery both widths and listed nonwriting controls/reloads pass. Parent225 payloads/32JPEG headers/five current images/102 complete windows4106events/145inputs/UIDprojectAI binding verified; final raw core snapshot byte-exact7e53d6... to corrected baseline. Own malformed recipe fixture corrected only ingredients/instructions/updatedAt; affected detail repeated, original wizard comparisons untouched. One stale viewport frame and malformed detail frame excluded.

One verify-only local Firestore Commit unavailable/ERR_NO_BUFFER_SPACE is retained, no failure-time pixels or cause/main parity claim. Preserved partial export before bounded ordinary reload; data exact, no repeated buffer error in later windows. New P3NeedsEvidence VM068/G34; no G15 code expansion. Six favicon404s/five canceled Fetches/cleanup password-form advisory remain; no global clean-history claim. See g15/parent-fixed-chrome-audit.json and workspace-parent g15/fixed-chrome/report.md/manifest70e9e9b6... with screenshot paths in G15 log. NEW final23-file export/original independently hash-verified before normal own Authnull/reset/domainsOff/owned-tab close; latestfirebase-export-g15-after-fixed-20261031T002547Z, actual CLI1 finalEPERM qualified. Root onlyownedruntime stopped with exact Java handle guard; all8processes gone/all9ports closed. Fixed-runtime-shutdown.json. Source/test unchanged; local gates567PASS1provenVM063 exception retained. G15PR/CI/freshreviews pending.


G15 evidence submitted in PR [#24](https://github.com/sararh95/VioMacro/pull/24), source/test/docs commitbdc8a790204ae7138c2c1b7975b2d2884f7fa39a normal push. VM048 Fix in PR; local567PASS1provenVM063mainexception and fixed actual Chrome/data proof retained with explicit limits. Final PR-link head CI/fresh sequential R1/R2 remain required. No merge or deployment.


G15 exact-head CI41150760594 FAILED: check238+125/public18/infra4 PASS, fullfresh177PASS2originalG4calendarFAIL (bothwidths, initial+retry1), all4G15wizardPASS, built stageSKIPPED. Root5payload+manifest377dc81b.../merge766parents-tree/22steps/rawcounts/current145inputs verified in g15/parent-pr-ci-595d61f-audit.json. No green workflow/merge/reviewer approval claim. Fresh Terra controlled UTC main80a8 reproduces the same calendar assertion atboth1440/390, while all original App/test source stays exact; private timezoneIdUTC only (WindowsChromiumotherwiseOct30Pacific), remainingfocusedcontrols/cleanup finishing. NewP2 VM069/G35 is outsideG15; one order exception for a separate calendarPR is needed. PR24 remainsopen/pushed595d61f, sourceattempt1; formalR1/R2 notstarted. Original local567PASS1VM063 exception and fixedauthorChrome/data evidence remain retained. No test workaround, CI rerun, sourcefix, deploy or production action.


G15 main-parity diagnosis FINAL: controlled main80a8/UTC originalG4selection10cases yields8PASS2calendarFAIL +infra4PASS, exit1/no retry. Parent16payloadmanifest e9732961.../244Gitblob comparisons/raw DOM/Node-browserUTC31/configsingleline/primary145input stability audited in g15/parent-calendar-main-audit.json. Only private timezoneIdUTC differs; no full-mainCI rerun or unmodifiedconfiguration claim. Required9ports directTCPclosed+exclusivebindavailable; initial0-test filter setup and intermittentPID0netstat retained. No calendar source fix. CIoutsideG15/main-reproduced VM069/G35 now blocksloop pending one order decision: separatecalendarPR beforefinishingG15. PR24/source595d61f staysopen/pushed; freshR1/R2 unstarted. No testsloosened/CIrerun/deploy/production orliveAI action.


G35 priority exception explicitly approved: separate calendar PR before G15, keeping one PR per group. New branch codex/fix-g35-calendar-months from fetched main80a8; G15 PR24/head595d61f and completed evidence preserved. Three local ledgers backed up/hash-verified before task-owned restore/switch and restored from exact copies; no source/test differences from main. Dashboard contract now has the numbered Calendar checklist. Main controlled failure proof retained without rerunning completed G11/G15 checks. Unfixed actual Chrome next; no Calendar fix/new test yet.


G35 unfixedactualChrome COMPLETE: bothwidths normalNext skipsFebruary(Oct30->Nov->Dec->Jan->Mar), reloadresetsOctober, fullown dataexact8ba56f...; parent89payloadmanifest79f25397.../16JPEGs/threecurrentpixels/145inputs/25windows744events audited. Favicon/canceledFetch/password-form and two scrollovershootframes retained; no manualclock/stateinjection. NEW23-file after-unfixedexport original+backup bothverified/CLI1finalEPERMqualified, normalAuthnull/reset/domainsOff/ownedclose then rootexactownedshutdown/all9portsclosed. Evidence g35/parent-unfixed-audit.json, parent-unfixed-export-audit.json, unfixed-runtime-shutdown.json. Fourappend-onlyregressions/14datetransitions nowlisted/lintPASS withall349794oldtestbytes unchanged; sourceCalendarunfixed09c99/attempt0, validRED next.


G35 newregressions validRED336.16s/exit1: fourFAIL only10expectedboundarymonth assertions,14clock-focus-data/reloadcontrols complete, infra4PASS/145inputsstable/no otherfailure. Original349794testbytes exact, new354400SHA8c1eb4... and initial180sbudget unchanged. Calendar sourceattempt1 adds day1 normalization before originalsetMonth only (comment+line), new11393SHA6c41be...; original archived and newtestbytes unchanged. valid-negative-proof.json/source-fix-receipt.json. TargetedGREEN/fullgates/fixedChrome/CI/reviews remainnext, noG15headchange.


G35 focusedGREEN110.67s/exit0 fourG35+infra4PASS. ParentRED/GREEN145-input comparison differsONLYCalendar, identicalactualcommands/testbytes/old349794prefix; allcurrentinputs matchpositive, negative artifacts archived/rehashed. parent-negative-positive-audit.json. Sourceattempt1 day1normalization only; fullgates/fixedauthorChrome/currentCI/twofreshreviews remainrequired. No priorG11/G15 evidence rerunforrecovery.


G35 npmruncheck021214Z exits0/366.7s, App238/Functions125/lint-buildsPASS/145inputsstable; source6c41be/test8c1eb4 unchanged. ExistingLint0/warningsqualified. Remainingpublic/fresh/built andfixedactualChrome/currentCI/reviews pending.


G35 public18PASS/110.59s/exit0/145inputs unchanged; fullcheck238+125PASS preserved. Fullfresh/built/fixedactualChrome/currentCI/freshreviews remainpending.

G35 fullfresh emulator-20261031T022410Z COMPLETE exit1/1424.56s:179cases/178PASS1FAIL/0skip/0retry, infra4PASS, all4G35PASS and145inputs stable. Sole failure is original1392/1403 empty-state Import waits15000ms for Choose recipe file while actual import is paused/disabled. Parent independently matched original669-byte testblock and nine owning source/config blobs EXACTLY to actualoldmainb040, rehashed all6mainCIpayloads and freshcontext, same locator/timeout; oldmain firstattemptFAIL/retry1PASS/overallqualifiedSUCCESS. Existing VM063/G29 exception applies onlythiscase; whole local command EXIT1 retained, not green. Final comparison outside-app g35/preexisting-vm063-comparison-final.json. All10requiredports closed/exclusivebind before built gate, no process stopped. Built/fixedactualChrome/currentCI/freshreviews remainnext; no source/test/flags/budgets/retries changed.

G35 built prod-20261031T024902Z COMPLETE exit0/77.11s/4PASS. Parent-four-gate audit confirms exact whole commands, all145inputs stable across check/public/fresh/built and current, original349794testbytes unchanged, source6c41be/test8c1eb4. Totals:check238App+125FunctionsPASS, public18PASS, fresh178PASS1provenVM063FAIL+infra4PASS/0skip/0retry/exit1 retained, built4PASS. Exact fresh failure artifact was hash-preserved by built-run archive. Evidence parent-full-gates-audit.json; existing Lint0/build/dependency diagnostics qualified. Ledger-only CRLF conversion from Windows write restored to originalGit LF with text unchanged and receipt; no product/test change. Fixed actualChrome bothwidths is next, then PR/currentheadgreenCI/freshR1thenR2; no completion/merge/prod claim.

G35 PAUSED safely at Sara request for handoff (2026-10-30 local). Source attempt1 unchanged, no G35 commit/push/PR/formalreview/merge. Four local gates retained exactly:check238+125PASS/public18PASS/fresh178PASS1provenVM063FAIL(exit1)+infra4PASS/built4PASS. Actual fixed Chrome original six-label sequence+reload passesboth1440/390; desktop fullprofile+fivecollections andphonebaseline byteexact8be42e... . User pause arrived at phoneGrocery navigationAX; NO phoneGrocery settledpixels/reload, phone-after/final-after snapshots or finalsignedin UID/project/AI/date binding. Do not call complete Chrome/closure. Parent audited224payloads/32JPEGs/70completewindows2042events,0capturedRuntimeexception,16favicon404/5canceledFetch/passwordformadvisory; paint and missingoptionalmodule limits logged separately VM070/G36 and VM071/G37. DATA_READY_PARTIAL frozeALLUI+SDK; rootNEWafter-fixed export030342Z, original+backup23files rehashed, CLI1finalEPERMqualified, parentACK before normalAuthnull/reset1920x911/domainsOff/onlyownedtab959673678close/LEASE_FREE. RootCtrlC owncontrollers then identity/nativehandle-guarded soleJava55372stop; all8ownPIDs gone/all10portsclosed+exclusivebindavailable. Latest restore _local/firebase/exports/firebase-export-g35-after-fixed-20261031T030342Z supersedes olderdata; do not rerun fixed helper unchanged (it restoresolderafter-unfixed and has exclusive receipts). Parent partial audit/shutdown/export receipts are underg35. Resume ONLY missingphoneproof using preservedownaccount/data after Sara resumes/newthread; no recovery rerun of completedG11/G15/targeted/unfixed/desktop/calendar proof. Then finishauthoraudit/PR/CI/freshR1thenR2/mergeG35 before normalmain integration into preservedopenG15PR24/head595d61f. No further work in this paused thread.


G35 author continuation COMPLETE — 2026-10-30 (receiving chat). Sara resumed the same bounded loop. Latest after-fixed030342Z export/existing own account restored in a NEW fixed-resume runtime. Only missing phone Grocery settled/current pixels, ordinary reload, checked2pcs sentinel/nonwriting empty-input focus, phone-after/final-after full data and final browser UID/projectviomacro/Auth9099/AI=false/real-date binding were completed. All three new full profile/five-collection snapshots are byte-exact8be42e87700832aa90f7569026369856064e4c9c3d9a6f19bea4a73a08ed35dc. No seed, product/test/config change or replay of completed gates/calendar/desktop/other-phone/G11/G15 proof. Original224payload author manifest retained; new28payload manifest c3814a9e3ba685a4ebe2993ef0b907878d0d9939da37d43dabf63b2e5f6b3a51, report and screenshots in workspace-parent g35/fixed-resume-chrome/. First reload image blank despite settled AX/DOM is retained/excluded; later ordinary native focus/current image is valid. No app/capture owner or main parity inferred. Native JPEG files correctly named.jpg; no pixel editing. Eight complete selected windows/276events,0Runtimeexceptions/providerrequests,5favicon404s/1canceledFetch; optional-module server diagnostic and original paint/global-history/control limits retained.

NEW DATA_READY/export/parentACK/normalcleanup completed: after-fixed-resume032654Z original+backup23files independently exact, all145inputs unchanged, CLI1 finalWindowsEPERMrename qualified/originalretained. Normal own signout/Authnull/viewportreset/domainsOff/onlyownedtab959673685close/LEASE_FREE then owncontrollers plus identity/nativehandle-guarded Java59620 stopped; all10portsclosed/exclusivebindavailable. Latest restore _local/firebase/exports/firebase-export-g35-after-fixed-resume-20261031T032654Z supersedes older export for future runtime. Evidence g35/parent-fixed-resume-{chrome,export}-audit.json and fixed-resume-runtime-shutdown.json. No test suite rerun for recovery. Sourceattempt1/cap3 unchanged; next oneG35PR/currentheadgreenCI/freshblindR1thenR2/guardedmerge before normalmain integration into preserved G15PR24/head595d61f. Original stop rules/finalmain all-page requirements remain; iCloud Passwords restoration after overall QA remains a historical pending cleanup, current setting not inspected/changed.


G35 is published in PR25 https://github.com/sararh95/VioMacro/pull/25, initial source/evidence head7de890563b11a82f49932aac813c9cee0ee05af4 from main80a8. Only six scoped tracked paths; source/test bytes remain frozen, author proof complete with preserved qualifications. This PR-link bookkeeping update sets VM069 Fix in PR in the same PR. Final published head must finish greenCI and fresh blinded R1 then R2 before merge; no formal verdict/merge/deploy claim. G15PR24/head595d61f unchanged.


G35 PR25 exact-head CI41164825105 SUCCESS on d4d34cbe6ffaf6e66f3e96bc896fecac2dad26d5: App238+Functions125/public18/infra4/fresh179/built4 =568PASS; allfourG35 and both originalG4 Calendar widths pass, no failed/flaky/skipped/retry summaries. Bothjobs/all22steps success. Actual checkoutf20d2bd has parents80a8+d4d/treecb224ae equal candidate; root Git independently verified. CI raw logs and exact metadata under g35/ci-d4d34cb; retained optional QA-module pretransform/dependency/FunctionsLint0 diagnostics mean no globally clean-log/production claim. Local fullfresh178PASS1provenVM063FAIL(exit1) remains qualified; CI does not change G29 scope. Fresh blind R1 is active on isolated current-head source/test/config; two necessary source-only RED/restoredGREEN runs, no preliminary green/broad suite replay. R2 remains unstarted until R1APPROVE; no merge yet.


G35 fresh Reviewer1 correctness APPROVE on exact d4d34cb, comment https://github.com/sararh95/VioMacro/pull/25#issuecomment-6539098921; posted verbatim/API body exact. Independent source-only RED4FAIL/10expected month assertions then restoredGREEN4PASS43.5s, infra4PASS both; same command/local0retries/CI+AIflags literallyunset/145allinputs controlled and restored exact. Parent parent-reviewer1-audit.json validates actual logs/identities/current145files; setup-only missing-browser failure retained/excluded, private pinned browser repair and identity-guarded own-child cleanup recorded. No source/test/config change, no preliminaryGREEN/broad/recovery replay. Fresh blind R2 /root/g35_r2_d4 is active; owncheck then actualChrome after root NEW reviewer2-d4 runtime using latest after-fixed-resume032654Z export. Manualruntime remains OFF until owncheck passes. No G35 merge or G15 branch change yet.


G35 fresh R2 owncheck COMPLETE exit0 on third failure-driven attempt:238App+125Functions/lint-buildsPASS, all146 immutable inputs exact (145original + exact-head14byte functions/.gitignore supplement). First attempt lacked this tracked fixture metadata; second strict private PATH omitted Git. Both setup failures retained, no App/test/config change or reinstall, no fourthcheck. Third officialGit probe2.55/Node22/Java21/privateenv successful. NEW root reviewer2-d4 manualphase nowACTIVE: current d4 head, newest032654Z export explicitly restored, all145source inputs and supplemental metadata match,8ownedprocesses/HTTP200/Auth9099-Firestore8085-Storage9199/noFunctions/AIflagsunset. Root sessions11447emulator/68977Vite, controllers61868/49412, Java44216 identities in g35/runtime-reviewer2-d4-identities.json. Initial health read caught partial service registration, no UI ACK until all services were ready. Fresh R2 is sole actualChrome captain; new own valid UID only, no author/preserved account reads. DATA_READY/NEWexport/hashACK must precede normal browser cleanup and root owned-only shutdown. No R2 verdict/merge/G15 change yet.


G35 fresh R2 APPROVE exact d4d34cb, canonical https://github.com/sararh95/VioMacro/pull/25#issuecomment-6539435353 posted verbatim/API exact. Independent owncheck238App+125Functions/lint-buildsPASS, actualChrome1440/390 Calendar across shorter months/year/reload and four core flows/detail/reloads/nonwritingcontrols PASS; allfivefullprofile/fivecollection snapshots equal, no intended deltas. First wrong-namespace ownfixture and staleframes/automationwaits retained/excluded. Broad selected diagnostics40-2704/28events limit500 truncatedtrue; no globalcleanhistory claim. One availableconsolewarn/errorslice0 and freshcleanup2706-2715zero/untruncated; no proof replay. NEW after-reviewer2-d4-20261031T050819Z export/original23files each independently exact before normalAuthnull/reset/captureOff/onlyownedtabclose/LEASE_FREE. Root CtrlC both controllers, then only exactCIM/nativehandle Java44216 stopped; all8ownedidentities gone/all10ports exclusive. Source146inputs/head exact; original108payload sealed manifest unchanged plus12cleanup additions. Root parent-reviewer2-owncheck-audit.json/parent-reviewer2-d4-export-audit.json/reviewer2-d4-runtime-shutdown.json/reviewer2-post-receipt.json. VM056 setup cleanup and source-only existing-main Month-mode candidate remain later scope. No source/test/config changes, extra suites, production or AI use. Both current-head reviews and exact-head CI568PASS complete; normal guarded merge next, then return to preserved G15PR24.


G35 PR25 MERGED normally as main0c2f7d757f0e3fac20bbcb2cfbac7a1539502baf (2026-10-30 local). Parent80a8+d4d34cb and treecb224ae equal reviewed head; no deploy. Remote G35 branch deleted normally; full-history bundle verified. Normal origin/main merge into preserved G15PR24/head595d61f now resumes the main track. Only expected EOF/ledger conflicts: exact original349794-byte E2E prefix plus intact G15tail5363 then intact G35tail4606 =359763bytes/SHA046f76fa5a0bace3cad2383a3cccc651d0302de44ab6a1adfca5466582c5587a. Latest G35 doc superset and post-review bookkeeping retained (all G15 added evidence lines preserved; only three superseded current-status lines replaced). Wizard source500dfb... and Calendar6c41be... exact; no author proof or completed suites replayed for transfer. New G15 head must obtain greenCI and fresh blind R1thenR2; old approvals never inherited. G35 remaining paint/optional-module/global-history limits and later backlog remain open. No product expansion, AI/provider/schema/rules change.


G15 PR24 new exacthead5f9aee8fbc9f70a9b15b65814d8e5f50b453a688 CI41171923552 attempt1 SUCCESS:238App+125mockFunctions+18public+4infra+183fresh+4built=572PASS. Bothjobs/all22steps, allfourG15/allfourG35/bothoriginalG4Calendar cases pass;0failed/skipped/flaky/retry annotations. Actualcheckoutd77fa2f3af4d42d0687b46f76680790b6e80c720 parents0c2f7d7+5f9/tree928bb921 equalshead, independently Git-bound. Rawlogs/metadata/finalaudit g15/ci-5f9aee8; optionalQA-module Vite pretransform line649 and known FunctionsLint0/dependency/mockerror diagnostics retained, no globalclean/prod claim. Prior local VM063 exit1 and priorhead calendarCIred remain historical qualifications, not rewritten. Fresh blind R1 /root/g15_r1_5f9 now active aftergreen, exact146inputs/private deps/assets/freeport preflight complete, source-only BASE Wizard RED running with Calendar and all tests unchanged. R2 unstarted until R1APPROVE; its isolated packet ready. Sara reaffirmed actual ChromeUse/ComputerUse ifneeded, and R2 instructions require actualChrome3/currentpixels/native interactions1440/390, no headless substitution or toolrefusal bypass. Productsourceattempt1 unchanged; conservative normalpushcount3, no fourthpush/CIrerun on failure without authority. No author/recovery suite replay.


G15 fresh R1 correctness APPROVE exact5f9aee8/base0c2f7d7, canonical https://github.com/sararh95/VioMacro/pull/24#issuecomment-6539846831 posted verbatim/API-exact. Same unchanged npm.cmd run test:e2e:emulator -- -g G15 run twice only: source-only BASE Wizard RED exit1, infra4PASS/desktop2PASS/phone2FAIL exclusively10Breakfast right-edge bounds (207.71875>191.5); exactrestore GREEN exit0/infra4PASS/G15fourPASS. All146inputs before/base/afterRED/restored/final independently audited; current146headexact, Calendar/tests/config untouched. CI/AIflags literallyunset/zeroRetries, no preliminaryGREEN/broad/recovery replay. Separate collector exit1 after successfulGREEN from transient8085PID0/nullidentity preserved; later cleanup-only all9exclusivebinds/noownedprocesses/no kills. parent-reviewer1-5f9-audit.json/reviewer1-5f9-post-receipt.json. Limits include mouse-click focus rather than independent keyboard/screenreader coverage, source-only lowercontrols/reopen, retained base/head optionalmodule diagnostic. Fresh blind R2 /root/g15_r2_5f9 now active only AFTER postedR1approval; owncheck first, then rootNEWruntime/latestG35afterR2export and actualChrome1440/390 bothcallers/core/detail/reloads/fullsaveddata. Sara ChromeUse/ComputerUse requirement explicit; no headless substitution or refusal bypass. Rootmanualruntime OFF until OWN_CHECK_READY. No R2verdict/merge yet.


G15 fresh R2 owncheck COMPLETE actualexit0 attempt2:238App+125mockFunctions/lint-buildsPASS,146before-after/current exact. Attempt1 exit1 App233PASS5fixtureFAIL retained; externally pinned emulator hosts collided with intentional18085 fixtures. Ownenv-only removal via literalunset, no app/test/config changes, no extra suite. parent-reviewer2-5f9-owncheck-audit.json. NEW root reviewer2-5f9 manualruntime ACTIVE from explicit LATEST G35after-reviewer2-d4-20261031T050819Z import (original+backup23files rehashed). Source146/head5f exact,HTTP200/Auth9099/Firestore8085/Storage9199/Functions5001off/AIflagsunset;8ownedidentities saved, controllers17580/56680, FirestoreJava51940, sessions67855emulator/60928Vite. ActualChrome R2 gate opened with RUNTIME_READY_ACK, solecaptain/newownvalidUID only, no preservedaccount reads/overwrite. New livefixturedata will make pre-R2 export stale; DATA_READYfreezeALLUI+SDK→NEWexport/independenthashACK→normalownAuthnull/reset/diagnosticsOff/ownedtabclose/LEASE_FREE before rootguardedshutdown. Never reuse priorPIDs/restart/restore or clean up early. No R2verdict/G15merge yet; no source/test/config or furtherGitpush.


G15 R2 REQUEST CHANGES exact5f9aee8/base0c2f7d7 solely required verification INCOMPLETE, comment https://github.com/sararh95/VioMacro/pull/24#issuecomment-6539979796. Root transcribed the reviewer final verbatim/API-exact because explicit ComputerUse stop prevented further reviewer file writes. Owncheck attempt2 exit0/238App+125mockFunctions/lint-builds/146inputs exact retained; attempt1 host-env fixture failure qualified. No proven Appregression/sourceblock identified. Required Chrome3 selection twice failed transportclosed, then authorized nativeComputerUse selected Chrome empty-newtab window1709178; firstCtrlT explicitlySTOPPED currentturn for insufficient currentURLconfidence onWindows. No retries/bypass afterward. Reviewer reports no ownSDK/account/fixtures/login/successful localQA tab; CtrlT outcome and UIcleanup unverified. Actualdesktop390/bothwizardcallers/core/data/diagnostics proof ABSENT, not waived by CI572PASS/R1APPROVE. AllUI+SDK frozen/DATA_READY_PARTIAL/automationLEASE_FREE.

Root NEW after-reviewer2-5f9-20261031T061358Z export/original23files each independently exact/current146head exact, CLI1 only finalWindowsEPERMrenamequalified/originalretained. parent-reviewer2-5f9-export-audit.json acknowledges incompleteQA/unknownUIcleanup before rootCtrlC sessions67855/60928(exit1) and exactCIM/nativehandle-only Java51940stop. All8ownedidentities gone/all10ports exclusive in reviewer2-5f9-runtime-shutdown.json; no browserUIcleanup or Authnull proof claimed. Latestrestore _local/firebase/exports/firebase-export-g15-after-reviewer2-5f9-20261031T061358Z, retained originalfirebase-export-17934272431274Wlyvs. PriorG35backup nowhistorical; oldhelper reviewer2-5f9 mapsolderbackup/exclusive receipts, do NOT rerununchanged. Resume requires NEWphase/helper/latestreceipt/current146bindings/freshPIDbirths. No G15merge/G16advance/extra sourceattempt/push/retest. One humanrecovery step: in newturn bring actualChrome normalpage/fullURLvisible/foreground, then SAME R2 completes onlymissingChrome proof; passedowncheck/source/CI/R1/authorproof preserved unless sourcechanges.
