import { expect, it } from "vitest";
import {
  bookSlot,
  canReserve,
  openSlots,
  SLOT_MINUTES,
  type WellnessSchedule,
} from "./reservations";
import { fitnessCapacity, fitnessSatisfactionBp } from "./fitness";

it("requires room staff and opening-time capacity", () => {
  expect(canReserve({ roomSlots: 1, staffSlots: 0, isOpen: true })).toBe(false);
  expect(canReserve({ roomSlots: 0, staffSlots: 1, isOpen: true })).toBe(false);
  expect(canReserve({ roomSlots: 1, staffSlots: 1, isOpen: false })).toBe(
    false,
  );
  expect(canReserve({ roomSlots: 1, staffSlots: 1, isOpen: true })).toBe(true);
});

it("counts the treatment slots a shift can actually cover", () => {
  // Two therapists across a six-hour opening, one slot each per treatment.
  expect(
    openSlots({
      treatmentRooms: 3,
      therapists: 2,
      openMinutes: 6 * 60,
      booked: 0,
    }),
  ).toBe(Math.floor((6 * 60) / SLOT_MINUTES) * 2);
  expect(
    openSlots({
      treatmentRooms: 1,
      therapists: 2,
      openMinutes: 6 * 60,
      booked: 0,
    }),
  ).toBe(Math.floor((6 * 60) / SLOT_MINUTES));
});

it("books a slot only while one is free", () => {
  let schedule: WellnessSchedule = {
    treatmentRooms: 1,
    therapists: 1,
    openMinutes: 120,
    booked: 0,
  };
  const first = bookSlot(schedule, "guest.1");
  expect(first.accepted).toBe(true);
  schedule = first.schedule;
  const second = bookSlot(schedule, "guest.2");
  expect(second.accepted).toBe(true);
  const third = bookSlot(second.schedule, "guest.3");
  expect(third.accepted).toBe(false);
  expect(third.reason).toMatch(/no free slot/);
  expect(third.schedule).toEqual(second.schedule);
});

it("crowds the gym before it stops letting people in", () => {
  expect(fitnessCapacity({ areaSqm: 60, equipmentStations: 8 })).toBe(8);
  expect(fitnessCapacity({ areaSqm: 12, equipmentStations: 8 })).toBe(3);
  expect(fitnessSatisfactionBp(4, 8)).toBeGreaterThan(
    fitnessSatisfactionBp(8, 8),
  );
  expect(fitnessSatisfactionBp(0, 0)).toBe(0);
});
