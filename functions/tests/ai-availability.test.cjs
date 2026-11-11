const assert = require("node:assert/strict");
const test = require("node:test");

const {
    isAiEnabled,
    aiUnavailableReason,
    AI_DISABLED_MESSAGE,
} = require("../lib/aiAvailability.js");

/**
 * The master AI off-switch.
 *
 * Before this existed there was no way to turn AI off in production. The only
 * guard blocked the local emulator; the spend circuit breaker is opt-in. The
 * only remaining lever was revoking the provider key, which stops the spending
 * but leaves the app calling functions that then fail with an internal error.
 */

test("AI is off unless AI_ENABLED is exactly \"true\"", () => {
    assert.equal(isAiEnabled({ AI_ENABLED: "true" }), true);
});

test("a missing variable means off, not on", () => {
    // The important case. A typo in a deploy config, a dropped variable, a new
    // environment nobody configured -- all of these must leave AI paused rather
    // than quietly billable.
    assert.equal(isAiEnabled({}), false);
    assert.equal(isAiEnabled({ AI_ENABLED: undefined }), false);
});

test("nothing else counts as on", () => {
    // No coercion on purpose. A switch that guards money should be literal.
    for (const value of ["TRUE", "True", "true ", " true", "1", "yes", "on", "", "false"]) {
        assert.equal(
            isAiEnabled({ AI_ENABLED: value }),
            false,
            `${JSON.stringify(value)} must not enable AI`
        );
    }
});

test("the reason is null when on, and a plain sentence when off", () => {
    assert.equal(aiUnavailableReason({ AI_ENABLED: "true" }), null);
    assert.equal(aiUnavailableReason({}), AI_DISABLED_MESSAGE);
    assert.match(AI_DISABLED_MESSAGE, /paused/i);
});
