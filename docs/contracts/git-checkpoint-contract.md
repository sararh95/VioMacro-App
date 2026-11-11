# Git Checkpoint Contract

## Folder migration note (2026-10-22)

Dated entries, exact allowlists, quoted excerpts, commit IDs, and path spellings below are historical evidence. Their source paths and line numbers may refer to the earlier Web App/ layout. Local clickable links now target retained files; this does not recertify old line numbers. Current locations are indexed in [docs/README.md](../README.md).

Date created: 2026-06-26
Historical checkpoint summary: CMD-041 established immutable deployed source `f9769ae7deb1406526cffa43d5c737297c1fdcd1`; CMD-042 published that exact source; CMD-050 completed the Web App-only Stage 6 certification-doc checkpoint as `1d93c16c5eac32b7c7af4b2df0e311fa14d62054` without changing deployed Hosting

## Scope

- Workflow/surfaces: repository hygiene, commit grouping, checkpoint proof, private repo safety.
- Owner files: `docs/contracts/git-checkpoint-contract.md`, `docs/app-contract-roadmap.md`, `docs/qa/qa-ledger.md`, Git index/history.
- Launch tier: Required before Functions-only deploy, Hosting deploy, or major new feature work.
- User goal: Preserve the VioMacro app through small, verified PRs into main while keeping unrelated user files and recoverable retirement backups safe.

## Historical Checkpoint Checklist

1. [x] Map current dirty tree.
   - Outcome: Modified, deleted, and untracked files are categorized by workstream.
   - Verification target: `git status -sb`, `git diff --name-status`, and `git ls-files --others --exclude-standard`.
   - Ledger target: This contract.

2. [x] Define commit groups.
   - Outcome: Web App and Chef GPT changes have separate checkpoint groups unless the user explicitly chooses a single broad ecosystem commit.
   - Verification target: Contract records recommended grouping.
   - Ledger target: This contract.

3. [x] Run checkpoint verification.
   - Outcome: Current app work has build/lint/contract-test proof before any checkpoint commit.
   - Verification target: At minimum `npm.cmd run check` and `npm.cmd run test:functions:contracts` from `Web App/`.
   - Ledger target: QA ledger.

4. [x] Stage only the intended group.
   - Outcome: Git index contains one coherent checkpoint group.
   - Verification target: `git diff --cached --name-status`.
   - Ledger target: This contract.

5. [x] Commit checkpoint group.
   - Outcome: Commit created with a message matching the group scope.
   - Verification target: `git status -sb` and `git log -1 --oneline`.
   - Ledger target: QA ledger.

6. [x] Resolve the second workstream checkpoint.
   - Outcome: Later checkpoint `ae9c8f1 chore: checkpoint before claude audit` includes the remaining Chef GPT work plus Manager coordination/history docs. It is already present on the current upstream branch.
   - Verification target: `git status -sb`.
   - Ledger target: QA ledger.

7. [x] Decide whether to push.
   - Outcome: CMD-041 aligned branch `codex/webapp-folder-structure-v1` with upstream at `f9769ae7deb1406526cffa43d5c737297c1fdcd1`; future pushes still require explicit user approval and do not alter production unless a separate deploy is approved.
   - Verification target: `git status -sb` shows branch relationship after push.
   - Ledger target: QA ledger.

## Current Diagnosis

