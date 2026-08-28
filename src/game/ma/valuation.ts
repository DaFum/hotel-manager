import {
  assertBasisPoints,
  assertMinor,
  assertNonNegativeMinor,
} from "../domain/units";
import type { GameState } from "../simulation/initialState";
import { MARKET_GOP_MULTIPLE_BP } from "../content/1991/company";

/**
 * What a hotel is worth to a buyer. Enterprise value is what the business
 * earns; equity value is what the buyer's own money has to cover once the
 * building's deferred maintenance and the seller's debt are taken on. Keeping
 * the two apart is the whole point: a cheap-looking hotel with a failed roof
 * and a mortgage is not cheap.
 */
export interface HotelValuationInput {
  annualGopMinor: number;
  /** The earnings multiple in basis points; 80000bp is eight times GOP. */
  multipleBasisPoints: number;
  renovationNeedMinor: number;
  debtAssumedMinor: number;
}

export interface HotelValuation {
  enterpriseValueMinor: number;
  equityValueMinor: number;
}

export function valueHotel(input: HotelValuationInput): HotelValuation {
  assertMinor(input.annualGopMinor, "annual gop");
  assertBasisPoints(input.multipleBasisPoints, "valuation multiple");
  assertNonNegativeMinor(input.renovationNeedMinor, "renovation need");
  assertNonNegativeMinor(input.debtAssumedMinor, "debt assumed");
  const enterpriseValueMinor = Math.trunc(
    (input.annualGopMinor * input.multipleBasisPoints) / 10_000,
  );
  return {
    enterpriseValueMinor,
    // Deliberately allowed to go negative: a target that costs more to fix
    // than it earns is a real thing the player must be able to see.
    equityValueMinor:
      enterpriseValueMinor - input.renovationNeedMinor - input.debtAssumedMinor,
  };
}

/** The group's equity value: operating earnings less outstanding debt. */
export function valueCompany(state: GameState): number {
  const annualGopMinor = Object.values(state.company.hotelResults).reduce(
    (total, result) => total + result.grossOperatingProfitMinor * 12,
    0,
  );
  const loans = state.loans ?? (state.loan ? [state.loan] : []);
  const totalDebt = loans.reduce((sum, l) => sum + l.principalMinor, 0);
  return Math.max(
    0,
    valueHotel({
      annualGopMinor,
      multipleBasisPoints: MARKET_GOP_MULTIPLE_BP,
      renovationNeedMinor: 0,
      debtAssumedMinor: totalDebt,
    }).equityValueMinor,
  );
}

/**
 * The range the group would negotiate in. A single number invites the player
 * to treat a valuation as a price; the band says what it actually is.
 */
export function offerRangeMinor(
  valuation: HotelValuation,
  toleranceBasisPoints: number,
): { lowMinor: number; midMinor: number; highMinor: number } {
  assertBasisPoints(toleranceBasisPoints, "offer tolerance");
  const mid = Math.max(0, valuation.equityValueMinor);
  const spread = Math.trunc((mid * toleranceBasisPoints) / 10_000);
  return {
    lowMinor: Math.max(0, mid - spread),
    midMinor: mid,
    highMinor: mid + spread,
  };
}
