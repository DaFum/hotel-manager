import type { PropsWithChildren } from "react";
import { eraCapabilities, type EraAdoption } from "./era/eraCapabilities";
import { FocusManager } from "./accessibility/FocusManager";
import { translateGame, type GameLocale } from "../i18n";
export function ManagementShell({
  adoption,
  locale = "en-GB",
  children,
}: PropsWithChildren<{ adoption: EraAdoption; locale?: GameLocale }>) {
  const capabilities = eraCapabilities(adoption);
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
          labels={[
            translateGame(locale, "management.hotel"),
            translateGame(locale, "management.staff"),
            translateGame(locale, "management.finance"),
            translateGame(locale, "management.company"),
          ]}
        />
      </nav>
      {children}
    </div>
  );
}
