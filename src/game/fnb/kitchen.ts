import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
} from "../domain/units";
import { facilityRow } from "../facilities/facilityBoard";

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
    else if (label === "wasteBp") assertBasisPoints(value, label);
    else assertCount(value, label);
  }
  if (x.wasteBp > 10000) throw new Error("invalid waste basis points");
  const demand = x.boardCovers + x.aLaCarteCovers;
  if (!Number.isSafeInteger(demand)) throw new Error("unsafe kitchen demand");
  const binding = facilityRow({
    id: "facility.kitchen",
    name: "Kitchen",
    demand,
    constraints: [
      { label: "facility.cause.demand", value: demand },
      { label: "facility.cause.stock", value: x.stock },
      { label: "facility.cause.miseEnPlace", value: x.prepared },
    ],
  });
  const prepared = Math.min(x.prepared, x.stock);
  const served = binding.capacity;
  const substituted = Math.min(x.allergyCovers, x.substitutionStock, served);
  const unused = Math.max(0, prepared - served);
  const wasted = Math.min(unused, Math.round((prepared * x.wasteBp) / 10000));
  const consumed = served + wasted;
  if (!Number.isSafeInteger(consumed)) throw new Error("unsafe kitchen usage");
  const ingredientExpenseMinor = consumed * x.ingredientMinor;
  if (!Number.isSafeInteger(ingredientExpenseMinor))
    throw new Error("unsafe kitchen expense");
  return {
    served,
    substituted,
    wasted,
    stockLeft: x.stock - served - wasted,
    ingredientExpenseMinor,
    cause: binding.cause,
  };
}
