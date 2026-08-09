export interface PrestigeState {
  personal: number;
  company: number;
  causes: string[];
}
export function financingAccessBonusBasisPoints(prestige: number): number {
  return Math.trunc(Math.max(0, Math.min(100, prestige)) * 10);
}
export function propertyAccessScore(prestige: number): number {
  return Math.max(0, Math.min(100, Math.trunc(prestige)));
}
