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

  it("rejects orders with non whole or negative numbers", () => {
    const base = {
      supplierId: "s1",
      sku: "cleaning-unit",
      quantity: 10,
      unitPriceMinor: 500,
      leadMinutes: 1440,
    };
    const state = { cashMinor: 100000, nowMinutes: 0 };
    expect(() => placeOrder(state, { ...base, quantity: 1.5 })).toThrow(
      /quantity/,
    );
    expect(() => placeOrder(state, { ...base, unitPriceMinor: -1 })).toThrow(
      /unit price/,
    );
    expect(() =>
      placeOrder(state, { ...base, leadMinutes: Number.NaN }),
    ).toThrow(/lead time/);
  });

  it("rejects a delivery with an invalid quantity", () => {
    expect(() =>
      deliverOrder(
        {},
        {
          supplierId: "s1",
          sku: "cleaning-unit",
          quantity: 0,
          unitPriceMinor: 500,
          dueAtMinutes: 0,
        },
        0,
      ),
    ).toThrow(/quantity/);
  });

  it("rejects consuming a non positive whole quantity", () => {
    for (const q of [0, -1, 0.5, Number.NaN])
      expect(() =>
        consume({ "breakfast-portion": 5 }, "breakfast-portion", q),
      ).toThrow(/quantity/);
  });

  it("never allows negative stock", () => {
    expect(() =>
      consume({ "breakfast-portion": 2 }, "breakfast-portion", 3),
    ).toThrow(/stock/);
  });
});
