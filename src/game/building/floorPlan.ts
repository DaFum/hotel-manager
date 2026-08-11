import { compareIds } from "../domain/ids";

export interface GridPosition {
  floor: number;
  gridX: number;
  gridY: number;
}

export interface RoomGeometry extends GridPosition {
  id: string;
}

export interface FloorSlab {
  floor: number;
  minGridX: number;
  minGridY: number;
  maxGridX: number;
  maxGridY: number;
}

export interface WallSegment {
  id: string;
  floor: number;
  from: { gridX: number; gridY: number };
  to: { gridX: number; gridY: number };
}

export interface CorridorSpine {
  id: string;
  floor: number;
  from: { gridX: number; gridY: number };
  to: { gridX: number; gridY: number };
  service: boolean;
}

export interface BuildingCore extends GridPosition {
  id: string;
  kind: "stairs" | "elevator";
}

export interface PlacedArea extends GridPosition {
  id: string;
  kind: "guest" | "public" | "service";
  width: number;
  depth: number;
}

export interface FloorPlanNavigationNode extends GridPosition {
  id: string;
  kind: "door" | "corridor" | "stairs" | "elevator" | "room";
  links: string[];
}

export interface FloorPlan {
  rooms: Record<string, RoomGeometry>;
  exteriorWalls: WallSegment[];
  floorSlabs: FloorSlab[];
  corridorSpines: CorridorSpine[];
  cores: BuildingCore[];
  areas: PlacedArea[];
  navigationNodes: FloorPlanNavigationNode[];
}

const ROOMS_PER_FLOOR = 12;
const ROOMS_PER_WING = 6;

const GROUND_AREAS: readonly Omit<PlacedArea, "floor">[] = [
  {
    id: "facility.reception",
    kind: "public",
    gridX: 0,
    gridY: 1,
    width: 2,
    depth: 2,
  },
  {
    id: "facility.breakfast_room",
    kind: "public",
    gridX: 2,
    gridY: 0,
    width: 4,
    depth: 2,
  },
  {
    id: "facility.kitchen",
    kind: "service",
    gridX: 6,
    gridY: 0,
    width: 3,
    depth: 2,
  },
  {
    id: "facility.maintenance",
    kind: "service",
    gridX: 9,
    gridY: 0,
    width: 2,
    depth: 2,
  },
  {
    id: "facility.bar",
    kind: "public",
    gridX: 0,
    gridY: 4,
    width: 2,
    depth: 2,
  },
  {
    id: "facility.conference",
    kind: "public",
    gridX: 8,
    gridY: 4,
    width: 3,
    depth: 2,
  },
  {
    id: "facility.restaurant",
    kind: "public",
    gridX: 2,
    gridY: 4,
    width: 3,
    depth: 2,
  },
  {
    id: "facility.housekeeping",
    kind: "service",
    gridX: 6,
    gridY: 3,
    width: 2,
    depth: 2,
  },
  {
    id: "facility.laundry",
    kind: "service",
    gridX: 8,
    gridY: 3,
    width: 1,
    depth: 2,
  },
  {
    id: "facility.staff_area",
    kind: "service",
    gridX: 9,
    gridY: 3,
    width: 2,
    depth: 2,
  },
  {
    id: "facility.security",
    kind: "service",
    gridX: 0,
    gridY: 6,
    width: 1,
    depth: 1,
  },
  {
    id: "facility.wellness",
    kind: "public",
    gridX: 2,
    gridY: 6,
    width: 2,
    depth: 1,
  },
  {
    id: "facility.fitness",
    kind: "public",
    gridX: 4,
    gridY: 6,
    width: 2,
    depth: 1,
  },
  {
    id: "facility.storage",
    kind: "service",
    gridX: 7,
    gridY: 6,
    width: 2,
    depth: 1,
  },
  {
    id: "space.carpark",
    kind: "public",
    gridX: -1,
    gridY: 6,
    width: 1,
    depth: 1,
  },
  {
    id: "space.retail",
    kind: "public",
    gridX: 1,
    gridY: 6,
    width: 1,
    depth: 1,
  },
  {
    id: "space.terrace",
    kind: "public",
    gridX: 6,
    gridY: 6,
    width: 1,
    depth: 1,
  },
];

function slabFor(floor: number): FloorSlab {
  return floor === 0
    ? { floor, minGridX: -1, minGridY: -1, maxGridX: 12, maxGridY: 8 }
    : { floor, minGridX: -1, minGridY: -1, maxGridX: 9, maxGridY: 6 };
}

function wallsFor(slab: FloorSlab): WallSegment[] {
  const { floor, minGridX, minGridY, maxGridX, maxGridY } = slab;
  const corners = [
    { gridX: minGridX, gridY: minGridY },
    { gridX: maxGridX, gridY: minGridY },
    { gridX: maxGridX, gridY: maxGridY },
    { gridX: minGridX, gridY: maxGridY },
  ];
  return corners.map((from, index) => ({
    id: `wall.floor.${floor}.${index}`,
    floor,
    from,
    to: corners[(index + 1) % corners.length],
  }));
}

