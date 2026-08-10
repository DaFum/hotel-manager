import { describe, expect, it } from "vitest";
import {
  formatGameDate,
  formatMinorCurrency,
  formatPercentBasisPoints,
} from "./formatters";
describe("locale formatters", () => {
  it("formats without changing domain values", () => {
    const minor = 12_345;
    expect(formatMinorCurrency(minor, "DEM", "de-DE")).toContain("123");
    expect(minor).toBe(12_345);
    expect(formatPercentBasisPoints(7850, "de-DE")).toContain("78");
    expect(formatGameDate("1991-01-01", "en-GB")).toContain("1991");
  });
});
