export type MarketHealthWarning =
  | "no-active-competitors"
  | "extreme-concentration"
  | "no-strategy-diversity"
  | "price-wage-decoupling";
export interface MarketHealthInput {
  activeCompetitors: number;
  largestShareBasisPoints: number;
  strategyCount?: number;
  adrIndexBasisPoints?: number;
  wageIndexBasisPoints?: number;
}

export function marketHealthWarnings(
  market: MarketHealthInput,
): MarketHealthWarning[] {
  for (const [label, value] of [
    ["active competitors", market.activeCompetitors],
    ["strategy count", market.strategyCount],
  ] as const) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0))
      throw new Error(`${label} must be a non-negative safe integer`);
  }
  for (const [label, value] of [
    ["largest share", market.largestShareBasisPoints],
    ["ADR index", market.adrIndexBasisPoints],
    ["wage index", market.wageIndexBasisPoints],
  ] as const) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) || value < 0 || value > 10_000)
    )
      throw new Error(`${label} must be integer basis points in 0..10,000`);
  }
  const warnings: MarketHealthWarning[] = [];
  if (market.activeCompetitors === 0) warnings.push("no-active-competitors");
  if (market.largestShareBasisPoints >= 9_000)
    warnings.push("extreme-concentration");
  if (market.activeCompetitors > 1 && (market.strategyCount ?? 2) < 2)
    warnings.push("no-strategy-diversity");
  if (
    market.adrIndexBasisPoints !== undefined &&
    market.wageIndexBasisPoints !== undefined &&
    Math.abs(market.adrIndexBasisPoints - market.wageIndexBasisPoints) > 5_000
  )
    warnings.push("price-wage-decoupling");
  return warnings;
}
