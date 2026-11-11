# AI Spend Circuit Breaker Contract

Date created: 2026-07-09
Owner: VioMacro Manager
Status: Stage 5 AI-only circuit breaker activated and owner status proven through CMD-046; seven Functions are ACTIVE with the exact `true` flag; the native `$50` VioMacro project cap is configured; no Gemini canary has run and any canary remains optional and separately approval-gated

## Product Decision

VioMacro needs an AI-only spending circuit breaker, not a project-wide billing shutdown.

- VioMacro remains usable when the circuit breaker trips.
- Every Gemini-backed callable and background path stops before another paid provider call begins.
- The initial owner-approved AI allowance is `$20`.
- When the allowance is exhausted, VioMacro pauses only Gemini-backed AI actions and reports that state in the owner-only Settings surface.
- Only the configured owner can resume AI from the web app.
- Resume must grant a new explicit allowance. A plain on/off toggle would immediately pause again because recorded spend remains above the prior limit.
- Recommended resume behavior: `Resume with another $20`, which increases the approved ceiling by `$20` while preserving the full audit history.
- The monthly period resets at the Cloud Billing calendar-month boundary: the first day of the month at 12:00 AM US/Canadian Pacific Time. Browser time and browser locale must never control rollover.
- Project-wide billing unlink is out of scope for this feature.

The `$20` value is an application safety allowance based on conservative estimated Gemini cost. It is not an exact Cloud Billing invoice guarantee. Native Gemini project spend controls remain an independent backstop for calls made outside VioMacro or through a compromised key.

## Manager Scope Update - 2026-07-11

- The user approved the simpler one-owner private-alpha behavior: keep Gemini, enforce the application `$20` allowance, and pause only AI features at the boundary.
- Do not implement Resend, Firebase Trigger Email, SMTP, or another custom email transport for Stage 5.
- `CMD-031` remains valid historical architecture research, but its provider implementation packets are deferred and are not activation prerequisites.
- Keep the already tested server-only outbox/audit compatibility path dormant for now. It performs no external send and must not be rewritten during the UI cleanup batch.
- Remove custom-email/provider status and failure language from the owner-facing Settings UI so the product does not imply that an unconfigured email service is required.
- Google Cloud budget emails remain an independent alert-only safeguard. They do not enforce the VioMacro allowance.

CMD-032/CMD-033 closure:

- The owner-facing email/provider status was removed without changing `AiSpendStatus.lastPauseEmailStatus`, the dormant server-only outbox, or any Functions path.
- Manager `check` passed and independent focused emulator QA passed 5/5 with mocked callables and zero Gemini/provider/production execution.
- Desktop and mobile paused-state artifacts are readable and free of email/provider language or layout defects in the captured area. Resume is proven by Playwright because the screenshots end above the lower controls.
- No new defect was opened. The UI cleanup is accepted and committed in `fe48d25`, but remains unpublished to Hosting.

CMD-034 Release preflight:

- Backend/runtime deployment inputs remain byte-equivalent to checkpoint `464d404`, and the seven deployed Functions remain in the accepted bounded disabled posture.
- Hosting still serves the older `541a7f2` build, so the owner AI Spend Safety panel must be checkpointed and published while disabled before activation.
- Official Gemini documentation now exposes an experimental project-level monthly spend cap with about ten minutes of processing latency and possible overage. It is a separate emergency backstop, not a replacement for the application `$20` allowance.
- `BUG-029` closed locally through CMD-035/CMD-036. The disabled panel now uses environment-neutral wording, deterministic focused coverage, and independent 5/5 mocked proof.
- The remaining order after accepted checkpoint `fe48d25` is: Hosting-only disabled publication; provider-cap configuration or explicit deferral; seven-Function activation; owner status proof; optional smallest live canary. Each remains separately approval-gated.

CMD-037 checkpoint:

- Release passed the unrestricted full check, 62/62 mocked Functions contracts, and 5/5 focused mocked AI Safety tests with no Gemini/provider execution.
- Exactly 13 accepted Web App files were committed as `fe48d25 chore: checkpoint in-app ai spend safety` and pushed once; Manager independently confirmed exact scope and `0 0` local/upstream divergence.
- No deploy, provider/configuration change, production access, Function invocation, semantic-index action, or live AI occurred. The next gate is separately approved Hosting-only publication while the breaker stays disabled.

CMD-038 recovered publication incident:

- Hosting-only version `db2ff99bfb34e9b1` contained an emulator-mode build because the prod-emulator suite overwrote default `dist/` after the production build.
- Immediate signed-out smoke found the broken Auth entry. Manager used the pre-authorized Firebase Console rollback to restore known-good `0d45e0cec1e830e8`; independent `/auth` and `/plan` smoke passed.
- No Function, breaker flag, provider, billing, data, or Gemini path changed or ran.

CMD-039/CMD-040 release-artifact closure:

- Prod-emulator build and preview output now use ignored `_local/qa/prod-emulator-dist`; Firebase Hosting still publishes default `dist/`.
- `build:hosting` runs the production build followed immediately by a fail-closed verifier for missing/invalid artifacts and the four VioMacro Firebase emulator endpoint classes.
- Bugfix and independent QA each passed prod-emulator 4/4 and public E2E 18/18. Exact five-file production manifests stayed byte-for-byte and hash-for-hash equal across the prod-emulator suite; contaminated isolated output failed red with all four classes; production `dist/` passed green; unrestricted full checks and final Hosting builds passed.
- `BUG-030` is closed locally. The fix and incident docs must be checkpointed before a later separately approved corrected Hosting-only publication.

CMD-041 artifact-hardening checkpoint:

