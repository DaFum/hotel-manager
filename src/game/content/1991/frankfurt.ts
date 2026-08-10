import { CORE_CONTENT_REGISTRY } from "../corePack";

const content = CORE_CONTENT_REGISTRY.getByKind("city.frankfurt", "city");

/** Frankfurt am Main, 1991: the single market the vertical slice plays in. */
export const CITY = Object.freeze({
  id: content.id,
  name: "Frankfurt",
  country: "Germany",
  currency: "DM",
  startDateKey: "1991-01-01",
});

/** Basis points of baseline demand by month, 1-indexed (trade fairs in spring). */
export const SEASONALITY_BP: readonly number[] = content.seasonalityBasisPoints;

export function seasonalityBp(dateKey: string): number {
  return SEASONALITY_BP[Number(dateKey.slice(5, 7)) - 1] ?? 10000;
}
