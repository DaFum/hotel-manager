import type { GameState } from "./initialState";

/**
 * Invariants are checked after every quantum so a determinism break surfaces
 * where it happened instead of many days later in a save file.
 */
export function assertInvariants(state: GameState): void {
  const cash = state.finance?.cashMinor;
  if (!Number.isSafeInteger(cash))
    throw new Error("cash must be whole Pfennig");
  if (cash < 0) throw new Error("cash must not be negative");

  const ids = new Set<string>();
  for (const room of state.hotel?.rooms ?? []) {
    if (ids.has(room.id)) throw new Error(`duplicate room id ${room.id}`);
    ids.add(room.id);
    if (room.cleanliness < 0 || room.cleanliness > 100)
      throw new Error(`room ${room.id} cleanliness out of range`);
  }

  const minute = state.calendar?.minuteOfDay;
  if (!Number.isSafeInteger(minute) || minute < 0 || minute >= 1440)
    throw new Error("minute of day out of range");
}
