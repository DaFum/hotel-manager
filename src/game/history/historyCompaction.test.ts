import { expect, it } from "vitest";
import {
  compactByPeriod,
  compactDailyHistory,
  compactLedgerHistory,
} from "./historyCompaction";

it("preserves counts, sums and ranges while rolling daily history up", () => {
  const points = [
    { day: "1991-01-01", revenueMinor: 100 },
    { day: "1991-01-02", revenueMinor: 200 },
  ];
  expect(compactDailyHistory(points)).toEqual({
    count: 2,
    revenueMinor: 300,
    minMinor: 100,
    maxMinor: 200,
  });
  expect(compactByPeriod(points, "month")["1991-01"].count).toBe(2);
});

it("keeps recent ledger detail, monthly mid-term totals and yearly old totals", () => {
  const ledger = [
    { day: 10, account: "roomRevenue", amountMinor: 100, memo: "old a" },
    { day: 20, account: "roomRevenue", amountMinor: 200, memo: "old b" },
    { day: 1_000, account: "wages", amountMinor: -50, memo: "mid" },
    { day: 2_100, account: "supplies", amountMinor: -10, memo: "recent" },
  ];
  const compacted = compactLedgerHistory(ledger, 2_200);
  expect(compacted.reduce((sum, entry) => sum + entry.amountMinor, 0)).toBe(
    240,
  );
  expect(
    compacted.some((entry) => entry.memo === "history:1991:roomRevenue"),
  ).toBe(true);
  expect(
    compacted.some((entry) => entry.memo.startsWith("history:1993-09:wages")),
  ).toBe(true);
  expect(compacted.at(-1)?.memo).toBe("recent");
});

it("bounds fifty years of daily postings without changing account totals", () => {
  const ledger = Array.from({ length: 365 * 50 }, (_, day) => ({
    day,
    account: day % 2 ? "wages" : "roomRevenue",
    amountMinor: day % 2 ? -50 : 100,
    memo: `posting ${day}`,
  }));
  const compacted = compactLedgerHistory(ledger, 365 * 50);
  expect(compacted.length).toBeLessThan(1_000);
  expect(compacted.reduce((sum, entry) => sum + entry.amountMinor, 0)).toBe(
    ledger.reduce((sum, entry) => sum + entry.amountMinor, 0),
  );
});
