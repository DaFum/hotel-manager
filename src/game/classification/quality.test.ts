import { expect, it } from "vitest";
import {
  classify,
  failedStandards,
  qualifies,
  STAR_STANDARDS,
} from "./quality";
import {
  specializationBonusBp,
  SPECIALIZATIONS,
  specialization,
} from "./specialization";

it("requires every mandatory quality standard", () => {
  expect(
    qualifies(
      { room: 75, reception: 60, maintenance: 80 },
      { room: 70, reception: 70, maintenance: 70 },
    ),
  ).toBe(false);
  expect(
    qualifies(
      { room: 75, reception: 75, maintenance: 80 },
      { room: 70, reception: 70, maintenance: 70 },
    ),
  ).toBe(true);
});

it("names which standard failed so the player can fix it", () => {
  expect(
    failedStandards(
      { room: 75, reception: 60, maintenance: 80 },
      { room: 70, reception: 70, maintenance: 70 },
    ),
  ).toEqual([{ standard: "reception", actual: 60, required: 70 }]);
});

it("awards the highest star rating every standard supports", () => {
  const good = { room: 78, reception: 76, maintenance: 75, facilities: 70 };
  expect(classify(good).stars).toBeGreaterThanOrEqual(3);
  const weak = { room: 40, reception: 40, maintenance: 40, facilities: 20 };
  expect(classify(weak).stars).toBeLessThan(classify(good).stars);
  // The rating always explains the standard that held it back.
  expect(classify(weak).blockedBy.length).toBeGreaterThan(0);
  expect(STAR_STANDARDS.length).toBeGreaterThan(0);
});

it("pays a specialization only where the hotel actually invested", () => {
  const conference = specialization("spec.conference");
  expect(conference.segmentId).toBe("segment.corporate");
  expect(
    specializationBonusBp("spec.conference", {
      conferenceSqm: 400,
      wellnessSqm: 0,
    }),
  ).toBeGreaterThan(0);
  expect(
    specializationBonusBp("spec.conference", {
      conferenceSqm: 0,
      wellnessSqm: 400,
    }),
  ).toBe(0);
  expect(SPECIALIZATIONS.map((s) => s.id)).toContain("spec.wellness");
});
