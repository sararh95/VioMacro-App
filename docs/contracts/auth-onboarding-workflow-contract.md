# Auth And Onboarding Workflow Contract

Date created: 2026-06-26
Status: Stage 6 daily-use recertification graduated under CMD-048 on 2026-07-12

## Workflow

- Routes/surfaces: `/auth`, protected route redirect, account creation, email login, Google sign-in affordance, onboarding skip/setup, sign out.
- Components/services: `src/features/auth/AuthPage.tsx`, `src/app/providers/auth-context.tsx`, `src/features/auth/OnboardingWizard.tsx`, `src/app/providers/store.tsx`, `src/services/userService.ts`, `src/app/AppLayout.tsx`.
- Launch tier: Critical.
- Workflow job: Let a private-alpha user create an account, sign in, complete or skip onboarding once, and return to the app without onboarding repeating or auth states becoming misleading.
- Entry point: Direct `/auth`, protected-route redirect, new user account creation, returning user login.
- Auth boundary: Signed-out users should land on `/auth`; signed-in users should land in the protected app shell.

## Stage 6 Daily-Use Recertification - 2026-07-12

The original local graduation remains valid historical proof. CMD-048 refreshes the user-visible reality check against the current post-Stage-5 app without redesigning Auth or Onboarding.

Certification checklist:

1. [x] Prove desktop `/auth` mode switching, disabled Google/password-reset honesty, visible recoverable errors, and clean console/network behavior with the in-app Browser.
2. [x] Prove disposable account creation plus onboarding skip persists after reload.
3. [x] Prove a second disposable account can finish every onboarding step and remains completed after reload; pair Browser evidence with existing Playwright Firestore assertions.
4. [x] Prove signed-out protected-route redirect, returning-user sign-in, direct protected-route loads, and sign-out.
5. [x] Pair the Browser pass with the exact focused Auth/Onboarding/Navigation Playwright group in CMD-048.
6. [x] Record any defect without patching; Manager decides Bugfix, deferral, or graduation.

Safety boundary:

- Local Firebase emulators only; no production credentials, production data, deploy, Google provider flow, live AI, Gemini, semantic search, or paid API call.
- One in-app Browser Captain controls browser state. Screenshots support URL/DOM/state/console evidence but do not replace it.

## Task Checklist

### G11 label-association follow-up — VM-059

1. [x] Prove Current Weight, Goal Weight, Daily Calorie Target and existing calculator Gender/Age/Activity Level labels name and focus their controls at desktop and390px.
2. [x] Add failing real native-label/name/focus regressions before the minimal id/htmlFor repair; preserve heights, units, calculator inputs and validation.
3. [x] Verify decimal weights and the chosen calorie target survive normal Finish Setup and reload, with onboarding complete and unrelated settings retained.
4. [x] Full gates, actual Chrome and both fresh reviews complete; merged PR #21 (3638798). Auth form labels remain VM-061/G27.

Native field and normal completed-save controls pass for metric80.5/75.5 and imperial180.5/165.5 with2234calories. CSS-uppercase native names are recorded alongside exact getByLabel matches. An early premature reload is excluded from persistence proof. Author Chrome, current-head CI and both fresh reviews subsequently passed; PR #21 merged 2026-10-30. Historical premature/lagging frames stay excluded. See the G11 log and reviewer comments for exact evidence limits.

1. [x] Define Auth/Onboarding workflow scope and current diagnosis.
   - Outcome: Contract identifies auth routes, onboarding data surface, current proof, risks, and non-goals.
   - Verification target: Source review of `AuthPage`, `AuthProvider`, `OnboardingWizard`, `AppProvider`, `userService`, `AppLayout`, existing tests, QA ledger, and bug ledger.
   - Ledger target: Auth/Onboarding workflow contract.

2. [x] Run baseline Auth/Onboarding smoke.
   - Outcome: New email user can create an account, reach Dashboard, see onboarding, skip setup, and existing test user can log in.
   - Verification target: Playwright emulator auth/onboarding tests.
   - Ledger target: QA ledger.

