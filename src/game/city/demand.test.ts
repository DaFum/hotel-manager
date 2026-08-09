import { expect, it } from "vitest";
import { sourceRoomNights, totalRoomNights } from "./demand";

it("sums source demand", () => {
  expect(
    totalRoomNights({ business: 1200, leisure: 800, event: 500, group: 300 }),
  ).toBe(2800);
});

it("splits a city's room nights across its four sources", () => {
  const sources = sourceRoomNights({
    baseRoomNights: 2000,
    seasonalityBp: 10000,
    connectivityIndex: 70,
    officeScale: 100,
    attractionScale: 100,
    congressScale: 100,
  });
  for (const value of Object.values(sources))
    expect(Number.isSafeInteger(value)).toBe(true);
  expect(totalRoomNights(sources)).toBeGreaterThan(0);
});

it("moves business nights with the office actors that generate them", () => {
  const drivers = {
    baseRoomNights: 2000,
    seasonalityBp: 10000,
    connectivityIndex: 70,
    officeScale: 100,
    attractionScale: 100,
    congressScale: 100,
  };
  const grown = sourceRoomNights({ ...drivers, officeScale: 150 });
  expect(grown.business).toBeGreaterThan(sourceRoomNights(drivers).business);
  // Only the source its actor drives moves; leisure has its own driver.
  expect(grown.leisure).toBe(sourceRoomNights(drivers).leisure);
});

it("carries a weak season and a poorly connected city into every source", () => {
  const drivers = {
    baseRoomNights: 2000,
    seasonalityBp: 7000,
    connectivityIndex: 30,
    officeScale: 100,
    attractionScale: 100,
    congressScale: 100,
  };
  const rich = sourceRoomNights({
    ...drivers,
    seasonalityBp: 12000,
    connectivityIndex: 90,
  });
  expect(totalRoomNights(rich)).toBeGreaterThan(
    totalRoomNights(sourceRoomNights(drivers)),
  );
});

it("rejects a driver set that is not whole and finite", () => {
  expect(() =>
    sourceRoomNights({
      baseRoomNights: 2000.5,
      seasonalityBp: 10000,
      connectivityIndex: 70,
      officeScale: 100,
      attractionScale: 100,
      congressScale: 100,
    }),
  ).toThrow(/baseRoomNights/);
});
