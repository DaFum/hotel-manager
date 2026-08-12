import { useState, type ReactNode } from "react";
import { eraCapabilities, type EraAdoption } from "./era/eraCapabilities";
import { FocusManager } from "./accessibility/FocusManager";
import { translateGame, type GameLocale } from "../i18n";

export const AREA_ORDER = Object.freeze([
  "mainView",
  "hotel",
  "guests",
  "staff",
  "finance",
  "revenue",
  "marketing",
  "market",
  "company",
  "campaign",
] as const);

export type ManagementAreaId = (typeof AREA_ORDER)[number];

export interface ManagementArea {
  id: ManagementAreaId;
  content: ReactNode;
}

export interface ManagementShellProps {
  adoption: EraAdoption;
  areas: readonly ManagementArea[];
  title: string;
  locale?: GameLocale;
}

export function ManagementShell({
  adoption,
  areas,
  title,
  locale = "en-GB",
}: ManagementShellProps) {
  const capabilities = eraCapabilities(adoption);
  const [selected, setSelected] = useState(0);
  const orderedAreas = AREA_ORDER.map((id) =>
    areas.find((area) => area.id === id),
  ).filter((area): area is ManagementArea => area !== undefined);
  const labels = orderedAreas.map((area) =>
    translateGame(locale, `management.${area.id}`),
  );
  const activeArea = orderedAreas[selected];
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
          targets={orderedAreas.map((area) => `management-${area.id}`)}
          selected={selected}
          onSelect={setSelected}
        />
      </nav>
      <main className="hm-main" id="management-content" aria-label={title}>
        {activeArea ? (
          <section
            key={activeArea.id}
            className="hm-shell__panel"
            id={`management-${activeArea.id}`}
            role="tabpanel"
            aria-label={labels[selected]}
          >
            {activeArea.content}
          </section>
        ) : null}
      </main>
    </div>
  );
}
