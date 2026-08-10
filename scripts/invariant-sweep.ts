import { fileURLToPath } from "node:url";
import { stateHash } from "../src/game/debug/stateHash";
import { GameSimulation } from "../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../src/game/simulation/initialState";
import { assertInvariants } from "../src/game/simulation/invariants";

export function seedsForSweep(): number[] {
  return Array.from({ length: 100 }, (_, index) => 1009 + index * 7919);
}

function sample(seed: number): string {
  const simulation = new GameSimulation(createInitialGameState(seed));
  for (let quantum = 0; quantum < 288; quantum++) simulation.advanceQuantum();
  assertInvariants(simulation.state);
  return stateHash(simulation.snapshot());
}

export function runInvariantSweep(): void {
  for (const seed of seedsForSweep()) {
    const first = sample(seed);
    const repeated = sample(seed);
    if (first !== repeated)
      throw new Error(
        `seed ${seed} is nondeterministic: ${first} != ${repeated}`,
      );
  }
  console.log(
    `invariant sweep PASS (${seedsForSweep().length} seeds, two deterministic days each)`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  runInvariantSweep();
