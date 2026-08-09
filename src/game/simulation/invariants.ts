import type { GameState } from "./initialState";
import { balanceMinor } from "../finance/ledger";
import { STARTER_HOTEL } from "../content/1991/starterHotel";

/**
 * Invariants are checked after every quantum so a determinism break surfaces
 * where it happened instead of many days later in a save file.
 */
export function assertInvariants(state: GameState): void {
  if (!state.finance || !state.hotel || !state.calendar)
    throw new Error("game state is missing a required section");

  const cash = state.finance.cashMinor;
  if (!Number.isSafeInteger(cash))
    throw new Error("cash must be whole Pfennig");
  if (cash < 0) throw new Error("cash must not be negative");

  if (!Number.isSafeInteger(state.finance.payableMinor))
    throw new Error("payables must be whole Pfennig");

  // Cash is only ever moved through the ledger, so the two must agree.
  if (
    cash !==
    STARTER_HOTEL.startingCashMinor + balanceMinor(state.finance.ledger)
  )
    throw new Error("cash has drifted from the ledger");

  const ids = new Set<string>();
  for (const room of state.hotel.rooms) {
    if (ids.has(room.id)) throw new Error(`duplicate room id ${room.id}`);
    ids.add(room.id);
    if (room.cleanliness < 0 || room.cleanliness > 100)
      throw new Error(`room ${room.id} cleanliness out of range`);
  }

  // The city is authoritative state too: a rival with fractional money or a
  // negative house would corrupt every later month of the market.
  const market = state.cityMarket;
  if (!market) throw new Error("game state is missing the city market");
  if (!Number.isSafeInteger(market.landPriceMinor) || market.landPriceMinor < 0)
    throw new Error("land price must be whole Pfennig");
  for (const source of Object.values(market.demand))
    if (!Number.isSafeInteger(source) || source < 0)
      throw new Error("city demand must be whole room nights");

  const competitorIds = new Set<string>();
  for (const c of state.competitors) {
    if (competitorIds.has(c.id))
      throw new Error(`duplicate competitor id ${c.id}`);
    competitorIds.add(c.id);
    if (!Number.isSafeInteger(c.rooms) || c.rooms < 0)
      throw new Error(`competitor ${c.id} has an impossible room count`);
    if (!Number.isSafeInteger(c.cashMinor))
      throw new Error(`competitor ${c.id} cash must be whole Pfennig`);
    if (!Number.isSafeInteger(c.debtMinor) || c.debtMinor < 0)
      throw new Error(`competitor ${c.id} debt must be whole Pfennig`);
    if (!Number.isSafeInteger(c.rateMinor) || c.rateMinor <= 0)
      throw new Error(`competitor ${c.id} rate must be whole Pfennig`);
  }

  const minute = state.calendar.minuteOfDay;
  if (!Number.isSafeInteger(minute) || minute < 0 || minute >= 1440)
    throw new Error("minute of day out of range");
}