Verified 2026-10-22: [#2](https://github.com/sararh95/VioMacro/pull/2) closed; [#3](https://github.com/sararh95/VioMacro/pull/3) merged; [#4](https://github.com/sararh95/VioMacro/pull/4) merged; [#5](https://github.com/sararh95/VioMacro/pull/5) merged. The restoration/core/CSP checkpoint is `87915b969c59210b79ed47703a2b9794f362d078`. Retirement [#6](https://github.com/sararh95/VioMacro/pull/6) and root move [#7](https://github.com/sararh95/VioMacro/pull/7) are merged; the root-move checkpoint is `6ce2b0e31a837468d088732bf0ecbee2df9ce8f3`. Feature grouping [#8](https://github.com/sararh95/VioMacro/pull/8) is merged as `be4bdc45108f02f44814930fc1ff95d420730179`.

The earlier claim that main fast-forwarded on 2026-09-27 was unsupported. The current restoration/merge state above comes from verified GitHub metadata, not that claim. PR #2 is closed as superseded by #3.

Retirement, root move and feature grouping are merged. Documentation moves and recoverable retirement of both source placeholders passed all local gates and independent review; exact results are recorded in the QA ledger. CI now runs both clean installs and npm run check on pull requests and pushes to main. Its own PR must pass GitHub Actions before merge. Repository cleanup does not authorize deploys, production mutations or paid provider calls.

Historical completed checkpoint records below retain their original dates, hashes and literal allowlists. They grant no current authority to resume the retired coordination/brain workflow.

## Historical Checkpoint Diagnosis

Proven:

- Release CMD-037 and independent Manager review confirmed branch `codex/webapp-folder-structure-v1` and upstream are aligned at `fe48d25` with `0 0` divergence.
- The accepted 13-file Web App candidate is committed and pushed. Unrelated Chef GPT modifications and untracked skill work remained outside the checkpoint.
- CMD-039/CMD-040 closed BUG-030 locally. Prod-emulator output is isolated, the Hosting artifact verifier passes clean production output and rejects all four emulator classes, production hashes remain stable, prod-emulator passed 4/4 twice, public E2E passed 18/18 twice, and unrestricted full checks/final Hosting builds passed.
- Release CMD-041 and independent Manager review confirmed the exact 11-file artifact-hardening scope, exact commit message, one normal push, and local/upstream equality at `f9769ae7deb1406526cffa43d5c737297c1fdcd1` with `0 0` divergence.
- Release CMD-042 and independent Manager review confirmed the deployed source remained exact `f9769ae`, the detached worktree stayed tracked-clean, and the Hosting-only deploy did not alter the checkpoint or coordination branch.
- `git diff 053c956..ae9c8f1` shows no change under Web App runtime source, Functions, Firebase config, package files, or tests.
- The final accepted Stage 5 local baseline passed Functions contracts 62/62 and the Manager's post-change `npm.cmd run check`.
- Chef GPT knowledge module replacements are visible as old numbered module deletions plus new condensed module files.

## Completed Stage 5 Checkpoint

Exact 13-file allowlist:

1. `Web App/docs/ai-spend-circuit-breaker-contract.md`
2. `Web App/docs/app-contract-roadmap.md`
3. `Web App/docs/billing-kill-switch-contract.md`
4. `Web App/docs/bug-ledger.md`
5. `Web App/docs/command-room.md`
6. `Web App/docs/git-checkpoint-contract.md`
7. `Web App/docs/manager-roadmap-checklist.md`
8. `Web App/docs/page-contracts/settings.md`
9. `Web App/docs/production-deploy-readiness-contract.md`
10. `Web App/docs/qa-ledger.md`
11. `Web App/docs/security-cost-control.md`
12. `Web App/src/components/AiSpendSafetyPanel.tsx`
13. `Web App/tests/e2e/emulator-auth.spec.ts`

- CMD-037 excluded every Chef GPT path, `codex_handoff.md`, ignored environment/secrets, Firebase exports, test results/screenshots/reports, generated output, and temporary worker report.
- Release created one deliberate commit with exact message `chore: checkpoint in-app ai spend safety` and used one normal push after explicit user approval.
- Before commit, Release refreshed `npm.cmd run check`, mocked Functions contracts, and the focused mocked AI Safety group; confirmed the exact staged 13-file list; passed `git diff --cached --check`; and passed secret/config hygiene review.
- Commit `fe48d25f87622431a39a38560cc92ec277e7bca9` does not authorize Functions, rules, indexes, Hosting, email, provider, billing, production, activation, or live-AI work.

## Completed Artifact-Hardening Checkpoint

CMD-041 completed this checkpoint. It granted exact staging, one commit, and one normal push only; it granted no deploy, cloud, production, provider, package, or live-AI authority.

Exact 11-file allowlist:

1. `Web App/docs/ai-spend-circuit-breaker-contract.md`
2. `Web App/docs/app-contract-roadmap.md`
3. `Web App/docs/bug-ledger.md`
4. `Web App/docs/command-room.md`
5. `Web App/docs/git-checkpoint-contract.md`
6. `Web App/docs/manager-roadmap-checklist.md`
7. `Web App/docs/production-deploy-readiness-contract.md`
8. `Web App/docs/qa-ledger.md`
9. `Web App/package.json`
10. `Web App/playwright.prod-emulator.config.ts`
11. `Web App/scripts/verify-hosting-artifact.mjs`

Commit message:

`fix: protect hosting artifacts from emulator builds`

Checkpoint gate:

- Passed. Both temporary CMD-039/CMD-040 reports were absent.
- Passed. The staged list was exactly 11 files with no Chef GPT, environment, generated output, package-lock, Firebase config/rules/indexes, Functions, app runtime source, or test file.
- Passed. `node --check`, unrestricted `npm.cmd run build:hosting`, scoped/cached whitespace checks, complete diff review, and secret/config hygiene were green.
- Passed. Commit `f9769ae7deb1406526cffa43d5c737297c1fdcd1` was pushed once; no Actions workflow, deploy, provider action, production access, package action, or live AI ran.

## Completed Stage 6 Certification Checkpoint

CMD-050 completed one documentation-only commit and one normal push on the existing branch after accepted CMD-048 and CMD-049. It granted no deploy, production, Firebase/cloud, provider, billing, AI, package, runtime, test, or data-mutation action.

Exact seven-file allowlist:

1. `Web App/docs/app-contract-roadmap.md`
2. `Web App/docs/auth-onboarding-workflow-contract.md`
3. `Web App/docs/git-checkpoint-contract.md`
4. `Web App/docs/navigation-shell-workflow-contract.md`
5. `Web App/docs/page-contracts/dashboard.md`
6. `Web App/docs/page-contracts/settings.md`
7. `Web App/docs/qa-ledger.md`

Exact commit message:

`docs: checkpoint stage 6 auth and settings certification`

Checkpoint boundary:

- Exclude `Web App/docs/command-room.md` and `Web App/docs/manager-roadmap-checklist.md` because they are live Manager coordination files.
- Exclude `Web App/.gitignore`; its current brain-preparation and general-ignore edits are not part of the pre-brain certification checkpoint and require later independent review.
- Exclude every temporary CMD report, ignored screenshot, Chef GPT path, `codex_handoff.md`, runtime/config/test/package/Firebase path, environment file, generated artifact, and unrelated dirty file.
- Reuse accepted CMD-048 focused 7/7 and CMD-049 focused 5/5 plus Browser evidence. This docs-only checkpoint requires scoped diff review, `git diff --cached --check`, staged secret/private-data/local-path hygiene, exact allowlist proof, one commit, one push, and `0 0` upstream divergence; it must not rerun app, emulator, browser, AI, or production checks.
- Gate result: passed. Commit `1d93c16c5eac32b7c7af4b2df0e311fa14d62054` has the exact message and exact seven-file tree; one normal push succeeded without retry; local/upstream equality and divergence `0 0` were independently confirmed by the Manager.
- No app check, test, Browser, emulator, package, Firebase/cloud, production, provider/billing, or AI action ran. The temporary Release report was distilled and deleted after Manager acceptance.

## Historical Recommended Commit Groups

The groups below record the original 2026-06-26 checkpoint plan. Current branch state is described above and in the proof section.

Group A - Web App stabilization and launch-readiness:

- `Web App/README.md`
- `Web App/docs/`
- `Web App/firestore.indexes.json`
- `Web App/firestore.rules`
- `Web App/functions/`
- `Web App/package.json`
- `Web App/package-lock.json`
- `Web App/src/`
- `Web App/tests/`

Recommended message:

`chore: checkpoint viomacro launch readiness`

Group B - Chef Professional AI GPT package:

- `Chef Professional AI GPT/`

Recommended message:

`chore: checkpoint chef gpt knowledge pack`

## Historical Verification Plan

1. Run Web App local verification before Group A commit.
2. Check staged file list before commit.
3. Commit Group A first because it unblocks Functions-only deploy proof.
4. Review Chef GPT staged file list separately because it includes deliberate module replacement/deletion.
5. Commit Group B only after confirming the upload-pack restructuring is intended.

## Current Proof

- 2026-06-26 historical checkpoint evidence: `git status -sb` showed many modified/untracked files across Web App and Chef GPT.
- 2026-06-26 historical checkpoint evidence: `git diff --name-status` confirmed tracked Chef GPT module deletions and Web App source/docs changes.
- 2026-06-26 historical checkpoint evidence: `git ls-files --others --exclude-standard` confirmed new Chef GPT condensed modules, Web App contract docs, Functions tests, date utilities, and rules tests.
- 2026-06-26 Web App verification:
  - `npm.cmd run check`: passed outside sandbox after the sandboxed Vite/esbuild run hit an access-denied config-read issue.
  - `npm.cmd run test:functions:contracts`: passed, 19 tests.
  - Secret-pattern scan found placeholders/examples and scan documentation only; no live key pattern was found in app source.
  - Billing monitor scan found `destructiveAction: false` and no billing unlink implementation.
- 2026-06-26 Web App staging review:
  - `git diff --cached --name-status` showed only `Web App/` files.
  - Chef Professional AI GPT files remained unstaged for a separate checkpoint.
- 2026-06-26 Web App checkpoint commit:
  - Commit message: `chore: checkpoint viomacro launch readiness`.
  - Scope: `Web App/` only.
  - Chef Professional AI GPT changes remained uncommitted for a separate checkpoint.
- 2026-07-08 Web App private-alpha checkpoint `5503240` and docs-cleanup checkpoint `053c956` were committed and pushed on `codex/webapp-folder-structure-v1` after scoped Release review.
- 2026-07-09 CMD-011 opening check confirmed local and upstream at `ae9c8f1`; the later checkpoint contains Chef GPT plus Manager coordination/history docs and no Web App runtime or Firebase config change after `053c956`.
- 2026-07-09 CMD-012 committed and pushed exactly six stable Hosting runbook/ledger docs as `541a7f2 docs: checkpoint hosting deploy rollback runbook`; local and upstream were independently confirmed equal afterward.
- 2026-07-09 CMD-013 fresh full local regression passed at `541a7f2`, and CMD-014 deployed the build generated from that checkpoint to Firebase Hosting only. The deploy did not commit, push, or alter the Git checkpoint.
- 2026-07-10 CMD-028 passed the exact unrestricted `npm.cmd run check` and mocked Functions contracts 62/62, staged 27 Web App-only files, classified secret-scan hits as placeholders, committed `464d404 chore: checkpoint ai spend safety baseline`, and pushed once. Manager independently confirmed local/upstream equality at the full commit hash with `0 0` ahead/behind.
- 2026-07-11 CMD-032/CMD-033 accepted the in-app-only AI pause UI cleanup; Manager check passed and independent focused mocked QA passed 5/5.
- 2026-07-11 CMD-034 accepted the final checkpoint/Hosting/provider/activation/status/canary packet sequence and reconfirmed backend/config parity plus branch/upstream alignment at `464d404`.
- 2026-07-11 CMD-035/CMD-036 closed BUG-029: Manager check passed, Builder corrected focused proof passed 5/5, and independent QA passed 5/5 with zero live/provider action.
- 2026-07-11 CMD-037 passed the unrestricted full check, mocked Functions contracts 62/62, and focused mocked AI Safety 5/5; committed exactly the 13-file allowlist as `fe48d25 chore: checkpoint in-app ai spend safety`; pushed once; and ended at `0 0` local/upstream divergence.
- 2026-07-11 CMD-039/CMD-040 closed BUG-030 locally with isolated prod-emulator output, exact five-file manifest stability, four-class red proof, clean production green proof, prod-emulator 4/4 twice, public E2E 18/18 twice, unrestricted full checks, and final Hosting builds. No commit or push occurred.
- 2026-07-11 CMD-041 committed exactly the 11-file artifact-hardening/incident-closure allowlist as `f9769ae fix: protect hosting artifacts from emulator builds`, pushed once, and ended with exact local/upstream equality and `0 0` divergence. No deploy, cloud/provider, production, package, or live-AI action occurred.
- 2026-07-12 CMD-042 deployed Hosting only from a clean detached worktree at exact `f9769ae`, published live version `762e5b25bfb28e0c`, and passed Release plus Manager signed-out smoke. No stage, commit, push, or other Git action occurred.
- 2026-07-12 CMD-047 reviewed exactly nine durable Stage 5 documentation files, committed them as `c7df65f6db27b094eaf772e8489d8e34e8059dd3 docs: close stage 5 ai spend safety`, pushed once, and ended at exact `0 0` local/upstream divergence. The live command room, Manager checklist, Chef GPT, temporary report, runtime/config/tests, deploys, production, provider/billing actions, and live AI were excluded.
- 2026-07-13 CMD-050 committed exactly seven accepted Stage 6 certification documents as `1d93c16c5eac32b7c7af4b2df0e311fa14d62054 docs: checkpoint stage 6 auth and settings certification`, pushed once, and ended at exact `0 0` local/upstream divergence. `.gitignore` brain preparation, live Manager files, temporary reports, screenshots, Chef GPT, runtime/config/tests, deploys, production, provider/billing, and AI were excluded.

## Open Bugs And Deferrals

- Cleanup changes repository organization and contributor guidance; it does not close product bugs.
- Retirement, root-move, feature-grouping and CI-addition local checks passed. GitHub Actions results are recorded on the CI PR.
- Deploys, live AI/provider calls and production data changes require separate explicit approval.

## Next Action

Use the latest main and its GitHub Actions result for new work. Keep future VM bug fixes in separate focused PRs and require passing checks before merge. Future deployment, provider configuration, live AI and production data access remain separately approval-gated.
