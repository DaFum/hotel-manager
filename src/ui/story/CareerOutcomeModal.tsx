import type {
  CareerOutcomeState,
  RecoveryPath,
} from "../../game/campaign/careerOutcome";
export function CareerOutcomeModal({
  outcome,
  onRecovery,
  onRestart,
  onContinue,
}: {
  outcome: CareerOutcomeState;
  onRecovery?: (path: RecoveryPath) => void;
  onRestart?: () => void;
  onContinue?: () => void;
}) {
  if (outcome.distress === "healthy" && !outcome.careerMilestone2026)
    return null;
  return (
    <section role="dialog" aria-label="Career outcome">
      <h2>
        {outcome.careerMilestone2026
          ? "2026 career review"
          : "Company distress"}
      </h2>
      {outcome.availableRecoveryPaths.map((path) => (
        <button key={path} type="button" onClick={() => onRecovery?.(path)}>
          {path}
        </button>
      ))}
      {outcome.careerMilestone2026 && (
        <button type="button" onClick={onContinue}>
          Continue endless career
        </button>
      )}
      {outcome.ended && (
        <button type="button" onClick={onRestart}>
          Restart in 1991
        </button>
      )}
    </section>
  );
}
