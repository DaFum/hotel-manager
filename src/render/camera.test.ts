import { describe, expect, it } from "vitest";
import {
  createCamera,
  detailFor,
  dragCamera,
  MAX_ZOOM,
  MIN_ZOOM,
  WHEEL_ZOOM_STEP,
  wheelZoom,
  focusCamera,
  followCamera,
  lightingFor,
  panCamera,
  selectFloor,
  serviceAreasVisible,
  serviceAreaEmphasis,
  toggleServiceAreas,
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
  it("follows a moving person until another entity takes focus", () => {
    const followed = focusCamera(createCamera(), {
      id: "guest.berger",
      kind: "person",
      x: 8,
      y: 9,
      floor: 1,
    });
    expect(followed.followedAgentId).toBe("guest.berger");
    expect(
      followCamera(followed, {
        id: "guest.berger",
        x: 40,
        y: 12,
        floor: 0,
      }),
    ).toMatchObject({ x: 40, y: 12, floor: 0, focusedId: "guest.berger" });
    expect(
      focusCamera(followed, {
        id: "room.101",
        kind: "room",
        x: 0,
        y: 0,
        floor: 1,
      }).followedAgentId,
    ).toBeNull();
  });
  it("selects a floor and cuts away the ones above it", () => {
    const camera = selectFloor(createCamera(), 2);
    expect(visibleFloor(2, camera)).toBe(true);
    expect(visibleFloor(3, camera)).toBe(false);
    const focused = focusCamera(camera, {
      id: "facility.spa",
      kind: "facility",
      x: 0,
      y: 0,
      floor: 3,
    });
    expect(focused.focusedId).toBe("facility.spa");
    expect(focused.floor).toBe(3);
    expect(visibleFloor(3, focused)).toBe(true);
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
  it("keeps the service overlay as presentation-only camera state", () => {
    const camera = createCamera();
    expect(serviceAreasVisible(camera)).toBe(false);
    const visible = toggleServiceAreas(camera);
    expect(serviceAreasVisible(visible)).toBe(true);
    expect(serviceAreaEmphasis("service", visible)).toBe("highlighted");
    expect(serviceAreaEmphasis("guest", visible)).toBe("deemphasized");
    expect(toggleServiceAreas(visible).showServiceAreas).toBe(false);
  });
});

describe("driving the camera with a pointer", () => {
  it("moves the building with the hand, not against it", () => {
    const dragged = dragCamera(createCamera(), { x: 30, y: -10 });

    // The pointer went right, so the camera went left and the house followed
    // the hand.
    expect(dragged.x).toBe(-30);
    expect(dragged.y).toBe(10);
  });

  it("drags by what the hand covered on screen, not in the world", () => {
    const zoomed = zoomCamera(createCamera(), 2);

    // At twice the zoom, thirty screen pixels are fifteen world pixels.
    expect(dragCamera(zoomed, { x: 30, y: 0 }).x).toBe(-15);
  });

  it("takes one wheel notch as one step, whatever the browser reports", () => {
    const camera = createCamera();

    expect(wheelZoom(camera, -1).zoom).toBe(camera.zoom + WHEEL_ZOOM_STEP);
    expect(wheelZoom(camera, -240).zoom).toBe(camera.zoom + WHEEL_ZOOM_STEP);
    expect(wheelZoom(camera, 240).zoom).toBe(camera.zoom - WHEEL_ZOOM_STEP);
    expect(wheelZoom(camera, 0)).toBe(camera);
  });

  it("never wheels past the bounds the world declares", () => {
    let camera = createCamera();
    for (let i = 0; i < 40; i++) camera = wheelZoom(camera, -1);
    expect(camera.zoom).toBe(MAX_ZOOM);
    for (let i = 0; i < 40; i++) camera = wheelZoom(camera, 1);
    expect(camera.zoom).toBe(MIN_ZOOM);
  });
});
