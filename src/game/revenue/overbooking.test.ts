import { expect, it } from "vitest";
import { recommendedOverbookingLimit } from "./overbooking";

it("biases the history-based overbooking recommendation by risk tolerance", () => {
  const cautious = recommendedOverbookingLimit({
    rooms: 100,
    bookings: 100,
    cancellations: 8,
    noShows: 2,
    walkCostMinor: 1_000,
    riskTolerance: 20,
  });
  const bold = recommendedOverbookingLimit({
    rooms: 100,
    bookings: 100,
    cancellations: 8,
    noShows: 2,
    walkCostMinor: 1_000,
    riskTolerance: 80,
  });
  expect(bold).toBeGreaterThan(cautious);
  expect(cautious).toBe(1);
  expect(bold).toBe(7);

  expect(
    recommendedOverbookingLimit({
      rooms: 100,
      bookings: 100,
      cancellations: 8,
      noShows: 2,
      walkCostMinor: 1_000_000, // Capped cost penalty
      riskTolerance: 80,
    }),
  ).toBe(0); // Large penalty means 0 recommendation

  expect(
    recommendedOverbookingLimit({
      rooms: 100,
      bookings: 0,
      cancellations: 0,
      noShows: 0,
      walkCostMinor: 1000,
      riskTolerance: 50,
    }),
  ).toBe(0);
});
