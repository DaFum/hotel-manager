import { describe, expect, it } from "vitest";
import {
  financingAccessBonusBasisPoints,
  propertyAccessScore,
} from "./prestige";
describe("prestige", () => {
  it("only supplies bounded access", () => {
    expect(financingAccessBonusBasisPoints(100)).toBe(1000);
    expect(financingAccessBonusBasisPoints(200)).toBe(1000);
    expect(financingAccessBonusBasisPoints(-40)).toBe(0);
    expect(propertyAccessScore(80)).toBe(80);
  });

  it("refuses a prestige that is not a whole score", () => {
    expect(() => financingAccessBonusBasisPoints(12.5)).toThrow();
    expect(() => financingAccessBonusBasisPoints(Number.NaN)).toThrow();
    expect(() => propertyAccessScore(0.5)).toThrow();
  });
});