- Exactly 11 accepted Web App files were committed as `f9769ae7deb1406526cffa43d5c737297c1fdcd1` with message `fix: protect hosting artifacts from emulator builds` and pushed once.
- Final `build:hosting`, exact staged scope, whitespace checks, and secret/config hygiene passed; local and upstream equality is `0 0`.
- No Actions workflow, deploy, provider/configuration change, production access, package action, Function invocation, semantic-index action, or live AI occurred.
- The next gate is a separately approved corrected Hosting-only publication from exact `f9769ae` while the breaker remains disabled.

CMD-042 corrected Hosting publication:

- Release passed unrestricted `check`, production-build emulator E2E 4/4, public E2E 18/18, and final `build:hosting`; the verifier accepted five generated files with no Firebase emulator endpoint class.
- Exactly one Hosting-only deployment from immutable `f9769ae` produced live version `762e5b25bfb28e0c` with the exact approved message.
- Release and Manager independently passed signed-out `/auth` and protected `/plan` redirect smoke with production assets and no captured warning/error logs. No rollback trigger occurred.
- The breaker remains disabled. No Function/callable, provider/configuration, production Auth/data, Gemini, semantic-index, or live-AI path ran.

CMD-043 native provider-backstop decision:

- Release and Manager independently confirmed that project `viomacro` is Tier 1 Postpay and exposes an experimental project monthly spend cap that is currently unset.
- The broader `$250` Tier 1 account cap is shared with two other paid projects. The Tier 1 `$10` rolling ten-minute spend limit and existing Cloud Billing budget are outer safeguards, not substitutes for VioMacro's application allowance.
- Google documents roughly ten minutes of provider-cap latency, possible long-running overrun, and no exact dollar overshoot ceiling. The application reservation/reconciliation gate remains primary.
- Manager accepted the account and documentation evidence but rejected a fixed `$20` native cap because it would block the already accepted `Resume with another $20` workflow near the first allowance boundary.
- The recommended native emergency-cap candidate remains `$50`: the initial `$20`, one complete `$20` resume tranche, and a `$10` planning margin. This is not an invoice guarantee, and any later application allowance above `$40` requires another native-cap decision.
- Setting the cap is a separate provider mutation that requires explicit user approval. No setting, provider request, production path, Firebase resource, or Git state changed in CMD-043.

CMD-044 native provider-cap configuration:

- Under explicit user approval, Release changed only project `viomacro`'s experimental Gemini monthly project spend cap from unset to exactly `$50` and clicked Save exactly once.
- Release verified the settled `$0.00 / $50.00` state immediately and after navigation. Manager independently confirmed `VioMacro`, Tier 1, `Edit spend cap`, and `$0.00 / $50.00` read-only.
- The provider continues to warn of overage during roughly ten minutes of processing latency and during long-running work. The application reservation/reconciliation gate remains primary and must not treat `$50` as an exact invoice ceiling.
- No Gemini request, production Function/callable, VioMacro Auth/data/log access, Firebase resource, application flag, unrelated project, account/payment/IAM/key/quota setting, deploy, or Git action changed or ran.
- The breaker remains disabled. Any application allowance above `$40`, native-cap edit/removal, activation, owner status proof, or live canary requires another explicit approval.

CMD-045 final activation preflight:

- Accepted verdict: `READY_FOR_EXPLICIT_ACTIVATION_APPROVAL`. The verdict grants no production-mutation authority by itself.
- Exact source: clean detached `464d404cc76f62d1640ae4ef6d1e889ca04d4095`, the immutable source of the accepted disabled deployment. It remains byte-equivalent to `f9769ae` for Functions, rules/indexes, Storage rules, Firebase config, `.firebaserc`, and lockfiles; only later root Hosting-artifact scripts differ.
- Fresh sanitized metadata confirmed all eight Functions active on Node 22. The seven breaker targets retain bounded scaling, the breaker flag is absent, `OWNER_UIDS` exists by name, Gemini secret version `2` is bound to the four provider paths, and `billingBudgetMonitor` remains separate.
- Manager independently confirmed the immutable-path diff, Git-ignore coverage for `functions/.env.viomacro`, the exact-string `true` flag predicate, explicit `/ops/...` client denial, disabled zero-read/write behavior, and enabled status-recovery path.
- Current CLI metadata does not expose per-callable App Check enforcement or deployed rule text. Accepted CMD-029 evidence plus unchanged immutable source remains the proof bridge; no conflicting fresh evidence exists.

Durable activation packet, requiring exact user approval:

1. Create a new dedicated detached worktree at exact `464d404`; require the target path to be absent/unregistered, the hash exact, and tracked status clean.
2. Copy only ignored `functions/.env` from the coordination checkout without printing values. Name-only proof must show exactly `OWNER_UIDS` and no breaker flag.
3. Create ignored `functions/.env.viomacro` containing only `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`. Name-only merged proof may print only the non-secret breaker boolean.
4. Run locked root and Functions installs with `--ignore-scripts`, Functions lint/build, and the 62/62 mocked Functions contracts. Require tracked-clean status and no provider path.
5. Deploy exactly these seven targets and no others:

```powershell
npx.cmd --yes firebase-tools deploy --only functions:generateMealPlan,functions:parseRecipeFromImage,functions:generateRecipeEmbedding,functions:semanticSearchRecipes,functions:getAiSpendStatus,functions:resumeAiSpendAllowance,functions:manualPauseAiSpend --project viomacro -m "Enable AI spend breaker from 464d404"
```

6. Permit only sanitized read-only Functions metadata immediately afterward. Require exact flag `true`, expected Node 22 scaling, owner-config presence by name, preserved Gemini secret version metadata, and unchanged `billingBudgetMonitor`. Do not invoke a Function or read logs/data during this proof.

Durable emergency disable packet:

- Reuse the same clean immutable source and same seven targets.
- Change only ignored `functions/.env.viomacro` to `AI_SPEND_CIRCUIT_BREAKER_ENABLED=false`.
- Redeploy the same seven targets with this exact command, then require sanitized metadata to show absent/false and unchanged bindings/scaling/monitor:

