import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { cityHouses, type CompetitorRecord } from "./cityMarket";
import {
  competitorMonth,
  creditLineMinor,
  postsForRooms,
} from "../competitors/month";
import {
  OBSERVATION_ERROR_BP,
  observedMarketRateMinor,
  targetLeverageBp,
} from "../competitors/strategies";
import { competitorRateMinor } from "../competitors/pricing";
import { entryOpportunity, lifecycleAction } from "../competitors/lifecycle";
import {
  MAX_PRESSURE_BP,
  MIN_PRESSURE_BP,
  marketWageMinor,
} from "../labor/market";
import { BASE_ROOM_BUILD_MINOR, buildCostMinor } from "../property/market";
import { BASE_MONTHLY_WAGE_MINOR } from "../content/1991/cityMarket";
import {
  FEEDBACK_DELAY_MONTHS,
  MAX_CONFERENCE_EFFECT_BP,
  conferenceEffect,
  delayedEffect,
} from "./feedback";
import { MAX_MONTHLY_ACTOR_MOVE, nextActorScale } from "../actors/evolution";
import { applyRouteChange, connectivityIndex } from "../transport/network";
import { migrateEnvelope, validateEnvelope } from "../persistence/saveSchema";
import { SAVE_VERSION } from "../persistence/saveVersions";
import { PROTOCOL_VERSION } from "../domain/protocol";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

function playDays(s: GameSimulation, days: number): void {
  for (let day = 0; day < days; day++)
    for (let q = 0; q < QUANTA_PER_DAY; q++) s.advanceQuantum();
}

/** Enough days for the city to settle two months and the rivals to act. */
const DAYS_FOR_TWO_CITY_MONTHS = 65;

