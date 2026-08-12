export type ExplainableChange =
  "occupancyDown" | "occupancyUp" | "profitDown" | "satisfactionDown";

export interface CauseDriver {
  factor: string;
  weight: number;
}

export interface CauseExplanation {
  key: string;
  values: Record<string, string | number>;
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
    return { key: `explanation.${change}.empty`, values: {} };
  // Code-unit order, not localeCompare: authoritative ordering must not depend
  // on the worker's locale.
  const ranked = [...drivers].sort(
    (a, b) =>
      b.weight - a.weight ||
      (a.factor < b.factor ? -1 : a.factor > b.factor ? 1 : 0),
  );
  const phrases = ranked.map((d) => `${d.factor} (${d.weight}%)`);
  const list =
    phrases.length === 1
      ? phrases[0]
      : `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
  return {
    key: `explanation.${change}.drivers`,
    values: { drivers: list },
  };
}
