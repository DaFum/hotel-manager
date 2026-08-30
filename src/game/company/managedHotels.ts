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
import type { TreasuryState } from "../treasury/treasury";
import { hotelCashMinor, overdrawnHotels } from "../treasury/treasury";

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

function assertSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`invalid ${label}`);
  return value;
}

/** Exact integer basis-point scaling without an unsafe intermediate product. */
function scaleByBasisPoints(value: number, basisPoints: number): number {
  const whole = Math.trunc(value / 10_000);
  const remainder = value % 10_000;
  return whole * basisPoints + Math.trunc((remainder * basisPoints) / 10_000);
}

export interface ManagedHotelMonth {
  soldRoomNights: number;
  availableRoomNights: number;
  roomRevenueMinor: number;
  otherRevenueMinor: number;
  operatingExpenseMinor: number;
  grossOperatingProfitMinor: number;
  occupancyBasisPoints: number;
  cashNeedMinor: number;
  renovationNeedMinor: number;
  qualityStars: number;
}

/** Funding required to absorb a loss and bring the hotel's account back to zero. */
export function cashNeedForLossMinor(
  treasury: TreasuryState,
  hotelId: string,
  grossOperatingProfitMinor: number,
): number {
  if (!Number.isSafeInteger(grossOperatingProfitMinor))
    throw new Error("invalid gross operating profit");
  if (grossOperatingProfitMinor >= 0) return 0;
  const balance = hotelCashMinor(treasury, hotelId);
  const isOverdrawn = overdrawnHotels(treasury).includes(hotelId);
  const usableBalance = isOverdrawn ? balance : Math.max(0, balance);
  return Math.max(0, -grossOperatingProfitMinor - usableBalance);
}

/** Stateless portfolio estimate: age, scale and weak margins all add need. */
export function managedRenovationNeedMinor(
  hotel: ManagedHotelRecord,
  periodStartDateKey: string,
): number {
  assertCount(hotel.rooms, "rooms");
  assertBasisPoints(hotel.gopMarginBasisPoints, "gop margin");
  if (hotel.gopMarginBasisPoints > 10_000)
    throw new Error("invalid gop margin");
  const ageMonths = monthsOpen(hotel.openedDateKey, periodStartDateKey);
  const ageYears = Math.trunc(ageMonths / 12);
  const weakMarginBp = Math.max(0, 3500 - hotel.gopMarginBasisPoints);
  const perRoomMinor = ageYears * 10_000 + weakMarginBp * 10;
  const need = hotel.rooms * perRoomMinor;
  if (!Number.isSafeInteger(need)) throw new Error("invalid renovation need");
  return need;
}

/** Coarse aggregate quality: three disclosed trading measures, no fake audit. */
export function managedQualityStars(input: {
  gopMarginBasisPoints: number;
  occupancyBasisPoints: number;
  adrMinor: number;
}): number {
  assertBasisPoints(input.gopMarginBasisPoints, "gop margin");
  assertBasisPoints(input.occupancyBasisPoints, "occupancy");
  if (
    input.gopMarginBasisPoints > 10_000 ||
    input.occupancyBasisPoints > 10_000
  )
    throw new Error("invalid managed quality input");
  assertNonNegativeMinor(input.adrMinor, "adr");
  const score =
    (input.gopMarginBasisPoints >= 1500 ? 1 : 0) +
    (input.gopMarginBasisPoints >= 3000 ? 1 : 0) +
    (input.occupancyBasisPoints >= 6000 ? 1 : 0) +
    (input.adrMinor >= 10_000 ? 1 : 0) +
    (input.adrMinor >= 18_000 && input.occupancyBasisPoints >= 7500 ? 1 : 0);
  return Math.max(1, Math.min(5, score));
}

/**
 * One month of trading for a portfolio house. Ramp-up and the brand's uplift
 * both act on capture, never on price: a young hotel sells fewer rooms, not
 * cheaper ones, and a flag that is out of compliance earns nothing.
 */
function validateManagedHotelInputs(
  hotel: ManagedHotelRecord,
  brandUpliftBp: number,
): void {
  assertCount(hotel.rooms, "managed hotel rooms");
  assertNonNegativeMinor(hotel.adrMinor, "managed hotel adr");
  assertShareBp(hotel.occupancyBasisPoints, "managed hotel occupancy");
  assertShareBp(hotel.gopMarginBasisPoints, "managed hotel gop margin");
  assertBasisPoints(brandUpliftBp, "brand uplift");
}

