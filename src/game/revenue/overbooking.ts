export function recommendedOverbookingLimit(input: {
  rooms: number;
  bookings: number;
  cancellations: number;
  noShows: number;
  walkCostMinor: number;
  riskTolerance: number;
}): number {
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isSafeInteger(value))
      throw new Error(`${key} must be a safe integer`);
    if (key !== "riskTolerance" && value < 0)
      throw new Error(`${key} must be non-negative`);
  }
  if (input.cancellations + input.noShows > input.bookings)
    throw new Error("attrition cannot exceed bookings");
  if (input.riskTolerance < 0 || input.riskTolerance > 100)
    throw new Error("riskTolerance must be between 0 and 100");

  if (input.bookings <= 0 || input.rooms <= 0) return 0;

  const attritionBp =
    (BigInt(input.cancellations + input.noShows) * 10_000n) /
    BigInt(input.bookings);
  const riskBp = (BigInt(input.riskTolerance) * 10_000n) / 100n;

  let costPenaltyBp = BigInt(input.walkCostMinor) / 100n;
  if (costPenaltyBp > 9000n) costPenaltyBp = 9000n;

  const result =
    (BigInt(input.rooms) * attritionBp * riskBp * (10_000n - costPenaltyBp)) /
    1_000_000_000_000n;
  return Number(result);
}
