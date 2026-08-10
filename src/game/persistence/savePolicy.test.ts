import { describe, expect, it } from "vitest";
import {
  autosaveReason,
  autosaveSlot,
  describeSlot,
  isMajorAction,
  manualSlot,
  orderSlots,
  recoverySlot,
} from "./savePolicy";
import { migrateEnvelope, validateEnvelope } from "./saveSchema";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "./saveVersions";
import { PROTOCOL_VERSION } from "../domain/protocol";
import { createInitialGameState } from "../simulation/initialState";
import v1 from "./fixtures/save-v1.json";
import v2 from "./fixtures/save-v2.json";
import { DEFAULT_PLAYER_PREFERENCES } from "../settings/playerPreferences";

const state = createInitialGameState(12);
const current: SaveEnvelope = {
  saveVersion: SAVE_VERSION,
  contentVersion: CONTENT_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  rngState: state.rngState,
  state,
  preferences: DEFAULT_PLAYER_PREFERENCES,
};

describe("save policy", () => {
  it("keeps manual slots independent and deterministically ordered", () => {
    const ids = [
      recoverySlot(1),
      manualSlot("before the refit"),
      autosaveSlot("month"),
      manualSlot("a fresh start"),
      recoverySlot(0),
    ];

    const ordered = orderSlots(ids);
    expect(ordered.map((s) => s.kind)).toEqual([
      "manual",
      "manual",
      "autosave",
      "recovery",
      "recovery",
    ]);
    // The player's own saves keep their own names and never collide with the
    // game's, and the order is a pure function of the ids: no wall clock.
    expect(ordered.slice(0, 2).map((s) => s.label)).toEqual([
      "a fresh start",
      "before the refit",
    ]);
    expect(orderSlots([...ids].reverse())).toEqual(ordered);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names every kind of slot and refuses one it does not recognise", () => {
    expect(describeSlot(manualSlot("holiday"))).toEqual({
      id: "manual:holiday",
      kind: "manual",
      label: "holiday",
    });
    expect(describeSlot(autosaveSlot("year")).kind).toBe("autosave");
    expect(describeSlot(recoverySlot(2)).label).toBe("2");
    expect(() => describeSlot("slot-1")).toThrow(/unrecognised/);
    expect(() => manualSlot("  ")).toThrow(/name/);
  });

  it("ignores foreign slot ids while retaining every recognized slot", () => {
    expect(
      orderSlots(["foreign-slot", recoverySlot(0), manualSlot("kept")]).map(
        (slot) => slot.id,
      ),
    ).toEqual([manualSlot("kept"), recoverySlot(0)]);
  });

  it("schedules monthly, yearly and pre-major-action autosaves", () => {
    const at = (dateKey: string) => ({ dateKey, minuteOfDay: 0 });

    // Inside a day, and inside a month, nothing is written.
    expect(autosaveReason(at("1991-03-14"), at("1991-03-14"))).toBeNull();
    expect(autosaveReason(at("1991-03-14"), at("1991-03-15"))).toBeNull();
    expect(autosaveReason(at("1991-03-31"), at("1991-04-01"))).toBe("month");
    // A year roll is a year, not merely another month.
    expect(autosaveReason(at("1991-12-31"), at("1992-01-01"))).toBe("year");

    expect(isMajorAction("START_RENOVATION")).toBe(true);
    expect(isMajorAction("EXPAND_FACILITY")).toBe(true);
    // Anything the player can undo by issuing the opposite command is not
    // worth a save of its own.
    expect(isMajorAction("SET_RATE")).toBe(false);
    expect(isMajorAction("BUY_MARKET_RESEARCH")).toBe(false);
  });

  it("round-trips every fixture version through the migration chain", () => {
    for (const [label, fixture] of [
      ["v1", v1],
      ["v2", v2],
      ["v3", current],
    ] as const) {
      const migrated = migrateEnvelope(fixture as unknown as SaveEnvelope);
      expect(migrated.saveVersion, label).toBe(SAVE_VERSION);
      expect(migrated.protocolVersion, label).toBe(2);
      expect(validateEnvelope(migrated), label).toEqual([]);

      const state = migrated.state as ReturnType<typeof createInitialGameState>;
      // Everything authoritative survives the chain: the calendar, the money,
      // the ids, the rooms, the city and its rivals, and every RNG stream.
      expect(state.calendar.dateKey, label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isSafeInteger(state.finance.cashMinor), label).toBe(true);
      expect(state.hotel.rooms.length, label).toBeGreaterThan(0);
      expect(new Set(state.hotel.rooms.map((r) => r.id)).size, label).toBe(
        state.hotel.rooms.length,
      );
      expect(state.cityMarket, label).toBeTruthy();
      expect(Array.isArray(state.competitors), label).toBe(true);
      expect(state.rngState, label).toEqual(migrated.rngState);

      // Migration is idempotent: a save already at this version is left alone.
      expect(migrateEnvelope(migrated), label).toEqual(migrated);
    }
  });

  it("reports malformed room and stay collections without throwing", () => {
    const malformed = structuredClone(current) as unknown as {
      state: { hotel: { rooms: unknown }; stays: unknown };
    };
    malformed.state.hotel.rooms = {};
    malformed.state.stays = {};
    expect(() =>
      validateEnvelope(malformed as unknown as SaveEnvelope),
    ).not.toThrow();
    expect(validateEnvelope(malformed as unknown as SaveEnvelope)).toEqual(
      expect.arrayContaining([
        "the state has no hotel",
        "the state has no stays",
      ]),
    );
  });

  it("reports null stay entries without throwing", () => {
    const malformed = structuredClone(current) as unknown as {
      state: { stays: unknown[] };
    };
    malformed.state.stays = [null];
    expect(() =>
      validateEnvelope(malformed as unknown as SaveEnvelope),
    ).not.toThrow();
    expect(validateEnvelope(malformed as unknown as SaveEnvelope)).toContain(
      "the state has a malformed stay",
    );
  });

  it("rejects a non-integer persisted hotel treasury balance", () => {
    const malformed = structuredClone(current) as SaveEnvelope & {
      state: ReturnType<typeof createInitialGameState>;
    };
    malformed.state.company.treasury.hotelCashMinor[malformed.state.hotel.id] =
      1.5;
    expect(validateEnvelope(malformed)).toContain(
      "the state has no complete Plan 05 company",
    );
  });
});
