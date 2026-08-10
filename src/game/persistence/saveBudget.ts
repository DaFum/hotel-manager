export const MAX_SAVE_BYTES = 25_000_000;
export const MAX_HISTORY_RECORDS = 12_000;

export function evaluateSaveBudget(bytes: number): {
  ok: boolean;
  maxBytes: number;
} {
  if (!Number.isSafeInteger(bytes) || bytes < 0)
    throw new Error("save size must be a non-negative integer");
  return { ok: bytes <= MAX_SAVE_BYTES, maxBytes: MAX_SAVE_BYTES };
}

export function evaluateHistoryBudget(records: number): {
  ok: boolean;
  maxRecords: number;
} {
  if (!Number.isSafeInteger(records) || records < 0)
    throw new Error("history count must be a non-negative integer");
  return {
    ok: records <= MAX_HISTORY_RECORDS,
    maxRecords: MAX_HISTORY_RECORDS,
  };
}
