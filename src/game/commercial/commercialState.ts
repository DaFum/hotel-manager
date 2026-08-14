import { createCampaign, type Campaign } from "./campaigns";
import { createCrmState, type CrmState } from "./crm";
import { createLoyaltyState, type LoyaltyState } from "./loyalty";
import { createSalesState, type SalesState } from "./salesPipeline";

/**
 * The commercial half of the hotel in one persisted section: what it is
 * advertising, who it has agreed rates with, what it remembers about its
 * guests, and what its loyalty scheme owes them.
 */
export interface CommercialState {
  campaigns: Campaign[];
  /** Days each running campaign has been live, so attribution can lag. */
  campaignAgeDays: Record<string, number>;
  campaignAttributionLog: CampaignAttributionEntry[];
  sales: SalesState;
  crm: CrmState;
  loyalty: LoyaltyState;
}

export interface CampaignAttributionEntry {
  campaignId: string;
  lowBasisPoints: number;
  baseBasisPoints: number;
  highBasisPoints: number;
  realisedBasisPoints: number;
  atDateKey: string;
}

export const CAMPAIGN_ATTRIBUTION_LOG_LIMIT = 120;

export function createCommercialState(): CommercialState {
  return {
    campaigns: [],
    campaignAgeDays: {},
    campaignAttributionLog: [],
    sales: createSalesState(),
    crm: createCrmState(),
    loyalty: createLoyaltyState(),
  };
}

export { createCampaign };
