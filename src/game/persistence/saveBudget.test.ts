import { expect, it } from "vitest";
import { evaluateHistoryBudget, evaluateSaveBudget } from "./saveBudget";

it("enforces independent save and retained-history budgets", () => {
  expect(evaluateSaveBudget(25_000_000).ok).toBe(true);
  expect(evaluateSaveBudget(25_000_001)).toEqual({
    ok: false,
    maxBytes: 25_000_000,
  });
  expect(evaluateHistoryBudget(12_000).ok).toBe(true);
  expect(evaluateHistoryBudget(12_001).ok).toBe(false);
});
