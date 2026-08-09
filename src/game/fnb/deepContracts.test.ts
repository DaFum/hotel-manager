import { describe, expect, it } from "vitest";
import {
  BOARD_COVERS,
  boardCommitment,
  boardSupplementMinor,
  foodWaste,
  menuQuadrant,
  misePlaceReadiness,
  safeRecipes,
  type Recipe,
} from "./boardPlans";
import { seatService, seatedCovers, turnedAwayCovers } from "./seating";
import { externalCovers } from "./externalDemand";
import { canReserve, openSlots, bookSlot } from "../wellness/reservations";
import { fitnessCapacity } from "../wellness/fitness";
import {
  CITY_EFFECT_LAG_DAYS,
  cancellationSettlementMinor,
  delayedCityEffect,
  depositMinor,
  executionPeaks,
  negotiatedRateMinor,
  technologyRequirements,
} from "../eventsales/negotiation";
import { runLaundryDay, externalLaundryCostMinor } from "../laundry/laundry";
import {
  prioritiseJobs,
  scheduleShift,
  unsafeUnits,
} from "../engineering/priorities";

const RECIPES: Recipe[] = [
  {
    id: "recipe.schnitzel",
    stationId: "station.grill",
    ingredientCostMinor: 400,
    sellingPriceMinor: 1_800,
    allergens: ["gluten"],
    misePlaceMinutes: 20,
  },
  {
    id: "recipe.soup",
    stationId: "station.larder",
    ingredientCostMinor: 150,
    sellingPriceMinor: 600,
    allergens: ["celery"],
    misePlaceMinutes: 10,
  },
];

