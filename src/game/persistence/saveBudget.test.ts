import { expect, it } from "vitest";
import { evaluateHistoryBudget, evaluateSaveBudget } from "./saveBudget";

it("enforces independent save and retained-history budgets", () => {
  expect(evaluateSaveBudget(30_000_000)).toEqual({
    ok: false,
    maxBytes: 25_000_000,
  });
  expect(evaluateHistoryBudget(12_001).ok).toBe(false);
});
