import { describe, expect, it } from "vitest";
import { corporateRateMinor } from "./rates";

describe("corporateRateMinor", () => {
  it("applies a bounded negotiated discount", () => {
    expect(corporateRateMinor(10_000, 2500)).toBe(7500);
    expect(corporateRateMinor(10_000, 0)).toBe(10_000);
    expect(corporateRateMinor(10_000, 10_000)).toBe(0);
    expect(() => corporateRateMinor(10_000, 10_001)).toThrow(/discount/);
  });
});
