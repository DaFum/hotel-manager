import { describe, expect, it } from "vitest";
import { serveBreakfast } from "./breakfastService";

describe("breakfast", () => {
  it("serves no more than seats, kitchen throughput, or stock", () => {
    expect(
      serveBreakfast({
        demand: 50,
        seats: 36,
        kitchenCovers: 30,
        stock: 28,
        priceMinor: 1800,
      }),
    ).toEqual({ served: 28, queue: 22, stockLeft: 0, revenueMinor: 50400 });
  });

  it("is closed outside 0630 to 1030", () => {
    expect(
      serveBreakfast({
        demand: 10,
        seats: 36,
        kitchenCovers: 30,
        stock: 30,
        priceMinor: 1800,
        minuteOfDay: 330,
      }).served,
    ).toBe(0);
    expect(
      serveBreakfast({
        demand: 10,
        seats: 36,
        kitchenCovers: 30,
        stock: 30,
        priceMinor: 1800,
        minuteOfDay: 630,
      }).served,
    ).toBe(0);
  });

  it("reports the whole queue when stock has run out", () => {
    expect(
      serveBreakfast({
        demand: 24,
        seats: 36,
        kitchenCovers: 30,
        stock: 0,
        priceMinor: 1800,
        minuteOfDay: 480,
      }),
    ).toEqual({ served: 0, queue: 24, stockLeft: 0, revenueMinor: 0 });
  });

  it("serves the full demand when nothing constrains it", () => {
    expect(
      serveBreakfast({
        demand: 10,
        seats: 36,
        kitchenCovers: 30,
        stock: 30,
        priceMinor: 1800,
        minuteOfDay: 390,
      }),
    ).toEqual({ served: 10, queue: 0, stockLeft: 20, revenueMinor: 18000 });
  });
});
