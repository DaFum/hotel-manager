import { expect, it } from "vitest";
import {
  applyRouteChange,
  connectivityIndex,
  type TransportNetwork,
} from "./network";

const FRANKFURT: TransportNetwork = {
  rail: 70,
  airport: 80,
  road: 60,
  local: 75,
};

it("weights rail airport road and local transit", () => {
  // 70*0.30 + 80*0.35 + 60*0.15 + 75*0.20 = 73. Plan 03 quotes 72 for these
  // same weights and ratings; the weights are the contract, so the arithmetic
  // they produce wins over the plan's transcription of it.
  expect(connectivityIndex(FRANKFURT)).toBe(73);
});

it("weights the airport hardest and the road network least", () => {
  const withAirport = connectivityIndex({ ...FRANKFURT, airport: 90 });
  const withRoad = connectivityIndex({ ...FRANKFURT, road: 70 });
  expect(withAirport).toBeGreaterThan(withRoad);
});

it("keeps the index inside its declared 0-100 range", () => {
  expect(connectivityIndex({ rail: 0, airport: 0, road: 0, local: 0 })).toBe(0);
  expect(
    connectivityIndex({ rail: 100, airport: 100, road: 100, local: 100 }),
  ).toBe(100);
  expect(() => connectivityIndex({ ...FRANKFURT, rail: 101 })).toThrow(/rail/);
});

it("applies a route change to one mode and clamps it to the range", () => {
  expect(
    applyRouteChange(FRANKFURT, { mode: "airport", deltaPoints: 8 }).airport,
  ).toBe(88);
  expect(
    applyRouteChange(FRANKFURT, { mode: "airport", deltaPoints: 40 }).airport,
  ).toBe(100);
  expect(
    applyRouteChange(FRANKFURT, { mode: "rail", deltaPoints: -200 }).rail,
  ).toBe(0);
  // The other modes are untouched: a new runway is not a new tram line.
  expect(
    applyRouteChange(FRANKFURT, { mode: "airport", deltaPoints: 8 }).rail,
  ).toBe(70);
});
