import { describe, expect, it } from "vitest";
import { describeOperationalSituations } from "./operationalSituations";

const base = {
  rooms: [
    { id: "room.101", state: "VacantDirty" },
    { id: "room.201", state: "VacantDirty" },
    { id: "room.202", state: "OutOfOrder" },
  ],
  floorByRoomId: { "room.101": 1, "room.201": 2, "room.202": 2 },
  agents: [
    {
      id: "guest.waiting",
      kind: "guest" as const,
      locationId: "navigation.reception.queue",
      status: "waiting-check-in" as const,
      routeIds: [],
      queuedFor: "facility.reception",
    },
    {
      id: "staff.housekeeping.1",
      kind: "staff" as const,
      locationId: "facility.housekeeping",
      status: "working" as const,
      routeIds: ["facility.housekeeping"],
    },
    {
      id: "staff.reception.1",
      kind: "staff" as const,
      locationId: "facility.reception",
      status: "working" as const,
      routeIds: ["facility.reception"],
    },
  ],
  receptionQueueGuestIds: ["guest.waiting"],
  receptionDeskCount: 2,
  assets: [{ id: "asset.boiler", status: "failed" }],
  renovationRoomIds: [] as string[],
  facilities: [
    {
      id: "facility.bar",
      demand: 12,
      capacity: 8,
      cause: "staffed throughput",
    },
  ],
  fnb: {
    outlets: [
      {
        id: "restaurant" as const,
        seats: 20,
        served: 8,
        waitlisted: 6,
        averageWaitMinutes: 30,
        kitchenUtilizationBp: 14_000,
        cause: "facility.cause.kitchenLine" as const,
      },
    ],
  },
};

describe("physical operational situations", () => {
  it("shows staffed and unstaffed desks with the real reception queue", () => {
    const described = describeOperationalSituations(base);
    expect(described.reception.desks).toEqual([
      expect.objectContaining({ staffed: true, staffId: "staff.reception.1" }),
      expect.objectContaining({ staffed: false }),
    ]);
    expect(described.reception.queueGuestIds).toEqual(["guest.waiting"]);
  });

  it("groups dirty rooms by floor and sends a housekeeper toward the first", () => {
    const described = describeOperationalSituations(base);
    expect(described.housekeeping.dirtyRoomIdsByFloor).toEqual({
      "1": ["room.101"],
      "2": ["room.201"],
    });
    expect(described.housekeeping.round).toMatchObject({
      agentId: "staff.housekeeping.1",
      targetRoomId: "room.101",
      waitingGuestId: "guest.waiting",
    });
  });

  it("names the failed asset behind an unavailable room", () => {
    expect(describeOperationalSituations(base).roomFaultReasonByRoomId).toEqual(
      { "room.202": "room.fault.boiler-failed" },
    );
  });

  it("keeps free tables visible beside a kitchen-limited waitlist", () => {
    const described = describeOperationalSituations(base);
    const restaurant = described.fnb.outlets[0];
    expect(restaurant.tables.some((table) => table.occupiedSeats === 0)).toBe(
      true,
    );
    expect(restaurant.queueEntityIds).toHaveLength(6);
    expect(described.fnb.kitchen.overloaded).toBe(true);
    expect(described.overloads[0]).toMatchObject({
      facilityId: "facility.bar",
      cause: "staffed throughput",
      excess: 4,
    });
  });
});
