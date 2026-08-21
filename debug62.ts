import { GameSimulation } from "./src/game/simulation/GameSimulation";
import { createInitialGameState } from "./src/game/simulation/initialState";

const state = createInitialGameState(17);
console.log("fixedAssetsMinor", state.statements.fixedAssetsMinor);
console.log("contributed", state.statements.contributedCapitalMinor);
