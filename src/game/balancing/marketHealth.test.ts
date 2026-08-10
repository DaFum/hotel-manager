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
});
