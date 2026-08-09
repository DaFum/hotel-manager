import { hotelCashMinor, type TreasuryState } from "./treasury";

/**
 * Money moving inside the group. An internal transfer is not income and not
 * expense: it changes where the cash is and nothing else, so the consolidated
 * total is the invariant every one of these functions preserves.
 */
export function transferInternalFunding(
  balances: { hqMinor: number; hotelMinor: number },
  amountMinor: number,
): { hqMinor: number; hotelMinor: number } {
  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor < 0 ||
    amountMinor > balances.hqMinor
  )
    throw new Error("invalid transfer");
  return {
    hqMinor: balances.hqMinor - amountMinor,
    hotelMinor: balances.hotelMinor + amountMinor,
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
      hqMinor: treasury.hqMinor,
      hotelMinor: hotelCashMinor(treasury, hotelId),
    },
    amountMinor,
  );
  return {
    ...treasury,
    hqMinor: moved.hqMinor,
    hotelCashMinor: {
      ...treasury.hotelCashMinor,
      [hotelId]: moved.hotelMinor,
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
      hqMinor: hotelCashMinor(treasury, hotelId),
      hotelMinor: treasury.hqMinor,
    },
    amountMinor,
  );
  return {
    ...treasury,
    hqMinor: moved.hotelMinor,
    hotelCashMinor: { ...treasury.hotelCashMinor, [hotelId]: moved.hqMinor },
  };
}
