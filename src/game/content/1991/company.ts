/**
 * The corporate starting position in 1991: one hotel, one holding company, one
 * flag the player has not yet earned the right to fly anywhere else. Content,
 * not conditionals — every value here is data the simulation reads.
 */
export const PLAYER_COMPANY = {
  id: "company.player",
  name: "Mainblick Hotelgesellschaft",
  reportingCurrency: "DEM",
} as const;

export const STARTER_LEGAL_ENTITY = {
  id: "entity.de.1",
  name: "Mainblick Betriebs GmbH",
  jurisdiction: "DE",
  currencyCode: "DEM",
} as const;

export const STARTER_REGION = "region.de.hessen" as const;

/** What the head office costs before it serves anybody. */
export const HEADQUARTERS = {
  baseMonthlyCostMinor: 1_200_000,
  perHotelMonthlyCostMinor: 300_000,
  /** Central staff and how many houses each of them can actually support. */
  analysts: 1,
  capacityPerAnalyst: 4,
} as const;

/** The group's hurdle rate for committing development capital, in bp. */
export const DEVELOPMENT_HURDLE_BP = 900;

/** Uncertainty the group's own feasibility studies carry, in bp of revenue. */
export const FEASIBILITY_UNCERTAINTY_BP = 1500;

/** Gross operating margin new schemes are underwritten at, in bp. */
export const UNDERWRITING_GOP_MARGIN_BP = 3200;

export const STARTER_BRANDS = [
  {
    id: "brand.mainblick",
    name: "Mainblick",
    standard: {
      minRoomQuality: 55,
      requiredFacilities: ["facility.breakfast_room"],
      minGuestSatisfaction: 55,
    },
    demandUpliftBasisPoints: 400,
    monthlyProgrammeCostMinor: 120_000,
  },
  {
    id: "brand.rheinstern",
    name: "Rheinstern Collection",
    standard: {
      minRoomQuality: 75,
      requiredFacilities: ["facility.breakfast_room", "facility.wellness"],
      minGuestSatisfaction: 70,
      minStars: 4,
    },
    demandUpliftBasisPoints: 900,
    monthlyProgrammeCostMinor: 420_000,
  },
] as const;

/** The manager the player's own house starts under, before any delegation. */
export const STARTER_MANAGER = {
  id: "manager.frankfurt.1",
  name: "Anna Keller",
  competence: 62,
} as const;

/**
 * Houses that can be bought in the region. Their hidden findings are real:
 * a buyer who skips an area inherits whatever was in it.
 */
export const ACQUISITION_TARGETS = [
  {
    id: "target.wiesbaden.1",
    hotelId: "hotel.wiesbaden.1",
    name: "Kurpark Hof",
    rooms: 68,
    askingPriceMinor: 96_000_000,
    annualGopMinor: 13_000_000,
    debtAssumedMinor: 22_000_000,
    renovationNeedMinor: 11_000_000,
    hiddenFindings: [
      {
        area: "building" as const,
        description: "flat roof at end of life",
        costMinor: 6_500_000,
      },
      {
        area: "staff" as const,
        description: "unsettled overtime claims",
        costMinor: 1_800_000,
      },
    ],
  },
  {
    id: "target.offenbach.1",
    hotelId: "hotel.offenbach.1",
    name: "Hafenhaus",
    rooms: 42,
    askingPriceMinor: 44_000_000,
    annualGopMinor: 5_400_000,
    debtAssumedMinor: 9_000_000,
    renovationNeedMinor: 7_500_000,
    hiddenFindings: [
      {
        area: "environment" as const,
        description: "fuel tank in the yard",
        costMinor: 4_200_000,
      },
    ],
  },
] as const;

/** The valuation multiple the market applies to a stabilised hotel, in bp. */
export const MARKET_GOP_MULTIPLE_BP = 78_000;
