export const MAX_QUANTA_PER_BATCH = 500;

export function quantaForBatch(
  requested: number,
  maxPerBatch = MAX_QUANTA_PER_BATCH,
): number {
  if (
    !Number.isSafeInteger(requested) ||
    requested < 0 ||
    !Number.isSafeInteger(maxPerBatch) ||
    maxPerBatch <= 0
  )
    throw new Error("invalid fast-forward batch");
  return Math.min(requested, maxPerBatch);
}

export async function cooperativeFastForward(
  totalQuanta: number,
  advance: () => void,
  yieldToMessages: () => Promise<void> = () =>
    new Promise((resolve) => setTimeout(resolve, 0)),
): Promise<void> {
  let remaining = totalQuanta;
  while (remaining > 0) {
    const batch = quantaForBatch(remaining);
    for (let i = 0; i < batch; i++) advance();
    remaining -= batch;
    if (remaining > 0) await yieldToMessages();
  }
}
