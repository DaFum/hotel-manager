import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../simulation/initialState";
import {
  applyRecoveryPath,
  HEADQUARTERS_COST_FLOOR_MINOR,
  INVESTOR_STAKE_CAP_BASIS_POINTS,
  retireHotelFromCompany,
  validateRecoveryPath,
} from "./recovery";
import { createHotelBudget } from "../company/budgets";
import { createManagerAuthority } from "../management/managerAuthority";
import {
  closeHotelAccount,
  consolidatedCashMinor,
  openHotelAccount,
} from "../treasury/treasury";
import { syncTreasury } from "../company/companyMonth";
import { monthlyOwnershipPostings } from "../ownership/models";
import { valueCompany } from "../ma/valuation";
import { debtSchedule } from "../finance/debt";

const SOLD = "hotel.offenbach.1";

/** A group that owns a second house, with every record that implies. */
function groupOwningTwo() {
  const state = createInitialGameState(7);
  const c = state.company;
  c.portfolio = { ...c.portfolio, hotelIds: [...c.portfolio.hotelIds, SOLD] };
  c.managedHotels = [
    ...c.managedHotels,
    {
      hotelId: SOLD,
      name: "Offenbacher Hof",
      cityId: "city.frankfurt.de",
      rooms: 60,
      adrMinor: 12_000,
      occupancyBasisPoints: 6000,
      gopMarginBasisPoints: 2500,
      openedDateKey: "1991-01-01",
    },
  ];
  c.hotelResults[SOLD] = {
    hotelId: SOLD,
    periodKey: "1991-01",
    roomRevenueMinor: 1_000_000,
    eventRevenueMinor: 0,
    otherRevenueMinor: 0,
    operatingExpenseMinor: 400_000,
    grossOperatingProfitMinor: 600_000,
    occupancyBasisPoints: 6000,
    soldRoomNights: 1_000,
    availableRoomNights: 1_800,
    qualityStars: 3,
    cashNeedMinor: 0,
    renovationNeedMinor: 0,
  };
  c.treasury = openHotelAccount(c.treasury, SOLD, 0);
  c.managers = [
    ...c.managers,
    {
      id: "manager.offenbach",
      name: "Ilse Brandt",
      hotelId: SOLD,
      competence: 70,
      authority: createManagerAuthority(),
    },
  ];
  c.escalations = [
    ...c.escalations,
    {
      id: "escalation.1",
      hotelId: SOLD,
      managerId: "manager.offenbach",
      raisedAtMinutes: 0,
      decision: { kind: "repair", amountMinor: 900_000 },
      reason: "over the repair limit",
      status: "open",
      resolvedAtMinutes: null,
    },
  ];
  c.budgets = [
    ...c.budgets,
    createHotelBudget({
      hotelId: SOLD,
      periodKey: "1991-01",
      capexBudgetMinor: 500_000,
      operatingBudgetMinor: 500_000,
    }),
  ];
  c.brandAssignments = [
    ...c.brandAssignments,
    { hotelId: SOLD, brandId: "brand.mainblick", sinceDateKey: "1991-01-01" },
  ];
  c.brandAudits = [
    ...c.brandAudits,
    {
      hotelId: SOLD,
      brandId: "brand.mainblick",
      dateKey: "1991-01",
      compliant: false,
      failures: ["breakfast"],
      remediationDueDateKey: "1991-04-01",
    },
  ];
  c.operatingModels = { ...c.operatingModels, [SOLD]: { kind: "owned" } };
  return state;
}

function distressedGroup() {
  const state = groupOwningTwo();
  state.finance.payableMinor = state.finance.cashMinor + 1_000_000;
  return state;
}

function recordingContext(state: ReturnType<typeof createInitialGameState>) {
  const calls: {
    kind: "earn" | "spend";
    amountMinor: number;
    account: string;
  }[] = [];
  return {
    calls,
    ctx: {
      earn(amountMinor: number, account: string) {
        calls.push({ kind: "earn", amountMinor, account });
        state.finance.cashMinor += amountMinor;
        syncTreasury(state);
      },
      spend(amountMinor: number, account: string) {
        calls.push({ kind: "spend", amountMinor, account });
        state.finance.cashMinor -= amountMinor;
        syncTreasury(state);
      },
    },
  };
}

function expectCashReconciled(
  state: ReturnType<typeof createInitialGameState>,
) {
  expect(consolidatedCashMinor(state.company.treasury)).toBe(
    state.finance.cashMinor,
  );
}

