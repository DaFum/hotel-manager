export interface VisualAgent {
  id: string;
  kind: "guest" | "staff";
  locationId: string;
  queuedFor?: string;
}
export interface ElevatorVisualState {
  id: string;
  capacity: number;
  queue: number;
  travelMinutes: number;
  failed: boolean;
}
export function materializeAgents(
  agents: readonly VisualAgent[],
  limit: number,
): VisualAgent[] {
  if (!Number.isSafeInteger(limit) || limit < 0)
    throw new Error("invalid materialization limit");
  return [...agents]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit);
}
export function elevatorVisual(state: ElevatorVisualState) {
  return {
    ...state,
    cause: state.failed
      ? "out of service"
      : state.queue > state.capacity
        ? "queue exceeds car capacity"
        : "available",
    waitMinutes: state.failed
      ? 60
      : Math.ceil(state.queue / Math.max(1, state.capacity)) *
        state.travelMinutes,
  };
}
