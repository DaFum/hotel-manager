export function consequencesForClosure(input: {
  employees: number;
  monthlyLossMinor: number;
}) {
  return {
    monthlyCashImprovementMinor: Math.max(0, input.monthlyLossMinor),
    jobsLost: Math.max(0, input.employees),
    localReputationDelta: -12,
  };
}
