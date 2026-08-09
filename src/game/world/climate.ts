import type { XorShift32 } from "../domain/rng";
export type WeatherKind = "clear" | "rain" | "storm" | "heat" | "cold";
export interface WeatherOutcome {
  kind: WeatherKind;
  severityBp: number;
  demandBp: number;
  transportReliabilityBp: number;
  utilityLoadBp: number;
  outdoorCapacityBp: number;
  incidentRiskBp: number;
  insurable: boolean;
}
export function generateWeather(
  rng: XorShift32,
  climateRiskBp: number,
): WeatherOutcome {
  const roll = rng.nextUint32() % 10_000;
  const extreme = roll < Math.floor(climateRiskBp / 10);
  const kind: WeatherKind = extreme
    ? roll % 2 === 0
      ? "storm"
      : "heat"
    : roll < 2500
      ? "rain"
      : roll > 9000
        ? "cold"
        : "clear";
  const severityBp = kind === "clear" ? 0 : extreme ? 7000 : 2500;
  return {
    kind,
    severityBp,
    demandBp: 10_000 - Math.floor(severityBp / 5),
    transportReliabilityBp: 10_000 - Math.floor(severityBp / 2),
    utilityLoadBp: 10_000 + Math.floor(severityBp / 2),
    outdoorCapacityBp: 10_000 - severityBp,
    incidentRiskBp: Math.floor(severityBp / 3),
    insurable: extreme,
  };
}
export function weatherInsurancePayout(
  lossMinor: number,
  outcome: WeatherOutcome,
  coverageBp: number,
  deductibleMinor: number,
): number {
  if (!outcome.insurable || lossMinor <= deductibleMinor) return 0;
  return Math.round(
    ((lossMinor - deductibleMinor) *
      Math.max(0, Math.min(10_000, coverageBp))) /
      10_000,
  );
}
