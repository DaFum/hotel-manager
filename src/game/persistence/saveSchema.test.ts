import { expect, it } from "vitest";
import { validateEnvelope } from "./saveSchema";

it("validates held and released block statuses", () => {
  const save = {
    saveVersion: 13,
    protocolVersion: 6,
    contentVersion: "1991.1",
    rngState: {
      guests: 1,
      staffing: 1,
      failures: 1,
      economy: 1,
      events: 1,
      weather: 1,
      AI: 1,
      narrative: 1,
    },
    state: {
      metrics: {},
      finance: {
        cashMinor: 100,
        ledger: [],
        month: { eventRevenueMinor: 0, housekeepingLateRoomReleaseCount: 0 },
      },
      monthlyCloseBaseline: {
        previousEventRevenueMinor: 0,
        previousLateRoomReleaseCount: 0,
        highWaterMarks: {
          revenueMinor: 0,
          operatingProfitMinor: 0,
          eventRevenueMinor: 0,
        },
      },
      calendar: { dateKey: "1991-01-01", minuteOfDay: 0 },
      hotel: { id: "h1", cityId: "c1", rooms: [] },
      company: {
        companyId: "c1",
        investorStakeBasisPoints: 0,
        portfolio: { hotelRegion: { h1: "r1" }, hotelIds: ["h1"] },
        legalEntities: [],
        brands: [],
        managedHotels: [],
        managers: [],
        treasury: { hqMinor: 0, hotelCashMinor: {} },
        hotelResults: {},
      },
      world: {
        technologies: [],
        trends: [],
        activeShocks: [],
        weather: { temperature: 0 },
        commonCurrency: "DM",
      },
      cityMarket: {
        occupancyAttribution: {
          occupancyMovementBp: 0,
          contributors: [],
        },
      },
      revenuePolicy: {
        ratePlans: [],
        rules: [],
      },
      technologyProjects: [],
      technologyImplementations: [],
      fnb: {
        menus: [],
        breakfast: { enabled: false },
        roomService: { items: [], deliveryFeeMinor: 0 },
      },
      renderDescriptors: {
        floorPlan: { rooms: {} },
        floorByRoomId: {},
        positionByEntityId: {},
        agents: [],
        elevator: { cars: [] },
      },
      alerts: [],
      narrative: {
        activeEvents: [],
        achievedMilestones: [],
        rivals: [],
        opportunities: [],
        lastFiredByDefinition: {},
        chronicle: { entries: [] },
        keyPeople: [],
        annualProfit: { baselineMinor: 0 },
        media: { toneModifier: 0, reviews: [] },
        prestige: { points: 0, levels: [] },
        campaign: {
          id: "c1",
          year: 1991,
          difficulty: "normal",
          budgetMinor: 0,
          goals: [],
        },
        career: { outcomes: [] },
      },
      stays: [],
      distribution: {
        allotments: [],
        groupBlocks: [
          {
            id: "b1",
            category: "single",
            roomsByDate: { "1991-01-01": 5 },
            groupRateMinor: 100,
            releaseDateKey: "1991-01-01",
            depositMinor: 0,
            cancellationDaysBeforeArrival: 0,
            cancellationFeeBasisPoints: 0,
            paymentTermsDays: 0,
            status: "held",
          },
          {
            id: "b2",
            category: "single",
            roomsByDate: { "1991-01-01": 5 },
            groupRateMinor: 100,
            releaseDateKey: "1991-01-01",
            depositMinor: 0,
            cancellationDaysBeforeArrival: 0,
            cancellationFeeBasisPoints: 0,
            paymentTermsDays: 0,
            status: "released",
          },
          {
            id: "b3",
            category: "single",
            roomsByDate: { "1991-01-01": 5 },
            groupRateMinor: 100,
            releaseDateKey: "1991-01-01",
            depositMinor: 0,
            cancellationDaysBeforeArrival: 0,
            cancellationFeeBasisPoints: 0,
            paymentTermsDays: 0,
            status: "unknown",
          },
        ],
        channelInventory: [],
      },
    },
  };

  const problems = validateEnvelope(save as any);
  expect(problems).toContain("the state has no valid distribution section");
});
