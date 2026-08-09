/**
 * Re-records the replay corpus against the current build.
 *
 * The corpus fixes the seed, the initial RNG state and the exact command
 * envelopes; everything else in the file — the ordered events, the monthly
 * checkpoints and the final state hash — is an observation of what those
 * inputs produce. When a plan adds real transitions, the observation changes
 * and has to be re-taken from a run rather than edited by hand.
 */
import { writeFileSync } from "node:fs";
import corpusJson from "../fixtures/replay/plans-01-03.json";
import { replayCorpus, type ReplayCorpus } from "../src/game/debug/replay";
import { stateHash } from "../src/game/debug/stateHash";
import { GameSimulation } from "../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../src/game/simulation/initialState";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
} from "../src/game/persistence/saveVersions";
import { PROTOCOL_VERSION } from "../src/game/domain/protocol";

const corpus = corpusJson as unknown as ReplayCorpus;

// The monthly checkpoints are the game times the original recording stopped
// at; keeping them lets the re-recording observe the same moments.
const state = createInitialGameState(corpus.seed);
state.rngState = structuredClone(corpus.initialRngState);
let simulation = new GameSimulation(state);
const checkpointTimes = corpus.monthlyCheckpoints.map((c) => c.atMinutes);
const monthlyCheckpoints: ReplayCorpus["monthlyCheckpoints"] = [];
const orderedEvents: ReplayCorpus["orderedEvents"] = [];

for (let index = 0; index < corpus.commands.length; index++) {
  const recorded = corpus.commands[index];
  while (simulation.state.elapsedMinutes < recorded.envelope.issuedAtMinutes)
    simulation.advanceQuantum();
  simulation.submitCommands([recorded.envelope]);
  orderedEvents.push(...simulation.takeDomainEvents());
  const nextIssuedAt = corpus.commands[index + 1]?.envelope.issuedAtMinutes;
  if (
    nextIssuedAt !== recorded.envelope.issuedAtMinutes &&
    checkpointTimes.includes(simulation.state.elapsedMinutes)
  )
    monthlyCheckpoints.push({
      dateKey: simulation.state.calendar.dateKey,
      atMinutes: simulation.state.elapsedMinutes,
      stateHash: stateHash(simulation.snapshot()),
    });
}

const rerecorded: ReplayCorpus = {
  ...corpus,
  saveVersion: SAVE_VERSION,
  contentVersion: CONTENT_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  orderedEvents,
  monthlyCheckpoints,
  finalStateHash: stateHash(simulation.snapshot()),
};

writeFileSync(
  new URL("../fixtures/replay/plans-01-03.json", import.meta.url),
  `${JSON.stringify(rerecorded, null, 2)}\n`,
);

// A recording nobody can reproduce is worthless, so prove it immediately.
const verify = replayCorpus(rerecorded);
if (verify.hash !== rerecorded.finalStateHash)
  throw new Error("the re-recorded corpus does not reproduce its own hash");

process.stdout.write(
  `recorded hash=${rerecorded.finalStateHash} events=${orderedEvents.length} checkpoints=${monthlyCheckpoints.length}\n`,
);
