import { performance } from "node:perf_hooks";
import { GameSimulation } from "../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../src/game/simulation/initialState";

/** One simulated year at the five minute quantum. */
const TICKS = 105_120;
const BUDGET_MS = 30_000;

const sim = new GameSimulation(createInitialGameState(424242));
const start = performance.now();
for (let tick = 0; tick < TICKS; tick++) sim.advanceQuantum();
const elapsed = performance.now() - start;

const final = sim.snapshot();
console.log(
  `slice-benchmark ${TICKS} ticks ${elapsed.toFixed(1)}ms ` +
    `end=${final.calendar.dateKey} cash=${final.finance.cashMinor}`,
);
if (elapsed > BUDGET_MS) {
  console.error(
    `benchmark budget exceeded: ${elapsed.toFixed(1)}ms > ${BUDGET_MS}ms`,
  );
  process.exit(1);
}
