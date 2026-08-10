import type { GuestSegmentContent } from "../../../content-schema/guestSegment";
import { IdListField, NumberField, TextField } from "./fields";
export function GuestSegmentEditor({
  value,
  onChange,
}: {
  value: GuestSegmentContent;
  onChange: (value: GuestSegmentContent) => void;
}) {
  return (
    <fieldset>
      <legend>Guest segment</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <NumberField
        label="Willingness to pay (minor currency)"
        value={value.willingnessToPayMinor}
        onChange={(willingnessToPayMinor) =>
          onChange({ ...value, willingnessToPayMinor })
        }
      />
      <IdListField
        label="Preferred facilities"
        value={value.preferredFacilityIds}
        onChange={(preferredFacilityIds) =>
          onChange({ ...value, preferredFacilityIds })
        }
      />
    </fieldset>
  );
}
