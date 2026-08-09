import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONFORMANCE_STATUSES,
  PLANS_01_03_CONFORMANCE,
  REQUIRED_ACCEPTANCE_IDS,
  conformanceRow,
  unverifiedRows,
  type ConformanceRow,
} from "./plans0103Conformance";
import {
  EVIDENCE_PATH,
  renderEvidence,
} from "../../scripts/generate-conformance-evidence";

const REPO_ROOT = resolve(__dirname, "../..");

/** Words that describe an intention rather than a behaviour. */
const PLACEHOLDER =
  /\b(tbd|todo|tbc|fixme|xxx|placeholder|n\/a|various|misc)\b/i;

/** A glob stands for "some file somewhere", which is not named evidence. */
const GLOB = /[*?]|\{.*\}/;

/**
 * Runtime behaviour has to be proven by something that executes. A markdown
 * file can describe a contract; it cannot demonstrate one.
 */
const EXECUTABLE_EVIDENCE =
  /^(src\/.*\.test\.tsx?|e2e\/.*\.spec\.ts|scripts\/.*\.ts)$/;

function rows(): readonly ConformanceRow[] {
  return PLANS_01_03_CONFORMANCE;
}

describe("plans 01-03 conformance registry", () => {
  it("carries exactly one row for every declared acceptance item", () => {
    const ids = rows().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...REQUIRED_ACCEPTANCE_IDS].sort());
  });

  it("resolves a row by id and refuses an unknown one", () => {
    expect(conformanceRow(REQUIRED_ACCEPTANCE_IDS[0]).id).toBe(
      REQUIRED_ACCEPTANCE_IDS[0],
    );
    expect(() => conformanceRow("no.such.row")).toThrow(/unknown/i);
  });

  it("names a MASTER section, an owning task and a concrete claim", () => {
    for (const row of rows()) {
      expect(row.masterSection, row.id).toMatch(/^MASTER ch\. [\d, .+-]+$/);
      expect(row.task, row.id).toBeGreaterThanOrEqual(1);
      expect(row.task, row.id).toBeLessThanOrEqual(12);
      expect(row.claim.length, row.id).toBeGreaterThanOrEqual(24);
      expect(row.claim, row.id).not.toMatch(PLACEHOLDER);
      expect(CONFORMANCE_STATUSES, row.id).toContain(row.status);
    }
  });

  it("points every row at a concrete implementation path, never a glob", () => {
    for (const row of rows()) {
      expect(row.implementationPath, row.id).not.toMatch(GLOB);
      expect(row.implementationPath, row.id).not.toMatch(PLACEHOLDER);
      expect(row.implementationPath, row.id).toMatch(
        /^(src|e2e|scripts|fixtures)\//,
      );
    }
  });

  it("requires executable evidence with a named assertion", () => {
    for (const row of rows()) {
      expect(row.evidence.path, row.id).not.toMatch(GLOB);
      expect(row.evidence.path, row.id).toMatch(EXECUTABLE_EVIDENCE);
      // Documentation cannot stand in for runtime evidence.
      expect(row.evidence.path, row.id).not.toMatch(/^docs\//);
      expect(row.evidence.path, row.id).not.toMatch(/\.mdx?$/);
      expect(row.evidence.assertion, row.id).not.toMatch(GLOB);
      expect(row.evidence.assertion, row.id).not.toMatch(PLACEHOLDER);
      // A named assertion is a sentence, not a file name or a bare word.
      expect(row.evidence.assertion.length, row.id).toBeGreaterThanOrEqual(12);
      expect(row.evidence.assertion.trim(), row.id).toBe(
        row.evidence.assertion,
      );
    }
  });

  it("proves a verified row by the file and assertion it names", () => {
    for (const row of rows()) {
      if (row.status !== "verified") continue;
      const implementation = resolve(REPO_ROOT, row.implementationPath);
      expect(
        existsSync(implementation),
        `${row.id}: ${row.implementationPath}`,
      ).toBe(true);
      const evidence = resolve(REPO_ROOT, row.evidence.path);
      expect(existsSync(evidence), `${row.id}: ${row.evidence.path}`).toBe(
        true,
      );
      // The named assertion has to actually be in the file that claims it, so a
      // renamed or deleted test cannot leave a row silently "verified".
      expect(readFileSync(evidence, "utf8"), `${row.id}: assertion`).toContain(
        row.evidence.assertion,
      );
    }
  });

  it("keeps the readable evidence file in step with the registry", () => {
    const path = resolve(REPO_ROOT, EVIDENCE_PATH);
    expect(existsSync(path), EVIDENCE_PATH).toBe(true);
    // Regenerated and compared, so the projection cannot drift from the
    // registry and present a claim, a path or a status that is no longer true.
    expect(readFileSync(path, "utf8")).toBe(renderEvidence());
  });

  it("reports every row that is not yet verified", () => {
    const outstanding = unverifiedRows().map((r) => r.id);
    for (const row of rows())
      expect(outstanding.includes(row.id), row.id).toBe(
        row.status !== "verified",
      );
  });
});
