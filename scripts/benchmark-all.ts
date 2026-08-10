import { performance } from "node:perf_hooks";
import {
  SCENARIO_CATALOG,
  SCENARIO_CATALOG_VERSION,
} from "./scenarios/scenarioCatalog";
import { runScenario } from "./scenarios/runScenario";

const percentile = (values: number[], p: number) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.ceil(values.length * p) - 1)
  ];
const profile = {
  name: `${process.platform}-${process.arch}-${process.version}`,
  scenarioP95Ms: 30_000,
  commandAckP95Ms: 20,
  meanTickP95Ms: 25,
  deltaBytes: 250_000,
  heapBytes: 512_000_000,
  saveBytes: 25_000_000,
  saveLoadP95Ms: 250,
  visibleAgents: 500,
};

const report = SCENARIO_CATALOG.filter(
  (scenario) => scenario.id !== "mature-50y",
).map((scenario) => {
  const runs = scenario.seeds.map((seed) => {
    const started = performance.now();
    const result = runScenario({ seed, scenarioId: scenario.id });
    return { elapsedMs: performance.now() - started, metrics: result.metrics };
  });
  return {
    scenario: scenario.id,
    samples: runs.length,
    p50Ms: percentile(
      runs.map((run) => run.elapsedMs),
      0.5,
    ),
    p95Ms: percentile(
      runs.map((run) => run.elapsedMs),
      0.95,
    ),
    meanTickP95Ms: percentile(
      runs.map((run) => run.metrics.meanTickMs),
      0.95,
    ),
    commandAckP95Ms: percentile(
      runs.map((run) => run.metrics.commandAckMs),
      0.95,
    ),
    saveLoadP95Ms: percentile(
      runs.map((run) => run.metrics.saveLoadMs),
      0.95,
    ),
    deltaBytes: Math.max(...runs.map((run) => run.metrics.maxDeltaBytes)),
    heapBytes: Math.max(...runs.map((run) => run.metrics.heapBytes)),
    saveBytes: Math.max(...runs.map((run) => run.metrics.saveBytes)),
    visibleAgents: Math.max(...runs.map((run) => run.metrics.visibleAgents)),
  };
});

const failures = report.flatMap((result) =>
  [
    result.p95Ms > profile.scenarioP95Ms ? `${result.scenario}: runtime` : "",
    result.meanTickP95Ms > profile.meanTickP95Ms
      ? `${result.scenario}: tick`
      : "",
    result.commandAckP95Ms > profile.commandAckP95Ms
      ? `${result.scenario}: ack`
      : "",
    result.saveLoadP95Ms > profile.saveLoadP95Ms
      ? `${result.scenario}: load`
      : "",
    result.deltaBytes > profile.deltaBytes ? `${result.scenario}: delta` : "",
    result.heapBytes > profile.heapBytes ? `${result.scenario}: heap` : "",
    result.saveBytes > profile.saveBytes ? `${result.scenario}: save` : "",
    result.visibleAgents > profile.visibleAgents
      ? `${result.scenario}: agents`
      : "",
  ].filter(Boolean),
);

console.log(
  JSON.stringify(
    {
      catalogVersion: SCENARIO_CATALOG_VERSION,
      hardwareProfile: profile,
      report,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