```powershell
npx.cmd --yes firebase-tools deploy --only functions:generateMealPlan,functions:parseRecipeFromImage,functions:generateRecipeEmbedding,functions:semanticSearchRecipes,functions:getAiSpendStatus,functions:resumeAiSpendAllowance,functions:manualPauseAiSpend --project viomacro -m "Disable AI spend breaker from 464d404"
```

- Disable requires a redeploy but does not delete Functions or `/ops/aiSpendCircuitBreaker/...` state. A source rollback is a different operation and is not pre-authorized.

Owner-status proof boundary, requiring explicit approval:

- Use the configured owner through the production Settings AI Safety surface and allow exactly one `getAiSpendStatus` call through normal Firebase Auth/App Check. Submit no prompt, recipe, image, search, meal-plan content, or personal content; inspect only sanitized UI/response state.
- A clean first status read performs no initialization write. Enabled status can recover up to ten stale open reservations. The accepted source-bounded maximum is 32 logical document reads and 32 committed writes; transaction retries prevent an exact billed-read ceiling.
- Expected clean result: enabled/active, `$20` allowance, `$0` spent/reserved, `$19` available after the `$1` reserve, expected pricing version, and no pause details.
- Owner denial, App Check failure, unavailable/malformed/disabled/non-default state, wrong Function metadata, changed `billingBudgetMonitor`, unexpected provider traffic, or non-AI regression triggers the exact disable packet and then a stop. Do not inspect logs/raw `/ops` data, retry activation, delete state/Functions, or run a canary.

Exact approval gate:

