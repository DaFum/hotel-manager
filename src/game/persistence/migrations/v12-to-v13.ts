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
  return { ...save, saveVersion: 13, state };
}
