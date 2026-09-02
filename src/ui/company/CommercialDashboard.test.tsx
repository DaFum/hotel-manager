import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommercialDashboard } from "./CommercialDashboard";

const EMPTY = {
  campaigns: [],
  accounts: [],
  reputation: [],
  loyaltyLiabilityMinor: 0,
  loyaltyMembers: 0,
  marketableGuests: 0,
};

const CAMPAIGN = {
  id: "campaign.spring",
  objective: "occupancy",
  channel: "print",
  targetSegmentId: "segment.business",
  budgetMinor: 400_000,
  status: "running",
  lowBasisPoints: 700,
  highBasisPoints: 1_300,
  daysUntilAttribution: 4,
};

const ACCOUNT = {
  id: "contract.hoechst",
  accountName: "Hoechst AG",
  negotiatedRateMinor: 9_000,
  expectedRoomNights: 900,
  concessions: ["breakfast", "late-checkout"],
  renewalIntent: "renewing",
  profitabilityMinor: 4_500_000,
};

describe("CommercialDashboard", () => {
  it("says plainly when nothing is being advertised or agreed", () => {
    render(<CommercialDashboard {...EMPTY} />);
    expect(screen.getByText("Nothing is being advertised.")).toBeTruthy();
    expect(
      screen.getByText("No rate has been agreed with an account."),
    ).toBeTruthy();
  });

  it("quotes a campaign as a band, never as a single promise", () => {
    render(<CommercialDashboard {...EMPTY} campaigns={[CAMPAIGN]} />);
    const text = screen.getByRole("region", { name: "Commercial" }).textContent;
    expect(text).toMatch(/expected 7.0% to 13.0% extra capture/);
  });

  it("says how long before a campaign shows in the numbers", () => {
    render(<CommercialDashboard {...EMPTY} campaigns={[CAMPAIGN]} />);
    expect(screen.getByText(/4 days before it shows/)).toBeTruthy();

    render(
      <CommercialDashboard
        {...EMPTY}
        campaigns={[{ ...CAMPAIGN, daysUntilAttribution: 0 }]}
      />,
    );
    expect(screen.getAllByText(/already showing/).length).toBeGreaterThan(0);
  });

  it("names every concession an account was given, and what it is worth", () => {
    render(<CommercialDashboard {...EMPTY} accounts={[ACCOUNT]} />);
    const text = screen.getByRole("region", { name: "Commercial" }).textContent;
    expect(text).toMatch(/Hoechst AG at (?:90,00 DM|DEM\s*90\.00) for 900 room nights/);
    expect(text).toMatch(/plus breakfast, late-checkout/);
    expect(text).toMatch(/(?:45000,00 DM|DEM\s*45,000\.00) over the year, renewing/);
  });

  it("omits the concession clause for an account that got none", () => {
    render(
      <CommercialDashboard
        {...EMPTY}
        accounts={[{ ...ACCOUNT, concessions: [] }]}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Commercial" }).textContent,
    ).not.toMatch(/plus /);
  });

  it("names what each reputation dimension affects, with its latest cause", () => {
    render(
      <CommercialDashboard
        {...EMPTY}
        reputation={[
          {
            dimension: "hotel",
            scopeId: "hotel.frankfurt.1",
            score: 62,
            effect: "guest demand for this house",
            topCause: "guest satisfaction 71 at the close",
          },
          {
            dimension: "employer",
            scopeId: "hotel.frankfurt.1",
            score: 48,
            effect: "who applies, and what they must be paid",
            topCause: null,
          },
        ]}
      />,
    );
    const text = screen.getByRole("region", { name: "Commercial" }).textContent;
    expect(text).toMatch(
      /hotel \(hotel.frankfurt.1\): 62\/100 — affects guest demand for this house; latest: guest satisfaction 71/,
    );
    // A dimension with no cause yet says nothing rather than "latest: null".
    expect(text).toMatch(
      /employer \(hotel.frankfurt.1\): 48\/100 — affects who applies/,
    );
    expect(text).not.toMatch(/latest: null/);
  });

  it("reports what loyalty owes alongside who may be contacted", () => {
    render(
      <CommercialDashboard
        {...EMPTY}
        loyaltyLiabilityMinor={128_000}
        loyaltyMembers={42}
        marketableGuests={7}
      />,
    );
    expect(screen.getByLabelText("Loyalty liability").textContent).toMatch(
      /42 members, (?:1280,00 DM|DEM\s*1,280\.00) owed in points, 7 guests who agreed to be contacted/,
    );
  });

  it("localizes rate and segmentShift objectives, directMail/travelAgent/onlineListing channels, and German reputation effects", () => {
    render(
      <CommercialDashboard
        {...EMPTY}
        campaigns={[
          {
            id: "c1",
            objective: "rate",
            channel: "directMail",
            targetSegmentId: "segment.business",
            budgetMinor: 100_000,
            status: "running",
            lowBasisPoints: 100,
            highBasisPoints: 200,
            daysUntilAttribution: 0,
          },
          {
            id: "c2",
            objective: "segmentShift",
            channel: "onlineListing",
            targetSegmentId: "segment.corporate",
            budgetMinor: 200_000,
            status: "running",
            lowBasisPoints: 300,
            highBasisPoints: 500,
            daysUntilAttribution: 0,
          },
        ]}
        reputation={[
          {
            dimension: "hotel",
            scopeId: "hotel.1",
            score: 75,
            effect: "commercial.effect.hotel",
            topCause: null,
          },
          {
            dimension: "media",
            scopeId: "hotel.1",
            score: 80,
            effect: "commercial.effect.media",
            topCause: null,
          },
        ]}
        locale="de-DE"
      />,
    );

    const regionText = screen.getByRole("region", { name: "Kommerzielle Aktivitäten" }).textContent;
    expect(regionText).toMatch(/Durchschnittsrate auf Direktwerbung/);
    expect(regionText).toMatch(/Segmentverschiebung auf Online-Verzeichnis/);
    expect(regionText).toMatch(/Hotel \(hotel\.1\): 75\/100 — wirkt auf Gästenachfrage für dieses Haus/);
    expect(regionText).toMatch(/Medien \(hotel\.1\): 80\/100 — wirkt auf Reichweite und Resonanz von Vorfällen/);
  });
});
