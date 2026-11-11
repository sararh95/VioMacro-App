# VioMacro folder structure

The repository root is the app root. VioMacro remains one React, TypeScript, Vite, and Firebase app. File organization follows the feature that owns the behavior; route URLs and data contracts do not change with folder moves.

```text
viomacro/
  README.md, AGENTS.md, CLAUDE.md
  package.json, package-lock.json, index.html
  vite.config.ts, tsconfig*.json, eslint.config.js
  tailwind.config.js, postcss.config.js
  playwright*.config.ts
  firebase.json, .firebaserc, firestore.rules
  firestore.indexes.json, storage.rules
  public/
  functions/
    src/
    tests/
  src/
    main.tsx, index.css
    app/
      App.tsx, AppLayout.tsx
      providers/
    features/
      auth/
      dashboard/
        components/
      recipes/
        components/
      meal-planning/
        components/
        lib/
      groceries/
      pantry/
      progress/
        lib/
      settings/
    shared/
    services/
      firebase/
    dev/
      mock/
  tests/
    unit/, e2e/, rules/, fixtures/
  scripts/
  docs/
    README.md
    architecture/, contracts/pages/, decisions/
    design/moodboard/, design/prototype/
    qa/, templates/
    bug-ledger.md
```

## Source ownership

- app/ owns routing, layout, authentication/store providers, and shell wiring.
- features/ owns page behavior and its components, helpers, and services. A feature with one page keeps it at the feature root. Create a components/ or lib/ subfolder only when two or more files need that grouping; do not add empty scaffolding.
- shared/ contains utilities used across features: units, dates, quantities, text, visuals, PDFs, and constants. Keep feature-specific logic with its feature until actual reuse exists.
- services/ contains cross-feature integrations: Firebase setup/path helpers, AI, AI spend, and user persistence. Feature persistence stays with its owning feature.
- dev/ contains ScreenMap and mock fixtures. Existing DEV/internal-QA route conditions remain in force; the directory name alone does not guarantee exclusion from a production bundle.
- tests/ keeps the existing unit, browser, rules, and fixture suites. Functions source and tests remain together under functions/.

## Documentation ownership

[docs/README.md](../README.md) is the documentation index. Workflow contracts live under contracts/; page contracts live under contracts/pages/. QA proof and browser guides live under qa/. The prototype and moodboard are retained under design/. Decisions, templates, the bug ledger, and historical audit/delivery records remain available.

## Verification after a structural change

Run commands from the repository root:

```powershell
npm.cmd ci
npm.cmd --prefix functions ci
npm.cmd run check
npm.cmd run test:e2e
npm.cmd run test:e2e:emulator
npm.cmd run test:e2e:prod-emulator
```

Use [the browser guide](../qa/e2e-qa.md) for local fixture and environment setup. Source moves preserve substantive assertions and source-scanning exclusions. A passing public suite covers signed-out routes; authenticated route proof uses the emulator suites. Keep Firebase project selection, rules, indexes, Hosting configuration, Functions logic, route URLs, and application behavior unchanged during file cleanup. Deployments and live AI calls require separate explicit user approval.
