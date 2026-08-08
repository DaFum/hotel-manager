import { Application, Container, Graphics } from "pixi.js";
import { isoProject } from "./isoProjection";

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export interface SceneRoom {
  id: string;
  category: string;
  state: string;
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

/**
 * Pixi draws only what the worker snapshot says; it holds no rules and no
 * state of its own, so a re-render from an older snapshot is always safe.
 */
export class PixiHotelScene {
  private app = new Application();
  private tiles = new Container();

  async attach(canvasHost: HTMLElement): Promise<void> {
    await this.app.init({ background: 0x1b1b1f, resizeTo: canvasHost });
    canvasHost.appendChild(this.app.canvas);
    this.app.stage.addChild(this.tiles);
  }

  render(rooms: readonly SceneRoom[], columns = 6): void {
    this.tiles.removeChildren();
    rooms.forEach((room, index) => {
      const { x, y } = isoProject(
        index % columns,
        Math.floor(index / columns),
        TILE_WIDTH,
        TILE_HEIGHT,
      );
      const tile = new Graphics()
        .moveTo(0, TILE_HEIGHT / 2)
        .lineTo(TILE_WIDTH / 2, 0)
        .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
        .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
        .closePath()
        .fill(STATE_COLOURS[room.state] ?? 0x888888);
      tile.position.set(x, y);
      tile.label = room.id;
      this.tiles.addChild(tile);
    });
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
