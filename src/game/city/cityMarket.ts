import {
  scaleByKind,
  nextActorScale,
  type CityActor,
} from "../actors/evolution";
import {
  CITY_BASE_ROOM_NIGHTS,
  CITY_LABOR_SUPPLY,
  FRANKFURT_ACTORS,
  FRANKFURT_COMPETITORS,
  FRANKFURT_TRANSPORT,
  NEW_ENTRANT_NAMES,
  STARTING_LAND_PRICE_MINOR,
} from "../content/1991/cityMarket";
import { seasonalityBp } from "../content/1991/frankfurt";
import { GUEST_SEGMENTS } from "../content/1991/guestSegments";
import { chooseInvestment, expansionFunding } from "../competitors/investment";
import { entryOpportunity, lifecycleAction } from "../competitors/lifecycle";
import {
  competitorMonth,
  creditLineMinor,
  postsForRooms,
} from "../competitors/month";
import {
  allocateRoomNights,
  competitorRateMinor,
  type MarketHouse,
} from "../competitors/pricing";
import {
  observedMarketRateMinor,
  strategyProfile,
  targetLeverageBp,
  type Strategy,
} from "../competitors/strategies";
import {
  neutralRelation,
  rememberFairPlay,
  rememberPriceCut,
  retaliationBp,
} from "../competitors/relations";
import { daysInMonth } from "../domain/calendar";
import { forecastBand, type ForecastBand } from "../marketResearch/forecast";
import { returnOnCapitalBp } from "../competitors/investment";
import {
  buildCostMinor,
  nextPrice,
  targetPriceMinor,
  MAX_MONTHLY_MOVE_BP,
} from "../property/market";
import { vacancies, wagePressureBp } from "../labor/market";
import {
  applyRouteChange,
  connectivityIndex,
  TRANSPORT_MODES,
  type TransportNetwork,
} from "../transport/network";
import {
  sourceRoomNights,
  totalRoomNights,
  type DemandSources,
} from "./demand";
import {
  conferenceEffect,
  delayedEffect,
  FEEDBACK_DELAY_MONTHS,
} from "./feedback";

/** One rival house as the city and the save file hold it. */
export interface CompetitorRecord {
  id: string;
  name: string;
  strategy: Strategy;
  rooms: number;
  rateMinor: number;
  appealBp: number;
  cashMinor: number;
  debtMinor: number;
  /** Nights sold this month; reset when the month rolls. */
  soldRoomNights: number;
  /** Last completed month's occupancy, in basis points. */
  occupancyBp: number;
  status: "operate" | "restructure" | "exit";
  /** What this house remembers about the player, 0-100. */
  relation: number;
  /** Months since this house last opened new rooms. */
  monthsSinceBuild: number;
}

export interface CityMarketState {
  transport: TransportNetwork;
  actors: CityActor[];
  landPriceMinor: number;
  wagePressureBp: number;
  /** This month's room nights, by the source that generates them. */
  demand: DemandSources;
  /** Nights the whole city has sold this month, player included. */
  soldRoomNights: number;
  /** Delayed hotel-to-city feedback still in flight, in basis points. */
  feedbackPipeline: number[];
  /** The feedback that has matured and is being applied now. */
  eventUpliftBp: number;
  /** How good the player's market information is, 0-100. */
  informationQuality: number;
  forecast: ForecastBand;
  /** Houses built since 1991; keeps entrant ids and names stable. */
  entrantCount: number;
}

/** A stream of whole numbers; the caller owns which RNG stream it is. */
export interface RollSource {
  nextUint32(): number;
}

/** The player's house as the city market sees it. */
export interface PlayerHouse {
  id: string;
  rooms: number;
  rateMinor: number;
  appealBp: number;
  /** Delegates the player's conference space can seat. */
  conferenceSeats: number;
}

export function createCompetitors(): CompetitorRecord[] {
  return FRANKFURT_COMPETITORS.map((c) => ({
    ...c,
    soldRoomNights: 0,
    occupancyBp: 0,
    status: "operate" as const,
    relation: neutralRelation(),
    monthsSinceBuild: BUILD_COOLDOWN_MONTHS,
  }));
}

