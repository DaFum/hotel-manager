import type { ChronicleEntry } from "../chronicle/chronicle";
import type { ActiveNarrativeEvent } from "./eventTypes";
import type { NamedRival } from "../rivals/rivalState";
import type { KeyPerson } from "../people/careerProgression";
import type { MediaLandscape } from "../media/mediaLandscape";
import type { PrestigeState } from "../prestige/prestige";
import type { StrategicOpportunity } from "./strategicOpportunities";
import type { CampaignConfig } from "../campaign/campaignConfig";
import type {
  CareerFacts,
  CareerOutcomeState,
} from "../campaign/careerOutcome";
import { createNamedRivals } from "../rivals/rivalState";
import { mediaFromAdoption } from "../media/mediaLandscape";
import { createCampaignConfig } from "../campaign/campaignConfig";
import { assessCareerOutcome } from "../campaign/careerOutcome";

/**
 * Profit accumulated for one financial year. A milestone about a profitable
 * *year* has to be able to see a year; the monthly close adds to this and the
 * turn of the calendar resets it.
 */
export interface AnnualProfitAccumulator {
  year: number;
  /** Accumulated so far this financial year. */
  operatingProfitMinor: number;
  /** The last year that actually finished; what a "profitable year" means. */
  lastCompletedYearProfitMinor: number;
}

export interface NarrativeState {
  chronicle: ChronicleEntry[];
  activeEvents: ActiveNarrativeEvent[];
  achievedMilestones: string[];
  lastFiredByDefinition: Record<string, string>;
  annualProfit: AnnualProfitAccumulator;
  rivals: NamedRival[];
  keyPeople: KeyPerson[];
  media: MediaLandscape;
  prestige: PrestigeState;
  opportunities: StrategicOpportunity[];
  campaign: CampaignConfig;
  career: CareerOutcomeState;
}

/**
 * The campaign as it stands on its first day. The career reading is taken from
 * the position the company actually starts in rather than from an optimistic
 * constant, so a save that begins in distress says so from the first snapshot.
 */
export function createNarrativeState(input: {
  career: CareerFacts;
  campaign?: CampaignConfig;
}): NarrativeState {
  return {
    chronicle: [],
    activeEvents: [],
    achievedMilestones: [],
    lastFiredByDefinition: {},
    annualProfit: {
      year: input.career.year,
      operatingProfitMinor: 0,
      lastCompletedYearProfitMinor: 0,
    },
    rivals: createNamedRivals(),
    keyPeople: [],
    // 1991: the local paper and word of mouth. Review sites and social media
    // arrive later, from real technology adoption, not from a constant.
    media: mediaFromAdoption(0, 0),
    prestige: { personal: 0, company: 0, causes: [] },
    opportunities: [],
    campaign: input.campaign ?? createCampaignConfig(),
    career: assessCareerOutcome(input.career),
  };
}
