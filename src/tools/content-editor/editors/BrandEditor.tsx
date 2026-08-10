import type { BrandContent } from "../../../content-schema/brand";
import { IdListField, NumberField, TextField } from "./fields";
export function BrandEditor({
  value,
  onChange,
}: {
  value: BrandContent;
  onChange: (value: BrandContent) => void;
}) {
  return (
    <fieldset>
      <legend>Brand</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <NumberField
        label="Minimum quality (basis points)"
        value={value.minimumRoomQualityBasisPoints}
        onChange={(minimumRoomQualityBasisPoints) =>
          onChange({ ...value, minimumRoomQualityBasisPoints })
        }
      />
      <IdListField
        label="Required facilities"
        value={value.requiredFacilityIds}
        onChange={(requiredFacilityIds) =>
          onChange({ ...value, requiredFacilityIds })
        }
      />
    </fieldset>
  );
}
