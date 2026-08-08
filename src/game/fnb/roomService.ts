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
  return i.kitchen + i.elevator + i.service;
}

/** Every order that missed the promised window is a complaint waiting to land. */
export function lateDeliveryComplaints(
  orders: number,
  minutes: number,
): number {
  return minutes > PROMISED_DELIVERY_MINUTES ? Math.max(0, orders) : 0;
}

export function roomServiceOrders(x: {
  occupiedRooms: number;
  minuteOfDay: number;
}): number {
  if (
    x.minuteOfDay < ROOM_SERVICE_OPEN_MINUTE ||
    x.minuteOfDay >= ROOM_SERVICE_CLOSE_MINUTE
  )
    return 0;
  return Math.floor((Math.max(0, x.occupiedRooms) * ORDER_RATE_BP) / 10000);
}
