# VioMacro app guide

VioMacro is a private meal-planning, recipe, grocery and daily-progress app.
Stack: React 19, TypeScript, Vite, Firebase and Playwright. Use Node 22 for CI and Functions.

## Start

Follow Sara's instructions first. Inspect Git status and the diff before editing.
Read README.md, docs/app-contract-roadmap.md and the relevant existing contract.
Use one bounded scope per PR into main. Preserve unrelated user work.
Do not force-push, rewrite history or deploy as part of repository cleanup.

## Local commands

The repository root is the app root.
Run these commands from the current app root (npm.cmd works in PowerShell):

- Install: npm.cmd ci and npm.cmd --prefix functions ci
- Develop: npm.cmd run dev
- Lint, unit tests, app build and Functions checks: npm.cmd run check
- Public smoke: npm.cmd run test:e2e
- Local authenticated QA: npm.cmd run test:e2e:emulator
- Production-build local QA: npm.cmd run test:e2e:prod-emulator
- Hosting artifact: npm.cmd run build:hosting
- Hosting deploy, only after explicit approval: firebase deploy --only hosting

Use emulator/demo values for local tests. Keep secrets, credentials, exports and reports ignored.
Do not use production credentials in local browser tests or run paid AI/provider calls without approval.
Functions/rules/index deploys and production data changes need separate explicit approval.

## Layout and verification

Source lives in src/app, src/features, src/shared, src/services and src/dev.
Every feature owns its pages, components and logic; use nested kind folders only for two or more files.
Use docs/README.md for the documentation index and docs/architecture/folder-structure.md for ownership.
functions/ owns backend code; public/, tests/, scripts/ and docs/ remain at the app root.
Preserve behavior and route URLs during moves; move Firebase config intact and preserve Functions logic.
Use existing contracts, record proof in the QA ledger and confirmed defects in the bug ledger.
Run relevant checks, review the diff and Git status, and report skipped gates before completion.
Never permanently delete prior files: archive under project-root _codex-trash/YYYY-MM-DD/ with relative paths.
Ask before unrelated or irreversible actions. End with full changed paths and commit/push status.
