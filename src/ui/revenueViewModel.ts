import type { GameState } from "../game/simulation/initialState";
import { addDays } from "../game/domain/calendar";
import {
  getRate,
  rateKey,
  ROOM_CATEGORIES,
  type RoomCategory,
} from "../game/revenue/rates";
import { STARTER_HOTEL } from "../game/content/1991/starterHotel";
import { recommendedOverbookingLimit } from "../game/revenue/overbooking";

export const REVENUE_WINDOW_DAYS = 14;
export const REVENUE_PAST_DAYS = 3;
export const PICKUP_LOOKBACK_DAYS = 7;

export interface RateCell {
  category: RoomCategory;
  rateMinor: number;
  key: string;
}
export interface RateGridRow {
  dateKey: string;
  state: "past" | "today" | "future";
  cells: RateCell[];
}
export interface BookingsRow {
  dateKey: string;
  confirmedRooms: number;
  capacityRooms: number;
  occupancyBasisPoints: number;
  forecastLow: number;
  forecastHigh: number;
}
export interface RevenueMetricsRow {
  adrMinor: number;
  revParMinor: number;
  gopparMinor?: number;
  occupancyBasisPoints: number;
}
export interface ChannelMixRow {
  channel: string;
  rooms: number;
  revenueMinor: number;
  roomShareBasisPoints: number;
  revenueShareBasisPoints: number;
  segmentLabels: string[];
}
export interface PickupRow {
  dateKey: string;
  rooms: number;
}
export interface RatePlanRow {
  id: string;
  modifierBasisPoints: number;
  refundable: boolean;
  minimumStayNights: number;
  maximumStayNights: number | null;
  closedToArrival: boolean;
}
export interface OverbookingExposureRow {
  limitRooms: number;
  recommendedRooms?: number;
  dates: {
    dateKey: string;
    confirmedRooms: number;
    capacityRooms: number;
    exposureRooms: number;
  }[];
}
export interface CompetitionRow {
  id: string;
  name: string;
  rooms: number;
  rateMinor: number;
  occupancyBasisPoints: number;
  status: string;
}
export interface OccupancyDriverRow {
  factor: string;
  deltaBasisPoints: number;
}

function windowDates(state: GameState): string[] {
  return Array.from({ length: REVENUE_WINDOW_DAYS }, (_, index) =>
    addDays(state.calendar.dateKey, index - REVENUE_PAST_DAYS),
  );
}

const defaultRate = (category: RoomCategory): number =>
  STARTER_HOTEL.defaultRateMinor[category] ??
  STARTER_HOTEL.defaultRateMinor.double;

export function rateGridRows(state: GameState): RateGridRow[] {
  return windowDates(state).map((dateKey) => ({
    dateKey,
    state:
      dateKey < state.calendar.dateKey
        ? "past"
        : dateKey === state.calendar.dateKey
          ? "today"
          : "future",
    cells: ROOM_CATEGORIES.map((category) => ({
      category,
      key: rateKey(dateKey, category),
      rateMinor: getRate(state.rates, dateKey, category, defaultRate(category)),
    })),
  }));
}

function confirmedRooms(state: GameState, dateKey: string): number {
  return state.reservations
    .filter(
      (booking) =>
        booking.status === "confirmed" &&
        booking.arrivalDateKey <= dateKey &&
        addDays(booking.arrivalDateKey, booking.nights) > dateKey,
    )
    .reduce((sum, booking) => sum + booking.roomsRequested, 0);
}

export function bookingsOnTheBooksRows(state: GameState): BookingsRow[] {
  const capacityRooms = state.hotel.rooms.length;
  return windowDates(state).map((dateKey) => {
    const rooms = confirmedRooms(state, dateKey);
    return {
      dateKey,
      confirmedRooms: rooms,
      capacityRooms,
      occupancyBasisPoints:
        capacityRooms === 0 ? 0 : Math.trunc((rooms * 10_000) / capacityRooms),
      forecastLow: state.cityMarket.forecast.low,
      forecastHigh: state.cityMarket.forecast.high,
    };
  });
}

export function revenueMetricsRow(state: GameState): RevenueMetricsRow {
  return { ...state.metrics };
}

