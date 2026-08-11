import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../game/simulation/initialState";
import { createCamera, zoomCamera } from "../render/camera";
import { placeRooms } from "../render/sceneLayout";
import {
  rateByCategory,
  renovatingRoomIds,
  roomFocusPoint,
  visualAgents,
  worldProblems,
} from "./hotelViewModel";
import type { GameSnapshot } from "../game/domain/snapshot";

function snapshot(): GameSnapshot {
  return createInitialGameState(424242) as GameSnapshot;
}

describe("the isometric hotel read off the snapshot", () => {
  it("puts a checked-in guest in the room they were given", () => {
    const s = snapshot();
    s.stays = [
      {
        bookingId: "b.1",
        roomId: s.hotel.rooms[0].id,
        rateMinor: 12000,
        departureDateKey: "1991-01-03",
      },
    ];

    expect(visualAgents(s)).toEqual([
      { id: "guest.b.1", kind: "guest", locationId: s.hotel.rooms[0].id },
    ]);
  });

  it("stands a party still waiting at the desk in the queue, not in a room", () => {
    const s = snapshot();
    s.receptionQueue = [{ bookingId: "b.2", waitedMinutes: 12 }];

    const [waiting] = visualAgents(s);
    expect(waiting.queuedFor).toBe("reception");
    expect(waiting.locationId).toBe("lobby");
  });

  it("stops drawing people when the camera is too far out to see them", () => {
    const s = snapshot();
    s.receptionQueue = [{ bookingId: "b.3", waitedMinutes: 4 }];

    expect(visualAgents(s, zoomCamera(createCamera(), 2.5))).toHaveLength(1);
    expect(visualAgents(s, zoomCamera(createCamera(), 0.5))).toEqual([]);
  });

  it("prices every category the house actually has rooms in", () => {
    const s = snapshot();
    const categories = new Set(s.hotel.rooms.map((room) => room.category));

    expect(Object.keys(rateByCategory(s, { single: 9900 })).sort()).toEqual(
      [...categories].sort(),
    );
  });

  it("counts no room as under renovation while no job is running", () => {
    expect(renovatingRoomIds(snapshot())).toEqual([]);
  });

  it("takes the rooms of the module a running job is converting", () => {
    const s = snapshot();
    const moduleId = s.hotel.rooms[0].moduleId;
    s.renovation = {
      id: "job.1",
      moduleId,
      targetModuleId: "module.better",
      project: s.renovation?.project ?? ({} as never),
    };

    const shut = renovatingRoomIds(s);
    expect(shut.length).toBeGreaterThan(0);
    expect(
      shut.every(
        (id) =>
          s.hotel.rooms.find((room) => room.id === id)?.moduleId === moduleId,
      ),
    ).toBe(true);
  });

  it("finds a room's place in the world, and holds still for one it cannot", () => {
    const s = snapshot();
    const targetRoom = s.hotel.rooms.at(-1)!;
    const known = roomFocusPoint(targetRoom.id, s);

    expect(Number.isFinite(known.x)).toBe(true);
    expect(known.floor).toBe(s.renderDescriptors.floorByRoomId[targetRoom.id] ?? 0);
    expect(roomFocusPoint("room.nowhere", s, { x: 7, y: 8, floor: 2 })).toEqual(
      {
        x: 7,
        y: 8,
        floor: 2,
      },
    );
  });

  it("pins an alert that names a room to that room", () => {
    const s = snapshot();
    const roomId = s.hotel.rooms[0].id;
    s.alerts = [
      {
        id: `alert.${roomId}`,
        severity: "warning",
        title: "Room out of service",
        cause: "maintenance",
      },
      {
        id: "alert.cash",
        severity: "critical",
        title: "Cash is short",
        cause: "payables exceed cash",
      },
    ];

    const [pinned, house] = worldProblems(s);
    expect(pinned.kind).toBe("room");
    expect(pinned).toMatchObject(roomFocusPoint(roomId, s));
    expect(house.kind).toBe("problem");
  });

  it("does not match a shorter prefix room ID for alerts on a longer ID", () => {
    const s = snapshot();
    // Simulate a prefix room ID
    const shortRoomId = s.hotel.rooms[0].id;
    const longRoomId = shortRoomId + "0";

    // Inject the longer room id at the end, meaning if prefix matching was broken,
    // the system would match shortRoomId first because it comes earlier in the array.
    s.hotel.rooms = [...s.hotel.rooms, { ...s.hotel.rooms[0], id: longRoomId }];

    s.alerts = [
      {
        id: `alert.${longRoomId}`,
        severity: "warning",
        title: "Room out of service",
        cause: "maintenance",
      },
    ];

    const [pinned] = worldProblems(s);
    const placement = placeRooms(s.hotel.rooms, s.renderDescriptors.floorByRoomId).find(p => p.id === longRoomId)!;

    expect(pinned.kind).toBe("room");
    expect(pinned.x).toBe(placement.x);
    expect(pinned.y).toBe(placement.y);
    expect(pinned.floor).toBe(placement.floor);
  });
});
