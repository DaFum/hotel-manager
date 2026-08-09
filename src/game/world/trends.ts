export interface SocietalTrend {
  id: string;
  adoptionBp: number;
  segmentAffinityBp: Readonly<Record<string, number>>;
}
export function segmentDemandBp(globalBp: number, affinityBp: number): number {
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
  for (const trend of [...trends].sort((a, b) => a.id.localeCompare(b.id))) {
    const affinity = trend.segmentAffinityBp[segmentId] ?? 10_000;
    const effect = Math.round(
      ((affinity - 10_000) * trend.adoptionBp) / 10_000,
    );
    demandBp += effect;
    if (effect !== 0) causes.push(`${trend.id}:${effect}`);
  }
  return { demandBp: Math.max(5_000, Math.min(15_000, demandBp)), causes };
}
