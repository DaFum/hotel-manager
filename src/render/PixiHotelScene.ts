import { Application, Container, Graphics } from "pixi.js";
import {
  FacilityLayer,
  LOAD_COLOURS,
  loadBand,
  type FacilityTile,
} from "./facilities/FacilityLayer";
import {
  lightingFor,
  serviceAreaEmphasis,
  visibleFloor,
  type CameraState,
} from "./camera";
import {
  buildingCentre,
  FLOOR_HEIGHT,
  markerKindsForEntity,
  placeAgents,
  placeAgentsFromEntities,
  placeRooms,
  placeRoomsFromGeometry,
  roomConcern,
  stageTransform,
  visiblePlacements,
  type RoomPlacement,
} from "./sceneLayout";
import { TILE_HEIGHT, TILE_WIDTH } from "./tileMetrics";
import type { VisualAgent } from "./agentMaterialization";
import type { ElevatorVisualState } from "./agentMaterialization";
import type { Phase as RenovationPhase } from "../game/renovation/projects";
import type { FloorPlan } from "../game/building/floorPlan";
import { isoProject } from "./isoProjection";
import {
  aggregateRoomState,
  renovationVisualFor,
  roomLighting,
  roomLodFor,
} from "./roomVisuals";
import { navigationWithClosures } from "./navigationGraph";

export { TILE_HEIGHT, TILE_WIDTH } from "./tileMetrics";

export interface SceneRoom {
  id: string;
  category: string;
  state: string;
  cleanliness?: number;
}

/**
 * Everything the scene needs to draw one moment of the hotel. It is a plain
 * projection of the snapshot — the scene never asks the worker anything, and
 * re-rendering an older model is always safe.
 */
export interface SceneModel {
  rooms: readonly SceneRoom[];
  facilities?: readonly FacilityTile[];
  agents?: readonly VisualAgent[];
  renovationPhaseByRoomId?: Readonly<Record<string, RenovationPhase>>;
  floorByRoomId?: Readonly<Record<string, number>>;
  positionByEntityId?: Readonly<
    Record<string, { floor: number; gridX: number; gridY: number }>
  >;
  floorPlan?: FloorPlan;
  closedNavigationIds?: readonly string[];
  elevator?: ElevatorVisualState;
  camera?: CameraState;
  selectedId?: string | null;
  minuteOfDay?: number;
  columns?: number;
}

const STATE_COLOURS: Record<string, number> = {
  VacantClean: 0x4c9f70,
  VacantDirty: 0xb07d3a,
  Occupied: 0x3a6ea5,
  Reserved: 0x6a5acd,
  Inspected: 0x7fbf7f,
  OutOfOrder: 0xa33a3a,
  Blocked: 0x555555,
};

/** The signal amber of the interface, so a selection means the same thing in
 *  the world as it does in the management panels. */
const SELECTION = 0xe8a33d;
const FOCUS = 0x6d9dc5;
const CONCERN_MARK = {
  "needs-cleaning": 0xe8b53a,
  "out-of-service": 0xe2543c,
  "under-construction": 0xe8a33d,
};

/** The tile under the pointer lifts towards the light. */
const HOVER_TINT = 0xffe9c4;

/** Night is not darkness — an operator still has to read the building. */
const LIGHT_TINT = { day: 0xffffff, evening: 0xdcd0bb, night: 0xa8b4c8 };

const AGENT_COLOURS = { guest: 0xe9e5db, staff: 0x6d9dc5 };
const AGENT_RADIUS = 3;

/**
 * Pixi draws only what the worker snapshot says; it holds no rules and no
 * state of its own, so a re-render from an older snapshot is always safe.
 *
 * The scene is decorative in the accessibility sense — every room and every
 * facility it draws is also a real control in the DOM — but it is not
 * decorative in the design sense: a dirty room, a lift out of service and a
 * queue at the desk are all meant to be visible here first.
 */
export class PixiHotelScene {
  private app = new Application();
  private world = new Container();
  private architecture = new Container();
  private lifts = new Container();
  private areaTiles = new Container();
  private tiles = new Container();
  private marks = new Container();
  private people = new Container();
  private facilities = new FacilityLayer();
  private onSelectRoom: ((roomId: string) => void) | null = null;
  private onSelectAgent: ((agentId: string) => void) | null = null;
  /** The last thing drawn, so a resize can be re-framed without a snapshot. */
  private lastModel: SceneModel | null = null;
  /** Which room the pointer is over, kept here so hover costs no re-render. */
  private hoveredId: string | null = null;

