import { describe, expect, it } from "vitest";
import {
  centralPurchasingTradeOff,
  contractForSku,
  createProcurementState,
  dueReorders,
  expireStock,
  orderCostMinor,
  receiveLot,
  recordStockout,
  setReorderRule,
  signSupplierContract,
} from "./contracts";

const CONTRACT = {
  id: "contract.linen",
  supplierId: "supplier.wäscherei",
  sku: "linen-piece",
  unitPriceMinor: 1_200,
  leadTimeDays: 4,
  minimumOrderQuantity: 50,
  validFromDateKey: "1991-01-01",
  validToDateKey: "1992-01-01",
  shelfLifeDays: null,
};

describe("supplier contracts", () => {
  it("fixes a price and a lead time for a stated period", () => {
    const state = signSupplierContract(createProcurementState(), CONTRACT);
    expect(
      contractForSku(state, "linen-piece", "1991-06-01")?.leadTimeDays,
    ).toBe(4);
    // Outside its dates the contract does not apply.
    expect(contractForSku(state, "linen-piece", "1993-06-01")).toBeNull();
    expect(contractForSku(state, "nothing", "1991-06-01")).toBeNull();
  });

  it("enforces the supplier's minimum rather than rounding it away", () => {
    expect(orderCostMinor(CONTRACT, 50)).toBe(60_000);
    expect(() => orderCostMinor(CONTRACT, 49)).toThrow(/fewer than 50/);
  });

  it("takes the group's buying power off the contract price", () => {
    expect(orderCostMinor(CONTRACT, 100, 1_000)).toBe(108_000);
    expect(orderCostMinor(CONTRACT, 100, 0)).toBe(120_000);
  });

  it("refuses a contract that ends before it starts", () => {
    expect(() =>
      signSupplierContract(createProcurementState(), {
        ...CONTRACT,
        validToDateKey: "1990-01-01",
      }),
    ).toThrow(/after it starts/);
  });
});

describe("reorder rules", () => {
  it("orders when free stock falls to the reorder point", () => {
    const state = setReorderRule(createProcurementState(), {
      sku: "linen-piece",
      reorderPoint: 100,
      reorderQuantity: 200,
      placedBy: "hotel",
    });
    expect(
      dueReorders(state, { onHand: { "linen-piece": 100 }, onOrder: {} }),
    ).toEqual([{ sku: "linen-piece", quantity: 200, placedBy: "hotel" }]);
    expect(
      dueReorders(state, { onHand: { "linen-piece": 101 }, onOrder: {} }),
    ).toEqual([]);
  });

  it("counts stock already on its way, so a shortfall is not ordered twice", () => {
    const state = setReorderRule(createProcurementState(), {
      sku: "linen-piece",
      reorderPoint: 100,
      reorderQuantity: 200,
      placedBy: "hotel",
    });
    expect(
      dueReorders(state, {
        onHand: { "linen-piece": 20 },
        onOrder: { "linen-piece": 200 },
      }),
    ).toEqual([]);
  });

  it("refuses a rule that orders nothing", () => {
    expect(() =>
      setReorderRule(createProcurementState(), {
        sku: "x",
        reorderPoint: 10,
        reorderQuantity: 0,
        placedBy: "hotel",
      }),
    ).toThrow(/order something/);
  });

  it("replaces a rule for the same sku rather than stacking rules", () => {
    let state = setReorderRule(createProcurementState(), {
      sku: "linen-piece",
      reorderPoint: 100,
      reorderQuantity: 200,
      placedBy: "hotel",
    });
    state = setReorderRule(state, {
      sku: "linen-piece",
      reorderPoint: 50,
      reorderQuantity: 400,
      placedBy: "headquarters",
    });
    expect(state.reorderRules).toHaveLength(1);
    expect(state.reorderRules[0].placedBy).toBe("headquarters");
  });
});

describe("spoilage and stockouts", () => {
  it("throws away what has gone off and says how much", () => {
    let state = receiveLot(createProcurementState(), {
      sku: "breakfast-portion",
      quantity: 180,
      receivedDateKey: "1991-01-01",
      expiresDateKey: "1991-01-08",
    });
    state = receiveLot(state, {
      sku: "linen-piece",
      quantity: 200,
      receivedDateKey: "1991-01-01",
      expiresDateKey: null,
    });
    const expired = expireStock(state, "1991-01-08");
    expect(expired.spoiled).toEqual({ "breakfast-portion": 180 });
    // Linen does not go off, so it stays.
    expect(expired.state.lots.map((l) => l.sku)).toEqual(["linen-piece"]);
  });

  it("keeps stock that has not expired yet", () => {
    const state = receiveLot(createProcurementState(), {
      sku: "breakfast-portion",
      quantity: 180,
      receivedDateKey: "1991-01-01",
      expiresDateKey: "1991-01-08",
    });
    expect(expireStock(state, "1991-01-07").spoiled).toEqual({});
  });

  it("records a stockout rather than quietly serving nobody", () => {
    const state = recordStockout(createProcurementState(), {
      sku: "breakfast-portion",
      dateKey: "1991-02-01",
      shortBy: 12,
    });
    expect(state.stockouts).toEqual([
      { sku: "breakfast-portion", dateKey: "1991-02-01", shortBy: 12 },
    ]);
  });
});

describe("central purchasing", () => {
  it("states the trade rather than pretending scale is free", () => {
    const trade = centralPurchasingTradeOff(CONTRACT, 1_000);
    expect(trade.centralUnitPriceMinor).toBeLessThan(trade.localUnitPriceMinor);
    // The saving is paid for in days, which is what makes it a decision.
    expect(trade.centralLeadTimeDays).toBeGreaterThan(trade.localLeadTimeDays);
  });

  it("leaves the price alone when no group discount was negotiated", () => {
    const trade = centralPurchasingTradeOff(CONTRACT, 0);
    expect(trade.centralUnitPriceMinor).toBe(trade.localUnitPriceMinor);
    expect(trade.centralLeadTimeDays).toBeGreaterThan(trade.localLeadTimeDays);
  });
});
