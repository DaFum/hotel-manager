export function recommendedOverbookingLimit(input: {
  rooms: number;
  bookings: number;
  cancellations: number;
  noShows: number;
  walkCostMinor: number;
  riskTolerance: number;
}): number {
  if (input.bookings <= 0 || input.rooms <= 0) return 0;
  const attritionBp = Math.trunc(
    ((input.cancellations + input.noShows) * 10_000) / input.bookings,
  );
  const riskBp = Math.trunc(
    (Math.max(0, Math.min(100, input.riskTolerance)) * 10_000) / 100,
  );
  const costPenaltyBp = Math.min(9000, Math.trunc(input.walkCostMinor / 100));
  return Math.max(
    0,
    Math.trunc(
      (input.rooms * attritionBp * riskBp * (10_000 - costPenaltyBp)) /
        1_000_000_000_000,
    ),
  );
}