function calculateManagedOccupancyAndNights(
  hotel: ManagedHotelRecord,
  periodStartDateKey: string,
  brandUpliftBp: number,
): { availableRoomNights: number; soldRoomNights: number; occupancyBasisPoints: number } {
  const nights = daysInMonth(periodStartDateKey);
  if (hotel.rooms > Math.floor(Number.MAX_SAFE_INTEGER / (nights * 10_000)))
    throw new Error("invalid available room nights");
  const availableRoomNights = assertSafeInteger(
    hotel.rooms * nights,
    "available room nights",
  );
  const rampBp = rampUpDemandFactorBasisPoints(
    monthsOpen(hotel.openedDateKey, periodStartDateKey),
  );
  const captureBp = Math.min(
    10_000,
    Math.trunc(
      (hotel.occupancyBasisPoints * rampBp * (10_000 + brandUpliftBp)) /
        100_000_000,
    ),
  );
  const soldRoomNights = assertSafeInteger(
    scaleByBasisPoints(availableRoomNights, captureBp),
    "sold room nights",
  );
  const occupancyBasisPoints =
    availableRoomNights === 0
      ? 0
      : Math.round((soldRoomNights * 10_000) / availableRoomNights);
  return { availableRoomNights, soldRoomNights, occupancyBasisPoints };
}

function calculateManagedRevenuesAndGop(
  hotel: ManagedHotelRecord,
  soldRoomNights: number,
): {
  roomRevenueMinor: number;
  otherRevenueMinor: number;
  revenueMinor: number;
  grossOperatingProfitMinor: number;
  operatingExpenseMinor: number;
} {
  if (
    soldRoomNights > 0 &&
    hotel.adrMinor > Math.floor(Number.MAX_SAFE_INTEGER / soldRoomNights)
  )
    throw new Error("invalid room revenue");
  const roomRevenueMinor = assertSafeInteger(
    soldRoomNights * hotel.adrMinor,
    "room revenue",
  );
  const otherRevenueMinor = assertSafeInteger(
    scaleByBasisPoints(roomRevenueMinor, ANCILLARY_REVENUE_SHARE_BP),
    "other revenue",
  );
  const revenueMinor = assertSafeInteger(
    roomRevenueMinor + otherRevenueMinor,
    "managed hotel revenue",
  );
  const grossOperatingProfitMinor = assertSafeInteger(
    scaleByBasisPoints(revenueMinor, hotel.gopMarginBasisPoints),
    "gross operating profit",
  );
  const operatingExpenseMinor = assertSafeInteger(
    revenueMinor - grossOperatingProfitMinor,
    "operating expense",
  );
  return {
    roomRevenueMinor,
    otherRevenueMinor,
    revenueMinor,
    grossOperatingProfitMinor,
    operatingExpenseMinor,
  };
}

/**
 * One month of trading for a portfolio house. Ramp-up and the brand's uplift
 * both act on capture, never on price: a young hotel sells fewer rooms, not
 * cheaper ones, and a flag that is out of compliance earns nothing.
 */
export function managedHotelMonth(
  hotel: ManagedHotelRecord,
  input: {
    periodStartDateKey: string;
    brandUpliftBp: number;
    treasury?: TreasuryState;
  },
): ManagedHotelMonth {
  validateManagedHotelInputs(hotel, input.brandUpliftBp);
  const { availableRoomNights, soldRoomNights, occupancyBasisPoints } =
    calculateManagedOccupancyAndNights(
      hotel,
      input.periodStartDateKey,
      input.brandUpliftBp,
    );
  const {
    roomRevenueMinor,
    otherRevenueMinor,
    grossOperatingProfitMinor,
    operatingExpenseMinor,
  } = calculateManagedRevenuesAndGop(hotel, soldRoomNights);

  return {
    soldRoomNights,
    availableRoomNights,
    roomRevenueMinor,
    otherRevenueMinor,
    operatingExpenseMinor,
    grossOperatingProfitMinor,
    occupancyBasisPoints,
    cashNeedMinor: input.treasury
      ? cashNeedForLossMinor(
          input.treasury,
          hotel.hotelId,
          grossOperatingProfitMinor,
        )
      : Math.max(0, -grossOperatingProfitMinor),
    renovationNeedMinor: managedRenovationNeedMinor(
      hotel,
      input.periodStartDateKey,
    ),
    qualityStars: managedQualityStars({
      gopMarginBasisPoints: hotel.gopMarginBasisPoints,
      occupancyBasisPoints,
      adrMinor: hotel.adrMinor,
    }),
  };
}
