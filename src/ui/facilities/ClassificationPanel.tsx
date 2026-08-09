import {
  expansionCostMinor,
  EXPANSION_SQM,
  SPECIALIZATIONS,
  type ExpandableArea,
} from "../../game/classification/specialization";
import { formatDm } from "../money";

export interface ClassificationView {
  stars: number;
  blockedBy: readonly { standard: string; actual: number; required: number }[];
}

/**
 * The rating and the profile sit together because they are the same decision:
 * what this hotel is trying to be, and what is currently stopping it.
 */
export function ClassificationPanel(props: {
  classification: ClassificationView;
  specializationId: string | null;
  investedArea: { conferenceSqm: number; wellnessSqm: number };
  onSetSpecialization: (id: string | null) => void;
  onExpand: (area: ExpandableArea) => void;
}) {
  const selected = SPECIALIZATIONS.find((s) => s.id === props.specializationId);
  const built = selected ? props.investedArea[selected.requires] : 0;
  return (
    <section aria-label="Classification">
      <h2>Classification</h2>
      <p aria-label="Star rating">{props.classification.stars} stars</p>
      {props.classification.blockedBy.length === 0 ? (
        <p>Every standard for the next band is met.</p>
      ) : (
        <ul>
          {props.classification.blockedBy.map((b) => (
            <li key={b.standard}>
              {b.standard}: {b.actual} of {b.required} required
            </li>
          ))}
        </ul>
      )}
      <label>
        Specialization
        <select
          value={props.specializationId ?? ""}
          onChange={(event) =>
            props.onSetSpecialization(event.target.value || null)
          }
        >
          <option value="">None</option>
          {SPECIALIZATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <p aria-label="Profile investment">
          {selected.name} needs {selected.thresholdSqm} m² of{" "}
          {selected.requires === "conferenceSqm" ? "conference" : "wellness"}{" "}
          space; {built} m² is built.
          {built < selected.thresholdSqm
            ? " It pays nothing until the space exists."
            : ""}
        </p>
      ) : null}
      <p>
        Build {EXPANSION_SQM} m² more for {formatDm(expansionCostMinor())}.
      </p>
      <button type="button" onClick={() => props.onExpand("conferenceSqm")}>
        Expand conference space
      </button>
      <button type="button" onClick={() => props.onExpand("wellnessSqm")}>
        Expand wellness space
      </button>
    </section>
  );
}
