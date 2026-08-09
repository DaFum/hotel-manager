import { expect, it } from "vitest";
import { entryOpportunity, lifecycleAction } from "./lifecycle";
import {
  neutralRelation,
  rememberPriceCut,
  rememberFairPlay,
  retaliationBp,
  MIN_RELATION,
  MAX_RELATION,
} from "./relations";

it("exits when cash and refinancing are exhausted", () => {
  expect(lifecycleAction({ cash: -100, credit: 0, burn: 50 })).toBe("exit");
});

it("restructures while credit still covers the hole", () => {
  expect(lifecycleAction({ cash: -100, credit: 500, burn: 50 })).toBe(
    "restructure",
  );
  expect(lifecycleAction({ cash: 50, credit: 0, burn: 50 })).toBe(
    "restructure",
  );
});

it("keeps operating while the house is comfortably funded", () => {
  expect(lifecycleAction({ cash: 10_000, credit: 0, burn: 50 })).toBe(
    "operate",
  );
  // A house with no burn at all is not in distress.
  expect(lifecycleAction({ cash: 0, credit: 0, burn: 0 })).toBe("operate");
});

it("rejects a house whose finances are not finite", () => {
  expect(() =>
    lifecycleAction({ cash: Number.NaN, credit: 0, burn: 0 }),
  ).toThrow(/cash/);
});

it("invites entry only into a tight and profitable market", () => {
  const hot = {
    occupancyBp: 8500,
    marketRateMinor: 22000,
    buildCostPerRoomMinor: 4_500_000,
  };
  expect(entryOpportunity(hot)).toBe(true);
  // A slack city gets no new hotels however cheap the land is.
  expect(entryOpportunity({ ...hot, occupancyBp: 5000 })).toBe(false);
  // Nor does an expensive one, however full it is.
  expect(entryOpportunity({ ...hot, buildCostPerRoomMinor: 40_000_000 })).toBe(
    false,
  );
});

it("remembers who undercut it and forgets slowly", () => {
  const cut = rememberPriceCut(neutralRelation());
  expect(cut).toBeLessThan(neutralRelation());
  // One fair month does not wipe out a price war.
  expect(rememberFairPlay(cut)).toBeLessThan(neutralRelation());
  expect(rememberFairPlay(cut)).toBeGreaterThan(cut);
});

it("keeps a relation inside its declared range however long the feud runs", () => {
  let relation = neutralRelation();
  for (let month = 0; month < 500; month++)
    relation = rememberPriceCut(relation);
  expect(relation).toBe(MIN_RELATION);
  for (let month = 0; month < 500; month++)
    relation = rememberFairPlay(relation);
  expect(relation).toBe(MAX_RELATION);
});

it("retaliates hardest against the rival it trusts least", () => {
  expect(retaliationBp(MIN_RELATION)).toBeGreaterThan(
    retaliationBp(neutralRelation()),
  );
  expect(retaliationBp(MAX_RELATION)).toBe(0);
});
