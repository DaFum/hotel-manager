import { describe, expect, it } from "vitest";
import { consequencesForClosure } from "./choiceConsequences";
describe("choices", () => {
  it("has stakeholders but no morality meter", () =>
    expect(
      consequencesForClosure({ employees: 40, monthlyLossMinor: 8000000 }),
    ).toEqual({
      monthlyCashImprovementMinor: 8000000,
      jobsLost: 40,
      localReputationDelta: -12,
    }));
});