3. [x] Fix onboarding repeat race.
   - Outcome: User initialization cannot overwrite a completed onboarding flag, even if initialization completes late.
   - Verification target: Source fix plus deterministic delayed-initialization Playwright emulator test.
   - Ledger target: QA ledger; bug ledger only if unresolved.

4. [x] Prove onboarding skip persists.
   - Outcome: After clicking `Skip Setup`, onboarding stays hidden after reload and direct Dashboard revisit.
   - Verification target: Playwright emulator test.
   - Ledger target: QA ledger.

5. [x] Prove onboarding finish persists.
   - Outcome: After completing setup, saved values and `onboardingCompleted: true` persist and onboarding stays hidden after reload.
   - Verification target: Playwright emulator test with Firestore assertion if practical.
   - Ledger target: QA ledger.

6. [x] Prove login error copy is useful.
   - Outcome: Bad credentials, weak password, duplicate email, and missing fields show user-facing messages without console-only failure.
   - Verification target: Targeted Playwright emulator tests or source review with targeted coverage for the highest-risk cases.
   - Ledger target: QA ledger; bug ledger if deferred.

7. [x] Classify Google sign-in affordance.
   - Outcome: Google sign-in is either proven in the intended environment or visibly labeled/handled as not part of local emulator QA.
   - Verification target: Source review and Playwright assertion if changed.
   - Ledger target: Contract and QA ledger.

8. [x] Prove protected route and sign-out behavior.
   - Outcome: Signed-out access to a protected route redirects to `/auth`; signing out from the app returns the user to `/auth` or a signed-out state.
   - Verification target: Playwright emulator test.
   - Ledger target: QA ledger.

9. [x] Close Auth/Onboarding workflow contract.
   - Outcome: No open P0/P1 Auth/Onboarding blockers remain, known deferrals are recorded, and the app roadmap can move to the next contract.
   - Verification target: Grouped Auth/Onboarding proof plus lint/build if code changes occur.
   - Ledger target: QA ledger, bug ledger, and app contract roadmap.

## Current Diagnosis

Proven:

- `/auth` exists and renders login/create-account modes.
- Protected routes redirect signed-out users through `Protected`.
- Existing emulator smoke proves a new email user can create an account, see onboarding, and click `Skip Setup`.
- Existing emulator smoke proves the test user can sign in and navigate launch-critical screens.
- `OnboardingWizard` persists completion through `updateSettings({ onboardingCompleted: true })`.
- New user defaults set `onboardingCompleted: false`.
- User initialization now uses a Firestore transaction, so late initialization cannot overwrite a completed onboarding flag.
- Onboarding skip now stays completed after delayed initialization and reload.
- Onboarding finish now persists setup values and hides onboarding after reload.
- Onboarding save failures now show a visible retry message.
- Local emulator mode now disables Google sign-in with honest Coming Soon copy.
- Protected signed-out routes redirect to `/auth`, and sign out returns users to Auth.

Assumed:

- Email/password auth is the primary private-alpha path.
- Google sign-in may be a future or production-only path unless live provider configuration is explicitly tested.
- The current onboarding UX is not final; the contract goal is stability and honesty, not redesign.

Broken or risky:

- No open P0/P1 Auth/Onboarding blockers remain for the current private-alpha workflow.
- Live Google sign-in remains unproven and should be tested deliberately before being promoted in production.

## Data And Permissions

Data read:

- Firebase Auth current user.
- User document at `users/{uid}`.
- User settings under `users/{uid}.settings`.

Data write:

- New user initialization under `users/{uid}`.
- Onboarding updates through `updateUserSettings`.
- Firebase Auth user creation/login/logout.

Auth boundary:

- Users may read/write only their own profile/settings data.
- Unauthenticated users should not access protected app routes.

Rules or backend boundary:

- This workflow should not change Firestore rules unless a proven auth/permissions bug appears.
- Live provider OAuth behavior is not considered proven by local emulator tests.

