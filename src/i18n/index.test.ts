import { describe, expect, it } from "vitest";
import { createGameI18n, translateGame } from "./index";
import { de } from "./resources/de";
import { en } from "./resources/en";

describe("i18n", () => {
  it("switches semantic keys", async () => {
    const i18n = await createGameI18n("de");
    expect(i18n.t("topbar.cash")).toBe("Bargeld");
    await i18n.changeLanguage("en");
    expect(i18n.t("topbar.cash")).toBe("Cash");
  });
  it("resolves nested keys, interpolation, and missing-key fallback", () => {
    expect(translateGame("de-DE", "topbar.cash")).toBe("Bargeld");
    expect(translateGame("en-GB", "notifications.grouped", { count: 3 })).toBe(
      "3 grouped notifications",
    );
    expect(translateGame("en-GB", "missing.key")).toBe("missing.key");
  });

  it("keeps every management leaf present in both locales", () => {
    expect(Object.keys(en.management).sort()).toEqual(
      Object.keys(de.management).sort(),
    );

    for (const id of [
      "mainView",
      "revenue",
      "marketing",
      "market",
      "campaign",
    ] as const) {
      const key = `management.${id}`;
      expect(translateGame("en-GB", key)).not.toBe(key);
      expect(translateGame("de-DE", key)).not.toBe(key);
    }
  });
});
