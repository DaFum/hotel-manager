import { expect, it } from "vitest";
import { crisisCauses, crisisRiskBp } from "./crises";
import { maybeCreateShock } from "./shocks";
it("raises explainable systemic risk and only creates conditional shocks", () => {
  expect(crisisRiskBp(8000, 7000, 8000)).toBeGreaterThan(6000);
  expect(
    crisisCauses({
      leverageBp: 8000,
      overcapacityBp: 7000,
      refinanceStressBp: 8000,
    })[0].id,
  ).toBe("leverage");
  expect(
    maybeCreateShock(1, 7000, 6999, "financial", ["refinance"]),
  ).not.toBeNull();
  expect(maybeCreateShock(1, 7000, 7000, "financial", [])).toBeNull();
});
