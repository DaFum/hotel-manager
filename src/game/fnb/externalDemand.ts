export interface ExternalDemandInput {
  /** Covers the outlet draws from the city at market price and average repute. */
  baseCovers: number;
  /** Month seasonality, in basis points of the baseline. */
  seasonalityBp: number;
  /** Own price against the comparable city price, in basis points. */
  priceIndexBp: number;
  /** Outlet reputation, in basis points. */
  reputationBp: number;
}

/** Covers lost per basis point above the comparable market price. */
const PRICE_ELASTICITY_BP = 15000;

/**
 * Non-resident demand for the restaurant and bar. Deterministic and stepwise
 * so each cause stays inspectable: season, price, then reputation.
 */
export function externalCovers(x: ExternalDemandInput): number {
  const priceBp = Math.max(
    0,
    10000 -
      Math.round(((x.priceIndexBp - 10000) * PRICE_ELASTICITY_BP) / 10000),
  );
  const reputationBp = 5000 + Math.floor(Math.max(0, x.reputationBp) / 2);
  let covers = Math.max(0, Math.floor(x.baseCovers));
  covers = Math.floor((covers * Math.max(0, x.seasonalityBp)) / 10000);
  covers = Math.floor((covers * priceBp) / 10000);
  covers = Math.floor((covers * reputationBp) / 10000);
  return covers;
}
