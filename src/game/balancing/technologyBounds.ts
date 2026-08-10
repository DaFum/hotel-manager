export const MIN_ACTIVE_ADOPTION_STEP_BP = 10;
export const MAX_ADOPTION_STEP_BP = 400;

export function boundedAdoptionStep(
  currentBp: number,
  rawDeltaBp: number,
  maxStepBp = MAX_ADOPTION_STEP_BP,
): number {
  if (
    ![currentBp, rawDeltaBp, maxStepBp].every(Number.isSafeInteger) ||
    currentBp < 0 ||
    currentBp > 10_000 ||
    maxStepBp <= 0
  )
    throw new Error("invalid technology adoption step");
  let delta = Math.max(-maxStepBp, Math.min(maxStepBp, rawDeltaBp));
  if (rawDeltaBp !== 0 && Math.abs(delta) < MIN_ACTIVE_ADOPTION_STEP_BP)
    delta =
      Math.sign(rawDeltaBp) * Math.min(MIN_ACTIVE_ADOPTION_STEP_BP, maxStepBp);
  return Math.max(0, Math.min(10_000, currentBp + delta));
}
