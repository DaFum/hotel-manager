import { MAX_RATE_MINOR, MIN_RATE_MINOR } from "../revenue/rates";
import { strategyProfile, type Strategy } from "./strategies";

/**
 * Competitor pricing and the split of the city's room nights. There is one
 * market model, not a player one and an AI one: rivals are held to the same
 * rate bounds and win nights only by being cheaper or more appealing.
 */

/** Occupancy below which a house starts discounting, in basis points. */
const SOFT_OCCUPANCY_BP = 6000;
/** Occupancy above which a house starts pushing rate, in basis points. */
const TIGHT_OCCUPANCY_BP = 8500;

/** What a rival asks tonight, in whole Pfennig. */
export function competitorRateMinor(i: {
  /** The market rate this house believes it sees. */
  observedMarketRateMinor: number;
  strategy: Strategy;
  /** Its own occupancy, in basis points. */
  occupancyBp: number;
}): number {
  if (
    !Number.isSafeInteger(i.observedMarketRateMinor) ||
    i.observedMarketRateMinor <= 0
  )
    throw new Error("invalid observed market rate");
  if (!Number.isFinite(i.occupancyBp) || i.occupancyBp < 0)
    throw new Error("invalid occupancy");
  const profile = strategyProfile(i.strategy);

  let adjustmentBp = 0;
  if (i.occupancyBp < SOFT_OCCUPANCY_BP)
    adjustmentBp = -Math.round(
      (profile.discountAppetiteBp * (SOFT_OCCUPANCY_BP - i.occupancyBp)) /
        SOFT_OCCUPANCY_BP,
    );
  else if (i.occupancyBp > TIGHT_OCCUPANCY_BP)
    adjustmentBp = Math.round(
      (profile.discountAppetiteBp *
        Math.min(10000, i.occupancyBp - TIGHT_OCCUPANCY_BP)) /
        (2 * (10000 - TIGHT_OCCUPANCY_BP)),
    );

  const rate = Math.round(
    (i.observedMarketRateMinor *
      profile.positioningBp *
      (10000 + adjustmentBp)) /
      1e8,
  );
  // The same slice bounds the player's rate grid enforces.
  return Math.max(MIN_RATE_MINOR, Math.min(MAX_RATE_MINOR, rate));
}

/** One competing house as the market sees it. */
export interface MarketHouse {
  id: string;
  rooms: number;
  rateMinor: number;
  /** Product appeal, in basis points; 10000 is an ordinary house. */
  appealBp: number;
}

/**
 * Splits the city's room nights between the houses on offer. A guest weighs
 * appeal against price, so a cheaper house wins more nights but never the
 * whole city, and no house sells a room it does not have. The result is
 * order-independent: houses are weighed in stable id order.
 */
export function allocateRoomNights(
  roomNights: number,
  houses: readonly MarketHouse[],
): Record<string, number> {
  if (!Number.isSafeInteger(roomNights) || roomNights < 0)
    throw new Error("invalid city room nights");
  const sold: Record<string, number> = {};
  for (const h of houses) {
    if (!Number.isSafeInteger(h.rooms) || h.rooms < 0)
      throw new Error(`invalid rooms for ${h.id}`);
    if (!Number.isSafeInteger(h.rateMinor) || h.rateMinor <= 0)
      throw new Error(`invalid rate for ${h.id}`);
    sold[h.id] = 0;
  }

  const open = [...houses]
    .filter((h) => h.rooms > 0 && h.appealBp > 0)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  let remaining = Math.min(
    roomNights,
    open.reduce((n, h) => n + h.rooms, 0),
  );

  while (remaining > 0 && open.length > 0) {
    // Guests trade appeal against price: twice the rate needs twice the
    // appeal to win the same share.
    const weights = open.map((h) => (h.appealBp * 1e6) / h.rateMinor);
    const totalWeight = weights.reduce((n, w) => n + w, 0);
    if (totalWeight <= 0) break;

    const exact = weights.map((w) => (remaining * w) / totalWeight);
    const draft = exact.map((x) => Math.floor(x));
    // Largest remainder, ties broken by the already-stable id order.
    const order = exact
      .map((x, index) => ({ index, frac: x - Math.floor(x) }))
      .sort((a, b) => b.frac - a.frac || a.index - b.index);
    let left = remaining - draft.reduce((n, v) => n + v, 0);
    for (const { index } of order) {
      if (left <= 0) break;
      draft[index] += 1;
      left -= 1;
    }

    let placed = 0;
    const capped: MarketHouse[] = [];
    open.forEach((h, index) => {
      const room = h.rooms - sold[h.id];
      const take = Math.min(room, draft[index]);
      sold[h.id] += take;
      placed += take;
      if (sold[h.id] >= h.rooms) capped.push(h);
    });
    remaining -= placed;
    if (capped.length === 0) break;
    for (const h of capped) open.splice(open.indexOf(h), 1);
  }

  return sold;
}
