import { expect, test } from "@playwright/test";

test("boots, pauses, and exposes the hotel in every release browser", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("main", { name: "Hotelverwaltung" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Hotel Manager|Frankfurt/i }),
  ).toBeVisible();

  const statusBar = page.getByRole("region", { name: "Statusleiste" });
  // The worker boots paused, so the clock has to be started before pausing it
  // proves anything.
  await page.getByRole("button", { name: "4x", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "4x", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const started = (await statusBar.textContent()) ?? "";
  await expect
    .poll(async () => (await statusBar.textContent()) ?? "")
    .not.toBe(started);

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Paused means the worker has stopped advancing the hotel, not merely that
  // the button still responds to a click. A tick already in flight when the
  // pause arrived may still land, so the reading is taken once it has.
  await page.waitForTimeout(300);
  const paused = (await statusBar.textContent()) ?? "";
  await page.waitForTimeout(500);
  expect((await statusBar.textContent()) ?? "").toBe(paused);
});
