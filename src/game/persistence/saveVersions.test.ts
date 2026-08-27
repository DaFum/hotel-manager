import { expect, it } from "vitest";
import { migrateToCurrent } from "./migrateToCurrent";
import { MIGRATABLE_SAVE_VERSIONS } from "./saveVersions";

it("does not migrate pre-release development saves", () => {
  const obsolete = { saveVersion: 15, state: {} } as any;

  expect(migrateToCurrent(obsolete)).toBe(obsolete);
  expect(MIGRATABLE_SAVE_VERSIONS).toEqual([]);
});
