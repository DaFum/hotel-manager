import { addDays } from "../domain/calendar";
import type { LedgerEntry } from "../finance/ledger";

export interface DailyFinancialPoint {
  day: string;
  revenueMinor: number;
}
export interface HistoryAggregate {
  count: number;
  revenueMinor: number;
  minMinor: number;
  maxMinor: number;
}

export function compactDailyHistory(
  points: readonly DailyFinancialPoint[],
): HistoryAggregate {
  let revenueMinor = 0;
  let minMinor = 0;
  let maxMinor = 0;
  points.forEach((point, index) => {
    if (!Number.isSafeInteger(point.revenueMinor))
      throw new Error("history money must be a safe integer");
    revenueMinor += point.revenueMinor;
    if (!Number.isSafeInteger(revenueMinor))
      throw new Error("history aggregate overflow");
    if (index === 0 || point.revenueMinor < minMinor)
      minMinor = point.revenueMinor;
    if (index === 0 || point.revenueMinor > maxMinor)
      maxMinor = point.revenueMinor;
  });
  return { count: points.length, revenueMinor, minMinor, maxMinor };
}

export function compactByPeriod(
  points: readonly DailyFinancialPoint[],
  period: "month" | "year",
): Record<string, HistoryAggregate> {
  const grouped = new Map<string, DailyFinancialPoint[]>();
  for (const point of points) {
    const key =
      period === "month" ? point.day.slice(0, 7) : point.day.slice(0, 4);
    const values = grouped.get(key);
    if (values) values.push(point);
    else grouped.set(key, [point]);
  }
  return Object.fromEntries(
    [...grouped]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, values]) => [key, compactDailyHistory(values)]),
  );
}

const RECENT_LEDGER_DAYS = 730;
const MONTHLY_LEDGER_DAYS = 1_825;

/**
 * Retains two years of individual postings, then one posting per account and
 * month for three years, and one posting per account and year thereafter.
 * Account and cash totals are unchanged, so statements and the cash/ledger
 * invariant remain exact while decades of daily payroll do not fill a save.
 */
export function compactLedgerHistory(
  ledger: readonly LedgerEntry[],
  currentDay: number,
): LedgerEntry[] {
  if (!Number.isSafeInteger(currentDay) || currentDay < 0)
    throw new Error("current ledger day must be a non-negative integer");
  const groups = new Map<string, LedgerEntry>();
  const recent: LedgerEntry[] = [];
  for (const entry of ledger) {
    const age = currentDay - entry.day;
    if (age <= RECENT_LEDGER_DAYS) {
      recent.push({ ...entry });
      continue;
    }
    const date = addDays("1991-01-01", entry.day);
    const period =
      age <= MONTHLY_LEDGER_DAYS ? date.slice(0, 7) : date.slice(0, 4);
    const key = `${period}:${entry.account}`;
    const existing = groups.get(key);
    const amountMinor = (existing?.amountMinor ?? 0) + entry.amountMinor;
    if (!Number.isSafeInteger(amountMinor))
      throw new Error("ledger history overflow");
    groups.set(key, {
      day: existing?.day ?? entry.day,
      account: entry.account,
      amountMinor,
      memo: `history:${key}`,
    });
  }
  return [
    ...[...groups.values()].sort(
      (a, b) =>
        a.day - b.day ||
        (a.account < b.account ? -1 : a.account > b.account ? 1 : 0),
    ),
    ...recent,
  ];
}
