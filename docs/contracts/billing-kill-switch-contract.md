# Billing Kill Switch Contract

Date created: 2026-06-26
Status: Closed for the current one-owner private alpha - alert-only monitor retained and unchanged; project-wide cutoff explicitly deferred; CMD-046 activated and proved the AI-only `$20` circuit breaker; the `$50` native cap remains configured; no Gemini canary has run

## Scope

- Workflow/surfaces: Google Cloud Billing budget, budget alert emails, Pub/Sub budget notifications, optional Cloud Run/Firebase Function listener, Cloud Billing API cutoff, Firebase project `viomacro`.
- Owner files: `docs/contracts/billing-kill-switch-contract.md`, `docs/security-cost-control.md`, `docs/pre-hosting-readiness.md`, `docs/app-contract-roadmap.md`, future `functions/src/billingMonitor.ts` or equivalent if implemented.
- Launch tier: Required before broader sharing or higher live AI usage. Recommended before repeated live AI smoke testing.
- User goal: Prevent runaway Firebase/Google Cloud/AI costs from app bugs, AI loops, or accidental high-volume usage without making normal private-alpha development fragile.

Implementation contract: `docs/contracts/ai-spend-circuit-breaker-contract.md` now owns the Stage 5 AI-only pause, owner-only in-app status, accounting, and owner-resume workflow. This contract continues to own Cloud Billing budget-alert emails, Pub/Sub budget notifications, the alert-only monitor, and any separately approved break-glass billing discussion.

## Stage 5 Manager Decision - 2026-07-09

- The user's requirement is an AI-only circuit breaker, not project billing unlink. VioMacro must remain available when AI pauses.
- The first approved AI allowance is `$20`; all Gemini paths pause before an unsafe next provider call, the owner-only Settings surface reports the pause, and only the owner can grant another explicit allowance from the app.
- Custom pause email is deferred by the 2026-07-11 user decision. Existing Google Cloud budget emails remain alert-only and are not cap enforcement.
- `CMD-015` must verify the current Gemini plan/cap options, model accounting, identity, period boundary, and email-delivery options without changing live state.
- Automatic unlinking of the primary `viomacro` Firebase project is deferred and out of scope for the current Stage 5 implementation.
- No billing, IAM, provider, Functions, Pub/Sub, production-data, live-AI, deploy, commit, or push action is authorized by this decision. Each implementation, QA, disabled deploy, and live activation step remains a separate command and approval gate.

## Task Checklist

1. [x] Define billing kill switch scope and safest rollout sequence.
   - Outcome: Contract distinguishes budget emails, Pub/Sub notifications, alert-only monitoring, and hard billing cutoff.
   - Verification target: Official Google/Firebase billing docs reviewed.
   - Ledger target: This contract.

2. [x] Confirm basic budget email alert exists.
   - Outcome: Google Cloud Billing budget exists for project `viomacro`.
   - Recommended initial amount: `$20` monthly while testing.
   - Recommended thresholds: `25%`, `50%`, `75%`, `90%`, `100%` actual spend.
   - Verification target: User screenshot or Console confirmation.
   - Ledger target: QA ledger.

3. [x] Create or confirm Pub/Sub topic for budget notifications.
   - Outcome: A Pub/Sub topic exists for budget events, for example `viomacro-budget-alerts`.
   - Verification target: Topic visible in Google Cloud Console.
   - Ledger target: QA ledger.

4. [x] Connect budget to Pub/Sub topic.
   - Outcome: The selected budget publishes programmatic notifications to the Pub/Sub topic.
   - Verification target: Budget `Manage notifications` shows the connected topic.
   - Ledger target: QA ledger.

5. [x] Create alert-only billing monitor.
   - Outcome: A function or Cloud Run service receives budget notifications, logs parsed payloads, and optionally sends non-destructive alerts. It must not disable billing yet.
   - Verification target: Test Pub/Sub sample payload invokes the monitor and logs budget fields.
   - Ledger target: QA ledger.
   - Current status: Deployed monitor received and logged a Pub/Sub sample message without destructive action.

6. [ ] Add hard cutoff code behind explicit kill flag.
   - Outcome: Billing cutoff code exists but only runs when an explicit environment flag is enabled, for example `BILLING_KILL_SWITCH_ENABLED=true`.
   - Verification target: Unit tests prove disabled mode never unlinks billing; enabled mode calls the Billing API only when threshold is exceeded.
   - Ledger target: QA ledger and bug ledger if blocked.

7. [ ] Configure least-privilege IAM for cutoff service account.
   - Outcome: Only the monitor service account can unlink the target project from billing, and only if hard cutoff is enabled.
   - Verification target: IAM role review in Console.
   - Ledger target: QA ledger.

