import { describe, expect, it } from "vitest";
import {
  aggregateRoomState,
  renovationVisualFor,
  roomLighting,
  roomLodFor,
} from "./roomVisuals";

describe("room presentation", () => {
  it("lights occupied rooms after dark without lighting empty rooms", () => {
    expect(roomLighting("Occupied", 60)).toMatchObject({
      period: "night",
      lit: true,
    });
    expect(roomLighting("VacantClean", 60)).toMatchObject({
      period: "night",
      lit: false,
    });
    expect(roomLighting("Occupied", 720).lit).toBe(false);
  });

  it("adds room and fine status detail at the declared zoom tiers", () => {
    expect(roomLodFor(0.5)).toEqual({
      tier: "aggregate",
      drawFloorStructure: true,
      drawRoomTiles: false,
      drawFineStatus: false,
    });
    expect(roomLodFor(1)).toMatchObject({
      tier: "rooms",
      drawRoomTiles: true,
      drawFineStatus: false,
    });
    expect(roomLodFor(2)).toMatchObject({
      tier: "people",
      drawRoomTiles: true,
      drawFineStatus: true,
    });
  });

  it("assigns a distinct architectural notation to every active phase", () => {
    const visuals = [
      "planning",
      "approval",
      "construction",
      "acceptance",
      "complete",
    ].map((phase) => renovationVisualFor(phase as never));

    expect(new Set(visuals.map((visual) => visual.notation)).size).toBe(5);
  });

  it("keeps the most urgent room state on an aggregate floor", () => {
    expect(aggregateRoomState(["VacantClean", "Occupied", "OutOfOrder"])).toBe(
      "OutOfOrder",
    );
    expect(aggregateRoomState(["VacantClean", "VacantDirty"])).toBe(
      "VacantDirty",
    );
    expect(aggregateRoomState(["Reserved", "Occupied"])).toBe("Occupied");
    expect(aggregateRoomState(["Occupied", "Reserved"])).toBe("Occupied");
  });
});
