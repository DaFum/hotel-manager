export interface ConformanceRow {
  id: string;
  implementationPath: string;
  evidence: { path: string; assertion: string };
}
export const REVENUE_CONFORMANCE: readonly ConformanceRow[] = [
  {
    id: "revenue.ratePlans.enforced",
    implementationPath: "src/game/revenue/revenuePolicy.ts",
    evidence: {
      path: "src/game/revenue/revenuePolicy.test.ts",
      assertion: "enforces restrictions and bounded explainable automation",
    },
  },
  {
    id: "revenue.overbooking.recommendation",
    implementationPath: "src/game/revenue/overbooking.ts",
    evidence: {
      path: "src/game/revenue/overbooking.test.ts",
      assertion:
        "biases the history-based overbooking recommendation by risk tolerance",
    },
  },
  {
    id: "revenue.goppar.metric",
    implementationPath: "src/game/revenue/metrics.ts",
    evidence: {
      path: "src/game/revenue/metrics.test.ts",
      assertion: "calculates GOPPAR in whole minor units",
    },
  },
  {
    id: "distribution.commands.inventory",
    implementationPath: "src/game/distribution/distributionCommands.ts",
    evidence: {
      path: "src/game/distribution/distributionCommands.test.ts",
      assertion:
        "accepts an allotment, constrains inventory, and changes channel controls",
    },
  },
];
export const REQUIRED_ACCEPTANCE_IDS = REVENUE_CONFORMANCE.map((row) => row.id);
