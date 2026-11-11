# VioMacro Moodboard

Design concepts for every page, built from research into the apps that already
solve these problems well.

**Nothing here is app code. No source file was changed.**

## How to open it

Double-click `index.html`. It opens in your browser and links to every board.

If you prefer a local server:

```bash
npx serve docs/design/moodboard
```

## What is inside

| File | Covers |
|---|---|
| `index.html` | **Start here.** The research: which apps were studied, what reviewers praise and complain about, and the measured action-count benchmark that governs every concept. |
| `00-foundations.html` | Palette, type pairing, spacing, motion, and the six laws every screen follows. |
| `01-entry.html` | `/auth` and first-run onboarding. Includes the fix for the metric unit trap. |
| `02-dashboard.html` | `/` — the today column, the honest engine card, and the day-one empty state. |
| `03-recipes.html` | `/recipes`, `/recipes/import`, recipe detail, and cook mode. |
| `04-planner.html` | `/plan` — the week grid, batch cooking as a first-class object, and re-roll. |
| `05-grocery.html` | `/grocery` and `/pantry` — the aisle walk, the plan handoff, and wiring the pantry up. |
| `06-progress.html` | `/progress` and `/settings` — trend over noise, and settings that never guess. |
| `moodboard.css` | Shared styles for these documents. |

## How the research was done

1. **Reviews first.** What people say they feel, in their own words — the
   satisfying tick, the search bar that moves while you type, the app that asks
   too much before it gives anything.
2. **Then the rankings.** Which apps are actually popular, and what each one is
   genuinely best in the world at.
3. **Then the mechanics.** MacroFactor published a measured study counting
   discrete actions for identical logging jobs across every major tracker. That
   turned "feels fast" into a number, so every concept here carries a target
   action count.

Full source links are in the footer of `index.html`.

## The one rule these concepts follow

Every board was written against the audit in
[`docs/refactor-audit-ledger.md`](../../refactor-audit-ledger.md). Where a
concept replaces something broken, it says so and names the finding.

The largest theme: **the app currently invents data in 17 places** — fake
recipes, fake macro targets, a fake expiry date on every pantry item, a
fabricated sentence about the user's own adherence, and a Settings screen that
can write a stranger's body weight into the database as real. Every concept here
replaces an invented value with an honest empty state.

## Status

Concepts only. Nothing is approved, nothing is built. Pick the boards you like
and they become page contracts under `docs/contracts/pages/`.
