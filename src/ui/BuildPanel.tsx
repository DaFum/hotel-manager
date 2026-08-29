import { RENOVATION_COST_MINOR } from "../game/building/renovations";
import { formatDm } from "./money";
import { useLocale } from "./localeContext";
import { translateGame } from "../i18n";

export function BuildPanel(props: {
  renovationActive: boolean;
  onStartRenovation: () => void;
}) {
  const locale = useLocale();
  return (
    <section aria-label="Build">
      <h2>{translateGame(locale, "panels.build.title")}</h2>
      <p>
        {translateGame(locale, "panels.build.convert", {
          cost: formatDm(RENOVATION_COST_MINOR, locale),
        })}
      </p>
      <button
        type="button"
        disabled={props.renovationActive}
        onClick={props.onStartRenovation}
      >
        {translateGame(locale, "panels.build.start")}
      </button>
    </section>
  );
}
