import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RevenueDashboard } from "./RevenueDashboard";

const props = {
  rates: [
    {
      dateKey: "1991-01-01",
      state: "today" as const,
      cells: [
        {
          category: "single" as const,
          key: "1991-01-01/single",
          rateMinor: 10_000,
        },
      ],
    },
  ],
  bookings: [
    {
      dateKey: "1991-01-01",
      confirmedRooms: 5,
      capacityRooms: 50,
      occupancyBasisPoints: 1_000,
      forecastLow: 7,
      forecastHigh: 12,
    },
  ],
  metrics: {
    adrMinor: 10_000,
    revParMinor: 5_000,
    occupancyBasisPoints: 5_000,
  },
  channels: [
    {
      channel: "directPhone",
      rooms: 5,
      revenueMinor: 50_000,
      roomShareBasisPoints: 10_000,
      revenueShareBasisPoints: 10_000,
      segmentLabels: ["segment.business"],
    },
  ],
  pickup: [{ dateKey: "1991-01-01", rooms: 2 }],
  ratePlans: [
    {
      id: "flexible",
      modifierBasisPoints: 10_000,
      refundable: true,
      minimumStayNights: 1,
      maximumStayNights: null,
      closedToArrival: false,
    },
  ],
  overbooking: {
    limitRooms: 1,
    dates: [
      {
        dateKey: "1991-01-01",
        confirmedRooms: 5,
        capacityRooms: 50,
        exposureRooms: 0,
      },
    ],
  },
  competition: [
    {
      id: "rival",
      name: "Rival",
      rooms: 40,
      rateMinor: 9_000,
      occupancyBasisPoints: 6_000,
      status: "operate",
    },
  ],
  occupancyDrivers: [
    { factor: "businessDemandChange", deltaBasisPoints: -1_200 },
  ],
};

describe("RevenueDashboard", () => {
  it("renders the timeline and read-only revenue sections", () => {
    render(<RevenueDashboard {...props} onSetRate={vi.fn()} />);
    expect(screen.getByRole("table", { name: /1991/ })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Channel mix" })).toBeTruthy();
    expect(screen.getByText("Business travellers")).toBeTruthy();
    expect(screen.getByText(/No date is above/)).toBeTruthy();
    expect(screen.getByText(/Business demand/)).toBeTruthy();
  });

  it("edits one date and category", () => {
    const onSetRate = vi.fn();
    render(<RevenueDashboard {...props} onSetRate={onSetRate} />);
    fireEvent.click(screen.getByRole("button", { name: /Raise Single rate/ }));
    expect(onSetRate).toHaveBeenCalledWith("1991-01-01", "single", 10_500);
  });

  it("states when timeline and supporting tables are empty", () => {
    render(
      <RevenueDashboard
        {...props}
        rates={[]}
        bookings={[]}
        channels={[]}
        ratePlans={[]}
        competition={[]}
        onSetRate={vi.fn()}
      />,
    );
    expect(screen.getByText(/No rate or booking data/)).toBeTruthy();
    expect(screen.getByText(/No confirmed bookings/)).toBeTruthy();
    expect(screen.getByText(/No rate plans/)).toBeTruthy();
  });
});