/** Deterministic two-wing Frankfurt plan. IDs, never array order, decide rooms. */
export function generateFloorPlan(rooms: readonly { id: string }[]): FloorPlan {
  const ordered = [...rooms].sort((a, b) => compareIds(a.id, b.id));
  const roomGeometry: Record<string, RoomGeometry> = {};
  ordered.forEach((room, index) => {
    const floor = Math.floor(index / ROOMS_PER_FLOOR) + 1;
    const onFloor = index % ROOMS_PER_FLOOR;
    const wingIndex = onFloor % ROOMS_PER_WING;
    roomGeometry[room.id] = {
      id: room.id,
      floor,
      gridX:
        onFloor < ROOMS_PER_WING ? wingIndex : ROOMS_PER_WING - 1 - wingIndex,
      gridY: onFloor < ROOMS_PER_WING ? 0 : 4,
    };
  });

  const topFloor = Math.max(
    0,
    ...Object.values(roomGeometry).map((room) => room.floor),
  );
  const floors = Array.from({ length: topFloor + 1 }, (_, floor) => floor);
  const floorSlabs = floors.map(slabFor);
  const areas = GROUND_AREAS.map((area) => ({ ...area, floor: 0 }));
  const corridorSpines = floors.map((floor) => ({
    id: `navigation.floor.${floor}.corridor`,
    floor,
    from: { gridX: floor === 0 ? 0 : -1, gridY: 2 },
    to: { gridX: floor === 0 ? 11 : 8, gridY: 2 },
    service: floor === 0,
  }));
  const cores = floors.flatMap((floor): BuildingCore[] => [
    {
      id: `navigation.floor.${floor}.elevator`,
      kind: "elevator",
      floor,
      gridX: 6,
      gridY: 2,
    },
    {
      id: `navigation.floor.${floor}.stairs`,
      kind: "stairs",
      floor,
      gridX: 7,
      gridY: 2,
    },
  ]);

  const navigationNodes: FloorPlanNavigationNode[] = [];
  for (const floor of floors) {
    const corridorId = `navigation.floor.${floor}.corridor`;
    const doorIds = Object.values(roomGeometry)
      .filter((room) => room.floor === floor)
      .map((room) => `navigation.${room.id}.door`)
      .sort(compareIds);
    const corridorLinks = [
      ...doorIds,
      `navigation.floor.${floor}.stairs`,
      `navigation.floor.${floor}.elevator`,
    ];
    if (floor === 0)
      corridorLinks.push("navigation.lobby", "navigation.reception.queue");
    navigationNodes.push({
      id: corridorId,
      kind: "corridor",
      floor,
      gridX: 3,
      gridY: 2,
      links: corridorLinks.sort(compareIds),
    });
    for (const kind of ["stairs", "elevator"] as const) {
      const id = `navigation.floor.${floor}.${kind}`;
      const links = [corridorId];
      if (floor > 0) links.push(`navigation.floor.${floor - 1}.${kind}`);
      if (floor < topFloor) links.push(`navigation.floor.${floor + 1}.${kind}`);
      navigationNodes.push({
        id,
        kind,
        floor,
        gridX: kind === "elevator" ? 6 : 7,
        gridY: 2,
        links: links.sort(compareIds),
      });
    }
  }
  for (const room of Object.values(roomGeometry).sort((a, b) =>
    compareIds(a.id, b.id),
  )) {
    const doorId = `navigation.${room.id}.door`;
    const corridorId = `navigation.floor.${room.floor}.corridor`;
    navigationNodes.push({ ...room, kind: "room", links: [doorId] });
    navigationNodes.push({
      id: doorId,
      kind: "door",
      floor: room.floor,
      gridX: room.gridX,
      gridY: room.gridY === 0 ? 1 : 3,
      links: [room.id, corridorId].sort(compareIds),
    });
  }
  navigationNodes.push(
    {
      id: "navigation.lobby",
      kind: "corridor",
      floor: 0,
      gridX: 0,
      gridY: 2,
      links: ["navigation.floor.0.corridor", "navigation.reception.queue"],
    },
    {
      id: "navigation.reception.queue",
      kind: "corridor",
      floor: 0,
      gridX: 1,
      gridY: 2,
      links: ["navigation.floor.0.corridor", "navigation.lobby"],
    },
  );
  navigationNodes.sort((a, b) => compareIds(a.id, b.id));

  return {
    rooms: roomGeometry,
    exteriorWalls: floorSlabs.flatMap(wallsFor),
    floorSlabs,
    corridorSpines,
    cores,
    areas,
    navigationNodes,
  };
}

export function positionMapForPlan(
  plan: FloorPlan,
): Record<string, GridPosition> {
  const positions: Record<string, GridPosition> = {};
  for (const room of Object.values(plan.rooms))
    positions[room.id] = {
      floor: room.floor,
      gridX: room.gridX,
      gridY: room.gridY,
    };
  for (const area of plan.areas)
    positions[area.id] = {
      floor: area.floor,
      gridX: area.gridX,
      gridY: area.gridY,
    };
  for (const node of plan.navigationNodes)
    if (!positions[node.id])
      positions[node.id] = {
        floor: node.floor,
        gridX: node.gridX,
        gridY: node.gridY,
      };
  positions["facility.elevator"] = { floor: 0, gridX: 6, gridY: 2 };
  positions["asset.lift"] = { floor: 0, gridX: 6, gridY: 2 };
  return positions;
}
