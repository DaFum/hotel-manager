import { REVENUE_CONFORMANCE } from "./plans0103Conformance";
export const ACCEPTANCE_REGISTRY = [
  {
    id: 1,
    title: "Multi-profile loan collection and credit standing",
    masterChapters: ["22.7-22.11", "22.16", "61.1", "73.1", "80.3"],
    evidence: [
      {
        id: "finance.loans.collection",
        implementationPath: "src/game/finance/loans.ts",
        evidence: {
          path: "src/game/finance/loans.test.ts",
          assertion: "validates and draws loans with multi-profile parameters",
        },
      },
      {
        id: "finance.debt.amortisation",
        implementationPath: "src/game/finance/debt.ts",
        evidence: {
          path: "src/game/finance/debt.test.ts",
          assertion: "branches on linear, annuity, and bullet profiles",
        },
      },
      {
        id: "finance.creditStanding",
        implementationPath: "src/game/finance/creditStanding.ts",
        evidence: {
          path: "src/game/finance/creditStanding.test.ts",
          assertion: "calculates whole-number credit standing score and limits",
        },
      },
      {
        id: "company.commands.loans",
        implementationPath: "src/game/company/companyCommands.ts",
        evidence: {
          path: "src/game/company/companyCommands.test.ts",
          assertion:
            "validates and applies TAKE_LOAN and REPAY_LOAN transactionally",
        },
      },
    ],
  },
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
