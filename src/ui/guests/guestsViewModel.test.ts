import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../game/simulation/initialState";
import {
  beginStay,
  createParty,
  recordStayEvent,
} from "../../game/guests/partyLifecycle";
import { openComplaint } from "../../game/guests/recoveryAuthority";
import {
  complaintRows,
  guestReputationRows,
  loyaltyRows,
  receptionQueueRows,
  repeatGuestRows,
  reviewRows,
  satisfactionSummary,
} from "./guestsViewModel";

describe("guest view model", () => {
  it("joins complaints and reviews to their stay and explains the cause", () => {
    const state = createInitialGameState(1);
    const party = createParty({
      id: "party.1",
      bookingId: "booking.1",
      segmentId: "segment.business",
      adults: 1,
      children: 0,
      budgetPerNightMinor: 10_000,
      needs: [],
      preferences: [],
      tolerance: 60,
      loyalty: 0,
    });
    const stay = recordStayEvent(
      beginStay({
        partyId: party.id,
        bookingId: party.bookingId,
        roomId: "room.101",
      }),
      { stage: "checkIn", cause: "longCheckIn", delta: -35 },
    );
    state.guestRelations = {
      ...state.guestRelations,
      parties: [party],
      stays: [stay],
    };
    state.recoveries = [
      openComplaint({
        id: "complaint.1",
        bookingId: party.bookingId,
        stage: "checkIn",
        cause: "longCheckIn",
        severity: "serious",
        raisedAtMinutes: 1,
      }),
    ];
    state.handledComplaintIds = ["complaint.1"];

    expect(complaintRows(state)[0]).toMatchObject({
      partyId: "party.1",
      roomId: "room.101",
      handled: true,
      cause: "Long check-in wait",
    });
    expect(complaintRows(state)[0].why).toMatchObject({
      key: "explanation.satisfactionDown.drivers",
    });
    expect(reviewRows(state)[0]).toMatchObject({
      partyId: "party.1",
      score: 35,
    });
  });

  it("uses explicit unknown values when a recovery outlives its stay", () => {
    const state = createInitialGameState(1);
    state.recoveries = [
      openComplaint({
        id: "complaint.old",
        bookingId: "booking.old",
        stage: "room",
        cause: "dirtyRoom",
        severity: "minor",
        raisedAtMinutes: 1,
      }),
    ];
    expect(complaintRows(state)[0]).toMatchObject({
      partyId: "guest.unknown.party",
      roomId: null,
      stayLabel: "guest.unknown.stay",
    });
  });

  it("projects ordered queues, loyalty, CRM, satisfaction and guest reputation", () => {
    const state = createInitialGameState(1);
    state.receptionQueue = [
      { bookingId: "b", waitedMinutes: 5 },
      { bookingId: "a", waitedMinutes: 25 },
    ];
    state.guestSatisfaction.causes = ["longCheckIn", "raw cause"];
    state.commercial.loyalty = {
      liabilityMinor: 800,
      members: [
        {
          guestId: "guest.1",
          tier: "silver",
          points: 10,
          qualifyingNights: 12,
        },
      ],
    };
    state.commercial.crm.profiles = [
      {
        guestId: "guest.1",
        stayHistory: ["a", "b"],
        consent: "marketing",
        preferences: [],
      },
    ];

    expect(receptionQueueRows(state).map((row) => row.bookingId)).toEqual([
      "a",
      "b",
    ]);
    expect(receptionQueueRows(state)[0].waitingTooLong).toBe(true);
    expect(loyaltyRows(state)[0].liability).toMatch(/DM/);
    expect(repeatGuestRows(state)[0].visits).toBe(2);
    expect(satisfactionSummary(state).causes).toEqual([
      "Long check-in wait",
      "raw cause",
    ]);
    expect(
      guestReputationRows(state).every((row) =>
        ["hotel", "media", "channel"].includes(row.dimension),
      ),
    ).toBe(true);
  });
});
