export function ContextHelp({
  title,
  drivers,
  onClose,
}: {
  title: string;
  drivers: readonly string[];
  onClose?: () => void;
}) {
  return (
    <aside aria-label={`${title} help`}>
      <h2>{title}: Why?</h2>
      {drivers.length ? (
        <ul>
          {drivers.map((driver, i) => (
            <li key={`${i}:${driver}`}>{driver}</li>
          ))}
        </ul>
      ) : (
        <p>No contributing factors are available yet.</p>
      )}
      {onClose ? <button onClick={onClose}>Close help</button> : null}
    </aside>
  );
}
