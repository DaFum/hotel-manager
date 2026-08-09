import { describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  createCamera,
  detailFor,
  focusCamera,
  lightingFor,
  panCamera,
  selectFloor,
  visibleFloor,
  zoomCamera,
} from "./camera";
import { findPath, type NavigationNode } from "./navigationGraph";
import { elevatorVisual, materializeAgents } from "./agentMaterialization";
import { isoProject, isoUnproject } from "./isoProjection";
import { TILE_HEIGHT, TILE_WIDTH } from "./PixiHotelScene";

const NODES: NavigationNode[] = [
  { id: "room.101", kind: "room", links: ["door.101"] },
  { id: "door.101", kind: "door", links: ["room.101", "corridor.1"] },
  {
    id: "corridor.1",
    kind: "corridor",
    links: ["door.101", "stairs.1", "lift.1"],
  },
  { id: "stairs.1", kind: "stairs", links: ["corridor.1", "lobby"] },
  { id: "lift.1", kind: "elevator", links: ["corridor.1", "lobby"] },
  { id: "lobby", kind: "corridor", links: ["stairs.1", "lift.1"] },
];

describe("the operational world contract", () => {
  it("pans and zoom within declared bounds", () => {
    const camera = panCamera(createCamera(), { x: 40, y: -20 });
    expect(camera).toMatchObject({ x: 40, y: -20 });
    expect(zoomCamera(camera, 99).zoom).toBe(MAX_ZOOM);
    expect(zoomCamera(camera, 0).zoom).toBe(MIN_ZOOM);
  });

  it("focuses a room, a person and a problem through the same camera", () => {
    for (const kind of ["room", "person", "problem", "facility"] as const) {
      const focused = focusCamera(createCamera(), {
        id: `target.${kind}`,
        x: 12,
        y: 34,
        floor: 2,
        kind,
      });
      expect(focused.focusedId).toBe(`target.${kind}`);
      expect(focused.floor).toBe(2);
      expect(focused).toMatchObject({ x: 12, y: 34 });
    }
  });

  it("cuts away above the selected floor, and shows everything when it does not", () => {
    const cut = selectFloor(createCamera(), 2);
    expect(cut.cutaway).toBe(true);
    expect(visibleFloor(1, cut)).toBe(true);
    expect(visibleFloor(2, cut)).toBe(true);
    expect(visibleFloor(3, cut)).toBe(false);

    const whole = selectFloor(createCamera(), 2, false);
    expect(visibleFloor(3, whole)).toBe(true);
    expect(() => selectFloor(createCamera(), -1)).toThrow(/floor/);
  });

  it("changes the level of detail with the zoom, not with the hardware", () => {
    expect(detailFor(0.6)).toBe("aggregate");
    expect(detailFor(1)).toBe("rooms");
    expect(detailFor(2)).toBe("people");
  });

  it("lights the world by the hotel clock", () => {
    expect(lightingFor(600)).toBe("day");
    expect(lightingFor(1140)).toBe("evening");
    expect(lightingFor(60)).toBe("night");
  });

  it("keeps a click target stable through projection and back", () => {
    for (const [gridX, gridY] of [
      [0, 0],
      [3, 5],
      [11, 2],
    ]) {
      const screen = isoProject(gridX, gridY, TILE_WIDTH, TILE_HEIGHT);
      expect(isoUnproject(screen.x, screen.y, TILE_WIDTH, TILE_HEIGHT)).toEqual(
        { gridX, gridY },
      );
    }
  });

  it("routes through doors, corridors, stairs and lifts", () => {
    const path = findPath(NODES, "room.101", "lobby");
    expect(path[0]).toBe("room.101");
    expect(path.at(-1)).toBe("lobby");
    expect(path).toContain("door.101");
    expect(path).toContain("corridor.1");
  });

  it("routes around a closure instead of walking through it", () => {
    const closedLift = NODES.map((node) =>
      node.id === "lift.1" ? { ...node, closed: true } : node,
    );
    const path = findPath(closedLift, "room.101", "lobby");
    expect(path).toContain("stairs.1");
    expect(path).not.toContain("lift.1");

    // With both ways out shut there is no path at all, rather than a fake one.
    const sealed = closedLift.map((node) =>
      node.id === "stairs.1" ? { ...node, closed: true } : node,
    );
    expect(findPath(sealed, "room.101", "lobby")).toEqual([]);
  });

  it("gives the lift a queue, a wait and a named cause", () => {
    const busy = elevatorVisual({
      id: "asset.elevator",
      capacity: 6,
      queue: 18,
      travelMinutes: 2,
      failed: false,
    });
    expect(busy.waitMinutes).toBe(6);
    expect(busy.cause).toBe("queue exceeds car capacity");

    const failed = elevatorVisual({
      id: "asset.elevator",
      capacity: 6,
      queue: 2,
      travelMinutes: 2,
      failed: true,
    });
    expect(failed.cause).toBe("out of service");
    expect(failed.waitMinutes).toBeGreaterThan(busy.waitMinutes);
  });

  it("bounds visible agents and picks the same ones every time", () => {
    const agents = Array.from({ length: 500 }, (_, i) => ({
      id: `agent.${String(i).padStart(3, "0")}`,
      kind: "guest" as const,
      locationId: "lobby",
    }));
    const shown = materializeAgents(agents, 200);
    expect(shown).toHaveLength(200);
    // Deterministic and order-independent: the same set, whatever the input
    // order, so a visible crowd never changes what the simulation decided.
    expect(materializeAgents([...agents].reverse(), 200)).toEqual(shown);
    expect(() => materializeAgents(agents, -1)).toThrow(/limit/);
  });
});
