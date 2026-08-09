import { compareIds } from "../domain/ids";
import { assertMinor } from "../domain/units";

/**
 * Where the group's money actually is. Consolidated cash is a sum, never a
 * pot: a group that is rich in Munich and insolvent in Frankfurt is a real
 * situation, and flattening it into one balance would hide it.
 */
export interface TreasuryState {
  /** Headquarters' own cash, in the group's reporting currency's minor unit. */
  hqMinor: number;
  /** Cash held at each hotel, keyed by hotel id. */
  hotelCashMinor: Record<string, number>;
  /** The group's reporting currency, for the consolidated view. */
  reportingCurrency: string;
}

export function createTreasury(input: {
  hqMinor: number;
  reportingCurrency: string;
}): TreasuryState {
  assertMinor(input.hqMinor, "headquarters cash");
  if (!input.reportingCurrency)
    throw new Error("a reporting currency is required");
  return {
    hqMinor: input.hqMinor,
    hotelCashMinor: {},
    reportingCurrency: input.reportingCurrency,
  };
}

export function openHotelAccount(
  treasury: TreasuryState,
  hotelId: string,
  openingMinor = 0,
): TreasuryState {
  if (!hotelId.trim()) throw new Error("a hotel id is required");
  if (Object.hasOwn(treasury.hotelCashMinor, hotelId))
    throw new Error(`hotel ${hotelId} already has a treasury account`);
  assertMinor(openingMinor, "opening balance");
  return {
    ...treasury,
    hotelCashMinor: { ...treasury.hotelCashMinor, [hotelId]: openingMinor },
  };
}

export function hotelCashMinor(
  treasury: TreasuryState,
  hotelId: string,
): number {
  // A blank id is a caller mistake, not an account that happens to be missing.
  if (!hotelId.trim()) throw new Error("a hotel id is required");
  // An own-property check, so an inherited key such as `toString` can never
  // be read as a balance the group does not have.
  if (!Object.hasOwn(treasury.hotelCashMinor, hotelId))
    throw new Error(`hotel ${hotelId} has no treasury account`);
  return treasury.hotelCashMinor[hotelId];
}

/** The group's cash, summed in stable id order so the total is reproducible. */
export function consolidatedCashMinor(treasury: TreasuryState): number {
  return Object.keys(treasury.hotelCashMinor)
    .sort(compareIds)
    .reduce(
      (sum, hotelId) => sum + treasury.hotelCashMinor[hotelId],
      treasury.hqMinor,
    );
}

/** Accounts that are overdrawn, so a funding decision has somewhere to start. */
export function overdrawnHotels(treasury: TreasuryState): string[] {
  return Object.keys(treasury.hotelCashMinor)
    .filter((hotelId) => treasury.hotelCashMinor[hotelId] < 0)
    .sort(compareIds);
}

/**
 * Currency the group is exposed to and how much sits in it. Exposure is
 * reported per currency rather than netted, because a hedge against one
 * currency does not cover another.
 */
export function currencyExposureMinor(
  treasury: TreasuryState,
  currencyByHotel: Record<string, string>,
): Record<string, number> {
  const exposure: Record<string, number> = {
    [treasury.reportingCurrency]: treasury.hqMinor,
  };
  for (const hotelId of Object.keys(treasury.hotelCashMinor).sort(compareIds)) {
    const currency = currencyByHotel[hotelId] ?? treasury.reportingCurrency;
    exposure[currency] =
      (exposure[currency] ?? 0) + treasury.hotelCashMinor[hotelId];
  }
  return exposure;
}
