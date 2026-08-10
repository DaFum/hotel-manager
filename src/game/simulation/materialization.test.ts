import { describe, expect, it } from "vitest";
import { selectVisibleAgents } from "./materialization";

describe("agent materialization", () => {
  it("caps deterministic representatives and retains aggregate demand", () => {
    const parties = Array.from({ length: 800 }, (_, i) => ({
      id: `p${String(i).padStart(3, "0")}`,
      priority: i % 10,
    }));
    const result = selectVisibleAgents(parties, 300);
    expect(result.visible).toHaveLength(300);
    expect(result.totalParties).toBe(800);
    expect(result.visible[0].priority).toBe(9);
  });
});
