import { useState, type PropsWithChildren } from "react";
import { eraCapabilities, type EraAdoption } from "./era/eraCapabilities";
import { FocusManager } from "./accessibility/FocusManager";
import { translateGame, type GameLocale } from "../i18n";
export function ManagementShell({
  adoption,
  locale = "en-GB",
  children,
}: PropsWithChildren<{ adoption: EraAdoption; locale?: GameLocale }>) {
  const capabilities = eraCapabilities(adoption);
  const [selected, setSelected] = useState(0);
  const areas = ["hotel", "staff", "finance", "company"] as const;
  const labels = areas.map((area) =>
    translateGame(locale, `management.${area}`),
  );
  return (
    <div
      className="hm-shell"
      data-era-digital={capabilities.digitalBackOffice}
      data-era-smartphone={capabilities.smartphoneVisuals}
    >
      <a href="#management-content">
        {translateGame(locale, "management.skip")}
      </a>
      <nav
        className="hm-shell__nav"
        aria-label={translateGame(locale, "management.areas")}
      >
        {/* The binder spine. Decorative signage only: the departments below
            are the navigation, and this plate is hidden from the tree so it
            never becomes a second, meaningless landmark to tab past. */}
        <span className="hm-shell__plate" aria-hidden="true">
          {translateGame(locale, "management.areas")}
        </span>
        <FocusManager
          labels={labels}
          targets={areas.map((area) => `management-${area}`)}
          selected={selected}
          onSelect={setSelected}
        />
      </nav>
      {areas.map((area, index) => (
        <section
          key={area}
          className="hm-shell__panel"
          id={`management-${area}`}
          role="tabpanel"
          aria-label={labels[index]}
          hidden={selected !== index}
        >
          {index === 0 ? children : <h2>{labels[index]}</h2>}
        </section>
      ))}
    </div>
  );
}
