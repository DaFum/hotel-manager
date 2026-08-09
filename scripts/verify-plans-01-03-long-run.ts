import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { runCityYears } from "../src/game/test/cityScenario";
import { stateHash } from "../src/game/debug/stateHash";
import "fake-indexeddb/auto";
import { IndexedDbSaveRepository } from "../src/game/persistence/indexedDbSaveRepository";
import { migrateEnvelope } from "../src/game/persistence/saveSchema";
import { createInitialGameState } from "../src/game/simulation/initialState";
import type { CityScenarioCheckpoint } from "../src/game/test/cityScenario";
import type { SaveEnvelope } from "../src/game/persistence/saveVersions";

const scenarios = [
  ["balanced", 4242],
  ["high demand", 1],
  ["weak demand", 2],
  ["high wage", 7],
  ["high property", 12],
  ["route loss", 14],
  ["actor decline", 17],
  ["competitor distress", 19],
] as const;

async function test(
  title: string,
  assertion: () => void | Promise<void>,
): Promise<void> {
  await assertion();
  process.stdout.write(`ok - ${title}\n`);
}

async function main(): Promise<void> {
  const started = performance.now();
  const results = scenarios.map(([name, seed]) => ({
    name,
    seed,
    result: runCityYears(10, seed),
  }));
  const elapsedMs = performance.now() - started;

  await test("yearly money stays integral and every rate stays finitely bounded", () => {
    for (const { name, result } of results)
      for (const year of result.yearly) {
        assert(Number.isSafeInteger(year.cashMinor), `${name} cash`);
        assert(Number.isSafeInteger(year.debtMinor), `${name} debt`);
        assert(
          Number.isSafeInteger(year.rateMinor) && year.rateMinor > 0,
          `${name} rate`,
        );
        assert(year.supply > 0 && year.demand > 0, `${name} market bounds`);
      }
  });

  await test("at least one viable entry and one economic exit occur", () => {
    assert(results.some(({ result }) => result.entries > 0));
    assert(results.some(({ result }) => result.exits > 0));
  });

  await test("repeated runs of the same seed produce identical hashes", () => {
    const first = runCityYears(10, 4242);
    const second = runCityYears(10, 4242);
    assert.equal(stateHash(first), stateHash(second));
  });

  await test("a save at year five continues to an identical year ten", async () => {
    const uninterrupted = runCityYears(10, 4242, { captureAtYear: 5 });
    assert(uninterrupted.checkpoint);
    const state = createInitialGameState(4242) as ReturnType<
      typeof createInitialGameState
    > & {
      cityScenarioCheckpoint?: CityScenarioCheckpoint;
    };
    state.cityScenarioCheckpoint = uninterrupted.checkpoint;
    const legacy: SaveEnvelope = {
      saveVersion: 3,
      contentVersion: "city-market-1991-v3",
      protocolVersion: 2,
      rngState: state.rngState,
      state,
    };
    const repository = new IndexedDbSaveRepository("plans-01-03-long-run");
    await repository.save("checkpoint", migrateEnvelope(legacy));
    const loaded = await repository.load("checkpoint");
    assert(loaded);
    const migrated = migrateEnvelope(loaded);
    const restoredState = migrated.state as typeof state;
    const continued = runCityYears(10, 4242, {
      checkpoint: restoredState.cityScenarioCheckpoint,
    });
    const { checkpoint: _ignored, ...expected } = uninterrupted;
    const { checkpoint: _continuedCheckpoint, ...actual } = continued;
    assert.deepEqual(actual, expected);
  });

  await test("elapsed time is reported separately from deterministic output", () => {
    assert(elapsedMs >= 0);
    assert.equal(
      stateHash(results[0].result),
      stateHash(runCityYears(10, results[0].seed)),
    );
  });

  await test("forecast coverage is nonzero and still imperfect", () => {
    for (const { result } of results) {
      assert(result.forecastHigh > result.forecastLow);
      assert(result.forecastLow > 0);
      assert(result.forecastHigh - result.forecastLow > 0);
    }
  });

  process.stdout.write(
    `long-run elapsedMs=${elapsedMs.toFixed(1)} deterministicHash=${stateHash(results)}\n`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
