import { useEffect, useRef, type ReactNode } from "react";
import { translateGame, type GameLocale } from "../../i18n";

/**
 * A desk drawer: the chrome a manager opens on purpose and closes again.
 *
 * Settings, notification filters and the save slots are all things the player
 * touches a handful of times per session. Rendered inline they cost every
 * player, on every frame, the vertical space the hotel itself needs — before
 * this existed the management shell began 1272px down the page, below the
 * audio sliders. A drawer keeps them one click away instead of permanently
 * in front of the game.
 *
 * The content stays mounted and keeps its landmark either way, so the panels
 * inside remain one `aria-label` lookup away for assistive technology and for
 * the tests that assert this chrome lives outside `<main>`. Closed, it carries
 * `hidden`, which takes it out of the tab order and the accessibility tree
 * rather than leaving it as invisible clutter to page through.
 */
export function Drawer({
  id,
  title,
  open,
  onClose,
  locale = "en-GB",
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  locale?: GameLocale;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const closer = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef<boolean>(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      openerRef.current = (document.activeElement as HTMLElement | null) ?? null;
      closer.current?.focus();
    } else if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
      if (openerRef.current && document.contains(openerRef.current)) {
        openerRef.current.focus();
      }
      openerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (wasOpenRef.current && openerRef.current && document.contains(openerRef.current)) {
        openerRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab") {
        const node = panel.current;
        if (!node) return;

        const focusables = Array.from(
          node.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
          if (active === first || !node.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !node.contains(active)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="hm-drawer" id={id} hidden={!open}>
      <div
        className="hm-drawer__scrim"
        onClick={onClose}
        aria-hidden="true"
        data-testid={`${id}-scrim`}
      />
      <div
        className="hm-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panel}
      >
        <header className="hm-drawer__head">
          <h2>{title}</h2>
          <button
            type="button"
            className="hm-drawer__close"
            onClick={onClose}
            ref={closer}
          >
            {translateGame(locale, "topbar.close")}
          </button>
        </header>
        <div className="hm-drawer__body">{children}</div>
      </div>
    </div>
  );
}
