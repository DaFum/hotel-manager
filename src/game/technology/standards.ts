export interface TechnologyStandard {
  id: string;
  hotelAdoptionBp: number;
  guestAdoptionBp: number;
  compatibleWith: readonly string[];
}
export function networkValueBp(hotelBp: number, guestBp: number): number {
  if (![hotelBp, guestBp].every(Number.isSafeInteger))
    throw new Error("integer basis points required");
  return Math.max(
    0,
    Math.min(
      10_000,
      Math.round(Math.sqrt(Math.max(0, hotelBp) * Math.max(0, guestBp))),
    ),
  );
}
export function leadingStandard(
  standards: readonly TechnologyStandard[],
): TechnologyStandard | undefined {
  return [...standards].sort(
    (a, b) =>
      networkValueBp(b.hotelAdoptionBp, b.guestAdoptionBp) -
        networkValueBp(a.hotelAdoptionBp, a.guestAdoptionBp) ||
      a.id.localeCompare(b.id),
  )[0];
}
