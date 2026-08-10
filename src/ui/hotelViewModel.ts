import { detailFor, type CameraState } from "../render/camera";
import {
  materializeAgents,
  type VisualAgent,
} from "../render/agentMaterialization";
import { placeRooms } from "../render/sceneLayout";
import { getRate, isRoomCategory } from "../game/revenue/rates";
import type { GameSnapshot } from "../game/domain/snapshot";

/**
 * The isometric hotel, read off the snapshot.
 *
 * Everything here is a projection: it decides what the world shows, never what
 * the world is. The worker owns the rules, so a mistake in this file can make
 * the building look wrong but can never make the hotel behave wrong.
 */

/** People drawn at once before the scene stops adding more. */
export const VISIBLE_PEOPLE_LIMIT = 60;

/**
 * Who is in the building. Guests come from the stays the house has checked in
 * and from the parties still waiting at the desk; both are facts the snapshot
 * already holds.
 *
 * Staff are deliberately absent: the simulation rosters them by role and shift
 * but never says where any of them is standing, and a housekeeper drawn in an
 * invented corridor would be a claim the game cannot back.
 */
export function visualAgents(
  snapshot: GameSnapshot,
  camera?: CameraState,
): VisualAgent[] {
  // Far enough out, the building is read as rooms and loads, not as people.
  if (camera && detailFor(camera.zoom) !== "people") return [];

  const inRooms: VisualAgent[] = snapshot.stays.map((stay) => ({
    id: `guest.${stay.bookingId}`,
    kind: "guest",
    locationId: stay.roomId,
  }));
  const waiting: VisualAgent[] = snapshot.receptionQueue.map((entry) => ({
    id: `guest.${entry.bookingId}`,
    kind: "guest",
    locationId: "lobby",
    queuedFor: "reception",
  }));

  return materializeAgents([...waiting, ...inRooms], VISIBLE_PEOPLE_LIMIT);
}

/** Tonight's asking price per room category, in minor units. */
export function rateByCategory(
  snapshot: GameSnapshot,
  defaults: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const room of snapshot.hotel.rooms) {
    if (rates[room.category] !== undefined) continue;
    // A category the rate grid does not price is shown at whatever the house
    // last declared for it, rather than silently at zero.
    if (!isRoomCategory(room.category)) {
      rates[room.category] = defaults[room.category] ?? 0;
      continue;
    }
    rates[room.category] = getRate(
      snapshot.rates,
      snapshot.calendar.dateKey,
      room.category,
      defaults[room.category] ?? 0,
    );
  }
  return rates;
}

/**
 * The rooms a running renovation has taken out of service. The job names the
 * module it is converting, and the rooms fitted out to that module are the
 * ones the guest cannot have.
 */
export function renovatingRoomIds(snapshot: GameSnapshot): string[] {
  const job = snapshot.renovation;
  if (!job) return [];
  return snapshot.hotel.rooms
    .filter((room) => room.moduleId === job.moduleId)
    .map((room) => room.id);
}

/**
 * Where a room sits in the world, so that choosing it anywhere can move the
 * one camera the scene uses. A room the layout does not know keeps the camera
 * where it is rather than throwing it to the origin.
 */
export function roomFocusPoint(
  roomId: string,
  snapshot: GameSnapshot,
  fallback: { x: number; y: number; floor: number } = { x: 0, y: 0, floor: 0 },
): { x: number; y: number; floor: number } {
  const placement = placeRooms(
    snapshot.hotel.rooms,
    snapshot.renderDescriptors.floorByRoomId,
  ).find((candidate) => candidate.id === roomId);
  return placement
    ? { x: placement.x, y: placement.y, floor: placement.floor }
    : fallback;
}

/**
 * Alerts as places to go. An alert that names a room is pinned to that room;
 * one that names nothing in particular stays a problem about the house, and
 * says so by keeping the camera where the player left it.
 */
export function worldProblems(snapshot: GameSnapshot): {
  id: string;
  title: string;
  cause: string;
  floor: number;
  x: number;
  y: number;
  kind: "problem" | "room";
}[] {
  return snapshot.alerts.map((alert) => {
    const roomId = snapshot.hotel.rooms.find(
      (room) => alert.id.includes(room.id) || alert.cause.includes(room.id),
    )?.id;
    const point = roomId
      ? roomFocusPoint(roomId, snapshot)
      : { x: 0, y: 0, floor: 0 };
    return {
      id: alert.id,
      title: alert.title,
      cause: alert.cause,
      ...point,
      kind: roomId ? ("room" as const) : ("problem" as const),
    };
  });
}
