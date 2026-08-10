import { describe, expect, it } from "vitest";
import { createGameI18n } from "./index";
describe("i18n", () => {
  it("switches semantic keys", async () => {
    const i18n = createGameI18n("de");
    await i18n.init();
    expect(i18n.t("topbar.cash")).toBe("Bargeld");
    await i18n.changeLanguage("en");
    expect(i18n.t("topbar.cash")).toBe("Cash");
  });
});
