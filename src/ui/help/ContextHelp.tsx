import { translateGame, type GameLocale, type LocalizedText } from "../../i18n";

export function ContextHelp({
  title,
  drivers,
  onClose,
  locale = "en-GB",
}: {
  title: string;
  drivers: readonly LocalizedText[];
  onClose?: () => void;
  locale?: GameLocale;
}) {
  return (
    <aside aria-label={translateGame(locale, "help.region", { title })}>
      <h2>{translateGame(locale, "help.why", { title })}</h2>
      {drivers.length ? (
        <ul>
          {drivers.map((driver, i) => (
            <li key={`${i}:${driver.key}`}>
              {translateGame(locale, driver.key, driver.values)}
            </li>
          ))}
        </ul>
      ) : (
        <p>{translateGame(locale, "help.empty")}</p>
      )}
      {onClose ? (
        <button onClick={onClose}>{translateGame(locale, "help.close")}</button>
      ) : null}
    </aside>
  );
}
