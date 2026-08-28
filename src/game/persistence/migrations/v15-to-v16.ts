import type { SaveEnvelope } from "../saveVersions";

/** Version 16 persists supplier invoices and the month ledger boundary. */
export function migrateV15ToV16(save: SaveEnvelope): SaveEnvelope {
  if (save.saveVersion !== 15) return save;
  const state = structuredClone(save.state) as any;
  const loan = state.loans?.[0] ?? state.loan;
  if (!state?.finance || !state.statements || !loan)
    throw new Error("save state must contain finance, statements, and loan");
  const retainedEarningsMinor = state.statements.retainedEarningsMinor ?? 0;
  const contributedCapitalMinor =
    state.statements.contributedCapitalMinor ??
    state.finance.cashMinor +
      state.statements.receivablesMinor +
      state.statements.fixedAssetsMinor -
      state.statements.accumulatedDepreciationMinor -
      state.finance.payableMinor -
      (state.finance.taxPayableMinor ?? 0) -
      loan.principalMinor -
      retainedEarningsMinor;
  state.statements = {
    contributedCapitalMinor,
    retainedEarningsMinor,
    ...state.statements,
  };
  state.finance = { supplierInvoices: [], ...state.finance };
  state.finance.month = {
    openingLedgerIndex: state.finance.ledger.length,
    ...state.finance.month,
  };
  return { ...save, saveVersion: 16, state };
}
