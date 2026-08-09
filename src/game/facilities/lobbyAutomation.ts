import { assertBasisPoints, assertCount } from "../domain/units";

/**
 * The lobby is not one queue. Arrival, orientation, waiting, reception,
 * checkout, baggage and the concierge each generate their own load and each
 * fail in their own way, so a hotel that is short on porters has a different
 * problem from one that is short on receptionists.
 */
export const LOBBY_DEMAND_SOURCES = [
  "arrival",
  "orientation",
  "waiting",
  "reception",
  "checkout",
  "baggage",
  "concierge",
] as const;

export type LobbyDemandSource = (typeof LOBBY_DEMAND_SOURCES)[number];

export type LobbyDemand = Record<LobbyDemandSource, number>;

export function emptyLobbyDemand(): LobbyDemand {
  return {
    arrival: 0,
    orientation: 0,
    waiting: 0,
    reception: 0,
    checkout: 0,
    baggage: 0,
    concierge: 0,
  };
}

/**
 * Ways the guest can serve themselves. Each is gated on the world having
 * adopted the technology, never on the calendar, and each takes a different
 * slice of the lobby's work away — and adds its own new way to fail.
 */
export const SELF_SERVICE_OPTIONS = [
  {
    id: "self-checkin-kiosk",
    technologyId: "personal-computer",
    /** Adoption the world needs before the option can be installed at all. */
    requiredAdoptionBp: 3000,
    handles: ["reception", "checkout"] as LobbyDemandSource[],
    /** Share of that demand it can take, in basis points. */
    deflectionBp: 4000,
    failureMode: "kiosk out of order sends everybody back to the desk",
  },
  {
    id: "mobile-checkin",
    technologyId: "smartphone",
    requiredAdoptionBp: 2500,
    handles: ["arrival", "reception"] as LobbyDemandSource[],
    deflectionBp: 3500,
    failureMode:
      "guests arrive expecting a room that housekeeping has not released",
  },
  {
    id: "digital-key",
    technologyId: "smartphone",
    requiredAdoptionBp: 4000,
    handles: ["reception", "orientation"] as LobbyDemandSource[],
    deflectionBp: 3000,
    failureMode: "a flat battery leaves a guest locked out at midnight",
  },
] as const;

export type SelfServiceOption = (typeof SELF_SERVICE_OPTIONS)[number];

export function availableSelfService(
  adoption: Record<string, number>,
): SelfServiceOption[] {
  return SELF_SERVICE_OPTIONS.filter(
    (option) =>
      (adoption[option.technologyId] ?? 0) >= option.requiredAdoptionBp,
  );
}

/**
 * What the desk is actually left with. Deflection is capped well short of
 * everything: somebody always wants a person, and the ones who do are the
 * ones with a problem.
 */
export const MAX_DEFLECTION_BP = 7000;

export function deflectedDemand(
  demand: LobbyDemand,
  installed: readonly SelfServiceOption[],
): {
  demand: LobbyDemand;
  deflectedBySource: Partial<Record<LobbyDemandSource, number>>;
} {
  const next = { ...demand };
  const deflectedBySource: Partial<Record<LobbyDemandSource, number>> = {};
  for (const source of LOBBY_DEMAND_SOURCES) {
    assertCount(demand[source], `${source} demand`);
    const totalBp = installed
      .filter((option) => option.handles.includes(source))
      .reduce((sum, option) => sum + option.deflectionBp, 0);
    if (totalBp === 0) continue;
    const cappedBp = Math.min(MAX_DEFLECTION_BP, totalBp);
    assertBasisPoints(cappedBp, "deflection");
    const moved = Math.trunc((demand[source] * cappedBp) / 10_000);
    next[source] = demand[source] - moved;
    if (moved > 0) deflectedBySource[source] = moved;
  }
  return { demand: next, deflectedBySource };
}

export function totalLobbyDemand(demand: LobbyDemand): number {
  return LOBBY_DEMAND_SOURCES.reduce((sum, source) => sum + demand[source], 0);
}

/**
 * Whether the lobby copes, and which source is the binding constraint. The
 * cause is what the player acts on; the number alone tells them nothing.
 */
export function lobbyThroughput(input: {
  demand: LobbyDemand;
  receptionists: number;
  porters: number;
  partiesPerReceptionist: number;
  bagsPerPorter: number;
}): { served: number; unserved: number; cause: string } {
  assertCount(input.receptionists, "receptionists");
  assertCount(input.porters, "porters");
  const deskDemand =
    input.demand.arrival +
    input.demand.orientation +
    input.demand.waiting +
    input.demand.reception +
    input.demand.checkout +
    input.demand.concierge;
  const deskCapacity = input.receptionists * input.partiesPerReceptionist;
  const bagCapacity = input.porters * input.bagsPerPorter;

  const deskShort = Math.max(0, deskDemand - deskCapacity);
  const bagShort = Math.max(0, input.demand.baggage - bagCapacity);
  const unserved = deskShort + bagShort;
  return {
    served: totalLobbyDemand(input.demand) - unserved,
    unserved,
    cause:
      unserved === 0
        ? "lobby is coping"
        : deskShort >= bagShort
          ? `reception short by ${deskShort} parties`
          : `baggage short by ${bagShort} bags`,
  };
}

/**
 * The staffing an automated lobby actually needs. Self-service moves work
 * rather than removing it: fewer receptionists, but somebody has to keep the
 * kiosks running.
 */
export function staffingAfterAutomation(input: {
  baselineReceptionists: number;
  installed: readonly SelfServiceOption[];
}): { receptionists: number; technicians: number } {
  assertCount(input.baselineReceptionists, "baseline receptionists");
  // Automation reduces a desk; it cannot conjure one that was never staffed.
  if (input.baselineReceptionists === 0)
    return { receptionists: 0, technicians: 0 };
  if (input.installed.length === 0)
    return { receptionists: input.baselineReceptionists, technicians: 0 };
  const saved = Math.min(
    input.baselineReceptionists - 1,
    Math.trunc(input.installed.length / 2),
  );
  return {
    receptionists: Math.max(
      1,
      input.baselineReceptionists - Math.max(0, saved),
    ),
    // One technician looks after the lot; nothing runs itself.
    technicians: 1,
  };
}

/** Every way the installed automation can fail, named for the alerts panel. */
export function automationFailureModes(
  installed: readonly SelfServiceOption[],
): string[] {
  return installed.map((option) => `${option.id}: ${option.failureMode}`);
}
