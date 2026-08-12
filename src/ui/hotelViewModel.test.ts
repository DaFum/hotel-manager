import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../game/simulation/initialState";
import { createCamera, zoomCamera } from "../render/camera";
import { placeRooms } from "../render/sceneLayout";
import {
  focusKindForAlertTarget,
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
  it("uses the worker location and stable guest identity without inference", () => {
    const s = snapshot();
    s.renderDescriptors.agents = [
      {
        id: "guest.berger",
        kind: "guest",
        locationId: "facility.breakfast_room",
        status: "breakfast",
        routeIds: [s.hotel.rooms[0].id, "facility.breakfast_room"],
      },
    ];

    expect(visualAgents(s)).toEqual(s.renderDescriptors.agents);
  });

  it("stands a party still waiting at the desk in the queue, not in a room", () => {
    const s = snapshot();
    s.renderDescriptors.agents = [
      {
        id: "guest.2",
        kind: "guest",
        locationId: "navigation.reception.queue",
        queuedFor: "facility.reception",
        status: "waiting-check-in",
        routeIds: ["navigation.lobby", "navigation.reception.queue"],
      },
    ];

    const [waiting] = visualAgents(s);
    expect(waiting.queuedFor).toBe("facility.reception");
    expect(waiting.locationId).toBe("navigation.reception.queue");
  });

  it("stops drawing people when the camera is too far out to see them", () => {
    const s = snapshot();
    s.renderDescriptors.agents = [
      {
        id: "guest.3",
        kind: "guest",
        locationId: "navigation.reception.queue",
        status: "waiting-check-in",
        routeIds: [],
      },
    ];

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
    expect(known.floor).toBe(
      s.renderDescriptors.floorByRoomId[targetRoom.id] ?? 0,
    );
    expect(roomFocusPoint("room.nowhere", s, { x: 7, y: 8, floor: 2 })).toEqual(
      {
        x: 7,
        y: 8,
        floor: 2,
      },
    );
  });

  it("pins an alert to its structured room target and omits a non-spatial alert", () => {
    const s = snapshot();
    const roomId = s.hotel.rooms[0].id;
    s.alerts = [
      {
        id: "alert.room-problem",
        severity: "warning",
        title: "alert.room-out-of-service.title",
        cause: "alert.room-out-of-service.cause",
        category: "room-problem",
        groupId: `${s.hotel.id}:room-problem`,
        source: { companyId: s.company.companyId, hotelId: s.hotel.id },
        gameTime: "1991-01-01:0",
        acknowledged: false,
        target: { entityId: roomId, kind: "room" },
      },
      {
        id: "alert.cash",
        severity: "critical",
        title: "alert.cash-short.title",
        cause: "alert.cash-short.cause",
        category: "cash",
        groupId: `${s.hotel.id}:cash`,
        source: { companyId: s.company.companyId, hotelId: s.hotel.id },
        gameTime: "1991-01-01:0",
        acknowledged: false,
      },
    ];

    const [pinned] = worldProblems(s);
    expect(pinned.kind).toBe("room");
    expect(pinned.entityId).toBe(roomId);
    expect(pinned).toMatchObject(roomFocusPoint(roomId, s));
    expect(worldProblems(s)).toHaveLength(1);
  });

  it("maps navigation alert targets to the problem focus kind", () => {
    expect(focusKindForAlertTarget("navigation")).toBe("problem");
    expect(focusKindForAlertTarget("facility")).toBe("facility");
    expect(focusKindForAlertTarget("room")).toBe("room");
  });

  it("never guesses a target by matching room ids inside alert text", () => {
    const s = snapshot();
    const shortRoomId = s.hotel.rooms[0].id;
    const longRoomId = shortRoomId + "0";
    s.hotel.rooms = [...s.hotel.rooms, { ...s.hotel.rooms[0], id: longRoomId }];
    s.renderDescriptors.positionByEntityId[longRoomId] = {
      floor: 1,
      gridX: 0,
      gridY: 0,
    };

    s.alerts = [
      {
        id: `alert.${longRoomId}`,
        severity: "warning",
        title: "alert.room-out-of-service.title",
        cause: `alert.room-out-of-service.cause.${longRoomId}`,
        category: longRoomId,
        groupId: `${s.hotel.id}:${longRoomId}`,
        source: { companyId: s.company.companyId, hotelId: s.hotel.id },
        gameTime: "1991-01-01:0",
        acknowledged: false,
      },
    ];

    expect(worldProblems(s)).toEqual([]);
  });
});
