import { describe, expect, it } from "vitest";
import {
  assessCareerOutcome,
  chooseEndlessContinuation,
  restartCareer,
  type CareerFacts,
} from "./careerOutcome";

const facts = (over: Partial<CareerFacts> = {}): CareerFacts => ({
  netLiquidityMinor: -1,
  creditHeadroomMinor: 0,
  sellableHotelCount: 1,
  reducibleStaffCount: 0,
  year: 2026,
  ...over,
});

describe("career outcomes", () => {
  it("offers recovery before closure and endless play after 2026", () => {
    const s = assessCareerOutcome(facts());
    expect(s.distress).toBe("recoverable");
    expect(s.availableRecoveryPaths).toContain("sell-hotel");
    expect(s.careerMilestone2026).toBe(true);
    expect(restartCareer().dateKey).toBe("1991-01-01");
  });

  it("offers exactly the measures the company still has", () => {
    expect(
      assessCareerOutcome(
        facts({
          creditHeadroomMinor: 500_000,
          sellableHotelCount: 0,
          reducibleStaffCount: 3,
        }),
      ).availableRecoveryPaths,
    ).toEqual(["refinance", "staff-reduction"]);
  });

  it("closes the company only when no measure is left", () => {
    const done = assessCareerOutcome(facts({ sellableHotelCount: 0 }));
    expect(done.distress).toBe("terminal");
    expect(done.ended).toBe(true);
    expect(done.availableRecoveryPaths).toEqual([]);
    // Solvent is solvent, however thin the rest of the position is.
    expect(
      assessCareerOutcome(
        facts({ netLiquidityMinor: 0, sellableHotelCount: 0 }),
      ).distress,
    ).toBe("healthy");
  });

  it("keeps playing after a terminal reading is continued", () => {
    const terminal = assessCareerOutcome(facts({ sellableHotelCount: 0 }));
    expect(terminal.ended).toBe(true);
    expect(chooseEndlessContinuation(terminal).ended).toBe(false);
  });

  it("does not re-end a career the player already chose to continue", () => {
    // The next monthly reading sees the same terminal position, and must not
    // undo the decision that was already taken about it.
    const again = assessCareerOutcome(
      facts({ sellableHotelCount: 0, continueEndless: true }),
    );
    expect(again.distress).toBe("terminal");
    expect(again.ended).toBe(false);
    expect(again.continueEndless).toBe(true);
  });

  it("offers the 2026 choice without taking it for the player", () => {
    const reviewed = assessCareerOutcome(facts({ netLiquidityMinor: 1 }));
    expect(reviewed.careerMilestone2026).toBe(true);
    expect(reviewed.continueEndless).toBe(false);
  });

  it("refuses facts that are not whole", () => {
    expect(() =>
      assessCareerOutcome(facts({ netLiquidityMinor: 1.5 })),
    ).toThrow();
    expect(() =>
      assessCareerOutcome(facts({ creditHeadroomMinor: -1 })),
    ).toThrow();
    expect(() => assessCareerOutcome(facts({ year: Number.NaN }))).toThrow();
    expect(() =>
      assessCareerOutcome(facts({ reducibleStaffCount: 2.5 })),
    ).toThrow();
  });
});
