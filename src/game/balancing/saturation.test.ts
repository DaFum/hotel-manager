import { expect, it } from "vitest";
import { diminishingImpactBasisPoints } from "./saturation";

it("has diminishing marginal impact and a fixed upper bound", () => {
  const a = diminishingImpactBasisPoints(100, 1_000);
  const b = diminishingImpactBasisPoints(200, 1_000);
  const c = diminishingImpactBasisPoints(300, 1_000);
  expect(b - a).toBeGreaterThan(c - b);
  expect(c).toBeLessThan(10_000);
});
