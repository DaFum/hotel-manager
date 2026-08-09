import { useEffect, useRef } from "react";
import type {
  CareerOutcomeState,
  RecoveryPath,
} from "../../game/campaign/careerOutcome";
import { translate, translateKey } from "../localization";

/**
 * The two moments the career stops to ask something: the 2026 review, and a
 * position the company may not survive. It is a real dialog — it takes focus
 * when it opens and every measure on it is a command the worker decides.
 */
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
  const heading = useRef<HTMLHeadingElement>(null);
  const open = outcome.distress !== "healthy" || outcome.careerMilestone2026;
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={translate("career.outcome")}
    >
      <h2 ref={heading} tabIndex={-1}>
        {outcome.careerMilestone2026
          ? translate("career.title.review")
          : translate("career.title.distress")}
      </h2>
      {outcome.availableRecoveryPaths.map((path) => (
        <button key={path} type="button" onClick={() => onRecovery?.(path)}>
          {translateKey(`career.recovery.${path}`)}
        </button>
      ))}
      {outcome.careerMilestone2026 && !outcome.continueEndless && (
        <button type="button" onClick={onContinue}>
          {translate("career.continue")}
        </button>
      )}
      {outcome.ended && (
        <button type="button" onClick={onRestart}>
          {translate("career.restart")}
        </button>
      )}
    </section>
  );
}
