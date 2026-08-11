import { describe, expect, it } from "vitest";
import { generateFloorPlan, positionMapForPlan } from "./floorPlan";

const rooms = Array.from({ length: 24 }, (_, index) => ({
  id: `room.${101 + index}`,
}));

describe("authoritative floor plan", () => {
  it("generates the same two-wing hotel for the same stable room ids", () => {
    const first = generateFloorPlan(rooms);
    expect(first).toEqual(generateFloorPlan([...rooms].reverse()));
    expect(Object.keys(first.rooms)).toHaveLength(24);
    expect(
      new Set(Object.values(first.rooms).map((room) => room.floor)),
    ).toEqual(new Set([1, 2]));
    expect(first.rooms["room.101"].gridY).not.toBe(
      first.rooms["room.107"].gridY,
    );
  });

  it("contains slabs, exterior walls, corridors, stairs and lift cores", () => {
    const plan = generateFloorPlan(rooms);
    expect(plan.floorSlabs.map((slab) => slab.floor)).toEqual([0, 1, 2]);
    expect(plan.exteriorWalls).toHaveLength(12);
    expect(plan.corridorSpines).toHaveLength(3);
    expect(plan.cores.filter((core) => core.kind === "stairs")).toHaveLength(3);
    expect(plan.cores.filter((core) => core.kind === "elevator")).toHaveLength(
      3,
    );
  });

  it("places every minimum visible public and service area", () => {
    const plan = generateFloorPlan(rooms);
    expect(plan.areas.map((area) => area.id)).toEqual(
      expect.arrayContaining([
        "facility.reception",
        "facility.housekeeping",
        "facility.breakfast_room",
        "facility.kitchen",
        "facility.staff_area",
        "facility.maintenance",
      ]),
    );
  });

  it("uses the same stable navigation ids in topology and position lookup", () => {
    const plan = generateFloorPlan(rooms);
    const positions = positionMapForPlan(plan);
    const corridor = plan.navigationNodes.find(
      (node) => node.id === "navigation.floor.1.corridor",
    );
    expect(corridor?.links).toEqual(
      expect.arrayContaining([
        "navigation.floor.1.stairs",
        "navigation.floor.1.elevator",
        "navigation.room.101.door",
      ]),
    );
    expect(positions[corridor!.id]).toMatchObject({ floor: 1 });
    expect(positions["facility.kitchen"]).toMatchObject({
      floor: 0,
      gridX: 6,
    });
  });
});
