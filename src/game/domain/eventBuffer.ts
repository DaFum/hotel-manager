import type { DomainEvent, DomainEventPayload } from "./events";

/**
 * How many undrained events the journal holds. A consumer is expected to drain
 * every tick; the bound exists so a headless run that never drains cannot grow
 * without limit. When it is reached the oldest events are dropped, which is
 * visible in the sequence numbers rather than silent.
 */
export const PENDING_EVENT_LIMIT = 1024;

/**
 * The authoritative event journal. It lives in game state on purpose: events
 * emitted while a command is executing belong to that command's transaction,
 * so a rolled-back command takes its events down with it.
 */
export interface EventJournal {
  /** Events emitted so far; the next event takes `sequence + 1`. */
  sequence: number;
  pending: DomainEvent[];
  /** Events dropped because nobody drained in time; zero in a healthy run. */
  dropped: number;
}

export function createEventJournal(): EventJournal {
  return { sequence: 0, pending: [], dropped: 0 };
}

/**
 * Records a completed transition. `causedBy` is the command that produced it,
 * and is omitted entirely for a transition the world produced on its own.
 */
export function emitEvent(
  journal: EventJournal,
  payload: DomainEventPayload,
  context: {
    atMinutes: number;
    entities: readonly string[];
    causedBy?: string;
  },
): DomainEvent {
  journal.sequence += 1;
  const event: DomainEvent = {
    eventId: `evt.${journal.sequence}`,
    sequence: journal.sequence,
    atMinutes: context.atMinutes,
    entities: [...context.entities],
    payload,
  };
  if (context.causedBy !== undefined) event.causedBy = context.causedBy;
  journal.pending.push(event);
  if (journal.pending.length > PENDING_EVENT_LIMIT) {
    const overflow = journal.pending.length - PENDING_EVENT_LIMIT;
    journal.pending.splice(0, overflow);
    journal.dropped += overflow;
  }
  return event;
}

/** Hands the pending events to a consumer, in emission order, exactly once. */
export function drainEvents(journal: EventJournal): DomainEvent[] {
  const drained = journal.pending;
  journal.pending = [];
  return drained;
}
