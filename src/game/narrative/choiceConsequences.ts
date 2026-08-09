import { assertCount, assertMinor } from "../domain/units";

/**
 * Closing a loss-making house frees cash and costs jobs and local standing.
 * The result is deliberately three plain consequences and no fourth number:
 * there is no good/evil score to optimise, only trade-offs to weigh.
 */
export function consequencesForClosure(input: {
  employees: number;
  monthlyLossMinor: number;
}) {
  assertCount(input.employees, "employees affected by a closure");
  assertMinor(input.monthlyLossMinor, "monthly loss");
  return {
    monthlyCashImprovementMinor: Math.max(0, input.monthlyLossMinor),
    jobsLost: input.employees,
    localReputationDelta: -12,
  };
}
