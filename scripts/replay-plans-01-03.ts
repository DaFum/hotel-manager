import assert from "node:assert/strict";
import corpusJson from "../fixtures/replay/plans-01-03.json";
import {
  assertReplay,
  replayCorpus,
  type ReplayCorpus,
} from "../src/game/debug/replay";

const corpus = corpusJson as unknown as ReplayCorpus;
const first = replayCorpus(corpus);
const second = replayCorpus(corpus);
const restored = replayCorpus(corpus, {
  splitAt: Math.ceil(corpus.commands.length / 2),
});
assertReplay(corpus, first);
assert.equal(second.hash, first.hash);
assert.equal(restored.hash, first.hash);
process.stdout.write(
  `replay hash=${first.hash} commands=${corpus.commands.length} events=${first.events.length}\n`,
);
