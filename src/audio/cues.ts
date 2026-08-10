export interface SemanticCue {
  sound: string;
  labelKey: string;
  bus: "ui" | "warnings";
}
const cues: Record<string, SemanticCue> = {
  LIQUIDITY_CRITICAL: {
    sound: "alert-critical",
    labelKey: "alerts.liquidityCritical",
    bus: "warnings",
  },
  GUEST_CHECKIN: {
    sound: "checkin",
    labelKey: "events.guestCheckin",
    bus: "ui",
  },
};
export function cueForEvent(type: string): Omit<SemanticCue, "bus"> | null {
  const cue = cues[type];
  return cue ? { sound: cue.sound, labelKey: cue.labelKey } : null;
}
export function semanticCueForEvent(type: string): SemanticCue | null {
  return cues[type] ?? null;
}
