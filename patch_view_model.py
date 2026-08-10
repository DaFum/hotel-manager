with open("src/ui/hotelViewModel.ts", "r") as f:
    content = f.read()

world_problems_search = """export function worldProblems(snapshot: GameSnapshot): {
  id: string;
  title: string;
  cause: string;
  floor: number;
  x: number;
  y: number;
  kind: "problem" | "room";
}[] {
  return snapshot.alerts.map((alert) => {
    const roomId = snapshot.hotel.rooms.find(
      (room) => alert.id.includes(room.id) || alert.cause.includes(room.id),
    )?.id;
    const point = roomId
      ? roomFocusPoint(roomId, snapshot)
      : { x: 0, y: 0, floor: 0 };
    return {
      id: alert.id,
      title: alert.title,
      cause: alert.cause,
      ...point,
      kind: roomId ? ("room" as const) : ("problem" as const),
    };
  });
}"""

world_problems_replace = """export function worldProblems(snapshot: GameSnapshot): {
  id: string;
  title: string;
  cause: string;
  floor: number;
  x: number;
  y: number;
  kind: "problem" | "room";
}[] {
  const placements = placeRooms(snapshot.hotel.rooms, snapshot.renderDescriptors.floorByRoomId);
  const placementsById = new Map(placements.map(p => [p.id, p]));

  return snapshot.alerts.map((alert) => {
    // Prefer exact or boundary-checked room ID match over simple substring inclusion
    // to avoid matching "room.10" when searching for "room.1".
    const roomId = snapshot.hotel.rooms.find((room) => {
      const boundaryRegex = new RegExp(`\\\\b${room.id.replace(/\\./g, '\\\\.')}\\\\b`);
      return boundaryRegex.test(alert.id) || boundaryRegex.test(alert.cause);
    })?.id;

    const placement = roomId ? placementsById.get(roomId) : undefined;
    const point = placement
      ? { x: placement.x, y: placement.y, floor: placement.floor }
      : { x: 0, y: 0, floor: 0 };

    return {
      id: alert.id,
      // The keys remain intact, UI handles resolving them
      title: alert.title,
      cause: alert.cause,
      ...point,
      kind: placement ? ("room" as const) : ("problem" as const),
    };
  });
}"""

content = content.replace(world_problems_search, world_problems_replace)

with open("src/ui/hotelViewModel.ts", "w") as f:
    f.write(content)
