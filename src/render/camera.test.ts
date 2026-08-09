import { describe, expect, it } from "vitest";
import {
  createCamera,
  detailFor,
  focusCamera,
  lightingFor,
  panCamera,
  selectFloor,
  visibleFloor,
  zoomCamera,
} from "./camera";
describe("isometric camera", () => {
  it("pans, clamps zoom and focuses an entity by stable id", () => {
    const moved = panCamera(createCamera(), { x: 30, y: -10 });
    expect(zoomCamera(moved, 99).zoom).toBe(2.5);
    expect(
      focusCamera(moved, {
        id: "room.201",
        kind: "room",
        x: 8,
        y: 9,
        floor: 2,
      }),
    ).toMatchObject({ x: 8, y: 9, floor: 2, focusedId: "room.201" });
  });
  it("selects a floor and cuts away the ones above it", () => {
    const camera = selectFloor(createCamera(), 2);
    expect(visibleFloor(2, camera)).toBe(true);
    expect(visibleFloor(3, camera)).toBe(false);
    expect(
      focusCamera(camera, {
        id: "facility.spa",
        kind: "facility",
        x: 0,
        y: 0,
        floor: 2,
      }).focusedId,
    ).toBe("facility.spa");
  });
  it("drives lighting from time of day and detail from zoom", () => {
    expect([lightingFor(60), lightingFor(720), lightingFor(1140)]).toEqual([
      "night",
      "day",
      "evening",
    ]);
    expect([detailFor(0.5), detailFor(1), detailFor(2)]).toEqual([
      "aggregate",
      "rooms",
      "people",
    ]);
  });
});
