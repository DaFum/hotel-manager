import { test, expect, type Page } from "@playwright/test";

/**
 * Saves and the transfer panel live in a desk drawer behind the command bar
 * rather than inline under the hotel, so this walk opens the drawer to reach
 * them — and commits the quick save from the command bar first, while the
 * drawer's scrim is not over it.
 */
function openSaves(page: Page) {
  return page.getByRole("button", { name: /Spielstände|Saved games/ }).click();
}

test("save transfer exposes validated file boundaries", async ({ page }) => {
  await page.goto("/?renderer=off");

  // The command bar speaks the player's language; this walk stays in German.
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByLabel("Saves committed")).toContainText("1");

  await openSaves(page);
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
  await openSaves(page);
  await expect(page.getByText("quick save", { exact: true })).toBeVisible();
});
