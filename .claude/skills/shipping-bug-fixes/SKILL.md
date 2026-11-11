---
name: shipping-bug-fixes
description: Use when fixing bugs from an audit or backlog, removing a fallback or default, changing what a field may contain, or batching several fixes into one PR — especially when a fix looks small and self-contained.
---

# Shipping Bug Fixes

## Overview

Most regressions in a bug-fix PR are not caused by the fix being wrong. They are
caused by **what the bug was hiding**.

A fallback, a default, or an invented value is a lid. Removing it is correct —
and it exposes whatever was sitting underneath, which nobody has exercised since
the fallback was added.

**Core principle: after you remove a fallback, go read every consumer of that
value before you run anything.**

## When to Use

- Fixing findings from an audit, ledger, or bug backlog
- Deleting a fallback, default, placeholder, or seeded value
- Making a required field optional, or an optional field required
- Batching multiple related fixes into one PR
- Any fix where you thought "this is small and self-contained"

**Not for:** greenfield features, or a one-line typo with no consumers.

## The Fallback Rule

Every time a fallback is removed, ask three questions **before** running tests:

1. **Who reads this value?** Grep the field name across the whole repo, not just
   the file you edited.
2. **Does any query order or filter by it?** Firestore, SQL and Mongo all drop
   or reorder rows silently when the sort field is missing. No error is raised.
3. **What does the empty case render as?** `src=""` re-requests the page.
   `undefined` in a React `value` prop makes the input uncontrolled. `NaN`
   propagates into every downstream number.

### Observed failures — all three from one PR

| Removed | What it was hiding |
|---|---|
| Demo-recipe fallback | The "add a recipe first" guard was **dead code** — unreachable, so untested, for months |
| A fabricated 7-day expiry | The read query used `orderBy('expiresAt')`, so items with no expiry **saved fine and rendered nowhere** |
| A stock-photo default | Four call sites now rendered `src=""` |

None were found by reading the diff. All three were found by running the app.

## Check the Write Path, Not Just the Render Path

Auditing where a value is **displayed** misses where it is **stored**.

A wrong value on screen is annoying. A wrong value written to the database is
permanent, and it keeps being wrong after the fix ships.

```
grep for the field name in:
  render sites   →  <img src={x}>, {x}, value={x}
  write sites    →  addDoc, setDoc, update, INSERT, the save handler  ← easy to miss
  query sites    →  where(), orderBy(), index definitions             ← easiest to miss
```

## Legacy Data Outlives the Fix

Changing what a field *may* contain does not change what it *already* contains.

Before tightening validation, a schema, or a Content-Security-Policy, ask:
**what is already stored that this would now reject?**

Prefer handling the old shape at the read boundary over migrating the data.
A guard that declines to use an untrusted stored value is smaller, reversible,
and cannot corrupt anything.

## Size and Batching

Research is unambiguous about review quality falling off with size:

| Threshold | Effect |
|---|---|
| ~200 changed lines | Review quality degrades beyond this |
| 200–400 lines | ~40% fewer defects than larger PRs |
| under 200 lines | Approved roughly 3× faster |
| ~1000 lines | Too large; Google's guidance treats 100 as a normal size |

**One theme per PR.** Never mix a security fix with a refactor: when something
breaks you must be able to say which change did it.

**A refactor may ride along only if it is the fix.** Extracting a shared helper
because three files each had the bug is part of the fix. Renaming things nearby
is not.

## Run It Against the Emulator. Every Time.

**A fix is not verified until the app has actually run against a real backend
with the change in it.** Not the typechecker, not the unit tests, not a careful
reading of the diff.

This is the single highest-value rule here, because it is the one that keeps
being right. Across seven PRs on a 120-finding audit, the integration suite
caught things that reading could not — every time:

| The fix | What the emulator caught that reading did not |
|---|---|
| Removed a fabricated expiry | `orderBy` on that field silently hid every new row |
| Removed a stock-photo default | Four call sites now rendered `src=""` |
| Added a Content-Security-Policy | It blocked the app's own storage emulator and its auth pixel |
| Added one piece of state | One extra render turned a latent race into a certain one |

None of these were visible in the diff. All were caught in minutes by running.

### The rule

1. **Run the full integration suite before every commit** — not the one test you
   wrote, the whole thing. Cross-page breakage only shows up in the parts you
   were not thinking about.
2. **Read the failures before changing anything.** Separate "the test asserted
   the old bug" from "I broke something". Both happen; they need opposite fixes.
3. **A green suite before your change is not optional.** Establish the baseline
   first, or a failure is ambiguous between your change and pre-existing rot.
4. **Never loosen a policy to make a test pass.** If a new CSP, rule or
   validation turns something red, the test is usually telling you about real
   data or a real dependency. Widen it deliberately, and record why each
   exception exists.

### Prove the test can fail

A test that passes whether or not the bug is present is worse than no test: it
manufactures confidence.

