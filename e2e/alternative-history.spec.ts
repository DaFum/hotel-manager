import { expect, test } from "@playwright/test";
test("derives the management era from simulated adoption", async ({ page }) => {
  await page.goto("/?seed=9001&renderer=off");
  await expect(page.getByRole("heading", { name: /Hotel/ })).toBeVisible();
  const shell = page.locator("[data-era-digital]");
  await expect(shell).toHaveAttribute("data-era-digital", "false");
  await expect(shell).toHaveAttribute("data-era-smartphone", "false");
});
