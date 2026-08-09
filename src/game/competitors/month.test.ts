import { expect, it } from "vitest";
import { competitorMonth, creditLineMinor, postsForRooms } from "./month";

const HOUSE = { rooms: 40, rateMinor: 13000, debtMinor: 32_000_000 };

it("earns the nights it sold and pays for the rooms it runs", () => {
  const month = competitorMonth(HOUSE, {
    soldRoomNights: 800,
    wagePressureBp: 10000,
  });
  expect(month.revenueMinor).toBe(800 * 13000);
  expect(month.wageMinor).toBeGreaterThan(0);
  expect(month.interestMinor).toBeGreaterThan(0);
  expect(month.fixedMinor).toBeGreaterThan(0);
  expect(month.profitMinor).toBe(
    month.revenueMinor -
      month.wageMinor -
      month.opexMinor -
      month.fixedMinor -
      month.interestMinor,
  );
});

it("pays the same wage market the player hires in", () => {
  const cheap = competitorMonth(HOUSE, {
    soldRoomNights: 800,
    wagePressureBp: 7500,
  });
  const dear = competitorMonth(HOUSE, {
    soldRoomNights: 800,
    wagePressureBp: 15000,
  });
  expect(dear.wageMinor).toBeGreaterThan(cheap.wageMinor);
  expect(dear.profitMinor).toBeLessThan(cheap.profitMinor);
});

it("charges the standing cost of the rooms whether they sell or not", () => {
  const empty = competitorMonth(HOUSE, {
    soldRoomNights: 0,
    wagePressureBp: 10000,
  });
  const busy = competitorMonth(HOUSE, {
    soldRoomNights: 800,
    wagePressureBp: 10000,
  });
  expect(empty.fixedMinor).toBe(busy.fixedMinor);
});

it("loses money when an empty house still has to be run", () => {
  expect(
    competitorMonth(HOUSE, { soldRoomNights: 0, wagePressureBp: 10000 })
      .profitMinor,
  ).toBeLessThan(0);
});

it("keeps every figure in whole Pfennig", () => {
  const month = competitorMonth(
    { rooms: 37, rateMinor: 12345, debtMinor: 12_345_678 },
    { soldRoomNights: 411, wagePressureBp: 11111 },
  );
  for (const value of Object.values(month))
    expect(Number.isSafeInteger(value)).toBe(true);
});

it("rejects invalid house money and arithmetic overflow", () => {
  const market = { soldRoomNights: 1, wagePressureBp: 10000 };
  expect(() => competitorMonth({ ...HOUSE, debtMinor: -1 }, market)).toThrow(
    /debt/,
  );
  for (const rateMinor of [-1, 1.5, Number.NaN])
    expect(() => competitorMonth({ ...HOUSE, rateMinor }, market)).toThrow(
      /rate/,
    );
  expect(() =>
    competitorMonth(
      { rooms: 1, rateMinor: Number.MAX_SAFE_INTEGER, debtMinor: 0 },
      { soldRoomNights: 2, wagePressureBp: 10000 },
    ),
  ).toThrow(/revenue/);
});

it("staffs a house by its rooms", () => {
  expect(postsForRooms(100)).toBe(40);
  expect(postsForRooms(0)).toBe(0);
  expect(postsForRooms(25)).toBe(10);
});

it("lends against the assets a house actually owns", () => {
  expect(creditLineMinor(40, 10_000_000)).toBeGreaterThan(0);
  expect(creditLineMinor(0, 10_000_000)).toBe(0);
});
