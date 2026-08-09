import { expect, it } from "vitest";
import { allocateRoomNights, competitorRateMinor } from "./pricing";
import { MAX_RATE_MINOR, MIN_RATE_MINOR } from "../revenue/rates";

it("prices a house at its strategy's position against the market it sees", () => {
  const market = 20000;
  expect(
    competitorRateMinor({
      observedMarketRateMinor: market,
      strategy: "luxury",
      occupancyBp: 7000,
    }),
  ).toBeGreaterThan(
    competitorRateMinor({
      observedMarketRateMinor: market,
      strategy: "budget",
      occupancyBp: 7000,
    }),
  );
});

it("discounts into a soft house and holds firm in a full one", () => {
  const soft = competitorRateMinor({
    observedMarketRateMinor: 20000,
    strategy: "aggressive",
    occupancyBp: 3000,
  });
  const full = competitorRateMinor({
    observedMarketRateMinor: 20000,
    strategy: "aggressive",
    occupancyBp: 9500,
  });
  expect(soft).toBeLessThan(full);
});

it("keeps every rival rate inside the same bounds the player is held to", () => {
  for (const market of [MIN_RATE_MINOR, 20000, MAX_RATE_MINOR])
    for (const occupancyBp of [0, 5000, 10000]) {
      const rate = competitorRateMinor({
        observedMarketRateMinor: market,
        strategy: "luxury",
        occupancyBp,
      });
      expect(rate).toBeGreaterThanOrEqual(MIN_RATE_MINOR);
      expect(rate).toBeLessThanOrEqual(MAX_RATE_MINOR);
      expect(Number.isSafeInteger(rate)).toBe(true);
    }
});

const HOUSES = [
  { id: "hotel.player", rooms: 40, rateMinor: 18000, appealBp: 10000 },
  { id: "hotel.rival.a", rooms: 40, rateMinor: 18000, appealBp: 10000 },
];

it("splits the city's room nights between equally placed houses", () => {
  const sold = allocateRoomNights(40, HOUSES);
  expect(sold["hotel.player"]).toBe(20);
  expect(sold["hotel.rival.a"]).toBe(20);
});

it("sends more of the city to the larger house at the same product", () => {
  const sold = allocateRoomNights(32, [
    { id: "hotel.big", rooms: 60, rateMinor: 18000, appealBp: 10000 },
    { id: "hotel.small", rooms: 20, rateMinor: 18000, appealBp: 10000 },
  ]);
  // Three times the rooms draw three times the nights, not an equal split.
  expect(sold["hotel.big"]).toBe(3 * sold["hotel.small"]);
});

it("sends demand to the cheaper house without giving it the whole city", () => {
  const sold = allocateRoomNights(40, [
    { ...HOUSES[0], rateMinor: 14000 },
    HOUSES[1],
  ]);
  expect(sold["hotel.player"]).toBeGreaterThan(sold["hotel.rival.a"]);
  expect(sold["hotel.rival.a"]).toBeGreaterThan(0);
});

it("never sells a house more nights than it has rooms", () => {
  const sold = allocateRoomNights(500, [
    { id: "hotel.small", rooms: 10, rateMinor: 9000, appealBp: 12000 },
    { id: "hotel.large", rooms: 100, rateMinor: 25000, appealBp: 9000 },
  ]);
  expect(sold["hotel.small"]).toBe(10);
  expect(sold["hotel.large"]).toBe(100);
});

it("allocates whole room nights and never more than the city has", () => {
  const sold = allocateRoomNights(37, [
    { id: "hotel.a", rooms: 30, rateMinor: 17000, appealBp: 10000 },
    { id: "hotel.b", rooms: 30, rateMinor: 21000, appealBp: 11000 },
    { id: "hotel.c", rooms: 30, rateMinor: 12000, appealBp: 8000 },
  ]);
  const total = Object.values(sold).reduce((n, v) => n + v, 0);
  expect(total).toBeLessThanOrEqual(37);
  for (const v of Object.values(sold))
    expect(Number.isSafeInteger(v)).toBe(true);
});

it("allocates identically whatever order the houses arrive in", () => {
  const houses = [
    { id: "hotel.c", rooms: 30, rateMinor: 12000, appealBp: 8000 },
    { id: "hotel.a", rooms: 30, rateMinor: 17000, appealBp: 10000 },
  ];
  expect(allocateRoomNights(31, houses)).toEqual(
    allocateRoomNights(31, [...houses].reverse()),
  );
});

it("sells nothing when the city has no demand and no house has rooms", () => {
  expect(allocateRoomNights(0, HOUSES)).toEqual({
    "hotel.player": 0,
    "hotel.rival.a": 0,
  });
  expect(allocateRoomNights(50, [])).toEqual({});
  expect(() => allocateRoomNights(-1, HOUSES)).toThrow(/room nights/);
});

it("rejects duplicate house ids and invalid appeal", () => {
  expect(() => allocateRoomNights(1, [HOUSES[0], HOUSES[0]])).toThrow(
    /duplicate/,
  );
  expect(() =>
    allocateRoomNights(1, [
      { ...HOUSES[0], appealBp: Number.POSITIVE_INFINITY },
    ]),
  ).toThrow(/appeal/);
});
