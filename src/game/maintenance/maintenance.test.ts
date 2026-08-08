import { describe, expect, it } from "vitest";
import { degradeAsset, repairAsset } from "./maintenance";

describe("maintenance", () => {
  it("degrades only from elapsed simulation minutes", () => {
    expect(
      degradeAsset({ condition: 10000, status: "operational" }, 1440).condition,
    ).toBe(9990);
  });

  it("never degrades condition below zero", () => {
    expect(
      degradeAsset({ condition: 5, status: "operational" }, 14400).condition,
    ).toBe(0);
  });

  it("keeps an asset in repair while technician minutes are short", () => {
    expect(repairAsset({ condition: 2000, status: "failed" }, 60)).toEqual({
      condition: 2000,
      status: "repairing",
    });
  });

  it("repairs a failed asset when technician minutes are available", () => {
    expect(repairAsset({ condition: 2000, status: "failed" }, 120)).toEqual({
      condition: 5000,
      status: "operational",
    });
  });
});
