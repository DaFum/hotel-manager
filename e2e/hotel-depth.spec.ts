import { test, expect } from "@playwright/test";
import { openManagementArea, selectLocale } from "./management";

test("shows every facility with the constraint that is binding it", async ({
  page,
}) => {
  await page.goto("/?seed=424242&renderer=off");
  await selectLocale(page, "en-GB");
  await openManagementArea(page, "hotel");
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
  await openManagementArea(page, "mainView");
  const fallback = page.getByRole("button", {
    name: /Breakfast room, .* limited by/i,
  });
  await expect(fallback).toBeVisible();
  await fallback.click();
  // The facility's own live readout. The F&B line names the outlet properly
  // now too, so this has to say which of the two it means.
  await expect(
    page
      .locator('[aria-live="polite"]')
      .filter({ hasText: /Breakfast room: .* limited by/i }),
  ).toBeVisible();
  await expect(page.getByTestId("hotel-canvas").locator("canvas")).toHaveCount(
    0,
  );
});

test("rosters a specialist role and declares a specialization", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  await selectLocale(page, "en-GB");

  await openManagementArea(page, "staff");
  const staff = page.getByRole("region", { name: "Staff", exact: true });
  const rows = staff.getByRole("row");
  // The roster arrives with the first snapshot; count it only once it is there.
  await expect(rows.first()).toBeVisible();
  const before = await rows.count();
  await staff.getByLabel("Role").selectOption("wellness");
  await staff.getByRole("button", { name: /hire applicant/i }).click();
  await expect(rows).toHaveCount(before + 1);
  await expect(staff).toContainText(/wellness/i);

  await openManagementArea(page, "hotel");
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
  await selectLocale(page, "en-GB");
  await openManagementArea(page, "hotel");
  await page.getByRole("button", { name: "16x", exact: true }).click();

  const facilities = page.getByRole("region", { name: "Facilities" });
  const lifts = facilities.getByRole("listitem", { name: "Lifts" });
  await expect(lifts).toContainText(/^Lifts0\//);
  // Lift trips only appear once guests actually move through the house.
  await expect(lifts).toContainText(/^Lifts[1-9]\d*\//, { timeout: 60_000 });
  await expect(
    page.getByRole("region", { name: /Notification center|Alerts/i }),
  ).toBeVisible();
  // The simulation must still be running: no SIMULATION_ERROR surfaced.
  await expect(page.getByLabel(/^(Simulation status|Simulationsstatus)$/)).not.toContainText(
    /error/i,
  );
});
