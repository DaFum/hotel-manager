import { describe, expect, it } from "vitest";
import {
  advanceRenovation,
  isRenovationComplete,
  renovationBlockedRooms,
  startRenovation,
  RENOVATION_MINUTES,
} from "./renovations";

function runFor(minutes: number) {
  let job = startRenovation("module.free.1", 10_000_000).job;
  let roomsAdded = 0;
  for (let elapsed = 0; elapsed < minutes; elapsed += 60) {
    const step = advanceRenovation(job, 60);
    roomsAdded += step.roomsAdded;
    job = step.job;
  }
  return { job, roomsAdded };
}

describe("renovations", () => {
  it("charges 60000 DM up front", () => {
    expect(startRenovation("module.free.1", 10_000_000).cashMinor).toBe(
      4_000_000,
    );
  });

  it("opens two rooms only after the full lifecycle is signed off", () => {
    expect(runFor(RENOVATION_MINUTES - 60).roomsAdded).toBe(0);
    expect(runFor(RENOVATION_MINUTES).roomsAdded).toBe(2);
  });

  it("marks the job completed only once the handover finishes", () => {
    expect(isRenovationComplete(runFor(RENOVATION_MINUTES - 60).job)).toBe(
      false,
    );
    expect(isRenovationComplete(runFor(RENOVATION_MINUTES).job)).toBe(true);
  });

  it("adds the rooms only once for a completed job", () => {
    const done = runFor(RENOVATION_MINUTES);
    expect(done.roomsAdded).toBe(2);
    expect(advanceRenovation(done.job, 5000).roomsAdded).toBe(0);
  });

  it("holds converted rooms out of order while the site is live", () => {
    const job = startRenovation("module.101", 10_000_000, {
      targetModuleId: "room.comfort.double",
      affected: ["room.101"],
    }).job;
    // Planning is paperwork; the room still sells.
    expect(renovationBlockedRooms(job)).toEqual([]);
    const building = advanceRenovation(job, 5 * 1440).job;
    expect(renovationBlockedRooms(building)).toEqual(["room.101"]);
  });

  it("refuses to start without the full cash cost", () => {
    expect(() => startRenovation("module.free.1", 5_999_999)).toThrow(/cash/);
  });
});
