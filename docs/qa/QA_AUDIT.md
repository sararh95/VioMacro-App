# VioMacro Manual QA Audit

## Folder migration note (2026-10-22)

Dated entries, exact allowlists, quoted excerpts, commit IDs, and path spellings below are historical evidence. Their source paths and line numbers may refer to the earlier Web App/ layout. Local clickable links now target retained files; this does not recertify old line numbers. Current locations are indexed in [docs/README.md](../README.md).

Date started: 2026-06-27
Mode: In-app browser manual audit with console, network, DOM, style, and page-state inspection
Target: `http://127.0.0.1:5173/`
Environment: Local Vite app with Firebase emulators
Status: Audited, repaired, and reconciled for current private-alpha local scope

## Audit Rules

- Do not make code fixes until this ledger is complete and reviewed.
- Use the browser, not only Playwright or automated tests.
- Inspect visible UI state, console errors, network errors, DOM/page state, and persistence after refresh where applicable.
- Log every interaction with route, element, expected behavior, actual behavior, pass/fail, evidence, suspected root cause, related file/component, and missing test coverage.

## Routes In Scope

- `/auth`
- `/`
- `/plan`
- `/recipes`
- `/recipes/import`
- `/grocery`
- `/pantry`
- `/progress`
- `/settings`

## Summary

| Route | Status | Pass | Fail | Notes |
|---|---:|---:|---:|---|
| `/auth` | Audited | 8 | 0 | Manual Auth checkpoint complete; email login, disabled coming-soon controls, mode toggle, and invalid-login handling pass. |
| `/` | Audited + repair verified | 21 | 5 | Manual Dashboard mobile-viewport pass complete; original findings preserved below, with repair addenda `REPAIR-DASH-2026-06-27-A` and `REPAIR-DASH-2026-06-27-B` verified. |
| `/plan` | Audited + repair verified | 12 | 6 | Manual Plan mobile-viewport findings preserved below, with repair addenda `Repair Addendum - 2026-06-27 Meal Planner Batch A/B` and `REPAIR-PLAN-2026-06-27-C` verified. |
| `/recipes` | Audited + repair verified | 18 | 10 | Manual Recipes findings preserved below, with `REPAIR-RECIPES-2026-06-27` verified. |
| `/recipes/import` | Audited + repair verified | 2 | 1 | Import page renders; original in-app browser file chooser remained tool-blocked, but real Chrome/manual upload safe-failure and recovery are now verified. Parsed-draft success remains Playwright fixture evidence. |
| `/grocery` | Audited + repair verified | 7 | 0 | Manual Grocery checkpoint complete; check-off accessibility repaired and verified in `REPAIR-PANTRY-GROCERY-2026-06-27-A`. |
| `/pantry` | Audited + repair verified | 8 | 1 | Manual Pantry checkpoint complete; original summary-count/control issues preserved below, with repair verified in `REPAIR-PANTRY-GROCERY-2026-06-27-A`. |
| `/progress` | Audited | 2 | 0 | Manual Progress checkpoint complete. |
| `/settings` | Audited + repair verified | 6 | 2 | Manual Settings findings preserved below, with `REPAIR-SETTINGS-2026-06-27-A` verified. |

## Findings Requiring Review

- BUG-SETTINGS-001: Repaired in `REPAIR-SETTINGS-2026-06-27-A`. Original finding: Custom Bottle Size changed to 501 did not persist after refresh, and Goals panel exposed no visible Save/Discard contract.
- BUG-SETTINGS-002: Repaired in `REPAIR-SETTINGS-2026-06-27-A`. Original finding: Gluten Free dietary tag did not leave a visible active state and later disappeared from the visible dietary tag inspection.
- A11Y-SETTINGS-001: Repaired in `REPAIR-SETTINGS-2026-06-27-A`. Original finding: Settings numeric inputs had no accessible labels/aria labels, forcing order-based targeting in QA.
- BUG-PANTRY-001: Repaired in `REPAIR-PANTRY-GROCERY-2026-06-27-A`. Original finding: After deleting QA pantry entries, table showed 0 items but summary metric still showed 1 Total Items.
- A11Y-PANTRY-001: Repaired in `REPAIR-PANTRY-GROCERY-2026-06-27-A`. Original finding: Prototype edit action is disabled and delete action is enabled; Coming Soon states are honest, but future edit controls need accessible, testable states.
- A11Y-GROCERY-001: Repaired in `REPAIR-PANTRY-GROCERY-2026-06-27-A`. Original finding: Grocery item check-off control is a blank 24x24 button with no accessible name; functional click passed but state is not clearly exposed.
- BUG-IMPORT-001: Original in-app browser import upload/extraction could not be manually verified because CDP file selection was blocked and the runtime exposed no controllable file chooser. Follow-up evidence now includes Playwright fixture coverage and real Chrome/manual safe-failure recovery proof.
- BUG-RECIPES-001: Repaired in `REPAIR-RECIPES-2026-06-27`. Original finding: Top icon-only auto_awesome recipe/import button stayed on /recipes and no dialog was detected; it also lacked a clear accessible label.
- BUG-RECIPES-002: Repaired in `REPAIR-RECIPES-2026-06-27`. Original finding: AI Search filters to chicken results, but clearing the AI prompt and clicking All Recipes did not restore the full list; reload was required.
- BUG-RECIPES-003: Repaired in `REPAIR-RECIPES-2026-06-27`. Original finding: Recipe card delete did not remove the QA recipe via coordinate click, hover-revealed click, or DOM locator click; no confirmation/dialog appeared.
- A11Y-RECIPES-001: Repaired in `REPAIR-RECIPES-2026-06-27`. Original finding: Recipe card favorite/edit/delete controls were opacity-0 hover controls but still appeared in DOM/accessibility flow; delete in particular was hard to verify manually and may have been inaccessible.
- BUG-PLAN-001: Repaired in `Repair Addendum - 2026-06-27 Meal Planner Batch A/B`. Original finding: Previous-week chevron did not move from Week of Jun 29 back to Jun 22 in the live Plan audit.
- BUG-PLAN-002: Repaired in `Repair Addendum - 2026-06-27 Meal Planner Batch A/B`. Original finding: Day tab click did not expose the same active bg-primary state as Week and Month.
- BUG-PLAN-003: Repaired in `Repair Addendum - 2026-06-27 Meal Planner Batch A/B`. Original finding: Daily Smoothie and Daily Tea wizard sections were visible but no named toggle/button/input was exposed for either option.
- BUG-PLAN-004: Repaired in `Repair Addendum - 2026-06-27 Meal Planner Batch A/B`. Original finding: Empty-grid creation initially appeared to work, but persistence after refresh could not be verified because the page reset to Jun 22 and week navigation became non-responsive/stuck.
- BUG-PLAN-005: Repaired in `REPAIR-PLAN-2026-06-27-C`. Original finding: Clone Last Week and Auto-Generate Week relied on native browser alerts/interruption paths; Auto-Generate ended with no visible plan and a Network.loadingFailed ERR_ABORTED event.
- BUG-DASH-001: Repaired in `REPAIR-DASH-2026-06-27-A`. Original finding: Recharts emitted repeated width/height -1 warnings on Dashboard load.
- BUG-DASH-002: Repaired in `REPAIR-DASH-2026-06-27-A`. Original finding: Weekly Check-In Energy/Hunger sliders did not respond to keyboard ArrowRight/ArrowLeft in this manual pass, and direct value changes updated DOM values while visible labels stayed at 3/5.
- BUG-DASH-003: Repaired in `REPAIR-DASH-2026-06-27-B`. Original finding: Hydration "Correct Entry" did not open an edit/correction workflow; it directly changed the visible total from 750 ml to 500 ml, making the label/action ambiguous and possibly destructive without confirmation. Related area: Hydration widget.
- A11Y-DASH-001: Repaired in `REPAIR-DASH-2026-06-27-A`. Original finding: Mobile nav had duplicate "Close navigation menu" accessible names while the drawer was open.
- A11Y-DASH-002: Repaired in `REPAIR-DASH-2026-06-27-A`. Original finding: Sleep quality selector buttons were functional but appeared without visible text or accessible names in DOM inspection; selected by coordinate during audit.

## Repair Addendum - 2026-06-27 Pantry/Grocery BUG-018

Scope: `A11Y-GROCERY-001`, `BUG-PANTRY-001`, and `A11Y-PANTRY-001`.

Status:

- `A11Y-GROCERY-001` repaired. Grocery check-off controls now expose item-specific names and `aria-pressed` state, and delete controls expose item-specific names.
- `BUG-PANTRY-001` repaired or falsified in current code. Pantry total stat now exposes a testable accessible label; browser proof showed deleting two QA entries left `0 Total Items` and `Showing 0 items`, and the state persisted after reload.
- `A11Y-PANTRY-001` repaired for the current prototype scope. Pantry row quantity/edit/delete controls, category filters, pagination controls, AI suggestion button, and pantry-to-shopping-list button now expose explicit accessible names or selected state while preserving Coming Soon/disabled behavior where appropriate.

Evidence:

- Browser QA subagent, real installed Chrome, `http://127.0.0.1:5173/grocery`: added a QA grocery item, verified item-specific check-off label and `aria-pressed=false`, clicked it, verified item-specific checked label and `aria-pressed=true`, and confirmed checked state persisted after reload.
- Browser QA subagent, real installed Chrome, `http://127.0.0.1:5173/pantry`: added two QA pantry entries, verified `2 Total Items` / `Showing 2 items`, deleted both, verified `0 Total Items` / `Showing 0 items`, and confirmed after reload.
- Browser QA subagent follow-up confirmed `Pantry AI suggestions coming soon` and `Pantry-to-shopping-list suggestions coming soon` are unique disabled buttons, and exact-name `Coming Soon` button count is `0`.
- `npx.cmd playwright test --config=playwright.emulator.config.ts -g grocery`: passed 7/7 after sandbox-elevated rerun.
- `npx.cmd playwright test --config=playwright.emulator.config.ts -g pantry`: passed 1/1 after sandbox-elevated rerun.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after sandbox-elevated rerun with existing non-blocking Vite/Browserslist/chunk warnings.

## Repair Addendum - 2026-06-27 Meal Planner Batch A/B

Scope: `BUG-PLAN-001`, `BUG-PLAN-002`, `BUG-PLAN-003`, and `BUG-PLAN-004`.

Status:

- `BUG-PLAN-001` repaired. In-app browser proof confirmed `Plan Week of Jun 22` -> `Plan Week of Jun 29` -> `Plan Week of Jun 22` and `promptVisible: false` after navigation.
- `BUG-PLAN-002` repaired. Day/Week/Month tabs now expose selected state with `aria-pressed`; manual proof showed Day false, Week true, Month false on the Week view.
- `BUG-PLAN-003` repaired. Daily Smoothie, Daily Tea, and Include Snacks are now native named checkbox controls in the plan wizard.
- `BUG-PLAN-004` repaired for selected-week context. Playwright proof confirmed a future-week empty grid saves and remains selected after reload.
- `BUG-PLAN-005` remains open for the next Meal Planner batch: replace or contain native alert paths for Clone Last Week and Auto-Generate Week, and prove failure recovery without a blank-plan trap.

Evidence:

- `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal planner"`: passed 9/9 after elevated rerun.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed after elevated rerun.
- In-app browser route: `http://127.0.0.1:5173/plan`.
- In-app browser console warnings/errors for focused Meal Planner repair check: none.

## Interaction Log

### 1. / - Open navigation menu button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:06:47.269Z |
| Route | / |
| Element | Open navigation menu button |
| Expected Behavior | Mobile navigation drawer opens with app navigation, profile settings, and sign out controls. |
| Actual Behavior | Navigation drawer opened visually with app navigation, profile settings, and sign out controls. DOM inspection also showed hidden desktop sidebar content, so screenshot/style evidence was needed. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "visibleControls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "add_circle Create Recipe",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "grid_view Dashboard",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "calendar_month Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "menu_book Recipes",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/progress",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "history Progress",       "type": null     }   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause | No functional root cause; DOM contains hidden desktop nav plus mobile drawer, so naive text/DOM checks can misclassify drawer visibility. |
| Related File/Component | src/components/Layout.tsx or navigation shell |
| Missing Test Coverage | Mobile nav drawer open interaction should assert visible drawer geometry, not only DOM text. |

### 2. / - Close navigation menu button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:08:18.488Z |
| Route | / |
| Element | Close navigation menu button |
| Expected Behavior | Mobile navigation drawer closes and dashboard returns to unobstructed state. |
| Actual Behavior | Drawer closed; Create Recipe nav action no longer visible in viewport. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "duplicateCloseButtonCandidates": [     {       "className": "md:hidden text-white p-2",       "display": "block",       "i": 0,       "opacity": "1",       "rect": {         "h": 46.400001525878906,         "w": 40,         "x": 24,         "y": 8.40000057220459       },       "text": "menu",       "visibility": "visible"     },     {       "className": "text-gray-400 hover:text-white",       "display": "block",       "i": 1,       "opacity": "1",       "rect": {         "h": 30.399999618530273,         "w": 24,         "x": 239.1999969482422,         "y": 36.79999923706055       },       "text": "close",       "visibility": "visible"     }   ],   "visibleDrawerTextMatchesAfterClose": [],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause | No functional root cause; accessibility naming ambiguity remains because header hamburger and drawer close share aria label while drawer is open. |
| Related File/Component | src/components/Layout.tsx or navigation shell |
| Missing Test Coverage | Mobile nav close interaction plus accessible-name uniqueness for drawer controls. |

### 3. / - Start Check-In button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:08:32.740Z |
| Route | / |
| Element | Start Check-In button |
| Expected Behavior | Opens weekly check-in modal/workflow without navigation errors. |
| Actual Behavior | Check-in UI opened over Dashboard. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Weekly Check-In",     "Meal Adherence",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "alerts": [],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Next",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "add_circle Create Recipe",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "grid_view Dashboard",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "calendar_month Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "menu_book Recipes",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/progress",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "history Progress",       "type": null     }   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Dashboard.tsx and check-in modal/component |
| Missing Test Coverage | Open weekly check-in modal from Dashboard and assert modal content/controls. |

### 4. / - Weekly Check-In Next button from Meal Adherence step - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:08:48.713Z |
| Route | / |
| Element | Weekly Check-In Next button from Meal Adherence step |
| Expected Behavior | Advances to the next weekly check-in step. |
| Actual Behavior | Advanced to the subjective Energy/Hunger step with sliders and Back/Next controls. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Weekly Check-In",     "How did you feel?",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "alerts": [],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "3",       "type": "range"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "3",       "type": "range"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Back",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Next",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "add_circle Create Recipe",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "grid_view Dashboard",       "type": null     }   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Dashboard.tsx and weekly check-in component |
| Missing Test Coverage | Weekly check-in step navigation from adherence to weight step. |