  async attach(canvasHost: HTMLElement): Promise<void> {
    await this.app.init({ background: 0x0e1114, resizeTo: canvasHost });
    canvasHost.appendChild(this.app.canvas);
    this.world.addChild(
      this.architecture,
      this.lifts,
      this.areaTiles,
      this.tiles,
      this.marks,
      this.people,
    );
    this.app.stage.addChild(this.world);
    // The facility strip is a heads-up read on the building, so it stays
    // pinned to the corner of the view rather than travelling with the world.
    this.facilities.container.position.set(8, 8);
    this.app.stage.addChild(this.facilities.container);

    // The canvas sizes itself to its host, and a paused game publishes no new
    // snapshot to redraw from — so a resize has to re-frame the building
    // itself, or the house sits off to one side until time runs again.
    this.app.renderer.on("resize", () => {
      if (this.lastModel) this.applyCamera(this.lastModel);
    });
  }

  /** Told once; the scene reports a click by the same room id the DOM uses. */
  onRoomSelected(handler: (roomId: string) => void): void {
    this.onSelectRoom = handler;
  }

  onAgentSelected(handler: (agentId: string) => void): void {
    this.onSelectAgent = handler;
  }

  render(
    roomsOrModel: readonly SceneRoom[] | SceneModel,
    facilities: readonly FacilityTile[] = [],
    columns = 6,
  ): void {
    const model: SceneModel = Array.isArray(roomsOrModel)
      ? { rooms: roomsOrModel, facilities, columns }
      : (roomsOrModel as SceneModel);

    this.lastModel = model;
    this.facilities.render(model.facilities ?? []);
    this.drawBuilding(model);
    this.drawArchitecture(model);
    this.drawLiftCars(model);
    this.drawPeople(model);
    this.applyCamera(model);
  }

  private drawLiftCars(model: SceneModel): void {
    for (const child of this.lifts.removeChildren()) child.destroy();
    for (const car of model.elevator?.cars ?? []) {
      const floorPosition = car.positionFloorBasisPoints / 10000;
      if (model.camera && !visibleFloor(Math.ceil(floorPosition), model.camera))
        continue;
      const point = isoProject(6, 2, TILE_WIDTH, TILE_HEIGHT);
      const colour = car.failed ? 0xe2543c : car.moving ? 0xe8a33d : 0x6d9dc5;
      const graphic = new Graphics()
        .rect(point.x - 5, point.y - floorPosition * FLOOR_HEIGHT - 4, 10, 8)
        .fill({ color: colour, alpha: 0.92 })
        .stroke({ width: 1, color: 0xe9e5db });
      graphic.label = car.id;
      this.lifts.addChild(graphic);

      if (car.failed)
        car.waitingGuestIds.slice(0, 6).forEach((guestId, index) => {
          const waiting = new Graphics()
            .circle(
              point.x + 10 + index * (AGENT_RADIUS * 2 + 2),
              point.y - car.currentFloor * FLOOR_HEIGHT,
              AGENT_RADIUS,
            )
            .fill(AGENT_COLOURS.guest);
          waiting.label = `${car.id}.waiting.${guestId}`;
          this.lifts.addChild(waiting);
        });
    }
  }

  private projectGrid(floor: number, gridX: number, gridY: number) {
    const point = isoProject(gridX, gridY, TILE_WIDTH, TILE_HEIGHT);
    return { x: point.x, y: point.y - floor * FLOOR_HEIGHT };
  }

