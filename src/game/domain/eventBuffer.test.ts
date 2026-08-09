import { describe, expect, it } from "vitest";
import {
  PENDING_EVENT_LIMIT,
  createEventJournal,
  drainEvents,
  emitEvent,
} from "./eventBuffer";
import {
  AWAITING_TRANSITION,
  DOMAIN_EVENT_TYPES,
  type DomainEvent,
  type DomainEventType,
} from "./events";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { commandEnvelope, type GameCommand } from "../commands/commandEnvelope";
import { QUANTUM_MINUTES } from "../simulation/clock";
import type { RoomCategory } from "../revenue/rates";
import { XorShift32 } from "./rng";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

function sim(seed = 11): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  s.takeDomainEvents();
  return s;
}

let counter = 0;
function submit(s: GameSimulation, payload: GameCommand) {
  counter += 1;
  return s.submitCommands([
    commandEnvelope({
      commandId: `evt.cmd.${counter}`,
      issuedAtMinutes: s.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ])[0];
}

/**
 * Runs a real game and collects everything it published on the way. Nothing is
 * drained first: the very first derivation of the star rating and the facility
 * board are real transitions and count as such.
 */
function playAndCollect(seed: number, days: number): DomainEvent[] {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  const collected: DomainEvent[] = [];
  const actions: GameCommand[] = [
    { type: "SET_SPECIALIZATION", specializationId: "spec.conference" },
    { type: "EXPAND_FACILITY", area: "conferenceSqm" },
    { type: "BUY_MARKET_RESEARCH" },
    { type: "START_RENOVATION" },
    {
      type: "HIRE",
      role: "housekeeping",
      shift: "morning",
      monthlyWageMinor: 400_000,
    },
  ];
  for (const action of actions) submit(s, action);
  collected.push(...s.takeDomainEvents());

  for (let day = 0; day < days; day++) {
    for (let q = 0; q < QUANTA_PER_DAY; q++) s.advanceQuantum();
    collected.push(...s.takeDomainEvents());
  }
  return collected;
}

/**
 * The first stream state from which `draws` untouched draws are taken and the
 * next one lands under `thresholdBp`. Used to put the world into the month
 * where a rare transition actually happens, instead of waiting years of
 * simulated time for the same draw to come up on its own.
 */
function stateForRoll(draws: number, thresholdBp: number, from = 1): number {
  for (let candidate = from; candidate < from + 500_000; candidate++) {
    const stream = new XorShift32(candidate);
    for (let i = 0; i < draws; i++) stream.nextUint32();
    if (stream.nextUint32() % 10000 < thresholdBp) return candidate;
  }
  throw new Error("no stream state produced the wanted roll");
}

/** Days from 1 January to the first city month settlement, plus a margin. */
const DAYS_TO_FIRST_CITY_MONTH = 33;

function runDays(s: GameSimulation, days: number): DomainEvent[] {
  const collected: DomainEvent[] = [];
  for (let day = 0; day < days; day++) {
    for (let q = 0; q < QUANTA_PER_DAY; q++) s.advanceQuantum();
    collected.push(...s.takeDomainEvents());
  }
  return collected;
}

/** A house whose plant is already worn out and fails on the first roll. */
function wornPlantScenario(): DomainEvent[] {
  const state = createInitialGameState(3);
  state.assets = state.assets.map((a) => ({
    ...a,
    condition: 1000,
    minutesSinceService: 0,
  }));
  // The failures stream is drawn once per wearing asset per day; this puts the
  // very first draw inside the daily failure chance.
  state.rngState = { ...state.rngState, failures: stateForRoll(0, 50) };
  const s = new GameSimulation(state);
  s.refreshDerivedState();
  // Long enough for the breakdown, the technician's repair, and the service
  // interval that follows it.
  return runDays(s, 40);
}

/** A rival with no cash and no borrowing capacity left; it must not survive. */
function distressedRivalScenario(): DomainEvent[] {
  const state = createInitialGameState(5);
  state.competitors = state.competitors.map((c) => ({
    ...c,
    cashMinor: -500_000_000,
    debtMinor: 900_000_000,
  }));
  const s = new GameSimulation(state);
  s.refreshDerivedState();
  return runDays(s, DAYS_TO_FIRST_CITY_MONTH);
}

/**
 * A morning when the whole house arrives at once behind a single receptionist:
 * the queue outlasts the guests' patience, and the desk is staffed enough to
 * put it right.
 */
function busyReceptionScenario(): DomainEvent[] {
  const state = createInitialGameState(7);
  state.staff = state.staff.filter(
    (m) => m.role !== "reception" || m.id === "staff.reception.1",
  );
  state.reservations = state.hotel.rooms.slice(0, 20).map((room, i) => ({
    id: `booking.wave.${i}`,
    roomsRequested: 1,
    rateMinor: 15_000,
    status: "confirmed" as const,
    channel: "walkIn" as const,
    partySize: 2,
    segmentId: "segment.leisure",
    category: room.category as RoomCategory,
    arrivalDateKey: state.calendar.dateKey,
    nights: 1,
    // Guaranteed, so every one of them turns up and the queue is real.
    terms: { guaranteed: true, freeCancellationDays: 1, lateChargeBp: 10000 },
    history: [{ status: "confirmed" as const, atMinutes: 0 }],
    bookingDateKey: state.calendar.dateKey,
    ratePlanId: "flexible",
    commissionBp: 0,
    depositMinor: 0,
    specialRequirements: [],
  }));
  const s = new GameSimulation(state);
  s.refreshDerivedState();
  return runDays(s, 2);
}

/** A month in which the city's transport network actually changes. */
function routeChangeScenario(): DomainEvent[] {
  const state = createInitialGameState(9);
  // advanceCityMonth draws once per city actor before it decides whether a
  // route changed, so the route roll is the draw after those.
  state.rngState = {
    ...state.rngState,
    economy: stateForRoll(state.cityMarket.actors.length, 200),
  };
  const s = new GameSimulation(state);
  s.refreshDerivedState();
  return runDays(s, DAYS_TO_FIRST_CITY_MONTH);
}

function technologyAdoptionScenario(): DomainEvent[] {
  const s = sim(13);
  expect(
    submit(s, { type: "ADOPT_TECHNOLOGY", technologyId: "personal-computer" })
      .status,
  ).toBe("accepted");
  const collected = s.takeDomainEvents();
  s.state.technologyProjects[0].remainingMonths = 1;
  collected.push(...runDays(s, DAYS_TO_FIRST_CITY_MONTH));
  return collected;
}

describe("domain event buffer", () => {
  it("stamps every event with a stable id, game time and entities", () => {
    const journal = createEventJournal();
    const event = emitEvent(
      journal,
      { type: "ASSET_FAILED", assetId: "asset.boiler" },
      { atMinutes: 4320, entities: ["asset.boiler"] },
    );

    expect(event.eventId).toBe("evt.1");
    expect(event.sequence).toBe(1);
    expect(event.atMinutes).toBe(4320);
    expect(event.entities).toEqual(["asset.boiler"]);
    // An uncaused fact says so by omission rather than by a null cause.
    expect("causedBy" in event).toBe(false);
  });

  it("carries the causing command id on every command-caused event", () => {
    const s = sim();
    const result = submit(s, {
      type: "HIRE",
      role: "reception",
      shift: "evening",
      monthlyWageMinor: 400_000,
    });
    const events = s.takeDomainEvents();
    const hired = events.find((e) => e.payload.type === "STAFF_HIRED");

    expect(result.status).toBe("accepted");
    expect(hired?.causedBy).toBe(result.commandId);
    expect(hired?.entities.length).toBeGreaterThan(0);
  });

  it("emits no success event for a rejected command", () => {
    const s = sim();
    const result = submit(s, {
      type: "SET_SPECIALIZATION",
      specializationId: "spec.that.does.not.exist",
    });

    expect(result.status).toBe("rejected");
    expect(s.takeDomainEvents()).toEqual([]);
  });

  it("takes a rolled-back command's events down with it", () => {
    const s = sim();
    const sequenceBefore = s.state.eventJournal.sequence;
    // Below the supplier's minimum: the command fails inside apply, after the
    // draft it was writing to had already been touched.
    const result = submit(s, {
      type: "ORDER_SUPPLIES",
      sku: "cleaning-unit",
      quantity: 1,
    });

    expect(result.status).toBe("rejected");
    expect(s.takeDomainEvents()).toEqual([]);
    expect(s.state.eventJournal.sequence).toBe(sequenceBefore);
  });

  it("drains events in emission order with monotonic sequence numbers", () => {
    const journal = createEventJournal();
    for (let i = 0; i < 5; i++)
      emitEvent(
        journal,
        { type: "ROOM_STATE_CHANGED", roomId: `room.${i}`, from: "a", to: "b" },
        { atMinutes: i * 5, entities: [`room.${i}`] },
      );

    const first = drainEvents(journal);
    expect(first.map((e) => e.sequence)).toEqual([1, 2, 3, 4, 5]);
    // Draining hands each event over exactly once.
    expect(drainEvents(journal)).toEqual([]);

    emitEvent(
      journal,
      { type: "ASSET_REPAIRED", assetId: "asset.lift" },
      { atMinutes: 100, entities: ["asset.lift"] },
    );
    expect(drainEvents(journal)[0].sequence).toBe(6);
  });

  it("bounds an undrained journal and counts what it dropped", () => {
    const journal = createEventJournal();
    const total = PENDING_EVENT_LIMIT + 10;
    for (let i = 0; i < total; i++)
      emitEvent(
        journal,
        { type: "ASSET_REPAIRED", assetId: `asset.${i}` },
        { atMinutes: i, entities: [`asset.${i}`] },
      );

    expect(journal.pending.length).toBe(PENDING_EVENT_LIMIT);
    expect(journal.dropped).toBe(10);
    // The sequence still counts every fact, so a gap is visible rather than
    // being silently papered over.
    expect(journal.pending.at(-1)?.sequence).toBe(total);
    expect(journal.pending[0].sequence).toBe(11);
  });

  it("publishes an event for every declared simulation transition", () => {
    const seen = new Set<DomainEventType>();
    const record = (events: readonly DomainEvent[]) => {
      for (const event of events) seen.add(event.payload.type);
    };

    // Ordinary trading covers everything a working hotel does in a quarter.
    record(playAndCollect(11, 95));
    // The rest are rare by design, so the world is put into the state where
    // each of them actually happens rather than waited out.
    record(busyReceptionScenario());
    record(wornPlantScenario());
    record(distressedRivalScenario());
    record(routeChangeScenario());
    record(technologyAdoptionScenario());

    const missing = DOMAIN_EVENT_TYPES.filter((type) => !seen.has(type));
    expect(missing).toEqual([]);
    // A payload with no reachable transition must not be listed as covered,
    // so this list cannot be used to hide an unpublished one.
    for (const type of AWAITING_TRANSITION)
      expect(DOMAIN_EVENT_TYPES).not.toContain(type);
  });
});
