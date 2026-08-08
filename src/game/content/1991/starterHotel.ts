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
] as const;
