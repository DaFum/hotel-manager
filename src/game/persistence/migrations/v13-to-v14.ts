import type { SaveEnvelope } from "../saveVersions";

/**
 * Migration from v13 to v14 adds missing narrative annual fields and tax payable.
 */
export function migrateV13ToV14(envelope: SaveEnvelope): SaveEnvelope {
  const state = structuredClone(envelope.state) as any;

  if (state.narrative) {
    if (typeof state.narrative.annualProfitMinor !== "number") {
      state.narrative.annualProfitMinor = 0;
    }
    if (typeof state.narrative.annualInterestMinor !== "number") {
      state.narrative.annualInterestMinor = 0;
    }
  }

  if (state.finance) {
    if (typeof state.finance.taxPayableMinor !== "number") {
      state.finance.taxPayableMinor = 0;
    }
  }

  return {
    ...envelope,
    saveVersion: 14,
    state,
  };
}
