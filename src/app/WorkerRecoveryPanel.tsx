export interface WorkerRecoveryPanelProps {
  message: string;
  onRecover: () => void;
}

export function WorkerRecoveryPanel({
  message,
  onRecover,
}: WorkerRecoveryPanelProps) {
  return (
    <section role="alert" aria-labelledby="simulation-error-title">
      <h2 id="simulation-error-title">Simulation error</h2>
      <p>{message}</p>
      <button type="button" onClick={onRecover}>
        Recover last save
      </button>
    </section>
  );
}
