import { SPECIALIZATIONS } from "../../game/classification/specialization";

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
  onSetSpecialization: (id: string | null) => void;
}) {
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
    </section>
  );
}
