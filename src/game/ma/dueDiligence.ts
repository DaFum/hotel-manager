import { compareIds } from "../domain/ids";
import { assertNonNegativeMinor } from "../domain/units";
import type { HotelValuation } from "./valuation";

/**
 * Buying a hotel is buying what you looked at. Diligence is bought area by
 * area, and an area nobody paid to examine hides whatever is in it — so the
 * player's information is a decision with a price, not a fact of the world.
 */
export const DUE_DILIGENCE_AREAS = [
  "building",
  "legal",
  "finance",
  "staff",
  "environment",
] as const;

export type DueDiligenceArea = (typeof DUE_DILIGENCE_AREAS)[number];

/** What the cost of examining one area is, per area, in Pfennig. */
export const AREA_COST_MINOR = 1_500_000;

export interface DueDiligenceFinding {
  area: DueDiligenceArea;
  description: string;
  /** What putting it right, or settling it, will cost the buyer. */
  costMinor: number;
}

export interface DueDiligenceReport {
  areas: DueDiligenceArea[];
  findings: DueDiligenceFinding[];
  /** Areas nobody examined; whatever is in them travels with the deal. */
  uncoveredAreas: DueDiligenceArea[];
  /** What the examined areas actually turned up; nothing hidden is in here. */
  discoveredLiabilityMinor: number;
  costMinor: number;
}

/**
 * Runs the diligence the buyer paid for. Findings outside the examined areas
 * are not returned — not because they are not there, but because the buyer
 * cannot see them, and the acquisition will inherit them.
 */
export function runDueDiligence(input: {
  areas: readonly DueDiligenceArea[];
  findings: readonly DueDiligenceFinding[];
}): DueDiligenceReport {
  for (const area of input.areas)
    if (!DUE_DILIGENCE_AREAS.includes(area))
      throw new Error(`unknown due diligence area: ${area}`);
  const examined = [...new Set(input.areas)].sort(compareIds);
  const findings = input.findings
    .filter((finding) => examined.includes(finding.area))
    .map((finding) => ({
      ...finding,
      costMinor: assertNonNegativeMinor(finding.costMinor, "finding cost"),
    }))
    .sort(
      (a, b) =>
        compareIds(a.area, b.area) || compareIds(a.description, b.description),
    );
  return {
    areas: examined,
    findings,
    uncoveredAreas: DUE_DILIGENCE_AREAS.filter(
      (area) => !examined.includes(area),
    ),
    discoveredLiabilityMinor: findings.reduce(
      (sum, finding) => sum + finding.costMinor,
      0,
    ),
    costMinor: examined.length * AREA_COST_MINOR,
  };
}

/**
 * Prices the findings into the equity the buyer must put up. Enterprise value
 * is untouched: what diligence found is a cost of ownership, not a change in
 * what the business earns.
 */
export function adjustedValuation(
  valuation: HotelValuation,
  report: DueDiligenceReport,
): HotelValuation {
  return {
    enterpriseValueMinor: valuation.enterpriseValueMinor,
    equityValueMinor:
      valuation.equityValueMinor - report.discoveredLiabilityMinor,
  };
}