describe("board plans and the kitchen", () => {
  it("owes covers by plan, per guest per night", () => {
    expect(boardCommitment("half-board", { guests: 2, nights: 3 })).toEqual({
      breakfast: 6,
      lunch: 0,
      dinner: 6,
    });
    expect(boardCommitment("room-only", { guests: 2, nights: 3 })).toEqual({
      breakfast: 0,
      lunch: 0,
      dinner: 0,
    });
    expect(BOARD_COVERS["full-board"].lunch).toBe(1);
  });

  it("sells a plan for less than the covers cost à la carte", () => {
    const supplement = boardSupplementMinor("half-board", 2_000);
    expect(supplement).toBeLessThan(2 * 2_000);
    expect(supplement).toBeGreaterThan(0);
    expect(boardSupplementMinor("room-only", 2_000)).toBe(0);
  });

  it("will not serve a guest a dish they react to", () => {
    expect(safeRecipes(RECIPES, ["gluten"]).map((r) => r.id)).toEqual([
      "recipe.soup",
    ]);
    expect(safeRecipes(RECIPES, ["gluten", "celery"])).toEqual([]);
    expect(safeRecipes(RECIPES, [])).toHaveLength(2);
  });

  it("says how much prep the service is short, not just whether it is ready", () => {
    const short = misePlaceReadiness({
      recipes: RECIPES,
      expectedCovers: 60,
      preparedMinutes: 30,
    });
    expect(short.ready).toBe(false);
    expect(short.shortMinutes).toBe(60);
    expect(short.cause).toMatch(/60 minutes of prep short for 60 covers/);
    expect(
      misePlaceReadiness({
        recipes: RECIPES,
        expectedCovers: 20,
        preparedMinutes: 30,
      }).ready,
    ).toBe(true);
  });

  it("puts a dish in a quadrant from popularity and margin separately", () => {
    const star = menuQuadrant({
      recipe: RECIPES[0],
      soldShareBasisPoints: 3000,
      averageMarginBasisPoints: 7000,
    });
    expect(star.quadrant).toBe("star");
    expect(star.marginBasisPoints).toBe(7777);

    // Popular and thin: a plough horse, not a dog.
    expect(
      menuQuadrant({
        recipe: RECIPES[0],
        soldShareBasisPoints: 3000,
        averageMarginBasisPoints: 9000,
      }).quadrant,
    ).toBe("plough-horse");
    // Good margin nobody orders is a puzzle, not a failure.
    expect(
      menuQuadrant({
        recipe: RECIPES[0],
        soldShareBasisPoints: 200,
        averageMarginBasisPoints: 7000,
      }).quadrant,
    ).toBe("puzzle");
    expect(
      menuQuadrant({
        recipe: RECIPES[0],
        soldShareBasisPoints: 200,
        averageMarginBasisPoints: 9000,
      }).quadrant,
    ).toBe("dog");
  });

  it("counts what went in the bin, by station", () => {
    const waste = foodWaste({ prepared: 80, sold: 60, recipes: RECIPES });
    expect(waste.wastedCovers).toBe(20);
    expect(waste.costMinor).toBeGreaterThan(0);
    expect(Object.keys(waste.byStation).sort()).toEqual([
      "station.grill",
      "station.larder",
    ]);
    expect(
      foodWaste({ prepared: 60, sold: 80, recipes: RECIPES }).wastedCovers,
    ).toBe(0);
  });

  it("rejects unsafe food-waste costs", () => {
    expect(() =>
      foodWaste({
        prepared: 1,
        sold: 0,
        recipes: [{ ...RECIPES[0], ingredientCostMinor: Number.NaN }],
      }),
    ).toThrow(/ingredient cost/);
    expect(() =>
      foodWaste({
        prepared: 1,
        sold: 0,
        recipes: [
          { ...RECIPES[0], ingredientCostMinor: Number.MAX_SAFE_INTEGER },
          { ...RECIPES[1], ingredientCostMinor: Number.MAX_SAFE_INTEGER },
        ],
      }),
    ).toThrow(/food waste/);
    expect(() =>
      foodWaste({
        prepared: 2,
        sold: 0,
        recipes: [
          { ...RECIPES[0], ingredientCostMinor: Number.MAX_SAFE_INTEGER },
        ],
      }),
    ).toThrow(/food waste/);
  });

  it("holds reserved seats back and turns away what it cannot seat", () => {
    const input = {
      seats: 40,
      reservedSeats: 10,
      walkIns: 0,
      serviceMinutes: 240,
      averageStayMinutes: 60,
      kitchenCovers: 200,
    };
    const capacity = seatedCovers(input);
    expect(capacity).toBe(120);
    // A waitlist is demand the outlet had to refuse, stated as a number.
    expect(turnedAwayCovers(capacity + 25, capacity)).toBe(25);
    // The kitchen binds before the room does when it is the tighter of the two.
    expect(seatedCovers({ ...input, kitchenCovers: 60 })).toBe(60);
    const service = seatService({ ...input, demand: 150, isOpen: true });
    expect(service.waitlisted).toBe(30);
    expect(seatService({ ...input, demand: 150, isOpen: false }).seated).toBe(
      0,
    );
  });

  it("draws external covers from the city on price and repute, not on luck", () => {
    const base = {
      baseCovers: 20,
      seasonalityBp: 10000,
      reputationBp: 5000,
    };
    const dear = externalCovers({ ...base, priceIndexBp: 13000 });
    const cheap = externalCovers({ ...base, priceIndexBp: 8000 });
    expect(cheap).toBeGreaterThan(dear);
    // Repute moves it too, independently of what is being charged.
    expect(
      externalCovers({ ...base, priceIndexBp: 10000, reputationBp: 9000 }),
    ).toBeGreaterThan(
      externalCovers({ ...base, priceIndexBp: 10000, reputationBp: 1000 }),
    );
  });
});

