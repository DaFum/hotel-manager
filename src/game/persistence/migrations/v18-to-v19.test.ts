import { expect, it } from "vitest";
import { migrateV18ToV19 } from "./v18-to-v19";

it("migrates v18 state to v19 by adding jurisdictionId and compliance section", () => {
  const v18Save = {
    saveVersion: 18,
    contentVersion: "1991.1",
    protocolVersion: 6,
    rngState: {} as any,
    state: {
      hotel: { id: "h1", name: "Mainblick", cityId: "c1", rooms: [] },
    },
  };

  const migrated = migrateV18ToV19(v18Save);
  expect(migrated.saveVersion).toBe(19);
  expect((migrated.state as any).hotel.jurisdictionId).toBe("de.he.frankfurt");
  expect((migrated.state as any).compliance).toEqual({
    rules: {},
    activeRestrictions: {},
    activeClosures: {},
  });
});

it("handles null or invalid save.state gracefully during v18 to v19 migration", () => {
  const nullStateSave = {
    saveVersion: 18,
    contentVersion: "1991.1",
    protocolVersion: 6,
    rngState: {} as any,
    state: null as any,
  };

  const migrated = migrateV18ToV19(nullStateSave);
  expect(migrated.saveVersion).toBe(19);
  expect(migrated.state).toBeNull();
});