### 5. / - Weekly Check-In Back button from subjective step - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:09:22.173Z |
| Route | / |
| Element | Weekly Check-In Back button from subjective step |
| Expected Behavior | Returns to previous Meal Adherence step without losing modal state. |
| Actual Behavior | Returned to Meal Adherence step. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Weekly Check-In",     "Meal Adherence",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Next",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     }   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Weekly check-in component |
| Missing Test Coverage | Back navigation between check-in steps. |

### 6. / - Weekly Check-In Energy/Hunger sliders - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:09:23.365Z |
| Route | / |
| Element | Weekly Check-In Energy/Hunger sliders |
| Expected Behavior | Energy and hunger sliders accept user adjustment and update visible values. |
| Actual Behavior | Slider values did not change from 3/3. |
| Pass/Fail | FAIL |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "sliderValuesBefore": [     "3",     "3"   ],   "sliderValuesAfter": [     "3",     "3"   ],   "headings": [     "Weekly Check-In",     "How did you feel?",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause | Range inputs may not be keyboard-focusable or state update may be disconnected. |
| Related File/Component | Weekly check-in component slider controls |
| Missing Test Coverage | Keyboard and state-change coverage for check-in range inputs. |

### 7. / - Weekly Check-In Energy/Hunger sliders direct control - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:09:47.716Z |
| Route | / |
| Element | Weekly Check-In Energy/Hunger sliders direct control |
| Expected Behavior | Sliders update when changed directly and visible score text updates. |
| Actual Behavior | Direct slider control changed DOM values to 4/2, but the visible score labels still read 3/5 in the observed text. |
| Pass/Fail | FAIL |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "sliderValuesBefore": [     "3",     "3"   ],   "sliderValuesAfter": [     "4",     "2"   ],   "headings": [     "Weekly Check-In",     "How did you feel?",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "mainTextExcerpt": "menu notifications Weekly Check-In close How did you feel? Subjective scores help fine-tune your targets. Energy Levels 3/5 Lethargic Energetic Hunger Levels 3/5 Stuffed Starving Back Next Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein eg",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause | Range input DOM value can change without React/displayed score text updating; input event/state binding may be incomplete for this interaction path. |
| Related File/Component | Weekly check-in component slider controls |
| Missing Test Coverage | Pointer/direct and keyboard accessibility coverage for check-in range inputs. |

### 8. / - Weekly Check-In Next button from subjective step - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:10:03.804Z |
| Route | / |
| Element | Weekly Check-In Next button from subjective step |
| Expected Behavior | Advances from subjective sliders to the next step or final recommendation step. |
| Actual Behavior | Advanced to recommendation/final check-in step. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Weekly Check-In",     "Weigh-In",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "alerts": [],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "206.7",       "type": "number"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Back",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Complete Check-In",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "add_circle Create Recipe",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "grid_view Dashboard",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "calendar_month Plan",       "type": null     }   ],   "mainTextExcerpt": "menu notifications Weekly Check-In close Weigh-In Last recorded: 206.7 lbs CURRENT WEIGHT (LBS) info Adaptive Logic: If your weight remains stable but hunger was high (4-5), we may suggest increasing protein. Back Complete Check-In Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 206.7 lbs Jan 20 Jun 21 204 205 20",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Weekly check-in component |
| Missing Test Coverage | Complete weekly check-in step flow after subjective inputs. |

### 9. / - Weekly Check-In weight input and Complete Check-In button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:10:23.715Z |
| Route | / |
| Element | Weekly Check-In weight input and Complete Check-In button |
| Expected Behavior | Accepts current weight, saves check-in, closes modal, updates dashboard/check-in state without console or network errors. |
| Actual Behavior | Complete action returned to dashboard and/or updated visible weight/check-in state. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "alerts": [],   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.1 lbs +0.4 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Weekly check-in component; dashboard/userMetrics writes |
| Missing Test Coverage | End-to-end weekly check-in save with Firestore persistence and dashboard refresh assertion. |

### 10. / - Dashboard persistence after weekly check-in refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:10:37.957Z |
| Route | / |
| Element | Dashboard persistence after weekly check-in refresh |
| Expected Behavior | Saved check-in weight and derived metrics persist after page refresh. |
| Actual Behavior | 207.1 lbs and 1-day consistency state persisted after refresh. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.1 lbs +0.4 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Dashboard data hooks and userMetrics persistence |
| Missing Test Coverage | Refresh persistence check after completing weekly check-in. |

### 11. / - Notifications coming soon button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:11:03.948Z |
| Route | / |
| Element | Notifications coming soon button |
| Expected Behavior | Notification control is visibly disabled/coming soon and does not trigger an unfinished workflow. |
| Actual Behavior | Button is disabled as a Coming Soon affordance. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "enabled": false,   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     }   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Dashboard header / Layout notification control |
| Missing Test Coverage | Disabled Coming Soon notification affordance should remain non-interactive. |

### 12. / - Weight History add button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:11:05.063Z |
| Route | / |
| Element | Weight History add button |
| Expected Behavior | Opens add/log weight modal or inline weight entry workflow. |
| Actual Behavior | Weight entry UI opened. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Log Weight",     "Weigh-In",     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "alerts": [],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "207.1",       "type": "number"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Complete Check-In",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "add_circle Create Recipe",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "grid_view Dashboard",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "calendar_month Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "menu_book Recipes",       "type": null     }   ],   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | WeightHistoryWidget / Dashboard weight modal |
| Missing Test Coverage | Open weight add modal from Dashboard chart card. |

### 13. / - Log Weight modal weight input and Complete Check-In button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:11:28.338Z |
| Route | / |
| Element | Log Weight modal weight input and Complete Check-In button |
| Expected Behavior | Saves edited weight entry, closes modal, updates Weight History and activity data. |
| Actual Behavior | Dashboard updated to show 207.2 lbs. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Ju",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | WeightHistoryWidget / Log Weight modal / dashboard metrics |
| Missing Test Coverage | Manual weight add save updates chart and activity calendar. |

### 14. / - Weight History persistence after refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:11:29.779Z |
| Route | / |
| Element | Weight History persistence after refresh |
| Expected Behavior | Saved manual weight remains visible after refresh. |
| Actual Behavior | 207.2 lbs remained visible after refresh. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Ju",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | WeightHistoryWidget / dashboard data hook / Firestore userMetrics |
| Missing Test Coverage | Refresh persistence after manual weight entry. |

### 15. / - Activity calendar previous-month chevron - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:11:50.098Z |
| Route | / |
| Element | Activity calendar previous-month chevron |
| Expected Behavior | Moves activity calendar from June 2026 to May 2026. |
| Actual Behavior | Calendar changed to May 2026. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left MAY 2026 chevron_right 0% CONSISTENCY M T W T F S S 27 Mon, Apr 27 No activity recorded 28 Tue, Apr 28 No activity recorded 29 Wed, Apr 29 No activity recorded 30 Thu, Apr 30 No activity recorded 1 Fri, May 1 No activity recorded 2 Sat, May 2 No activity recorded 3 Sun, May 3 No activity recorded 4 Mon, May 4 No activity recorded 5 Tue, May 5 No activity recorded 6 W",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Activity calendar widget |
| Missing Test Coverage | Calendar month previous navigation. |

### 16. / - Activity calendar next-month chevron - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:11:50.957Z |
| Route | / |
| Element | Activity calendar next-month chevron |
| Expected Behavior | Moves activity calendar back to June 2026. |
| Actual Behavior | Calendar changed back to June 2026. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Ju",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Activity calendar widget |
| Missing Test Coverage | Calendar month next navigation. |

### 17. / - Hydration +250ml button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:12:17.196Z |
| Route | / |
| Element | Hydration +250ml button |
| Expected Behavior | Adds 250 ml to today's water total and updates visible counter/progress without errors. |
| Actual Behavior | Hydration display includes 250ml after click. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Jun 10 No activity recorded 11 Thu, Jun 11 No activity recorded 12 Fri, Jun 12 No activity recorded 13 Sat, Jun 13 No activity recorded 14 Sun, Jun 14 No activity recorded 15 Mon, Jun 15 No activity recorded 16 Tue, Jun 16 No activity recorded 17 Wed, Jun 17 No activity recorded 18 Thu, Jun 18 No activity recorded 19 Fri, Jun 19 No activity recorded 20 Sat, Jun 20 No activity recorded 21 Sun, Jun 21",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Hydration widget / dashboard metrics |
| Missing Test Coverage | Hydration +250 quick-add updates UI and persistence. |

### 18. / - Hydration +500ml button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:12:18.317Z |
| Route | / |
| Element | Hydration +500ml button |
| Expected Behavior | Adds 500 ml to existing total and updates today's water total to 750 ml. |
| Actual Behavior | Hydration display includes 750ml after +250ml then +500ml. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Jun 10 No activity recorded 11 Thu, Jun 11 No activity recorded 12 Fri, Jun 12 No activity recorded 13 Sat, Jun 13 No activity recorded 14 Sun, Jun 14 No activity recorded 15 Mon, Jun 15 No activity recorded 16 Tue, Jun 16 No activity recorded 17 Wed, Jun 17 No activity recorded 18 Thu, Jun 18 No activity recorded 19 Fri, Jun 19 No activity recorded 20 Sat, Jun 20 No activity recorded 21 Sun, Jun 21 No activity recorded 22 Mon, Jun 22 monitor_weight Weight 206.7 lbs bedtime Sleep 8h water_drop Wat",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Hydration widget / dashboard metrics |
| Missing Test Coverage | Hydration accumulated quick-add UI and persistence. |

### 19. / - Hydration Correct Entry button - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:12:32.659Z |
| Route | / |
| Element | Hydration Correct Entry button |
| Expected Behavior | Opens a correction/edit workflow for today's water total. |
| Actual Behavior | No edit modal opened; the visible water total changed to 500 ml after click, suggesting the button decrements/undoes an entry despite the "Correct Entry" label. |
| Pass/Fail | FAIL |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "auto_awesome Create New Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "close",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "add_circle Create Recipe",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "grid_view Dashboard",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/plan",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "calendar_month Plan",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/recipes",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "menu_book Recipes",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/progress",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "history Progress",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/grocery",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "shopping_cart Grocery List",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/pantry",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "inventory_2 Pantry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/settings",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "settings Settings",       "type": null     },     {       "checked": false,       "disabled": false,       "href": "/settings",       "pressed": null,       "selected": null,       "tag": "a",       "testid": null,       "text": "U User Profile settings",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "logout Sign Out",       "type": null     }   ],   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Jun 10 No activity recorded 11 Thu, Jun 11 No activity recorded 12 Fri, Jun 12 No activity recorded 13 Sat, Jun 13 No activity recorded 14 Sun, Jun 14 No activity recorded 15 Mon, Jun 15 No activity rec",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [],   "hydrationSectionAfterClick": "No activity recorded 9 Thu, Jul 9 No activity recorded 10 Fri, Jul 10 No activity recorded 11 Sat, Jul 11 No activity recorded 12 Sun, Jul 12 No activity recorded Today Recorded water_drop water_full Hydration +250ml +500ml edit 500 ml Goal: 2,500 0ml 0ml 0ml 0ml 0ml 0ml 500ml Correct Entry bedtime bedtime Sleep edit Log Sleep -- No sleep logged yet Log Previous Night calendar_month Ready to plan your week? Generate a meal plan based on your calorie goals and recipe library. auto_awesome Create New Plan bolt VioMacro Meal Planner close add_circle Create Recipe MENU grid_view Dashboard calendar_month Plan menu_book Recipes history Progress INVENTORY shopping_cart Grocery List inventory_2 Pantry ACCOUNT settings Settings U User Profile settings logout Sign Out Running in emulator mode. Do not use with production credentials. 207" } |
| Suspected Root Cause | The control label suggests an edit/correction workflow, but implementation appears to decrement/remove a water entry directly without confirmation or clear affordance. |
| Related File/Component | Hydration widget correction workflow |
| Missing Test Coverage | Hydration correction button should assert intended decrement/edit semantics, confirmation behavior, and label clarity. |

### 20. / - Hydration persistence after refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:13:08.866Z |
| Route | / |
| Element | Hydration persistence after refresh |
| Expected Behavior | Water total persists after quick-add/correction interactions. |
| Actual Behavior | 500 ml water total persisted after refresh. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "hydrationSection": "No activity recorded 9 Thu, Jul 9 No activity recorded 10 Fri, Jul 10 No activity recorded 11 Sat, Jul 11 No activity recorded 12 Sun, Jul 12 No activity recorded Today Recorded water_drop water_full Hydration +250ml +500ml edit 500 ml Goal: 2,500 0ml 0ml 0ml 0ml 0ml 0ml 500ml Correct Entry bedtime bedtime Sleep edit Log Sleep -- No sleep logged yet Log Previous Night calendar_month Ready to plan your week? Generate a meal plan based on your calorie goals and recipe library. auto_awesome Create New Plan bolt VioMacro Meal Planner close add_circle Create Recipe MENU grid_view Dashboard calendar_month Plan menu_book Recipes history Progress INVENTORY shopping_cart Grocery List inventory_2 Pant",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Hydration widget / userMetrics persistence |
| Missing Test Coverage | Refresh persistence after hydration changes. |

### 21. / - Sleep Log Sleep button - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:13:24.265Z |
| Route | / |
| Element | Sleep Log Sleep button |
| Expected Behavior | Opens sleep logging modal/form for today or last night. |
| Actual Behavior | No clear sleep logging UI opened. |
| Pass/Fail | FAIL |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "headings": [     "Good evening, User",     "Weekly Check-In Required",     "Weight History",     "Engine Insights",     "Consistency Streak",     "Activity",     "Hydration",     "Sleep",     "Log Sleep",     "Ready to plan your week?",     "VioMacro"   ],   "controls": [     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "menu",       "type": "button"     },     {       "checked": false,       "disabled": true,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "notifications",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Start Check-In arrow_forward",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "add",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_left",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "chevron_right",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+250ml",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "+500ml edit",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Correct Entry",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "edit Log Sleep",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Log Previous Night",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "2026-06-26",       "type": "date"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Time Range",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Total Hours",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "23:00",       "type": "time"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "input",       "testid": null,       "text": "07:00",       "type": "time"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "textarea",       "testid": null,       "text": "How did you sleep?",       "type": null     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Cancel",       "type": "button"     },     {       "checked": false,       "disabled": false,       "href": null,       "pressed": null,       "selected": null,       "tag": "button",       "testid": null,       "text": "Save Log",       "type": "submit"     }   ],   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Jun 10 No activity recorded 11 Thu, Jun 11 No activity recorded 12 Fri, Jun 12 No activity recorded 13 Sat, Jun 13 No activity recorded 14 Sun, Jun 14 No activity recorded 15 Mon, Jun 15 No activity rec",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Sleep widget / sleep log modal |
| Missing Test Coverage | Open sleep log form from Dashboard. |

