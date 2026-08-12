import type {
  AlertSeverity,
  NotificationPreferences,
} from "../../game/settings/playerPreferences";
import { translateGame, type GameLocale } from "../../i18n";
import { severityIcon } from "./NotificationCenter";
import type { ReactNode } from "react";

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
  hotels: readonly { id: string; name: string }[];
  regions: readonly { id: string; name: string }[];
  onChange: (value: NotificationPreferences) => void;
}) {
  const locale = props.locale ?? "en-GB";
  const t = (key: string) => translateGame(locale, key);
  const checks = (
    labelKey: string,
    items: readonly string[],
    selected: readonly string[],
    update: (next: string[]) => void,
    label: (item: string) => ReactNode = (item) => item,
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
        (severity) => (
          <>
            <span aria-hidden="true">
              {severityIcon[severity as AlertSeverity]}
            </span>{" "}
            {t(`notifications.severity.${severity}`)}
          </>
        ),
      )}
      {checks(
        "notifications.filters.category",
        props.categories,
        props.value.categories,
        (categories) => props.onChange({ ...props.value, categories }),
      )}
      {checks(
        "notifications.filters.hotel",
        props.hotels.map((hotel) => hotel.id),
        props.value.hotelIds,
        (hotelIds) => props.onChange({ ...props.value, hotelIds }),
        (hotelId) =>
          props.hotels.find((hotel) => hotel.id === hotelId)?.name ?? hotelId,
      )}
      {checks(
        "notifications.filters.region",
        props.regions.map((region) => region.id),
        props.value.regionIds,
        (regionIds) => props.onChange({ ...props.value, regionIds }),
        (regionId) =>
          props.regions.find((region) => region.id === regionId)?.name ??
          regionId,
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
