import { describe, expect, it } from "vitest";
import { migrateV14ToV15 } from "./v14-to-v15";

describe("v14 to v15 migration", () => {
  it("backfills and round-trips the investor stake", () => {
    const old = { saveVersion: 14, state: { company: {} } } as any;
    const migrated = migrateV14ToV15(old);
    expect(migrated.saveVersion).toBe(15);
    expect((migrated.state as any).company.investorStakeBasisPoints).toBe(0);
    expect(JSON.parse(JSON.stringify(migrated))).toEqual(migrated);
    expect((old.state as any).company.investorStakeBasisPoints).toBeUndefined();
  });
});
