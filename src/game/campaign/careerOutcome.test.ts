import { describe, expect, it } from "vitest";
import { assessCareerOutcome, restartCareer } from "./careerOutcome";
describe("career outcomes", () => {
  it("offers recovery before closure and endless play after 2026", () => {
    const s = assessCareerOutcome({
      cashMinor: -1,
      hotelCount: 1,
      year: 2026,
      creditAvailable: false,
    });
    expect(s.distress).toBe("recoverable");
    expect(s.availableRecoveryPaths).toContain("restructure");
    expect(s.continueEndless).toBe(true);
    expect(restartCareer().dateKey).toBe("1991-01-01");
  });
});
