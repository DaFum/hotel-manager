import { describe, expect, it } from "vitest";
import { ambienceMix } from "./ambience";
describe("hotel ambience", () => {
  it("reflects visible operations", () => {
    expect(
      ambienceMix({
        visibleGuests: 80,
        receptionQueue: 15,
        restaurantGuests: 30,
      }).lobby,
    ).toBeGreaterThan(0.5);
  });
  it("responds to occupancy, time, and active areas", () => {
    expect(
      ambienceMix({
        visibleGuests: 20,
        receptionQueue: 0,
        restaurantGuests: 40,
        occupancyBasisPoints: 8000,
        minuteOfDay: 60,
        activeAreas: ["lobby"],
      }),
    ).toMatchObject({ hotel: 0.8, night: 1, restaurant: 0 });
  });
});
