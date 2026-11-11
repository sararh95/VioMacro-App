/**
 * The master on/off switch for every paid AI feature.
 *
 * Added because there was no way to turn AI off in production. The only guard,
 * `assertLiveAiAllowed`, blocks the local emulator and nothing else, and the
 * spend circuit breaker is opt-in. So the only way to stop spending was to
 * revoke the provider key -- which does stop the spending, but leaves the app
 * calling functions that then fail with an internal error.
 *
 * **Default is OFF, deliberately.** A missing or misspelt variable leaves AI
 * disabled rather than quietly billable. Turning it on is an explicit act:
 *
 *     AI_ENABLED=true
 *
 * Anything else -- unset, empty, "false", "1", "yes", "TRUE " with a stray
 * space -- means off. There is no clever coercion here on purpose: a switch
 * that guards money should be boring and literal.
 */

export const AI_DISABLED_MESSAGE =
    "AI features are paused. No provider key is configured right now.";

/** True only when AI_ENABLED is exactly "true". */
export function isAiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return env.AI_ENABLED === "true";
}

/**
 * The user-facing reason, or null when AI is available.
 *
 * Kept separate from the throwing helper so the callables, the background
 * trigger and the tests can all ask the same question without catching.
 */
export function aiUnavailableReason(
    env: NodeJS.ProcessEnv = process.env
): string | null {
    return isAiEnabled(env) ? null : AI_DISABLED_MESSAGE;
}
