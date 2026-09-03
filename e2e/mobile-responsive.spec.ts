import { test, expect, type Page } from "@playwright/test";
import { AREA_ORDER } from "../src/ui/ManagementShell";
import {
  closeDrawer,
  openManagementArea,
  openNotificationsDrawer,
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

      test("all 10 management tabs are visible and selectable within viewport", async ({
        page,
      }) => {
        await start(page);

        for (const area of AREA_ORDER) {
          await openManagementArea(page, area as never);
          const tab = page.locator(
            `[role="tab"][aria-controls="management-${area}"]`,
          );
          await expect(tab).toBeVisible();
          await expect(tab).toHaveAttribute("aria-selected", "true");

          // Wait for smooth scrollIntoView animation to settle if needed
          await expect
            .poll(
              async () => {
                const b = await tab.boundingBox();
                if (!b) return false;
                return b.x >= -1 && b.x + b.width <= vp.width + 1;
              },
              { message: `Tab ${area} scrolled within viewport ${vp.name}` },
            )
            .toBe(true);
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

    test("keyboard navigation on tab rail scrolls active tab into viewport", async ({
      page,
    }) => {
      await start(page);

      await openManagementArea(page, "mainView");
      const firstTab = page.locator(
        '[role="tab"][aria-controls="management-mainView"]',
      );
      await firstTab.focus();

      // Navigate with ArrowRight through tab rail
      await page.keyboard.press("ArrowRight");
      const hotelTab = page.locator(
        '[role="tab"][aria-controls="management-hotel"]',
      );
      await expect(hotelTab).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(async () => {
          const b = await hotelTab.boundingBox();
          if (!b) return false;
          return b.x >= -1 && b.x + b.width <= 375 + 1;
        })
        .toBe(true);

      // Jump to last tab (campaign) with End key
      await page.keyboard.press("End");
      const campaignTab = page.locator(
        '[role="tab"][aria-controls="management-campaign"]',
      );
      await expect(campaignTab).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(async () => {
          const b = await campaignTab.boundingBox();
          if (!b) return false;
          return b.x >= -1 && b.x + b.width <= 375 + 1;
        })
        .toBe(true);

      // Jump to first tab with Home key
      await page.keyboard.press("Home");
      await expect(firstTab).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(async () => {
          const b = await firstTab.boundingBox();
          if (!b) return false;
          return b.x >= -1 && b.x + b.width <= 375 + 1;
        })
        .toBe(true);
    });

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

      // Ensure collapsible is closed initially before testing toggle
      if (await collapsible.isVisible()) {
        await toggle.click();
        await expect(collapsible).not.toBeVisible();
      }

      await toggle.click();
      await expect(collapsible).toBeVisible();

      await toggle.click();
      await expect(collapsible).not.toBeVisible();
    });

    test("Mobile Notification Drawer renders NotificationCenter, Filters, and ContextHelp", async ({
      page,
    }) => {
      await start(page);

      await openNotificationsDrawer(page);
      const drawer = page.locator("#hm-drawer-notifications");

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
      const help = drawer.locator(
        'aside, [aria-label*="satisfaction" i], [aria-label*="zufriedenheit" i], [aria-label*="drivers" i]',
      ).first();
      await expect(help).toBeVisible();

      // Close drawer
      await closeDrawer(page);
      await expect(drawer).not.toBeVisible();
    });

    test("Notification Drawer restores focus to triggering button upon closing", async ({
      page,
    }) => {
      await start(page);

      const toggle = page.locator(".hm-topbar__mobile-toggle");
      if (await toggle.isVisible()) {
        const collapsible = page.locator(".hm-topbar__collapsible");
        if (!(await collapsible.isVisible())) {
          await toggle.click();
          await expect(collapsible).toBeVisible();
        }
      }

      const triggerBtn = page.getByRole("button", {
        name: /open notifications|messages|meldungen/i,
      });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();

      const drawer = page.locator("#hm-drawer-notifications");
      await expect(drawer).toBeVisible();

      // Close drawer and verify focus restoration
      await closeDrawer(page);
      await expect(drawer).not.toBeVisible();
      await expect(triggerBtn).toBeFocused();
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
      const visibleTop = Math.max(0, box!.y);
      const visibleBottom = Math.min(812, box!.y + box!.height);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      expect(visibleHeight).toBeGreaterThan(100);
    });

    test("CityEconomy Bounding Box fits within mobile viewport width without overlap or overflow", async ({
      page,
    }) => {
      await start(page);
      await openManagementArea(page, "market");

      const panel = page
        .locator('[aria-label*="economy"], [aria-label*="wirtschaft"]')
        .first();
      await expect(panel).toBeVisible();

      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);

      // Verify no internal child element causes horizontal overflow inside economy panel
      const hasOverflow = await panel.evaluate((el) => {
        return Array.from(el.querySelectorAll("*")).some(
          (child) => child.scrollWidth > child.clientWidth + 1,
        );
      });
      expect(
        hasOverflow,
        "Internal text/content overflow inside CityEconomy",
      ).toBe(false);

      // Verify dt and dd key-value elements inside each item do not overlap
      const items = panel.locator(".hm-city-economy__item");
      const itemCount = await items.count();
      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i);
        const dtBox = await item.locator("dt").boundingBox();
        const ddList = item.locator("dd");
        const ddCount = await ddList.count();
        for (let j = 0; j < ddCount; j++) {
          const ddBox = await ddList.nth(j).boundingBox();
          if (dtBox && ddBox) {
            // Verify dt is stacked above dd vertically without text overlap
            expect(
              dtBox.y,
              `dt top should be above dd ${j} top in CityEconomy item ${i}`,
            ).toBeLessThan(ddBox.y);
            expect(
              ddBox.y,
              `dd ${j} top should be below dt bottom in CityEconomy item ${i}`,
            ).toBeGreaterThanOrEqual(dtBox.y + dtBox.height - 3);
          }
        }
      }
    });

    test("Responsive tables in Staff, Revenue, Competitor, and Loan sections render stacked records without overflow and with reachable controls", async ({
      page,
    }) => {
      await start(page);

      // Staff tab
      await openManagementArea(page, "staff");
      const staffTable = page.locator("table.hm-responsive-table").first();
      await expect(staffTable).toBeVisible();
      let box = await staffTable.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
      const hireBtn = page
        .getByRole("button", { name: /hire applicant/i })
        .first();
      if (await hireBtn.isVisible()) {
        await expect(hireBtn).toBeEnabled();
      }

      // Revenue tab
      await openManagementArea(page, "revenue");
      const revenueTable = page.locator("table.hm-responsive-table").first();
      await expect(revenueTable).toBeVisible();
      box = await revenueTable.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);

      // Competitors section (Market tab)
      await openManagementArea(page, "market");
      const competitorTable = page
        .locator("table.hm-responsive-table")
        .first();
      await expect(competitorTable).toBeVisible();
      box = await competitorTable.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);

      // Loans / Borrowing section (Finance tab)
      await openManagementArea(page, "finance");
      const loansSection = page
        .locator(
          '[aria-label*="loans" i], [aria-label*="darlehen" i], table.hm-responsive-table',
        )
        .first();
      await expect(loansSection).toBeVisible();
      box = await loansSection.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });
  });
});
