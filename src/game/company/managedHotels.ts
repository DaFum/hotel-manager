import { compareIds } from "../domain/ids";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
} from "../domain/units";
import { daysInMonth } from "../domain/calendar";
import {
  monthsOpen,
  rampUpDemandFactorBasisPoints,
} from "../development/rampUp";

/**
 * A hotel the group owns but does not run minute by minute. The flagship is
 * simulated in full; every other house is an operating unit that publishes a
 * standardised monthly result upward from the same economics — rooms, rate,
 * occupancy, ramp-up and margin — so a portfolio house is never a hidden
 * money printer.
 */
export interface ManagedHotelRecord {
  hotelId: string;
  name: string;
  cityId: string;
  rooms: number;
  /** Achieved rate before ramp-up and brand effects. */
  adrMinor: number;
  /** Stabilised occupancy the house trades at, in basis points. */
  occupancyBasisPoints: number;
  /** Gross operating margin on total revenue, in basis points. */
  gopMarginBasisPoints: number;
  /** The date it joined the group and started earning its market share. */
  openedDateKey: string;
}

export function createManagedHotel(
  input: ManagedHotelRecord,
): ManagedHotelRecord {
  if (!input.hotelId) throw new Error("a hotel id is required");
  if (input.rooms <= 0) throw new Error("invalid rooms");
  assertCount(input.rooms, "rooms");
  assertNonNegativeMinor(input.adrMinor, "managed hotel adr");
  assertBasisPoints(input.occupancyBasisPoints, "managed hotel occupancy");
  if (input.occupancyBasisPoints > 10_000)
    throw new Error("invalid managed hotel occupancy");
  assertBasisPoints(input.gopMarginBasisPoints, "managed hotel gop margin");
  if (input.gopMarginBasisPoints > 10_000)
    throw new Error("invalid managed hotel gop margin");
  return { ...input };
}

export function registerManagedHotel(
  hotels: readonly ManagedHotelRecord[],
  hotel: ManagedHotelRecord,
): ManagedHotelRecord[] {
  if (hotels.some((h) => h.hotelId === hotel.hotelId))
    throw new Error(`hotel ${hotel.hotelId} is already managed`);
  return [...hotels, hotel].sort((a, b) => compareIds(a.hotelId, b.hotelId));
}

export interface ManagedHotelMonth {
  soldRoomNights: number;
  availableRoomNights: number;
  roomRevenueMinor: number;
  otherRevenueMinor: number;
  operatingExpenseMinor: number;
  grossOperatingProfitMinor: number;
  occupancyBasisPoints: number;
}

/**
 * One month of trading for a portfolio house. Ramp-up and the brand's uplift
 * both act on capture, never on price: a young hotel sells fewer rooms, not
 * cheaper ones, and a flag that is out of compliance earns nothing.
 */
export function managedHotelMonth(
  hotel: ManagedHotelRecord,
  input: { periodStartDateKey: string; brandUpliftBp: number },
): ManagedHotelMonth {
  assertBasisPoints(input.brandUpliftBp, "brand uplift");
  const nights = daysInMonth(input.periodStartDateKey);
  const availableRoomNights = hotel.rooms * nights;
  const rampBp = rampUpDemandFactorBasisPoints(
    monthsOpen(hotel.openedDateKey, input.periodStartDateKey),
  );
  const captureBp = Math.min(
    10_000,
    Math.trunc(
      (hotel.occupancyBasisPoints * rampBp * (10_000 + input.brandUpliftBp)) /
        100_000_000,
    ),
  );
  const soldRoomNights = Math.trunc((availableRoomNights * captureBp) / 10_000);
  const roomRevenueMinor = soldRoomNights * hotel.adrMinor;
  // Food, beverage and everything else a house of this size sells alongside
  // the room, as a fixed share of room revenue.
  const otherRevenueMinor = Math.trunc((roomRevenueMinor * 2200) / 10_000);
  const revenueMinor = roomRevenueMinor + otherRevenueMinor;
  const grossOperatingProfitMinor = Math.trunc(
    (revenueMinor * hotel.gopMarginBasisPoints) / 10_000,
  );
  return {
    soldRoomNights,
    availableRoomNights,
    roomRevenueMinor,
    otherRevenueMinor,
    operatingExpenseMinor: revenueMinor - grossOperatingProfitMinor,
    grossOperatingProfitMinor,
    occupancyBasisPoints:
      availableRoomNights === 0
        ? 0
        : Math.round((soldRoomNights * 10_000) / availableRoomNights),
  };
}
