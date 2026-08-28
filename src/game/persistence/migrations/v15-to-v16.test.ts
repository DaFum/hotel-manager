import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../simulation/initialState";
import { migrateV15ToV16 } from "./v15-to-v16";

describe("v15 to v16 migration", () => {
  it("adds term-payment state without changing unrelated data", () => {
    const state: any = createInitialGameState(91);
    delete state.finance.supplierInvoices;
    delete state.finance.month.openingLedgerIndex;
    const hotelSnapshot = structuredClone(state.hotel);
    const migrated = migrateV15ToV16({
      saveVersion: 15,
      contentVersion: "1991.1",
      protocolVersion: 4,
      rngState: state.rngState,
      state,
    });

    expect(migrated.saveVersion).toBe(16);
    expect((migrated.state as any).finance.supplierInvoices).toEqual([]);
    expect(
      (migrated.state as any).finance.month.openingLedgerIndex,
    ).toBe((migrated.state as any).finance.ledger.length);
    expect((migrated.state as any).hotel).toEqual(hotelSnapshot);
  });
});
