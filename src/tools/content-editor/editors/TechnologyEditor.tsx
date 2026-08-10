import type { TechnologyContent } from "../../../content-schema/technology";
import { IdListField, NumberField, TextField } from "./fields";
export function TechnologyEditor({
  value,
  onChange,
}: {
  value: TechnologyContent;
  onChange: (value: TechnologyContent) => void;
}) {
  return (
    <fieldset>
      <legend>Technology</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <NumberField
        label="Emergence threshold (basis points)"
        value={value.emergenceThresholdBasisPoints}
        onChange={(emergenceThresholdBasisPoints) =>
          onChange({ ...value, emergenceThresholdBasisPoints })
        }
      />
      <IdListField
        label="Prerequisites"
        value={value.prerequisiteIds}
        onChange={(prerequisiteIds) => onChange({ ...value, prerequisiteIds })}
      />
    </fieldset>
  );
}
