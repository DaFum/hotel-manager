import { CORE_CONTENT_REGISTRY } from "../corePack";
import type { CityActor } from "../../actors/evolution";
import type { Strategy } from "../../competitors/strategies";
import type { TransportNetwork } from "../../transport/network";

/**
 * Frankfurt's market as it stands on 1 January 1991: how the city is reached,
 * who generates its travel, what land costs, and which houses the player is
 * up against. Data, not conditionals — the rules read this, they do not know
 * these names.
 */
export const FRANKFURT_TRANSPORT: TransportNetwork = {
  rail: 70,
  airport: 80,
  road: 60,
  local: 75,
};

export const FRANKFURT_ACTORS: readonly CityActor[] = [
  { id: "actor.banks", kind: "office", scale: 120 },
  { id: "actor.chemicals", kind: "office", scale: 95 },
  { id: "actor.messe", kind: "congress", scale: 130 },
  { id: "actor.altstadt", kind: "attraction", scale: 90 },
  { id: "actor.rhein-main-fonds", kind: "investor", scale: 100 },
];

/** Room nights the city sells in a neutral month at a neutral season. */
export const CITY_BASE_ROOM_NIGHTS = 4200;

/** Land price the city starts at, in Pfennig per building plot. */
export const STARTING_LAND_PRICE_MINOR = 10_000_000;

/** Hotel workers the city's labour market can supply. */
export const CITY_LABOR_SUPPLY = 900;

/** Base monthly wage of one hotel post before market pressure, in Pfennig. */
export const BASE_MONTHLY_WAGE_MINOR = 200_000;

/** Posts one room of a running hotel needs, in hundredths of a post. */
export const POSTS_PER_HUNDRED_ROOMS = 40;

/** Operating cost of a rival house, in basis points of its room revenue. */
export const COMPETITOR_OPEX_BP = 2500;

/**
 * The standing cost of holding a room open for a month — utilities, upkeep,
 * insurance, administration — expressed as the number of that room's own
 * nights it consumes. A dearer house is a dearer house to run, so every
 * position on the market breaks even at a comparable occupancy instead of the
 * budget end being quietly unkillable.
 */
export const FIXED_COST_ROOM_NIGHTS = 8;

/** Credit a solvent rival can still draw, in basis points of its assets. */
export const COMPETITOR_CREDIT_LINE_BP = 500;

export interface CompetitorSeed {
  id: string;
  name: string;
  strategy: Strategy;
  rooms: number;
  rateMinor: number;
  /** Product appeal against an ordinary house, in basis points. */
  appealBp: number;
  cashMinor: number;
  debtMinor: number;
}

/** The houses trading in Frankfurt when the player takes over the Mainblick. */
export const FRANKFURT_COMPETITORS: readonly CompetitorSeed[] =
  CORE_CONTENT_REGISTRY.allByKind("rival")
    .filter((entry) => entry.homeCityId === "city.frankfurt")
    .sort((a, b) => a.simulationOrder - b.simulationOrder)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      strategy: entry.strategy,
      rooms: entry.rooms,
      rateMinor: entry.rateMinor,
      appealBp: entry.appealBasisPoints,
      cashMinor: entry.openingCapitalMinor,
      debtMinor: entry.openingDebtMinor,
    }));

/** Names a newly built house can be given, used in stable order. */
export const NEW_ENTRANT_NAMES: readonly string[] = [
  "Mainhof",
  "Westend Residenz",
  "Sachsenhausen Court",
  "Europaviertel Inn",
  "Bockenheim Lodge",
];