Once green, **revert the fix and confirm the test goes red.** Then restore it.
It costs one minute and it is the only way to know the test is wired to the
behaviour rather than to something incidental.

### Do not trust the exit code

Read the actual output. Two ways a run lies:

- A suite that never started can still exit 0 in some harnesses.
- Filtering output and chaining with `&&` will silently skip the next command
  when the filter matches nothing — producing an empty log and a "failure" that
  has nothing to do with the code.

`67 passed, 0 failed` is a result. `exit 0` is not.

### Point the tooling at the same place the app is pointing

A cleanup or seed script talks to the backend **directly**, not through the app.
That means it can be aimed somewhere the app never looks, and nothing errors.

Emulators partition by an id you supply — project, namespace, tenant — and an
unknown id is not an error. It is served as an empty dataset. So a script with
the wrong id prints "seeded" and seeds nothing, or prints **"nothing to clean"**
about data that is very much still there.

- Read the id from the same file the app and the emulators read (`.firebaserc`,
  the env file), never a literal in the script.
- **A tool that says "nothing to do" is not trustworthy until you have watched it
  say "something to do".** Give it a row it must find, and confirm it finds it.
  This is the "prove the test can fail" rule applied to maintenance scripts, and
  it matters more here — a false all-clear on a data-integrity script closes the
  finding while the bad data survives.

### Drive the app by hand. This is a gate, not a nicety.

**A fix is not done until you have used the running app, through its real UI,
to exercise the thing you claim to have fixed.** Sign in, click the button, read
the screen, then read the database back.

The suite only runs the paths someone thought to write down. A finding that says
"Fixed" was written by whoever fixed it, and the audit that produced it named the
sites *it* happened to see.

| Found only by clicking | What the suite and the diff both said |
|---|---|
| A repair script pointed at a project id nothing reads -- and reported "nothing to clean" about data that was still there | Script exits 0 |
| A P1 marked **Fixed** was fixed on 1 screen of 6; the others showed "lbs" to a metric user next to a kilogram value | Green. Unit tests covered the helper, which was correct |

The second one is the important shape. **A closed finding is a claim, not a
fact.** Re-open the app and look before you trust the ledger, especially for
anything a user can type a number into.

#### What "by hand" means

1. Seed a realistic account and sign in as it. Not a fixture the test wrote --
   the account a person would have.
2. Click the actual control. Not the service function in a console.
3. **Read the database back afterwards.** On-screen is the render path; the bug
   is often on the write path.
4. Try the other branch. If a value has a unit, a mode, or a toggle, flip it and
   look again. Half the bugs above were only visible in the non-default setting.

#### Your own testing will be wrong before the code is

Every one of these looked exactly like an app bug and was not:

- Clicking at page pixel coordinates when the tool's frame was scaled. Buttons
  looked dead. Convert to the tool's frame first.
- Setting a React input's `value` through the native setter; the framework never
  saw it. Focus and type instead.
- Asserting on guessed field names. `mealType` was `type`, so a saved record
  printed `undefined` and briefly looked like data loss. **Dump the object before
  asserting on it.**
- Running a repeat-count with parallel workers, getting "1 failed, 2 passed", and
  nearly filing my own bad measurement as a finding. Re-run serially.

**Before reporting anything found by hand, reproduce it once more and confirm the
tool did what you think it did.** A false finding costs the same review time as
a real one and burns trust in the true ones.

#### Read-after-write is a race, and it will invent a bug for you

The single most expensive mistake in this audit was not a wrong fix. It was
**reading the database immediately after the UI said "saved"**.

The button hid, the read came back empty, and that looked exactly like silent
data loss. A theory was built, a fix was written, and a spec was constructed to
prove it. Then the same document, read 1.5 seconds later, had the value. The
save had been correct the whole time.

- A UI that hides a button on an **optimistic update** has not told you the write
  landed. It has told you the write started.
- **Poll for the value, do not read once.** `expect.poll(...)` or a retry loop.
  A single read is a coin toss whose losing side looks like a serious bug.
- If a read-back disagrees with the screen, **suspect the read first**. The screen
  is showing state the app actually holds; your read is a separate client with
  its own timing and its own cache.

#### A finding you cannot demonstrate is a theory, and theories must not ship

The reasoning behind that false finding was genuinely sound: the draft really is
built from defaults before the data arrives, and a ref really does freeze it. It
was still wrong, because no run ever produced the failure.

**When a fix cannot be tied to a reproduction, revert it.** Not because the
reasoning was bad, but because defensive code nobody can explain is how a
codebase silts up -- and a fix with no failing case has nothing to stop it being
quietly deleted, or quietly wrong.

Keep the test if it guards something real. Delete the speculation.

**But do not let that rule bury a real bug.** The example above nearly did. The
stale read falsified *one assertion* -- "the change vanished". It said nothing
about the other symptom in the same test, which was never re-checked. Fixing the
read and re-running showed the finding was real all along: a P1 that silently
switched an imperial account to metric, reproducible at 1 run in 4.

