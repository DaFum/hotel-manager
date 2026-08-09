import { createRngStreams } from "../domain/rng";
import { createWorldState, WorldSimulation } from "../world/WorldSimulation";
export function runWorldYears(years: number, seed: number) {
  const simulation = new WorldSimulation(createRngStreams(seed));
  let state = createWorldState(),
    maxInflationBp = state.macro.inflationBp,
    maxTechnologyBp = 0;
  for (let month = 0; month < years * 12; month++) {
    state = simulation.stepMonth(state);
    maxInflationBp = Math.max(maxInflationBp, state.macro.inflationBp);
    maxTechnologyBp = Math.max(
      maxTechnologyBp,
      ...state.technologies.map((t) => t.adoptionBp),
    );
  }
  return { state, maxInflationBp, maxTechnologyBp };
}
