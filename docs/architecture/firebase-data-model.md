# VioMacro Firebase Data Model

Status: Phase 1 structure guidance

This document records the current data boundary that folder-structure work must preserve.

## Canonical User Boundary

All user-owned app data belongs under the signed-in user's document:

```text
users/{uid}
users/{uid}/recipes/{recipeId}
users/{uid}/mealPlans/{planId}
users/{uid}/groceryItems/{itemId}
users/{uid}/pantryItems/{itemId}
users/{uid}/folders/{folderId}
users/{uid}/weightHistory/{dateId}
users/{uid}/usage/{usageId}
```

Do not introduce root app collections such as:

```text
recipes
mealPlans
groceryItems
pantryItems
folders
```

## Storage Boundary

User-uploaded recipe assets belong under:

```text
users/{uid}/recipes/...
```

Recipe import cleanup behavior is part of the private-alpha data-loss contract. Folder moves must preserve failed-parse cleanup, cancel cleanup, and imported draft save behavior.

## Path Helper Direction

The intended future helper location is:

```text
src/services/firebase/paths.ts
```

Add helpers gradually. Do not change live collection paths while introducing helpers.

## Rules And Indexes

Folder cleanup must not edit:

- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`

Semantic search remains deferred until `BUG-009` is explicitly promoted and the live Firestore vector index is created and smoke-tested.
