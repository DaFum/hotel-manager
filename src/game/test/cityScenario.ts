import { createRngStreams } from "../domain/rng";
import { addDays, daysInMonth } from "../domain/calendar";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { CITY } from "../content/1991/frankfurt";
import {
  advanceCityMonth,
  allocateCityDay,
  createCityMarket,
  createCompetitors,
  recordPlayerRoomNights,
  averageRateMinor,
  type CompetitorRecord,
  type PlayerHouse,
} from "../city/cityMarket";
import { totalRoomNights } from "../city/demand";

export interface CityScenarioResult {
  years: number;
  /** Rivals still trading at the end of the run. */
  activeCompetitors: number;
  /** Rooms on offer in the city, the player's house included. */
  hotelSupply: number;
  /** Houses that entered and houses that went under during the run. */
  entries: number;
  exits: number;
  /** The city's room nights in the final month. */
  cityRoomNights: number;
  landPriceMinor: number;
  wagePressureBp: number;
  marketRateMinor: number;
  /** The lowest number of rivals the city was ever down to. */
  minActiveCompetitors: number;
}

/** The player's house as the market model sees it, held steady for the run. */
function playerHouse(): PlayerHouse {
  return {
    id: STARTER_HOTEL.id,
    rooms: STARTER_HOTEL.roomCount,
    rateMinor: Math.round(
      (STARTER_HOTEL.defaultRateMinor.single +
        STARTER_HOTEL.defaultRateMinor.double) /
        2,
    ),
    appealBp: 10000,
    conferenceSeats: Math.floor(
      STARTER_HOTEL.conferenceSqm / STARTER_HOTEL.conferenceSqmPerSeat,
    ),
  };
}

/** First day of the month `months` after the campaign start. */
function monthKey(monthsFromStart: number): string {
  const year = 1991 + Math.floor(monthsFromStart / 12);
  const month = (monthsFromStart % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Runs the city market for whole years at its own monthly resolution: the
 * same functions the simulation calls each month, driven by the same seeded
 * streams. It answers one question a decade-long campaign has to answer yes
 * to — is this still a market, with rivals in it and rooms on offer?
 */
export function runCityYears(years: number, seed = 424242): CityScenarioResult {
  if (!Number.isSafeInteger(years) || years <= 0)
    throw new Error("invalid years");
  const streams = createRngStreams(seed);
  const player = playerHouse();
  let market = createCityMarket(CITY.startDateKey);
  let competitors: CompetitorRecord[] = createCompetitors();

  let entries = 0;
  let exits = 0;
  let minActive = competitors.length;

  for (let month = 0; month < years * 12; month++) {
    const endedMonthKey = monthKey(month);
    // Trade the month day by day, so rivals earn the nights they actually win.
    let dateKey = endedMonthKey;
    for (let day = 0; day < daysInMonth(endedMonthKey); day++) {
      const allocation = allocateCityDay(market, competitors, player, dateKey);
      // The aggregate scenario assumes the steady player realizes its whole
      // allocation; the real simulation records only accepted bookings.
      recordPlayerRoomNights(market, allocation.playerRoomNights);
      dateKey = addDays(dateKey, 1);
    }

    const before = new Set(competitors.map((c) => c.id));
    competitors = advanceCityMonth(market, competitors, player, {
      endedMonthKey,
      dateKey: monthKey(month + 1),
      economy: streams.economy,
      ai: streams.AI,
    });
    const after = new Set(competitors.map((c) => c.id));
    for (const id of before) if (!after.has(id)) exits += 1;
    for (const id of after) if (!before.has(id)) entries += 1;
    minActive = Math.min(minActive, competitors.length);
  }

  return {
    years,
    activeCompetitors: competitors.length,
    hotelSupply: competitors.reduce((n, c) => n + c.rooms, 0) + player.rooms,
    entries,
    exits,
    cityRoomNights: totalRoomNights(market.demand),
    landPriceMinor: market.landPriceMinor,
    wagePressureBp: market.wagePressureBp,
    marketRateMinor: averageRateMinor(competitors, player),
    minActiveCompetitors: minActive,
  };
}
