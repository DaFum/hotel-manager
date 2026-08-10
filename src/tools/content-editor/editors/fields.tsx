import { useEffect, useState } from "react";

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <label>
      {label}
      <input
        aria-label={label}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          if (text.trim().length === 0) return;
          const parsed = Number(text);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />
    </label>
  );
}
export function IdListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <TextField
      label={label}
      value={value.join(", ")}
      onChange={(text) =>
        onChange(
          text
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        )
      }
    />
  );
}
