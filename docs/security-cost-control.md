# Security and Cost Control

This project uses paid Firebase and AI services, so expensive operations must have multiple guardrails.

## Current Guardrails

- Firebase browser API key is restricted in Google Cloud Console to VioMacro web referrers and local dev referrers.
- Firebase App Check is registered for the VioMacro web app with reCAPTCHA.
- Callable AI functions require App Check outside the emulator.
- Callable AI functions require Firebase Auth.
- Callable AI Cloud Run services allow public invocation at the infrastructure layer so Firebase Web SDK callable requests can reach the handler; handler-level Firebase Auth and App Check remain mandatory.
- AI functions enforce per-user daily and per-minute usage limits.
- Recipe image/PDF parsing enforces a 10 MB asset limit.
- Server-side Storage reads validate that recipe assets live under `users/{uid}/recipes/`.
- Search query length and result limits are capped.
- Gemini API key stays server-side in Firebase Functions secrets.
- The seven AI-spend Functions enforce the server-side `$20` circuit breaker with `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`; only owner-authenticated/App-Checked status, pause, and resume controls can inspect or change the allowance state.
- Firebase Functions use the maintained `@google/genai` SDK for Gemini calls.
- Embedding calls request the configured Firestore vector dimension from the provider instead of silently slicing provider output.
- Real `.env`, `.env.local`, and `.secret.local` files are ignored by Git.

## AI Usage Limits

The current per-user limits are defined in `functions/src/index.ts`:

Default user limits:

- `generateMealPlan`: 10 per day, 2 per minute.
- `parseRecipeFromImage`: 20 per day, 3 per minute.
- `generateRecipeEmbedding`: 100 per day, 20 per minute.
- `semanticSearchRecipes`: 100 per day, 20 per minute.

Owner limits:

- `generateMealPlan`: 50 per day, 6 per minute.
- `parseRecipeFromImage`: 75 per day, 8 per minute.
- `generateRecipeEmbedding`: 500 per day, 60 per minute.
- `semanticSearchRecipes`: 500 per day, 60 per minute.

Owner limits activate only when the deployed Functions environment includes `OWNER_UIDS` with the owner's Firebase Auth UID. Do not hardcode personal UIDs in Git.

These are comfortable private-app defaults. Raise them only after usage and cost are monitored.

## Current Gemini Spend And Local Test Posture

CMD-027 accepted on 2026-07-10:

- Routine VioMacro checks/tests are zero-cost with respect to Gemini under current scripts. Functions contracts use a fake provider, browser AI paths are mocked or emulator-guarded, and lint/build/rules tests do not execute provider methods.
- Read-only Google AI Studio evidence showed VioMacro monthly spend `$0.00`, `Tier 1 - Postpay`, and no available usage data for June 13 through July 10, 2026.
- The VioMacro Gemini project had no project spend cap configured. Cost data may lag up to 24 hours.
- Do not set `ALLOW_EMULATOR_AI_CALLS=true` with a usable Gemini secret during routine development or QA.
- Do not interpret the `$0.00` snapshot, request-count limits, Cloud Billing alerts, active application breaker, or native provider cap as an exact future invoice ceiling. They are layered safeguards with documented latency and estimation limits.

## Native Gemini Provider Backstop

CMD-043 and CMD-044 accepted on 2026-07-12:

- Release and Manager independently confirmed that `viomacro` is Tier 1 Postpay and exposes an experimental project monthly spend-cap control.
- The billing account's `$250` Tier 1 cap is shared with two other paid projects. Tier 1's `$10` rolling ten-minute spend-rate limit and the existing `$20` Cloud Billing budget are broader or alert-only safeguards.
- Google documents roughly ten minutes of project-cap enforcement latency, possible long-running overrun, and no exact maximum invoice overshoot.
- The application gate remains the primary behavior: pause Gemini-backed VioMacro features at the initial `$20` allowance while leaving non-AI services available.
- Do not set the native project cap to `$20`. That would make the accepted `Resume with another $20` application action unreliable because the provider cap would not increase with the app allowance.
- Under explicit CMD-044 approval, Release configured only VioMacro's native project cap to exactly `$50` and saved once. Release proved persistence after navigation; Manager independently confirmed `VioMacro`, Tier 1, `Edit spend cap`, and `$0.00 / $50.00` read-only.
- The `$50` backstop covers the initial `$20`, one full `$20` owner-approved resume tranche, and a `$10` planning margin. The margin is not a provider guarantee.
- Any application allowance above `$40`, or any edit/removal of the native cap, requires a deliberate reassessment and another explicit Release approval.
- CMD-044 made no Gemini request and changed no other provider, billing-account, payment, IAM, key, quota, Firebase, production, deploy, or Git state.

