import { collateralCoverageBasisPoints } from "./debt";

export interface CreditStandingInputs {
  operatingCashFlowMinor: number;
  totalOutstandingMinor: number;
  cashMinor: number;
  equityMinor: number;
  hotelCount: number;
  reputationScore: number;
  totalCollateralValueMinor: number;
  paymentHistory: {
    onTimePayments: number;
    missedPayments: number;
    consecutiveMissedPayments: number;
  };
  macroInterestBp: number;
  financingAccessBonusBp?: number;
}

export interface CreditStandingResult {
  score: number;
  spreadBp: number;
  offeredRateBp: number;
  borrowingLimitMinor: number;
}

export function calculateCreditStanding(
  inputs: CreditStandingInputs,
): CreditStandingResult {
  let score = 50;

  // Cash flow factor
  if (inputs.operatingCashFlowMinor > 500_000) score += 15;
  else if (inputs.operatingCashFlowMinor > 0) score += 8;
  else if (inputs.operatingCashFlowMinor < 0) score -= 15;

  // Leverage factor (debt over equity / cash)
  const baseAssets = Math.max(1, inputs.cashMinor + Math.max(0, inputs.equityMinor));
  const leverageBp = Math.trunc((inputs.totalOutstandingMinor * 10_000) / baseAssets);
  if (leverageBp === 0) score += 15;
  else if (leverageBp < 3000) score += 10;
  else if (leverageBp < 6000) score += 0;
  else score -= 15;

  // Size factor (hotel count)
  if (inputs.hotelCount >= 5) score += 15;
  else if (inputs.hotelCount >= 2) score += 8;

  // Reputation factor (0-100)
  if (inputs.reputationScore >= 80) score += 10;
  else if (inputs.reputationScore >= 60) score += 5;
  else if (inputs.reputationScore < 40) score -= 10;

  // Collateral coverage factor
  const coverageBp = collateralCoverageBasisPoints({
    outstandingMinor: inputs.totalOutstandingMinor,
    collateralValueMinor: inputs.totalCollateralValueMinor,
  });
  if (coverageBp >= 15_000) score += 10;
  else if (coverageBp >= 10_000) score += 5;
  else if (coverageBp < 5000) score -= 10;

  // Payment history factor
  if (inputs.paymentHistory.missedPayments === 0 && inputs.paymentHistory.onTimePayments > 0) {
    score += Math.min(15, inputs.paymentHistory.onTimePayments * 2);
  } else {
    score -= inputs.paymentHistory.missedPayments * 5;
    score -= inputs.paymentHistory.consecutiveMissedPayments * 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Derived spread (higher standing = lower spread)
  // Spread ranges from 100bp (score 100) to 1000bp (score 0)
  const baseSpreadBp = Math.round(1000 - (score * 9));
  const financingRelief = inputs.financingAccessBonusBp ?? 0;
  const spreadBp = Math.max(0, baseSpreadBp - financingRelief);
  const offeredRateBp = Math.max(0, inputs.macroInterestBp + spreadBp);

  // Borrowing limit (total-debt ceiling for the company)
  // Base borrowing capacity driven by score and equity/cash/collateral
  const borrowingCapacityBase = Math.max(
    1_000_000,
    inputs.cashMinor * 3 + Math.max(0, inputs.equityMinor) * 2 + inputs.totalCollateralValueMinor,
  );
  const borrowingLimitMinor = Math.round((borrowingCapacityBase * (score + 20)) / 100);

  return {
    score,
    spreadBp,
    offeredRateBp,
    borrowingLimitMinor,
  };
}
