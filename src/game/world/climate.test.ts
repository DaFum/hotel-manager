import { expect, it } from "vitest";
import { createRngStreams } from "../domain/rng";
import { generateWeather, weatherInsurancePayout } from "./climate";
it("reproduces isolated weather and propagates operational effects", () => {
  const a = createRngStreams(4),
    b = createRngStreams(4);
  const guestBefore = a.guests.state;
  const wa = generateWeather(a.weather, 9000),
    wb = generateWeather(b.weather, 9000);
  expect(wa).toEqual(wb);
  expect(a.guests.state).toBe(guestBefore);
  expect(wa.transportReliabilityBp).toBeLessThanOrEqual(10_000);
  expect(wa.utilityLoadBp).toBeGreaterThanOrEqual(10_000);
  expect(
    weatherInsurancePayout(10000, { ...wa, insurable: true }, 8000, 1000),
  ).toBe(7200);
});