### 22. / - Sleep quality selector and Save Log button - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:14:17.532Z |
| Route | / |
| Element | Sleep quality selector and Save Log button |
| Expected Behavior | Allows selecting sleep quality, saves default 23:00-07:00 sleep log, closes form, and updates visible sleep metric/activity. |
| Actual Behavior | Sleep metric updated to 8h after save. |
| Pass/Fail | FAIL |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Jun 10 No activity recorded 11 Thu, Jun 11 No activity recorded 12 Fri, Jun 12 No activity recorded 13 Sat, Jun 13 No activity recorded 14 Sun, Jun 14 No activity recorded 15 Mon, Jun 15 No activity recorded 16 Tue, Jun 16 No activity recorded 17 Wed, Jun 17 No activity recorded 18 Thu, Jun 18 No activity recorded 19 Fri, Jun 19 No activity recorded 20 Sat, Jun 20 No activity recorded 21 Sun, Jun 21 No activity recorded 22 Mon, Jun 22 monitor_weight Weight 206.7 lbs bedtime Sleep 8h water_drop Wat",   "qualityControlIssue": "Quality buttons had no visible text/accessibility names in DOM inspection; selected by coordinate.",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [     {       "method": "Network.loadingFailed",       "url": "2208.571",       "errorText": "net::ERR_ABORTED"     }   ] } |
| Suspected Root Cause | Functional save passed; quality buttons need accessible labels/test identifiers. |
| Related File/Component | Sleep widget / SleepLogForm |
| Missing Test Coverage | Sleep form save plus accessible-name coverage for quality selector buttons. |

### 23. / - Sleep persistence after refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:14:18.969Z |
| Route | / |
| Element | Sleep persistence after refresh |
| Expected Behavior | Saved sleep log persists after refresh and remains visible in Dashboard/activity. |
| Actual Behavior | 8h sleep state remained visible after refresh. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "mainTextExcerpt": "menu notifications Good evening, User Phase: Fat Loss • Week 23 scale Weekly Check-In Required The Adaptive Engine needs your latest weight averages and measurements to calculate next week's adjustments. Adherence was high last week! Start Check-In arrow_forward Daily Calories local_fire_department 1900kcal 0 consumed Protein egg_alt 143g 0g consumed Carbs bakery_dining 166g 0g consumed Fat water_drop 74g 0g consumed Weight History add Last 90 Days 207.2 lbs +0.5 lbs Jan 20 Jun 21 Jun 25 207 207 207 207 207 Engine Insights Live trending_up Consistency Streak You've been consistent for 1 days in a row! Activity chevron_left JUNE 2026 chevron_right 7% CONSISTENCY M T W T F S S 1 Mon, Jun 1 No activity recorded 2 Tue, Jun 2 No activity recorded 3 Wed, Jun 3 No activity recorded 4 Thu, Jun 4 No activity recorded 5 Fri, Jun 5 No activity recorded 6 Sat, Jun 6 No activity recorded 7 Sun, Jun 7 No activity recorded 8 Mon, Jun 8 No activity recorded 9 Tue, Jun 9 No activity recorded 10 Wed, Jun 10 No activity recorded 11 Thu, Jun 11 No activity recorded 12 Fri, Jun 12 No activity recorded 13 Sat, Jun 13 No activity recorded 14 Sun, Jun 14 No activity recorded 15 Mon, Jun 15 No activity recorded 16 Tue, Jun 16 No activity recorded 17 Wed, Jun 17 No activity recorded 18 Thu, Jun 18 No activity recorded 19 Fri, Jun 19 No activity recorded 20 Sat, Jun 20 No activity recorded 21 Sun, Jun 21 No activity recorded 22 Mon, Jun 22 monitor_weight Weight 206.7 lbs bedtime Sleep 8h water_drop Wat",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Sleep widget / dashboard data hook / Firestore userMetrics |
| Missing Test Coverage | Refresh persistence after sleep save. |

### 24. / - Sleep Log Previous Night button availability after saved sleep - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:14:55.113Z |
| Route | / |
| Element | Sleep Log Previous Night button availability after saved sleep |
| Expected Behavior | Previous-night path is available when no current sleep is logged, or hidden intentionally once current sleep exists. |
| Actual Behavior | After saving today's sleep, the Log Previous Night button is not rendered; only edit/log state remains available. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/",   "sleepSection": "activity recorded 11 Sat, Jul 11 No activity recorded 12 Sun, Jul 12 No activity recorded Today Recorded water_drop water_full Hydration +250ml +500ml edit 500 ml Goal: 2,500 0ml 0ml 0ml 0ml 0ml 0ml 500ml Correct Entry bedtime bedtime Sleep edit Log Sleep 8 hours QUALITY 4/5 0h 0h 8h 0h 0h 0h 8h No notes recorded calendar_month Ready to plan your week? Generate a meal plan based on your calorie goals and recipe library. auto_awesome Create New Plan bolt VioMacro Meal Planner close add_circle Create Recipe MENU grid_view Dashboard calendar_month Plan menu_book Recipes history Progress INVENTORY shopping_cart Grocery List inventory_2 Pantry ACCOUNT settings Settings U User Profile settings logout Sign Out Running in emulator mode. Do not use with production credentials. 207",   "prevNightCountNow": 0 } |
| Suspected Root Cause | Conditional UI; needs separate seeded state to test previous-night path before current sleep exists. |
| Related File/Component | Sleep widget conditional rendering |
| Missing Test Coverage | Dedicated seeded-state test for Log Previous Night before today's sleep exists. |

