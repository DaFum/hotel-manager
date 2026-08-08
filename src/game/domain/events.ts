/**
 * Domain events describe what happened, so unrelated systems can react without
 * importing each other. The slice emits the operational set below.
 */
export type DomainEvent =
  | { type: "BOOKING_CONFIRMED"; bookingId: string; dateKey: string }
  | { type: "BOOKING_NO_SHOW"; bookingId: string; dateKey: string }
  | { type: "GUEST_CHECKED_IN"; bookingId: string; roomId: string }
  | { type: "GUEST_CHECKED_OUT"; bookingId: string; roomId: string }
  | { type: "ROOM_CLEANED"; roomId: string }
  | { type: "ASSET_FAILED"; assetId: string }
  | { type: "ASSET_REPAIRED"; assetId: string }
  | { type: "MONTH_CLOSED"; periodKey: string };
