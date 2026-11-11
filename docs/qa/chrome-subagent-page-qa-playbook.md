# Chrome And Subagent Page QA Playbook

Status: Active playbook
Created: 2026-06-26

Use this playbook when a page, workflow, or deploy-readiness gate needs a real-browser sanity pass without turning browser testing into chaos.

## Core Rule

Use Chrome as the human-reality probe, not the proof spine.

Playwright remains the repeatable proof spine. Chrome and subagents are for finding hidden friction: dead controls, misleading copy, modal traps, browser-only console errors, confusing routes, and workflow holes that static review or route smoke can miss.

## Operating Model

Use one Browser Captain and separate read-only scouts.

- Browser Captain: one agent controls Chrome, one tab, one account, one page or workflow at a time.
- Contract Scout: reads the page contract, bug ledger, QA ledger, and tests; returns what must be verified.
- Red-Team Scout: looks for false passes, dead controls, overlays, misleading Coming Soon states, console traps, and privacy/cost risks.
- Code/Test Scout: maps existing selectors, tests, services, and likely regression targets.
- Manager: consolidates findings into fixes, accepted deferrals, bug ledger entries, QA proof, or page-contract tasks.

Do not let multiple agents click the same Chrome browser in parallel. Shared browser state creates false failures and false passes.

## When To Use

Use this lane for:

- Closing a page contract.
- Starting a risky page contract.
- Production deploy readiness.
- A user-reported "it looks broken" flow.
- Pages with many buttons, modals, uploads, AI calls, or Coming Soon states.
- Any area where the user specifically asks whether buttons actually work.

Skip this lane for:

- Pure copy changes.
- Tiny CSS-only fixes that are covered by a screenshot or build.
- Backend-only contract tests with no page surface.

## Preflight

Before Chrome opens:

1. Read the owning contract or create one if it does not exist.
2. Read `docs/bug-ledger.md`.
3. Read `docs/qa/qa-ledger.md`.
4. Identify the account and data source:
   - Prefer emulator user/data.
   - Use production only with explicit approval.
5. List forbidden actions:
   - No live AI/provider spending unless approved.
   - No Google sign-in unless approved.
   - No Hosting deploy.
   - No production data mutation unless approved.
6. Define the stop condition:
   - P0/P1 blocker found.
   - Auth/App Check/Firestore failure found.
   - Browser control becomes unreliable.
   - Page contract evidence is complete.

## Scout Prompts

Contract Scout:

Read-only scout. Inspect the owning page/workflow contract, roadmap, bug ledger, QA ledger, and Playwright tests. Do not edit files. Return the highest-value Chrome assertions for this page/workflow, known accepted deferrals, and anything that should become a regression test if broken.

Red-Team Scout:

Read-only adversarial scout. Pressure-test this page/workflow. Find false-pass traps, active-looking dead controls, misleading copy, modal/overlay risks, console/network warnings that matter, privacy/cost risks, and deferred items that should not block. Do not edit files. Return a concise bug-hunting checklist.

Code/Test Scout:

Read-only scout. Inspect the component, service layer, routes, and tests for this page/workflow. Do not edit files. Return likely selectors, existing coverage, missing regression targets, and any implementation detail the Browser Captain should verify carefully.

## Browser Captain Checklist

For each route:

1. Start from the allowed environment.
2. Confirm auth state and account type.
3. Direct-load the route.
4. Verify the exact URL.
5. Verify body-scoped or `main`-scoped page heading and primary content.
6. Verify no blank root, framework overlay, or blocking modal exists.
7. Capture console errors and warnings.
8. Identify visible primary controls.
9. Click each active-looking primary control once, unless it is forbidden.
10. After each click, verify one concrete result:
    - URL changed.
    - Modal opened.
    - Toast or alert appeared.
    - Data row appeared/disappeared.
    - Button became disabled for an honest reason.
    - State persisted after reload.
11. Confirm Coming Soon controls are disabled or clearly passive.
12. Reload or direct-route once when persistence matters.
13. Record the result.

Do not count sidebar text as page proof. Page proof needs route URL plus `main` content or another body-scoped target.

Do not count a screenshot alone as proof. Pair it with URL, DOM/state, console, and the expected outcome.

## Evidence Format

Use this format in the QA ledger or page contract:

- Date:
- Mode: Chrome/manual, subagent scouts, emulator, production-build emulator, or live.
- Route/workflow:
- Account/data source:
- Steps:
- Works:
- Broken:
- Console/network:
- Screenshots/traces if relevant:
- Decision:
- Follow-up:

## Classification

Use these buckets:

- Works and already covered by Playwright.
- Works but needs regression coverage.
- Broken and must fix now.
- Broken but accepted/deferred with bug ledger entry.
- Coming Soon and honest.
- Coming Soon but too live-looking.
- Ambiguous; needs source inspection or a narrower repro.

Fix now:

- Data loss or corruption.
- Auth, privacy, rules, secrets, upload security.
- Broken launch-critical route or workflow.
- Production cost/API-spend risk.
- Active-looking dead control in a launch-critical workflow.
- Modal/overlay that traps navigation.
- Console error paired with broken UI, missing data, or stuck loading.

Defer with ledger:

- Non-critical polish.
- Feature not in private-alpha scope.
- Known accepted dependency warning.
- Known chart warning with no visible breakage.
- Feature intentionally marked Coming Soon.

## Patch Loop

When a finding needs code:

1. Patch only the smallest owner files.
2. Add or update a Playwright regression when the bug can return silently.
3. Run the page-specific or closest reliable test.
4. Run broader tests when closing a contract or deploy gate.
5. Update the bug ledger and QA ledger.
6. Commit only after the proof is current.

Recommended batch size: three to four fixes maximum before rerunning tests. Smaller is better for launch-critical pages.

## VioMacro Current Deferrals

These are not private-alpha blockers unless their behavior changes:

- Pantry remains deferred unless promoted by the user.
- Semantic search live vector index remains deferred.
- Valid live AI provider smoke requires explicit approval.
- Billing hard cutoff remains deferred until explicitly approved.
- Dashboard Recharts warning remains `BUG-013` unless the chart is visibly broken or the warning hides new errors.
- Moderate Functions dependency advisories remain accepted for private alpha under `BUG-010`.

## Source Basis

- Playwright Best Practices: test user-visible behavior, isolate tests, avoid testing third-party dependencies, and use resilient locators.
- Playwright Locators: prefer user-facing locators and stable contracts over brittle CSS.
- Playwright Fixtures and Page Object Models: use fixtures and page models when repeatable flows grow.
- Chrome DevTools Recorder: useful for recording and replaying user flows, but not a substitute for contract-owned tests.
- Testing Library Guiding Principles: tests should resemble how users interact with the app.

Sources:

- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/locators
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/pom
- https://developer.chrome.com/docs/devtools/recorder
- https://testing-library.com/docs/guiding-principles
