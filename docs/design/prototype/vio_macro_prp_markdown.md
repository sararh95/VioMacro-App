Vibecode PRP: Macro Week Planner (VioMacro Web App MVP)

Product name (VioMacro)

Macro Week Planner

One-sentence idea

A private, mobile-friendly web app that helps me (and later optionally my boyfriend) plan a full week of meals to hit a daily calorie target (e.g., 1900/day) using my saved recipes, with a weekly calendar dashboard, grocery list, meal prep checklist, and light gamification.

Problem it solves

I don’t have time to sit down and plan a balanced week. I end up only planning lunches, eating disproportionately, and sometimes overeating. I want the app to generate a weekly plan fast, help meal prep, and produce groceries so I can follow through.

Target audience

Primary: Me (solo user for MVP)

Future: Optional “boyfriend mode” (shared planning later)

Core user journey / flow (Saturday → Sunday → Week)

Saturday night: Open app → sign in with Google

Set daily calorie target (default example: 1900) and optionally macro targets

Choose whether to:

Auto-generate a full week, or

Pick meals manually from my recipe library

Optionally enable Batch-cook lunch (choose 1 lunch recipe repeated for 7 days)

Review the suggested weekly plan in a dashboard weekly calendar → swap a few meals if needed

Generate:

Weekly schedule view

Grocery list (aggregated from chosen recipes)

Meal prep checklist + food safety storage guidance for up to 7 days (simple tips)

Sunday: Use grocery list to shop

During the week: Check off meals, swap meals if needed, see “on track” progress + streak

App keeps 8 weeks of history for reuse/repeat

MVP feature set (must-have)

A) Planning (Weekly)

Weekly calendar grid view (Mon–Sun)

Meal slots per day:

Breakfast (milkshakes treated as breakfast item or breakfast add-on)

Lunch

Dinner

Snacks (multiple per day)

Auto-generate weekly plan based on calorie target (good-enough accuracy)

Batch-cook lunch mode (pick 1 lunch recipe repeated 7 days)

Swap meals quickly and update totals

B) Targets

Set daily calorie target (e.g., 1900/day)

Optional macro targets (protein/carbs/fat)

Show daily totals + remaining calories/macros

C) Recipe library (manual macros, PDF links)

Add/edit recipes with:

Recipe name

Meal type (breakfast/lunch/dinner/snack/milkshake)

Calories + macros per serving (manual entry; no ingredient macro calculation in MVP)

Servings per recipe

Google Drive PDF link (URL)

Tags + folders (organized inside app; e.g., “high protein,” “quick,” “meal prep”)

Search/filter by meal type, tags, folders

D) Grocery list + meal prep checklist

Generate grocery list from the chosen week plan (aggregate duplicates)

Meal prep instructions/checklist per recipe and per week

Include storage guidance (simple, non-alarming) for prepping up to 7 days

E) During-week tracking + light gamification

Check off meals

“On track” indicator (calories remaining for the day)

Progress ring for today (calories consumed vs target)

Streak (days you checked in / followed plan)

History

Store and browse last 8 weeks of plans

“Start from last week” button

AI usage (MVP)

AI Job B: Weekly plan generation (good-enough)

Input: calorie target, meal structure (meals/snacks), batch-lunch choice, recipe library macros

Output: suggested weekly plan that aims to match daily calories (and optionally macros)

Approach constraints:

Prefer using my recipes only

Respect meal types (breakfast recipes go in breakfast, etc.)

If batch lunch is enabled, lock lunch recipe for all days

Prioritize “close enough” rather than perfect optimization

Provide simple reasoning like: “This day is \~1850 kcal; add a snack to reach target”

(Important: AI should not invent macro values; it uses stored recipe macro data only.)

Data to store (MVP)

User profile (Google Auth)

Recipe records (name, meal type, macros, servings, PDF link, tags, folder)

Weekly plans (7-day schedule, per-day totals, settings like batch lunch)

Grocery lists (generated, saved with each week plan)

Prep checklist items (generated, saved with each week plan)

Check-off states

History retention policy: keep last 8 weeks per user (auto-delete older)

Design / vibe notes

Main vibe: Planner dashboard

Primary UI: Weekly calendar grid as the hero

Secondary panels: daily totals, weekly summary, “generate week” button, grocery button

Gamified accent: subtle progress ring + streak (motivating but not cluttered)

Mobile-first: designed to be easy to use while shopping

Suggested stack (simple + publishable)

Web app first

Google Sign-In login

Cloud database for recipes + plans + history

Private-by-default (only the signed-in user can access their data)

(Implementation details left to Lovable, but the plan should assume a mainstream, beginner-friendly hosted stack.)

Future features (post-MVP)

No-repeat rules (avoid repeating dinners too often)

Portion scaling (scale recipe servings up/down automatically)

Grocery list grouped by aisle/section (produce, dairy, pantry)

Export grocery list to Notes / PDF

Pantry inventory (mark what you already have)

Widgets (quick “today plan” and grocery list)

Boyfriend mode (shared recipes + shared weekly plan) someday

Light budget layer:

optional estimated grocery cost per recipe/week (user-entered prices or simple estimate)

Success criteria (what “done” looks like)

In under 5 minutes on Saturday night, I can generate a week plan that’s close to my calorie target, approve it, and get groceries + prep checklist.

During the week, checking off meals feels satisfying and keeps me on track.
