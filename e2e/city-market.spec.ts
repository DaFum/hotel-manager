import { test, expect } from "@playwright/test";

test("shows the city's demand sources and the uncertainty around them", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const city = page.getByRole("region", { name: "City market" });
  await expect(city).toBeVisible();

  // Every source is named with the nights it carries, not rolled into one
  // opaque demand figure.
  for (const source of ["Business", "Leisure", "Event", "Group"])
    await expect(
      city.getByRole("listitem").filter({ hasText: source }),
    ).toBeVisible();

  await expect(city.getByLabel("Room-night forecast")).toContainText(
    /Forecast \d+–\d+ room nights/,
  );
  await expect(city.getByLabel("Connectivity")).toContainText(/\d+\/100/);
});

test("puts the rival houses beside this hotel on the same terms", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const competitors = page.getByRole("region", { name: "Competitors" });
  await expect(competitors).toBeVisible();

  const table = competitors.getByRole("table");
  await expect(table.getByRole("row", { name: /This hotel/ })).toBeVisible();
  const rival = table.getByRole("row", { name: /Hotel Am Hof/ });
  await expect(rival).toBeVisible();
  // The comparison is in words on the row, not carried by colour alone.
  await expect(rival).toContainText(/(above|below|level with) this hotel/);
  await expect(rival).toContainText(/trading|restructuring|leaving/);
});

test("quotes the going wage before the player offers one", async ({ page }) => {
  await page.goto("/?seed=424242");
  const staff = page.getByRole("region", { name: "Staff" });
  await expect(staff.getByLabel("Market wage")).toContainText(
    /The city is paying .* a month/,
  );

  // Hiring at the quoted rate is accepted: the offer meets the market floor.
  const before = await staff.getByRole("row").count();
  await staff.getByRole("button", { name: "Hire applicant" }).click();
  await expect(staff.getByRole("row")).toHaveCount(before + 1);
});
