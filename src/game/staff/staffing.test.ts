import { describe, expect, it } from "vitest";
import { hireApplicant, effectiveCapacity } from "./staffing";

describe("staffing", () => {
  it("hires an applicant into an explicit shift", () => {
    expect(
      hireApplicant(
        { id: "a1", role: "reception", skill: 70 },
        { shift: "morning", monthlyWageMinor: 220000 },
      ).shift,
    ).toBe("morning");
  });

  it("removes absent staff from throughput", () => {
    expect(
      effectiveCapacity([
        { skill: 70, absent: true },
        { skill: 50, absent: false },
      ]),
    ).toBe(50);
  });
});
