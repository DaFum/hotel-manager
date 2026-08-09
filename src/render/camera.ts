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
}
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;
export function createCamera(): CameraState {
  return { x: 0, y: 0, zoom: 1, floor: 0, cutaway: false, focusedId: null };
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
