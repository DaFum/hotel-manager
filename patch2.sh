sed -i 's/payablesMinor: state.finance.payableMinor,/payablesMinor: state.finance.payableMinor,\n      taxPayableMinor: 0,/' src/game/finance/statements.integration.test.ts
sed -i 's/payablesMinor: 250_000,/payablesMinor: 250_000,\n      taxPayableMinor: 0,/' src/game/finance/statements.test.ts
sed -i 's/payablesMinor: 0,/payablesMinor: 0,\n      taxPayableMinor: 0,/' src/game/finance/statements.test.ts
