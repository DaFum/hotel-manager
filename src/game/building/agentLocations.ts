import { compareIds } from "../domain/ids";
import { ELEVATOR_TRIP_MINUTES } from "../facilities/mobility";

export type AgentStatus =
  | "sleeping"
  | "breakfast"
  | "out-in-city"
  | "evening-drink"
  | "waiting-check-in"
  | "working"
  | "off-duty"
  | "absent";

export interface RenderAgentDescriptor {
  id: string;
  kind: "guest" | "staff";
  /** Stable customer identity, distinct from this rendered booking instance. */
  guestId?: string;
  locationId: string;
  status: AgentStatus;
  routeIds: string[];
  queuedFor?: string;
}

export interface LiftCarDescriptor {
  id: string;
  currentFloor: number;
  targetFloor: number;
  /** Exact vertical position; one floor is 10,000 basis points. */
  positionFloorBasisPoints: number;
  direction: "up" | "down" | "idle";
  moving: boolean;
  stopped: boolean;
  failed: boolean;
  waitingGuestIds: string[];
}

interface AgentLocationInput {
  minuteOfDay: number;
  elapsedMinutes: number;
  reservations: readonly { id: string; guestId?: string }[];
  stays: readonly { bookingId: string; roomId: string }[];
  receptionQueue: readonly { bookingId: string }[];
  staff: readonly {
    id: string;
    role: string;
    shift?: string;
    absent: boolean;
  }[];
  floorByRoomId: Readonly<Record<string, number>>;
}

const STAFF_AREA_BY_ROLE: Readonly<Record<string, string>> = {
  reception: "facility.reception",
  housekeeping: "facility.housekeeping",
  kitchen: "facility.kitchen",
  technician: "facility.maintenance",
  fnb: "facility.bar",
  laundry: "facility.laundry",
  wellness: "facility.wellness",
  security: "facility.security",
};

function guestRoute(
  roomId: string,
  floor: number,
  destination: string,
): string[] {
  if (destination === roomId) return [roomId];
  return [
    roomId,
    `navigation.${roomId}.door`,
    `navigation.floor.${floor}.corridor`,
    `navigation.floor.${floor}.elevator`,
    "navigation.floor.0.elevator",
    "navigation.floor.0.corridor",
    destination,
  ];
}

function guestActivity(
  minuteOfDay: number,
  roomId: string,
): { locationId: string; status: AgentStatus } {
  if (minuteOfDay >= 420 && minuteOfDay < 600)
    return { locationId: "facility.breakfast_room", status: "breakfast" };
  if (minuteOfDay >= 600 && minuteOfDay < 1080)
    return { locationId: "navigation.lobby", status: "out-in-city" };
  if (minuteOfDay >= 1080 && minuteOfDay < 1320)
    return { locationId: "facility.bar", status: "evening-drink" };
  return { locationId: roomId, status: "sleeping" };
}

