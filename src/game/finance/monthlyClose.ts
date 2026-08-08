import {
  adrMinor,
  occupancyBasisPoints,
  revParMinor,
} from "../revenue/metrics";

export interface MonthlyCloseInput {
  openingCashMinor: number;
  closingCashMinor: number;
  roomRevenueMinor: number;
  otherRevenueMinor: number;
  operatingExpenseMinor: number;
  soldRoomNights: number;
  availableRoomNights: number;
}

export interface MonthlyCloseReport extends MonthlyCloseInput {
  revenueMinor: number;
  operatingProfitMinor: number;
  cashDeltaMinor: number;
  occupancyBasisPoints: number;
  adrMinor: number;
  revParMinor: number;
}

export function closeMonth(x: MonthlyCloseInput): MonthlyCloseReport {
  const revenueMinor = x.roomRevenueMinor + x.otherRevenueMinor;
  return {
    ...x,
    revenueMinor,
    operatingProfitMinor: revenueMinor - x.operatingExpenseMinor,
    cashDeltaMinor: x.closingCashMinor - x.openingCashMinor,
    occupancyBasisPoints: occupancyBasisPoints(
      x.soldRoomNights,
      x.availableRoomNights,
    ),
    adrMinor: adrMinor(x.roomRevenueMinor, x.soldRoomNights),
    revParMinor: revParMinor(x.roomRevenueMinor, x.availableRoomNights),
  };
}