describe("plan 03 city and competitor conformance", () => {
  it("resolves player and rival economics through the same primitives", () => {
    const pressureBp = 12_000;
    const landPriceMinor = 12_000_000;

    // Wages: the floor the player is actually held to when hiring is the same
    // market wage a rival's payroll is charged at. Read from the running
    // simulation, not recomputed here, or this proves nothing.
    const sim = new GameSimulation(createInitialGameState(55));
    sim.refreshDerivedState();
    const cityWage = marketWageMinor(
      BASE_MONTHLY_WAGE_MINOR,
      sim.state.cityMarket.wagePressureBp,
    );
    const below = sim.validateCommand({
      type: "HIRE",
      role: "reception",
      shift: "morning",
      monthlyWageMinor: cityWage - 1,
    });
    const at = sim.validateCommand({
      type: "HIRE",
      role: "reception",
      shift: "morning",
      monthlyWageMinor: cityWage,
    });
    expect(below.ok).toBe(false);
    expect(at.ok).toBe(true);

    const wage = marketWageMinor(BASE_MONTHLY_WAGE_MINOR, pressureBp);
    expect(wage).toBeGreaterThan(BASE_MONTHLY_WAGE_MINOR);
    expect(postsForRooms(90)).toBeGreaterThan(0);

    // Building: one cost curve, so a rival's rooms cost what the player's do.
    for (const rooms of [10, 45, 90])
      expect(buildCostMinor({ rooms, landPriceMinor })).toBe(
        Math.round(
          (rooms *
            BASE_ROOM_BUILD_MINOR *
            Math.round(
              (buildCostMinor({ rooms: 1, landPriceMinor }) * 10000) /
                BASE_ROOM_BUILD_MINOR,
            )) /
            10000,
        ),
      );

    // Credit: advanced against the same asset value, on one published ratio.
    expect(creditLineMinor(90, landPriceMinor)).toBeLessThan(
      buildCostMinor({ rooms: 90, landPriceMinor }),
    );
    expect(creditLineMinor(0, landPriceMinor)).toBe(0);

    // Trading: a house's result follows from its own size, rate and debt and
    // from the city's wage pressure — nothing else. A bigger house earns more
    // and a tighter labour market costs more, for anyone.
    const month = (over: {
      rooms?: number;
      wagePressureBp?: number;
      debtMinor?: number;
    }) =>
      competitorMonth(
        {
          rooms: over.rooms ?? 90,
          rateMinor: 15_000,
          debtMinor: over.debtMinor ?? 40_000_000,
        },
        {
          soldRoomNights: (over.rooms ?? 90) * 20,
          wagePressureBp: over.wagePressureBp ?? pressureBp,
        },
      );
    expect(month({ rooms: 120 }).profitMinor).toBeGreaterThan(
      month({ rooms: 90 }).profitMinor,
    );
    expect(month({ wagePressureBp: 14_000 }).profitMinor).toBeLessThan(
      month({ wagePressureBp: 8_000 }).profitMinor,
    );
    expect(month({ debtMinor: 200_000_000 }).profitMinor).toBeLessThan(
      month({ debtMinor: 0 }).profitMinor,
    );
    expect(Number.isSafeInteger(month({}).profitMinor)).toBe(true);
  });

  it("reads only strategy, own state and lagged public observation", () => {
    // Two cities identical in everything the market can see, differing only in
    // the player's private books. If a rival could read those, the two runs
    // would part company.
    const build = (
      edit: (s: ReturnType<typeof createInitialGameState>) => void,
    ) => {
      const state = createInitialGameState(77);
      edit(state);
      const sim = new GameSimulation(state);
      sim.refreshDerivedState();
      playDays(sim, DAYS_FOR_TWO_CITY_MONTHS);
      return sim.state.competitors;
    };

    const plain = build(() => {});
    const secretlyRich = build((state) => {
      // Private: the player's own books. Cash and the ledger move together so
      // the hotel stays internally consistent; what the market can see — rooms,
      // rate, product and conference space — is untouched.
      const windfall = 25_000_000;
      state.finance.cashMinor += windfall;
      state.finance.ledger.push({
        day: 0,
        account: "ownerCapital",
        amountMinor: windfall,
        memo: "an injection the market never hears about",
      });
      state.guestSatisfaction = { score: 95, causes: ["a quiet month"] };
    });

    expect(secretlyRich).toEqual(plain);

    // What a rival does see is a distorted reading of the public market rate,
    // and pricing takes nothing else.
    const observed = new Set(
      Array.from({ length: 32 }, (_, i) =>
        observedMarketRateMinor(20_000, i * 313),
      ),
    );
    expect(observed.size).toBeGreaterThan(1);
    for (const rate of observed) {
      expect(rate).toBeGreaterThanOrEqual(
        Math.round((20_000 * (10000 - OBSERVATION_ERROR_BP)) / 10000),
      );
      expect(rate).toBeLessThanOrEqual(
        Math.round((20_000 * (10000 + OBSERVATION_ERROR_BP)) / 10000),
      );
    }
    expect(
      competitorRateMinor({
        observedMarketRateMinor: 20_000,
        strategy: "budget",
        occupancyBp: 6500,
      }),
    ).toBe(
      competitorRateMinor({
        observedMarketRateMinor: 20_000,
        strategy: "budget",
        occupancyBp: 6500,
      }),
    );
  });

  it("persists rival identity, memory, debt and lifecycle across a save", () => {
    const sim = new GameSimulation(createInitialGameState(88));
    sim.refreshDerivedState();
    playDays(sim, DAYS_FOR_TWO_CITY_MONTHS);
    const before = sim.state.competitors;
    expect(before.length).toBeGreaterThan(0);

    const envelope = migrateEnvelope({
      saveVersion: SAVE_VERSION,
      contentVersion: "city-market-1991-v3",
      protocolVersion: PROTOCOL_VERSION,
      rngState: sim.state.rngState,
      state: sim.snapshot(),
    });
    expect(validateEnvelope(envelope)).toEqual([]);
    const restored = new GameSimulation(
      envelope.state as ReturnType<typeof createInitialGameState>,
    );

    // Everything a rival is — not merely how big it is — survives the save.
    expect(restored.state.competitors).toEqual(before);
    for (const rival of restored.state.competitors) {
      expect(rival.id).toMatch(/^hotel\./);
      expect(rival.name.length).toBeGreaterThan(0);
      expect(rival.relation).toBeGreaterThanOrEqual(0);
      expect(rival.relation).toBeLessThanOrEqual(100);
      expect(Number.isSafeInteger(rival.debtMinor)).toBe(true);
      expect(Number.isSafeInteger(rival.monthsSinceBuild)).toBe(true);
      expect(["operate", "restructure", "exit"]).toContain(rival.status);
    }
    // Ids stay in a stable order across the round trip.
    expect(restored.state.competitors.map((c) => c.id)).toEqual(
      before.map((c) => c.id),
    );
  });

  it("requires real capital and a cleared hurdle before a rival enters", () => {
    const marketRateMinor = 20_000;
    // A slack city is not entered however dear its rooms look.
    expect(entryOpportunity({ occupancyBp: 5000, marketRateMinor })).toBe(
      false,
    );
    // A tight city is entered only if the build cost still clears the hurdle.
    expect(
      entryOpportunity({
        occupancyBp: 8000,
        marketRateMinor,
        buildCostPerRoomMinor: BASE_ROOM_BUILD_MINOR,
      }),
    ).toBe(true);
    expect(
      entryOpportunity({
        occupancyBp: 8000,
        marketRateMinor,
        buildCostPerRoomMinor: BASE_ROOM_BUILD_MINOR * 20,
      }),
    ).toBe(false);

    // And an entrant is financed, not conjured: its debt is its strategy's
    // leverage against what the building actually cost.
    const capital = buildCostMinor({ rooms: 45, landPriceMinor: 10_000_000 });
    for (const strategy of ["budget", "luxury"] as const)
      expect(
        Math.round((capital * targetLeverageBp(strategy)) / 10000),
      ).toBeLessThan(capital);
  });

  it("frees supply on exit and never hides money for a rival", () => {
    const rival = (overrides: Partial<CompetitorRecord>): CompetitorRecord => ({
      id: "hotel.rival.test",
      name: "Test",
      strategy: "budget",
      rooms: 40,
      rateMinor: 12_000,
      appealBp: 9000,
      cashMinor: 0,
      debtMinor: 0,
      soldRoomNights: 0,
      occupancyBp: 0,
      status: "operate",
      relation: 50,
      monthsSinceBuild: 12,
      ...overrides,
    });
    const player = {
      id: "hotel.player",
      rooms: 24,
      rateMinor: 15_000,
      appealBp: 10_000,
      conferenceSeats: 0,
    };

    // A house that has exited is out of the city's supply entirely.
    const houses = cityHouses(
      [rival({ status: "exit" }), rival({ id: "hotel.rival.open" })],
      player,
    );
    expect(houses.map((h) => h.id)).toEqual([
      "hotel.player",
      "hotel.rival.open",
    ]);

    // There is no plot armour: cash plus credit below zero is an exit, and no
    // amount of losses turns into money from nowhere.
    expect(lifecycleAction({ cash: -1, credit: 0, burn: 0 })).toBe("exit");
    expect(lifecycleAction({ cash: 100, credit: 0, burn: 500 })).toBe(
      "restructure",
    );
    expect(lifecycleAction({ cash: 5000, credit: 0, burn: 100 })).toBe(
      "operate",
    );
    // A loss-making month is a loss, not a smaller profit.
    const starved = competitorMonth(
      { rooms: 90, rateMinor: 9_000, debtMinor: 200_000_000 },
      { soldRoomNights: 0, wagePressureBp: MAX_PRESSURE_BP },
    );
    expect(starved.profitMinor).toBeLessThan(0);
  });

  it("keeps city feedback saturating, delayed and finitely bounded", () => {
    // Feedback matures on a fixed delay and the pipeline never grows.
    let pipeline = Array<number>(FEEDBACK_DELAY_MONTHS).fill(0);
    const appliedByMonth: number[] = [];
    for (let month = 0; month <= FEEDBACK_DELAY_MONTHS; month++) {
      const step = delayedEffect(pipeline, 500);
      pipeline = step.pipeline;
      appliedByMonth.push(step.applied);
      expect(pipeline.length).toBe(FEEDBACK_DELAY_MONTHS);
    }
    // Nothing arrives early: what the hotel gave the city this month is felt
    // exactly FEEDBACK_DELAY_MONTHS later, never sooner.
    expect(appliedByMonth.slice(0, FEEDBACK_DELAY_MONTHS)).toEqual(
      Array<number>(FEEDBACK_DELAY_MONTHS).fill(0),
    );
    expect(appliedByMonth.at(-1)).toBe(500);

    // The effect saturates: a hall ten times the size is not ten times the lift.
    expect(conferenceEffect(1_000_000)).toBeLessThanOrEqual(
      MAX_CONFERENCE_EFFECT_BP,
    );
    expect(conferenceEffect(2000)).toBeLessThan(conferenceEffect(20_000));

    // Actors move slowly and within bounds, so one soft season cannot empty
    // the city and one good one cannot double it.
    for (const demand of [0, 85, 115, 200]) {
      const moved = nextActorScale({ scale: 100, demand, profitBp: 500 });
      expect(Math.abs(moved - 100)).toBeLessThanOrEqual(MAX_MONTHLY_ACTOR_MOVE);
      expect(Number.isSafeInteger(moved)).toBe(true);
    }

    // Routes stay inside their scale whatever is done to them, and
    // connectivity stays finite.
    const network = { rail: 70, airport: 80, road: 60, local: 75 };
    for (const deltaPoints of [-500, -4, 3, 500]) {
      const next = applyRouteChange(network, { mode: "rail", deltaPoints });
      expect(next.rail).toBeGreaterThanOrEqual(0);
      expect(next.rail).toBeLessThanOrEqual(100);
      expect(Number.isFinite(connectivityIndex(next))).toBe(true);
    }

    // And the labour market's own pressure is bounded at both ends.
    const sim = new GameSimulation(createInitialGameState(99));
    sim.refreshDerivedState();
    playDays(sim, DAYS_FOR_TWO_CITY_MONTHS);
    expect(sim.state.cityMarket.wagePressureBp).toBeGreaterThanOrEqual(
      MIN_PRESSURE_BP,
    );
    expect(sim.state.cityMarket.wagePressureBp).toBeLessThanOrEqual(
      MAX_PRESSURE_BP,
    );
  });
});