export function createCityMarket(dateKey: string): CityMarketState {
  const actors = FRANKFURT_ACTORS.map((a) => ({ ...a }));
  const demand = demandFor(dateKey, FRANKFURT_TRANSPORT, actors, 0);
  return {
    transport: { ...FRANKFURT_TRANSPORT },
    actors,
    landPriceMinor: STARTING_LAND_PRICE_MINOR,
    // The market opens at the pressure its own houses create.
    wagePressureBp: pressureForRooms(
      FRANKFURT_COMPETITORS.reduce((n, c) => n + c.rooms, 0) + 24,
      actors,
    ),
    demand,
    soldRoomNights: 0,
    feedbackPipeline: Array(FEEDBACK_DELAY_MONTHS).fill(0),
    eventUpliftBp: 0,
    informationQuality: 0,
    forecast: forecastBand(totalRoomNights(demand), 0),
    entrantCount: 0,
  };
}

/** The city's room nights for a month, with the matured hotel feedback in. */
function demandFor(
  dateKey: string,
  transport: TransportNetwork,
  actors: readonly CityActor[],
  eventUpliftBp: number,
): DemandSources {
  const byKind = scaleByKind(actors);
  const sources = sourceRoomNights({
    baseRoomNights: CITY_BASE_ROOM_NIGHTS,
    seasonalityBp: seasonalityBp(dateKey),
    connectivityIndex: connectivityIndex(transport),
    officeScale: byKind.office,
    attractionScale: byKind.attraction,
    congressScale: byKind.congress,
  });
  // The city's own conference reputation lifts the two sources it applies to.
  const lift = (n: number) =>
    Math.round((n * (10000 + Math.max(0, eventUpliftBp))) / 10000);
  return {
    ...sources,
    event: lift(sources.event),
    group: lift(sources.group),
  };
}

/** Workers the city can supply, which grows with its employers. */
function laborSupply(actors: readonly CityActor[]): number {
  return Math.max(
    1,
    Math.round((CITY_LABOR_SUPPLY * scaleByKind(actors).office) / 100),
  );
}

function pressureForRooms(rooms: number, actors: readonly CityActor[]): number {
  return wagePressureBp(
    vacancies([{ posts: postsForRooms(rooms), staffed: 0 }]),
    laborSupply(actors),
  );
}

/** Every house competing for the city's room nights, player included. */
export function cityHouses(
  competitors: readonly CompetitorRecord[],
  player: PlayerHouse,
): MarketHouse[] {
  return [
    {
      id: player.id,
      rooms: player.rooms,
      rateMinor: player.rateMinor,
      appealBp: player.appealBp,
    },
    ...competitors
      .filter((c) => c.status !== "exit")
      .map((c) => ({
        id: c.id,
        rooms: c.rooms,
        rateMinor: c.rateMinor,
        appealBp: c.appealBp,
      })),
  ];
}

/** The city's room nights for one day of the current month. */
export function dailyCityRoomNights(
  market: CityMarketState,
  dateKey: string,
): number {
  return Math.round(totalRoomNights(market.demand) / daysInMonth(dateKey));
}

/**
 * Runs one day of the city: the day's room nights are split between every
 * house on the same terms, rivals book their share, and the player's share is
 * returned as an index against the share their size alone would have won.
 * That index — not a second demand model — is what competition does to the
 * player's own booking flow.
 */
export function allocateCityDay(
  market: CityMarketState,
  competitors: CompetitorRecord[],
  player: PlayerHouse,
  dateKey: string,
): { playerShareIndex: number; playerRoomNights: number } {
  const houses = cityHouses(competitors, player);
  const nights = dailyCityRoomNights(market, dateKey);
  const sold = allocateRoomNights(nights, houses);
  for (const c of competitors)
    if (c.status !== "exit") c.soldRoomNights += sold[c.id] ?? 0;
  const playerRoomNights = sold[player.id] ?? 0;
  market.soldRoomNights += competitors.reduce(
    (sum, competitor) => sum + (sold[competitor.id] ?? 0),
    0,
  );

  const cityRooms = houses.reduce((n, h) => n + h.rooms, 0);
  const fairShare = cityRooms > 0 ? (nights * player.rooms) / cityRooms : 0;
  const index = fairShare > 0 ? playerRoomNights / fairShare : 1;
  return {
    // A house cannot lose or win the whole city on price alone in one day.
    playerShareIndex: Math.min(1.6, Math.max(0.4, index)),
    playerRoomNights,
  };
}

