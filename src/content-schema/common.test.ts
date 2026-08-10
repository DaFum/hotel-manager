import { describe, expect, it } from "vitest";
import {
  BasisPointsSchema,
  MinutesSchema,
  MinorCurrencySchema,
  StableIdSchema,
} from "./common";

describe("content units", () => {
  it("validates stable ids and bounded integer units", () => {
    expect(StableIdSchema.parse("city.frankfurt.de")).toBe("city.frankfurt.de");
    expect(BasisPointsSchema.parse(7_500)).toBe(7_500);
    expect(() => BasisPointsSchema.parse(10_001)).toThrow();
    expect(() => MinutesSchema.parse(-1)).toThrow();
    expect(() => MinorCurrencySchema.parse(1.5)).toThrow();
  });
});
