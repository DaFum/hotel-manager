import { expect, it } from "vitest";
import {
  advanceProject,
  blockedRooms,
  noisePenaltyBp,
  planProject,
  PHASE_MINUTES,
  type Project,
} from "./projects";

it("moves construction to acceptance only after remaining work reaches zero", () => {
  expect(
    advanceProject(
      { phase: "construction", remainingMinutes: 5, affected: ["101"] },
      5,
    ).phase,
  ).toBe("acceptance");
  expect(
    advanceProject(
      { phase: "construction", remainingMinutes: 10, affected: ["101"] },
      5,
    ).phase,
  ).toBe("construction");
});

it("walks planning, approval, construction, acceptance and reopening in order", () => {
  let p: Project = planProject("room.comfort.double", ["101", "102"]);
  const seen = [p.phase];
  for (let i = 0; i < 40; i++) {
    p = advanceProject(p, 1440);
    if (p.phase !== seen[seen.length - 1]) seen.push(p.phase);
  }
  expect(seen).toEqual([
    "planning",
    "approval",
    "construction",
    "acceptance",
    "complete",
  ]);
  // A finished project stops consuming time.
  expect(advanceProject(p, 1440)).toEqual(p);
});

it("takes rooms out of order only while the site is actually being built", () => {
  const affected = ["101", "102"];
  expect(
    blockedRooms({ phase: "planning", remainingMinutes: 1, affected }),
  ).toEqual([]);
  expect(
    blockedRooms({ phase: "construction", remainingMinutes: 1, affected }),
  ).toEqual(affected);
  expect(
    blockedRooms({ phase: "acceptance", remainingMinutes: 1, affected }),
  ).toEqual(affected);
  expect(
    blockedRooms({ phase: "complete", remainingMinutes: 0, affected }),
  ).toEqual([]);
});

it("charges construction noise to every guest still in the house", () => {
  const site: Project = {
    phase: "construction",
    remainingMinutes: 100,
    affected: ["101"],
  };
  expect(noisePenaltyBp(site, 0)).toBe(0);
  expect(noisePenaltyBp(site, 10)).toBeGreaterThan(0);
  expect(noisePenaltyBp({ ...site, phase: "acceptance" }, 10)).toBe(0);
  expect(PHASE_MINUTES.construction).toBeGreaterThan(0);
});

it("refuses elapsed minutes that are not whole and non-negative", () => {
  const site: Project = {
    phase: "construction",
    remainingMinutes: 100,
    affected: ["101"],
  };
  // A NaN would survive every comparison in the loop and walk the project
  // straight to complete, skipping the whole lifecycle.
  expect(() => advanceProject(site, Number.NaN)).toThrow(/elapsed minutes/);
  expect(() => advanceProject(site, 2.5)).toThrow(/elapsed minutes/);
  expect(() => advanceProject(site, -5)).toThrow(/elapsed minutes/);
  expect(() => advanceProject(site, Number.POSITIVE_INFINITY)).toThrow(
    /elapsed minutes/,
  );
  expect(advanceProject(site, 0)).toEqual(site);
});
