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
  sales: SalesState;
  crm: CrmState;
  loyalty: LoyaltyState;
}

export function createCommercialState(): CommercialState {
  return {
    campaigns: [],
    campaignAgeDays: {},
    sales: createSalesState(),
    crm: createCrmState(),
    loyalty: createLoyaltyState(),
  };
}

export { createCampaign };
