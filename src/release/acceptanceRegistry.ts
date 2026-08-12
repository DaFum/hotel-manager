import { REVENUE_CONFORMANCE } from "./plans0103Conformance";
export const ACCEPTANCE_REGISTRY = [
  {
    id: 2,
    title: "Revenue management",
    masterChapters: ["7"],
    evidence: REVENUE_CONFORMANCE,
  },
  {
    id: 33,
    title: "Insurance lifecycle and claims",
    masterChapters: ["33"],
    evidence: [
      {
        id: "insurance.claims.lifecycle",
        implementationPath: "src/game/risk/insurance.ts",
        evidence: {
          path: "src/game/risk/insurance.test.ts",
          assertion: "varies a policy immutably and revalidates its limits",
        },
      },
    ],
  },
];
