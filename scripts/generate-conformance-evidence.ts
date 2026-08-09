import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PLANS_01_03_CONFORMANCE,
  type ConformanceRow,
} from "../src/release/plans0103Conformance";

export const EVIDENCE_PATH =
  "docs/superpowers/plans/evidence/01-03-conformance.md";

/**
 * Renders the readable projection of the conformance registry.
 *
 * The registry is the authority; this file exists so a human can read it. It
 * is generated rather than maintained by hand so the two cannot drift, and the
 * registry test regenerates it and compares, so a stale copy fails the suite
 * instead of quietly presenting wrong evidence.
 */
export function renderEvidence(
  rows: readonly ConformanceRow[] = PLANS_01_03_CONFORMANCE,
): string {
  const byTask = new Map<number, ConformanceRow[]>();
  for (const row of rows) {
    const list = byTask.get(row.task) ?? [];
    list.push(row);
    byTask.set(row.task, list);
  }

  const out: string[] = [
    "# Plans 01-03 conformance evidence",
    "",
    "Generated from `src/release/plans0103Conformance.ts` by",
    "`scripts/generate-conformance-evidence.ts`. Do not edit by hand: the registry test",
    "regenerates this file and fails if it has drifted.",
    "",
    "A row may only read `verified` when the executable file it names exists and contains",
    "the exact assertion title it claims. The registry test checks that on every run, so a",
    "deleted or renamed test cannot leave a claim standing.",
    "",
  ];

  for (const task of [...byTask.keys()].sort((a, b) => a - b)) {
    out.push(`## Task ${task}`, "");
    out.push(
      "| Acceptance item | MASTER | Implementation | Evidence | Status |",
    );
    out.push("| --- | --- | --- | --- | --- |");
    for (const row of byTask.get(task)!)
      out.push(
        `| \`${row.id}\`<br>${row.claim} | ${row.masterSection} | \`${row.implementationPath}\` | \`${row.evidence.path}\`<br>_${row.evidence.assertion}_ | ${row.status} |`,
      );
    out.push("");
  }
  return out.join("\n");
}

// Running the script writes the file; importing it only renders.
if (process.argv[1]?.endsWith("generate-conformance-evidence.ts")) {
  const path = resolve(__dirname, "..", EVIDENCE_PATH);
  writeFileSync(path, renderEvidence());
  process.stdout.write(`wrote ${EVIDENCE_PATH}\n`);
}
