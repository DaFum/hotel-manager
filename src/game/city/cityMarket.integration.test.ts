import { expect, it } from "vitest";
import { runCityYears } from "../test/cityScenario";
import { migrateV2ToV3 } from "../persistence/migrations/v2-to-v3";
import {
  SAVE_VERSION,
  isCompatible,
  type SaveEnvelope,
} from "../persistence/saveSchema";
import saveV2Fixture from "../persistence/fixtures/save-v2.json";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { MINUTES_PER_DAY } from "../domain/calendar";
import { FEEDBACK_DELAY_MONTHS } from "./feedback";
import {
  allocateCityDay,
  createCityMarket,
  createCompetitors,
  recordPlayerRoomNights,
} from "./cityMarket";
import { STARTER_HOTEL } from "../content/1991/starterHotel";

const QUANTA_PER_DAY = MINUTES_PER_DAY / QUANTUM_MINUTES;

it("records only player room nights that the booking flow realizes", () => {
  const market = createCityMarket("1991-01-01");
  const competitors = createCompetitors();
  const result = allocateCityDay(
    market,
    competitors,
    {
      id: STARTER_HOTEL.id,
      rooms: STARTER_HOTEL.roomCount,
      rateMinor: STARTER_HOTEL.defaultRateMinor.double,
      appealBp: 10000,
      conferenceSeats: 0,
    },
    "1991-01-01",
  );
  const rivalNights = competitors.reduce(
    (sum, competitor) => sum + competitor.soldRoomNights,
    0,
  );
  expect(market.soldRoomNights).toBe(rivalNights);
  recordPlayerRoomNights(market, 3);
  expect(market.soldRoomNights).toBe(rivalNights + 3);
  expect(result.playerRoomNights).toBeGreaterThan(0);
});

it("keeps a functioning market for ten years", () => {
  const r = runCityYears(10, 4242);
  expect(r.activeCompetitors).toBeGreaterThan(2);
  expect(r.hotelSupply).toBeGreaterThan(0);
});

it("keeps every city figure inside a sane band across the decade", () => {
  const r = runCityYears(10, 4242);
  expect(r.minActiveCompetitors).toBeGreaterThan(0);
  expect(r.cityRoomNights).toBeGreaterThan(0);
  expect(r.landPriceMinor).toBeGreaterThan(0);
  expect(Number.isSafeInteger(r.landPriceMinor)).toBe(true);
  expect(r.wagePressureBp).toBeGreaterThanOrEqual(7500);
  expect(r.wagePressureBp).toBeLessThanOrEqual(15000);
  expect(r.marketRateMinor).toBeGreaterThan(0);
});

it("replays a decade of the market bit for bit", () => {
  expect(runCityYears(10, 4242)).toEqual(runCityYears(10, 4242));
  expect(runCityYears(10, 99)).not.toEqual(runCityYears(10, 4242));
});

it("runs the same market inside the real simulation", () => {
  const sim = new GameSimulation(createInitialGameState(424242));
  for (let quantum = 0; quantum < QUANTA_PER_DAY * 70; quantum++)
    sim.advanceQuantum();
  const s = sim.snapshot();
  expect(s.competitors.length).toBeGreaterThan(0);
  // The rivals have traded: the month rolled and they sold nights.
  expect(s.competitors.some((c) => c.occupancyBp > 0)).toBe(true);
  expect(s.cityMarket.demand.business).toBeGreaterThan(0);
  expect(s.cityMarket.forecast.high).toBeGreaterThanOrEqual(
    s.cityMarket.forecast.low,
  );
  // The player still trades in the city rather than being frozen out.
  expect(s.finance.month.soldRoomNights + s.stays.length).toBeGreaterThan(0);
});

it("restores a migrated v2 save into a runnable market", () => {
  const legacy = structuredClone(saveV2Fixture) as unknown as SaveEnvelope;
  expect(legacy.saveVersion).toBe(2);
  const legacyState = legacy.state as Record<string, unknown>;
  expect(legacyState.cityMarket).toBeUndefined();
  expect(legacyState.competitors).toBeUndefined();

  const migrated = migrateV2ToV3(legacy);
  expect(migrated.saveVersion).toBe(SAVE_VERSION);
  expect(isCompatible(migrated)).toBe(true);

  const sim = new GameSimulation(
    migrated.state as ReturnType<typeof createInitialGameState>,
  );
  sim.advanceQuantum();
  const s = sim.snapshot();
  expect(s.competitors.length).toBeGreaterThan(0);
  expect(s.cityMarket.landPriceMinor).toBeGreaterThan(0);
  expect(s.cityMarket.feedbackPipeline).toHaveLength(FEEDBACK_DELAY_MONTHS);
});
