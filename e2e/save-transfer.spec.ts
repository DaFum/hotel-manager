import { test, expect } from "@playwright/test";
test("save transfer exposes validated file boundaries", async ({ page }) => {
  await page.goto("/?renderer=off");
  await expect(
    page.getByRole("region", { name: "Save transfer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export save file" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Import save file")).toHaveAttribute(
    "accept",
    "application/json",
  );
});
