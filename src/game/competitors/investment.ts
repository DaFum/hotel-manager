/**
 * What a rival owner does with a year's earnings. The rule is the one the
 * player faces: a house only builds when the return justifies the debt its
 * owner is willing to carry.
 */
export type InvestmentAction = "expand" | "renovate" | "hold";

/** Cash and borrowing used for a build, or null when it cannot be funded. */
export function expansionFunding(
  costMinor: number,
  cashAvailableMinor: number,
  debtHeadroomMinor: number,
): { cashMinor: number; debtMinor: number } | null {
  for (const [label, value] of [
    ["cost", costMinor],
    ["cash", cashAvailableMinor],
    ["debt headroom", debtHeadroomMinor],
  ] as const)
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`invalid expansion ${label}`);
  const debtMinor = Math.min(costMinor, debtHeadroomMinor);
  const cashMinor = costMinor - debtMinor;
  return cashMinor <= cashAvailableMinor ? { cashMinor, debtMinor } : null;
}

/** Return that justifies new rooms, in basis points of capital employed. */
export const EXPANSION_HURDLE_BP = 900;
/** Return that at least justifies keeping the product current. */
export const RENOVATION_HURDLE_BP = 400;

export function chooseInvestment(i: {
  returnBp: number;
  debtBp: number;
  toleranceBp: number;
}): InvestmentAction {
  for (const [label, value] of [
    ["return", i.returnBp],
    ["debt", i.debtBp],
    ["tolerance", i.toleranceBp],
  ] as const)
    if (!Number.isFinite(value)) throw new Error(`invalid ${label}`);
  // Leverage first: a good return does not make an over-borrowed house
  // creditworthy, and no rival gets credit the player could not get.
  if (i.debtBp > i.toleranceBp) return "hold";
  if (i.returnBp >= EXPANSION_HURDLE_BP) return "expand";
  if (i.returnBp >= RENOVATION_HURDLE_BP) return "renovate";
  return "hold";
}

/** Return on the capital actually employed, in basis points. */
export function returnOnCapitalBp(
  profitMinor: number,
  capitalEmployedMinor: number,
): number {
  if (!Number.isFinite(profitMinor)) throw new Error("invalid profit");
  if (!Number.isFinite(capitalEmployedMinor) || capitalEmployedMinor < 0)
    throw new Error("invalid capital employed");
  if (capitalEmployedMinor === 0) return 0;
  return Math.round((profitMinor * 10000) / capitalEmployedMinor);
}
