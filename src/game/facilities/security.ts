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

/**
 * Understaffed security is a named cause, not a silent modifier: the player
 * has to be able to see why the alert fired.
 */
export function securityGapAlert(
  rostered: number,
  required: number,
): SecurityGap | null {
  const short = required - rostered;
  return short > 0 ? { short, cause: "event and vip load" } : null;
}
