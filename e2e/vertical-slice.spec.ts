import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openManagementArea, selectLocale } from "./management";

const statusBar = (page: Page) =>
  page.getByRole("region", { name: /Status bar|Statusleiste/ });
const savesCommitted = (page: Page) =>
  page.getByLabel(/^(Saves committed|Gespeicherte Spielstände)$/);

test("operate the 1991 hotel through one monthly close and save load", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  await selectLocale(page, "en-GB");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Frankfurt/i,
  );

  // The rate command must visibly land before the month runs.
  await openManagementArea(page, "revenue");
  const singleRateCell = page
    .getByRole("region", { name: "Revenue", exact: true })
    .locator("td")
    .filter({
      has: page.getByRole("button", { name: /Raise Single rate on/i }),
    })
    .first();
  const rateBefore = await singleRateCell.innerText();
  await page
    .getByRole("button", { name: /Raise Single rate on/i })
    .first()
    .click();
  await expect(singleRateCell).not.toHaveText(rateBefore);

  // Hiring is a player-critical path with its own browser flow.
  await openManagementArea(page, "staff");
  const staffRows = page.getByRole("row");
  const staffBefore = await staffRows.count();
  await page.getByRole("button", { name: /hire applicant/i }).click();
  await expect(staffRows).toHaveCount(staffBefore + 1);

  await page.getByRole("button", { name: "16x", exact: true }).click();

  // A month of simulated time at 16x, then prove the close report appears.
  await expect(
    page.getByRole("dialog", { name: /monthly close/i }),
  ).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: /continue/i }).click();
  // Guests booked, arrived, and were charged along the way.
  await openManagementArea(page, "revenue");
  await expect(
    page.getByRole("region", { name: "Revenue", exact: true }),
  ).toContainText(/ADR.*[1-9]/);

  await expect(statusBar(page)).toContainText(/DM/);
});

test("restores the saved game date after save and load", async ({ page }) => {
  await page.goto("/?seed=99");
  await page.getByRole("button", { name: "4x", exact: true }).click();
  await expect(statusBar(page)).toContainText(/1991-01-0[2-9]/, {
    timeout: 30_000,
  });

  await page.getByRole("button", { name: /pause/i }).click();
  await page.getByRole("button", { name: /^(save|speichern)$/i }).click();
  // Wait for the IndexedDB transaction to commit, not just for SAVE_DATA.
  await expect(savesCommitted(page)).toHaveText(/1/, { timeout: 30_000 });
  const saved = (await statusBar(page).innerText()).match(/1991-\d\d-\d\d/)![0];

  await page.getByRole("button", { name: "16x", exact: true }).click();
  await expect(statusBar(page)).not.toContainText(saved, { timeout: 30_000 });

  await page.getByRole("button", { name: /pause/i }).click();
  await page.getByRole("button", { name: /^(load|laden)$/i }).click();
  await expect(statusBar(page)).toContainText(saved, { timeout: 30_000 });
});
