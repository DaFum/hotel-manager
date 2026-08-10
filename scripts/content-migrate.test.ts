import { describe, expect, it } from "vitest";
import corePack from "../src/content/core/core-pack.json";
import { migrateContentPack } from "./content-migrate";

describe("content-migrate", () => {
  it("validates source and migrated packs", () => {
    const source = { ...corePack, contentVersion: "plan-06-v6" };
    expect(migrateContentPack(source).contentVersion).toBe("1991.1");
    expect(() =>
      migrateContentPack({ ...source, entries: { broken: {} } }),
    ).toThrow();
  });
});
