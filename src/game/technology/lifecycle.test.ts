import { expect, it } from "vitest";
import { advanceLifecycle, nextAdoptionBp } from "./lifecycle";
it("bounds diffusion and lets replacements obsolete incumbents", () => {
  expect(nextAdoptionBp(9900, 15000)).toBeLessThanOrEqual(10000);
  expect(nextAdoptionBp(0, -50000)).toBe(0);
  expect(
    advanceLifecycle(
      { adoptionBp: 8000, peakAdoptionBp: 8000, obsolete: false },
      0,
      7000,
    ).obsolete,
  ).toBe(true);
});
