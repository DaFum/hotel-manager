import { expect, it } from "vitest";
import {
  externalLaundryCostMinor,
  laundryOutput,
  linenSoiled,
  runLaundryDay,
  LINEN_SKU,
} from "./laundry";
import { consume, reserveLinen } from "../purchasing/inventory";

it("limits laundry by dirty stock machine and labor", () => {
  expect(laundryOutput({ dirty: 90, machine: 70, staffed: 50 })).toBe(50);
});

it("soils linen per turned room from the module's own linen count", () => {
  expect(linenSoiled([{ moduleId: "room.standard.double" }])).toBe(6);
  expect(
    linenSoiled([
      { moduleId: "room.standard.single" },
      { moduleId: "room.suite.junior" },
    ]),
  ).toBe(13);
});

it("washes in house first and buys the rest of the capacity outside", () => {
  const day = runLaundryDay({
    clean: 10,
    dirty: 90,
    machine: 40,
    staffed: 40,
    externalPieces: 30,
  });
  expect(day.washedInHouse).toBe(40);
  expect(day.washedExternally).toBe(30);
  expect(day.clean).toBe(80);
  expect(day.dirty).toBe(20);
  expect(day.externalCostMinor).toBe(externalLaundryCostMinor(30));
});

it("never washes more than the dirty pile holds", () => {
  const day = runLaundryDay({
    clean: 0,
    dirty: 5,
    machine: 40,
    staffed: 40,
    externalPieces: 30,
  });
  expect(day.washedInHouse).toBe(5);
  expect(day.washedExternally).toBe(0);
  expect(day.dirty).toBe(0);
});

it("holds linen for arriving rooms so housekeeping cannot double-book it", () => {
  const stock = { [LINEN_SKU]: 12 };
  expect(reserveLinen(stock, 6).available).toBe(6);
  expect(() => reserveLinen(stock, 20)).toThrow(/linen/);
  expect(consume(stock, LINEN_SKU, 6)[LINEN_SKU]).toBe(6);
});
