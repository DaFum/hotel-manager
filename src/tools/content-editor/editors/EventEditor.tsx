import type { EventContent } from "../../../content-schema/event";
import { IdListField, NumberField, TextField } from "./fields";
export function EventEditor({
  value,
  onChange,
}: {
  value: EventContent;
  onChange: (value: EventContent) => void;
}) {
  return (
    <fieldset>
      <legend>Event</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <NumberField
        label="Cooldown (months)"
        value={value.cooldownMonths}
        onChange={(cooldownMonths) => onChange({ ...value, cooldownMonths })}
      />
      <IdListField
        label="Required technologies"
        value={value.requiredTechnologyIds}
        onChange={(requiredTechnologyIds) =>
          onChange({ ...value, requiredTechnologyIds })
        }
      />
    </fieldset>
  );
}
