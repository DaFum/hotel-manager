export type ExplainableChange =
  "occupancyDown" | "occupancyUp" | "profitDown" | "satisfactionDown";

export interface CauseDriver {
  factor: string;
  weight: number;
}

const HEADLINES: Record<ExplainableChange, string> = {
  occupancyDown: "Occupancy fell",
  occupancyUp: "Occupancy rose",
  profitDown: "Operating profit fell",
  satisfactionDown: "Guest satisfaction fell",
};

/**
 * Every player-visible number must be explainable, so drivers are ranked by
 * weight and rendered in one deterministic sentence.
 */
export function explainCause(
  change: ExplainableChange,
  drivers: readonly CauseDriver[],
): string {
  const headline = HEADLINES[change];
  if (drivers.length === 0) return `${headline} for no single dominant reason.`;
  const ranked = [...drivers].sort(
    (a, b) => b.weight - a.weight || a.factor.localeCompare(b.factor),
  );
  const phrases = ranked.map((d) => `${d.factor} (${d.weight}%)`);
  const list =
    phrases.length === 1
      ? phrases[0]
      : `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
  return `${headline} because ${list}.`;
}
