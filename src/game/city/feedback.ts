/**
 * What the hotels give back to the city. A house that builds conference space
 * makes the city itself a better congress destination — but not this month,
 * and not without limit: organisers move slowly and the fifth ballroom in town
 * is worth far less than the first.
 */

/** Months between building capacity and the city reacting to it. */
export const FEEDBACK_DELAY_MONTHS = 6;

/** Ceiling of the conference feedback, in basis points of city event demand. */
export const MAX_CONFERENCE_EFFECT_BP = 1000;
/** Capacity at which roughly 63% of the ceiling is reached, in seats. */
const CONFERENCE_HALF_SCALE = 600;

/**
 * The city's answer to the conference capacity its hotels have built, in
 * basis points of extra event demand. Saturating by construction: the curve
 * approaches its ceiling and never passes it.
 */
export function conferenceEffect(capacity: number): number {
  if (!Number.isFinite(capacity)) throw new Error("invalid capacity");
  return Math.round(
    MAX_CONFERENCE_EFFECT_BP *
      (1 - Math.exp(-Math.max(0, capacity) / CONFERENCE_HALF_SCALE)),
  );
}

/**
 * Pushes this month's effect into a fixed-length pipeline and returns the one
 * that has finally matured. The pipeline never grows, so a long campaign
 * cannot accumulate an unbounded history of pending city effects.
 */
export function delayedEffect(
  pipeline: readonly number[],
  effect: number,
): { applied: number; pipeline: number[] } {
  if (!Number.isFinite(effect)) throw new Error("invalid effect");
  const filled = Array.from(
    { length: FEEDBACK_DELAY_MONTHS },
    (_, i) => pipeline[i] ?? 0,
  );
  const applied = filled[0];
  return { applied, pipeline: [...filled.slice(1), Math.round(effect)] };
}
