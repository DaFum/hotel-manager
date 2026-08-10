with open("src/render/sceneLayout.test.ts", "r") as f:
    content = f.read()

search = """  it("names what is wrong with a room instead of only colouring it", () => {
    expect(roomConcern("OutOfOrder", 10)).toBe("out-of-service");
    expect(roomConcern("Blocked", 90)).toBe("out-of-service");
    expect(roomConcern("VacantDirty", 20)).toBe("needs-cleaning");
    expect(roomConcern("Occupied", 80)).toBe("none");
    // A room can be nominally clean and still be below a sellable standard.
    expect(roomConcern("VacantClean", 40)).toBe("needs-cleaning");
    expect(roomConcern("VacantClean", 90)).toBe("none");
  });"""

replace = """  it("names what is wrong with a room instead of only colouring it", () => {
    expect(roomConcern("OutOfOrder", 10)).toBe("out-of-service");
    expect(roomConcern("Blocked", 90)).toBe("out-of-service");
    expect(roomConcern("VacantDirty", 20)).toBe("needs-cleaning");
    expect(roomConcern("Occupied", 80)).toBe("none");
    // A room can be nominally clean and still be below a sellable standard.
    expect(roomConcern("VacantClean", 40)).toBe("needs-cleaning");
    expect(roomConcern("VacantClean", 90)).toBe("none");
    // A room under construction returns "under-construction" regardless of its cleanliness or occupancy.
    expect(roomConcern("VacantClean", 100, true)).toBe("under-construction");
    expect(roomConcern("Occupied", 50, true)).toBe("under-construction");
  });"""

content = content.replace(search, replace)

with open("src/render/sceneLayout.test.ts", "w") as f:
    f.write(content)
