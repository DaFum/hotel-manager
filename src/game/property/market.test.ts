import { expect, it } from "vitest";
import { buildCostMinor, nextPrice, targetPriceMinor } from "./market";

it("caps monthly land-price movement", () => {
  expect(nextPrice(10000000, 20000000, 300)).toBe(10300000);
});

it("moves the whole way when the gap is inside the cap", () => {
  expect(nextPrice(10000000, 10100000, 300)).toBe(10100000);
});

it("falls as slowly as it rises", () => {
  expect(nextPrice(10000000, 2000000, 300)).toBe(9700000);
});

it("keeps a price in whole Pfennig and rejects a broken one", () => {
  expect(Number.isSafeInteger(nextPrice(10000001, 20000000, 137))).toBe(true);
  expect(() => nextPrice(1.5, 20000000, 300)).toThrow(/price/);
  expect(() => nextPrice(10000000, 20000000, -1)).toThrow(/move/);
  expect(() => nextPrice(10000000, 20000000, 1.5)).toThrow(/move/);
  expect(nextPrice(100, 200, 0)).toBe(100);
});

it("prices land off the demand pressure the city is under", () => {
  const tight = targetPriceMinor(10_000_000, 13000);
  expect(tight).toBeGreaterThan(targetPriceMinor(10_000_000, 10000));
  expect(targetPriceMinor(10_000_000, 7000)).toBeLessThan(
    targetPriceMinor(10_000_000, 10000),
  );
});

it("charges construction against the land price of the day", () => {
  const cheap = buildCostMinor({ rooms: 20, landPriceMinor: 10_000_000 });
  const dear = buildCostMinor({ rooms: 20, landPriceMinor: 20_000_000 });
  expect(dear).toBeGreaterThan(cheap);
  // Twice the rooms is never cheaper than one room's worth.
  expect(
    buildCostMinor({ rooms: 40, landPriceMinor: 10_000_000 }),
  ).toBeGreaterThan(cheap);
  expect(() =>
    buildCostMinor({ rooms: 0, landPriceMinor: 10_000_000 }),
  ).toThrow(/rooms/);
});
