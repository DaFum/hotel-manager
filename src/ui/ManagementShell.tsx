import type { PropsWithChildren } from "react";
import { eraCapabilities, type EraAdoption } from "./era/eraCapabilities";
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
      {children}
    </div>
  );
}
