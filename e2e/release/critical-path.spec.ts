import { expect, test } from "@playwright/test";
import { openManagementArea } from "../management";

test("operates the hotel while company and campaign state remain responsive", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
  await openManagementArea(page, "campaign");
  const campaign = page.getByRole("region", { name: "Campaign setup" });
  const chronicle = page.getByRole("region", { name: "Company chronicle" });
  await expect(campaign).toContainText("Frankfurt, 1 January 1991");
  await expect(chronicle).toContainText("No milestones recorded yet");

  await openManagementArea(page, "revenue");
  const singleRate = page
    .getByRole("region", { name: "Revenue" })
    .locator("dd")
    .last();
  const rateBefore = await singleRate.textContent();
  await page.getByRole("button", { name: /set single rate/i }).click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");
  // Accepted is what the worker said; the published rate is what it did.
  await expect(singleRate).not.toHaveText(rateBefore ?? "");
  await openManagementArea(page, "company");
  const portfolio = page.getByRole("region", { name: "Hotel portfolio" });
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
  // The speed the player asked for is the speed the shell is showing.
  await expect(
    page.getByRole("button", { name: "4x", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await openManagementArea(page, "campaign");
  await expect(chronicle).toBeVisible();
});
