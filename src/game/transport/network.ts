/**
 * How reachable the city is. Connectivity is the slowest-moving city driver:
 * a new runway or rail link changes the demand a city can carry for decades,
 * so route changes are explicit events rather than a drifting number.
 */
export interface TransportNetwork {
  /** Quality of long-distance rail, 0-100. */
  rail: number;
  /** Airport reach, 0-100. */
  airport: number;
  /** Motorway and road access, 0-100. */
  road: number;
  /** Local transit inside the city, 0-100. */
  local: number;
}

export type TransportMode = keyof TransportNetwork;

/** How much each mode counts toward reachability, in basis points. */
export const MODE_WEIGHT_BP: Record<TransportMode, number> = {
  rail: 3000,
  airport: 3500,
  road: 1500,
  local: 2000,
};

export const TRANSPORT_MODES: readonly TransportMode[] = [
  "rail",
  "airport",
  "road",
  "local",
];

function assertPoints(mode: TransportMode, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100)
    throw new Error(`invalid ${mode} rating`);
}

/** The weighted 0-100 index the city demand model reads. */
export function connectivityIndex(network: TransportNetwork): number {
  for (const mode of TRANSPORT_MODES) assertPoints(mode, network[mode]);
  return Math.round(
    TRANSPORT_MODES.reduce(
      (sum, mode) => sum + network[mode] * MODE_WEIGHT_BP[mode],
      0,
    ) / 10000,
  );
}

/** A route opening or closing, applied to the one mode it belongs to. */
export function applyRouteChange(
  network: TransportNetwork,
  change: { mode: TransportMode; deltaPoints: number },
): TransportNetwork {
  if (!TRANSPORT_MODES.includes(change.mode))
    throw new Error("unknown transport mode");
  if (!Number.isFinite(change.deltaPoints))
    throw new Error("invalid route change");
  return {
    ...network,
    [change.mode]: Math.max(
      0,
      Math.min(100, Math.round(network[change.mode] + change.deltaPoints)),
    ),
  };
}
