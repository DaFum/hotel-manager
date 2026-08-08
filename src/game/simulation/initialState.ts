import { createRngStreams, type RngStateRecord } from "../domain/rng";
import { CITY } from "../content/1991/frankfurt";
import { STARTER_HOTEL, STARTER_STAFF } from "../content/1991/starterHotel";
import type { RoomState } from "../rooms/roomState";
import type { RateGrid } from "../revenue/rates";
import type { Booking } from "../bookings/bookingTypes";
import type { LedgerEntry } from "../finance/ledger";
import type { Loan } from "../finance/loans";
import type { Asset } from "../maintenance/maintenance";
import type { RenovationJob } from "../building/renovations";
import type { MonthlyCloseReport } from "../finance/monthlyClose";

export interface RoomRecord {
  id: string;
  category: string;
  state: RoomState;
  cleanliness: number;
}

export interface StaffRecord {
  id: string;
  role: string;
  shift: string;
  skill: number;
  monthlyWageMinor: number;
  absent: boolean;
}

export interface StayRecord {
  bookingId: string;
  roomId: string;
  rateMinor: number;
  departureDateKey: string;
}

export interface ReservationRecord extends Booking {
  arrivalDateKey: string;
  nights: number;
  segmentId: string;
}

export interface AlertRecord {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  cause: string;
}

export interface MonthAccumulator {
  openingCashMinor: number;
  roomRevenueMinor: number;
  otherRevenueMinor: number;
  operatingExpenseMinor: number;
  soldRoomNights: number;
  availableRoomNights: number;
}

export interface GameState {
  seed: number;
  calendar: { dateKey: string; minuteOfDay: number };
  hotel: { id: string; name: string; rooms: RoomRecord[] };
  rates: RateGrid;
  reservations: ReservationRecord[];
  stays: StayRecord[];
  receptionQueue: { bookingId: string; waitedMinutes: number }[];
  stock: Record<string, number>;
  pendingOrders: {
    supplierId: string;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    dueAtMinutes: number;
  }[];
  staff: StaffRecord[];
  assets: (Asset & { id: string })[];
  finance: {
    cashMinor: number;
    ledger: LedgerEntry[];
    month: MonthAccumulator;
  };
  loan: Loan;
  renovation: RenovationJob | null;
  alerts: AlertRecord[];
  lastMonthlyClose: MonthlyCloseReport | null;
  metrics: {
    adrMinor: number;
    revParMinor: number;
    occupancyBasisPoints: number;
  };
  elapsedMinutes: number;
  rngState: RngStateRecord;
}

export function createInitialGameState(seed: number): GameState {
  const streams = createRngStreams(seed);
  return {
    seed,
    calendar: { dateKey: CITY.startDateKey, minuteOfDay: 0 },
    hotel: {
      id: STARTER_HOTEL.id,
      name: STARTER_HOTEL.name,
      rooms: Array.from({ length: STARTER_HOTEL.roomCount }, (_, i) => ({
        id: `room.${STARTER_HOTEL.firstRoomNumber + i}`,
        category: i < STARTER_HOTEL.singleRooms ? "single" : "double",
        state: "VacantClean" as RoomState,
        cleanliness: 100,
      })),
    },
    rates: {},
    reservations: [],
    stays: [],
    receptionQueue: [],
    stock: { "cleaning-unit": 240, "breakfast-portion": 180 },
    pendingOrders: [],
    staff: STARTER_STAFF.map((s) => ({ ...s, absent: false })),
    assets: [
      { id: "asset.boiler", condition: 9000, status: "operational" },
      { id: "asset.lift", condition: 9500, status: "operational" },
    ],
    finance: {
      cashMinor: STARTER_HOTEL.startingCashMinor,
      ledger: [],
      month: {
        openingCashMinor: STARTER_HOTEL.startingCashMinor,
        roomRevenueMinor: 0,
        otherRevenueMinor: 0,
        operatingExpenseMinor: 0,
        soldRoomNights: 0,
        availableRoomNights: 0,
      },
    },
    loan: {
      principalMinor: 10_000_000,
      annualRateBasisPoints: 900,
      termMonths: 120,
    },
    renovation: null,
    alerts: [],
    lastMonthlyClose: null,
    metrics: { adrMinor: 0, revParMinor: 0, occupancyBasisPoints: 0 },
    elapsedMinutes: 0,
    rngState: Object.fromEntries(
      Object.entries(streams).map(([k, v]) => [k, v.state]),
    ) as RngStateRecord,
  };
}
