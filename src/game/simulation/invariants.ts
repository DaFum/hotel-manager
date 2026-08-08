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

  const minute = state.calendar.minuteOfDay;
  if (!Number.isSafeInteger(minute) || minute < 0 || minute >= 1440)
    throw new Error("minute of day out of range");
}
