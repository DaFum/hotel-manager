import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PortfolioDashboard } from "./PortfolioDashboard";
import { BrandDashboard } from "./BrandDashboard";
import { DevelopmentDashboard } from "./DevelopmentDashboard";
import { ManagerGovernancePanel } from "./ManagerGovernancePanel";

const HOTEL = {
  id: "h1",
  name: "Frankfurt Central",
  occupancyBasisPoints: 7800,
  monthlyProfitMinor: 7100000,
  warnings: 1,
  managerName: "Anna Keller",
};

describe("PortfolioDashboard", () => {
  it("shows each hotel with occupancy, profit, warning count, and manager", () => {
    render(<PortfolioDashboard hotels={[HOTEL]} onOpenHotel={() => {}} />);
    expect(screen.getByText("Frankfurt Central")).toBeTruthy();
    expect(screen.getByText(/78\.0% occupancy/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /open frankfurt central/i }),
    ).toBeTruthy();
  });

  it("names the warning count and the manager accountable for it", () => {
    render(<PortfolioDashboard hotels={[HOTEL]} onOpenHotel={() => {}} />);
    expect(screen.getByText(/1 warning - Manager: Anna Keller/)).toBeTruthy();
    // The row and the group summary both carry it: one hotel is the group.
    expect(screen.getAllByText(/71000,00 DM/)).toHaveLength(2);
  });

  it("drills down to the hotel the player asked for", () => {
    const onOpenHotel = vi.fn();
    render(
      <PortfolioDashboard
        hotels={[HOTEL, { ...HOTEL, id: "h2", name: "Munich Ost" }]}
        onOpenHotel={onOpenHotel}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /open munich ost/i }));
    expect(onOpenHotel).toHaveBeenCalledWith("h2");
  });

  it("says so plainly when the group holds nothing", () => {
    render(<PortfolioDashboard hotels={[]} onOpenHotel={() => {}} />);
    expect(screen.getByText(/holds no hotels/i)).toBeTruthy();
  });

  it("shows the flag and how the house is held", () => {
    render(
      <PortfolioDashboard
        hotels={[
          { ...HOTEL, brandName: "Rheinstern", operatingModel: "lease" },
        ]}
        onOpenHotel={() => {}}
      />,
    );
    expect(screen.getByText(/Flag: Rheinstern - held lease/)).toBeTruthy();
  });
});

describe("BrandDashboard", () => {
  it("names each failed standard rather than a compliance score", () => {
    render(
      <BrandDashboard
        brands={[
          {
            id: "brand.rheinstern",
            name: "Rheinstern",
            demandUpliftBasisPoints: 900,
            monthlyProgrammeCostMinor: 420_000,
            hotelIds: ["h1"],
          },
        ]}
        audits={[
          {
            hotelId: "h1",
            hotelName: "Frankfurt Central",
            brandId: "brand.rheinstern",
            dateKey: "1991-04-01",
            compliant: false,
            failures: ["room-quality", "facility.wellness"],
            remediationDueDateKey: "1991-05-01",
          },
        ]}
        hotels={[{ id: "h1", name: "Frankfurt Central" }]}
        onAssignBrand={() => {}}
      />,
    );
    expect(
      screen.getByText(/fails room-quality, facility.wellness/),
    ).toBeTruthy();
    expect(screen.getByText(/put right by 1991-05-01/)).toBeTruthy();
    expect(screen.getByText(/9.0% demand uplift/)).toBeTruthy();
  });

  it("flies a flag over the hotel the player chose", () => {
    const onAssignBrand = vi.fn();
    render(
      <BrandDashboard
        brands={[
          {
            id: "brand.mainblick",
            name: "Mainblick",
            demandUpliftBasisPoints: 400,
            monthlyProgrammeCostMinor: 120_000,
            hotelIds: [],
          },
        ]}
        audits={[]}
        hotels={[{ id: "h1", name: "Frankfurt Central" }]}
        onAssignBrand={onAssignBrand}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /fly mainblick over frankfurt central/i,
      }),
    );
    expect(onAssignBrand).toHaveBeenCalledWith("h1", "brand.mainblick");
  });
});

