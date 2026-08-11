import { CORE_CONTENT_REGISTRY } from "../corePack";

const breakfast = CORE_CONTENT_REGISTRY.getByKind(
  "facility.breakfast_room",
  "facility",
);
const restaurant = CORE_CONTENT_REGISTRY.getByKind(
  "facility.restaurant",
  "facility",
);
const bar = CORE_CONTENT_REGISTRY.getByKind("facility.bar", "facility");
const wellness = CORE_CONTENT_REGISTRY.getByKind(
  "facility.wellness",
  "facility",
);
const fitness = CORE_CONTENT_REGISTRY.getByKind("facility.fitness", "facility");
const conference = CORE_CONTENT_REGISTRY.getByKind(
  "facility.conference",
  "facility",
);

export const STARTER_HOTEL = {
  id: "hotel.frankfurt.1",
  name: "Hotel Mainblick",
  roomCount: 24,
  /** Room ids run 101..124; the first twelve are singles. */
  firstRoomNumber: 101,
  singleRooms: 12,
  breakfastSeats: breakfast.capacity,
  kitchenCovers: 30,
  startingCashMinor: 40_000_000,
  /** The mortgage the house comes with, and what the bank charges for it. */
  startingLoan: {
    principalMinor: 10_000_000,
    annualRateBasisPoints: 900,
    termMonths: 120,
  },
  defaultRateMinor: { single: 9000, double: 12000 } as Record<string, number>,
  breakfastPriceMinor: 1800,
  /** Charged per failed asset per day while a repair is outstanding. */
  dailyRepairCostMinor: 25_000,

  // --- deep facilities ---------------------------------------------------
  restaurantSeats: restaurant.capacity,
  restaurantBaseExternalCovers: 24,
  restaurantPriceIndexBp: 10000,
  restaurantReputationBp: 5000,
  barSeats: bar.capacity,
  /** Covers the bar draws from the city at market price and average repute. */
  barBaseExternalCovers: 20,
  /** The bar's price against the comparable city price, in basis points. */
  barPriceIndexBp: 10000,
  /** The bar's standing with non-resident guests, in basis points. */
  barReputationBp: 5000,
  /** Treatment rooms and the daily opening window of the small spa. */
  treatmentRooms: 2,
  wellnessOpenMinutes: 6 * 60,
  wellnessSqm: wellness.areaSquareMeters,
  wellnessTreatmentPriceMinor: 5500,
  /** Gym floor and stations. */
  fitnessSqm: fitness.areaSquareMeters,
  fitnessStations: fitness.capacity,
  /** The one conference room the house starts with. */
  conferenceSqm: conference.areaSquareMeters,
  /** Floor area one seated delegate needs in the hall. */
  conferenceSqmPerSeat: 1.5,
  /** In-house laundry: pieces per day by machine and per laundry hand. */
  laundryMachinePieces: 220,
  laundryPiecesPerStaff: 120,
  /** Contract laundry will take this much overflow a day. */
  externalLaundryPieces: 400,
  startingLinenPieces: 600,
  /** Guest lifts. */
  elevatorCars: 1,
  /** Back-of-house area available to the largest shift. */
  staffAreaSqm: 36,
  /** Guards rostered before any event or VIP load. */
  baseSecurityStaff: 1,
  /** Parties one receptionist can process an hour in the lobby. */
  partiesPerReceptionist: 12,
  /** Bags one porter can move an hour. */
  bagsPerPorter: 30,
} as const;

/** The commercial spaces the house already trades from in 1991. */
export const STARTER_COMMERCIAL_SPACES = [
  {
    id: "space.kiosk",
    kind: "shop" as const,
    capacity: 30,
    openMinute: 420,
    closeMinute: 1260,
    unitPriceMinor: 900,
    operator: { kind: "self" as const, marginBasisPoints: 3500 },
    staffRequired: 0,
    fitBp: 5500,
    maintenanceMinor: 25_000,
  },
  {
    id: "space.carpark",
    kind: "parking" as const,
    capacity: 18,
    openMinute: 0,
    closeMinute: 1440,
    unitPriceMinor: 1_200,
    operator: { kind: "self" as const, marginBasisPoints: 7000 },
    staffRequired: 0,
    fitBp: 7000,
    maintenanceMinor: 30_000,
  },
  {
    id: "space.terrace",
    kind: "outdoor" as const,
    capacity: 24,
    openMinute: 600,
    closeMinute: 1320,
    unitPriceMinor: 0,
    operator: { kind: "self" as const, marginBasisPoints: 0 },
    staffRequired: 0,
    fitBp: 6500,
    maintenanceMinor: 12_000,
  },
] as const;

export const STARTER_STAFF = [
  {
    id: "staff.reception.1",
    role: "reception",
    shift: "morning",
    skill: 70,
    monthlyWageMinor: 320_000,
  },
  {
    id: "staff.reception.2",
    role: "reception",
    shift: "evening",
    skill: 60,
    monthlyWageMinor: 300_000,
  },
  {
    id: "staff.housekeeping.1",
    role: "housekeeping",
    shift: "morning",
    skill: 65,
    monthlyWageMinor: 260_000,
  },
  {
    id: "staff.housekeeping.2",
    role: "housekeeping",
    shift: "morning",
    skill: 55,
    monthlyWageMinor: 250_000,
  },
  {
    id: "staff.kitchen.1",
    role: "kitchen",
    shift: "morning",
    skill: 60,
    monthlyWageMinor: 280_000,
  },
  {
    id: "staff.fnb.1",
    role: "fnb",
    shift: "evening",
    skill: 55,
    monthlyWageMinor: 245_000,
  },
  {
    id: "staff.laundry.1",
    role: "laundry",
    shift: "morning",
    skill: 50,
    monthlyWageMinor: 235_000,
  },
  {
    id: "staff.technician.1",
    role: "technician",
    shift: "morning",
    skill: 65,
    monthlyWageMinor: 295_000,
  },
] as const;
