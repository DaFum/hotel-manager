import { expect, test } from "@playwright/test";
import { openDrawer, openManagementArea, selectLocale } from "./management";
test("locale switch preserves authoritative cash", async ({ page }) => {
  await page.goto("/?renderer=off");
  await openManagementArea(page, "finance");
  const cash = page.getByTestId("cash-value");
  const before = await cash.getAttribute("data-minor");
  await selectLocale(page, "en-GB");
  await expect(cash).toHaveAttribute("data-minor", before!);
  // Scoped to the command bar: "Cash" is also a row in the balance sheet.
  await expect(
    page.getByLabel("Status bar").getByText("Cash", { exact: true }),
  ).toBeVisible();
  await openDrawer(page, "saves");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Saves committed")).toContainText("1");
  await selectLocale(page, "de-DE");
  await openDrawer(page, "saves");
  await page.getByRole("button", { name: "Laden", exact: true }).click();
  // The loaded save carries the language it was written with.
  await openDrawer(page, "settings");
  await expect(page.getByLabel(/Language|Sprache/)).toHaveValue("en-GB");
});
