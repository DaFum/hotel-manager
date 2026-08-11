import { performance } from "node:perf_hooks";
import { GameSimulation } from "../../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../../src/game/simulation/initialState";
import { commandEnvelope } from "../../src/game/commands/commandEnvelope";
import { stateHash } from "../../src/game/debug/stateHash";
import { computeStateDelta } from "../../src/game/domain/stateDelta";
import { createRngStreams } from "../../src/game/domain/rng";
import {
  createWorldState,
  WorldSimulation,
} from "../../src/game/world/WorldSimulation";
import {
  advanceCityMonth,
  createCityMarket,
  createCompetitors,
} from "../../src/game/city/cityMarket";
import {
  managedHotelMonth,
  type ManagedHotelRecord,
} from "../../src/game/company/managedHotels";
import { scenarioDefinition } from "./scenarioCatalog";
import { marketHealthWarnings } from "../../src/game/balancing/marketHealth";
import { portfolioDetailTiers } from "../../src/game/simulation/detailTiers";
import { addHotelToPortfolio } from "../../src/game/company/portfolio";
import { openHotelAccount } from "../../src/game/treasury/treasury";
import { serializeSavePayload } from "../../src/game/persistence/saveTransfer";

export interface ScenarioInput {
  seed: number;
  years?: number;
  scenarioId: string;
}
export interface ScenarioCheckpoint {
  year: number;
  hash: string;
  cashMinor: number;
  demandRoomNights: number;
}

const QUANTA_PER_DAY = 288;
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const monthKey = (month: number) => {
  const year = 1991 + Math.floor(month / 12);
  return `${year}-${String((month % 12) + 1).padStart(2, "0")}-01`;
};

