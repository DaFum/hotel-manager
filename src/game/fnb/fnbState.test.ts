import { describe, expect, it } from "vitest";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { createInitialGameState } from "../simulation/initialState";
import { createFnbState } from "./fnbState";

describe("F&B state", () => {
  it("starts every named outlet with the starter hotel's real capacities", () => {
    const state = createFnbState();

    expect(state.outlets.map((outlet) => outlet.id)).toEqual([
      "breakfastRoom",
      "bar",
      "roomService",
      "restaurant",
    ]);
    expect(
      state.outlets.map(({ id, seats, kitchenThroughput }) => ({
        id,
        seats,
        kitchenThroughput,
      })),
    ).toEqual([
      {
        id: "breakfastRoom",
        seats: STARTER_HOTEL.breakfastSeats,
        kitchenThroughput: STARTER_HOTEL.kitchenCovers,
      },
      {
        id: "bar",
        seats: STARTER_HOTEL.barSeats,
        kitchenThroughput: STARTER_HOTEL.kitchenCovers,
      },
      {
        id: "roomService",
        seats: 0,
        kitchenThroughput: STARTER_HOTEL.kitchenCovers,
      },
      {
        id: "restaurant",
        seats: STARTER_HOTEL.restaurantSeats,
        kitchenThroughput: STARTER_HOTEL.kitchenCovers,
      },
    ]);
  });

  it("keeps unobserved operational values whole and zero until service runs", () => {
    for (const outlet of createFnbState().outlets) {
      expect(outlet).toMatchObject({
        reservedSeats: 0,
        demand: 0,
        capacity: 0,
        served: 0,
        waitlisted: 0,
        serviceThroughput: 0,
        stockLeft: 0,
        wastedCovers: 0,
        ingredientExpenseMinor: 0,
        averageWaitMinutes: 0,
        serviceUtilizationBp: 0,
        kitchenUtilizationBp: 0,
        cause: "facility.cause.closed",
      });
      for (const value of Object.values(outlet).filter(
        (candidate): candidate is number => typeof candidate === "number",
      ))
        expect(Number.isSafeInteger(value)).toBe(true);
    }
  });

  it("includes the complete F&B slice in every new game", () => {
    expect(createInitialGameState(17).fnb).toEqual(createFnbState());
  });
});
