export const ENGLISH_TEXT = {
  "competitor.strategy.budget": "Budget operator",
  "competitor.strategy.luxury": "Luxury house",
  "competitor.strategy.family": "Family hotel",
  "competitor.strategy.lifestyle": "Lifestyle brand",
  "competitor.strategy.aggressive": "Aggressive investor",
} as const;

export type LocalizationKey = keyof typeof ENGLISH_TEXT;

/** Presentation-edge lookup until Plan 08 supplies locale-selected catalogs. */
export function translate(key: LocalizationKey): string {
  return ENGLISH_TEXT[key];
}
