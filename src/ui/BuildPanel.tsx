import { RENOVATION_COST_MINOR } from "../game/building/renovations";
import { formatDm } from "./money";

export function BuildPanel(props: {
  renovationActive: boolean;
  onStartRenovation: () => void;
}) {
  return (
    <section aria-label="Build">
      <h2>Build</h2>
      <p>
        Convert the free module into two rooms for{" "}
        {formatDm(RENOVATION_COST_MINOR)}.
      </p>
      <button
        type="button"
        disabled={props.renovationActive}
        onClick={props.onStartRenovation}
      >
        Start renovation
      </button>
    </section>
  );
}
