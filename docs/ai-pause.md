# Pausing and resuming AI

AI is **paused**. Nothing in the app calls a provider, so nothing can be billed.

There are two switches and they are not interchangeable:

| Switch | Where | What it does |
|---|---|---|
| `AI_ENABLED` | Cloud Functions | **Stops the spending.** Every paid feature refuses before it reaches a provider client, a spend reservation, or a usage counter. |
| `VITE_AI_ENABLED` | The web app | **Hides the buttons.** Decides whether AI controls are offered, so a paused app reads as paused instead of throwing when pressed. |

**Both default to OFF.** A missing, empty, or misspelt value leaves AI paused.
Only the exact string `true` enables it — `TRUE`, `1`, `yes` and `true ` with a
trailing space all mean off. That is deliberate: a switch guarding money should
be boring and literal, and a typo in a deploy config should never turn spending
back on.

If the two ever disagree, the backend wins: the user sees a refusal, not a
charge.

## What is paused

All four paid features:

- `generateMealPlan` — the Auto-Generate Week button in the plan wizard
- `parseRecipeFromImage` — Magic Import
- `semanticSearchRecipes` — AI Search on the recipe library
- `generateRecipeEmbedding` — the background trigger that runs on every recipe
  write. This one has **no button**, which makes it the easiest to forget and
  the most likely to keep spending after the UI looks paused.

## Turning it back on

Do these in order. Nothing breaks halfway through, because the app stays paused
until the very last step.

**1. Get a Gemini API key** from Google AI Studio.

**2. Store it as a Firebase secret.** It is read via `defineSecret("GEMINI_API_KEY")`,
so it must live in Secret Manager, not in a file:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

**3. Turn the backend switch on**, in the functions environment
(`functions/.env` for the emulator, or your deploy config for production):

```
AI_ENABLED=true
```

**4. Turn the frontend switch on**, in `.env`:

```
VITE_AI_ENABLED=true
```

**5. Redeploy** the functions and the app.

**6. Check the bill guard before you use it.** See
[AUD-128](refactor-audit-ledger.md) — the daily and per-minute AI caps currently
have **no test coverage at all**, because every test disables them. That is the
one thing standing between a bug and a runaway invoice. Worth fixing before AI
goes live again, not after.

## Revoking the key entirely

Not required to pause AI. With `AI_ENABLED` off, no code path reaches
`createGeminiClient()`, so the key is never used.

All four paid Functions still bind the `GEMINI_API_KEY` secret while paused.
Keep an enabled secret version available for deployment; removing the secret
can block a Functions deploy or prompt for a value even when AI is off.
Revoking or removing the key needs a separate approved release plan that
accounts for those bindings. Turning AI off does not make secret removal safe.

## Verifying it is really off

```bash
npm run check
```

covers the guards in `functions/tests/ai-availability.test.cjs` (the switch
itself), the paused-state specs in `functions/tests/callable-contracts.test.cjs`
(each callable refuses **before** any provider call), and
`tests/unit/ai-paused.test.ts` (no AI button is offered without checking the
flag, and neither default can be loosened to a truthiness check).
