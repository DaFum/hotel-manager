import { GameSimulation } from "./src/game/simulation/GameSimulation";
import { createInitialGameState } from "./src/game/simulation/initialState";
import { QUANTUM_MINUTES } from "./src/game/simulation/clock";

function play(days: number, seed = 17): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1) {
    s.advanceQuantum();
  }
  return s;
}

const s = play(40);
const state = s.state;

import { profitAndLoss, balanceSheet } from "./src/game/finance/statements";

const pl = profitAndLoss(state.finance.ledger);

const sheet = balanceSheet({
  cashMinor: state.finance.cashMinor,
  receivablesMinor: state.statements.receivablesMinor,
  fixedAssetsMinor: state.statements.fixedAssetsMinor,
  accumulatedDepreciationMinor: state.statements.accumulatedDepreciationMinor,
  payablesMinor: state.finance.payableMinor,
  taxPayableMinor: 0,
  debtMinor: state.loan.principalMinor,
  contributedCapitalMinor: state.statements.contributedCapitalMinor,
  retainedEarningsMinor: state.statements.retainedEarningsMinor,
});

console.log("assets:", sheet.totalAssetsMinor);
console.log("liabilities:", sheet.totalLiabilitiesMinor);
console.log("equity:", sheet.equityMinor);
console.log("diff:", sheet.totalAssetsMinor - sheet.totalLiabilitiesMinor - sheet.equityMinor);