  /** Draws the shell and circulation before rooms are placed into it. */
  private drawArchitecture(model: SceneModel): void {
    for (const child of this.architecture.removeChildren()) child.destroy();
    for (const child of this.areaTiles.removeChildren()) child.destroy();
    const plan = model.floorPlan;
    if (!plan) return;
    const camera = model.camera;
    const floorVisible = (floor: number) =>
      camera ? visibleFloor(floor, camera) : true;
    const navigation = navigationWithClosures(
      plan.navigationNodes,
      model.closedNavigationIds ?? [],
    );
    const closed = new Set(
      navigation.filter((node) => node.closed).map((node) => node.id),
    );

    for (const slab of plan.floorSlabs.filter((item) =>
      floorVisible(item.floor),
    )) {
      const corners = [
        this.projectGrid(slab.floor, slab.minGridX, slab.minGridY),
        this.projectGrid(slab.floor, slab.maxGridX, slab.minGridY),
        this.projectGrid(slab.floor, slab.maxGridX, slab.maxGridY),
        this.projectGrid(slab.floor, slab.minGridX, slab.maxGridY),
      ];
      const graphic = new Graphics()
        .moveTo(corners[0].x, corners[0].y)
        .lineTo(corners[1].x, corners[1].y)
        .lineTo(corners[2].x, corners[2].y)
        .lineTo(corners[3].x, corners[3].y)
        .closePath()
        .fill({ color: 0x11161b, alpha: 0.9 })
        .stroke({ width: 1, color: 0x38434d });
      graphic.label = `floor.${slab.floor}.slab`;
      this.architecture.addChild(graphic);
    }

    for (const wall of plan.exteriorWalls.filter((item) =>
      floorVisible(item.floor),
    )) {
      const from = this.projectGrid(
        wall.floor,
        wall.from.gridX,
        wall.from.gridY,
      );
      const to = this.projectGrid(wall.floor, wall.to.gridX, wall.to.gridY);
      const graphic = new Graphics()
        .moveTo(from.x, from.y)
        .lineTo(to.x, to.y)
        .stroke({ width: 2, color: 0x8a8f8b });
      graphic.label = wall.id;
      this.architecture.addChild(graphic);
    }

    for (const corridor of plan.corridorSpines.filter((item) =>
      floorVisible(item.floor),
    )) {
      const from = this.projectGrid(
        corridor.floor,
        corridor.from.gridX,
        corridor.from.gridY,
      );
      const to = this.projectGrid(
        corridor.floor,
        corridor.to.gridX,
        corridor.to.gridY,
      );
      const isClosed = closed.has(corridor.id);
      const emphasis = camera
        ? serviceAreaEmphasis(corridor.service ? "service" : "guest", camera)
        : "normal";
      const graphic = new Graphics()
        .moveTo(from.x, from.y)
        .lineTo(to.x, to.y)
        .stroke({
          width: emphasis === "highlighted" ? 8 : 5,
          color: isClosed ? 0xe2543c : 0x6d9dc5,
          alpha: emphasis === "deemphasized" ? 0.25 : 0.75,
        });
      graphic.label = isClosed ? `${corridor.id}.closed` : corridor.id;
      this.architecture.addChild(graphic);
    }

    const facilityById = new Map(
      (model.facilities ?? []).map((facility) => [facility.id, facility]),
    );
    for (const area of plan.areas.filter((item) => floorVisible(item.floor))) {
      const corners = [
        this.projectGrid(area.floor, area.gridX, area.gridY),
        this.projectGrid(area.floor, area.gridX + area.width, area.gridY),
        this.projectGrid(
          area.floor,
          area.gridX + area.width,
          area.gridY + area.depth,
        ),
        this.projectGrid(area.floor, area.gridX, area.gridY + area.depth),
      ];
      const emphasis = camera
        ? serviceAreaEmphasis(area.kind, camera)
        : "normal";
      const load = facilityById.get(area.id);
      const loadColour = load
        ? LOAD_COLOURS[loadBand(load.demand, load.capacity)]
        : area.kind === "service"
          ? 0x6d9dc5
          : 0xe9e5db;
      const graphic = new Graphics()
        .moveTo(corners[0].x, corners[0].y)
        .lineTo(corners[1].x, corners[1].y)
        .lineTo(corners[2].x, corners[2].y)
        .lineTo(corners[3].x, corners[3].y)
        .closePath()
        .fill({
          color: loadColour,
          alpha:
            emphasis === "highlighted"
              ? 0.65
              : emphasis === "deemphasized"
                ? 0.08
                : 0.28,
        })
        .stroke({
          width: emphasis === "highlighted" ? 2 : 1,
          color: loadColour,
        });
      graphic.label = area.id;
      this.areaTiles.addChild(graphic);
    }

    for (const core of plan.cores.filter((item) => floorVisible(item.floor))) {
      const point = this.projectGrid(core.floor, core.gridX, core.gridY);
      const emphasized = camera?.showServiceAreas === true;
      const graphic = new Graphics();
      if (core.kind === "elevator")
        graphic
          .rect(point.x - 7, point.y - 5, 14, 10)
          .fill({ color: 0x0e1114, alpha: 0.9 })
          .stroke({ width: emphasized ? 3 : 2, color: 0x6d9dc5 });
      else
        for (let step = 0; step < 3; step++)
          graphic
            .moveTo(point.x - 7 + step * 3, point.y + 5 - step * 3)
            .lineTo(point.x + 2 + step * 3, point.y + 5 - step * 3)
            .stroke({ width: 1, color: 0xe9e5db });
      graphic.label = core.id;
      graphic.alpha = emphasized ? 1 : 0.78;
      this.architecture.addChild(graphic);
    }

    for (const node of navigation.filter((item) => item.closed)) {
      if (!floorVisible(node.floor)) continue;
      const point = this.projectGrid(node.floor, node.gridX, node.gridY);
      const marker = new Graphics()
        .moveTo(point.x - 5, point.y - 5)
        .lineTo(point.x + 5, point.y + 5)
        .moveTo(point.x + 5, point.y - 5)
        .lineTo(point.x - 5, point.y + 5)
        .stroke({ width: 3, color: 0xe2543c });
      marker.label = `${node.id}.closed`;
      this.marks.addChild(marker);
    }
  }

