import { describe, expect, it } from "vitest";
import { cleanRoom } from "./housekeeping";
describe("housekeeping", () => {
  it("moves a dirty room to inspected clean state only with supplies and minutes", () => {
    expect(
      cleanRoom(
        { state: "VacantDirty", cleanliness: 20 },
        { minutes: 35, cleaningUnits: 1 },
      ),
    ).toEqual({
      room: { state: "Inspected", cleanliness: 100 },
      cleaningUnitsLeft: 0,
    });
  });
  it("does not clean without supplies", () => {
    expect(() =>
      cleanRoom(
        { state: "VacantDirty", cleanliness: 20 },
        { minutes: 35, cleaningUnits: 0 },
      ),
    ).toThrow(/supplies/);
  });
});
