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
      <label>
        Runtime ID
        <input
          aria-label="Runtime ID"
          value={value.runtimeId}
          readOnly
          title="Runtime IDs are persisted in authoritative world state and require a save-format change."
        />
      </label>
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
      <IdListField
        label="Competing standards"
        value={value.competingStandardIds}
        onChange={(competingStandardIds) =>
          onChange({ ...value, competingStandardIds })
        }
      />
      <NumberField
        label="Initial adoption (basis points)"
        value={value.initialAdoptionBasisPoints}
        onChange={(initialAdoptionBasisPoints) =>
          onChange({ ...value, initialAdoptionBasisPoints })
        }
      />
      <NumberField
        label="Implementation cost (minor currency)"
        value={value.implementationCostMinor}
        onChange={(implementationCostMinor) =>
          onChange({ ...value, implementationCostMinor })
        }
      />
    </fieldset>
  );
}