8. [ ] Run dry-run and sample-payload tests.
   - Outcome: Sample budget messages at 25%, 90%, 100%, and over cutoff threshold produce expected alert-only or disabled-cutoff behavior.
   - Verification target: Local tests plus Cloud logs from sample Pub/Sub delivery.
   - Ledger target: QA ledger.

9. [ ] Enable hard cutoff only after user approval.
   - Outcome: Cutoff mode is enabled only after budget alerts, alert-only monitor, IAM, and tests are proven.
   - Recommended cutoff threshold: higher than warning budget, for example `150%` of a low monthly testing budget or a fixed emergency number chosen by the user.
   - Verification target: Explicit user approval and final config record.
   - Ledger target: QA ledger.

10. [x] Close billing kill switch contract for the current private alpha.
    - Outcome: Budget safety has a proven email alert, programmatic notification path, alert-only proof, an active AI-only `$20` breaker, a configured `$50` provider backstop, and an explicit accepted deferral of destructive project-wide billing unlink.
    - Verification target: QA ledger proof plus updated pre-hosting readiness.
    - Ledger target: QA ledger, security/cost doc, app roadmap.

## Current Diagnosis

Proven:

- The app has AI usage limits in Firebase Functions.
- The app has local emulator AI-spend guards.
- The app has server-side Gemini key handling.
- Existing security/cost docs already flag a budget kill switch as required before broader usage.
- Google Cloud Billing has budget `$20 Monthly Budget Alert` for project `VioMacro`.
- Budget `45c38598-4a54-4292-8134-a120fd9962f8` has thresholds `25%`, `50%`, `75%`, `90%`, and `100%`.
- Pub/Sub topic `projects/viomacro/topics/viomacro-budget-alerts` exists.
- The budget notification topic persisted on the budget edit page as `projects/viomacro/topics/viomacro-budget-alerts`.
- Alert-only function source `billingBudgetMonitor` exists and subscribes to topic `viomacro-budget-alerts`.
- Budget payload parsing is covered by local contract tests.
- Deployed `billingBudgetMonitor` received a sample Pub/Sub budget notification and logged parsed budget fields with `destructiveAction: false`.
- VioMacro's experimental Gemini project monthly spend cap is configured at `$50`; this is an emergency provider backstop with documented latency/overrun, not an exact invoice ceiling.
- CMD-046 activated exactly seven AI-spend Functions from immutable `464d404`; one clean owner status POST proved the `$20` active state with zero Gemini/provider traffic, and independent Manager metadata-only verification passed.

Assumed:

- The user owns or can access the Google Cloud/Firebase billing account for project `viomacro`.
- The app is currently private-alpha and not broadly shared.
- The initial budget alert amount can remain low, such as `$20`, until the user chooses a more comfortable monthly testing cap.

Broken or risky:

- Email budget alerts do not cap charges.
- Budget data is estimated and can lag actual usage.
- Disabling billing is destructive: Google Cloud services stop, Firebase downgrades to Spark, and some resources may shut off or become unavailable.
- A hard cutoff can interrupt legitimate app usage or live testing.
- Hard cutoff code requires sensitive IAM permissions, so it must be developed and tested carefully.

## Data Read/Write

Data read:

- Budget notification payload from Pub/Sub.
- Project billing association if cutoff mode is implemented.

Data write:

- Alert-only mode: logs/alerts only.
- Hard cutoff mode: unlinks project `viomacro` from its billing account through Cloud Billing API.

## Permissions And IAM

Budget/Pub/Sub setup requires one of these practical permission paths:

- Billing account access to create/update budgets plus project Pub/Sub permissions.
- Or project owner/editor path if using project-scoped budget setup where available.

Hard cutoff requires permissions to unlink a project from a billing account. Keep this limited to one service account.

## States

Normal state:

- Budget email alerts are active.
- Pub/Sub budget notifications are connected.
- Alert-only monitor logs budget messages.

Warning state:

- Budget thresholds trigger emails and Pub/Sub messages.
- Monitor records cost amount, budget amount, threshold exceeded, and budget display name.

Cutoff-disabled state:

- Monitor sees threshold exceeded but refuses to unlink billing because `BILLING_KILL_SWITCH_ENABLED` is not true.

Cutoff-enabled state:

- Monitor unlinks billing only when cutoff threshold is exceeded and project/billing IDs match the allowlist.

Error state:

- Missing project/billing IDs, malformed Pub/Sub data, or missing IAM permissions should log errors and fail closed without unlinking billing unless all required checks pass.

## Risks And Non-Goals

