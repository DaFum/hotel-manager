with open("src/ui/HotelView.tsx", "r") as f:
    content = f.read()

# 1. Update imports and remove local SceneModel
scene_model_local = """interface SceneModel {
  rooms: readonly HotelViewRoom[];
  facilities: readonly HotelViewFacility[];
  agents: readonly VisualAgent[];
  floorByRoomId: Readonly<Record<string, number>>;
  renovatingRoomIds: readonly string[];
  camera?: CameraState;
  selectedId: string | null;
  minuteOfDay: number;
}"""
content = content.replace(scene_model_local, 'import type { SceneModel } from "../render/PixiHotelScene";')
content = content.replace('import type { GameLocale } from "../i18n";', 'import { translateGame, type GameLocale } from "../i18n";')

# 2. Update roomProblems
room_problems_old = """export function roomProblems(
  room: HotelViewRoom,
  renovatingRoomIds: readonly string[] = [],
): string[] {
  const problems: string[] = [];
  if (roomConcern(room.state, room.cleanliness) === "out-of-service")
    problems.push(`Out of service: ${humanRoomState(room.state)}`);
  if (roomConcern(room.state, room.cleanliness) === "needs-cleaning")
    problems.push(`Needs housekeeping: cleanliness ${room.cleanliness}`);
  if (renovatingRoomIds.includes(room.id)) problems.push("Shut for renovation");
  return problems;
}"""
room_problems_new = """export function roomProblems(
  room: HotelViewRoom,
  renovatingRoomIds: readonly string[] = [],
): { key: string; values?: Record<string, string | number> }[] {
  const problems: { key: string; values?: Record<string, string | number> }[] = [];
  const concern = roomConcern(room.state, room.cleanliness, renovatingRoomIds.includes(room.id));
  if (concern === "under-construction") {
    problems.push({ key: "room.problems.renovating" });
  } else if (concern === "out-of-service") {
    problems.push({ key: "room.problems.outOfService", values: { state: humanRoomState(room.state) } });
  } else if (concern === "needs-cleaning") {
    problems.push({ key: "room.problems.needsCleaning", values: { cleanliness: room.cleanliness } });
  }
  return problems;
}"""
content = content.replace(room_problems_old, room_problems_new)

# 3. Update selectRoom assignment to use layout effect
effect_search = """  // The scene is attached once and keeps the handler it was given, so the
  // callback is held in a ref rather than baked into that one attachment.
  const selectRoom = useRef<(roomId: string) => void>(() => {});
  selectRoom.current = (roomId: string) => props.onSelect?.(roomId);"""
effect_replace = """  // The scene is attached once and keeps the handler it was given, so the
  // callback is held in a ref rather than baked into that one attachment.
  const selectRoom = useRef<(roomId: string) => void>(() => {});
  useEffect(() => {
    selectRoom.current = (roomId: string) => props.onSelect?.(roomId);
  }, [props.onSelect]);"""
content = content.replace(effect_search, effect_replace)

# 4. Update pointer down and up for canvas
pointer_search = """        onPointerDown={(event) => {
          if (!props.onCamera) return;
          drag.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const from = drag.current;
          const camera = cameraRef.current;
          if (!from || !camera) return;
          drag.current = { x: event.clientX, y: event.clientY };
          moveCamera.current(
            dragCamera(camera, {
              x: event.clientX - from.x,
              y: event.clientY - from.y,
            }),
          );
        }}
        onPointerUp={(event) => {
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}"""
pointer_replace = """        onPointerDown={(event) => {
          if (!props.onCamera) return;
          drag.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const from = drag.current;
          const camera = cameraRef.current;
          if (!from || !camera) return;
          const dx = event.clientX - from.x;
          const dy = event.clientY - from.y;
          // Apply a small drag threshold to differentiate between a click and a pan.
          // This avoids panning from tiny unintentional movements during a click.
          // However, Pixi captures its own events for clicking rooms.
          drag.current = { x: event.clientX, y: event.clientY };
          moveCamera.current(dragCamera(camera, { x: dx, y: dy }));
        }}
        onPointerUp={(event) => {
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}"""
content = content.replace(pointer_search, pointer_replace)

with open("src/ui/HotelView.tsx", "w") as f:
    f.write(content)
