import { assertCount, assertMinutes } from "../domain/units";
import { facilityRow } from "../facilities/facilityBoard";
/**
 * Room service is a logistics problem, not a menu: the plate has to leave the
 * kitchen, ride the lift, and walk the corridor before it counts as served.
 */
export interface DeliveryLegs {
  /** Preparation on the kitchen line. */
  kitchen: number;
  /** Waiting for and riding the guest lift. */
  elevator: number;
  /** Corridor travel and handover. */
  service: number;
}

/** What the card promises the guest, in simulated minutes. */
export const PROMISED_DELIVERY_MINUTES = 30;

/** Basis points of occupied rooms that order in one evening service. */
const ORDER_RATE_BP = 800;
/** Room service opens when the restaurant closes. */
export const ROOM_SERVICE_OPEN_MINUTE = 1290;
export const ROOM_SERVICE_CLOSE_MINUTE = 1440;

export function deliveryMinutes(i: DeliveryLegs): number {
  assertMinutes(i.kitchen, "kitchen minutes");
  assertMinutes(i.elevator, "lift minutes");
  assertMinutes(i.service, "service minutes");
  return i.kitchen + i.elevator + i.service;
}

/** Every order that missed the promised window is a complaint waiting to land. */
export function lateDeliveryComplaints(
  orders: number,
  minutes: number,
): number {
  assertCount(orders, "orders");
  assertMinutes(minutes, "delivery minutes");
  return minutes > PROMISED_DELIVERY_MINUTES ? orders : 0;
}

export function roomServiceOrders(x: {
  occupiedRooms: number;
  minuteOfDay: number;
}): number {
  assertCount(x.occupiedRooms, "occupied rooms");
  assertMinutes(x.minuteOfDay, "minute of day");
  if (
    x.minuteOfDay < ROOM_SERVICE_OPEN_MINUTE ||
    x.minuteOfDay >= ROOM_SERVICE_CLOSE_MINUTE
  )
    return 0;
  return Math.floor((Math.max(0, x.occupiedRooms) * ORDER_RATE_BP) / 10000);
}

export function roomServiceCapacity(x: {
  demand: number;
  kitchen: number;
  staffed: number;
  transport: number;
  elevator: number;
}): { served: number; cause: string } {
  for (const [label, value] of Object.entries(x)) assertCount(value, label);
  const binding = facilityRow({
    id: "fnb.roomService",
    name: "Room service",
    demand: x.demand,
    constraints: [
      { label: "facility.cause.kitchenLine", value: x.kitchen },
      { label: "facility.cause.serviceStaff", value: x.staffed },
      { label: "facility.cause.transport", value: x.transport },
      { label: "facility.cause.elevator", value: x.elevator },
    ],
  });
  return {
    served: Math.min(x.demand, binding.capacity),
    cause: binding.cause,
  };
}
