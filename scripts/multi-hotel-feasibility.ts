import { performance } from "node:perf_hooks";
import { managedHotelMonth } from "../src/game/company/managedHotels";
import { computeStateDelta } from "../src/game/domain/stateDelta";
import type { GameSnapshot } from "../src/game/domain/snapshot";
import { PERF_BUDGET } from "../src/game/perf/performanceBudget";
import { GameSimulation } from "../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../src/game/simulation/initialState";
import { prototypePortfolioDetailTiers } from "../src/game/simulation/portfolioTierPrototype";

const TARGET_HOTELS = 60;
const TARGET_CITIES = 25;
const SAMPLE_QUANTA = 288;
const FULL_SAMPLE_HOTELS = 2;
const OPERATIONAL_INTERVAL_QUANTA = 12;
const TIER_MIX = { full: 1, operational: 4, aggregate: 55 } as const;
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));

function measureRealQuantumCost(count: number, interval: number): number {
  const simulations = Array.from(
    { length: count },
    (_, index) => new GameSimulation(createInitialGameState(1991 + index)),
  );
  const started = performance.now();
  for (let quantum = 0; quantum < SAMPLE_QUANTA; quantum++) {
    if (quantum % interval !== 0) continue;
    for (const simulation of simulations) simulation.advanceQuantum();
  }
  return (performance.now() - started) / SAMPLE_QUANTA;
}

function measureAggregateCost(count: number): number {
  const hotels = Array.from({ length: count }, (_, index) => ({
    hotelId: `hotel.scale.${String(index).padStart(2, "0")}`,
    name: `Scale hotel ${index}`,
    cityId: `city.scale.${index % TARGET_CITIES}`,
    rooms: 150,
    adrMinor: 15_000,
    occupancyBasisPoints: 7_000,
    gopMarginBasisPoints: 3_000,
    openedDateKey: "1991-01-01",
  }));
  const started = performance.now();
  for (const hotel of hotels)
    managedHotelMonth(hotel, {
      periodStartDateKey: "1992-01-01",
      brandUpliftBp: 500,
    });
  // Monthly work amortised over the 5-minute quanta in a 30-day month.
  return (performance.now() - started) / (30 * 288);
}

function scaledCollectionSnapshot(changed = false): GameSnapshot {
  const hotels = Object.fromEntries(
    Array.from({ length: TARGET_HOTELS }, (_, index) => {
      const state = createInitialGameState(3000 + index);
      state.hotel.id = `hotel.scale.${String(index).padStart(2, "0")}`;
      if (changed && index === 0) state.elapsedMinutes += 5;
      return [state.hotel.id, state];
    }),
  );
  const cities = Object.fromEntries(
    Array.from({ length: TARGET_CITIES }, (_, index) => {
      const state = createInitialGameState(4000 + index);
      return [`city.scale.${String(index).padStart(2, "0")}`, state.cityMarket];
    }),
  );
  // This deliberately models the proposed top-level collection sections. A
  // change to one hotel makes section-based deltas resend the whole collection.
  return { hotels, cities } as unknown as GameSnapshot;
}

export function runMultiHotelFeasibilitySpike() {
  const fullMeanTickMs =
    (measureRealQuantumCost(FULL_SAMPLE_HOTELS, 1) / FULL_SAMPLE_HOTELS) *
    TIER_MIX.full;
  const operationalMeanTickMs = measureRealQuantumCost(
    TIER_MIX.operational,
    OPERATIONAL_INTERVAL_QUANTA,
  );
  const aggregateMeanTickMs = measureAggregateCost(TIER_MIX.aggregate);
  const projectedMeanTickMs =
    fullMeanTickMs + operationalMeanTickMs + aggregateMeanTickMs;
  const deltaBytes = bytes(
    computeStateDelta(
      scaledCollectionSnapshot(),
      scaledCollectionSnapshot(true),
      { basePublication: 1, publication: 2 },
    ),
  );
  const hotelIds = Array.from(
    { length: TARGET_HOTELS },
    (_, index) => `hotel.scale.${String(index).padStart(2, "0")}`,
  );
  const tiers = prototypePortfolioDetailTiers({
    viewedHotelId: hotelIds[0],
    playerHotelIds: hotelIds,
    hotelIds,
  });
  return {
    target: { hotels: TARGET_HOTELS, cities: TARGET_CITIES },
    tierMix: TIER_MIX,
    prototypeTierCounts: Object.values(tiers).reduce(
      (counts, tier) => ({ ...counts, [tier]: counts[tier] + 1 }),
      { full: 0, operational: 0, aggregate: 0 },
    ),
    assumptions: {
      sampleQuanta: SAMPLE_QUANTA,
      fullSampleHotels: FULL_SAMPLE_HOTELS,
      operationalIntervalQuanta: OPERATIONAL_INTERVAL_QUANTA,
      aggregateEngine: "managedHotelMonth",
      deltaShape: "whole hotels and cities sections",
    },
    measurements: {
      fullMeanTickMs,
      operationalMeanTickMs,
      aggregateMeanTickMs,
      projectedMeanTickMs,
      deltaBytes,
    },
    budgets: PERF_BUDGET,
    decisions: {
      tickBudgetHolds: projectedMeanTickMs <= PERF_BUDGET.tickMs,
      partitionHotelDeltas: deltaBytes > PERF_BUDGET.deltaBytes,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runMultiHotelFeasibilitySpike();
  console.log(JSON.stringify(report, null, 2));
  if (!report.decisions.tickBudgetHolds) process.exitCode = 1;
}
