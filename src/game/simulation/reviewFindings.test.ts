import { describe, expect, it } from "vitest";
import { GameSimulation } from "./GameSimulation";
import { createInitialGameState, type GameState } from "./initialState";
import { QUANTUM_MINUTES } from "./clock";
import { MINUTES_PER_DAY } from "../domain/calendar";
import {
  EXPANSION_SQM,
  expansionCostMinor,
  specializationBonusBp,
} from "../classification/specialization";
import { SERVICE_INTERVAL_MINUTES } from "../engineering/policy";

const QUANTA_PER_DAY = MINUTES_PER_DAY / QUANTUM_MINUTES;

function runQuanta(sim: GameSimulation, n: number) {
  for (let i = 0; i < n; i++) sim.advanceQuantum();
}

function stateWith(mutate: (s: GameState) => void): GameSimulation {
  const state = createInitialGameState(424242);
  mutate(state);
  return new GameSimulation(state);
}

describe("review findings", () => {
  it("takes a conference block out of one category only", () => {
    const sim = stateWith((s) => {
      s.events.push({
        id: "event.block",
        guests: 40,
        nights: 2,
        roomsBlocked: 6,
        blockedCategory: "double",
        startDateKey: s.calendar.dateKey,
        valueMinor: 100_000,
        status: "confirmed",
      });
    });
    const s = sim.state;
    const singles = s.hotel.rooms.filter((r) => r.category === "single").length;
    const doubles = s.hotel.rooms.filter((r) => r.category === "double").length;

    // The block belongs to doubles; singles must be untouched by it.
    const available = (category: string) =>
      (
        sim as unknown as {
          availableRooms: (d: string, c: string) => number;
        }
      ).availableRooms(s.calendar.dateKey, category);
    expect(available("single")).toBe(singles);
    expect(available("double")).toBe(doubles - 6);
  });

  it("spends a technician's shift once, not once per asset", () => {
    const sim = stateWith((s) => {
      // Both plant items fall due on the same day, with one technician on.
      for (const asset of s.assets)
        asset.minutesSinceService = SERVICE_INTERVAL_MINUTES;
      s.staff = s.staff.filter((m) => m.role !== "technician");
      s.staff.push({
        id: "staff.technician.1",
        role: "technician",
        shift: "morning",
        skill: 60,
        monthlyWageMinor: 290_000,
        absent: false,
      });
    });
    runQuanta(sim, QUANTA_PER_DAY + 1);
    const serviced = sim.state.assets.filter(
      (a) => (a.minutesSinceService ?? 0) < SERVICE_INTERVAL_MINUTES,
    );
    // One technician contributes 240 minutes and a service takes 180, so only
    // one of the two assets can be serviced that day.
    expect(serviced).toHaveLength(1);
  });

  it("ages every room's fit-out on the calendar year rollover", () => {
    const sim = stateWith((s) => {
      s.calendar = { dateKey: "1991-12-31", minuteOfDay: 1380 };
    });
    const before = sim.state.hotel.rooms[0].styleAgeYears;
    runQuanta(sim, QUANTA_PER_DAY);
    expect(sim.state.calendar.dateKey.slice(0, 4)).toBe("1992");
    expect(
      sim.state.hotel.rooms.every((r) => r.styleAgeYears === before + 1),
    ).toBe(true);
  });

  it("works conference housekeeping off the same shift the rooms use", () => {
    const sim = stateWith((s) => {
      s.calendar = { dateKey: s.calendar.dateKey, minuteOfDay: 835 };
      s.events.push({
        id: "event.load",
        guests: 120,
        nights: 1,
        roomsBlocked: 20,
        blockedCategory: "double",
        startDateKey: s.calendar.dateKey,
        valueMinor: 500_000,
        status: "confirmed",
      });
    });
    runQuanta(sim, 2);
    const s = sim.state;
    // The load was booked as real work and the shift has started on it.
    expect(
      s.eventHousekeepingMinutes + s.eventHousekeepingWorkedMinutes,
    ).toBeGreaterThan(0);
    expect(s.eventHousekeepingWorkedMinutes).toBeGreaterThan(0);
    // Labour spent on the hall is no longer available for room turnaround.
    expect(s.housekeepingMinutes).toBe(0);
  });

  it("pays a specialization only after the space is actually built", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    sim.queueCommand({
      type: "SET_SPECIALIZATION",
      specializationId: "spec.conference",
    });
    sim.applyPendingCommands();
    expect(
      specializationBonusBp("spec.conference", sim.state.investedArea),
    ).toBe(0);

    const cashBefore = sim.state.finance.cashMinor;
    const startingSqm = sim.state.investedArea.conferenceSqm;
    for (let i = 0; i < 2; i++) {
      sim.queueCommand({ type: "EXPAND_FACILITY", area: "conferenceSqm" });
      sim.applyPendingCommands();
    }
    expect(sim.state.investedArea.conferenceSqm).toBe(
      startingSqm + 2 * EXPANSION_SQM,
    );
    expect(cashBefore - sim.state.finance.cashMinor).toBe(
      2 * expansionCostMinor(),
    );
    expect(
      specializationBonusBp("spec.conference", sim.state.investedArea),
    ).toBeGreaterThan(0);
  });

  it("rejects an expansion the hotel cannot pay for", () => {
    const sim = stateWith((s) => {
      s.finance.cashMinor = 1000;
    });
    const verdict = sim.validateCommand({
      type: "EXPAND_FACILITY",
      area: "wellnessSqm",
    });
    expect(verdict).toEqual({ ok: false, reason: "insufficient cash" });
  });
});
