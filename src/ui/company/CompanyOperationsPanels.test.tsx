import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AcquisitionsPanel, TreasuryPanel } from "./CompanyOperationsPanels";
describe("company operations panels", () => {
  it("dispatches internal funding", () => {
    const onTransfer = vi.fn();
    render(
      <TreasuryPanel
        view={{
          hotelCount: 2,
          hqMinor: 100,
          consolidatedMinor: 300,
          accounts: [{ hotelId: "h1", balanceMinor: 200 }],
          overdrawn: [],
          exposure: { DEM: 300 },
        }}
        onTransfer={onTransfer}
      />,
    );
    fireEvent.change(screen.getByLabelText(/h1 transfer amount/i), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Fund hotel" }));
    expect(onTransfer).toHaveBeenCalledWith("h1", 500, "fund");
  });
  it("dispatches diligence and a band midpoint offer", () => {
    const onDiligence = vi.fn(),
      onAcquire = vi.fn();
    render(
      <AcquisitionsPanel
        view={[
          {
            id: "t1",
            hotelId: "h1",
            name: "Target",
            rooms: 10,
            askingPriceMinor: 1000,
            annualGopMinor: 100,
            debtAssumedMinor: 0,
            renovationNeedMinor: 0,
            hiddenFindings: [],
            status: "available",
            valuation: { enterpriseValueMinor: 1000, equityValueMinor: 1000 },
            offer: { lowMinor: 900, midMinor: 1000, highMinor: 1100 },
            report: {
              areas: [],
              findings: [],
              uncoveredAreas: ["building"],
              discoveredLiabilityMinor: 0,
              costMinor: 0,
            },
            uncovered: ["building"],
          },
        ]}
        onDiligence={onDiligence}
        onAcquire={onAcquire}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run due diligence" }));
    fireEvent.click(screen.getByRole("button", { name: "Acquire hotel" }));
    expect(onDiligence).toHaveBeenCalledWith("t1", ["building"]);
    expect(onAcquire).toHaveBeenCalledWith("t1", 1000);
  });
});
