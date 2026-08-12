export type ExplainableChange =
  | "occupancyDown"
  | "occupancyUp"
  | "profitDown"
  | "satisfactionDown"
  | "rateChanged";

export interface CauseDriver {
  factor: string;
  weight: number;
}

export interface CauseExplanation {
  key: string;
  values: Record<string, string | number>;
  drivers: CauseDriver[];
}

/**
 * Every player-visible number must be explainable, so drivers are ranked by
 * weight and rendered in one deterministic sentence.
 */
export function explainCause(
  change: ExplainableChange,
  drivers: readonly CauseDriver[],
): CauseExplanation {
  if (drivers.length === 0)
    return { key: `explanation.${change}.empty`, values: {}, drivers: [] };
  // Code-unit order, not localeCompare: authoritative ordering must not depend
  // on the worker's locale.
  const ranked = [...drivers].sort(
    (a, b) =>
      b.weight - a.weight ||
      (a.factor < b.factor ? -1 : a.factor > b.factor ? 1 : 0),
  );
  return {
    key: `explanation.${change}.drivers`,
    values: {},
    drivers: ranked,
  };
}
