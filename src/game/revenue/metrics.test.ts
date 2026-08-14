import { describe, expect, it } from "vitest";
import { adrMinor, gopparMinor, revParMinor, forecastRooms } from "./metrics";
import { setRate, getRate, MIN_RATE_MINOR, MAX_RATE_MINOR } from "./rates";

describe("revenue basics", () => {
  it("updates one date category rate and validates slice bounds", () => {
    const g = setRate({}, "1991-01-02", "single", 9000);
    expect(g["1991-01-02/single"]).toBe(9000);
    expect(() => setRate(g, "1991-01-02", "single", 100)).toThrow();
    expect(() =>
      setRate(g, "1991-01-02", "single", MAX_RATE_MINOR + 1),
    ).toThrow();
    expect(setRate(g, "1991-01-02", "single", MIN_RATE_MINOR)).toBeTruthy();
  });

  it("never mutates the rate grid in place", () => {
    const g = setRate({}, "1991-01-02", "single", 9000);
    setRate(g, "1991-01-03", "single", 9500);
    expect(g["1991-01-03/single"]).toBeUndefined();
  });

  it("falls back to the category default rate for unpriced dates", () => {
    const g = setRate({}, "1991-01-02", "single", 9000);
    expect(getRate(g, "1991-01-02", "single", 8000)).toBe(9000);
    expect(getRate(g, "1991-01-09", "single", 8000)).toBe(8000);
  });

  it("calculates ADR and RevPAR in Pfennig", () => {
    expect(adrMinor(100000, 10)).toBe(10000);
    expect(revParMinor(100000, 24)).toBe(4167);
    expect(adrMinor(100000, 0)).toBe(0);
    expect(revParMinor(100000, 0)).toBe(0);
  });

  it("calculates GOPPAR in whole minor units", () => {
    expect(gopparMinor(100_000, 24)).toBe(4167);
    expect(gopparMinor(100_000, 0)).toBe(0);
    expect(() => gopparMinor(100_000, -1)).toThrow();
    expect(() => gopparMinor(100.5, 10)).toThrow();
    expect(() => gopparMinor(NaN, 10)).toThrow();
  });

  it("brackets the pickup forecast inside available inventory", () => {
    expect(forecastRooms(10, 6, 24)).toEqual({
      expected: 16,
      low: 13,
      high: 19,
    });
    expect(forecastRooms(22, 6, 24)).toEqual({
      expected: 24,
      low: 22,
      high: 24,
    });
  });
});
