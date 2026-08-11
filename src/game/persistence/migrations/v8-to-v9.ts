import { createFnbState, isFnbState } from "../../fnb/fnbState";
import type { SaveEnvelope } from "../saveVersions";

/** Save v9 adds authoritative per-outlet F&B operating results. */
export function migrateV8ToV9(oldSave: SaveEnvelope): SaveEnvelope {
  const cloned = structuredClone(oldSave.state);
  const state =
    cloned && typeof cloned === "object"
      ? (cloned as Record<string, unknown>)
      : {};
  return {
    ...oldSave,
    saveVersion: 9,
    state: {
      ...state,
      fnb: isFnbState(state.fnb) ? state.fnb : createFnbState(),
    },
  };
}
