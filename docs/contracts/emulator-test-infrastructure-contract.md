# Emulator test infrastructure contract

G6, 2026-10-27. Status: Closed in PR16, merged35c518565a490b55e20872cf6172365d4df4606f; numbered execution/evidence board in docs/qa/fix-loop-2026-10-22.md.

The authenticated QA command must work after the documented clean installs with no private Firebase export, credential or local environment file. It must select the same local project and firebase.json ports in CLI, app, seed and SDK fixtures. Auth, Firestore and Storage are the only services in this lane. AI remains paused; existing AI-flow assertions run only behind scoped fake availability and intercepted callables.

- [x] Reproduce export dependency, project/port drift, UTF-16 ignore and forced/reused AI server on main; investigate dialog/load/favicon reports before classifying them.
- [x] Add behavioral regressions that fail with unchanged source.
- [x] Bootstrap a minimal synthetic onboarding-complete imperial account through ordinary emulator client rules; preserve existing account/data and refuse incompatible seed state.
- [x] Default to fresh emulators; validate optional explicit imports without modifying them. Pin the CLI and document Java/browser prerequisites.
- [x] Own strict-port QA servers with dummy config and no private env loading; retain all prior assertions and paused-UI coverage.
- [x] Run check, public E2E, full authenticated E2E and clean-clone/CI-equivalent proof. Record actual failures, no silent exclusions.
- [x] Chrome desktop/390px, reload and core-page proof, then independent sequential reviews and green CI before merge.

No deployment, live provider, production data, rules/index/schema change or new product feature is part of this contract.
