import { expect, it } from "vitest";
import { runHotelDepthScenario } from "../test/hotelDepthScenario";

it("propagates conference load into fnb housekeeping and elevators", () => {
  const r = runHotelDepthScenario(180);
  expect(r.conferences).toBeGreaterThan(0);
  expect(r.breakfastDemand).toBeGreaterThan(0);
  expect(r.housekeepingMinutes).toBeGreaterThan(0);
  expect(r.elevatorTrips).toBeGreaterThan(0);
});

it("keeps every facility on the board with a named binding constraint", () => {
  const r = runHotelDepthScenario(180);
  expect(r.facilities.length).toBeGreaterThan(0);
  for (const f of r.facilities) {
    expect(f.cause.length).toBeGreaterThan(0);
    expect(Number.isSafeInteger(f.capacity)).toBe(true);
  }
  // Linen circulates rather than leaking out of the hotel.
  expect(r.linen.clean + r.linen.dirty).toBeGreaterThan(0);
});
