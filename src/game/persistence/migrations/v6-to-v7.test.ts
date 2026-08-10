import { describe, expect, it } from "vitest";
import { migrateV6ToV7 } from "./v6-to-v7";
import frozenV7 from "../fixtures/save-v7.json";
import { validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";
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
  it("rejects malformed preferences on a current v7 envelope", () => {
    const current = structuredClone(frozenV7) as unknown as SaveEnvelope;
    current.preferences = { locale: "fr-FR" } as never;
    expect(validateEnvelope(current)).toContain(
      "the save has malformed player presentation preferences",
    );
  });
});
