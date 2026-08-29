import type { SaveEnvelope } from "../saveVersions";
import { createDistributionState } from "../../distribution/distributionState";

export function migrateV12ToV13(save: SaveEnvelope): SaveEnvelope {
  if (save.saveVersion !== 12) return save;
  const state = structuredClone(save.state) as any;
  if (!state || typeof state !== "object" || Array.isArray(state))
    throw new Error("save state must be an object");
  state.distribution ??= createDistributionState();
  state.commercial ??= {};
  state.commercial.campaignAttributionLog ??= [];
  if (!Array.isArray(state.commercial.campaignAttributionLog))
    throw new Error("campaignAttributionLog must be an array");
  if (
    state.commercial.campaigns !== undefined &&
    !Array.isArray(state.commercial.campaigns)
  )
    throw new Error("campaigns must be an array");

  state.commercial.campaignAttributionLog =
    state.commercial.campaignAttributionLog.map((entry: any) => ({
      campaignId: entry.campaignId,
      lowBasisPoints: entry.low ?? entry.lowBasisPoints,
      baseBasisPoints: entry.base ?? entry.baseBasisPoints,
      highBasisPoints: entry.high ?? entry.highBasisPoints,
      realisedBasisPoints: entry.realised ?? entry.realisedBasisPoints,
      atDateKey: entry.atDateKey,
    }));
  for (const campaign of state.commercial.campaigns ?? []) {
    campaign.region ??= "national";
    campaign.message ??= "awareness";
  }
  state.commercial.loyalty ??= { members: [], liabilityMinor: 0 };
  state.commercial.loyalty.active ??= true;
  for (const contract of state.commercial.sales?.contracts ?? []) {
    contract.blackoutDateKeys ??= [];
    contract.paymentTermsDays ??= 0;
    contract.cancellationDaysBeforeArrival ??= 0;
    contract.cancellationFeeBasisPoints ??= 0;
  }
  state.company.groupTargets ??= {
    gopparMinor: 0,
    guestSatisfaction: 0,
    staffTurnoverBasisPoints: 0,
    marketShareBasisPoints: 0,
    brandStandard: 0,
  };
  state.metrics.gopparMinor ??= 0;
  state.revenuePolicy ??= {};
  state.revenuePolicy.managerAttributes ??= {
    PricingStrategy: 50,
    StayRestriction: 50,
    ChannelManagement: 50,
    GroupNegotiation: 50,
    ContractNegotiation: 50,
  };
  state.efficiencyProjects ??= [];
  state.standbyPower ??= false;
  state.meters ??= { energy: 0, water: 0, waste: 0 };
  state.outages ??= [];
  if (state.world?.macro) {
    state.world.macro.energyPriceIndexBp ??= 10_000;
  }
  if (state.utilityContracts && typeof state.utilityContracts === "object") {
    for (const kind of ["energy", "water", "waste"] as const) {
      if (state.utilityContracts[kind]) {
        state.utilityContracts[kind].supplierId ??= `supplier.utility.municipal.${kind}`;
        state.utilityContracts[kind].validFromDateKey ??= "1991-01-01";
        state.utilityContracts[kind].validToDateKey ??= "2099-12-31";
        state.utilityContracts[kind].priceLock ??= "fixed";
      }
    }
  }
  return { ...save, saveVersion: 13, state };
}
