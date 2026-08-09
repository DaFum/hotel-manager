export const ENGLISH_TEXT = {
  "competitor.strategy.budget": "Budget operator",
  "competitor.strategy.luxury": "Luxury house",
  "competitor.strategy.family": "Family hotel",
  "competitor.strategy.lifestyle": "Lifestyle brand",
  "competitor.strategy.aggressive": "Aggressive investor",
  "alert.recovery.noFrontDesk": "Nobody is on the desk to authorise it.",
  "alert.recovery.insufficientCash": "The hotel cannot cover the discount.",
  "alert.cause.unknown": "An operational issue needs attention.",
  "facility.cause.kitchenLine": "kitchen line",
  "save.loading": "Loading…",
  "save.recovering": "Recovering…",
  "save.loadingMonthly": "Loading monthly autosave…",
} as const;

export type LocalizationKey = keyof typeof ENGLISH_TEXT;

/** Presentation-edge lookup until Plan 08 supplies locale-selected catalogs. */
export function translate(key: LocalizationKey): string {
  return ENGLISH_TEXT[key];
}

export function translateAlertCause(key: string): string {
  return (
    ENGLISH_TEXT[key as LocalizationKey] ?? ENGLISH_TEXT["alert.cause.unknown"]
  );
}
