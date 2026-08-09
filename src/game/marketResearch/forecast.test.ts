import { expect, it } from "vitest";
import {
  forecastBand,
  informationQuality,
  qualityAfterReport,
  reportCostMinor,
  MAX_INFORMATION_QUALITY,
} from "./forecast";

const width = (q: number) =>
  forecastBand(1000, q).high - forecastBand(1000, q).low;

it("narrows with better information", () => {
  expect(width(90)).toBeLessThan(width(40));
});

it("never claims certainty and never inverts the band", () => {
  const perfect = forecastBand(1000, MAX_INFORMATION_QUALITY);
  expect(perfect.low).toBeLessThanOrEqual(perfect.base);
  expect(perfect.base).toBeLessThanOrEqual(perfect.high);
  // Even a fully researched market keeps a residual band: nobody knows next
  // month's demand exactly.
  expect(perfect.high).toBeGreaterThan(perfect.low);
  const blind = forecastBand(1000, 0);
  expect(blind.low).toBeGreaterThanOrEqual(0);
});

it("keeps every bound whole so the UI never renders a fractional room night", () => {
  const band = forecastBand(1337, 37);
  for (const value of [band.low, band.base, band.high])
    expect(Number.isSafeInteger(value)).toBe(true);
});

it("clamps a quality outside its declared range instead of trusting it", () => {
  expect(forecastBand(1000, 500)).toEqual(
    forecastBand(1000, MAX_INFORMATION_QUALITY),
  );
  expect(forecastBand(1000, -50)).toEqual(forecastBand(1000, 0));
  expect(() => forecastBand(-1, 50)).toThrow(/base/);
});

it("buys information quality with research spend, at diminishing value", () => {
  expect(informationQuality(0)).toBe(0);
  const cheap = informationQuality(reportCostMinor(1));
  const dear = informationQuality(reportCostMinor(4));
  expect(dear).toBeGreaterThan(cheap);
  expect(dear).toBeLessThanOrEqual(MAX_INFORMATION_QUALITY);
  // Four reports cost more than one but do not buy four times the certainty.
  expect(dear - cheap).toBeLessThan(cheap * 3);
});

it("improves existing information with each paid report", () => {
  expect(qualityAfterReport(0)).toBeGreaterThan(0);
  expect(qualityAfterReport(99)).toBe(100);
  expect(qualityAfterReport(100)).toBe(100);
});
