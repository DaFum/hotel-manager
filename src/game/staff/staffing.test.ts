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

  it("rejects wages that are not positive whole Pfennig", () => {
    const applicant = { id: "a1", role: "reception", skill: 70 };
    for (const wage of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 2])
      expect(() =>
        hireApplicant(applicant, { shift: "morning", monthlyWageMinor: wage }),
      ).toThrow(/wage/);
  });

  it("rejects negative or non finite skill", () => {
    expect(() =>
      hireApplicant(
        { id: "a1", role: "reception", skill: -1 },
        { shift: "morning", monthlyWageMinor: 220000 },
      ),
    ).toThrow(/skill/);
    expect(() =>
      effectiveCapacity([{ skill: Number.NaN, absent: false }]),
    ).toThrow(/skill/);
  });

  it("refuses an offer below what the city market pays", () => {
    const applicant = { id: "a1", role: "reception", skill: 70 };
    expect(() =>
      hireApplicant(applicant, {
        shift: "morning",
        monthlyWageMinor: 220000,
        marketWageMinor: 260000,
      }),
    ).toThrow(/market/);
    // At or above the going rate the applicant signs.
    expect(
      hireApplicant(applicant, {
        shift: "morning",
        monthlyWageMinor: 260000,
        marketWageMinor: 260000,
      }).monthlyWageMinor,
    ).toBe(260000);
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
