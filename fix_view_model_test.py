with open("src/ui/hotelViewModel.test.ts", "r") as f:
    content = f.read()

prefix_test_old = """  it("does not match a shorter prefix room ID for alerts on a longer ID", () => {
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
  });"""

prefix_test_new = """  it("does not match a shorter prefix room ID for alerts on a longer ID", () => {
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

    // For the test to pass right now, worldProblems must be updated to use strict regex matching.
    const [pinned] = worldProblems(s);

    // We expect it to find longRoomId, not shortRoomId. We'll use the placement function
    // directly as our source of truth for the expected point, just to be sure.
    const placement = placeRooms(s.hotel.rooms, s.renderDescriptors.floorByRoomId).find(p => p.id === longRoomId)!;

    expect(pinned.kind).toBe("room");
    expect(pinned.x).toBe(placement.x);
    expect(pinned.y).toBe(placement.y);
  });"""

content = content.replace(prefix_test_old, prefix_test_new)

with open("src/ui/hotelViewModel.test.ts", "w") as f:
    f.write(content)
