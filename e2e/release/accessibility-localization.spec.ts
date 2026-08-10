import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("German and English semantic shells pass serious accessibility checks", async ({
  page,
}) => {
  await page.goto("/?renderer=off");
  for (const locale of ["de-DE", "en-GB"]) {
    await page.getByLabel(/Language|Sprache/).selectOption(locale);
    await expect(
      page.getByRole("main", { name: "Hotel Manager" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Hotel view" }),
    ).toBeVisible();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter(
        ({ impact }) => impact === "critical" || impact === "serious",
      ),
    ).toEqual([]);
  }
});
