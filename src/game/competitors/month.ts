import {
  BASE_MONTHLY_WAGE_MINOR,
  COMPETITOR_CREDIT_LINE_BP,
  COMPETITOR_OPEX_BP,
  FIXED_COST_ROOM_NIGHTS,
  POSTS_PER_HUNDRED_ROOMS,
} from "../content/1991/cityMarket";
import { accrueMonthlyInterestMinor } from "../finance/loans";
import { marketWageMinor } from "../labor/market";
import { buildCostMinor } from "../property/market";

/**
 * A rival's month, at lower detail than the player's hotel but on exactly the
 * same economics: it sells nights at its own rate, staffs its rooms out of
 * the city labour market, and services its debt at the going rate. No rival
 * gets money the player could not have earned.
 */

/** Annual interest a rival pays on its debt, in basis points. */
export const COMPETITOR_DEBT_RATE_BP = 900;

export interface CompetitorMonth {
  revenueMinor: number;
  wageMinor: number;
  /** Cost that varies with the nights actually sold. */
  opexMinor: number;
  /** Cost of holding the rooms open at all, sold or not. */
  fixedMinor: number;
  interestMinor: number;
  profitMinor: number;
}

/** Posts a house of this size has to fill. */
export function postsForRooms(rooms: number): number {
  if (!Number.isSafeInteger(rooms) || rooms < 0)
    throw new Error("invalid rooms");
  return Math.round((rooms * POSTS_PER_HUNDRED_ROOMS) / 100);
}

/** What a lender will still advance against a house, in whole Pfennig. */
export function creditLineMinor(rooms: number, landPriceMinor: number): number {
  if (rooms === 0) return 0;
  return Math.round(
    (buildCostMinor({ rooms, landPriceMinor }) * COMPETITOR_CREDIT_LINE_BP) /
      10000,
  );
}

export function competitorMonth(
  house: { rooms: number; rateMinor: number; debtMinor: number },
  market: { soldRoomNights: number; wagePressureBp: number },
): CompetitorMonth {
  for (const [label, value] of [
    ["rooms", house.rooms],
    ["rate", house.rateMinor],
    ["debt", house.debtMinor],
  ] as const)
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`invalid ${label}`);
  if (!Number.isSafeInteger(market.soldRoomNights) || market.soldRoomNights < 0)
    throw new Error("invalid sold room nights");
  const revenueMinor = market.soldRoomNights * house.rateMinor;
  const wageMinor =
    postsForRooms(house.rooms) *
    marketWageMinor(BASE_MONTHLY_WAGE_MINOR, market.wagePressureBp);
  const opexMinor = Math.round((revenueMinor * COMPETITOR_OPEX_BP) / 10000);
  const fixedMinor = house.rooms * FIXED_COST_ROOM_NIGHTS * house.rateMinor;
  const interestMinor =
    house.debtMinor > 0
      ? accrueMonthlyInterestMinor({
          id: "competitor.loan",
          principalMinor: house.debtMinor,
          annualRateBasisPoints: COMPETITOR_DEBT_RATE_BP,
          termMonths: 240,
          amortisation: "bullet",
          rateType: "fixed",
          spreadBasisPoints: 0,
          startMonthIndex: 0,
          collateralValueMinor: 0,
        })
      : 0;
  for (const [label, value] of [
    ["revenue", revenueMinor],
    ["wage", wageMinor],
    ["opex", opexMinor],
    ["fixed", fixedMinor],
    ["interest", interestMinor],
  ] as const)
    if (!Number.isSafeInteger(value)) throw new Error(`invalid ${label}`);
  const profitMinor =
    revenueMinor - wageMinor - opexMinor - fixedMinor - interestMinor;
  if (!Number.isSafeInteger(profitMinor)) throw new Error("invalid profit");
  return {
    revenueMinor,
    wageMinor,
    opexMinor,
    fixedMinor,
    interestMinor,
    profitMinor,
  };
}
