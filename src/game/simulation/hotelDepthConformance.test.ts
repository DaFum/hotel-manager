import { describe, expect, it } from "vitest";
import { seatService } from "../fnb/seating";
import { runKitchenService } from "../fnb/kitchen";
import { roomServiceCapacity } from "../fnb/roomService";
import { reserveTreatment } from "../wellness/reservations";
import {
  advanceContract,
  type ConferenceContract,
} from "../eventsales/contracts";
import { runLaundryDay } from "../laundry/laundry";
import { prioritizeEngineering } from "../engineering/policy";
import { createUtilityState, meterUtilities } from "../facilities/utilities";
import { facilityRow } from "../facilities/facilityBoard";

describe("Plan 02 operating-depth conformance", () => {
  it("serves only inside opening hours and waitlists beyond capacity", () => {
    const input = {
      seats: 10,
      reservedSeats: 4,
      walkIns: 0,
      serviceMinutes: 60,
      averageStayMinutes: 30,
      kitchenCovers: 20,
      demand: 15,
    };
    expect(seatService({ ...input, isOpen: false })).toEqual({
      seated: 0,
      waitlisted: 15,
      capacity: 0,
    });
    expect(seatService({ ...input, isOpen: true })).toEqual({
      seated: 12,
      waitlisted: 3,
      capacity: 12,
    });
  });

  it("moves board plans, mise-en-place, allergies and waste through one stock", () => {
    const result = runKitchenService({
      boardCovers: 6,
      aLaCarteCovers: 6,
      prepared: 10,
      stock: 12,
      allergyCovers: 2,
      substitutionStock: 2,
      ingredientMinor: 500,
      wasteBp: 1000,
    });
    expect(result).toMatchObject({
      served: 10,
      substituted: 2,
      stockLeft: 2,
      ingredientExpenseMinor: 5000,
      cause: "facility.cause.miseEnPlace",
    });
  });

  it("never substitutes more covers than it serves", () => {
    const base = {
      boardCovers: 0,
      aLaCarteCovers: 1,
      prepared: 10,
      stock: 10,
      allergyCovers: 5,
      substitutionStock: 5,
      ingredientMinor: 1,
      wasteBp: 0,
    };
    expect(runKitchenService(base).substituted).toBe(1);
    expect(runKitchenService({ ...base, aLaCarteCovers: 0 }).substituted).toBe(
      0,
    );
  });

  it("rejects unsafe service and utility inputs", () => {
    expect(() =>
      seatService({
        seats: 1,
        reservedSeats: 0,
        walkIns: 0,
        serviceMinutes: 1,
        averageStayMinutes: 1,
        kitchenCovers: 1,
        demand: Number.NaN,
        isOpen: true,
      }),
    ).toThrow();
    expect(() =>
      roomServiceCapacity({
        demand: -1,
        kitchen: 1,
        staffed: 1,
        transport: 1,
        elevator: 1,
      }),
    ).toThrow();
    expect(() =>
      meterUtilities(
        createUtilityState(),
        [{ id: "bad", waterUnits: 0.5, energyUnits: 1 }],
        { waterMinor: 1, energyMinor: 1 },
      ),
    ).toThrow();
    expect(() =>
      reserveTreatment({
        schedule: {
          treatmentRooms: 1,
          therapists: 1,
          openMinutes: 60,
          booked: 0,
        },
        guestId: "g",
        linen: 1,
        water: Number.MAX_SAFE_INTEGER + 1,
        energy: 2,
        maintained: true,
      }),
    ).toThrow();
  });

  it("names the tightest room-service dependency as its cause", () => {
    expect(
      roomServiceCapacity({
        demand: 20,
        kitchen: 16,
        staffed: 12,
        transport: 9,
        elevator: 4,
      }),
    ).toEqual({ served: 4, cause: "facility.cause.elevator" });
  });

  it("limits wellness by specialists, utilities and maintenance state", () => {
    const schedule = {
      treatmentRooms: 2,
      therapists: 1,
      openMinutes: 90,
      booked: 0,
    };
    expect(
      reserveTreatment({
        schedule,
        guestId: "g",
        linen: 4,
        water: 4,
        energy: 4,
        maintained: false,
      }).reason,
    ).toBe("maintenance state");
    expect(
      reserveTreatment({
        schedule: { ...schedule, therapists: 0 },
        guestId: "g",
        linen: 4,
        water: 4,
        energy: 4,
        maintained: true,
      }).reason,
    ).toBe("specialist staff");
    expect(
      reserveTreatment({
        schedule,
        guestId: "g",
        linen: 4,
        water: 4,
        energy: 4,
        maintained: true,
      }),
    ).toMatchObject({
      accepted: true,
      linenUsed: 1,
      waterUsed: 3,
      energyUsed: 2,
    });
  });

  it("runs the conference lifecycle from offer to cancellation", () => {
    const offered: ConferenceContract = {
      id: "event.1",
      guests: 50,
      nights: 2,
      roomsBlocked: 10,
      startDateKey: "1991-04-01",
      status: "offered",
      offerMinor: 500000,
      depositMinor: 100000,
    };
    const negotiating = advanceContract(offered, "negotiate");
    const confirmed = advanceContract(negotiating, "confirm");
    expect(confirmed.depositMinor).toBe(100000);
    expect(advanceContract(confirmed, "cancel")).toMatchObject({
      status: "cancelled",
      releasedRoomNights: 20,
      depositOutcome: { retainedMinor: 100000, refundedMinor: 0 },
    });
  });

  it("trades internal laundry capacity against external contract cost", () => {
    const result = runLaundryDay({
      clean: 20,
      dirty: 100,
      machine: 40,
      staffed: 30,
      externalPieces: 50,
      floorStock: 10,
    });
    expect(result).toMatchObject({
      washedInHouse: 30,
      washedExternally: 50,
      floorStock: 10,
      dirty: 20,
    });
    expect(result.externalCostMinor).toBeGreaterThan(0);
  });

  it("ranks preventive, reactive and replacement work by remaining life", () => {
    const ordered = prioritizeEngineering([
      {
        id: "due",
        status: "operational",
        condition: 70,
        minutesSinceService: 200000,
        replacementMinor: 1000,
        repairMinor: 100,
      },
      {
        id: "failed",
        status: "failed",
        condition: 40,
        minutesSinceService: 0,
        replacementMinor: 1000,
        repairMinor: 100,
      },
      {
        id: "replace",
        status: "operational",
        condition: 10,
        minutesSinceService: 0,
        replacementMinor: 1000,
        repairMinor: 800,
      },
    ]);
    expect(ordered.map((x) => x.id)).toEqual(["failed", "due", "replace"]);
  });

  it("draws authoritative utility consumption from every serviced area", () => {
    const result = meterUtilities(
      createUtilityState(),
      [
        { id: "wellness", waterUnits: 30, energyUnits: 20 },
        { id: "laundry", waterUnits: 50, energyUnits: 40 },
        { id: "kitchen", waterUnits: 20, energyUnits: 60 },
      ],
      { waterMinor: 2, energyMinor: 3 },
    );
    expect(result.state).toMatchObject({
      waterUsed: 100,
      energyUsed: 120,
      expenseMinor: 560,
    });
    expect(Object.keys(result.causes).sort()).toEqual([
      "kitchen",
      "laundry",
      "wellness",
    ]);
  });

  it("names the tightest constraint for every serviced area", () => {
    for (const id of [
      "kitchen",
      "bar",
      "room-service",
      "wellness",
      "conference",
      "laundry",
      "engineering",
    ])
      expect(
        facilityRow({
          id,
          name: id,
          demand: 20,
          constraints: [
            { label: "space", value: 30 },
            { label: "staff", value: 10 },
            { label: "utilities", value: 15 },
          ],
        }).cause,
      ).toBe("staff");
  });
});
