import { describe, expect, it } from "vitest";
import { entityLabel, humanize } from "./entityNames";

describe("entityLabel", () => {
  it("names a room by its number rather than its identifier", () => {
    expect(entityLabel("room.101", "en-GB")).toBe("Room 101");
    expect(entityLabel("room.101", "de-DE")).toBe("Zimmer 101");
  });

  it("names an employee by role and index", () => {
    expect(entityLabel("staff.reception.1", "en-GB")).toBe("Reception 1");
    expect(entityLabel("staff.housekeeping.2", "en-GB")).toBe("Housekeeping 2");
    expect(entityLabel("staff.reception.1", "de-DE")).toBe("Rezeption 1");
  });

  it("names a lift car", () => {
    expect(entityLabel("asset.lift.car.1", "en-GB")).toBe("Lift 1");
    expect(entityLabel("asset.lift.car.1", "de-DE")).toBe("Aufzug 1");
  });

  it("names commercial spaces, outlets, facilities and loans", () => {
    expect(entityLabel("space.carpark", "en-GB")).toBe("Car park");
    expect(entityLabel("space.carpark", "de-DE")).toBe("Parkhaus");
    expect(entityLabel("fnb.breakfastRoom", "en-GB")).toBe("Breakfast room");
    expect(entityLabel("facility.security", "en-GB")).toBe("Security");
    expect(entityLabel("loan.starter", "en-GB")).toBe("Opening loan");
  });

  /**
   * The point of the fallback: a kind of entity nobody has translated yet must
   * still reach the player as a noun. Losing the translation is a content gap;
   * showing the identifier is a bug.
   */
  it("never shows an identifier for a shape it does not know", () => {
    expect(entityLabel("widget.someNewThing", "en-GB")).toBe("Some new thing");
    expect(entityLabel("deeply.nested.unknown_key", "en-GB")).toBe(
      "Unknown key",
    );
    expect(entityLabel("", "en-GB")).toBe("");
  });

  it("humanizes camelCase and snake_case alike", () => {
    expect(humanize("breakfastRoom")).toBe("Breakfast room");
    expect(humanize("breakfast_room")).toBe("Breakfast room");
    expect(humanize("lift-car")).toBe("Lift car");
  });
});
