import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertReplay, replayCorpus, type ReplayCorpus } from "../debug/replay";
import { stableStateHash } from "../debug/stateHash";

describe("release replay corpus", () => {
  it("hashes canonical state independent of object insertion order", () => {
    expect(stableStateHash({ a: 1, b: 2 })).toBe(
      stableStateHash({ b: 2, a: 1 }),
    );
    expect(stableStateHash({ a: 1 })).not.toBe(stableStateHash({ a: 2 }));
  });

  for (const name of ["vertical-slice"]) {
    it(`replays ${name} through the real command boundary`, () => {
      const corpus = JSON.parse(
        readFileSync(`fixtures/replay/${name}.json`, "utf8"),
      ) as ReplayCorpus;
      const result = replayCorpus(corpus);
      expect(() => assertReplay(corpus, result)).not.toThrow();
      expect(result.state.rngState).toBeDefined();
      expect(
        corpus.commands.some(
          ({ expectedStatus }) => expectedStatus === "rejected",
        ),
      ).toBe(true);
    });
  }
});
