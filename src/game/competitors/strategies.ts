/**
 * How a rival hotelier thinks. A strategy is the only thing a competitor has
 * that the player does not: it faces the same demand, wages, land prices and
 * credit, and it sees the market through the same fog the player does.
 */
export type Strategy =
  "budget" | "luxury" | "family" | "lifestyle" | "aggressive";

export const STRATEGIES: readonly Strategy[] = [
  "budget",
  "luxury",
  "family",
  "lifestyle",
  "aggressive",
];

export interface StrategyProfile {
  name: string;
  /** Where the house prices itself against the market, in basis points. */
  positioningBp: number;
  /** Debt the owner will carry, in basis points of asset value. */
  targetLeverageBp: number;
  /** How hard it chases occupancy when it is soft, in basis points. */
  discountAppetiteBp: number;
}

const PROFILES: Record<Strategy, StrategyProfile> = {
  budget: {
    name: "Budget operator",
    positioningBp: 7000,
    targetLeverageBp: 4500,
    discountAppetiteBp: 1200,
  },
  luxury: {
    name: "Luxury house",
    positioningBp: 14000,
    targetLeverageBp: 3000,
    discountAppetiteBp: 400,
  },
  family: {
    name: "Family hotel",
    positioningBp: 9500,
    targetLeverageBp: 1800,
    discountAppetiteBp: 600,
  },
  lifestyle: {
    name: "Lifestyle brand",
    positioningBp: 11500,
    targetLeverageBp: 3500,
    discountAppetiteBp: 800,
  },
  aggressive: {
    name: "Aggressive investor",
    positioningBp: 10000,
    targetLeverageBp: 6500,
    discountAppetiteBp: 2000,
  },
};

export function strategyProfile(strategy: Strategy): StrategyProfile {
  const profile = PROFILES[strategy];
  if (!profile) throw new Error(`unknown strategy ${strategy}`);
  return profile;
}

export function targetLeverageBp(strategy: Strategy): number {
  return strategyProfile(strategy).targetLeverageBp;
}

/** Widest a competitor's read of the market can be wrong, in basis points. */
export const OBSERVATION_ERROR_BP = 1000;

/**
 * What a rival believes the market rate is. Nobody in the city has the true
 * figure: the observation is drawn from the caller's AI stream, so it is
 * deterministic per roll and bounded by the declared error band.
 */
export function observedMarketRateMinor(
  trueRateMinor: number,
  rollBp: number,
): number {
  if (!Number.isSafeInteger(trueRateMinor) || trueRateMinor < 0)
    throw new Error("invalid market rate");
  if (!Number.isFinite(rollBp) || rollBp < 0)
    throw new Error("invalid observation roll");
  // Map the roll onto [-error, +error] so the whole band is reachable.
  const errorBp =
    (Math.round(rollBp) % (2 * OBSERVATION_ERROR_BP + 1)) -
    OBSERVATION_ERROR_BP;
  return Math.round((trueRateMinor * (10000 + errorBp)) / 10000);
}
