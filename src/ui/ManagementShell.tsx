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
      data-era-digital={capabilities.digitalBackOffice}
      data-era-smartphone={capabilities.smartphoneVisuals}
    >
      <a href="#management-content">
        {translateGame(locale, "management.skip")}
      </a>
      <nav aria-label={translateGame(locale, "management.areas")}>
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