function runOperational(input: ScenarioInput) {
  const definition = scenarioDefinition(input.scenarioId);
  const months =
    input.years === undefined
      ? (definition.benchmarkMonths ?? definition.years * 12)
      : input.years * 12;
  const state = createInitialGameState(input.seed);
  if (definition.id === "portfolio") {
    const legalEntityId = state.company.legalEntities[0].id;
    const additions = matureHotels(59, definition.cities);
    for (const hotel of additions) {
      state.company.portfolio = addHotelToPortfolio(state.company.portfolio, {
        hotelId: hotel.hotelId,
        legalEntityId,
        regionId: "region.scale",
      });
      state.company.managedHotels.push(hotel);
      state.company.operatingModels[hotel.hotelId] = { kind: "owned" };
      state.company.treasury = openHotelAccount(
        state.company.treasury,
        hotel.hotelId,
        0,
      );
    }
  }
  if (definition.id === "dense-facilities") {
    state.wellness.treatmentRooms = 20;
    state.wellness.therapists = 20;
    state.investedArea.conferenceSqm = 5_000;
    state.events = Array.from({ length: 20 }, (_, index) => ({
      id: `event.scale.${index}`,
      guests: 100,
      nights: 2,
      roomsBlocked: 10,
      blockedCategory: "double",
      startDateKey: "1991-01-15",
      valueMinor: 1_000_000,
      status: "confirmed" as const,
    }));
  }
  if (definition.id === "crisis") {
    state.world.activeShocks.push({
      id: "shock.scenario.health",
      kind: "health",
      severityBp: 8_000,
      remainingMonths: 12,
      causes: ["scenario"],
    });
  }
  const simulation = new GameSimulation(
    definition.id === "save-load" ? structuredClone(state) : state,
  );
  const commandStarted = performance.now();
  simulation.queueEnvelope(
    commandEnvelope({
      commandId: "scenario.rate",
      issuedAtMinutes: 0,
      actor: "player",
      payload: {
        type: "SET_RATE",
        dateKey: "1991-01-01",
        category: "single",
        rateMinor: 14_000,
      },
    }),
  );
  simulation.applyPendingCommands();
  const commandAckMs = performance.now() - commandStarted;
  const commandResults = simulation.takeCommandResults();
  let domainEvents = simulation.takeDomainEvents().length;
  let maxDeltaBytes = 0;
  let tickTotalMs = 0;
  let tickCount = 0;
  const checkpoints: ScenarioCheckpoint[] = [];
  for (let month = 0; month < months; month++) {
    const days = new Date(
      Date.UTC(1991 + Math.floor(month / 12), (month % 12) + 1, 0),
    ).getUTCDate();
    for (let quantum = 0; quantum < days * QUANTA_PER_DAY; quantum++) {
      const started = performance.now();
      simulation.advanceQuantum();
      tickTotalMs += performance.now() - started;
      tickCount++;
    }
    domainEvents += simulation.takeDomainEvents().length;
    const snapshot = simulation.snapshot();
    if ((month + 1) % 12 === 0)
      checkpoints.push({
        year: (month + 1) / 12,
        hash: stateHash(snapshot),
        cashMinor: snapshot.finance.cashMinor,
        demandRoomNights: Object.values(snapshot.cityMarket.demand).reduce(
          (a, b) => a + b,
          0,
        ),
      });
  }
  const snapshot = simulation.snapshot();
  let publication = 0;
  let deltaBase = snapshot;
  for (let sample = 0; sample < 100; sample++) {
    simulation.advanceQuantum();
    const next = simulation.snapshot();
    maxDeltaBytes = Math.max(
      maxDeltaBytes,
      bytes(
        computeStateDelta(deltaBase, next, {
          basePublication: publication,
          publication: publication + 1,
        }),
      ),
    );
    publication++;
    deltaBase = next;
  }
  const loadStarted = performance.now();
  const restored = new GameSimulation(
    JSON.parse(serializeSavePayload(snapshot)) as ReturnType<
      typeof createInitialGameState
    >,
  );
  restored.refreshDerivedState();
  const saveLoadMs = performance.now() - loadStarted;
  if (checkpoints.length === 0)
    checkpoints.push({
      year: months / 12,
      hash: stateHash(snapshot),
      cashMinor: snapshot.finance.cashMinor,
      demandRoomNights: Object.values(snapshot.cityMarket.demand).reduce(
        (a, b) => a + b,
        0,
      ),
    });
  const activeCompetitors = snapshot.competitors.filter(
    (competitor) => competitor.status === "operate",
  );
  const totalRooms =
    snapshot.hotel.rooms.length +
    activeCompetitors.reduce((sum, competitor) => sum + competitor.rooms, 0);
  const largestRooms = Math.max(
    snapshot.hotel.rooms.length,
    ...activeCompetitors.map((competitor) => competitor.rooms),
  );
  const warnings = marketHealthWarnings({
    activeCompetitors: activeCompetitors.length,
    largestShareBasisPoints: Math.round(
      (largestRooms * 10_000) / Math.max(1, totalRooms),
    ),
    strategyCount: new Set(
      activeCompetitors.map((competitor) => competitor.strategy),
    ).size,
    adrIndexBasisPoints: 10_000,
    wageIndexBasisPoints: Math.min(10_000, snapshot.cityMarket.wagePressureBp),
  });
  const detailTiers = portfolioDetailTiers({
    viewedHotelId: snapshot.hotel.id,
    playerHotelIds: snapshot.company.portfolio.hotelIds,
    competitorHotelIds: snapshot.competitors.map((competitor) => competitor.id),
  });
  const detailTierCounts = { full: 0, operational: 0, aggregate: 0 };
  for (const tier of Object.values(detailTiers)) detailTierCounts[tier]++;
  return {
    stateHash: stateHash(snapshot),
    metrics: {
      years: months / 12,
      authoritativeMonths: months,
      hotels: snapshot.company.portfolio.hotelIds.length,
      hotelRooms: snapshot.hotel.rooms.length,
      cities: snapshot.cityMarket ? 1 : 0,
      competitors: snapshot.competitors.length,
      visibleAgents: Math.min(
        definition.visibleAgentBudget,
        snapshot.stays.length,
      ),
      cashMinor: snapshot.finance.cashMinor,
      demandRoomNights: Object.values(snapshot.cityMarket.demand).reduce(
        (a, b) => a + b,
        0,
      ),
      landPriceMinor: snapshot.cityMarket.landPriceMinor,
      wageIndexBasisPoints: snapshot.cityMarket.wagePressureBp,
      technologyAdoptionBasisPoints: Math.max(
        ...snapshot.world.technologies.map((tech) => tech.adoptionBp),
      ),
      insolvencies: snapshot.competitors.filter(
        (competitor) => competitor.status !== "operate",
      ).length,
      historyRecords: snapshot.finance.ledger.length,
      saveBytes: bytes(snapshot),
      maxDeltaBytes,
      meanTickMs: tickTotalMs / Math.max(1, tickCount),
      commandAckMs,
      saveLoadMs,
      heapBytes: process.memoryUsage().heapUsed,
      commandsAccepted: commandResults.filter(
        (result) => result.status === "accepted",
      ).length,
      domainEvents,
      warnings,
      detailTierCounts,
    },
    checkpoints,
  };
}

