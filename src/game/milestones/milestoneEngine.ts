export interface MilestoneFacts {
  annualProfitMinor: number;
  hotelCount: number;
  year: number;
  achieved: readonly string[];
}
export function detectMilestones(input: MilestoneFacts): string[] {
  const found: string[] = [];
  const add = (id: string, yes: boolean) => {
    if (yes && !input.achieved.includes(id)) found.push(id);
  };
  add("first-profitable-year", input.annualProfitMinor > 0);
  add("second-hotel", input.hotelCount >= 2);
  add("career-2026", input.year >= 2026);
  return found;
}
