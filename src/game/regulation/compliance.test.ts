import { expect, it } from "vitest";
import {
  applicableRules,
  complianceStatus,
  evaluateCompliance,
  type RegulationRule,
} from "./compliance";
it("explains jurisdictional compliance gaps and remediation", () => {
  expect(complianceStatus(60, 75)).toBe("noncompliant");
  const rule: RegulationRule = {
    id: "fire",
    area: "safety",
    jurisdictionId: "de.he",
    requirement: 75,
    effectiveAtMinutes: 100,
    graceMinutes: 20,
    inspectionRiskBp: 1000,
    consequenceMinor: 50000,
  };
  expect(evaluateCompliance(rule, 60, 121)).toMatchObject({
    status: "noncompliant",
    gap: 15,
    consequenceMinor: 50000,
    remediation: [{ improvement: 15 }],
  });
  expect(applicableRules([rule], "other")).toEqual([]);
});
