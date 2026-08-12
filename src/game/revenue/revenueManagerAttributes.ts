export interface RevenueManagerAttributes {
  PricingStrategy: number;
  RiskTolerance: number;
}

export function createRevenueManagerAttributes(
  input: Partial<RevenueManagerAttributes> = {},
): RevenueManagerAttributes {
  const result = {
    PricingStrategy: input.PricingStrategy ?? 50,
    RiskTolerance: input.RiskTolerance ?? 50,
  };
  for (const [name, value] of Object.entries(result))
    if (!Number.isSafeInteger(value) || value < 0 || value > 100)
      throw new Error(`${name} must be a whole 0..100 score`);
  // ForecastSkill, ChannelSkill and GroupBusinessSkill remain deferred until
  // each has a real behavioural consumer.
  return result;
}
