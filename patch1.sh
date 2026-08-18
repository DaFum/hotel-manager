sed -i 's/| "capex";/| "capex"\n  | "tax";/' src/game/finance/ledger.ts
sed -i 's/| "financing"/| "financing"\n  | "tax"/' src/game/finance/statements.ts
sed -i 's/interest: "financing",/interest: "financing",\n  tax: "tax",/' src/game/finance/statements.ts
