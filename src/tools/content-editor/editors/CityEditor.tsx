import type { CityContent } from "../../../content-schema/city";
import { NumberField, TextField } from "./fields";
export function CityEditor({
  value,
  onChange,
}: {
  value: CityContent;
  onChange: (value: CityContent) => void;
}) {
  return (
    <fieldset>
      <legend>City</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <TextField
        label="Country code"
        value={value.countryCode}
        onChange={(countryCode) => onChange({ ...value, countryCode })}
      />
      <NumberField
        label="Base demand (room nights)"
        value={value.baseDemandRoomNights}
        onChange={(baseDemandRoomNights) =>
          onChange({ ...value, baseDemandRoomNights })
        }
      />
    </fieldset>
  );
}