/** Adds only player demand that survived the real booking flow. */
export function recordPlayerRoomNights(
  market: CityMarketState,
  realizedRoomNights: number,
): void {
  if (!Number.isSafeInteger(realizedRoomNights) || realizedRoomNights < 0)
    throw new Error("invalid realized player room nights");
  market.soldRoomNights += realizedRoomNights;
  if (!Number.isSafeInteger(market.soldRoomNights))
    throw new Error("invalid city sold room nights");
}

/**
 * The occupancy a balanced city runs at. Land, wages and the city's own
 * employers are all read against this, so "tight" and "slack" mean the same
 * thing everywhere in the market.
 */
export const TARGET_OCCUPANCY_BP = 6500;
/** Own occupancy a house needs before it will add rooms, in basis points. */
const EXPANSION_OCCUPANCY_BP = 7500;
/** Months a house waits between builds; rooms are not poured in a month. */
export const BUILD_COOLDOWN_MONTHS = 12;
/** Rooms one expansion adds. */
const EXPANSION_ROOMS = 10;
/** Chance in basis points that a route changes in a given month. */
const ROUTE_CHANGE_CHANCE_BP = 200;
/** Chance in basis points that a viable market actually attracts a builder. */
const ENTRY_CHANCE_BP = 2500;
/** Rooms a new entrant opens with. */
const ENTRANT_ROOMS = 45;
/** Nights below the player's market rate that count as undercutting, in bp. */
const UNDERCUT_BP = 9000;

/**
 * One month of the city. Order is fixed and every step is deterministic: the
 * month's results settle first, then owners act on what they see, then the
 * city itself moves under all of them.
 */