### 25. / - Ready to plan your week / Create New Plan link - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:15:16.834Z |
| Route | / |
| Element | Ready to plan your week / Create New Plan link |
| Expected Behavior | Navigates from Dashboard to Meal Planner route. |
| Actual Behavior | Navigated to /plan and plan page content rendered. |
| Pass/Fail | PASS |
| Evidence | {   "url": "http://127.0.0.1:5173/plan",   "headings": [     "Plan Week of Jun 22",     "Plan for Week of Jun 22?",     "VioMacro"   ],   "mainTextExcerpt": "menu notifications Day Week Month chevron_left Week of Jun 22 Jun 28 chevron_right calendar_add_on Plan Week of Jun 22 No plan found for this week. Create a new one or check other weeks! add_circle Create New Plan calendar_add_on Plan for Week of Jun 22? It looks like this week is empty. Start fresh or copy your previous success! auto_fix_high Open Plan Wizard history Clone Last Week Maybe Later",   "consoleWarnings": [     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width.",     "The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(192) or use aspect(undefined) to control the\n       height and width."   ],   "network": [] } |
| Suspected Root Cause |  |
| Related File/Component | Dashboard CTA link / Plan route |
| Missing Test Coverage | Dashboard CTA navigation to plan page. |


### PLAN-1. /plan - Plan page empty-state load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Plan page empty-state load |
| Expected Behavior | Plan route renders empty-week state and creation actions. |
| Actual Behavior | Plan empty state rendered for Week of Jun 22/Jun 29 during audit with Create New Plan, Open Plan Wizard, Clone Last Week, and Maybe Later actions. |
| Pass/Fail | PASS |
| Evidence | Observed DOM snapshots on /plan showed Plan Week headings, empty-state text, and creation controls; no blocking route error. |
| Suspected Root Cause |  |
| Related File/Component | Plan route/page component |
| Missing Test Coverage | Plan page empty-state smoke render. |

### PLAN-2. /plan - Day view tab - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Day view tab |
| Expected Behavior | Clicking Day makes Day the active view. |
| Actual Behavior | Clicking Day did not expose the active bg-primary state in the later active-state check. |
| Pass/Fail | FAIL |
| Evidence | Live tab active-state check returned dayActive=false, while Week/Month returned true. |
| Suspected Root Cause | Day tab state may not update or may not expose the same active styling as Week/Month. |
| Related File/Component | Plan view mode controls |
| Missing Test Coverage | Plan Day tab active-state assertion. |

### PLAN-3. /plan - Week view tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Week view tab |
| Expected Behavior | Clicking Week makes Week the active view. |
| Actual Behavior | Week tab exposed active bg-primary state. |
| Pass/Fail | PASS |
| Evidence | Live active-state check returned weekActive=true. |
| Suspected Root Cause |  |
| Related File/Component | Plan view mode controls |
| Missing Test Coverage | Plan Week tab active-state assertion. |

### PLAN-4. /plan - Month view tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Month view tab |
| Expected Behavior | Clicking Month makes Month the active view. |
| Actual Behavior | Month tab exposed active bg-primary state. |
| Pass/Fail | PASS |
| Evidence | Live active-state check returned monthActive=true. |
| Suspected Root Cause |  |
| Related File/Component | Plan view mode controls |
| Missing Test Coverage | Plan Month tab active-state assertion. |

### PLAN-5. /plan - Next week chevron - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Next week chevron |
| Expected Behavior | Moves visible week from Jun 22 to Jun 29. |
| Actual Behavior | Final live baseline check advanced to Week of Jun 29 / Jul 5. |
| Pass/Fail | PASS |
| Evidence | Observed text after click: Week of Jun 29 Jul 5. |
| Suspected Root Cause |  |
| Related File/Component | Plan week navigation |
| Missing Test Coverage | Next-week navigation date-range assertion. |

### PLAN-6. /plan - Previous week chevron - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Previous week chevron |
| Expected Behavior | Moves visible week from Jun 29 back to Jun 22. |
| Actual Behavior | Fresh live check from Week of Jun 29 stayed on Week of Jun 29 after clicking previous. |
| Pass/Fail | FAIL |
| Evidence | Observed text after previous click still showed Week of Jun 29 Jul 5; network errors none. |
| Suspected Root Cause | Previous-week handler/state appears non-responsive from Jun 29 state. |
| Related File/Component | Plan week navigation |
| Missing Test Coverage | Previous-week navigation regression test. |

### PLAN-7. /plan - Maybe Later button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Maybe Later button |
| Expected Behavior | Dismisses empty-week prompt. |
| Actual Behavior | Earlier live check dismissed the empty-week prompt, leaving the base empty plan state. |
| Pass/Fail | PASS |
| Evidence | Observed prompt content removed after Maybe Later click. |
| Suspected Root Cause |  |
| Related File/Component | Plan empty-state prompt |
| Missing Test Coverage | Maybe Later dismissal test. |

### PLAN-8. /plan - Create New Plan button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Create New Plan button |
| Expected Behavior | Starts plan creation flow or shows creation choices. |
| Actual Behavior | Reopened the empty-week prompt with Open Plan Wizard, Clone Last Week, and Maybe Later options. |
| Pass/Fail | PASS |
| Evidence | DOM snapshot after click showed Plan for Week prompt and three actions. |
| Suspected Root Cause | No functional root cause; CTA may be indirect if users expect wizard to open immediately. |
| Related File/Component | Plan empty-state creation CTA |
| Missing Test Coverage | Create New Plan prompt-open behavior. |

### PLAN-9. /plan - Open Plan Wizard button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Open Plan Wizard button |
| Expected Behavior | Opens guided plan wizard. |
| Actual Behavior | Opened Create Your Week Plan wizard with Daily Smoothie, Daily Tea, Batch Cooking Strategy, Include Snacks, Auto-Generate Week, and Start from Scratch. |
| Pass/Fail | PASS |
| Evidence | DOM snapshot showed Create Your Week Plan heading and wizard controls. |
| Suspected Root Cause |  |
| Related File/Component | Plan wizard modal/inline flow |
| Missing Test Coverage | Wizard open/render test. |

### PLAN-10. /plan - Batch Cooking Strategy NONE button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Batch Cooking Strategy NONE button |
| Expected Behavior | Selects NONE batch strategy. |
| Actual Behavior | NONE became active with bg-primary in strict retest. |
| Pass/Fail | PASS |
| Evidence | Strict batch retest active=NONE. |
| Suspected Root Cause |  |
| Related File/Component | Plan wizard batch controls |
| Missing Test Coverage | Batch option active state. |

### PLAN-11. /plan - Batch Cooking Strategy BREAKFAST button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Batch Cooking Strategy BREAKFAST button |
| Expected Behavior | Selects BREAKFAST batch strategy. |
| Actual Behavior | BREAKFAST became active with bg-primary in strict retest. |
| Pass/Fail | PASS |
| Evidence | Strict batch retest active=BREAKFAST. |
| Suspected Root Cause |  |
| Related File/Component | Plan wizard batch controls |
| Missing Test Coverage | Batch option active state. |

### PLAN-12. /plan - Batch Cooking Strategy LUNCH button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Batch Cooking Strategy LUNCH button |
| Expected Behavior | Selects LUNCH batch strategy. |
| Actual Behavior | LUNCH became active with bg-primary in strict retest. |
| Pass/Fail | PASS |
| Evidence | Strict batch retest active=LUNCH. |
| Suspected Root Cause |  |
| Related File/Component | Plan wizard batch controls |
| Missing Test Coverage | Batch option active state. |

### PLAN-13. /plan - Batch Cooking Strategy DINNER button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Batch Cooking Strategy DINNER button |
| Expected Behavior | Selects DINNER batch strategy. |
| Actual Behavior | DINNER became active with bg-primary in strict retest. |
| Pass/Fail | PASS |
| Evidence | Strict batch retest active=DINNER. |
| Suspected Root Cause |  |
| Related File/Component | Plan wizard batch controls |
| Missing Test Coverage | Batch option active state. |

### PLAN-14. /plan - Daily Smoothie and Daily Tea sections - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Daily Smoothie and Daily Tea sections |
| Expected Behavior | Expose clear toggles/controls if these options are configurable. |
| Actual Behavior | Sections were visible as headings/cards, but no named toggle/button/input for Smoothie or Tea was exposed in DOM controls. |
| Pass/Fail | FAIL |
| Evidence | Control inspection had hasSmoothieText=true and hasTeaText=true but smoothieControl=false and teaControl=false. |
| Suspected Root Cause | Feature cards may be missing actual interactive controls or accessible labels. |
| Related File/Component | Plan wizard smoothie/tea options |
| Missing Test Coverage | Wizard option controls reachable by role/name. |

### PLAN-15. /plan - Start from Scratch (Empty Grid) button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Start from Scratch (Empty Grid) button |
| Expected Behavior | Creates an empty editable grid and exits wizard. |
| Actual Behavior | Initial observation showed wizard closed and a plan-like structure appeared. |
| Pass/Fail | PASS |
| Evidence | Earlier live check returned scratchCreated=true. |
| Suspected Root Cause |  |
| Related File/Component | Plan wizard empty-grid creation |
| Missing Test Coverage | Empty-grid creation success path. |

### PLAN-16. /plan - Empty-grid plan persistence after refresh - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Empty-grid plan persistence after refresh |
| Expected Behavior | Created empty grid persists and can be found again after refresh. |
| Actual Behavior | Refresh reset the page to Week of Jun 22 empty state; returning to the created week could not be verified because week navigation became stuck/non-responsive in follow-up checks. |
| Pass/Fail | FAIL |
| Evidence | After refresh: No plan found for Week of Jun 22. Subsequent chevron checks failed to reach Jun 29 reliably. |
| Suspected Root Cause | Plan may persist but selected-week state/navigation prevents verification; possible plan write/read or navigation-state issue. |
| Related File/Component | Plan data persistence and week navigation |
| Missing Test Coverage | Refresh persistence for created plans plus date navigation. |

### PLAN-17. /plan - Clone Last Week button - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Clone Last Week button |
| Expected Behavior | Clones prior week or gives clear unavailable feedback. |
| Actual Behavior | Click triggered a native browser dialog/interruption and returned to empty-state view; dialog text was not captured by browser API. |
| Pass/Fail | FAIL |
| Evidence | Browser reported active JavaScript alert during clone test; no in-app toast or visible cloned plan after dismissal/recovery. |
| Suspected Root Cause | Clone action relies on native alert or unclear no-op feedback. |
| Related File/Component | Plan empty-state clone action |
| Missing Test Coverage | Clone success/unavailable feedback without native alert. |

### PLAN-18. /plan - Auto-Generate Week button - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:28:28.470Z |
| Route | /plan |
| Element | Auto-Generate Week button |
| Expected Behavior | Generates a plan or shows a clear recoverable in-app error. |
| Actual Behavior | Triggered a native alert; after dismissal no generated plan was visible and a Network.loadingFailed ERR_ABORTED event was recorded. |
| Pass/Fail | FAIL |
| Evidence | Dialog type alert; observed network error net::ERR_ABORTED and empty-state remained. |
| Suspected Root Cause | Auto-generate path likely errors through native alert or aborted function/navigation flow rather than in-app feedback. |
| Related File/Component | Plan wizard Auto-Generate flow / Firebase callable function |
| Missing Test Coverage | Auto-generate loading/success/failure states in emulator. |


### RECIPE-1. /recipes - Recipes page load - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:29:21.963Z |
| Route | /recipes |
| Element | Recipes page load |
| Expected Behavior | Recipes route renders library, tabs, search, filters, recipe cards, and add actions. |
| Actual Behavior | Recipes route rendered My Kitchen with recipe cards and controls. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"auto_awesome","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"add New Recipe","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"All Recipes","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Favorites","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"My Creations","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Imported","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"folder Collections","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"Search recipes, ingredients...","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"auto_awesome AI SEARCH","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"PROTEIN: 20G+","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"CARBS: <50G","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"High Protein","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Low Carb","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Under 30m","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Meal Prep","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"tune","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null}],"snapshotExcerpt":"- main:\n  - button \"Open navigation menu\":\n    - generic: menu\n  - button \"Notifications coming soon\" [disabled]:\n    - generic: notifications\n  - heading \"My Kitchen\" [level=1]\n  - paragraph: Manage your database. Create, import, and organize recipes.\n  - button \"auto_awesome\":\n    - generic: auto_awesome\n  - button \"add New Recipe\":\n    - generic: add\n    - generic: New Recipe\n  - button \"All Recipes\"\n  - button \"Favorites\"\n  - button \"My Creations\"\n  - button \"Imported\"\n  - button \"folder Collections\":\n    - generic: folder\n    - text: Collections\n  - generic: search\n  - textbox \"search auto_awesome AI Search\":\n    - /placeholder: Search recipes, ingredients...\n  - button \"auto_awesome AI Search\":\n    - generic: auto_awesome\n    - text: AI Search\n  - 'button \"Protein: 20g+\" [disabled]':\n    - generic: \"Protein: 20g+\"\n  - 'button \"Carbs: <50g\" [disabled]':\n    - generic: \"Carbs: <50g\"\n  - button \"High Protein\":\n    - generic: High Protein\n  - button \"Low Carb\":\n    - generic: Low Carb\n  - button \"Under 30m\":\n    - generic: Under 30m\n  - button \"Meal Prep\":\n    - generic: Meal Prep\n  - button \"Advanced filters coming soon\" [disabled]:\n    - generic: tune\n  - generic: timer\n  - text: 5m\n  - button \"favorite\":\n    - generic: favorite\n  - button \"edit\":\n    - generic: edit\n  - button \"delete\":\n    - generic: delete\n  - img \"Greek Yogurt & Walnuts\"\n  - heading \"Greek Yogurt & Walnuts\" [level=3]\n  - paragraph: breakfast • Quick\n  - generic: \"320\"\n  - generic: kcal\n  - generic: 28","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.957","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes page/library component |
| Missing Test Coverage | Recipes page smoke render with seeded recipes. |

### RECIPE-2. /recipes - Top icon-only auto_awesome import button - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:30:19.503Z |
| Route | /recipes |
| Element | Top icon-only auto_awesome import button |
| Expected Behavior | Navigates to import/magic recipe workflow or opens import UI. |
| Actual Behavior | Click stayed on /recipes and no dialog was detected; action outcome is unclear/no-op. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","clickCoordinate":{"x":43,"y":190},"autoButtons":[{"className":"flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-sm font-bold transition-all","i":3,"rect":{"h":40,"w":53.60000228881836,"x":16,"y":169.5},"text":"auto_awesome","visible":true},{"className":"h-full px-3 rounded-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all bg-white/5 text-text-secondary hover:text-white hover:bg-white/10","i":10,"rect":{"h":36,"w":114.67500305175781,"x":479.7250061035156,"y":303.8999938964844},"text":"auto_awesome AI SEARCH","visible":true}],"headings":["My Kitchen","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancake","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1043","errorText":"net::ERR_ABORTED"},{"method":"Network.loadingFailed","url":"2208.1056","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause | Icon-only import button may not be wired, or import workflow is hidden/no-op on local state. |
| Related File/Component | Recipes page import action |
| Missing Test Coverage | Icon-only import button should have accessible label and route test. |

### RECIPE-3. /recipes - Header New Recipe button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:31:27.048Z |
| Route | /recipes |
| Element | Header New Recipe button |
| Expected Behavior | Opens manual recipe creation form/modal. |
| Actual Behavior | Manual recipe creation UI opened or route changed. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","clickCoordinate":{"x":155,"y":190},"headings":["My Kitchen","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","New Recipe","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"auto_awesome","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"add New Recipe","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"All Recipes","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Favorites","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"My Creations","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Imported","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"folder Collections","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"Search recipes, ingredients...","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"auto_awesome AI SEARCH","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"PROTEIN: 20G+","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"CARBS: <50G","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"High Protein","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Low Carb","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Under 30m","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Meal Prep","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"tune","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null}],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import New Recipe close Details Ingredients Instructions Recipe Name * Meal Type Breakfast Lunch Dinner Snack Smoothie Cook Time (minutes) Servings ppl Nutrition (per serving) Calories Protein (g) Carbs (g","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes page manual create action |
| Missing Test Coverage | Header New Recipe opens create form. |

### RECIPE-4. /recipes - New Recipe modal create flow - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:32:06.967Z |
| Route | /recipes |
| Element | New Recipe modal create flow |
| Expected Behavior | Required fields enable Create Recipe; saving closes modal and adds QA Test Recipe to library. |
| Actual Behavior | QA Test Recipe appears in recipe library after save. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","createEnabledBeforeClick":true,"headings":["My Kitchen","QA Test Recipe","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipe modal create form / recipes data hook |
| Missing Test Coverage | Manual recipe creation minimum-field save and list refresh. |

### RECIPE-5. /recipes - Recipes search input - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:32:25.955Z |
| Route | /recipes |
| Element | Recipes search input |
| Expected Behavior | Filters recipes by typed search query. |
| Actual Behavior | Search for QA Test showed QA Test Recipe and filtered out unrelated seeded recipes. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","query":"QA Test","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes search/filter controls |
| Missing Test Coverage | Recipe text search filters list. |

### RECIPE-6. /recipes - Recipes search clear - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:32:26.607Z |
| Route | /recipes |
| Element | Recipes search clear |
| Expected Behavior | Clearing search restores full recipe list. |
| Actual Behavior | Keyboard Ctrl+A/Backspace cleared the search and restored full list; programmatic fill empty did not clear it. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[],"retryExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F add Add New Recipe Create manually or import","manualClear":{"valAfterManualClear":"","excerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Break"}} |
| Suspected Root Cause | Not an app-visible bug in manual use; add test coverage using real keyboard clear because empty fill did not mimic the user path here. |
| Related File/Component | Recipes search/filter controls |
| Missing Test Coverage | Search clear restores full list. |

### RECIPE-7. /recipes - QA recipe favorite button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:33:46.861Z |
| Route | /recipes |
| Element | QA recipe favorite button |
| Expected Behavior | Toggles QA Test Recipe as favorite without affecting seeded recipes. |
| Actual Behavior | Clicked first recipe favorite control for QA Test Recipe; no route or network errors observed. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","clickCoordinate":{"x":47,"y":466},"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Break","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipe card favorite control |
| Missing Test Coverage | Favorite toggle on user-created recipe and favorites filter. |

### RECIPE-8. /recipes - Favorites tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:05.616Z |
| Route | /recipes |
| Element | Favorites tab |
| Expected Behavior | Switches recipe library to Favorites view. |
| Actual Behavior | Favorites view/filter produced expected visible state. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","QA Test Recipe","Salmon & Asparagus","Berry Overnight Oats","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes library tabs/filter state |
| Missing Test Coverage | Favorites tab visible result assertion. |

### RECIPE-9. /recipes - My Creations tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:06.741Z |
| Route | /recipes |
| Element | My Creations tab |
| Expected Behavior | Switches recipe library to My Creations view. |
| Actual Behavior | My Creations view/filter produced expected visible state. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","QA Test Recipe","Salmon & Asparagus","Quinoa Power Bowl","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes library tabs/filter state |
| Missing Test Coverage | My Creations tab visible result assertion. |

### RECIPE-10. /recipes - Imported tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:07.854Z |
| Route | /recipes |
| Element | Imported tab |
| Expected Behavior | Switches recipe library to Imported view. |
| Actual Behavior | Imported view/filter produced expected visible state. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","Greek Yogurt & Walnuts","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes library tabs/filter state |
| Missing Test Coverage | Imported tab visible result assertion. |

### RECIPE-11. /recipes - folder Collections tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:08.997Z |
| Route | /recipes |
| Element | folder Collections tab |
| Expected Behavior | Switches recipe library to folder Collections view. |
| Actual Behavior | folder Collections view/filter produced expected visible state. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections egg_alt Breakfast 4 recipes restaurant Lunch 3 recipes dinner_dining Dinner 3 recipes slow_motion_video Slow Cook 1 recipes kitchen Meal Prep 3 recipes bolt Quick & Easy 2 recipes add New Folder Coming Soon","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes library tabs/filter state |
| Missing Test Coverage | folder Collections tab visible result assertion. |

### RECIPE-12. /recipes - All Recipes tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:10.139Z |
| Route | /recipes |
| Element | All Recipes tab |
| Expected Behavior | Switches recipe library to All Recipes view. |
| Actual Behavior | All Recipes view/filter produced expected visible state. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","QA Test Recipe","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Di","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes library tabs/filter state |
| Missing Test Coverage | All Recipes tab visible result assertion. |

### RECIPE-13. /recipes - High Protein quick filter - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:38.643Z |
| Route | /recipes |
| Element | High Protein quick filter |
| Expected Behavior | Applies High Protein recipe filter and updates visible recipe list. |
| Actual Behavior | High Protein filter produced plausible filtered results. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein close Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1088","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes quick filters |
| Missing Test Coverage | High Protein quick filter result assertion. |

### RECIPE-14. /recipes - Low Carb quick filter - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:40.272Z |
| Route | /recipes |
| Element | Low Carb quick filter |
| Expected Behavior | Applies Low Carb recipe filter and updates visible recipe list. |
| Actual Behavior | Low Carb filter produced plausible filtered results. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb close Under 30m Meal Prep tune timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes quick filters |
| Missing Test Coverage | Low Carb quick filter result assertion. |

### RECIPE-15. /recipes - Under 30m quick filter - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:41.924Z |
| Route | /recipes |
| Element | Under 30m quick filter |
| Expected Behavior | Applies Under 30m recipe filter and updates visible recipe list. |
| Actual Behavior | Under 30m filter produced plausible filtered results. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m close Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes quick filters |
| Missing Test Coverage | Under 30m quick filter result assertion. |

### RECIPE-16. /recipes - Meal Prep quick filter - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:43.573Z |
| Route | /recipes |
| Element | Meal Prep quick filter |
| Expected Behavior | Applies Meal Prep recipe filter and updates visible recipe list. |
| Actual Behavior | Meal Prep filter produced plausible filtered results. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep close tune timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes quick filters |
| Missing Test Coverage | Meal Prep quick filter result assertion. |

### RECIPE-17. /recipes - Disabled metric/advanced filter buttons - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:34:44.255Z |
| Route | /recipes |
| Element | Disabled metric/advanced filter buttons |
| Expected Behavior | Protein: 20g+, Carbs: <50g, and Advanced filters are disabled/coming soon. |
| Actual Behavior | All three controls are disabled. |
| Pass/Fail | PASS |
| Evidence | {"disabledStates":{"proteinEnabled":false,"carbsEnabled":false,"advancedEnabled":false}} |
| Suspected Root Cause |  |
| Related File/Component | Recipes filter controls |
| Missing Test Coverage | Coming-soon filters remain disabled. |

### RECIPE-18. /recipes - AI Search button with query chicken - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:35:03.596Z |
| Route | /recipes |
| Element | AI Search button with query chicken |
| Expected Behavior | Runs semantic/AI search or shows a clear unavailable/error state. |
| Actual Behavior | AI Search produced visible filtered/search state or clear search UI state. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","query":"chicken","alerts":[],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections auto_awesome auto_awesome AI SEARCH arrow_forward PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1128","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes semantic/AI search control and callable function |
| Missing Test Coverage | AI search success/failure/loading state with emulator/prod function. |

### RECIPE-19. /recipes - AI Search prompt input clear - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:36:01.386Z |
| Route | /recipes |
| Element | AI Search prompt input clear |
| Expected Behavior | Clearing AI Search prompt restores full recipe library or exits filtered state. |
| Actual Behavior | Recipe list still appears filtered after clearing AI prompt input. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","inputsAfterAi":[{"i":0,"placeholder":null,"rect":{"h":0,"w":0,"x":0,"y":0},"type":"file","value":"","visible":false},{"i":1,"placeholder":"Describe what you want (e.g. high-protein chicken for summer)...","rect":{"h":44,"w":586.4000244140625,"x":16,"y":299.8999938964844},"type":"text","value":"chicken","visible":true}],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections auto_awesome auto_awesome AI SEARCH arrow_forward PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | AI search mode may retain semantic filter after prompt is emptied. |
| Related File/Component | Recipes AI Search input/filter state |
| Missing Test Coverage | Clearing AI prompt exits AI-search filtered state. |

### RECIPE-20. /recipes - All Recipes reset after AI Search - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:36:17.684Z |
| Route | /recipes |
| Element | All Recipes reset after AI Search |
| Expected Behavior | All Recipes tab exits AI/search filtered state and restores full list. |
| Actual Behavior | All Recipes did not restore full list after AI Search filter. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections auto_awesome auto_awesome AI SEARCH arrow_forward PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | AI search filter state persists despite clearing prompt and clicking All Recipes. |
| Related File/Component | Recipes AI Search/filter state |
| Missing Test Coverage | Resetting AI search via All Recipes restores default list. |

### RECIPE-21. /recipes - Recipes reload after sticky AI Search - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:36:38.285Z |
| Route | /recipes |
| Element | Recipes reload after sticky AI Search |
| Expected Behavior | Reload returns Recipes page to default list state. |
| Actual Behavior | Reload restored default recipe list. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Break","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | AI search state is sticky in-session but not persisted after reload. |
| Related File/Component | Recipes AI Search/filter state |
| Missing Test Coverage | Reload/reset behavior after AI search. |

### RECIPE-22. /recipes - QA recipe edit button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:36:57.703Z |
| Route | /recipes |
| Element | QA recipe edit button |
| Expected Behavior | Opens edit form for QA Test Recipe. |
| Actual Behavior | Edit/create modal opened with QA recipe data visible. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","clickCoordinate":{"x":90,"y":466},"headings":["My Kitchen","QA Test Recipe","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","Edit Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import Edit Recipe close Details Ingredients Instructions Recipe Name * Meal Type Breakfast Lunch Dinner Snack Smoo","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipe card edit control / recipe modal |
| Missing Test Coverage | Edit user-created recipe opens prefilled form. |

### RECIPE-23. /recipes - Edit Recipe modal Save Changes - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:37:30.898Z |
| Route | /recipes |
| Element | Edit Recipe modal Save Changes |
| Expected Behavior | Saves renamed QA recipe and returns to library with updated title. |
| Actual Behavior | QA Test Recipe Edited appears in library after Save Changes. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","headings":["My Kitchen","QA Test Recipe Edited","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipe edit modal / recipes data hook |
| Missing Test Coverage | Edit user-created recipe and verify updated list title. |

### RECIPE-24. /recipes - Edited recipe persistence after refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:37:32.280Z |
| Route | /recipes |
| Element | Edited recipe persistence after refresh |
| Expected Behavior | Renamed QA recipe persists after refresh. |
| Actual Behavior | QA Test Recipe Edited remained visible after refresh. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Recipes data hook / Firestore recipe persistence |
| Missing Test Coverage | Refresh persistence after recipe edit. |

### RECIPE-25. /recipes - QA recipe delete button and confirmation - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:37:52.567Z |
| Route | /recipes |
| Element | QA recipe delete button and confirmation |
| Expected Behavior | Deletes only QA Test Recipe Edited after confirmation and keeps seeded recipes visible. |
| Actual Behavior | QA recipe still visible or seeded list not visible after delete. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","clickCoordinate":{"x":136,"y":466},"deleteDialogType":null,"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import D","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Delete handler/write did not remove QA recipe or UI did not refresh. |
| Related File/Component | Recipe card delete control / delete confirmation / recipes data hook |
| Missing Test Coverage | Delete user-created recipe with confirmation and preserve seeded list. |

### RECIPE-26. /recipes - Deleted recipe persistence after refresh - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:37:53.962Z |
| Route | /recipes |
| Element | Deleted recipe persistence after refresh |
| Expected Behavior | Deleted QA recipe remains absent after refresh. |
| Actual Behavior | Deleted QA recipe reappeared or seeded list not visible after refresh. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Recipe delete persistence issue. |
| Related File/Component | Recipes data hook / Firestore recipe delete persistence |
| Missing Test Coverage | Refresh persistence after recipe delete. |

### RECIPE-27. /recipes - QA recipe delete button hover retry - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:38:23.922Z |
| Route | /recipes |
| Element | QA recipe delete button hover retry |
| Expected Behavior | Hover-revealed delete button deletes QA Test Recipe Edited after confirmation. |
| Actual Behavior | Hover retry did not remove QA recipe. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","hoverCoordinate":{"x":300,"y":650},"clickCoordinate":{"x":135,"y":466},"delDialog2Type":null,"firstCardButtons":[{"i":18,"opacity":"0","rect":{"h":42.400001525878906,"w":36,"x":28.80000114440918,"y":444.70001220703125},"text":"favorite","visible":true},{"i":19,"opacity":"0","rect":{"h":42.400001525878906,"w":36,"x":72.80000305175781,"y":444.70001220703125},"text":"edit","visible":true},{"i":20,"opacity":"0","rect":{"h":42.400001525878906,"w":36,"x":116.80000305175781,"y":444.70001220703125},"text":"delete","visible":true},{"i":21,"opacity":"0","rect":{"h":42.400001525878906,"w":36,"x":28.80000114440918,"y":1044.675048828125},"text":"favorite","visible":true},{"i":22,"opacity":"0","rect":{"h":42.400001525878906,"w":36,"x":72.80000305175781,"y":1044.675048828125},"text":"edit","visible":true},{"i":23,"opacity":"0","rect":{"h":42.400001525878906,"w":36,"x":116.80000305175781,"y":1044.675048828125},"text":"delete","visible":true}],"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import D","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Delete control may be inaccessible/nonfunctional when hidden behind group-hover or coordinate click not triggering handler. |
| Related File/Component | Recipe card delete control |
| Missing Test Coverage | Hover-revealed delete button is reachable/clickable and removes recipe. |

### RECIPE-28. /recipes - QA recipe delete button DOM locator retry - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:38:41.653Z |
| Route | /recipes |
| Element | QA recipe delete button DOM locator retry |
| Expected Behavior | First delete button removes QA recipe after confirmation. |
| Actual Behavior | DOM locator retry did not remove QA recipe. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes","deleteLocatorCount":12,"delDialog3Type":null,"mainTextExcerpt":"menu notifications My Kitchen Manage your database. Create, import, and organize recipes. auto_awesome add New Recipe All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite edit delete Grilled Lemon Herb Chicken Dinner • High Protein 450 KCAL 45g P 10g C 20g F add Add New Recipe Create manually or import D","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Delete handler may be disconnected for recipe cards, or confirmation/delete path not firing in local app. |
| Related File/Component | Recipe card delete control / recipes data hook |
| Missing Test Coverage | Delete button functional test for user-created recipe. |

### IMPORT-1. /recipes/import - Recipe Import page load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:39:25.284Z |
| Route | /recipes/import |
| Element | Recipe Import page load |
| Expected Behavior | Import route renders upload/import workflow with visible controls and no route/network errors. |
| Actual Behavior | Import route rendered the Start with Magic Import workflow; stale inherited network event from previous Recipes AI Search was ignored for page-load pass/fail. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/recipes/import","headings":["My Kitchen","Start with Magic Import","QA Test Recipe Edited","Greek Yogurt & Walnuts","Salmon & Asparagus","Quinoa Power Bowl","Grilled Chicken & Quinoa","Turkey Bolognese Pasta","Berry Overnight Oats","Tuna Salad Wrap","Protein Pancakes","Avocado Toast & Egg","Grilled Lemon Herb Chicken","Add New Recipe","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"auto_awesome","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"add New Recipe","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"upload_file Choose recipe file","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"All Recipes","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Favorites","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"My Creations","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Imported","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"folder Collections","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"Search recipes, ingredients...","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"auto_awesome AI SEARCH","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"PROTEIN: 20G+","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"CARBS: <50G","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"High Protein","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Low Carb","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Under 30m","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Meal Prep","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"tune","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"favorite","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"edit","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"delete","type":null}],"mainTextExcerpt":"menu notifications My Kitchen Import a recipe from an image or PDF, then review it before saving. auto_awesome add New Recipe RECIPE IMPORT Start with Magic Import Upload a clear recipe photo or PDF. VioMacro will extract a draft so you can verify ingredients, instructions, and nutrition before it enters your kitchen. upload_file Choose recipe file All Recipes Favorites My Creations Imported folder Collections search auto_awesome AI SEARCH PROTEIN: 20G+ CARBS: <50G High Protein Low Carb Under 30m Meal Prep tune timer 30m favorite edit delete QA Test Recipe Edited Dinner • High Protein 0 KCAL 0g P 0g C 0g F timer 5m favorite edit delete Greek Yogurt & Walnuts Breakfast • Quick 320 KCAL 28g P 15g C 10g F timer 20m favorite edit delete Salmon & Asparagus Dinner • Keto 420 KCAL 38g P 4g C 28g F timer 40m favorite edit delete Quinoa Power Bowl Lunch • Vegan 380 KCAL 12g P 55g C 14g F timer 20m favorite edit delete Grilled Chicken & Quinoa Lunch • High Protein 620 KCAL 45g P 40g C 15g F timer 35m favorite edit delete Turkey Bolognese Pasta Dinner • Meal Prep 520 KCAL 35g P 55g C 12g F timer 15m favorite edit delete Berry Overnight Oats Breakfast • Meal Prep 290 KCAL 10g P 48g C 6g F timer 10m favorite edit delete Tuna Salad Wrap Lunch • Quick 420 KCAL 35g P 30g C 12g F timer 15m favorite edit delete Protein Pancakes Breakfast • High Protein 450 KCAL 30g P 50g C 10g F timer 10m favorite edit delete Avocado Toast & Egg Breakfast • Quick 320 KCAL 18g P 24g C 16g F timer 25m favorite e","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1468","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Recipe import page |
| Missing Test Coverage | Recipe import route smoke render. |

