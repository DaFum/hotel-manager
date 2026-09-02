import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { openManagementArea, openNotificationsDrawer, selectLocale } from "./management";

const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe("Visual Verification Screenshot Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?seed=424242");
    await selectLocale(page, "en-GB");
    // Wait for the app to settle and main header to load
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Frankfurt/i,
    );
  });

  test("capture screenshots for all management tabs", async ({ page }) => {
    const areas = [
      { id: "mainView", name: "01-mainView" },
      { id: "hotel", name: "02-hotel" },
      { id: "guests", name: "03-guests" },
      { id: "staff", name: "04-staff" },
      { id: "finance", name: "05-finance" },
      { id: "revenue", name: "06-revenue" },
      { id: "marketing", name: "07-marketing" },
      { id: "market", name: "08-market" },
      { id: "company", name: "09-company" },
      { id: "campaign", name: "10-campaign" },
    ] as const;

    for (const area of areas) {
      await openManagementArea(page, area.id);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `tab-${area.name}.png`),
        fullPage: true,
      });
    }
  });

  test("capture screenshots for UI overlays, panels, and settings", async ({
    page,
  }) => {
    // 1. Settings & Accessibility Controls, in the drawer that now holds them
    await page.getByRole("button", { name: /^Settings$/ }).click();
    const settingsSection = page.getByRole("region", {
      name: /Presentation settings/i,
    });
    await expect(settingsSection).toBeVisible();
    await settingsSection.screenshot({
      path: path.join(SCREENSHOT_DIR, "overlay-01-settings.png"),
    });
    await page.keyboard.press("Escape");

    // 2. Save Manager, likewise
    await page.getByRole("button", { name: /^Saved games$/ }).click();
    const saveManager = page.getByRole("region", {
      name: /Saved games/i,
    });
    await expect(saveManager).toBeVisible();
    await saveManager.screenshot({
      path: path.join(SCREENSHOT_DIR, "overlay-02-save-manager.png"),
    });
    await page.keyboard.press("Escape");

    // 3. TopBar / Status Bar
    const topBar = page.getByRole("region", {
      name: /Status bar/i,
    });
    await expect(topBar).toBeVisible();
    await topBar.screenshot({
      path: path.join(SCREENSHOT_DIR, "overlay-03-topbar.png"),
    });

    // 4. Notification Center
    const notificationCenter = page.getByRole("region", {
      name: /Notification center|Alerts/i,
    });
    await expect(notificationCenter).toBeVisible();
    await notificationCenter.screenshot({
      path: path.join(SCREENSHOT_DIR, "overlay-04-notification-center.png"),
    });

    // 5. Full view initial state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "fullpage-initial-overview.png"),
      fullPage: true,
    });
  });

  test("capture screenshot of Monthly Close Modal during simulation", async ({
    page,
  }) => {
    // Accelerate time to trigger the monthly close modal
    await page.getByRole("button", { name: "16x", exact: true }).click();

    const monthlyCloseModal = page.getByRole("dialog", {
      name: /monthly close/i,
    });
    await expect(monthlyCloseModal).toBeVisible({ timeout: 60_000 });

    await monthlyCloseModal.screenshot({
      path: path.join(SCREENSHOT_DIR, "modal-monthly-close.png"),
    });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "fullpage-monthly-close.png"),
      fullPage: true,
    });

    // Dismiss modal to resume UI state
    await page.getByRole("button", { name: /continue/i }).click();
  });

  test("capture mobile viewport screenshots for responsive QA", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const areas = [
      { id: "mainView", name: "01-mainView" },
      { id: "hotel", name: "02-hotel" },
      { id: "guests", name: "03-guests" },
      { id: "staff", name: "04-staff" },
      { id: "finance", name: "05-finance" },
      { id: "revenue", name: "06-revenue" },
      { id: "marketing", name: "07-marketing" },
      { id: "market", name: "08-market" },
      { id: "company", name: "09-company" },
      { id: "campaign", name: "10-campaign" },
    ] as const;

    for (const area of areas) {
      await openManagementArea(page, area.id);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `mobile-${area.name}.png`),
        fullPage: true,
      });
    }

    // Capture open Notification Drawer on mobile
    await openNotificationsDrawer(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile-11-notification-drawer.png"),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
  });
});
