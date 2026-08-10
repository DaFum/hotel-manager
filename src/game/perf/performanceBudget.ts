import type { PerfSample } from "./perfSample";

export const PERF_BUDGET = {
  tickMs: 25,
  commandAckMs: 20,
  visibleAgents: 500,
  saveBytes: 25_000_000,
  deltaBytes: 250_000,
} as const satisfies PerfSample;

export type PerfBudgetKey = keyof PerfSample;

export function evaluatePerfSample(sample: PerfSample): PerfBudgetKey[] {
  return (Object.keys(PERF_BUDGET) as PerfBudgetKey[]).filter(
    (key) => !Number.isFinite(sample[key]) || sample[key] > PERF_BUDGET[key],
  );
}
