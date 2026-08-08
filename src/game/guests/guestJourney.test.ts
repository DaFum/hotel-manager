import { describe, expect, it } from "vitest";
import { assignRoom, processReceptionQueue, checkOut } from "./guestJourney";

describe("front office", () => {
  it("assigns the lowest stable clean room of requested category", () => {
    expect(
      assignRoom(
        [
          { id: "room.102", category: "single", state: "VacantClean" },
          { id: "room.101", category: "single", state: "VacantClean" },
        ],
        "single",
      )?.id,
    ).toBe("room.101");
  });

  it("never assigns a dirty, occupied, or wrong category room", () => {
    expect(
      assignRoom(
        [
          { id: "room.101", category: "single", state: "VacantDirty" },
          { id: "room.102", category: "single", state: "Occupied" },
          { id: "room.201", category: "double", state: "VacantClean" },
        ],
        "single",
      ),
    ).toBeNull();
  });

  it("processes no more parties than staff throughput", () => {
    expect(processReceptionQueue(["p1", "p2", "p3"], 2)).toEqual({
      processed: ["p1", "p2"],
      remaining: ["p3"],
    });
  });

  it("leaves the whole queue waiting when reception is unstaffed", () => {
    expect(processReceptionQueue(["p1", "p2"], 0)).toEqual({
      processed: [],
      remaining: ["p1", "p2"],
    });
  });

  it("returns a checked out room to the dirty pool", () => {
    expect(
      checkOut({ id: "room.101", category: "single", state: "Occupied" }).state,
    ).toBe("VacantDirty");
  });

  it("checks out only occupied rooms", () => {
    expect(() =>
      checkOut({ id: "room.101", category: "single", state: "VacantClean" }),
    ).toThrow(/occupied/);
  });
});
