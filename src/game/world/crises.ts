export interface CrisisCause {
  id: string;
  contributionBp: number;
}
export function crisisRiskBp(
  leverageBp: number,
  overcapacityBp: number,
  refinanceStressBp: number,
): number {
  return Math.max(
    0,
    Math.min(
      10_000,
      Math.round(
        leverageBp * 0.4 + overcapacityBp * 0.25 + refinanceStressBp * 0.35,
      ),
    ),
  );
}
export function crisisCauses(input: {
  leverageBp: number;
  overcapacityBp: number;
  refinanceStressBp: number;
}): CrisisCause[] {
  return [
    { id: "leverage", contributionBp: Math.round(input.leverageBp * 0.4) },
    {
      id: "overcapacity",
      contributionBp: Math.round(input.overcapacityBp * 0.25),
    },
    {
      id: "refinance",
      contributionBp: Math.round(input.refinanceStressBp * 0.35),
    },
  ].sort(
    (a, b) => b.contributionBp - a.contributionBp || a.id.localeCompare(b.id),
  );
}
