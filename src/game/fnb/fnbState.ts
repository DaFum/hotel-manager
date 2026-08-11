import { STARTER_HOTEL } from "../content/1991/starterHotel";
import {
  assertBasisPoints,
  assertCount,
  assertMinutes,
  assertNonNegativeMinor,
} from "../domain/units";

export const FNB_OUTLET_IDS = [
  "breakfastRoom",
  "bar",
  "roomService",
  "restaurant",
] as const;

export type FnbOutletId = (typeof FNB_OUTLET_IDS)[number];
export type FnbConstraintKey = `facility.cause.${string}`;

export interface FnbOutletState {
  id: FnbOutletId;
  seats: number;
  reservedSeats: number;
  demand: number;
  capacity: number;
  served: number;
  waitlisted: number;
  serviceThroughput: number;
  kitchenThroughput: number;
  stockLeft: number;
  wastedCovers: number;
  ingredientExpenseMinor: number;
  averageWaitMinutes: number;
  serviceUtilizationBp: number;
  kitchenUtilizationBp: number;
  cause: FnbConstraintKey;
}

export interface FnbState {
  outlets: FnbOutletState[];
}

const OUTLET_INTEGER_FIELDS = [
  "seats",
  "reservedSeats",
  "demand",
  "capacity",
  "served",
  "waitlisted",
  "serviceThroughput",
  "kitchenThroughput",
  "stockLeft",
  "wastedCovers",
  "ingredientExpenseMinor",
  "averageWaitMinutes",
  "serviceUtilizationBp",
  "kitchenUtilizationBp",
] as const satisfies readonly (keyof FnbOutletState)[];

export function isFnbState(value: unknown): value is FnbState {
  if (!value || typeof value !== "object") return false;
  const outlets = (value as { outlets?: unknown }).outlets;
  if (!Array.isArray(outlets) || outlets.length !== FNB_OUTLET_IDS.length)
    return false;
  return outlets.every((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return false;
    const outlet = candidate as Record<string, unknown>;
    if (outlet.id !== FNB_OUTLET_IDS[index]) return false;
    if (
      OUTLET_INTEGER_FIELDS.some(
        (field) =>
          !Number.isSafeInteger(outlet[field]) || (outlet[field] as number) < 0,
      )
    )
      return false;
    if (
      typeof outlet.cause !== "string" ||
      !outlet.cause.startsWith("facility.cause.")
    )
      return false;
    if (
      (outlet.serviceUtilizationBp as number) > 1_000_000 ||
      (outlet.kitchenUtilizationBp as number) > 1_000_000
    )
      return false;
    return (
      (outlet.served as number) <= (outlet.demand as number) &&
      (outlet.served as number) <= (outlet.capacity as number)
    );
  });
}

function createOutlet(
  id: FnbOutletId,
  seats: number,
  kitchenThroughput: number,
): FnbOutletState {
  return {
    id,
    seats: assertCount(seats, `${id} seats`),
    reservedSeats: assertCount(0, `${id} reserved seats`),
    demand: assertCount(0, `${id} demand`),
    capacity: assertCount(0, `${id} capacity`),
    served: assertCount(0, `${id} served covers`),
    waitlisted: assertCount(0, `${id} waitlist`),
    serviceThroughput: assertCount(0, `${id} service throughput`),
    kitchenThroughput: assertCount(
      kitchenThroughput,
      `${id} kitchen throughput`,
    ),
    stockLeft: assertCount(0, `${id} stock left`),
    wastedCovers: assertCount(0, `${id} wasted covers`),
    ingredientExpenseMinor: assertNonNegativeMinor(
      0,
      `${id} ingredient expense`,
    ),
    averageWaitMinutes: assertMinutes(0, `${id} average wait`),
    serviceUtilizationBp: assertBasisPoints(0, `${id} service utilization`),
    kitchenUtilizationBp: assertBasisPoints(0, `${id} kitchen utilization`),
    cause: "facility.cause.closed",
  };
}

export function createFnbState(): FnbState {
  return {
    outlets: [
      createOutlet(
        "breakfastRoom",
        STARTER_HOTEL.breakfastSeats,
        STARTER_HOTEL.kitchenCovers,
      ),
      createOutlet("bar", STARTER_HOTEL.barSeats, STARTER_HOTEL.kitchenCovers),
      createOutlet("roomService", 0, STARTER_HOTEL.kitchenCovers),
      createOutlet(
        "restaurant",
        STARTER_HOTEL.restaurantSeats,
        STARTER_HOTEL.kitchenCovers,
      ),
    ],
  };
}
