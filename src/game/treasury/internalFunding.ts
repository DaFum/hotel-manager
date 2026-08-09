import { hotelCashMinor, type TreasuryState } from "./treasury";

/**
 * Money moving inside the group. An internal transfer is not income and not
 * expense: it changes where the cash is and nothing else, so the consolidated
 * total is the invariant every one of these functions preserves.
 */
export function transferInternalFunding(
  balances: { fromMinor: number; toMinor: number },
  amountMinor: number,
): { fromMinor: number; toMinor: number } {
  if (
    !Number.isSafeInteger(balances.fromMinor) ||
    balances.fromMinor < 0 ||
    !Number.isSafeInteger(balances.toMinor) ||
    balances.toMinor < 0 ||
    !Number.isSafeInteger(amountMinor) ||
    amountMinor < 0 ||
    amountMinor > balances.fromMinor ||
    !Number.isSafeInteger(balances.toMinor + amountMinor)
  )
    throw new Error(
      `invalid transfer of ${amountMinor} from ${balances.fromMinor}`,
    );
  return {
    fromMinor: balances.fromMinor - amountMinor,
    toMinor: balances.toMinor + amountMinor,
  };
}

/** Downstream funding: headquarters puts cash into a hotel's account. */
export function fundHotel(
  treasury: TreasuryState,
  hotelId: string,
  amountMinor: number,
): TreasuryState {
  const moved = transferInternalFunding(
    {
      fromMinor: treasury.hqMinor,
      toMinor: hotelCashMinor(treasury, hotelId),
    },
    amountMinor,
  );
  return {
    ...treasury,
    hqMinor: moved.fromMinor,
    hotelCashMinor: {
      ...treasury.hotelCashMinor,
      [hotelId]: moved.toMinor,
    },
  };
}

/**
 * Upstream sweep: the centre draws surplus cash out of a hotel. It refuses to
 * overdraw the house, because a sweep that leaves a hotel unable to pay its
 * wages is a decision the group must take deliberately, not by arithmetic.
 */
export function sweepToHeadquarters(
  treasury: TreasuryState,
  hotelId: string,
  amountMinor: number,
): TreasuryState {
  const moved = transferInternalFunding(
    {
      fromMinor: hotelCashMinor(treasury, hotelId),
      toMinor: treasury.hqMinor,
    },
    amountMinor,
  );
  return {
    ...treasury,
    hqMinor: moved.toMinor,
    hotelCashMinor: { ...treasury.hotelCashMinor, [hotelId]: moved.fromMinor },
  };
}
