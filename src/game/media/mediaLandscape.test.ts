import { describe, expect, it } from "vitest";
import { incidentReach, mediaFromAdoption } from "./mediaLandscape";
describe("media reach", () => {
  it("amplifies with digital adoption", () =>
    expect(incidentReach({ localPress: 6000 }, 20)).toBeLessThan(
      incidentReach(
        { localPress: 6000, reviewSites: 8000, socialMedia: 8000 },
        20,
      ),
    ));

  it("normalises a channel that left its range instead of trusting it", () => {
    expect(incidentReach({ localPress: -5000 }, 20)).toBe(0);
    expect(incidentReach({ localPress: 99_999 }, 20)).toBe(
      incidentReach({ localPress: 10_000 }, 20),
    );
    expect(mediaFromAdoption(-1, 20_000)).toMatchObject({
      reviewSites: 0,
      socialMedia: 10_000,
    });
  });

  it("refuses reaches and severities that are not whole", () => {
    expect(() => incidentReach({ localPress: 1.5 }, 20)).toThrow();
    expect(() => incidentReach({ socialMedia: Number.NaN }, 20)).toThrow();
    expect(() => incidentReach({ localPress: 6000 }, -1)).toThrow();
    expect(() => incidentReach({ localPress: 6000 }, 2.5)).toThrow();
    expect(() => mediaFromAdoption(1.5, 0)).toThrow();
  });
});
