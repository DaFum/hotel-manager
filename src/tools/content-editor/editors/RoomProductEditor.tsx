import type { RoomProductContent } from "../../../content-schema/roomProduct";
import { NumberField, TextField } from "./fields";
export function RoomProductEditor({
  value,
  onChange,
}: {
  value: RoomProductContent;
  onChange: (value: RoomProductContent) => void;
}) {
  return (
    <fieldset>
      <legend>Room product</legend>
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
        label="Clean time (minutes)"
        value={value.cleanMinutes}
        onChange={(cleanMinutes) => onChange({ ...value, cleanMinutes })}
      />
      <NumberField
        label="Linen pieces"
        value={value.linenPieces}
        onChange={(linenPieces) => onChange({ ...value, linenPieces })}
      />
    </fieldset>
  );
}
