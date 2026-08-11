export interface Point {
  x: number;
  y: number;
}
export interface FocusTarget extends Point {
  id: string;
  floor: number;
  kind: "room" | "problem" | "person" | "facility";
}
export interface CameraState extends Point {
  zoom: number;
  floor: number;
  cutaway: boolean;
  focusedId: string | null;
  showServiceAreas: boolean;
}
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;
export function createCamera(): CameraState {
  return {
    x: 0,
    y: 0,
    zoom: 1,
    floor: 0,
    cutaway: false,
    focusedId: null,
    showServiceAreas: false,
  };
}
export function panCamera(camera: CameraState, by: Point): CameraState {
  return { ...camera, x: camera.x + by.x, y: camera.y + by.y };
}
export function zoomCamera(camera: CameraState, zoom: number): CameraState {
  return { ...camera, zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) };
}
export function focusCamera(
  camera: CameraState,
  target: FocusTarget,
): CameraState {
  return {
    ...camera,
    x: target.x,
    y: target.y,
    floor: target.floor,
    focusedId: target.id,
  };
}
/**
 * Dragging moves the building with the pointer, so the camera travels the
 * opposite way — and by the distance the pointer covered *in world units*, or
 * the house would slide faster than the hand at high zoom.
 */
export function dragCamera(camera: CameraState, by: Point): CameraState {
  // A zoom of zero would be a divide by nothing. The bounds forbid one; this
  // makes the guarantee local rather than remote.
  const zoom = camera.zoom || 1;
  return panCamera(camera, { x: -by.x / zoom, y: -by.y / zoom });
}

/**
 * One wheel notch is one step of zoom, whichever way the browser reports the
 * delta and however large it claims that delta is.
 */
export const WHEEL_ZOOM_STEP = 0.25;

export function wheelZoom(camera: CameraState, deltaY: number): CameraState {
  if (deltaY === 0) return camera;
  return zoomCamera(
    camera,
    camera.zoom + (deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP),
  );
}

export function selectFloor(
  camera: CameraState,
  floor: number,
  cutaway = true,
): CameraState {
  if (!Number.isSafeInteger(floor) || floor < 0)
    throw new Error("invalid floor");
  return { ...camera, floor, cutaway };
}
export function visibleFloor(floor: number, camera: CameraState): boolean {
  return camera.cutaway ? floor <= camera.floor : true;
}
export function serviceAreasVisible(camera: CameraState): boolean {
  return camera.showServiceAreas;
}
export function toggleServiceAreas(camera: CameraState): CameraState {
  return { ...camera, showServiceAreas: !camera.showServiceAreas };
}
export function serviceAreaEmphasis(
  kind: "guest" | "public" | "service",
  camera: CameraState,
): "normal" | "deemphasized" | "highlighted" {
  if (!serviceAreasVisible(camera)) return "normal";
  return kind === "service" ? "highlighted" : "deemphasized";
}
export function lightingFor(minuteOfDay: number): "day" | "evening" | "night" {
  return minuteOfDay >= 420 && minuteOfDay < 1080
    ? "day"
    : minuteOfDay >= 1080 && minuteOfDay < 1260
      ? "evening"
      : "night";
}
export function detailFor(zoom: number): "aggregate" | "rooms" | "people" {
  return zoom < 0.8 ? "aggregate" : zoom < 1.5 ? "rooms" : "people";
}
