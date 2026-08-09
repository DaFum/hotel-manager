import { assertMinor, assertNonNegativeMinor } from "../domain/units";

/**
 * What a hotel is allowed to spend without asking. The budget is the quiet
 * half of delegation: a manager with authority and no budget can decide
 * nothing, and a manager with budget and no authority can decide anything.
 */
export interface HotelBudget {
  capexBudgetMinor: number;
  capexSpentMinor: number;
}

/** A budget as the group assigns it, for one hotel and one period. */
export interface AssignedHotelBudget extends HotelBudget {
  hotelId: string;
  /** The period the allowance belongs to; a new period is a new allowance. */
  periodKey: string;
  operatingBudgetMinor: number;
}

export function createHotelBudget(input: {
  hotelId: string;
  periodKey: string;
  capexBudgetMinor: number;
  operatingBudgetMinor: number;
}): AssignedHotelBudget {
  if (!input.hotelId) throw new Error("a hotel id is required");
  if (!input.periodKey) throw new Error("a budget period is required");
  assertNonNegativeMinor(input.capexBudgetMinor, "capex budget");
  assertNonNegativeMinor(input.operatingBudgetMinor, "operating budget");
  return { ...input, capexSpentMinor: 0 };
}

export function canSpendCapex(
  budget: HotelBudget,
  amountMinor: number,
): boolean {
  return (
    Number.isSafeInteger(amountMinor) &&
    amountMinor >= 0 &&
    budget.capexSpentMinor + amountMinor <= budget.capexBudgetMinor
  );
}

export function spendableCapexMinor(budget: HotelBudget): number {
  return Math.max(0, budget.capexBudgetMinor - budget.capexSpentMinor);
}

/**
 * Draws on the allowance. Refusing throws rather than clamping: a spend the
 * budget cannot carry is an escalation, not a smaller spend.
 */
export function recordCapexSpend<T extends HotelBudget>(
  budget: T,
  amountMinor: number,
): T {
  if (!canSpendCapex(budget, amountMinor))
    throw new Error(
      `capex of ${amountMinor} exceeds the remaining budget of ${spendableCapexMinor(budget)}`,
    );
  return { ...budget, capexSpentMinor: budget.capexSpentMinor + amountMinor };
}

/**
 * How the hotel did against the target it was given. The sign is kept and
 * named: a group that only ever sees an absolute variance cannot tell a house
 * that beat its number from one that missed it.
 */
export function budgetVariance(input: {
  targetMinor: number;
  actualMinor: number;
  type: "revenue" | "cost";
}): {
  varianceMinor: number;
  varianceBasisPoints: number;
  favourable: boolean;
} {
  assertMinor(input.targetMinor, "variance target");
  assertMinor(input.actualMinor, "variance actual");
  const varianceMinor = input.actualMinor - input.targetMinor;
  return {
    varianceMinor,
    varianceBasisPoints:
      input.targetMinor === 0
        ? 0
        : Math.trunc((varianceMinor * 10_000) / input.targetMinor),
    favourable:
      input.type === "revenue" ? varianceMinor >= 0 : varianceMinor <= 0,
  };
}

/** A new period restates the allowance and starts the spend at nothing. */
export function resetBudgetPeriod(
  budget: AssignedHotelBudget,
  periodKey: string,
  restated: Partial<
    Pick<AssignedHotelBudget, "capexBudgetMinor" | "operatingBudgetMinor">
  > = {},
): AssignedHotelBudget {
  if (!periodKey) throw new Error("a budget period is required");
  const capexBudgetMinor = restated.capexBudgetMinor ?? budget.capexBudgetMinor;
  const operatingBudgetMinor =
    restated.operatingBudgetMinor ?? budget.operatingBudgetMinor;
  assertNonNegativeMinor(capexBudgetMinor, "capex budget");
  assertNonNegativeMinor(operatingBudgetMinor, "operating budget");
  return {
    hotelId: budget.hotelId,
    periodKey,
    capexBudgetMinor,
    capexSpentMinor: 0,
    operatingBudgetMinor,
  };
}
