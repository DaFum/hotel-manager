import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
} from "../domain/units";

/**
 * The study that decides whether a scheme is worth building. It reports a band
 * rather than a number: a development is committed years before its first
 * guest, and pretending the forecast is exact is the single most expensive
 * mistake the player can make.
 */
export interface FeasibilityInput {
  expectedAdrMinor: number;
  rooms: number;
  occupancyBasisPoints: number;
  /** How wide the study's own error bars are, in basis points of revenue. */
  uncertaintyBasisPoints: number;
  /** Total development cost, when an investment case is being tested. */
  investmentMinor?: number;
  /** Gross operating margin the scheme is underwritten at. */
  gopMarginBasisPoints?: number;
}

export interface FeasibilityResult {
  downsideAnnualRoomRevenueMinor: number;
  baseAnnualRoomRevenueMinor: number;
  upsideAnnualRoomRevenueMinor: number;
  /** Null until the study is given a margin to underwrite. */
  baseAnnualGopMinor: number | null;
  /** Base-case GOP over development cost, in basis points. Null without both. */
  returnOnCostBasisPoints: number | null;
  downsideReturnOnCostBasisPoints: number | null;
}

const DAYS_PER_YEAR = 365;

export function calculateFeasibility(
  input: FeasibilityInput,
): FeasibilityResult {
  assertNonNegativeMinor(input.expectedAdrMinor, "expected ADR");
  if (input.rooms <= 0) throw new Error("invalid rooms");
  assertCount(input.rooms, "rooms");
  assertBasisPoints(input.occupancyBasisPoints, "occupancy basis points");
  if (input.occupancyBasisPoints > 10_000)
    throw new Error("invalid occupancy basis points");
  assertBasisPoints(input.uncertaintyBasisPoints, "uncertainty basis points");
  if (input.uncertaintyBasisPoints > 10_000)
    throw new Error("invalid uncertainty basis points");

  const gross =
    input.expectedAdrMinor *
    input.rooms *
    DAYS_PER_YEAR *
    input.occupancyBasisPoints;
  // Checked before the division: a product that has already left the safe
  // range would divide down to a plausible-looking but wrong figure.
  if (!Number.isSafeInteger(gross))
    throw new Error("the scheme's revenue exceeds the safe integer range");
  const base = Math.trunc(gross / 10_000);
  const spread = Math.trunc((base * input.uncertaintyBasisPoints) / 10_000);

  const margin = input.gopMarginBasisPoints;
  if (margin !== undefined) {
    assertBasisPoints(margin, "gop margin");
    if (margin > 10_000) throw new Error("invalid gop margin");
  }
  const gop = (revenueMinor: number): number | null =>
    margin === undefined ? null : Math.trunc((revenueMinor * margin) / 10_000);

  const investment = input.investmentMinor;
  if (investment !== undefined)
    assertNonNegativeMinor(investment, "development investment");
  const returnOnCost = (gopMinor: number | null): number | null =>
    gopMinor === null || investment === undefined || investment === 0
      ? null
      : Math.trunc((gopMinor * 10_000) / investment);

  return {
    downsideAnnualRoomRevenueMinor: base - spread,
    baseAnnualRoomRevenueMinor: base,
    upsideAnnualRoomRevenueMinor: base + spread,
    baseAnnualGopMinor: gop(base),
    returnOnCostBasisPoints: returnOnCost(gop(base)),
    downsideReturnOnCostBasisPoints: returnOnCost(gop(base - spread)),
  };
}

/**
 * Whether the scheme clears the group's hurdle rate, with the reason it did
 * or did not. The verdict is advice: the player commits the money, not the
 * study.
 */
export function feasibilityVerdict(
  result: FeasibilityResult,
  hurdleBasisPoints: number,
): { proceed: boolean; reason: string } {
  assertBasisPoints(hurdleBasisPoints, "hurdle rate");
  const roc = result.returnOnCostBasisPoints;
  if (roc === null) return { proceed: false, reason: "no investment case" };
  return roc >= hurdleBasisPoints
    ? {
        proceed: true,
        reason: `return on cost ${roc}bp clears the ${hurdleBasisPoints}bp hurdle`,
      }
    : {
        proceed: false,
        reason: `return on cost ${roc}bp is short of the ${hurdleBasisPoints}bp hurdle`,
      };
}
