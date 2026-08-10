with open("src/ui/accessibility/SemanticHotelTree.tsx", "r") as f:
    content = f.read()

import_addition = """import { translateGame, type GameLocale } from "../../i18n";
import { groupByFloor } from "../../render/sceneLayout";"""
content = content.replace('import { translateGame, type GameLocale } from "../../i18n";', import_addition)

group_by_floor_removal = """/**
 * Rooms by floor, ground up. Without a floor map the house is one list, which
 * is what a hotel with no declared storeys actually is.
 */
function groupByFloor(
  rooms: readonly SemanticRoom[],
  floorByRoomId?: Readonly<Record<string, number>>,
): [number, SemanticRoom[]][] {
  if (!floorByRoomId) return [[0, [...rooms]]];
  const byFloor = new Map<number, SemanticRoom[]>();
  for (const room of rooms) {
    const floor = floorByRoomId[room.id] ?? 0;
    const bucket = byFloor.get(floor);
    if (bucket) bucket.push(room);
    else byFloor.set(floor, [room]);
  }
  return [...byFloor.entries()].sort(([a], [b]) => a - b);
}"""

content = content.replace(group_by_floor_removal, "")

with open("src/ui/accessibility/SemanticHotelTree.tsx", "w") as f:
    f.write(content)
