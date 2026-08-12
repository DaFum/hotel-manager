/**
 * The city's room-night demand, split by the source that generates it. The
 * player never sees one opaque "demand" number: each source has a driver the
 * market UI can name, so a swing in occupancy can be explained by the actor
 * that caused it.
 */
export interface DemandSources {
  business: number;
  leisure: number;
  event: number;
  group: number;
}

/** The city inputs that move the four sources, all in explicit units. */
export interface DemandDrivers {
  /** Room nights the city sells in an average month at index 100. */
  baseRoomNights: number;
  /** Seasonal multiplier for the month, in basis points (10000 = neutral). */
  seasonalityBp: number;
  /** Weighted transport connectivity, 0-100. */
  connectivityIndex: number;
  /** Scale index of the office/company actors that generate business travel. */
  officeScale: number;
  /** Scale index of the attractions that generate leisure travel. */
  attractionScale: number;
  /** Scale index of the congress and fair organisers. */
  congressScale: number;
}

export interface OccupancyContributor {
  factor:
    | "businessDemandChange"
    | "competitorRoomSupplyChange"
    | "ownPriceVsMarket"
    | "eventUplift"
    | "reputationEffect";
  weight: number;
}

/** Integer marginal signals; reputation carries the exact reconciliation remainder. */
export function occupancyContributors(input: {
  occupancyMovementBp: number;
  businessDemandChangeBp: number;
  competitorRoomSupplyChangeBp: number;
  ownPriceDeltaBp: number;
  eventUpliftBp: number;
}): OccupancyContributor[] {
  for (const [key, value] of Object.entries(input))
    if (!Number.isSafeInteger(value))
      throw new Error(`invalid occupancy attribution ${key}`);
  const named: OccupancyContributor[] = [
    { factor: "businessDemandChange", weight: input.businessDemandChangeBp },
    {
      factor: "competitorRoomSupplyChange",
      weight: -input.competitorRoomSupplyChangeBp,
    },
    {
      factor: "ownPriceVsMarket",
      weight: -Math.trunc(input.ownPriceDeltaBp / 10),
    },
    { factor: "eventUplift", weight: input.eventUpliftBp },
  ];
  const explained = named.reduce((sum, item) => sum + item.weight, 0);
  if (!Number.isSafeInteger(explained))
    throw new Error("invalid occupancy attribution explained");
  const remainder = input.occupancyMovementBp - explained;
  if (!Number.isSafeInteger(remainder))
    throw new Error("invalid occupancy attribution remainder");
  return [
    ...named,
    {
      factor: "reputationEffect",
      weight: remainder,
    },
  ];
}

/** Share of baseline city demand each source carries, in basis points. */
export const SOURCE_SHARE_BP: Record<keyof DemandSources, number> = {
  business: 4200,
  leisure: 2800,
  event: 1800,
  group: 1200,
};

/**
 * How much of a source moves with its actor. The rest is structural demand a
 * city keeps even when one actor shrinks, so a single closure cannot zero out
 * a whole source.
 */
const ACTOR_ELASTICITY_BP = 6000;

/** Connectivity moves demand around a neutral index rather than scaling it. */
const NEUTRAL_CONNECTIVITY = 65;
/** Basis points of demand gained per point of connectivity above neutral. */
const CONNECTIVITY_BP_PER_POINT = 60;

function assertWhole(label: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`invalid ${label}`);
}

/** Scales a value by an index around 100, damped by the source's elasticity. */
function actorFactorBp(scale: number): number {
  return 10000 + Math.round(((scale - 100) * ACTOR_ELASTICITY_BP) / 100);
}

function connectivityFactorBp(connectivityIndex: number): number {
  return Math.max(
    2000,
    10000 +
      (connectivityIndex - NEUTRAL_CONNECTIVITY) * CONNECTIVITY_BP_PER_POINT,
  );
}

/**
 * Splits the city's room nights across its four sources. Every source shares
 * the season and the transport network; each also follows the actor family
 * that actually books it.
 */
export function sourceRoomNights(drivers: DemandDrivers): DemandSources {
  assertWhole("baseRoomNights", drivers.baseRoomNights);
  assertWhole("seasonalityBp", drivers.seasonalityBp);
  assertWhole("connectivityIndex", drivers.connectivityIndex);
  assertWhole("officeScale", drivers.officeScale);
  assertWhole("attractionScale", drivers.attractionScale);
  assertWhole("congressScale", drivers.congressScale);

  const cityFactorBp = Math.round(
    (drivers.seasonalityBp * connectivityFactorBp(drivers.connectivityIndex)) /
      10000,
  );
  const source = (shareBp: number, scale: number) =>
    Math.max(
      0,
      Math.round(
        (drivers.baseRoomNights *
          shareBp *
          cityFactorBp *
          actorFactorBp(scale)) /
          1e12,
      ),
    );

  return {
    business: source(SOURCE_SHARE_BP.business, drivers.officeScale),
    leisure: source(SOURCE_SHARE_BP.leisure, drivers.attractionScale),
    event: source(SOURCE_SHARE_BP.event, drivers.congressScale),
    group: source(SOURCE_SHARE_BP.group, drivers.congressScale),
  };
}

export function totalRoomNights(i: DemandSources): number {
  return i.business + i.leisure + i.event + i.group;
}
