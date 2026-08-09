import { expect, it } from "vitest";
import {
  availableSeats,
  contributionMarginBp,
  contributionMinor,
  menuContributionMinor,
} from "./menu";
import { seatTurns, seatedCovers, turnedAwayCovers } from "./seating";
import { externalCovers } from "./externalDemand";
import { MENU, outletMenu } from "../content/1991/menu";

it("calculates menu contribution and respects reserved seats", () => {
  expect(contributionMinor(1800, 650)).toBe(1150);
  expect(availableSeats(80, 55, 10)).toBe(15);
});

it("refuses fractional money", () => {
  expect(() => contributionMinor(18.5, 650)).toThrow(/minor units/);
  expect(contributionMarginBp(1800, 650)).toBe(6389);
  expect(contributionMarginBp(0, 0)).toBe(0);
});

it("sums the contribution of everything actually sold", () => {
  expect(
    menuContributionMinor([
      { priceMinor: 1800, ingredientMinor: 650, sold: 3 },
      { priceMinor: 900, ingredientMinor: 300, sold: 2 },
    ]),
  ).toBe(1150 * 3 + 600 * 2);
});

it("turns seats over during a service and turns the overflow away", () => {
  expect(seatTurns(240, 60)).toBe(4);
  // 30 free seats turned four times, but only what the kitchen can plate.
  expect(
    seatedCovers({
      seats: 40,
      reservedSeats: 10,
      walkIns: 0,
      serviceMinutes: 240,
      averageStayMinutes: 60,
      kitchenCovers: 200,
    }),
  ).toBe(120);
  expect(
    seatedCovers({
      seats: 40,
      reservedSeats: 10,
      walkIns: 0,
      serviceMinutes: 240,
      averageStayMinutes: 60,
      kitchenCovers: 75,
    }),
  ).toBe(75);
  expect(turnedAwayCovers(140, 120)).toBe(20);
  expect(turnedAwayCovers(90, 120)).toBe(0);
});

it("draws outside diners from the city and loses them to price", () => {
  const base = { baseCovers: 60, seasonalityBp: 10000, reputationBp: 5000 };
  expect(externalCovers({ ...base, priceIndexBp: 10000 })).toBe(45);
  expect(externalCovers({ ...base, priceIndexBp: 14000 })).toBeLessThan(
    externalCovers({ ...base, priceIndexBp: 10000 }),
  );
  expect(
    externalCovers({ ...base, priceIndexBp: 10000, reputationBp: 9000 }),
  ).toBeGreaterThan(externalCovers({ ...base, priceIndexBp: 10000 }));
  expect(externalCovers({ ...base, priceIndexBp: 40000 })).toBe(0);
});

it("prices every menu item as content, not as a conditional", () => {
  expect(MENU.every((i) => i.priceMinor > i.ingredientMinor)).toBe(true);
  expect(outletMenu("bar").length).toBeGreaterThan(0);
  expect(outletMenu("restaurant").length).toBeGreaterThan(0);
});