export function channelMixRows(state: GameState): ChannelMixRow[] {
  const confirmed = state.reservations.filter((b) => b.status === "confirmed");
  const totalRooms = confirmed.reduce((sum, b) => sum + b.roomsRequested, 0);
  const totalRevenue = confirmed.reduce(
    (sum, b) => sum + b.roomsRequested * b.nights * b.rateMinor,
    0,
  );
  const channels = [...new Set(confirmed.map((b) => b.channel))].sort();
  return channels.map((channel) => {
    const bookings = confirmed.filter((b) => b.channel === channel);
    const rooms = bookings.reduce((sum, b) => sum + b.roomsRequested, 0);
    const revenueMinor = bookings.reduce(
      (sum, b) => sum + b.roomsRequested * b.nights * b.rateMinor,
      0,
    );
    return {
      channel,
      rooms,
      revenueMinor,
      roomShareBasisPoints: totalRooms
        ? Math.trunc((rooms * 10_000) / totalRooms)
        : 0,
      revenueShareBasisPoints: totalRevenue
        ? Math.trunc((revenueMinor * 10_000) / totalRevenue)
        : 0,
      segmentLabels: [...new Set(bookings.map((b) => b.segmentId))].sort(),
    };
  });
}

export function pickupRows(state: GameState): PickupRow[] {
  const cutoff = addDays(state.calendar.dateKey, -PICKUP_LOOKBACK_DAYS);
  return windowDates(state).map((dateKey) => ({
    dateKey,
    rooms: state.reservations
      .filter(
        (b) =>
          b.status === "confirmed" &&
          b.bookingDateKey > cutoff &&
          b.bookingDateKey <= state.calendar.dateKey &&
          b.arrivalDateKey <= dateKey &&
          addDays(b.arrivalDateKey, b.nights) > dateKey,
      )
      .reduce((sum, b) => sum + b.roomsRequested, 0),
  }));
}

export function ratePlanRows(state: GameState): RatePlanRow[] {
  return state.revenuePolicy.ratePlans.map((plan) => ({
    id: plan.id,
    modifierBasisPoints: plan.modifierBp,
    refundable: plan.refundable,
    minimumStayNights: plan.minimumStayNights,
    maximumStayNights: plan.maximumStayNights,
    closedToArrival: plan.closedToArrival,
  }));
}

export function overbookingExposureRow(
  state: GameState,
): OverbookingExposureRow {
  const capacityRooms = state.hotel.rooms.length;
  return {
    limitRooms: state.revenuePolicy.overbookingLimitRooms,
    recommendedRooms: recommendedOverbookingLimit({
      rooms: capacityRooms,
      bookings: state.reservations.length,
      cancellations: state.reservations.filter((booking) =>
        booking.history.some((entry) => entry.status === "cancelled"),
      ).length,
      noShows: state.reservations.filter((booking) =>
        booking.history.some((entry) => entry.status === "noShow"),
      ).length,
      walkCostMinor: 17_000,
      riskTolerance: state.revenuePolicy.managerAttributes.RiskTolerance,
    }),
    dates: windowDates(state).map((dateKey) => {
      const rooms = confirmedRooms(state, dateKey);
      return {
        dateKey,
        confirmedRooms: rooms,
        capacityRooms,
        exposureRooms: Math.max(0, rooms - capacityRooms),
      };
    }),
  };
}

export function competitionRows(state: GameState): CompetitionRow[] {
  return state.competitors.map((competitor) => ({
    id: competitor.id,
    name: competitor.name,
    rooms: competitor.rooms,
    rateMinor: competitor.rateMinor,
    occupancyBasisPoints: competitor.occupancyBp,
    status: competitor.status,
  }));
}

export function occupancyDriverRows(state: GameState): OccupancyDriverRow[] {
  return [...state.cityMarket.occupancyAttribution.contributors]
    .map((item) => ({ factor: item.factor, deltaBasisPoints: item.weight }))
    .sort(
      (a, b) =>
        Math.abs(b.deltaBasisPoints) - Math.abs(a.deltaBasisPoints) ||
        (a.factor < b.factor ? -1 : a.factor > b.factor ? 1 : 0),
    );
}
