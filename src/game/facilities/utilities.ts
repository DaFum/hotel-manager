import { assertCount, assertNonNegativeMinor } from "../domain/units";

export interface UtilityDemand {
  id: string;
  waterUnits: number;
  energyUnits: number;
}

export interface UtilityState {
  waterCapacity: number;
  energyCapacity: number;
  waterUsed: number;
  energyUsed: number;
  expenseMinor: number;
  pendingExpenseMinor: number;
}

export function createUtilityState(): UtilityState {
  return {
    waterCapacity: 2000,
    energyCapacity: 3000,
    waterUsed: 0,
    energyUsed: 0,
    expenseMinor: 0,
    pendingExpenseMinor: 0,
  };
}

/** Meters all serviced areas in stable id order and charges actual usage. */
export function meterUtilities(
  state: UtilityState,
  demands: readonly UtilityDemand[],
  prices: { waterMinor: number; energyMinor: number },
): { state: UtilityState; causes: Record<string, string> } {
  for (const [label, value] of Object.entries(state))
    if (label === "expenseMinor") assertNonNegativeMinor(value, label);
    else assertCount(value, label);
  assertNonNegativeMinor(prices.waterMinor, "water price");
  assertNonNegativeMinor(prices.energyMinor, "energy price");
  let waterLeft = Math.max(0, state.waterCapacity - state.waterUsed);
  let energyLeft = Math.max(0, state.energyCapacity - state.energyUsed);
  let water = 0;
  let energy = 0;
  const causes: Record<string, string> = {};
  for (const demand of [...demands].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  )) {
    assertCount(demand.waterUnits, `${demand.id} water`);
    assertCount(demand.energyUnits, `${demand.id} energy`);
    const acceptedWater = Math.min(waterLeft, demand.waterUnits);
    const acceptedEnergy = Math.min(energyLeft, demand.energyUnits);
    water += acceptedWater;
    energy += acceptedEnergy;
    if (!Number.isSafeInteger(water) || !Number.isSafeInteger(energy))
      throw new Error("unsafe utility usage");
    waterLeft -= acceptedWater;
    energyLeft -= acceptedEnergy;
    causes[demand.id] =
      acceptedWater < demand.waterUnits
        ? "water capacity"
        : acceptedEnergy < demand.energyUnits
          ? "energy capacity"
          : "demand";
  }
  const waterUsed = state.waterUsed + water;
  const energyUsed = state.energyUsed + energy;
  const expenseMinor =
    state.expenseMinor +
    water * prices.waterMinor +
    energy * prices.energyMinor;
  const pendingExpenseMinor =
    state.pendingExpenseMinor +
    water * prices.waterMinor +
    energy * prices.energyMinor;
  if (
    !Number.isSafeInteger(waterUsed) ||
    !Number.isSafeInteger(energyUsed) ||
    !Number.isSafeInteger(expenseMinor) ||
    !Number.isSafeInteger(pendingExpenseMinor)
  )
    throw new Error("unsafe utility total");
  return {
    state: {
      ...state,
      waterUsed,
      energyUsed,
      expenseMinor,
      pendingExpenseMinor,
    },
    causes,
  };
}
