import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const specPath = 'tests/e2e/emulator-auth.spec.ts';
const spec = ts.createSourceFile(specPath, readFileSync(specPath, 'utf8'), ts.ScriptTarget.Latest, true);
const cases = [
  { name: 'AI recipe search fails gracefully when the callable returns an error', kind: 'search', message: 'AI search failed' },
  { name: 'data-loss: failed recipe image import cleans up the uploaded asset', kind: 'image', message: 'Failed to parse recipe' },
  { name: 'recipe import rejects unsupported file types before upload', kind: 'unsupported', message: 'Unsupported file type' },
] as const;
type Scenario = typeof cases[number];

function extract(predicate: (node: ts.Node) => boolean): string {
  const matches: ts.Node[] = [];
  const visit = (node: ts.Node) => {
    if (predicate(node)) matches.push(node);
    ts.forEachChild(node, visit);
  };
  visit(spec);
  assert.equal(matches.length, 1, 'extract exactly one real E2E callback/helper');
  return matches[0].getText(spec);
}

const helper = extract(node => ts.isFunctionDeclaration(node) && node.name?.text === 'acceptNextDialog');
function callback(name: string) {
  const call = extract(node => ts.isCallExpression(node)
    && ts.isIdentifier(node.expression) && node.expression.text === 'test'
    && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === name);
  const parsed = ts.createSourceFile('callback.ts', call, ts.ScriptTarget.Latest, true);
  const statement = parsed.statements[0];
  assert.ok(ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression));
  const body = statement.expression.arguments[1];
  assert.ok(ts.isArrowFunction(body));
  return body.getText(parsed);
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(complete => { resolve = complete; });
  return { promise, resolve };
}

// A small Playwright protocol fixture, not replacement test orchestration. Its action
// acknowledgement deliberately stays pending until the emitted native dialog is accepted.
// This is the page "dialog" contract documented in playwright-core/types/types.d.ts.
function fixture(scenario: Scenario, delayed: boolean) {
  const started = deferred();
  const response = deferred();
  const emitted = deferred();
  const accepted = deferred();
  const assertions: string[] = [];
  const listeners: ((nativeDialog: typeof dialog) => unknown)[] = [];
  const storage = {};
  let handler: ((route: unknown) => Promise<void>) | undefined;
  let didEmit = false;
  let didAccept = false;
  let actionFinished = false;
  let uploadedFilename = '';
  let parsedFailure = false;

  const dialog = {
    message: () => scenario.message,
    accept: async () => { didAccept = true; accepted.resolve(); },
  };
  const action = async (file?: { name: string }) => {
    uploadedFilename = file?.name ?? '';
    started.resolve();
    if (handler) {
      await handler({ fulfill: async (payload: { status: number; body: string }) => {
        assert.equal(payload.status, 500);
        assert.match(JSON.parse(payload.body).error.message, /mock (semantic search|parse) failure/);
        if (delayed) await response.promise;
        parsedFailure = true;
      } });
    } else if (delayed) {
      await response.promise;
    }
    didEmit = true;
    for (const listener of listeners.splice(0)) listener(dialog);
    emitted.resolve();
    await accepted.promise;
    actionFinished = true;
  };
  const page = {
    route: async (_pattern: string, routeHandler: typeof handler) => { handler = routeHandler; },
    goto: async () => {},
    once: (event: string, listener: (nativeDialog: typeof dialog) => unknown) => {
      assert.equal(event, 'dialog');
      listeners.push(listener);
    },
    waitForEvent: (event: string) => new Promise(resolve => page.once(event, resolve)),
    getByRole: (_role: string, options: { name: string | RegExp }) => ({
      click: () => options.name === 'Run AI recipe search' ? action() : Promise.resolve(),
      visible: () => options.name === 'Start with Magic Import',
    }),
    getByPlaceholder: (name: RegExp) => ({
      fill: async (value: string) => { assert.equal(value, 'high protein chicken bowl'); },
      visible: () => name.source === 'Search recipes' && didAccept && actionFinished,
    }),
    locator: (selector: string) => {
      assert.equal(selector, 'input[type="file"]');
      return { setInputFiles: action };
    },
    // The unsupported-file callback's browser-only DataTransfer code is outside the
    // ordering under test. Its evaluate acknowledgement obeys the same dialog gate.
    getByTestId: () => ({ evaluate: (_browserCallback: unknown, filename: string) => action({ name: filename }) }),
  };
  const expect = Object.assign((actual: unknown) => ({
    toContain: (expected: string) => {
      assertions.push('message');
      assert.equal(typeof actual, 'string');
      assert.ok((actual as string).includes(expected));
    },
    toEqual: (expected: unknown) => {
      assertions.push('console');
      // Arrays created in the VM have a different prototype.
      assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
    },
    toBeVisible: async () => {
      assertions.push(scenario.kind === 'search' ? 'recovery UI' : 'import UI');
      assert.equal((actual as { visible: () => boolean }).visible(), true);
    },
    resolves: {
      toContain: async (expected: string) => {
        assertions.push('message');
        assert.ok(String(await actual).includes(expected));
      },
    },
  }), {
    poll: (read: () => Promise<unknown>) => ({ toBe: async (expected: unknown) => {
      assertions.push('storage cleanup');
      assert.equal(await read(), expected);
    } }),
  });
  const scope = {
    Buffer, expect,
    enableMockAi: async () => {}, signIn: async () => {}, createBrowserUser: async () => {},
    collectConsoleFailures: () => [],
    createFirebaseClient: () => ({ auth: {}, storage }), TEST_PASSWORD: 'synthetic-only',
    signInWithEmailAndPassword: async () => ({ user: { uid: 'own-synthetic-user' } }),
    ref: (actualStorage: object, path: string) => {
      assert.equal(actualStorage, storage);
      assert.equal(path, 'users/own-synthetic-user/recipes');
      return path;
    },
    listAll: async () => ({ items: actionFinished ? [] : [{ name: uploadedFilename }] }),
  };
  const source = `${helper}\n({ callback: (${callback(scenario.name)}), acceptNextDialog })`;
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const actual = vm.runInNewContext(js, scope, { filename: specPath, timeout: 1000 }) as {
    callback: (fixture: { page: typeof page }) => Promise<void>;
    acceptNextDialog: (fixturePage: typeof page) => Promise<string>;
  };
  return {
    page, actual, action, assertions, started, response, emitted,
    state: () => ({ didEmit, didAccept, actionFinished, parsedFailure }),
  };
}

