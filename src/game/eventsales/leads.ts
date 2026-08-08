import { contractValueMinor } from "./contracts";

export interface EventLead {
  id: string;
  guests: number;
  nights: number;
  /** What the enquiry is willing to spend in total, in Pfennig. */
  budgetMinor: number;
  /** Days between the enquiry and the event. */
  leadDays: number;
}

/** 1991 Frankfurt conference tariff, in Pfennig. */
export const TARIFF = {
  rentalPerGuestPerDayMinor: 1500,
  cateringPerCoverPerDayMinor: 3200,
  groupRoomNightMinor: 9500,
  technologyPerDayMinor: 40000,
} as const;

/** The shortest notice the sales desk can still staff and cater. */
export const MINIMUM_LEAD_DAYS = 3;

export function qualifyLead(
  lead: EventLead,
): { ok: true } | { ok: false; reason: string } {
  if (lead.guests <= 0) return { ok: false, reason: "no delegates" };
  if (lead.nights <= 0) return { ok: false, reason: "no event days" };
  if (lead.leadDays < MINIMUM_LEAD_DAYS)
    return { ok: false, reason: "too little notice" };
  if (lead.budgetMinor <= 0) return { ok: false, reason: "no budget" };
  return { ok: true };
}

/** The offer the sales desk quotes for a delegation of this shape. */
export function offerPriceMinor(x: {
  guests: number;
  nights: number;
  roomsBlocked: number;
}): number {
  const guests = Math.max(0, x.guests);
  const nights = Math.max(0, x.nights);
  return contractValueMinor({
    rental: guests * nights * TARIFF.rentalPerGuestPerDayMinor,
    rooms: Math.max(0, x.roomsBlocked) * nights * TARIFF.groupRoomNightMinor,
    catering: guests * nights * TARIFF.cateringPerCoverPerDayMinor,
    technology: nights * TARIFF.technologyPerDayMinor,
  });
}

/** A qualified lead signs only when the quote fits inside its budget. */
export function leadConverts(lead: EventLead, offerMinor: number): boolean {
  return qualifyLead(lead).ok && offerMinor <= lead.budgetMinor;
}
