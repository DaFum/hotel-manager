import { describe, expect, it } from "vitest";
import {
  normalizeAccessibilityPreferences,
  normalizePlayerPreferences,
} from "./playerPreferences";
describe("accessibility preferences", () => {
  it("normalizes presentation values", () => {
    expect(
      normalizeAccessibilityPreferences({
        textScale: 3,
        highContrast: true,
        reducedMotion: true,
      }),
    ).toEqual({ textScale: 1.5, highContrast: true, reducedMotion: true });
  });
});
it("normalizes an untrusted persisted preference section", () => {
  const result = normalizePlayerPreferences({
    locale: "fr",
    accessibility: { textScale: Infinity },
    notifications: { severities: ["critical", "bogus"] },
    audio: { master: 4, warnings: -1 },
  });
  expect(result.locale).toBe("de-DE");
  expect(result.accessibility.textScale).toBe(1);
  expect(result.notifications.severities).toEqual(["critical"]);
  expect(result.audio.master).toBe(1);
  expect(result.audio.warnings).toBe(0);
  expect(
    normalizePlayerPreferences({
      tutorialCompleted: ["unknown", "hire-housekeeping"],
    }).tutorialCompleted,
  ).toEqual([]);
});
