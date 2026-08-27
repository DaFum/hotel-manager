import {
  adrMinor,
  occupancyBasisPoints,
  revParMinor,
  gopparMinor,
} from "../revenue/metrics";
import { addDays } from "../domain/calendar";
import type { BalanceSheet, CashFlowStatement } from "./statements";

export interface MonthlyCloseInput {
  taxChargeMinor?: number;
  /** The closed month as `YYYY-MM`; identifies the report. */
  periodKey: string;
  openingCashMinor: number;
  closingCashMinor: number;
  roomRevenueMinor: number;
  otherRevenueMinor: number;
  operatingExpenseMinor: number;
  soldRoomNights: number;
  availableRoomNights: number;
}

export interface BriefingItem {
  labelKey: string;
  values?: Record<string, string | number>;
  amountMinor?: number;
  magnitude?: number;
  direction: "favourable" | "adverse" | "neutral";
}

export interface MonthlyCloseHighWaterMarks {
  revenueMinor: number;
  operatingProfitMinor: number;
  eventRevenueMinor: number;
}

export interface MonthlyBriefingSignals {
  dateKey: string;
  supplierContracts: readonly {
    id: string;
    validToDateKey: string;
  }[];
  competitors: readonly {
    id: string;
    rooms: number;
    status: "operate" | "restructure" | "exit";
    monthsSinceBuild: number;
  }[];
}

export interface MonthlyCloseReport extends MonthlyCloseInput {
  cashFlowStatement?: CashFlowStatement;
  balanceSheet?: BalanceSheet;
  revenueMinor: number;
  operatingProfitMinor: number;
  cashDeltaMinor: number;
  occupancyBasisPoints: number;
  adrMinor: number;
  revParMinor: number;
  gopparMinor: number;
  whatWentWell: BriefingItem[];
  whatWentBadly: BriefingItem[];
  whatIsChanging: BriefingItem[];
}

export function closeMonth(x: MonthlyCloseInput): MonthlyCloseReport {
  const revenueMinor = x.roomRevenueMinor + x.otherRevenueMinor;
  const operatingProfitMinor = revenueMinor - x.operatingExpenseMinor;
  return {
    ...x,
    revenueMinor,
    operatingProfitMinor,
    cashDeltaMinor: x.closingCashMinor - x.openingCashMinor,
    occupancyBasisPoints: occupancyBasisPoints(
      x.soldRoomNights,
      x.availableRoomNights,
    ),
    adrMinor: adrMinor(x.roomRevenueMinor, x.soldRoomNights),
    revParMinor: revParMinor(x.roomRevenueMinor, x.availableRoomNights),
    gopparMinor: gopparMinor(operatingProfitMinor, x.availableRoomNights),
    whatWentWell: [],
    whatWentBadly: [],
    whatIsChanging: [],
  };
}

export const MONTHLY_BRIEFING_LIMIT = 3;
export const SUPPLIER_EXPIRY_HORIZON_DAYS = 45;

function rank(items: BriefingItem[]): BriefingItem[] {
  return items
    .sort(
      (a, b) =>
        Math.abs(b.amountMinor ?? b.magnitude ?? 0) -
          Math.abs(a.amountMinor ?? a.magnitude ?? 0) ||
        (a.labelKey < b.labelKey ? -1 : a.labelKey > b.labelKey ? 1 : 0),
    )
    .slice(0, MONTHLY_BRIEFING_LIMIT);
}

/** Pure, bounded explanation of the closed month and visible near-term risks. */
export function deriveMonthlyBriefing(input: {
  report: MonthlyCloseReport;
  previous: MonthlyCloseReport | null;
  highWaterMarks: MonthlyCloseHighWaterMarks;
  eventRevenueMinor: number;
  previousEventRevenueMinor: number;
  lateRoomReleaseCount: number;
  previousLateRoomReleaseCount: number;
  signals: MonthlyBriefingSignals;
}): Pick<
  MonthlyCloseReport,
  "whatWentWell" | "whatWentBadly" | "whatIsChanging"
> {
  const changes: BriefingItem[] = [];
  const addChange = (
    labelKey: string,
    current: number,
    previous: number,
    lowerIsBetter = false,
    values: Record<string, string | number> = {},
  ) => {
    const delta = current - previous;
    if (delta === 0) return;
    const favourable = lowerIsBetter ? delta < 0 : delta > 0;
    changes.push({
      labelKey,
      values: { ...values, amountMinor: Math.abs(delta) },
      ...(lowerIsBetter
        ? { magnitude: Math.abs(delta) }
        : { amountMinor: delta }),
      direction: favourable ? "favourable" : "adverse",
    });
  };
  if (input.previous) {
    addChange(
      "finance.monthlyClose.causes.revenueChange",
      input.report.revenueMinor,
      input.previous.revenueMinor,
    );
    addChange(
      "finance.monthlyClose.causes.profitChange",
      input.report.operatingProfitMinor,
      input.previous.operatingProfitMinor,
    );
    addChange(
      "finance.monthlyClose.causes.eventRevenueChange",
      input.eventRevenueMinor,
      input.previousEventRevenueMinor,
    );
    addChange(
      "finance.monthlyClose.causes.lateRoomReleases",
      input.lateRoomReleaseCount,
      input.previousLateRoomReleaseCount,
      true,
      { count: input.lateRoomReleaseCount },
    );
  }
  const recordMetrics: readonly [keyof MonthlyCloseHighWaterMarks, number][] = [
    ["revenueMinor", input.report.revenueMinor],
    ["operatingProfitMinor", input.report.operatingProfitMinor],
    ["eventRevenueMinor", input.eventRevenueMinor],
  ];
  const records: BriefingItem[] = recordMetrics.flatMap(([metric, amount]) =>
    amount > input.highWaterMarks[metric]
      ? [
          {
            labelKey: `finance.monthlyClose.causes.${metric}Record`,
            values: { amountMinor: amount },
            amountMinor: amount,
            direction: "favourable" as const,
          },
        ]
      : [],
  );

  const endKey = addDays(input.signals.dateKey, SUPPLIER_EXPIRY_HORIZON_DAYS);
  const expiring = input.signals.supplierContracts.filter(
    (contract) =>
      contract.validToDateKey > input.signals.dateKey &&
      contract.validToDateKey <= endKey,
  );
  const recentCompetitors = input.signals.competitors.filter(
    (competitor) =>
      competitor.status !== "operate" || competitor.monthsSinceBuild === 0,
  );
  const changing: BriefingItem[] = [];
  if (expiring.length)
    changing.push({
      labelKey: `finance.monthlyClose.causes.supplierExpiries_${expiring.length === 1 ? "one" : "other"}`,
      values: {
        count: expiring.length,
        days: SUPPLIER_EXPIRY_HORIZON_DAYS,
      },
      magnitude: expiring.length,
      direction: "neutral",
    });
  if (recentCompetitors.length)
    changing.push({
      labelKey: `finance.monthlyClose.causes.competitorDevelopments_${recentCompetitors.length === 1 ? "one" : "other"}`,
      values: {
        count: recentCompetitors.length,
        rooms: recentCompetitors.reduce((sum, item) => sum + item.rooms, 0),
      },
      magnitude: recentCompetitors.reduce((sum, item) => sum + item.rooms, 0),
      direction: "neutral",
    });
  return {
    whatWentWell: rank([
      ...records,
      ...changes.filter((item) => item.direction === "favourable"),
    ]),
    whatWentBadly: rank(changes.filter((item) => item.direction === "adverse")),
    whatIsChanging: rank(changing),
  };
}
