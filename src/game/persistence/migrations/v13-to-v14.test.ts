import { describe, it, expect } from "vitest";
import { migrateV13ToV14 } from "./v13-to-v14";

describe("v13 to v14 migration", () => {
  it("adds annual fields and tax payable", () => {
    const envelope: any = {
      saveVersion: 13,
      state: {
        narrative: {},
        finance: {},
      },
    };

    const migrated = migrateV13ToV14(envelope);

    expect(migrated.saveVersion).toBe(14);
    expect((migrated.state as any).narrative.annualProfitMinor).toBe(0);
    expect((migrated.state as any).narrative.annualInterestMinor).toBe(0);
    expect((migrated.state as any).finance.taxPayableMinor).toBe(0);
  });
});
