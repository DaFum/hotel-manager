export type Shift = "morning" | "evening" | "night";

function assertSkill(skill: number) {
  if (!Number.isFinite(skill) || skill < 0) throw new Error("invalid skill");
}

export function hireApplicant(
  applicant: { id: string; role: string; skill: number },
  offer: { shift: Shift; monthlyWageMinor: number },
) {
  if (
    !Number.isSafeInteger(offer.monthlyWageMinor) ||
    offer.monthlyWageMinor <= 0
  )
    throw new Error("invalid wage");
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
