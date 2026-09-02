import { expect, type Page } from "@playwright/test";
import type { ManagementAreaId } from "../src/ui/ManagementShell";

export async function openManagementArea(
  page: Page,
  area: ManagementAreaId,
): Promise<void> {
  await page
    .locator(`[role="tab"][aria-controls="management-${area}"]`)
    .click();
  await expect(page.locator(`#management-${area}`)).toBeVisible();
}

/**
 * Open one of the desk drawers behind the command bar.
 *
 * Settings and the save slots used to be stacked inline above the management
 * shell, where a spec could reach them the moment the page loaded. They are
 * drawers now, so a spec opens the one it needs. The game starts in German,
 * and a spec may have switched it to English first, so both names are matched.
 */
export async function openDrawer(
  page: Page,
  drawer: "settings" | "saves",
): Promise<void> {
  await expect(page.locator(".hm-topbar")).toBeVisible();
  const toggle = page.locator(".hm-topbar__mobile-toggle");
  if (await toggle.isVisible()) {
    const collapsible = page.locator(".hm-topbar__collapsible");
    if (!(await collapsible.isVisible())) {
      await toggle.click();
      await expect(collapsible).toBeVisible();
    }
  }
  const name =
    drawer === "settings"
      ? /Settings|Einstellungen/i
      : /Saved games|Spielstände/i;
  await page.getByRole("button", { name }).click();
  await expect(page.locator(`#hm-drawer-${drawer}`)).toBeVisible();
}

export async function openNotificationsDrawer(page: Page): Promise<void> {
  await expect(page.locator(".hm-topbar")).toBeVisible();
  const toggle = page.locator(".hm-topbar__mobile-toggle");
  if (await toggle.isVisible()) {
    const collapsible = page.locator(".hm-topbar__collapsible");
    if (!(await collapsible.isVisible())) {
      await toggle.click();
      await expect(collapsible).toBeVisible();
    }
  }
  await page.getByRole("button", { name: /open notifications|messages/i }).click();
  await expect(page.locator("#hm-drawer-notifications")).toBeVisible();
}

export async function closeDrawer(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
}

/**
 * Switch the interface language. The selector lives in the settings drawer,
 * so this opens it, chooses, and closes it again — leaving the page as the
 * spec expects to find it, on the game rather than on the chrome.
 */
export async function selectLocale(
  page: Page,
  locale: "de-DE" | "en-GB",
): Promise<void> {
  await openDrawer(page, "settings");
  await page
    .getByRole("combobox", { name: /Language|Sprache/ })
    .selectOption(locale);
  await closeDrawer(page);
}
