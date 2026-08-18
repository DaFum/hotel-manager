sed -i 's/payablesMinor: number;/payablesMinor: number;\n  taxPayableMinor: number;/' src/game/finance/statements.ts
sed -i 's/input.payablesMinor + input.debtMinor;/input.payablesMinor + input.taxPayableMinor + input.debtMinor;/' src/game/finance/statements.ts