export function advanceCityMonth(
  market: CityMarketState,
  competitors: CompetitorRecord[],
  player: PlayerHouse,
  input: {
    /** The month that just ended, for closing it. */
    endedMonthKey: string;
    /** The month now beginning, for the demand it will carry. */
    dateKey: string;
    economy: RollSource;
    ai: RollSource;
  },
): CompetitorRecord[] {
  const nightsInMonth = daysInMonth(input.endedMonthKey);
  // Season is known in advance, so no owner reads a busy trade-fair month as
  // a structurally tight market.
  const seasonBp = seasonalityBp(input.endedMonthKey);
  const deseasoned = (occupancyBp: number) =>
    Math.round((occupancyBp * 10000) / seasonBp);
  // This is the supply that traded the ending month: later exits remain in
  // its denominator, while rooms built during settlement do not appear in it.
  const tradedRoomTotal =
    competitors.reduce((rooms, competitor) => rooms + competitor.rooms, 0) +
    player.rooms;

  // --- 1. settle the month every house has just traded -------------------
  for (const c of competitors) {
    const available = c.rooms * nightsInMonth;
    c.occupancyBp =
      available > 0 ? Math.round((c.soldRoomNights * 10000) / available) : 0;
    const month = competitorMonth(c, {
      soldRoomNights: c.soldRoomNights,
      wagePressureBp: market.wagePressureBp,
    });
    c.cashMinor += month.profitMinor;
    const capital = buildCostMinor({
      rooms: c.rooms,
      landPriceMinor: market.landPriceMinor,
    });
    // A lender advances against the borrowing capacity that is left, not
    // against the asset over and over: a house that has already borrowed to
    // its tolerance cannot refinance its way out of a decade of losses.
    const headroom = Math.max(
      0,
      Math.round((capital * targetLeverageBp(c.strategy)) / 10000) -
        c.debtMinor,
    );
    const credit = Math.min(
      creditLineMinor(c.rooms, market.landPriceMinor),
      headroom,
    );
    c.status = lifecycleAction({
      cash: c.cashMinor,
      credit,
      burn: Math.max(0, -month.profitMinor),
    });

    // --- 2. what the owner does with the result --------------------------
    if (c.status === "operate") {
      const action = chooseInvestment({
        returnBp: returnOnCapitalBp(month.profitMinor * 12, capital),
        debtBp: Math.round((c.debtMinor * 10000) / Math.max(1, capital)),
        toleranceBp: targetLeverageBp(c.strategy),
      });
      const expansionCost = buildCostMinor({
        rooms: EXPANSION_ROOMS,
        landPriceMinor: market.landPriceMinor,
      });
      const funding = expansionFunding(
        expansionCost,
        c.cashMinor,
        Math.min(
          headroom,
          creditLineMinor(EXPANSION_ROOMS, market.landPriceMinor),
        ),
      );
      // Rooms are only added by a house that is actually turning guests away,
      // and no faster than a building can be put up.
      if (
        action === "expand" &&
        funding !== null &&
        deseasoned(c.occupancyBp) >= EXPANSION_OCCUPANCY_BP &&
        c.monthsSinceBuild >= BUILD_COOLDOWN_MONTHS
      ) {
        c.cashMinor -= funding.cashMinor;
        c.debtMinor += funding.debtMinor;
        c.rooms += EXPANSION_ROOMS;
        c.monthsSinceBuild = 0;
      } else if (action === "renovate") {
        const cost = Math.round(capital / 20);
        if (c.cashMinor >= cost) {
          c.cashMinor -= cost;
          // A refit buys product, and product decays without one.
          c.appealBp = Math.min(15000, c.appealBp + 200);
        }
      }
    } else if (c.status === "restructure") {
      // Distress is refinanced, not forgiven: the debt grows with the hole,
      // and only as far as the lender will still go.
      c.cashMinor += credit;
      c.debtMinor += credit;
    }
    c.soldRoomNights = 0;
    c.monthsSinceBuild += 1;
  }

  const survivors = competitors.filter((c) => c.status !== "exit");
  const survivorRoomTotal =
    survivors.reduce((rooms, competitor) => rooms + competitor.rooms, 0) +
    player.rooms;

  // --- 3. what each house remembers about the player ----------------------
  const marketRate = averageRateMinor(survivors, player);
  for (const c of survivors)
    c.relation =
      player.rateMinor * 10000 < marketRate * UNDERCUT_BP
        ? rememberPriceCut(c.relation)
        : rememberFairPlay(c.relation);

  // --- 4. next month's rates, off a market nobody sees exactly ------------
  for (const c of survivors) {
    const observed = observedMarketRateMinor(
      marketRate,
      input.ai.nextUint32() % 10000,
    );
    const base = competitorRateMinor({
      observedMarketRateMinor: observed,
      strategy: c.strategy,
      occupancyBp: c.occupancyBp,
    });
    // No house can ask more than the city's guests will pay, however dear the
    // market looks: a better product raises that ceiling, it does not remove
    // it. This is the same willingness the player's bookings are tested on.
    const ceilingMinor = Math.round(
      (topWillingnessMinor() * c.appealBp) / 10000,
    );
    c.rateMinor = Math.max(
      1,
      Math.min(
        ceilingMinor,
        Math.round((base * (10000 - retaliationBp(c.relation))) / 10000),
      ),
    );
    // Product ages between refits, so standing still costs appeal.
    c.appealBp = Math.max(4000, c.appealBp - 20);
  }

  // --- 5. the city underneath them ---------------------------------------
  const cityOccupancyBp = occupancyBpOf(
    market.soldRoomNights,
    tradedRoomTotal * nightsInMonth,
  );
  // Every structural decision — employers, land, entry — is taken on the
  // season-adjusted figure rather than on the month just traded.
  const trendOccupancyBp = deseasoned(cityOccupancyBp);
  // Employers and organisers react to how the city trades, but slowly and
  // within bounds: one soft season must not be able to empty a city.
  const actorDemandIndex = Math.max(
    85,
    Math.min(
      115,
      Math.round(100 + (trendOccupancyBp - TARGET_OCCUPANCY_BP) / 200),
    ),
  );
  market.actors = market.actors.map((a) => ({
    ...a,
    scale: nextActorScale({
      scale: a.scale,
      demand: actorDemandIndex,
      // The actor's own trade, drawn from the economy stream: ±500 bp.
      profitBp: (input.economy.nextUint32() % 1001) - 500,
    }),
  }));

  if (input.economy.nextUint32() % 10000 < ROUTE_CHANGE_CHANCE_BP) {
    const mode =
      TRANSPORT_MODES[input.economy.nextUint32() % TRANSPORT_MODES.length];
    const delta = (input.economy.nextUint32() % 11) - 4;
    market.transport = applyRouteChange(market.transport, {
      mode,
      deltaPoints: delta,
    });
  }

  market.landPriceMinor = nextPrice(
    market.landPriceMinor,
    targetPriceMinor(
      STARTING_LAND_PRICE_MINOR,
      // A city at its balanced occupancy is a city at its normal land price.
      Math.max(1, Math.round((trendOccupancyBp * 10000) / TARGET_OCCUPANCY_BP)),
    ),
    MAX_MONTHLY_MOVE_BP,
  );

  // --- 6. what the hotels have given back to the city ---------------------
  const matured = delayedEffect(
    market.feedbackPipeline,
    conferenceEffect(player.conferenceSeats),
  );
  market.feedbackPipeline = matured.pipeline;
  market.eventUpliftBp = matured.applied;

  market.wagePressureBp = pressureForRooms(survivorRoomTotal, market.actors);
  market.demand = demandFor(
    input.dateKey,
    market.transport,
    market.actors,
    market.eventUpliftBp,
  );
  market.forecast = forecastBand(
    totalRoomNights(market.demand),
    market.informationQuality,
  );

  // --- 7. who else wants in ----------------------------------------------
  const wantsIn =
    entryOpportunity({
      occupancyBp: trendOccupancyBp,
      marketRateMinor: marketRate,
      buildCostPerRoomMinor: buildCostMinor({
        rooms: 1,
        landPriceMinor: market.landPriceMinor,
      }),
    }) && input.ai.nextUint32() % 10000 < ENTRY_CHANCE_BP;
  if (wantsIn) survivors.push(newEntrant(market, input.ai, marketRate));

  market.soldRoomNights = 0;
  return survivors;
}

