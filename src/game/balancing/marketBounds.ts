export function boundedAnnualChangeBasisPoints(
  raw: number,
  maxAbs: number,
): number {
  if (!Number.isSafeInteger(raw) || !Number.isSafeInteger(maxAbs) || maxAbs < 0)
    throw new Error("market changes must be integer basis points");
  return Math.max(-maxAbs, Math.min(maxAbs, raw));
}

export function boundedPeriodTarget(
  current: number,
  target: number,
  maxChangeBp: number,
): number {
  if (
    !Number.isSafeInteger(current) ||
    current < 0 ||
    !Number.isSafeInteger(target) ||
    target < 0 ||
    !Number.isSafeInteger(maxChangeBp) ||
    maxChangeBp < 0
  )
    throw new Error("market values must be non-negative safe integers");
  if (maxChangeBp === 0) return current;
  const limit = Math.max(1, Math.round((current * maxChangeBp) / 10_000));
  return (
    current +
    Math.sign(target - current) * Math.min(Math.abs(target - current), limit)
  );
}
