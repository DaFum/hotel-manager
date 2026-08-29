import { test, expect, type Page } from "@playwright/test";
import { AREA_ORDER } from "../src/ui/ManagementShell";
import {
  closeDrawer,
  openDrawer,
  openManagementArea,
  selectLocale,
} from "./management";

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
      await openManagementArea(page, area as "revenue" | "guests");
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

/**
 * Reading order promises. Both of these were broken in a way no rendering test
 * would catch: the page looked correct and read wrongly.
 */
test.describe("the document is ordered the way it is read", () => {
  test.use({ viewport: DESK });

  /**
   * A link that skips the chrome has to come before the chrome. It sat inside
   * the management shell, which put it on the eleventh tab stop — behind the
   * ten controls it exists to bypass.
   */
  test("the skip link is the first thing a keyboard reaches", async ({
    page,
  }) => {
    // Deliberately not start(): choosing a locale opens the settings drawer,
    // which leaves focus on the button that opened it, and a Tab from there
    // measures the middle of the document rather than its beginning. Nothing
    // asserted below is language-dependent.
    await page.goto("/?seed=424242");
    // The boot screen carries an h1 of its own, so waiting on the heading
    // waits for nothing: the department rail only exists once the game itself
    // has mounted, and pressing Tab before that measured a document React was
    // about to replace.
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Ask the browser, rather than guessing from document order: press Tab
    // from an untouched page and see what actually takes focus. An earlier
    // version of this test read the first match of a focusable-looking
    // selector and asserted only that it was an anchor — which any anchor
    // anywhere, visible or not, would have satisfied.
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "(nothing took focus)";
      return `${el.tagName}[href="${el.getAttribute("href") ?? ""}"]`;
    });

    expect(focused).toBe('A[href="#management-content"]');
  });

  /**
   * The game works out the player's next action; it used to file that answer
   * at the foot of the noticeboard, roughly 3300px below the fold on a
   * handset. It belongs above the frame, with the vitals.
   */
  test("the next action is above the working frame", async ({ page }) => {
    await start(page);

    const placed = await page.evaluate(() => {
      const slot = document.querySelector(".hm-nextaction");
      const frame = document.querySelector(".hm-frame");
      if (!slot) return "no next action is being offered";
      if (!frame) return "the frame is missing";
      return slot.compareDocumentPosition(frame) &
        Node.DOCUMENT_POSITION_FOLLOWING
        ? "above"
        : "below";
    });

    expect(placed).toBe("above");
  });
});

/**
 * High contrast is a promise, not a filter (tokens.css): it must win over every
 * decorative token in the system, including the ones a department declares for
 * its own surface.
 */
test.describe("a themed board keeps the high-contrast promise", () => {
  test.use({ viewport: DESK });

  /**
   * The revenue board and the guest ledger bring their own paper, so they also
   * declare the ink that paper takes. Declared on the board, those tokens beat
   * the value they would have inherited whatever the specificity of the rule
   * upstream — so the black-and-white palette set on the root never reached
   * them, and a player who had asked for high contrast still got dark red on
   * cream. The board must answer to the palette, not outrank it.
   */
  test("the paper departments take the high-contrast palette", async ({
    page,
  }) => {
    await start(page);
    await openDrawer(page, "settings");
    await page.getByRole("checkbox", { name: /High contrast/i }).check();
    await closeDrawer(page);

    const offenders: string[] = [];
    // Each board's private surface tokens, and the palette token each one has
    // to resolve to once high contrast is on.
    const boards = [
      {
        area: "revenue",
        selector: ".revenue-board",
        surface: [
          ["--revenue-ink", "--hm-ink"],
          ["--revenue-paper", "--hm-ground"],
          ["--revenue-signal", "--hm-signal"],
          ["--revenue-rule", "--hm-rule"],
          ["--revenue-rule-soft", "--hm-rule"],
        ],
      },
      {
        area: "guests",
        selector: ".guest-ledger",
        surface: [
          ["--guest-ink", "--hm-ink"],
          ["--guest-paper", "--hm-ground"],
          ["--guest-rule", "--hm-signal"],
          ["--guest-muted", "--hm-ink-dim"],
        ],
      },
    ] as const;

    for (const { area, selector, surface } of boards) {
      await openManagementArea(page, area);
      const seen = await page.evaluate(
        ({ selector, surface }) => {
          const root = document.querySelector(".hm-root");
          const board = document.querySelector(selector);
          if (!root || !board) return null;
          const read = (el: Element, name: string) =>
            getComputedStyle(el).getPropertyValue(name).trim();
          return [
            // The tokens the shared rules read, which the board must not
            // outrank …
            ...["--hm-ink", "--hm-ink-dim", "--hm-signal"].map((name) => ({
              name,
              expected: read(root, name),
              actual: read(board, name),
              against: name,
            })),
            // … and the board's own surface, which has to follow the palette
            // rather than keep its paper. Without these the ink could obey
            // high contrast while the board still painted cream underneath it.
            ...surface.map(([name, source]) => ({
              name,
              expected: read(root, source),
              actual: read(board, name),
              against: source,
            })),
          ];
        },
        { selector, surface },
      );

      if (!seen) {
        offenders.push(`${area}: the board is not on screen`);
        continue;
      }
      for (const token of seen) {
        if (token.expected !== token.actual) {
          offenders.push(
            `${area} ${token.name}: board says ${token.actual}, ` +
              `high contrast says ${token.expected} (via ${token.against})`,
          );
        }
      }
    }

    expect(offenders, "themed tokens outranking high contrast").toEqual([]);
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
