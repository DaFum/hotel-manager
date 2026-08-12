import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuestsDashboard } from "./GuestsDashboard";

const base = {
  satisfaction: { score: 42, causes: ["Long check-in wait"] },
  complaints: [],
  reviews: [],
  reception: [],
  loyalty: [],
  repeatGuests: [],
  reputation: [],
  openComplaintId: null,
  onOpen: vi.fn(),
};

describe("GuestsDashboard", () => {
  it("renders every labelled section and plain empty state", () => {
    render(<GuestsDashboard {...base} />);
    for (const name of [
      "Guest satisfaction",
      "Complaints",
      "Guest reviews",
      "Reception queue",
      "Guest loyalty",
      "Repeat guests",
      "Guest reputation",
    ])
      expect(screen.getByRole("region", { name })).toBeTruthy();
    expect(screen.getByText("Long check-in wait")).toBeTruthy();
    expect(screen.getByText(/No complaints/)).toBeTruthy();
  });

  it("opens a complaint case and selects its room", () => {
    const onOpen = vi.fn();
    const onSelectRoom = vi.fn();
    render(
      <GuestsDashboard
        {...base}
        openComplaintId="complaint.1"
        onOpen={onOpen}
        onSelectRoom={onSelectRoom}
        complaints={[
          {
            complaintId: "complaint.1",
            partyId: "party.1",
            bookingId: "booking.1",
            roomId: "room.101",
            stayLabel: "stay booking.1",
            segment: "Business",
            stage: "front desk",
            cause: "Long check-in wait",
            why: {
              key: "explanation.satisfactionDown.drivers",
              values: { drivers: "Long check-in wait (8%)" },
            },
            status: "accepted",
            cost: "10,00 DM",
            handled: true,
          },
        ]}
      />,
    );
    expect(screen.getByText(/handled/)).toBeTruthy();
    expect(screen.getByText(/Guest satisfaction fell/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Select room/ }));
    expect(onSelectRoom).toHaveBeenCalledWith("room.101");
    fireEvent.click(screen.getByRole("button", { name: /Close case/ }));
    expect(onOpen).toHaveBeenCalledWith("complaint.1");
  });
});
