import { translate, translateKey } from "../localization";

/**
 * Announces a milestone once. The caller passes the milestone only while it is
 * new; a toast that never goes away would re-announce itself to a screen
 * reader on every render.
 */
export function MilestoneToast({
  milestoneId,
  onDismiss,
}: {
  milestoneId: string | null;
  onDismiss?: () => void;
}) {
  if (!milestoneId) return null;
  return (
    <aside role="status" aria-live="polite">
      <strong>{translate("milestone.title")}</strong>
      <p>{translateKey(`milestone.${milestoneId}`)}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss}>
          {translate("milestone.dismiss")}
        </button>
      )}
    </aside>
  );
}
