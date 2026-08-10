export type TutorialStep =
  "set-room-price" | "inspect-bookings" | "hire-housekeeping" | "complete";
export interface TutorialState {
  step: TutorialStep;
  completed: string[];
}
const expected: Record<TutorialStep, string | null> = {
  "set-room-price": "SET_ROOM_RATE",
  "inspect-bookings": "OPEN_BOOKINGS",
  "hire-housekeeping": "HIRE_EMPLOYEE",
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
  action: string,
): TutorialState {
  const matches =
    expected[state.step] === action ||
    (state.step === "set-room-price" && action === "SET_RATE");
  return matches
    ? {
        step: next[state.step],
        completed: [...new Set([...state.completed, state.step])],
      }
    : state;
}
