import {
  captureRngState,
  createRngStreams,
  restoreRngStreams,
  type RngStateRecord,
} from "../domain/rng";
import {
  createWorldState,
  WorldSimulation,
  type WorldState,
} from "../world/WorldSimulation";

export function runWorldMonths(
  months: number,
  seed: number,
  checkpoint?: { state: WorldState; rngState: RngStateRecord },
) {
  const streams = checkpoint
    ? restoreRngStreams(checkpoint.rngState)
    : createRngStreams(seed);
  const simulation = new WorldSimulation(streams);
  let state = checkpoint
    ? structuredClone(checkpoint.state)
    : createWorldState();
  let maxInflationBp = state.macro.inflationBp;
  let maxTechnologyBp = Math.max(
    ...state.technologies.map((t) => t.adoptionBp),
  );
  for (let month = 0; month < months; month++) {
    state = simulation.stepMonth(state);
    maxInflationBp = Math.max(maxInflationBp, state.macro.inflationBp);
    maxTechnologyBp = Math.max(
      maxTechnologyBp,
      ...state.technologies.map((technology) => technology.adoptionBp),
    );
  }
  return {
    state,
    rngState: captureRngState(streams),
    maxInflationBp,
    maxTechnologyBp,
  };
}

export function runWorldYears(years: number, seed: number) {
  return runWorldMonths(years * 12, seed);
}
