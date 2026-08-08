export interface ScreenPoint {
  x: number;
  y: number;
}

export interface GridPoint {
  gridX: number;
  gridY: number;
}

export function isoProject(
  gridX: number,
  gridY: number,
  tileWidth: number,
  tileHeight: number,
): ScreenPoint {
  return {
    x: ((gridX - gridY) * tileWidth) / 2,
    y: ((gridX + gridY) * tileHeight) / 2,
  };
}

export function isoUnproject(
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
): GridPoint {
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;
  return {
    gridX: Math.round((x / halfW + y / halfH) / 2),
    gridY: Math.round((y / halfH - x / halfW) / 2),
  };
}
