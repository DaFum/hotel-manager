import type { RngStreams } from "../commands/commandHandler";
import { advanceLifecycle } from "../technology/lifecycle";
import { advanceCommonCurrency } from "../currency/paths";
import { advanceMacro, type MacroState } from "./macro";
import { crisisRiskBp } from "./crises";
import { bufferedCrisisRiskBp } from "../campaign/difficultyEffects";
import {
  frequencyScaledCrisisRiskBp,
  volatilityScaledRange,
} from "../campaign/sandboxEffects";
import { maybeCreateShock, type WorldShock } from "./shocks";
import { generateWeather, type WeatherOutcome } from "./climate";
import { canEmerge } from "../technology/graph";
import {
  TECHNOLOGY_CONTENT,
  TECHNOLOGY_REQUIREMENTS,
  TREND_CONTENT,
} from "../content/runtimeContent";
export const worldStepOrder = [
  "macro",
  "regulation",
  "technology",
  "trends",
  "actors",
  "crises",
  "currency",
] as const;
export interface WorldTechnologyState {
  id: string;
  adoptionBp: number;
  peakAdoptionBp: number;
  obsolete: boolean;
  replacedBy?: string;
}
export interface WorldState {
  monthsAdvanced: number;
  yearsAdvanced: number;
  lastStepOrder: string[];
  macro: MacroState;
  technologies: WorldTechnologyState[];
  trends: { id: string; adoptionBp: number }[];
  activeShocks: WorldShock[];
  weather: WeatherOutcome;
  commonCurrency: {
    id: string;
    memberCurrencies: readonly string[];
    coordinationBp: number;
    tradeIntegrationBp: number;
    publicSupportBp: number;
    active: boolean;
  };
  regulationPressureBp: number;
}
export function createWorldState(): WorldState {
  return {
    monthsAdvanced: 0,
    yearsAdvanced: 0,
    lastStepOrder: [],
    macro: {
      inflationBp: 250,
      interestBp: 900,
      unemploymentBp: 600,
      growthBp: 150,
      energyPriceIndexBp: 10_000,
    },
    technologies: TECHNOLOGY_CONTENT.map((technology) => {
      const replacement = technology.replacedByTechnologyId
        ? TECHNOLOGY_CONTENT.find(
            (candidate) => candidate.id === technology.replacedByTechnologyId,
          )
        : undefined;
      if (technology.replacedByTechnologyId && !replacement)
        throw new Error(
          `missing replacement technology ${technology.replacedByTechnologyId}`,
        );
      return {
        id: technology.runtimeId,
        adoptionBp: technology.initialAdoptionBasisPoints,
        peakAdoptionBp: technology.initialAdoptionBasisPoints,
        obsolete: false,
        ...(replacement ? { replacedBy: replacement.runtimeId } : {}),
      };
    }),
    trends: TREND_CONTENT.map((trend) => ({
      id: trend.runtimeId,
      adoptionBp: trend.initialAdoptionBasisPoints,
    })),
    activeShocks: [],
    weather: {
      kind: "clear",
      severityBp: 0,
      demandBp: 10000,
      transportReliabilityBp: 10000,
      utilityLoadBp: 10000,
      outdoorCapacityBp: 10000,
      incidentRiskBp: 0,
      insurable: false,
    },
    commonCurrency: {
      id: "european-common",
      memberCurrencies: ["DEM"],
      coordinationBp: 2000,
      tradeIntegrationBp: 4000,
      publicSupportBp: 3000,
      active: false,
    },
    regulationPressureBp: 1000,
  };
}
export function readEnergyPriceIndexBp(state: WorldState): number {
  return state.macro.energyPriceIndexBp ?? 10_000;
}