function matureHotels(count: number, cityCount: number): ManagedHotelRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    hotelId: `hotel.scale.${String(index).padStart(2, "0")}`,
    name: `Scale hotel ${index}`,
    cityId: `city.scale.${index % cityCount}`,
    rooms: 150,
    adrMinor: 14_000 + (index % 5) * 500,
    occupancyBasisPoints: 6_500 + (index % 4) * 250,
    gopMarginBasisPoints: 3_000 + (index % 3) * 200,
    openedDateKey: "1991-01-01",
  }));
}

function runMature(input: ScenarioInput) {
  const definition = scenarioDefinition("mature-50y");
  const years = input.years ?? definition.years;
  const streams = createRngStreams(input.seed);
  const worldSimulation = new WorldSimulation(streams);
  let world = createWorldState();
  const cities = Array.from({ length: definition.cities }, (_, index) =>
    createCityMarket(`1991-01-01`),
  );
  let remainingCompetitors = definition.competitors;
  const targetCompetitors: number[] = [];
  let competitors = cities.map((_, cityIndex) => {
    const count = Math.min(
      remainingCompetitors,
      Math.ceil(remainingCompetitors / (definition.cities - cityIndex)),
    );
    remainingCompetitors -= count;
    targetCompetitors.push(count);
    return createCompetitors()
      .slice(0, count)
      .map((competitor, index) => ({
        ...competitor,
        id: `hotel.rival.${cityIndex}.${index}`,
      }));
  });
  const hotels = matureHotels(definition.playerHotels, definition.cities);
  let cashMinor = 0;
  let domainEvents = 0;
  let maxDeltaBytes = 0;
  const checkpoints: ScenarioCheckpoint[] = [];
  let monthTotalMs = 0;
  for (let month = 0; month < years * 12; month++) {
    const monthStarted = performance.now();
    world = worldSimulation.stepMonth(world);
    const dateKey = monthKey(month);
    const nextDateKey = monthKey(month + 1);
    for (const hotel of hotels) {
      const cityIndex = Number(hotel.cityId.slice("city.scale.".length));
      const city = cities[cityIndex];
      const demandBp = Math.min(
        2_000,
        Math.round(
          Object.values(city.demand).reduce((sum, value) => sum + value, 0) /
            10,
        ),
      );
      cashMinor += managedHotelMonth(hotel, {
        periodStartDateKey: dateKey,
        brandUpliftBp: Math.max(
          0,
          Math.min(3_000, world.macro.growthBp + demandBp),
        ),
      }).grossOperatingProfitMinor;
    }
    for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
      for (const competitor of competitors[cityIndex])
        competitor.soldRoomNights = Math.trunc(
          (competitor.rooms * 30 * 6500) / 10_000,
        );
      cities[cityIndex].soldRoomNights = competitors[cityIndex].reduce(
        (sum, competitor) => sum + competitor.soldRoomNights,
        0,
      );
      const before = bytes({
        city: cities[cityIndex],
        competitors: competitors[cityIndex],
      });
      competitors[cityIndex] = advanceCityMonth(
        cities[cityIndex],
        competitors[cityIndex],
        {
          id: `hotel.player.${cityIndex}`,
          rooms: 150,
          rateMinor: 15_000,
          appealBp: 10_000,
          conferenceSeats: 100,
        },
        {
          endedMonthKey: dateKey,
          dateKey: nextDateKey,
          economy: streams.economy,
          ai: streams.AI,
        },
      );
      const templates = createCompetitors();
      while (competitors[cityIndex].length < targetCompetitors[cityIndex]) {
        const index = competitors[cityIndex].length;
        const template =
          templates[(cityIndex + month + index) % templates.length];
        competitors[cityIndex].push({
          ...structuredClone(template),
          id: `hotel.reentry.${cityIndex}.${month}.${index}`,
        });
      }
      maxDeltaBytes = Math.max(
        maxDeltaBytes,
        Math.abs(
          bytes({
            city: cities[cityIndex],
            competitors: competitors[cityIndex],
          }) - before,
        ),
      );
    }
    if ((month + 1) % 12 === 0) {
      const aggregate = { world, cities, competitors, cashMinor, hotels };
      checkpoints.push({
        year: (month + 1) / 12,
        hash: stateHash(aggregate),
        cashMinor,
        demandRoomNights: cities.reduce(
          (sum, city) =>
            sum + Object.values(city.demand).reduce((a, b) => a + b, 0),
          0,
        ),
      });
      domainEvents += competitors.flat().length;
    }
    monthTotalMs += performance.now() - monthStarted;
  }
  const aggregate = { world, cities, competitors, cashMinor, hotels };
  const demandRoomNights = cities.reduce(
    (sum, city) => sum + Object.values(city.demand).reduce((a, b) => a + b, 0),
    0,
  );
  const activeCompetitors = competitors
    .flat()
    .filter((competitor) => competitor.status === "operate");
  const totalRooms =
    activeCompetitors.reduce((sum, competitor) => sum + competitor.rooms, 0) +
    hotels.reduce((sum, hotel) => sum + hotel.rooms, 0);
  const largestRooms = Math.max(
    ...activeCompetitors.map((competitor) => competitor.rooms),
    ...hotels.map((hotel) => hotel.rooms),
  );
  const warnings = marketHealthWarnings({
    activeCompetitors: activeCompetitors.length,
    largestShareBasisPoints: Math.round(
      (largestRooms * 10_000) / Math.max(1, totalRooms),
    ),
    strategyCount: new Set(
      activeCompetitors.map((competitor) => competitor.strategy),
    ).size,
    adrIndexBasisPoints: 10_000,
    wageIndexBasisPoints: Math.min(
      10_000,
      Math.round(
        cities.reduce((sum, city) => sum + city.wagePressureBp, 0) /
          cities.length,
      ),
    ),
  });
  const detailTiers = portfolioDetailTiers({
    viewedHotelId: hotels[0].hotelId,
    playerHotelIds: hotels.map((hotel) => hotel.hotelId),
    competitorHotelIds: competitors.flat().map((competitor) => competitor.id),
  });
  return {
    stateHash: stateHash(aggregate),
    metrics: {
      years,
      authoritativeMonths: years * 12,
      hotels: hotels.length,
      hotelRooms: hotels.reduce((sum, hotel) => sum + hotel.rooms, 0),
      cities: cities.length,
      competitors: competitors.flat().length,
      visibleAgents: 0,
      cashMinor,
      demandRoomNights,
      landPriceMinor: Math.round(
        cities.reduce((sum, city) => sum + city.landPriceMinor, 0) /
          cities.length,
      ),
      wageIndexBasisPoints: Math.round(
        cities.reduce((sum, city) => sum + city.wagePressureBp, 0) /
          cities.length,
      ),
      technologyAdoptionBasisPoints: Math.max(
        ...world.technologies.map((technology) => technology.adoptionBp),
      ),
      insolvencies: competitors
        .flat()
        .filter((competitor) => competitor.status !== "operate").length,
      historyRecords: checkpoints.length,
      saveBytes: bytes(aggregate),
      maxDeltaBytes,
      meanTickMs: 0,
      commandAckMs: 0,
      saveLoadMs: 0,
      heapBytes: process.memoryUsage().heapUsed,
      aggregateMonthMs: monthTotalMs / Math.max(1, years * 12),
      commandsAccepted: 0,
      domainEvents,
      warnings,
      detailTierCounts: Object.values(detailTiers).reduce<
        Record<string, number>
      >((counts, tier) => ({ ...counts, [tier]: (counts[tier] ?? 0) + 1 }), {}),
    },
    checkpoints,
  };
}

export function runScenario(input: ScenarioInput) {
  if (
    !Number.isSafeInteger(input.seed) ||
    (input.years !== undefined &&
      (!Number.isSafeInteger(input.years) || input.years <= 0))
  )
    throw new Error("scenario seed and duration must be whole");
  return scenarioDefinition(input.scenarioId).id === "mature-50y"
    ? runMature(input)
    : runOperational(input);
}
