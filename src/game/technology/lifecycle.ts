export interface TechnologyLifecycle {
  adoptionBp: number;
  peakAdoptionBp: number;
  obsolete: boolean;
}

export function nextAdoptionBp(
  currentBp: number,
  pushBp: number,
  obsolescenceBp = 0,
): number {
  if (!Number.isSafeInteger(currentBp) || !Number.isSafeInteger(pushBp))
    throw new Error("adoption inputs must be safe integers");
  const organic = Math.round(((10_000 - currentBp) * 300) / 10_000);
  return Math.max(
    0,
    Math.min(
      10_000,
      currentBp + organic + Math.trunc(pushBp / 100) - obsolescenceBp,
    ),
  );
}

export function advanceLifecycle(
  current: TechnologyLifecycle,
  pushBp: number,
  replacementAdoptionBp: number,
): TechnologyLifecycle {
  const obsolete = current.obsolete || replacementAdoptionBp >= 6_500;
  const adoptionBp = nextAdoptionBp(
    current.adoptionBp,
    pushBp,
    obsolete ? 120 : 0,
  );
  return {
    adoptionBp,
    peakAdoptionBp: Math.max(current.peakAdoptionBp, adoptionBp),
    obsolete,
  };
}
