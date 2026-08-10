import {
  normalizeAudioSettings,
  type AudioSettings as Settings,
} from "../../audio/audioEngine";
import { translateGame, type GameLocale } from "../../i18n";
const labelKeys = {
  master: "settings.audioBus.master",
  music: "settings.audioBus.music",
  ambience: "settings.audioBus.ambience",
  ui: "settings.audioBus.ui",
  warnings: "settings.audioBus.warnings",
} as const;
export function AudioSettings({
  value,
  onChange,
  locale = "en-GB",
}: {
  value: Settings;
  onChange: (value: Settings) => void;
  locale?: GameLocale;
}) {
  return (
    <fieldset>
      <legend>{translateGame(locale, "settings.audio")}</legend>
      {(Object.keys(labelKeys) as (keyof Settings)[]).map((bus) => {
        const inputId = `audio-${bus}`;
        const outputId = `${inputId}-value`;
        return (
          <div key={bus}>
            <label htmlFor={inputId}>
              {translateGame(locale, labelKeys[bus])}
            </label>{" "}
            <input
              id={inputId}
              aria-describedby={outputId}
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={value[bus]}
              onChange={(event) =>
                onChange(
                  normalizeAudioSettings({
                    ...value,
                    [bus]: +event.currentTarget.value,
                  }),
                )
              }
            />
            <output id={outputId}>{Math.round(value[bus] * 100)}%</output>
          </div>
        );
      })}
    </fieldset>
  );
}
