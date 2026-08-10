import type { TutorialState } from "./tutorialState";
import type { TutorialObservation } from "./tutorialState";
import { translateGame, type GameLocale } from "../../i18n";
const guidance: Record<TutorialState["step"], string> = {
  "set-room-price": "tutorial.setRoomPrice",
  "inspect-bookings": "tutorial.inspectBookings",
  "hire-housekeeping": "tutorial.hireHousekeeping",
  complete: "tutorial.complete",
};
export function TutorialCoach({
  state,
  onDismiss,
  onAction,
  locale = "en-GB",
}: {
  state: TutorialState;
  onDismiss?: () => void;
  onAction?: (action: Extract<TutorialObservation, "OPEN_BOOKINGS">) => void;
  locale?: GameLocale;
}) {
  return (
    <aside aria-label={translateGame(locale, "tutorial.region")}>
      <h2>{translateGame(locale, "tutorial.heading")}</h2>
      <p aria-live="polite">{translateGame(locale, guidance[state.step])}</p>
      {state.step === "inspect-bookings" && onAction ? (
        <button onClick={() => onAction("OPEN_BOOKINGS")}>
          {translateGame(locale, "tutorial.inspectAction")}
        </button>
      ) : null}
      {onDismiss ? (
        <button onClick={onDismiss}>
          {translateGame(locale, "tutorial.dismiss")}
        </button>
      ) : null}
    </aside>
  );
}
