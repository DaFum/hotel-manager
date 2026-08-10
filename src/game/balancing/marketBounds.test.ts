import { expect, it } from "vitest";
import {
  boundedAnnualChangeBasisPoints,
  boundedPeriodTarget,
} from "./marketBounds";

it("caps market movement symmetrically while retaining direction", () => {
  expect(boundedAnnualChangeBasisPoints(9_000, 2_500)).toBe(2_500);
  expect(boundedAnnualChangeBasisPoints(-9_000, 2_500)).toBe(-2_500);
  expect(boundedPeriodTarget(10_000, 20_000, 300)).toBe(10_300);
  expect(boundedPeriodTarget(100, 200, 0)).toBe(100);
  expect(() => boundedPeriodTarget(100, 200, -1)).toThrow();
  expect(() => boundedPeriodTarget(100, 200, 1.5)).toThrow();
});
