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
    const descriptors = s.renderDescriptors as typeof s.renderDescriptors & {
      positionByEntityId?: Record<
        string,
        { floor: number; gridX: number; gridY: number }
      >;
    };

    expect(descriptors.positionByEntityId).toBeTruthy();
    expect(descriptors.positionByEntityId?.[s.hotel.rooms[0].id]).toEqual({
      floor: 1,
      gridX: 0,
      gridY: 0,
    });
    expect(descriptors.positionByEntityId?.["facility.housekeeping"]).toEqual(
      expect.objectContaining({ floor: 0 }),
    );
    expect(
      descriptors.positionByEntityId?.["navigation.reception.queue"],
    ).toEqual(expect.objectContaining({ floor: 0 }));
    expect(s.renderDescriptors.renovationPhaseByRoomId).toEqual({});
    expect(s.renderDescriptors.occupantByRoomId).toEqual({});
  });
});
