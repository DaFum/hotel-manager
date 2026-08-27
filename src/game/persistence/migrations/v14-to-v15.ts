import type { SaveEnvelope } from "../saveVersions";

/** Version 15 persists the outside equity stake introduced by investors. */
export function migrateV14ToV15(save: SaveEnvelope): SaveEnvelope {
  if (save.saveVersion !== 14) return save;
  const state = structuredClone(save.state) as any;
  if (!state?.company || typeof state.company !== "object")
    throw new Error("save state must contain a company");
  state.company.investorStakeBasisPoints = 0;
  return { ...save, saveVersion: 15, state };
}
