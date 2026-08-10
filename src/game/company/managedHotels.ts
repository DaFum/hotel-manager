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

/**
 * The rate a house has to achieve for its stabilised year to produce a given
 * gross operating profit. It is the exact inverse of `managedHotelMonth`, so a
 * hotel admitted at a valuation's GOP actually goes on to earn it — otherwise
 * the price the buyer paid and the money the house makes describe two
 * different hotels.
 */
/**
 * The occupancy a scheme was underwritten on before `DevelopmentProject` stated
 * it. Saves written by an older build carry developments without the field —
 * the migration forwards `developments` wholesale — so opening one has to fall
 * back to the assumption it was actually built on rather than reading
 * `undefined` into a basis-point check.
 */
export const DEFAULT_UNDERWRITING_OCCUPANCY_BP = 7000;

/**
 * What a scheme says it will run at, or the assumption it predates. A stated
 * zero is a decision and is kept; only a missing value falls back.
 */
export function underwrittenOccupancyBp(development: {
  occupancyBasisPoints?: number;
}): number {
  return development.occupancyBasisPoints ?? DEFAULT_UNDERWRITING_OCCUPANCY_BP;
}

/** A basis-point share of one whole: never negative, never over 100%. */
function assertShareBp(value: number, label: string): number {
  assertBasisPoints(value, label);
  if (value > 10_000) throw new Error(`invalid ${label}`);
  return value;
}

export function adrForAnnualGopMinor(input: {
  annualGopMinor: number;
  rooms: number;
  occupancyBasisPoints: number;
  gopMarginBasisPoints: number;
}): number {
  assertCount(input.rooms, "rooms");
  assertNonNegativeMinor(input.annualGopMinor, "annual gop");
  // Both are shares of one, so the general basis-point bound is not enough:
  // a house cannot sell more nights than it has or keep more than it earns.
  assertShareBp(input.occupancyBasisPoints, "occupancy");
  assertShareBp(input.gopMarginBasisPoints, "gop margin");
  if (
    input.rooms === 0 ||
    input.occupancyBasisPoints === 0 ||
    input.gopMarginBasisPoints === 0 ||
    input.annualGopMinor === 0
  )
    return 0;
  const revenueMinor = Math.ceil(
    (input.annualGopMinor * 10_000) / input.gopMarginBasisPoints,
  );
  const roomRevenueMinor = Math.ceil(
    (revenueMinor * 10_000) / (10_000 + ANCILLARY_REVENUE_SHARE_BP),
  );
  const soldRoomNights = Math.trunc(
    (input.rooms * 365 * input.occupancyBasisPoints) / 10_000,
  );
  // Rounded up at every step, so the rate this returns actually reaches the
  // GOP it was asked for. Truncating each inverse step in turn lands a Pfennig
  // or two short, and a house underwritten on it would miss its own number.
  return soldRoomNights === 0
    ? 0
    : Math.max(1, Math.ceil(roomRevenueMinor / soldRoomNights));
}

/** The rate implied by a whole year of room revenue at a stated occupancy. */
export function adrForAnnualRoomRevenueMinor(input: {
  annualRoomRevenueMinor: number;
  rooms: number;
  occupancyBasisPoints: number;
}): number {
  assertCount(input.rooms, "rooms");
  assertNonNegativeMinor(input.annualRoomRevenueMinor, "annual room revenue");
  assertShareBp(input.occupancyBasisPoints, "occupancy");
  const soldRoomNights = Math.trunc(
    (input.rooms * 365 * input.occupancyBasisPoints) / 10_000,
  );
  return soldRoomNights === 0
    ? 0
    : Math.max(1, Math.trunc(input.annualRoomRevenueMinor / soldRoomNights));
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

/**
 * Food, beverage and everything else a house of this size sells alongside the
 * room, as a share of room revenue in basis points.
 */
export const ANCILLARY_REVENUE_SHARE_BP = 2200;

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
  const otherRevenueMinor = Math.trunc(
    (roomRevenueMinor * ANCILLARY_REVENUE_SHARE_BP) / 10_000,
  );
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
