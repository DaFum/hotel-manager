import { describe, expect, it } from "vitest";
import { GameSimulation } from "./GameSimulation";
import { createInitialGameState, type StayRecord } from "./initialState";
import {
  BAR_SERVICE_MINUTE,
  BREAKFAST_START,
  RESTAURANT_SERVICE_MINUTE,
  ROOM_SERVICE_MINUTE,
} from "../fnb/schedule";

function stays(count: number): StayRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    bookingId: `booking.fnb.${index}`,
    roomId: `room.${101 + (index % 24)}`,
    rateMinor: 10_000,
    departureDateKey: "1991-01-03",
  }));
}

function runToMinute(simulation: GameSimulation, minuteOfDay: number): void {
  while (simulation.state.calendar.minuteOfDay !== minuteOfDay)
    simulation.advanceQuantum();
}

function outlet(simulation: GameSimulation, id: string) {
  return simulation.state.fnb.outlets.find((candidate) => candidate.id === id)!;
}

describe("authoritative F&B operations", () => {
  it("records breakfast capacity, food cost, queue alerts, and cause changes", () => {
    const state = createInitialGameState(31);
    state.stays = stays(20);
    state.stock["breakfast-portion"] = 10;
    const simulation = new GameSimulation(state);
    simulation.refreshDerivedState();
    simulation.takeDomainEvents();

    runToMinute(simulation, BREAKFAST_START - 5);
    const foodCostBefore = simulation.state.finance.ledger.filter(
      (entry) => entry.account === "foodCost",
    );
    expect(foodCostBefore).toEqual([
      {
        day: 0,
        account: "foodCost",
        amountMinor: -27_000,
        memo: "60 breakfast-portion",
      },
    ]);
    const operatingExpenseBefore =
      simulation.state.finance.month.operatingExpenseMinor;
    simulation.advanceQuantum();

    expect(outlet(simulation, "breakfastRoom")).toMatchObject({
      demand: 20,
      capacity: 10,
      served: 10,
      waitlisted: 10,
      stockLeft: 0,
      wastedCovers: 0,
      ingredientExpenseMinor: 4_500,
      averageWaitMinutes: 30,
      cause: "facility.cause.stock",
    });
    expect(
      simulation.state.finance.ledger.filter(
        (entry) => entry.account === "foodCost",
      ),
    ).toEqual(foodCostBefore);
    expect(simulation.state.finance.month.operatingExpenseMinor).toBe(
      operatingExpenseBefore,
    );
    expect(simulation.state.alerts).toContainEqual(
      expect.objectContaining({
        id: "alert.fnb-wait.breakfastRoom",
        cause: "alert.fnb-wait.cause",
        causeValues: expect.objectContaining({
          outletId: "breakfastRoom",
          waitlisted: 10,
        }),
      }),
    );
    expect(
      simulation
        .takeDomainEvents()
        .filter(
          (event) =>
            event.payload.type === "FACILITY_CONSTRAINT_CHANGED" &&
            event.payload.facilityId === "fnb.breakfastRoom",
        )
        .map((event) => event.payload),
    ).toEqual([
      {
        type: "FACILITY_CONSTRAINT_CHANGED",
        facilityId: "fnb.breakfastRoom",
        cause: "facility.cause.stock",
      },
    ]);
  });

  it("populates every active outlet from shared stock and scopes wait alerts", () => {
    const state = createInitialGameState(37);
    state.stays = stays(20);
    state.stock["breakfast-portion"] = 10;
    const simulation = new GameSimulation(state);

    runToMinute(simulation, BREAKFAST_START);
    expect(
      simulation.state.alerts.some(
        (alert) => alert.id === "alert.fnb-wait.breakfastRoom",
      ),
    ).toBe(true);

    runToMinute(simulation, RESTAURANT_SERVICE_MINUTE - 5);
    simulation.state.stock["breakfast-portion"] = 100;
    simulation.advanceQuantum();
    expect(outlet(simulation, "restaurant")).toMatchObject({
      demand: expect.any(Number),
      served: expect.any(Number),
    });
    expect(outlet(simulation, "restaurant").demand).toBeGreaterThan(0);

    runToMinute(simulation, BAR_SERVICE_MINUTE - 5);
    simulation.state.stock["breakfast-portion"] = 100;
    simulation.advanceQuantum();
    const stockAfterBar = simulation.state.stock["breakfast-portion"];
    expect(stockAfterBar).toBeLessThan(100);
    runToMinute(simulation, ROOM_SERVICE_MINUTE - 5);
    simulation.advanceQuantum();
    expect(simulation.state.stock["breakfast-portion"]).toBeLessThan(
      stockAfterBar,
    );
    for (const id of ["breakfastRoom", "restaurant", "bar", "roomService"])
      expect(outlet(simulation, id).demand).toBeGreaterThan(0);

    simulation.state.stays = stays(5);
    runToMinute(simulation, BREAKFAST_START);
    expect(outlet(simulation, "breakfastRoom").waitlisted).toBe(0);
    expect(
      simulation.state.alerts.some(
        (alert) => alert.id === "alert.fnb-wait.breakfastRoom",
      ),
    ).toBe(false);
    const revenueAccounts = simulation.state.finance.ledger
      .filter((entry) => entry.amountMinor > 0)
      .map((entry) => entry.account);
    expect(revenueAccounts).toEqual(
      expect.arrayContaining([
        "breakfastRevenue",
        "restaurantRevenue",
        "barRevenue",
        "roomServiceRevenue",
      ]),
    );
  });

  it("names the tightest room-service dependency as its cause", () => {
    const state = createInitialGameState(41);
    state.stays = stays(20);
    state.stock["breakfast-portion"] = 200;
    state.assets.find((asset) => asset.id === "asset.lift")!.status = "failed";
    const simulation = new GameSimulation(state);

    runToMinute(simulation, ROOM_SERVICE_MINUTE);

    expect(outlet(simulation, "roomService")).toMatchObject({
      demand: 1,
      capacity: 0,
      served: 0,
      waitlisted: 1,
      cause: "facility.cause.elevator",
    });
  });
});