## States

Auth loading state:

- AuthProvider should render only after Firebase Auth resolves, without blocking app rendering on Firestore initialization.

Signed-out state:

- `/auth` should show login/signup controls.
- Protected routes should redirect signed-out users to `/auth`.

New-user state:

- New users may see onboarding once while `onboardingCompleted` is false.

Completed-onboarding state:

- Users with `onboardingCompleted: true` should not see onboarding after reload, route changes, or returning login.

Error state:

- Auth errors should show visible messages near the form.
- Onboarding save failures should not silently claim completion.

## Risks And Non-Goals

- Do not redesign onboarding in this contract.
- Do not add password reset.
- Do not require Google sign-in to pass local emulator QA unless provider setup is explicitly available.
- Do not change Dashboard feature behavior except where onboarding visibility requires it.
- Do not deploy Hosting.

## Verification Plan

1. Run baseline auth/onboarding smoke.
2. Fix user initialization so late default writes cannot overwrite onboarding completion.
3. Add delayed-initialization regression coverage.
4. Add reload persistence coverage for skip and finish.
5. Classify auth errors, Google sign-in, protected route, and sign-out behavior.
6. Run grouped Auth/Onboarding proof plus lint/build if code changes occur.

## Current Proof

- Source diagnosis completed on 2026-06-26.
- 2026-06-26 baseline onboarding smoke passed before patching: 1 test.
- 2026-06-26 grouped onboarding proof passed: 3 tests.
- Grouped onboarding proof covered immediate skip, delayed-initialization skip persistence after reload, and finish/setup persistence after reload with Firestore settings assertions.
- 2026-06-26 grouped Auth proof passed: 6 tests.
- Grouped Auth proof covered local Google sign-in honesty, missing-field error, invalid-login error, weak-password error, duplicate-email error, protected route redirect, sign-out, and returning-user login/navigation.
- `npm.cmd run lint`: passed on 2026-06-26.
- `npm.cmd run build`: passed on 2026-06-26 after rerunning outside the restricted sandbox because Vite/esbuild could not read config paths inside the sandbox. Non-blocking warnings remain for Browserslist data age, dynamic/static import chunking, and large bundle size.
- 2026-07-12 CMD-048 focused Auth/Onboarding/Navigation proof passed 7/7 with 0 failures, 0 skips, and 0 retries in 32.2 seconds.
- One in-app Browser Captain proved desktop and `390x844` Auth fit, mode switching, disabled Google/password-reset honesty, recoverable missing/invalid credential errors, signed-out `/settings` redirect, returning login, direct protected routes, and desktop/mobile sign-out.
- Two disposable emulator accounts proved onboarding skip and full completion survive reload. The completion account used distinctive settings, while the focused Playwright test supplied exact Firestore persistence assertions.
- Console/network review found only the intentionally triggered invalid-login errors and canceled local Firestore listener teardown. There were no unexpected HTTP 4xx/5xx responses, App Check warnings, production requests, or Gemini/provider traffic.
- Manager independently reviewed the report and screenshots, confirmed ports `5173`, `8080`, `9099`, and `9199` clear, found no P0-P3 product defect, and accepted the `GRADUATED` verdict.

## Open Bugs And Deferrals

Open bugs:

- None for current Auth/Onboarding private-alpha workflows.

Deferred items:

- Onboarding redesign and richer setup recommendations are future product work.
- Password reset remains Coming Soon.
- Google sign-in live-provider proof is deferred unless this contract explicitly promotes it.

Revisit trigger:

- Before Hosting launch, Auth provider changes, onboarding redesign, profile/settings schema changes, or adding password reset.

## Next Action

CMD-048 is accepted and this workflow remains graduated for the current private-alpha scope. Preserve the existing Auth/Onboarding behavior while Stage 6 moves to the Recipe Library and Recipe Import slice after CMD-049 graduation and the approved documentation checkpoint.
