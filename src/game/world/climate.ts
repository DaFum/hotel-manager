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
  if (
    !outcome.insurable ||
    !Number.isSafeInteger(lossMinor) ||
    lossMinor < 0 ||
    !Number.isSafeInteger(deductibleMinor) ||
    deductibleMinor < 0 ||
    !Number.isSafeInteger(coverageBp) ||
    coverageBp < 0 ||
    coverageBp > 10_000 ||
    lossMinor <= deductibleMinor
  )
    return 0;
  const coveredLoss = lossMinor - deductibleMinor;
  const quotient = Math.floor(coveredLoss / 10_000);
  const remainder = coveredLoss % 10_000;
  const payout =
    quotient * coverageBp + Math.round((remainder * coverageBp) / 10_000);
  return Number.isSafeInteger(payout) ? payout : 0;
}
