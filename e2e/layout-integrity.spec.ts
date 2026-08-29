import { test, expect, type Page } from "@playwright/test";
import { AREA_ORDER } from "../src/ui/ManagementShell";
import { openManagementArea, selectLocale } from "./management";

/**
 * The frame's structural promises, asserted rather than assumed.
 *
 * Every failure guarded here was live in the build before this spec existed,
 * and none of them announced itself: `overflow: hidden` on the root swallowed
 * the evidence on a desktop, and on a handset the damage showed only as a torn
 * black margin down the right of the page. A layout fault that is invisible to
 * the suite comes back, so each promise gets a test that reads the geometry the
 * browser actually computed.
 */

const NARROW = { width: 375, height: 812 };
const DESK = { width: 1280, height: 900 };

async function start(page: Page): Promise<void> {
  await page.goto("/?seed=424242");
  await selectLocale(page, "en-GB");
}

/**
 * The page may never scroll sideways. A department that is wider than the
 * screen drags the command bar and the department rail off the viewport with
 * it, because they are laid out against the window and the document is not.
 * Content too wide to fit — a register of twenty columns — is expected to
 * scroll inside its own frame, which this measurement deliberately allows.
 */
test.describe("the page never scrolls sideways", () => {
  test.use({ viewport: NARROW });

  test("no department pushes the document wider than the screen", async ({
    page,
  }) => {
    await start(page);

    const offenders: string[] = [];
    for (const area of AREA_ORDER) {
      await openManagementArea(page, area);
      const width = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      if (width.scroll > width.client + 1) {
        offenders.push(`${area}: ${width.scroll}px in ${width.client}px`);
      }
    }

    expect(offenders, "departments wider than the viewport").toEqual([]);
  });
});

test.describe("the working surface stays in its column", () => {
  test.use({ viewport: DESK });

  /**
   * The departments, the working surface and the noticeboard are three fixed
   * places, and the middle one is not allowed to grow into the third. It did:
   * the staff register drove the surface 630px under the rail, where the
   * noticeboard was painted over the register and neither could be read.
   */
  test("no department overlaps the noticeboard", async ({ page }) => {
    await start(page);

    const offenders: string[] = [];
    for (const area of AREA_ORDER) {
      await openManagementArea(page, area);
      const box = await page.evaluate((id) => {
        const panel = document.getElementById(`management-${id}`);
        const messages = document.querySelector(".hm-messages");
        if (!panel || !messages) return null;
        return {
          panelRight: panel.getBoundingClientRect().right,
          messagesLeft: messages.getBoundingClientRect().left,
        };
      }, area);
      if (box && box.panelRight > box.messagesLeft + 1) {
        offenders.push(
          `${area}: surface reaches ${Math.round(box.panelRight)}px, ` +
            `board starts at ${Math.round(box.messagesLeft)}px`,
        );
      }
    }

    expect(offenders, "departments drawn under the noticeboard").toEqual([]);
  });

  /**
   * A control the player cannot see is a control they do not have. The camera
   * panel was a fixed 430px frame around 660px of switches, so the last of
   * them sat below the fold of a panel that gave no sign it scrolled.
   */
  test("every camera control is reachable on the main view", async ({
    page,
  }) => {
    await start(page);
    await openManagementArea(page, "mainView");

    const hidden = await page.evaluate(() => {
      const panel = document.querySelector(".hm-hotel-view__controls");
      if (!panel) return ["the camera panel is missing"];
      const frame = panel.getBoundingClientRect();
      return [...panel.querySelectorAll("button")]
        .filter((button) => {
          const box = button.getBoundingClientRect();
          const shown =
            Math.min(box.bottom, frame.bottom) - Math.max(box.top, frame.top);
          // Not one pixel of it is inside the frame that is supposed to show
          // it. Being scrollable is not a defence: the panel carried no sign
          // that it scrolled, so the switch below the fold was, to the player,
          // simply not there.
          return shown <= 0;
        })
        .map((button) => button.textContent?.trim() ?? "(unlabelled)");
    });

    expect(hidden, "camera controls with no way to reach them").toEqual([]);
  });
});
