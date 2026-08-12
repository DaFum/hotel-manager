import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../simulation/initialState";
import { retireHotelFromCompany } from "./recovery";
import { createHotelBudget } from "../company/budgets";
import { createManagerAuthority } from "../management/managerAuthority";
import {
  closeHotelAccount,
  consolidatedCashMinor,
  openHotelAccount,
} from "../treasury/treasury";

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
