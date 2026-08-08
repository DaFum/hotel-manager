export const STARTER_HOTEL = {
  id: "hotel.frankfurt.1",
  name: "Hotel Mainblick",
  roomCount: 24,
  /** Room ids run 101..124; the first twelve are singles. */
  firstRoomNumber: 101,
  singleRooms: 12,
  breakfastSeats: 36,
  kitchenCovers: 30,
  startingCashMinor: 40_000_000,
  defaultRateMinor: { single: 9000, double: 12000 } as Record<string, number>,
  breakfastPriceMinor: 1800,
  /** Charged per failed asset per day while a repair is outstanding. */
  dailyRepairCostMinor: 25_000,

  // --- deep facilities ---------------------------------------------------
  restaurantSeats: 48,
  barSeats: 24,
  /** Treatment rooms and the daily opening window of the small spa. */
  treatmentRooms: 2,
  wellnessOpenMinutes: 6 * 60,
  wellnessSqm: 90,
  wellnessTreatmentPriceMinor: 5500,
  /** Gym floor and stations. */
  fitnessSqm: 48,
  fitnessStations: 6,
  /** The one conference room the house starts with. */
  conferenceSqm: 180,
  conferenceCapacity: 120,
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
} as const;

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
