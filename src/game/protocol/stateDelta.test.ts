import { expect, it } from "vitest";
import { applyStateDelta, computeStateDelta } from "./stateDelta";
import { createInitialGameState } from "../simulation/initialState";

it("includes only changed top-level keys", () => {
  const before = createInitialGameState(1);
  const after = structuredClone(before);
  after.metrics.occupancyBasisPoints = 3;
  const delta = computeStateDelta(before, after, {
    basePublication: 1,
    publication: 2,
  });
  expect(Object.keys(delta.changed)).toEqual(["metrics"]);
  expect(applyStateDelta(before, delta, 1)).toEqual(after);
});
