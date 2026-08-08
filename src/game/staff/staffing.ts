export type Shift = "morning" | "evening" | "night";

export function hireApplicant(
  applicant: { id: string; role: string; skill: number },
  offer: { shift: Shift; monthlyWageMinor: number },
) {
  if (offer.monthlyWageMinor <= 0) throw new Error("invalid wage");
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
  return staff.filter((s) => !s.absent).reduce((n, s) => n + s.skill, 0);
}
