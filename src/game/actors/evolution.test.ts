import { expect, it } from "vitest";
import { ACTOR_KINDS, nextActorScale, scaleByKind } from "./evolution";

it("allows demand actors to grow and shrink", () => {
  expect(
    nextActorScale({ scale: 100, demand: 120, profitBp: 800 }),
  ).toBeGreaterThan(100);
  expect(
    nextActorScale({ scale: 100, demand: 60, profitBp: -900 }),
  ).toBeLessThan(100);
});

it("never lets an actor fall below zero or run away in one month", () => {
  expect(nextActorScale({ scale: 2, demand: 0, profitBp: -100000 })).toBe(0);
  const jump = nextActorScale({ scale: 100, demand: 100000, profitBp: 100000 });
  expect(jump - 100).toBeLessThanOrEqual(15);
});

it("keeps a scale whole so a city index never drifts on floats", () => {
  expect(
    Number.isSafeInteger(
      nextActorScale({ scale: 101, demand: 117, profitBp: 733 }),
    ),
  ).toBe(true);
});

it("pulls a shrunken actor back toward the city's neutral scale", () => {
  // Neutral demand and no profit: the only force left is the pull home.
  expect(
    nextActorScale({ scale: 40, demand: 100, profitBp: 0 }),
  ).toBeGreaterThan(40);
  expect(nextActorScale({ scale: 160, demand: 100, profitBp: 0 })).toBeLessThan(
    160,
  );
  expect(nextActorScale({ scale: 100, demand: 100, profitBp: 0 })).toBe(100);
});

it("rejects an actor whose state is not finite", () => {
  expect(() =>
    nextActorScale({ scale: Number.NaN, demand: 100, profitBp: 0 }),
  ).toThrow(/scale/);
});

it("rejects fractional, negative, and unsafe actor state", () => {
  for (const input of [
    { scale: 100.5, demand: 100, profitBp: 0 },
    { scale: -1, demand: 100, profitBp: 0 },
    { scale: 100, demand: 100.5, profitBp: 0 },
    { scale: 100, demand: 100, profitBp: Number.MAX_SAFE_INTEGER + 1 },
  ])
    expect(() => nextActorScale(input)).toThrow(/invalid/);
  expect(() =>
    scaleByKind([{ id: "actor.bad", kind: "office", scale: 1.5 }]),
  ).toThrow(/scale/);
});

it("aggregates the city's actors into one scale per driver", () => {
  const actors = [
    { id: "actor.bank", kind: "office" as const, scale: 120 },
    { id: "actor.chemicals", kind: "office" as const, scale: 80 },
    { id: "actor.fair", kind: "congress" as const, scale: 130 },
  ];
  const byKind = scaleByKind(actors);
  expect(byKind.office).toBe(100);
  expect(byKind.congress).toBe(130);
  // A kind with no actors left in the city is neutral, not zero demand.
  expect(byKind.attraction).toBe(100);
  for (const kind of ACTOR_KINDS)
    expect(Number.isSafeInteger(byKind[kind])).toBe(true);
});
