import { expect, it } from "vitest";
import { advanceLifecycle, nextAdoptionBp } from "./lifecycle";
it("bounds diffusion and lets replacements obsolete incumbents", () => {
  expect(nextAdoptionBp(9900, 10_000)).toBeLessThanOrEqual(10000);
  expect(() => nextAdoptionBp(0, Number.NaN)).toThrow(/basis points/);
  expect(() => nextAdoptionBp(0, 0, Number.NaN)).toThrow(/obsolescence/);
  expect(() => nextAdoptionBp(0, 0, 10_001)).toThrow(/obsolescence/);
  expect(
    advanceLifecycle(
      { adoptionBp: 8000, peakAdoptionBp: 8000, obsolete: false },
      0,
      7000,
    ).obsolete,
  ).toBe(true);
});
