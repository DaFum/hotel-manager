with open("src/render/PixiHotelScene.ts", "r") as f:
    content = f.read()

# 1. Add cachedPlacements
content = content.replace("private hoveredId: string | null = null;", "private hoveredId: string | null = null;\n  private cachedPlacements: RoomPlacement[] | null = null;")

# 2. Update resize handler
content = content.replace(
    'if (this.lastModel) this.applyCamera(this.lastModel);',
    'if (this.lastModel && this.cachedPlacements) this.applyCamera(this.lastModel, this.cachedPlacements);'
)

# 3. Update render method
render_search = """  render(
    roomsOrModel: readonly SceneRoom[] | SceneModel,
    facilities: readonly FacilityTile[] = [],
    columns = DEFAULT_COLUMNS,
  ): void {
    const model: SceneModel = Array.isArray(roomsOrModel)
      ? { rooms: roomsOrModel, facilities, columns }
      : (roomsOrModel as SceneModel);

    this.lastModel = model;
    this.facilities.render(model.facilities ?? []);
    this.drawBuilding(model);
    this.drawPeople(model);
    this.applyCamera(model);
  }"""
render_replace = """  render(
    roomsOrModel: readonly SceneRoom[] | SceneModel,
    facilities: readonly FacilityTile[] = [],
    columns = DEFAULT_COLUMNS,
  ): void {
    const model: SceneModel = Array.isArray(roomsOrModel)
      ? { rooms: roomsOrModel, facilities, columns }
      : (roomsOrModel as SceneModel);

    this.lastModel = model;
    this.cachedPlacements = this.placements(model);

    this.facilities.render(model.facilities ?? []);
    this.drawBuilding(model, this.cachedPlacements);
    this.drawPeople(model, this.cachedPlacements);
    this.applyCamera(model, this.cachedPlacements);
  }"""
content = content.replace(render_search, render_replace)

# 4. Update drawBuilding method
draw_building_search = """  private drawBuilding(model: SceneModel): void {
    for (const child of this.tiles.removeChildren()) child.destroy();
    for (const child of this.marks.removeChildren()) child.destroy();

    const tint = LIGHT_TINT[lightingFor(model.minuteOfDay ?? 720)];
    const renovating = new Set(model.renovatingRoomIds ?? []);

    for (const placement of this.placements(model)) {"""
draw_building_replace = """  private drawBuilding(model: SceneModel, placements: RoomPlacement[]): void {
    const tint = LIGHT_TINT[lightingFor(model.minuteOfDay ?? 720)];
    const renovating = new Set(model.renovatingRoomIds ?? []);

    // Clear marks, but retain tiles.
    for (const child of this.marks.removeChildren()) child.destroy();

    const activeIds = new Set(placements.map(p => p.id));

    // Remove stale tiles
    for (let i = this.tiles.children.length - 1; i >= 0; i--) {
      const child = this.tiles.children[i];
      if (!activeIds.has(child.label)) {
        this.tiles.removeChild(child).destroy();
      }
    }

    const tileMap = new Map(this.tiles.children.map(c => [c.label, c as Graphics]));

    for (const placement of placements) {"""
content = content.replace(draw_building_search, draw_building_replace)

# 5. Update drawBuilding tile logic
tile_search = """      const tile = new Graphics()
        .moveTo(0, TILE_HEIGHT / 2)
        .lineTo(TILE_WIDTH / 2, 0)
        .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
        .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
        .closePath()
        .fill(STATE_COLOURS[placement.state] ?? 0x888888)
        // Without an edge, neighbouring rooms in the same state melt into one
        // slab and the building stops reading as a set of rooms.
        .stroke({ width: 1, color: 0x0e1114, alignment: 1 });
      tile.position.set(placement.x, placement.y);
      tile.label = placement.id;
      tile.tint = tint;

      // The same stable id the semantic DOM control uses, so clicking the
      // world and clicking the room list are the same action.
      tile.eventMode = "static";
      tile.cursor = "pointer";
      tile.on("pointertap", () => this.onSelectRoom?.(placement.id));
      // Hover is a pure presentation state: it lights the tile the pointer is
      // over without asking React to redraw the page for a mouse move.
      tile.on("pointerover", () => {
        this.hoveredId = placement.id;
        tile.tint = HOVER_TINT;
      });
      tile.on("pointerout", () => {
        if (this.hoveredId === placement.id) this.hoveredId = null;
        tile.tint = tint;
      });
      if (this.hoveredId === placement.id) tile.tint = HOVER_TINT;

      this.tiles.addChild(tile);"""
