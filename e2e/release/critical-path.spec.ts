import { expect, test } from "@playwright/test";

test("operates the hotel while company and campaign state remain responsive", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
  const campaign = page.getByRole("region", { name: "Campaign setup" });
  const chronicle = page.getByRole("region", { name: "Company chronicle" });
  const portfolio = page.getByRole("region", { name: "Hotel portfolio" });
  await expect(campaign).toContainText("Frankfurt, 1 January 1991");
  await expect(chronicle).toContainText("No milestones recorded yet");

  await page.getByRole("button", { name: /set single rate/i }).click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");
  await page
    .getByRole("region", { name: "Brands" })
    .getByRole("button", {
      name: /fly rheinstern collection over hotel mainblick/i,
    })
    .click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");
  await expect(
    portfolio.getByRole("article", { name: "Hotel Mainblick" }),
  ).toContainText("Flag: Rheinstern Collection");

  await page.getByRole("button", { name: "4x", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeEnabled();
  await expect(chronicle).toBeVisible();
});
