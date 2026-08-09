import { expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import {
  EXPANSION_SQM,
  expansionCostMinor,
  specializationBonusBp,
  SPECIALIZATIONS,
} from "./specialization";

it("pays a profile only where the hotel actually invested", () => {
  expect(
    specializationBonusBp("spec.conference", {
      conferenceSqm: 400,
      wellnessSqm: 0,
    }),
  ).toBeGreaterThan(0);
  expect(
    specializationBonusBp("spec.conference", {
      conferenceSqm: 0,
      wellnessSqm: 400,
    }),
  ).toBe(0);
  expect(SPECIALIZATIONS.map((s) => s.id)).toContain("spec.wellness");
});

it("caps the bonus however large the build gets", () => {
  const spec = SPECIALIZATIONS[0];
  expect(
    specializationBonusBp(spec.id, {
      conferenceSqm: spec.thresholdSqm * 50,
      wellnessSqm: 0,
    }),
  ).toBe(spec.maxBonusBp);
});

it("refuses a nonsensical expansion size rather than costing NaN", () => {
  expect(() => expansionCostMinor(Number.NaN)).toThrow(/expansion/);
  expect(() => expansionCostMinor(-1)).toThrow(/expansion/);
});

it("pays a specialization only after the space is actually built", () => {
  const sim = new GameSimulation(createInitialGameState(424242));
  sim.queueCommand({
    type: "SET_SPECIALIZATION",
    specializationId: "spec.conference",
  });
  sim.applyPendingCommands();
  expect(specializationBonusBp("spec.conference", sim.state.investedArea)).toBe(
    0,
  );

  const cashBefore = sim.state.finance.cashMinor;
  const startingSqm = sim.state.investedArea.conferenceSqm;
  for (let i = 0; i < 2; i++) {
    sim.queueCommand({ type: "EXPAND_FACILITY", area: "conferenceSqm" });
    sim.applyPendingCommands();
  }
  expect(sim.state.investedArea.conferenceSqm).toBe(
    startingSqm + 2 * EXPANSION_SQM,
  );
  expect(cashBefore - sim.state.finance.cashMinor).toBe(
    2 * expansionCostMinor(),
  );
  expect(
    specializationBonusBp("spec.conference", sim.state.investedArea),
  ).toBeGreaterThan(0);
});

it("rejects an expansion the hotel cannot pay for", () => {
  const state = createInitialGameState(424242);
  state.finance.cashMinor = 1000;
  const sim = new GameSimulation(state);
  const verdict = sim.validateCommand({
    type: "EXPAND_FACILITY",
    area: "wellnessSqm",
  });
  expect(verdict).toEqual({ ok: false, reason: "insufficient cash" });
});
