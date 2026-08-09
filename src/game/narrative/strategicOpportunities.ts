export interface StrategicOpportunity {
  id: string;
  openedDateKey: string;
  resolveDateKey: string;
  investedMinor: number;
  companyValueMultiplierBasisPoints: number;
  status: "open" | "invested" | "resolved";
}
export function resolveInvestmentOutcome(input: {
  investedMinor: number;
  companyValueMultiplierBasisPoints: number;
}): number {
  const value = Math.trunc(
    (input.investedMinor * input.companyValueMultiplierBasisPoints) / 10_000,
  );
  return value - input.investedMinor;
}
