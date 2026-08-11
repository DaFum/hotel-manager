import { detailFor, type CameraState } from "../render/camera";
import {
  materializeAgents,
  type VisualAgent,
} from "../render/agentMaterialization";
import { resolveEntityPosition } from "../render/sceneLayout";
import { VISIBLE_AGENT_BUDGET } from "../game/simulation/materialization";
import { getRate, isRoomCategory } from "../game/revenue/rates";
import type { GameSnapshot } from "../game/domain/snapshot";

/**
 * The isometric hotel, read off the snapshot.
 *
 * Everything here is a projection: it decides what the world shows, never what
 * the world is. The worker owns the rules, so a mistake in this file can make
 * the building look wrong but can never make the hotel behave wrong.
 */

/**
 * Who is in the building. Locations, routes, and activity come directly from
 * worker descriptors; React never infers where a person ought to be.
 */
export function visualAgents(
  snapshot: GameSnapshot,
  camera?: CameraState,
): VisualAgent[] {
  // Far enough out, the building is read as rooms and loads, not as people.
  if (camera && detailFor(camera.zoom) !== "people") return [];

  // The house's own budget, not a second number invented beside it: the
  // simulation already declares how many agents may be drawn at once.
  return materializeAgents(
    snapshot.renderDescriptors.agents,
    VISIBLE_AGENT_BUDGET,
  );
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
  const placement = resolveEntityPosition(
    snapshot.renderDescriptors.positionByEntityId,
    roomId,
  );
  return placement
    ? { x: placement.x, y: placement.y, floor: placement.floor }
    : fallback;
}

/**
 * Alerts as places to go. Only authoritative structured targets are exposed;
 * unresolved and non-spatial alerts stay in the alert panel.
 */
export function worldProblems(snapshot: GameSnapshot): {
  id: string;
  entityId: string;
  title: string;
  cause: string;
  causeValues?: Record<string, string | number>;
  floor: number;
  x: number;
  y: number;
  kind: "facility" | "problem" | "room";
}[] {
  return snapshot.alerts.flatMap((alert) => {
    if (!alert.target) return [];
    const placement = resolveEntityPosition(
      snapshot.renderDescriptors.positionByEntityId,
      alert.target.entityId,
    );
    if (!placement) return [];
    return [
      {
        id: alert.id,
        entityId: alert.target.entityId,
        // The keys remain intact, UI handles resolving them
        title: alert.title,
        cause: alert.cause,
        causeValues: alert.causeValues,
        x: placement.x,
        y: placement.y,
        floor: placement.floor,
        kind:
          alert.target.kind === "navigation"
            ? ("problem" as const)
            : alert.target.kind,
      },
    ];
  });
}
