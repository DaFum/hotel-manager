import { availableThroughput } from "../facilities/capacity";

/** One treatment occupies a room and a therapist for 45 minutes. */
export const SLOT_MINUTES = 45;
export const TREATMENT_LINEN_PIECES = 1;
export const TREATMENT_WATER_UNITS = 3;
export const TREATMENT_ENERGY_UNITS = 2;

export interface WellnessSchedule {
  treatmentRooms: number;
  therapists: number;
  /** Minutes the spa is open today. */
  openMinutes: number;
  booked: number;
}

/**
 * A treatment needs three things at once: a room, a therapist, and the spa to
 * be open. Any one of them missing is a refusal, not a queue.
 */
export function canReserve(i: {
  roomSlots: number;
  staffSlots: number;
  isOpen: boolean;
}): boolean {
  return i.isOpen && i.roomSlots > 0 && i.staffSlots > 0;
}

/** Slots still sellable today. */
export function openSlots(s: WellnessSchedule): number {
  const slotsPerResource = Math.max(
    0,
    Math.floor(Math.max(0, s.openMinutes) / SLOT_MINUTES),
  );
  const capacity = availableThroughput({
    space: Math.max(0, s.treatmentRooms) * slotsPerResource,
    equipment: Math.max(0, s.treatmentRooms) * slotsPerResource,
    staffed: Math.max(0, s.therapists) * slotsPerResource,
  });
  return Math.max(0, capacity - Math.max(0, s.booked));
}

export interface BookingOutcome {
  accepted: boolean;
  reason?: string;
  schedule: WellnessSchedule;
}

export function bookSlot(
  schedule: WellnessSchedule,
  guestId: string,
): BookingOutcome {
  if (!guestId) throw new Error("guest required");
  const free = openSlots(schedule);
  const isOpen = schedule.openMinutes >= SLOT_MINUTES;
  if (!canReserve({ roomSlots: free, staffSlots: free, isOpen }))
    return {
      accepted: false,
      reason: isOpen ? "no free slot" : "spa closed",
      schedule,
    };
  return {
    accepted: true,
    schedule: { ...schedule, booked: schedule.booked + 1 },
  };
}

export function reserveTreatment(x: {
  schedule: WellnessSchedule;
  guestId: string;
  linen: number;
  water: number;
  energy: number;
  maintained: boolean;
}): BookingOutcome & {
  linenUsed: number;
  waterUsed: number;
  energyUsed: number;
} {
  for (const [label, value] of Object.entries({
    treatmentRooms: x.schedule.treatmentRooms,
    therapists: x.schedule.therapists,
    openMinutes: x.schedule.openMinutes,
    booked: x.schedule.booked,
    linen: x.linen,
    water: x.water,
    energy: x.energy,
  }))
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`invalid treatment ${label}`);
  const reason = !x.maintained
    ? "maintenance state"
    : x.schedule.therapists <= 0
      ? "specialist staff"
      : x.linen < TREATMENT_LINEN_PIECES
        ? "linen stock"
        : x.water < TREATMENT_WATER_UNITS
          ? "water capacity"
          : x.energy < TREATMENT_ENERGY_UNITS
            ? "energy capacity"
            : null;
  if (reason)
    return {
      accepted: false,
      reason,
      schedule: x.schedule,
      linenUsed: 0,
      waterUsed: 0,
      energyUsed: 0,
    };
  const outcome = bookSlot(x.schedule, x.guestId);
  return {
    ...outcome,
    linenUsed: outcome.accepted ? TREATMENT_LINEN_PIECES : 0,
    waterUsed: outcome.accepted ? TREATMENT_WATER_UNITS : 0,
    energyUsed: outcome.accepted ? TREATMENT_ENERGY_UNITS : 0,
  };
}
