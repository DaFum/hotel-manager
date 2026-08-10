import type { PropsWithChildren } from "react";
import { eraCapabilities, type EraAdoption } from "./era/eraCapabilities";
import { FocusManager } from "./accessibility/FocusManager";
export function ManagementShell({
  adoption,
  children,
}: PropsWithChildren<{ adoption: EraAdoption }>) {
  const capabilities = eraCapabilities(adoption);
  return (
    <div
      data-era-digital={capabilities.digitalBackOffice}
      data-era-smartphone={capabilities.smartphoneVisuals}
    >
      <a href="#management-content">Skip to management content</a>
      <nav aria-label="Management areas">
        <FocusManager labels={["Hotel", "Staff", "Finance", "Company"]} />
      </nav>
      {children}
    </div>
  );
}
