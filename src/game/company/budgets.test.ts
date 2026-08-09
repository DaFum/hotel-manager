import { describe, expect, it } from "vitest";
import {
  budgetVariance,
  canSpendCapex,
  createHotelBudget,
  recordCapexSpend,
  resetBudgetPeriod,
  spendableCapexMinor,
} from "./budgets";

describe("hotel budgets", () => {
  it("rejects local capex above the assigned hotel budget", () => {
    expect(
      canSpendCapex(
        { capexBudgetMinor: 5_000_000, capexSpentMinor: 4_500_000 },
        600_000,
      ),
    ).toBe(false);
  });

  it("allows spending up to the budget exactly", () => {
    const budget = { capexBudgetMinor: 5_000_000, capexSpentMinor: 4_500_000 };
    expect(canSpendCapex(budget, 500_000)).toBe(true);
    expect(spendableCapexMinor(budget)).toBe(500_000);
  });

  it("refuses a negative amount rather than crediting the budget", () => {
    expect(
      canSpendCapex(
        { capexBudgetMinor: 5_000_000, capexSpentMinor: 0 },
        -100_000,
      ),
    ).toBe(false);
  });

  it("records a spend and refuses one that would break the budget", () => {
    const budget = createHotelBudget({
      hotelId: "hotel.frankfurt.1",
      periodKey: "1991-Q1",
      capexBudgetMinor: 5_000_000,
      operatingBudgetMinor: 20_000_000,
    });
    const after = recordCapexSpend(budget, 4_500_000);
    expect(after.capexSpentMinor).toBe(4_500_000);
    expect(() => recordCapexSpend(after, 600_000)).toThrow(/budget/);
    // The refused spend left the budget exactly as it was.
    expect(after.capexSpentMinor).toBe(4_500_000);
  });

  it("reports variance against the corporate target with its sign and cause", () => {
    expect(
      budgetVariance({
        targetMinor: 20_000_000,
        actualMinor: 22_500_000,
        type: "revenue",
      }),
    ).toEqual({
      varianceMinor: 2_500_000,
      varianceBasisPoints: 1250,
      favourable: true,
    });
    expect(
      budgetVariance({
        targetMinor: 20_000_000,
        actualMinor: 18_000_000,
        type: "revenue",
      }),
    ).toEqual({
      varianceMinor: -2_000_000,
      varianceBasisPoints: -1000,
      favourable: false,
    });
    expect(
      budgetVariance({
        targetMinor: 20_000_000,
        actualMinor: 22_500_000,
        type: "cost",
      }),
    ).toEqual({
      varianceMinor: 2_500_000,
      varianceBasisPoints: 1250,
      favourable: false,
    });
    // A target of nothing cannot be missed by a percentage.
    expect(
      budgetVariance({ targetMinor: 0, actualMinor: 500, type: "revenue" }),
    ).toEqual({
      varianceMinor: 500,
      varianceBasisPoints: 0,
      favourable: true,
    });
  });

  it("rolls into a new period with the spend reset and the budget restated", () => {
    const budget = recordCapexSpend(
      createHotelBudget({
        hotelId: "hotel.frankfurt.1",
        periodKey: "1991-Q1",
        capexBudgetMinor: 5_000_000,
        operatingBudgetMinor: 20_000_000,
      }),
      3_000_000,
    );
    const next = resetBudgetPeriod(budget, "1991-Q2", {
      capexBudgetMinor: 7_000_000,
    });
    expect(next).toEqual({
      hotelId: "hotel.frankfurt.1",
      periodKey: "1991-Q2",
      capexBudgetMinor: 7_000_000,
      capexSpentMinor: 0,
      operatingBudgetMinor: 20_000_000,
    });
  });

  it("refuses a budget that is not whole Pfennig", () => {
    expect(() =>
      createHotelBudget({
        hotelId: "hotel.frankfurt.1",
        periodKey: "1991-Q1",
        capexBudgetMinor: -1,
        operatingBudgetMinor: 0,
      }),
    ).toThrow(/capex budget/);
  });
});
