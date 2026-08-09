import { compareIds } from "../domain/ids";

export interface SocietalTrend {
  id: string;
  adoptionBp: number;
  segmentAffinityBp: Readonly<Record<string, number>>;
}

function boundedBasisPoints(
  value: number,
  label: string,
  maximum: number,
): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum)
    throw new Error(`${label} must be 0..${maximum} basis points`);
  return value;
}

export function segmentDemandBp(globalBp: number, affinityBp: number): number {
  boundedBasisPoints(globalBp, "global adoption", 10_000);
  boundedBasisPoints(affinityBp, "segment affinity", 20_000);
  return Math.max(
    0,
    Math.min(15_000, Math.round((globalBp * affinityBp) / 10_000)),
  );
}

export function trendDemandForSegment(
  trends: readonly SocietalTrend[],
  segmentId: string,
): { demandBp: number; causes: string[] } {
  let demandBp = 10_000;
  const causes: string[] = [];
  for (const trend of [...trends].sort((a, b) => compareIds(a.id, b.id))) {
    boundedBasisPoints(trend.adoptionBp, `${trend.id} adoption`, 10_000);
    const affinity = trend.segmentAffinityBp[segmentId] ?? 10_000;
    boundedBasisPoints(affinity, `${trend.id} affinity`, 20_000);
    const effect = Math.round(
      ((affinity - 10_000) * trend.adoptionBp) / 10_000,
    );
    demandBp += effect;
    if (effect !== 0) causes.push(`${trend.id}:${effect}`);
  }
  return { demandBp: Math.max(5_000, Math.min(15_000, demandBp)), causes };
}
