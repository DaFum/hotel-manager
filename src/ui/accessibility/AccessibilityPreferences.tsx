import type { AccessibilityPreferences as Preferences } from "../../game/settings/playerPreferences";
import { translateGame, type GameLocale } from "../../i18n";
export function AccessibilityPreferences({
  value,
  onChange,
  locale = "en-GB",
}: {
  value: Preferences;
  onChange: (value: Preferences) => void;
  locale?: GameLocale;
}) {
  return (
    <fieldset>
      <legend>{translateGame(locale, "settings.accessibility")}</legend>
      <label>
        {translateGame(locale, "settings.textSize")}{" "}
        <input
          aria-label={translateGame(locale, "settings.textSize")}
          type="range"
          min="0.85"
          max="1.5"
          step="0.05"
          value={value.textScale}
          onChange={(e) =>
            onChange({ ...value, textScale: +e.currentTarget.value })
          }
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.highContrast}
          onChange={(e) =>
            onChange({ ...value, highContrast: e.currentTarget.checked })
          }
        />{" "}
        {translateGame(locale, "settings.highContrast")}
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.reducedMotion}
          onChange={(e) =>
            onChange({ ...value, reducedMotion: e.currentTarget.checked })
          }
        />{" "}
        {translateGame(locale, "settings.reducedMotion")}
      </label>
    </fieldset>
  );
}
