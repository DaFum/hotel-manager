import { describe, expect, it } from "vitest";
import { CORE_CONTENT_PACK, CORE_CONTENT_REGISTRY } from "./corePack";
import { GUEST_SEGMENTS } from "./1991/guestSegments";
import { MENU } from "./1991/menu";
import { SUPPLIERS } from "./1991/suppliers";
import { MODULE_LIBRARY } from "./rooms/modules";

describe("core content pack", () => {
  it("loads every major family into the normalized registry", () => {
    expect(CORE_CONTENT_PACK.packId).toBe("core");
    expect(
      new Set(CORE_CONTENT_REGISTRY.all().map((entry) => entry.kind)),
    ).toEqual(
      new Set([
        "city",
        "item",
        "technology",
        "facility",
        "roomProduct",
        "trend",
        "guestSegment",
        "event",
        "recipe",
        "supplier",
        "rival",
        "brand",
        "regulation",
      ]),
    );
  });

  it("contains every runtime record in the Plan 07 content families", () => {
    for (const record of [
      ...GUEST_SEGMENTS,
      ...MENU,
      ...SUPPLIERS,
      ...MODULE_LIBRARY,
    ])
      expect(CORE_CONTENT_REGISTRY.get(record.id)).toMatchObject({
        id: record.id,
      });
    expect(CORE_CONTENT_REGISTRY.get("tech.personal-computer")).toBeTruthy();
    expect(CORE_CONTENT_REGISTRY.get("brand.mainblick")).toBeTruthy();
    expect(CORE_CONTENT_REGISTRY.get("hotel.rival.hof")).toBeTruthy();
    expect(CORE_CONTENT_REGISTRY.get("narrative.digital-bet")).toBeTruthy();
    expect(GUEST_SEGMENTS.map(({ id }) => id)).toEqual([
      "segment.business",
      "segment.corporate",
      "segment.leisure",
      "segment.budget",
    ]);
    expect(MODULE_LIBRARY.map(({ id }) => id)).toEqual([
      "room.standard.single",
      "room.standard.double",
      "room.comfort.double",
      "room.suite.junior",
    ]);
  });
});
