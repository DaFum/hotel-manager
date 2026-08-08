/** Breakfast runs 06:30 to 10:30 local hotel time. */
export const BREAKFAST_OPEN_MINUTE = 390;
export const BREAKFAST_CLOSE_MINUTE = 630;

export interface BreakfastInput {
  demand: number;
  seats: number;
  kitchenCovers: number;
  stock: number;
  priceMinor: number;
  minuteOfDay?: number;
}

export interface BreakfastResult {
  served: number;
  queue: number;
  stockLeft: number;
  revenueMinor: number;
}

export function serveBreakfast(x: BreakfastInput): BreakfastResult {
  const minute = x.minuteOfDay ?? 480;
  if (minute < BREAKFAST_OPEN_MINUTE || minute >= BREAKFAST_CLOSE_MINUTE)
    return { served: 0, queue: 0, stockLeft: x.stock, revenueMinor: 0 };
  const served = Math.min(x.demand, x.seats, x.kitchenCovers, x.stock);
  return {
    served,
    queue: x.demand - served,
    stockLeft: x.stock - served,
    revenueMinor: served * x.priceMinor,
  };
}