describe("wellness slots and resources", () => {
  it("needs a room, a therapist and an open spa all at once", () => {
    const schedule = {
      treatmentRooms: 2,
      therapists: 1,
      openMinutes: 360,
      booked: 0,
    };
    expect(openSlots(schedule)).toBeGreaterThan(0);
    // A therapist is a hard resource: rooms alone sell nothing.
    expect(openSlots({ ...schedule, therapists: 0 })).toBe(0);
    expect(canReserve({ roomSlots: 1, staffSlots: 0, isOpen: true })).toBe(
      false,
    );
    expect(canReserve({ roomSlots: 1, staffSlots: 1, isOpen: false })).toBe(
      false,
    );
  });

  it("books a slot and refuses one when the day is sold out or shut", () => {
    const schedule = {
      treatmentRooms: 2,
      therapists: 1,
      openMinutes: 360,
      booked: 0,
    };
    const booked = bookSlot(schedule, "guest.1");
    expect(booked.accepted).toBe(true);
    expect(booked.schedule.booked).toBe(1);

    const soldOut = bookSlot(
      { ...schedule, booked: openSlots(schedule) },
      "guest.2",
    );
    expect(soldOut.accepted).toBe(false);
    expect(soldOut.reason).toBe("no free slot");
    expect(bookSlot({ ...schedule, openMinutes: 10 }, "guest.3").reason).toBe(
      "spa closed",
    );
  });

  it("sizes the gym by floor area or stations, whichever runs out first", () => {
    expect(fitnessCapacity({ areaSqm: 48, equipmentStations: 6 })).toBe(6);
    expect(fitnessCapacity({ areaSqm: 8, equipmentStations: 6 })).toBe(2);
    expect(fitnessCapacity({ areaSqm: 0, equipmentStations: 6 })).toBe(0);
  });
});

const LINES = {
  rental: 400_000,
  rooms: 900_000,
  catering: 500_000,
  technology: 200_000,
};

describe("event negotiation", () => {
  it("takes a deposit up front, as a share of the whole contract", () => {
    expect(depositMinor(LINES)).toBe(500_000);
  });

  it("refunds inside the free window and keeps the fee outside it", () => {
    const inside = cancellationSettlementMinor({
      lines: LINES,
      startDateKey: "1991-06-01",
      cancelledOnDateKey: "1991-04-01",
    });
    expect(inside.keptMinor).toBe(0);
    expect(inside.refundedMinor).toBe(500_000);

    const late = cancellationSettlementMinor({
      lines: LINES,
      startDateKey: "1991-06-01",
      cancelledOnDateKey: "1991-05-28",
    });
    expect(late.keptMinor).toBe(500_000);
    expect(late.refundedMinor).toBe(0);
    expect(late.cause).toMatch(/5000bp fee applies/);
  });

  it("peaks at arrival, coffee and lunch rather than spreading flat", () => {
    const peaks = executionPeaks({ guests: 120, sessionCount: 3 });
    expect(peaks.map((p) => p.cause)).toContain("morning coffee");
    expect(peaks.filter((p) => p.cause.startsWith("break after"))).toHaveLength(
      2,
    );
    expect(peaks[0].covers).toBe(120);
  });

  it("asks for the technology the room actually needs", () => {
    expect(technologyRequirements({ guests: 60, sessionCount: 2 })).toEqual([
      { item: "microphone", quantity: 2 },
      { item: "projector", quantity: 2 },
    ]);
    expect(
      technologyRequirements({ guests: 200, sessionCount: 1 }).map(
        (l) => l.item,
      ),
    ).toContain("interpreter-booth");
  });

  it("brings business back months later, and only if it went well", () => {
    const good = delayedCityEffect({
      guests: 200,
      satisfaction: 85,
      startDateKey: "1991-06-01",
    });
    expect(good.extraRoomNights).toBeGreaterThan(0);
    expect(good.fromDateKey).toBe("1991-09-29");
    expect(CITY_EFFECT_LAG_DAYS).toBe(120);
    expect(
      delayedCityEffect({
        guests: 200,
        satisfaction: 40,
        startDateKey: "1991-06-01",
      }).extraRoomNights,
    ).toBe(0);
  });

  it("discounts for size but never below the floor", () => {
    const big = negotiatedRateMinor({
      listRateMinor: 100_000,
      guests: 400,
      floorBasisPoints: 8000,
    });
    expect(big.discountBasisPoints).toBe(2000);
    expect(big.rateMinor).toBe(80_000);
    const small = negotiatedRateMinor({
      listRateMinor: 100_000,
      guests: 8,
      floorBasisPoints: 8000,
    });
    expect(small.discountBasisPoints).toBeLessThan(big.discountBasisPoints);
    expect(
      negotiatedRateMinor({
        listRateMinor: Number.MAX_SAFE_INTEGER,
        guests: 100,
        floorBasisPoints: 8000,
      }).rateMinor,
    ).toBe(7_205_759_403_792_792);
  });
});

