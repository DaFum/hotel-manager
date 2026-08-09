import { createEventJournal } from "../../domain/eventBuffer";
import { createUtilityState } from "../../facilities/utilities";
import type {
  BookingStatus,
  GuaranteeTerms,
} from "../../bookings/bookingTypes";
import {
  createGuestSatisfaction,
  createRenderDescriptors,
  createSavePolicyMetadata,
} from "../../simulation/initialState";
import type { SaveEnvelope } from "../saveVersions";
import { createWorldState } from "../../world/WorldSimulation";
import { createRevenuePolicy } from "../../revenue/revenuePolicy";

const DEFAULT_TERMS = {
  guaranteed: false,
  freeCancellationDays: 1,
  lateChargeBp: 10000,
};
const BOOKING_STATUSES: readonly BookingStatus[] = [
  "confirmed",
  "cancelled",
  "noShow",
  "checkedIn",
  "completed",
];

const positiveInteger = (value: unknown, fallback: number): number =>
  Number.isSafeInteger(value) && (value as number) > 0
    ? (value as number)
    : fallback;

function migratedTerms(value: unknown): GuaranteeTerms {
  const terms =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    guaranteed:
      typeof terms.guaranteed === "boolean"
        ? terms.guaranteed
        : DEFAULT_TERMS.guaranteed,
    freeCancellationDays:
      Number.isSafeInteger(terms.freeCancellationDays) &&
      (terms.freeCancellationDays as number) >= 0
        ? (terms.freeCancellationDays as number)
        : DEFAULT_TERMS.freeCancellationDays,
    lateChargeBp:
      Number.isSafeInteger(terms.lateChargeBp) &&
      (terms.lateChargeBp as number) >= 0 &&
      (terms.lateChargeBp as number) <= 10000
        ? (terms.lateChargeBp as number)
        : DEFAULT_TERMS.lateChargeBp,
  };
}

/** Adds the authoritative Plan 03.5 state that did not exist in save v3. */
export function migrateV3ToV4(save: SaveEnvelope): SaveEnvelope {
  const state = structuredClone((save.state ?? {}) as Record<string, unknown>);
  const rooms =
    (state.hotel as { rooms?: { id: string; category?: string }[] } | undefined)
      ?.rooms ?? [];
  const elapsedMinutes = Number.isSafeInteger(state.elapsedMinutes)
    ? (state.elapsedMinutes as number)
    : 0;
  const reservations = Array.isArray(state.reservations)
    ? state.reservations.map((raw, index) => {
        const booking = raw as Record<string, unknown>;
        const status: BookingStatus = BOOKING_STATUSES.includes(
          booking.status as BookingStatus,
        )
          ? (booking.status as BookingStatus)
          : "confirmed";
        return {
          ...booking,
          id:
            typeof booking.id === "string"
              ? booking.id
              : `booking.legacy.${index}`,
          roomsRequested: positiveInteger(booking.roomsRequested, 1),
          channel: booking.channel ?? "directPhone",
          partySize: positiveInteger(booking.partySize, 1),
          segmentId: booking.segmentId ?? "segment.leisure",
          category: booking.category ?? rooms[0]?.category ?? "single",
          arrivalDateKey: booking.arrivalDateKey ?? "1991-01-01",
          nights: positiveInteger(booking.nights, 1),
          terms: migratedTerms(booking.terms),
          history: Array.isArray(booking.history)
            ? booking.history
            : [{ status, atMinutes: elapsedMinutes }],
          bookingDateKey: booking.bookingDateKey ?? "1991-01-01",
          ratePlanId: booking.ratePlanId ?? "flexible",
          commissionBp: Number.isSafeInteger(booking.commissionBp)
            ? booking.commissionBp
            : 0,
          depositMinor: Number.isSafeInteger(booking.depositMinor)
            ? booking.depositMinor
            : 0,
          specialRequirements: Array.isArray(booking.specialRequirements)
            ? booking.specialRequirements
            : [],
        };
      })
    : [];

  return {
    ...save,
    saveVersion: 4,
    contentVersion: "plan-04-v4",
    protocolVersion: 2,
    state: {
      ...state,
      stateVersion: Number.isSafeInteger(state.stateVersion)
        ? state.stateVersion
        : 0,
      commandSequence: Number.isSafeInteger(state.commandSequence)
        ? state.commandSequence
        : 0,
      commandLog: Array.isArray(state.commandLog) ? state.commandLog : [],
      eventJournal: state.eventJournal ?? createEventJournal(),
      reservations,
      guestSatisfaction: state.guestSatisfaction ?? createGuestSatisfaction(),
      handledComplaintIds: Array.isArray(state.handledComplaintIds)
        ? state.handledComplaintIds
        : [],
      utilities: { ...createUtilityState(), ...(state.utilities as object) },
      renderDescriptors:
        state.renderDescriptors ?? createRenderDescriptors(rooms),
      savePolicy: state.savePolicy ?? createSavePolicyMetadata(),
      linen:
        state.linen && typeof state.linen === "object"
          ? { floorStock: 0, ...(state.linen as Record<string, unknown>) }
          : { clean: 0, floorStock: 0, dirty: 0 },
      world: state.world ?? createWorldState(),
      revenuePolicy: state.revenuePolicy ?? createRevenuePolicy(),
      technologyProjects: Array.isArray(state.technologyProjects)
        ? state.technologyProjects
        : [],
      technologyImplementations: Array.isArray(state.technologyImplementations)
        ? state.technologyImplementations
        : [],
    },
  };
}
