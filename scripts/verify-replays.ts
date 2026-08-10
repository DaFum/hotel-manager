import { readFileSync } from "node:fs";
import {
  assertReplay,
  replayCorpus,
  type ReplayCorpus,
} from "../src/game/debug/replay";

const corpora = ["vertical-slice", "multi-hotel"];
for (const name of corpora) {
  const corpus = JSON.parse(
    readFileSync(`fixtures/replay/${name}.json`, "utf8"),
  ) as ReplayCorpus;
  try {
    const direct = replayCorpus(corpus);
    assertReplay(corpus, direct);
    const restored = replayCorpus(corpus, {
      splitAt: Math.ceil(corpus.commands.length / 2),
    });
    assertReplay(corpus, restored);
    if (direct.hash !== restored.hash)
      throw new Error("restore checkpoint diverged");
    console.log(
      `${name}: PASS hash=${direct.hash} seed=${corpus.seed} commands=${corpus.commands.length} events=${direct.events.length}`,
    );
  } catch (error) {
    throw new Error(
      `${name}: versions save=${corpus.saveVersion} content=${corpus.contentVersion} protocol=${corpus.protocolVersion}; seed=${corpus.seed}; ${(error as Error).message}`,
    );
  }
}
