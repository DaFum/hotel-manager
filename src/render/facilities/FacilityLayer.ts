import { Container, Graphics } from "pixi.js";
import { utilizationBp } from "../../game/facilities/capacity";

export interface FacilityTile {
  id: string;
  name: string;
  demand: number;
  capacity: number;
  cause: string;
}

export const BAR_WIDTH = 96;
export const BAR_HEIGHT = 8;
export const BAR_SPACING = 14;

/** Under-used, busy, and over capacity — three steps, never a gradient. */
export const LOAD_COLOURS = {
  quiet: 0x4c9f70,
  busy: 0xb07d3a,
  over: 0xa33a3a,
} as const;

export type LoadBand = keyof typeof LOAD_COLOURS;

export function loadBand(demand: number, capacity: number): LoadBand {
  // A facility with no capacity is over the moment anyone needs it.
  if (capacity <= 0) return demand > 0 ? "over" : "quiet";
  const bp = utilizationBp(
    Math.max(0, Math.round(demand)),
    Math.max(0, Math.round(capacity)),
  );
  if (bp > 10000) return "over";
  return bp >= 8000 ? "busy" : "quiet";
}

/** Pixels of the bar a facility's load fills, clamped to the bar itself. */
export function barFill(demand: number, capacity: number): number {
  const bp = utilizationBp(
    Math.max(0, Math.round(demand)),
    Math.max(0, Math.round(capacity)),
  );
  return Math.round((Math.min(10000, bp) * BAR_WIDTH) / 10000);
}

/**
 * The facility load strip in the isometric scene. It is decorative — the
 * dashboard carries the same numbers in the DOM — but it is what makes an
 * overloaded kitchen visible in the world rather than only in a table.
 */
export class FacilityLayer {
  readonly container = new Container();

  render(rows: readonly FacilityTile[]): void {
    // removeChildren only detaches; the Graphics keep their GPU resources
    // until each one is destroyed, and render runs on every snapshot.
    for (const child of this.container.removeChildren()) child.destroy();
    rows.forEach((row, index) => {
      const y = index * BAR_SPACING;
      const track = new Graphics()
        .rect(0, y, BAR_WIDTH, BAR_HEIGHT)
        .fill(0x2a2a30);
      const fill = barFill(row.demand, row.capacity);
      if (fill > 0)
        track
          .rect(0, y, fill, BAR_HEIGHT)
          .fill(LOAD_COLOURS[loadBand(row.demand, row.capacity)]);
      track.label = row.id;
      this.container.addChild(track);
    });
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
