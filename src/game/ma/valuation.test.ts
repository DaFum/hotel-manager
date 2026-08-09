import { describe, expect, it } from "vitest";
import { offerRangeMinor, valueHotel } from "./valuation";
import {
  DUE_DILIGENCE_AREAS,
  adjustedValuation,
  runDueDiligence,
} from "./dueDiligence";

const TARGET = {
  annualGopMinor: 20_000_000,
  multipleBasisPoints: 80000,
  renovationNeedMinor: 15_000_000,
  debtAssumedMinor: 30_000_000,
};

describe("hotel valuation", () => {
  it("reduces value for required renovation and debt assumed", () => {
    const value = valueHotel(TARGET);
    expect(value.enterpriseValueMinor).toBe(160_000_000);
    expect(value.equityValueMinor).toBe(115_000_000);
  });

  it("keeps a distressed target's negative equity visible", () => {
    const value = valueHotel({
      ...TARGET,
      annualGopMinor: 1_000_000,
      renovationNeedMinor: 40_000_000,
    });
    expect(value.enterpriseValueMinor).toBe(8_000_000);
    expect(value.equityValueMinor).toBe(-62_000_000);
  });

  it("keeps values whole Pfennig when the multiple does not divide evenly", () => {
    const value = valueHotel({ ...TARGET, multipleBasisPoints: 83_333 });
    expect(Number.isSafeInteger(value.enterpriseValueMinor)).toBe(true);
    expect(value.enterpriseValueMinor).toBe(166_666_000);
  });

  it("refuses terms that are not whole declared units", () => {
    expect(() => valueHotel({ ...TARGET, multipleBasisPoints: -1 })).toThrow(
      /multiple/,
    );
    expect(() => valueHotel({ ...TARGET, renovationNeedMinor: 1.5 })).toThrow(
      /renovation/,
    );
  });

  it("quotes a negotiating range around the equity value, never below zero", () => {
    expect(offerRangeMinor(valueHotel(TARGET), 1000)).toEqual({
      lowMinor: 103_500_000,
      midMinor: 115_000_000,
      highMinor: 126_500_000,
    });
    const distressed = valueHotel({
      ...TARGET,
      annualGopMinor: 1_000_000,
      renovationNeedMinor: 40_000_000,
    });
    expect(offerRangeMinor(distressed, 1000).lowMinor).toBe(0);
  });
});

describe("due diligence", () => {
  it("finds nothing the buyer did not pay to look for", () => {
    const report = runDueDiligence({
      areas: [],
      findings: [
        { area: "building", description: "roof", costMinor: 5_000_000 },
      ],
    });
    expect(report.findings).toEqual([]);
    expect(report.uncoveredAreas).toEqual([...DUE_DILIGENCE_AREAS]);
    expect(report.undisclosedLiabilityMinor).toBe(0);
  });

  it("surfaces only findings in the areas that were actually examined", () => {
    const report = runDueDiligence({
      areas: ["building", "legal"],
      findings: [
        { area: "building", description: "roof", costMinor: 5_000_000 },
        { area: "staff", description: "back pay", costMinor: 2_000_000 },
      ],
    });
    expect(report.findings.map((f) => f.area)).toEqual(["building"]);
    expect(report.undisclosedLiabilityMinor).toBe(5_000_000);
    expect(report.uncoveredAreas).not.toContain("building");
    expect(report.uncoveredAreas).toContain("staff");
  });

  it("refuses an area nobody can examine", () => {
    expect(() =>
      runDueDiligence({
        areas: ["astrology" as (typeof DUE_DILIGENCE_AREAS)[number]],
        findings: [],
      }),
    ).toThrow(/area/);
  });

  it("prices what diligence found straight into the equity value", () => {
    const report = runDueDiligence({
      areas: ["building"],
      findings: [
        { area: "building", description: "roof", costMinor: 5_000_000 },
      ],
    });
    const adjusted = adjustedValuation(valueHotel(TARGET), report);
    expect(adjusted.equityValueMinor).toBe(110_000_000);
    expect(adjusted.enterpriseValueMinor).toBe(160_000_000);
  });

  it("charges for each area examined so information is never free", () => {
    const cheap = runDueDiligence({ areas: ["building"], findings: [] });
    const thorough = runDueDiligence({
      areas: [...DUE_DILIGENCE_AREAS],
      findings: [],
    });
    expect(thorough.costMinor).toBeGreaterThan(cheap.costMinor);
    expect(cheap.costMinor).toBeGreaterThan(0);
  });
});