describe("laundry and engineering", () => {
  it("uses paid-for capacity first and contracts out the overflow", () => {
    const day = runLaundryDay({
      clean: 100,
      dirty: 500,
      machine: 220,
      staffed: 240,
      externalPieces: 400,
      floorStock: 40,
    });
    expect(day.washedInHouse).toBe(220);
    expect(day.washedExternally).toBeGreaterThan(0);
    expect(day.externalCostMinor).toBe(
      externalLaundryCostMinor(day.washedExternally),
    );
    // Linen on the floors is not available to the laundry.
    expect(day.floorStock).toBe(40);
  });

  it("does the safe work first, then whatever will break something else", () => {
    const jobs = [
      {
        id: "job.cosmetic",
        assetId: "a",
        workClass: "cosmetic" as const,
        minutes: 30,
        costMinor: 1_000,
        blocksUnits: 0,
        deferredCostMinor: 0,
      },
      {
        id: "job.revenue",
        assetId: "b",
        workClass: "revenue" as const,
        minutes: 60,
        costMinor: 5_000,
        blocksUnits: 3,
        deferredCostMinor: 10_000,
      },
      {
        id: "job.leak",
        assetId: "c",
        workClass: "followOnDamage" as const,
        minutes: 60,
        costMinor: 8_000,
        blocksUnits: 1,
        deferredCostMinor: 90_000,
      },
      {
        id: "job.fire",
        assetId: "d",
        workClass: "safety" as const,
        minutes: 90,
        costMinor: 20_000,
        blocksUnits: 6,
        deferredCostMinor: 0,
      },
    ];
    expect(prioritiseJobs(jobs).map((j) => j.id)).toEqual([
      "job.fire",
      "job.leak",
      "job.revenue",
      "job.cosmetic",
    ]);

    const shift = scheduleShift({
      jobs,
      availableMinutes: 150,
      budgetMinor: 1_000_000,
    });
    expect(shift.done.map((j) => j.id)).toEqual(["job.fire", "job.leak"]);
    expect(shift.deferred.map((j) => j.id)).toEqual([
      "job.revenue",
      "job.cosmetic",
    ]);
    expect(shift.deferredCostMinor).toBe(10_000);
    expect(shift.cause).toMatch(/out of engineer hours at job.revenue/);
    expect(unsafeUnits(shift.deferred)).toBe(0);
    expect(unsafeUnits(jobs)).toBe(6);
  });

  it("rejects an unsafe deferred-cost total", () => {
    const job = {
      id: "job.unsafe",
      assetId: "a",
      workClass: "cosmetic" as const,
      minutes: 1,
      costMinor: 1,
      blocksUnits: 0,
      deferredCostMinor: Number.MAX_SAFE_INTEGER,
    };
    expect(() =>
      scheduleShift({
        jobs: [job, { ...job, id: "job.unsafe.2" }],
        availableMinutes: 0,
        budgetMinor: 0,
      }),
    ).toThrow(/deferred cost/);
  });

  it("stops when the money runs out, and says that is what stopped it", () => {
    const shift = scheduleShift({
      jobs: [
        {
          id: "job.fire",
          assetId: "d",
          workClass: "safety" as const,
          minutes: 10,
          costMinor: 20_000,
          blocksUnits: 6,
          deferredCostMinor: 0,
        },
      ],
      availableMinutes: 600,
      budgetMinor: 1_000,
    });
    expect(shift.done).toEqual([]);
    expect(shift.cause).toMatch(/out of budget at job.fire/);
    expect(unsafeUnits(shift.deferred)).toBe(6);
  });
});
