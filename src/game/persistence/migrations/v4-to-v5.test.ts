import { describe, expect, it } from "vitest";
import { migrateV4ToV5 } from "./v4-to-v5";
import { migrateEnvelope, validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";
import { SAVE_VERSION } from "../saveVersions";
import frozenV4 from "../fixtures/save-v4.json";
import frozenV5 from "../fixtures/save-v5.json";
import v1 from "../fixtures/save-v1.json";
import { GameSimulation } from "../../simulation/GameSimulation";
import type { GameState } from "../../simulation/initialState";
import { consolidatedCashMinor } from "../../treasury/treasury";
import { balanceMinor } from "../../finance/ledger";
import { STARTER_HOTEL } from "../../content/1991/starterHotel";

const v4 = () => structuredClone(frozenV4) as unknown as SaveEnvelope;
const v5 = () => structuredClone(frozenV5) as unknown as SaveEnvelope;

describe("v4 to v5 migration", () => {
  it("wraps the original hotel in a player portfolio without changing its id", () => {
    const migrated = migrateV4ToV5({
      saveVersion: 4,
      contentVersion: "plan-04-v4",
      protocolVersion: 2,
      rngState: {} as SaveEnvelope["rngState"],
      state: { hotel: { id: "hotel.frankfurt.1" } },
    });
    expect(migrated.saveVersion).toBe(5);
    expect(
      (migrated.state as { company: { portfolio: { hotelIds: string[] } } })
        .company.portfolio.hotelIds,
    ).toEqual(["hotel.frankfurt.1"]);
  });

  it("stamps a real v4 save as v5 before the next migration", () => {
    const migrated = migrateV4ToV5(v4());
    expect(migrated).toMatchObject({
      saveVersion: 5,
      contentVersion: "plan-05-v5",
      protocolVersion: 2,
    });
    expect(validateEnvelope(migrateEnvelope(migrated))).toEqual([]);
    const company = (migrated.state as GameState).company;
    expect(company.portfolio.hotelIds).toEqual([
      (v4().state as GameState).hotel.id,
    ]);
    expect(company.managers.map((m) => m.hotelId)).toEqual([
      (v4().state as GameState).hotel.id,
    ]);
    expect(company.brands.length).toBeGreaterThan(0);
    expect(company.acquisitionTargets.length).toBeGreaterThan(0);
  });

  it("stamps only its own target version, never the build's", () => {
    expect(migrateV4ToV5(v4()).saveVersion).toBe(5);
    expect(SAVE_VERSION).toBe(6);
  });

  it("carries a v1 save through every step to the current version", () => {
    const migrated = migrateEnvelope(
      structuredClone(v1) as unknown as SaveEnvelope,
    );
    expect(migrated.saveVersion).toBe(SAVE_VERSION);
    expect(validateEnvelope(migrated)).toEqual([]);
  });

  it("is idempotent on an already-migrated save", () => {
    const once = migrateV4ToV5(v4());
    expect(migrateV4ToV5(once)).toEqual(once);
  });

  it("normalises a partial development v5 company instead of accepting it", () => {
    const partial = v5();
    const state = partial.state as Record<string, unknown>;
    // Exactly the shape an earlier development build could have written: a
    // portfolio that names a hotel nothing else knows about.
    state.company = {
      portfolio: {
        companyId: "company.player",
        hotelIds: ["hotel.ghost.1"],
        hotelLegalEntity: {},
        hotelRegion: {},
      },
    };
    const migrated = migrateV4ToV5(partial);
    const company = (migrated.state as GameState).company;
    expect(company.portfolio.hotelIds).toContain("hotel.frankfurt.1");
    // A hotel in no other list keeps a legal entity and a manager, so the
    // load-time invariants hold rather than throwing.
    for (const hotelId of company.portfolio.hotelIds) {
      expect(company.portfolio.hotelLegalEntity[hotelId]).toBeTruthy();
      expect(company.managers.some((m) => m.hotelId === hotelId)).toBe(true);
      expect(company.operatingModels[hotelId]).toBeTruthy();
      expect(company.treasury.hotelCashMinor[hotelId]).toBe(0);
    }
    expect(company.managedHotels).toEqual([]);
    expect(migrateV4ToV5(migrated)).toEqual(migrated);
  });

  it("keeps the whole non-empty group through a save and reload", () => {
    const before = v5();
    const state = before.state as GameState;
    expect(state.company.portfolio.hotelIds).toHaveLength(2);
    expect(state.company.managedHotels).toHaveLength(1);
    expect(Object.keys(state.company.hotelResults)).toHaveLength(2);
    expect(state.company.brandAudits.length).toBeGreaterThan(0);
    expect(state.company.developments).toHaveLength(1);
    expect(state.company.dueDiligence["target.offenbach.1"]).toBeTruthy();
    expect(state.pendingOrders.length).toBeGreaterThan(0);
    expect(state.staff.length).toBeGreaterThan(0);

    const reloaded = migrateEnvelope(before);
    expect(validateEnvelope(reloaded)).toEqual([]);
    const after = reloaded.state as GameState;
    expect(after.company.portfolio).toEqual(state.company.portfolio);
    expect(after.company.managedHotels).toEqual(state.company.managedHotels);
    expect(after.company.hotelResults).toEqual(state.company.hotelResults);
    expect(after.company.escalations).toEqual(state.company.escalations);
    expect(after.pendingOrders).toEqual(state.pendingOrders);
  });

  it("reconciles loyalty liability and commercial-space fit in early v5 saves", () => {
    const early = v5();
    const state = early.state as GameState;
    state.commercial.loyalty = {
      members: [
        {
          guestId: "guest.legacy",
          points: 100,
          tier: "none",
          qualifyingNights: 1,
        },
      ],
      liabilityMinor: 640,
    };
    const space = state.commercialSpaces
      .spaces[0] as (typeof state.commercialSpaces.spaces)[number] & {
      fit?: number;
    };
    space.fit = 70;
    delete (space as Partial<typeof space>).fitBp;

    const migrated = migrateEnvelope(early).state as GameState;
    expect(migrated.commercial.loyalty.members[0].points).toBe(80);
    expect(migrated.commercial.loyalty.liabilityMinor).toBe(640);
    expect(migrated.commercialSpaces.spaces[0].fitBp).toBe(7000);
  });

  it("runs on after a reload without duplicating a posting or losing cash", () => {
    const loaded = migrateEnvelope(v5()).state as GameState;
    const simulation = new GameSimulation(structuredClone(loaded));
    simulation.refreshDerivedState();

    // The balance equation the invariants enforce still holds on the restored
    // group, and the treasury still describes the same money.
    expect(
      STARTER_HOTEL.startingCashMinor +
        balanceMinor(simulation.state.finance.ledger),
    ).toBe(simulation.state.finance.cashMinor);
    expect(consolidatedCashMinor(simulation.state.company.treasury)).toBe(
      simulation.state.finance.cashMinor,
    );

    const postingsBefore = simulation.state.finance.ledger.length;
    const resultsBefore = structuredClone(
      simulation.state.company.hotelResults,
    );
    simulation.advanceQuantum();
    // A reload does not re-run the month it had already closed.
    expect(simulation.state.company.hotelResults).toEqual(resultsBefore);
    expect(simulation.state.finance.ledger.length).toBe(postingsBefore);
  });

  it("refuses a v5 save whose portfolio has lost the hotel it describes", () => {
    const broken = v5();
    const state = broken.state as GameState;
    state.company.portfolio.hotelIds = ["hotel.somewhere.else"];
    expect(validateEnvelope(broken)).toContain(
      "the company portfolio does not hold this save's hotel",
    );
  });

  it("refuses a v5 save with no company section at all", () => {
    const broken = v5();
    delete (broken.state as Record<string, unknown>).company;
    expect(validateEnvelope(broken)).toContain(
      "the state has no complete Plan 05 company",
    );
  });
});
