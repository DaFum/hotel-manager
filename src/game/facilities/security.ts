/** One guard covers this many event guests. */
export const GUESTS_PER_GUARD = 150;

export function requiredSecurityStaff(i: {
  base: number;
  eventGuests: number;
  vipLevel: number;
}): number {
  return (
    Math.max(0, i.base) +
    Math.ceil(Math.max(0, i.eventGuests) / GUESTS_PER_GUARD) +
    Math.max(0, i.vipLevel)
  );
}

export interface SecurityGap {
  short: number;
  cause: string;
}

export interface SecurityRequirement {
  base: number;
  eventGuests: number;
  vipLevel: number;
}

/** Names what is actually driving the requirement, not a fixed phrase. */
function shortfallCause(load?: SecurityRequirement): string {
  if (!load) return "rostered guards below requirement";
  const drivers: string[] = [];
  if (load.eventGuests > 0) drivers.push("event load");
  if (load.vipLevel > 0) drivers.push("vip load");
  return drivers.length === 0
    ? "base cover for the house"
    : drivers.join(" and ");
}

/**
 * Understaffed security is a named cause, not a silent modifier: the player
 * has to be able to see why the alert fired. The cause follows the components
 * of the requirement, so a base-only shortfall does not blame an event.
 */
export function securityGapAlert(
  rostered: number,
  required: number,
  load?: SecurityRequirement,
): SecurityGap | null {
  const short = required - rostered;
  return short > 0 ? { short, cause: shortfallCause(load) } : null;
}
