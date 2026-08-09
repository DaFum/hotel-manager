import { createEventJournal } from "../../domain/eventBuffer";
import { createUtilityState } from "../../facilities/utilities";
import type { SaveEnvelope } from "../saveVersions";

const DEFAULT_TERMS = {
  guaranteed: false,
  freeCancellationDays: 1,
  lateChargeBp: 10000,
};

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
        const status =
          typeof booking.status === "string" ? booking.status : "confirmed";
        return {
          ...booking,
          id:
            typeof booking.id === "string"
              ? booking.id
              : `booking.legacy.${index}`,
          roomsRequested: Number.isSafeInteger(booking.roomsRequested)
            ? booking.roomsRequested
            : 1,
          channel: booking.channel ?? "directPhone",
          partySize: Number.isSafeInteger(booking.partySize)
            ? booking.partySize
            : 1,
          segmentId: booking.segmentId ?? "segment.leisure",
          category: booking.category ?? rooms[0]?.category ?? "single",
          arrivalDateKey: booking.arrivalDateKey ?? "1991-01-01",
          nights: Number.isSafeInteger(booking.nights) ? booking.nights : 1,
          terms: booking.terms ?? DEFAULT_TERMS,
          history: Array.isArray(booking.history)
            ? booking.history
            : [{ status, atMinutes: elapsedMinutes }],
        };
      })
    : [];

  return {
    ...save,
    saveVersion: 4,
    contentVersion: "plans-01-03-v4",
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
      guestSatisfaction: state.guestSatisfaction ?? { score: 70, causes: [] },
      handledComplaintIds: Array.isArray(state.handledComplaintIds)
        ? state.handledComplaintIds
        : [],
      utilities: state.utilities ?? createUtilityState(),
      renderDescriptors: state.renderDescriptors ?? {
        floorByRoomId: Object.fromEntries(
          rooms.map((room, index) => [room.id, Math.floor(index / 12) + 1]),
        ),
        closedNavigationIds: [],
        elevator: {
          id: "asset.elevator",
          capacity: 6,
          queue: 0,
          travelMinutes: 2,
          failed: false,
        },
      },
      savePolicy: state.savePolicy ?? {
        lastManualSlot: null,
        recoveryGeneration: 0,
      },
    },
  };
}
