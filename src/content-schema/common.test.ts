import { describe, expect, it } from "vitest";
import {
  BasisPointsSchema,
  MinutesSchema,
  MinorCurrencySchema,
  StableIdSchema,
} from "./common";

describe("content units", () => {
  it("validates stable ids", () => {
    expect(StableIdSchema.parse("city.frankfurt.de")).toBe("city.frankfurt.de");
  });

  it("bounds basis points", () => {
    expect(BasisPointsSchema.parse(7_500)).toBe(7_500);
    expect(() => BasisPointsSchema.parse(10_001)).toThrow();
  });

  it("requires non-negative whole minutes", () => {
    expect(() => MinutesSchema.parse(-1)).toThrow();
  });

  it("requires whole minor currency units", () => {
    expect(() => MinorCurrencySchema.parse(1.5)).toThrow();
  });
});
