import { expect, it } from "vitest";
import { createInitialGameState } from "../simulation/initialState";
import { migrateEnvelope, validateEnvelope } from "../persistence/saveSchema";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "../persistence/saveVersions";
import { runWorldMonths, runWorldYears } from "../test/worldScenario";
import { DEFAULT_PLAYER_PREFERENCES } from "../settings/playerPreferences";

it("keeps 50 years bounded and deterministic across a persisted checkpoint", () => {
  const uninterrupted = runWorldYears(50, 9001);
  expect(runWorldYears(50, 9001)).toEqual(uninterrupted);
  expect(uninterrupted.maxInflationBp).toBeLessThan(5000);
  expect(uninterrupted.maxTechnologyBp).toBeLessThanOrEqual(10000);
  expect(uninterrupted.state.yearsAdvanced).toBe(50);

  const firstHalf = runWorldMonths(25 * 12, 9001);
  const game = createInitialGameState(9001);
  game.world = firstHalf.state;
  game.rngState = firstHalf.rngState;
  const saved = migrateEnvelope({
    saveVersion: SAVE_VERSION,
    contentVersion: CONTENT_VERSION,
    protocolVersion: 2,
    rngState: firstHalf.rngState,
    state: game,
    preferences: DEFAULT_PLAYER_PREFERENCES,
  } satisfies SaveEnvelope);
  expect(validateEnvelope(saved)).toEqual([]);
  const restored = saved.state as typeof game;
  const continued = runWorldMonths(25 * 12, 9001, {
    state: restored.world,
    rngState: restored.rngState,
  });
  expect({ state: continued.state, rngState: continued.rngState }).toEqual({
    state: uninterrupted.state,
    rngState: uninterrupted.rngState,
  });
});
