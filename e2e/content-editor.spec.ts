import { test, expect } from "@playwright/test";
test("content editor blocks an invalid cross reference", async ({ page }) => {
  await page.goto("/tools/content-editor");
  await page.getByRole("button", { name: "Add facility" }).click();
  await page.getByLabel("Required technology").fill("tech.missing");
  await expect(page.getByText(/facility.draft.*tech.missing/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export pack" }),
  ).toBeDisabled();
});
