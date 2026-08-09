import type { ChronicleEntry } from "../chronicle/chronicle";
import type { ActiveNarrativeEvent } from "./eventTypes";
import type { NamedRival } from "../rivals/rivalState";
import type { KeyPerson } from "../people/careerProgression";
import type { MediaLandscape } from "../media/mediaLandscape";
import type { PrestigeState } from "../prestige/prestige";
import type { StrategicOpportunity } from "./strategicOpportunities";
import type { CampaignConfig } from "../campaign/campaignConfig";
import type { CareerOutcomeState } from "../campaign/careerOutcome";
import { createNamedRivals } from "../rivals/rivalState";
import { mediaFromAdoption } from "../media/mediaLandscape";
import { createCampaignConfig } from "../campaign/campaignConfig";
import { assessCareerOutcome } from "../campaign/careerOutcome";
export interface NarrativeState {
  chronicle: ChronicleEntry[];
  activeEvents: ActiveNarrativeEvent[];
  achievedMilestones: string[];
  lastFiredByDefinition: Record<string, string>;
  rivals: NamedRival[];
  keyPeople: KeyPerson[];
  media: MediaLandscape;
  prestige: PrestigeState;
  opportunities: StrategicOpportunity[];
  campaign: CampaignConfig;
  career: CareerOutcomeState;
}
export function createNarrativeState(): NarrativeState {
  return {
    chronicle: [],
    activeEvents: [],
    achievedMilestones: [],
    lastFiredByDefinition: {},
    rivals: createNamedRivals(),
    keyPeople: [],
    media: mediaFromAdoption(0, 0),
    prestige: { personal: 0, company: 0, causes: [] },
    opportunities: [],
    campaign: createCampaignConfig(),
    career: assessCareerOutcome({
      cashMinor: 1,
      hotelCount: 1,
      year: 1991,
      creditAvailable: true,
    }),
  };
}