/** The most any segment in this city will pay for a night, in Pfennig. */
function topWillingnessMinor(): number {
  return GUEST_SEGMENTS.reduce((n, s) => Math.max(n, s.willingnessMinor), 0);
}

function occupancyBpOf(sold: number, available: number): number {
  return available > 0 ? Math.round((sold * 10000) / available) : 0;
}

/** The city's rate, weighted by the rooms actually offered at it. */
export function averageRateMinor(
  competitors: readonly CompetitorRecord[],
  player: PlayerHouse,
): number {
  const houses = cityHouses(competitors, player);
  const rooms = houses.reduce((n, h) => n + h.rooms, 0);
  if (rooms === 0) return player.rateMinor;
  return Math.round(
    houses.reduce((n, h) => n + h.rooms * h.rateMinor, 0) / rooms,
  );
}

/** A newly funded house, financed at its strategy's leverage. */
function newEntrant(
  market: CityMarketState,
  ai: RollSource,
  marketRateMinor: number,
): CompetitorRecord {
  const strategies = [
    "budget",
    "lifestyle",
    "family",
    "luxury",
    "aggressive",
  ] as const;
  const strategy = strategies[ai.nextUint32() % strategies.length];
  const index = market.entrantCount;
  market.entrantCount += 1;
  const capital = buildCostMinor({
    rooms: ENTRANT_ROOMS,
    landPriceMinor: market.landPriceMinor,
  });
  const debtMinor = Math.round((capital * targetLeverageBp(strategy)) / 10000);
  return {
    id: `hotel.entrant.${index + 1}`,
    name: NEW_ENTRANT_NAMES[index % NEW_ENTRANT_NAMES.length],
    strategy,
    rooms: ENTRANT_ROOMS,
    // It opens at its strategy's position against the market it is entering.
    rateMinor: competitorRateMinor({
      observedMarketRateMinor: marketRateMinor,
      strategy,
      occupancyBp: 7000,
    }),
    appealBp: 10000,
    cashMinor: Math.round(capital / 10),
    debtMinor,
    soldRoomNights: 0,
    occupancyBp: 0,
    status: "operate",
    relation: neutralRelation(),
    monthsSinceBuild: 0,
  };
}
