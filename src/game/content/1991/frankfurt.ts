/** Frankfurt am Main, 1991: the single market the vertical slice plays in. */
export const CITY = {
  id: "city.frankfurt",
  name: "Frankfurt",
  country: "Germany",
  currency: "DM",
  startDateKey: "1991-01-01",
} as const;

/** Basis points of baseline demand by month, 1-indexed (trade fairs in spring). */
export const SEASONALITY_BP = [
  8000, 9000, 11000, 12000, 11000, 10000, 8500, 8000, 11000, 12000, 10000, 7000,
] as const;

export function seasonalityBp(dateKey: string): number {
  return SEASONALITY_BP[Number(dateKey.slice(5, 7)) - 1] ?? 10000;
}
