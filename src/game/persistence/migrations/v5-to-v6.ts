import type { SaveEnvelope } from "../saveVersions";
import {
  createNarrativeState,
  type NarrativeState,
} from "../../narrative/narrativeState";

export function migrateV5ToV6<T extends { saveVersion: 5 }>(
  oldSave: T,
): Omit<T, "saveVersion"> & { saveVersion: 6; narrative: NarrativeState };
export function migrateV5ToV6(oldSave: SaveEnvelope): SaveEnvelope;
export function migrateV5ToV6(
  oldSave: SaveEnvelope | ({ saveVersion: 5 } & Record<string, unknown>),
): any {
  if ("state" in oldSave) {
    const state = structuredClone(
      (oldSave.state ?? {}) as Record<string, unknown>,
    );
    return {
      ...oldSave,
      saveVersion: 6,
      contentVersion: "plan-06-v6",
      protocolVersion: 2,
      state: { ...state, narrative: normaliseNarrative(state.narrative) },
    };
  }
  return {
    ...oldSave,
    saveVersion: 6,
    narrative: normaliseNarrative(oldSave.narrative),
  };
}
export function normaliseNarrative(value: unknown): NarrativeState {
  const defaults = createNarrativeState();
  const partial =
    value && typeof value === "object"
      ? (value as Partial<NarrativeState>)
      : {};
  return {
    ...defaults,
    ...partial,
    chronicle: Array.isArray(partial.chronicle) ? partial.chronicle : [],
    activeEvents: Array.isArray(partial.activeEvents)
      ? partial.activeEvents
      : [],
    achievedMilestones: Array.isArray(partial.achievedMilestones)
      ? partial.achievedMilestones
      : [],
    lastFiredByDefinition:
      partial.lastFiredByDefinition &&
      typeof partial.lastFiredByDefinition === "object"
        ? partial.lastFiredByDefinition
        : {},
    rivals: Array.isArray(partial.rivals) ? partial.rivals : defaults.rivals,
    keyPeople: Array.isArray(partial.keyPeople) ? partial.keyPeople : [],
    opportunities: Array.isArray(partial.opportunities)
      ? partial.opportunities
      : [],
  };
}