**When a test fails for a reason you have shown to be your own mistake, you have
cleared that assertion, not the finding.** Fix the test, run it again, and read
what it says the second time. "My test was wrong" and "there is no bug" are
different conclusions, and the gap between them is where real defects hide.

## Order of Work

1. **Reproduce.** A finding you cannot demonstrate is a theory.
2. **Write the failing test first.** It must fail for the stated reason, not
   because a file is missing. Watch it go red.
3. **Fix the cause, not the symptom.**
4. **Apply the lesson everywhere at once.** If the same mistake exists in three
   files, fix three files now — not one now and two after the next failure.
5. **Run the full integration suite, not just the new test.** See the section
   above; this is the step that finds what reading cannot.
6. **Read the failures before changing anything.** Separate "the test asserted
   the old bug" from "I broke something". Both happen; they need opposite fixes.
7. **Paste the real output.** Exit code 0 is not a result. `67 passed, 0 failed`
   is a result.
8. **Drive it by hand and read the database back.** See the gate above. This
   is the last step before you call anything done, and it is the one that
   catches a fix that was only applied to the file you were looking at.
9. **Report what broke, nearly broke, or surprised you** -- including your own
   testing mistakes. Silence about a near-miss is a worse outcome than the
   near-miss.

## Tests That Assert the Bug

When a fix is correct, some existing tests will fail — because they were written
against the broken behaviour.

**Update them; do not delete them.** A test that reached an AI call only because
a demo fallback filled an empty list is still testing something real. Give it a
proper fixture instead of removing it.

Before starting a PR, grep the suite for assertions on the behaviour you are
about to change, and list them in the PR description. A red test you predicted
is progress. A red test that surprises you costs an hour.

### Find out which fixture the test runs against, first

"The test asserted the old bug" is a claim about a specific **account, screen and
setting** -- never about a string. Two specs asserting the same text can be one
bug and one correct behaviour.

A real case: fixing a hardcoded `lbs` turned three specs red. All three asserted
`lbs`; updating them all to `kg` was the obvious move and it was wrong. The suite
used two kinds of account -- fresh in-test ones (metric, the default) and a
seeded one from the imported emulator export that was **imperial**. For that one,
`lbs` had never been the bug. Blanket-updating would have asserted `kg` for an
imperial user, and the next hardcoded unit would have shipped green.

What settled it was reading the unit out of the emulator export directly, not
inferring it from which tests failed.

- **Ask what fixture each red test uses before touching its assertion.** Imported
  emulator data, a shared account seeded once, and a fresh in-test signup are
  three different users with three different settings.
- **Fixing a red test so that it agrees with your change is not evidence.** It is
  the single easiest way to delete the coverage that was protecting you.
- Done right, the suite ends up **stronger** than before: some specs assert one
  unit, some the other, so a hardcode in either direction now fails.

### A baseline you read in a document is not a baseline

A ledger recorded the baseline as `67 passed`. It was **69**. The only way that
surfaced was stashing the change and re-running on the clean tree -- which is
also what proved the remaining failures were mine and not flake.

**When you are unsure whether a failure is yours: stash, run, unstash.** Three
minutes buys certainty, and guessing at it costs far more.

## Guard Tests

For a class of bug that will creep back — a banned import, a forbidden host, a
fabricated constant — write a test that scans source rather than behaviour.

**Strip comments before scanning.** Otherwise a comment explaining the removal
counts as the thing still being present. This mistake is easy to make twice: fix
it in every guard file the moment you learn it, not just the one that failed.

## Red Flags — Stop

- "This is a one-line change, I'll skip the suite"
- "The test failure is just the test being outdated" — *before* reading it
- "I'll fix the other two instances in a follow-up"
- Reporting a result you did not read the output of
- A diff far larger than the change you made — check line endings before blaming yourself
- Loosening a policy (CSP, validation, rules) to make a test pass
- "The ledger says this one is fixed" -- said without opening the app
- Reporting a bug you saw once, on one screen, without reproducing it
- Treating a finding's "Where:" as the complete list of sites

## Common Mistakes

| Mistake | Consequence |
|---|---|
| Editing files with a tool that rewrites line endings | 113 real lines become a 1,900-line unreviewable diff |
| Killing processes by name match | Takes out your own shell. Match by port or PID. |
| Leaving a dev server or emulator running | The next suite run fails on a port conflict, and you debug the wrong thing |
| Trusting exit code 0 | A suite that never started also exits 0 in some harnesses |
| Reading the database right after the UI says "saved" | The optimistic update fired, the write had not landed. You invent a data-loss bug |
| Assuming a port is free because your project owns it | An unrelated tunnel or service can hold it, and the suite fails in ways that look like your code |

## Real-World Impact

Applied across three PRs on a 118-finding audit:

- 25 findings fixed, zero regressions shipped
- Static reading found 115 findings; **running the code found 3 more**, including
  one that would have broken every already-saved record in production
- Four integration runs on one PR: three exposed real problems, and none of them
  were visible in the diff
