import { expect, it } from "vitest";
import { runWorldYears } from "../test/worldScenario";
it("keeps 50 years bounded and deterministic", () => {
  const a = runWorldYears(50, 9001),
    b = runWorldYears(50, 9001);
  expect(a).toEqual(b);
  expect(a.maxInflationBp).toBeLessThan(5000);
  expect(a.maxTechnologyBp).toBeLessThanOrEqual(10000);
  expect(a.state.yearsAdvanced).toBe(50);
});
