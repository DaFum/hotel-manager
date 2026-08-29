import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { closeDrawer, openDrawer, selectLocale } from "./management";
test("main screen has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/?renderer=off");
  await selectLocale(page, "en-GB");
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
  await selectLocale(page, "en-GB");
  await page.getByRole("tab", { name: "Hotel" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Guests" })).toBeFocused();
});
test("contrast, text scale and reduced motion are applied", async ({
  page,
}) => {
  await page.goto("/?renderer=off");
  await selectLocale(page, "en-GB");
  // The presentation controls live in the settings drawer; keep it open while
  // they are exercised.
  await openDrawer(page, "settings");
  await page.getByLabel("Text size").fill("1.5");
  await page.getByLabel("High contrast").check();
  await page.getByLabel("Reduced motion").check();
  await closeDrawer(page);
  const presentation = page.locator("[data-reduced-motion='true']");
  await expect(presentation).toHaveClass(/high-contrast/);
  await expect(presentation).toHaveCSS("font-size", "24px");
});
