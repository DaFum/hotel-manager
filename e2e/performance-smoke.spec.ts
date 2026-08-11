import { test, expect } from "@playwright/test";

test("hotel view stays interactive during 16x simulation", async ({ page }) => {
  await page.goto("/?renderer=off");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Frankfurt/i,
    { timeout: 30_000 },
  );
  await page
    .getByRole("combobox", { name: /Language|Sprache/ })
    .selectOption("en-GB");
  const room = page
    .getByRole("region", { name: "Hotel view" })
    .getByRole("button", { name: /room.101 single/i });
  const status = page.getByRole("region", {
    name: /Status bar|Statusleiste/,
  });
  const pausedClock = await status.innerText();
  await page.getByRole("button", { name: "16x", exact: true }).click();
  await expect(status).not.toHaveText(pausedClock, { timeout: 10_000 });
  const runningClock = await status.innerText();
  const mainThreadDelayMs = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const started = performance.now();
        setTimeout(() => resolve(performance.now() - started), 0);
      }),
  );
  expect(mainThreadDelayMs).toBeLessThan(250);
  await expect(status).not.toHaveText(runningClock, { timeout: 10_000 });
  await page.getByRole("button", { name: "Pause" }).click();
  await room.click();
  await expect(
    page
      .getByRole("region", { name: "Hotel view" })
      .getByText(/room.101: .*cleanliness/i),
  ).toBeVisible();
});
