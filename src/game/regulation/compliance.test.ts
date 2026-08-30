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
    consequences: [
      { kind: "fine", amountMinor: 50000 },
      { kind: "closure", facilityId: "facility.kitchen" },
      { kind: "restriction", facilityId: "facility.restaurant", capacityValue: 10 },
      { kind: "reputation", dimension: "hotel", delta: -10 },
    ],
    noticeAtMinutes: 50,
  };

  const noncompliantResult = evaluateCompliance(rule, 60, 121);
  expect(noncompliantResult).toMatchObject({
    status: "noncompliant",
    gap: 15,
    consequenceMinor: 50000,
    remediation: [{ improvement: 15 }],
  });
  expect(noncompliantResult.consequences).toHaveLength(4);
  expect(noncompliantResult.consequences).toEqual(rule.consequences);

  const graceResult = evaluateCompliance(rule, 60, 105);
  expect(graceResult.status).toBe("grace");
  expect(graceResult.consequences).toEqual([]);
  expect(graceResult.consequenceMinor).toBe(0);

  const compliantResult = evaluateCompliance(rule, 80, 121);
  expect(compliantResult.status).toBe("compliant");
  expect(compliantResult.consequences).toEqual([]);
  expect(compliantResult.consequenceMinor).toBe(0);

  const inactiveResult = evaluateCompliance(rule, 60, 99);
  expect(inactiveResult.status).toBe("inactive");
  expect(inactiveResult.consequences).toEqual([]);
  expect(inactiveResult.consequenceMinor).toBe(0);

  expect(applicableRules([rule], "other", {}, 121)).toEqual([]);
  expect(
    applicableRules(
      [
        {
          ...rule,
          activation: { worldMetric: "energyPressureBp", minimum: 5000 },
        },
      ],
      "de.he",
      { energyPressureBp: 4999 },
      121,
    ),
  ).toEqual([]);
  expect(() => evaluateCompliance(rule, Number.NaN, 121)).toThrow(/measured/);

  const invalidRule = {
    ...rule,
    consequences: [{ kind: "restriction" as const, facilityId: "f1", capacityFactorBp: 15000 }],
  };
  expect(() => evaluateCompliance(invalidRule, 60, 121)).toThrow(/capacity factor/);
});
