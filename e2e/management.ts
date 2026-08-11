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