> Approve one exact seven-Function activation deploy for `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, `semanticSearchRecipes`, `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend` from clean immutable source `464d404cc76f62d1640ae4ef6d1e889ca04d4095` with only `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`; allow sanitized metadata-only postdeploy proof and one owner-authenticated `getAiSpendStatus` proof with the documented bounded Firestore recovery side effects; pre-authorize the same-source exact seven-Function `false`-flag redeploy only for the named rollback triggers; exclude `billingBudgetMonitor`, Hosting, rules/indexes, Storage, Firebase/App Check/IAM, secrets, provider/native-cap settings, unrelated Functions/projects, logs/raw production data, Git mutation, and every Gemini or live-AI request.

CMD-046 activation and owner proof accepted on 2026-07-12:

- The first attempt stopped before deployment when the execution approval service blocked fresh metadata. It made no production mutation or Function invocation. After explicit user approval, the Manager removed only the two temporary env files and exact activation worktree, proved the path absent/unregistered, and authorized a fresh retry under the unchanged approval.
- The retry used a new clean detached worktree at exact `464d404`, passed both locked installs, Functions lint/build, and exactly 62/62 mocked contracts, and remained tracked-clean.
- Fresh predeploy metadata showed the exact eight-Function inventory, seven active disabled targets with accepted Node 22 scaling/bindings, and unchanged flag-absent `billingBudgetMonitor`.
- Release deployed exactly the seven named Functions with `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`. Fresh postdeploy metadata showed all seven ACTIVE with exact flag `true`, preserved owner configuration and provider secret version metadata, and unchanged `billingBudgetMonitor` hash/posture.
- Exactly one owner `getAiSpendStatus` POST then returned `Active`, `$20.00` allowance, `$0.00` spent/reserved, `$19.00` remaining after the `$1.00` reserve, expected pricing version, and no pause details. Network evidence contained its OPTIONS preflight, zero other callable POSTs, and zero Gemini/provider requests.
- No rollback trigger occurred, so the same-source false-flag packet was not run. Both temporary worktree env files were deleted; the retained worktree is clean at exact `464d404` with no secret-bearing env copy.
- The Manager independently repeated sanitized metadata only and confirmed exactly eight Functions, all seven targets ACTIVE on v2 Node 22 with exact flag `true` and preserved scaling/bindings, and unchanged flag-absent `billingBudgetMonitor` hash `4cc33feebd660d773012059a3baf286a342050e6`. The consumed owner status call was not repeated.
- The breaker portion of Stage 5 is complete. A Gemini canary is not required to keep the breaker active and remains deferred unless separately approved.

## Accepted CMD-015 Preflight - 2026-07-09

Manager accepted the Release preflight with these durable findings:

- All four current Gemini paths are active 2nd gen Functions and must share one gate before provider execution.
- Existing request-count limits do not prevent concurrent cost overspend.
- Current deployed AI Functions report `maxInstances: 20` and `concurrency: 80`, which is too permissive for one-owner private alpha.
- No transactional email provider, Firebase Trigger Email extension, or email outbox is currently installed.
- Current source defaults remain `gemini-3.5-flash` for generation/multimodal work and `gemini-embedding-2` for embeddings.
- Current official Standard pricing reviewed on 2026-07-09 lists `gemini-3.5-flash` at `$1.50` per 1M input tokens and `$9.00` per 1M output tokens including thinking tokens; embedding pricing varies by input modality.
- Gemini usage metadata and token-count APIs provide the inputs needed for conservative reservation and later reconciliation, but live Gemini was not called during the preflight.
- The current Functions identity uses the default Compute Engine service account pattern. IAM bindings, Gemini Prepay/Postpay/cap state, auto-reload, and current Console budget details remain unverified and do not block disabled local implementation.

Manager corrections to the Release proposal:

- Do not reduce the existing 10 MB Recipe Import file limit in the first Builder batch. Preserve user-visible behavior and add a conservative token ceiling instead.
- Use a maximum of 30,000 input tokens and a `$0.10` reservation for Meal Plan generation.
- Use the existing 10 MB file limit, a maximum of 100,000 provider-counted input tokens, and a `$0.25` reservation for Recipe Import.
- Use a `$0.01` reservation for each embedding-generation or semantic-search embedding operation.
- Set `maxOutputTokens: 4096` for both generation paths.
- Keep a `$1.00` period safety reserve and store all money in integer micros.
- Target `maxInstances: 1` with low bounded concurrency for each AI Function in the local implementation; Release must assess the final deploy options before activation.
- Do not adopt the report's `$25-$30` native provider-cap suggestion. That ceiling would conflict with a full second `$20` owner allowance. A later Release lane must inspect the actual Gemini plan and choose an emergency ceiling that is at least the currently approved allowance plus one complete `$20` tranche and a reporting-lag margin. `$50` is the initial candidate, not an approved live setting.
- Treat `/ops/...` as a narrow server-only operational-data exception to the normal `users/{uid}/...` product-data boundary. Firestore rules must deny all client access, and owner status must flow through authenticated/App-Checked callables.

## Accepted CMD-016 Backend Core - 2026-07-09

Manager accepted the local, default-disabled backend core for independent QA after source review, correction passes, and independent verification.

- All four current Gemini paths use the shared reservation gate before paid provider execution.
- The gate uses transactional integer-micros reservations, exact model/pricing binding, Pacific calendar-month periods, a `$20` initial allowance, a `$1` safety reserve, and `$20` owner-approved resume increments.
- Recipe Import preserves the 10 MB limit and adds a 100,000 provider-counted multimodal token ceiling before generation when the gate is enabled.
- Malformed operational state, malformed or contradictory usage metadata, unsafe token/money values, duplicate requests, model mismatch, and exact-boundary reservations fail closed.
- Automatic pauses create deterministic audit/outbox state; owner status, resume, and manual pause remain server-authorized callables; clients cannot access `/ops/...` directly.
- Local proof passed 46/46 Functions contracts, 20/20 Firestore rules tests, Functions lint/build, and the full app `check`. No live provider, email, deploy, or production mutation was used.

At CMD-017 acceptance, stale-reservation recovery (`BUG-026`), email delivery, disabled deploy proof, native provider backstop, activation, and live canary were still deferred. BUG-026 later closed locally through CMD-025; the live/deploy gates remain open.

## CMD-019 Combined QA Result - 2026-07-10

- Functions contracts passed 50/50, the unrestricted full app `check` passed, focused AI Safety passed 4/4, and request-ID proof passed for Meal Plan, Recipe Import, and semantic search.
- The full local emulator suite finished 65/66. `BUG-027` records the failed Settings-save network guard caused by mounting the AI Safety panel while its tab was inactive.
- `BUG-028` records mobile clipping of the final Settings tab label at 390x844.
- CMD-020 is limited to those two Settings integration corrections and their regression evidence. The financial policy, reservation gate, status sanitization, request-ID service, Functions, rules, email, provider, and activation boundaries must remain unchanged.
- At CMD-019, `BUG-026` remained a separate hard blocker before live activation; it later closed locally through CMD-025.

## Accepted CMD-020/CMD-021 Settings Closure - 2026-07-10

- Settings-focused tests passed 7/7, including the previously failing save path and the new inactive-tab/mobile guard.
- AI Safety tests passed 5/5 and the full local emulator suite passed 67/67.
- The unrestricted full app `check` passed, and the 390x844 screenshot shows all four Settings tab labels fully readable.
- The correction changed only `Settings.tsx`, the shared emulator Playwright file, and the required Bugfix report.
- Independent CMD-021 source and screenshot review found no test-only bypass and repeated the unfiltered local emulator suite at 67/67.
- BUG-027 and BUG-028 closed in this UI sequence. BUG-026 later closed locally through CMD-025; email delivery, disabled deploy proof, native provider backstop, activation, and live canary remain open.

## CMD-022 Stale Reservation Recovery Contract - 2026-07-10

`BUG-026` must close locally before any disabled Functions deploy or activation decision. Recovery is part of the financial boundary, not a convenience cleanup.

Manager-approved lifecycle:

- A new reservation starts in `reserved`, which means no billable Gemini method has started.
- Immediately before each billable `generateContent` or `embedContent` call, the server must transactionally move the reservation to `provider_started`. A failed or expired claim must stop before Gemini.
- Recipe Import `countTokens` remains pre-provider for this lifecycle because the current [official Gemini billing guidance](https://ai.google.dev/gemini-api/docs/billing) identifies token-count/GetTokens requests as non-billed. Its successful validation must be followed by the transactional provider-start claim immediately before `generateContent`.
- Use server-owned Firestore timestamps. Browser/client time, request payload time, and locale must never decide expiry.
- Use a short five-minute pre-provider lease and a conservative 65-minute provider-start lease. The latter exceeds the current [documented maximum callable duration](https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.globaloptions); any future timeout increase must revisit this lease before deploy.
- Before a new enabled reservation and before an enabled owner-status read, inspect the current Pacific period's complete bounded open lifecycle set with `status in [reserved, provider_started]` and `limit(11)`. More than 10 open reservations must fail closed. Validate every returned reservation and lease, then recover the expired subset of at most 10. A malformed/missing lease, query failure, or recovery failure must fail closed before a new billable call.
- An expired `reserved` item may return its amount only inside a transaction that proves the provider-start claim never occurred. Mark it terminal `closed_without_charge` with a deterministic recovery reason/audit record.
- An expired `provider_started` item is ambiguous and must be converted conservatively from reserved to spent at the full reservation amount. Mark it terminal `failed_conservative`; preserve pause/email-outbox behavior if the ceiling is reached.
- Recovery, provider-start claims, state totals, terminal status, and audit evidence must be transactional and idempotent. Firestore transactions retry against concurrent edits, so transaction callbacks must remain side-effect free until writes commit. Aggregate inconsistency or malformed lease/reservation data fails closed; do not hide it with clamping. See the [official transaction contract](https://firebase.google.com/docs/firestore/manage-data/transactions).
- Before provider start, the in-memory reservation handle must match the stored document's canonical path, period, feature, idempotency key, and reservation amount. Any mismatch fails closed before Gemini. After provider start, reconciliation must use the parsed stored reservation document as the sole authority for pricing feature, fallback billed amount, reserved subtraction, pause calculation, and audit identity; caller-handle fields must not be able to under-account a started provider request.
- Fresh `reserved` or `provider_started` duplicates remain blocked. Recovered or otherwise terminal duplicates never call Gemini again.
- Terminal reservations must leave the recovery query surface so the bounded scan does not repeatedly process them.
- Current-period recovery is sufficient for the active allowance. Period rollover isolates old periods, whose reservation documents remain server-only audit history.

CMD-023 independent QA result:

- Functions contracts passed 60/60 and the corrected bounded recovery/lifecycle matrix passed source review.
- QA rejected activation-ready closure because reconciliation subtracted the stored reservation amount but still used caller-handle feature, fallback amount, and audit identity. Manager accepts this as a P2 continuation of `BUG-026`, not as a separate feature.
- `CMD-024` is limited to canonical handle validation before provider start, stored-document-only reconciliation accounting, focused red/green contracts, and the required report. No deploy, activation, live provider, rules/index/config, UI, or production action is authorized.

## Accepted CMD-022 Through CMD-025 Recovery Closure - 2026-07-10

- Final Functions contracts passed 62/62 and the Manager's exact post-CMD-024 unrestricted `check` passed exit 0.
- CMD-025 independently accepted canonical provider-start validation, stored-document-only reconciliation, terminal idempotency, and the unchanged two-phase recovery matrix with no new defect.
- `BUG-026` is closed for local code-owned behavior. This does not prove cloud deployment, production runtime, email delivery, native Gemini controls, activation, or live canary behavior.
- The feature remains disabled and undeployed. The next lane is Release read-only live-safety preflight, followed by separately approved actions in the order defined below.

## Accepted CMD-026 Live-Safety Preflight - 2026-07-10

- Release mapped the local-versus-cloud boundary and produced six separate packets: consolidated Git checkpoint, disabled Functions deploy, email transport, native Gemini provider backstop, gate activation, and one smallest canary.
- The Manager independently confirmed the current official Gemini model and pricing posture: `gemini-3.5-flash` is stable and the local `$1.50` input / `$9.00` output per 1M-token Standard prices remain current as of 2026-07-10.
- Prepay and experimental project spend caps can reduce provider exposure, but official guidance warns of roughly ten minutes of billing latency and possible overage. They are layered backstops, not exact invoice guarantees.
- The local email outbox is not delivery. A future email packet must choose one transport and implement or configure an adapter that preserves deterministic event IDs, status transitions, retries, and owner-recipient privacy.
- Before a disabled Functions deploy, Release must capture current deployed Functions inventory/revisions, confirm the live circuit-breaker flag is absent or false, verify deployed Firestore rules posture, and prepare rollback from an isolated clean worktree or equivalent immutable known-good source. Do not switch this dirty checkout to an old commit.
- Local `HEAD` already denies all unmatched Firestore paths, so the explicit `/ops` rule is defense in depth. This does not prove what is currently deployed, and no rules deploy is implied.
- CMD-026 approved no Git, deploy, cloud, provider, email, production, or live-AI action. The next mutation-eligible command is only the consolidated Web App checkpoint after explicit user approval; the intervening CMD-027 read-only spend audit grants no mutation or model-call authority.

## Accepted CMD-027 Zero-Cost Audit - 2026-07-10

- The routine local check/test ladder does not intentionally call Gemini: lint/build is static, Functions contracts fake `@google/genai`, and browser AI actions are mocked or emulator-guarded.
- Manager read-only AI Studio evidence showed project `VioMacro` at `$0.00` monthly spend, `Tier 1 - Postpay`, no available usage data for June 13 through July 10, 2026, and no native project spend cap configured.
- AI Studio states that cost information may take up to 24 hours to update. This is current no-visible-charge evidence, not an exact or future invoice guarantee.
- Manual `ALLOW_EMULATOR_AI_CALLS=true` with a real provider secret is the explicit local escape hatch and remains forbidden in routine QA.
- No prompt, provider API, live callable, production data, cap/billing change, deploy, commit, or push occurred. Native provider protection remains a P1 activation gate.

## Accepted CMD-029 Disabled-Deploy Preflight - 2026-07-10

- Release confirmed local `HEAD` and upstream at immutable checkpoint `464d404cc76f62d1640ae4ef6d1e889ca04d4095` before the read-only cloud inventory.
- Current production inventory contains the four AI paths plus `billingBudgetMonitor`. The AI paths are active v2 `nodejs22` Functions and still expose the older private-alpha scaling posture of `maxInstances: 20` and `concurrency: 80`.
- `AI_SPEND_CIRCUIT_BREAKER_ENABLED` is absent from deployed metadata, so the new gate is not live-enabled. The `GEMINI_API_KEY` binding exists by metadata only; no secret value was read.
- Manager read-only Console evidence confirmed deployed Firestore rules end in a catch-all deny that covers `/ops/...`. VioMacro is registered for App Check with reCAPTCHA; immutable source enforcement plus prior accepted callable smoke is sufficient for planning the disabled deploy, while post-deploy invocation proof remains separately blocked.
- The future narrow target is the four existing AI Functions plus `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend`. `billingBudgetMonitor`, Hosting, rules, indexes, Storage, App Check configuration, IAM, billing, provider settings, secrets, email, and production data are excluded.
- Any approved deploy must use a clean worktree or equivalent immutable artifact pinned to `464d404`, never the dirty Manager coordination checkout. Rollback source is `541a7f2b1fb4274e4a75894c3688ddaa88102326` in a separate clean worktree.
- A rollback of the four existing AI Functions does not remove the three new owner callables. With the flag absent they fail closed, but deletion remains a separate production mutation requiring explicit approval.
- CMD-029 performed no deploy, Function invocation, production-data access, log read, cloud mutation, Git mutation, live AI, or secret-value access. The next gate is explicit approval of the exact disabled Functions deploy and metadata-only proof.

## Accepted CMD-030 Disabled Functions Deployment - 2026-07-10

- Release used a detached, tracked-clean worktree pinned to full checkpoint `464d404cc76f62d1640ae4ef6d1e889ca04d4095`; the coordination checkout and upstream remained aligned at that commit with `0 0` divergence.
- A first lint attempt stopped before deployment because the clean worktree lacked checkpoint-pinned root ESLint dependencies. Manager authorized only root `npm.cmd ci --ignore-scripts`; no manifest or lockfile changed.
- Corrected Functions lint passed, TypeScript built, and all 62 mocked contracts passed without Gemini/provider execution.
- The exact approved deploy updated `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, and `semanticSearchRecipes`, and created `getAiSpendStatus`, `resumeAiSpendAllowance`, and `manualPauseAiSpend` in `us-central1`.
- Metadata-only proof confirmed all seven targets active on v2 `nodejs22` with `maxInstances: 1`; callable concurrency is `5` for generation/search/status and `1` for embedding/resume/manual-pause as designed.
- `AI_SPEND_CIRCUIT_BREAKER_ENABLED` remains absent everywhere, so the gate is deployed but disabled. `OWNER_UIDS` remains present by name only, and the four AI Functions retain `GEMINI_API_KEY` version `2` binding metadata without value access.
- `billingBudgetMonitor` remained unchanged in `us-east1`, including its source hash and scaling posture. Hosting, rules, indexes, Storage, App Check configuration, IAM, billing, provider, email, secrets, and production data were not changed.
- Manager independently confirmed the eight-Function live inventory after deployment. No Function/callable, Auth/App Check flow, production app/data path, runtime log, or Gemini/provider API was invoked.

