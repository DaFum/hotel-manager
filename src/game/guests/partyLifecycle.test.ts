import { describe, expect, it } from "vitest";
import {
  STAY_STAGES,
  beginStay,
  chooseOption,
  compareOption,
  contributorsForStage,
  createGuestRelationsState,
  createParty,
  effectiveBudgetMinor,
  loyaltyAfterStay,
  partySize,
  recordStayEvent,
  registerParty,
  reviewScore,
  roomsNeeded,
} from "./partyLifecycle";
import {
  MAX_RECOVERY_SHARE_BP,
  SEVERITY_IMPACT,
  applyRecovery,
  authoriseRecovery,
  openComplaint,
  refuseRecovery,
  satisfactionAfterRecovery,
} from "./recoveryAuthority";
import { createManagerAuthority } from "../management/managerAuthority";

const PARTY = createParty({
  id: "party.1",
  segmentId: "segment.leisure",
  adults: 2,
  children: 2,
  budgetPerNightMinor: 14_000,
  needs: ["cot", "quiet-room"],
  preferences: ["high-floor"],
  tolerance: 60,
  loyalty: 20,
  bookingId: "booking.1",
});

const OPTION = {
  hotelId: "hotel.a",
  ratePerNightMinor: 10_000,
  available: true,
  fit: 70,
  reputation: 60,
  channelVisibility: 50,
  meetsNeeds: ["cot", "quiet-room"],
};

describe("guest parties", () => {
  it("is a party of people with one budget, not a booking row", () => {
    expect(partySize(PARTY)).toBe(4);
    expect(roomsNeeded(PARTY)).toBe(2);
    expect(roomsNeeded(PARTY, 4)).toBe(1);
    expect(() => createParty({ ...PARTY, adults: 0 })).toThrow(/one adult/);
  });

  it("pays a little more for a house it is already attached to", () => {
    expect(effectiveBudgetMinor(PARTY)).toBeGreaterThan(
      PARTY.budgetPerNightMinor,
    );
    expect(effectiveBudgetMinor({ ...PARTY, loyalty: 0 })).toBe(
      PARTY.budgetPerNightMinor,
    );
  });

  it("refuses a house it cannot have or cannot afford, and says which", () => {
    expect(compareOption(PARTY, { ...OPTION, available: false })).toEqual({
      hotelId: "hotel.a",
      score: 0,
      reasons: ["no room available"],
      eligible: false,
    });
    const dear = compareOption(PARTY, {
      ...OPTION,
      ratePerNightMinor: 20_000,
    });
    expect(dear.eligible).toBe(false);
    expect(dear.reasons[0]).toMatch(/against a budget of 14000/);
  });

  it("weighs price, needs, fit, reputation, visibility and loyalty separately", () => {
    const result = compareOption(PARTY, OPTION);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([
      "value 28",
      "every need met",
      "fit 70",
      "reputation 60",
      "visibility 50",
      "loyalty 20",
    ]);
    // Missing a stated need costs, and the reason names it.
    const missing = compareOption(PARTY, { ...OPTION, meetsNeeds: ["cot"] });
    expect(missing.score).toBeLessThan(result.score);
    expect(missing.reasons).toContain("unmet: quiet-room");
  });

  it("picks the best eligible house, breaking ties on a stable id", () => {
    const chosen = chooseOption(PARTY, [
      { ...OPTION, hotelId: "hotel.b", reputation: 30 },
      { ...OPTION, hotelId: "hotel.a" },
    ]);
    expect(chosen?.hotelId).toBe("hotel.a");
    // A shortlist of nothing it can have is no booking, not a bad booking.
    expect(chooseOption(PARTY, [{ ...OPTION, available: false }])).toBeNull();
    const tied = chooseOption(PARTY, [
      { ...OPTION, hotelId: "hotel.z" },
      { ...OPTION, hotelId: "hotel.a" },
    ]);
    expect(tied?.hotelId).toBe("hotel.a");
  });
});

