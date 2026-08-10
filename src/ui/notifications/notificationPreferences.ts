import type {
  AlertSeverity,
  NotificationPreferences,
} from "../../game/settings/playerPreferences";
import type { LocalizedText } from "../../i18n";
export interface NotificationRecord {
  id: string;
  type: string;
  category: string;
  severity: AlertSeverity;
  gameTime: string;
  source: { companyId: string; hotelId?: string; regionId?: string };
  causes: LocalizedText[];
  delegate?: string;
  actionTarget?: { label: LocalizedText; entityId: string };
  read: boolean;
  acknowledged: boolean;
  groupId: string;
  message: LocalizedText;
}
const rank: Record<AlertSeverity, number> = {
  info: 0,
  notice: 1,
  warning: 2,
  critical: 3,
};
export function shouldPauseForAlert(
  severity: AlertSeverity,
  threshold: AlertSeverity | "never",
  type?: string,
  types: readonly string[] = [],
): boolean {
  return (
    threshold !== "never" &&
    rank[severity] >= rank[threshold] &&
    (types.length === 0 || (type !== undefined && types.includes(type)))
  );
}
export function matchesNotificationFilters(
  item: NotificationRecord,
  preferences: NotificationPreferences,
): boolean {
  return (
    (preferences.categories.length === 0 ||
      preferences.categories.includes(item.category)) &&
    (preferences.severities.length === 0 ||
      preferences.severities.includes(item.severity)) &&
    (preferences.hotelIds.length === 0 ||
      (!!item.source.hotelId &&
        preferences.hotelIds.includes(item.source.hotelId))) &&
    (preferences.regionIds.length === 0 ||
      (!!item.source.regionId &&
        preferences.regionIds.includes(item.source.regionId))) &&
    (preferences.delegated === "all" ||
      (preferences.delegated === "delegated"
        ? !!item.delegate
        : !item.delegate))
  );
}
export interface NotificationGroup {
  groupId: string;
  latest: NotificationRecord;
  count: number;
  items: NotificationRecord[];
}
export function groupNotifications(
  items: readonly NotificationRecord[],
  enabled = true,
): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  for (const item of [...items].sort((a, b) =>
    a.gameTime < b.gameTime
      ? -1
      : a.gameTime > b.gameTime
        ? 1
        : a.id < b.id
          ? -1
          : 1,
  )) {
    const key =
      enabled && item.severity !== "critical" ? item.groupId : item.id;
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
      group.count++;
      group.latest = item;
    } else
      groups.set(key, { groupId: key, latest: item, count: 1, items: [item] });
  }
  return [...groups.values()];
}
