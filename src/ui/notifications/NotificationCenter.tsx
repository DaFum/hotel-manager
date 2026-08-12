import type { NotificationPreferences } from "../../game/settings/playerPreferences";
import {
  groupNotifications,
  matchesNotificationFilters,
  type NotificationRecord,
} from "./notificationPreferences";
import { translateGame, type GameLocale } from "../../i18n";
export const severityIcon = {
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
  locale = "en-GB",
}: {
  notifications: readonly NotificationRecord[];
  preferences: NotificationPreferences;
  pauseState?: "idle" | "pending" | "accepted" | "rejected";
  onAction?: (entityId: string, notificationId: string) => void;
  onAcknowledge?: (id: string) => void;
  locale?: GameLocale;
}) {
  const visible = notifications.filter((item) =>
    matchesNotificationFilters(item, preferences),
  );
  return (
    <section aria-label={translateGame(locale, "notifications.region")}>
      <h2>{translateGame(locale, "notifications.heading")}</h2>
      <p role="status" aria-live="polite">
        {translateGame(locale, "notifications.autoPause", {
          status: translateGame(locale, `notifications.pause.${pauseState}`),
        })}
      </p>
      <div role="log" aria-live="polite" aria-relevant="additions text">
        {groupNotifications(visible, preferences.groupRepeated).map((group) => {
          const item = group.latest;
          const message = translateGame(
            locale,
            item.message.key,
            item.message.values,
          );
          return (
            <article
              key={group.groupId}
              data-severity={item.severity}
              aria-label={`${translateGame(locale, `notifications.severity.${item.severity}`)}: ${message}`}
            >
              <h3>
                <span aria-hidden="true">{severityIcon[item.severity]}</span>{" "}
                <span>
                  {translateGame(
                    locale,
                    `notifications.severity.${item.severity}`,
                  )}
                </span>
                : {message}
              </h3>
              {group.count > 1 ? (
                <p>
                  {translateGame(locale, "notifications.grouped", {
                    count: group.count,
                  })}
                </p>
              ) : null}
              {item.delegate && item.severity !== "critical" ? (
                <p>
                  {translateGame(locale, "notifications.delegated", {
                    delegate: item.delegate,
                  })}
                </p>
              ) : null}
              {item.severity === "critical" ? (
                <strong>
                  {translateGame(locale, "notifications.critical")}
                </strong>
              ) : null}
              <ul>
                {item.causes.map((cause, index) => (
                  <li key={`${index}:${cause.key}`}>
                    {translateGame(locale, cause.key, cause.values)}
                  </li>
                ))}
              </ul>
              {item.actionTarget ? (
                <button
                  type="button"
                  onClick={() =>
                    onAction?.(item.actionTarget!.entityId, item.id)
                  }
                >
                  {translateGame(
                    locale,
                    item.actionTarget.label.key,
                    item.actionTarget.label.values,
                  )}
                </button>
              ) : null}
              {!item.acknowledged ? (
                <button onClick={() => onAcknowledge?.(item.id)}>
                  {translateGame(locale, "notifications.acknowledge")}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
