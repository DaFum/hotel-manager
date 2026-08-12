import type {
  AlertSeverity,
  NotificationPreferences,
} from "../../game/settings/playerPreferences";
import { translateGame, type GameLocale } from "../../i18n";
import { severityIcon } from "./NotificationCenter";

const SEVERITIES: readonly AlertSeverity[] = [
  "info",
  "notice",
  "warning",
  "critical",
];

function toggle(items: readonly string[], item: string): string[] {
  return items.includes(item)
    ? items.filter((candidate) => candidate !== item)
    : [...items, item];
}

export function NotificationFilters(props: {
  value: NotificationPreferences;
  locale?: GameLocale;
  categories: readonly string[];
  hotelIds: readonly string[];
  regionIds: readonly string[];
  onChange: (value: NotificationPreferences) => void;
}) {
  const locale = props.locale ?? "en-GB";
  const t = (key: string) => translateGame(locale, key);
  const checks = (
    labelKey: string,
    items: readonly string[],
    selected: readonly string[],
    update: (next: string[]) => void,
    label: (item: string) => string = (item) => item,
  ) => (
    <fieldset>
      <legend>{t(labelKey)}</legend>
      {items.map((item) => (
        <label key={item}>
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => update(toggle(selected, item))}
          />
          {label(item)}
        </label>
      ))}
    </fieldset>
  );
  return (
    <fieldset>
      <legend>{t("notifications.filters.legend")}</legend>
      {checks(
        "notifications.filters.severity",
        SEVERITIES,
        props.value.severities,
        (severities) =>
          props.onChange({
            ...props.value,
            severities: severities as AlertSeverity[],
          }),
        (severity) =>
          `${severityIcon[severity as AlertSeverity]} ${t(`notifications.severity.${severity}`)}`,
      )}
      {checks(
        "notifications.filters.category",
        props.categories,
        props.value.categories,
        (categories) => props.onChange({ ...props.value, categories }),
      )}
      {checks(
        "notifications.filters.hotel",
        props.hotelIds,
        props.value.hotelIds,
        (hotelIds) => props.onChange({ ...props.value, hotelIds }),
      )}
      {checks(
        "notifications.filters.region",
        props.regionIds,
        props.value.regionIds,
        (regionIds) => props.onChange({ ...props.value, regionIds }),
      )}
      <label>
        {t("notifications.filters.delegation")}
        <select
          value={props.value.delegated}
          onChange={(event) =>
            props.onChange({
              ...props.value,
              delegated: event.currentTarget
                .value as NotificationPreferences["delegated"],
            })
          }
        >
          {(["all", "mine", "delegated"] as const).map((option) => (
            <option key={option} value={option}>
              {t(`notifications.filters.delegated.${option}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("notifications.filters.autoPauseAt")}
        <select
          value={props.value.autoPauseAt}
          onChange={(event) =>
            props.onChange({
              ...props.value,
              autoPauseAt: event.currentTarget
                .value as NotificationPreferences["autoPauseAt"],
            })
          }
        >
          <option value="never">{t("notifications.filters.never")}</option>
          {SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {t(`notifications.severity.${severity}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={props.value.groupRepeated}
          onChange={(event) =>
            props.onChange({
              ...props.value,
              groupRepeated: event.currentTarget.checked,
            })
          }
        />
        {t("notifications.filters.groupRepeated")}
      </label>
    </fieldset>
  );
}
