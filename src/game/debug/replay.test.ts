import { describe, expect, it } from "vitest";
import corpusJson from "../../../fixtures/replay/vertical-slice.json";
import { createInitialGameState } from "../simulation/initialState";
import { SAVE_VERSION } from "../persistence/saveVersions";
import { PROTOCOL_VERSION } from "../domain/protocol";
import { canonicalState, stateHash } from "./stateHash";
import {
  assertReplay,
  replayCorpus,
  ReplayMismatchError,
  type ReplayCorpus,
} from "./replay";

const corpus = corpusJson as unknown as ReplayCorpus;

describe("replay corpus", () => {
  it("records versions, envelopes, ordered events and a final hash", () => {
    expect(corpus).toMatchObject({
      saveVersion: SAVE_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      seed: 4242,
    });
    expect(corpus.commands.length).toBeGreaterThan(0);
    expect(Array.isArray(corpus.orderedEvents)).toBe(true);
    expect(corpus.monthlyCheckpoints.length).toBeGreaterThan(0);
    expect(corpus.finalStateHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("reproduces the recorded hash through the real command boundary", () => {
    const result = replayCorpus(corpus);
    const recordedIds = new Set(
      corpus.commands.map((x) => x.envelope.commandId),
    );
    expect(
      result.state.commandLog
        .map((x) => x.commandId)
        .filter((id) => recordedIds.has(id)),
    ).toEqual(corpus.commands.map((x) => x.envelope.commandId));
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

  it("distinguishes a missing property from a present undefined value", () => {
    expect(stateHash({})).not.toBe(stateHash({ value: undefined }));
    expect(stateHash([])).not.toBe(stateHash([undefined]));
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
    expect(second.hash).toBe(first.hash);
    expect(split.hash).toBe(first.hash);
  });
});
