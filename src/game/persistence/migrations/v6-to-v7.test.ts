import { describe, expect, it } from "vitest";
import { migrateV6ToV7 } from "./v6-to-v7";
describe("v6 to v7 migration", () => {
  it("adds presentation preferences", () => {
    const next = migrateV6ToV7({ saveVersion: 6 });
    expect(next.saveVersion).toBe(7);
    expect(next.preferences.locale).toBe("de-DE");
    expect(next.preferences.accessibility.reducedMotion).toBe(false);
  });
  it("repairs malformed partial preferences instead of trusting them", () => {
    const next = migrateV6ToV7({
      saveVersion: 6,
      preferences: { locale: "fr", audio: { master: 7 } },
    });
    expect(next.preferences.locale).toBe("de-DE");
    expect(next.preferences.audio.master).toBe(1);
    expect(next.preferences.notifications.groupRepeated).toBe(true);
  });
});
