export type RecoveryPath =
  | "refinance"
  | "restructure"
  | "sell-hotel"
  | "investor"
  | "asset-sale"
  | "market-exit"
  | "staff-reduction"
  | "turnaround";
export interface CareerOutcomeState {
  distress: "healthy" | "recoverable" | "terminal";
  availableRecoveryPaths: RecoveryPath[];
  careerMilestone2026: boolean;
  continueEndless: boolean;
  ended: boolean;
}
export function assessCareerOutcome(input: {
  cashMinor: number;
  hotelCount: number;
  year: number;
  creditAvailable: boolean;
}): CareerOutcomeState {
  const distress =
    input.cashMinor >= 0
      ? "healthy"
      : input.hotelCount > 0 || input.creditAvailable
        ? "recoverable"
        : "terminal";
  return {
    distress,
    availableRecoveryPaths:
      distress === "recoverable"
        ? [
            "refinance",
            "restructure",
            "sell-hotel",
            "investor",
            "asset-sale",
            "market-exit",
            "staff-reduction",
            "turnaround",
          ]
        : [],
    careerMilestone2026: input.year >= 2026,
    continueEndless: input.year >= 2026,
    ended: distress === "terminal",
  };
}
export function chooseEndlessContinuation(
  state: CareerOutcomeState,
): CareerOutcomeState {
  return { ...state, continueEndless: true, ended: false };
}
export function restartCareer(): { action: "restart"; dateKey: "1991-01-01" } {
  return { action: "restart", dateKey: "1991-01-01" };
}
