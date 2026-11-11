export const US_UNITS = [
    "Cup", "Tbsp", "Tsp", "Oz", "Lb", "Unit", "Large", "Medium", "Small", "Pinch", "Can", "Slice", "Stick", "to taste"
] as const;

export const METRIC_UNITS = [
    "g", "kg", "ml", "L"
] as const;

export const ALL_UNITS = [...US_UNITS, ...METRIC_UNITS];

/**
 * The client half of the AI master switch.
 *
 * Kept in step with the Cloud Functions flag (`AI_ENABLED` in
 * functions/src/aiAvailability.ts), which is the one that actually stops the
 * spending. This one only decides whether the buttons are offered, so that a
 * paused app reads as paused instead of throwing an error when pressed.
 *
 * Default is OFF here too. If the two ever disagree, the backend wins and the
 * user sees a refusal rather than a charge -- the safe direction.
 */
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true';

/** Shown on every AI control while paused. */
export const AI_PAUSED_HINT = 'AI is paused - no provider key is configured yet';
