import { parseDateKey } from "../domain/calendar";

/**
 * A new house does not open into its mature share of the market. It has no
 * repeat guests, no negotiated accounts and no local reputation, and it earns
 * all three over about three years.
 */
export const RAMP_UP_MONTHS = 36;

/** What a house captures on the day it opens, in basis points of maturity. */
const OPENING_CAPTURE_BP = 3500;

export function rampUpDemandFactorBasisPoints(
  monthsSinceOpening: number,
): number {
  if (!Number.isFinite(monthsSinceOpening) || monthsSinceOpening <= 0)
    return OPENING_CAPTURE_BP;
  if (monthsSinceOpening >= RAMP_UP_MONTHS) return 10_000;
  // Linear and integer: the curve is a balancing decision, not a place for a
  // transcendental function whose last digit can differ between platforms.
  return Math.min(
    10_000,
    OPENING_CAPTURE_BP +
      Math.trunc(
        (Math.trunc(monthsSinceOpening) * (10_000 - OPENING_CAPTURE_BP)) /
          RAMP_UP_MONTHS,
      ),
  );
}

/**
 * Whole calendar months a house has been trading. A house that opened on the
 * 31st has completed a month on the 30th of the following month, because the
 * month it lived through is what matters, not the day number.
 */
export function monthsOpen(openedDateKey: string, dateKey: string): number {
  const opened = parseDateKey(openedDateKey);
  const now = parseDateKey(dateKey);
  if (now <= opened) return 0;
  const [oy, om, od] = openedDateKey.split("-").map(Number);
  const [ny, nm, nd] = dateKey.split("-").map(Number);
  const months = (ny - oy) * 12 + (nm - om);
  // The last month is only complete once the day of the month has come round,
  // and a shorter target month completes on its own last day.
  const lastDayOfTargetMonth = new Date(
    Date.UTC(nm === 12 ? ny + 1 : ny, nm % 12, 1) - 86_400_000,
  ).getUTCDate();
  const anniversaryDay = Math.min(od, lastDayOfTargetMonth);
  return Math.max(0, nd >= anniversaryDay ? months : months - 1);
}
