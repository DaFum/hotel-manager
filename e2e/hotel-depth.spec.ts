import { test, expect } from "@playwright/test";

test("shows every facility with the constraint that is binding it", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const facilities = page.getByRole("region", { name: "Facilities" });
  await expect(facilities).toBeVisible();

  // The board names causes, not just colours.
  await expect(
    facilities.getByRole("listitem", { name: "Laundry" }),
  ).toContainText(/Limited by:/);
  await expect(
    facilities.getByRole("listitem", { name: "Breakfast room" }),
  ).toContainText(/Limited by:/);

  // The spa starts unstaffed, so it is visibly the tightest area in the house.
  await expect(
    facilities.getByRole("listitem", { name: "Wellness" }),
  ).toContainText(/therapists on duty/);

  // The same stable facility target is available without the canvas.
  await expect(
    page.getByRole("button", { name: /Breakfast room, .* limited by/i }),
  ).toBeVisible();
});

test("rosters a specialist role and declares a specialization", async ({
  page,
}) => {
  await page.goto("/?seed=424242");

  const staff = page.getByRole("region", { name: "Staff" });
  const rows = staff.getByRole("row");
  // The roster arrives with the first snapshot; count it only once it is there.
  await expect(rows.first()).toBeVisible();
  const before = await rows.count();
  await staff.getByLabel("Role").selectOption("wellness");
  await staff.getByRole("button", { name: /hire applicant/i }).click();
  await expect(rows).toHaveCount(before + 1);
  await expect(staff).toContainText(/wellness/);

  const classification = page.getByRole("region", { name: "Classification" });
  await expect(classification.getByLabel("Star rating")).toContainText(/stars/);
  await classification.getByLabel("Specialization").selectOption({
    label: "Conference hotel",
  });
  await expect(classification.getByLabel("Specialization")).toHaveValue(
    "spec.conference",
  );
});

test("runs a conference through the deep house without breaking the board", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  await page.getByRole("button", { name: "16x", exact: true }).click();

  const facilities = page.getByRole("region", { name: "Facilities" });
  const lifts = facilities.getByRole("listitem", { name: "Lifts" });
  await expect(lifts).toContainText(/^Lifts0\//);
  // Lift trips only appear once guests actually move through the house.
  await expect(lifts).toContainText(/^Lifts[1-9]\d*\//, { timeout: 60_000 });
  await expect(page.getByRole("region", { name: "Alerts" })).toBeVisible();
  // The simulation must still be running: no SIMULATION_ERROR surfaced.
  await expect(page.getByRole("status")).not.toContainText(/error/i);
});
