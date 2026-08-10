with open("src/render/sceneLayout.ts", "r") as f:
    content = f.read()

# 1. Export DEFAULT_COLUMNS and replace columns fallback
content = content.replace("export const SELLABLE_CLEANLINESS = 60;", "export const SELLABLE_CLEANLINESS = 60;\n\nexport const DEFAULT_COLUMNS = 6;")
content = content.replace("columns = 6,", "columns = DEFAULT_COLUMNS,")

# 2. Add groupByFloor helper
group_by_floor_helper = """
/**
 * Rooms by floor, ground up. Without a floor map the house is one list, which
 * is what a hotel with no declared storeys actually is.
 */
export function groupByFloor<T extends { id: string }>(
  rooms: readonly T[],
  floorByRoomId?: Readonly<Record<string, number>>,
): [number, T[]][] {
  if (!floorByRoomId) return [[0, [...rooms]]];
  const byFloor = new Map<number, T[]>();
  for (const room of rooms) {
    const floor = floorByRoomId[room.id] ?? 0;
    const bucket = byFloor.get(floor);
    if (bucket) bucket.push(room);
    else byFloor.set(floor, [room]);
  }
  return [...byFloor.entries()].sort(([a], [b]) => a - b);
}
"""

content += group_by_floor_helper

with open("src/render/sceneLayout.ts", "w") as f:
    f.write(content)

with open("src/render/PixiHotelScene.ts", "r") as f:
    pixi_content = f.read()

pixi_content = pixi_content.replace("columns = 6,", "columns = DEFAULT_COLUMNS,")
pixi_content = pixi_content.replace(
    "} from \"./sceneLayout\";",
    "  DEFAULT_COLUMNS,\n} from \"./sceneLayout\";"
)
pixi_content = pixi_content.replace("model.columns ?? 6", "model.columns ?? DEFAULT_COLUMNS")

with open("src/render/PixiHotelScene.ts", "w") as f:
    f.write(pixi_content)
