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
  const prepared = Math.min(x.prepared, x.stock);
  const substituted = Math.min(x.allergyCovers, x.substitutionStock, prepared);
  const served = Math.min(demand, prepared);
  const unused = Math.max(0, prepared - served);
  const wasted = Math.min(unused, Math.round((prepared * x.wasteBp) / 10000));
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
    ingredientExpenseMinor: (served + wasted) * x.ingredientMinor,
    cause,
  };
}
