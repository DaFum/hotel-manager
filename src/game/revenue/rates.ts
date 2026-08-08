export type RoomCategory = "single" | "double" | "suite";

/** Rate grid keyed by `${isoDate}/${category}`, priced in Pfennig. */
export type RateGrid = Record<string, number>;

/** Slice bounds keep 1991 room rates inside a plausible Frankfurt band. */
export const MIN_RATE_MINOR = 3000;
export const MAX_RATE_MINOR = 50000;

export function rateKey(isoDate: string, category: string): string {
  return `${isoDate}/${category}`;
}

export function setRate(
  grid: RateGrid,
  isoDate: string,
  category: string,
  rateMinor: number,
): RateGrid {
  if (!Number.isInteger(rateMinor)) throw new Error("rate must be integer");
  if (rateMinor < MIN_RATE_MINOR || rateMinor > MAX_RATE_MINOR)
    throw new Error("rate outside slice bounds");
  return { ...grid, [rateKey(isoDate, category)]: rateMinor };
}

export function getRate(
  grid: RateGrid,
  isoDate: string,
  category: string,
  defaultRateMinor: number,
): number {
  return grid[rateKey(isoDate, category)] ?? defaultRateMinor;
}

/** Corporate contracts trade a fixed discount for guaranteed volume. */
export function corporateRateMinor(
  rateMinor: number,
  discountBasisPoints: number,
): number {
  if (discountBasisPoints < 0 || discountBasisPoints > 10000)
    throw new Error("invalid discount");
  return Math.round((rateMinor * (10000 - discountBasisPoints)) / 10000);
}
