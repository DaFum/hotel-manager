import type { RivalContent } from "../../../content-schema/rival";
import { NumberField, TextField } from "./fields";
export function RivalEditor({
  value,
  onChange,
}: {
  value: RivalContent;
  onChange: (value: RivalContent) => void;
}) {
  return (
    <fieldset>
      <legend>Rival</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <TextField
        label="Home city ID"
        value={value.homeCityId}
        onChange={(homeCityId) => onChange({ ...value, homeCityId })}
      />
      <NumberField
        label="Risk tolerance (basis points)"
        value={value.riskToleranceBasisPoints}
        onChange={(riskToleranceBasisPoints) =>
          onChange({ ...value, riskToleranceBasisPoints })
        }
      />
    </fieldset>
  );
}