## AI Spend Deployment Posture

CMD-030 accepted on 2026-07-10:

- The four Gemini-backed Functions and three owner AI-spend callables are deployed from immutable checkpoint `464d404`.
- Every selected Function now uses `maxInstances: 1`; callable concurrency is bounded at `5` for generation/search/status and `1` for embedding/resume/manual-pause.
- `AI_SPEND_CIRCUIT_BREAKER_ENABLED` remains absent, so the deployed policy is disabled and does not yet enforce the `$20` allowance.
- `OWNER_UIDS` remains present by environment-variable name only. The four AI Functions retain the `GEMINI_API_KEY` secret binding by version metadata; no value was read.
- `billingBudgetMonitor` was excluded and remained unchanged in alert-only mode.
- Deployment proof invoked no Function or Gemini path and read no production data or runtime logs. The native `$50` provider backstop is now configured; activation, owner status-only production proof, and a live canary remain separate approval gates.

CMD-045 final activation preflight accepted on 2026-07-12:

- Immutable `464d404` remains the exact seven-Function activation source and is byte-equivalent to current published source for Functions and Firebase safety inputs.
- Fresh sanitized metadata reconfirmed the seven breaker targets active with bounded scaling and the breaker flag absent; owner config and Gemini secret bindings remain present by name/version metadata only; `billingBudgetMonitor` remains separate.
- Activation uses only ignored `functions/.env.viomacro` with `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true` and an exact seven-target deploy. Same-source emergency disable uses the same target list with the flag `false`.
- One later owner status call invokes no Gemini method but may recover stale reservations. A clean status read writes nothing; the accepted source-bounded maximum is 32 logical reads and 32 committed writes, while transaction retries prevent an exact billed-read ceiling.
- No flag, Function, production record, provider setting, Git state, or Gemini path changed or ran in CMD-045. Exact activation approval is still required.

CMD-046 activation and owner proof accepted on 2026-07-12:

- Release used fresh immutable `464d404`, passed locked installs, Functions lint/build, and 62/62 mocked contracts, then deployed exactly the seven AI-spend Functions with `AI_SPEND_CIRCUIT_BREAKER_ENABLED=true`.
- Sanitized postdeploy metadata and independent Manager metadata-only verification confirmed all seven ACTIVE on v2 Node 22 with exact flag `true`, bounded scaling, owner config present by name, expected Gemini secret version metadata on the four provider paths, and unchanged flag-absent `billingBudgetMonitor`.
- Exactly one owner status POST returned `Active`, `$20.00` allowance, `$0.00` spent/reserved, `$19.00` remaining, `$1.00` reserve, expected pricing version, and no pause details. Its network capture contained zero other callable or Gemini/provider requests.
- No rollback trigger occurred. The same-source false-flag packet remains the emergency disable path but was not used.
- Both temporary worktree env files were deleted. No secret value, raw `/ops` data, runtime log, prompt, recipe, image, or personal content was read or reported.
- The native `$50` provider cap remains unchanged. The breaker portion of Stage 5 is complete; a Gemini canary remains optional and separately approval-gated.

## Owner Pause-Email Transport Decision

CMD-031 accepted on 2026-07-10:

Historical status: valid architecture research if custom email is reconsidered later. The 2026-07-11 user decision defers all provider implementation/configuration and removes email from the current activation prerequisites.

- Selected a dedicated Firestore-triggered worker that calls Resend's HTTPS API directly from the existing server-only outbox.
- The deterministic outbox ID becomes the provider idempotency key; retries keep the same key/body and terminate after three attempts or two hours.
- Recipient resolution uses exactly one enabled, verified Firebase Auth owner from `OWNER_UIDS`; personal email, UID, provider response, and secret values stay out of Firestore client surfaces and logs.
- `pending_provider_setup` remains the deployment brake until the local adapter, provider configuration, dormant worker deploy, and one controlled owner-email test are independently accepted.
- Resend Free is the recommended private-alpha plan, but the user must approve the provider, sender domain/address, and recipient before implementation. Pricing/quota must be rechecked before configuration.
- Firebase Trigger Email remains fallback only because it requires additional schema/adapter/extension infrastructure for the current outbox and verified Auth recipient boundary.

## Current Notification Scope

