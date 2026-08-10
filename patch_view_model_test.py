with open("src/ui/hotelViewModel.test.ts", "r") as f:
    content = f.read()

# 1. Update known-room assertion in roomFocusPoint test
known_room_search = """  it("finds a room's place in the world, and holds still for one it cannot", () => {
    const s = snapshot();
    const known = roomFocusPoint(s.hotel.rooms.at(-1)!.id, s);

    expect(Number.isFinite(known.x)).toBe(true);
    expect(roomFocusPoint("room.nowhere", s, { x: 7, y: 8, floor: 2 })).toEqual(
      {
        x: 7,
        y: 8,
        floor: 2,
      },
    );
  });"""
known_room_replace = """  it("finds a room's place in the world, and holds still for one it cannot", () => {
    const s = snapshot();
    const targetRoom = s.hotel.rooms.at(-1)!;
    const known = roomFocusPoint(targetRoom.id, s);
    const expectedPlacement = placeRooms(s.hotel.rooms, s.renderDescriptors.floorByRoomId).find((p) => p.id === targetRoom.id);

    expect(known).toEqual({ x: expectedPlacement!.x, y: expectedPlacement!.y, floor: expectedPlacement!.floor });
    expect(roomFocusPoint("room.nowhere", s, { x: 7, y: 8, floor: 2 })).toEqual(
      {
        x: 7,
        y: 8,
        floor: 2,
      },
    );
  });"""
content = content.replace(known_room_search, known_room_replace)

# 2. Add prefix-overlapping room fixtures test
import_search = """import {
  rateByCategory,
  renovatingRoomIds,
  roomFocusPoint,
  visualAgents,
  worldProblems,"""
import_replace = """import { placeRooms } from "../render/sceneLayout";\nimport {
  rateByCategory,
  renovatingRoomIds,
  roomFocusPoint,
  visualAgents,
  worldProblems,"""
if "import { placeRooms }" not in content:
    content = content.replace(import_search, import_replace)

prefix_test = """
  it("does not match a shorter prefix room ID for alerts on a longer ID", () => {
    const s = snapshot();
    // Simulate a prefix room ID
    const shortRoomId = s.hotel.rooms[0].id;
    const longRoomId = shortRoomId + "0";

    // Inject the longer room id
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
    const expectedPoint = roomFocusPoint(longRoomId, s);

    expect(pinned.kind).toBe("room");
    expect(pinned.x).toBe(expectedPoint.x);
    expect(pinned.y).toBe(expectedPoint.y);
  });
"""

# Append just before the final `});`
content = content[:content.rfind("});")] + prefix_test + "});\n"

with open("src/ui/hotelViewModel.test.ts", "w") as f:
    f.write(content)
