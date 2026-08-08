import { describe, expect, it } from "vitest";
import { complaintForWait, resolveComplaint } from "./complaints";

describe("complaints", () => {
  it("creates long checkin complaint after twenty minutes", () => {
    expect(complaintForWait("p1", 21)?.cause).toBe("longCheckIn");
    expect(complaintForWait("p1", 20)).toBeNull();
  });

  it("apology recovery is free and lifts satisfaction slightly", () => {
    expect(
      resolveComplaint(
        { cause: "longCheckIn", satisfaction: 50 },
        "apologize",
        10000,
      ),
    ).toEqual({ expenseMinor: 0, satisfaction: 55 });
  });

  it("discount recovery costs ten percent of room charge and improves satisfaction", () => {
    expect(
      resolveComplaint(
        { cause: "longCheckIn", satisfaction: 50 },
        "discount10",
        10000,
      ),
    ).toEqual({ expenseMinor: 1000, satisfaction: 65 });
  });

  it("never pushes satisfaction above the scale maximum", () => {
    expect(
      resolveComplaint(
        { cause: "longCheckIn", satisfaction: 95 },
        "discount10",
        10000,
      ).satisfaction,
    ).toBe(100);
  });
});
