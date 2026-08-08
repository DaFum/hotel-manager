import { test, expect } from "@playwright/test";

const statusBar = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Status bar" });

test("operate the 1991 hotel through one monthly close and save load", async ({
  page,
}) => {
  await page.goto("/?seed=424242");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Frankfurt/i,
  );

  await page.getByRole("button", { name: /set single rate/i }).click();
  await page.getByRole("button", { name: "16x", exact: true }).click();

  // A month of simulated time at 16x, then prove the close report appears.
  await expect(
    page.getByRole("dialog", { name: /monthly close/i }),
  ).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(statusBar(page)).toContainText(/DM/);
});

test("restores the saved game date after save and load", async ({ page }) => {
  await page.goto("/?seed=99");
  await page.getByRole("button", { name: "4x", exact: true }).click();
  await expect(statusBar(page)).toContainText(/1991-01-0[2-9]/, {
    timeout: 30_000,
  });

  await page.getByRole("button", { name: /pause/i }).click();
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.waitForTimeout(500);
  const saved = (await statusBar(page).innerText()).match(/1991-\d\d-\d\d/)![0];

  await page.getByRole("button", { name: "16x", exact: true }).click();
  await expect(statusBar(page)).not.toContainText(saved, { timeout: 30_000 });

  await page.getByRole("button", { name: /pause/i }).click();
  await page.getByRole("button", { name: /^load$/i }).click();
  await expect(statusBar(page)).toContainText(saved, { timeout: 30_000 });
});