/** Worker-owned, deterministic positions for every guest and staff record. */
export function describeAgentLocations(
  input: AgentLocationInput,
): RenderAgentDescriptor[] {
  const reservationById = new Map(
    input.reservations.map((reservation) => [reservation.id, reservation]),
  );
  const agents: RenderAgentDescriptor[] = [];

  for (const waiting of input.receptionQueue) {
    const reservation = reservationById.get(waiting.bookingId);
    agents.push({
      id: `agent.${waiting.bookingId}`,
      kind: "guest",
      guestId: reservation?.guestId ?? `guest.${waiting.bookingId}`,
      locationId: "navigation.reception.queue",
      queuedFor: "facility.reception",
      status: "waiting-check-in",
      routeIds: ["navigation.lobby", "navigation.reception.queue"],
    });
  }

  const waitingBookingIds = new Set(
    input.receptionQueue.map((waiting) => waiting.bookingId),
  );
  for (const stay of input.stays) {
    if (waitingBookingIds.has(stay.bookingId)) continue;
    const reservation = reservationById.get(stay.bookingId);
    const activity = guestActivity(input.minuteOfDay, stay.roomId);
    const floor = input.floorByRoomId[stay.roomId] ?? 0;
    const routeIds = guestRoute(stay.roomId, floor, activity.locationId);
    // For ten minutes after an activity transition, put guests on successive
    // route nodes. The route is stable, and no presentation RNG can move them.
    const transitionMinute =
      activity.status === "breakfast"
        ? 420
        : activity.status === "out-in-city"
          ? 600
          : activity.status === "evening-drink"
            ? 1080
            : 1320;
    const inTransit = input.minuteOfDay - transitionMinute;
    const locationId =
      inTransit >= 0 && inTransit < 10
        ? routeIds[Math.min(routeIds.length - 1, Math.floor(inTransit / 2))]
        : activity.locationId;
    agents.push({
      id: `agent.${stay.bookingId}`,
      kind: "guest",
      guestId: reservation?.guestId ?? `guest.${stay.bookingId}`,
      locationId,
      status: activity.status,
      routeIds,
    });
  }

  for (const staff of input.staff) {
    const locationId = staff.absent
      ? "outside.hotel"
      : (STAFF_AREA_BY_ROLE[staff.role] ?? "facility.staff_area");
    agents.push({
      id: staff.id,
      kind: "staff",
      locationId,
      status: staff.absent ? "absent" : "working",
      routeIds: [locationId],
    });
  }

  return agents.sort((a, b) => compareIds(a.id, b.id));
}

export function describeLiftCars(input: {
  liftId: string;
  cars: number;
  topFloor: number;
  elapsedMinutes: number;
  trips: number;
  failed: boolean;
  waitingGuestIds: readonly string[];
  heldFloorByCar?: readonly number[];
  heldPositionFloorBasisPointsByCar?: readonly number[];
}): LiftCarDescriptor[] {
  const topFloor = Math.max(0, Math.floor(input.topFloor));
  const cycleLegs = Math.max(1, topFloor * 2);
  return Array.from({ length: Math.max(0, input.cars) }, (_, index) => {
    const moving = input.trips > 0 && !input.failed && topFloor > 0;
    const leg = moving
      ? Math.floor(input.elapsedMinutes / ELEVATOR_TRIP_MINUTES + index) %
        cycleLegs
      : 0;
    const movingUp = moving && leg < topFloor;
    const heldFloor = Math.max(
      0,
      Math.min(
        topFloor,
        Math.floor(input.heldFloorByCar?.[index] ?? index % (topFloor + 1)),
      ),
    );
    const currentFloor = moving
      ? movingUp
        ? leg
        : Math.max(0, topFloor * 2 - leg)
      : heldFloor;
    const targetFloor = moving
      ? movingUp
        ? currentFloor + 1
        : currentFloor - 1
      : currentFloor;
    const progress = moving
      ? Math.floor(
          ((input.elapsedMinutes % ELEVATOR_TRIP_MINUTES) * 10000) /
            ELEVATOR_TRIP_MINUTES,
        )
      : 0;
    const heldPositionFloorBasisPoints = Math.max(
      0,
      Math.min(
        topFloor * 10000,
        Math.floor(
          input.heldPositionFloorBasisPointsByCar?.[index] ??
            currentFloor * 10000,
        ),
      ),
    );
    return {
      id: `${input.liftId}.car.${index + 1}`,
      currentFloor,
      targetFloor,
      positionFloorBasisPoints: moving
        ? currentFloor * 10000 + (movingUp ? progress : -progress)
        : heldPositionFloorBasisPoints,
      direction: moving ? (movingUp ? "up" : "down") : "idle",
      moving,
      stopped: !moving,
      failed: input.failed,
      waitingGuestIds: [...input.waitingGuestIds].sort(compareIds),
    };
  });
}
