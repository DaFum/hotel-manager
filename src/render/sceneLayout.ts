import { visibleFloor, type CameraState, type Point } from "./camera";
import { isoProject } from "./isoProjection";
import { TILE_HEIGHT, TILE_WIDTH } from "./tileMetrics";
import type { RoomState } from "../game/rooms/roomState";
import type { VisualAgent } from "./agentMaterialization";

/**
 * Where the building is, in pixels — the pure half of the isometric scene.
 *
 * Pixi draws; this module decides. Keeping the arithmetic here means the
 * building's layout, its cutaway and the placement of everybody standing in it
 * can be tested without a GPU, and means the renderer stays what the
 * conventions require it to be: a deterministic projection of a snapshot that
 * owns no rules of its own.
 */

/** Screen rise between one floor and the next. */
export const FLOOR_HEIGHT = 40;

/** How far above its tile a person's mark floats, so they read as standing. */
export const AGENT_LIFT = 10;

/** Step between two people waiting in the same queue. */
export const QUEUE_STEP = 9;

/**
 * Below this, a room is not fit to sell even if nobody has marked it dirty.
 * The threshold is presentation only: the simulation decides what it means to
 * be clean, this decides when the building should show it.
 */
export const SELLABLE_CLEANLINESS = 60;

export interface LayoutRoom {
  id: string;
  category: string;
  state: RoomState | string;
  cleanliness: number;
}

export interface RoomPlacement {
  id: string;
  category: string;
  state: string;
  cleanliness: number;
  floor: number;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
}

export interface AgentPlacement {
  id: string;
  kind: VisualAgent["kind"];
  x: number;
  y: number;
  queued: boolean;
}

/**
 * What is wrong with a room, in words. The scene colours by this and the DOM
 * says it out loud, so the two views never disagree and neither of them
 * carries the meaning in hue alone.
 */
export type RoomConcern =
  "under-construction" | "out-of-service" | "needs-cleaning" | "none";

export function roomConcern(
  state: string,
  cleanliness: number,
  underConstruction = false,
): RoomConcern {
  // A room being rebuilt outranks every other reading of it: it is floor area
  // that is deliberately earning nothing, which is a different fact from a
  // room that is merely broken.
  if (underConstruction) return "under-construction";
  if (state === "OutOfOrder" || state === "Blocked") return "out-of-service";
  if (state === "VacantDirty") return "needs-cleaning";
  // An occupied room is the guest's business until they leave.
  if (state === "Occupied" || state === "Reserved") return "none";
  return cleanliness < SELLABLE_CLEANLINESS ? "needs-cleaning" : "none";
}

/**
 * Lays the rooms out as a building: one grid per floor, floors stacked from
 * the ground up. Rooms arrive in whatever order the snapshot holds them, so
 * the floors are sorted here — the ground floor must be the ground floor
 * however the worker happens to have listed its rooms.
 */
export function placeRooms(
  rooms: readonly LayoutRoom[],
  floorByRoomId: Readonly<Record<string, number>>,
  columns = 6,
): RoomPlacement[] {
  const width = Math.max(1, Math.floor(columns));
  const byFloor = new Map<number, LayoutRoom[]>();
  for (const room of rooms) {
    // A room the descriptors forgot still exists, and a guest may be in it.
    const floor = floorByRoomId[room.id] ?? 0;
    const bucket = byFloor.get(floor);
    if (bucket) bucket.push(room);
    else byFloor.set(floor, [room]);
  }

  return [...byFloor.keys()]
    .sort((a, b) => a - b)
    .flatMap((floor) =>
      byFloor.get(floor)!.map((room, index) => {
        const gridX = index % width;
        const gridY = Math.floor(index / width);
        const { x, y } = isoProject(gridX, gridY, TILE_WIDTH, TILE_HEIGHT);
        return {
          id: room.id,
          category: room.category,
          state: room.state,
          cleanliness: room.cleanliness,
          floor,
          gridX,
          gridY,
          x,
          y: y - floor * FLOOR_HEIGHT,
        };
      }),
    );
}

/**
 * The middle of the house, in world pixels.
 *
 * The camera's origin means "the centre of the building", not "the corner of
 * the first room the snapshot happened to list" — so a player who has not
 * moved the camera is looking at the hotel rather than at the empty space
 * beside it.
 */
export function buildingCentre(placements: readonly RoomPlacement[]): Point {
  if (placements.length === 0) return { x: 0, y: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const placement of placements) {
    minX = Math.min(minX, placement.x);
    maxX = Math.max(maxX, placement.x + TILE_WIDTH);
    minY = Math.min(minY, placement.y);
    maxY = Math.max(maxY, placement.y + TILE_HEIGHT);
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

/** The building as the camera's cutaway leaves it. */
export function visiblePlacements(
  placements: readonly RoomPlacement[],
  camera: CameraState,
): RoomPlacement[] {
  return placements.filter((placement) =>
    visibleFloor(placement.floor, camera),
  );
}

/**
 * Where to put the stage so the camera's point sits in the middle of the
 * viewport. The camera itself never moves the world; the world moves under it.
 */
export function stageTransform(
  camera: CameraState,
  viewport: { width: number; height: number },
  centre: Point = { x: 0, y: 0 },
): { x: number; y: number; scale: number } {
  return {
    x: viewport.width / 2 - (centre.x + camera.x) * camera.zoom,
    y: viewport.height / 2 - (centre.y + camera.y) * camera.zoom,
    scale: camera.zoom,
  };
}

/**
 * Puts people in the building. Somebody in a room stands on that room's tile;
 * somebody waiting stands in a line at the anchor they are waiting at, one
 * step apart, in the order the snapshot lists them.
 *
 * A person whose location is not part of the building is dropped rather than
 * drawn at the origin — a guest stacked in the corner of the lobby because
 * their room was demolished is worse than a guest who is simply not shown.
 */
export function placeAgents(
  agents: readonly VisualAgent[],
  placements: readonly RoomPlacement[],
  queueAnchor: Point,
): AgentPlacement[] {
  const tiles = new Map(placements.map((p) => [p.id, p]));
  const perTile = new Map<string, number>();
  let queued = 0;

  return agents.flatMap((agent): AgentPlacement[] => {
    if (agent.queuedFor !== undefined) {
      const index = queued++;
      return [
        {
          id: agent.id,
          kind: agent.kind,
          x: queueAnchor.x + index * QUEUE_STEP,
          y: queueAnchor.y,
          queued: true,
        },
      ];
    }

    const tile = tiles.get(agent.locationId);
    if (!tile) return [];
    // Several people in one room fan out along the tile instead of stacking.
    const index = perTile.get(agent.locationId) ?? 0;
    perTile.set(agent.locationId, index + 1);
    return [
      {
        id: agent.id,
        kind: agent.kind,
        x: tile.x + TILE_WIDTH / 2 + (index - 1) * (QUEUE_STEP / 2),
        y: tile.y + TILE_HEIGHT / 2 - AGENT_LIFT,
        queued: false,
      },
    ];
  });
}
