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
  return selectVisibleAgents(
    agents.map((agent) => ({ ...agent, priority: 1 })),
    limit,
  ).visible.map(({ priority: _priority, ...agent }) => agent);
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
import { selectVisibleAgents } from "../game/simulation/materialization";
