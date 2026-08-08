import { expect, it } from "vitest";
import { agedAppeal, roomAppeal, segmentFitBp } from "./product";
import { MODULE_LIBRARY, roomProductFor } from "../content/rooms/modules";

it("keeps physical condition separate from commercial aging", () => {
  const r = roomAppeal({
    comfort: 80,
    bath: 70,
    technology: 30,
    condition: 90,
    styleAgeYears: 18,
  });
  expect(r.condition).toBe(90);
  expect(r.appeal).toBeLessThan(80);
});

it("ages a freshly renovated room only commercially", () => {
  const fresh = roomAppeal({
    comfort: 80,
    bath: 70,
    technology: 30,
    condition: 90,
    styleAgeYears: 0,
  });
  const dated = roomAppeal({
    comfort: 80,
    bath: 70,
    technology: 30,
    condition: 90,
    styleAgeYears: 18,
  });
  expect(dated.condition).toBe(fresh.condition);
  expect(dated.appeal).toBeLessThan(fresh.appeal);
  // The style penalty is capped, so a very old room never falls below the cap.
  expect(agedAppeal(fresh.appeal, 40)).toBe(agedAppeal(fresh.appeal, 100));
});

it("scores segment fit against what a segment actually values", () => {
  const business = segmentFitBp(
    { comfort: 60, bath: 60, technology: 90, condition: 90, styleAgeYears: 0 },
    "segment.business",
  );
  const leisure = segmentFitBp(
    { comfort: 60, bath: 60, technology: 90, condition: 90, styleAgeYears: 0 },
    "segment.leisure",
  );
  expect(business).toBeGreaterThan(leisure);
});

it("derives room products from content modules, not hard-coded numbers", () => {
  const standard = roomProductFor("room.standard.double", {
    condition: 100,
    styleAgeYears: 0,
  });
  const suite = roomProductFor("room.suite.junior", {
    condition: 100,
    styleAgeYears: 0,
  });
  expect(roomAppeal(suite).appeal).toBeGreaterThan(roomAppeal(standard).appeal);
  expect(MODULE_LIBRARY.map((m) => m.id)).toContain("room.suite.junior");
});
