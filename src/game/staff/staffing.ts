export type Shift = "morning" | "evening" | "night";

function assertSkill(skill: number) {
  if (!Number.isFinite(skill) || skill < 0) throw new Error("invalid skill");
}

/**
 * Hires an applicant. When the caller knows what the city labour market is
 * paying, the applicant will not sign below it: a tight market is refused
 * offers, not silently cheaper staff.
 */
export function hireApplicant(
  applicant: { id: string; role: string; skill: number },
  offer: {
    shift: Shift;
    monthlyWageMinor: number;
    /** The going rate for the post this month, in whole Pfennig. */
    marketWageMinor?: number;
  },
) {
  if (
    !Number.isSafeInteger(offer.monthlyWageMinor) ||
    offer.monthlyWageMinor <= 0
  )
    throw new Error("invalid wage");
  if (
    offer.marketWageMinor !== undefined &&
    offer.monthlyWageMinor < offer.marketWageMinor
  )
    throw new Error(
      `offer is below the market wage of ${offer.marketWageMinor}`,
    );
  assertSkill(applicant.skill);
  return {
    ...applicant,
    shift: offer.shift,
    monthlyWageMinor: offer.monthlyWageMinor,
    workload: 0,
    absent: false,
  };
}

export function effectiveCapacity(
  staff: Array<{ skill: number; absent: boolean }>,
) {
  return staff
    .filter((s) => !s.absent)
    .reduce((n, s) => {
      assertSkill(s.skill);
      return n + s.skill;
    }, 0);
}
