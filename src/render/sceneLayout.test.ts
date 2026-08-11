import { describe, expect, it } from "vitest";
import { createCamera, selectFloor, zoomCamera } from "./camera";
import { TILE_HEIGHT, TILE_WIDTH } from "./tileMetrics";
import {
  AGENT_LIFT,
  buildingCentre,
  FLOOR_HEIGHT,
  placeAgents,
  placeRooms,
  roomConcern,
  stageTransform,
  visiblePlacements,
  type LayoutRoom,
} from "./sceneLayout";
import * as sceneLayout from "./sceneLayout";

const ROOMS: LayoutRoom[] = [
  { id: "room.101", category: "single", state: "VacantClean", cleanliness: 90 },
  { id: "room.102", category: "single", state: "VacantDirty", cleanliness: 20 },
  { id: "room.201", category: "double", state: "Occupied", cleanliness: 80 },
  { id: "room.202", category: "double", state: "OutOfOrder", cleanliness: 10 },
];

const FLOORS = {
  "room.101": 1,
  "room.102": 1,
  "room.201": 2,
  "room.202": 2,
};

describe("the hotel as a building", () => {
  it("keeps camera focus and selection as two distinct marks", () => {
    const markerKindsForEntity = (
      sceneLayout as typeof sceneLayout & {
        markerKindsForEntity?: (
          entityId: string,
          selectedId: string | null,
          focusedId: string | null,
        ) => string[];
      }
    ).markerKindsForEntity;

    expect(markerKindsForEntity).toBeTypeOf("function");
    expect(markerKindsForEntity?.("room.101", "room.101", "room.101")).toEqual(
      ["selection", "focus"],
    );
  });

  it("stacks rooms onto the floor the simulation put them on", () => {
    const placed = placeRooms(ROOMS, FLOORS, 2);

    expect(placed.map((p) => p.id)).toEqual([
      "room.101",
      "room.102",
      "room.201",
      "room.202",
    ]);
    expect(placed.map((p) => p.floor)).toEqual([1, 1, 2, 2]);
    // Each floor lays out from its own origin, so room 201 sits above 101
    // rather than continuing its row.
    expect(placed[2].gridX).toBe(0);
    expect(placed[0].y - placed[2].y).toBe(FLOOR_HEIGHT);
  });

  it("puts a room with no declared floor on the ground rather than dropping it", () => {
    const placed = placeRooms(ROOMS, { "room.101": 3 }, 2);

    expect(placed).toHaveLength(4);
    expect(placed.find((p) => p.id === "room.202")?.floor).toBe(0);
  });

  it("orders floors from the ground up whatever order the rooms arrive in", () => {
    const shuffled = [ROOMS[3], ROOMS[0], ROOMS[2], ROOMS[1]];

    expect(placeRooms(shuffled, FLOORS, 2).map((p) => p.floor)).toEqual([
      1, 1, 2, 2,
    ]);
  });

  it("names what is wrong with a room instead of only colouring it", () => {
    expect(roomConcern("OutOfOrder", 10)).toBe("out-of-service");
    expect(roomConcern("Blocked", 90)).toBe("out-of-service");
    expect(roomConcern("VacantDirty", 20)).toBe("needs-cleaning");
    expect(roomConcern("Occupied", 80)).toBe("none");
    // A room can be nominally clean and still be below a sellable standard.
    expect(roomConcern("VacantClean", 40)).toBe("needs-cleaning");
    expect(roomConcern("VacantClean", 90)).toBe("none");
    // A room under construction returns "under-construction" regardless of its cleanliness or occupancy.
    expect(roomConcern("VacantClean", 100, true)).toBe("under-construction");
    expect(roomConcern("Occupied", 50, true)).toBe("under-construction");
  });

  it("cuts the building away above the floor the player is looking at", () => {
    const placed = placeRooms(ROOMS, FLOORS, 2);
    const cut = visiblePlacements(placed, selectFloor(createCamera(), 1, true));

    expect(cut.map((p) => p.id)).toEqual(["room.101", "room.102"]);
    expect(
      visiblePlacements(placed, selectFloor(createCamera(), 1, false)),
    ).toHaveLength(4);
  });

  it("moves the stage under the camera without ever moving the camera", () => {
    const camera = zoomCamera({ ...createCamera(), x: 40, y: 20 }, 2);
    const transform = stageTransform(camera, { width: 800, height: 400 });

    expect(transform.scale).toBe(2);
    // The camera's point sits in the middle of the viewport, not its corner.
    expect(transform.x).toBe(800 / 2 - 40 * 2);
    expect(transform.y).toBe(400 / 2 - 20 * 2);
  });

  it("puts people where they are, and queues them where they wait", () => {
    const placed = placeRooms(ROOMS, FLOORS, 2);
    const agents = placeAgents(
      [
        { id: "guest.1", kind: "guest", locationId: "room.201" },
        {
          id: "guest.2",
          kind: "guest",
          locationId: "lobby",
          queuedFor: "desk",
        },
        {
          id: "guest.3",
          kind: "guest",
          locationId: "lobby",
          queuedFor: "desk",
        },
        { id: "staff.1", kind: "staff", locationId: "room.102" },
      ],
      placed,
      { x: 0, y: 0 },
    );

    // A person stands on the middle of their tile, lifted clear of the floor.
    const inRoom = agents.find((a) => a.id === "guest.1");
    const room201 = placed.find((p) => p.id === "room.201");
    const tileCentreY = room201!.y + TILE_HEIGHT / 2;
    expect(inRoom?.y).toBe(tileCentreY - AGENT_LIFT);
    expect(agents.find((a) => a.id === "staff.1")?.kind).toBe("staff");

    // Two people waiting for the same desk stand in a line, not on one spot.
    const queued = agents.filter((a) => a.queued);
    expect(queued).toHaveLength(2);
    expect(queued[0].x).not.toBe(queued[1].x);
  });

  it("drops a person whose location is not in the building", () => {
    const placed = placeRooms(ROOMS, FLOORS, 2);

    expect(
      placeAgents(
        [{ id: "guest.9", kind: "guest", locationId: "room.999" }],
        placed,
        { x: 0, y: 0 },
      ),
    ).toEqual([]);
  });

  it("places the same people in the same spots for the same snapshot", () => {
    const placed = placeRooms(ROOMS, FLOORS, 2);
    const agents = [
      { id: "guest.1", kind: "guest" as const, locationId: "room.201" },
      { id: "guest.2", kind: "guest" as const, locationId: "room.201" },
    ];

    expect(placeAgents(agents, placed, { x: 0, y: 0 })).toEqual(
      placeAgents(agents, placed, { x: 0, y: 0 }),
    );
  });
});

describe("framing the building", () => {
  it("puts the camera's origin in the middle of the house, not beside it", () => {
    const placed = placeRooms(ROOMS, FLOORS, 2);
    const centre = buildingCentre(placed);

    const xs = placed.map((p) => p.x);
    expect(centre.x).toBeGreaterThanOrEqual(Math.min(...xs));
    expect(centre.x).toBeLessThanOrEqual(Math.max(...xs) + TILE_WIDTH);

    // An unmoved camera frames that centre in the middle of the viewport.
    const transform = stageTransform(
      createCamera(),
      { width: 800, height: 400 },
      centre,
    );
    expect(transform.x).toBe(400 - centre.x);
    expect(transform.y).toBe(200 - centre.y);
  });

  it("has a centre even before a single room is built", () => {
    expect(buildingCentre([])).toEqual({ x: 0, y: 0 });
  });
});