async function within<T>(promise: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('fixture/callback did not progress within 1000ms')), 1000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

for (const delayed of [false, true]) {
  for (const scenario of cases) {
    test(`native dialog ordering: ${scenario.kind}, ${delayed ? 'delayed' : 'immediate'} failure`, async () => {
      const h = fixture(scenario, delayed);
      const running = h.actual.callback({ page: h.page });
      // Early callback exceptions win the race; import/runtime failures cannot look
      // like an expected ordering regression.
      await within(Promise.race([h.started.promise, running]));
      if (delayed) {
        assert.equal(h.state().didEmit, false, 'response is explicitly withheld');
        h.response.resolve();
      }
      await within(Promise.race([h.emitted.promise, running]));
      // Drain continuations in this turn. No wall-clock timeout is needed to expose
      // the cycle: dialog emitted -> action waits for accept -> callback waits action.
      await setImmediate();
      const state = h.state();
      assert.equal(state.didEmit, true, 'the real callback triggered a native dialog');
      assert.equal(state.didAccept, true,
        'native dialog deadlock: callback awaits action acknowledgement before accepting its emitted dialog');
      await within(running);
      assert.equal(h.state().actionFinished, true);
      assert.ok(h.assertions.includes('message'), 'retain the actual callback message assertion');
      assert.ok(h.assertions.includes('console'), 'retain the actual callback console-failure assertion');
      assert.ok(h.assertions.includes(scenario.kind === 'search' ? 'recovery UI' : 'storage cleanup'));
      if (scenario.kind !== 'unsupported') assert.equal(h.state().parsedFailure, true);
    });
  }

  test(`existing acceptNextDialog helper accepts before action acknowledgement, ${delayed ? 'delayed' : 'immediate'}`, async () => {
    const h = fixture(cases[0], delayed);
    const message = h.actual.acceptNextDialog(h.page);
    const running = h.action();
    if (delayed) {
      await h.started.promise;
      assert.equal(h.state().didEmit, false);
      h.response.resolve();
    }
    assert.equal(await within(message), cases[0].message);
    await within(running);
    assert.equal(h.state().actionFinished, true);
  });
}