describe("the stay itself", () => {
  it("keeps every stage's contributors rather than one score", () => {
    let stay = beginStay({
      partyId: "party.1",
      bookingId: "booking.1",
      roomId: "room.101",
    });
    stay = recordStayEvent(stay, {
      stage: "checkIn",
      cause: "waited 40 minutes",
      delta: -10,
    });
    stay = recordStayEvent(stay, {
      stage: "room",
      cause: "cot ready on arrival",
      delta: 5,
    });
    expect(stay.satisfaction).toBe(65);
    expect(contributorsForStage(stay, "checkIn")).toEqual([
      { stage: "checkIn", cause: "waited 40 minutes", delta: -10 },
    ]);
    expect(contributorsForStage(stay, "checkOut")).toEqual([]);
    expect(STAY_STAGES).toContain("service");
  });

  it("refuses an event nobody can explain", () => {
    const stay = beginStay({
      partyId: "party.1",
      bookingId: "booking.1",
      roomId: null,
    });
    expect(() =>
      recordStayEvent(stay, { stage: "room", cause: "", delta: -5 }),
    ).toThrow(/cause/);
  });

  it("leaves a review only when the stay was notable, and names the worst of it", () => {
    let stay = beginStay({
      partyId: "party.1",
      bookingId: "booking.1",
      roomId: "room.101",
    });
    // Well inside a tolerant party's patience: nothing gets said.
    stay = recordStayEvent(stay, {
      stage: "service",
      cause: "slow breakfast",
      delta: -5,
    });
    expect(reviewScore(PARTY, stay).leaves).toBe(false);

    stay = recordStayEvent(stay, {
      stage: "room",
      cause: "no hot water",
      delta: -30,
    });
    const review = reviewScore(PARTY, stay);
    expect(review.leaves).toBe(true);
    expect(review.reasons[0]).toBe("room: no hot water");
  });

  it("moves the party's attachment by how the stay actually went", () => {
    const good = recordStayEvent(
      beginStay({ partyId: "party.1", bookingId: "b", roomId: "r" }),
      { stage: "room", cause: "upgraded", delta: 20 },
    );
    const bad = recordStayEvent(
      beginStay({ partyId: "party.1", bookingId: "b", roomId: "r" }),
      { stage: "room", cause: "no hot water", delta: -40 },
    );
    expect(loyaltyAfterStay(PARTY, good)).toBeGreaterThan(PARTY.loyalty);
    expect(loyaltyAfterStay(PARTY, bad)).toBeLessThan(PARTY.loyalty);
  });

  it("registers a party once", () => {
    const state = registerParty(createGuestRelationsState(), PARTY);
    expect(state.parties).toHaveLength(1);
    expect(() => registerParty(state, PARTY)).toThrow(/already exists/);
  });
});

const COMPLAINT = {
  id: "complaint.1",
  bookingId: "booking.1",
  stage: "room",
  cause: "no hot water",
  severity: "serious" as const,
  raisedAtMinutes: 1440,
};

describe("service recovery under authority", () => {
  it("lets a manager settle within their limit and escalates the rest", () => {
    const authority = createManagerAuthority({
      repairLimitMinor: 0,
      recoveryLimitMinor: 20_000,
    });
    expect(
      authoriseRecovery(authority, {
        id: "offer.1",
        complaintId: "complaint.1",
        remedy: "free night",
        costMinor: 20_000,
      }).authorised,
    ).toBe(true);
    const refused = authoriseRecovery(authority, {
      id: "offer.2",
      complaintId: "complaint.1",
      remedy: "two free nights",
      costMinor: 20_001,
    });
    expect(refused.authorised).toBe(false);
    // A bare RegExp inside toMatchObject is compared structurally and would
    // pass against any string at all.
    expect(refused).toMatchObject({
      reason: expect.stringMatching(/exceeds the 20000/),
    });
  });

  it("posts nothing at all when the authorisation is refused", () => {
    const record = applyRecovery(
      openComplaint(COMPLAINT),
      {
        id: "offer.1",
        complaintId: "complaint.1",
        remedy: "two free nights",
        costMinor: 90_000,
      },
      createManagerAuthority({
        repairLimitMinor: 0,
        recoveryLimitMinor: 20_000,
      }),
      "manager.1",
    );
    expect(record.status).toBe("escalated");
    expect(record.postedCostMinor).toBe(0);
    expect(record.authorisedBy).toBeNull();
  });

  it("posts exactly what was authorised when it was", () => {
    const record = applyRecovery(
      openComplaint(COMPLAINT),
      {
        id: "offer.1",
        complaintId: "complaint.1",
        remedy: "free night",
        costMinor: 15_000,
      },
      createManagerAuthority({
        repairLimitMinor: 0,
        recoveryLimitMinor: 20_000,
      }),
      "manager.1",
    );
    expect(record.status).toBe("accepted");
    expect(record.postedCostMinor).toBe(15_000);
    expect(record.authorisedBy).toBe("manager.1");
    expect(() => refuseRecovery(record)).toThrow(/already accepted/);
  });

  it("mitigates a failure but never erases it", () => {
    const damage = SEVERITY_IMPACT.serious;
    const generous = satisfactionAfterRecovery({
      before: 70,
      severity: "serious",
      // Far more than a full remedy: the ceiling still binds.
      recoveryCostMinor: 1_000_000,
      fullRemedyCostMinor: 30_000,
    });
    expect(generous.after).toBeLessThan(70);
    expect(generous.recovered).toBe(
      Math.trunc((-damage * MAX_RECOVERY_SHARE_BP) / 10_000),
    );
    expect(generous.causes[0]).toMatch(/serious failure/);

    const nothing = satisfactionAfterRecovery({
      before: 70,
      severity: "serious",
      recoveryCostMinor: 0,
      fullRemedyCostMinor: 30_000,
    });
    expect(nothing.after).toBe(70 + damage);
    expect(nothing.causes[1]).toBe("no recovery offered");
  });

  it("refuses a complaint with no cause", () => {
    expect(() => openComplaint({ ...COMPLAINT, cause: "" })).toThrow(/cause/);
  });
});