## Accepted CMD-031 Owner Pause-Email Decision - 2026-07-10

Historical decision note: this research remains valid if VioMacro later adds custom outbound email. The 2026-07-11 Manager scope update defers all implementation/configuration packets and removes email from the current Stage 5 done definition.

- Selected architecture: one dedicated second-generation Firestore-triggered worker, proposed name `deliverOwnerPauseEmail`, reading `ops/emailOutbox/events/{eventId}` and calling the Resend HTTPS Email API directly.
- Preserve the existing deterministic outbox document ID as Resend's `Idempotency-Key`. This handles Firestore's at-least-once delivery and ambiguous network timeouts without creating a second mail collection.
- Firebase Trigger Email remains a supported fallback, but it is not directly compatible with the current domain payload/top-level status schema. Preserving verified Firebase Auth recipient lookup would require an adapter plus extension-managed infrastructure and a second status mapping.
- Resolve the single recipient at send time from the exactly one configured `OWNER_UIDS` Firebase Auth record. Require enabled user, primary email, and `emailVerified === true`; never store/log the UID or recipient. If multiple owner UIDs exist, fail closed until a dedicated server-only notification UID is separately approved.
- Use a sending-only, sender-domain-restricted `RESEND_API_KEY` secret. Render a fixed operational message from allowlisted payload fields only; do not include recipes, prompts, UIDs, recipient address, billing identifiers, or provider response bodies.
- Bound delivery to three external attempts within two hours, a stable request body/key, about a ten-second provider timeout, and a short transactional claim lease. Retry transient/ambiguous failures with the same key; permanent or exhausted failures set sanitized `failed` state while AI remains paused.
- For the first release, `sent` means Resend accepted the idempotent API request and returned an email ID. Inbox receipt must be proven separately; bounce/delivery webhooks remain deferred.
- Keep normal outbox creation at `pending_provider_setup` through local implementation and disabled worker deployment. A later controlled one-email test and later producer integration are separate approvals; breaker activation and live AI remain later still.
- Current Resend Free posture reviewed 2026-07-10 is `$0/month`, 3,000 sent/received emails per month, 100/day, one domain, and no free-plan overage. This private-alpha workload should fit, but provider/Firebase usage is not a hard zero-cost guarantee and must be rechecked before configuration.
- CMD-031 created no account, domain/DNS record, key/secret, extension/package, source change, email, production-data/log access, deploy, Git action, or live provider/AI call.

