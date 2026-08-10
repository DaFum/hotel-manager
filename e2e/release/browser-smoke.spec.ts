import { expect, test } from "@playwright/test";

test("boots, pauses, and exposes the hotel in every release browser", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("main", { name: "Hotel Manager" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Hotel Manager|Frankfurt/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toBeEnabled();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeEnabled();
});
