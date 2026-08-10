import { expect, it, vi } from "vitest";
import { cooperativeFastForward, quantaForBatch } from "./fastForward";

it("caps batches and yields between them", async () => {
  expect(quantaForBatch(100_000, 500)).toBe(500);
  const advance = vi.fn();
  const yieldToMessages = vi.fn(async () => undefined);
  await cooperativeFastForward(1_001, advance, yieldToMessages);
  expect(advance).toHaveBeenCalledTimes(1_001);
  expect(yieldToMessages).toHaveBeenCalledTimes(2);
});
