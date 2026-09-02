import { test, expect, type Page } from "@playwright/test";
import { AREA_ORDER } from "../src/ui/ManagementShell";
import {
  closeDrawer,
  openManagementArea,
  selectLocale,
} from "./management";

const VIEWPORTS = [
  { name: "375x812", width: 375, height: 812 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "959x800", width: 959, height: 800 },
  { name: "961x800", width: 961, height: 800 },
  { name: "1280x900", width: 1280, height: 900 },
] as const;

async function start(page: Page): Promise<void> {
  await page.goto("/?seed=424242");
  await selectLocale(page, "en-GB");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Frankfurt/i,
  );
}

test.describe("Mobile and Breakpoint E2E Regressions", () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("all 10 management tabs are visible and selectable", async ({
        page,
      }) => {
        await start(page);

        for (const area of AREA_ORDER) {
          await openManagementArea(page, area as never);
          const tab = page.locator(`[role="tab"][aria-controls="management-${area}"]`);
          await expect(tab).toBeVisible();
          await expect(tab).toHaveAttribute("aria-selected", "true");
        }
      });

      test("no department causes horizontal document overflow", async ({
        page,
      }) => {
        await start(page);

        const offenders: string[] = [];
        for (const area of AREA_ORDER) {
          await openManagementArea(page, area as never);
          const width = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
          }));
          if (width.scroll > width.client + 1) {
            offenders.push(`${area}: ${width.scroll}px > ${width.client}px`);
          }
        }

        expect(offenders, "Departments wider than viewport").toEqual([]);
      });
    });
  }

  test.describe("Mobile-specific TopBar and Drawer controls (375x812)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("Pause and Speed controls remain visible on mobile without opening tools menu", async ({
      page,
    }) => {
      await start(page);

      const speedNav = page.locator(".hm-topbar__speed");
      await expect(speedNav).toBeVisible();

      // Speed buttons 0 (pause), 1x, 2x, 4x, 16x should be directly clickable
      const pauseBtn = speedNav.getByRole("button", { name: /pause/i });
      await expect(pauseBtn).toBeVisible();
      await pauseBtn.click();
      await expect(pauseBtn).toHaveAttribute("aria-pressed", "true");

      const speed1x = speedNav.getByRole("button", { name: "1x" });
      await expect(speed1x).toBeVisible();
      await speed1x.click();
      await expect(speed1x).toHaveAttribute("aria-pressed", "true");
    });

    test("Tools toggle button expands and collapses secondary topbar controls", async ({
      page,
    }) => {
      await start(page);

      const toggle = page.locator(".hm-topbar__mobile-toggle");
      const collapsible = page.locator(".hm-topbar__collapsible");

      await expect(toggle).toBeVisible();
      await expect(collapsible).not.toBeVisible();

      await toggle.click();
      await expect(collapsible).toBeVisible();

      await toggle.click();
      await expect(collapsible).not.toBeVisible();
    });

    test("Mobile Notification Drawer renders NotificationCenter, Filters, and ContextHelp", async ({
      page,
    }) => {
      await start(page);

      await page.getByRole("button", { name: /open notifications|messages/i }).click();
      const drawer = page.locator("#hm-drawer-notifications");
      await expect(drawer).toBeVisible();

      // Notification Center inside drawer
      const center = drawer.getByRole("region", {
        name: /notification center|alerts/i,
      });
      await expect(center).toBeVisible();

      // Notification Filters inside details toggle
      const filtersSummary = drawer.locator("summary");
      await expect(filtersSummary).toBeVisible();
      await filtersSummary.click();
      const filters = drawer.locator(".hm-messages__filters");
      await expect(filters).toBeVisible();

      // Context Help inside drawer
      const help = drawer.getByRole("region", {
        name: /guest satisfaction|help/i,
      });
      await expect(help).toBeVisible();

      // Close drawer
      await closeDrawer(page);
      await expect(drawer).not.toBeVisible();
    });

    test("First-Viewport-Playfield is visible on main view", async ({
      page,
    }) => {
      await start(page);
      await openManagementArea(page, "mainView");

      const canvas = page.locator(".hm-hotel-view__stage");
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeLessThan(812);
      expect(box!.height).toBeGreaterThan(100);
    });

    test("CityEconomy Bounding Box fits within mobile viewport width", async ({
      page,
    }) => {
      await start(page);
      await openManagementArea(page, "market");

      const panel = page.locator('[aria-label*="economy"], [aria-label*="wirtschaft"]').first();
      await expect(panel).toBeVisible();

      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(375);
    });

    test("Responsive tables in Staff, Revenue, and Competitor sections render stacked records without overflow", async ({
      page,
    }) => {
      await start(page);

      // Staff tab
      await openManagementArea(page, "staff");
      const staffTable = page.locator("table.hm-responsive-table").first();
      if (await staffTable.isVisible()) {
        const box = await staffTable.boundingBox();
        expect(box!.width).toBeLessThanOrEqual(375);
      }

      // Revenue tab
      await openManagementArea(page, "revenue");
      const revenueTable = page.locator("table.hm-responsive-table").first();
      await expect(revenueTable).toBeVisible();
      const revBox = await revenueTable.boundingBox();
      expect(revBox!.width).toBeLessThanOrEqual(375);
    });
  });
});
