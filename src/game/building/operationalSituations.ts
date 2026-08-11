import { compareIds } from "../domain/ids";
import type { RenderAgentDescriptor } from "./agentLocations";

export interface ReceptionDeskDescriptor {
  id: string;
  staffed: boolean;
  staffId?: string;
}

export interface HousekeepingRoundDescriptor {
  agentId: string;
  locationId: string;
  targetRoomId: string;
  routeIds: string[];
  waitingGuestId?: string;
}

export interface FnbTableDescriptor {
  id: string;
  seats: number;
  occupiedSeats: number;
}

export interface FnbAreaDescriptor {
  id: string;
  areaId: string;
  tables: FnbTableDescriptor[];
  queueEntityIds: string[];
  turnedAwayCount: number;
  averageWaitMinutes: number;
  cause: string;
}

export interface OperationalSituationDescriptors {
  reception: {
    desks: ReceptionDeskDescriptor[];
    queueGuestIds: string[];
  };
  housekeeping: {
    dirtyRoomIdsByFloor: Record<string, string[]>;
    round?: HousekeepingRoundDescriptor;
  };
  roomFaultReasonByRoomId: Record<string, string>;
  overloads: {
    facilityId: string;
    cause: string;
    excess: number;
    queueEntityIds: string[];
  }[];
  fnb: {
    outlets: FnbAreaDescriptor[];
    kitchen: {
      stations: { id: string; active: boolean }[];
      overloaded: boolean;
      cause: string;
    };
  };
}

interface SituationInput {
  elapsedMinutes?: number;
  rooms: readonly { id: string; state: string; faultReasonCode?: string }[];
  floorByRoomId: Readonly<Record<string, number>>;
  agents: readonly RenderAgentDescriptor[];
  receptionQueueGuestIds: readonly string[];
  receptionDeskCount: number;
  assets: readonly { id: string; status: string }[];
  renovationRoomIds: readonly string[];
  facilities: readonly {
    id: string;
    demand: number;
    capacity: number;
    cause: string;
  }[];
  fnb: {
    outlets: readonly {
      id: string;
      seats: number;
      served: number;
      waitlisted: number;
      averageWaitMinutes: number;
      kitchenUtilizationBp: number;
      cause: string;
    }[];
  };
}

const AREA_BY_OUTLET: Readonly<Record<string, string>> = {
  breakfastRoom: "facility.breakfast_room",
  restaurant: "facility.restaurant",
  bar: "facility.bar",
  roomService: "facility.kitchen",
};

function tablesFor(outlet: SituationInput["fnb"]["outlets"][number]) {
  if (outlet.seats <= 0) return [];
  const tableCount = Math.min(8, Math.ceil(outlet.seats / 4));
  const seatsPerTable = Math.ceil(outlet.seats / tableCount);
  let occupied = Math.min(outlet.served, outlet.seats);
  return Array.from({ length: tableCount }, (_, index) => {
    const occupiedSeats = Math.min(seatsPerTable, occupied);
    occupied -= occupiedSeats;
    return {
      id: `fnb.${outlet.id}.table.${index + 1}`,
      seats: Math.min(seatsPerTable, outlet.seats - index * seatsPerTable),
      occupiedSeats,
    };
  });
}

function routeToRoom(roomId: string, floor: number): string[] {
  return [
    "facility.housekeeping",
    "navigation.floor.0.corridor",
    "navigation.floor.0.elevator",
    `navigation.floor.${floor}.elevator`,
    `navigation.floor.${floor}.corridor`,
    `navigation.${roomId}.door`,
    roomId,
  ];
}

