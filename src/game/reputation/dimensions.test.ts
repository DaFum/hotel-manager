import { describe, expect, it } from "vitest";
import {
  CONTRIBUTOR_LIMIT,
  DIMENSION_EFFECTS,
  NEUTRAL_SCORE,
  REPUTATION_DIMENSIONS,
  applyReputationEvent,
  createReputationState,
  decayReputation,
  reputationCauses,
  reputationFor,
} from "./dimensions";

describe("reputation dimensions", () => {
  it("keeps each dimension separate rather than collapsing into prestige", () => {
    expect(REPUTATION_DIMENSIONS).toEqual([
      "hotel",
      "brand",
      "group",
      "employer",
      "media",
      "channel",
    ]);
    expect(REPUTATION_DIMENSIONS).not.toContain("prestige");
    // Each one reaches a different part of the game.
    const effects = Object.values(DIMENSION_EFFECTS);
    expect(new Set(effects).size).toBe(effects.length);
  });

  it("scopes a dimension so one bad house does not sink the group", () => {
    let state = createReputationState();
    state = applyReputationEvent(state, {
      dimension: "hotel",
      scopeId: "hotel.offenbach.1",
      delta: -20,
      cause: "flooded bathroom",
      atMinutes: 1440,
    });
    expect(reputationFor(state, "hotel", "hotel.offenbach.1").score).toBe(30);
    expect(reputationFor(state, "hotel", "hotel.frankfurt.1").score).toBe(
      NEUTRAL_SCORE,
    );
    expect(reputationFor(state, "group", "company.player").score).toBe(
      NEUTRAL_SCORE,
    );
  });

  it("carries the cause of every move so a score can explain itself", () => {
    let state = createReputationState();
    state = applyReputationEvent(state, {
      dimension: "employer",
      scopeId: "hotel.frankfurt.1",
      delta: -8,
      cause: "unpaid overtime",
      atMinutes: 100,
    });
    state = applyReputationEvent(state, {
      dimension: "employer",
      scopeId: "hotel.frankfurt.1",
      delta: 3,
      cause: "training programme",
      atMinutes: 200,
    });
    expect(reputationCauses(state, "employer", "hotel.frankfurt.1")).toEqual([
      { cause: "training programme", delta: 3, atMinutes: 200 },
      { cause: "unpaid overtime", delta: -8, atMinutes: 100 },
    ]);
  });

  it("refuses a change nobody can explain", () => {
    const state = createReputationState();
    expect(() =>
      applyReputationEvent(state, {
        dimension: "hotel",
        scopeId: "hotel.1",
        delta: 5,
        cause: "",
        atMinutes: 0,
      }),
    ).toThrow(/cause/);
    expect(() =>
      applyReputationEvent(state, {
        dimension: "hotel",
        scopeId: "",
        delta: 5,
        cause: "something",
        atMinutes: 0,
      }),
    ).toThrow(/scope/);
    expect(() =>
      applyReputationEvent(state, {
        dimension: "hotel",
        scopeId: "hotel.1",
        delta: 0.5,
        cause: "something",
        atMinutes: 0,
      }),
    ).toThrow(/whole points/);
  });

  it("clamps to the declared range instead of running away", () => {
    let state = createReputationState();
    for (let i = 0; i < 20; i += 1)
      state = applyReputationEvent(state, {
        dimension: "media",
        scopeId: "company.player",
        delta: 20,
        cause: `story ${i}`,
        atMinutes: i,
      });
    expect(reputationFor(state, "media", "company.player").score).toBe(100);
    expect(
      reputationFor(state, "media", "company.player").contributors,
    ).toHaveLength(CONTRIBUTOR_LIMIT);
  });

  it("drifts back toward neutral from either side, never past it", () => {
    let state = createReputationState();
    state = applyReputationEvent(state, {
      dimension: "hotel",
      scopeId: "hotel.1",
      delta: 30,
      cause: "a very good year",
      atMinutes: 0,
    });
    state = applyReputationEvent(state, {
      dimension: "hotel",
      scopeId: "hotel.2",
      delta: -30,
      cause: "a very bad year",
      atMinutes: 0,
    });
    for (let i = 0; i < 100; i += 1) state = decayReputation(state);
    expect(reputationFor(state, "hotel", "hotel.1").score).toBe(NEUTRAL_SCORE);
    expect(reputationFor(state, "hotel", "hotel.2").score).toBe(NEUTRAL_SCORE);
    // Decay never erases the record of what happened.
    expect(reputationFor(state, "hotel", "hotel.1").contributors).toHaveLength(
      1,
    );
  });

  it("decays one step at a time, so repair is slow rather than bought", () => {
    let state = applyReputationEvent(createReputationState(), {
      dimension: "hotel",
      scopeId: "hotel.1",
      delta: -30,
      cause: "a bad review",
      atMinutes: 0,
    });
    state = decayReputation(state);
    expect(reputationFor(state, "hotel", "hotel.1").score).toBe(21);
  });
});
