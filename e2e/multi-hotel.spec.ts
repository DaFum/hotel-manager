import { test, expect } from "@playwright/test";

test("shows the group as a portfolio the player can drill into", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const portfolio = page.getByRole("region", { name: "Hotel portfolio" });
  await expect(portfolio).toBeVisible();

  // The house the player runs is a row in the group, not a special case.
  const flagship = portfolio.getByRole("article", { name: "Hotel Mainblick" });
  await expect(flagship).toBeVisible();
  await expect(flagship).toContainText(/% occupancy/);
  await expect(flagship).toContainText(/Manager: /);
  await expect(flagship).toContainText(/held owned/);

  await flagship.getByRole("button", { name: /open hotel mainblick/i }).click();
  await expect(page.getByLabel("Selected hotel")).toContainText(
    "hotel.frankfurt.1",
  );
});

test("flies a brand and reports the standards a house is breaking", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const brands = page.getByRole("region", { name: "Brands" });
  await expect(brands).toBeVisible();
  // The flag's uplift is quoted next to what it costs to keep.
  await expect(brands).toContainText(/demand uplift for .* a month per house/);

  await brands
    .getByRole("button", {
      name: /fly rheinstern collection over hotel mainblick/i,
    })
    .click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");

  const portfolio = page.getByRole("region", { name: "Hotel portfolio" });
  await expect(
    portfolio.getByRole("article", { name: "Hotel Mainblick" }),
  ).toContainText("Flag: Rheinstern Collection");
});

test("keeps delegated authority and the decisions it sent up on one panel", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const governance = page.getByRole("region", { name: "Manager governance" });
  await expect(governance).toBeVisible();
  await expect(governance).toContainText(/repairs to .*DM/);
  await expect(governance).toContainText(/service recovery to .*DM/);

  const before = await governance.textContent();
  await governance
    .getByRole("button", { name: /raise the repair limit/i })
    .click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");
  await expect(governance).not.toHaveText(before ?? "");
});

test("says plainly that no scheme is in the pipeline before one is started", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const pipeline = page.getByRole("region", { name: "Development pipeline" });
  await expect(pipeline).toBeVisible();
  await expect(pipeline).toContainText("No scheme is in the pipeline");
});

test("carries the group through a save and a reload", async ({ page }) => {
  await page.goto("/?seed=424242");
  const brands = page.getByRole("region", { name: "Brands" });
  await brands
    .getByRole("button", { name: /fly mainblick over hotel mainblick/i })
    .click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");

  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByLabel("Saves committed")).not.toContainText(": 0");

  await page.getByRole("button", { name: /^load$/i }).click();
  const portfolio = page.getByRole("region", { name: "Hotel portfolio" });
  await expect(
    portfolio.getByRole("article", { name: "Hotel Mainblick" }),
  ).toContainText("Flag: Mainblick");
});

test("keeps every reputation dimension named with what it affects", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  // Exact: "Commercial spaces" is a different region on the same page.
  const commercial = page.getByRole("region", {
    name: "Commercial",
    exact: true,
  });
  await expect(commercial).toBeVisible();
  await expect(commercial).toContainText("Nothing is being advertised");
  await expect(commercial).toContainText("No rate has been agreed");
  await expect(commercial.getByLabel("Loyalty liability")).toContainText(
    /members, .*DM owed in points/,
  );
});

test("shows the parts of the hotel that are not bedrooms as a business", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const spaces = page.getByRole("region", { name: "Commercial spaces" });
  await expect(spaces).toBeVisible();
  await expect(spaces.getByLabel("Lobby load")).toContainText(
    /\d+ served, \d+ waiting/,
  );
  // Every space states its hours, its capacity and how it is operated.
  await expect(spaces).toContainText(/space.carpark \(parking\): 18 at a time/);
  await expect(spaces).toContainText("00:00–24:00");
  await expect(spaces).toContainText("self");
  await expect(spaces).toContainText("Everything goes through the desk");
});
