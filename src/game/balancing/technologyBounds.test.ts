import { expect, it } from "vitest";
import { boundedAdoptionStep } from "./technologyBounds";

it("prevents instant diffusion and permanent fractional lock", () => {
  expect(boundedAdoptionStep(9_800, 1_000, 400)).toBe(10_000);
  expect(boundedAdoptionStep(100, -1_000, 400)).toBe(0);
  expect(boundedAdoptionStep(5_000, 1, 400)).toBe(5_010);
  expect(boundedAdoptionStep(5_000, 1, 5)).toBe(5_005);
});
