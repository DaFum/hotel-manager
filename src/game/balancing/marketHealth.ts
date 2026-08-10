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