  private drawBuilding(model: SceneModel): void {
    for (const child of this.tiles.removeChildren()) child.destroy();
    for (const child of this.marks.removeChildren()) child.destroy();

    const tint = LIGHT_TINT[lightingFor(model.minuteOfDay ?? 720)];
    this.world.tint = tint;
    const placements = this.placements(model);
    const lod = roomLodFor(model.camera?.zoom ?? 1);

    if (!lod.drawRoomTiles) {
      this.drawFloorStructure(placements);
      for (const placement of placements)
        for (const marker of markerKindsForEntity(
          placement.id,
          model.selectedId,
          model.camera?.focusedId,
        ))
          if (marker === "selection") this.markSelection(placement);
          else this.markFocus(placement);
      return;
    }

    for (const placement of placements) {
      const lighting = roomLighting(placement.state, model.minuteOfDay ?? 720);
      const tile = new Graphics()
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
      tile.tint = lighting.tint;
      tile.alpha = model.camera?.showServiceAreas ? 0.22 : 1;

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
        tile.tint = lighting.tint;
      });
      if (this.hoveredId === placement.id) tile.tint = HOVER_TINT;

      this.tiles.addChild(tile);
      const phase = model.renovationPhaseByRoomId?.[placement.id];
      if (phase) this.markRenovation(placement, phase);
      else if (lod.drawFineStatus) this.markConcern(placement, false);
      for (const marker of markerKindsForEntity(
        placement.id,
        model.selectedId,
        model.camera?.focusedId,
      ))
        if (marker === "selection") this.markSelection(placement);
        else this.markFocus(placement);
    }
  }

  /** Aggregate zoom reads as stacked floor slabs carrying their worst state. */
  private drawFloorStructure(placements: readonly RoomPlacement[]): void {
    const floors = new Map<number, RoomPlacement[]>();
    for (const placement of placements) {
      const floor = floors.get(placement.floor);
      if (floor) floor.push(placement);
      else floors.set(placement.floor, [placement]);
    }
    for (const [floor, rooms] of [...floors].sort(([a], [b]) => a - b)) {
      const minX = Math.min(...rooms.map((room) => room.gridX));
      const maxX = Math.max(...rooms.map((room) => room.gridX)) + 1;
      const minY = Math.min(...rooms.map((room) => room.gridY));
      const maxY = Math.max(...rooms.map((room) => room.gridY)) + 1;
      const corners = [
        isoProject(minX, minY, TILE_WIDTH, TILE_HEIGHT),
        isoProject(maxX, minY, TILE_WIDTH, TILE_HEIGHT),
        isoProject(maxX, maxY, TILE_WIDTH, TILE_HEIGHT),
        isoProject(minX, maxY, TILE_WIDTH, TILE_HEIGHT),
      ].map((point) => ({ x: point.x, y: point.y - floor * FLOOR_HEIGHT }));
      const status = aggregateRoomState(rooms.map((room) => room.state));
      const slab = new Graphics()
        .moveTo(corners[0].x, corners[0].y)
        .lineTo(corners[1].x, corners[1].y)
        .lineTo(corners[2].x, corners[2].y)
        .lineTo(corners[3].x, corners[3].y)
        .closePath()
        .fill(STATE_COLOURS[status] ?? 0x888888)
        .stroke({ width: 2, color: 0x38434d });
      slab.label = `floor.${floor}.aggregate`;
      this.tiles.addChild(slab);
    }
  }

  /** A room that needs attention carries a mark, not merely a shade. */
  private markConcern(
    placement: RoomPlacement,
    underConstruction: boolean,
  ): void {
    const concern = roomConcern(
      placement.state,
      placement.cleanliness,
      underConstruction,
    );
    if (concern === "none") return;
    const mark = new Graphics()
      .circle(placement.x + TILE_WIDTH / 2, placement.y - 4, 4)
      .fill(CONCERN_MARK[concern]);
    mark.label = `${placement.id}.concern`;
    this.marks.addChild(mark);
  }

  /** Renovation uses architectural notation, not one generic concern dot. */
  private markRenovation(
    placement: RoomPlacement,
    phase: RenovationPhase,
  ): void {
    const visual = renovationVisualFor(phase);
    const x = placement.x + TILE_WIDTH / 2;
    const y = placement.y - 4;
    const mark = new Graphics();
    if (visual.notation === "outline")
      mark.circle(x, y, 5).stroke({ width: 1, color: visual.colour });
    else if (visual.notation === "permit")
      mark.rect(x - 4, y - 4, 8, 8).stroke({ width: 2, color: visual.colour });
    else if (visual.notation === "hatch")
      mark
        .moveTo(x - 5, y - 5)
        .lineTo(x + 5, y + 5)
        .moveTo(x + 5, y - 5)
        .lineTo(x - 5, y + 5)
        .stroke({ width: 2, color: visual.colour });
    else if (visual.notation === "inspection")
      mark
        .moveTo(x - 5, y)
        .lineTo(x - 1, y + 4)
        .lineTo(x + 6, y - 5)
        .stroke({ width: 2, color: visual.colour });
    else mark.circle(x, y, 4).fill(visual.colour);
    mark.label = `${placement.id}.renovation.${phase}`;
    this.marks.addChild(mark);
  }

  private markSelection(placement: RoomPlacement): void {
    const outline = new Graphics()
      .moveTo(0, TILE_HEIGHT / 2)
      .lineTo(TILE_WIDTH / 2, 0)
      .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
      .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
      .closePath()
      .stroke({ width: 2, color: SELECTION });
    outline.position.set(placement.x, placement.y);
    outline.label = `${placement.id}.selected`;
    this.marks.addChild(outline);
  }

  /** Camera focus is a steel locator, distinct from amber room selection. */
  private markFocus(placement: RoomPlacement): void {
    const outline = new Graphics()
      .moveTo(-3, TILE_HEIGHT / 2)
      .lineTo(TILE_WIDTH / 2, -3)
      .lineTo(TILE_WIDTH + 3, TILE_HEIGHT / 2)
      .lineTo(TILE_WIDTH / 2, TILE_HEIGHT + 3)
      .closePath()
      .stroke({ width: 3, color: FOCUS });
    outline.position.set(placement.x, placement.y);
    outline.label = `${placement.id}.focused`;
    this.marks.addChild(outline);
  }

  private drawPeople(model: SceneModel): void {
    for (const child of this.people.removeChildren()) child.destroy();
    if (!model.agents?.length) return;

    // The desk is the origin of the ground floor: where an arriving guest
    // stands when they are waiting rather than anywhere in particular.
    const placed = model.positionByEntityId
      ? placeAgentsFromEntities(model.agents, model.positionByEntityId)
      : placeAgents(model.agents, this.placements(model), {
          x: 0,
          y: TILE_HEIGHT,
        });
    for (const agent of placed) {
      const mark = new Graphics()
        .circle(agent.x, agent.y, AGENT_RADIUS)
        .fill(AGENT_COLOURS[agent.kind]);
      mark.label = agent.id;
      mark.eventMode = "static";
      mark.cursor = "pointer";
      mark.on("pointertap", () => this.onSelectAgent?.(agent.id));
      this.people.addChild(mark);
    }
  }

  private placements(model: SceneModel): RoomPlacement[] {
    const rooms = model.rooms.map((room) => ({
      id: room.id,
      category: room.category,
      state: room.state,
      cleanliness: room.cleanliness ?? 100,
    }));
    const placed = model.positionByEntityId
      ? placeRoomsFromGeometry(rooms, model.positionByEntityId)
      : placeRooms(rooms, model.floorByRoomId ?? {}, model.columns ?? 6);
    return model.camera ? visiblePlacements(placed, model.camera) : placed;
  }

  private applyCamera(model: SceneModel): void {
    if (!model.camera) return;
    const transform = stageTransform(
      model.camera,
      { width: this.app.renderer.width, height: this.app.renderer.height },
      buildingCentre(this.placements(model)),
    );
    this.world.position.set(transform.x, transform.y);
    this.world.scale.set(transform.scale);
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
