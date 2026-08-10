import type { NotificationPreferences } from "../../game/settings/playerPreferences";
import {
  groupNotifications,
  matchesNotificationFilters,
  type NotificationRecord,
} from "./notificationPreferences";
const severityIcon = {
  info: "ℹ",
  notice: "◆",
  warning: "⚠",
  critical: "⛔",
} as const;
export function NotificationCenter({
  notifications,
  preferences,
  pauseState = "idle",
  onAction,
  onAcknowledge,
}: {
  notifications: readonly NotificationRecord[];
  preferences: NotificationPreferences;
  pauseState?: "idle" | "pending" | "accepted" | "rejected";
  onAction?: (entityId: string) => void;
  onAcknowledge?: (id: string) => void;
}) {
  const visible = notifications.filter((item) =>
    matchesNotificationFilters(item, preferences),
  );
  return (
    <section aria-label="Notification center">
      <h2>Notifications</h2>
      <p role="status" aria-live="polite">
        Auto-pause: {pauseState}
      </p>
      <div role="log" aria-live="polite" aria-relevant="additions text">
        {groupNotifications(visible, preferences.groupRepeated).map((group) => {
          const item = group.latest;
          return (
            <article
              key={group.groupId}
              aria-label={`${item.severity}: ${item.message}`}
            >
              <h3>
                <span aria-hidden="true">{severityIcon[item.severity]}</span>{" "}
                <span>{item.severity}</span>: {item.message}
              </h3>
              {group.count > 1 ? (
                <p>{group.count} grouped notifications</p>
              ) : null}
              {item.delegate && item.severity !== "critical" ? (
                <p>Delegated to {item.delegate}</p>
              ) : null}
              {item.severity === "critical" ? (
                <strong>Immediate attention required</strong>
              ) : null}
              <ul>
                {item.causes.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
              {item.actionTarget ? (
                <button onClick={() => onAction?.(item.actionTarget!.entityId)}>
                  {item.actionTarget.label}
                </button>
              ) : null}
              {!item.acknowledged ? (
                <button onClick={() => onAcknowledge?.(item.id)}>
                  Acknowledge
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
