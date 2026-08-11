import { test, expect } from "@playwright/test";
import { openManagementArea } from "./management";

test("presents the systemic campaign and its remembered history", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
  await openManagementArea(page, "campaign");
  const setup = page.getByRole("region", { name: "Campaign setup" });
  await expect(setup).toContainText("Frankfurt, 1 January 1991");
  await expect(setup).toContainText("No hidden money or knowledge");
  await expect(page.getByRole("region", { name: "Story inbox" })).toContainText(
    "telex is quiet",
  );
  await expect(
    page.getByRole("region", { name: "Company chronicle" }),
  ).toContainText("No milestones recorded yet");
});

test("starts the career on the difficulty the player chose, then locks it", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
  await openManagementArea(page, "campaign");
  const setup = page.getByRole("region", { name: "Campaign setup" });
  const difficulty = setup.getByLabel("Difficulty");
  const status = page.getByRole("region", { name: /Status bar|Statusleiste/ });
  const standardCash = await status.textContent();

  await expect(difficulty).toBeEnabled();
  await difficulty.selectOption("expert");
  // The inputs the choice changed are on screen, not hidden in the economy.
  await expect(setup).toContainText("Starting capital: 7500 bp");
  await expect(setup).toContainText("Credit spread: 13000 bp");
  // And the worker has actually applied them: expert opens on 7500bp of the
  // standard balance, so the authoritative cash figure has moved.
  await expect(status).not.toHaveText(standardCash ?? "");
  await expect(status).toContainText("300000,00 DM");

  // Starting the career settles the campaign: difficulty is part of the run.
  await page.getByRole("button", { name: "16x", exact: true }).click();
  await expect(difficulty).toBeDisabled();
  await page.getByRole("button", { name: /pause/i }).click();
  await expect(difficulty).toHaveValue("expert");
});
