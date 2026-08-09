export function MilestoneToast({ milestone }: { milestone: string | null }) {
  if (!milestone) return null;
  return (
    <aside role="status" aria-live="polite">
      <strong>Career milestone</strong>
      <p>{milestone}</p>
    </aside>
  );
}
