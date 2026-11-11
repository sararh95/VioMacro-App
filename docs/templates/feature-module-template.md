# VioMacro Feature Module Template

Use this template when creating or migrating a feature under `src/features/{feature-name}/`.

## Recommended Shape

```text
src/features/{feature-name}/
  pages/
  components/
  hooks/
  services/
  schemas/
  types.ts
  README.md
```

Create only the folders the feature needs now.

## Feature README Checklist

```md
# Feature Name

## Route Or Surface

- `/route`

## Owns

- User workflow:
- Main components:
- Data services:

## Does Not Own

- Cross-feature utilities belong in `src/shared/`.
- Firebase setup/path helpers belong in `src/services/firebase/`.
- Provider-backed AI calls belong in `functions/`.

## Verification

- Focused check:
- Contract or ledger:
- Known deferred items:
```

## Migration Checklist

- Keep route URLs unchanged.
- Move imports only for the feature being migrated.
- Do not redesign UI in the same batch.
- Do not change Firestore paths in the same batch.
- Run `npm.cmd run check`.
- Run the smallest relevant Playwright slice.
- Update QA ledger or bug ledger only when behavior, proof, or deferral state changes.
