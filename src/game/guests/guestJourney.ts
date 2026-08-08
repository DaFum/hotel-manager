import type { RoomState } from "../rooms/roomState";

export interface AssignableRoom {
  id: string;
  category: string;
  state: RoomState | string;
}

/**
 * Deterministic assignment: lowest room id of the requested category that is
 * ready for a guest. Sorting by id keeps replays stable across sessions.
 */
export function assignRoom(
  rooms: AssignableRoom[],
  category: string,
): AssignableRoom | null {
  return (
    rooms
      .filter((r) => r.category === category && r.state === "VacantClean")
      .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null
  );
}

export interface ReceptionResult {
  processed: string[];
  remaining: string[];
}

export function processReceptionQueue(
  queue: string[],
  capacity: number,
): ReceptionResult {
  const served = Math.max(0, Math.min(capacity, queue.length));
  return { processed: queue.slice(0, served), remaining: queue.slice(served) };
}

export function checkOut(room: AssignableRoom): AssignableRoom {
  if (room.state !== "Occupied") throw new Error("room is not occupied");
  return { ...room, state: "VacantDirty" };
}
