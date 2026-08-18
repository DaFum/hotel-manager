sed -i 's/operatingProfitMinor: number;/operatingProfitMinor: number;\n  \/\*\* Accumulated interest so far this financial year. \*\/\n  interestMinor: number;/' src/game/narrative/narrativeState.ts
sed -i 's/operatingProfitMinor: 0,/operatingProfitMinor: 0,\n      interestMinor: 0,/' src/game/narrative/narrativeState.ts
sed -i 's/Number.isSafeInteger(value.operatingProfitMinor) &&/Number.isSafeInteger(value.operatingProfitMinor) \&\&\n    Number.isSafeInteger(value.interestMinor) \&\&/' src/game/narrative/narrativeSchema.ts