## Selected Email Transport Architecture

Local adapter packet:

- Add `functions/src/ownerPauseEmailWorker.ts`; update `emailOutbox.ts` and `index.ts`; add focused worker tests and only the smallest cross-contract test updates.
- Use Node 22 built-in `fetch`; do not add a Resend package unless Builder proves a concrete requirement.
- Keep rules, indexes, Firebase config, client service/UI, and normal event status unchanged unless focused tests prove otherwise.
- Prove duplicate/concurrent delivery, stable key/body after timeout, provider response classification, verified owner lookup, bounded retries, recipient non-disclosure, and email failure leaving AI paused.

Later separately approved packets:

1. Resend account, owned sender subdomain/address, restricted API key, Firebase secret metadata, and safe owner-recipient classification. No email or deploy.
2. Deploy only `deliverOwnerPauseEmail` with producers still writing `pending_provider_setup`; metadata-only proof and no invocation.
3. Send one clearly marked email to the verified owner from one tiny reversible server-only test outbox document; no Gemini or AI-state mutation.
4. Change only new automatic-pause events to `pending` and deploy the exact producer set while the breaker flag remains absent/false.
5. Decide native Gemini provider protection, then separately approve breaker activation and any smallest live AI canary.

Required user decision before local adapter work:

- Approve Resend Free/direct HTTPS as the provider architecture.
- Choose an owned sender domain/subdomain and sender address, recommended `notify.<owned-domain>` and `VioMacro <alerts@notify.<owned-domain>>`, or explicitly accept Resend's test-only sender restriction for private-alpha testing.
- Confirm the verified Firebase Auth email for the single owner UID is the intended recipient.

Explicit non-goals for CMD-022:

