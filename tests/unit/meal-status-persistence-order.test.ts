import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const specPath = 'tests/e2e/emulator-auth.spec.ts';
const spec = ts.createSourceFile(specPath, readFileSync(specPath, 'utf8'), ts.ScriptTarget.Latest, true);
const caseName = 'AUD-022: a plan saved in the old shape keeps its ticks, and unticking one sticks';

function extract(predicate: (node: ts.Node) => boolean): string {
  const matches: ts.Node[] = [];
  const visit = (node: ts.Node) => {
    if (predicate(node)) matches.push(node);
    ts.forEachChild(node, visit);
  };
  visit(spec);
  assert.equal(matches.length, 1, 'extract exactly one actual E2E callback/helper');
  return matches[0].getText(spec);
}

const call = extract(node => ts.isCallExpression(node)
  && ts.isIdentifier(node.expression) && node.expression.text === 'test'
  && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === caseName);
const parsed = ts.createSourceFile('callback.ts', call, ts.ScriptTarget.Latest, true);
const statement = parsed.statements[0];
assert.ok(ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression));
const callback = statement.expression.arguments[1];
assert.ok(ts.isArrowFunction(callback));
const helpers = ['seedLegacyShapePlan', 'toDateKey', 'getMondayWeekStart', 'settlePlanner']
  .map(name => extract(node => ts.isFunctionDeclaration(node) && node.name?.text === name))
  .join('\n');

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(complete => { resolve = complete; });
  return { promise, resolve };
}

