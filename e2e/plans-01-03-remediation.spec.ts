import { expect, test } from "@playwright/test";

test("plays the remediation journey and reloads from recovery", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Frankfurt",
  );

  await page.getByRole("button", { name: /set single rate/i }).click();
  await expect(page.getByLabel("Command status")).toContainText("accepted");
  await expect(page.getByRole("region", { name: "Facilities" })).toContainText(
    "Limited by:",
  );
  await expect(page.getByRole("table", { name: /competitors/i })).toContainText(
    "trading",
  );

  await page.getByLabel("Name this save").fill("remediation checkpoint");
  await page.getByRole("button", { name: /save to a new slot/i }).click();
  await expect(page.getByLabel("Saves committed")).toContainText("1");
  await expect(
    page.getByRole("button", { name: /Recover generation 0/i }),
  ).toBeVisible();
  const checkpointStatus = await page
    .getByRole("region", { name: "Status bar" })
    .innerText();
  const checkpointRate = await page.getByLabel("Single rate").inputValue();

  await page.getByRole("button", { name: "16x", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: /monthly close/i }),
  ).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("region", { name: "Revenue" })).toContainText(
    /ADR[1-9]/,
  );
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /pause/i }).click();

  const before = await page
    .getByRole("region", { name: "Status bar" })
    .innerText();
  await page.getByRole("button", { name: /Recover generation 0/i }).click();
  const statusBar = page.getByRole("region", { name: "Status bar" });
  await expect(statusBar).toHaveText(checkpointStatus, { timeout: 30_000 });
  await expect(statusBar).not.toHaveText(before);
  await expect(page.getByLabel("Single rate")).toHaveValue(checkpointRate);
  await expect(page.getByLabel("Saves committed")).toBeVisible();
});

test("shows the worker's own pending, accepted and rejected verdicts", async ({
  page,
}) => {
  await page.goto("/?seed=424242");
  const status = page.getByLabel("Command status");
  await expect(status).toBeVisible();
  await page.evaluate(() => {
    const target = document.querySelector('[aria-label="Command status"]')!;
    (window as unknown as { commandStates: string[] }).commandStates = [
      target.textContent ?? "",
    ];
    new MutationObserver(() =>
      (window as unknown as { commandStates: string[] }).commandStates.push(
        target.textContent ?? "",
      ),
    ).observe(target, { childList: true, subtree: true, characterData: true });
  });

  await page.getByRole("button", { name: /set single rate/i }).click();
  await expect(status).toContainText("accepted");

  const expand = page.getByRole("button", { name: /expand conference space/i });
  for (let attempt = 0; attempt < 35; attempt++) {
    await expand.click();
    await page.waitForTimeout(30);
    if ((await status.innerText()).includes("rejected")) break;
  }
  await expect(status).toContainText("rejected");
  const states = await page.evaluate(
    () => (window as unknown as { commandStates: string[] }).commandStates,
  );
  expect(states.some((value) => value.includes("pending"))).toBe(true);
  expect(states.some((value) => value.includes("accepted"))).toBe(true);
  expect(states.some((value) => value.includes("rejected"))).toBe(true);
});
