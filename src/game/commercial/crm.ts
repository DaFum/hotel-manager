import { compareIds } from "../domain/ids";
import { assertCount } from "../domain/units";

/**
 * What the hotel is allowed to remember about a guest. Consent is the gate,
 * not a formality: without it the record holds what the stay needed and
 * nothing more, and marketing cannot reach the guest at all.
 */
export type ConsentScope = "none" | "service" | "marketing";

export interface GuestProfile {
  guestId: string;
  /** Preferences the guest actually stated; never inferred silently. */
  preferences: string[];
  /** Stay ids, newest last, bounded so a long campaign stays small. */
  stayHistory: string[];
  consent: ConsentScope;
}

/** How many stays a profile keeps; older ones fall off the record. */
export const STAY_HISTORY_LIMIT = 24;

export interface CrmState {
  profiles: GuestProfile[];
}

export function createCrmState(): CrmState {
  return { profiles: [] };
}

export function upsertProfile(
  state: CrmState,
  profile: GuestProfile,
): CrmState {
  const others = state.profiles.filter((p) => p.guestId !== profile.guestId);
  return {
    ...state,
    profiles: [...others, normalisedProfile(profile)].sort((a, b) =>
      compareIds(a.guestId, b.guestId),
    ),
  };
}

function normalisedProfile(profile: GuestProfile): GuestProfile {
  return {
    ...profile,
    preferences:
      profile.consent === "none" ? [] : [...profile.preferences].sort(),
    stayHistory: profile.stayHistory.slice(-STAY_HISTORY_LIMIT),
  };
}

/**
 * Records a stay. A guest who gave no consent still has their stay counted —
 * the hotel has to know who slept in the room — but nothing is kept about
 * them beyond that.
 */
export function recordStay(
  state: CrmState,
  input: { guestId: string; stayId: string },
): CrmState {
  const existing = state.profiles.find((p) => p.guestId === input.guestId);
  const profile: GuestProfile = existing ?? {
    guestId: input.guestId,
    preferences: [],
    stayHistory: [],
    consent: "none",
  };
  if (profile.stayHistory.includes(input.stayId)) return state;
  return upsertProfile(state, {
    ...profile,
    stayHistory: [...profile.stayHistory, input.stayId],
  });
}

/** Changing consent downward forgets what the new scope may not hold. */
export function setConsent(
  state: CrmState,
  guestId: string,
  consent: ConsentScope,
): CrmState {
  const profile = state.profiles.find((p) => p.guestId === guestId);
  if (!profile) throw new Error(`unknown guest ${guestId}`);
  return upsertProfile(state, { ...profile, consent });
}

export function recordPreference(
  state: CrmState,
  guestId: string,
  preference: string,
): CrmState {
  const profile = state.profiles.find((p) => p.guestId === guestId);
  if (!profile) throw new Error(`unknown guest ${guestId}`);
  if (profile.consent === "none")
    throw new Error("a guest who has not consented has no preferences stored");
  if (profile.preferences.includes(preference)) return state;
  return upsertProfile(state, {
    ...profile,
    preferences: [...profile.preferences, preference],
  });
}

/** Who marketing may actually contact; consent decides, not the mailing list. */
export function marketableGuestIds(state: CrmState): string[] {
  return state.profiles
    .filter((p) => p.consent === "marketing")
    .map((p) => p.guestId)
    .sort(compareIds);
}

/** Guests who have stayed more than once; the only repeat measure that counts. */
export function repeatGuestIds(state: CrmState, minStays = 2): string[] {
  assertCount(minStays, "minimum stays");
  return state.profiles
    .filter((p) => p.stayHistory.length >= minStays)
    .map((p) => p.guestId)
    .sort(compareIds);
}
