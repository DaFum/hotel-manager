import { expect, it } from "vitest";
import { createRngStreams } from "../domain/rng";
import {
  createWorldState,
  WorldSimulation,
  worldStepOrder,
} from "./WorldSimulation";
it("keeps stable yearly update order and isolated deterministic streams", () => {
  expect(worldStepOrder).toEqual([
    "macro",
    "regulation",
    "technology",
    "trends",
    "actors",
    "crises",
    "currency",
  ]);
  const a = new WorldSimulation(createRngStreams(9)),
    b = new WorldSimulation(createRngStreams(9));
  let sa = createWorldState(),
    sb = createWorldState();
  for (let i = 0; i < 12; i++) {
    sa = a.stepMonth(sa);
    sb = b.stepMonth(sb);
  }
  expect(sa).toEqual(sb);
  expect(sa.lastStepOrder).toEqual(worldStepOrder);
});
