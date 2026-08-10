import type { AccessibilityPreferences as Preferences } from "../../game/settings/playerPreferences";
export function AccessibilityPreferences({
  value,
  onChange,
}: {
  value: Preferences;
  onChange: (value: Preferences) => void;
}) {
  return (
    <fieldset>
      <legend>Accessibility</legend>
      <label>
        Text size{" "}
        <input
          aria-label="Text size"
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
        High contrast
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.reducedMotion}
          onChange={(e) =>
            onChange({ ...value, reducedMotion: e.currentTarget.checked })
          }
        />{" "}
        Reduced motion
      </label>
    </fieldset>
  );
}
