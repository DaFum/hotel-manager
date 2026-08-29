import { describe, expect, it } from "vitest";
import { migrateV17ToV18 } from "./v17-to-v18";
import type { SaveEnvelope } from "../saveVersions";

describe("v17 to v18 save migration", () => {
  it("defaults departmentHeadAuthorities when missing", () => {
    const oldEnvelope: SaveEnvelope = {
      saveVersion: 17,
      contentVersion: "1991.1",
      protocolVersion: 1,
      rngState: {
        guests: 1,
        staffing: 2,
        failures: 3,
        economy: 4,
        events: 5,
        weather: 6,
        AI: 7,
        narrative: 8,
      },
      state: {
        calendar: { dateKey: "1991-01-01", minuteOfDay: 0 },
      },
    };

    const migrated = migrateV17ToV18(oldEnvelope);
    expect(migrated.saveVersion).toBe(18);
    const state = migrated.state as any;
    expect(state.departmentHeadAuthorities).toBeDefined();
    expect(state.departmentHeadAuthorities.housekeeping).toBeDefined();
    expect(state.departmentHeadAuthorities.reception).toBeDefined();
    expect(state.departmentHeadAuthorities.fnb).toBeDefined();
    expect(state.departmentHeadAuthorities.maintenance).toBeDefined();
  });
});