describe("DevelopmentDashboard", () => {
  const DEVELOPMENT = {
    id: "development.hanau.1",
    name: "Hanau Park",
    rooms: 60,
    investmentMinor: 4_000_000,
    downsideAnnualRoomRevenueMinor: 1_000_000,
    baseAnnualRoomRevenueMinor: 1_200_000,
    upsideAnnualRoomRevenueMinor: 1_400_000,
    returnOnCostBasisPoints: 1200,
    missing: ["inventory"] as const,
    openedDateKey: null,
  };

  it("quotes the forecast as a band and blocks opening until it is ready", () => {
    render(
      <DevelopmentDashboard
        developments={[DEVELOPMENT]}
        onCompleteTask={() => {}}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText(/Outstanding: inventory/)).toBeTruthy();
    expect(screen.getByLabelText("Hanau Park forecast").textContent).toMatch(
      /10000,00 DM to 14000,00 DM/,
    );
    expect(
      screen.getByRole("button", { name: /open hanau park/i }),
    ).toHaveProperty("disabled", true);
  });

  it("opens once nothing is outstanding", () => {
    const onOpen = vi.fn();
    render(
      <DevelopmentDashboard
        developments={[{ ...DEVELOPMENT, missing: [] }]}
        onCompleteTask={() => {}}
        onOpen={onOpen}
      />,
    );
    const button = screen.getByRole("button", { name: /open hanau park/i });
    expect(button).toHaveProperty("disabled", false);
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith("development.hanau.1");
  });

  it("signs off one checklist item at a time", () => {
    const onCompleteTask = vi.fn();
    render(
      <DevelopmentDashboard
        developments={[DEVELOPMENT]}
        onCompleteTask={onCompleteTask}
        onOpen={() => {}}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /complete inventory for hanau park/i,
      }),
    );
    expect(onCompleteTask).toHaveBeenCalledWith(
      "development.hanau.1",
      "inventory",
    );
  });
});

describe("ManagerGovernancePanel", () => {
  const MANAGER = {
    id: "manager.1",
    name: "Anna Keller",
    hotelId: "h1",
    hotelName: "Frankfurt Central",
    competence: 62,
    repairLimitMinor: 500_000,
    capexLimitMinor: 0,
    recoveryLimitMinor: 20_000,
  };

  it("shows the limits and the decisions that came back up because of them", () => {
    render(
      <ManagerGovernancePanel
        managers={[MANAGER]}
        escalations={[
          {
            id: "escalation.1",
            hotelName: "Frankfurt Central",
            managerName: "Anna Keller",
            reason: "capex of 3000000 exceeds the 0 capex limit",
            status: "open",
          },
        ]}
        onSetRepairLimit={() => {}}
        onResolve={() => {}}
      />,
    );
    expect(screen.getByText(/repairs to 5000,00 DM/)).toBeTruthy();
    expect(screen.getByText(/exceeds the 0 capex limit/)).toBeTruthy();
  });

  it("approves and refuses through separate explicit actions", () => {
    const onResolve = vi.fn();
    render(
      <ManagerGovernancePanel
        managers={[MANAGER]}
        escalations={[
          {
            id: "escalation.1",
            hotelName: "Frankfurt Central",
            managerName: "Anna Keller",
            reason: "capex of 3000000 exceeds the 0 capex limit",
            status: "open",
          },
        ]}
        onSetRepairLimit={() => {}}
        onResolve={onResolve}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^approve/i }));
    fireEvent.click(screen.getByRole("button", { name: /^refuse/i }));
    expect(onResolve).toHaveBeenNthCalledWith(1, "escalation.1", true);
    expect(onResolve).toHaveBeenNthCalledWith(2, "escalation.1", false);
  });

  it("hides resolved escalations and says the queue is empty", () => {
    render(
      <ManagerGovernancePanel
        managers={[MANAGER]}
        escalations={[
          {
            id: "escalation.1",
            hotelName: "Frankfurt Central",
            managerName: "Anna Keller",
            reason: "already answered",
            status: "approved",
          },
        ]}
        onSetRepairLimit={() => {}}
        onResolve={() => {}}
      />,
    );
    expect(screen.getByText(/Nothing has been escalated/)).toBeTruthy();
  });
});
