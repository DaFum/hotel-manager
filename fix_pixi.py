with open("src/render/PixiHotelScene.ts", "r") as f:
    content = f.read()

content = content.replace("tile.clear();", "tile!.clear();")
content = content.replace("tile.moveTo(0, TILE_HEIGHT / 2)", "tile!.moveTo(0, TILE_HEIGHT / 2)")
content = content.replace("tile.tint = tint;", "tile!.tint = tint;")
content = content.replace("tile.tint = HOVER_TINT;", "tile!.tint = HOVER_TINT;")

with open("src/render/PixiHotelScene.ts", "w") as f:
    f.write(content)
