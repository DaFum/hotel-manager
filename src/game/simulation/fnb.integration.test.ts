import { describe, expect, it } from "vitest";
import { GameSimulation } from "./GameSimulation";
import { createInitialGameState, type StayRecord } from "./initialState";

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

    runToMinute(simulation, 390);

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
    ).toEqual([
      {
        day: 0,
        account: "foodCost",
        amountMinor: -4_500,
        memo: "breakfast ingredients and waste",
      },
    ]);
    expect(simulation.state.alerts).toContainEqual(
      expect.objectContaining({
        id: "alert.fnb-wait",
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

  it("populates every active outlet and clears the shared wait alert", () => {
    const state = createInitialGameState(37);
    state.stays = stays(20);
    state.stock["breakfast-portion"] = 10;
    const simulation = new GameSimulation(state);

    runToMinute(simulation, 390);
    expect(
      simulation.state.alerts.some((alert) => alert.id === "alert.fnb-wait"),
    ).toBe(true);

    simulation.state.stock["breakfast-portion"] = 100;
    runToMinute(simulation, 1_140);
    runToMinute(simulation, 1_320);
    for (const id of ["breakfastRoom", "bar", "roomService"])
      expect(outlet(simulation, id).demand).toBeGreaterThan(0);

    simulation.state.stays = stays(5);
    runToMinute(simulation, 390);
    expect(outlet(simulation, "breakfastRoom").waitlisted).toBe(0);
    expect(
      simulation.state.alerts.some((alert) => alert.id === "alert.fnb-wait"),
    ).toBe(false);
    expect(outlet(simulation, "restaurant")).toMatchObject({
      demand: 0,
      served: 0,
      cause: "facility.cause.closed",
    });

    const revenueAccounts = simulation.state.finance.ledger
      .filter((entry) => entry.amountMinor > 0)
      .map((entry) => entry.account);
    expect(revenueAccounts).toEqual(
      expect.arrayContaining([
        "breakfastRevenue",
        "barRevenue",
        "roomServiceRevenue",
      ]),
    );
  });
});
