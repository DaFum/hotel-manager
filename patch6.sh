sed -i 's/operatingExpenseMinor: number;/operatingExpenseMinor: number;\n  interestMinor: number;/' src/game/simulation/initialState.ts
sed -i 's/payableMinor: number;/payableMinor: number;\n    taxPayableMinor: number;/' src/game/simulation/initialState.ts
sed -i 's/payableMinor: 0,/payableMinor: 0,\n      taxPayableMinor: 0,/' src/game/simulation/initialState.ts
sed -i 's/operatingExpenseMinor: 0,/operatingExpenseMinor: 0,\n        interestMinor: 0,/' src/game/simulation/initialState.ts
