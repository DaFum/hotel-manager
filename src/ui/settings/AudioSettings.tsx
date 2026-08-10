import {
  normalizeAudioSettings,
  type AudioSettings as Settings,
} from "../../audio/audioEngine";
const labels = {
  master: "Master",
  music: "Music",
  ambience: "Ambience",
  ui: "Interface",
  warnings: "Warnings",
} as const;
export function AudioSettings({
  value,
  onChange,
}: {
  value: Settings;
  onChange: (value: Settings) => void;
}) {
  return (
    <fieldset>
      <legend>Audio</legend>
      {(Object.keys(labels) as (keyof Settings)[]).map((bus) => (
        <label key={bus}>
          {labels[bus]}{" "}
          <input
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
          <output>{Math.round(value[bus] * 100)}%</output>
        </label>
      ))}
    </fieldset>
  );
}