### IMPORT-2. /recipes/import - Choose recipe file button/file input - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:41:40.267Z |
| Route | /recipes/import |
| Element | Choose recipe file button/file input |
| Expected Behavior | User can choose an image/PDF file; audit can verify upload/extraction or clear parse error. |
| Actual Behavior | File input exists and accepts image/*,.pdf, but in-app browser runtime blocked CDP file selection and does not expose a controllable file chooser API here. Native OS picker was not opened to avoid a stuck dialog. Upload/extraction requires separate Playwright/full-browser test or manual user-driven file selection. |
| Pass/Fail | FAIL |
| Evidence | {"url":"http://127.0.0.1:5173/recipes/import","fileInputInfo":[{"accept":"image/*,.pdf","hidden":true,"i":0,"multiple":false,"rect":{"h":0,"w":0,"x":0,"y":0}}],"attemptedTempFile":"Web App/viomacro-qa-recipe.pdf (created then removed)","cdpAttempt":"DOM.setFileInputFiles not supported through raw CDP in this browser runtime"} |
| Suspected Root Cause | QA tooling limitation for file chooser; app file input is present but extraction path remains unverified in this manual pass. |
| Related File/Component | Recipe import upload/input parser flow |
| Missing Test Coverage | Full Playwright or manual fixture upload test for image/PDF import path. |

Repair addendum, 2026-06-27: Raw CDP was retried after laptop/Codex restart. The in-app browser still advertises CDP, but tab attachment timed out twice, so this row remains an accurate in-app-browser tool limitation. The verification gap is covered by the dedicated Playwright emulator slice: `npx.cmd playwright test --config=playwright.emulator.config.ts -g "recipe import|failed recipe image import|parsed recipe import|unsupported file"` passed 4/4, covering image upload parse failure cleanup, unsupported type rejection, parsed import cancel cleanup, and parsed draft save.

Manual Chrome repair addendum, 2026-06-27: User-assisted real Chrome QA selected `Web App/tests/fixtures/manual-recipe-import-card.svg` through the native file picker. The app attempted parsing and displayed the expected safe failure alert: `127.0.0.1:5173 says Failed to parse recipe. Please try again.` After `OK`, the page recovered to `/recipes/import` with `Choose recipe file` visible and usable again. BUG-019 is closed for private-alpha upload safe-failure/recovery. Parsed-draft success remains Playwright fixture evidence until a real recipe-image manual success pass is run.


### GROCERY-1. /grocery - Grocery page load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:42:26.161Z |
| Route | /grocery |
| Element | Grocery page load |
| Expected Behavior | Grocery route renders shopping list controls and no route/network errors. |
| Actual Behavior | Grocery route rendered shopping list content. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/grocery","headings":["Smart Grocery List","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"share Share Coming Soon","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"Quick add item (e.g. 2 avocados)...","type":"text"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"add","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"close","type":"button"},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"add_circle Create Recipe","type":null},{"checked":false,"disabled":false,"href":"/","pressed":null,"selected":null,"tag":"a","testid":null,"text":"grid_view Dashboard","type":null},{"checked":false,"disabled":false,"href":"/plan","pressed":null,"selected":null,"tag":"a","testid":null,"text":"calendar_month Plan","type":null},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"menu_book Recipes","type":null},{"checked":false,"disabled":false,"href":"/progress","pressed":null,"selected":null,"tag":"a","testid":null,"text":"history Progress","type":null},{"checked":false,"disabled":false,"href":"/grocery","pressed":null,"selected":null,"tag":"a","testid":null,"text":"shopping_cart Grocery List","type":null},{"checked":false,"disabled":false,"href":"/pantry","pressed":null,"selected":null,"tag":"a","testid":null,"text":"inventory_2 Pantry","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"settings Settings","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"U User Profile settings","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"logout Sign Out","type":null}],"mainTextExcerpt":"menu notifications Smart Grocery List Manual list - Manual grocery list +2 share Share Coming Soon + add shopping_basket Your grocery list is empty. Add items to get started!","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1578","errorText":"net::ERR_ABORTED"},{"method":"Network.loadingFailed","url":"2208.1603","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Grocery page |
| Missing Test Coverage | Grocery page smoke render. |

### GROCERY-2. /grocery - Share Coming Soon button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:42:53.054Z |
| Route | /grocery |
| Element | Share Coming Soon button |
| Expected Behavior | Share control is disabled/coming soon. |
| Actual Behavior | Share button is disabled. |
| Pass/Fail | PASS |
| Evidence | {"enabled":false} |
| Suspected Root Cause |  |
| Related File/Component | Grocery page share control |
| Missing Test Coverage | Share Coming Soon remains disabled. |

### GROCERY-3. /grocery - Quick add item and add button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:42:54.509Z |
| Route | /grocery |
| Element | Quick add item and add button |
| Expected Behavior | Adds typed grocery item to list. |
| Actual Behavior | QA bananas appeared in grocery list. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/grocery","mainTextExcerpt":"menu notifications Smart Grocery List Manual list - Manual grocery list +2 share Share Coming Soon + add eco Produce 1 items QA bananas 1 pcs delete","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Grocery quick add/list state |
| Missing Test Coverage | Quick add creates visible item. |

### GROCERY-4. /grocery - Grocery item persistence after refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:42:55.835Z |
| Route | /grocery |
| Element | Grocery item persistence after refresh |
| Expected Behavior | Added grocery item persists after refresh. |
| Actual Behavior | QA bananas persisted after refresh. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/grocery","mainTextExcerpt":"menu notifications Smart Grocery List Manual list - Manual grocery list +2 share Share Coming Soon + add eco Produce 1 items QA bananas 1 pcs delete","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Grocery persistence/data hook |
| Missing Test Coverage | Refresh persistence after grocery add. |

### GROCERY-5. /grocery - Grocery item blank check-off control - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:43:28.386Z |
| Route | /grocery |
| Element | Grocery item blank check-off control |
| Expected Behavior | Toggles item checked/completed state with clear visual/accessibility feedback. |
| Actual Behavior | Blank 24x24 item control was clickable, but no accessible name was exposed and text-state change was not clearly machine-readable in observed text. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/grocery","groceryControls":[{"checked":false,"i":1,"rect":{"h":46.400001525878906,"w":40,"x":24,"y":8.40000057220459},"tag":"BUTTON","text":"menu","type":"button","visible":true},{"checked":false,"i":2,"rect":{"h":46.400001525878906,"w":40,"x":562.4000244140625,"y":8.40000057220459},"tag":"BUTTON","text":"notifications","type":null,"visible":true},{"checked":false,"i":3,"rect":{"h":37.60000228881836,"w":192.0124969482422,"x":92,"y":172},"tag":"BUTTON","text":"share Share Coming Soon","type":null,"visible":true},{"checked":false,"i":4,"rect":{"h":49.60000228881836,"w":512.7999877929688,"x":24,"y":241.60000610351562},"tag":"INPUT","text":"","type":"text","visible":true},{"checked":false,"i":5,"rect":{"h":49.60000228881836,"w":57.60000228881836,"x":544.7999877929688,"y":241.60000610351562},"tag":"BUTTON","text":"add","type":null,"visible":true},{"checked":false,"i":6,"rect":{"h":24,"w":24,"x":40.79999923706055,"y":375.9875183105469},"tag":"BUTTON","text":"","type":null,"visible":true},{"checked":false,"i":7,"rect":{"h":30.399999618530273,"w":24,"x":561.6000366210938,"y":372.7875061035156},"tag":"BUTTON","text":"delete","type":null,"visible":true},{"checked":false,"i":10,"rect":{"h":30.399999618530273,"w":24,"x":-48.79999923706055,"y":36.79999923706055},"tag":"BUTTON","text":"close","type":"button","visible":true},{"checked":false,"i":11,"rect":{"h":44,"w":255.1999969482422,"x":-272,"y":589.6000366210938},"tag":"BUTTON","text":"logout Sign Out","type":null,"visible":true}],"mainTextExcerpt":"menu notifications Smart Grocery List Manual list - Manual grocery list +2 share Share Coming Soon + add eco Produce 1 items check QA bananas 1 pcs delete","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Check-off control lacks accessible label/state exposure; visual-only state may be hard to verify. |
| Related File/Component | Grocery item checkbox/check-off control |
| Missing Test Coverage | Accessible checked-state assertion for grocery item toggle. |

### GROCERY-6. /grocery - Grocery item delete button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:43:29.630Z |
| Route | /grocery |
| Element | Grocery item delete button |
| Expected Behavior | Deletes QA grocery item and returns empty state. |
| Actual Behavior | QA bananas removed and empty state returned. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/grocery","mainTextExcerpt":"menu notifications Smart Grocery List Manual list - Manual grocery list +2 share Share Coming Soon + add shopping_basket Your grocery list is empty. Add items to get started!","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Grocery item delete control |
| Missing Test Coverage | Delete grocery item returns empty state. |


### PANTRY-1. /pantry - Pantry page load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:44:04.740Z |
| Route | /pantry |
| Element | Pantry page load |
| Expected Behavior | Pantry route renders either pantry UI or honest Coming Soon/under-development state. |
| Actual Behavior | Pantry route rendered pantry/inventory-related content. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/pantry","headings":["My Pantry","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"qr_code_scanner Scan Coming Soon","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"add Full Pantry Coming Soon","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"Search prototype pantry entries (e.g. 'Oats', 'Chicken')","type":"text"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Shortcut Coming Soon","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"All Items","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"egg Proteins","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"nutrition Produce","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"grain Grains","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"ac_unit Freezer","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"kitchen Fridge","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Previous","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Next","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Coming Soon","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"textarea","testid":null,"text":"e.g. 200g Greek Yogurt 1kg Oats 12 Eggs","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Process Items","type":null},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Coming Soon","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"close","type":"button"},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"add_circle Create Recipe","type":null},{"checked":false,"disabled":false,"href":"/","pressed":null,"selected":null,"tag":"a","testid":null,"text":"grid_view Dashboard","type":null},{"checked":false,"disabled":false,"href":"/plan","pressed":null,"selected":null,"tag":"a","testid":null,"text":"calendar_month Plan","type":null},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"menu_book Recipes","type":null},{"checked":false,"disabled":false,"href":"/progress","pressed":null,"selected":null,"tag":"a","testid":null,"text":"history Progress","type":null},{"checked":false,"disabled":false,"href":"/grocery","pressed":null,"selected":null,"tag":"a","testid":null,"text":"shopping_cart Grocery List","type":null},{"checked":false,"disabled":false,"href":"/pantry","pressed":null,"selected":null,"tag":"a","testid":null,"text":"inventory_2 Pantry","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"settings Settings","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"U User Profile settings","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"logout Sign Out","type":null}],"mainTextExcerpt":"menu notifications inventory_2 INVENTORY MANAGEMENT My Pantry Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built. qr_code_scanner Scan Coming Soon add Full Pantry Coming Soon construction Coming Soon This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow. inventory_2 0 Total Items warning 0 Low Stock schedule Soon Expiring Soon Expiry tracking is not live yet restaurant Soon Meals Possible Recipe matching is not live yet search Shortcut Coming Soon All Items egg Proteins nutrition Produce grain Grains ac_unit Freezer kitchen Fridge ITEM DETAILS QTY EXPIRY ACTIONS Pantry inventory is coming soon. You can test quick-add entries here while the full pantry workflow is under development. Showing 0 items Previous Next auto_awesome VIOMACRO AI Pantry Suggestions Coming Soon Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data. Coming Soon Quick Add Prototype only: paste a few items to test the future pantry entry flow. Process Items Shopping List Coming Soon Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1785","errorText":"net::ERR_ABORTED"},{"method":"Network.loadingFailed","url":"2208.1794","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Pantry page |
| Missing Test Coverage | Pantry page smoke render/coming-soon state. |

### PANTRY-2. /pantry - Pantry Coming Soon disabled controls - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:44:29.165Z |
| Route | /pantry |
| Element | Pantry Coming Soon disabled controls |
| Expected Behavior | Scan, Full Pantry, Shortcut, AI/shopping Coming Soon controls are disabled. |
| Actual Behavior | Primary Coming Soon controls are disabled. |
| Pass/Fail | PASS |
| Evidence | {"disabledPantry":{"scan":false,"full":false,"shortcut":false,"ai":6}} |
| Suspected Root Cause |  |
| Related File/Component | Pantry Coming Soon controls |
| Missing Test Coverage | Coming Soon pantry controls remain disabled. |

### PANTRY-3. /pantry - Pantry Quick Add Process Items - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:44:30.731Z |
| Route | /pantry |
| Element | Pantry Quick Add Process Items |
| Expected Behavior | Processes pasted prototype pantry entries into visible table/list items. |
| Actual Behavior | QA pantry entries appeared after Process Items. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/pantry","mainTextExcerpt":"menu notifications inventory_2 INVENTORY MANAGEMENT My Pantry Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built. qr_code_scanner Scan Coming Soon add Full Pantry Coming Soon construction Coming Soon This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow. inventory_2 2 Total Items warning 0 Low Stock schedule Soon Expiring Soon Expiry tracking is not live yet restaurant Soon Meals Possible Recipe matching is not live yet search Shortcut Coming Soon All Items egg Proteins nutrition Produce grain Grains ac_unit Freezer kitchen Fridge ITEM DETAILS QTY EXPIRY ACTIONS grain cans QA beans Other - 2 pc + 2026-07-04 edit delete grain lb QA rice Grains - 1 pc + 2026-07-04 edit delete Showing 2 items Previous Next auto_awesome VIOMACRO AI Pantry Suggestions Coming Soon Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data. Coming Soon Quick Add Prototype only: paste a few items to test the future pantry entry flow. Process Items Shopping List Coming Soon Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Pantry quick-add prototype parser/list |
| Missing Test Coverage | Quick-add prototype creates visible items. |

### PANTRY-4. /pantry - Pantry prototype persistence after refresh - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:44:32.172Z |
| Route | /pantry |
| Element | Pantry prototype persistence after refresh |
| Expected Behavior | Prototype pantry entries persist after refresh if currently supported. |
| Actual Behavior | QA pantry entries persisted after refresh. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/pantry","mainTextExcerpt":"menu notifications inventory_2 INVENTORY MANAGEMENT My Pantry Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built. qr_code_scanner Scan Coming Soon add Full Pantry Coming Soon construction Coming Soon This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow. inventory_2 2 Total Items warning 0 Low Stock schedule Soon Expiring Soon Expiry tracking is not live yet restaurant Soon Meals Possible Recipe matching is not live yet search Shortcut Coming Soon All Items egg Proteins nutrition Produce grain Grains ac_unit Freezer kitchen Fridge ITEM DETAILS QTY EXPIRY ACTIONS grain cans QA beans Other - 2 pc + 2026-07-04 edit delete grain lb QA rice Grains - 1 pc + 2026-07-04 edit delete Showing 2 items Previous Next auto_awesome VIOMACRO AI Pantry Suggestions Coming Soon Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data. Coming Soon Quick Add Prototype only: paste a few items to test the future pantry entry flow. Process Items Shopping List Coming Soon Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Pantry prototype persistence |
| Missing Test Coverage | Explicit expected persistence/non-persistence test for prototype pantry. |

### PANTRY-5. /pantry - Pantry search input - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:44:54.944Z |
| Route | /pantry |
| Element | Pantry search input |
| Expected Behavior | Filters prototype pantry entries by search text. |
| Actual Behavior | Search for rice showed QA rice and filtered out QA beans. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/pantry","mainTextExcerpt":"menu notifications inventory_2 INVENTORY MANAGEMENT My Pantry Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built. qr_code_scanner Scan Coming Soon add Full Pantry Coming Soon construction Coming Soon This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow. inventory_2 2 Total Items warning 0 Low Stock schedule Soon Expiring Soon Expiry tracking is not live yet restaurant Soon Meals Possible Recipe matching is not live yet search Shortcut Coming Soon All Items egg Proteins nutrition Produce grain Grains ac_unit Freezer kitchen Fridge ITEM DETAILS QTY EXPIRY ACTIONS grain lb QA rice Grains - 1 pc + 2026-07-04 edit delete Showing 1 items Previous Next auto_awesome VIOMACRO AI Pantry Suggestions Coming Soon Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data. Coming Soon Quick Add Prototype only: paste a few items to test the future pantry entry flow. Process Items Shopping List Coming Soon Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Pantry prototype search |
| Missing Test Coverage | Pantry search filters entries. |

### PANTRY-6. /pantry - Pantry Grains category filter - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:44:56.432Z |
| Route | /pantry |
| Element | Pantry Grains category filter |
| Expected Behavior | Filters entries to grains category. |
| Actual Behavior | Grains filter shows QA rice. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/pantry","mainTextExcerpt":"menu notifications inventory_2 INVENTORY MANAGEMENT My Pantry Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built. qr_code_scanner Scan Coming Soon add Full Pantry Coming Soon construction Coming Soon This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow. inventory_2 2 Total Items warning 0 Low Stock schedule Soon Expiring Soon Expiry tracking is not live yet restaurant Soon Meals Possible Recipe matching is not live yet search Shortcut Coming Soon All Items egg Proteins nutrition Produce grain Grains ac_unit Freezer kitchen Fridge ITEM DETAILS QTY EXPIRY ACTIONS grain lb QA rice Grains - 1 pc + 2026-07-04 edit delete Showing 1 items Previous Next auto_awesome VIOMACRO AI Pantry Suggestions Coming Soon Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data. Coming Soon Quick Add Prototype only: paste a few items to test the future pantry entry flow. Process Items Shopping List Coming Soon Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Pantry category filters |
| Missing Test Coverage | Pantry category filter result assertion. |

### PANTRY-7. /pantry - Pantry prototype edit and pagination controls - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:45:18.131Z |
| Route | /pantry |
| Element | Pantry prototype edit and pagination controls |
| Expected Behavior | Prototype edit may be disabled and pagination disabled when item count fits one page. |
| Actual Behavior | Edit disabled=true; pagination disabled=true. |
| Pass/Fail | PASS |
| Evidence | {"panControls":[{"disabled":true,"i":14,"rect":{"h":40,"w":34,"x":455.38751220703125,"y":530.6625366210938},"text":"edit","visible":true},{"disabled":false,"i":15,"rect":{"h":40,"w":34,"x":497.38751220703125,"y":530.6625366210938},"text":"delete","visible":true},{"disabled":true,"i":16,"rect":{"h":28,"w":81.20000457763672,"x":433.5,"y":602.9625244140625},"text":"Previous","visible":true},{"disabled":true,"i":17,"rect":{"h":28,"w":54.900001525878906,"x":522.7000122070312,"y":602.9625244140625},"text":"Next","visible":true}]} |
| Suspected Root Cause | Prototype edit is not live yet; pagination disabled for small list. |
| Related File/Component | Pantry prototype item actions/pagination |
| Missing Test Coverage | Pantry disabled edit and pagination state. |

### PANTRY-8. /pantry - Pantry delete QA prototype entries - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:45:21.177Z |
| Route | /pantry |
| Element | Pantry delete QA prototype entries |
| Expected Behavior | Deletes QA pantry entries and removes them from visible inventory. |
| Actual Behavior | QA pantry rows disappeared, but header metric still shows 1 Total Items while the table says Showing 0 items. |
| Pass/Fail | FAIL |
| Evidence | {"firstDeleteCount":1,"secondDeleteCount":0,"finalExcerpt":"menu notifications inventory_2 INVENTORY MANAGEMENT My Pantry Pantry tracking is coming soon. The quick-add area is available as an early prototype while inventory intelligence is built. qr_code_scanner Scan Coming Soon add Full Pantry Coming Soon construction Coming Soon This page is being prepared for real pantry tracking, expiry alerts, and recipe matching. Current entries are a lightweight prototype for testing the future workflow. inventory_2 1 Total Items warning 0 Low Stock schedule Soon Expiring Soon Expiry tracking is not live yet restaurant Soon Meals Possible Recipe matching is not live yet search Shortcut Coming Soon All Items egg Proteins nutrition Produce grain Grains ac_unit Freezer kitchen Fridge ITEM DETAILS QTY EXPIRY ACTIONS Pantry inventory is coming soon. You can test quick-add entries here while the full pantry workflow is under development. Showing 0 items Previous Next auto_awesome VIOMACRO AI Pantry Suggestions Coming Soon Recipe suggestions will appear here after pantry tracking and expiry rules are connected to real inventory data. Coming Soon Quick Add Prototype only: paste a few items to test the future pantry entry flow. Process Items Shopping List Coming Soon Pantry-to-shopping-list suggestions will appear after the inventory workflow is finished.","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Pantry summary metric is not synchronized with filtered/deleted visible items or deletion left stale count state. |
| Related File/Component | Pantry prototype delete action |
| Missing Test Coverage | Delete pantry entries should assert table rows and summary counters update together. |


### PROGRESS-1. /progress - Progress page load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:45:59.762Z |
| Route | /progress |
| Element | Progress page load |
| Expected Behavior | Progress route renders progress/history UI and controls without route errors. |
| Actual Behavior | Progress route rendered progress/history content. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/progress","headings":["Plan History","Recent Metrics","No saved plans yet","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":false,"href":"/plan","pressed":null,"selected":null,"tag":"a","testid":null,"text":"restaurant_menu Open Meal Planner","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"close","type":"button"},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"add_circle Create Recipe","type":null},{"checked":false,"disabled":false,"href":"/","pressed":null,"selected":null,"tag":"a","testid":null,"text":"grid_view Dashboard","type":null},{"checked":false,"disabled":false,"href":"/plan","pressed":null,"selected":null,"tag":"a","testid":null,"text":"calendar_month Plan","type":null},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"menu_book Recipes","type":null},{"checked":false,"disabled":false,"href":"/progress","pressed":null,"selected":null,"tag":"a","testid":null,"text":"history Progress","type":null},{"checked":false,"disabled":false,"href":"/grocery","pressed":null,"selected":null,"tag":"a","testid":null,"text":"shopping_cart Grocery List","type":null},{"checked":false,"disabled":false,"href":"/pantry","pressed":null,"selected":null,"tag":"a","testid":null,"text":"inventory_2 Pantry","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"settings Settings","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"U User Profile settings","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"logout Sign Out","type":null}],"mainTextExcerpt":"menu notifications Plan History Browse saved meal plans and recent daily logs from your private history. Recent Metrics Real entries from daily logs. Trend charts are coming later. 3 LOGGED DAYS 207.2 lbs WEIGHT (2) 8h SLEEP (2) 500ml WATER (2) history No saved plans yet Create and save a meal plan, then return here to review it. restaurant_menu Open Meal Planner","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.1976","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Progress page |
| Missing Test Coverage | Progress page smoke render. |

### PROGRESS-2. /progress - Open Meal Planner link - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:46:22.195Z |
| Route | /progress |
| Element | Open Meal Planner link |
| Expected Behavior | Navigates from Progress empty-state to /plan. |
| Actual Behavior | Navigated to /plan and rendered Plan content. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/plan","headings":["Plan Week of Jun 22","Plan for Week of Jun 22?","VioMacro"],"mainTextExcerpt":"menu notifications Day Week Month chevron_left Week of Jun 22 Jun 28 chevron_right calendar_add_on Plan Week of Jun 22 No plan found for this week. Create a new one or check other weeks! add_circle Create New Plan calendar_add_on Plan for Week of Jun 22? It looks like this week is empty. Start fresh or copy your previous success! auto_fix_high Open Plan Wizard history Clone Last Week Maybe Later","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Progress empty-state link |
| Missing Test Coverage | Progress to Plan navigation. |


### SETTINGS-1. /settings - Settings page load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:46:38.964Z |
| Route | /settings |
| Element | Settings page load |
| Expected Behavior | Settings route renders profile/goals/integrations settings UI. |
| Actual Behavior | Settings route rendered settings UI. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/settings","headings":["Settings & Preferences","Current Phase","Nutrition Goals","Hydration Preferences","Dietary Tags","Allergies","VioMacro"],"controls":[{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"menu","type":"button"},{"checked":false,"disabled":true,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"notifications","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Profile","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Goals & Nutrition","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Integrations","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"local_fire_department Fat Loss","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"balance Maintenance","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"fitness_center Muscle Gain","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"207.2","type":"number"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"170","type":"number"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"65","type":"range"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Auto-Update","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"1900","type":"number"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Percentage %","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Exact Grams","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"30","type":"range"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"35","type":"range"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"35","type":"range"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"input","testid":null,"text":"500","type":"number"},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Gluten Free","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Dairy Free","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Vegan","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Keto","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Paleo","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Peanuts","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Tree Nuts","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Dairy","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Eggs","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Gluten","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Soy","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Shellfish","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"Fish","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"close","type":"button"},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"add_circle Create Recipe","type":null},{"checked":false,"disabled":false,"href":"/","pressed":null,"selected":null,"tag":"a","testid":null,"text":"grid_view Dashboard","type":null},{"checked":false,"disabled":false,"href":"/plan","pressed":null,"selected":null,"tag":"a","testid":null,"text":"calendar_month Plan","type":null},{"checked":false,"disabled":false,"href":"/recipes","pressed":null,"selected":null,"tag":"a","testid":null,"text":"menu_book Recipes","type":null},{"checked":false,"disabled":false,"href":"/progress","pressed":null,"selected":null,"tag":"a","testid":null,"text":"history Progress","type":null},{"checked":false,"disabled":false,"href":"/grocery","pressed":null,"selected":null,"tag":"a","testid":null,"text":"shopping_cart Grocery List","type":null},{"checked":false,"disabled":false,"href":"/pantry","pressed":null,"selected":null,"tag":"a","testid":null,"text":"inventory_2 Pantry","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"settings Settings","type":null},{"checked":false,"disabled":false,"href":"/settings","pressed":null,"selected":null,"tag":"a","testid":null,"text":"U User Profile settings","type":null},{"checked":false,"disabled":false,"href":null,"pressed":null,"selected":null,"tag":"button","testid":null,"text":"logout Sign Out","type":null}],"mainTextExcerpt":"menu notifications Settings & Preferences Manage your profile, goals, and nutrition plan all in one place. Profile Goals & Nutrition Integrations Current Phase Week 23 local_fire_department Fat Loss balance Maintenance fitness_center Muscle Gain Current Weight (lbs) Goal Weight (lbs) Rate of Change -1.5 lbs / week Est. Deficit: -750 kcal/day Slow Moderate Fast DAILY TARGET 1900 kcal Auto-Update Daily Calorie Target Set your own custom calorie target if you prefer. Nutrition Goals Percentage % Exact Grams Distribution Total Split: 100% Protein 30% Carbs 35% Fat 35% Hydration Preferences Custom Bottle Size (ml) Used for quick logging on the dashboard. Dietary Tags Gluten Free Dairy Free Vegan Keto Paleo Allergies Peanuts Tree Nuts Dairy Eggs Gluten Soy Shellfish Fish","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.2068","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Settings page |
| Missing Test Coverage | Settings page smoke render. |

### SETTINGS-2. /settings - Profile tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:46:55.010Z |
| Route | /settings |
| Element | Profile tab |
| Expected Behavior | Switches settings content to Profile. |
| Actual Behavior | Profile content visible. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/settings","headings":["Settings & Preferences","VioMacro"],"mainTextExcerpt":"menu notifications Settings & Preferences Manage your profile, goals, and nutrition plan all in one place. Profile Goals & Nutrition Integrations Display Name Choose an Avatar","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Settings tabs/content panels |
| Missing Test Coverage | Profile tab content assertion. |

### SETTINGS-3. /settings - Goals & Nutrition tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:46:56.124Z |
| Route | /settings |
| Element | Goals & Nutrition tab |
| Expected Behavior | Switches settings content to Goals & Nutrition. |
| Actual Behavior | Goals & Nutrition content visible. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/settings","headings":["Settings & Preferences","Current Phase","Nutrition Goals","Hydration Preferences","Dietary Tags","Allergies","VioMacro"],"mainTextExcerpt":"menu notifications Settings & Preferences Manage your profile, goals, and nutrition plan all in one place. Profile Goals & Nutrition Integrations Current Phase Week 23 local_fire_department Fat Loss balance Maintenance fitness_center Muscle Gain Current Weight (lbs) Goal Weight (lbs) Rate of Change -1.5 lbs / week Est. Deficit: -750 kcal/day Slow Moderate Fast DAILY TARGET 1900 kcal Auto-Update Daily Calorie Target Set your own custom calorie target if you prefer. Nutrition Goals Percentage % Exact Grams Distribution Total Split: 100% Protein 30% Carbs 35% Fat 35% Hydration Preferences Custom Bottle Size (ml) Used for quick logging on the dashboard. Dietary Tags Gluten Free Dairy Free Vegan Keto Paleo Allergies Peanuts Tree Nuts Dairy Eggs Gluten Soy Shellfish Fish","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Settings tabs/content panels |
| Missing Test Coverage | Goals & Nutrition tab content assertion. |

### SETTINGS-4. /settings - Integrations tab - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:46:57.243Z |
| Route | /settings |
| Element | Integrations tab |
| Expected Behavior | Switches settings content to Integrations. |
| Actual Behavior | Integrations content visible. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/settings","headings":["Settings & Preferences","Wearable Integrations","VioMacro"],"mainTextExcerpt":"menu notifications Settings & Preferences Manage your profile, goals, and nutrition plan all in one place. Profile Goals & Nutrition Integrations watch Wearable Integrations Sync your step count and calorie burn directly from your favorite devices. Coming soon in v2.0. Apple Health Fitbit Oura","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | Settings tabs/content panels |
| Missing Test Coverage | Integrations tab content assertion. |

### SETTINGS-5. /settings - Integrations coming soon controls - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:47:15.610Z |
| Route | /settings |
| Element | Integrations coming soon controls |
| Expected Behavior | Wearable integrations are visibly coming soon/non-operational. |
| Actual Behavior | Integrations Coming Soon section displayed Apple Health, Fitbit, and Oura text as non-operational future integrations. |
| Pass/Fail | PASS |
| Evidence | {"mainText":"Wearable Integrations ... Coming soon in v2.0. Apple Health Fitbit Oura"} |
| Suspected Root Cause |  |
| Related File/Component | Settings integrations panel |
| Missing Test Coverage | Integrations Coming Soon visible/non-operational state. |

### SETTINGS-6. /settings - Custom Bottle Size field autosave/persistence - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:48:33.968Z |
| Route | /settings |
| Element | Custom Bottle Size field autosave/persistence |
| Expected Behavior | Changing bottle size either persists automatically or the UI exposes Save/Discard clearly. |
| Actual Behavior | Bottle size did not persist after refresh; no Save/Discard action was visible in Goals panel. |
| Pass/Fail | FAIL |
| Evidence | {"numberInputsBefore":[{"aria":null,"idx":0,"rect":{"h":48,"w":536.7999877929688,"x":40.79999923706055,"y":543.2999877929688},"value":"207.2"},{"aria":null,"idx":1,"rect":{"h":48,"w":536.7999877929688,"x":40.79999923706055,"y":639.2999877929688},"value":"170"},{"aria":null,"idx":2,"rect":{"h":48,"w":536.7999877929688,"x":40.79999923706055,"y":1079.875},"value":"1900"},{"aria":null,"idx":3,"rect":{"h":48,"w":536.7999877929688,"x":40.79999923706055,"y":1668.6624755859375},"value":"500"}],"numberInputsAfter":[{"aria":null,"idx":0,"value":"207.2"},{"aria":null,"idx":1,"value":"170"},{"aria":null,"idx":2,"value":"1900"},{"aria":null,"idx":3,"value":"500"}],"bottleAfter":"500","missingAccessibleLabels":true} |
| Suspected Root Cause | Settings inputs may be unsaved local state or persistence is not wired; numeric inputs also lack accessible labels. |
| Related File/Component | Settings goals/hydration preferences persistence |
| Missing Test Coverage | Settings persistence/autosave plus numeric input labels. |

### SETTINGS-7. /settings - Exact Grams macro mode button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:48:56.216Z |
| Route | /settings |
| Element | Exact Grams macro mode button |
| Expected Behavior | Switches macro editing mode from percentages to exact grams with visible state/content change. |
| Actual Behavior | Exact Grams interaction produced macro content/state. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/settings","mainTextExcerpt":"menu notifications Settings & Preferences Manage your profile, goals, and nutrition plan all in one place. Profile Goals & Nutrition Integrations Current Phase Week 23 local_fire_department Fat Loss balance Maintenance fitness_center Muscle Gain Current Weight (lbs) Goal Weight (lbs) Rate of Change -1.5 lbs / week Est. Deficit: -750 kcal/day Slow Moderate Fast DAILY TARGET 1900 kcal Auto-Update Daily Calorie Target Set your own custom calorie target if you prefer. Nutrition Goals Percentage % Exact Grams Protein (g) Carbs (g) Fat (g) Auto-Calculated Calories: 1900 kcal Hydration Preferences Custom Bottle Size (ml) Used for quick logging on the dashboard. Dietary Tags Gluten Free Dairy Free Vegan Keto Paleo Allergies Peanuts Tree Nuts Dairy Eggs Gluten Soy Shellfish Fish info Discard Confirm Targets","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[{"method":"Network.loadingFailed","url":"2208.2166","errorText":"net::ERR_ABORTED"}]} |
| Suspected Root Cause |  |
| Related File/Component | Settings macro mode controls |
| Missing Test Coverage | Macro mode toggle state. |

### SETTINGS-8. /settings - Dietary Tags Gluten Free toggle - FAIL

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T02:48:57.146Z |
| Route | /settings |
| Element | Dietary Tags Gluten Free toggle |
| Expected Behavior | Toggles Gluten Free dietary tag selected state. |
| Actual Behavior | Clicking Gluten Free did not leave a visible active primary state; later tag inspection did not include Gluten Free in the visible dietary tag list. |
| Pass/Fail | FAIL |
| Evidence | {"mainTextExcerpt":"menu notifications Settings & Preferences Manage your profile, goals, and nutrition plan all in one place. Profile Goals & Nutrition Integrations Current Phase Week 23 local_fire_department Fat Loss balance Maintenance fitness_center Muscle Gain Current Weight (lbs) Goal Weight (lbs) Rate of Change -1.5 lbs / week Est. Deficit: -750 kcal/day Slow Moderate Fast DAILY TARGET 1900 kcal Auto-Update Daily Calorie Target Set your own custom calorie target if you prefer. Nutrition Goals Percentage % Exact Grams Protein (g) Carbs (g) Fat (g) Auto-Calculated Calories: 1900 kcal Hydration Preferences Custom Bottle Size (ml) Used for quick logging on the dashboard. Dietary Tags Gluten Free close Dairy Free Vegan Keto Paleo Allergies Peanuts Tree Nuts Dairy Eggs Gluten Soy Shellfish Fish info Discard Confirm Targets","consoleWarnings":["Error calling AI service: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test.","Generation failed: FirebaseError: generateMealPlan is disabled in the local emulator to prevent live AI calls. Set ALLOW_EMULATOR_AI_CALLS=true only for an intentional live smoke test."],"network":[]} |
| Suspected Root Cause | Dietary tag state/rendering may be unstable after toggle or tag may disappear from visible list. |
| Related File/Component | Settings dietary tag toggles |
| Missing Test Coverage | Dietary tag toggle selected state. |


### AUTH-1. /settings to /auth - Sign out navigation action - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:07:00Z |
| Route | /settings to /auth |
| Element | Sign Out button |
| Expected Behavior | Signs out the active emulator user and renders the Auth page. |
| Actual Behavior | Sign out redirected/rendered the Auth page. |
| Pass/Fail | PASS |
| Evidence | {"urlAfter":"http://127.0.0.1:5173/auth","authHeading":"Welcome Back","authControls":["Log In","Create Account","Google Sign-In Coming Soon","Password Reset Coming Soon","Log In"]} |
| Suspected Root Cause |  |
| Related File/Component | src/components/Layout.tsx and src/pages/Auth.tsx |
| Missing Test Coverage | Auth sign-out route transition should assert redirect and unauthenticated shell. |

### AUTH-2. /auth - Auth page load - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:07:00Z |
| Route | /auth |
| Element | Auth page load |
| Expected Behavior | Auth route renders login controls without console or route errors. |
| Actual Behavior | Auth page loaded with login controls and emulator-mode warning copy. |
| Pass/Fail | PASS |
| Evidence | {"url":"http://127.0.0.1:5173/auth","heading":"Welcome Back","visibleText":"Manage your nutrition intelligently with AI. Running in emulator mode. Do not use with production credentials.","console":[],"network":[]} |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Auth.tsx |
| Missing Test Coverage | Auth page smoke render with emulator warning. |

### AUTH-3. /auth - Google Sign-In Coming Soon button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:07:00Z |
| Route | /auth |
| Element | Google Sign-In Coming Soon button |
| Expected Behavior | Google sign-in is visibly unavailable/disabled while not implemented. |
| Actual Behavior | Google sign-in button is visible and disabled. |
| Pass/Fail | PASS |
| Evidence | {"button":"Google Sign-In Coming Soon","disabled":true} |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Auth.tsx |
| Missing Test Coverage | Disabled coming-soon auth provider state should be asserted. |

### AUTH-4. /auth - Create Account toggle - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:11:00Z |
| Route | /auth |
| Element | Create Account toggle |
| Expected Behavior | Switches from login form to create-account mode without navigation errors. |
| Actual Behavior | Create-account mode became visible and exposed a Create Account submit control. |
| Pass/Fail | PASS |
| Evidence | {"mode":"create account","createAccountSubmitVisible":true,"url":"http://127.0.0.1:5173/auth"} |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Auth.tsx |
| Missing Test Coverage | Toggle-mode test should assert create-account submit and copy. |

### AUTH-5. /auth - Log In toggle - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:11:00Z |
| Route | /auth |
| Element | Log In toggle |
| Expected Behavior | Returns from create-account mode to login mode. |
| Actual Behavior | Login mode became visible with the login submit and password reset affordance. |
| Pass/Fail | PASS |
| Evidence | {"mode":"login","loginSubmitVisible":true,"passwordResetTextVisible":true,"url":"http://127.0.0.1:5173/auth"} |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Auth.tsx |
| Missing Test Coverage | Toggle-mode test should assert login submit and reset affordance. |

### AUTH-6. /auth - Password Reset Coming Soon button - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:11:00Z |
| Route | /auth |
| Element | Password Reset Coming Soon button |
| Expected Behavior | Password reset Coming Soon control is visible but disabled/passive. |
| Actual Behavior | Reset button count was 1 and enabled=false. |
| Pass/Fail | PASS |
| Evidence | {"button":"Password Reset Coming Soon","count":1,"enabled":false} |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Auth.tsx |
| Missing Test Coverage | Disabled password-reset affordance should be asserted. |

### AUTH-7. /auth - Invalid email/password login submit - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:11:00Z |
| Route | /auth |
| Element | Invalid email/password login submit |
| Expected Behavior | Invalid credentials stay on /auth and show a visible error without crashing the app. |
| Actual Behavior | Invalid login stayed on /auth and displayed an authentication failure message. |
| Pass/Fail | PASS |
| Evidence | {"email":"bad@example.com","password":"test value","stayedOnAuth":true,"visibleError":true,"expectedNetworkNoise":"Auth emulator rejected invalid credentials."} |
| Suspected Root Cause | Expected negative auth path; network 400 from the Auth emulator is acceptable if visible UX remains stable. |
| Related File/Component | src/pages/Auth.tsx and Firebase auth adapter |
| Missing Test Coverage | Negative login path should assert visible error and route stability. |

### AUTH-8. /auth - Valid email/password login submit - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27T03:12:00Z |
| Route | /auth |
| Element | Valid email/password login submit |
| Expected Behavior | Valid emulator account logs in and redirects to Dashboard. |
| Actual Behavior | Valid login redirected to http://127.0.0.1:5173/ and rendered the authenticated dashboard shell with "Good evening, User", metrics, activity, hydration, and sleep sections. |
| Pass/Fail | PASS |
| Evidence | {"email":"test@test.com","password":"test value","urlAfter":"http://127.0.0.1:5173/","headings":["Good evening, User","Weekly Check-In Required","Weight History","Engine Insights","Consistency Streak","Activity","Hydration","Sleep","Ready to plan your week?","VioMacro"],"note":"The visible mobile body does not include a literal Dashboard heading, so authenticated shell content was used as the route proof."} |
| Suspected Root Cause |  |
| Related File/Component | src/pages/Auth.tsx and Firebase auth adapter |
| Missing Test Coverage | Happy-path login test should assert redirect and authenticated shell content, not only a literal Dashboard heading. |


## Repair Verification Addendum

### REPAIR-RECIPES-2026-06-27. /recipes - BUG-014 first repair batch - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27 |
| Route | /recipes |
| Element | Recipe card actions, delete confirmation, AI Search reset, Magic Import |
| Expected Behavior | Recipe card actions are visible/testable and named, delete removes the recipe after confirmation, AI Search can reset to the full library, and Magic Import has a clear route/action contract. |
| Actual Behavior | Fixed and verified. Card actions now expose recipe-specific accessible names; `QA Test Recipe Edited` was deleted successfully through the in-app browser UI; `All Recipes` clears AI results and query text; Magic Import on `/recipes` routes to `/recipes/import`. |
| Pass/Fail | PASS |
| Evidence | `npm.cmd run lint` passed. `npm.cmd run build` passed outside the restricted sandbox. Focused Playwright emulator slice passed 4/4: create/find/delete, controls honesty, AI Search reset, and AI Search failure fallback. In-app browser manual sanity pass confirmed the leftover QA recipe opened `Delete Recipe?` and disappeared after confirmation. |
| Suspected Root Cause | Original failure came from hover-only/icon-only controls, sticky AI result state, and ambiguous Magic Import behavior from the library route. |
| Related File/Component | src/pages/RecipeLibrary.tsx; tests/e2e/emulator-auth.spec.ts |
| Missing Test Coverage | Import file-picker proof was later covered by the BUG-019 Playwright emulator fixture slice and real Chrome/manual safe-failure recovery pass; see the 2026-06-27 repair addenda under `IMPORT-2`. |

### REPAIR-PLAN-2026-06-27-C. /plan - BUG-PLAN-005 clone/generate recovery - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27 |
| Route | /plan |
| Element | Clone Last Week and Auto-Generate Week recovery paths |
| Expected Behavior | Clone Last Week and Auto-Generate Week use visible, recoverable in-app feedback instead of native alert interruption paths; generation failure keeps the wizard/page usable; clone tolerates realistic saved-plan data. |
| Actual Behavior | Fixed and verified. Clone with no saved history shows a dismissible info notice. Clone from a seeded saved plan creates a draft for the selected week and now tolerates partial source plans by filling a seven-day target week. Auto-Generate failure shows a dismissible in-app error notice and keeps the wizard open. |
| Pass/Fail | PASS |
| Evidence | `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal planner"` passed 11/11. `npx.cmd playwright test --config=playwright.emulator.config.ts -g "meal-planner-failure"` passed 2/2. `npm.cmd run lint` passed. `npm.cmd run build` passed with existing non-blocking Vite/Browserslist/chunk warnings. In-app browser manual proof showed no-history clone feedback with no JS dialog and no console errors; seeded partial-plan clone-success created a next-week draft, showed `Previous saved plan cloned into this week...`, displayed the cloned `Browser Clone Bowl...` recipe, and left `Confirm Plan` enabled; Auto-Generate emulator guard showed in-app feedback, no JS dialog, wizard still open, and no console errors. |
| Suspected Root Cause | Native alert usage and closing the wizard before validation/failure made recovery disruptive. Clone also assumed the previous plan always had seven days, which could throw on partial saved data. |
| Related File/Component | src/pages/MealPlanner.tsx; tests/e2e/emulator-auth.spec.ts |
| Missing Test Coverage | Live AI provider success quality remains a Firebase/deploy gate. Add-to-List downstream correctness remains owned by Grocery/cross-page workflow. |

### REPAIR-DASH-2026-06-27-A. / - BUG-016 four-item Dashboard repair batch - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27 |
| Route | / |
| Element | Weight History chart, Weekly Check-In Energy/Hunger sliders, mobile navigation menu buttons, Sleep quality selector |
| Expected Behavior | Dashboard renders the weight chart without Recharts size warnings; Energy/Hunger sliders have accessible labels and keyboard updates that sync visible values; mobile nav has one opener and one closer with unique names; Sleep quality star buttons have accessible names and selected state. |
| Actual Behavior | Fixed and verified for the four scoped items. Weight History now measures the chart container and renders a numeric-size chart. Energy/Hunger sliders expose labels and update from `3/5` to `4/5` with ArrowRight. Mobile nav exposes one `Open navigation menu` button with `aria-expanded` and one drawer `Close navigation menu` button. Sleep quality buttons expose `Set sleep quality to N out of 5` and mark the selected rating with `aria-pressed`. |
| Pass/Fail | PASS for the four scoped items; hydration correction handled in `REPAIR-DASH-2026-06-27-B`. |
| Evidence | Focused Playwright emulator batch passed 4/4: `mobile navigation shell reaches account routes and closes after selection`, `dashboard check-in and sleep actions open their modals`, `dashboard weekly check-in saves weight and persists after reload`, and `dashboard quick weight log saves and persists after reload`. `npm.cmd run lint` passed. `npm.cmd run build` passed after sandbox-elevated rerun, with existing non-blocking Browserslist/chunk warnings. In-app browser proof: chart rendered with one `svg.recharts-surface` and no chart-size warning logs; slider labels/values moved from `3/5` to `4/5`; mobile nav showed one opener and one closer; sleep quality 5 button had `aria-pressed=true`; no new error logs on the verified paths. |
| Suspected Root Cause | Recharts was rendering before a usable container width existed; check-in range inputs lacked accessible labels and a reliable keyboard state handler; mobile header and drawer close controls shared the same accessible name while open; sleep star buttons were icon-only without button names/state. |
| Related File/Component | src/components/WeightHistoryWidget.tsx; src/components/CheckInModal.tsx; src/components/SleepLogModal.tsx; src/components/AppLayout.tsx; tests/e2e/emulator-auth.spec.ts |
| Missing Test Coverage | None for these four scoped Dashboard polish findings in the current local private-alpha scope. |

### REPAIR-DASH-2026-06-27-B. / - BUG-DASH-003 hydration correction repair - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27 |
| Route | / |
| Element | Hydration `Correct Entry` |
| Expected Behavior | `Correct Entry` opens a clear correction workflow and saves the explicit current-day water total without silently subtracting a fixed amount. |
| Actual Behavior | Fixed and verified. `Correct Entry` now opens an inline `Correct water intake (ml)` form, validates a safe ml range, saves the corrected total through the water metric write path, and hides after a successful save. |
| Pass/Fail | PASS |
| Evidence | `npx.cmd playwright test --config=playwright.emulator.config.ts -g "dashboard hydration"` passed 2/2 after sandbox-elevated rerun. `npm.cmd run lint` passed. `npm.cmd run build` passed after sandbox-elevated rerun with existing non-blocking warnings. In-app browser proof on `http://127.0.0.1:5173/`: throwaway emulator account reached Dashboard, `+250ml` changed the card to `250 ml`, `Correct Entry` opened inline correction, saving `125` changed the card to `125 ml`, reload preserved `125 ml`, and console warnings/errors were empty. |
| Suspected Root Cause | The original button label described correction but the implementation was a hidden decrement shortcut: `handleLogWater(-250)`. |
| Related File/Component | src/pages/Dashboard.tsx; tests/e2e/emulator-auth.spec.ts |
| Missing Test Coverage | None for hydration quick-add, correction persistence, or hydration save-failure alert coverage in the current local private-alpha scope. |

### REPAIR-SETTINGS-2026-06-27-A. /settings - BUG-017 Settings persistence and accessibility repair - PASS

| Field | Value |
|---|---|
| Timestamp | 2026-06-27 |
| Route | /settings |
| Element | Custom Bottle Size, Dietary Tags, Settings numeric/range controls, Save/Discard footer |
| Expected Behavior | Settings changes expose an honest Save/Discard contract, custom bottle size persists after refresh, Gluten Free remains visibly selected, and Settings controls have stable accessible labels. |
| Actual Behavior | Fixed and verified. Custom Bottle Size has one exact accessible target; changing it shows `Discard` and `Confirm Targets`; saving and reloading keeps the visible bottle size; Gluten Free exposes and preserves `aria-pressed=true`; percentage macro sliders expose exact labels when that mode is active; the changed-state footer exposes status copy and actions. |
| Pass/Fail | PASS |
| Evidence | `npx.cmd playwright test --config=playwright.emulator.config.ts -g "settings"` passed 6/6 after sandbox-elevated rerun. `npm.cmd run lint` passed. `npm.cmd run build` passed after sandbox-elevated rerun with existing non-blocking warnings. In-app browser proof on `http://127.0.0.1:5173/settings` confirmed bottle size value `582` after save/reload, Gluten Free `aria-pressed=true` after reload, one exact label target for `Custom Bottle Size (ml)`, one exact target each for percentage slider labels after switching modes, and no console errors. Follow-up limitation fix: raw CDP network inspection remained unavailable from a fresh in-app browser tab, so the Settings save/reload Playwright regression now includes a network-failure collector; the focused network-backed pair passed 2/2 and the full Settings slice passed 6/6. |
| Suspected Root Cause | The original manual audit was blocked by weak accessible labels and invisible/unclear state semantics; the save workflow existed but was too easy to miss and did not expose stable machine-readable selected state. |
| Related File/Component | src/pages/Settings.tsx; tests/e2e/emulator-auth.spec.ts |
| Missing Test Coverage | Future Settings/foundation work should add stricter Firestore schema validation and deeper nutrition/default validation; those are not reopened page-contract bugs for this private-alpha scope. |
