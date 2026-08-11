import { describe, expect, it } from "vitest";
import {
  addSpace,
  createCommercialSpace,
  createCommercialSpaceState,
  isOpen,
  monthlyContributionMinor,
  recordUse,
  securityLoad,
  spaceThroughput,
  startSpaceMonth,
} from "./commercialSpaces";
import {
  LOBBY_DEMAND_SOURCES,
  MAX_DEFLECTION_BP,
  automationFailureModes,
  availableSelfService,
  deflectedDemand,
  emptyLobbyDemand,
  lobbyThroughput,
  staffingAfterAutomation,
  totalLobbyDemand,
} from "./lobbyAutomation";

const SHOP = createCommercialSpace({
  id: "space.shop",
  kind: "shop",
  capacity: 40,
  openMinute: 480,
  closeMinute: 1200,
  unitPriceMinor: 1_500,
  operator: { kind: "self", marginBasisPoints: 3000 },
  staffRequired: 1,
  fitBp: 6000,
  maintenanceMinor: 40_000,
});

describe("lobby demand and automation", () => {
  it("keeps every lobby demand source separate", () => {
    expect(LOBBY_DEMAND_SOURCES).toEqual([
      "arrival",
      "orientation",
      "waiting",
      "reception",
      "checkout",
      "baggage",
      "concierge",
    ]);
    expect(totalLobbyDemand({ ...emptyLobbyDemand(), arrival: 5 })).toBe(5);
  });

  it("gates self-service on the world, never on the year", () => {
    expect(availableSelfService({})).toEqual([]);
    expect(
      availableSelfService({ "personal-computer": 3000 }).map((o) => o.id),
    ).toEqual(["self-checkin-kiosk"]);
    expect(availableSelfService({ smartphone: 4000 }).map((o) => o.id)).toEqual(
      ["mobile-checkin", "digital-key"],
    );
  });

  it("moves work off the desk without ever emptying it", () => {
    const demand = { ...emptyLobbyDemand(), reception: 100, checkout: 50 };
    const installed = availableSelfService({
      "personal-computer": 3000,
      smartphone: 4000,
    });
    const after = deflectedDemand(demand, installed);
    expect(after.demand.reception).toBeLessThan(100);
    // Three options all touching reception still cannot take it all.
    expect(after.demand.reception).toBe(
      100 - Math.trunc((100 * MAX_DEFLECTION_BP) / 10_000),
    );
    expect(after.deflectedBySource.reception).toBeGreaterThan(0);
    expect(after.demand.baggage).toBe(0);
  });

  it("moves staffing rather than removing it", () => {
    const none = staffingAfterAutomation({
      baselineReceptionists: 3,
      installed: [],
    });
    expect(none).toEqual({ receptionists: 3, technicians: 0 });
    const automated = staffingAfterAutomation({
      baselineReceptionists: 3,
      installed: availableSelfService({
        "personal-computer": 3000,
        smartphone: 4000,
      }),
    });
    expect(automated.receptionists).toBeLessThan(3);
    expect(automated.receptionists).toBeGreaterThanOrEqual(1);
    expect(automated.technicians).toBe(1);
  });

  it("names every way the automation can fail", () => {
    const modes = automationFailureModes(
      availableSelfService({ smartphone: 4000 }),
    );
    expect(modes.some((m) => m.includes("locked out"))).toBe(true);
    expect(modes).toHaveLength(2);
  });

  it("says which part of the lobby is the binding constraint", () => {
    const desk = lobbyThroughput({
      demand: { ...emptyLobbyDemand(), reception: 40, baggage: 2 },
      receptionists: 1,
      porters: 1,
      partiesPerReceptionist: 10,
      bagsPerPorter: 20,
    });
    expect(desk.unserved).toBe(30);
    expect(desk.cause).toMatch(/reception short by 30/);

    const bags = lobbyThroughput({
      demand: { ...emptyLobbyDemand(), reception: 5, baggage: 60 },
      receptionists: 1,
      porters: 1,
      partiesPerReceptionist: 10,
      bagsPerPorter: 20,
    });
    expect(bags.cause).toMatch(/baggage short by 40/);
    expect(
      lobbyThroughput({
        demand: { ...emptyLobbyDemand(), reception: 5 },
        receptionists: 1,
        porters: 1,
        partiesPerReceptionist: 10,
        bagsPerPorter: 20,
      }).cause,
    ).toBe("lobby is coping");
  });
});

