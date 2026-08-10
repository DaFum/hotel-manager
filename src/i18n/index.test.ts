import { describe, expect, it } from "vitest";
import { createGameI18n } from "./index";
describe("i18n", () => {
  it("switches semantic keys", async () => {
    const i18n = await createGameI18n("de");
    expect(i18n.t("topbar.cash")).toBe("Bargeld");
    await i18n.changeLanguage("en");
    expect(i18n.t("topbar.cash")).toBe("Cash");
  });
});
