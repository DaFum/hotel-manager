import type { GameState } from "../../game/simulation/initialState";
import { GUEST_SEGMENTS } from "../../game/content/1991/guestSegments";
import { CHECK_IN_TOLERANCE_MINUTES } from "../../game/guests/complaints";
import { reviewScore } from "../../game/guests/partyLifecycle";
import { explainCause } from "../../game/explanations/causeExplanations";
import { reputationRows } from "../company/companyViewModel";
import { formatDm } from "../money";
import {
  ENGLISH_TEXT,
  translateKey,
  type LocalizationKey,
} from "../localization";
import type {
  ComplaintRow,
  GuestReputationRow,
  LoyaltyRow,
  ReceptionRow,
  RepeatGuestRow,
  ReviewRow,
  SatisfactionRow,
} from "./GuestsDashboard";

/**
 * Presentation-only projections of the authoritative guest snapshot. The
 * dashboard takes plain rows so every join, label and explanation can be
 * tested without a simulation or hidden component logic.
 */

const UNKNOWN_STAY = "guest.unknown.stay";

function causeText(
  cause: string,
  values: Record<string, string | number> = {},
): string {
  if (!cause) return translateKey("guest.cause.unknown");
  const key = cause.startsWith("guest.cause.") ? cause : `guest.cause.${cause}`;
  return ENGLISH_TEXT[key as LocalizationKey]
    ? translateKey(key, values)
    : cause;
}

function stageText(stage: string): string {
  const key = `guest.stage.${stage}`;
  const resolved = translateKey(key);
  return resolved === key ? stage : resolved;
}

function segmentName(segmentId: string | undefined): string {
  const name = GUEST_SEGMENTS.find((segment) => segment.id === segmentId)?.name;
  return name ? translateKey(name) : translateKey("guest.unknown.segment");
}

export function satisfactionSummary(state: GameState): SatisfactionRow {
  return {
    score: state.guestSatisfaction.score,
    causes: state.guestSatisfaction.causes.map((cause) => causeText(cause)),
  };
}

export function complaintRows(state: GameState): ComplaintRow[] {
  return state.recoveries.map((recovery) => {
    // Recovery records carry the booking id; the stay is the authoritative
    // booking-to-party join and may already have aged out independently.
    const stay = state.guestRelations.stays.find(
      (candidate) => candidate.bookingId === recovery.complaint.bookingId,
    );
    const party = stay
      ? state.guestRelations.parties.find(
          (candidate) => candidate.id === stay.partyId,
        )
      : undefined;
    const drivers = (stay?.events ?? []).map((event) => ({
      factor: causeText(event.cause, event.values),
      weight: Math.abs(event.delta),
    }));
    return {
      complaintId: recovery.complaint.id,
      partyId: stay?.partyId ?? "guest.unknown.party",
      bookingId: recovery.complaint.bookingId,
      roomId: stay?.roomId ?? null,
      stayLabel: stay ? `stay ${stay.bookingId}` : UNKNOWN_STAY,
      segment: segmentName(party?.segmentId),
      stage: stageText(recovery.complaint.stage),
      cause: causeText(recovery.complaint.cause),
      why: explainCause("satisfactionDown", drivers),
      status: recovery.status,
      cost: formatDm(recovery.postedCostMinor),
      handled: state.handledComplaintIds.includes(recovery.complaint.id),
    };
  });
}

export function reviewRows(state: GameState): ReviewRow[] {
  return state.guestRelations.parties.flatMap((party) => {
    const stay = state.guestRelations.stays.find(
      (candidate) => candidate.partyId === party.id,
    );
    if (!stay) return [];
    const review = reviewScore(party, stay);
    if (!review.leaves) return [];
    const worstStage = [...stay.events]
      .filter((event) => event.delta < 0)
      .sort((a, b) => a.delta - b.delta)[0]?.stage;
    return [
      {
        partyId: party.id,
        bookingId: stay.bookingId,
        roomId: stay.roomId,
        stayLabel: stay ? `stay ${stay.bookingId}` : UNKNOWN_STAY,
        segment: segmentName(party.segmentId),
        stage: worstStage ? stageText(worstStage) : "whole stay",
        score: review.score,
        reasons: review.reasons.map((reason) => {
          const separator = reason.indexOf(": ");
          if (separator < 0) return causeText(reason);
          return `${stageText(reason.slice(0, separator))}: ${causeText(reason.slice(separator + 2))}`;
        }),
      },
    ];
  });
}

export function receptionQueueRows(state: GameState): ReceptionRow[] {
  return state.receptionQueue
    .map((waiting) => ({
      ...waiting,
      waitingTooLong: waiting.waitedMinutes > CHECK_IN_TOLERANCE_MINUTES,
    }))
    .sort(
      (a, b) =>
        b.waitedMinutes - a.waitedMinutes ||
        (a.bookingId < b.bookingId ? -1 : a.bookingId > b.bookingId ? 1 : 0),
    );
}

export function loyaltyRows(state: GameState): LoyaltyRow[] {
  const liability = formatDm(state.commercial.loyalty.liabilityMinor);
  return state.commercial.loyalty.members.map((member) => ({
    ...member,
    liability,
  }));
}

export function repeatGuestRows(state: GameState): RepeatGuestRow[] {
  return state.commercial.crm.profiles.map((profile) => ({
    guestId: profile.guestId,
    visits: profile.stayHistory.length,
    consent: profile.consent,
    preferences: profile.preferences.map((key) => translateKey(key)),
  }));
}

export function guestReputationRows(state: GameState): GuestReputationRow[] {
  return reputationRows(state)
    .filter((row) => ["hotel", "media", "channel"].includes(row.dimension))
    .map((row) => ({
      ...row,
      effect: translateKey(row.effect),
      topCause: row.topCause ? causeText(row.topCause) : null,
    }));
}
