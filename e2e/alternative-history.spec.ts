import { expect, test } from "@playwright/test";
import { openManagementArea } from "./management";
test("derives the management era from simulated adoption", async ({ page }) => {
  await page.goto("/?seed=9001&renderer=off");
  await expect(
    page.getByRole("heading", { level: 1, name: /Hotel/ }),
  ).toBeVisible();
  const shell = page.locator("[data-era-digital]");
  await expect(shell).toHaveAttribute("data-era-digital", "false");
  await expect(shell).toHaveAttribute("data-era-smartphone", "false");
  await openManagementArea(page, "hotel");
  await page
    .getByRole("button", { name: "Personal Computer einführen" })
    .click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");
  await expect(
    page.getByRole("button", { name: "Personal Computer wird eingeführt" }),
  ).toBeDisabled();
});