describe("commercial spaces", () => {
  it("declares hours and refuses to trade outside them", () => {
    expect(isOpen(SHOP, 600)).toBe(true);
    expect(isOpen(SHOP, 60)).toBe(false);
    expect(
      spaceThroughput({
        space: SHOP,
        demand: 10,
        staffOnDuty: 1,
        minuteOfDay: 60,
      }),
    ).toEqual({
      served: 0,
      turnedAway: 10,
      cause: "alert.space.cause.closed",
      causeValues: {
        spaceId: "space.shop",
        openMinute: 480,
        closeMinute: 1200,
        minuteOfDay: 60,
      },
    });
  });

  it("will not open unstaffed, whatever its capacity says", () => {
    expect(
      spaceThroughput({
        space: SHOP,
        demand: 10,
        staffOnDuty: 0,
        minuteOfDay: 600,
      }),
    ).toEqual({
      served: 0,
      turnedAway: 10,
      cause: "alert.space.cause.unstaffed",
      causeValues: {
        spaceId: "space.shop",
        staffRequired: 1,
        staffOnDuty: 0,
      },
    });
  });

  it("serves up to capacity and says when that is what bound it", () => {
    expect(
      spaceThroughput({
        space: SHOP,
        demand: 60,
        staffOnDuty: 1,
        minuteOfDay: 600,
      }),
    ).toEqual({
      served: 40,
      turnedAway: 20,
      cause: "alert.space.cause.atCapacity",
      causeValues: { spaceId: "space.shop", capacity: 40, demand: 60 },
    });
  });

  it("pays the hotel differently under each operator model", () => {
    const units = 1_000;
    const self = monthlyContributionMinor(SHOP, units);
    expect(self.grossRevenueMinor).toBe(1_500_000);
    expect(self.hotelShareMinor).toBe(450_000 - 40_000);

    const let_ = monthlyContributionMinor(
      { ...SHOP, operator: { kind: "lease", monthlyRentMinor: 300_000 } },
      units,
    );
    // A lease pays the same whether the tenant sold anything at all.
    expect(let_.hotelShareMinor).toBe(300_000 - 40_000);
    expect(
      monthlyContributionMinor(
        { ...SHOP, operator: { kind: "lease", monthlyRentMinor: 300_000 } },
        0,
      ).hotelShareMinor,
    ).toBe(let_.hotelShareMinor);

    const concession = monthlyContributionMinor(
      {
        ...SHOP,
        operator: { kind: "concession", revenueShareBasisPoints: 1500 },
      },
      units,
    );
    expect(concession.hotelShareMinor).toBe(225_000 - 40_000);
  });

  it("refuses a space that closes before it opens", () => {
    expect(() =>
      createCommercialSpace({ ...SHOP, closeMinute: SHOP.openMinute }),
    ).toThrow(/close after it opens/);
  });

  it("makes every space the hotel opens a security load", () => {
    const quiet = securityLoad({
      inHouseGuests: 20,
      eventGuests: 0,
      openSpaces: 0,
    });
    const busy = securityLoad({
      inHouseGuests: 20,
      eventGuests: 150,
      openSpaces: 3,
    });
    expect(busy.guardsRequired).toBeGreaterThan(quiet.guardsRequired);
    expect(busy).toMatchObject({
      cause: "alert.security.spaces.cause",
      causeValues: {
        inHouseGuests: 20,
        eventGuests: 150,
        openSpaces: 3,
      },
    });
    expect(quiet.guardsRequired).toBeGreaterThanOrEqual(1);
  });

  it("counts what each space actually sold, and starts each month clean", () => {
    let state = addSpace(createCommercialSpaceState(), SHOP);
    state = recordUse(state, "space.shop", 12);
    state = recordUse(state, "space.shop", 8);
    expect(state.unitsSold["space.shop"]).toBe(20);
    expect(() => recordUse(state, "space.nowhere", 1)).toThrow(/unknown/);
    expect(startSpaceMonth(state).unitsSold).toEqual({});
    expect(() => addSpace(state, SHOP)).toThrow(/already exists/);
  });
});
