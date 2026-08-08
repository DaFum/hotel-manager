import { describe, expect, it } from "vitest";
import { placeOrder, deliverOrder, consume } from "./inventory";

describe("inventory", () => {
  it("charges cash now and delivers after lead time", () => {
    const o = placeOrder(
      { cashMinor: 100000, nowMinutes: 0 },
      {
        supplierId: "s1",
        sku: "cleaning-unit",
        quantity: 10,
        unitPriceMinor: 500,
        leadMinutes: 1440,
      },
    );
    expect(o.cashMinor).toBe(95000);
    expect(deliverOrder({}, o.order, 1440)["cleaning-unit"]).toBe(10);
  });

  it("never allows negative stock", () => {
    expect(() =>
      consume({ "breakfast-portion": 2 }, "breakfast-portion", 3),
    ).toThrow(/stock/);
  });
});
