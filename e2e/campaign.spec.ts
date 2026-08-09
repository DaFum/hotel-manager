import { test, expect } from "@playwright/test";

test("presents the systemic campaign and its remembered history", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
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

test("lets the player choose a disclosed difficulty before the first day", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
  const setup = page.getByRole("region", { name: "Campaign setup" });
  const difficulty = setup.getByLabel("Difficulty");

  await expect(difficulty).toBeEnabled();
  await difficulty.selectOption("expert");
  // The inputs the choice changed are on screen, not hidden in the economy.
  await expect(setup).toContainText("Starting capital: 7500 bp");
  await expect(setup).toContainText("Credit spread: 13000 bp");
});
