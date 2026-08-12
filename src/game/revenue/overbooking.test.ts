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
});
