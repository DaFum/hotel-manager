import type { SupplierContent } from "../../../content-schema/supplier";
import { IdListField, NumberField, TextField } from "./fields";
export function SupplierEditor({
  value,
  onChange,
}: {
  value: SupplierContent;
  onChange: (value: SupplierContent) => void;
}) {
  return (
    <fieldset>
      <legend>Supplier</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      <IdListField
        label="Item IDs"
        value={value.itemIds}
        onChange={(itemIds) => onChange({ ...value, itemIds })}
      />
      <NumberField
        label="Lead time (minutes)"
        value={value.leadTimeMinutes}
        onChange={(leadTimeMinutes) => onChange({ ...value, leadTimeMinutes })}
      />
    </fieldset>
  );
}
