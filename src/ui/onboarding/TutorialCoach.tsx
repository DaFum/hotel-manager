import type { TutorialState } from "./tutorialState";
const guidance: Record<TutorialState["step"], string> = {
  "set-room-price": "Set your first room price.",
  "inspect-bookings": "Inspect upcoming bookings.",
  "hire-housekeeping": "Hire a housekeeping employee.",
  complete: "Onboarding complete.",
};
export function TutorialCoach({
  state,
  onDismiss,
  onAction,
}: {
  state: TutorialState;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
}) {
  return (
    <aside aria-label="Guided onboarding">
      <h2>Getting started</h2>
      <p aria-live="polite">{guidance[state.step]}</p>
      {state.step === "inspect-bookings" && onAction ? (
        <button onClick={() => onAction("OPEN_BOOKINGS")}>
          Inspect bookings
        </button>
      ) : null}
      {onDismiss ? <button onClick={onDismiss}>Dismiss tutorial</button> : null}
    </aside>
  );
}
