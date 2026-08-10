import { performance } from "node:perf_hooks";
import { scenarioDefinition } from "./scenarios/scenarioCatalog";
import { runScenario } from "./scenarios/runScenario";
import {
  evaluateHistoryBudget,
  evaluateSaveBudget,
} from "../src/game/persistence/saveBudget";

const scenario = scenarioDefinition("mature-50y");
const failures: string[] = [];
const runs = [];
for (const seed of scenario.seeds) {
  const start = performance.now();
  const first = runScenario({ seed, scenarioId: scenario.id });
  const replay = runScenario({ seed, scenarioId: scenario.id });
  if (
    first.stateHash !== replay.stateHash ||
    first.checkpoints.some(
      (point, i) => point.hash !== replay.checkpoints[i]?.hash,
    )
  )
    failures.push(`${seed}: replay mismatch`);
  if (first.checkpoints.length !== 50)
    failures.push(`${seed}: missing yearly checkpoints`);
  const m = first.metrics;
  if (
    m.hotels < 60 ||
    m.hotelRooms < 9_000 ||
    m.cities < 25 ||
    m.competitors < 40
  )
    failures.push(`${seed}: mature scale absent`);
  if (
    !evaluateSaveBudget(m.saveBytes).ok ||
    !evaluateHistoryBudget(m.historyRecords).ok ||
    m.visibleAgents > 500
  )
    failures.push(`${seed}: representation budget`);
  if (
    m.demandRoomNights <= 0 ||
    m.demandRoomNights > m.cities * 2_000_000 ||
    m.landPriceMinor < 2_500_000 ||
    m.landPriceMinor > 50_000_000 ||
    m.wageIndexBasisPoints < 7_500 ||
    m.wageIndexBasisPoints > 15_000 ||
    m.technologyAdoptionBasisPoints <= 0
  )
    failures.push(`${seed}: economic invariant`);
  if (!Number.isSafeInteger(m.cashMinor) || m.warnings.length > 0)
    failures.push(`${seed}: market health ${m.warnings.join(",")}`);
  for (let index = 1; index < first.checkpoints.length; index++) {
    const previous = first.checkpoints[index - 1].demandRoomNights;
    const current = first.checkpoints[index].demandRoomNights;
    if (current > previous * 2)
      failures.push(`${seed}: exponential demand at year ${index + 1}`);
  }
  runs.push({
    seed,
    elapsedMs: performance.now() - start,
    stateHash: first.stateHash,
    metrics: m,
  });
}
console.log(JSON.stringify({ scenario: scenario.id, runs, failures }, null, 2));
if (failures.length) process.exitCode = 1;
