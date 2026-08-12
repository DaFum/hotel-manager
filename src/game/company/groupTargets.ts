import { budgetVariance } from "./budgets";
import type { HotelOperatingResult } from "./companyState";
import { gopparMinor } from "../revenue/metrics";

export interface GroupTargets {
  gopparMinor: number;
  guestSatisfaction: number;
  staffTurnoverBasisPoints: number;
  marketShareBasisPoints: number;
  brandStandard: number;
}

export function groupTargetVariance(
  targets: GroupTargets,
  result: HotelOperatingResult,
) {
  return budgetVariance({
    targetMinor: targets.gopparMinor,
    actualMinor: gopparMinor(
      result.grossOperatingProfitMinor,
      result.availableRoomNights,
    ),
    kind: "revenue",
  });
}
