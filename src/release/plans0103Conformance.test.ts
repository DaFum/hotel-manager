import { expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  REQUIRED_ACCEPTANCE_IDS,
  REVENUE_CONFORMANCE,
} from "./plans0103Conformance";

it("keeps concrete executable revenue and distribution conformance evidence", () => {
  expect(REVENUE_CONFORMANCE.map((row) => row.id)).toEqual(
    REQUIRED_ACCEPTANCE_IDS,
  );
  for (const row of REVENUE_CONFORMANCE) {
    expect(existsSync(row.implementationPath)).toBe(true);
    expect(existsSync(row.evidence.path)).toBe(true);
    expect(readFileSync(row.evidence.path, "utf8")).toContain(
      row.evidence.assertion,
    );
  }
});
