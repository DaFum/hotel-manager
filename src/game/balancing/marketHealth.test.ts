import { expect, it } from "vitest";
import { marketHealthWarnings } from "./marketHealth";

it("reports collapse, concentration, homogeneity and decoupling independently", () => {
  expect(
    marketHealthWarnings({
      activeCompetitors: 0,
      largestShareBasisPoints: 10_000,
    }),
  ).toEqual(["no-active-competitors", "extreme-concentration"]);
  expect(
    marketHealthWarnings({
      activeCompetitors: 4,
      largestShareBasisPoints: 4_000,
      strategyCount: 1,
    }),
  ).toContain("no-strategy-diversity");
  expect(
    marketHealthWarnings({
      activeCompetitors: 2,
      largestShareBasisPoints: 5_000,
      adrIndexBasisPoints: 9_000,
      wageIndexBasisPoints: 3_000,
    }),
  ).toContain("price-wage-decoupling");
});

it("rejects invalid market-health inputs", () => {
  expect(() =>
    marketHealthWarnings({
      activeCompetitors: 1.5,
      largestShareBasisPoints: 5_000,
    }),
  ).toThrow();
  expect(() =>
    marketHealthWarnings({
      activeCompetitors: 1,
      largestShareBasisPoints: 10_001,
    }),
  ).toThrow();
});
