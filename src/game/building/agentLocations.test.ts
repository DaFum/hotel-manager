import { describe, expect, it } from "vitest";
import { describeAgentLocations, describeLiftCars } from "./agentLocations";

describe("authoritative building occupants", () => {
  const reservations = [
    { id: "booking.2", guestId: "guest.mueller" },
    { id: "booking.1", guestId: "guest.berger" },
  ];
  const stays = [
    { bookingId: "booking.2", roomId: "room.102" },
    { bookingId: "booking.1", roomId: "room.101" },
  ];

  it("places guests at their current activity with a stable route", () => {
    const agents = describeAgentLocations({
      minuteOfDay: 480,
      elapsedMinutes: 480,
      reservations,
      stays,
      receptionQueue: [],
      staff: [],
      floorByRoomId: { "room.101": 1, "room.102": 1 },
    });

    expect(agents).toEqual([
      expect.objectContaining({
        id: "agent.booking.1",
        guestId: "guest.berger",
        kind: "guest",
        locationId: "facility.breakfast_room",
        status: "breakfast",
        routeIds: expect.arrayContaining([
          "room.101",
          "navigation.floor.1.elevator",
          "facility.breakfast_room",
        ]),
      }),
      expect.objectContaining({
        id: "agent.booking.2",
        guestId: "guest.mueller",
      }),
    ]);
  });

  it("places waiting guests at reception and staff in their work areas", () => {
    const agents = describeAgentLocations({
      minuteOfDay: 900,
      elapsedMinutes: 900,
      reservations,
      stays: [],
      receptionQueue: [{ bookingId: "booking.2" }],
      staff: [
        { id: "staff.reception.2", role: "reception", absent: true },
        { id: "staff.housekeeping.1", role: "housekeeping", absent: false },
      ],
      floorByRoomId: {},
    });

    expect(agents).toEqual([
      expect.objectContaining({
        id: "agent.booking.2",
        guestId: "guest.mueller",
        locationId: "navigation.reception.queue",
        queuedFor: "facility.reception",
        status: "waiting-check-in",
      }),
      expect.objectContaining({
        id: "staff.housekeeping.1",
        locationId: "facility.housekeeping",
        status: "working",
      }),
      expect.objectContaining({
        id: "staff.reception.2",
        locationId: "outside.hotel",
        status: "absent",
      }),
    ]);
  });

  it("gives separate bookings for one guest separate render identities", () => {
    const agents = describeAgentLocations({
      minuteOfDay: 900,
      elapsedMinutes: 900,
      reservations: [
        { id: "booking.1", guestId: "guest.same" },
        { id: "booking.2", guestId: "guest.same" },
      ],
      stays: [{ bookingId: "booking.1", roomId: "room.101" }],
      receptionQueue: [{ bookingId: "booking.2" }],
      staff: [],
      floorByRoomId: { "room.101": 1 },
    });

    expect(agents.map((agent) => agent.id)).toEqual([
      "agent.booking.1",
      "agent.booking.2",
    ]);
    expect(agents).toEqual([
      expect.objectContaining({ guestId: "guest.same" }),
      expect.objectContaining({ guestId: "guest.same" }),
    ]);
  });
});

describe("lift cars", () => {
  it("moves an operating car deterministically between floors", () => {
    expect(
      describeLiftCars({
        liftId: "asset.lift",
        cars: 1,
        topFloor: 2,
        elapsedMinutes: 1,
        trips: 3,
        failed: false,
        waitingGuestIds: [],
      }),
    ).toEqual([
      expect.objectContaining({
        id: "asset.lift.car.1",
        currentFloor: 0,
        targetFloor: 1,
        positionFloorBasisPoints: 5000,
        direction: "up",
        moving: true,
        failed: false,
      }),
    ]);
  });

  it("stops a failed car and names the waiting guests", () => {
    const input = {
      liftId: "asset.lift",
      cars: 1,
      topFloor: 2,
      trips: 3,
      failed: true,
      waitingGuestIds: ["guest.2", "guest.1"],
      heldFloorByCar: [1],
      heldPositionFloorBasisPointsByCar: [12_500],
    };
    const failed = describeLiftCars({ ...input, elapsedMinutes: 9 });
    const afterLegBoundary = describeLiftCars({
      ...input,
      elapsedMinutes: 11,
    });

    expect(failed).toEqual([
      expect.objectContaining({
        id: "asset.lift.car.1",
        currentFloor: 1,
        targetFloor: 1,
        positionFloorBasisPoints: 12_500,
        moving: false,
        stopped: true,
        failed: true,
        waitingGuestIds: ["guest.1", "guest.2"],
      }),
    ]);
    expect(afterLegBoundary[0]).toMatchObject({
      currentFloor: failed[0].currentFloor,
      targetFloor: failed[0].targetFloor,
      positionFloorBasisPoints: failed[0].positionFloorBasisPoints,
    });
  });
});
