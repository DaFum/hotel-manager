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
  assetSaleAvailable: false,
  marketExitAvailable: false,
  restructureAvailable: false,
  investorAvailable: false,
  sellableHotelCount: 1,
  reducibleStaffCount: 0,
  turnaroundAvailable: false,
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
          assetSaleAvailable: true,
          marketExitAvailable: true,
          restructureAvailable: true,
          investorAvailable: true,
          sellableHotelCount: 0,
          reducibleStaffCount: 3,
          turnaroundAvailable: true,
        }),
      ).availableRecoveryPaths,
    ).toEqual([
      "refinance",
      "asset-sale",
      "market-exit",
      "restructure",
      "investor",
      "staff-reduction",
      "turnaround",
    ]);
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

  it("records the endless decision without declining insolvency", () => {
    const terminal = assessCareerOutcome(facts({ sellableHotelCount: 0 }));
    expect(terminal.ended).toBe(true);
    const continued = chooseEndlessContinuation(terminal);
    expect(continued.continueEndless).toBe(true);
    // Endless play answers the 2026 review, not the bank. A company with no
    // measure left is still closed, and the modal still offers the restart.
    expect(continued.ended).toBe(true);
  });

  it("never leaves a continued career with nothing it can do", () => {
    // The dead end this guards: terminal distress offers no recovery paths, so
    // if `ended` were suppressed the outcome dialog would open with neither a
    // measure nor a restart while the simulation carried on running.
    const again = assessCareerOutcome(
      facts({ sellableHotelCount: 0, continueEndless: true }),
    );
    expect(again.distress).toBe("terminal");
    expect(again.availableRecoveryPaths).toEqual([]);
    expect(again.ended).toBe(true);
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
