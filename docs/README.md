# VioMacro documentation

Start with the [project README](../README.md) for installation, commands, and deployment guidance, and [AGENTS.md](../AGENTS.md) for repository working rules.

## Architecture

- [Folder structure](architecture/folder-structure.md): the source and documentation layout.
- [Root hygiene](architecture/root-hygiene.md): tracked files, local exports, and generated output.
- [Firebase data model](architecture/firebase-data-model.md).
- [AI provider boundary](architecture/ai-provider-boundary.md).

## Product contracts

[The contract roadmap](app-contract-roadmap.md) records current workflow status. The ten retained workflow contracts are under [contracts/](contracts/); the six existing page contracts are under [contracts/pages/](contracts/pages/). Pantry remains deferred; no Pantry contract was invented during cleanup.

- [Auth and onboarding](contracts/auth-onboarding-workflow-contract.md).
- [Navigation shell](contracts/navigation-shell-workflow-contract.md).
- [Firebase foundation](contracts/firebase-foundation-contract.md).
- [Recipe import](contracts/recipe-import-workflow-contract.md).
- [Meal plan recognition](contracts/meal-plan-recognition-workflow-contract.md).
- [AI Functions readiness](contracts/ai-functions-readiness-contract.md).
- [AI spend circuit breaker](contracts/ai-spend-circuit-breaker-contract.md).
- [Billing kill switch](contracts/billing-kill-switch-contract.md).
- [Production deploy readiness](contracts/production-deploy-readiness-contract.md).
- [Git checkpoints](contracts/git-checkpoint-contract.md).
- Pages: [Dashboard](contracts/pages/dashboard.md), [Meal Planner](contracts/pages/meal-planner.md), [Groceries](contracts/pages/grocery-shopping-list.md), [Recipes](contracts/pages/recipe-library.md), [Settings](contracts/pages/settings.md), and [Progress](contracts/pages/progress-history.md).

## Verification and open work

- [QA ledger](qa/qa-ledger.md) and [QA audit](qa/QA_AUDIT.md).
- [Browser suite guide](qa/e2e-qa.md) and [exploratory browser playbook](qa/chrome-subagent-page-qa-playbook.md).
- [Bug ledger](bug-ledger.md).
- [Refactor audit](refactor-audit-ledger.md) and [delivery history](delivery-map.json).
- [AI pause](ai-pause.md), [security and cost controls](security-cost-control.md), and [pre-hosting readiness](pre-hosting-readiness.md).

## Design and working documents

- [Moodboard](design/moodboard/README.md) and its [visual index](design/moodboard/index.html).
- [Retained prototype](design/prototype/), including the [blueprint](design/prototype/vio_macro_blueprint_markdown.md) and [product reference](design/prototype/vio_macro_prp_markdown.md). These are design references, not claims about shipped behavior.
- [Decision records](decisions/) and [reusable templates](templates/).

## Historical evidence

Dated QA entries, exact commit allowlists, quoted source excerpts, branch names, and commit IDs record what existed at the time. Their literal paths and line numbers may describe the former Web App/ layout. Clickable local links are retargeted to retained files; this does not recertify an old line number or rewrite commit provenance. Consult Git history for retired files and earlier layouts.
