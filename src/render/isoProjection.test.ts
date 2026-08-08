import { describe, expect, it } from "vitest";
import { isoProject, isoUnproject } from "./isoProjection";

describe("isometric projection", () => {
  it("projects grid coordinates deterministically", () => {
    expect(isoProject(2, 1, 64, 32)).toEqual({ x: 32, y: 48 });
    expect(isoProject(0, 0, 64, 32)).toEqual({ x: 0, y: 0 });
  });

  it("round trips a projected tile back to its grid cell", () => {
    expect(isoUnproject(32, 48, 64, 32)).toEqual({ gridX: 2, gridY: 1 });
  });
});
