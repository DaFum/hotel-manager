import { describe, expect, it } from "vitest";
import expected from "../../fixtures/release/master-acceptance.json";
import {
  RELEASE_ACCEPTANCE,
  resolveConcreteAutomatedTarget,
  resolveConcreteImplementationTarget,
} from "./acceptanceRegistry";

/**
 * The requirements that carry a human review as well as an automated gate.
 * The list lives here, not in the registry: the test is the specification,
 * and reading the answer out of the code under test would prove nothing.
 */
const REVIEWED = [15, 16, 44, 54];

describe("release acceptance registry", () => {
  it("carries all 54 numbered requirements", () => {
    expect(RELEASE_ACCEPTANCE).toHaveLength(54);
  });

  it("numbers them from one, in order", () => {
    expect(RELEASE_ACCEPTANCE.map(({ id }) => id)).toEqual(
      Array.from({ length: 54 }, (_, index) => index + 1),
    );
  });

  it("matches the recorded master acceptance fixture", () => {
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
  });

  it("cites distinct concrete evidence of the right kind", () => {
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
    }
  });

  it("never proves two requirements with the same pair of files", () => {
    // A shared pair means one of the two requirements has no evidence of its
    // own, whatever the row claims.
    const pairs = RELEASE_ACCEPTANCE.map(
      ({ implementationEvidence, automatedEvidence }) =>
        `${implementationEvidence.join()}|${automatedEvidence.join()}`,
    );
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("attaches reviewed evidence to exactly the reviewed requirements", () => {
    for (const requirement of RELEASE_ACCEPTANCE) {
      if (REVIEWED.includes(requirement.id))
        expect(requirement.reviewedEvidence?.length).toBeGreaterThan(0);
      else expect(requirement.reviewedEvidence).toBeUndefined();
    }
  });
});