export class WorldSimulation {
  energyPriceIndexBp(state: WorldState): number {
    return state.macro.energyPriceIndexBp ?? 10_000;
  }
  /**
   * `crisisBufferBasisPoints` from the campaign, defaulting to neutral so the
   * world can still be stepped on its own in a test or a scenario. It is the
   * company's resilience, so it lowers how exposed the same balance sheet is
   * rather than changing whether the world has crises at all.
   */
  constructor(
    private readonly streams: RngStreams,
    private readonly crisisBufferBp = 10_000,
    private readonly economicVolatilityBp = 10_000,
    private readonly crisisFrequencyBp = 10_000,
  ) {}
  stepMonth(state: WorldState): WorldState {
    const next = structuredClone(state);
    next.monthsAdvanced++;
    next.weather = generateWeather(
      this.streams.weather,
      Math.min(10_000, 1000 + next.monthsAdvanced * 3),
    );
    next.activeShocks = next.activeShocks
      .map((s) => ({ ...s, remainingMonths: s.remainingMonths - 1 }))
      .filter((s) => s.remainingMonths > 0);
    if (next.monthsAdvanced % 12 === 0) return this.stepYear(next);
    return next;
  }
  stepYear(state: WorldState): WorldState {
    let next = structuredClone(state);
    next.yearsAdvanced++;
    next.lastStepOrder = [...worldStepOrder];
    next.macro = advanceMacro(next.macro, {
      inflationBp:
        200 +
        (this.streams.economy.nextUint32() %
          Math.max(
            1,
            volatilityScaledRange(500, {
              economicVolatilityBasisPoints: this.economicVolatilityBp,
            }),
          )),
      interestBp:
        500 +
        (this.streams.economy.nextUint32() %
          Math.max(
            1,
            volatilityScaledRange(800, {
              economicVolatilityBasisPoints: this.economicVolatilityBp,
            }),
          )),
      unemploymentBp:
        400 +
        (this.streams.economy.nextUint32() %
          Math.max(
            1,
            volatilityScaledRange(500, {
              economicVolatilityBasisPoints: this.economicVolatilityBp,
            }),
          )),
      growthBp:
        -100 +
        (this.streams.economy.nextUint32() %
          Math.max(
            1,
            volatilityScaledRange(500, {
              economicVolatilityBasisPoints: this.economicVolatilityBp,
            }),
          )),
      energyPriceIndexBp:
        8_000 +
        (this.streams.economy.nextUint32() %
          Math.max(
            1,
            volatilityScaledRange(4000, {
              economicVolatilityBasisPoints: this.economicVolatilityBp,
            }),
          )),
    });
    next.regulationPressureBp = Math.min(
      10_000,
      next.regulationPressureBp + Math.floor(next.weather.severityBp / 20),
    );
    const requirements = TECHNOLOGY_REQUIREMENTS;
    const available = new Set(
      next.technologies
        .filter(
          (technology) => technology.adoptionBp >= 500 && !technology.obsolete,
        )
        .map((technology) => technology.id),
    );
    next.technologies = next.technologies.map((tech, index) => {
      if (!canEmerge(requirements[tech.id] ?? [], available)) return tech;
      const replacementAdoptionBp = tech.replacedBy
        ? (next.technologies.find(
            (candidate) => candidate.id === tech.replacedBy,
          )?.adoptionBp ?? 0)
        : 0;
      return {
        ...tech,
        ...advanceLifecycle(
          tech,
          Math.max(
            0,
            Math.min(10_000, 2000 + index * 300 + next.macro.growthBp),
          ),
          replacementAdoptionBp,
        ),
      };
    });
    next.trends = next.trends.map((t) => ({
      ...t,
      adoptionBp: Math.min(
        10_000,
        t.adoptionBp +
          Math.floor(
            (next.technologies.find((x) => x.id === "internet")?.adoptionBp ??
              0) / 10,
          ),
      ),
    }));
    const risk = bufferedCrisisRiskBp(
      crisisRiskBp(
        Math.max(0, next.macro.interestBp * 4),
        3000,
        Math.max(0, next.macro.interestBp * 3),
      ),
      { crisisBufferBasisPoints: this.crisisBufferBp },
    );
    const frequencyRisk = frequencyScaledCrisisRiskBp(risk, {
      crisisFrequencyBasisPoints: this.crisisFrequencyBp,
    });
    const shock =
      this.streams.events.nextUint32() % 10_000 < frequencyRisk
        ? maybeCreateShock(next.yearsAdvanced, risk, 0, "financial", [
            "macro.credit.name",
          ])
        : null;
    if (shock) next.activeShocks.push(shock);
    next.commonCurrency = advanceCommonCurrency({
      ...next.commonCurrency,
      coordinationBp: Math.min(
        10_000,
        next.commonCurrency.coordinationBp + 200,
      ),
      tradeIntegrationBp: Math.min(
        10_000,
        next.commonCurrency.tradeIntegrationBp + 250,
      ),
      publicSupportBp: Math.max(
        0,
        Math.min(
          10_000,
          next.commonCurrency.publicSupportBp + next.macro.growthBp,
        ),
      ),
    });
    return next;
  }
}
