/**
 * Re-records the current replay corpora against the current build.
 *
 * The corpus fixes the seed, the initial RNG state and the exact command
 * envelopes; everything else in the file — the ordered events, the monthly
 * checkpoints and the final state hash — is an observation of what those
 * inputs produce. When production behavior changes, the observation has to be
 * re-taken from a run rather than edited by hand.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { replayCorpus, type ReplayCorpus } from "../src/game/debug/replay";
import { stateHash } from "../src/game/debug/stateHash";
import { GameSimulation } from "../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../src/game/simulation/initialState";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
} from "../src/game/persistence/saveVersions";
import { PROTOCOL_VERSION } from "../src/game/domain/protocol";

function record(name: string): void {
  const target = new URL(`../fixtures/replay/${name}.json`, import.meta.url);
  const corpus = JSON.parse(readFileSync(target, "utf8")) as ReplayCorpus;

  // The checkpoint times and commands are inputs; their observed outputs are
  // regenerated below.
  const state = createInitialGameState(corpus.seed);
  state.rngState = structuredClone(corpus.initialRngState);
  const simulation = new GameSimulation(state);
  const checkpointTimes = corpus.monthlyCheckpoints.map((c) => c.atMinutes);
  const monthlyCheckpoints: ReplayCorpus["monthlyCheckpoints"] = [];
  const orderedEvents: ReplayCorpus["orderedEvents"] = [];
  const commands: ReplayCorpus["commands"] = [];

  for (let index = 0; index < corpus.commands.length; index++) {
    const recorded = corpus.commands[index];
    while (simulation.state.elapsedMinutes < recorded.envelope.issuedAtMinutes)
      simulation.advanceQuantum();
    const [result] = simulation.submitCommands([recorded.envelope]);
    commands.push({ ...recorded, expectedStatus: result.status });
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
    commands,
    orderedEvents,
    monthlyCheckpoints,
    finalStateHash: stateHash(simulation.snapshot()),
  };

  const verify = replayCorpus(rerecorded);
  if (verify.hash !== rerecorded.finalStateHash)
    throw new Error(`${name} does not reproduce its own hash`);

  writeFileSync(target, `${JSON.stringify(rerecorded, null, 2)}\n`);

  process.stdout.write(
    `${name}: recorded hash=${rerecorded.finalStateHash} events=${orderedEvents.length} checkpoints=${monthlyCheckpoints.length}\n`,
  );
}

record("vertical-slice");