- No Firestore TTL policy: [TTL deletion is delayed and non-transactional](https://firebase.google.com/docs/firestore/ttl), so it cannot repair aggregate accounting safely.
- No scheduled Function, new callable, owner recovery button, UI/status schema expansion, Firestore rule/index change, email transport, provider configuration, deploy, activation, or live canary.
- No change to allowance amounts, safety reserve, model IDs, prices, request-ID format, owner authorization, App Check, instance/concurrency limits, or existing disabled-mode behavior.

## Accepted CMD-017 Backend QA - 2026-07-09

Independent QA accepted the local backend core with all 16 command-matrix items passing. Functions contracts passed 46/46, Firestore rules passed 20/20 through the local CLI fallback, Functions lint/build passed, and the full app `check` passed outside the known restricted-sandbox boundary.

Manager sequencing decision:

- Proceed to local, mocked Settings UI and client request-ID wiring.
- Keep `BUG-026` deferred only for this non-live UI stage; it remains unresolved before activation.
- Do not add email transport, deploy, enable the gate, change provider/billing/IAM/App Check settings, or run live Gemini in the UI batch.

## User Workflow

Normal:

1. Owner uses an AI feature.
2. The server verifies Auth/App Check where applicable and checks the shared AI-spend state.
3. The server atomically reserves a conservative maximum cost for that request.
4. If the reservation fits inside the approved allowance, the provider call may proceed.
5. After the response, the server reconciles the reservation against available usage metadata and records the pricing version used.

Automatic pause:

1. A reservation would reach or exceed the remaining approved allowance.
2. The shared state transitions atomically from `active` to `paused` before the provider call.
3. The attempted provider call is not made.
4. One deterministic pause audit/outbox compatibility event is created server-side; no external notification is sent.
5. The user sees an honest AI-paused message; non-AI VioMacro workflows remain available.

Owner review and resume:

1. The owner opens the AI Spend Safety section in Settings.
2. The page shows estimated period spend, approved allowance, remaining allowance, state, pause time, and pricing version.
3. The owner selects `Resume with another $20` and confirms.
4. An owner-only callable validates Auth, App Check, and `OWNER_UIDS`, then increments the approved allowance by `$20` and records an audit event.
5. AI returns to `active` only after the server confirms the new allowance.

## Covered AI Paths

The circuit breaker must cover all current server-side Gemini paths before client creation or provider execution:

- `generateMealPlan`
- `parseRecipeFromImage`
- `generateRecipeEmbedding`
- `semanticSearchRecipes`

Any future Gemini path must use the same gate before release.

## Required Safety Architecture

Server-side source of truth:

- Keep spend state in a server-owned Firestore operations document or collection.
- Deny direct client reads and writes through Firestore rules.
- Expose only a sanitized owner status callable and an owner-only resume callable.
- Never trust a client-supplied spend, limit, price, owner identity, or pause state.

Race and replay protection:

- Reserve cost in a Firestore transaction before every paid AI call.
- Use an idempotency key per logical request or background event.
- Concurrent requests must not each observe the same remaining allowance.
- Duplicate background events or callable retries must not reserve or charge twice.
- A request that cannot prove safe reservation fails closed before Gemini.

Cost accounting:

- Configure explicit maximum input/file sizes and `maxOutputTokens` for generation paths.
- Configure conservative per-feature maximum reservations.
- Reconcile generation calls from Gemini usage metadata when available, including input, output, cached, and thinking-token fields applicable to the model.
- Account for embedding input with supported token-count or conservative feature pricing.
- Store prices as versioned server configuration tied to exact model IDs; never fetch or trust pricing from the browser.
- Treat missing or malformed usage metadata conservatively. Do not release the full reservation unless non-billing is proven.
- Keep a small safety reserve so a final allowed call cannot take estimated spend beyond the approved ceiling.

Blast-radius controls:

- Add explicit low instance/concurrency limits appropriate for private alpha.
- Preserve existing owner request-rate limits, Auth, App Check, API-key restrictions, and payload validation.
- Evaluate a native Gemini project spend cap or Prepay balance as a higher independent emergency ceiling.
- Do not give the AI runtime billing-administration or project-unlink permissions.

## Notification And Dormant Outbox Contract

- The required notification is the owner-only in-app paused state in Settings; custom outbound email is deferred.
- The existing deterministic server-only outbox/audit event may remain dormant for compatibility with the deployed, tested core. It must not call a network provider or become an activation dependency.
- Do not expose provider-setup, delivery, recipient, or transport status in the owner UI while no email transport is part of the product scope.
- A future decision may remove the dormant outbox or implement a notification transport, but either change requires a separately scoped Builder, QA, and Release sequence.
- Google Cloud budget-alert emails remain separate alert-only billing evidence and must not be represented as exact pause delivery or cap enforcement.

## UI Contract

Location: owner-only section in `/settings`, not a separate public page.

Required states:

- `Active`: show allowance, estimated spend, remaining allowance, and manual pause action.
- `Approaching limit`: show a restrained warning without interrupting non-AI work.
- `Paused automatically`: explain that AI calls are stopped and VioMacro data/features remain available.
- `Resume pending`: disable duplicate actions while the server processes the approval.
- `Unavailable`: fail closed for AI and show that spend status could not be verified.

The resume control must name the new allowance it grants, for example `Resume with another $20`. It must not be a misleading generic toggle.

## Approval And Data Boundaries

- Only UIDs listed in deployed `OWNER_UIDS` may read owner status or resume AI.
- Callable resume requires Auth and enforced App Check outside the emulator.
- Background embedding cannot bypass the shared gate.
- Operations state and email outbox are server-only.
- No secrets, owner UID, email address, billing-account ID, or API key may be committed or logged.
- No live AI call is required to implement or test the contract.

## Verification Matrix

- Active below limit allows a mocked provider call.
- Exact-boundary or over-boundary reservation pauses before provider execution.
- Every current AI path uses the shared gate.
- Concurrent reservations cannot exceed the approved allowance.
- Duplicate request/event IDs do not reserve twice.
- Provider success reconciles supported usage metadata.
- Provider error, timeout, and missing usage metadata remain conservative.
- Wrong model or missing pricing configuration fails closed.
- Non-owner status/resume calls are denied.
- Missing Auth or App Check is denied where applicable.
- Resume adds exactly one `$20` allowance and records one audit event.
- Duplicate resume submission is idempotent.
- One pause transition remains deterministic and cannot enable or duplicate an AI provider call.
- Dormant notification/audit handling cannot reactivate AI or block the pause.
- Period rollover uses the verified billing boundary and restores the initial `$20` allowance once.
- Settings shows disabled, active, warning, paused, pending, owner-denied, and unavailable states. Custom-email delivery status remains hidden compatibility data for the current private alpha.
- Non-AI app workflows continue while AI is paused.

## Staged Delivery

1. `CMD-015` Release preflight: accepted with explicit Console-only unknowns and Manager corrections.
2. `CMD-016` Builder core: accepted locally after Manager hardening and independent verification. The server-owned policy remains default disabled and undeployed.
3. `CMD-017` backend QA: independently challenge the financial boundary, fail-closed behavior, authorization, idempotency, all-path gate, rules boundary, and no-live-provider proof.
4. Builder UI: after backend QA passes, add the owner-only Settings status and resume workflow plus frontend request IDs against emulators.
5. Combined QA: run the full backend/UI verification matrix without live Gemini or production mutation.
6. [x] `CMD-022` through `CMD-025` local recovery: closed `BUG-026` through bounded two-phase lease recovery, canonical stored-document authority, and independent QA without live provider or production work.
7. [x] `CMD-026` Release preflight: accepted the ordered approval packets with Manager rollback, deployed-rules, and email-adapter corrections.
8. [x] `CMD-028` consolidated checkpoint: accepted Web App-only Stage 5 baseline committed and pushed as `464d404`; this grants no deploy authority.
9. [x] `CMD-029` disabled-deploy preflight: accepted deployed inventory, absent flag, rules/App Check planning posture, exact seven-Function target, and immutable rollback design without mutation.
10. [x] `CMD-030` disabled deploy: seven named Functions deployed from clean immutable `464d404`; mocked contracts passed 62/62 and metadata-only proof confirmed the breaker remains disabled with bounded scaling.
11. [x] `CMD-031` email architecture decision: selected a direct Resend HTTPS worker as a viable future option; no provider or implementation action occurred.
12. [x] `CMD-032` product-scope cleanup: removed unused custom-email language from the owner Settings surface while preserving the deployed gate and dormant server-only compatibility path; Manager review and focused mocked proof passed.
13. [x] `CMD-033` independent UI QA: source/diff scope, hidden compatibility state, paused/resume behavior, fail-closed states, and desktop/mobile presentation passed with only an accepted screenshot-framing caveat.
14. [x] `CMD-034` final Release preflight: accepted the seven-packet sequence, current Hosting/backend parity, experimental provider-cap option, and `BUG-029` pre-Hosting copy blocker without mutation.
15. [x] `CMD-035`/`CMD-036`: corrected and independently verified the production-neutral disabled-state sentence; Manager check passed and both corrected focused mocked runs passed 5/5 without backend/live changes.
16. [x] `CMD-037` checkpoint: exactly 13 accepted Web App files were committed and pushed as `fe48d25`; full check, 62/62 mocked Functions contracts, 5/5 focused AI Safety, staged hygiene, and upstream equality passed.
17. [x] Release-artifact hardening: CMD-038 was rejected and rolled back after a recovered emulator-artifact incident; CMD-039/CMD-040 then closed BUG-030 locally with isolated prod-emulator output, exact manifest stability, and a fail-closed Hosting artifact guard.
18. [x] Artifact-hardening checkpoint: CMD-041 committed/pushed the exact 11-file fix and durable incident/closure record as `f9769ae`; final Hosting build, staged hygiene, and upstream equality passed with no deploy or live action.
19. [x] Hosting publication: CMD-042 published immutable `f9769ae` as live version `762e5b25bfb28e0c`; final artifact verification and Release plus Manager signed-out smoke passed, and no rollback trigger occurred.
20. [x] Native provider preparation/configuration: CMD-043 accepted Tier 1 Postpay project-cap availability and selected `$50`; CMD-044 configured that exact VioMacro project cap and Release plus Manager independently verified the persisted state without a Gemini request.
21. [x] Final activation preflight: CMD-045 accepted immutable `464d404`, current live disabled metadata, the exact seven-Function activation and same-source disable packets, and the bounded one-call owner-status side effects without any production mutation or Gemini request.
22. [x] Activation: CMD-046 enabled the initial `$20` allowance on exactly seven Functions from immutable `464d404`; sanitized metadata and independent Manager metadata-only verification passed.
23. [x] Owner status proof: CMD-046 used exactly one owner-only status POST without Gemini and returned the clean default active state; no rollback trigger occurred.
24. Canary decision: deferred and optional. Run one smallest valid Gemini call only if separately approved; the breaker and Stage 5 closure do not depend on it.

## Done Definition

- A race-safe server gate covers every AI path.
- Expired pre-provider reservations are released only with transactional proof, while ambiguous provider-started reservations close conservatively without permitting a duplicate provider call.
- The first `$20` allowance and every later owner-approved allowance are auditable.
- AI pauses before an unsafe next provider call; the rest of VioMacro remains usable.
- The owner sees an honest in-app paused state without any custom-email dependency.
- Only the owner can grant another allowance from Settings.
- Native provider protection is configured or explicitly deferred with a documented reason.
- Tests, disabled deploy evidence, activation evidence, and residual overshoot limits are recorded in the QA ledger.