describe("retiring a hotel from the company", () => {
  it("closes every record that only existed because the group owned it", () => {
    const state = groupOwningTwo();
    retireHotelFromCompany(state, SOLD);
    const c = state.company;

    expect(c.portfolio.hotelIds).not.toContain(SOLD);
    expect(c.managedHotels.some((h) => h.hotelId === SOLD)).toBe(false);
    expect(c.hotelResults[SOLD]).toBeUndefined();
    // A manager managing nothing and an escalation nobody can decide are both
    // phantom management the UI would keep showing.
    expect(c.managers.some((m) => m.hotelId === SOLD)).toBe(false);
    expect(c.escalations.some((e) => e.hotelId === SOLD)).toBe(false);
    expect(c.budgets.some((b) => b.hotelId === SOLD)).toBe(false);
    // The flag comes down with the building, and so does its audit history:
    // the group cannot be held to a standard at an address it has sold.
    expect(c.brandAssignments.some((a) => a.hotelId === SOLD)).toBe(false);
    expect(c.brandAudits.some((a) => a.hotelId === SOLD)).toBe(false);
    expect(Object.hasOwn(c.operatingModels, SOLD)).toBe(false);
    expect(Object.hasOwn(c.treasury.hotelCashMinor, SOLD)).toBe(false);

    // The house it still runs is untouched.
    expect(c.portfolio.hotelIds).toContain(state.hotel.id);
    expect(Object.hasOwn(c.treasury.hotelCashMinor, state.hotel.id)).toBe(true);
  });

  it("sweeps the closed account rather than losing what was in it", () => {
    const state = createInitialGameState(7);
    const opened = openHotelAccount(state.company.treasury, SOLD, 0);
    const before = consolidatedCashMinor(opened);
    // Allocate real money to the house, then sell it.
    const funded = {
      ...opened,
      hqMinor: opened.hqMinor - 250_000,
      hotelCashMinor: { ...opened.hotelCashMinor, [SOLD]: 250_000 },
    };
    expect(consolidatedCashMinor(funded)).toBe(before);

    const closed = closeHotelAccount(funded, SOLD);
    // The group's cash did not change because a house changed hands; it has to
    // keep reconciling to the ledger.
    expect(consolidatedCashMinor(closed)).toBe(before);
    expect(closed.hqMinor).toBe(opened.hqMinor);
    expect(Object.hasOwn(closed.hotelCashMinor, SOLD)).toBe(false);
  });

  it("refuses to retire a house the group does not own", () => {
    const state = groupOwningTwo();
    retireHotelFromCompany(state, SOLD);
    const cash = consolidatedCashMinor(state.company.treasury);
    // A caller holding the wrong id is a bug worth hearing about, and the cash
    // position is left exactly as it was.
    expect(() => retireHotelFromCompany(state, SOLD)).toThrow(
      /not in the portfolio/,
    );
    expect(consolidatedCashMinor(state.company.treasury)).toBe(cash);
  });
});

