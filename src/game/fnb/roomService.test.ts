import { expect, it } from "vitest";
import {
  deliveryMinutes,
  lateDeliveryComplaints,
  roomServiceOrders,
  PROMISED_DELIVERY_MINUTES,
} from "./roomService";
import { barCovers, barRevenueMinor, BAR_OPEN_MINUTE } from "./barService";

it("includes kitchen elevator and service travel time", () => {
  expect(deliveryMinutes({ kitchen: 12, elevator: 4, service: 6 })).toBe(22);
});

it("counts a delivery as late only past the promised window", () => {
  expect(lateDeliveryComplaints(3, PROMISED_DELIVERY_MINUTES)).toBe(0);
  expect(lateDeliveryComplaints(3, PROMISED_DELIVERY_MINUTES + 1)).toBe(3);
});

it("draws room-service orders from occupied rooms at night", () => {
  // Nobody orders while the restaurant is open.
  expect(roomServiceOrders({ occupiedRooms: 20, minuteOfDay: 780 })).toBe(0);
  expect(
    roomServiceOrders({ occupiedRooms: 20, minuteOfDay: 1320 }),
  ).toBeGreaterThan(0);
  expect(roomServiceOrders({ occupiedRooms: 0, minuteOfDay: 1320 })).toBe(0);
});

it("limits the bar by seats, staff and opening hours", () => {
  const open = {
    seats: 30,
    staffed: 2,
    demand: 40,
    minuteOfDay: BAR_OPEN_MINUTE + 60,
  };
  expect(barCovers({ ...open, minuteOfDay: 600 })).toBe(0);
  expect(barCovers({ ...open, staffed: 0 })).toBe(0);
  const served = barCovers(open);
  expect(served).toBeGreaterThan(0);
  expect(served).toBeLessThanOrEqual(40);
  expect(barRevenueMinor(served, 600)).toBe(served * 600);
});