- Do not deploy hard cutoff code in the same step as first Pub/Sub setup.
- Do not grant broad Owner permissions to the monitor service account if a narrower role works.
- Do not use cutoff as the only control. Keep AI usage limits, App Check, Auth, API restrictions, and budget emails.
- Do not test hard cutoff against the live project until the user explicitly approves.
- Do not deploy Hosting as part of this contract.

## Setup Sequence

Phase 1 - Immediate safety:

1. Create or confirm `$20` monthly budget.
2. Add email thresholds at `25%`, `50%`, `75%`, `90%`, `100%`.
3. Confirm the owner email receives budget alerts.

Phase 2 - Programmatic notifications:

1. Create Pub/Sub topic `viomacro-budget-alerts`.
2. Connect the budget to that topic.
3. Confirm Cloud Billing has permission to publish to the topic.

Phase 3 - Alert-only monitor:

1. Implement a Pub/Sub-triggered monitor.
2. Parse budget payload safely.
3. Log budget name, cost amount, budget amount, threshold exceeded, and currency.
4. Do not unlink billing.

Phase 4 - Hard cutoff gated mode:

1. Add Billing API code to unlink billing.
2. Require exact allowlisted project ID.
3. Require exact allowlisted billing account ID.
4. Require `BILLING_KILL_SWITCH_ENABLED=true`.
5. Require cutoff threshold exceeded.
6. Unit-test both disabled and enabled branches with mocks.

Phase 5 - Live enablement:

1. Enable only after explicit user approval.
2. Keep a manual re-enable path documented.
3. Watch logs during first live test.

## Current Proof

- Official docs checked on 2026-06-26:
  - Firebase says budget alerts do not cap usage or charges and may be delayed.
  - Google Cloud Billing supports Pub/Sub programmatic budget notifications.
- Google Cloud Billing documents disabling billing by unlinking the project from the billing account.
- Google warns that disabling billing stops Google Cloud services; Firebase projects are downgraded from Blaze to Spark and can hit no-cost quota limitations.
- Google Cloud Console confirmed on 2026-06-26:
  - Billing account: `012928-6470BD-6D1EFF`.
  - Budget: `$20 Monthly Budget Alert`.
  - Budget ID: `45c38598-4a54-4292-8134-a120fd9962f8`.
  - Budget scope: project `VioMacro`.
  - Current spend shown at setup time: `$0.00 / $20.00`.
  - Budget thresholds: `25%`, `50%`, `75%`, `90%`, `100%`.
  - Pub/Sub topic: `projects/viomacro/topics/viomacro-budget-alerts`.
  - The topic was selected on the budget and persisted after saving/reopening the budget edit page.
- 2026-07-10 CMD-027 Google AI Studio read-only proof:
  - Project `VioMacro` showed monthly Gemini API spend `$0.00` and Billing Tier `Tier 1 - Postpay`.
  - Spend view showed no available usage data for June 13 through July 10, 2026.
  - No native Gemini project spend cap was configured.
  - AI Studio warned that cost information may take up to 24 hours to update.
  - Routine local checks were source-confirmed as mocked, emulator-guarded, or static and do not intentionally call Gemini.
- 2026-07-12 CMD-043 native Gemini backstop decision:
  - Release and Manager independently confirmed `viomacro` remains Tier 1 Postpay and its experimental project monthly spend cap is available but unset.
  - The `$250` Tier 1 account cap is shared with two other paid projects; VioMacro showed `$0.00` while the shared account showed `$0.02`, subject to reporting latency and not attributable to VioMacro from the inspected views.
  - Current official guidance records roughly ten minutes of project-cap latency, possible long-running overrun, a Tier 1 `$10` rolling ten-minute spend limit, and no exact dollar overrun ceiling.
  - Manager rejected a `$20` native cap because it would conflict with the in-app `Resume with another $20` workflow. The recommended emergency-cap candidate is `$50`, pending explicit user approval.
  - No billing/provider setting, production path, Firebase resource, Git state, or Gemini request changed or ran.
- 2026-07-12 CMD-044 native Gemini project-cap configuration:
  - Under explicit user approval, Release changed only project `viomacro`'s experimental monthly spend cap from unset to exactly `$50` and saved once.
  - Release proved the settled `$0.00 / $50.00` state after navigation; Manager independently confirmed `VioMacro`, Tier 1, `Edit spend cap`, and `$0.00 / $50.00` read-only.
  - No Gemini request, production Function/callable, VioMacro Auth/data/log access, Firebase resource, account/payment/IAM/key/quota setting, unrelated project, deploy, or Git action changed or ran.
  - The provider warning remains: overages may occur during roughly ten minutes of processing latency and during long-running work.
