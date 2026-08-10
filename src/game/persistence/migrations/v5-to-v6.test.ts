import { describe, expect, it } from "vitest";
import { migrateV5ToV6, normaliseNarrative } from "./v5-to-v6";
import { migrateEnvelope, validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";
import frozenV5 from "../fixtures/save-v5.json";
import frozenV6 from "../fixtures/save-v6.json";
import frozenV7 from "../fixtures/save-v7.json";
import { createRngStreams } from "../../domain/rng";

const v5 = () => structuredClone(frozenV5) as unknown as SaveEnvelope;

const career = {
  netLiquidityMinor: 1,
  creditHeadroomMinor: 0,
  sellableHotelCount: 0,
  reducibleStaffCount: 0,
  year: 1991,
};

describe("v5 to v6", () => {
  it("adds complete narrative state without changing hotels", () => {
    const old = { saveVersion: 5 as const, hotels: { h1: { cashMinor: 5 } } };
    const next = migrateV5ToV6(old);
    expect(next.saveVersion).toBe(6);
    expect(next.hotels).toEqual(old.hotels);
    expect(next.narrative.chronicle).toEqual([]);
    expect(next.narrative.campaign.difficulty).toBe("standard");
  });

  it("brings a real v5 save to a valid v6 save with its own story stream", () => {
    const migrated = migrateV5ToV6(v5());
    expect(migrated).toMatchObject({
      saveVersion: 6,
      contentVersion: "plan-06-v6",
      protocolVersion: 2,
    });
    const state = migrated.state as { seed: number; narrative: unknown };
    // The new stream is seeded from the save's own seed, so the same save
    // always continues into the same stories.
    expect(migrated.rngState.narrative).toBe(
      createRngStreams(state.seed).narrative.state,
    );
    expect(validateEnvelope(migrateEnvelope(v5()))).toEqual([]);
  });

  it("migrates the recorded v6 fixture and loads the recorded v7 fixture", () => {
    const legacy = () => structuredClone(frozenV6) as unknown as SaveEnvelope;
    const recorded = () => structuredClone(frozenV7) as unknown as SaveEnvelope;
    expect(validateEnvelope(migrateEnvelope(legacy()))).toEqual([]);
    expect(validateEnvelope(recorded())).toEqual([]);
    // Migrating a current save is a no-op that must still be valid.
    expect(validateEnvelope(migrateEnvelope(recorded()))).toEqual([]);
  });

  it("keeps a v5 position the migration found, rather than an optimistic one", () => {
    const distressed = v5();
    const state = distressed.state as Record<string, unknown>;
    state.finance = {
      ...(state.finance as Record<string, unknown>),
      cashMinor: 0,
      payableMinor: 5_000_000,
    };
    state.loan = { principalMinor: 99_000_000 };
    state.workforce = { employees: [], employerEvents: [] };
    const company = state.company as { portfolio: { hotelIds: string[] } };
    company.portfolio.hotelIds = [(state.hotel as { id: string }).id];
    const migrated = migrateV5ToV6(distressed);
    const migratedCareer = (
      migrated.state as { narrative: { career: unknown } }
    ).narrative.career as { distress: string };
    // Nothing left to draw on and nothing to sell: the save was already there
    // before it was migrated, and it still is afterwards.
    expect(migratedCareer.distress).toBe("terminal");
  });

  it("replaces a malformed section instead of spreading it through", () => {
    const normalised = normaliseNarrative(
      {
        chronicle: "not a list",
        campaign: null,
        career: 42,
        prestige: { personal: 1.5, company: 0, causes: [] },
        media: null,
        annualProfit: { year: 1991.5, operatingProfitMinor: 0 },
        lastFiredByDefinition: ["nope"],
        achievedMilestones: [1, "first-profitable-year"],
      },
      career,
    );
    expect(normalised.chronicle).toEqual([]);
    expect(normalised.campaign.difficulty).toBe("standard");
    expect(normalised.career.distress).toBe("healthy");
    expect(normalised.prestige).toEqual({
      personal: 0,
      company: 0,
      causes: [],
    });
    expect(normalised.media.localPress).toBe(6000);
    expect(normalised.annualProfit.year).toBe(1991);
    expect(normalised.lastFiredByDefinition).toEqual({});
    expect(normalised.achievedMilestones).toEqual(["first-profitable-year"]);
  });

  it("drops unreadable entries instead of migrating them into a crash", () => {
    // A shallow Array.isArray check let these through, and the save schema's
    // check is shallow too: the save loaded and the next narrative month blew
    // up reading `event.definitionId` off null.
    const normalised = normaliseNarrative(
      {
        activeEvents: [
          null,
          { id: "e1" },
          {
            id: "e2",
            definitionId: "story.audit",
            triggeredDateKey: "1991-03-01",
            choices: [],
          },
        ],
        achievedMilestones: ["first-profitable-year", 7, null],
        rivals: [{ id: "r1" }, undefined],
        opportunities: [{ id: "o1", openedDateKey: "1991-02-01" }],
      },
      career,
    );
    expect(normalised.activeEvents.map((e) => e.id)).toEqual(["e2"]);
    expect(normalised.achievedMilestones).toEqual(["first-profitable-year"]);
    expect(normalised.rivals).toEqual([]);
    expect(normalised.opportunities).toEqual([]);
    // And what survived is genuinely usable by the system that reads it.
    expect(
      normalised.activeEvents.some((e) => e.definitionId === "story.audit"),
    ).toBe(true);
  });

  it("refuses a save whose campaign numbers are not whole", () => {
    const broken = migrateEnvelope(v5());
    const state = broken.state as {
      narrative: { annualProfit: { operatingProfitMinor: number } };
    };
    state.narrative.annualProfit.operatingProfitMinor = 0.5;
    expect(validateEnvelope(broken)).toContain(
      "the state has no complete Plan 06 narrative",
    );
  });
});
