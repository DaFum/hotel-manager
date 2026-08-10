export interface AccessibilityPreferences {
  textScale: number;
  highContrast: boolean;
  reducedMotion: boolean;
}
export interface AudioPreferences {
  master: number;
  music: number;
  ambience: number;
  ui: number;
  warnings: number;
}
export type AlertSeverity = "info" | "notice" | "warning" | "critical";
export interface NotificationPreferences {
  categories: string[];
  severities: AlertSeverity[];
  hotelIds: string[];
  regionIds: string[];
  delegated: "all" | "mine" | "delegated";
  autoPauseAt: AlertSeverity | "never";
  autoPauseTypes: string[];
  groupRepeated: boolean;
}
export interface PlayerPreferences {
  locale: "de-DE" | "en-GB";
  accessibility: AccessibilityPreferences;
  notifications: NotificationPreferences;
  audio: AudioPreferences;
  tutorialCompleted: string[];
}
export const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = {
  locale: "de-DE",
  accessibility: { textScale: 1, highContrast: false, reducedMotion: false },
  notifications: {
    categories: [],
    severities: [],
    hotelIds: [],
    regionIds: [],
    delegated: "all",
    autoPauseAt: "critical",
    autoPauseTypes: [],
    groupRepeated: true,
  },
  audio: { master: 1, music: 0.7, ambience: 0.8, ui: 0.8, warnings: 0.9 },
  tutorialCompleted: [],
};
export function normalizeAccessibilityPreferences(
  input: AccessibilityPreferences,
): AccessibilityPreferences {
  return {
    textScale: Math.max(
      0.85,
      Math.min(1.5, Number.isFinite(input.textScale) ? input.textScale : 1),
    ),
    highContrast: input.highContrast === true,
    reducedMotion: input.reducedMotion === true,
  };
}

const severity = (value: unknown): value is AlertSeverity =>
  value === "info" ||
  value === "notice" ||
  value === "warning" ||
  value === "critical";
const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is string => typeof item === "string"),
        ),
      ]
    : [];
const volume = (value: unknown, fallback: number): number =>
  Math.max(
    0,
    Math.min(
      1,
      typeof value === "number" && Number.isFinite(value) ? value : fallback,
    ),
  );

export function normalizePlayerPreferences(value: unknown): PlayerPreferences {
  const input =
    value && typeof value === "object"
      ? (value as Partial<PlayerPreferences>)
      : {};
  const accessibility =
    input.accessibility && typeof input.accessibility === "object"
      ? input.accessibility
      : DEFAULT_PLAYER_PREFERENCES.accessibility;
  const notifications =
    input.notifications && typeof input.notifications === "object"
      ? input.notifications
      : DEFAULT_PLAYER_PREFERENCES.notifications;
  const audio =
    input.audio && typeof input.audio === "object"
      ? input.audio
      : DEFAULT_PLAYER_PREFERENCES.audio;
  return {
    locale: input.locale === "en-GB" ? "en-GB" : "de-DE",
    accessibility: normalizeAccessibilityPreferences({
      textScale: accessibility.textScale,
      highContrast: accessibility.highContrast,
      reducedMotion: accessibility.reducedMotion,
    }),
    notifications: {
      categories: strings(notifications.categories),
      severities: strings(notifications.severities).filter(severity),
      hotelIds: strings(notifications.hotelIds),
      regionIds: strings(notifications.regionIds),
      delegated:
        notifications.delegated === "mine" ||
        notifications.delegated === "delegated"
          ? notifications.delegated
          : "all",
      autoPauseAt:
        notifications.autoPauseAt === "never" ||
        severity(notifications.autoPauseAt)
          ? notifications.autoPauseAt
          : "critical",
      autoPauseTypes: strings(notifications.autoPauseTypes),
      groupRepeated: notifications.groupRepeated !== false,
    },
    audio: {
      master: volume(audio.master, 1),
      music: volume(audio.music, 0.7),
      ambience: volume(audio.ambience, 0.8),
      ui: volume(audio.ui, 0.8),
      warnings: volume(audio.warnings, 0.9),
    },
    tutorialCompleted: strings(input.tutorialCompleted),
  };
}
