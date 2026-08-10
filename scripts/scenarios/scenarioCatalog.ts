export const SCENARIO_CATALOG_VERSION = 1;

export type ScenarioId =
  | "normal-view"
  | "fast-forward"
  | "monthly-close"
  | "dense-facilities"
  | "portfolio"
  | "crisis"
  | "migration-load"
  | "mature-50y";
export interface ScenarioDefinition {
  id: ScenarioId;
  years: number;
  seeds: readonly number[];
  playerHotels: number;
  cities: number;
  competitors: number;
  visibleAgentBudget: 200 | 300 | 500;
  benchmarkMonths?: number;
}

export const SCENARIO_CATALOG: readonly ScenarioDefinition[] = [
  {
    id: "normal-view",
    years: 1,
    seeds: [11, 12, 13],
    playerHotels: 1,
    cities: 1,
    competitors: 3,
    visibleAgentBudget: 300,
    benchmarkMonths: 2,
  },
  {
    id: "fast-forward",
    years: 5,
    seeds: [21, 22, 23],
    playerHotels: 5,
    cities: 3,
    competitors: 8,
    visibleAgentBudget: 200,
    benchmarkMonths: 2,
  },
  {
    id: "monthly-close",
    years: 2,
    seeds: [31, 32, 33],
    playerHotels: 5,
    cities: 3,
    competitors: 8,
    visibleAgentBudget: 300,
    benchmarkMonths: 2,
  },
  {
    id: "dense-facilities",
    years: 2,
    seeds: [41, 42, 43],
    playerHotels: 2,
    cities: 1,
    competitors: 5,
    visibleAgentBudget: 500,
    benchmarkMonths: 2,
  },
  {
    id: "portfolio",
    years: 10,
    seeds: [51, 52, 53],
    playerHotels: 60,
    cities: 25,
    competitors: 40,
    visibleAgentBudget: 300,
    benchmarkMonths: 2,
  },
  {
    id: "crisis",
    years: 10,
    seeds: [61, 62, 63],
    playerHotels: 20,
    cities: 10,
    competitors: 40,
    visibleAgentBudget: 200,
    benchmarkMonths: 2,
  },
  {
    id: "migration-load",
    years: 5,
    seeds: [71, 72, 73],
    playerHotels: 10,
    cities: 5,
    competitors: 15,
    visibleAgentBudget: 300,
    benchmarkMonths: 2,
  },
  {
    id: "mature-50y",
    years: 50,
    seeds: [424242, 8675309, 19910101],
    playerHotels: 60,
    cities: 25,
    competitors: 40,
    visibleAgentBudget: 500,
  },
] as const;

const SCENARIO_ALIASES: Readonly<Record<string, ScenarioId>> = {
  baseline: "normal-view",
};

export function scenarioDefinition(id: string): ScenarioDefinition {
  const resolvedId = SCENARIO_ALIASES[id] ?? id;
  const found = SCENARIO_CATALOG.find((scenario) => scenario.id === resolvedId);
  if (!found) throw new Error(`unknown scenario ${id}`);
  return found;
}
