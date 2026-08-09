import { compareIds } from "../domain/ids";
import type { XorShift32 } from "../domain/rng";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
  assertScore,
} from "../domain/units";

/**
 * Marketing as a decision with a shape. A campaign declares what it is for,
 * who it is aimed at, where it runs, how long, what it costs and how good the
 * work is — and then delivers less than it promised, later than it promised,
 * because that is what marketing does.
 */
export type CampaignObjective =
  "awareness" | "occupancy" | "rate" | "segmentShift";

export type CampaignChannel =
  | "print"
  | "radio"
  | "billboard"
  | "directMail"
  | "travelAgent"
  | "onlineListing";

export interface Campaign {
  id: string;
  objective: CampaignObjective;
  /** The guest segment the work is aimed at. */
  targetSegmentId: string;
  channel: CampaignChannel;
  startDateKey: string;
  durationDays: number;
  budgetMinor: number;
  /** 0-100; the work itself, not the money behind it. */
  creativeQuality: number;
  status: "running" | "finished";
}

/** Channels the world has to have caught up with before they can be bought. */
export const CHANNEL_REQUIREMENTS: Record<CampaignChannel, string | null> = {
  print: null,
  radio: null,
  billboard: null,
  directMail: null,
  travelAgent: null,
  // An online listing needs somebody to be online.
  onlineListing: "internet",
};

export function channelAvailable(
  channel: CampaignChannel,
  adoption: Record<string, number>,
): boolean {
  const requirement = CHANNEL_REQUIREMENTS[channel];
  if (!requirement) return true;
  return (adoption[requirement] ?? 0) >= 1500;
}

export function createCampaign(input: Omit<Campaign, "status">): Campaign {
  if (!input.id) throw new Error("a campaign id is required");
  if (!input.targetSegmentId) throw new Error("a campaign needs a target");
  if (!Number.isSafeInteger(input.durationDays) || input.durationDays <= 0)
    throw new Error("invalid campaign duration");
  assertNonNegativeMinor(input.budgetMinor, "campaign budget");
  assertScore(input.creativeQuality, "creative quality");
  // A persisted or hand-built campaign can name a channel the game does not
  // sell; costing it would divide by an undefined rate.
  if (!Object.hasOwn(COST_PER_CONTACT_MINOR, input.channel))
    throw new Error(`unknown campaign channel: ${input.channel}`);
  return { ...input, status: "running" };
}

export interface CampaignReach {
  /** How many people the money bought, at this channel's cost per contact. */
  reach: number;
  /** How many times each of them saw it, in basis points of one exposure. */
  frequencyBasisPoints: number;
}

/** What a mark costs to reach, per channel, in Pfennig. */
const COST_PER_CONTACT_MINOR: Record<CampaignChannel, number> = {
  print: 40,
  radio: 25,
  billboard: 15,
  directMail: 120,
  travelAgent: 300,
  onlineListing: 8,
};

export function campaignReach(
  campaign: Campaign,
  audience: number,
): CampaignReach {
  assertCount(audience, "audience");
  const contacts = Math.trunc(
    campaign.budgetMinor / COST_PER_CONTACT_MINOR[campaign.channel],
  );
  const reach = Math.min(audience, contacts);
  return {
    reach,
    frequencyBasisPoints:
      reach === 0
        ? 0
        : Math.min(50_000, Math.trunc((contacts * 10_000) / reach)),
  };
}

/**
 * What the campaign is worth to demand, in basis points of extra capture for
 * its target segment. Reach, frequency and the quality of the work all count,
 * and the result saturates: buying the same eyeballs a sixth time does very
 * little.
 */
export function campaignEffectBasisPoints(
  campaign: Campaign,
  audience: number,
): number {
  const { reach, frequencyBasisPoints } = campaignReach(campaign, audience);
  if (audience === 0 || reach === 0) return 0;
  const coverageBp = Math.trunc((reach * 10_000) / audience);
  // Frequency past three exposures adds nothing worth having.
  const usefulFrequencyBp = Math.min(30_000, frequencyBasisPoints);
  return Math.trunc(
    (coverageBp * usefulFrequencyBp * campaign.creativeQuality) /
      (10_000 * 100 * 3),
  );
}

/**
 * Attribution, lagged. A campaign that ran last week is still working this
 * week, and the effect the player sees today is never the effect of what they
 * did today — which is exactly why marketing is hard to judge.
 */
export const ATTRIBUTION_LAG_DAYS = 7;

export function attributedEffectBasisPoints(
  campaign: Campaign,
  audience: number,
  daysSinceStart: number,
): number {
  if (daysSinceStart < ATTRIBUTION_LAG_DAYS) return 0;
  const elapsed = daysSinceStart - ATTRIBUTION_LAG_DAYS;
  if (elapsed >= campaign.durationDays) return 0;
  return campaignEffectBasisPoints(campaign, audience);
}

/**
 * The honest part: the effect is a band, not a number. The uncertainty is
 * reported rather than sampled, so two players who ran the same campaign see
 * the same range and only the outcome differs.
 */
export function campaignUncertaintyBand(
  effectBasisPoints: number,
  uncertaintyBasisPoints: number,
): { low: number; base: number; high: number } {
  assertBasisPoints(uncertaintyBasisPoints, "campaign uncertainty");
  const spread = Math.trunc(
    (effectBasisPoints * uncertaintyBasisPoints) / 10_000,
  );
  return {
    low: Math.max(0, effectBasisPoints - spread),
    base: effectBasisPoints,
    high: effectBasisPoints + spread,
  };
}

/** Where in the band this campaign actually landed; drawn once, at the start. */
export function realisedEffectBasisPoints(
  band: { low: number; high: number },
  economy: XorShift32,
): number {
  const spread = band.high - band.low;
  return spread === 0
    ? band.low
    : band.low + (economy.nextUint32() % (spread + 1));
}

export function registerCampaign(
  campaigns: readonly Campaign[],
  campaign: Campaign,
): Campaign[] {
  if (campaigns.some((c) => c.id === campaign.id))
    throw new Error(`campaign ${campaign.id} already exists`);
  return [...campaigns, campaign].sort((a, b) => compareIds(a.id, b.id));
}

export function finishExpiredCampaigns(
  campaigns: readonly Campaign[],
  daysSinceStartById: Record<string, number>,
): Campaign[] {
  return campaigns.map((campaign) =>
    campaign.status === "running" &&
    (daysSinceStartById[campaign.id] ?? 0) >=
      campaign.durationDays + ATTRIBUTION_LAG_DAYS
      ? { ...campaign, status: "finished" as const }
      : campaign,
  );
}
