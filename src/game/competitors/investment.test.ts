import { expect, it } from "vitest";
import {
  chooseInvestment,
  expansionFunding,
  returnOnCapitalBp,
} from "./investment";
import { targetLeverageBp } from "./strategies";

it("funds expansions only within cash and leverage headroom", () => {
  expect(expansionFunding(1_000, 400, 700)).toEqual({
    cashMinor: 300,
    debtMinor: 700,
  });
  expect(expansionFunding(1_000, 100, 700)).toBeNull();
});

it("holds when debt exceeds risk tolerance", () => {
  expect(
    chooseInvestment({ returnBp: 1200, debtBp: 8500, toleranceBp: 5000 }),
  ).toBe("hold");
});

it("expands on a strong return and renovates on a thin one", () => {
  expect(
    chooseInvestment({ returnBp: 1200, debtBp: 2000, toleranceBp: 5000 }),
  ).toBe("expand");
  expect(
    chooseInvestment({ returnBp: 500, debtBp: 2000, toleranceBp: 5000 }),
  ).toBe("renovate");
  expect(
    chooseInvestment({ returnBp: 100, debtBp: 2000, toleranceBp: 5000 }),
  ).toBe("hold");
});

it("lets an aggressive owner keep building where a family owner stops", () => {
  const market = { returnBp: 1200, debtBp: 6000 };
  expect(
    chooseInvestment({
      ...market,
      toleranceBp: targetLeverageBp("aggressive"),
    }),
  ).toBe("expand");
  expect(
    chooseInvestment({ ...market, toleranceBp: targetLeverageBp("family") }),
  ).toBe("hold");
});

it("rejects an investment case that is not finite", () => {
  expect(() =>
    chooseInvestment({ returnBp: Number.NaN, debtBp: 0, toleranceBp: 5000 }),
  ).toThrow(/return/);
});

it("measures return on the capital actually employed", () => {
  expect(returnOnCapitalBp(1_200_000, 10_000_000)).toBe(1200);
  // A house with no capital employed has no return to report, not a divide.
  expect(returnOnCapitalBp(1_200_000, 0)).toBe(0);
  expect(returnOnCapitalBp(-500_000, 10_000_000)).toBe(-500);
});