tile_replace = """      let tile = tileMap.get(placement.id);

      const requiresRebuild = !tile || tile.x !== placement.x || tile.y !== placement.y;

      if (requiresRebuild) {
        if (tile) {
          this.tiles.removeChild(tile).destroy();
        }
        tile = new Graphics()
          .moveTo(0, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, 0)
          .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
          .closePath()
          .fill(STATE_COLOURS[placement.state] ?? 0x888888)
          // Without an edge, neighbouring rooms in the same state melt into one
          // slab and the building stops reading as a set of rooms.
          .stroke({ width: 1, color: 0x0e1114, alignment: 1 });
        tile.position.set(placement.x, placement.y);
        tile.label = placement.id;

        // The same stable id the semantic DOM control uses, so clicking the
        // world and clicking the room list are the same action.
        tile.eventMode = "static";
        tile.cursor = "pointer";
        tile.on("pointertap", () => this.onSelectRoom?.(placement.id));
        // Hover is a pure presentation state: it lights the tile the pointer is
        // over without asking React to redraw the page for a mouse move.
        tile.on("pointerover", () => {
          this.hoveredId = placement.id;
          tile!.tint = HOVER_TINT;
        });
        tile.on("pointerout", () => {
          if (this.hoveredId === placement.id) this.hoveredId = null;
          tile!.tint = LIGHT_TINT[lightingFor(this.lastModel?.minuteOfDay ?? 720)];
        });

        this.tiles.addChild(tile);
      } else {
        // Update existing tile
        tile.clear();
        tile.moveTo(0, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, 0)
          .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
          .closePath()
          .fill(STATE_COLOURS[placement.state] ?? 0x888888)
          .stroke({ width: 1, color: 0x0e1114, alignment: 1 });
      }

      tile.tint = tint;
      if (this.hoveredId === placement.id) tile.tint = HOVER_TINT;"""
content = content.replace(tile_search, tile_replace)

# 6. Update drawPeople
draw_people_search = """  private drawPeople(model: SceneModel): void {
    for (const child of this.people.removeChildren()) child.destroy();
    if (!model.agents?.length) return;

    // The desk is the origin of the ground floor: where an arriving guest
    // stands when they are waiting rather than anywhere in particular.
    for (const agent of placeAgents(model.agents, this.placements(model), {"""
draw_people_replace = """  private drawPeople(model: SceneModel, placements: RoomPlacement[]): void {
    for (const child of this.people.removeChildren()) child.destroy();
    if (!model.agents?.length) return;

    // The desk is the origin of the ground floor: where an arriving guest
    // stands when they are waiting rather than anywhere in particular.
    for (const agent of placeAgents(model.agents, placements, {"""
content = content.replace(draw_people_search, draw_people_replace)

# 7. Update applyCamera
apply_camera_search = """  private applyCamera(model: SceneModel): void {
    if (!model.camera) return;
    const transform = stageTransform(
      model.camera,
      { width: this.app.renderer.width, height: this.app.renderer.height },
      buildingCentre(this.placements(model)),
    );"""
apply_camera_replace = """  private applyCamera(model: SceneModel, placements: RoomPlacement[]): void {
    if (!model.camera) return;
    const transform = stageTransform(
      model.camera,
      { width: this.app.renderer.width, height: this.app.renderer.height },
      buildingCentre(placements),
    );"""
content = content.replace(apply_camera_search, apply_camera_replace)

with open("src/render/PixiHotelScene.ts", "w") as f:
    f.write(content)
