import { Application, Container, Graphics } from "pixi.js";
import { FacilityLayer, type FacilityTile } from "./facilities/FacilityLayer";
import { lightingFor, type CameraState } from "./camera";
import {
  buildingCentre,
  placeAgents,
  placeRooms,
  roomConcern,
  stageTransform,
  visiblePlacements,
  type RoomPlacement,
} from "./sceneLayout";
import { TILE_HEIGHT, TILE_WIDTH } from "./tileMetrics";
import type { VisualAgent } from "./agentMaterialization";

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
  floorByRoomId?: Readonly<Record<string, number>>;
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
const CONCERN_MARK = { "needs-cleaning": 0xe8b53a, "out-of-service": 0xe2543c };

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
  private tiles = new Container();
  private marks = new Container();
  private people = new Container();
  private facilities = new FacilityLayer();
  private onSelectRoom: ((roomId: string) => void) | null = null;
  /** The last thing drawn, so a resize can be re-framed without a snapshot. */
  private lastModel: SceneModel | null = null;

  async attach(canvasHost: HTMLElement): Promise<void> {
    await this.app.init({ background: 0x0e1114, resizeTo: canvasHost });
    canvasHost.appendChild(this.app.canvas);
    this.world.addChild(this.tiles, this.marks, this.people);
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
    this.drawPeople(model);
    this.applyCamera(model);
  }

  private drawBuilding(model: SceneModel): void {
    for (const child of this.tiles.removeChildren()) child.destroy();
    for (const child of this.marks.removeChildren()) child.destroy();

    const tint = LIGHT_TINT[lightingFor(model.minuteOfDay ?? 720)];

    for (const placement of this.placements(model)) {
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
      tile.tint = tint;

      // The same stable id the semantic DOM control uses, so clicking the
      // world and clicking the room list are the same action.
      tile.eventMode = "static";
      tile.cursor = "pointer";
      tile.on("pointertap", () => this.onSelectRoom?.(placement.id));

      this.tiles.addChild(tile);
      this.markConcern(placement);
      if (model.selectedId === placement.id) this.markSelection(placement);
    }
  }

  /** A room that needs attention carries a mark, not merely a shade. */
  private markConcern(placement: RoomPlacement): void {
    const concern = roomConcern(placement.state, placement.cleanliness);
    if (concern === "none") return;
    const mark = new Graphics()
      .circle(placement.x + TILE_WIDTH / 2, placement.y - 4, 4)
      .fill(CONCERN_MARK[concern]);
    mark.label = `${placement.id}.concern`;
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

  private drawPeople(model: SceneModel): void {
    for (const child of this.people.removeChildren()) child.destroy();
    if (!model.agents?.length) return;

    // The desk is the origin of the ground floor: where an arriving guest
    // stands when they are waiting rather than anywhere in particular.
    for (const agent of placeAgents(model.agents, this.placements(model), {
      x: 0,
      y: TILE_HEIGHT,
    })) {
      const mark = new Graphics()
        .circle(agent.x, agent.y, AGENT_RADIUS)
        .fill(AGENT_COLOURS[agent.kind]);
      mark.label = agent.id;
      this.people.addChild(mark);
    }
  }

  private placements(model: SceneModel): RoomPlacement[] {
    const placed = placeRooms(
      model.rooms.map((room) => ({
        id: room.id,
        category: room.category,
        state: room.state,
        cleanliness: room.cleanliness ?? 100,
      })),
      model.floorByRoomId ?? {},
      model.columns ?? 6,
    );
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
