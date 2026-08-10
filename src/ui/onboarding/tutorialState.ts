export type TutorialStep =
  "set-room-price" | "inspect-bookings" | "hire-housekeeping" | "complete";
export interface TutorialState {
  step: TutorialStep;
  completed: string[];
}
export type TutorialObservation =
  "SET_RATE_ACCEPTED" | "OPEN_BOOKINGS" | "HIRE_ACCEPTED";
const expected: Record<TutorialStep, TutorialObservation | null> = {
  "set-room-price": "SET_RATE_ACCEPTED",
  "inspect-bookings": "OPEN_BOOKINGS",
  "hire-housekeeping": "HIRE_ACCEPTED",
  complete: null,
};
const next: Record<TutorialStep, TutorialStep> = {
  "set-room-price": "inspect-bookings",
  "inspect-bookings": "hire-housekeeping",
  "hire-housekeeping": "complete",
  complete: "complete",
};
export function completeTutorialStep(
  state: TutorialState,
  action: TutorialObservation,
): TutorialState {
  return expected[state.step] === action
    ? {
        step: next[state.step],
        completed: [...new Set([...state.completed, state.step])],
      }
    : state;
}
