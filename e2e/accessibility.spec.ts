import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
test("main screen has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/?renderer=off");
  await page.getByLabel(/Language|Sprache/).selectOption("en-GB");
  await expect(page.getByRole("main")).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    ),
  ).toEqual([]);
});
test("management controls are keyboard reachable", async ({ page }) => {
  await page.goto("/?renderer=off");
  await page.getByLabel(/Language|Sprache/).selectOption("en-GB");
  await page.getByRole("tab", { name: "Hotel" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Staff" })).toBeFocused();
});
test("contrast, text scale and reduced motion are applied", async ({
  page,
}) => {
  await page.goto("/?renderer=off");
  await page.getByLabel(/Language|Sprache/).selectOption("en-GB");
  await page.getByLabel("Text size").fill("1.5");
  await page.getByLabel("High contrast").check();
  await page.getByLabel("Reduced motion").check();
  const presentation = page.locator("[data-reduced-motion='true']");
  await expect(presentation).toHaveClass(/high-contrast/);
  await expect(presentation).toHaveCSS("font-size", "24px");
});
