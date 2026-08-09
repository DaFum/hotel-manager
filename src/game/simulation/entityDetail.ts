import type { GameState } from "./initialState";

/** One entity as the UI asked for it, with the kind it turned out to be. */
export interface EntityDetail {
  kind: string;
  detail: unknown;
}

/**
 * Resolves a stable id to the one thing it names.
 *
 * Answering a request for a room with the whole hotel is not an answer, so
 * this looks the id up in each collection that owns stable ids and returns
 * null — not a snapshot — when nothing carries it.
 */
export function entityDetail(
  state: GameState,
  entityId: string,
): EntityDetail | null {
  const room = state.hotel.rooms.find((r) => r.id === entityId);
  if (room)
    return {
      kind: "room",
      detail: {
        ...room,
        // What the player wants to know about a room is who is in it.
        stay: state.stays.find((s) => s.roomId === room.id) ?? null,
      },
    };

  const reservation = state.reservations.find((b) => b.id === entityId);
  if (reservation) return { kind: "reservation", detail: reservation };

  const member = state.staff.find((m) => m.id === entityId);
  if (member) return { kind: "staff", detail: member };

  const asset = state.assets.find((a) => a.id === entityId);
  if (asset) return { kind: "asset", detail: asset };

  const facility = state.facilities.find((f) => f.id === entityId);
  if (facility) return { kind: "facility", detail: facility };

  const conference = state.events.find((e) => e.id === entityId);
  if (conference) return { kind: "conference", detail: conference };

  const competitor = state.competitors.find((c) => c.id === entityId);
  if (competitor) return { kind: "competitor", detail: competitor };

  if (entityId === state.hotel.id)
    return {
      kind: "hotel",
      detail: {
        id: state.hotel.id,
        name: state.hotel.name,
        rooms: state.hotel.rooms.length,
        classification: state.classification,
        metrics: state.metrics,
      },
    };

  return null;
}
