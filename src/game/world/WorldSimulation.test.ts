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

it("gates diffusion on prerequisites and obsoletes replaced technology", () => {
  const state = createWorldState();
  state.technologies.find(
    (technology) => technology.id === "personal-computer",
  )!.replacedBy = "internet";
  state.technologies.find(
    (technology) => technology.id === "internet",
  )!.adoptionBp = 7000;
  const next = new WorldSimulation(createRngStreams(12)).stepYear(state);
  expect(
    next.technologies.find(
      (technology) => technology.id === "personal-computer",
    )?.obsolete,
  ).toBe(true);
  const blocked = createWorldState();
  blocked.technologies.find(
    (technology) => technology.id === "personal-computer",
  )!.adoptionBp = 0;
  expect(
    new WorldSimulation(createRngStreams(12))
      .stepYear(blocked)
      .technologies.find((technology) => technology.id === "internet")
      ?.adoptionBp,
  ).toBe(0);
});

it("keeps neutral sandbox world behavior, changes non-neutral outcomes, and remains deterministic", () => {
  const base = createWorldState();
  const neutral = new WorldSimulation(
    createRngStreams(91),
    10_000,
    10_000,
    10_000,
  ).stepYear(base);
  expect(neutral).toEqual(
    new WorldSimulation(createRngStreams(91)).stepYear(base),
  );
  const volatile = new WorldSimulation(
    createRngStreams(91),
    10_000,
    20_000,
    20_000,
  ).stepYear(base);
  expect(volatile.macro).not.toEqual(neutral.macro);
  expect(volatile).toEqual(
    new WorldSimulation(createRngStreams(91), 10_000, 20_000, 20_000).stepYear(
      base,
    ),
  );
});
