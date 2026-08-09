import { describe, expect, it } from "vitest";
import corpusJson from "../../../fixtures/replay/plans-01-03.json";
import { createInitialGameState } from "../simulation/initialState";
import { migrateEnvelope } from "../persistence/saveSchema";
import type { SaveEnvelope } from "../persistence/saveVersions";
import { canonicalState, stateHash } from "./stateHash";
import {
  assertReplay,
  replayCorpus,
  ReplayMismatchError,
  type ReplayCorpus,
} from "./replay";

const corpus = corpusJson as unknown as ReplayCorpus;

describe("Plans 01-03 replay", () => {
  it("records versions, envelopes, ordered events and a final hash", () => {
    expect(corpus).toMatchObject({
      saveVersion: 4,
      protocolVersion: 2,
      seed: 4242,
    });
    expect(corpus.commands.length).toBeGreaterThan(0);
    expect(Array.isArray(corpus.orderedEvents)).toBe(true);
    expect(corpus.monthlyCheckpoints.length).toBeGreaterThan(0);
    expect(corpus.finalStateHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("reproduces the recorded hash through the real command boundary", () => {
    const result = replayCorpus(corpus);
    expect(result.state.commandLog.map((x) => x.commandId)).toEqual(
      corpus.commands.map((x) => x.envelope.commandId),
    );
    expect(() => assertReplay(corpus, result)).not.toThrow();
  });

  it("canonicalises authoritative state and ignores presentation data", () => {
    const state = createInitialGameState(4);
    const reordered = {
      b: new Set(["b", "a"]),
      a: new Map([
        ["z", 1],
        ["a", 2],
      ]),
    };
    expect(canonicalState(reordered)).toBe(
      canonicalState({
        a: new Map([
          ["a", 2],
          ["z", 1],
        ]),
        b: new Set(["a", "b"]),
      }),
    );
    expect(stateHash({ ...state, facilities: [{ id: "presentation" }] })).toBe(
      stateHash({ ...state, facilities: [] }),
    );
  });

  it("reports seed, command id, rng draw index and a minimal diff", () => {
    expect(() =>
      replayCorpus({
        ...corpus,
        commands: [{ ...corpus.commands[0], expectedStatus: "rejected" }],
      }),
    ).toThrowError(ReplayMismatchError);
    try {
      replayCorpus({
        ...corpus,
        commands: [{ ...corpus.commands[0], expectedStatus: "rejected" }],
      });
    } catch (error) {
      expect((error as Error).message).toMatch(
        /seed 4242.*command cmd\.replay\.rate.*rng draw index.*verdict/s,
      );
    }
  });

  it("replays identically twice and across a mid-run save and load", () => {
    const first = replayCorpus(corpus);
    const second = replayCorpus(corpus);
    const split = replayCorpus(corpus, { splitAt: 1 });
    const legacyState = createInitialGameState(corpus.seed);
    const legacy = migrateEnvelope({
      saveVersion: 3,
      contentVersion: "city-market-1991-v3",
      protocolVersion: 2,
      rngState: legacyState.rngState,
      state: legacyState,
    } satisfies SaveEnvelope);
    const migrated = replayCorpus(corpus, {
      initialState: legacy.state as typeof legacyState,
    });
    expect(second.hash).toBe(first.hash);
    expect(split.hash).toBe(first.hash);
    expect(migrated.hash).toBe(first.hash);
  });
});
