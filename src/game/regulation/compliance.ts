import { compareIds } from "../domain/ids";
import type { ReputationDimension } from "../reputation/dimensions";

export type RegulationArea =
  | "safety"
  | "labor"
  | "accessibility"
  | "environment"
  | "foodHygiene"
  | "privacy"
  | "construction"
  | "tax";

export type ConsequenceDescriptor =
  | { kind: "fine"; amountMinor: number }
  | {
      kind: "restriction";
      facilityId: string;
      capacityValue?: number;
      capacityFactorBp?: number;
    }
  | { kind: "closure"; facilityId: string }
  | { kind: "reputation"; dimension: ReputationDimension; delta: number };

export interface RegulationRule {
  id: string;
  area: RegulationArea;
  jurisdictionId: string;
  requirement: number;
  effectiveAtMinutes: number;
  graceMinutes: number;
  inspectionRiskBp: number;
  consequenceMinor: number;
  consequences?: ConsequenceDescriptor[];
  noticeAtMinutes: number;
  affectedFacilityId?: string;
  reputationDimension?: ReputationDimension;
  reputationScope?: string;
  activation?: { worldMetric: string; minimum: number };
}

export interface ComplianceCase {
  ruleId: string;
  status: "inactive" | "compliant" | "grace" | "noncompliant";
  requirement: number;
  measured: number;
  gap: number;
  effectiveAtMinutes: number;
  graceEndsAtMinutes: number;
  inspectionRiskBp: number;
  remediation: { kind: string; costMinor: number; improvement: number }[];
  consequenceMinor: number;
  consequences: ConsequenceDescriptor[];
  affectedFacilityId?: string;
  reputationDimension?: ReputationDimension;
  reputationScope?: string;
}

export function complianceStatus(
  measured: number,
  required: number,
): "compliant" | "noncompliant" {
  return measured >= required ? "compliant" : "noncompliant";
}

export function evaluateCompliance(
  rule: RegulationRule,
  measured: number,
  nowMinutes: number,
): ComplianceCase {
  const requireNonNegative = (value: number, label: string) => {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`${label} must be whole and non-negative`);
  };
  requireNonNegative(measured, "measured compliance");
  requireNonNegative(nowMinutes, "current game time");
  requireNonNegative(rule.requirement, "rule requirement");
  requireNonNegative(rule.noticeAtMinutes, "rule notice time");
  requireNonNegative(rule.effectiveAtMinutes, "rule effective time");
  requireNonNegative(rule.graceMinutes, "rule grace time");
  requireNonNegative(rule.consequenceMinor, "rule consequence");
  if (
    !Number.isSafeInteger(rule.inspectionRiskBp) ||
    rule.inspectionRiskBp < 0 ||
    rule.inspectionRiskBp > 10_000
  )
    throw new Error("inspection risk must be 0..10000 basis points");

  if (rule.consequences) {
    for (const consequence of rule.consequences) {
      if (consequence.kind === "fine") {
        requireNonNegative(consequence.amountMinor, "fine amount");
      } else if (consequence.kind === "restriction") {
        if (!consequence.facilityId) {
          throw new Error("restriction target facility id must be specified");
        }
        if (consequence.capacityValue !== undefined) {
          requireNonNegative(
            consequence.capacityValue,
            "restriction capacity value",
          );
        }
        if (consequence.capacityFactorBp !== undefined) {
          if (
            !Number.isSafeInteger(consequence.capacityFactorBp) ||
            consequence.capacityFactorBp < 0 ||
            consequence.capacityFactorBp > 10_000
          ) {
            throw new Error(
              "restriction capacity factor must be 0..10000 basis points",
            );
          }
        }
      } else if (consequence.kind === "closure") {
        if (!consequence.facilityId) {
          throw new Error("closure target facility id must be specified");
        }
      } else if (consequence.kind === "reputation") {
        if (!Number.isSafeInteger(consequence.delta)) {
          throw new Error("reputation delta must be a safe integer");
        }
      }
    }
  }

  const gap = Math.max(0, rule.requirement - measured);
  const graceEndsAtMinutes = rule.effectiveAtMinutes + rule.graceMinutes;
  if (!Number.isSafeInteger(graceEndsAtMinutes))
    throw new Error("rule grace end overflow");
  const status =
    nowMinutes < rule.effectiveAtMinutes
      ? "inactive"
      : gap === 0
        ? "compliant"
        : nowMinutes < graceEndsAtMinutes
          ? "grace"
          : "noncompliant";
  const remediationCostMinor = gap * 10_000;
  if (!Number.isSafeInteger(remediationCostMinor))
    throw new Error("compliance remediation cost overflow");

  const fineDescriptor = rule.consequences?.find(
    (c): c is Extract<ConsequenceDescriptor, { kind: "fine" }> =>
      c.kind === "fine",
  );
  const activeConsequenceMinor =
    status === "noncompliant"
      ? (fineDescriptor?.amountMinor ?? rule.consequenceMinor)
      : 0;

  const activeConsequences =
    status === "noncompliant" ? (rule.consequences ?? []) : [];

  return {
    ruleId: rule.id,
    status,
    requirement: rule.requirement,
    measured,
    gap,
    effectiveAtMinutes: rule.effectiveAtMinutes,
    graceEndsAtMinutes,
    inspectionRiskBp: rule.inspectionRiskBp,
    remediation:
      gap === 0
        ? []
        : [
            {
              kind: `improve-${rule.area}`,
              costMinor: remediationCostMinor,
              improvement: gap,
            },
          ],
    consequenceMinor: activeConsequenceMinor,
    consequences: activeConsequences,
    affectedFacilityId: rule.affectedFacilityId,
    reputationDimension: rule.reputationDimension,
    reputationScope: rule.reputationScope,
  };
}

export function applicableRules(
  rules: readonly RegulationRule[],
  jurisdictionId: string,
  worldState: Readonly<Record<string, number>>,
  nowMinutes: number,
): RegulationRule[] {
  if (!Number.isSafeInteger(nowMinutes) || nowMinutes < 0)
    throw new Error("current game time must be whole and non-negative");
  return rules
    .filter(
      (rule) =>
        rule.jurisdictionId === jurisdictionId &&
        nowMinutes >= rule.noticeAtMinutes &&
        (!rule.activation ||
          (Number.isSafeInteger(rule.activation.minimum) &&
            Number.isSafeInteger(worldState[rule.activation.worldMetric]) &&
            (worldState[rule.activation.worldMetric] as number) >=
              rule.activation.minimum)),
    )
    .sort((a, b) => compareIds(a.id, b.id));
}