type StoredPlan = {
  days: { meals: { id: string; name: string; isEaten: boolean }[] }[];
  mealStatus?: Record<string, boolean>;
};
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// Model the two external boundaries the real callback observes: rendered button
// state and a separately read server document. A click is optimistic; closing the
// page before the controlled write is released discards that pending write.
// This is an ordering regression for the E2E callback, not an app implementation
// or evidence that a particular Firebase transport lost a particular CI write.
function fixture(delayed: boolean) {
  const clicked = deferred();
  const releaseCommit = deferred();
  const commitSettled = deferred();
  const db = {};
  const auth = {};
  const uid = 'own-synthetic-user';
  const planId = 'legacy-plan';
  const trace: string[] = [];
  const assertions: string[] = [];
  let stored: StoredPlan;
  let eatenName = '';
  let untouchedName = '';
  let renderedEaten = true;
  let reloads = 0;
  let acknowledged = false;
  let discarded = false;
  let independentReadsBeforeReload = 0;

  const commit = () => {
    if (reloads) {
      discarded = true;
      trace.push('pending write discarded after page reload');
    } else {
      stored.mealStatus = { 'legacy-meal-eaten': false };
      acknowledged = true;
      trace.push('server acknowledged mealStatus false');
    }
    commitSettled.resolve();
  };
  const page = {
    goto: async (path: string) => {
      assert.equal(path, '/plan');
      trace.push('planner opened');
    },
    reload: async () => {
      trace.push(`reload with server acknowledgement ${acknowledged}`);
      reloads++;
      // Only this literal legacy fixture is represented. Rendering after reload
      // follows the independently persisted record, never the optimistic button.
      renderedEaten = stored.mealStatus?.['legacy-meal-eaten'] !== false;
    },
    getByRole: (role: string, options: { name: string }) => {
      assert.equal(role, 'button');
      const name = options.name;
      const visible = () => name === 'Next week'
        || (name === `Mark as not eaten: ${eatenName}` && renderedEaten)
        || (name === `Mark as eaten: ${eatenName}` && !renderedEaten)
        || name === `Mark as eaten: ${untouchedName}`;
      return {
        visible,
        name,
        isVisible: async () => visible(),
        waitFor: async () => { assert.equal(visible(), true, `button is absent: ${name}`); },
        click: async () => {
          assert.equal(name, `Mark as not eaten: ${eatenName}`);
          assert.equal(visible(), true);
          renderedEaten = false;
          trace.push('optimistic untick rendered');
          if (delayed) void releaseCommit.promise.then(commit);
          else commit();
          clicked.resolve();
        },
      };
    },
  };
  const expect = Object.assign((actual: unknown) => ({
    toBeVisible: async () => {
      const locator = actual as { visible: () => boolean; name: string };
      assertions.push(`visible: ${locator.name}`);
      assert.equal(locator.visible(), true,
        reloads && discarded
          ? 'the actual AUD-022 callback lost its optimistic untick by reloading before persistence'
          : reloads && !acknowledged
            ? 'the actual AUD-022 callback reloaded before stored mealStatus became false; legacy tick returned'
            : `expected visible button: ${locator.name}`);
    },
    toBeHidden: async () => {
      assert.equal((actual as { visible: () => boolean }).visible(), false);
    },
    toEqual: (expected: unknown) => {
      assertions.push(Array.isArray(expected) ? 'console failures' : 'exact stored mealStatus');
      assert.deepEqual(copy(actual), copy(expected));
    },
    toBe: (expected: unknown) => {
      assertions.push('original legacy array value');
      assert.equal(actual, expected);
    },
  }), {
    poll: (read: () => Promise<unknown>) => ({ toBe: async (expected: unknown) => {
      // A conditional retry models Playwright's poll boundary. The controller
      // releases the one pending server write; no wall-clock sleeps are needed.
      let actual = await read();
      if (!Object.is(actual, expected)) {
        await commitSettled.promise;
        actual = await read();
      }
      assert.equal(actual, expected, 'independent server read must observe the requested persisted value');
      assertions.push('independent persistence barrier');
    } }),
  });
  const scope = {
    expect,
    TEST_PASSWORD: 'synthetic-only',
    collectConsoleFailures: () => [],
    createBrowserUser: async () => {},
    createFirebaseClient: () => ({ db, auth }),
    signInWithEmailAndPassword: async (actualAuth: object) => {
      assert.equal(actualAuth, auth);
      return { user: { uid } };
    },
    Timestamp: { now: () => ({ seconds: 1, nanoseconds: 0 }) },
    collection: (actualDb: object, ...parts: string[]) => {
      assert.equal(actualDb, db);
      assert.deepEqual(parts, ['users', uid, 'mealPlans']);
      return { db, path: parts.join('/') };
    },
    addDoc: async (_collection: unknown, data: StoredPlan) => {
      stored = copy(data);
      eatenName = stored.days[0].meals[0].name;
      untouchedName = stored.days[0].meals[1].name;
      return { id: planId };
    },
    doc: (actualDb: object, ...parts: string[]) => {
      assert.equal(actualDb, db, 'persistence reads use the independent client');
      assert.deepEqual(parts, ['users', uid, 'mealPlans', planId]);
      return { db, path: parts.join('/') };
    },
    getDoc: async () => {
      if (!reloads) independentReadsBeforeReload++;
      trace.push(`independent server read: ${String(stored.mealStatus?.['legacy-meal-eaten'])}`);
      return { data: () => copy(stored) };
    },
  };
  const js = ts.transpileModule(`${helpers}\n(${callback.getText(parsed)})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const actual = vm.runInNewContext(js, scope, { filename: specPath, timeout: 1000 }) as
    (fixture: { page: typeof page }) => Promise<void>;
  return {
    actual, page, clicked, releaseCommit, trace, assertions,
    state: () => ({ reloads, acknowledged, discarded, independentReadsBeforeReload }),
  };
}

async function within<T>(promise: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('actual AUD-022 callback did not progress within 1000ms')), 1000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

for (const delayed of [false, true]) {
  test(`AUD-022 actual callback preserves untick across reload, ${delayed ? 'delayed' : 'immediate'} server commit`, async () => {
    const h = fixture(delayed);
    const running = h.actual({ page: h.page });
    // Install rejection handling now so a real callback assertion failure cannot
    // become an unhandled rejection while the controller releases the write.
    const outcome = running.then(() => ({ ok: true as const }), error => ({ ok: false as const, error }));
    await within(Promise.race([h.clicked.promise, running]));
    if (delayed) {
      // Let the callback consume the optimistic click and UI assertion. A correct
      // callback waits at the independent read; the old callback has reloaded.
      await setImmediate();
      h.releaseCommit.resolve();
    }
    const result = await within(outcome);
    if (!result.ok) {
      assert.fail(`${String(result.error)}\nBoundary trace: ${h.trace.join(' -> ')}`);
    }
    assert.equal(h.state().acknowledged, true);
    assert.equal(h.state().discarded, false);
    assert.equal(h.state().reloads, 1);
    assert.ok(h.assertions.includes('exact stored mealStatus'), 'retain the actual stored map assertion');
    assert.ok(h.assertions.includes('original legacy array value'), 'retain the actual unchanged legacy array assertion');
    assert.ok(h.assertions.includes('console failures'), 'retain the actual console-failure assertion');
    if (delayed) {
      assert.ok(h.state().independentReadsBeforeReload > 0,
        'the callback must observe persisted false before reloading after an optimistic untick');
    }
  });
}
