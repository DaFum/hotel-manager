import { describe, expect, it } from "vitest";
import { startRenovation, completeRenovation } from "./renovations";

describe("renovations", () => {
  it("charges 60000 DM and completes two rooms after three days", () => {
    const j = startRenovation("module.free.1", 0, 10_000_000);
    expect(j.cashMinor).toBe(4_000_000);
    expect(completeRenovation(j.job, 4319).roomsAdded).toBe(0);
    expect(completeRenovation(j.job, 4320).roomsAdded).toBe(2);
  });

  it("marks the job completed only once the build finishes", () => {
    const j = startRenovation("module.free.1", 0, 10_000_000);
    expect(completeRenovation(j.job, 4319).job.status).toBe("active");
    expect(completeRenovation(j.job, 4320).job.status).toBe("completed");
  });

  it("refuses to start without the full cash cost", () => {
    expect(() => startRenovation("module.free.1", 0, 5_999_999)).toThrow(
      /cash/,
    );
  });
});
