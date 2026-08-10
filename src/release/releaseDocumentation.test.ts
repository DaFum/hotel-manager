import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RELEASE_ACCEPTANCE } from "./acceptanceRegistry";
describe("release documentation", () => {
  it("documents all requirements and the failed-gate tag prohibition", () => {
    const trace = readFileSync("docs/release/traceability.md", "utf8");
    const checklist = readFileSync("docs/release/checklist.md", "utf8");
    for (const requirement of RELEASE_ACCEPTANCE) {
      expect(trace).toContain(
        `requirement-${requirement.id}: ${requirement.name}`,
      );
      for (const target of [
        ...requirement.implementationEvidence,
        ...requirement.automatedEvidence,
        ...(requirement.reviewedEvidence ?? []),
      ])
        expect(trace).toContain(target);
    }
    expect(checklist).toContain(
      "Do not create a release tag if any gate fails",
    );
  });
});