/** Turns existing aggregates into stable, placed physical situations. */
export function describeOperationalSituations(
  input: SituationInput,
): OperationalSituationDescriptors {
  const receptionStaff = input.agents
    .filter(
      (agent) =>
        agent.kind === "staff" &&
        agent.locationId === "facility.reception" &&
        agent.status === "working",
    )
    .sort((a, b) => compareIds(a.id, b.id));
  const desks = Array.from(
    { length: Math.max(1, input.receptionDeskCount) },
    (_, index): ReceptionDeskDescriptor => ({
      id: `facility.reception.desk.${index + 1}`,
      staffed: receptionStaff[index] !== undefined,
      ...(receptionStaff[index] ? { staffId: receptionStaff[index].id } : {}),
    }),
  );

  const dirtyRoomIdsByFloor: Record<string, string[]> = {};
  const dirtyRooms = input.rooms
    .filter((room) => room.state === "VacantDirty")
    .sort((a, b) => compareIds(a.id, b.id));
  for (const room of dirtyRooms) {
    const floor = String(input.floorByRoomId[room.id] ?? 0);
    (dirtyRoomIdsByFloor[floor] ??= []).push(room.id);
  }
  const housekeeper = input.agents
    .filter(
      (agent) =>
        agent.kind === "staff" &&
        agent.id.startsWith("staff.housekeeping") &&
        agent.status === "working",
    )
    .sort((a, b) => compareIds(a.id, b.id))[0];
  const target = dirtyRooms[0];
  let round: HousekeepingRoundDescriptor | undefined;
  if (housekeeper && target) {
    const routeIds = routeToRoom(
      target.id,
      input.floorByRoomId[target.id] ?? 0,
    );
    const routeIndex =
      Math.floor((input.elapsedMinutes ?? 0) / 5) % routeIds.length;
    round = {
      agentId: housekeeper.id,
      locationId: routeIds[routeIndex],
      targetRoomId: target.id,
      routeIds,
      ...(input.receptionQueueGuestIds[0]
        ? { waitingGuestId: input.receptionQueueGuestIds[0] }
        : {}),
    };
  }

  const renovationRooms = new Set(input.renovationRoomIds);
  const failedAsset = [...input.assets]
    .filter((asset) => asset.status !== "operational")
    .sort((a, b) => compareIds(a.id, b.id))[0];
  const roomFaultReasonByRoomId: Record<string, string> = {};
  for (const room of input.rooms)
    if (room.state === "OutOfOrder" && !renovationRooms.has(room.id))
      roomFaultReasonByRoomId[room.id] =
        room.faultReasonCode ??
        (failedAsset
          ? `room.fault.${failedAsset.id.replace(/^asset\./, "")}-failed`
          : "room.fault.unavailable");

  const overloads = input.facilities
    .filter((facility) => facility.demand > facility.capacity)
    .sort((a, b) => compareIds(a.id, b.id))
    .map((facility) => {
      const excess = facility.demand - facility.capacity;
      return {
        facilityId: facility.id,
        cause: facility.cause,
        excess,
        queueEntityIds: Array.from(
          { length: Math.min(8, excess) },
          (_, index) => `queue.${facility.id}.${index + 1}`,
        ),
      };
    });

  const outlets = input.fnb.outlets.map((outlet): FnbAreaDescriptor => ({
    id: `fnb.${outlet.id}`,
    areaId: AREA_BY_OUTLET[outlet.id] ?? "facility.restaurant",
    tables: tablesFor(outlet),
    queueEntityIds: Array.from(
      { length: Math.min(8, outlet.waitlisted) },
      (_, index) => `queue.fnb.${outlet.id}.${index + 1}`,
    ),
    turnedAwayCount: outlet.waitlisted,
    averageWaitMinutes: outlet.averageWaitMinutes,
    cause: outlet.cause,
  }));
  const kitchenUtilization = Math.max(
    0,
    ...input.fnb.outlets.map((outlet) => outlet.kitchenUtilizationBp),
  );
  const kitchenCause =
    input.fnb.outlets.find(
      (outlet) =>
        outlet.waitlisted > 0 && outlet.cause === "facility.cause.kitchenLine",
    )?.cause ?? "facility.cause.demand";
  const activeStations = Math.min(4, Math.ceil(kitchenUtilization / 2500));

  return {
    reception: {
      desks,
      queueGuestIds: [...input.receptionQueueGuestIds].sort(compareIds),
    },
    housekeeping: { dirtyRoomIdsByFloor, ...(round ? { round } : {}) },
    roomFaultReasonByRoomId,
    overloads,
    fnb: {
      outlets,
      kitchen: {
        stations: Array.from({ length: 4 }, (_, index) => ({
          id: `facility.kitchen.station.${index + 1}`,
          active: index < activeStations,
        })),
        overloaded:
          kitchenUtilization > 10000 ||
          input.fnb.outlets.some(
            (outlet) =>
              outlet.waitlisted > 0 &&
              [
                "facility.cause.kitchenLine",
                "facility.cause.stock",
                "facility.cause.miseEnPlace",
              ].includes(outlet.cause),
          ),
        cause: kitchenCause,
      },
    },
  };
}
