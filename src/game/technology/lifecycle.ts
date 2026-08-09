export interface TechnologyLifecycle {
  adoptionBp: number;
  peakAdoptionBp: number;
  obsolete: boolean;
}

function basisPoints(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000)
    throw new Error(`${label} must be 0..10000 basis points`);
  return value;
}

export function nextAdoptionBp(
  currentBp: number,
  pushBp: number,
  obsolescenceBp = 0,
): number {
  basisPoints(currentBp, "current adoption");
  basisPoints(pushBp, "adoption push");
  basisPoints(obsolescenceBp, "obsolescence");
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
  basisPoints(current.adoptionBp, "current adoption");
  basisPoints(current.peakAdoptionBp, "peak adoption");
  basisPoints(pushBp, "adoption push");
  basisPoints(replacementAdoptionBp, "replacement adoption");
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
