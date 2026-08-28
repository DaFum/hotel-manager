import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { commandEnvelope, type GameCommand } from "../commands/commandEnvelope";
import { consolidatedCashMinor } from "../treasury/treasury";
import { QUANTUM_MINUTES } from "../simulation/clock";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

let counter = 0;
function sim(seed = 31): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  s.takeDomainEvents();
  return s;
}

function submit(s: GameSimulation, payload: GameCommand) {
  counter += 1;
  return s.submitCommands([
    commandEnvelope({
      commandId: `company.cmd.${counter}`,
      issuedAtMinutes: s.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ])[0];
}

function runDays(s: GameSimulation, days: number): void {
  for (let i = 0; i < days * QUANTA_PER_DAY; i += 1) s.advanceQuantum();
}

describe("acquisitions through the simulation", () => {
  it("leaves the whole game untouched when an offer cannot be funded", () => {
    const s = sim();
    s.state.finance.cashMinor = 1_000_000;
    s.state.finance.ledger = [
      { day: 0, account: "capex", amountMinor: -39_000_000, memo: "setup" },
    ];
    s.state.statements.fixedAssetsMinor += 39_000_000;
    // The group only ever holds the cash the hotel holds; a fixture that
    // moves one without the other is not a state the game can reach.
    s.state.company.treasury.hqMinor = 1_000_000;
    const before = structuredClone(s.state);

    const result = submit(s, {
      type: "ACQUIRE_HOTEL",
      targetId: "target.offenbach.1",
      priceMinor: 30_000_000,
    });

    expect(result.status).toBe("rejected");
    expect(s.state.finance.cashMinor).toBe(before.finance.cashMinor);
    expect(s.state.company.portfolio.hotelIds).toEqual(
      before.company.portfolio.hotelIds,
    );
    expect(s.state.company.acquisitionTargets[0].status).toBe("available");
    // A refused command moves nothing but the journal of what was asked.
    expect(s.state.stateVersion).toBe(before.stateVersion);
    expect(s.takeDomainEvents()).toEqual([]);
  });

  it("moves cash, ownership, treasury and management in one transaction", () => {
    const s = sim();
    const cashBefore = s.state.finance.cashMinor;

    const result = submit(s, {
      type: "ACQUIRE_HOTEL",
      targetId: "target.offenbach.1",
      priceMinor: 30_000_000,
    });

    expect(result.status).toBe("accepted");
    const c = s.state.company;
    expect(c.portfolio.hotelIds).toContain("hotel.offenbach.1");
    expect(c.portfolio.hotelLegalEntity["hotel.offenbach.1"]).toBe(
      "entity.de.1",
    );
    expect(c.managedHotels.map((h) => h.hotelId)).toEqual([
      "hotel.offenbach.1",
    ]);
    expect(c.managers.some((m) => m.hotelId === "hotel.offenbach.1")).toBe(
      true,
    );
    expect(c.treasury.hotelCashMinor["hotel.offenbach.1"]).toBe(0);
    expect(s.state.finance.cashMinor).toBe(cashBefore - 30_000_000);
    expect(consolidatedCashMinor(c.treasury)).toBe(s.state.finance.cashMinor);
  });

  it("refuses an offer below what the seller will accept", () => {
    const s = sim();
    expect(
      submit(s, {
        type: "ACQUIRE_HOTEL",
        targetId: "target.offenbach.1",
        priceMinor: 1,
      }).reason,
    ).toMatch(/below what the seller will accept/);
  });

  it("lets diligence findings lower the price the seller will take", () => {
    const s = sim();
    const before = s.state.company.acquisitionTargets.find(
      (t) => t.id === "target.offenbach.1",
    )!;
    expect(before.hiddenFindings).toHaveLength(1);

    expect(
      submit(s, {
        type: "RUN_DUE_DILIGENCE",
        targetId: "target.offenbach.1",
        areas: ["environment"],
      }).status,
    ).toBe("accepted");

    const report = s.state.company.dueDiligence["target.offenbach.1"];
    expect(report.discoveredLiabilityMinor).toBe(4_200_000);
    // The finding is now the buyer's lever, so the same low offer that was
    // refused before is refused by exactly that much less.
    const rejected = submit(s, {
      type: "ACQUIRE_HOTEL",
      targetId: "target.offenbach.1",
      priceMinor: 1,
    });
    expect(rejected.status).toBe("rejected");
  });

  it("cannot buy the same hotel twice", () => {
    const s = sim();
    expect(
      submit(s, {
        type: "ACQUIRE_HOTEL",
        targetId: "target.offenbach.1",
        priceMinor: 30_000_000,
      }).status,
    ).toBe("accepted");
    expect(
      submit(s, {
        type: "ACQUIRE_HOTEL",
        targetId: "target.offenbach.1",
        priceMinor: 30_000_000,
      }).reason,
    ).toMatch(/already acquired/);
  });

  it("makes an acquired house publish a real monthly result upward", () => {
    const s = sim();
    submit(s, {
      type: "ACQUIRE_HOTEL",
      targetId: "target.offenbach.1",
      priceMinor: 30_000_000,
    });
    runDays(s, 40);

    const result = s.state.company.hotelResults["hotel.offenbach.1"];
    expect(result).toBeDefined();
    expect(result.availableRoomNights).toBeGreaterThan(0);
    expect(result.soldRoomNights).toBeGreaterThan(0);
    expect(result.roomRevenueMinor).toBeGreaterThan(0);
    expect(result.qualityStars).toBeGreaterThan(0);
    expect(Number.isSafeInteger(result.cashNeedMinor)).toBe(true);
    expect(result.cashNeedMinor).toBeGreaterThanOrEqual(0);
    expect(Number.isSafeInteger(result.renovationNeedMinor)).toBe(true);
    expect(result.renovationNeedMinor).toBeGreaterThan(0);
    expect(
      result.roomRevenueMinor +
        result.otherRevenueMinor -
        result.operatingExpenseMinor,
    ).toBe(result.grossOperatingProfitMinor);
    // The flagship reports too, from its own close rather than a formula.
    expect(s.state.company.hotelResults[s.state.hotel.id]).toBeDefined();
    expect(s.state.company.hotelResults[s.state.hotel.id].qualityStars).toBe(
      s.state.classification.stars,
    );
    expect(
      s.state.company.hotelResults[s.state.hotel.id].renovationNeedMinor,
    ).toBeGreaterThan(0);
  });

  it("keeps group cash and the treasury reconciled across a funding transfer", () => {
    const s = sim();
    submit(s, {
      type: "ACQUIRE_HOTEL",
      targetId: "target.offenbach.1",
      priceMinor: 30_000_000,
    });
    const before = consolidatedCashMinor(s.state.company.treasury);
    expect(
      submit(s, {
        type: "TRANSFER_INTERNAL_FUNDING",
        hotelId: "hotel.offenbach.1",
        amountMinor: 2_000_000,
        direction: "fund",
      }).status,
    ).toBe("accepted");

    expect(s.state.company.treasury.hotelCashMinor["hotel.offenbach.1"]).toBe(
      2_000_000,
    );
    expect(consolidatedCashMinor(s.state.company.treasury)).toBe(before);
    expect(consolidatedCashMinor(s.state.company.treasury)).toBe(
      s.state.finance.cashMinor,
    );
  });

  it("refuses a transfer the group has not got allocated", () => {
    const s = sim();
    expect(
      submit(s, {
        type: "TRANSFER_INTERNAL_FUNDING",
        hotelId: "hotel.frankfurt.1",
        amountMinor: Number.MAX_SAFE_INTEGER,
        direction: "fund",
      }).reason,
    ).toMatch(/insufficient allocated cash/);
  });

  it("charges the franchise royalty out of the flagship's own room revenue", () => {
    const s = sim();
    submit(s, {
      type: "SET_OPERATING_MODEL",
      hotelId: s.state.hotel.id,
      model: { kind: "franchise", royaltyBasisPoints: 500 },
    });
    runDays(s, 40);

    const royalties = s.state.finance.ledger.filter(
      (e) => e.account === "franchiseRoyalty",
    );
    expect(royalties.length).toBeGreaterThan(0);
    const result = s.state.company.hotelResults[s.state.hotel.id];
    expect(royalties[0].amountMinor).toBe(
      -Math.trunc((result.roomRevenueMinor * 500) / 10_000),
    );
  });

  it("keeps the group's own costs out of the flagship's published result", () => {
    const s = sim();
    // A brand programme is a company cost, charged at the close through the
    // same ledger the flagship trades in.
    submit(s, {
      type: "ASSIGN_BRAND",
      hotelId: s.state.hotel.id,
      brandId: "brand.mainblick",
    });
    runDays(s, 40);

    const result = s.state.company.hotelResults[s.state.hotel.id];
    const close = s.state.lastMonthlyClose;
    expect(result).toBeDefined();
    expect(close).not.toBeNull();
    // The group's close carries headquarters and the brand programme; the
    // house's result must not, or one house is charged for the whole company.
    const groupOnly = s.state.finance.ledger
      .filter((e) => ["headquarters", "brandProgramme"].includes(e.account))
      .reduce((sum, e) => sum + -e.amountMinor, 0);
    expect(groupOnly).toBeGreaterThan(0);
    expect(result.operatingExpenseMinor).toBe(
      close!.operatingExpenseMinor - groupOnly,
    );
    expect(result.grossOperatingProfitMinor).toBe(
      close!.operatingProfitMinor + groupOnly,
    );
  });
});
