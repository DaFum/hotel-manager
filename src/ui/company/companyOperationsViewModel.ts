import type { GameState } from "../../game/simulation/initialState";
import {
  consolidatedCashMinor,
  overdrawnHotels,
  currencyExposureMinor,
} from "../../game/treasury/treasury";
import { valueHotel, offerRangeMinor } from "../../game/ma/valuation";
import { DUE_DILIGENCE_AREAS } from "../../game/ma/dueDiligence";
import {
  headquartersMonthlyCostMinor,
  purchasingDiscountBasisPoints,
  sharedServiceLoad,
} from "../../game/company/sharedServices";
import { MARKET_GOP_MULTIPLE_BP } from "../../game/content/1991/company";
import { hotelName } from "./companyViewModel";
export function treasuryView(state: GameState) {
  const t = state.company.treasury;
  const currencies = Object.fromEntries(
    state.company.managedHotels.map((h) => [h.hotelId, t.reportingCurrency]),
  );
  return {
    hotelCount: state.company.portfolio.hotelIds.length,
    hqMinor: t.hqMinor,
    consolidatedMinor: consolidatedCashMinor(t),
    accounts: Object.entries(t.hotelCashMinor).map(
      ([hotelId, balanceMinor]) => ({
        hotelId,
        hotelName: hotelName(state, hotelId),
        balanceMinor,
      }),
    ),
    overdrawn: overdrawnHotels(t),
    exposure: currencyExposureMinor(t, currencies),
  };
}
export function acquisitionsView(state: GameState) {
  return state.company.acquisitionTargets.map((target) => {
    const valuation = valueHotel({
      annualGopMinor: target.annualGopMinor,
      multipleBasisPoints: MARKET_GOP_MULTIPLE_BP,
      renovationNeedMinor: target.renovationNeedMinor,
      debtAssumedMinor: target.debtAssumedMinor,
    });
    const report = state.company.dueDiligence[target.id];
    return {
      ...target,
      valuation,
      offer: offerRangeMinor(valuation, 1000),
      report,
      uncovered: report?.uncoveredAreas ?? DUE_DILIGENCE_AREAS,
    };
  });
}
export function headquartersView(state: GameState) {
  const h = state.company.headquarters;
  const hotelCount = state.company.portfolio.hotelIds.length;
  return {
    hotelCount,
    baseMinor: h.baseMonthlyCostMinor,
    perHotelMinor: h.perHotelMonthlyCostMinor,
    totalMinor: headquartersMonthlyCostMinor({
      hotelCount,
      baseMinor: h.baseMonthlyCostMinor,
      perHotelMinor: h.perHotelMonthlyCostMinor,
    }),
    analysts: h.analysts,
    load: sharedServiceLoad({
      hotelCount,
      analysts: h.analysts,
      capacityPerAnalyst: h.capacityPerAnalyst,
    }),
    discountBp: purchasingDiscountBasisPoints(hotelCount),
  };
}
