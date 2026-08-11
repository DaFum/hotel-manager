import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HotelView } from "./HotelView";
import { createCamera, zoomCamera, dragCamera } from "../render/camera";
import { generateFloorPlan } from "../game/building/floorPlan";

const rooms = [
  {
    id: "room.101",
    category: "single",
    state: "VacantClean",
    cleanliness: 100,
  },
  { id: "room.102", category: "double", state: "VacantDirty", cleanliness: 40 },
];

describe("hotel view", () => {
  it("offers an accessible room inspector alongside the canvas", () => {
    render(<HotelView rooms={rooms} />);
    expect(screen.getByRole("region", { name: /hotel view/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /room\.101 single vacant clean/i }),
    ).toBeTruthy();
  });

  it("lists every room so the view is usable without the canvas", () => {
    render(<HotelView rooms={rooms} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("offers a keyboard-reachable DOM equivalent for every scene action", () => {
    const onRoom = vi.fn();
    const onFacility = vi.fn();
    render(
      <HotelView
        rooms={rooms}
        facilities={[
          {
            id: "facility.breakfast",
            name: "Breakfast room",
            demand: 30,
            capacity: 20,
            cause: "staff",
          },
        ]}
        onSelect={onRoom}
        onSelectFacility={onFacility}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /room\.101 single vacant clean/i }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Breakfast room, 30 demand, 20 capacity, limited by staff/i,
      }),
    );
    expect(onRoom).toHaveBeenCalledWith("room.101");
    expect(onFacility).toHaveBeenCalledWith("facility.breakfast");
  });

  it("shows facility selection even when no callback is supplied", () => {
    render(
      <HotelView
        rooms={rooms}
        disableRenderer
        facilities={[
          {
            id: "facility.breakfast",
            name: "Breakfast room",
            demand: 30,
            capacity: 20,
            cause: "staff",
          },
        ]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Breakfast room, 30 demand/i }),
    );
    expect(screen.getByText(/Breakfast room: 30 demand/i)).toBeTruthy();
  });

  it("only pans the camera when drag movement exceeds the threshold", () => {
    const onCamera = vi.fn();
    const onSelect = vi.fn();
    // Non-default zoom to verify scaling
    const baseCamera = zoomCamera(createCamera(), 2.0);
    render(
      <HotelView
        rooms={rooms}
        camera={baseCamera}
        onCamera={onCamera}
        onSelect={onSelect}
      />,
    );

    const canvas = screen.getByTestId("hotel-canvas");

    // Simulate pointer down
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });

    // Small movement (below 3px threshold)
    fireEvent.pointerMove(canvas, { clientX: 102, clientY: 102, pointerId: 1 });
    expect(onCamera).not.toHaveBeenCalled();

    // Exact 3px movement (at threshold)
    fireEvent.pointerMove(canvas, { clientX: 103, clientY: 103, pointerId: 1 });
    expect(onCamera).not.toHaveBeenCalled();

    // Larger movement (above 3px threshold)
    fireEvent.pointerMove(canvas, { clientX: 105, clientY: 105, pointerId: 1 });
    expect(onCamera).toHaveBeenCalledWith(
      dragCamera(baseCamera, { x: 5, y: 5 }),
    );

    // Pointer up
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Another pointer move after release
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 110, pointerId: 1 });
    expect(onCamera).toHaveBeenCalledTimes(1); // Called once from the above-threshold move, no more
  });

  it("selects a room with a non-drag pointer sequence", () => {
    const onSelect = vi.fn();
    const onCamera = vi.fn();
    render(
      <HotelView
        rooms={rooms}
        camera={createCamera()}
        onSelect={onSelect}
        onCamera={onCamera}
      />,
    );
    const canvas = screen.getByTestId("hotel-canvas");

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 101, clientY: 101, pointerId: 1 }); // Under threshold
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(onCamera).not.toHaveBeenCalled();

    // Simulate what the accessible layout would do for the same selection
    fireEvent.click(
      screen.getByRole("button", { name: /room\.101 single vacant clean/i }),
    );

    expect(onSelect).toHaveBeenCalledWith("room.101");
  });

  it("shows the guest identity and differentiated renovation phase in the inspector", () => {
    render(
      <HotelView
        rooms={[{ ...rooms[0], state: "Occupied" }]}
        disableRenderer
        locale="en-GB"
        occupantByRoomId={{
          "room.101": {
            guestId: "guest.returning.1",
            bookingId: "booking.private.42",
            rateMinor: 12_000,
            departureDateKey: "1991-01-03",
          },
        }}
        renovationPhaseByRoomId={{ "room.101": "planning" }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /room\.101 single occupied/i }),
    );

    expect(screen.getAllByText("Guest G-RETURNING-1").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("booking.private.42")).toBeNull();
    expect(screen.getAllByText("Planning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("serviceable").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planning phase").length).toBeGreaterThan(0);
  });

  it("exposes placed areas and stable navigation ids beside the canvas", () => {
    const floorPlan = generateFloorPlan(rooms);
    render(
      <HotelView
        rooms={rooms}
        disableRenderer
        floorPlan={floorPlan}
        closedNavigationIds={["navigation.floor.1.corridor"]}
      />,
    );

    fireEvent.click(screen.getByText("Building structure"));
    expect(
      screen.getByText(/facility\.kitchen: service, floor 0/i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /navigation\.floor\.1\.corridor: corridor, floor 1, closed/i,
      ),
    ).toBeTruthy();
  });
});
