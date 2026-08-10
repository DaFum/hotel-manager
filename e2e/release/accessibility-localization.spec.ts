import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The accessible names, per locale. Asserting the German names is the point:
 * an English shell behind a German language setting would otherwise pass a
 * localization gate on the strength of its landmarks alone.
 */
const LANDMARKS = {
  "de-DE": { main: "Hotelverwaltung", region: "Hotelstatus" },
  "en-GB": { main: "Hotel management", region: "Hotel status" },
} as const;

test("German and English semantic shells pass serious accessibility checks", async ({
  page,
}) => {
  await page.goto("/?renderer=off");
  for (const [locale, names] of Object.entries(LANDMARKS)) {
    await page.getByLabel(/Language|Sprache/).selectOption(locale);
    await expect(page.getByRole("main", { name: names.main })).toBeVisible();
    await expect(
      page.getByRole("region", { name: names.region }).first(),
    ).toBeVisible();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter(
        ({ impact }) => impact === "critical" || impact === "serious",
      ),
    ).toEqual([]);
  }
});
