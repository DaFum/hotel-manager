import { describe, expect, it } from "vitest";
import expected from "../../fixtures/release/master-acceptance.json";
import {
  RELEASE_ACCEPTANCE,
  resolveConcreteAutomatedTarget,
  resolveConcreteImplementationTarget,
} from "./acceptanceRegistry";

describe("release acceptance registry", () => {
  it("contains all numbered requirements with distinct concrete evidence", () => {
    expect(RELEASE_ACCEPTANCE).toHaveLength(54);
    expect(RELEASE_ACCEPTANCE.map(({ id }) => id)).toEqual(
      Array.from({ length: 54 }, (_, index) => index + 1),
    );
    expect(
      RELEASE_ACCEPTANCE.map(
        ({
          id,
          name,
          masterChapters,
          implementationEvidence,
          automatedEvidence,
        }) => ({
          id,
          name,
          masterChapters,
          implementationEvidence,
          automatedEvidence,
        }),
      ),
    ).toEqual(expected);
    for (const requirement of RELEASE_ACCEPTANCE) {
      expect(
        requirement.implementationEvidence.filter((target) =>
          requirement.automatedEvidence.includes(target),
        ),
      ).toEqual([]);
      expect(
        requirement.implementationEvidence.every(
          resolveConcreteImplementationTarget,
        ),
      ).toBe(true);
      expect(
        requirement.automatedEvidence.every(resolveConcreteAutomatedTarget),
      ).toBe(true);
      if ([15, 16, 44, 54].includes(requirement.id))
        expect(requirement.reviewedEvidence?.length).toBeGreaterThan(0);
    }
  });
});
