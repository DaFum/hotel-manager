import { expect, it } from "vitest";
import { migrateToCurrent } from "./migrateToCurrent";
import { MIGRATABLE_SAVE_VERSIONS } from "./saveVersions";

it("does not migrate pre-release development saves", () => {
  const obsolete15 = { saveVersion: 15, state: {} } as any;
  const obsolete16 = { saveVersion: 16, state: {} } as any;

  expect(migrateToCurrent(obsolete15)).toBe(obsolete15);
  expect(migrateToCurrent(obsolete16)).toBe(obsolete16);
  expect(MIGRATABLE_SAVE_VERSIONS).toEqual([]);
});