- 2026-07-10 CMD-030 disabled AI-spend Functions deployment:
  - Exactly four existing AI Functions were updated and three owner AI-spend callables were created from immutable `464d404` source.
  - The app-level breaker flag remains absent/disabled; no Function or Gemini path was invoked.
  - `billingBudgetMonitor` remained unchanged in `us-east1` with its prior source hash and alert-only posture.
  - Project-wide billing unlink, native provider settings, email, activation, and canary work remained untouched.
- 2026-07-12 CMD-046 AI-only circuit-breaker activation:
  - After one blocked-before-deploy attempt was explicitly cleaned, Release retried from a new immutable `464d404` worktree and passed locked installs, Functions lint/build, and exactly 62/62 mocked contracts.
  - Exactly seven Functions were deployed with the exact breaker flag `true`; sanitized postdeploy and independent Manager metadata-only proof confirmed preserved Node 22 scaling/bindings and unchanged flag-absent `billingBudgetMonitor`.
  - Exactly one owner status POST returned `Active`, `$20.00` allowance, `$0.00` spent/reserved, `$19.00` remaining, and the expected `$1.00` reserve/pricing state. Zero other callable or Gemini/provider requests occurred.
  - No rollback trigger occurred. Project-wide billing unlink, IAM, Billing API cutoff, custom email, provider-cap changes, and Gemini canary remained untouched.
- 2026-06-26 alert-only monitor source proof:
  - Added Pub/Sub trigger `billingBudgetMonitor` on topic `viomacro-budget-alerts`.
  - Added pure parser `parseBillingBudgetNotification`.
  - Parser extracts billing account ID, budget ID, schema version, budget display name, cost amount, budget amount, thresholds, currency, interval start, and percent used.
  - Monitor logs budget notifications with `mode: "alert-only"` and `destructiveAction: false`.
  - Monitor does not import or call the Cloud Billing API.
  - `npm.cmd --prefix "Web App\functions" run build`: passed.
  - `npm.cmd --prefix "Web App\functions" run lint`: passed.
  - `npm.cmd --prefix "Web App\functions" run test:contracts`: passed, 19 tests.
- 2026-06-26 deployed alert-only monitor proof:
  - `npx.cmd --yes firebase-tools deploy --only functions --project viomacro`: deployed Functions only; Hosting was not deployed.
  - New function created: `billingBudgetMonitor(us-east1)`.
  - Existing Functions updated: `generateMealPlan`, `parseRecipeFromImage`, `generateRecipeEmbedding`, and `semanticSearchRecipes`.
  - Firebase CLI reported deploy success for all Functions but exited nonzero because Artifact Registry cleanup policy was missing in `us-east1`.
  - `npx.cmd --yes firebase-tools functions:artifacts:setpolicy --location us-east1 --days 1 --force --project viomacro`: passed; cleanup policy now deletes images older than 1 day.
  - Published one safe sample Pub/Sub message to `projects/viomacro/topics/viomacro-budget-alerts`.
  - Pub/Sub message ID: `20264525250022298`.
  - `npx.cmd --yes firebase-tools functions:log --only billingBudgetMonitor --project viomacro`: confirmed the monitor logged `Billing budget notification received.`
  - Log fields included `budgetDisplayName: "$20 Monthly Budget Alert"`, `billingAccountId: "012928-6470BD-6D1EFF"`, `budgetId: "45c38598-4a54-4292-8134-a120fd9962f8"`, `costAmount: 18`, `budgetAmount: 20`, `percentUsed: 0.9`, `alertThresholdExceeded: 0.9`, `currencyCode: "USD"`, `mode: "alert-only"`, and `destructiveAction: false`.

## Open Bugs And Deferrals

Open bugs:

- None yet.

Deferred:

- Multi-threshold dry-run set for 25%, 90%, 100%, and over-cutoff samples.
- Hard cutoff code.
- Live cutoff enablement.

Revisit trigger:

- Before repeated live AI testing, Functions-only production deploy, Hosting deploy, broader sharing, or raising live usage caps.

## Next Action

Keep project-wide billing unlink, sensitive cutoff IAM, Billing API break-glass code, and custom pause email deferred. The app-level `$20` circuit breaker is active and owner-status-proven through CMD-046, while the VioMacro-only `$50` native emergency cap and alert-only monitor remain layered backstops. Do not represent the application allowance, `$20` Cloud Billing budget alerts, or experimental `$50` provider cap as an exact invoice ceiling. No Gemini canary is required for this contract's private-alpha closure; any canary or later configuration change remains separately approval-gated.
