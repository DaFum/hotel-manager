export type RegulationArea =
  | "safety"
  | "labor"
  | "accessibility"
  | "environment"
  | "foodHygiene"
  | "privacy"
  | "construction"
  | "tax";
export interface RegulationRule {
  id: string;
  area: RegulationArea;
  jurisdictionId: string;
  requirement: number;
  effectiveAtMinutes: number;
  graceMinutes: number;
  inspectionRiskBp: number;
  consequenceMinor: number;
}
export interface ComplianceCase {
  ruleId: string;
  status: "compliant" | "grace" | "noncompliant";
  requirement: number;
  measured: number;
  gap: number;
  effectiveAtMinutes: number;
  graceEndsAtMinutes: number;
  inspectionRiskBp: number;
  remediation: { kind: string; costMinor: number; improvement: number }[];
  consequenceMinor: number;
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
  const gap = Math.max(0, rule.requirement - measured);
  const graceEndsAtMinutes = rule.effectiveAtMinutes + rule.graceMinutes;
  const status =
    gap === 0
      ? "compliant"
      : nowMinutes < graceEndsAtMinutes
        ? "grace"
        : "noncompliant";
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
              costMinor: gap * 10_000,
              improvement: gap,
            },
          ],
    consequenceMinor: status === "noncompliant" ? rule.consequenceMinor : 0,
  };
}
export function applicableRules(
  rules: readonly RegulationRule[],
  jurisdictionId: string,
): RegulationRule[] {
  return rules
    .filter((r) => r.jurisdictionId === jurisdictionId)
    .sort((a, b) => a.id.localeCompare(b.id));
}
