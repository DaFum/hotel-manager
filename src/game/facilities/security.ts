import type { LocalizedAlertCause } from "../domain/localization";

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

export interface SecurityGap extends LocalizedAlertCause {
  short: number;
}

export interface SecurityRequirement {
  base: number;
  eventGuests: number;
  vipLevel: number;
}

/**
 * Understaffed security remains explainable without putting presentation text
 * in the simulation. The key names the cause and the values retain its inputs.
 */
export function securityGapAlert(
  rostered: number,
  required: number,
  load?: SecurityRequirement,
): SecurityGap | null {
  const short = required - rostered;
  return short > 0
    ? {
        short,
        cause: "alert.security-short.cause",
        causeValues: {
          short,
          base: load?.base ?? required,
          eventGuests: load?.eventGuests ?? 0,
          vipLevel: load?.vipLevel ?? 0,
        },
      }
    : null;
}
