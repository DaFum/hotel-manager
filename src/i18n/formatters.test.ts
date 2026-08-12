import { describe, expect, it } from "vitest";
import {
  formatGameDate,
  formatGameDateRange,
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
    expect(formatGameDateRange("1991-01-01", "1991-01-01", "en-GB")).toBe(
      formatGameDate("1991-01-01", "en-GB"),
    );
  });

  it("leaves impossible and normalized game dates unformatted", () => {
    expect(formatGameDate("1991-02-31", "en-GB")).toBe("1991-02-31");
    expect(formatGameDate("1991-13-01", "en-GB")).toBe("1991-13-01");
    expect(formatGameDateRange("1991-02-31", "1991-03-01", "en-GB")).toBe(
      "1991-02-31–1991-03-01",
    );
  });
});
