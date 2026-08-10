import { describe, expect, it } from "vitest";
import { evaluatePerfSample, PERF_BUDGET } from "./performanceBudget";

describe("performance budget", () => {
  it("reports each independently measurable over-budget dimension", () => {
    expect(
      evaluatePerfSample({
        tickMs: 35,
        commandAckMs: 8,
        visibleAgents: 200,
        saveBytes: 1_000,
        deltaBytes: 1_000,
      }),
    ).toEqual(["tickMs"]);
    expect(
      evaluatePerfSample({
        ...PERF_BUDGET,
        visibleAgents: PERF_BUDGET.visibleAgents + 1,
        saveBytes: PERF_BUDGET.saveBytes + 1,
      }),
    ).toEqual(["visibleAgents", "saveBytes"]);
  });
});
