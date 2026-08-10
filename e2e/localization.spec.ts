import { expect, test } from "@playwright/test";
test("locale switch preserves authoritative cash", async ({ page }) => {
  await page.goto("/?renderer=off");
  const cash = page.getByTestId("cash-value");
  const before = await cash.getAttribute("data-minor");
  const language = page.getByLabel(/Language|Sprache/);
  await language.selectOption("en-GB");
  await expect(cash).toHaveAttribute("data-minor", before!);
  await expect(page.getByText("Cash", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Saves committed")).toContainText("1");
  await language.selectOption("de-DE");
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByLabel(/Language|Sprache/)).toHaveValue("en-GB");
});
