import { compareIds } from "../domain/ids";

export interface TechnologyStandard {
  id: string;
  hotelAdoptionBp: number;
  guestAdoptionBp: number;
  compatibleWith: readonly string[];
}
export function networkValueBp(hotelBp: number, guestBp: number): number {
  if (
    ![hotelBp, guestBp].every(
      (value) => Number.isSafeInteger(value) && value >= 0 && value <= 10_000,
    )
  )
    throw new Error("network participation must be 0..10000 basis points");
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
      compareIds(a.id, b.id),
  )[0];
}
