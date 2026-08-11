import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./initialState";
describe("initial state", () => {
  it("starts Frankfurt 1991 with 24 rooms and 400000 DM cash", () => {
    const s = createInitialGameState(1234);
    expect(s.calendar.dateKey).toBe("1991-01-01");
    expect(s.hotel.rooms).toHaveLength(24);
    expect(s.finance.cashMinor).toBe(40_000_000);
    expect([...Object.keys(s.rngState)].sort()).toEqual([
      "AI",
      "economy",
      "events",
      "failures",
      "guests",
      "narrative",
      "staffing",
      "weather",
    ]);
  });

  it("publishes a stable grid position for every room and focusable hotel area", () => {
    const s = createInitialGameState(1234);
    const repeated = createInitialGameState(1234);
    const descriptors = s.renderDescriptors;
    const expectedIds = new Set([
      ...Object.keys(descriptors.floorPlan.rooms),
      ...descriptors.floorPlan.areas.map((area) => area.id),
      ...descriptors.floorPlan.navigationNodes.map((node) => node.id),
      "facility.elevator",
      "asset.lift",
    ]);

    expect(new Set(Object.keys(descriptors.positionByEntityId))).toEqual(
      expectedIds,
    );
    for (const entity of [
      ...Object.values(descriptors.floorPlan.rooms),
      ...descriptors.floorPlan.areas,
      ...descriptors.floorPlan.navigationNodes,
    ])
      expect(descriptors.positionByEntityId[entity.id]).toEqual({
        floor: entity.floor,
        gridX: entity.gridX,
        gridY: entity.gridY,
      });
    expect(repeated.renderDescriptors.positionByEntityId).toEqual(
      descriptors.positionByEntityId,
    );
    expect(s.renderDescriptors.renovationPhaseByRoomId).toEqual({});
    expect(s.renderDescriptors.occupantByRoomId).toEqual({});
  });
});
