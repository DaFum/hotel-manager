import { assertCount, assertNonNegativeMinor } from "../domain/units";

export interface KitchenPlan {
  boardCovers: number;
  aLaCarteCovers: number;
  prepared: number;
  stock: number;
  allergyCovers: number;
  substitutionStock: number;
  ingredientMinor: number;
  wasteBp: number;
}

export interface KitchenResult {
  served: number;
  substituted: number;
  wasted: number;
  stockLeft: number;
  ingredientExpenseMinor: number;
  cause: string;
}

/** Resolves board and à-la-carte demand through one mise-en-place stock. */
export function runKitchenService(x: KitchenPlan): KitchenResult {
  for (const [label, value] of Object.entries(x)) {
    if (label === "ingredientMinor") assertNonNegativeMinor(value, label);
    else assertCount(value, label);
  }
  if (x.wasteBp > 10000) throw new Error("invalid waste basis points");
  const demand = x.boardCovers + x.aLaCarteCovers;
  if (!Number.isSafeInteger(demand)) throw new Error("unsafe kitchen demand");
  const prepared = Math.min(x.prepared, x.stock);
  const served = Math.min(demand, prepared);
  const substituted = Math.min(x.allergyCovers, x.substitutionStock, served);
  const unused = Math.max(0, prepared - served);
  const wasted = Math.min(unused, Math.round((prepared * x.wasteBp) / 10000));
  const consumed = served + wasted;
  if (!Number.isSafeInteger(consumed)) throw new Error("unsafe kitchen usage");
  const ingredientExpenseMinor = consumed * x.ingredientMinor;
  if (!Number.isSafeInteger(ingredientExpenseMinor))
    throw new Error("unsafe kitchen expense");
  const cause =
    served >= demand
      ? "demand"
      : x.stock <= x.prepared
        ? "kitchen stock"
        : "mise-en-place";
  return {
    served,
    substituted,
    wasted,
    stockLeft: x.stock - served - wasted,
    ingredientExpenseMinor,
    cause,
  };
}
