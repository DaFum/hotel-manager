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
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Saves committed")).toContainText("1");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export save file" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("save export produced no file");
  await page.getByLabel("Import save file").setInputFiles(path);
  await expect(
    page.getByRole("status").filter({ hasText: "Save imported." }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText("quick save", { exact: true })).toBeVisible();
});