- No Resend, SMTP, Firebase Trigger Email, or other custom outbound-email provider will be added for the current one-owner private alpha.
- At the `$20` allowance boundary, only Gemini-backed AI actions pause. Hosting, Auth, Firestore, Storage, and non-AI VioMacro workflows remain available.
- The owner-only Settings surface is the required pause notification and provides the explicit `Resume with another $20` action.
- The existing deterministic server-only outbox remains dormant for deployed-code compatibility. It sends nothing externally and must not become an activation dependency.
- Existing Google Cloud budget emails remain a separate alert-only safeguard and do not enforce the application allowance.
- CMD-032/CMD-033 removed all custom email/provider status from the owner panel and independently passed the focused mocked AI Safety group 5/5 without changing any backend/service/outbox path or calling Gemini.

Current config proof as of 2026-06-26:

- `GEMINI_API_KEY` exists in Secret Manager metadata; the secret value was not read.
- Ignored local `functions/.env` exists and contains `OWNER_UIDS`; the UID value must stay out of Git.
- Firebase App Check reCAPTCHA v3 config exists for the web app.
- Ignored local web `.env` contains the public `VITE_RECAPTCHA_SITE_KEY`.
- Firebase browser API key restrictions include Firebase Hosting domains and local smoke origins, with API target restrictions present.
- reCAPTCHA domain list includes `localhost` for controlled local smoke.
- Controlled Firebase Web SDK callable smoke from `http://localhost:5173/` returned `functions/invalid-argument` / `Missing user settings.` for `{}`, proving Auth + App Check were accepted before validation and before Gemini execution.
- Cloud Run Security is set to `Allow public access` for `generateMealPlan`, `parseRecipeFromImage`, and `semanticSearchRecipes`; this is intentional for Firebase callable browser access and must stay paired with handler-level Auth + App Check checks.

## Required Later Milestone: Budget Kill Switch

The automatic billing cutoff discussed in planning is not enabled yet, but it is required before this project becomes heavily used or shared beyond the private owner/tester group. It is intentionally separate because disabling billing is a destructive emergency action: it can stop paid Firebase and Google Cloud resources immediately.

Contract: `docs/contracts/billing-kill-switch-contract.md`

Safer rollout order:

1. Create a Google Cloud budget with email alerts at low thresholds.
2. Add Pub/Sub budget notifications.
3. Add a non-destructive budget monitor function that logs and alerts only.
4. Test Pub/Sub payload handling with sample data.
5. Only after testing, add an optional cutoff mode guarded by an explicit environment flag.
6. Keep the cutoff threshold higher than the alert threshold.

Status: phase 1-3 alert-only safety complete as of 2026-06-26. Budget `$20 Monthly Budget Alert` is connected to Pub/Sub topic `projects/viomacro/topics/viomacro-budget-alerts`, and deployed `billingBudgetMonitor` has logged a sample budget message with `destructiveAction: false`. Hard cutoff code remains deferred until explicitly approved.

## Dependency Audit Gate

Status as of 2026-06-26:

- Non-breaking production audit fixes were applied in `functions/package-lock.json`.
- Production-only audit no longer reports critical/high advisories after that pass.
- `npm.cmd --prefix functions audit --omit=dev` still reports 8 moderate advisories through `firebase-admin` transitive dependencies.
- npm reports the remaining fix as `firebase-admin@14.1.0`, a breaking major upgrade.
- A focused `firebase-admin@14.1.0` trial passed local Functions build, lint, and callable contract tests, but current `firebase-functions` / `firebase-functions-test` peer ranges do not declare Admin SDK v14 support.
- Decision: stay on supported `firebase-admin@13.10.0` for now and accept the 8 moderate advisories for private-alpha work instead of forcing an unsupported peer tree.

Do not force the major upgrade during unrelated work. Revisit the dependency-upgrade pass when Firebase Functions packages declare compatibility with Admin SDK v14:

1. Upgrade `firebase-admin` intentionally.
2. Review breaking changes and peer ranges.
3. Re-run Functions lint, build, callable contract tests, and production-only audit.
4. Log the result in `docs/qa/qa-ledger.md` and close `BUG-010` if resolved.

Required official references:

- Firebase API key guidance: https://firebase.google.com/docs/projects/api-keys
- Firebase App Check for Cloud Functions: https://firebase.google.com/docs/app-check/cloud-functions
- Cloud Billing budget notifications: https://cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications
- Disable billing programmatically: https://cloud.google.com/billing/docs/how-to/modify-project

## Release Gate

Before deploy:

1. Run Functions build.
2. Run frontend build.
3. Smoke test login and AI calls.
4. Confirm App Check tokens are accepted in production and callable Cloud Run public-invoker settings are still paired with handler-level Auth + App Check.
5. Confirm Firebase budget alerts and Pub/Sub budget notifications remain active.
6. Confirm production-only Functions audit is clean or explicitly accepted.
7. Commit and push only after secret scan passes.
