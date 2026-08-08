import type { GameCommand } from "../domain/commands";
import { advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import type { GameState } from "./initialState";

/** The MASTER deterministic phase contract; order is part of the save format. */
export const PHASE_ORDER = [
  "commands",
  "time",
  "arrivalsDepartures",
  "roomState",
  "staffService",
  "facilityThroughput",
  "inventory",
  "maintenanceFailures",
  "satisfaction",
  "finance",
  "demandBookings",
  "events",
  "snapshot",
] as const;

export type SimulationPhase = (typeof PHASE_ORDER)[number];

export class GameSimulation {
  private queued: GameCommand[] = [];

  constructor(public state: GameState) {}

  get pendingCommandCount(): number {
    return this.queued.length;
  }

  queueCommand(command: GameCommand): void {
    this.queued.push(command);
  }

  advanceQuantum(): void {
    for (const phase of PHASE_ORDER) this.runPhase(phase);
    assertInvariants(this.state);
  }

  /**
   * Each subsystem is called here in stable entity-id order as introduced by
   * its task; only the phases with slice behaviour are wired so far.
   */
  private runPhase(phase: SimulationPhase): void {
    switch (phase) {
      case "commands":
        this.queued = [];
        return;
      case "time":
        this.state = {
          ...this.state,
          calendar: advanceClock(this.state.calendar),
        };
        return;
      default:
        return;
    }
  }

  snapshot(): GameState {
    return structuredClone(this.state);
  }
}
