import type { FacilityContent } from "../../../content-schema/facility";
import { IdListField, NumberField, TextField } from "./fields";
export function FacilityEditor({
  value,
  onChange,
}: {
  value: FacilityContent;
  onChange: (value: FacilityContent) => void;
}) {
  return (
    <fieldset>
      <legend>Facility</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <NumberField
        label="Area (square meters)"
        value={value.areaSquareMeters}
        onChange={(areaSquareMeters) =>
          onChange({ ...value, areaSquareMeters })
        }
      />
      <NumberField
        label="Capacity"
        value={value.capacity}
        onChange={(capacity) => onChange({ ...value, capacity })}
      />
      <IdListField
        label="Required technology"
        value={value.requiredTechnologyIds}
        onChange={(requiredTechnologyIds) =>
          onChange({ ...value, requiredTechnologyIds })
        }
      />
    </fieldset>
  );
}
