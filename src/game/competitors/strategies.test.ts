import { expect, it } from "vitest";
import {
  observedMarketRateMinor,
  STRATEGIES,
  strategyProfile,
  targetLeverageBp,
  type Strategy,
} from "./strategies";

it("gives aggressive investors more leverage tolerance", () => {
  expect(targetLeverageBp("aggressive")).toBeGreaterThan(
    targetLeverageBp("family"),
  );
});

it("names a profile for every strategy the game can create", () => {
  for (const s of STRATEGIES) {
    const profile = strategyProfile(s);
    expect(profile.name.length).toBeGreaterThan(0);
    expect(Number.isSafeInteger(profile.positioningBp)).toBe(true);
    expect(Number.isSafeInteger(targetLeverageBp(s))).toBe(true);
  }
  expect(() => targetLeverageBp("hotelier" as Strategy)).toThrow(/strategy/);
});

it("positions budget below and luxury above the market", () => {
  expect(strategyProfile("budget").positioningBp).toBeLessThan(10000);
  expect(strategyProfile("luxury").positioningBp).toBeGreaterThan(10000);
});

it("lets a competitor see only a blurred version of the market rate", () => {
  const truth = 20000;
  // Bounded knowledge: the observation is near the truth, never equal to it
  // by construction, and never outside the declared error band.
  for (let roll = 0; roll < 10000; roll += 617) {
    const seen = observedMarketRateMinor(truth, roll);
    expect(Number.isSafeInteger(seen)).toBe(true);
    expect(seen).toBeGreaterThanOrEqual(Math.round(truth * 0.9));
    expect(seen).toBeLessThanOrEqual(Math.round(truth * 1.1));
  }
});

it("observes the same market the same way for the same roll", () => {
  expect(observedMarketRateMinor(20000, 4242)).toBe(
    observedMarketRateMinor(20000, 4242),
  );
  expect(observedMarketRateMinor(20000, 4242)).not.toBe(
    observedMarketRateMinor(20000, 9999),
  );
});
