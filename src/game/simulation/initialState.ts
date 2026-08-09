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
import type { Classification } from "../classification/quality";
import { defaultModuleForCategory } from "../content/rooms/modules";
import { STARTER_PLANT } from "../content/1991/plant";
import {
  createCityMarket,
  createCompetitors,
  type CityMarketState,
  type CompetitorRecord,
} from "../city/cityMarket";

export interface RoomRecord {
  id: string;
  category: string;
  state: RoomState;
  cleanliness: number;
  /** The room product this module is fitted out to. */
  moduleId: string;
  /** Years since the fit-out was current; only a renovation resets it. */
  styleAgeYears: number;
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
  /** The category the rooms were held against at booking time. */
  category: string;
  arrivalDateKey: string;
  nights: number;
  segmentId: string;
}

/** One serviced area as the player sees it: load, capacity and the binding cause. */
export interface FacilityRecord {
  id: string;
  name: string;
  demand: number;
  capacity: number;
  cause: string;
}

/** A signed conference, from the day it is booked to the day it moves out. */
export interface EventRecord {
  id: string;
  guests: number;
  nights: number;
  roomsBlocked: number;
  /** The rate category those rooms come out of. */
  blockedCategory: string;
  startDateKey: string;
  valueMinor: number;
  status: "confirmed" | "running" | "complete";
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
  assets: (Asset & {
    id: string;
    /** Nameplate throughput, in the unit its consumer measures. */
    rated: number;
    replacementMinor: number;
  })[];
  /** Serviced areas recomputed every snapshot; never a source of truth itself. */
  facilities: FacilityRecord[];
  /** Linen pieces in circulation. */
  linen: { clean: number; dirty: number };
  events: EventRecord[];
  wellness: {
    treatmentRooms: number;
    therapists: number;
    openMinutes: number;
    booked: number;
  };
  /** Lift trips generated today; reset at midnight. */
  elevatorTrips: number;
  /** Conference housekeeping still outstanding, in simulated minutes. */
  eventHousekeepingMinutes: number;
  /** Conference housekeeping the shift has actually worked off today. */
  eventHousekeepingWorkedMinutes: number;
  classification: Classification;
  /** The city the hotel trades in: demand, land, labour and information. */
  cityMarket: CityMarketState;
  /** The rival houses competing for the same room nights. */
  competitors: CompetitorRecord[];
  specializationId: string | null;
  /** Floor area actually built for a profile; only investment moves it. */
  investedArea: { conferenceSqm: number; wellnessSqm: number };
  finance: {
    cashMinor: number;
    /** Expenses recognised but not yet payable in cash. */
    payableMinor: number;
    ledger: LedgerEntry[];
    month: MonthAccumulator;
  };
  /** Housekeeping labour carried between quanta, in simulated minutes. */
  housekeepingMinutes: number;
  /** Fractional reception throughput carried between quanta, in parties. */
  receptionCapacity: number;
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
      rooms: Array.from({ length: STARTER_HOTEL.roomCount }, (_, i) => {
        const category = i < STARTER_HOTEL.singleRooms ? "single" : "double";
        return {
          id: `room.${STARTER_HOTEL.firstRoomNumber + i}`,
          category,
          state: "VacantClean" as RoomState,
          cleanliness: 100,
          moduleId: defaultModuleForCategory(category).id,
          // The house was last done out in the mid seventies.
          styleAgeYears: 16,
        };
      }),
    },
    rates: {},
    reservations: [],
    stays: [],
    receptionQueue: [],
    stock: { "cleaning-unit": 240, "breakfast-portion": 180 },
    pendingOrders: [],
    staff: STARTER_STAFF.map((s) => ({ ...s, absent: false })),
    assets: STARTER_PLANT.map((a) => ({
      id: a.id,
      condition: a.startingCondition,
      status: "operational" as const,
      minutesSinceService: 0,
      rated: a.rated,
      replacementMinor: a.replacementMinor,
    })),
    finance: {
      cashMinor: STARTER_HOTEL.startingCashMinor,
      payableMinor: 0,
      ledger: [],
      month: {
        openingCashMinor: STARTER_HOTEL.startingCashMinor,
        roomRevenueMinor: 0,
        otherRevenueMinor: 0,
        operatingExpenseMinor: 0,
        soldRoomNights: 0,
        // The opening day's capacity; later days are added as they begin.
        availableRoomNights: STARTER_HOTEL.roomCount,
      },
    },
    loan: {
      principalMinor: 10_000_000,
      annualRateBasisPoints: 900,
      termMonths: 120,
    },
    facilities: [],
    linen: { clean: STARTER_HOTEL.startingLinenPieces, dirty: 0 },
    events: [],
    wellness: {
      treatmentRooms: STARTER_HOTEL.treatmentRooms,
      therapists: 0,
      openMinutes: STARTER_HOTEL.wellnessOpenMinutes,
      booked: 0,
    },
    elevatorTrips: 0,
    eventHousekeepingMinutes: 0,
    eventHousekeepingWorkedMinutes: 0,
    classification: { stars: 0, blockedBy: [] },
    cityMarket: createCityMarket(CITY.startDateKey),
    competitors: createCompetitors(),
    specializationId: null,
    investedArea: {
      conferenceSqm: STARTER_HOTEL.conferenceSqm,
      wellnessSqm: STARTER_HOTEL.wellnessSqm,
    },
    housekeepingMinutes: 0,
    receptionCapacity: 0,
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
