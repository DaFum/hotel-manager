import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { commandEnvelope, type GameCommand } from "../commands/commandEnvelope";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { efficiencyInvestmentCostMinor } from "./consumption";
import { centralPurchasingTradeOff, supplyChainTradeOff } from "../purchasing/contracts";

function sim(seed = 42): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  s.takeDomainEvents();
  return s;
}

let cmdCounter = 0;
function submit(simulation: GameSimulation, payload: GameCommand) {
  cmdCounter += 1;
  return simulation.submitCommands([
    commandEnvelope({
      commandId: `cmd.ut.${cmdCounter}`,
      issuedAtMinutes: simulation.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ])[0];
}

function advanceDays(simulation: GameSimulation, days: number) {
  const steps = (days * 1440) / QUANTUM_MINUTES;
  for (let i = 0; i < steps; i++) {
    simulation.advanceQuantum();
  }
}

describe("utility commands and simulation loop integration", () => {
  it("handles SIGN_UTILITY_CONTRACT: replaces contract and emits event, rejecting invalid inputs without state mutation", () => {
    const s = sim();
    const versionBefore = s.state.stateVersion;
    const rngBefore = structuredClone(s.state.rngState);

    // Invalid term: validTo <= validFrom
    const invalidTerm = submit(s, {
      type: "SIGN_UTILITY_CONTRACT",
      kind: "energy",
      supplierId: "supplier.green_power",
      standingChargeMinor: 50_000,
      unitPriceMinor: 40,
      validFromDateKey: "1991-06-01",
      validToDateKey: "1991-01-01",
      priceLock: "fixed",
    });
    expect(invalidTerm.status).toBe("rejected");
    expect(invalidTerm.reason).toMatch(/end after it starts/);
    expect(s.state.stateVersion).toBe(versionBefore);
    expect(s.state.rngState).toEqual(rngBefore);

    // Valid signing
    const validRes = submit(s, {
      type: "SIGN_UTILITY_CONTRACT",
      kind: "energy",
      supplierId: "supplier.green_power",
      standingChargeMinor: 50_000,
      unitPriceMinor: 40,
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-01-01",
      priceLock: "floating",
    });
    expect(validRes.status).toBe("accepted");
    expect(s.state.utilityContracts.energy.supplierId).toBe("supplier.green_power");
    expect(s.state.utilityContracts.energy.priceLock).toBe("floating");

    const events = s.takeDomainEvents();
    const signedEvent = events.find((e) => e.payload.type === "UTILITY_CONTRACT_SIGNED");
    expect(signedEvent).toBeDefined();
    expect(signedEvent?.payload).toMatchObject({
      kind: "energy",
      supplierId: "supplier.green_power",
      priceLock: "floating",
    });

    // Overlapping active contract rejection
    const overlapRes = submit(s, {
      type: "SIGN_UTILITY_CONTRACT",
      kind: "energy",
      supplierId: "supplier.another_power",
      standingChargeMinor: 60_000,
      unitPriceMinor: 50,
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-06-01",
      priceLock: "fixed",
    });
    expect(overlapRes.status).toBe("rejected");
    expect(overlapRes.reason).toMatch(/overlaps an active contract/);

    // Future start date rejection
    const futureRes = submit(s, {
      type: "SIGN_UTILITY_CONTRACT",
      kind: "energy",
      supplierId: "supplier.future_power",
      standingChargeMinor: 50_000,
      unitPriceMinor: 40,
      validFromDateKey: "1995-01-01",
      validToDateKey: "1996-01-01",
      priceLock: "fixed",
    });
    expect(futureRes.status).toBe("rejected");
    expect(futureRes.reason).toMatch(/cannot start in the future/);
  });

  it("handles INVEST_IN_EFFICIENCY: posts CapEx, pushes project, and applies saving only on completion", () => {
    const s = sim();
    const savingBp = 1000;
    const expectedCost = efficiencyInvestmentCostMinor(savingBp);

    // Excess efficiency investment rejection
    s.state.utilityContracts.energy.efficiencyBasisPoints = 5500;
    const overCapRes = submit(s, {
      type: "INVEST_IN_EFFICIENCY",
      kind: "energy",
      savingBasisPoints: 1000,
    });
    expect(overCapRes.status).toBe("rejected");
    expect(overCapRes.reason).toMatch(/exceed remaining potential/);
    s.state.utilityContracts.energy.efficiencyBasisPoints = 0;

    const res = submit(s, {
      type: "INVEST_IN_EFFICIENCY",
      kind: "energy",
      savingBasisPoints: savingBp,
    });
    expect(res.status).toBe("accepted");
    expect(s.state.efficiencyProjects).toHaveLength(1);
    expect(s.state.efficiencyProjects[0].kind).toBe("energy");
    expect(s.state.efficiencyProjects[0].savingBasisPoints).toBe(savingBp);

    // Verify CapEx posting
    expect(
      s.state.finance.ledger.some(
        (e) => e.account === "capex" && e.memo.includes("efficiency project for energy"),
      ),
    ).toBe(true);

    const initialEfficiency = s.state.utilityContracts.energy.efficiencyBasisPoints;
    expect(initialEfficiency).toBe(0);

    // Advance months until project completes (3 months)
    advanceDays(s, 32);
    expect(s.state.utilityContracts.energy.efficiencyBasisPoints).toBe(0); // Month 1

    advanceDays(s, 32);
    expect(s.state.utilityContracts.energy.efficiencyBasisPoints).toBe(0); // Month 2

    advanceDays(s, 32);
    // Month 3: project completes and applies investment
    expect(s.state.utilityContracts.energy.efficiencyBasisPoints).toBe(savingBp);
    expect(s.state.efficiencyProjects).toHaveLength(0);

    const events = s.takeDomainEvents();
    const completedEvent = events.find(
      (e) => e.payload.type === "EFFICIENCY_INVESTMENT_COMPLETED",
    );
    expect(completedEvent).toBeDefined();
    expect(completedEvent?.payload).toMatchObject({
      kind: "energy",
      savingBasisPoints: savingBp,
    });
  });

  it("triggers utility outage, sets non-Occupied rooms OutOfOrder, raises complaint, and restores to VacantDirty on recovery", () => {
    const s = sim();
    // Degrade plant condition to increase outage probability
    s.state.assets.find((a) => a.id === "asset.boiler")!.condition = 500;

    // Trigger daily roll until an outage starts
    let outageTriggered = false;
    for (let day = 0; day < 30; day++) {
      advanceDays(s, 1);
      if (s.state.outages.length > 0) {
        outageTriggered = true;
        break;
      }
    }
    expect(outageTriggered).toBe(true);

    const activeOutage = s.state.outages[0];
    expect(activeOutage.kind).toBe("energy");

    // Check non-Occupied rooms are set to OutOfOrder with faultReasonCode
    const outOfOrderRooms = s.state.hotel.rooms.filter(
      (r) => r.state === "OutOfOrder" && r.faultReasonCode === "room.fault.outage",
    );
    expect(outOfOrderRooms.length).toBeGreaterThan(0);

    // Advance past outage duration
    const outageDays = Math.ceil(activeOutage.minutes / 1440) + 1;
    advanceDays(s, outageDays);

    expect(s.state.outages).toHaveLength(0);
    // Recovered rooms transition to VacantDirty
    const restoredRooms = s.state.hotel.rooms.filter(
      (r) => r.faultReasonCode === "room.fault.outage",
    );
    expect(restoredRooms).toHaveLength(0);

    const events = s.takeDomainEvents();
    expect(events.some((e) => e.payload.type === "UTILITY_OUTAGE_ENDED")).toBe(true);
  });

  it("tests purchasing trade-off for sustainable and regional supply choices", () => {
    const baseContract = {
      id: "c1",
      supplierId: "s1",
      sku: "cleaning-unit",
      unitPriceMinor: 1000,
      leadTimeDays: 2,
      minimumOrderQuantity: 10,
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-01-01",
      shelfLifeDays: null,
    };

    const standardTradeOff = supplyChainTradeOff({ ...baseContract, tier: "standard" });
    expect(standardTradeOff.sortedWasteShareBp).toBe(2500);
    expect(standardTradeOff.reputationDeltaBp).toBe(0);

    const sustainableTradeOff = supplyChainTradeOff({ ...baseContract, tier: "sustainable" });
    expect(sustainableTradeOff.sortedWasteShareBp).toBe(7000);
    expect(sustainableTradeOff.unitPriceMinor).toBe(1200);
    expect(sustainableTradeOff.reputationDeltaBp).toBe(300);
  });
});