describe("distress recovery measures", () => {
  it("refuses each exhausted resource with a specific reason", () => {
    const state = createInitialGameState(7);
    state.finance.payableMinor = state.finance.cashMinor + 1;
    state.company.headquarters.baseMonthlyCostMinor =
      HEADQUARTERS_COST_FLOOR_MINOR;
    state.company.headquarters.perHotelMonthlyCostMinor = 0;
    state.company.investorStakeBasisPoints = INVESTOR_STAKE_CAP_BASIS_POINTS;
    state.loan = { ...state.loan, principalMinor: 0, termMonths: 600 };

    expect(validateRecoveryPath(state, "asset-sale")).toEqual({
      ok: false,
      reason: "no owned non-flagship hotel can be leased back",
    });
    expect(validateRecoveryPath(state, "market-exit")).toEqual({
      ok: false,
      reason: "no city can be exited",
    });
    expect(validateRecoveryPath(state, "restructure")).toEqual({
      ok: false,
      reason: "headquarters overhead is already at the floor",
    });
    expect(validateRecoveryPath(state, "investor")).toEqual({
      ok: false,
      reason: "investor capacity is exhausted",
    });
    expect(validateRecoveryPath(state, "turnaround")).toEqual({
      ok: false,
      reason: "no loan can be rescheduled",
    });
  });

  it("leases back the first eligible asset and creates recurring rent", () => {
    const state = distressedGroup();
    const { calls, ctx } = recordingContext(state);
    const cashBefore = state.finance.cashMinor;
    const result = applyRecoveryPath(state, "asset-sale", ctx);

    expect(state.company.operatingModels[SOLD]).toMatchObject({
      kind: "lease",
    });
    expect(
      monthlyOwnershipPostings(state.company.operatingModels[SOLD], 0),
    ).toEqual([
      expect.objectContaining({
        account: "leaseRent",
        amountMinor: expect.any(Number),
      }),
    ]);
    expect(calls).toEqual([
      { kind: "earn", amountMinor: result.amountMinor, account: "disposal" },
    ]);
    expect(state.finance.cashMinor).toBe(cashBefore + result.amountMinor);
    expectCashReconciled(state);
  });

  it("exits only the weakest target city and cancels its developments", () => {
    const state = distressedGroup();
    const OTHER = "hotel.munich.1";
    state.company.portfolio.hotelIds.push(OTHER);
    state.company.managedHotels.push({
      ...state.company.managedHotels[0],
      hotelId: OTHER,
      cityId: "city.munich.de",
    });
    state.company.hotelResults[OTHER] = {
      ...state.company.hotelResults[SOLD],
      hotelId: OTHER,
      grossOperatingProfitMinor: 900_000,
    };
    state.company.operatingModels[OTHER] = { kind: "owned" };
    state.company.treasury = openHotelAccount(state.company.treasury, OTHER, 0);
    state.company.developments = [
      { id: "dev.exit", cityId: "city.frankfurt.de" } as any,
      { id: "dev.keep", cityId: "city.munich.de" } as any,
    ];
    const { calls, ctx } = recordingContext(state);
    applyRecoveryPath(state, "market-exit", ctx);

    expect(state.company.portfolio.hotelIds).not.toContain(SOLD);
    expect(state.company.portfolio.hotelIds).toContain(OTHER);
    expect(state.company.developments.map((d) => d.id)).toEqual(["dev.keep"]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ kind: "earn", account: "disposal" });
    expectCashReconciled(state);
  });

  it("reduces headquarters cost and pays reorganization through context", () => {
    const state = distressedGroup();
    const before = state.company.headquarters.baseMonthlyCostMinor;
    const { calls, ctx } = recordingContext(state);
    applyRecoveryPath(state, "restructure", ctx);

    expect(state.company.headquarters.baseMonthlyCostMinor).toBeLessThan(
      before,
    );
    expect(calls).toEqual([
      { kind: "spend", amountMinor: 500_000, account: "supplies" },
    ]);
    expectCashReconciled(state);
  });

  it("preserves used capex and stops offering restructuring at the base floor", () => {
    const state = distressedGroup();
    state.company.budgets[0].capexSpentMinor = 123_456;
    const { ctx } = recordingContext(state);
    applyRecoveryPath(state, "restructure", ctx);
    expect(state.company.budgets[0].capexSpentMinor).toBe(123_456);

    state.company.headquarters.baseMonthlyCostMinor =
      HEADQUARTERS_COST_FLOOR_MINOR;
    expect(validateRecoveryPath(state, "restructure")).toMatchObject({
      ok: false,
    });
  });

  it("uses supplier invoices in the same distress test used by validation", () => {
    const state = groupOwningTwo();
    state.finance.supplierInvoices.push({
      id: "supplier-invoice.overdue",
      amountMinor: state.finance.cashMinor + 1,
      dueDateKey: state.calendar.dateKey,
    });
    expect(validateRecoveryPath(state, "refinance")).toEqual({ ok: true });
  });

  it("injects equity with exact dilution and respects the majority cap", () => {
    const state = distressedGroup();
    const valuation = valueCompany(state);
    const { calls, ctx } = recordingContext(state);
    const result = applyRecoveryPath(state, "investor", ctx);
    const expectedStake = Math.trunc((result.amountMinor * 10_000) / valuation);

    expect(state.company.investorStakeBasisPoints).toBe(expectedStake);
    expect(calls).toEqual([
      { kind: "earn", amountMinor: result.amountMinor, account: "capital" },
    ]);
    expectCashReconciled(state);

    const capped = distressedGroup();
    capped.company.investorStakeBasisPoints = INVESTOR_STAKE_CAP_BASIS_POINTS;
    expect(validateRecoveryPath(capped, "investor")).toEqual({
      ok: false,
      reason: "investor capacity is exhausted",
    });
  });

  it("reschedules debt and pays its advisory fee through context", () => {
    const state = distressedGroup();
    const before = state.loan;
    const paymentBefore = debtSchedule(before)[0].principalMinor;
    const { calls, ctx } = recordingContext(state);
    applyRecoveryPath(state, "turnaround", ctx);

    expect(state.loan.principalMinor).toBe(before.principalMinor);
    expect(state.loan.termMonths).toBeGreaterThan(before.termMonths);
    expect(state.loan.annualRateBasisPoints).toBeGreaterThan(
      before.annualRateBasisPoints,
    );
    expect(debtSchedule(state.loan)[0].principalMinor).toBeLessThan(
      paymentBefore,
    );
    expect(calls).toEqual([
      { kind: "spend", amountMinor: 250_000, account: "supplies" },
    ]);
    expectCashReconciled(state);
  });
});
