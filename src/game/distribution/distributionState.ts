import type { EvolvingChannel } from "./channelEvolution";

export interface Allotment {
  id: string;
  partner: string;
  category: string;
  roomsByDate: Record<string, number>;
  releaseDateKey: string;
}

export interface GroupBlock {
  id: string;
  category: string;
  roomsByDate: Record<string, number>;
  groupRateMinor: number;
  releaseDateKey: string;
  depositMinor: number;
  cancellationDaysBeforeArrival: number;
  cancellationFeeBasisPoints: number;
  paymentTermsDays: number;
  status: "held" | "confirmed" | "declined" | "released";
}

export interface ChannelInventoryRule {
  channelId: EvolvingChannel;
  allowedCategories: string[];
  allowedRatePlanIds: string[];
  closed: boolean;
}

export interface DistributionState {
  allotments: Allotment[];
  groupBlocks: GroupBlock[];
  channelInventory: ChannelInventoryRule[];
}

export function createDistributionState(): DistributionState {
  return { allotments: [], groupBlocks: [], channelInventory: [] };
}
