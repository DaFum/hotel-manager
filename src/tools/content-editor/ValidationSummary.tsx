import type { ReferenceError } from "../../game/content/validateReferences";

export function ValidationSummary({
  errors,
}: {
  errors: readonly ReferenceError[];
}) {
  return (
    <section aria-label="Content validation">
      <h2>Validation</h2>
      {errors.length === 0 ? (
        <p>No blocking errors.</p>
      ) : (
        <ul>
          {errors.map((error) => (
            <li
              key={`${error.sourceId}:${error.field}:${error.targetId}:${error.reason}`}
            >
              {error.sourceId} → {error.targetId} ({error.field}: {error.reason}
              )
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
